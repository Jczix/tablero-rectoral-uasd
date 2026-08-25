/** Identificadores de nivel. 1–10 son la taxonomía entregada por el Rector.
 *  11 y 12 son Facultades y Escuelas, que esa taxonomía no contempla.
 *  PENDIENTE CONFIRMAR con el Rector. */
export type NivelId = 1|2|3|4|5|6|7|8|9|10|11|12

export type TipoUnidad =
  | 'rectoria' | 'organismo' | 'vicerrectoria' | 'facultad' | 'escuela'
  | 'direccion' | 'recinto' | 'centro' | 'subcentro' | 'instituto' | 'servicio'

export interface Unidad {
  id: string
  nombre: string
  nivel: NivelId
  tipo: TipoUnidad
  padreId: string | null
  /** Provincia y coordenadas solo para unidades con presencia territorial. */
  provincia?: string
  coords?: [number, number]   // [longitud, latitud]
  /** Magnitud relativa de la unidad; escala todas sus cifras generadas. */
  peso: number
}

export interface NivelInfo {
  id: NivelId
  nombre: string
  /** Orden de aparición en el desplegable, distinto del id. */
  orden: number
}

export type CategoriaIndicador = 'servicio' | 'proceso'
export type TipoMetrica = 'conteo' | 'porcentaje' | 'dias' | 'moneda'
export type Direccion = 'mayor-mejor' | 'menor-mejor'

export interface Indicador {
  id: string
  unidadId: string
  nombre: string
  categoria: CategoriaIndicador
  tipoMetrica: TipoMetrica
  unidadMedida: string
  direccion: Direccion
}

export type Semaforo = 'verde' | 'ambar' | 'rojo'
export type Tendencia = 'alza' | 'baja' | 'estable'

export interface PuntoSerie {
  indicadorId: string
  periodo: string        // 'AAAA-MM'
  valor: number
  meta: number
  cumplimiento: number   // porcentaje, 0–200
  semaforo: Semaforo
  tendencia: Tendencia
}
