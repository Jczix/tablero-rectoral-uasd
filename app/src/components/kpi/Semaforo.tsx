import type { Semaforo as Estado } from '../../data/tipos'

export const COLOR: Record<Estado, string> = {
  verde: '#1E9E5A', ambar: '#E0A320', rojo: '#D24B3E',
}
const ETIQUETA: Record<Estado, string> = {
  verde: 'En meta', ambar: 'En riesgo', rojo: 'Incumplido',
}

/**
 * Marca de estado codificada por FORMA además de color: círculo (en meta),
 * triángulo (en riesgo), cuadrado (incumplido). Ámbar y rojo se confunden
 * bajo deuteranopia y a distancia en un televisor, así que el color solo no
 * basta para distinguirlos; la forma sí funciona en escala de grises y de
 * lejos, sin necesitar una etiqueta de texto junto a cada indicador.
 */
function Marca({ estado }: { estado: Estado }) {
  const color = COLOR[estado]
  switch (estado) {
    case 'verde':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0">
          <circle cx="7" cy="7" r="6" fill={color} />
        </svg>
      )
    case 'ambar':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0">
          <polygon points="7,1 13,12.5 1,12.5" fill={color} />
        </svg>
      )
    case 'rojo':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0">
          <rect x="1.5" y="1.5" width="11" height="11" fill={color} />
        </svg>
      )
  }
}

export function Semaforo({ estado, conEtiqueta = false }:
  { estado: Estado; conEtiqueta?: boolean }) {
  return (
    <span role="img" aria-label={ETIQUETA[estado]} className="inline-flex items-center gap-2">
      <Marca estado={estado} />
      {conEtiqueta && <span aria-hidden className="text-sm text-white/70">{ETIQUETA[estado]}</span>}
    </span>
  )
}
