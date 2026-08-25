import type { DataSource, Filtro, FilaUnidad, ResumenAgregado } from '../source'
import type { Unidad, Indicador, PuntoSerie, Semaforo } from '../tipos'
import { UNIDADES, NIVELES, porId, hijosDe } from './unidades'
import { INDICADORES, indicadoresDe } from './catalogo'
import { generarSerie, clasificar } from './generador'

/** Memoización: la serie de un indicador se calcula una sola vez. */
const cacheSerie = new Map<string, PuntoSerie[]>()
const serieDe = (id: string): PuntoSerie[] => {
  let s = cacheSerie.get(id)
  if (!s) { s = generarSerie(id); cacheSerie.set(id, s) }
  return s
}

/** Nivel → tipo de unidad que le corresponde. */
const TIPO_POR_NIVEL: Record<number, string> = {
  1: 'organismo', 2: 'vicerrectoria', 3: 'direccion', 4: 'direccion',
  5: 'direccion', 6: 'recinto', 7: 'centro', 8: 'subcentro',
  9: 'instituto', 10: 'servicio', 11: 'facultad', 12: 'escuela',
}

const descendientes = (id: string): Unidad[] => {
  const salida: Unidad[] = []
  const pila = [id]
  while (pila.length) {
    const actual = pila.pop()!
    for (const h of hijosDe(actual)) { salida.push(h); pila.push(h.id) }
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

function filaDe(u: Unidad): FilaUnidad {
  const ind = indicadoresDe(u.id)
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

const cacheFila = new Map<string, FilaUnidad>()
const fila = (u: Unidad): FilaUnidad => {
  let f = cacheFila.get(u.id)
  if (!f) { f = filaDe(u); cacheFila.set(u.id, f) }
  return f
}

export const mockDataSource: DataSource = {
  getNiveles: () => [...NIVELES].sort((a, b) => a.orden - b.orden),

  getUnidades: () => UNIDADES,

  getAreas(nivel) {
    if (nivel === 12) return UNIDADES.filter(u => u.tipo === 'facultad')
    if (nivel === null || nivel === 2 || nivel === 11)
      return UNIDADES.filter(u => u.tipo === 'vicerrectoria')
    if (nivel !== null && [6, 7, 8].includes(nivel)) return []   // territorial: sin nivel intermedio
    // Para direcciones y organismos, el área es su unidad padre.
    const tipo = TIPO_POR_NIVEL[nivel!]
    const padres = new Set(UNIDADES.filter(u => u.tipo === tipo).map(u => u.padreId))
    return UNIDADES.filter(u => padres.has(u.id))
  },

  getUnidadesDe(nivel, areaId) {
    let lista = nivel ? UNIDADES.filter(u => u.nivel === nivel) : UNIDADES
    if (areaId) lista = lista.filter(u => u.padreId === areaId)
    return lista
  },

  getIndicadores(unidadId, f) {
    let ind: Indicador[] = indicadoresDe(unidadId)
    if (f.categoria !== 'todas') ind = ind.filter(i => i.categoria === f.categoria)
    if (f.estado !== 'todos')
      ind = ind.filter(i => serieDe(i.id).at(-1)?.semaforo === f.estado)
    return ind
  },

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

    const filas = unidades.filter(u => indicadoresDe(u.id).length).map(fila)
    const orden = [...filas].sort((a, b) => b.cumplimiento - a.cumplimiento)

    return {
      cumplimiento, semaforo: clasificar(cumplimiento),
      totalIndicadores: ind.length, porSemaforo,
      mejores: orden.slice(0, 5),
      enAlerta: orden.slice(-5).reverse(),
    }
  },

  getFilas: (f) => alcance(f).map(fila),

  getTerritoriales: () => UNIDADES.filter(u => u.coords).map(fila),
}
