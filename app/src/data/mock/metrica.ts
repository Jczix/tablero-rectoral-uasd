import type { TipoMetrica, Direccion } from '../tipos'

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const PORCENTAJE = ['nivel de satisfaccion', 'satisfaccion', 'indice', 'porcentaje',
  'cumplimiento', 'cobertura', 'eficiencia', 'exactitud', 'productividad']
/**
 * Patrones monetarios por TOKENS, no por subcadena. Cada patrón es una lista
 * de palabras que deben aparecer en el nombre, en ese orden, pero no
 * necesariamente pegadas: así "Fondos externos gestionados" —que es
 * inequívocamente un monto— cae en `['fondos', 'gestionados']`, cosa que la
 * subcadena literal 'fondos gestionados' no conseguía porque "externos" se
 * interponía.
 *
 * La comparación es de token EXACTO, sin derivación de plurales, y a
 * propósito: es lo que mantiene fuera a "Ejecuciones presupuestarias
 * monitoreadas" (cuenta ejecuciones, no pesos) frente a "Ejecución
 * presupuestaria administrativa" (sí es un monto). Ampliar esta lista es
 * añadir una fila explícita, nunca reabrir el prefijo 'presupuest', que es
 * lo que hacía que 16 de los 20 indicadores de la Dirección de Presupuesto
 * se pintaran en RD$ sin ser importes.
 */
const MONEDA: string[][] = [
  ['fondos', 'gestionados'],
  ['recursos', 'gestionados'],
  ['ejecucion', 'presupuestaria'],
  ['recaudacion'],
  ['recaudaciones'],
  ['desembolso'],
  ['desembolsos'],
  ['monto'],
  ['montos'],
]

/**
 * Sustantivos que, encabezando el nombre, lo convierten en un CONTEO aunque
 * más adelante aparezca una palabra de dinero: "Registros de desembolsos
 * verificados" cuenta registros, no pesos. Es la contrapartida necesaria de
 * admitir tokens sueltos como 'desembolsos' o 'montos'.
 */
const CABEZA_CONTADORA = ['registro', 'registros', 'cantidad', 'cantidades',
  'numero', 'informe', 'informes', 'reporte', 'reportes', 'listado', 'listados']

const tokenizar = (n: string): string[] => n.split(/[^a-z0-9]+/).filter(Boolean)

/** ¿Aparecen todos los tokens del patrón, en ese orden, en la lista? */
const contieneEnOrden = (tokens: string[], patron: string[]): boolean => {
  let i = 0
  for (const t of tokens) if (t === patron[i] && ++i === patron.length) return true
  return false
}

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

  const tokens = tokenizar(n)
  if (!CABEZA_CONTADORA.includes(tokens[0] ?? '')
      && MONEDA.some(p => contieneEnOrden(tokens, p)))
    return { tipoMetrica: 'moneda', unidadMedida: 'RD$', direccion }

  return { tipoMetrica: 'conteo', unidadMedida: '', direccion }
}
