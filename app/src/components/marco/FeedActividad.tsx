import { useEffect, useState } from 'react'
import { ahora } from '../../data/reloj'
import { mulberry32, hashSemilla } from '../../data/mock/aleatorio'
import { UNIDADES } from '../../data/mock/unidades'
import { SEMILLA_GLOBAL } from '../../data/mock/generador'

const PLANTILLAS = [
  'Récord de notas oficial emitido en {u}',
  'Solicitud de inscripción procesada en {u}',
  'Certificación académica entregada en {u}',
  'Trámite administrativo completado en {u}',
  'Consulta atendida en {u}',
  'Actividad de extensión registrada en {u}',
  'Expediente validado en {u}',
  'Legalización de título procesada en {u}',
]

const CANTIDAD = 8

interface Evento { clave: string; hora: string; texto: string }

/** Genera un evento a partir de un contador, de forma determinística. */
function evento(n: number, base: Date): Evento {
  const r = mulberry32(hashSemilla(`evento-${n}`) ^ SEMILLA_GLOBAL)
  const u = UNIDADES[Math.floor(r() * UNIDADES.length)]
  const plantilla = PLANTILLAS[Math.floor(r() * PLANTILLAS.length)]
  const d = new Date(base.getTime() - Math.floor(r() * 90) * 1000)
  return {
    clave: `${n}`,
    hora: d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
    texto: plantilla.replace('{u}', u.nombre),
  }
}

export function FeedActividad() {
  const [contador, setContador] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setContador(c => c + 1), 5000)
    return () => clearInterval(id)
  }, [])

  const base = ahora()
  const eventos = Array.from({ length: CANTIDAD }, (_, i) =>
    evento(contador + CANTIDAD - i, base))

  return (
    <div className="rounded-xl bg-panel-2 p-4 ring-1 ring-white/10">
      <div className="mb-3 text-xs uppercase tracking-wide text-white/50">
        Actividad institucional en vivo
      </div>
      <ul className="space-y-2">
        {eventos.map(e => (
          <li key={e.clave} className="flex gap-3 text-sm text-white/75">
            <span className="tabular-nums text-white/40">{e.hora}</span>
            <span className="truncate">{e.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
