import type {
  Unidad, Indicador, PuntoSerie, NivelId, NivelInfo,
  CategoriaIndicador, Semaforo,
} from './tipos'

export type Periodo = 'mes' | 'trimestre' | 'semestre' | 'anio' | 'comparativo'
export type EstadoFiltro = 'todos' | 'verde' | 'ambar' | 'rojo'

export interface Filtro {
  nivel: NivelId | null
  areaId: string | null
  unidadId: string | null
  periodo: Periodo
  categoria: CategoriaIndicador | 'todas'
  estado: EstadoFiltro
}

/** Una unidad con su desempeño ya resuelto, lista para pintar. */
export interface FilaUnidad {
  unidad: Unidad
  cumplimiento: number
  semaforo: Semaforo
  serie: number[]          // 12 valores, para el minigráfico
  indicadoresEnRojo: number
}

export interface ResumenAgregado {
  cumplimiento: number
  semaforo: Semaforo
  totalIndicadores: number
  porSemaforo: Record<Semaforo, number>
  mejores: FilaUnidad[]     // 5 unidades
  enAlerta: FilaUnidad[]    // 5 unidades
}

export interface DataSource {
  getNiveles(): NivelInfo[]
  getUnidades(): Unidad[]
  getAreas(nivel: NivelId | null): Unidad[]
  getUnidadesDe(nivel: NivelId | null, areaId: string | null): Unidad[]
  getIndicadores(unidadId: string, f: Filtro): Indicador[]
  getSerie(indicadorId: string): PuntoSerie[]
  getUltimo(indicadorId: string): PuntoSerie | undefined
  getResumen(f: Filtro): ResumenAgregado
  getFilas(f: Filtro): FilaUnidad[]
  getTerritoriales(): FilaUnidad[]
}
