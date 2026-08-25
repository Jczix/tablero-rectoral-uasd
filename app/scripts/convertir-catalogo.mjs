// Script de un solo uso: convierte fuentes/indicadores.json (94 bloques
// extraídos de los .docx/.xlsx originales) en el módulo TypeScript
// src/data/mock/catalogo-textos.ts, mapeando cada bloque a su unidad del
// padrón por nombre. Ver task-3-report.md para el detalle del mapeo.
//
// Uso: node app/scripts/convertir-catalogo.mjs
// No se ejecuta en la aplicación; su salida queda comiteada.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const raiz = path.resolve(__dirname, '..', '..')

const jsonPath = path.join(
  raiz, '.superpowers/sdd/2026-08-25-tablero-rectoral-uasd/fuentes/indicadores.json',
)
const salidaPath = path.join(raiz, 'app/src/data/mock/catalogo-textos.ts')

const fuente = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
const normalizar = (s) =>
  sinTildes(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')

// ---------- Réplica exacta de las listas de unidades.ts, solo para mapear ----------
const idEscuela = (nombre) =>
  'esc-' + sinTildes(nombre).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .split('-').slice(0, 2).join('-')

const FACULTADES = [
  ['fac-humanidades', 'Facultad de Humanidades'],
  ['fac-ciencias', 'Facultad de Ciencias'],
  ['fac-economicas', 'Facultad de Ciencias Económicas y Sociales'],
  ['fac-juridicas', 'Facultad de Ciencias Jurídicas y Políticas'],
  ['fac-ingenieria', 'Facultad de Ingeniería y Arquitectura'],
  ['fac-salud', 'Facultad de Ciencias de la Salud'],
  ['fac-artes', 'Facultad de Artes'],
  ['fac-agronomia', 'Facultad de Ciencias Agronómicas y Veterinarias'],
  ['fac-educacion', 'Facultad de Ciencias de la Educación'],
]

const ESCUELAS = [
  ['fac-humanidades', ['Comunicación Social', 'Filosofía', 'Idiomas', 'Letras',
    'Psicología', 'Historia y Antropología']],
  ['fac-ciencias', ['Biología', 'Física', 'Geografía', 'Informática', 'Matemáticas',
    'Microbiología y Parasitología', 'Química']],
  ['fac-economicas', ['Administración', 'Economía', 'Mercadotecnia', 'Estadística',
    'Sociología', 'Contabilidad', 'Turismo y Hotelería']],
  ['fac-juridicas', ['Derecho', 'Ciencias Políticas']],
  ['fac-ingenieria', ['Arquitectura', 'Ingeniería Electromecánica', 'Ingeniería Civil',
    'Ingeniería Química', 'Agrimensura', 'Ingeniería Industrial']],
  ['fac-salud', ['Bioanálisis', 'Ciencias Morfológicas', 'Farmacia',
    'Ciencias Fisiológicas', 'Enfermería', 'Odontología', 'Medicina', 'Salud Pública']],
  ['fac-artes', ['Crítica e Historia del Arte', 'Publicidad', 'Teatro y Danza', 'Música',
    'Cine, Televisión y Fotografía', 'Diseño Industrial y de Moda', 'Artes Plásticas']],
  ['fac-agronomia', ['Agronomía', 'Zootecnia', 'Veterinaria']],
  ['fac-educacion', ['Teoría y Gestión Educativa', 'Educación Infantil y Básica',
    'Educación Media', 'Orientación y Pedagogía',
    'Educación Física y Ciencias del Deporte',
    'Bibliotecología, Tecnología e Innovación']],
]

const escuelas = ESCUELAS.flatMap(([, nombres]) =>
  nombres.map((n) => [idEscuela(n), `Escuela de ${n}`]))

// ---------- Mapeo explícito de direcciones/recintos (nombres no alineados
// literalmente entre el padrón y el documento fuente) ----------
const MAPEO_DIRECCIONES = {
  'dir-digeplandi': 'DIRECCIÓN GENERAL DE PLANIFICACIÓN Y DESARROLLO INSTITUCIONAL (DIGEPLANDI)',
  'dir-calidad': 'DIRECCIÓN GENERAL DE GESTIÓN DE LA CALIDAD',
  'dir-tecnologia': 'DIRECCIÓN GENERAL DE TECNOLOGÍA',
  'dir-rrhh': 'DIRECCIÓN GENERAL DE RECURSOS HUMANOS',
  'dir-registro': 'DIRECCIÓN DE REGISTRO',
  'dir-admisiones': 'DIRECCIÓN DE ADMISIONES',
  'dir-biblioteca': 'DIRECCIÓN GENERAL DE BIBLIOTECA',
  'dir-cooperacion': 'DIRECCIÓN GENERAL DE COOPERACIÓN INTERNACIONAL',
  'dir-planta': 'DIRECCIÓN DE PLANTA FÍSICA',
  'dir-compras': 'DIRECCIÓN DE COMPRAS Y CONTRATACIONES',
  'dir-tesoreria': 'DIRECCIÓN DE TESORERÍA',
  'dir-presupuesto': 'DIRECCIÓN DE PRESUPUESTO',
  'dir-bienestar': 'DIRECCIÓN DE BIENESTAR ESTUDIANTIL',
  'dir-contabilidad': 'CONTABILIDAD',
  'dir-seguridad': 'SEGURIDAD UNIVERSITARIA',
  'dir-transporte': 'TRANSPORTE',
  'dir-economato': 'ECONOMATO',
  'dir-comedor': 'COMEDOR UNIVERSITARIO',
  'dir-dispensario': 'DISPENSARIO MÉDICO UNIVERSITARIO',
  'dir-uasdvirtual': 'UASD VIRTUAL',
}

const MAPEO_RECINTOS = {
  'recinto-santiago': 'RECINTO SANTIAGO',
  'recinto-sfm': 'RECINTO SAN FRANCISCO DE MACORÍS',
  'recinto-barahona': 'RECINTO BARAHONA',
  'recinto-sanjuan': 'RECINTO SAN JUAN',
}

const MAPEO_RECTORIA = {
  'rectoria': 'RECTORÍA',
  'vic-docente': 'VICERRECTORÍA DOCENTE',
  'vic-invpos': 'VICERRECTORÍA DE INVESTIGACIÓN Y POSTGRADO',
  'vic-extension': 'VICERRECTORÍA DE EXTENSIÓN',
  'vic-admin': 'VICERRECTORÍA ADMINISTRATIVA',
}

// ---------- Construcción del mapeo id -> bloque ----------
const usados = new Set()
const resultado = {} // id de variable TS -> { servicio, proceso }
const asignacionesPorId = {} // unidadId -> nombre de variable TS
const nombreVar = (id) => 'U_' + id.replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase()

function asignar(unidadId, claveJson) {
  if (!(claveJson in fuente)) throw new Error(`Clave no encontrada en JSON: ${claveJson}`)
  usados.add(claveJson)
  const v = nombreVar(unidadId)
  resultado[v] = fuente[claveJson]
  asignacionesPorId[unidadId] = v
  return v
}

for (const [id, clave] of Object.entries(MAPEO_RECTORIA)) asignar(id, clave)
for (const [id, clave] of Object.entries(MAPEO_DIRECCIONES)) asignar(id, clave)
for (const [id, clave] of Object.entries(MAPEO_RECINTOS)) asignar(id, clave)

for (const [id, nombre] of FACULTADES) {
  const clave = Object.keys(fuente).find((k) => normalizar(k) === normalizar(nombre))
  if (!clave) throw new Error(`Facultad sin bloque: ${nombre}`)
  asignar(id, clave)
}

const escuelasSinTexto = []
for (const [id, nombreCompleto] of escuelas) {
  const clave = Object.keys(fuente).find((k) => normalizar(k) === normalizar(nombreCompleto))
  if (!clave) {
    escuelasSinTexto.push([id, nombreCompleto])
    continue
  }
  asignar(id, clave)
}

// Los dos bloques "NIVEL: ..." se comparten literalmente entre todos los
// centros y todos los subcentros: no son mapeo id -> bloque sino tipo -> bloque.
usados.add('NIVEL: CENTROS UNIVERSITARIOS')
usados.add('NIVEL: SUBCENTROS UNIVERSITARIOS')

// Seis direcciones aparecen dos veces en el documento fuente, con un bloque
// "DIRECCIÓN DE X" (sin punto final, estilo RECTORÍA) y un duplicado
// operativo homónimo "X" (con punto final). Se usó el primero por
// consistencia de estilo con el resto de direcciones; el duplicado se
// descarta a propósito, no por descuido.
const DUPLICADOS_DESCARTADOS = [
  'REGISTRO UNIVERSITARIO', 'ADMISIONES', 'BIENESTAR ESTUDIANTIL',
  'PRESUPUESTO', 'TESORERÍA', 'COMPRAS Y CONTRATACIONES',
]
for (const k of DUPLICADOS_DESCARTADOS) usados.add(k)

const sinUsar = Object.keys(fuente).filter((k) => !usados.has(k))

console.log(`Bloques del JSON: ${Object.keys(fuente).length}`)
console.log(`Asignados por id: ${Object.keys(asignacionesPorId).length}`)
console.log(`Escuelas sin texto propio (van a respaldo genérico): ${escuelasSinTexto.length}`)
for (const [id, n] of escuelasSinTexto) console.log(`  - ${id}: ${n}`)
console.log(`Bloques del JSON no usados: ${sinUsar.length}`)
for (const k of sinUsar) console.log(`  - ${k}`)

if (escuelasSinTexto.length !== 4) {
  throw new Error(`Se esperaban 4 escuelas sin texto propio, hay ${escuelasSinTexto.length}`)
}
if (sinUsar.length !== 0) {
  throw new Error(`Quedaron bloques del JSON sin usar: ${sinUsar.join(', ')}`)
}

// ---------- Emisión del módulo TypeScript ----------
const ts = (arr) => JSON.stringify(arr, null, 2)
  .split('\n').map((l, i) => (i === 0 ? l : '  ' + l)).join('\n')

let salida = `// Módulo de datos puro, generado por \`app/scripts/convertir-catalogo.mjs\` a partir
// de \`.superpowers/sdd/2026-08-25-tablero-rectoral-uasd/fuentes/indicadores.json\`.
// No editar a mano: si el mapeo cambia, corregir el script y regenerar.
// Exento del límite de 400 líneas por ser datos puros (ver CLAUDE.md).

export interface ConjuntoTextos { servicio: string[]; proceso: string[] }

`

for (const [id, textos] of Object.entries(resultado)) {
  salida += `export const ${id}: ConjuntoTextos = ${ts(textos)}\n\n`
}

salida += `export const CENTRO: ConjuntoTextos = ${ts(fuente['NIVEL: CENTROS UNIVERSITARIOS'])}\n\n`
salida += `export const SUBCENTRO: ConjuntoTextos = ${ts(fuente['NIVEL: SUBCENTROS UNIVERSITARIOS'])}\n\n`

salida += `/** Ids de unidad del padrón que tienen un conjunto propio arriba. */
export const CONJUNTO_POR_ID: Record<string, ConjuntoTextos> = {
`
for (const [id, v] of Object.entries(asignacionesPorId)) {
  salida += `  '${id}': ${v},\n`
}
salida += `}\n`

fs.writeFileSync(salidaPath, salida, 'utf8')
console.log(`\nEscrito: ${salidaPath}`)
