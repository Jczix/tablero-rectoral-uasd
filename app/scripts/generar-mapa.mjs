// Genera src/data/mapa-rd.ts a partir del atlas mundial empaquetado en node_modules.
// Se ejecuta una sola vez; su salida se comitea. No hay red en tiempo de ejecución.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { feature } from 'topojson-client'
import { geoMercator, geoPath } from 'd3-geo'

const require = createRequire(import.meta.url)
const atlas = JSON.parse(
  readFileSync(require.resolve('world-atlas/countries-10m.json'), 'utf8'))

const paises = feature(atlas, atlas.objects.countries)
const rd = paises.features.find(f => String(f.id) === '214')   // ISO numérico de RD
if (!rd) throw new Error('No se encontró República Dominicana (id 214) en el atlas')

// El lienzo se ajusta a la caja real de la geometría (más un margen), en vez
// de un tamaño fijo con el país centrado y sobrando espacio a los lados: se
// mide primero la relación de aspecto real del contorno proyectado y luego
// se dimensiona el lienzo para que el país lo llene margen a margen.
const MARGEN = 24
const ALTO_CONTENIDO = 720
const proyMuestra = geoMercator().fitSize([1000, 1000], rd)
const [[bx0, by0], [bx1, by1]] = geoPath(proyMuestra).bounds(rd)
const aspecto = (bx1 - bx0) / (by1 - by0)
const ANCHO_CONTENIDO = Math.round(ALTO_CONTENIDO * aspecto)

const ANCHO = ANCHO_CONTENIDO + MARGEN * 2
const ALTO = ALTO_CONTENIDO + MARGEN * 2
const proy = geoMercator().fitExtent([[MARGEN, MARGEN], [ANCHO - MARGEN, ALTO - MARGEN]], rd)
const d = geoPath(proy)(rd)

const [tx, ty] = proy.translate()
const k = proy.scale()
const [rot] = proy.rotate()

// Puntos de referencia para que el test verifique que la reimplementación
// de la proyección coincide exactamente con la de d3.
const MUESTRAS = [
  [-69.90, 18.47], [-70.70, 19.45], [-71.10, 18.21],
  [-68.41, 18.60], [-71.85, 18.49], [-70.53, 19.22],
]
const REFERENCIAS = MUESTRAS.map(([lon, lat]) => {
  const [x, y] = proy([lon, lat])
  return { lon, lat, x, y }
})

const salida = `// ARCHIVO GENERADO por scripts/generar-mapa.mjs — no editar a mano.
// Fuente: world-atlas/countries-10m.json (dominio público, Natural Earth).
export const ANCHO = ${ANCHO}
export const ALTO = ${ALTO}
export const PATH_RD = ${JSON.stringify(d)}

const K = ${k}
const TX = ${tx}
const TY = ${ty}
const ROT = ${rot}
const GRADOS = Math.PI / 180

/** Reimplementación de la proyección Mercator de d3 con los parámetros ya ajustados. */
export function proyectar(lon: number, lat: number): [number, number] {
  const lambda = (lon + ROT) * GRADOS
  const phi = lat * GRADOS
  const x = TX + K * lambda
  const y = TY - K * Math.log(Math.tan(Math.PI / 4 + phi / 2))
  return [x, y]
}

export const REFERENCIAS = ${JSON.stringify(REFERENCIAS)}
`
writeFileSync('src/data/mapa-rd.ts', salida)
console.log('Generado src/data/mapa-rd.ts —', d.length, 'caracteres de trazado')
