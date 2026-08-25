import type { Semaforo as Estado } from '../../data/tipos'
import { COLOR } from './Semaforo'

/** Sparkline en SVG puro: sin dependencias y sin costo de layout. */
export function Minigrafico({ datos, estado }: { datos: number[]; estado: Estado }) {
  if (datos.length < 2) return null
  const min = Math.min(...datos), max = Math.max(...datos)
  const rango = max - min
  // Una serie plana (rango 0) se centra verticalmente en vez de pegarse al
  // borde inferior: pegada al fondo se lee como "en el mínimo" cuando en
  // realidad es "sin cambio".
  const puntos = datos.map((v, i) => {
    const x = (i / (datos.length - 1)) * 100
    const y = rango === 0 ? 16 : 28 - ((v - min) / rango) * 24
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full" aria-hidden>
      <polyline points={puntos} fill="none" strokeWidth={2}
        stroke={COLOR[estado]} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
