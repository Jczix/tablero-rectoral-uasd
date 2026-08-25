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

/** Bandas de cumplimiento objetivo, calibradas a 70 / 20 / 10. */
const BANDAS: [number, [number, number]][] = [
  [0.70, [96, 118]],   // verde
  [0.90, [82, 94]],    // ámbar
  [1.00, [58, 78]],    // rojo
]

const bandaDe = (r: number): [number, number] =>
  BANDAS.find(([tope]) => r < tope)![1]

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

const indice = new Map(INDICADORES.map(i => [i.id, i]))

export function generarSerie(indicadorId: string, meses = 24): PuntoSerie[] {
  const ind = indice.get(indicadorId)
  if (!ind) return []
  const peso = porId(ind.unidadId)?.peso ?? 1

  const r = mulberry32(hashSemilla(indicadorId) ^ SEMILLA_GLOBAL)
  const [minCump, maxCump] = bandaDe(r())
  const base = magnitudBase(ind, peso, r)
  const deriva = (r() - 0.45) * 0.006          // tendencia mensual suave

  const periodos = periodosHasta(ahora(), meses)
  const puntos: PuntoSerie[] = []

  for (let k = 0; k < periodos.length; k++) {
    const mes = Number(periodos[k].slice(5)) - 1
    const ruido = 0.94 + r() * 0.12
    const factor = (1 + deriva * k) * ESTACIONAL[mes] * ruido

    let valor: number, meta: number
    if (ind.tipoMetrica === 'porcentaje') {
      meta = 90
      const cump = minCump + r() * (maxCump - minCump)
      valor = Math.min(100, Math.max(0, (meta * cump) / 100))
    } else if (ind.direccion === 'menor-mejor') {
      meta = base
      const cump = minCump + r() * (maxCump - minCump)
      valor = Math.max(0.1, (meta * 100) / cump)
    } else {
      meta = base * factor
      const cump = minCump + r() * (maxCump - minCump)
      valor = Math.max(0, (meta * cump) / 100)
    }

    const redondear = (n: number) =>
      ind.tipoMetrica === 'conteo' ? Math.round(n) : Math.round(n * 10) / 10
    valor = redondear(valor)
    meta = redondear(meta)

    const cumplimiento = ind.direccion === 'menor-mejor'
      ? (meta / Math.max(valor, 0.1)) * 100
      : (valor / meta) * 100

    const previo = puntos.at(-1)
    const delta = previo ? (valor - previo.valor) / Math.max(previo.valor, 0.1) : 0
    const tendencia = delta > 0.02 ? 'alza' : delta < -0.02 ? 'baja' : 'estable'

    puntos.push({
      indicadorId, periodo: periodos[k], valor, meta,
      cumplimiento, semaforo: clasificar(cumplimiento), tendencia,
    })
  }
  return puntos
}
