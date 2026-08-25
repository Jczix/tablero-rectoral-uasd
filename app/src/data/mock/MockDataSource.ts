import type {
  DataSource, Filtro, FilaUnidad, ResumenAgregado, SeriePeriodo,
} from '../source'
import type { Unidad, Indicador, PuntoSerie, Semaforo } from '../tipos'
import { UNIDADES, NIVELES, porId, hijosDe, puedeSerArea } from './unidades'
import { INDICADORES, indicadoresDe } from './catalogo'
import {
  generarSerie, clasificar, clasificarUnidad, porcentajeEnMeta,
  MESES_PERIODO, cumplimientoDeVentana, semaforoDeVentana,
} from './generador'

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

/**
 * Semáforo de un indicador bajo el PERÍODO vigente: con 'Mes actual' es el
 * semáforo del último punto (idéntico al comportamiento anterior); con
 * trimestre/semestre/año clasifica el cumplimiento medio de esa ventana.
 * 'comparativo' usa la ventana del año en curso (12 meses).
 */
const semaforoPeriodo = (indicadorId: string, f: Filtro): Semaforo => {
  const s = serieDe(indicadorId)
  return semaforoDeVentana(s, s.length, MESES_PERIODO[f.periodo])
}

/** Indicadores de la unidad que respetan categoría y estado del filtro vigente. */
function indicadoresFiltrados(unidadId: string, f: Filtro): Indicador[] {
  let ind = indicadoresDe(unidadId)
  if (f.categoria !== 'todas') ind = ind.filter(i => i.categoria === f.categoria)
  if (f.estado !== 'todos')
    ind = ind.filter(i => semaforoPeriodo(i.id, f) === f.estado)
  return ind
}

/**
 * Indicadores de la unidad que entran en el CÁLCULO de su desempeño: respeta
 * categoría (tiene sentido preguntar "¿qué % de mis indicadores de servicio
 * están en meta?"), pero deliberadamente IGNORA `estado`. `estado` filtra qué
 * se está *listando*, no de qué se calcula el desempeño; y "qué se está
 * listando" es distinto según la vista: en la vista de unidad son indicadores
 * (ver `indicadoresFiltrados`, que sí aplica estado), pero en la rejilla de
 * nivel son unidades — filtrar antes por estado dejaría, para cada unidad,
 * solo el subconjunto de indicadores que ya está en ese estado, y el % en
 * meta calculado sobre "solo los que están en rojo" da cero por construcción
 * para cualquier unidad. `Nivel.tsx` filtra las FILAS resultantes por su
 * propio semáforo, no los indicadores de entrada.
 */
function indicadoresParaCalculo(unidadId: string, f: Filtro): Indicador[] {
  let ind = indicadoresDe(unidadId)
  if (f.categoria !== 'todas') ind = ind.filter(i => i.categoria === f.categoria)
  return ind
}

/**
 * El desempeño de una unidad es el PORCENTAJE DE SUS INDICADORES EN META
 * (verde), no el promedio de sus cumplimientos individuales. Promediar
 * cumplimientos apiña a las 158 unidades del catálogo entre 89.5% y 106.9%
 * (nunca por debajo de ~90 ni por encima de ~107, porque cada cumplimiento
 * individual ya está centrado en 100 por construcción), y el panel
 * "Requieren atención" terminaba mostrando unidades sanas al 89-93%. Contar
 * cuántos indicadores están en meta sí separa una unidad con 15 de 20
 * indicadores sanos (75, verde) de una con 8 de 20 (40, rojo). Ver
 * `porcentajeEnMeta` y `clasificarUnidad` en `generador.ts`.
 */
function filaDe(u: Unidad, f: Filtro): FilaUnidad {
  const ind = indicadoresParaCalculo(u.id, f)
  const meses = MESES_PERIODO[f.periodo]
  const series = ind.map(i => serieDe(i.id))
  const semaforos = series.map(s => semaforoDeVentana(s, s.length, meses))
  const cumplimiento = porcentajeEnMeta(semaforos)

  const porSemaforo: Record<Semaforo, number> = { verde: 0, ambar: 0, rojo: 0 }
  for (const s of semaforos) porSemaforo[s]++

  // Minigráfico: MISMA métrica que `cumplimiento` (% de indicadores en
  // meta), mes a mes — no el promedio de cumplimiento de antes, que
  // mezclaría dos escalas distintas en el mismo componente visual. Cada
  // punto usa la ventana del período que TERMINA en ese mes (media móvil),
  // así el último punto del minigráfico siempre coincide con la cifra
  // grande que tiene encima, sea cual sea el período escogido.
  const serie = Array.from({ length: 12 }, (_, k) => {
    if (!ind.length) return 0
    const fin = 12 + k + 1
    const semaforosMes = series.map(s => semaforoDeVentana(s, fin, meses))
    return Math.round(porcentajeEnMeta(semaforosMes) * 10) / 10
  })

  return {
    unidad: u, cumplimiento, semaforo: clasificarUnidad(cumplimiento), serie,
    indicadoresEnRojo: porSemaforo.rojo,
    porSemaforo, totalIndicadores: ind.length,
  }
}

/** La caché de filas distingue categoría y período: son las dos cosas que
 *  cambian qué indicadores entran en el cálculo de cada unidad y sobre qué
 *  ventana se evalúan (`estado` no participa en `filaDe`, ver
 *  `indicadoresParaCalculo`). */
const cacheFila = new Map<string, FilaUnidad>()
const claveFila = (u: Unidad, f: Filtro): string =>
  `${u.id}::${f.categoria}::${f.periodo}`
const fila = (u: Unidad, f: Filtro): FilaUnidad => {
  const clave = claveFila(u, f)
  let fl = cacheFila.get(clave)
  if (!fl) { fl = filaDe(u, f); cacheFila.set(clave, fl) }
  return fl
}
export const mockDataSource: DataSource = {
  /**
   * Solo los niveles que hoy tienen al menos una unidad en el padrón. Los
   * niveles 9 (Institutos y centros especializados) y 10 (Servicios
   * institucionales) siguen reservados en `NIVELES` y en el documento de
   * diseño, pero ninguna unidad los declara todavía: ofrecerlos en el
   * desplegable llevaba a una pantalla vacía con "0 unidades", y son
   * justamente las dos últimas opciones de la lista, donde va el dedo de
   * quien explora. La exclusión es general —se calcula del padrón, no de
   * una lista fija— para que reaparezcan solos el día que se levante su
   * catálogo, sin tocar este código.
   */
  getNiveles: () => {
    const conUnidades = new Set(UNIDADES.map(u => u.nivel))
    return NIVELES.filter(n => conUnidades.has(n.id))
      .sort((a, b) => a.orden - b.orden)
  },

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
    const meses = MESES_PERIODO[f.periodo]
    let ind = INDICADORES.filter(i => ids.has(i.unidadId))
    if (f.categoria !== 'todas') ind = ind.filter(i => i.categoria === f.categoria)

    // El agregado respeta el ESTADO del filtro. Antes no lo hacía y la
    // portada quedaba literalmente idéntica con "Estado = Incumplido",
    // incluidos los "3,160 indicadores" del KPI de POA: el filtro parecía
    // inerte. Ahora `totalIndicadores` cuenta los indicadores que están en
    // el estado escogido, que es lo que el desplegable promete.
    if (f.estado !== 'todos')
      ind = ind.filter(i => semaforoPeriodo(i.id, f) === f.estado)

    const porSemaforo: Record<Semaforo, number> = { verde: 0, ambar: 0, rojo: 0 }
    let suma = 0
    for (const i of ind) {
      const s = serieDe(i.id)
      suma += cumplimientoDeVentana(s, s.length, meses)
      porSemaforo[semaforoDeVentana(s, s.length, meses)]++
    }
    const cumplimiento = ind.length ? suma / ind.length : 0

    const todasLasFilas = unidades
      .filter(u => indicadoresDe(u.id).length).map(u => fila(u, f))
    // Los rankings se recortan al estado escogido con la misma semántica que
    // la rejilla de Nivel: el estado filtra QUÉ UNIDADES SE LISTAN, y cada
    // una conserva su % en meta real (calculado sobre todos sus indicadores,
    // no sobre el subconjunto ya filtrado, que daría 0.0% por construcción).
    const filas = f.estado === 'todos'
      ? todasLasFilas : todasLasFilas.filter(x => x.semaforo === f.estado)
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

  /**
   * La red territorial se calcula con el MISMO filtro vigente que el resto
   * de la pantalla. Antes usaba `SIN_FILTRO`, así que con "Tipo de
   * indicador = Proceso" la portada mostraba a la vez "Verón Punta Cana
   * 40.0% en meta" en el ranking y "55.0% de sus indicadores en meta" en su
   * punto del mapa: la misma unidad con dos cifras distintas en la misma
   * pantalla. `estado` no recorta esta lista (el mapa dibuja siempre la red
   * completa; atenuar u ocultar puntos dejaría un mapa mutilado), pero sí
   * entra en el cálculo por la vía normal de `filaDe`.
   */
  getTerritoriales: (f) => UNIDADES.filter(u => u.coords).map(u => fila(u, f)),

  getSeriePeriodo(indicadorId, f): SeriePeriodo {
    const s = serieDe(indicadorId)
    if (f.periodo === 'comparativo') {
      // Dos ventanas de 12 meses superpuestas: el año en curso y el
      // inmediatamente anterior. Las cifras agregadas del tablero usan solo
      // la primera (ver MESES_PERIODO), que es lo honesto: comparar dos
      // años en un número único obligaría a inventar una síntesis.
      return { serie: s.slice(-12), previa: s.slice(-24, -12) }
    }
    // 'Mes actual' no define ninguna ventana de agregación, así que el
    // diálogo conserva el histórico completo de 24 meses como contexto; el
    // resto de períodos hace zoom sobre su propia ventana.
    if (f.periodo === 'mes') return { serie: s }
    return { serie: s.slice(-MESES_PERIODO[f.periodo]) }
  },
}
