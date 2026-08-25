import type { TipoMetrica, Direccion } from '../tipos'

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const PORCENTAJE = ['nivel de satisfaccion', 'satisfaccion', 'indice', 'porcentaje',
  'cumplimiento', 'cobertura', 'eficiencia', 'exactitud', 'productividad']
/**
 * Solo expresiones INEQUÍVOCAMENTE monetarias. El prefijo 'presupuest' que
 * había aquí atrapaba cualquier indicador que mencionara el presupuesto sin
 * ser un monto: en la Dirección de Presupuesto, 16 de sus 20 indicadores se
 * pintaban en pesos ("Modificaciones presupuestarias tramitadas — RD$ 7.0 M",
 * "Satisfacción de usuarios presupuestarios — RD$ 12.3 M"). Un indicador es
 * moneda solo si nombra el flujo de dinero, no el proceso que lo administra.
 */
const MONEDA = ['recursos gestionados', 'ejecucion presupuestaria', 'recaudacion',
  'fondos gestionados']
const MENOR_MEJOR = ['error', 'reproceso', 'riesgo', 'incidencia', 'queja', 'demora']

export function inferirMetrica(nombre: string): {
  tipoMetrica: TipoMetrica; unidadMedida: string; direccion: Direccion
} {
  const n = normalizar(nombre)

  if (n.startsWith('tiempo'))
    return { tipoMetrica: 'dias', unidadMedida: 'días', direccion: 'menor-mejor' }

  const direccion: Direccion =
    MENOR_MEJOR.some(k => n.includes(k)) ? 'menor-mejor' : 'mayor-mejor'

  // PORCENTAJE se comprueba ANTES que MONEDA: cuando un nombre menciona a la
  // vez una magnitud relativa y el presupuesto ("Cumplimiento del ciclo
  // presupuestario"), lo que se mide es el porcentaje, no un monto.
  if (PORCENTAJE.some(k => n.includes(k)))
    return { tipoMetrica: 'porcentaje', unidadMedida: '%', direccion }

  if (MONEDA.some(k => n.includes(k)))
    return { tipoMetrica: 'moneda', unidadMedida: 'RD$', direccion }

  return { tipoMetrica: 'conteo', unidadMedida: '', direccion }
}
