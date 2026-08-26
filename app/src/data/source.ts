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
  /** Desglose completo de los indicadores de la unidad bajo el filtro
   *  vigente. Sin él, la tarjeta de la rejilla mostraba tres señales de
   *  definiciones distintas (semáforo, % en meta, incumplidos) que se
   *  contradecían entre sí porque el ámbar no aparecía en ninguna de las
   *  dos cifras: "70.0% en meta — 0 de 20 incumplidos — En riesgo". */
  porSemaforo: Record<Semaforo, number>
  /** Total de indicadores que entraron en el cálculo (respeta categoría). */
  totalIndicadores: number
}

/** Un indicador resuelto para el período vigente, listo para pintar en una
 *  tarjeta: el punto que representa a su ventana y los 12 puntos del
 *  minigráfico calculados con esa misma ventana, para que el número grande y
 *  la curva de debajo no hablen de escalas distintas. */
export interface IndicadorEnPeriodo {
  punto: PuntoSerie
  serie: number[]
}

/** Serie de un indicador ya recortada al período vigente. `previa` solo
 *  viene con el período 'comparativo': son los 12 meses inmediatamente
 *  anteriores a la ventana en curso, para dibujarlos superpuestos. */
export interface SeriePeriodo {
  serie: PuntoSerie[]
  previa?: PuntoSerie[]
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
  /** La serie recortada a la ventana del período vigente (ver `SeriePeriodo`). */
  getSeriePeriodo(indicadorId: string, f: Filtro): SeriePeriodo
  /** El indicador resuelto para la ventana del período: es lo que debe pintar
   *  la tarjeta, no `getUltimo`, o la tarjeta contradice a la rejilla en
   *  cuanto el período deja de ser 'Mes actual'. */
  getIndicadorEnPeriodo(indicadorId: string, f: Filtro): IndicadorEnPeriodo
  getUltimo(indicadorId: string): PuntoSerie | undefined
  getResumen(f: Filtro): ResumenAgregado
  getFilas(f: Filtro): FilaUnidad[]
  /** Recibe el filtro vigente: sin él, el mapa mostraba una cifra para una
   *  unidad y los rankings de la misma pantalla otra distinta. */
  getTerritoriales(f: Filtro): FilaUnidad[]
}
