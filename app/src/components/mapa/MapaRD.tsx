import type { KeyboardEvent } from 'react'
import { PATH_RD, ANCHO, ALTO, proyectar } from '../../data/mapa-rd'
import { mockDataSource as ds } from '../../data/mock/MockDataSource'
import { useFiltros } from '../../state/FiltrosContext'
import { COLOR } from '../kpi/Semaforo'
import { formatear, formatearCompacto } from '../kpi/formato'

const RADIO_MIN = 7
const RADIO_MAX = 26

/**
 * Construye la función de radio a partir del rango real de matrícula
 * (estudiantes, no miles) de las unidades territoriales que se están
 * dibujando, con una escala LOGARÍTMICA en vez de raíz cuadrada.
 *
 * La raíz cuadrada no basta: entre Sede Central (118 000 estudiantes) y el
 * subcentro más pequeño (100) hay casi tres órdenes de magnitud, y bajo
 * raíz cuadrada esa distancia sigue dominando tanto el rango que los 12
 * subcentros —apretados entre 100 y 220 estudiantes— quedaban a menos de
 * un pixel de diferencia entre sí (7.000 frente a 7.275), indistinguibles
 * en pantalla pese a cumplir *técnicamente* "el mayor es mayor que el
 * menor". El logaritmo comprime el extremo alto sin aplastar el bajo:
 * `log1p` sobre el conteo real de estudiantes separa Pedernales (~7) de
 * Verón Punta Cana (~9), y dentro de esa misma escala los centros (varios
 * cientos a ~2 200 estudiantes) y los recintos (miles a decenas de miles)
 * siguen quedando claramente por encima, con Sede Central en el techo.
 */
function crearRadio(pesos: number[]) {
  const logs = pesos.map(p => Math.log1p(p * 1000))
  const minLog = Math.min(...logs)
  const maxLog = Math.max(...logs)
  const rango = maxLog - minLog
  return (peso: number) => {
    if (rango === 0) return (RADIO_MIN + RADIO_MAX) / 2
    const t = (Math.log1p(peso * 1000) - minLog) / rango
    return RADIO_MIN + t * (RADIO_MAX - RADIO_MIN)
  }
}

export function MapaRD({ alto = '100%' }: { alto?: string | number }) {
  const { filtro, despachar } = useFiltros()
  const filas = ds.getTerritoriales()
  const hayFoco = filtro.unidadId !== null
  const radio = crearRadio(filas.map(f => f.unidad.peso))

  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} style={{ height: alto, width: '100%' }}
         role="group" aria-label="Red territorial de la UASD">
      <path d={PATH_RD} fill="#14263A" stroke="#2C4B6B" strokeWidth={1.2} />

      {filas.map(f => {
        const [x, y] = proyectar(f.unidad.coords![0], f.unidad.coords![1])
        const activo = filtro.unidadId === f.unidad.id
        const atenuado = hayFoco && !activo
        const etiqueta =
          `${f.unidad.nombre}. ${formatearCompacto(f.unidad.peso * 1000)} estudiantes. ` +
          `${formatear(f.cumplimiento, 'porcentaje')} de sus indicadores en meta.`

        const activar = () => despachar({ tipo: 'seleccionarUnidad', valor: f.unidad.id })
        const alTeclado = (e: KeyboardEvent<SVGGElement>) => {
          if (e.key === 'Enter') {
            activar()
          } else if (e.key === ' ') {
            e.preventDefault()   // evita el desplazamiento de la página
            activar()
          }
        }

        return (
          <g key={f.unidad.id} role="button" aria-label={etiqueta} tabIndex={0}
             className="cursor-pointer"
             opacity={atenuado ? 0.28 : 1}
             onClick={activar}
             onKeyDown={alTeclado}>
            <circle cx={x} cy={y} r={radio(f.unidad.peso)}
              fill={COLOR[f.semaforo]} fillOpacity={0.75}
              stroke={activo ? '#FFFFFF' : COLOR[f.semaforo]}
              strokeWidth={activo ? 3 : 1.5} />
            {f.unidad.peso >= 6 && (
              <text x={x} y={y - radio(f.unidad.peso) - 6}
                textAnchor="middle" fontSize={13} fill="#D8E4F0">
                {f.unidad.nombre.replace(/^(Recinto|Centro|Sub-?centro)\s+/i, '')}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
