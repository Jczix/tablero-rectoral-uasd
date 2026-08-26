import type { Semaforo as Estado } from '../../data/tipos'
import { COLOR } from './Semaforo'

interface Props {
  valor: number
  meta: number
  semaforo: Estado
}

/**
 * Barra de progreso contra la meta (tipo bullet): el valor como barra
 * coloreada por su semáforo y la meta como tic vertical. Cuando el valor
 * supera la meta la escala crece hasta el valor, de modo que la barra llena
 * el ancho y el tic queda adentro: "se pasó de la meta" se ve, no desborda.
 * Decorativa: la tarjeta ya dice valor, meta y % de cumplimiento en texto.
 */
export function BarraBala({ valor, meta, semaforo }: Props) {
  const escala = Math.max(valor, meta)
  if (escala <= 0) return null
  return (
    <div aria-hidden className="relative h-2 w-full rounded bg-white/5">
      <div data-valor className="h-2 rounded"
        style={{ width: `${(valor / escala) * 100}%`, backgroundColor: COLOR[semaforo] }} />
      <div data-meta className="absolute -top-0.5 h-3 w-0.5 -translate-x-1/2 bg-white/60"
        style={{ left: `${(meta / escala) * 100}%` }} />
    </div>
  )
}
