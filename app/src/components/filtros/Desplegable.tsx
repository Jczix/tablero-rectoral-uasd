import {
  useEffect, useId, useRef, useState,
  type FocusEvent, type KeyboardEvent,
} from 'react'

export interface Opcion { valor: string; texto: string }

interface Props {
  etiqueta: string
  opciones: Opcion[]
  valor: string | null
  onCambio: (v: string | null) => void
  buscable?: boolean
}

/** Sentinel interno para la fila "Todas" en la lista con foco itinerante.
 *  Nunca se expone a `onCambio`: siempre se traduce de vuelta a `null`. */
const TODAS = '__todas__'

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function Desplegable({ etiqueta, opciones, valor, onCambio, buscable }: Props) {
  const idBase = useId()
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [activo, setActivo] = useState(0)
  const contenedor = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const entrada = useRef<HTMLInputElement>(null)
  const lista = useRef<HTMLUListElement>(null)
  // Marca si el cierre en curso lo disparó un clic fuera (ver más abajo).
  const clicFueraEnCurso = useRef(false)

  const escogida = opciones.find(o => o.valor === valor)
  const visibles = busqueda
    ? opciones.filter(o => normalizar(o.texto).includes(normalizar(busqueda)))
    : opciones
  // "Todas" siempre encabeza la lista con foco itinerante y nunca se filtra.
  const conTodas = [{ valor: TODAS, texto: 'Todas' }, ...visibles]

  // Al abrir: sitúa la opción activa sobre la selección vigente (o "Todas")
  // y mueve el foco real al buscador (si lo hay) o a la lista misma, para
  // que las flechas/Enter/Escape funcionen desde ya.
  useEffect(() => {
    if (!abierto) return
    setActivo(Math.max(0, conTodas.findIndex(o => o.valor === (valor ?? TODAS))))
    if (buscable) entrada.current?.focus()
    else lista.current?.focus()
    // Solo debe recalcularse al abrir, no en cada tecla de búsqueda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  // Un clic fuera del componente le quita el foco a lo que esté enfocado
  // dentro (el buscador o la lista): el navegador dispara ese blur como
  // parte del propio mousedown, antes de que llegue ningún 'click'. Por eso
  // el cierre real ocurre en `alPerderFoco` (más abajo); este efecto solo
  // deja anotado, con un mousedown en fase de captura, que el blur que está
  // por venir vino de un clic fuera y no de un Tab, para decidir si hay que
  // devolver el foco al botón.
  useEffect(() => {
    if (!abierto) return
    const alMouseDownFuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) clicFueraEnCurso.current = true
    }
    document.addEventListener('mousedown', alMouseDownFuera)
    return () => document.removeEventListener('mousedown', alMouseDownFuera)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  const cerrar = (devolverFoco: boolean) => {
    setAbierto(false)
    setBusqueda('')
    setActivo(0)
    if (devolverFoco) boton.current?.focus()
  }

  const escoger = (v: string | null) => { onCambio(v); cerrar(true) }

  /** Único punto de cierre por pérdida de foco: cubre tanto el clic fuera
   *  (devuelve el foco al botón disparador) como el Tab hacia otro control
   *  (solo cierra el panel, sin robarle el foco a donde el usuario ya fue). */
  const alPerderFoco = (e: FocusEvent<HTMLDivElement>) => {
    if (!abierto || contenedor.current?.contains(e.relatedTarget as Node)) return
    const fueClicFuera = clicFueraEnCurso.current
    clicFueraEnCurso.current = false
    cerrar(fueClicFuera)
  }

  const manejarTeclado = (e: KeyboardEvent) => {
    const total = conTodas.length
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActivo(a => Math.min(a + 1, total - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActivo(a => Math.max(a - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setActivo(0)
        break
      case 'End':
        e.preventDefault()
        setActivo(total - 1)
        break
      case 'Enter': {
        e.preventDefault()
        const o = conTodas[activo]
        if (o) escoger(o.valor === TODAS ? null : o.valor)
        break
      }
      case 'Escape':
        e.preventDefault()
        cerrar(true)
        break
    }
  }

  const idOpcion = (i: number) => `${idBase}-opt-${i}`
  const activoId = conTodas[activo] ? idOpcion(activo) : undefined

  return (
    <div ref={contenedor} onBlur={alPerderFoco} className="relative min-w-[13rem] flex-1">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-white/70">
        {etiqueta}
      </div>
      <button
        ref={boton}
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
        <span aria-hidden className="text-white/70">▾</span>
      </button>

      {abierto && (
        <div className="absolute z-40 mt-1 max-h-80 w-full overflow-auto rounded-lg
                        bg-panel-2 py-1 shadow-2xl ring-1 ring-white/15">
          {buscable && (
            <input
              ref={entrada}
              placeholder="Buscar…"
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setActivo(0) }}
              onKeyDown={manejarTeclado}
              role="combobox"
              aria-expanded={abierto}
              aria-controls={`${idBase}-lista`}
              aria-activedescendant={activoId}
              className="mx-2 mb-1 w-[calc(100%-1rem)] rounded bg-panel px-3 py-2
                         text-sm outline-none ring-1 ring-white/10"
            />
          )}
          <ul
            ref={lista}
            id={`${idBase}-lista`}
            role="listbox"
            tabIndex={buscable ? -1 : 0}
            onKeyDown={buscable ? undefined : manejarTeclado}
            aria-activedescendant={buscable ? undefined : activoId}
          >
            {conTodas.map((o, i) => {
              const esTodas = o.valor === TODAS
              const seleccionada = esTodas ? valor === null : o.valor === valor
              return (
                <li key={o.valor} id={idOpcion(i)} role="option" aria-selected={seleccionada}
                    // Evita que el mousedown le quite el foco al buscador antes
                    // de que el clic se procese (si no, el blur cerraría el
                    // panel un instante antes de escoger la opción).
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => escoger(esTodas ? null : o.valor)}
                    className={`cursor-pointer px-4 py-2.5 hover:bg-uasd-azul/40
                                ${esTodas ? 'text-white/60' : ''}
                                ${i === activo ? 'bg-uasd-azul/40' : ''}
                                ${!esTodas && seleccionada ? 'bg-uasd-azul/25' : ''}`}>
                  {o.texto}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
