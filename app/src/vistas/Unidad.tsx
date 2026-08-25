import { useEffect, useRef, useState } from 'react'
import { mockDataSource as ds } from '../data/mock/MockDataSource'
import { useFiltros } from '../state/FiltrosContext'
import { porId, ancestrosDe } from '../data/mock/unidades'
import { TarjetaIndicador } from '../components/kpi/TarjetaIndicador'
import { GraficoSerie } from '../components/graficos/GraficoSerie'
import { EstadoVacio } from '../components/marco/EstadoVacio'
import type { CategoriaIndicador } from '../data/tipos'

/** Selector de elementos que el navegador considera enfocables por Tab. */
const SELECTOR_ENFOCABLES =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), ' +
  'select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Unidad() {
  const { filtro } = useFiltros()
  const [abierto, setAbierto] = useState<string | null>(null)
  const cerrarBotonRef = useRef<HTMLButtonElement>(null)
  const disparadorRef = useRef<HTMLElement | null>(null)
  const dialogoRef = useRef<HTMLDivElement>(null)

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

  // Trampa de foco: mientras el diálogo está abierto, Tab y Shift+Tab deben
  // ciclar solo entre sus propios elementos enfocables. Sin esto, Tab se
  // escapaba hacia un chip de la barra de filtros oculto detrás del velo, y
  // Shift+Tab saltaba a una tarjeta de la rejilla de fondo: el velo bloquea
  // el clic pero no el foco por teclado si no se intercepta explícitamente.
  useEffect(() => {
    if (!detalle) return
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setAbierto(null); return }
      if (e.key !== 'Tab') return
      const raiz = dialogoRef.current
      if (!raiz) return
      const enfocables = Array.from(raiz.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES))
      if (!enfocables.length) { e.preventDefault(); return }
      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]
      const activo = document.activeElement
      if (e.shiftKey && activo === primero) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && (activo === ultimo || !raiz.contains(activo))) {
        e.preventDefault()
        primero.focus()
      }
    }
    document.addEventListener('keydown', alTeclado)
    return () => document.removeEventListener('keydown', alTeclado)
  }, [detalle])

  if (!u) return null

  const ruta = [...ancestrosDe(u.id)].reverse().map(a => a.nombre).join(' › ')

  // El diálogo respeta el período vigente: 'Mes actual' no define ninguna
  // ventana de agregación, así que conserva el histórico completo de 24
  // meses como contexto; trimestre/semestre/año hacen zoom sobre su ventana;
  // 'comparativo' superpone el año en curso y el anterior.
  const serieDetalle = detalle
    ? ds.getSeriePeriodo(detalle.id, filtro)
    : { serie: [], previa: undefined }
  const rotuloSerie = filtro.periodo === 'comparativo'
    ? 'Año en curso frente al anterior'
    : `Serie de los últimos ${serieDetalle.serie.length} meses`

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
        {indicadores.length === 0 ? (
          <EstadoVacio que="indicador" ambito="esta unidad"
            estado={filtro.estado} categoria={filtro.categoria} />
        ) : (
          <>
            {seccion('servicio', 'Indicadores de Servicio')}
            {seccion('proceso', 'Indicadores de Proceso')}
          </>
        )}
      </div>

      {detalle && (
        <div ref={dialogoRef} role="dialog" aria-modal="true" aria-label={detalle.nombre}
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
            <p className="mb-4 text-xs text-white/70">
              {rotuloSerie} · {u.nombre}
            </p>
            <GraficoSerie serie={serieDetalle.serie} previa={serieDetalle.previa}
              tipoMetrica={detalle.tipoMetrica} />
          </div>
        </div>
      )}
    </div>
  )
}
