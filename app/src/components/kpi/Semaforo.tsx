import type { Semaforo as Estado } from '../../data/tipos'

export const COLOR: Record<Estado, string> = {
  verde: '#1E9E5A', ambar: '#E0A320', rojo: '#D24B3E',
}
const ETIQUETA: Record<Estado, string> = {
  verde: 'En meta', ambar: 'En riesgo', rojo: 'Incumplido',
}

export function Semaforo({ estado, conEtiqueta = false }:
  { estado: Estado; conEtiqueta?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span role="img" aria-label={ETIQUETA[estado]}
        className="inline-block h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: COLOR[estado] }} />
      {conEtiqueta && <span className="text-sm text-white/70">{ETIQUETA[estado]}</span>}
    </span>
  )
}
