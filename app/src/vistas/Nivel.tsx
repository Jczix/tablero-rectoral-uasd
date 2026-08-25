import { useMemo } from 'react'
import { mockDataSource as ds } from '../data/mock/MockDataSource'
import { useFiltros } from '../state/FiltrosContext'
import { porId, hijosDe, NIVELES } from '../data/mock/unidades'
import { Semaforo } from '../components/kpi/Semaforo'
import { Minigrafico } from '../components/kpi/Minigrafico'
import type { FilaUnidad } from '../data/source'

export function Nivel() {
  const { filtro, despachar } = useFiltros()

  // Qué se está listando: los hijos de la unidad/área escogida, o todo el nivel.
  const foco = filtro.unidadId ?? filtro.areaId
  const unidades = foco
    ? hijosDe(foco)
    : ds.getUnidadesDe(filtro.nivel, null)

  const titulo = foco
    ? porId(foco)!.nombre
    : NIVELES.find(n => n.id === filtro.nivel)?.nombre ?? 'Todas las unidades'

  // Una sola llamada a `getFilas` por render, no una por unidad: con hasta
  // 52 escuelas en un mismo nivel, invocar `ds.getFilas` 52 veces repetiría
  // 52 veces el recorrido de descendientes que hace `alcance()` internamente.
  // Se filtra el resultado a las unidades que interesan aquí (los hijos
  // directos), porque cuando el foco es una unidad con hijos, `getFilas`
  // también incluye a la unidad foco y a toda su descendencia recursiva.
  const filasTodas = useMemo(() => ds.getFilas(filtro), [filtro])
  const filas = useMemo(() => {
    const mapa = new Map(filasTodas.map(f => [f.unidad.id, f]))
    return unidades
      .map(u => mapa.get(u.id))
      .filter((f): f is FilaUnidad => f !== undefined)
  }, [filasTodas, unidades])

  // El total de indicadores por unidad depende del filtro vigente (categoría
  // y estado pueden reducirlo por debajo de 20), así que se calcula en vez de
  // asumir "20" fijo: de lo contrario el subtexto mentiría en cuanto el
  // Rector filtrara por categoría o por estado.
  const totalesPorUnidad = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const u of unidades) mapa.set(u.id, ds.getIndicadores(u.id, filtro).length)
    return mapa
  }, [unidades, filtro])

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <h2 className="mb-4 shrink-0 text-xl font-semibold">{titulo}</h2>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {filas.map(f => {
            const total = totalesPorUnidad.get(f.unidad.id) ?? 0
            return (
              <button key={f.unidad.id}
                onClick={() => despachar({
                  tipo: 'seleccionarUnidad', valor: f.unidad.id })}
                className="rounded-xl bg-panel-2 p-4 text-left ring-1 ring-white/10
                           hover:ring-uasd-azul-claro">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm leading-snug text-white/80">
                    {f.unidad.nombre}
                  </span>
                  <Semaforo estado={f.semaforo} />
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">
                  {f.cumplimiento.toFixed(1)}%
                  <span className="ml-1 text-xs font-normal text-white/40">en meta</span>
                </div>
                <div className="text-xs text-white/45">
                  {f.indicadoresEnRojo} de {total} indicadores incumplidos
                </div>
                <Minigrafico datos={f.serie} estado={f.semaforo} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
