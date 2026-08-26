import type { Semaforo as Estado } from '../../data/tipos'
import { COLOR } from './Semaforo'

const ORDEN: Estado[] = ['verde', 'ambar', 'rojo']

/**
 * Barra apilada con la proporción de indicadores en cada estado. Es la
 * versión visual del desglose que la tarjeta ya dice en texto ("12 en meta ·
 * 5 en riesgo · 3 incumplidos"), así que va oculta al lector de pantalla.
 */
export function BarraSemaforo({ porSemaforo }: { porSemaforo: Record<Estado, number> }) {
  const total = ORDEN.reduce((a, e) => a + porSemaforo[e], 0)
  if (total === 0) return null
  return (
    <div aria-hidden className="flex h-2 w-full gap-px overflow-hidden rounded">
      {ORDEN.filter(e => porSemaforo[e] > 0).map(e => (
        <div key={e} data-segmento={e}
          style={{ width: `${(porSemaforo[e] / total) * 100}%`, backgroundColor: COLOR[e] }} />
      ))}
    </div>
  )
}
