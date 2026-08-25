import { useEffect, useMemo, useRef, useState } from 'react'
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

  const tituloBase = foco
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

  // El filtro de Estado filtra lo que se está LISTANDO, y aquí se listan
  // unidades, no indicadores: "Incumplido" debe mostrar solo las unidades
  // cuyo propio semáforo es rojo, cada una con su % en meta calculado sobre
  // sus indicadores completos (eso ya lo garantiza `filaDe` en
  // MockDataSource, que ignora `estado` en su cálculo). Filtrar antes, a
  // nivel de indicador, hacía que el % en meta de CUALQUIER unidad diera
  // 0.0% en cuanto se filtraba por "Incumplido" (el subconjunto ya filtrado
  // a rojo nunca puede tener nada "en meta"). Aquí se filtra DESPUÉS, sobre
  // la lista ya calculada de filas.
  const filasVisibles = useMemo(
    () => filtro.estado === 'todos' ? filas : filas.filter(f => f.semaforo === filtro.estado),
    [filas, filtro.estado],
  )

  // El total de indicadores por unidad (para el subtexto de incumplidos)
  // debe coincidir con la misma base que usa `indicadoresEnRojo`: categoría
  // sí lo reduce (10 en vez de 20), pero estado NO debe alterarlo, por la
  // misma razón que no debe alterar el cálculo del % en meta.
  const totalesPorUnidad = useMemo(() => {
    const filtroCompleto = { ...filtro, estado: 'todos' as const }
    const mapa = new Map<string, number>()
    for (const u of unidades) mapa.set(u.id, ds.getIndicadores(u.id, filtroCompleto).length)
    return mapa
  }, [unidades, filtro])

  // Señal de que la rejilla tiene más contenido del que cabe en pantalla:
  // en un televisor de pared nadie va a desplazarse para descubrirlo. El
  // contador en el título ("· N unidades") ya lo dice con el número exacto;
  // el degradado en el pie es el refuerzo visual para cuando la última fila
  // visible termina limpia y parece completa.
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
    // jsdom (entorno de pruebas) no implementa ResizeObserver: se omite en
    // vez de fallar, la comprobación inicial ya cubre el caso de pruebas.
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(comprobar) : undefined
    ro?.observe(el)
    return () => {
      el.removeEventListener('scroll', comprobar)
      ro?.disconnect()
    }
  }, [filasVisibles])

  const titulo = `${tituloBase} · ${filasVisibles.length} `
    + (filasVisibles.length === 1 ? 'unidad' : 'unidades')

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <h2 className="mb-4 shrink-0 text-xl font-semibold">{titulo}</h2>
      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} className="h-full overflow-y-auto pr-1">
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
            {filasVisibles.map(f => {
              const total = totalesPorUnidad.get(f.unidad.id) ?? 0
              return (
                <button key={f.unidad.id}
                  onClick={() => despachar({
                    tipo: 'seleccionarUnidad', valor: f.unidad.id })}
                  className="rounded-xl bg-panel-2 p-3 text-left ring-1 ring-white/10
                             hover:ring-uasd-azul-claro">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm leading-snug text-white/80">
                      {f.unidad.nombre}
                    </span>
                    <Semaforo estado={f.semaforo} />
                  </div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums">
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
        {hayMasAbajo && (
          <div aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16
                       bg-gradient-to-t from-panel to-transparent" />
        )}
      </div>
    </div>
  )
}
