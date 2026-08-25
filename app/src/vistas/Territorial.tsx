import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { mockDataSource as ds } from '../data/mock/MockDataSource'
import { useFiltros } from '../state/FiltrosContext'
import { MapaRD } from '../components/mapa/MapaRD'
import { Semaforo } from '../components/kpi/Semaforo'
import { formatearCompacto } from '../components/kpi/formato'
import type { FilaUnidad } from '../data/source'

// 'sede-central' es de tipo 'rectoria' (no 'recinto'): al no aparecer en este
// mapa cae en el `?? 'Sede'` de abajo, y los conteos de 4/18/12 cuadran con
// unidades.test.ts.
const ETIQUETA_TIPO: Record<string, string> = {
  recinto: 'Recinto', centro: 'Centro', subcentro: 'Subcentro',
}
const ORDEN_TIPO = ['recinto', 'centro', 'subcentro']

type Columna = 'nombre' | 'matricula' | 'cumplimiento'

// Dirección real de cada columna ordenable, tal como ordena el `sort` de
// abajo: 'nombre' agrupa por tipo y dentro de cada tipo ordena el nombre
// ascendente; 'matricula' y 'cumplimiento' siempre ordenan de mayor a menor.
// Se usa tanto para `aria-sort` (percibible por lector de pantalla) como
// para la flecha visual (percibible a distancia, donde la sutil diferencia
// de color entre `text-white` y `text-white/60` no basta).
const DIRECCION: Record<Columna, 'ascending' | 'descending'> = {
  nombre: 'ascending', matricula: 'descending', cumplimiento: 'descending',
}
const FLECHA: Record<'ascending' | 'descending', string> = { ascending: '▲', descending: '▼' }

export function Territorial() {
  const { filtro, despachar } = useFiltros()
  const [orden, setOrden] = useState<Columna>('nombre')

  const filas = [...ds.getTerritoriales(filtro)].sort((a, b) => {
    if (orden === 'cumplimiento') return b.cumplimiento - a.cumplimiento
    if (orden === 'matricula') return b.unidad.peso - a.unidad.peso
    const t = ORDEN_TIPO.indexOf(a.unidad.tipo) - ORDEN_TIPO.indexOf(b.unidad.tipo)
    return t !== 0 ? t : a.unidad.nombre.localeCompare(b.unidad.nombre, 'es')
  })

  const seleccionar = (id: string) => despachar({ tipo: 'seleccionarUnidad', valor: id })

  // Señal de que la tabla tiene más filas de las que caben en pantalla: en un
  // televisor de pared nadie hace scroll para descubrirlo. El contador en el
  // título lo dice con el número exacto; el degradado al pie es el refuerzo
  // visual (mismo patrón que Nivel.tsx en la Tarea 11).
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

  const encabezado = (col: Columna, texto: string) => {
    const activa = orden === col
    return (
      <th scope="col" className="px-4 py-3 text-left font-medium"
        aria-sort={activa ? DIRECCION[col] : undefined}>
        <button onClick={() => setOrden(col)}
          className={`hover:text-white ${activa ? 'text-white' : 'text-white/60'}`}>
          {texto}
          {activa && (
            <span aria-hidden className="ml-1">{FLECHA[DIRECCION[col]]}</span>
          )}
        </button>
      </th>
    )
  }

  return (
    <div className="grid h-full gap-4 overflow-hidden p-6 xl:grid-cols-[1fr_1fr]">
      <div className="flex flex-col overflow-hidden rounded-xl bg-panel-2 p-4 ring-1 ring-white/10">
        <h2 className="mb-2 shrink-0 text-xl font-semibold">Red territorial</h2>
        <div className="min-h-0 flex-1">
          <MapaRD alto="100%" />
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl bg-panel-2 ring-1 ring-white/10">
        <h2 className="shrink-0 px-4 pt-4 text-xl font-semibold">
          Unidades territoriales · {filas.length}
        </h2>
        <div className="relative min-h-0 flex-1 p-4">
          <div ref={scrollRef} className="h-full overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-panel-2 text-xs uppercase tracking-wide">
                <tr className="border-b border-white/10">
                  {encabezado('nombre', 'Unidad')}
                  <th scope="col" className="px-4 py-3 text-left font-medium text-white/60">
                    Tipo
                  </th>
                  {encabezado('matricula', 'Matrícula')}
                  {encabezado('cumplimiento', '% en meta')}
                  <th scope="col" className="px-4 py-3 text-left font-medium text-white/60">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f: FilaUnidad) => {
                  // `activa` (y el `aria-current`/resalte que dependen de
                  // ella) hoy no llega a verse en esta vista: las 35 unidades
                  // territoriales no tienen descendencia (`hijosDe` vacío),
                  // así que en cuanto `filtro.unidadId` apunta a cualquiera
                  // de ellas —sea por clic aquí, en el mapa, o eligiéndola en
                  // el desplegable "Unidad" de la barra de filtros, los tres
                  // pasan por el mismo `desdeUnidad` en state/filtros.ts— el
                  // Enrutador navega de inmediato a <Unidad />, antes de que
                  // Territorial vuelva a pintarse con el resalte puesto. Es
                  // una decisión de diseño confirmada en revisión: el clic
                  // siempre navega, igual que en el mapa, los rankings y la
                  // rejilla de nivel, y "Atrás" devuelve exactamente a esta
                  // tabla con las 35 unidades. Se deja el mecanismo (no es
                  // código muerto en el sentido de "nunca compila/ejecuta":
                  // si el día de mañana una unidad territorial gana
                  // descendencia, o el Enrutador cambia el orden de sus
                  // comprobaciones, empieza a verse sin tocar nada aquí) en
                  // vez de retirarlo por una lectura superficial de "no se
                  // usa". No eliminar sin revisar antes si alguna de esas
                  // dos condiciones cambió.
                  const activa = filtro.unidadId === f.unidad.id
                  const activar = () => seleccionar(f.unidad.id)
                  const alTeclado = (e: KeyboardEvent<HTMLTableRowElement>) => {
                    if (e.key === 'Enter') {
                      activar()
                    } else if (e.key === ' ') {
                      e.preventDefault()   // evita el desplazamiento de la página
                      activar()
                    }
                  }
                  // Sin esta etiqueta, un lector de pantalla que tabula hasta
                  // la fila solo anuncia el contenido de las celdas ("fila,
                  // Sede Central, Sede, 118 mil, 70.0%, En riesgo"), sin
                  // ninguna pista de que Enter la activa. Mismo criterio que
                  // en MapaRD.tsx: nombrar la unidad y decir qué hace la
                  // activación.
                  const etiqueta = `${f.unidad.nombre}. Abrir el detalle de esta unidad.`
                  return (
                    <tr key={f.unidad.id}
                      tabIndex={0}
                      aria-label={etiqueta}
                      aria-current={activa ? 'true' : undefined}
                      onClick={activar}
                      onKeyDown={alTeclado}
                      className={`cursor-pointer border-b border-white/5 outline-none
                        hover:bg-uasd-azul/25 focus-visible:bg-uasd-azul/25
                        focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40
                        ${activa ? 'bg-uasd-azul/25' : ''}`}>
                      <td className="px-4 py-2.5">{f.unidad.nombre}</td>
                      <td className="px-4 py-2.5 text-white/55">
                        {ETIQUETA_TIPO[f.unidad.tipo] ?? 'Sede'}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {formatearCompacto(f.unidad.peso * 1000)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {f.cumplimiento.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5"><Semaforo estado={f.semaforo} conEtiqueta /></td>
                    </tr>
                  )
                })}
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
    </div>
  )
}
