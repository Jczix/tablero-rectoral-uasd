import type { Indicador, PuntoSerie, Tendencia } from '../../data/tipos'
import { Semaforo } from './Semaforo'
import { Minigrafico } from './Minigrafico'
import { formatear } from './formato'

const FLECHA: Record<Tendencia, { signo: string; etiqueta: string }> = {
  alza: { signo: '▲', etiqueta: 'Tendencia al alza' },
  baja: { signo: '▼', etiqueta: 'Tendencia a la baja' },
  estable: { signo: '■', etiqueta: 'Tendencia estable' },
}

interface Props {
  indicador: Indicador
  punto: PuntoSerie
  serie: number[]
  onClic?: (indicadorId: string) => void
}

export function TarjetaIndicador({ indicador, punto, serie, onClic }: Props) {
  const flecha = FLECHA[punto.tendencia]
  const contenido = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm leading-snug text-white/80">{indicador.nombre}</span>
        <Semaforo estado={punto.semaforo} />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums">
          {formatear(punto.valor, indicador.tipoMetrica)}
        </span>
        <span aria-label={flecha.etiqueta} className="text-sm text-white/70">
          {flecha.signo}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-white/70">
        <span>{`Meta ${formatear(punto.meta, indicador.tipoMetrica)}`}</span>
        <span className="tabular-nums">{`${punto.cumplimiento.toFixed(1)}%`}</span>
      </div>
      {serie.length > 1 && (
        <div className="mt-2"><Minigrafico datos={serie} estado={punto.semaforo} /></div>
      )}
    </>
  )

  const clases = 'rounded-xl bg-panel-2 p-4 text-left ring-1 ring-white/10'
  return onClic
    ? <button className={`${clases} w-full hover:ring-uasd-azul-claro`}
              onClick={() => onClic(indicador.id)}>{contenido}</button>
    : <div className={clases}>{contenido}</div>
}
