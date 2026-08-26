import type { Semaforo as Estado } from '../../data/tipos'
import { COLOR } from './Semaforo'

interface Props {
  porcentaje: number
  semaforo: Estado
  /** Rótulo bajo el número (p. ej. "en meta"). */
  etiqueta?: string
}

/**
 * Anillo (dona) con el porcentaje grande en el centro: la forma para UN
 * número resumen que debe leerse desde el otro lado de una oficina.
 * `pathLength=100` normaliza la circunferencia, así el dasharray es el
 * porcentaje directo sin calcular 2πr. El texto del centro es HTML normal
 * (no <text> de SVG) para heredar la tipografía tabular de las tarjetas.
 */
export function AnilloCumplimiento({ porcentaje, semaforo, etiqueta }: Props) {
  const avance = Math.max(0, Math.min(100, porcentaje))
  return (
    <div className="relative h-20 w-20">
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="20" cy="20" r="16" fill="none" stroke="#ffffff14" strokeWidth="5" />
        <circle data-arco cx="20" cy="20" r="16" fill="none"
          stroke={COLOR[semaforo]} strokeWidth="5" strokeLinecap="round"
          pathLength={100} strokeDasharray={`${avance} 100`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-semibold tabular-nums leading-none">
          {porcentaje.toFixed(1)}%
        </span>
        {etiqueta && (
          <span className="mt-0.5 text-[9px] leading-none text-white/60">{etiqueta}</span>
        )}
      </div>
    </div>
  )
}
