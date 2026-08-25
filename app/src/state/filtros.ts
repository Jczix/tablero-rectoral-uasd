import type { Filtro, Periodo, EstadoFiltro } from '../data/source'
import type { NivelId, CategoriaIndicador } from '../data/tipos'
import { porId, ancestrosDe, NIVELES, puedeSerArea } from '../data/mock/unidades'

export const FILTRO_INICIAL: Filtro = {
  nivel: null, areaId: null, unidadId: null,
  periodo: 'mes', categoria: 'todas', estado: 'todos',
}

export interface EstadoFiltros { actual: Filtro; historial: Filtro[] }

export type ClaveFiltro = 'nivel' | 'area' | 'unidad' | 'periodo' | 'categoria' | 'estado'

export type Accion =
  | { tipo: 'nivel'; valor: NivelId | null }
  | { tipo: 'area'; valor: string | null }
  | { tipo: 'unidad'; valor: string | null }
  | { tipo: 'periodo'; valor: Periodo }
  | { tipo: 'categoria'; valor: CategoriaIndicador | 'todas' }
  | { tipo: 'estado'; valor: EstadoFiltro }
  | { tipo: 'seleccionarUnidad'; valor: string }
  | { tipo: 'quitar'; valor: ClaveFiltro }
  | { tipo: 'atras' }
  | { tipo: 'limpiar' }
  | { tipo: 'kiosco'; accion: Accion }

/** Tope del historial: el tablero corre en modo kiosco durante días sin
 * recargar, así que el historial no puede crecer sin límite. */
export const MAXIMO_HISTORIAL = 50

const igualFiltro = (a: Filtro, b: Filtro): boolean =>
  a.nivel === b.nivel && a.areaId === b.areaId && a.unidadId === b.unidadId &&
  a.periodo === b.periodo && a.categoria === b.categoria && a.estado === b.estado

const apilar = (e: EstadoFiltros, actual: Filtro): EstadoFiltros => {
  const historial = [...e.historial, e.actual]
  return {
    actual,
    historial: historial.length > MAXIMO_HISTORIAL
      ? historial.slice(-MAXIMO_HISTORIAL) : historial,
  }
}

/** Aplica el filtro resultante, pero solo si cambió algo: una acción que no
 * altera el estado (id inexistente, valor inválido) no debe apilar una
 * entrada fantasma en el historial. */
const aplicar = (e: EstadoFiltros, nuevo: Filtro): EstadoFiltros =>
  igualFiltro(e.actual, nuevo) ? e : apilar(e, nuevo)

/** Reconstruye nivel y área a partir de una unidad seleccionada por clic (o
 * asignada por el desplegable de unidad, que reutiliza esta misma lógica
 * para no quedar en una combinación nivel/área/unidad incoherente). */
function desdeUnidad(f: Filtro, unidadId: string): Filtro {
  const u = porId(unidadId)
  if (!u) return f
  const padre = ancestrosDe(unidadId)[0]
  // Solo facultades y vicerrectorías funcionan como "área" en la cascada.
  const areaId = padre && ['facultad', 'vicerrectoria'].includes(padre.tipo)
    ? padre.id : null
  return { ...f, nivel: u.nivel, areaId, unidadId }
}

/** El desplegable de área solo puede apuntar a un id que exista y tenga
 * unidades hijas (`puedeSerArea`): cualquier otro (inexistente, o una hoja
 * sin descendencia) se ignora en vez de dejar el filtro en una combinación
 * que no resuelve nada. La regla es la misma que usa `getAreas` en
 * `MockDataSource` para ofrecer las opciones, así ambas piezas no pueden
 * volver a divergir: antes esta función solo aceptaba tipo 'facultad' o
 * 'vicerrectoria', lo que rechazaba 'rectoria' aunque `getAreas` sí la
 * ofreciera para el nivel 1 (Rectoría y organismos de apoyo). */
function conArea(f: Filtro, areaId: string | null): Filtro {
  if (areaId === null) return { ...f, areaId: null, unidadId: null }
  if (!puedeSerArea(areaId)) return f
  return { ...f, areaId, unidadId: null }
}

/** La unidad del desplegable debe seguir siendo consistente con nivel y
 * área: se reutiliza `desdeUnidad` para recalcular ambos en vez de asignar
 * la unidad a ciegas. */
function conUnidad(f: Filtro, unidadId: string | null): Filtro {
  if (unidadId === null) return { ...f, unidadId: null }
  return desdeUnidad(f, unidadId)
}

function quitar(f: Filtro, clave: ClaveFiltro): Filtro {
  switch (clave) {
    case 'nivel':     return { ...f, nivel: null, areaId: null, unidadId: null }
    case 'area':      return { ...f, areaId: null, unidadId: null }
    case 'unidad':    return { ...f, unidadId: null }
    case 'periodo':   return { ...f, periodo: 'mes' }
    case 'categoria': return { ...f, categoria: 'todas' }
    case 'estado':    return { ...f, estado: 'todos' }
  }
}

export function reducir(e: EstadoFiltros, a: Accion): EstadoFiltros {
  const f = e.actual
  switch (a.tipo) {
    case 'nivel':
      return aplicar(e, { ...f, nivel: a.valor, areaId: null, unidadId: null })
    case 'area':
      return aplicar(e, conArea(f, a.valor))
    case 'unidad':
      return aplicar(e, conUnidad(f, a.valor))
    case 'periodo':
      return aplicar(e, { ...f, periodo: a.valor })
    case 'categoria':
      return aplicar(e, { ...f, categoria: a.valor })
    case 'estado':
      return aplicar(e, { ...f, estado: a.valor })
    case 'seleccionarUnidad':
      return aplicar(e, desdeUnidad(f, a.valor))
    case 'quitar':
      return aplicar(e, quitar(f, a.valor))
    case 'atras':
      return e.historial.length
        ? { actual: e.historial.at(-1)!, historial: e.historial.slice(0, -1) }
        : e
    case 'limpiar':
      return { actual: FILTRO_INICIAL, historial: [] }
    case 'kiosco': {
      // Una parada automática del ciclo del rotador no es una acción de
      // la persona que opera el tablero: se resuelve con la misma lógica
      // que su acción envuelta (para no duplicarla ni dejarla incoherente
      // con nivel/área/unidad), pero el historial de "Atrás" se conserva
      // tal cual estaba, así que esas paradas nunca quedan apiladas ahí.
      const siguiente = reducir(e, a.accion)
      return { actual: siguiente.actual, historial: e.historial }
    }
  }
}

export interface Chip { clave: ClaveFiltro; etiqueta: string }

const ETIQUETA_PERIODO: Record<Periodo, string> = {
  mes: 'Mes actual', trimestre: 'Trimestre', semestre: 'Semestre',
  anio: 'Año', comparativo: 'Comparativo 2025 vs 2026',
}
export const ETIQUETA_ESTADO: Record<EstadoFiltro, string> = {
  todos: 'Todos', verde: 'En meta', ambar: 'En riesgo', rojo: 'Incumplido',
}

export function chipsDe(f: Filtro): Chip[] {
  const chips: Chip[] = []
  if (f.nivel !== null) {
    const n = NIVELES.find(x => x.id === f.nivel)
    if (n) chips.push({ clave: 'nivel', etiqueta: n.nombre })
  }
  if (f.areaId) {
    const a = porId(f.areaId)
    if (a) chips.push({ clave: 'area', etiqueta: a.nombre })
  }
  if (f.unidadId) {
    const u = porId(f.unidadId)
    if (u) chips.push({ clave: 'unidad', etiqueta: u.nombre })
  }
  if (f.periodo !== 'mes')
    chips.push({ clave: 'periodo', etiqueta: ETIQUETA_PERIODO[f.periodo] })
  if (f.categoria !== 'todas')
    chips.push({
      clave: 'categoria',
      etiqueta: f.categoria === 'servicio'
        ? 'Indicadores de Servicio' : 'Indicadores de Proceso',
    })
  if (f.estado !== 'todos')
    chips.push({ clave: 'estado', etiqueta: ETIQUETA_ESTADO[f.estado] })
  return chips
}
