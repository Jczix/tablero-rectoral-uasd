import type { Filtro, Periodo, EstadoFiltro } from '../data/source'
import type { NivelId, CategoriaIndicador } from '../data/tipos'
import { porId, ancestrosDe, NIVELES } from '../data/mock/unidades'

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

const apilar = (e: EstadoFiltros, actual: Filtro): EstadoFiltros =>
  ({ actual, historial: [...e.historial, e.actual] })

/** Reconstruye nivel y área a partir de una unidad seleccionada por clic. */
function desdeUnidad(f: Filtro, unidadId: string): Filtro {
  const u = porId(unidadId)
  if (!u) return f
  const padre = ancestrosDe(unidadId)[0]
  // Solo facultades y vicerrectorías funcionan como "área" en la cascada.
  const areaId = padre && ['facultad', 'vicerrectoria'].includes(padre.tipo)
    ? padre.id : null
  return { ...f, nivel: u.nivel, areaId, unidadId }
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
      return apilar(e, { ...f, nivel: a.valor, areaId: null, unidadId: null })
    case 'area':
      return apilar(e, { ...f, areaId: a.valor, unidadId: null })
    case 'unidad':
      return apilar(e, { ...f, unidadId: a.valor })
    case 'periodo':
      return apilar(e, { ...f, periodo: a.valor })
    case 'categoria':
      return apilar(e, { ...f, categoria: a.valor })
    case 'estado':
      return apilar(e, { ...f, estado: a.valor })
    case 'seleccionarUnidad':
      return apilar(e, desdeUnidad(f, a.valor))
    case 'quitar':
      return apilar(e, quitar(f, a.valor))
    case 'atras':
      return e.historial.length
        ? { actual: e.historial.at(-1)!, historial: e.historial.slice(0, -1) }
        : e
    case 'limpiar':
      return { actual: FILTRO_INICIAL, historial: [] }
  }
}

export interface Chip { clave: ClaveFiltro; etiqueta: string }

const ETIQUETA_PERIODO: Record<Periodo, string> = {
  mes: 'Mes actual', trimestre: 'Trimestre', semestre: 'Semestre',
  anio: 'Año', comparativo: 'Comparativo 2025 vs 2026',
}
const ETIQUETA_ESTADO: Record<EstadoFiltro, string> = {
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
