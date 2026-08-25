import type { Unidad, NivelInfo, NivelId, TipoUnidad } from '../tipos'

export const NIVELES: NivelInfo[] = [
  { id: 1,  nombre: 'Rectoría y organismos de apoyo',   orden: 1 },
  { id: 2,  nombre: 'Vicerrectorías',                   orden: 2 },
  // PENDIENTE CONFIRMAR: la taxonomía del Rector no contempla Facultades ni
  // Escuelas. Se les dan los ids 11 y 12 para no alterar su numeración 1–10,
  // y se ordenan aquí porque cuelgan de la Vicerrectoría Docente.
  { id: 11, nombre: 'Facultades',                       orden: 3 },
  { id: 12, nombre: 'Escuelas',                         orden: 4 },
  { id: 3,  nombre: 'Direcciones especializadas',       orden: 5 },
  { id: 4,  nombre: 'Investigación y Postgrado',        orden: 6 },
  { id: 5,  nombre: 'Extensión',                        orden: 7 },
  { id: 6,  nombre: 'Recintos',                         orden: 8 },
  { id: 7,  nombre: 'Centros',                          orden: 9 },
  { id: 8,  nombre: 'Subcentros',                       orden: 10 },
  { id: 9,  nombre: 'Institutos y centros especializados', orden: 11 },
  { id: 10, nombre: 'Servicios institucionales',        orden: 12 },
]

const u = (
  id: string, nombre: string, nivel: NivelId, tipo: TipoUnidad,
  padreId: string | null, peso: number,
  provincia?: string, coords?: [number, number],
): Unidad => ({ id, nombre, nivel, tipo, padreId, peso, provincia, coords })

// ---------- Nivel 1: Rectoría y organismos de apoyo ----------
const rectoria: Unidad[] = [
  u('rectoria', 'Rectoría', 1, 'rectoria', null, 100),
  ...([
    ['Consejo Universitario', 8], ['Secretaría General', 12],
    ['Consultoría Jurídica', 8], ['Dirección de Relaciones Públicas y Comunicaciones', 10],
    ['Dirección de Protocolo', 6], ['Auditoría Interna', 8],
    ['Relaciones Nacionales e Institucionales', 7],
    ['Oficina de Libre Acceso a la Información (OAI)', 6],
    ['Dirección de Planificación Estratégica Rectoral', 9],
    ['Dirección de Seguimiento a Resoluciones del Consejo Universitario', 6],
    ['Dirección de Gestión de Riesgos Institucionales', 6],
    ['Dirección de Transparencia y Rendición de Cuentas', 7],
    ['Archivo General Universitario', 8],
    ['Unidad de Asuntos Interinstitucionales', 5],
    ['Unidad de Gestión de Crisis y Continuidad Operativa', 5],
  ] as [string, number][]).map(([n, p], i) =>
    u(`org-${i + 1}`, n, 1, 'organismo', 'rectoria', p)),
]

// ---------- Nivel 2: Vicerrectorías ----------
const vicerrectorias: Unidad[] = [
  u('vic-docente', 'Vicerrectoría Docente', 2, 'vicerrectoria', 'rectoria', 90),
  u('vic-admin', 'Vicerrectoría Administrativa', 2, 'vicerrectoria', 'rectoria', 70),
  u('vic-invpos', 'Vicerrectoría de Investigación y Postgrado', 2, 'vicerrectoria', 'rectoria', 45),
  u('vic-extension', 'Vicerrectoría de Extensión', 2, 'vicerrectoria', 'rectoria', 35),
]

// ---------- Nivel 11: Facultades ----------
const FACULTADES: [string, string, number][] = [
  ['fac-humanidades', 'Facultad de Humanidades', 14],
  ['fac-ciencias', 'Facultad de Ciencias', 12],
  ['fac-economicas', 'Facultad de Ciencias Económicas y Sociales', 22],
  ['fac-juridicas', 'Facultad de Ciencias Jurídicas y Políticas', 16],
  ['fac-ingenieria', 'Facultad de Ingeniería y Arquitectura', 15],
  ['fac-salud', 'Facultad de Ciencias de la Salud', 20],
  ['fac-artes', 'Facultad de Artes', 5],
  ['fac-agronomia', 'Facultad de Ciencias Agronómicas y Veterinarias', 4],
  // El .xlsx la nombra tanto "Facultad de Educación" como
  // "Facultad de Ciencias de la Educación". Se normaliza a esta forma.
  ['fac-educacion', 'Facultad de Ciencias de la Educación', 12],
]

// ---------- Nivel 12: Escuelas ----------
const ESCUELAS: [string, string[]][] = [
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

const sinTildes = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')

const idEscuela = (nombre: string) =>
  'esc-' + sinTildes(nombre).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .split('-').slice(0, 2).join('-')

const facultades: Unidad[] = FACULTADES.map(([id, nombre, peso]) =>
  u(id, nombre, 11, 'facultad', 'vic-docente', peso))

const escuelas: Unidad[] = ESCUELAS.flatMap(([facId, nombres]) => {
  const facultad = FACULTADES.find(f => f[0] === facId)!
  return nombres.map(n =>
    u(idEscuela(n), `Escuela de ${n}`, 12, 'escuela', facId,
      Math.max(1, Math.round((facultad[2] / nombres.length) * 10) / 10)))
})

// ---------- Nivel 3: Direcciones especializadas ----------
const DIRECCIONES: [string, string, string, number][] = [
  // [id, nombre, padreId, peso]
  ['dir-digeplandi', 'Dirección General de Planificación y Desarrollo Institucional', 'rectoria', 14],
  ['dir-calidad', 'Dirección General de Gestión de la Calidad', 'rectoria', 10],
  ['dir-tecnologia', 'Dirección General de Tecnología de la Información', 'vic-admin', 18],
  ['dir-rrhh', 'Dirección General de Recursos Humanos', 'vic-admin', 20],
  ['dir-registro', 'Dirección de Registro Universitario', 'vic-docente', 30],
  ['dir-admisiones', 'Dirección de Admisiones', 'vic-docente', 24],
  ['dir-biblioteca', 'Biblioteca Pedro Mir', 'vic-docente', 16],
  ['dir-cooperacion', 'Dirección General de Cooperación y Relaciones Internacionales', 'rectoria', 9],
  ['dir-planta', 'Dirección de Planta Física', 'vic-admin', 14],
  ['dir-compras', 'Dirección de Compras y Contrataciones', 'vic-admin', 15],
  ['dir-tesoreria', 'Dirección de Tesorería', 'vic-admin', 13],
  ['dir-presupuesto', 'Dirección de Presupuesto', 'vic-admin', 13],
  ['dir-bienestar', 'Dirección de Bienestar Estudiantil', 'vic-docente', 22],
  ['dir-contabilidad', 'Dirección de Contabilidad', 'vic-admin', 12],
  ['dir-seguridad', 'Dirección de Seguridad Universitaria', 'vic-admin', 12],
  ['dir-transporte', 'Dirección de Transportación', 'vic-admin', 10],
  ['dir-economato', 'Dirección de Economato', 'vic-admin', 9],
  ['dir-comedor', 'Comedor Universitario', 'vic-admin', 16],
  ['dir-dispensario', 'Dispensario Médico Universitario', 'vic-admin', 11],
  ['dir-uasdvirtual', 'Dirección de UASD Virtual', 'vic-docente', 20],
]
const direcciones = DIRECCIONES.map(([id, n, padre, p]) =>
  u(id, n, 3, 'direccion', padre, p))

// ---------- Niveles 4 y 5: Investigación/Postgrado y Extensión ----------
const INV_POSTGRADO = ['Dirección General de Investigación',
  'Dirección General de Postgrado', 'Dirección de Gestión de Proyectos Científicos',
  'Dirección de Transferencia Tecnológica', 'Dirección de Propiedad Intelectual',
  'Dirección de Revistas Científicas', 'Dirección de Fondos de Investigación',
  'Dirección de Laboratorios de Investigación', 'Dirección de Innovación Científica',
  'Dirección de Seguimiento a Proyectos FONDOCYT']

const EXTENSION = ['Dirección de Cultura', 'Dirección de Deportes',
  'Dirección de Educación Continua', 'Dirección de Cooperación Comunitaria',
  'Dirección de Difusión Cultural', 'Teatro Universitario', 'Coro Universitario',
  'Grupos Artísticos Institucionales', 'Dirección de Vinculación Social',
  'Dirección de Desarrollo Comunitario', 'Dirección de Programas Culturales',
  'Dirección de Relaciones con Egresados']

const invPostgrado = INV_POSTGRADO.map((n, i) =>
  u(`invpos-${i + 1}`, n, 4, 'direccion', 'vic-invpos', 8 + (i % 5)))
const extension = EXTENSION.map((n, i) =>
  u(`ext-${i + 1}`, n, 5, 'direccion', 'vic-extension', 6 + (i % 4)))

// ---------- Red territorial ----------
const RECINTOS: [string, string, string, number, number, number][] = [
  // [id, nombre, provincia, lon, lat, matrícula en miles]
  ['recinto-santiago', 'Recinto Santiago', 'Santiago', -70.70, 19.45, 26],
  ['recinto-sfm', 'Recinto San Francisco de Macorís', 'Duarte', -70.25, 19.30, 12],
  ['recinto-barahona', 'Recinto Barahona', 'Barahona', -71.10, 18.21, 8],
  ['recinto-sanjuan', 'Recinto San Juan', 'San Juan', -71.23, 18.81, 7],
]

const CENTROS: [string, string, number, number, number][] = [
  // [nombre, provincia, lon, lat, matrícula en miles]
  ['Puerto Plata', 'Puerto Plata', -70.69, 19.79, 1.4],
  ['Mao', 'Valverde', -71.08, 19.55, 0.9],
  ['La Vega', 'La Vega', -70.53, 19.22, 1.6],
  ['Nagua', 'María Trinidad Sánchez', -69.85, 19.38, 0.8],
  ['San Cristóbal', 'San Cristóbal', -70.11, 18.42, 1.5],
  ['Bonao', 'Monseñor Nouel', -70.41, 18.94, 0.9],
  ['Higüey', 'La Altagracia', -68.71, 18.62, 1.1],
  ['La Romana', 'La Romana', -68.97, 18.43, 1.0],
  ['Moca', 'Espaillat', -70.52, 19.39, 0.9],
  ['Monte Plata', 'Monte Plata', -69.78, 18.81, 0.6],
  // El .xlsx lista Neyba como Centro y como Subcentro. Se conserva aquí.
  ['Neyba', 'Bahoruco', -71.42, 18.48, 0.5],
  ['San Pedro de Macorís', 'San Pedro de Macorís', -69.30, 18.46, 1.2],
  ['Santiago Rodríguez', 'Santiago Rodríguez', -71.34, 19.47, 0.4],
  ['Azua', 'Azua', -70.73, 18.45, 0.8],
  ['Santo Domingo Este', 'Santo Domingo', -69.86, 18.49, 2.2],
  ['Baní', 'Peravia', -70.33, 18.28, 0.9],
  ['Cotuí', 'Sánchez Ramírez', -70.15, 19.05, 0.7],
  ['Hato Mayor', 'Hato Mayor', -69.26, 18.76, 0.6],
]

const SUBCENTROS: [string, string, number, number, number][] = [
  ['Constanza', 'La Vega', -70.74, 18.91, 0.20],
  ['Dajabón', 'Dajabón', -71.71, 19.55, 0.18],
  ['El Seibo', 'El Seibo', -69.04, 18.77, 0.16],
  ['Elías Piña', 'Elías Piña', -71.70, 18.88, 0.14],
  ['Jimaní', 'Independencia', -71.85, 18.49, 0.12],
  ['Monte Cristi', 'Monte Cristi', -71.65, 19.85, 0.17],
  ['Pedernales', 'Pedernales', -71.75, 18.04, 0.10],
  ['San José de Ocoa', 'San José de Ocoa', -70.51, 18.55, 0.19],
  ['Salcedo', 'Hermanas Mirabal', -70.42, 19.38, 0.18],
  ['Samaná', 'Samaná', -69.34, 19.21, 0.16],
  ['Verón Punta Cana', 'La Altagracia', -68.41, 18.60, 0.22],
  ['Yamasá', 'Monte Plata', -69.97, 18.77, 0.15],
]

// Deriva un identificador territorial igual que idEscuela, pero con el
// prefijo que corresponda ('centro-' o 'subcentro-').
const idTerritorial = (prefijo: string, nombre: string) =>
  prefijo + '-' + sinTildes(nombre).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .split('-').slice(0, 2).join('-')

const sede: Unidad = u(
  'sede-central', 'Sede Central', 1, 'rectoria', 'rectoria', 118,
  'Distrito Nacional', [-69.90, 18.47],
)

const recintos: Unidad[] = RECINTOS.map(([id, nombre, provincia, lon, lat, peso]) =>
  u(id, nombre, 6, 'recinto', 'rectoria', peso, provincia, [lon, lat]))

const centros: Unidad[] = CENTROS.map(([nombre, provincia, lon, lat, peso]) =>
  u(idTerritorial('centro', nombre), `Centro ${nombre}`, 7, 'centro', 'rectoria',
    peso, provincia, [lon, lat]))

const subcentros: Unidad[] = SUBCENTROS.map(([nombre, provincia, lon, lat, peso]) =>
  u(idTerritorial('subcentro', nombre), `Subcentro ${nombre}`, 8, 'subcentro', 'rectoria',
    peso, provincia, [lon, lat]))

const territoriales: Unidad[] = [sede, ...recintos, ...centros, ...subcentros]

export const UNIDADES: Unidad[] = [
  ...rectoria, ...vicerrectorias, ...facultades, ...escuelas,
  ...direcciones, ...invPostgrado, ...extension,
  ...territoriales,   // sede + recintos + centros + subcentros
]

const indice = new Map(UNIDADES.map(x => [x.id, x]))

export const porId = (id: string): Unidad | undefined => indice.get(id)

export const hijosDe = (id: string | null): Unidad[] =>
  UNIDADES.filter(x => x.padreId === id)

/**
 * Un id puede actuar como "área" en la cascada de filtros si existe y tiene
 * unidades hijas: cubre facultades, vicerrectorías y también la propia
 * rectoría (de la que cuelgan directamente las direcciones especializadas
 * de nivel 3). Es la única regla que decide si un id de área es válido:
 * tanto `getAreas` (MockDataSource) como `conArea` (state/filtros) la usan,
 * para no volver a divergir como ocurrió cuando `conArea` filtraba por tipo
 * de unidad en vez de por esta propiedad estructural.
 */
export const puedeSerArea = (id: string): boolean => hijosDe(id).length > 0

export function ancestrosDe(id: string): Unidad[] {
  const cadena: Unidad[] = []
  let actual = indice.get(id)
  while (actual?.padreId) {
    const padre = indice.get(actual.padreId)
    if (!padre) break
    cadena.push(padre)
    actual = padre
  }
  return cadena
}
