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

// Seis eventos visibles, no ocho: la portada debe caber completa en
// 1920x1080 sin desplazamiento (ver Rectoral.test.tsx), y seis siguen
// cumpliendo el mínimo de "al menos 6" que exige FeedActividad.test.tsx.
const CANTIDAD = 6

// Antes el desfase era `Math.floor(r() * 90) * 1000`: nunca más de 90
// segundos atrás, así que los 8 eventos caían siempre en el último minuto y
// medio sin importar cuándo se mirara la pantalla — para una universidad de
// 186 mil estudiantes eso se lee como decorado, no como telemetría real.
// Se amplía la ventana a 6 horas.
const VENTANA_SEGUNDOS = 6 * 60 * 60

interface Evento { clave: string; ts: number; hora: string; texto: string }

/** Genera un evento a partir de un contador, de forma determinística. */
function evento(n: number, base: Date): Evento {
  const r = mulberry32(hashSemilla(`evento-${n}`) ^ SEMILLA_GLOBAL)
  const u = UNIDADES[Math.floor(r() * UNIDADES.length)]
  const plantilla = PLANTILLAS[Math.floor(r() * PLANTILLAS.length)]
  const ts = base.getTime() - Math.floor(r() * VENTANA_SEGUNDOS) * 1000
  return {
    clave: `${n}`,
    ts,
    hora: new Date(ts).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
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
  // Ordenado de más reciente a más antiguo: sin esto, el orden de la lista
  // era el del contador de generación, no el de la hora real del suceso, y
  // se leía como una lista desordenada en vez de una traza cronológica.
  const eventos = Array.from({ length: CANTIDAD }, (_, i) =>
    evento(contador + CANTIDAD - i, base)).sort((a, b) => b.ts - a.ts)

  return (
    <div data-testid="feed-actividad"
         className="h-full overflow-hidden rounded-xl bg-panel-2 p-3 ring-1 ring-white/10">
      <div className="mb-2 text-xs uppercase tracking-wide text-white/70">
        Actividad institucional en vivo
      </div>
      <ul className="space-y-1.5">
        {eventos.map(e => (
          <li key={e.clave} className="flex gap-3 text-sm text-white/75">
            <span className="tabular-nums text-white/70">{e.hora}</span>
            <span className="truncate">{e.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
