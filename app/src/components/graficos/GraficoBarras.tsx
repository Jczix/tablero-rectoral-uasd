import type { FilaUnidad } from '../../data/source'
import { COLOR } from '../kpi/Semaforo'

interface Props {
  titulo: string
  filas: FilaUnidad[]
  onClic: (unidadId: string) => void
}

export function GraficoBarras({ titulo, filas, onClic }: Props) {
  // El cumplimiento de una unidad es un % de indicadores en meta, acotado
  // por definición a [0, 100]: no hace falta calcular un tope contra los
  // valores reales de `filas` (antes se usaba Math.max(..., 100) porque el
  // cumplimiento promedio sí podía superar 100).
  const tope = 100
  return (
    <div data-testid={titulo} className="rounded-xl bg-panel-2 p-4 ring-1 ring-white/10">
      <div className="mb-3 text-xs uppercase tracking-wide text-white/70">
        {titulo} <span className="normal-case text-white/60">· % de indicadores en meta</span>
      </div>
      <ul className="space-y-2">
        {filas.map(f => (
          <li key={f.unidad.id}>
            <button onClick={() => onClic(f.unidad.id)}
              className="group w-full text-left"
              aria-label={`${f.unidad.nombre}, ${f.cumplimiento.toFixed(1)} por ciento de indicadores en meta`}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate text-white/80 group-hover:text-white">
                  {f.unidad.nombre}
                </span>
                <span className="shrink-0 tabular-nums text-white/60">
                  {f.cumplimiento.toFixed(1)}% en meta
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
