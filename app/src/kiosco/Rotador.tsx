import { useEffect, useRef, useState } from 'react'
import { useFiltros } from '../state/FiltrosContext'
import { BarraFiltros } from '../components/filtros/BarraFiltros'
import { Enrutador } from '../vistas/Enrutador'
import type { Accion } from '../state/filtros'

const INTERVALO_MS = 25_000

// Si nadie toca el mouse, el teclado ni la pantalla durante este plazo
// mientras el kiosco está detenido, se asume que quien se acercó ya se
// fue: el tablero debe seguir "vivo en la pared" y no quedar congelado
// para siempre a la espera de que alguien recuerde la tecla K.
const REANUDAR_INACTIVIDAD_MS = 3 * 60_000

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

  // Refleja `rotando` en una ref para que los manejadores de eventos (que
  // se suscriben una sola vez, ver más abajo) siempre lean el valor
  // vigente sin tener que resuscribirse en cada cambio.
  const rotandoRef = useRef(rotando)
  const temporizadorInactividadRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cambiarRotando = (valor: boolean) => {
    rotandoRef.current = valor
    setRotando(valor)
  }

  // Avance del ciclo. Depende solo de `rotando`: `despachar` es estable
  // (viene de useReducer) y no debe entrar en la lista de dependencias
  // del intervalo, o cada tick recrearía el temporizador sin necesidad.
  useEffect(() => {
    if (!rotando) return
    const id = setInterval(() => setPaso(p => (p + 1) % CICLO.length), INTERVALO_MS)
    return () => clearInterval(id)
  }, [rotando])

  // Aplica el estado de filtros de la parada actual. Se envuelve en la
  // acción 'kiosco' para que el reductor no la apile en el historial de
  // "Atrás": esas paradas son del ciclo automático, no del Rector, y tras
  // horas de rotación llenarían el historial de saltos que nadie pidió.
  // `despachar` es estable entre renders, así que incluirlo aquí no
  // reintroduce el bucle: el efecto solo se dispara cuando cambian `paso`
  // o `rotando`.
  useEffect(() => {
    if (rotando) despachar({ tipo: 'kiosco', accion: CICLO[paso] })
  }, [paso, rotando, despachar])

  // Toma de control, reanudación manual y reanudación automática por
  // inactividad.
  useEffect(() => {
    const limpiarTemporizadorInactividad = () => {
      if (temporizadorInactividadRef.current) {
        clearTimeout(temporizadorInactividadRef.current)
        temporizadorInactividadRef.current = null
      }
    }

    // Único punto de reanudación (tecla K o vencimiento de inactividad):
    // si quedara un temporizador pendiente de una detención anterior, hay
    // que cancelarlo aquí. Si no, dispararía más tarde sin que nadie
    // interactuara y el kiosco saltaría solo de vuelta a la portada en
    // mitad de una rotación ya reanudada — el propio bug que se está
    // corrigiendo.
    const reanudar = () => {
      limpiarTemporizadorInactividad()
      setPaso(0)
      cambiarRotando(true)
    }

    // Reinicia el plazo de inactividad cada vez que hay una interacción
    // mientras el kiosco está detenido; si vuelve a rotar, no hace falta
    // temporizador alguno.
    const programarReanudacionPorInactividad = () => {
      limpiarTemporizadorInactividad()
      if (!rotandoRef.current) {
        temporizadorInactividadRef.current = setTimeout(reanudar, REANUDAR_INACTIVIDAD_MS)
      }
    }

    const tomarControl = () => {
      cambiarRotando(false)
      programarReanudacionPorInactividad()
    }

    const alTeclado = (e: KeyboardEvent) => {
      // La tecla K cumple doble papel: alterna la rotación. Cualquier
      // otra tecla toma el control, igual que el mouse o el toque —
      // salvo que el foco esté dentro de la barra de filtros (un
      // desplegable buscable, por ejemplo), donde el Rector puede estar
      // tecleando para buscar una opción por texto. En ese caso no se
      // debe interpretar ninguna tecla, ni siquiera K, como comando del
      // kiosco: dejar pasar el evento sin tocar `rotando` ni el
      // temporizador de inactividad.
      const objetivo = e.target instanceof Element ? e.target : null
      const dentroDeFiltros = objetivo?.closest('[data-barra-filtros]') != null
      if (dentroDeFiltros) return
      if (e.key.toLowerCase() === 'k') {
        if (rotandoRef.current) { setPaso(0); tomarControl() } else reanudar()
      } else {
        tomarControl()
      }
    }

    window.addEventListener('mousemove', tomarControl)
    window.addEventListener('touchstart', tomarControl)
    window.addEventListener('keydown', alTeclado)
    return () => {
      window.removeEventListener('mousemove', tomarControl)
      window.removeEventListener('touchstart', tomarControl)
      window.removeEventListener('keydown', alTeclado)
      if (temporizadorInactividadRef.current) clearTimeout(temporizadorInactividadRef.current)
    }
  }, [])

  return (
    <>
      {rotando ? (
        <div role="progressbar" aria-live="polite"
          aria-label={`Vista ${paso + 1} de ${CICLO.length}`}
          aria-valuenow={paso + 1} aria-valuemin={1} aria-valuemax={CICLO.length}
          className="h-1 w-full bg-white/5">
          <div className="h-1 bg-uasd-azul-claro transition-all duration-500"
            style={{ width: `${((paso + 1) / CICLO.length) * 100}%` }} />
        </div>
      ) : (
        <>
          {/* Sin esta señal, nadie que no conozca el atajo sabría cómo
             devolver la pantalla a su rotación automática. En texto-xs
             era ilegible a la distancia de un TV de pared: es la única
             instrucción para salir del modo manual, así que necesita el
             tamaño de algo que se va a leer, no el de una nota al pie. */}
          <div className="bg-uasd-azul-claro/10 px-6 py-2 text-center text-lg
            font-medium uppercase tracking-wide text-uasd-azul-claro">
            Modo manual · pulse K para reanudar
          </div>
          <BarraFiltros />
        </>
      )}
      <main className="min-h-0 flex-1 overflow-hidden"><Enrutador /></main>
    </>
  )
}
