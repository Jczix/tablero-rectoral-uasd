import { PATH_RD, ANCHO, ALTO, proyectar } from '../../data/mapa-rd'
import { mockDataSource as ds } from '../../data/mock/MockDataSource'
import { useFiltros } from '../../state/FiltrosContext'
import { COLOR } from '../kpi/Semaforo'
import { formatearCompacto } from '../kpi/formato'

/** Radio del punto en función de la matrícula de la unidad, en miles. */
const radio = (peso: number) => Math.max(5, Math.min(26, 4 + Math.sqrt(peso) * 2.4))

export function MapaRD({ alto = '100%' }: { alto?: string | number }) {
  const { filtro, despachar } = useFiltros()
  const filas = ds.getTerritoriales()
  const hayFoco = filtro.unidadId !== null

  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} style={{ height: alto, width: '100%' }}
         role="group" aria-label="Red territorial de la UASD">
      <path d={PATH_RD} fill="#14263A" stroke="#2C4B6B" strokeWidth={1.2} />

      {filas.map(f => {
        const [x, y] = proyectar(f.unidad.coords![0], f.unidad.coords![1])
        const activo = filtro.unidadId === f.unidad.id
        const atenuado = hayFoco && !activo
        const etiqueta =
          `${f.unidad.nombre}. ${formatearCompacto(f.unidad.peso * 1000)} estudiantes. ` +
          `Cumplimiento ${f.cumplimiento.toFixed(1)} por ciento.`

        return (
          <g key={f.unidad.id} role="button" aria-label={etiqueta} tabIndex={0}
             className="cursor-pointer"
             opacity={atenuado ? 0.28 : 1}
             onClick={() => despachar({
               tipo: 'seleccionarUnidad', valor: f.unidad.id })}>
            <circle cx={x} cy={y} r={radio(f.unidad.peso)}
              fill={COLOR[f.semaforo]} fillOpacity={0.75}
              stroke={activo ? '#FFFFFF' : COLOR[f.semaforo]}
              strokeWidth={activo ? 3 : 1.5} />
            {f.unidad.peso >= 6 && (
              <text x={x} y={y - radio(f.unidad.peso) - 6}
                textAnchor="middle" fontSize={13} fill="#D8E4F0">
                {f.unidad.nombre.replace(/^(Recinto|Centro|Sub-?centro)\s+/i, '')}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
