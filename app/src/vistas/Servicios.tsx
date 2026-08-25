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
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4 overflow-hidden p-6">
      <div>
        <h2 className="text-2xl font-semibold">
          Servicios de Registro Universitario
        </h2>
        <p className="text-xs text-white/45">
          Catálogo, costos y ventanillas: datos reales de la matriz institucional de
          servicios. Volúmenes y tiempos: simulados para la demostración.
        </p>
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
          <h3 className="shrink-0 px-4 pt-3 text-xs uppercase tracking-wide text-white/50">
            Catálogo de servicios · {filas.length}
          </h3>
          <div className="relative min-h-0 flex-1 p-2">
            <div ref={scrollRef} className="h-full overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-panel-2 text-xs uppercase
                                  tracking-wide text-white/60">
                  <tr className="border-b border-white/10">
                    <th scope="col" className="px-4 py-3 text-left font-medium">Servicio</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Costo</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Ventanilla</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Solicitudes</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Recaudación</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Emisión</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map(({ servicio, m }) => (
                    <tr key={servicio.id} className="border-b border-white/5">
                      <td className="px-4 py-2.5">{servicio.nombre}</td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {formatear(servicio.costoRD, 'moneda')}
                      </td>
                      <td className="px-4 py-2.5 text-white/55">{servicio.ventanilla}</td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {m.solicitudes.toLocaleString('en-US')}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {formatear(m.recaudacionRD, 'moneda')}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {formatear(m.tiempoEmisionDias, 'dias')}
                        <span className="text-white/40">
                          {` / meta ${m.metaTiempoDias}`}
                        </span>
                      </td>
                      <td className="px-4 py-2.5"><Semaforo estado={m.semaforo} /></td>
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
          <div className="mb-3 shrink-0 text-xs uppercase tracking-wide text-white/50">
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
