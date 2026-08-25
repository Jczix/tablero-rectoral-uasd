import { useFiltros } from '../../state/FiltrosContext'
import { chipsDe } from '../../state/filtros'

export function ChipsFiltros() {
  const { filtro, historial, despachar } = useFiltros()
  const chips = chipsDe(filtro)
  if (!chips.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
      {chips.map(c => (
        <button key={c.clave}
          onClick={() => despachar({ tipo: 'quitar', valor: c.clave })}
          className="rounded-full bg-uasd-azul/30 px-3 py-1.5 text-sm
                     ring-1 ring-uasd-azul-claro/40 hover:bg-uasd-azul/50">
          {c.etiqueta} ✕
        </button>
      ))}
      <button onClick={() => despachar({ tipo: 'atras' })}
        disabled={!historial.length}
        className="rounded-full px-3 py-1.5 text-sm text-white/60
                   hover:text-white disabled:opacity-30">
        ← Atrás
      </button>
      <button onClick={() => despachar({ tipo: 'limpiar' })}
        className="rounded-full px-3 py-1.5 text-sm text-white/60 hover:text-white">
        Limpiar todo
      </button>
    </div>
  )
}
