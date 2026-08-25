import type { TipoMetrica, Direccion } from '../tipos'

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const PORCENTAJE = ['nivel de satisfaccion', 'satisfaccion', 'indice', 'porcentaje',
  'cumplimiento', 'cobertura', 'eficiencia', 'exactitud', 'productividad']
const MONEDA = ['recursos gestionados', 'presupuest', 'recaudacion', 'fondos gestionados']
const MENOR_MEJOR = ['error', 'reproceso', 'riesgo', 'incidencia', 'queja', 'demora']

export function inferirMetrica(nombre: string): {
  tipoMetrica: TipoMetrica; unidadMedida: string; direccion: Direccion
} {
  const n = normalizar(nombre)

  if (n.startsWith('tiempo'))
    return { tipoMetrica: 'dias', unidadMedida: 'días', direccion: 'menor-mejor' }

  const direccion: Direccion =
    MENOR_MEJOR.some(k => n.includes(k)) ? 'menor-mejor' : 'mayor-mejor'

  if (MONEDA.some(k => n.includes(k)))
    return { tipoMetrica: 'moneda', unidadMedida: 'RD$', direccion }

  if (PORCENTAJE.some(k => n.includes(k)))
    return { tipoMetrica: 'porcentaje', unidadMedida: '%', direccion }

  return { tipoMetrica: 'conteo', unidadMedida: '', direccion }
}
