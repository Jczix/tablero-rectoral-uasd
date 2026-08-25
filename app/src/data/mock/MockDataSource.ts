import type { DataSource, Filtro, FilaUnidad, ResumenAgregado } from '../source'
import type { Unidad, Indicador, PuntoSerie, Semaforo } from '../tipos'
import { UNIDADES, NIVELES, porId, hijosDe, puedeSerArea } from './unidades'
import { INDICADORES, indicadoresDe } from './catalogo'
import { generarSerie, clasificar } from './generador'

/** Memoización: la serie de un indicador se calcula una sola vez. */
const cacheSerie = new Map<string, PuntoSerie[]>()
const serieDe = (id: string): PuntoSerie[] => {
  let s = cacheSerie.get(id)
  if (!s) { s = generarSerie(id); cacheSerie.set(id, s) }
  return s
}

const descendientes = (id: string): Unidad[] => {
  const salida: Unidad[] = []
  const visitados = new Set<string>([id])
  const pila = [id]
  while (pila.length) {
    const actual = pila.pop()!
    for (const h of hijosDe(actual)) {
      if (visitados.has(h.id)) continue   // evita colgarse ante un ciclo en padreId
      visitados.add(h.id)
      salida.push(h)
      pila.push(h.id)
    }
  }
  return salida
}

/** Unidades sobre las que opera el filtro actual. */
function alcance(f: Filtro): Unidad[] {
  if (f.unidadId) {
    const u = porId(f.unidadId)
    return u ? [u, ...descendientes(u.id)] : []
  }
  if (f.areaId) {
    const a = porId(f.areaId)
    return a ? [a, ...descendientes(a.id)] : []
  }
  if (f.nivel) return UNIDADES.filter(u => u.nivel === f.nivel)
  return UNIDADES
}

/** Indicadores de la unidad que respetan categoría y estado del filtro vigente. */
function indicadoresFiltrados(unidadId: string, f: Filtro): Indicador[] {
  let ind = indicadoresDe(unidadId)
  if (f.categoria !== 'todas') ind = ind.filter(i => i.categoria === f.categoria)
  if (f.estado !== 'todos')
    ind = ind.filter(i => serieDe(i.id).at(-1)?.semaforo === f.estado)
  return ind
}

function filaDe(u: Unidad, f: Filtro): FilaUnidad {
  const ind = indicadoresFiltrados(u.id, f)
  const ultimos = ind.map(i => serieDe(i.id).at(-1)!)
  const cumplimiento = ind.length
    ? ultimos.reduce((a, p) => a + p.cumplimiento, 0) / ind.length : 0
  // Minigráfico: cumplimiento promedio de la unidad en los últimos 12 meses.
  const serie = Array.from({ length: 12 }, (_, k) => {
    const idx = 12 + k
    const suma = ind.reduce((a, i) => a + (serieDe(i.id)[idx]?.cumplimiento ?? 0), 0)
    return Math.round((suma / Math.max(ind.length, 1)) * 10) / 10
  })
  return {
    unidad: u, cumplimiento, semaforo: clasificar(cumplimiento), serie,
    indicadoresEnRojo: ultimos.filter(p => p.semaforo === 'rojo').length,
  }
}

/** La caché de filas debe distinguir el filtro vigente: categoría y estado
 *  cambian qué indicadores entran en el cálculo de cada unidad. */
const cacheFila = new Map<string, FilaUnidad>()
const claveFila = (u: Unidad, f: Filtro): string => `${u.id}::${f.categoria}::${f.estado}`
const fila = (u: Unidad, f: Filtro): FilaUnidad => {
  const clave = claveFila(u, f)
  let fl = cacheFila.get(clave)
  if (!fl) { fl = filaDe(u, f); cacheFila.set(clave, fl) }
  return fl
}
/** Filtro neutro para llamadas que no traen uno explícito (p. ej. la red territorial). */
const SIN_FILTRO: Filtro = {
  nivel: null, areaId: null, unidadId: null,
  periodo: 'mes', categoria: 'todas', estado: 'todos',
}

export const mockDataSource: DataSource = {
  getNiveles: () => [...NIVELES].sort((a, b) => a.orden - b.orden),

  getUnidades: () => UNIDADES,

  getAreas(nivel) {
    // Cada opción devuelta debe ser aceptada de verdad por `conArea` en
    // state/filtros.ts: `puedeSerArea` es la misma regla ahí y aquí, así
    // esta función no puede volver a ofrecer un id que el reductor rechace.
    if (nivel === 12)
      return UNIDADES.filter(u => u.tipo === 'facultad' && puedeSerArea(u.id))
    if (nivel === null || nivel === 2 || nivel === 11)
      return UNIDADES.filter(u => u.tipo === 'vicerrectoria' && puedeSerArea(u.id))
    if ([6, 7, 8].includes(nivel)) return []   // territorial: sin nivel intermedio
    // El área es la unidad padre de las unidades de este nivel. Se deriva por
    // `nivel`, no por `tipo`: niveles 3, 4 y 5 comparten tipo 'direccion' pero
    // corresponden a familias de padres distintas (direcciones especializadas,
    // Investigación y Postgrado, Extensión).
    const padres = new Set(UNIDADES.filter(u => u.nivel === nivel).map(u => u.padreId))
    return UNIDADES.filter(u => padres.has(u.id) && puedeSerArea(u.id))
  },

  getUnidadesDe(nivel, areaId) {
    let lista = nivel ? UNIDADES.filter(u => u.nivel === nivel) : UNIDADES
    if (areaId) lista = lista.filter(u => u.padreId === areaId)
    return lista
  },

  getIndicadores: (unidadId, f) => indicadoresFiltrados(unidadId, f),

  getSerie: serieDe,
  getUltimo: (id) => serieDe(id).at(-1),

  getResumen(f): ResumenAgregado {
    const unidades = alcance(f)
    const ids = new Set(unidades.map(u => u.id))
    let ind = INDICADORES.filter(i => ids.has(i.unidadId))
    if (f.categoria !== 'todas') ind = ind.filter(i => i.categoria === f.categoria)

    const ultimos = ind.map(i => serieDe(i.id).at(-1)!)
    const porSemaforo: Record<Semaforo, number> = { verde: 0, ambar: 0, rojo: 0 }
    for (const p of ultimos) porSemaforo[p.semaforo]++

    const cumplimiento = ultimos.length
      ? ultimos.reduce((a, p) => a + p.cumplimiento, 0) / ultimos.length : 0

    const filas = unidades.filter(u => indicadoresDe(u.id).length).map(u => fila(u, f))
    const orden = [...filas].sort((a, b) => b.cumplimiento - a.cumplimiento)

    // `mejores` y `enAlerta` nunca deben solaparse. Con 10 unidades o más, los
    // primeros/últimos 5 ya son disjuntos. Con menos, se reparte por la mitad;
    // con menos de 2 unidades no hay "alerta" que mostrar por separado.
    const n = orden.length
    let mejores: FilaUnidad[]
    let enAlerta: FilaUnidad[]
    if (n < 2) {
      mejores = orden.slice(0, 5)
      enAlerta = []
    } else if (n < 10) {
      const mitad = Math.ceil(n / 2)
      mejores = orden.slice(0, mitad)
      enAlerta = orden.slice(mitad).reverse()
    } else {
      mejores = orden.slice(0, 5)
      enAlerta = orden.slice(-5).reverse()
    }

    return {
      cumplimiento, semaforo: clasificar(cumplimiento),
      totalIndicadores: ind.length, porSemaforo,
      mejores, enAlerta,
    }
  },

  getFilas: (f) => alcance(f).map(u => fila(u, f)),

  getTerritoriales: () => UNIDADES.filter(u => u.coords).map(u => fila(u, SIN_FILTRO)),
}
