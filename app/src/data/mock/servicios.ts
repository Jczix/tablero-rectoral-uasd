import type { Semaforo } from '../tipos'
import { mulberry32, hashSemilla } from './aleatorio'
import { SEMILLA_GLOBAL } from './generador'

export interface Servicio {
  id: string
  nombre: string
  costoRD: number
  ventanilla: number
  enviaMescyt: boolean
}

/** DATOS REALES tomados de "Lista de Servicios 21082026.xlsx". */
const CRUDO: [string, number, number, boolean][] = [
  ['Récord de Notas Oficial', 200, 3, false],
  ['Récord de Notas Oficial (Legalizado)', 200, 3, true],
  ['Récord de Notas Interno', 30, 2, false],
  ['Carta de Última Materia', 150, 5, false],
  ['Carta de Finalización de Tesis', 50, 5, false],
  ['Carta de Finalización', 50, 5, false],
  ['Constancia de Graduado', 150, 5, false],
  ['Escala de Calificaciones o Equivalencia de Materia', 150, 2, false],
  ['Legalización de Títulos', 150, 5, false],
  ['Certificado de Título', 150, 5, false],
  ['Carta para Exequátur', 150, 5, false],
  ['Lista de Graduados', 500, 1, true],
  ['Carta de Anillo', 200, 5, false],
  ['Investiduras', 1855, 5, false],
  ['Firma de Documentos', 500, 1, false],
  ['Título de Reválida', 150, 5, false],
  ['Certificado de Título de Reválida', 1000, 5, true],
  ['Carta de Exequátur de Reválida', 1000, 5, true],
  ['Certificación de Programas', 150, 1, true],
  ['Corrección de Datos', 300, 1, false],
  ['Recuperación de Matrícula', 100, 1, false],
]

const idDe = (nombre: string) =>
  'svc-' + nombre.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const SERVICIOS: Servicio[] = CRUDO.map(([nombre, costoRD, ventanilla, mescyt]) => ({
  id: idDe(nombre), nombre, costoRD, ventanilla, enviaMescyt: mescyt,
}))

export interface MetricaServicio {
  solicitudes: number
  tiempoEmisionDias: number
  metaTiempoDias: number
  recaudacionRD: number
  semaforo: Semaforo
}

const cache = new Map<string, MetricaServicio>()

export function metricasServicio(id: string): MetricaServicio {
  const guardada = cache.get(id)
  if (guardada) return guardada

  const s = SERVICIOS.find(x => x.id === id)
  if (!s) throw new Error(`Servicio desconocido: ${id}`)

  const r = mulberry32(hashSemilla(id) ^ SEMILLA_GLOBAL)
  // Los servicios baratos son de alto volumen; los caros, de bajo volumen.
  const volumenBase = s.costoRD <= 200 ? 900 : s.costoRD <= 500 ? 260 : 90
  const solicitudes = Math.round(volumenBase * (0.55 + r() * 0.95))

  const metaTiempoDias = s.costoRD >= 1000 ? 10 : s.costoRD >= 200 ? 5 : 3
  const tiempoEmisionDias = Math.round(metaTiempoDias * (0.6 + r() * 0.95) * 10) / 10

  const razon = tiempoEmisionDias / metaTiempoDias
  const semaforo: Semaforo = razon <= 1 ? 'verde' : razon <= 1.25 ? 'ambar' : 'rojo'

  const m: MetricaServicio = {
    solicitudes, tiempoEmisionDias, metaTiempoDias,
    recaudacionRD: solicitudes * s.costoRD, semaforo,
  }
  cache.set(id, m)
  return m
}

export function cargaPorVentanilla(): { ventanilla: number; solicitudes: number }[] {
  const mapa = new Map<number, number>()
  for (const s of SERVICIOS) {
    const previo = mapa.get(s.ventanilla) ?? 0
    mapa.set(s.ventanilla, previo + metricasServicio(s.id).solicitudes)
  }
  return [...mapa.entries()]
    .map(([ventanilla, solicitudes]) => ({ ventanilla, solicitudes }))
    .sort((a, b) => a.ventanilla - b.ventanilla)
}
