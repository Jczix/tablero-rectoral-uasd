import { useEffect, useRef, useState } from 'react'
import { mockDataSource as ds } from '../data/mock/MockDataSource'
import { useFiltros } from '../state/FiltrosContext'
import { porId, ancestrosDe } from '../data/mock/unidades'
import { TarjetaIndicador } from '../components/kpi/TarjetaIndicador'
import { GraficoSerie } from '../components/graficos/GraficoSerie'
import type { CategoriaIndicador } from '../data/tipos'

export function Unidad() {
  const { filtro } = useFiltros()
  const [abierto, setAbierto] = useState<string | null>(null)
  const cerrarBotonRef = useRef<HTMLButtonElement>(null)
  const disparadorRef = useRef<HTMLElement | null>(null)

  const u = filtro.unidadId ? porId(filtro.unidadId) : undefined
  const indicadores = u ? ds.getIndicadores(u.id, filtro) : []
  const detalle = abierto
    ? indicadores.find(i => i.id === abierto) ?? null : null

  // Foco: al abrir el diálogo, el foco entra en él (el botón "Cerrar"); al
  // cerrarlo, vuelve al indicador que lo abrió, en vez de quedar perdido en
  // el <body>. Se corrigió exactamente este descuido en la Tarea 7.
  useEffect(() => {
    if (detalle) cerrarBotonRef.current?.focus()
    else disparadorRef.current?.focus()
  }, [detalle])

  useEffect(() => {
    if (!detalle) return
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(null)
    }
    document.addEventListener('keydown', alTeclado)
    return () => document.removeEventListener('keydown', alTeclado)
  }, [detalle])

  if (!u) return null

  const ruta = [...ancestrosDe(u.id)].reverse().map(a => a.nombre).join(' › ')

  const abrirIndicador = (indicadorId: string) => {
    // El elemento con foco al momento del clic es el propio botón de la
    // tarjeta: se guarda para devolverle el foco al cerrar el diálogo.
    disparadorRef.current = document.activeElement as HTMLElement
    setAbierto(indicadorId)
  }

  const seccion = (categoria: CategoriaIndicador, titulo: string) => {
    const lista = indicadores.filter(i => i.categoria === categoria)
    if (!lista.length) return null
    return (
      <section className="mt-6 first:mt-0">
        <h3 className="mb-3 text-xs uppercase tracking-wide text-white/50">{titulo}</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {lista.map(i => (
            <TarjetaIndicador key={i.id} indicador={i}
              punto={ds.getUltimo(i.id)!}
              serie={ds.getSerie(i.id).slice(-12).map(p => p.valor)}
              onClic={abrirIndicador} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="shrink-0 text-xs text-white/45">{ruta}</div>
      <h2 className="shrink-0 text-2xl font-semibold">{u.nombre}</h2>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {seccion('servicio', 'Indicadores de Servicio')}
        {seccion('proceso', 'Indicadores de Proceso')}
      </div>

      {detalle && (
        <div role="dialog" aria-modal="true" aria-label={detalle.nombre}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8">
          <div className="w-full max-w-4xl rounded-2xl bg-panel-2 p-6 ring-1 ring-white/15">
            <div className="mb-1 flex items-start justify-between gap-4">
              <h4 className="text-lg font-semibold">{detalle.nombre}</h4>
              <button ref={cerrarBotonRef} onClick={() => setAbierto(null)}
                className="rounded-lg px-3 py-1.5 text-sm text-white/60
                           ring-1 ring-white/15 hover:text-white">
                Cerrar
              </button>
            </div>
            <p className="mb-4 text-xs text-white/45">
              Serie de los últimos 24 meses · {u.nombre}
            </p>
            <GraficoSerie serie={ds.getSerie(detalle.id)}
              tipoMetrica={detalle.tipoMetrica} />
          </div>
        </div>
      )}
    </div>
  )
}
