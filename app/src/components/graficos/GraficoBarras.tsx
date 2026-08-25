import type { FilaUnidad } from '../../data/source'
import { COLOR } from '../kpi/Semaforo'

interface Props {
  titulo: string
  filas: FilaUnidad[]
  onClic: (unidadId: string) => void
}

export function GraficoBarras({ titulo, filas, onClic }: Props) {
  const tope = Math.max(...filas.map(f => f.cumplimiento), 100)
  return (
    <div className="rounded-xl bg-panel-2 p-4 ring-1 ring-white/10">
      <div className="mb-3 text-xs uppercase tracking-wide text-white/50">{titulo}</div>
      <ul className="space-y-2">
        {filas.map(f => (
          <li key={f.unidad.id}>
            <button onClick={() => onClic(f.unidad.id)}
              className="group w-full text-left"
              aria-label={`${f.unidad.nombre}, ${f.cumplimiento.toFixed(1)} por ciento`}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate text-white/80 group-hover:text-white">
                  {f.unidad.nombre}
                </span>
                <span className="shrink-0 tabular-nums text-white/60">
                  {f.cumplimiento.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 h-2 w-full rounded bg-white/5">
                <div className="h-2 rounded"
                  style={{
                    width: `${(f.cumplimiento / tope) * 100}%`,
                    backgroundColor: COLOR[f.semaforo],
                  }} />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
