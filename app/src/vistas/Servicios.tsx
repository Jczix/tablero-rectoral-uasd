import { useEffect, useRef, useState } from 'react'
import { SERVICIOS, metricasServicio, cargaPorVentanilla } from '../data/mock/servicios'
import { Semaforo } from '../components/kpi/Semaforo'
import { TarjetaKPI } from '../components/kpi/TarjetaKPI'
import { formatear, formatearCompacto } from '../components/kpi/formato'

export function Servicios() {
  const filas = SERVICIOS
    .map(s => ({ servicio: s, m: metricasServicio(s.id) }))
    .sort((a, b) => b.m.recaudacionRD - a.m.recaudacionRD)

  const totalSolicitudes = filas.reduce((a, f) => a + f.m.solicitudes, 0)
  const totalRecaudado = filas.reduce((a, f) => a + f.m.recaudacionRD, 0)
  const tiempoPromedio =
    filas.reduce((a, f) => a + f.m.tiempoEmisionDias, 0) / filas.length
  const carga = cargaPorVentanilla()
  const topeCarga = Math.max(...carga.map(c => c.solicitudes))

  // Señal de que la tabla tiene más filas de las que caben en pantalla: en un
  // televisor de pared nadie hace scroll para descubrirlo. El contador en el
  // título lo dice con el número exacto; el degradado al pie es el refuerzo
  // visual (mismo patrón que Nivel.tsx y Territorial.tsx).
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hayMasAbajo, setHayMasAbajo] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const comprobar = () => {
      setHayMasAbajo(el.scrollHeight - el.scrollTop - el.clientHeight > 4)
    }
    comprobar()
    el.addEventListener('scroll', comprobar)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(comprobar) : undefined
    ro?.observe(el)
    return () => {
      el.removeEventListener('scroll', comprobar)
      ro?.disconnect()
    }
  }, [filas.length])

  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-3 overflow-hidden p-5">
      <div>
        <h2 className="text-2xl font-semibold">
          Servicios de Registro Universitario
        </h2>
        {/* Única declaración en pantalla de dónde está la frontera entre lo
            real y lo simulado: es el argumento que sostiene esta vista ante
            el Rector, así que necesita jerarquía visual propia (recuadro con
            borde de acento, tamaño legible a distancia) en vez de una nota
            al pie apenas visible. Las dos mitades van en <span> separados
            para que el contraste "real" / "simulado" se note de un vistazo. */}
        <div className="mt-2 flex items-start gap-2 rounded-md border-l-4
                        border-uasd-azul-claro bg-white/5 py-1.5 pl-3 pr-3">
          <p className="text-sm leading-snug">
            <span className="font-semibold text-white">
              Catálogo, costos y ventanillas: datos reales de la matriz institucional
              de servicios.
            </span>
            {' '}
            <span className="text-white/55">
              Volúmenes y tiempos: simulados para la demostración.
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <TarjetaKPI titulo="Solicitudes del mes"
          valor={formatearCompacto(totalSolicitudes)}
          detalle={`${SERVICIOS.length} servicios en catálogo`} />
        <TarjetaKPI titulo="Recaudación del mes"
          valor={formatear(totalRecaudado, 'moneda')}
          detalle="Suma de aranceles cobrados" />
        <TarjetaKPI titulo="Tiempo promedio de emisión"
          valor={formatear(tiempoPromedio, 'dias')}
          detalle="Promedio ponderado del catálogo" />
        <TarjetaKPI titulo="Servicios fuera de meta"
          valor={String(filas.filter(f => f.m.semaforo === 'rojo').length)}
          detalle="Exceden su tiempo objetivo" />
      </div>

      <div className="grid min-h-0 gap-4 xl:grid-cols-[3fr_1fr]">
        <div className="flex flex-col overflow-hidden rounded-xl bg-panel-2 ring-1 ring-white/10">
          <h3 className="shrink-0 px-4 pt-2 text-xs uppercase tracking-wide text-white/70">
            Catálogo de servicios · {filas.length}
          </h3>
          <div className="relative min-h-0 flex-1 p-1">
            <div ref={scrollRef} className="h-full overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-panel-2 text-xs uppercase
                                  tracking-wide text-white/60">
                  <tr className="border-b border-white/10">
                    <th scope="col" className="px-4 py-2 text-left font-medium">Servicio</th>
                    <th scope="col" className="px-4 py-2 text-left font-medium">Costo</th>
                    <th scope="col" className="px-4 py-2 text-left font-medium">Ventanilla</th>
                    <th scope="col" className="px-4 py-2 text-left font-medium">Solicitudes</th>
                    <th scope="col" className="px-4 py-2 text-left font-medium">Recaudación</th>
                    <th scope="col" className="px-4 py-2 text-left font-medium">Emisión</th>
                    <th scope="col" className="px-4 py-2 text-left font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map(({ servicio, m }) => (
                    <tr key={servicio.id} className="border-b border-white/5">
                      <td className="px-4 py-1.5">
                        {servicio.nombre}
                        {servicio.enviaMescyt && (
                          // Dato real del documento fuente: qué certificaciones
                          // se envían al MESCYT. `aria-label` reemplaza el texto
                          // visible por una frase completa para lector de
                          // pantalla, en vez de anunciar solo la sigla.
                          <span
                            aria-label={`${servicio.nombre}: se envía al MESCYT`}
                            className="ml-2 inline-flex items-center rounded-full
                                      bg-uasd-azul-claro/15 px-1.5 py-0.5 text-[10px]
                                      font-medium uppercase tracking-wide text-uasd-azul-claro">
                            MESCYT
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-1.5 tabular-nums">
                        {formatear(servicio.costoRD, 'moneda')}
                      </td>
                      <td className="px-4 py-1.5 text-white/55">{servicio.ventanilla}</td>
                      <td className="px-4 py-1.5 tabular-nums">
                        {m.solicitudes.toLocaleString('en-US')}
                      </td>
                      <td className="px-4 py-1.5 tabular-nums">
                        {formatear(m.recaudacionRD, 'moneda')}
                      </td>
                      <td className="px-4 py-1.5 tabular-nums">
                        {formatear(m.tiempoEmisionDias, 'dias')}
                        <span className="text-white/70">
                          {` / meta ${m.metaTiempoDias}`}
                        </span>
                      </td>
                      <td className="px-4 py-1.5"><Semaforo estado={m.semaforo} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hayMasAbajo && (
              <div aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16
                           bg-gradient-to-t from-panel-2 to-transparent" />
            )}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl bg-panel-2 p-4 ring-1 ring-white/10">
          <div className="mb-3 shrink-0 text-xs uppercase tracking-wide text-white/70">
            Carga por ventanilla
          </div>
          <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto">
            {carga.map(c => (
              <li key={c.ventanilla}>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">{`Ventanilla ${c.ventanilla}`}</span>
                  <span className="tabular-nums text-white/60">
                    {c.solicitudes.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded bg-white/5">
                  <div className="h-2 rounded bg-uasd-azul-claro"
                    style={{ width: `${(c.solicitudes / topeCarga) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
