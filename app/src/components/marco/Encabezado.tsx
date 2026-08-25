import { useEffect, useState } from 'react'
import { ahora } from '../../data/reloj'
import escudo from '../../assets/escudo-uasd.png'

/** Período académico según el mes: la UASD opera en tres cuatrimestres. */
function periodoAcademico(d: Date): string {
  const m = d.getMonth() + 1
  const ciclo = m <= 4 ? 'Primer' : m <= 8 ? 'Segundo' : 'Tercer'
  return `${ciclo} cuatrimestre ${d.getFullYear()}`
}

/**
 * El reloj se aísla en su propio componente para que su tic de cada
 * segundo no vuelva a renderizar el resto del tablero (mapa, 3,160
 * indicadores). `Encabezado` mismo no lleva estado de reloj: solo delega
 * en `Reloj`, así que un re-render del reloj nunca se propaga hacia abajo
 * ni hacia arriba.
 */
function Reloj() {
  const [reloj, setReloj] = useState(ahora())
  useEffect(() => {
    const id = setInterval(() => setReloj(ahora()), 1000)
    return () => clearInterval(id)
  }, [])

  const fecha = reloj.toLocaleDateString('es-DO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const hora = reloj.toLocaleTimeString('es-DO', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  return (
    <div className="text-right">
      <div className="text-3xl font-semibold tabular-nums">{hora}</div>
      <div className="text-sm capitalize text-white/60">{fecha}</div>
    </div>
  )
}

export function Encabezado() {
  return (
    <header className="flex items-center gap-5 border-b border-white/10
                       bg-uasd-azul-oscuro px-6 py-4">
      <img src={escudo} alt="Escudo de la UASD" className="h-14 w-14 object-contain" />
      <div className="flex-1">
        <h1 className="text-2xl font-semibold leading-tight">
          Universidad Autónoma de Santo Domingo
        </h1>
        <p className="text-sm text-white/60">
          Tablero Rectoral de Indicadores · {periodoAcademico(ahora())}
        </p>
      </div>
      <Reloj />
    </header>
  )
}
