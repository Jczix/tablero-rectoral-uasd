import type { Semaforo as Estado } from '../../data/tipos'
import { COLOR } from './Semaforo'

interface Props {
  cumplimiento: number
  semaforo: Estado
}

/**
 * Medidor semicircular del cumplimiento contra la meta, coloreado por el
 * semáforo del punto. Superar la meta llena el arco (acotado a 100): el
 * "cuánto se pasó" ya lo dice el texto de la tarjeta. `pathLength=100`
 * normaliza el arco para que el dasharray sea el porcentaje directo.
 * Decorativo: valor, meta y % de cumplimiento están en texto en la tarjeta.
 */
export function MedidorArco({ cumplimiento, semaforo }: Props) {
  const avance = Math.max(0, Math.min(100, cumplimiento))
  const arco = 'M 5 22 A 17 17 0 0 1 39 22'
  return (
    <div aria-hidden className="h-7 w-12 shrink-0">
      <svg viewBox="0 0 44 26" className="h-full w-full">
        <path d={arco} fill="none" stroke="#ffffff14" strokeWidth="5"
          strokeLinecap="round" />
        <path data-avance d={arco} fill="none"
          stroke={COLOR[semaforo]} strokeWidth="5" strokeLinecap="round"
          pathLength={100} strokeDasharray={`${avance} 100`} />
      </svg>
    </div>
  )
}
