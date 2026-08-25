import type { Semaforo as Estado } from '../../data/tipos'
import { Semaforo } from './Semaforo'

interface Props {
  titulo: string
  valor: string
  detalle?: string
  estado?: Estado
  onClic?: () => void
}

export function TarjetaKPI({ titulo, valor, detalle, estado, onClic }: Props) {
  const contenido = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-white/70">{titulo}</span>
        {estado && <Semaforo estado={estado} />}
      </div>
      <div className="mt-2 text-5xl font-bold leading-none tabular-nums">{valor}</div>
      {detalle && <div className="mt-2 text-sm text-white/70">{detalle}</div>}
    </>
  )
  const clases = 'rounded-xl bg-panel-2 p-5 text-left ring-1 ring-white/10'
  return onClic
    ? <button className={`${clases} w-full hover:ring-uasd-azul-claro`}
              onClick={onClic}>{contenido}</button>
    : <div className={clases}>{contenido}</div>
}
