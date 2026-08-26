import type { Indicador, CategoriaIndicador } from '../tipos'
import { UNIDADES } from './unidades'
import { inferirMetrica } from './metrica'
import { hashSemilla } from './aleatorio'
import {
  CONJUNTO_POR_ID, CENTRO, SUBCENTRO, ESCUELA, DIRECCION, ORGANISMO, RECINTO,
  type ConjuntoTextos,
} from './catalogo-textos'

// Resuelve el conjunto de 10+10 textos para una unidad: primero por id
// (unidades con texto propio transcrito del documento fuente), luego por
// tipo de unidad (centros/subcentros comparten un set común; el resto cae en
// un respaldo genérico redactado a mano). Ver task-3-report.md para el
// detalle de qué unidades quedaron en cada caso.
// Exportada solo para que las pruebas puedan verificar, unidad por unidad,
// que nunca devuelve un conjunto indefinido o incompleto (ver catalogo.test.ts).
export function conjuntoDe(unidadId: string, tipo: string): ConjuntoTextos {
  // 'sede-central' es de tipo 'rectoria' en el padrón (no 'recinto') pero no
  // tiene bloque propio en el documento fuente: se le da el set genérico de
  // recinto, por ser la sede de Santo Domingo (desviación autorizada, ver brief).
  if (unidadId === 'sede-central') return RECINTO

  const propio = CONJUNTO_POR_ID[unidadId]
  if (propio) return propio

  switch (tipo) {
    case 'centro': return CENTRO
    case 'subcentro': return SUBCENTRO
    case 'escuela': return ESCUELA
    case 'recinto': return RECINTO
    case 'organismo': return ORGANISMO
    default: return DIRECCION
  }
}

// Recorta la lista genérica a un tramo propio de la unidad: entre 6 y 10
// nombres por categoría, empezando en un desplazamiento también derivado del
// id (con vuelta al inicio). Sin esto, las 158 unidades tenían exactamente
// 20 indicadores y el "% en meta" solo podía caer en múltiplos de 5: en la
// tabla territorial, 35 unidades repartidas entre ~6 valores posibles se
// veían clonadas. Con denominadores de 12 a 20, cada unidad da una cifra
// propia (76.9%, 70.6%, 84.2%...). Las unidades con texto transcrito del
// documento fuente NO se recortan: su lista es la real.
function tramo(nombres: string[], unidadId: string, categoria: string): string[] {
  const n = 6 + (hashSemilla(`${unidadId}::${categoria}::n`) % 5)
  const inicio = hashSemilla(`${unidadId}::${categoria}::o`) % nombres.length
  return Array.from({ length: Math.min(n, nombres.length) },
    (_, i) => nombres[(inicio + i) % nombres.length])
}

export const INDICADORES: Indicador[] = UNIDADES.flatMap(u => {
  const c = conjuntoDe(u.id, u.tipo)
  // La Sede Central usa el set genérico de recinto (sin bloque propio en
  // el documento fuente): se recorta como cualquier genérica.
  const conTextoPropio = CONJUNTO_POR_ID[u.id] !== undefined

  const construir = (lista: string[], categoria: CategoriaIndicador) => {
    const nombres = conTextoPropio ? lista : tramo(lista, u.id, categoria)
    return nombres.map((plantilla, i): Indicador => {
      const nombre = plantilla.replace('{nombre}', u.nombre)
      return {
        id: `${u.id}::${categoria}::${i + 1}`,
        unidadId: u.id,
        nombre,
        categoria,
        ...inferirMetrica(nombre),
      }
    })
  }

  return [...construir(c.servicio, 'servicio'), ...construir(c.proceso, 'proceso')]
})

const porUnidad = new Map<string, Indicador[]>()
for (const i of INDICADORES) {
  const lista = porUnidad.get(i.unidadId) ?? []
  lista.push(i)
  porUnidad.set(i.unidadId, lista)
}

export const indicadoresDe = (unidadId: string): Indicador[] =>
  porUnidad.get(unidadId) ?? []
