import type { PuntoSerie, Semaforo, Indicador } from '../tipos'
import { mulberry32, hashSemilla } from './aleatorio'
import { INDICADORES } from './catalogo'
import { porId } from './unidades'
import { ahora } from '../reloj'

export const SEMILLA_GLOBAL = 20260825

export function clasificar(cumplimiento: number): Semaforo {
  if (cumplimiento >= 95) return 'verde'
  if (cumplimiento >= 80) return 'ambar'
  return 'rojo'
}

/**
 * Porcentaje de una lista de semáforos (típicamente los últimos puntos de
 * los indicadores de una unidad) que está en meta (verde). Es la métrica de
 * desempeño de una UNIDAD, deliberadamente distinta de `clasificar`: el
 * cumplimiento medio de una unidad se apiña entre 70 y 95 (media 84.6, la
 * cifra ancla institucional) porque los cumplimientos individuales ya están
 * centrados alrededor de 100 por construcción, así que promediarlos jamás
 * produce una unidad por debajo de 40. Contar cuántos indicadores están en
 * meta, en cambio, sí distingue una unidad con 15 de 20 indicadores sanos
 * de una con solo 8: la primera da 75, la segunda 40, un rango que sí
 * separa "buen desempeño" de "requiere atención" en vez de apiñarlos.
 */
export function porcentajeEnMeta(semaforos: Semaforo[]): number {
  if (!semaforos.length) return 0
  return (semaforos.filter(s => s === 'verde').length / semaforos.length) * 100
}

/**
 * Clasificación de una UNIDAD según `porcentajeEnMeta`, no la de un
 * indicador individual: no puede reutilizar `clasificar` porque esa función
 * calibra 95/80 contra la escala 70/20/10 de un cumplimiento individual
 * (ver `BANDAS` más abajo), y aplicar esos mismos umbrales al porcentaje de
 * indicadores en meta dejaría casi todo en rojo (los indicadores en meta
 * son ~70% del catálogo, no ~95%).
 *
 * Umbrales 75/55 calibrados contra las 158 unidades del catálogo actual que
 * tienen indicadores: con verde >= 75 y ámbar >= 55, la distribución
 * resultante es 71 verde / 76 ámbar / 11 rojo (45% / 48% / 7%) — un reparto
 * creíble, ni todo verde ni todo rojo, con un grupo de unidades realmente
 * en problemas. Ver la sección de corrección del informe de la Tarea 10
 * para la medición completa.
 */
export function clasificarUnidad(pctEnMeta: number): Semaforo {
  if (pctEnMeta >= 75) return 'verde'
  if (pctEnMeta >= 55) return 'ambar'
  return 'rojo'
}

/** Bandas de cumplimiento objetivo, calibradas a 70 / 20 / 10. */
const BANDAS: [number, [number, number]][] = [
  [0.70, [96, 118]],   // verde
  [0.90, [82, 94]],    // ámbar
  [1.00, [58, 78]],    // rojo
]

const bandaDe = (r: number): [number, number] =>
  BANDAS.find(([tope]) => r < tope)![1]

/** Meta de un indicador `porcentaje` cuando menor es mejor (p. ej. "% de
 *  quejas sin resolver"). Debe ser lo bastante baja para que, incluso en el
 *  peor caso de la banda roja (cump = 58, el mínimo de `BANDAS`),
 *  `meta * 100 / cump` no supere 100: de lo contrario el recorte a 100
 *  rompería la correspondencia entre la banda sorteada y el cumplimiento
 *  resultante, sesgando la distribución de semáforos. */
const META_PORCENTAJE_MENOR_MEJOR = 15

/** Estacionalidad académica: picos en inscripción, valle en julio. */
const ESTACIONAL = [1.02, 0.98, 1.00, 1.01, 1.03, 0.95,
                    0.82, 1.18, 1.12, 1.00, 0.99, 0.94]

const magnitudBase = (ind: Indicador, peso: number, r: () => number): number => {
  switch (ind.tipoMetrica) {
    case 'porcentaje': return 0                       // se resuelve por banda
    case 'dias':       return 2 + r() * 18            // 2 a 20 días
    case 'moneda':     return peso * (180_000 + r() * 620_000)
    default:           return Math.max(4, peso * (3 + r() * 40))
  }
}

const periodosHasta = (fin: Date, meses: number): string[] => {
  const salida: string[] = []
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth() - i, 1))
    salida.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
  }
  return salida
}

/** Época fija: origen del índice mensual absoluto que alimenta la deriva.
 *  Ancla la tendencia al calendario en vez de a la posición dentro de la
 *  ventana de 24 meses, para que un mes ya generado no cambie de valor
 *  cuando `ahora()` avanza y la ventana se desplaza. */
const EPOCA_ANIO = 2020

/** Índice de mes absoluto desde la época: estable sin importar qué ventana
 *  de 24 meses lo contenga. */
const mesAbsoluto = (periodo: string): number => {
  const anio = Number(periodo.slice(0, 4))
  const mes = Number(periodo.slice(5, 7))
  return (anio - EPOCA_ANIO) * 12 + mes
}

const indice = new Map(INDICADORES.map(i => [i.id, i]))

/** Cumplimiento porcentual respetando la dirección del indicador. */
const cumplimientoDe = (ind: Indicador, valor: number, meta: number): number =>
  ind.direccion === 'menor-mejor'
    ? (meta / Math.max(valor, 0.1)) * 100
    : (valor / meta) * 100

export function generarSerie(indicadorId: string, meses = 24): PuntoSerie[] {
  const ind = indice.get(indicadorId)
  if (!ind) return []
  const peso = porId(ind.unidadId)?.peso ?? 1

  // PRNG del indicador: sortea la banda de cumplimiento (única llamada,
  // siempre la primera) y la magnitud base. Nada de esto depende de cuántos
  // meses tenga la ventana ni de en qué orden se recorran.
  const r = mulberry32(hashSemilla(indicadorId) ^ SEMILLA_GLOBAL)
  const [minCump, maxCump] = bandaDe(r())
  const base = magnitudBase(ind, peso, r)
  const deriva = (r() - 0.45) * 0.006          // tendencia mensual suave

  const periodos = periodosHasta(ahora(), meses)
  const puntos: PuntoSerie[] = []

  for (const periodo of periodos) {
    const mes = Number(periodo.slice(5, 7)) - 1
    const kAbs = mesAbsoluto(periodo)

    // PRNG por punto: sembrado con el período de calendario, no con la
    // posición dentro de la ventana. El mismo mes produce el mismo ruido y
    // el mismo cumplimiento sin importar qué ventana de 24 meses lo genere.
    const rp = mulberry32(hashSemilla(`${indicadorId}|${periodo}`))
    const ruido = 0.94 + rp() * 0.12
    const factor = (1 + deriva * kAbs) * ESTACIONAL[mes] * ruido
    const cump = minCump + rp() * (maxCump - minCump)

    let valor: number, meta: number
    if (ind.tipoMetrica === 'porcentaje') {
      meta = ind.direccion === 'menor-mejor' ? META_PORCENTAJE_MENOR_MEJOR : 90
      valor = ind.direccion === 'menor-mejor'
        ? (meta * 100) / cump
        : (meta * cump) / 100
      valor = Math.min(100, Math.max(0, valor))
    } else if (ind.direccion === 'menor-mejor') {
      meta = base
      valor = Math.max(0.1, (meta * 100) / cump)
    } else {
      meta = base * factor
      valor = Math.max(0, (meta * cump) / 100)
    }

    const redondear = (n: number) =>
      ind.tipoMetrica === 'conteo' ? Math.round(n) : Math.round(n * 10) / 10
    valor = redondear(valor)
    meta = redondear(meta)

    const cumplimiento = cumplimientoDe(ind, valor, meta)

    const previo = puntos.at(-1)
    const delta = previo ? (valor - previo.valor) / Math.max(previo.valor, 0.1) : 0
    const tendencia = delta > 0.02 ? 'alza' : delta < -0.02 ? 'baja' : 'estable'

    puntos.push({
      indicadorId, periodo, valor, meta,
      cumplimiento, semaforo: clasificar(cumplimiento), tendencia,
    })
  }
  return puntos
}
