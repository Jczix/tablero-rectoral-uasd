import { useMemo } from 'react'
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

// Cuatro puestos por ranking, no cinco: la portada debe caber completa en
// 1920x1080 sin desplazamiento (ver el test "cabe en una pantalla de
// 1920x1080 sin desplazamiento" más abajo). Con cinco puestos por columna
// más el resto del contenido, la portada medía 1236px de alto contra 1080
// disponibles y los tres últimos puestos de cada ranking quedaban fuera de
// la pantalla.
const PUESTOS_POR_RANKING = 4

/**
 * Semáforo de un KPI institucional CONTRA SU META, no contra el valor
 * crudo. `clasificar()` está calibrada 95/80 sobre el cumplimiento de un
 * indicador respecto a su meta; aplicarla directamente a un porcentaje sin
 * meta (78.4% de ejecución, 84.6% de POA, 82.1% de satisfacción) declaraba
 * los tres en rojo o ámbar y dejaba la fila superior del tablero sin un
 * solo verde. Las metas viven en `anclas.ts`, el punto único de corrección.
 */
const contraMeta = (valor: number, meta: number) => clasificar((valor / meta) * 100)

export function Rectoral() {
  const { filtro, despachar } = useFiltros()
  const irA = (unidadId: string) =>
    despachar({ tipo: 'seleccionarUnidad', valor: unidadId })

  // Recorrer las 158 unidades en cada render (una vez para el resumen y
  // una vez por cada una de las 4 vicerrectorías) es trabajo desperdiciado
  // cuando el filtro no cambió; se memoiza contra `filtro`.
  const resumen = useMemo(() => ds.getResumen(filtro), [filtro])

  const filasVicerrectorias = useMemo(
    () => VICERRECTORIAS.map(id => {
      // Se busca explícitamente la fila cuyo `unidad.id` coincide con `id`,
      // en vez de asumir `ds.getFilas({ ...filtro, unidadId: id })[0]`.
      // Aunque `alcance()` en MockDataSource coloca hoy la propia unidad
      // primero (así que `[0]` también funcionaría), depender de ese orden
      // es frágil: si `alcance` cambiara para ordenar por otro criterio,
      // `[0]` pasaría a devolver un descendiente cualquiera en silencio.
      // Buscar por id no depende del orden interno.
      const filas = ds.getFilas({ ...filtro, unidadId: id })
      return filas.find(fila => fila.unidad.id === id) ?? filas[0]
    }),
    [filtro],
  )

  const kpis = [
    // Matrícula total y Nuevo ingreso son conteos absolutos: la UASD no
    // tiene una "meta" de matrícula definida en `ANCLAS`, así que no
    // llevan semáforo. Antes decían 'verde' fijo, lo que afirmaba un
    // cumplimiento de meta inexistente en pantalla permanentemente.
    { titulo: 'Matrícula total', valor: formatearCompacto(ANCLAS.matriculaTotal),
      detalle: 'Estudiantes activos' },
    { titulo: 'Nuevo ingreso', valor: formatearCompacto(ANCLAS.nuevoIngresoAnual),
      detalle: 'Incorporados este año' },
    { titulo: 'Egresados del año', valor: formatearCompacto(ANCLAS.egresadosAnual),
      detalle: 'Investiduras procesadas' },
    { titulo: 'Ejecución presupuestaria',
      valor: `${ANCLAS.ejecucionPresupuestariaPct}%`,
      detalle: `${formatear(ANCLAS.presupuestoAnualRD, 'moneda')} · meta `
        + `${ANCLAS.metaEjecucionPresupuestariaPct}%`,
      estado: contraMeta(
        ANCLAS.ejecucionPresupuestariaPct, ANCLAS.metaEjecucionPresupuestariaPct) },
    { titulo: 'Cumplimiento POA', valor: `${ANCLAS.cumplimientoPoaPct}%`,
      detalle: `${resumen.totalIndicadores.toLocaleString('en-US')} indicadores · meta `
        + `${ANCLAS.metaCumplimientoPoaPct}%`,
      estado: contraMeta(
        ANCLAS.cumplimientoPoaPct, ANCLAS.metaCumplimientoPoaPct) },
    { titulo: 'Satisfacción de usuarios',
      valor: `${ANCLAS.satisfaccionGeneralPct}%`,
      detalle: `Promedio institucional · meta ${ANCLAS.metaSatisfaccionGeneralPct}%`,
      estado: contraMeta(
        ANCLAS.satisfaccionGeneralPct, ANCLAS.metaSatisfaccionGeneralPct) },
  ]

  return (
    <div data-testid="portada-rectoral"
         className="grid h-full grid-rows-[auto_1fr_auto] gap-3 overflow-hidden p-3">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        {kpis.map(k => <TarjetaKPI key={k.titulo} {...k} />)}
      </div>

      <div className="grid min-h-0 gap-3 xl:grid-cols-[3fr_2fr]">
        <div className="flex min-h-0 flex-col rounded-xl bg-panel-2 p-3 ring-1 ring-white/10">
          <div className="mb-1 shrink-0 text-xs uppercase tracking-wide text-white/50">
            Red territorial
          </div>
          <div className="min-h-0 flex-1">
            <MapaRD alto="100%" />
          </div>
        </div>

        <div className="grid min-h-0 grid-rows-[auto_1fr] gap-3">
          <div className="grid grid-cols-2 gap-3">
            {filasVicerrectorias.map(f => (
              <button key={f.unidad.id} onClick={() => irA(f.unidad.id)}
                className="rounded-xl bg-panel-2 p-3 text-left ring-1 ring-white/10
                           hover:ring-uasd-azul-claro">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm leading-snug text-white/80">
                    {f.unidad.nombre}
                  </span>
                  <Semaforo estado={f.semaforo} />
                </div>
                <div className="mt-1 text-3xl font-semibold tabular-nums">
                  {f.cumplimiento.toFixed(1)}%
                  <span className="ml-1 text-xs font-normal text-white/40">en meta</span>
                </div>
                <Minigrafico datos={f.serie} estado={f.semaforo} />
              </button>
            ))}
          </div>
          <div className="min-h-0">
            <FeedActividad />
          </div>
        </div>
      </div>

      <div className="grid min-h-0 gap-3 xl:grid-cols-2">
        <GraficoBarras titulo="Mejor desempeño"
          filas={resumen.mejores.slice(0, PUESTOS_POR_RANKING)} onClic={irA} />
        <GraficoBarras titulo="Requieren atención"
          filas={resumen.enAlerta.slice(0, PUESTOS_POR_RANKING)} onClic={irA} />
      </div>
    </div>
  )
}
