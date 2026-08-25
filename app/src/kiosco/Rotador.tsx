import { useEffect, useState } from 'react'
import { useFiltros } from '../state/FiltrosContext'
import { BarraFiltros } from '../components/filtros/BarraFiltros'
import { Enrutador } from '../vistas/Enrutador'
import type { Accion } from '../state/filtros'

const INTERVALO_MS = 25_000

/** Cada parada del ciclo es simplemente un estado de filtros: el
 * Enrutador decide qué vista corresponde según nivel/área/unidad
 * (ver `vistas/Enrutador.tsx`). Las siete paradas aterrizan así:
 * limpiar -> Rectoral, nivel 6 -> Territorial, dir-registro -> Servicios,
 * y las cuatro vicerrectorías -> Nivel (todas tienen unidades hijas). */
const CICLO: Accion[] = [
  { tipo: 'limpiar' },
  { tipo: 'nivel', valor: 6 },
  { tipo: 'seleccionarUnidad', valor: 'dir-registro' },
  { tipo: 'seleccionarUnidad', valor: 'vic-docente' },
  { tipo: 'seleccionarUnidad', valor: 'vic-admin' },
  { tipo: 'seleccionarUnidad', valor: 'vic-invpos' },
  { tipo: 'seleccionarUnidad', valor: 'vic-extension' },
]

export function Rotador() {
  const { despachar } = useFiltros()
  const [rotando, setRotando] = useState(true)
  const [paso, setPaso] = useState(0)

  // Avance del ciclo. Depende solo de `rotando`: `despachar` es estable
  // (viene de useReducer) y no debe entrar en la lista de dependencias
  // del intervalo, o cada tick recrearía el temporizador sin necesidad.
  useEffect(() => {
    if (!rotando) return
    const id = setInterval(() => setPaso(p => (p + 1) % CICLO.length), INTERVALO_MS)
    return () => clearInterval(id)
  }, [rotando])

  // Aplica el estado de filtros de la parada actual. `despachar` es
  // estable entre renders, así que incluirlo aquí no reintroduce el
  // bucle: el efecto solo se dispara cuando cambian `paso` o `rotando`.
  useEffect(() => {
    if (rotando) despachar(CICLO[paso])
  }, [paso, rotando, despachar])

  // Toma de control y reanudación.
  useEffect(() => {
    const tomarControl = () => setRotando(false)
    const alTeclado = (e: KeyboardEvent) => {
      // La tecla K cumple doble papel: alterna la rotación. Cualquier
      // otra tecla toma el control, igual que el mouse o el toque —
      // salvo que el foco esté dentro de la barra de filtros (un
      // desplegable, por ejemplo), donde el Rector puede estar
      // tecleando para buscar una opción por texto. En ese caso no se
      // debe interpretar ninguna tecla, ni siquiera K, como comando del
      // kiosco: dejar pasar el evento sin tocar `rotando`.
      const objetivo = e.target instanceof Element ? e.target : null
      const dentroDeFiltros = objetivo?.closest('[data-barra-filtros]') != null
      if (dentroDeFiltros) return
      if (e.key.toLowerCase() === 'k') { setPaso(0); setRotando(r => !r) }
      else tomarControl()
    }
    window.addEventListener('mousemove', tomarControl)
    window.addEventListener('touchstart', tomarControl)
    window.addEventListener('keydown', alTeclado)
    return () => {
      window.removeEventListener('mousemove', tomarControl)
      window.removeEventListener('touchstart', tomarControl)
      window.removeEventListener('keydown', alTeclado)
    }
  }, [])

  return (
    <>
      {rotando ? (
        <div role="progressbar"
          aria-label={`Vista ${paso + 1} de ${CICLO.length}`}
          aria-valuenow={paso + 1} aria-valuemin={1} aria-valuemax={CICLO.length}
          className="h-1 w-full bg-white/5">
          <div className="h-1 bg-uasd-azul-claro transition-all duration-500"
            style={{ width: `${((paso + 1) / CICLO.length) * 100}%` }} />
        </div>
      ) : (
        <BarraFiltros />
      )}
      <main className="min-h-0 flex-1 overflow-hidden"><Enrutador /></main>
    </>
  )
}
