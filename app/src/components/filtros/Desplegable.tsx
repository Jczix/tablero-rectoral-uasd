import { useEffect, useRef, useState } from 'react'

export interface Opcion { valor: string; texto: string }

interface Props {
  etiqueta: string
  opciones: Opcion[]
  valor: string | null
  onCambio: (v: string | null) => void
  buscable?: boolean
}

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function Desplegable({ etiqueta, opciones, valor, onCambio, buscable }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const alClic = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false)
    }
    const alTeclado = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', alClic)
    document.addEventListener('keydown', alTeclado)
    return () => {
      document.removeEventListener('mousedown', alClic)
      document.removeEventListener('keydown', alTeclado)
    }
  }, [abierto])

  const escogida = opciones.find(o => o.valor === valor)
  const visibles = busqueda
    ? opciones.filter(o => normalizar(o.texto).includes(normalizar(busqueda)))
    : opciones

  const escoger = (v: string | null) => { onCambio(v); setAbierto(false); setBusqueda('') }

  return (
    <div ref={contenedor} className="relative min-w-[13rem] flex-1">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-white/50">
        {etiqueta}
      </div>
      <button
        type="button"
        disabled={opciones.length === 0}
        onClick={() => setAbierto(a => !a)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className="flex w-full items-center justify-between gap-2 rounded-lg bg-panel-2
                   px-4 py-3 text-left text-base ring-1 ring-white/10
                   hover:ring-uasd-azul-claro disabled:opacity-40
                   disabled:hover:ring-white/10"
      >
        <span className="truncate">{escogida?.texto ?? 'Todas'}</span>
        <span aria-hidden className="text-white/40">▾</span>
      </button>

      {abierto && (
        <div className="absolute z-40 mt-1 max-h-80 w-full overflow-auto rounded-lg
                        bg-panel-2 py-1 shadow-2xl ring-1 ring-white/15">
          {buscable && (
            <input
              autoFocus
              placeholder="Buscar…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="mx-2 mb-1 w-[calc(100%-1rem)] rounded bg-panel px-3 py-2
                         text-sm outline-none ring-1 ring-white/10"
            />
          )}
          <ul role="listbox">
            <li role="option" aria-selected={valor === null}
                onClick={() => escoger(null)}
                className="cursor-pointer px-4 py-2.5 text-white/60 hover:bg-uasd-azul/40">
              Todas
            </li>
            {visibles.map(o => (
              <li key={o.valor} role="option" aria-selected={o.valor === valor}
                  onClick={() => escoger(o.valor)}
                  className={`cursor-pointer px-4 py-2.5 hover:bg-uasd-azul/40
                              ${o.valor === valor ? 'bg-uasd-azul/25' : ''}`}>
                {o.texto}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
