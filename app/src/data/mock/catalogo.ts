import type { Indicador, CategoriaIndicador } from '../tipos'
import { UNIDADES } from './unidades'
import { inferirMetrica } from './metrica'
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

export const INDICADORES: Indicador[] = UNIDADES.flatMap(u => {
  const c = conjuntoDe(u.id, u.tipo)

  const construir = (nombres: string[], categoria: CategoriaIndicador) =>
    nombres.map((plantilla, i): Indicador => {
      const nombre = plantilla.replace('{nombre}', u.nombre)
      return {
        id: `${u.id}::${categoria}::${i + 1}`,
        unidadId: u.id,
        nombre,
        categoria,
        ...inferirMetrica(nombre),
      }
    })

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
