import { ANCLAS } from '../data/anclas'
import { mockDataSource as ds } from '../data/mock/MockDataSource'
import { useFiltros } from '../state/FiltrosContext'
import { TarjetaKPI } from '../components/kpi/TarjetaKPI'
import { Semaforo } from '../components/kpi/Semaforo'
import { Minigrafico } from '../components/kpi/Minigrafico'
import { MapaRD } from '../components/mapa/MapaRD'
import { GraficoBarras } from '../components/graficos/GraficoBarras'
import { FeedActividad } from '../components/marco/FeedActividad'
import { formatearCompacto, formatear } from '../components/kpi/formato'
import { clasificar } from '../data/mock/generador'

const VICERRECTORIAS = ['vic-docente', 'vic-admin', 'vic-invpos', 'vic-extension']

export function Rectoral() {
  const { filtro, despachar } = useFiltros()
  const resumen = ds.getResumen(filtro)
  const irA = (unidadId: string) =>
    despachar({ tipo: 'seleccionarUnidad', valor: unidadId })

  const kpis = [
    { titulo: 'Matrícula total', valor: formatearCompacto(ANCLAS.matriculaTotal),
      detalle: 'Estudiantes activos', estado: 'verde' as const },
    { titulo: 'Nuevo ingreso', valor: formatearCompacto(ANCLAS.nuevoIngresoAnual),
      detalle: 'Incorporados este año', estado: 'verde' as const },
    { titulo: 'Egresados del año', valor: formatearCompacto(ANCLAS.egresadosAnual),
      detalle: 'Investiduras procesadas', estado: 'ambar' as const },
    { titulo: 'Ejecución presupuestaria',
      valor: `${ANCLAS.ejecucionPresupuestariaPct}%`,
      detalle: formatear(ANCLAS.presupuestoAnualRD, 'moneda'),
      estado: clasificar(ANCLAS.ejecucionPresupuestariaPct) },
    { titulo: 'Cumplimiento POA', valor: `${ANCLAS.cumplimientoPoaPct}%`,
      detalle: `${resumen.totalIndicadores.toLocaleString('en-US')} indicadores`,
      estado: clasificar(ANCLAS.cumplimientoPoaPct) },
    { titulo: 'Satisfacción de usuarios',
      valor: `${ANCLAS.satisfaccionGeneralPct}%`,
      detalle: 'Promedio institucional',
      estado: clasificar(ANCLAS.satisfaccionGeneralPct) },
  ]

  return (
    <div className="grid gap-4 p-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        {kpis.map(k => <TarjetaKPI key={k.titulo} {...k} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
        <div className="rounded-xl bg-panel-2 p-4 ring-1 ring-white/10">
          <div className="mb-2 text-xs uppercase tracking-wide text-white/50">
            Red territorial
          </div>
          <MapaRD alto={420} />
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            {VICERRECTORIAS.map(id => {
              // Se busca explícitamente la fila cuyo `unidad.id` coincide con
              // `id`, en vez de asumir `ds.getFilas({ ...filtro, unidadId: id
              // })[0]`. Aunque `alcance()` en MockDataSource coloca hoy la
              // propia unidad primero (así que `[0]` también funcionaría),
              // depender de ese orden es frágil: si `alcance` cambiara para
              // ordenar por otro criterio, `[0]` pasaría a devolver un
              // descendiente cualquiera en silencio. Buscar por id no
              // depende del orden interno.
              const filas = ds.getFilas({ ...filtro, unidadId: id })
              const f = filas.find(fila => fila.unidad.id === id) ?? filas[0]
              return (
                <button key={id} onClick={() => irA(id)}
                  className="rounded-xl bg-panel-2 p-4 text-left ring-1 ring-white/10
                             hover:ring-uasd-azul-claro">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm leading-snug text-white/80">
                      {f.unidad.nombre}
                    </span>
                    <Semaforo estado={f.semaforo} />
                  </div>
                  <div className="mt-2 text-3xl font-semibold tabular-nums">
                    {f.cumplimiento.toFixed(1)}%
                  </div>
                  <Minigrafico datos={f.serie} estado={f.semaforo} />
                </button>
              )
            })}
          </div>
          <FeedActividad />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <GraficoBarras titulo="Mejor desempeño" filas={resumen.mejores} onClic={irA} />
        <GraficoBarras titulo="Requieren atención" filas={resumen.enAlerta} onClic={irA} />
      </div>
    </div>
  )
}
