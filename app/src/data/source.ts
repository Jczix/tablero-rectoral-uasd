import type {
  Unidad, Indicador, PuntoSerie, NivelId, NivelInfo,
  CategoriaIndicador, Semaforo,
} from './tipos'

/**
 * `DataSource` es deliberadamente síncrona: el tablero es de kiosco y debe
 * pintar al instante, sin estados de carga. Las vistas siempre leen desde un
 * almacén en memoria ya poblado, nunca esperan una promesa.
 *
 * Cuando exista un origen real, `ApiDataSource` implementará esta misma
 * interfaz sobre ese almacén: al arrancar (y luego periódicamente, o vía
 * websocket/SSE) hidrata el almacén en segundo plano con llamadas
 * asíncronas a la API institucional, y cada método de `DataSource` sigue
 * leyendo de forma síncrona el snapshot ya cargado. Cuando el almacén se
 * actualiza, `ApiDataSource` notifica a los suscriptores (p. ej. un
 * `store` de estado externo con `subscribe`) para que las vistas
 * refresquen su lectura, sin que su código cambie una sola línea: la
 * frontera `DataSource` se mantiene, solo cambia quién hidrata el almacén
 * y cuándo.
 */

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
