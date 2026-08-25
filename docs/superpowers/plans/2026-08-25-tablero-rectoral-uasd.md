# Tablero Rectoral UASD — Plan de Implementación

> **Para trabajadores agénticos:** SUB-SKILL REQUERIDA: usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar este plan tarea por tarea. Los pasos usan sintaxis de casilla (`- [ ]`) para seguimiento.

**Goal:** Construir un tablero de indicadores institucionales de la UASD, con datos simulados verosímiles y navegación por filtros estilo Power BI, que corra en pantalla completa sin conexión para presentarlo al Rector.

**Architecture:** Aplicación React de una sola página con una capa de datos completamente desacoplada (`DataSource`). Un generador determinístico con semilla produce 24 meses de series para ~2,900 indicadores de ~150 unidades organizacionales. La interfaz consume solo la interfaz `DataSource`, nunca el generador, de modo que sustituirla por una implementación contra sistemas reales no toque ninguna vista. Toda la navegación pasa por un único estado de filtros en cascada que tanto los desplegables como el filtrado cruzado por clic manipulan.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, Vitest + Testing Library, d3-geo y world-atlas (solo en tiempo de build, para generar el mapa).

## Global Constraints

- Todo el texto de interfaz va en **español dominicano**. Los identificadores de código también en español (`unidad`, `indicador`, `semaforo`), salvo palabras reservadas de librerías.
- **Cero llamadas de red en tiempo de ejecución.** Escudo, geometría del mapa y tipografías se empaquetan en el bundle. Si algo requiere descarga, se descarga en tiempo de build y se comitea el resultado.
- **Determinismo obligatorio:** dos ejecuciones del generador con la misma semilla producen bytes idénticos. Prohibido `Math.random()` y `Date.now()` dentro de `src/data/mock/`.
- La fecha "hoy" del sistema se lee de un único módulo `src/data/reloj.ts` para que los tests puedan fijarla.
- **Distribución de semáforos calibrada a 70% verde / 20% ámbar / 10% rojo**, con tolerancia de ±3 puntos porcentuales.
- Umbrales de semáforo: `verde` si cumplimiento ≥ 95%, `ambar` si ≥ 80%, `rojo` si < 80%.
- Semilla global fija: `SEMILLA_GLOBAL = 20260825`.
- Todo commit en español, imperativo, sin prefijos de tipo (`Añade el padrón de unidades`, no `feat: add ...`).
- Ningún archivo de `src/` **con lógica** debe superar las **400 líneas**. Si crece, se divide.
  Los archivos de **datos puros** (`mock/unidades.ts`, `mock/catalogo.ts`, `mock/servicios.ts`,
  `mapa-rd.ts`) están **exentos** del límite: partir una lista de datos no la hace más
  entendible, solo la esconde. La exención se pierde si el archivo incorpora lógica.
- Contraste mínimo AA para lectura a distancia; tamaño de fuente base 16px, KPIs mayores ≥ 48px.

---

## Correcciones de padrón asentadas

Al contar el `.xlsx` fuente, las cifras reales del padrón son:

| Unidad | Cantidad real |
|---|---|
| Recintos | 4 |
| Centros | 18 |
| Subcentros | 12 (13 listados, menos Neyba) |
| Facultades | 9 |
| Escuelas | 52 |

**Neyba figura duplicado** en el `.xlsx`: aparece como `CENTRO Neyba` y como `SUB-CENTRO Neyba`. Se resuelve tratándolo como **Centro** y excluyéndolo de Subcentros. Queda pendiente confirmarlo con la UASD y está anotado en el código.

**Facultad de Educación / Facultad de Ciencias de la Educación:** el `.xlsx` usa ambos nombres para la misma facultad. Se normaliza a **Facultad de Ciencias de la Educación**.

**Facultades y Escuelas no están en la taxonomía de 10 niveles que entregó el Rector.** Se les asignan los identificadores de nivel `11` (Facultades) y `12` (Escuelas), preservando intactos los números 1–10 del Rector, y se ordenan en el desplegable justo después de Vicerrectorías, que es donde cuelgan del árbol. **Esto debe confirmarse con el Rector**; está marcado con un comentario `// PENDIENTE CONFIRMAR` en el código.

---

## File Structure

```
scripts/
  generar-mapa.mjs          Build-time: extrae la geometría de RD y escribe src/data/mapa-rd.ts

src/
  data/
    tipos.ts                Tipos de dominio compartidos
    reloj.ts                Única fuente de "ahora", fijable en tests
    source.ts               Interfaz DataSource
    anclas.ts               Cifras ancla institucionales — punto único de corrección
    mapa-rd.ts              GENERADO. Path SVG de RD + parámetros de proyección
    mock/
      aleatorio.ts          PRNG determinístico con semilla
      unidades.ts           Padrón: árbol de ~150 unidades
      catalogo.ts           Textos de indicadores por tipo de unidad
      metrica.ts            Inferencia de tipo de métrica desde el nombre
      generador.ts          Generación de series de 24 meses
      servicios.ts          Catálogo real de servicios de Registro
      MockDataSource.ts     Implementación de DataSource sobre lo anterior
  state/
    filtros.ts              Tipo de filtro, lógica de cascada y reducción (puro)
    FiltrosContext.tsx      Provider de React sobre filtros.ts
  components/
    filtros/
      BarraFiltros.tsx      Franja horizontal con los seis desplegables
      Desplegable.tsx       Combobox accesible, táctil, con búsqueda interna opcional
      ChipsFiltros.tsx      Chips removibles + Limpiar todo + Atrás
    kpi/
      Semaforo.tsx          Punto de color + etiqueta de estado
      TarjetaKPI.tsx        KPI mayor de portada
      TarjetaIndicador.tsx  Indicador con meta, cumplimiento, tendencia
      Minigrafico.tsx       Sparkline de 12 meses
    mapa/
      MapaRD.tsx            Mapa interactivo de la red territorial
    graficos/
      GraficoSerie.tsx      Serie temporal de 24 meses
      GraficoBarras.tsx     Ranking horizontal clicable
    marco/
      Encabezado.tsx        Escudo, título, reloj en vivo, período académico
      DistintivoDemo.tsx    Aviso "DATOS SIMULADOS — DEMO"
      FeedActividad.tsx     Franja de eventos en vivo
  vistas/
    Rectoral.tsx
    Nivel.tsx
    Unidad.tsx
    Territorial.tsx
    Servicios.tsx
    Enrutador.tsx           Escoge la vista según el estado de filtros
  kiosco/
    Rotador.tsx             Ciclo automático y detección de toma de control
  App.tsx
  main.tsx
  index.css
```

**Principio de división:** `src/data/mock/` contiene toda la lógica probable sin renderizar nada. `src/state/filtros.ts` es lógica pura sin React. Ambos se prueban de forma aislada y rápida. Los componentes solo componen.

---

## Task 1: Andamiaje del proyecto y arnés de pruebas

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/data/reloj.ts`
- Test: `src/data/reloj.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `ahora(): Date` y `fijarAhora(d: Date | null): void` desde `src/data/reloj.ts`. Comando `npm test` operativo. Paleta Tailwind con los tokens `uasd-azul`, `uasd-azul-claro`, `verde`, `ambar`, `rojo`.

- [ ] **Step 1: Crear el proyecto Vite y las dependencias**

```bash
cd "C:/Users/JeanDeLeon/Desktop/luisdash"
npm create vite@latest app -- --template react-ts
cd app
npm install
npm install recharts
npm install -D tailwindcss postcss autoprefixer vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event d3-geo topojson-client world-atlas
npx tailwindcss init -p
```

- [ ] **Step 2: Configurar Tailwind con la paleta institucional**

`app/tailwind.config.js`:

```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'uasd-azul': '#00539F',
        'uasd-azul-oscuro': '#003A70',
        'uasd-azul-claro': '#3D82C4',
        'uasd-crema': '#F4F6F9',
        verde: '#1E9E5A',
        ambar: '#E0A320',
        rojo: '#D24B3E',
        'panel': '#0C1B2A',
        'panel-2': '#132639',
      },
      fontFamily: { sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
```

`app/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body { @apply bg-panel text-white antialiased; }
```

- [ ] **Step 3: Configurar Vitest**

`app/vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/pruebas/setup.ts'],
  },
})
```

`app/src/pruebas/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

Añadir a `app/package.json` en `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Escribir el test que falla del reloj**

`app/src/data/reloj.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest'
import { ahora, fijarAhora } from './reloj'

describe('reloj', () => {
  afterEach(() => fijarAhora(null))

  it('devuelve la fecha fijada cuando hay una', () => {
    fijarAhora(new Date('2026-08-25T10:00:00Z'))
    expect(ahora().toISOString()).toBe('2026-08-25T10:00:00.000Z')
  })

  it('vuelve al reloj del sistema al liberar la fecha fijada', () => {
    fijarAhora(new Date('2020-01-01T00:00:00Z'))
    fijarAhora(null)
    expect(ahora().getFullYear()).toBeGreaterThan(2020)
  })
})
```

- [ ] **Step 5: Ejecutar el test y verificar que falla**

Run: `cd app && npm test -- reloj`
Expected: FAIL — `Failed to resolve import "./reloj"`

- [ ] **Step 6: Implementar el reloj**

`app/src/data/reloj.ts`:

```ts
let fijada: Date | null = null

/** Única fuente de "ahora" en toda la aplicación, para que los tests puedan fijarla. */
export function ahora(): Date {
  return fijada ? new Date(fijada) : new Date()
}

export function fijarAhora(d: Date | null): void {
  fijada = d
}
```

- [ ] **Step 7: Ejecutar el test y verificar que pasa**

Run: `cd app && npm test -- reloj`
Expected: PASS, 2 tests

- [ ] **Step 8: Verificar que la aplicación arranca**

Run: `cd app && npm run dev`
Expected: sirve en `http://localhost:5173` sin errores en consola. Detener con Ctrl+C.

- [ ] **Step 9: Commit**

```bash
cd "C:/Users/JeanDeLeon/Desktop/luisdash"
git add app docs
git commit -m "Añade el andamiaje del proyecto y el arnés de pruebas"
```

---

## Task 2: Padrón de unidades organizacionales

**Files:**
- Create: `app/src/data/tipos.ts`, `app/src/data/mock/unidades.ts`
- Test: `app/src/data/mock/unidades.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - Tipos `NivelId`, `TipoUnidad`, `Unidad`, `CategoriaIndicador`, `TipoMetrica`, `Direccion`, `Indicador`, `Semaforo`, `Tendencia`, `PuntoSerie` desde `data/tipos.ts`.
  - `UNIDADES: Unidad[]`, `NIVELES: NivelInfo[]`, `porId(id: string): Unidad | undefined`, `hijosDe(id: string | null): Unidad[]`, `ancestrosDe(id: string): Unidad[]` desde `data/mock/unidades.ts`.

- [ ] **Step 1: Definir los tipos de dominio**

`app/src/data/tipos.ts`:

```ts
/** Identificadores de nivel. 1–10 son la taxonomía entregada por el Rector.
 *  11 y 12 son Facultades y Escuelas, que esa taxonomía no contempla.
 *  PENDIENTE CONFIRMAR con el Rector. */
export type NivelId = 1|2|3|4|5|6|7|8|9|10|11|12

export type TipoUnidad =
  | 'rectoria' | 'organismo' | 'vicerrectoria' | 'facultad' | 'escuela'
  | 'direccion' | 'recinto' | 'centro' | 'subcentro' | 'instituto' | 'servicio'

export interface Unidad {
  id: string
  nombre: string
  nivel: NivelId
  tipo: TipoUnidad
  padreId: string | null
  /** Provincia y coordenadas solo para unidades con presencia territorial. */
  provincia?: string
  coords?: [number, number]   // [longitud, latitud]
  /** Magnitud relativa de la unidad; escala todas sus cifras generadas. */
  peso: number
}

export interface NivelInfo {
  id: NivelId
  nombre: string
  /** Orden de aparición en el desplegable, distinto del id. */
  orden: number
}

export type CategoriaIndicador = 'servicio' | 'proceso'
export type TipoMetrica = 'conteo' | 'porcentaje' | 'dias' | 'moneda'
export type Direccion = 'mayor-mejor' | 'menor-mejor'

export interface Indicador {
  id: string
  unidadId: string
  nombre: string
  categoria: CategoriaIndicador
  tipoMetrica: TipoMetrica
  unidadMedida: string
  direccion: Direccion
}

export type Semaforo = 'verde' | 'ambar' | 'rojo'
export type Tendencia = 'alza' | 'baja' | 'estable'

export interface PuntoSerie {
  indicadorId: string
  periodo: string        // 'AAAA-MM'
  valor: number
  meta: number
  cumplimiento: number   // porcentaje, 0–200
  semaforo: Semaforo
  tendencia: Tendencia
}
```

- [ ] **Step 2: Escribir los tests que fallan del padrón**

`app/src/data/mock/unidades.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { UNIDADES, NIVELES, porId, hijosDe, ancestrosDe } from './unidades'

const cuenta = (tipo: string) => UNIDADES.filter(u => u.tipo === tipo).length

describe('padrón de unidades', () => {
  it('tiene exactamente una rectoría en la raíz', () => {
    const raices = UNIDADES.filter(u => u.padreId === null)
    expect(raices).toHaveLength(1)
    expect(raices[0].tipo).toBe('rectoria')
  })

  it('respeta las cantidades reales del padrón', () => {
    expect(cuenta('vicerrectoria')).toBe(4)
    expect(cuenta('facultad')).toBe(9)
    expect(cuenta('escuela')).toBe(52)
    expect(cuenta('recinto')).toBe(4)
    expect(cuenta('centro')).toBe(18)
    expect(cuenta('subcentro')).toBe(12)
  })

  it('no repite identificadores', () => {
    const ids = UNIDADES.map(u => u.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('excluye Neyba de subcentros por estar duplicado como centro', () => {
    const neyba = UNIDADES.filter(u => u.nombre.includes('Neyba'))
    expect(neyba).toHaveLength(1)
    expect(neyba[0].tipo).toBe('centro')
  })

  it('todo padre referenciado existe', () => {
    const ids = new Set(UNIDADES.map(u => u.id))
    const huerfanos = UNIDADES.filter(u => u.padreId !== null && !ids.has(u.padreId))
    expect(huerfanos.map(u => u.id)).toEqual([])
  })

  it('toda unidad territorial trae provincia y coordenadas', () => {
    const territoriales = UNIDADES.filter(u =>
      ['recinto', 'centro', 'subcentro'].includes(u.tipo))
    const incompletas = territoriales.filter(u => !u.provincia || !u.coords)
    expect(incompletas.map(u => u.id)).toEqual([])
  })

  it('sitúa las coordenadas dentro de República Dominicana', () => {
    const fuera = UNIDADES.filter(u => u.coords).filter(u => {
      const [lon, lat] = u.coords!
      return lon < -72.1 || lon > -68.2 || lat < 17.4 || lat > 20.1
    })
    expect(fuera.map(u => u.id)).toEqual([])
  })

  it('toda unidad tiene un peso positivo', () => {
    expect(UNIDADES.filter(u => !(u.peso > 0))).toEqual([])
  })

  it('expone los 10 niveles del Rector más Facultades y Escuelas', () => {
    expect(NIVELES).toHaveLength(12)
    expect(NIVELES.map(n => n.id).sort((a, b) => a - b))
      .toEqual([1,2,3,4,5,6,7,8,9,10,11,12])
  })

  it('ordena Facultades y Escuelas justo después de Vicerrectorías', () => {
    const porOrden = [...NIVELES].sort((a, b) => a.orden - b.orden).map(n => n.id)
    expect(porOrden.slice(0, 4)).toEqual([1, 2, 11, 12])
  })

  it('encuentra unidades por identificador', () => {
    expect(porId('recinto-santiago')?.nombre).toContain('Santiago')
    expect(porId('inexistente')).toBeUndefined()
  })

  it('lista los hijos directos de una unidad', () => {
    const escuelasSalud = hijosDe('fac-salud')
    expect(escuelasSalud).toHaveLength(8)
    expect(escuelasSalud.every(u => u.tipo === 'escuela')).toBe(true)
  })

  it('lista los ancestros desde la unidad hasta la raíz', () => {
    const cadena = ancestrosDe('esc-medicina').map(u => u.id)
    expect(cadena).toEqual(['fac-salud', 'vic-docente', 'rectoria'])
  })
})
```

- [ ] **Step 3: Ejecutar los tests y verificar que fallan**

Run: `cd app && npm test -- unidades`
Expected: FAIL — `Failed to resolve import "./unidades"`

- [ ] **Step 4: Implementar el padrón**

`app/src/data/mock/unidades.ts`. Construir con ayudantes para que la estructura se lea de un vistazo (el archivo está exento del límite de líneas por ser datos puros):

```ts
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
```

Continuar en el mismo archivo con las facultades y sus escuelas. Las nueve facultades, con su `peso` proporcional a la matrícula estimada:

```ts
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
```

El identificador de cada escuela se deriva del nombre: minúsculas, sin tildes, espacios y comas a guiones, prefijo `esc-`, tomando solo las dos primeras palabras significativas. Para que los tests puedan referirse a `esc-medicina`, usar un ayudante:

```ts
const sinTildes = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

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
      Math.max(1, Math.round((facultad[2] / nombres.length) * 10) / 10))
})
```

Las direcciones especializadas de nivel 3 (padrón deduplicado de las listas de Direcciones Generales y Operativas del `.docx`), colgando de su vicerrectoría:

```ts
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
```

Niveles 4 y 5, colgando de sus vicerrectorías:

```ts
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
```

Red territorial. El `peso` es la matrícula estimada en miles, y suma con la sede la matrícula ancla:

```ts
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
```

Los identificadores territoriales se derivan igual que los de escuela, con prefijo `centro-` y `subcentro-`. La Sede Central se representa con id `sede-central`, **`tipo: 'rectoria'`**, `nivel: 1`, padre `rectoria`, provincia `Distrito Nacional`, coordenadas `[-69.90, 18.47]` y peso `118`. Lleva coordenadas para aparecer en el mapa, pero **no** es de tipo `recinto`: los tests de las Tareas 2 y 12 cuentan exactamente 4 recintos.

Finalmente:

```ts
export const UNIDADES: Unidad[] = [
  ...rectoria, ...vicerrectorias, ...facultades, ...escuelas,
  ...direcciones, ...invPostgrado, ...extension,
  ...territoriales,   // sede + recintos + centros + subcentros
]

const indice = new Map(UNIDADES.map(x => [x.id, x]))

export const porId = (id: string): Unidad | undefined => indice.get(id)

export const hijosDe = (id: string | null): Unidad[] =>
  UNIDADES.filter(x => x.padreId === id)

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
```

> **Atención:** el test `hijosDe('fac-salud')` espera 8 escuelas y `ancestrosDe('esc-medicina')` espera `['fac-salud', 'vic-docente', 'rectoria']`. Verificar que `idEscuela('Medicina')` produzca exactamente `esc-medicina`. Si el ayudante genera otro identificador, ajustar el ayudante, no el test.

- [ ] **Step 5: Ejecutar los tests y verificar que pasan**

Run: `cd app && npm test -- unidades`
Expected: PASS, 12 tests

- [ ] **Step 6: Verificar el total del padrón en consola**

Run: `cd app && npx vitest run --reporter=verbose unidades`
Expected: los conteos por tipo coinciden con la tabla de correcciones. Anotar el total de unidades; debe rondar 150.

- [ ] **Step 7: Commit**

```bash
git add app/src/data
git commit -m "Añade el padrón de unidades organizacionales y los tipos de dominio"
```

---

## Task 3: Catálogo de indicadores e inferencia de métrica

**Files:**
- Create: `app/src/data/mock/metrica.ts`, `app/src/data/mock/catalogo.ts`
- Test: `app/src/data/mock/metrica.test.ts`, `app/src/data/mock/catalogo.test.ts`

**Interfaces:**
- Consumes: `Unidad`, `Indicador`, `TipoMetrica`, `Direccion` de `data/tipos.ts`; `UNIDADES` de `data/mock/unidades.ts`.
- Produces:
  - `inferirMetrica(nombre: string): { tipoMetrica: TipoMetrica; unidadMedida: string; direccion: Direccion }` desde `metrica.ts`.
  - `INDICADORES: Indicador[]` e `indicadoresDe(unidadId: string): Indicador[]` desde `catalogo.ts`.

- [ ] **Step 1: Escribir los tests que fallan de la inferencia de métrica**

`app/src/data/mock/metrica.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { inferirMetrica } from './metrica'

describe('inferirMetrica', () => {
  it('trata los indicadores que empiezan con Tiempo como días y menor es mejor', () => {
    const m = inferirMetrica('Tiempo promedio de emisión de récord oficial')
    expect(m.tipoMetrica).toBe('dias')
    expect(m.unidadMedida).toBe('días')
    expect(m.direccion).toBe('menor-mejor')
  })

  it('reconoce porcentajes por palabra clave', () => {
    for (const n of [
      'Nivel de satisfacción de autoridades universitarias con el soporte rectoral',
      'Índice de satisfacción de usuarios del recinto',
      'Porcentaje de resoluciones ejecutadas',
      'Cumplimiento del POA Rectoral',
      'Cobertura de oferta curricular',
      'Eficiencia de asignación docente',
      'Exactitud de registros de ingreso',
    ]) {
      expect(inferirMetrica(n).tipoMetrica, n).toBe('porcentaje')
      expect(inferirMetrica(n).unidadMedida).toBe('%')
    }
  })

  it('reconoce montos en moneda', () => {
    expect(inferirMetrica('Recursos gestionados para extensión').tipoMetrica).toBe('moneda')
    expect(inferirMetrica('Ejecución presupuestaria administrativa').tipoMetrica).toBe('moneda')
    expect(inferirMetrica('Recaudación por servicios').unidadMedida).toBe('RD$')
  })

  it('trata todo lo demás como conteo con mayor es mejor', () => {
    const m = inferirMetrica('Decisiones rectorales emitidas')
    expect(m.tipoMetrica).toBe('conteo')
    expect(m.unidadMedida).toBe('')
    expect(m.direccion).toBe('mayor-mejor')
  })

  it('invierte la dirección para errores, reprocesos y riesgos', () => {
    expect(inferirMetrica('Errores detectados en certificaciones').direccion).toBe('menor-mejor')
    expect(inferirMetrica('Reprocesos realizados sobre expedientes').direccion).toBe('menor-mejor')
    expect(inferirMetrica('Riesgos institucionales gestionados').direccion).toBe('menor-mejor')
  })

  it('da prioridad a Tiempo sobre las demás reglas', () => {
    // Contiene "respuesta" y "institucional", pero empieza con Tiempo.
    expect(inferirMetrica('Tiempo de respuesta institucional').tipoMetrica).toBe('dias')
  })

  it('ignora tildes y mayúsculas al clasificar', () => {
    expect(inferirMetrica('INDICE DE SATISFACCION').tipoMetrica).toBe('porcentaje')
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `cd app && npm test -- metrica`
Expected: FAIL — módulo no encontrado

- [ ] **Step 3: Implementar la inferencia**

`app/src/data/mock/metrica.ts`:

```ts
import type { TipoMetrica, Direccion } from '../tipos'

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const PORCENTAJE = ['nivel de satisfaccion', 'satisfaccion', 'indice', 'porcentaje',
  'cumplimiento', 'cobertura', 'eficiencia', 'exactitud', 'productividad']
const MONEDA = ['recursos gestionados', 'presupuest', 'recaudacion', 'fondos gestionados']
const MENOR_MEJOR = ['error', 'reproceso', 'riesgo', 'incidencia', 'queja', 'demora']

export function inferirMetrica(nombre: string): {
  tipoMetrica: TipoMetrica; unidadMedida: string; direccion: Direccion
} {
  const n = normalizar(nombre)

  if (n.startsWith('tiempo'))
    return { tipoMetrica: 'dias', unidadMedida: 'días', direccion: 'menor-mejor' }

  const direccion: Direccion =
    MENOR_MEJOR.some(k => n.includes(k)) ? 'menor-mejor' : 'mayor-mejor'

  if (MONEDA.some(k => n.includes(k)))
    return { tipoMetrica: 'moneda', unidadMedida: 'RD$', direccion }

  if (PORCENTAJE.some(k => n.includes(k)))
    return { tipoMetrica: 'porcentaje', unidadMedida: '%', direccion }

  return { tipoMetrica: 'conteo', unidadMedida: '', direccion }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- metrica`
Expected: PASS, 7 tests

- [ ] **Step 5: Escribir los tests que fallan del catálogo**

`app/src/data/mock/catalogo.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { INDICADORES, indicadoresDe } from './catalogo'
import { UNIDADES } from './unidades'

describe('catálogo de indicadores', () => {
  it('asigna exactamente 20 indicadores a cada unidad', () => {
    for (const u of UNIDADES) {
      expect(indicadoresDe(u.id).length, u.id).toBe(20)
    }
  })

  it('reparte 10 de servicio y 10 de proceso', () => {
    const de = indicadoresDe('dir-registro')
    expect(de.filter(i => i.categoria === 'servicio')).toHaveLength(10)
    expect(de.filter(i => i.categoria === 'proceso')).toHaveLength(10)
  })

  it('usa los textos literales del documento fuente para Registro', () => {
    const nombres = indicadoresDe('dir-registro').map(i => i.nombre)
    expect(nombres).toContain('Récords oficiales emitidos')
    expect(nombres).toContain('Certificados de título emitidos')
    expect(nombres).toContain('Tiempo promedio de emisión de récord oficial')
  })

  it('usa los textos propios de los recintos', () => {
    const nombres = indicadoresDe('recinto-santiago').map(i => i.nombre)
    expect(nombres).toContain('Estudiantes matriculados en el Recinto Santiago.')
    expect(nombres).toContain('Ejecución del POA del recinto.')
  })

  it('aplica el set común a centros y subcentros', () => {
    const centro = indicadoresDe('centro-la-vega').map(i => i.nombre)
    expect(centro).toContain('Estudiantes matriculados en el centro.')
    const sub = indicadoresDe('subcentro-samana').map(i => i.nombre)
    expect(sub).toContain('Estudiantes matriculados.')
  })

  it('no repite identificadores de indicador', () => {
    const ids = INDICADORES.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('deriva el tipo de métrica de cada indicador', () => {
    const tiempo = INDICADORES.find(i => i.nombre.startsWith('Tiempo'))!
    expect(tiempo.tipoMetrica).toBe('dias')
  })

  it('genera del orden de 2,900 indicadores en total', () => {
    expect(INDICADORES.length).toBe(UNIDADES.length * 20)
    expect(INDICADORES.length).toBeGreaterThan(2500)
  })
})
```

- [ ] **Step 6: Ejecutar y verificar que falla**

Run: `cd app && npm test -- catalogo`
Expected: FAIL — módulo no encontrado

- [ ] **Step 7: Implementar el catálogo**

`app/src/data/mock/catalogo.ts`. Se definen conjuntos de textos por tipo de unidad, tomados literalmente de los `.docx`, y una función que escoge el conjunto:

```ts
import type { Indicador, CategoriaIndicador } from '../tipos'
import { UNIDADES } from './unidades'
import { inferirMetrica } from './metrica'

type Conjunto = { servicio: string[]; proceso: string[] }

// Los textos van literales del documento fuente, incluido su punto final
// cuando lo trae, porque son la evidencia de que el catálogo salió del .docx.

const RECTORIA: Conjunto = {
  servicio: ['Decisiones rectorales emitidas', 'Resoluciones ejecutivas aprobadas',
    'Solicitudes institucionales atendidas por Rectoría',
    'Acuerdos interinstitucionales formalizados', 'Reuniones estratégicas realizadas',
    'Casos institucionales resueltos',
    'Nivel de satisfacción de autoridades universitarias con el soporte rectoral',
    'Cumplimiento de compromisos asumidos con organismos externos',
    'Iniciativas estratégicas impulsadas', 'Tiempo de respuesta a asuntos elevados a Rectoría'],
  proceso: ['Tiempo promedio de emisión de decisiones rectorales',
    'Cumplimiento del calendario de reuniones estratégicas',
    'Porcentaje de acuerdos monitoreados',
    'Tiempo de seguimiento de decisiones institucionales',
    'Porcentaje de resoluciones ejecutadas', 'Productividad de la agenda rectoral',
    'Procesos estratégicos supervisados', 'Riesgos institucionales gestionados',
    'Informes ejecutivos evaluados', 'Cumplimiento del POA Rectoral'],
}
```

Definir de la misma forma, transcribiendo desde los documentos fuente, los conjuntos:

`VIC_DOCENTE`, `VIC_INVPOS`, `VIC_EXTENSION`, `VIC_ADMIN`, `REGISTRO`, `ADMISIONES`, `RECINTO`, `CENTRO`, `SUBCENTRO`, y conjuntos genéricos `FACULTAD`, `ESCUELA`, `DIRECCION`, `ORGANISMO`.

Para los recintos, el documento personaliza el primer indicador con el nombre del recinto. Se maneja con una plantilla:

```ts
const RECINTO: Conjunto = {
  servicio: ['Estudiantes matriculados en el {nombre}.',
    'Nuevos ingresos incorporados al recinto.', 'Egresados graduados en el recinto.',
    'Estudiantes beneficiados por servicios estudiantiles.',
    'Usuarios atendidos por Biblioteca del recinto.',
    'Participantes en programas de educación continua.',
    'Participantes en programas de extensión y vinculación.',
    'Investigadores beneficiados por servicios académicos.',
    'Comunidades beneficiadas por proyectos universitarios.',
    'Índice de satisfacción de usuarios del recinto.'],
  proceso: ['Secciones académicas impartidas.', 'Procesos de inscripción ejecutados.',
    'Procesos de reinscripción completados.', 'Proyectos de investigación ejecutados.',
    'Actividades de extensión desarrolladas.', 'Procesos administrativos gestionados.',
    'Tiempo promedio de respuesta a solicitudes estudiantiles.',
    'Cumplimiento del calendario académico.', 'Ejecución del POA del recinto.',
    'Cumplimiento de metas estratégicas regionales.'],
}
```

La resolución del conjunto y la construcción final:

```ts
const POR_ID: Record<string, Conjunto> = {
  'rectoria': RECTORIA, 'vic-docente': VIC_DOCENTE, 'vic-invpos': VIC_INVPOS,
  'vic-extension': VIC_EXTENSION, 'vic-admin': VIC_ADMIN,
  'dir-registro': REGISTRO, 'dir-admisiones': ADMISIONES,
}

const POR_TIPO: Record<string, Conjunto> = {
  facultad: FACULTAD, escuela: ESCUELA, direccion: DIRECCION,
  organismo: ORGANISMO, recinto: RECINTO, centro: CENTRO,
  subcentro: SUBCENTRO, instituto: DIRECCION, servicio: DIRECCION,
  rectoria: RECTORIA, vicerrectoria: VIC_DOCENTE,
}

const conjuntoDe = (unidadId: string, tipo: string): Conjunto =>
  POR_ID[unidadId] ?? POR_TIPO[tipo]

export const INDICADORES: Indicador[] = UNIDADES.flatMap(u => {
  const c = conjuntoDe(u.id, u.tipo)
  const construir = (nombres: string[], categoria: CategoriaIndicador) =>
    nombres.map((plantilla, i): Indicador => {
      const nombre = plantilla.replace('{nombre}', u.nombre)
      return {
        id: `${u.id}::${categoria}::${i + 1}`,
        unidadId: u.id, nombre, categoria, ...inferirMetrica(nombre),
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
```

> `catalogo.ts` está exento del límite de líneas por ser un archivo de datos. Aun así, si la lógica de construcción se vuelve difícil de encontrar entre los textos, mover los conjuntos a `catalogo-textos.ts` y dejar aquí solo la construcción.

- [ ] **Step 8: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- catalogo`
Expected: PASS, 8 tests

- [ ] **Step 9: Ejecutar toda la batería**

Run: `cd app && npm test`
Expected: PASS, todo verde

- [ ] **Step 10: Commit**

```bash
git add app/src/data/mock
git commit -m "Añade el catálogo de indicadores y la inferencia de tipo de métrica"
```

---

## Task 4: Generador determinístico de series

**Files:**
- Create: `app/src/data/anclas.ts`, `app/src/data/mock/aleatorio.ts`, `app/src/data/mock/generador.ts`
- Test: `app/src/data/mock/aleatorio.test.ts`, `app/src/data/mock/generador.test.ts`

**Interfaces:**
- Consumes: `Indicador`, `PuntoSerie`, `Semaforo` de `data/tipos.ts`; `porId` de `mock/unidades.ts`; `INDICADORES` de `mock/catalogo.ts`.
- Produces:
  - `mulberry32(semilla: number): () => number` y `hashSemilla(texto: string): number` desde `aleatorio.ts`.
  - `ANCLAS` desde `data/anclas.ts`.
  - `generarSerie(indicadorId: string, meses?: number): PuntoSerie[]`, `SEMILLA_GLOBAL`, `clasificar(cumplimiento: number): Semaforo` desde `generador.ts`.

- [ ] **Step 1: Escribir el test que falla del generador aleatorio**

`app/src/data/mock/aleatorio.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { mulberry32, hashSemilla } from './aleatorio'

describe('aleatorio determinístico', () => {
  it('produce la misma secuencia con la misma semilla', () => {
    const a = mulberry32(42), b = mulberry32(42)
    const sa = Array.from({ length: 20 }, () => a())
    const sb = Array.from({ length: 20 }, () => b())
    expect(sa).toEqual(sb)
  })

  it('produce secuencias distintas con semillas distintas', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })

  it('devuelve valores en el intervalo [0, 1)', () => {
    const r = mulberry32(7)
    for (let i = 0; i < 500; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('convierte texto en semilla de forma estable', () => {
    expect(hashSemilla('dir-registro::servicio::1'))
      .toBe(hashSemilla('dir-registro::servicio::1'))
    expect(hashSemilla('a')).not.toBe(hashSemilla('b'))
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `cd app && npm test -- aleatorio`
Expected: FAIL — módulo no encontrado

- [ ] **Step 3: Implementar el generador aleatorio**

`app/src/data/mock/aleatorio.ts`:

```ts
/** PRNG determinístico. Prohibido usar Math.random en src/data/mock. */
export function mulberry32(semilla: number): () => number {
  let s = semilla >>> 0
  return () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Hash FNV-1a de 32 bits: convierte un identificador en una semilla estable. */
export function hashSemilla(texto: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- aleatorio`
Expected: PASS, 4 tests

- [ ] **Step 5: Escribir las cifras ancla**

`app/src/data/anclas.ts`:

```ts
/**
 * CIFRAS ANCLA INSTITUCIONALES — PUNTO ÚNICO DE CORRECCIÓN.
 *
 * PENDIENTE DE VALIDACIÓN con la UASD antes de la presentación al Rector.
 * Son aproximaciones de orden de magnitud, no cifras oficiales verificadas.
 * Todo el desglose sintético se deriva de aquí: corregir estos valores
 * recalibra el tablero completo sin tocar ninguna otra línea de código.
 */
export const ANCLAS = {
  matriculaTotal: 186_000,
  matriculaSede: 118_000,
  nuevoIngresoAnual: 28_000,
  egresadosAnual: 12_500,
  empleadosTotal: 12_000,
  docentesTotal: 5_200,
  presupuestoAnualRD: 14_800_000_000,
  ejecucionPresupuestariaPct: 78.4,
  satisfaccionGeneralPct: 82.1,
  cumplimientoPoaPct: 84.6,
  facultades: 9,
  escuelas: 52,
  recintos: 4,
  centros: 18,
  subcentros: 12,
} as const
```

- [ ] **Step 6: Escribir los tests que fallan del generador de series**

`app/src/data/mock/generador.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generarSerie, clasificar } from './generador'
import { INDICADORES } from './catalogo'

describe('clasificar', () => {
  it('aplica los umbrales de semáforo', () => {
    expect(clasificar(120)).toBe('verde')
    expect(clasificar(95)).toBe('verde')
    expect(clasificar(94.9)).toBe('ambar')
    expect(clasificar(80)).toBe('ambar')
    expect(clasificar(79.9)).toBe('rojo')
  })
})

describe('generarSerie', () => {
  it('es determinística entre llamadas', () => {
    const a = generarSerie('dir-registro::servicio::1')
    const b = generarSerie('dir-registro::servicio::1')
    expect(a).toEqual(b)
  })

  it('devuelve 24 meses en orden cronológico', () => {
    const s = generarSerie('dir-registro::servicio::1')
    expect(s).toHaveLength(24)
    const periodos = s.map(p => p.periodo)
    expect([...periodos].sort()).toEqual(periodos)
    expect(periodos[0]).toMatch(/^\d{4}-\d{2}$/)
  })

  it('nunca produce valores negativos ni metas en cero', () => {
    for (const id of ['dir-registro::servicio::1', 'recinto-santiago::proceso::7',
                      'esc-medicina::servicio::3', 'vic-admin::proceso::10']) {
      for (const p of generarSerie(id)) {
        expect(p.valor, id).toBeGreaterThanOrEqual(0)
        expect(p.meta, id).toBeGreaterThan(0)
      }
    }
  })

  it('mantiene los porcentajes dentro de 0 a 100', () => {
    const pct = INDICADORES.filter(i => i.tipoMetrica === 'porcentaje').slice(0, 50)
    for (const i of pct) {
      for (const p of generarSerie(i.id)) {
        expect(p.valor, i.id).toBeLessThanOrEqual(100)
        expect(p.valor, i.id).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('calcula el cumplimiento invertido cuando menor es mejor', () => {
    const menor = INDICADORES.find(i => i.direccion === 'menor-mejor')!
    const p = generarSerie(menor.id).at(-1)!
    // Con menor-mejor, cumplir la meta significa estar por debajo de ella.
    const esperado = (p.meta / p.valor) * 100
    expect(p.cumplimiento).toBeCloseTo(esperado, 4)
  })

  it('reparte los semáforos del mes vigente en 70 / 20 / 10 con ±3 puntos', () => {
    const ultimos = INDICADORES.map(i => generarSerie(i.id).at(-1)!)
    const pct = (s: string) =>
      (ultimos.filter(p => p.semaforo === s).length / ultimos.length) * 100
    expect(pct('verde')).toBeGreaterThan(67)
    expect(pct('verde')).toBeLessThan(73)
    expect(pct('ambar')).toBeGreaterThan(17)
    expect(pct('ambar')).toBeLessThan(23)
    expect(pct('rojo')).toBeGreaterThan(7)
    expect(pct('rojo')).toBeLessThan(13)
  })

  it('escala la magnitud según el peso de la unidad', () => {
    // La Sede Central pesa mucho más que el subcentro de Pedernales.
    const sede = generarSerie('sede-central::servicio::1').at(-1)!.valor
    const pedernales = generarSerie('subcentro-pedernales::servicio::1').at(-1)!.valor
    expect(sede).toBeGreaterThan(pedernales * 10)
  })

  it('marca la tendencia comparando con el mes anterior', () => {
    const s = generarSerie('dir-registro::servicio::1')
    const [previo, ultimo] = [s.at(-2)!, s.at(-1)!]
    const delta = (ultimo.valor - previo.valor) / previo.valor
    const esperado = delta > 0.02 ? 'alza' : delta < -0.02 ? 'baja' : 'estable'
    expect(ultimo.tendencia).toBe(esperado)
  })

  it('no usa Math.random', async () => {
    const fuente = await import('node:fs/promises')
      .then(fs => fs.readFile('src/data/mock/generador.ts', 'utf8'))
    expect(fuente).not.toContain('Math.random')
    expect(fuente).not.toContain('Date.now')
  })
})
```

- [ ] **Step 7: Ejecutar y verificar que falla**

Run: `cd app && npm test -- generador`
Expected: FAIL — módulo no encontrado

- [ ] **Step 8: Implementar el generador**

`app/src/data/mock/generador.ts`:

```ts
import type { PuntoSerie, Semaforo, Indicador } from '../tipos'
import { mulberry32, hashSemilla } from './aleatorio'
import { INDICADORES } from './catalogo'
import { porId } from './unidades'
import { ahora } from '../reloj'

export const SEMILLA_GLOBAL = 20260825

export function clasificar(cumplimiento: number): Semaforo {
  if (cumplimiento >= 95) return 'verde'
  if (cumplimiento >= 80) return 'ambar'
  return 'rojo'
}

/** Bandas de cumplimiento objetivo, calibradas a 70 / 20 / 10. */
const BANDAS: [number, [number, number]][] = [
  [0.70, [96, 118]],   // verde
  [0.90, [82, 94]],    // ámbar
  [1.00, [58, 78]],    // rojo
]

const bandaDe = (r: number): [number, number] =>
  BANDAS.find(([tope]) => r < tope)![1]

/** Estacionalidad académica: picos en inscripción, valle en julio. */
const ESTACIONAL = [1.02, 0.98, 1.00, 1.01, 1.03, 0.95,
                    0.82, 1.18, 1.12, 1.00, 0.99, 0.94]

const magnitudBase = (ind: Indicador, peso: number, r: () => number): number => {
  switch (ind.tipoMetrica) {
    case 'porcentaje': return 0                       // se resuelve por banda
    case 'dias':       return 2 + r() * 18            // 2 a 20 días
    case 'moneda':     return peso * (180_000 + r() * 620_000)
    default:           return Math.max(4, peso * (3 + r() * 40))
  }
}

const periodosHasta = (fin: Date, meses: number): string[] => {
  const salida: string[] = []
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth() - i, 1))
    salida.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
  }
  return salida
}

const indice = new Map(INDICADORES.map(i => [i.id, i]))

export function generarSerie(indicadorId: string, meses = 24): PuntoSerie[] {
  const ind = indice.get(indicadorId)
  if (!ind) return []
  const peso = porId(ind.unidadId)?.peso ?? 1

  const r = mulberry32(hashSemilla(indicadorId) ^ SEMILLA_GLOBAL)
  const [minCump, maxCump] = bandaDe(r())
  const base = magnitudBase(ind, peso, r)
  const deriva = (r() - 0.45) * 0.006          // tendencia mensual suave

  const periodos = periodosHasta(ahora(), meses)
  const puntos: PuntoSerie[] = []

  for (let k = 0; k < periodos.length; k++) {
    const mes = Number(periodos[k].slice(5)) - 1
    const ruido = 0.94 + r() * 0.12
    const factor = (1 + deriva * k) * ESTACIONAL[mes] * ruido

    let valor: number, meta: number
    if (ind.tipoMetrica === 'porcentaje') {
      meta = 90
      const cump = minCump + r() * (maxCump - minCump)
      valor = Math.min(100, Math.max(0, (meta * cump) / 100))
    } else if (ind.direccion === 'menor-mejor') {
      meta = base
      const cump = minCump + r() * (maxCump - minCump)
      valor = Math.max(0.1, (meta * 100) / cump)
    } else {
      meta = base * factor
      const cump = minCump + r() * (maxCump - minCump)
      valor = Math.max(0, (meta * cump) / 100)
    }

    const redondear = (n: number) =>
      ind.tipoMetrica === 'conteo' ? Math.round(n) : Math.round(n * 10) / 10
    valor = redondear(valor)
    meta = redondear(meta)

    const cumplimiento = ind.direccion === 'menor-mejor'
      ? (meta / Math.max(valor, 0.1)) * 100
      : (valor / meta) * 100

    const previo = puntos.at(-1)
    const delta = previo ? (valor - previo.valor) / Math.max(previo.valor, 0.1) : 0
    const tendencia = delta > 0.02 ? 'alza' : delta < -0.02 ? 'baja' : 'estable'

    puntos.push({
      indicadorId, periodo: periodos[k], valor, meta,
      cumplimiento, semaforo: clasificar(cumplimiento), tendencia,
    })
  }
  return puntos
}
```

> **Cuidado con la banda:** el test de distribución 70/20/10 evalúa el **último** punto. Como `minCump`/`maxCump` se fijan una sola vez por indicador y se aplican a todos sus meses, el semáforo del último mes cae siempre dentro de la banda sorteada. Si el test falla, verificar que `bandaDe` consuma exactamente un valor de `r()` y que ese sea el **primero** que se consume tras crear el PRNG.

> **Cuidado con el redondeo:** para `conteo`, redondear `valor` y `meta` antes de calcular el cumplimiento puede empujar un caso justo fuera de banda. Los umbrales de las bandas dejan holgura de un punto respecto a los umbrales de semáforo (96 vs 95, 82 vs 80) precisamente para absorberlo.

- [ ] **Step 9: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- generador`
Expected: PASS, 10 tests. Si el test de distribución falla por poco, ajustar las bandas de `BANDAS`, nunca las tolerancias del test.

- [ ] **Step 10: Medir el costo de generar todo el catálogo**

Crear `app/src/data/mock/generador.bench.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { INDICADORES } from './catalogo'
import { generarSerie } from './generador'

describe('costo de generación', () => {
  it('genera el catálogo completo en menos de 3 segundos', () => {
    const t0 = performance.now()
    let puntos = 0
    for (const i of INDICADORES) puntos += generarSerie(i.id).length
    const ms = performance.now() - t0
    expect(puntos).toBe(INDICADORES.length * 24)
    expect(ms).toBeLessThan(3000)
  })
})
```

Run: `cd app && npm test -- generador.bench`
Expected: PASS. Si tarda más de 3 s, la Tarea 5 deberá memoizar por indicador en lugar de precalcular todo.

- [ ] **Step 11: Commit**

```bash
git add app/src/data
git commit -m "Añade las cifras ancla y el generador determinístico de series"
```

---

## Task 5: Interfaz DataSource y su implementación simulada

**Files:**
- Create: `app/src/data/source.ts`, `app/src/data/mock/MockDataSource.ts`
- Test: `app/src/data/mock/MockDataSource.test.ts`

**Interfaces:**
- Consumes: todo lo anterior de `data/`.
- Produces: tipos `Filtro`, `ResumenAgregado`, `FilaUnidad` y la interfaz `DataSource` desde `data/source.ts`; `mockDataSource: DataSource` desde `data/mock/MockDataSource.ts`.

`Filtro` se define aquí, no en `state/`, porque la capa de datos es quien lo consume.

- [ ] **Step 1: Definir la interfaz**

`app/src/data/source.ts`:

```ts
import type {
  Unidad, Indicador, PuntoSerie, NivelId, NivelInfo,
  CategoriaIndicador, Semaforo,
} from './tipos'

export type Periodo = 'mes' | 'trimestre' | 'semestre' | 'anio' | 'comparativo'
export type EstadoFiltro = 'todos' | 'verde' | 'ambar' | 'rojo'

export interface Filtro {
  nivel: NivelId | null
  areaId: string | null
  unidadId: string | null
  periodo: Periodo
  categoria: CategoriaIndicador | 'todas'
  estado: EstadoFiltro
}

/** Una unidad con su desempeño ya resuelto, lista para pintar. */
export interface FilaUnidad {
  unidad: Unidad
  cumplimiento: number
  semaforo: Semaforo
  serie: number[]          // 12 valores, para el minigráfico
  indicadoresEnRojo: number
}

export interface ResumenAgregado {
  cumplimiento: number
  semaforo: Semaforo
  totalIndicadores: number
  porSemaforo: Record<Semaforo, number>
  mejores: FilaUnidad[]     // 5 unidades
  enAlerta: FilaUnidad[]    // 5 unidades
}

export interface DataSource {
  getNiveles(): NivelInfo[]
  getUnidades(): Unidad[]
  getAreas(nivel: NivelId | null): Unidad[]
  getUnidadesDe(nivel: NivelId | null, areaId: string | null): Unidad[]
  getIndicadores(unidadId: string, f: Filtro): Indicador[]
  getSerie(indicadorId: string): PuntoSerie[]
  getUltimo(indicadorId: string): PuntoSerie | undefined
  getResumen(f: Filtro): ResumenAgregado
  getFilas(f: Filtro): FilaUnidad[]
  getTerritoriales(): FilaUnidad[]
}
```

- [ ] **Step 2: Escribir los tests que fallan**

`app/src/data/mock/MockDataSource.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { mockDataSource as ds } from './MockDataSource'
import type { Filtro } from '../source'

const base: Filtro = {
  nivel: null, areaId: null, unidadId: null,
  periodo: 'mes', categoria: 'todas', estado: 'todos',
}

describe('MockDataSource', () => {
  it('expone los 12 niveles', () => {
    expect(ds.getNiveles()).toHaveLength(12)
  })

  it('con nivel Escuelas, las áreas son las nueve facultades', () => {
    const areas = ds.getAreas(12)
    expect(areas).toHaveLength(9)
    expect(areas.every(a => a.tipo === 'facultad')).toBe(true)
  })

  it('con nivel Recintos, las unidades son los cuatro recintos', () => {
    expect(ds.getUnidadesDe(6, null)).toHaveLength(4)
  })

  it('recorta las unidades al área escogida', () => {
    const u = ds.getUnidadesDe(12, 'fac-salud')
    expect(u).toHaveLength(8)
    expect(u.every(x => x.padreId === 'fac-salud')).toBe(true)
  })

  it('filtra los indicadores por categoría', () => {
    const ind = ds.getIndicadores('dir-registro', { ...base, categoria: 'servicio' })
    expect(ind).toHaveLength(10)
    expect(ind.every(i => i.categoria === 'servicio')).toBe(true)
  })

  it('filtra los indicadores por estado de semáforo', () => {
    const ind = ds.getIndicadores('dir-registro', { ...base, estado: 'rojo' })
    for (const i of ind) expect(ds.getUltimo(i.id)!.semaforo).toBe('rojo')
  })

  it('devuelve el último punto de la serie', () => {
    const serie = ds.getSerie('dir-registro::servicio::1')
    expect(ds.getUltimo('dir-registro::servicio::1')).toEqual(serie.at(-1))
  })

  it('resume el conjunto institucional completo sin filtros', () => {
    const r = ds.getResumen(base)
    expect(r.totalIndicadores).toBeGreaterThan(2500)
    expect(r.porSemaforo.verde + r.porSemaforo.ambar + r.porSemaforo.rojo)
      .toBe(r.totalIndicadores)
  })

  it('restringe el resumen a la unidad escogida', () => {
    expect(ds.getResumen({ ...base, unidadId: 'dir-registro' }).totalIndicadores).toBe(20)
  })

  it('incluye la descendencia al resumir un área', () => {
    // Facultad de Salud: 1 facultad + 8 escuelas = 9 unidades = 180 indicadores.
    expect(ds.getResumen({ ...base, unidadId: 'fac-salud' }).totalIndicadores).toBe(180)
  })

  it('entrega cinco mejores y cinco en alerta, ordenados', () => {
    const r = ds.getResumen(base)
    expect(r.mejores).toHaveLength(5)
    expect(r.enAlerta).toHaveLength(5)
    const c = r.mejores.map(f => f.cumplimiento)
    expect([...c].sort((a, b) => b - a)).toEqual(c)
    expect(r.mejores[0].cumplimiento).toBeGreaterThan(r.enAlerta[0].cumplimiento)
  })

  it('entrega la red territorial con minigráfico de doce puntos', () => {
    const t = ds.getTerritoriales()
    expect(t.length).toBe(1 + 4 + 18 + 12)   // sede + recintos + centros + subcentros
    expect(t[0].serie).toHaveLength(12)
    expect(t.every(f => f.unidad.coords)).toBe(true)
  })

  it('es estable entre llamadas', () => {
    expect(ds.getResumen(base)).toEqual(ds.getResumen(base))
  })
})
```

- [ ] **Step 3: Ejecutar y verificar que falla**

Run: `cd app && npm test -- MockDataSource`
Expected: FAIL — módulo no encontrado

- [ ] **Step 4: Implementar MockDataSource**

`app/src/data/mock/MockDataSource.ts`:

```ts
import type { DataSource, Filtro, FilaUnidad, ResumenAgregado } from '../source'
import type { Unidad, Indicador, PuntoSerie, Semaforo } from '../tipos'
import { UNIDADES, NIVELES, porId, hijosDe } from './unidades'
import { INDICADORES, indicadoresDe } from './catalogo'
import { generarSerie, clasificar } from './generador'

/** Memoización: la serie de un indicador se calcula una sola vez. */
const cacheSerie = new Map<string, PuntoSerie[]>()
const serieDe = (id: string): PuntoSerie[] => {
  let s = cacheSerie.get(id)
  if (!s) { s = generarSerie(id); cacheSerie.set(id, s) }
  return s
}

/** Nivel → tipo de unidad que le corresponde. */
const TIPO_POR_NIVEL: Record<number, string> = {
  1: 'organismo', 2: 'vicerrectoria', 3: 'direccion', 4: 'direccion',
  5: 'direccion', 6: 'recinto', 7: 'centro', 8: 'subcentro',
  9: 'instituto', 10: 'servicio', 11: 'facultad', 12: 'escuela',
}

const descendientes = (id: string): Unidad[] => {
  const salida: Unidad[] = []
  const pila = [id]
  while (pila.length) {
    const actual = pila.pop()!
    for (const h of hijosDe(actual)) { salida.push(h); pila.push(h.id) }
  }
  return salida
}

/** Unidades sobre las que opera el filtro actual. */
function alcance(f: Filtro): Unidad[] {
  if (f.unidadId) {
    const u = porId(f.unidadId)
    return u ? [u, ...descendientes(u.id)] : []
  }
  if (f.areaId) {
    const a = porId(f.areaId)
    return a ? [a, ...descendientes(a.id)] : []
  }
  if (f.nivel) return UNIDADES.filter(u => u.nivel === f.nivel)
  return UNIDADES
}

function filaDe(u: Unidad): FilaUnidad {
  const ind = indicadoresDe(u.id)
  const ultimos = ind.map(i => serieDe(i.id).at(-1)!)
  const cumplimiento = ind.length
    ? ultimos.reduce((a, p) => a + p.cumplimiento, 0) / ind.length : 0
  // Minigráfico: cumplimiento promedio de la unidad en los últimos 12 meses.
  const serie = Array.from({ length: 12 }, (_, k) => {
    const idx = 12 + k
    const suma = ind.reduce((a, i) => a + (serieDe(i.id)[idx]?.cumplimiento ?? 0), 0)
    return Math.round((suma / Math.max(ind.length, 1)) * 10) / 10
  })
  return {
    unidad: u, cumplimiento, semaforo: clasificar(cumplimiento), serie,
    indicadoresEnRojo: ultimos.filter(p => p.semaforo === 'rojo').length,
  }
}

const cacheFila = new Map<string, FilaUnidad>()
const fila = (u: Unidad): FilaUnidad => {
  let f = cacheFila.get(u.id)
  if (!f) { f = filaDe(u); cacheFila.set(u.id, f) }
  return f
}

export const mockDataSource: DataSource = {
  getNiveles: () => [...NIVELES].sort((a, b) => a.orden - b.orden),

  getUnidades: () => UNIDADES,

  getAreas(nivel) {
    if (nivel === 12) return UNIDADES.filter(u => u.tipo === 'facultad')
    if (nivel === null || nivel === 2 || nivel === 11)
      return UNIDADES.filter(u => u.tipo === 'vicerrectoria')
    if ([6, 7, 8].includes(nivel)) return []   // territorial: sin nivel intermedio
    // Para direcciones y organismos, el área es su unidad padre.
    const tipo = TIPO_POR_NIVEL[nivel]
    const padres = new Set(UNIDADES.filter(u => u.tipo === tipo).map(u => u.padreId))
    return UNIDADES.filter(u => padres.has(u.id))
  },

  getUnidadesDe(nivel, areaId) {
    let lista = nivel ? UNIDADES.filter(u => u.nivel === nivel) : UNIDADES
    if (areaId) lista = lista.filter(u => u.padreId === areaId)
    return lista
  },

  getIndicadores(unidadId, f) {
    let ind: Indicador[] = indicadoresDe(unidadId)
    if (f.categoria !== 'todas') ind = ind.filter(i => i.categoria === f.categoria)
    if (f.estado !== 'todos')
      ind = ind.filter(i => serieDe(i.id).at(-1)?.semaforo === f.estado)
    return ind
  },

  getSerie: serieDe,
  getUltimo: (id) => serieDe(id).at(-1),

  getResumen(f): ResumenAgregado {
    const unidades = alcance(f)
    const ids = new Set(unidades.map(u => u.id))
    let ind = INDICADORES.filter(i => ids.has(i.unidadId))
    if (f.categoria !== 'todas') ind = ind.filter(i => i.categoria === f.categoria)

    const ultimos = ind.map(i => serieDe(i.id).at(-1)!)
    const porSemaforo: Record<Semaforo, number> = { verde: 0, ambar: 0, rojo: 0 }
    for (const p of ultimos) porSemaforo[p.semaforo]++

    const cumplimiento = ultimos.length
      ? ultimos.reduce((a, p) => a + p.cumplimiento, 0) / ultimos.length : 0

    const filas = unidades.filter(u => indicadoresDe(u.id).length).map(fila)
    const orden = [...filas].sort((a, b) => b.cumplimiento - a.cumplimiento)

    return {
      cumplimiento, semaforo: clasificar(cumplimiento),
      totalIndicadores: ind.length, porSemaforo,
      mejores: orden.slice(0, 5),
      enAlerta: orden.slice(-5).reverse(),
    }
  },

  getFilas: (f) => alcance(f).map(fila),

  getTerritoriales: () => UNIDADES.filter(u => u.coords).map(fila),
}
```

> **Cuidado con `getResumen` para `fac-salud`:** el test espera 180 indicadores, lo que exige que `alcance` incluya la facultad **más** sus 8 escuelas. Si el conteo da 160, `alcance` no está incluyendo la propia unidad; si da 20, no está bajando a la descendencia.

> **Cuidado con `enAlerta`:** `slice(-5).reverse()` deja la peor unidad primero, que es lo que espera el test al comparar contra `mejores[0]`.

- [ ] **Step 5: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- MockDataSource`
Expected: PASS, 13 tests

- [ ] **Step 6: Ejecutar toda la batería**

Run: `cd app && npm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add app/src/data
git commit -m "Añade la interfaz DataSource y su implementación simulada"
```

---

## Task 6: Estado de filtros en cascada

**Files:**
- Create: `app/src/state/filtros.ts`, `app/src/state/FiltrosContext.tsx`
- Test: `app/src/state/filtros.test.ts`

**Interfaces:**
- Consumes: `Filtro`, `Periodo`, `EstadoFiltro` de `data/source.ts`; `porId`, `ancestrosDe`, `NIVELES` de `data/mock/unidades.ts`.
- Produces:
  - `FILTRO_INICIAL: Filtro`, `EstadoFiltros = { actual: Filtro; historial: Filtro[] }`, `Accion`, `ClaveFiltro`, `reducir(e, a): EstadoFiltros`, `chipsDe(f): Chip[]` con `Chip = { clave: ClaveFiltro; etiqueta: string }` desde `state/filtros.ts`.
  - `<ProveedorFiltros>` y `useFiltros(): { filtro, historial, despachar }` desde `state/FiltrosContext.tsx`.

- [ ] **Step 1: Escribir los tests que fallan**

`app/src/state/filtros.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { FILTRO_INICIAL, reducir, chipsDe, type EstadoFiltros } from './filtros'

const inicial: EstadoFiltros = { actual: FILTRO_INICIAL, historial: [] }

describe('reducir', () => {
  it('parte sin ningún filtro aplicado', () => {
    expect(FILTRO_INICIAL).toEqual({
      nivel: null, areaId: null, unidadId: null,
      periodo: 'mes', categoria: 'todas', estado: 'todos',
    })
  })

  it('al cambiar el nivel, limpia área y unidad', () => {
    let e = reducir(inicial, { tipo: 'nivel', valor: 12 })
    e = reducir(e, { tipo: 'area', valor: 'fac-salud' })
    e = reducir(e, { tipo: 'unidad', valor: 'esc-medicina' })
    e = reducir(e, { tipo: 'nivel', valor: 6 })
    expect(e.actual.nivel).toBe(6)
    expect(e.actual.areaId).toBeNull()
    expect(e.actual.unidadId).toBeNull()
  })

  it('al cambiar el área, limpia la unidad pero conserva el nivel', () => {
    let e = reducir(inicial, { tipo: 'nivel', valor: 12 })
    e = reducir(e, { tipo: 'area', valor: 'fac-salud' })
    e = reducir(e, { tipo: 'unidad', valor: 'esc-medicina' })
    e = reducir(e, { tipo: 'area', valor: 'fac-ciencias' })
    expect(e.actual.nivel).toBe(12)
    expect(e.actual.areaId).toBe('fac-ciencias')
    expect(e.actual.unidadId).toBeNull()
  })

  it('no limpia nada al cambiar período, categoría o estado', () => {
    let e = reducir(inicial, { tipo: 'unidad', valor: 'dir-registro' })
    e = reducir(e, { tipo: 'periodo', valor: 'anio' })
    e = reducir(e, { tipo: 'categoria', valor: 'servicio' })
    e = reducir(e, { tipo: 'estado', valor: 'rojo' })
    expect(e.actual.unidadId).toBe('dir-registro')
    expect(e.actual.periodo).toBe('anio')
    expect(e.actual.categoria).toBe('servicio')
    expect(e.actual.estado).toBe('rojo')
  })

  it('seleccionar una escuela por clic rellena nivel y área hacia arriba', () => {
    const e = reducir(inicial, { tipo: 'seleccionarUnidad', valor: 'esc-medicina' })
    expect(e.actual.unidadId).toBe('esc-medicina')
    expect(e.actual.areaId).toBe('fac-salud')
    expect(e.actual.nivel).toBe(12)
  })

  it('seleccionar un recinto por clic no inventa área', () => {
    const e = reducir(inicial, { tipo: 'seleccionarUnidad', valor: 'recinto-barahona' })
    expect(e.actual.nivel).toBe(6)
    expect(e.actual.unidadId).toBe('recinto-barahona')
    expect(e.actual.areaId).toBeNull()
  })

  it('apila el historial en cada cambio', () => {
    let e = reducir(inicial, { tipo: 'nivel', valor: 6 })
    e = reducir(e, { tipo: 'unidad', valor: 'recinto-santiago' })
    expect(e.historial).toHaveLength(2)
  })

  it('atrás deshace el último cambio', () => {
    let e = reducir(inicial, { tipo: 'nivel', valor: 6 })
    e = reducir(e, { tipo: 'unidad', valor: 'recinto-santiago' })
    e = reducir(e, { tipo: 'atras' })
    expect(e.actual.unidadId).toBeNull()
    expect(e.actual.nivel).toBe(6)
    expect(e.historial).toHaveLength(1)
  })

  it('atrás sobre historial vacío no rompe nada', () => {
    expect(reducir(inicial, { tipo: 'atras' }).actual).toEqual(FILTRO_INICIAL)
  })

  it('limpiar todo devuelve al estado inicial y vacía el historial', () => {
    let e = reducir(inicial, { tipo: 'nivel', valor: 6 })
    e = reducir(e, { tipo: 'estado', valor: 'rojo' })
    e = reducir(e, { tipo: 'limpiar' })
    expect(e.actual).toEqual(FILTRO_INICIAL)
    expect(e.historial).toEqual([])
  })

  it('quitar un filtro también limpia los que dependen de él', () => {
    let e = reducir(inicial, { tipo: 'seleccionarUnidad', valor: 'esc-medicina' })
    e = reducir(e, { tipo: 'quitar', valor: 'area' })
    expect(e.actual.areaId).toBeNull()
    expect(e.actual.unidadId).toBeNull()
    expect(e.actual.nivel).toBe(12)
  })
})

describe('chipsDe', () => {
  it('no produce chips sin filtros', () => {
    expect(chipsDe(FILTRO_INICIAL)).toEqual([])
  })

  it('produce un chip legible por cada filtro activo', () => {
    let e = reducir(inicial, { tipo: 'seleccionarUnidad', valor: 'recinto-barahona' })
    e = reducir(e, { tipo: 'estado', valor: 'rojo' })
    const etiquetas = chipsDe(e.actual).map(c => c.etiqueta)
    expect(etiquetas).toContain('Recintos')
    expect(etiquetas).toContain('Recinto Barahona')
    expect(etiquetas).toContain('Incumplido')
  })

  it('no produce chip para el período por defecto', () => {
    expect(chipsDe({ ...FILTRO_INICIAL, periodo: 'mes' })
      .find(c => c.clave === 'periodo')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `cd app && npm test -- state/filtros`
Expected: FAIL — módulo no encontrado

- [ ] **Step 3: Implementar el reductor**

`app/src/state/filtros.ts`:

```ts
import type { Filtro, Periodo, EstadoFiltro } from '../data/source'
import type { NivelId, CategoriaIndicador } from '../data/tipos'
import { porId, ancestrosDe, NIVELES } from '../data/mock/unidades'

export const FILTRO_INICIAL: Filtro = {
  nivel: null, areaId: null, unidadId: null,
  periodo: 'mes', categoria: 'todas', estado: 'todos',
}

export interface EstadoFiltros { actual: Filtro; historial: Filtro[] }

export type ClaveFiltro = 'nivel' | 'area' | 'unidad' | 'periodo' | 'categoria' | 'estado'

export type Accion =
  | { tipo: 'nivel'; valor: NivelId | null }
  | { tipo: 'area'; valor: string | null }
  | { tipo: 'unidad'; valor: string | null }
  | { tipo: 'periodo'; valor: Periodo }
  | { tipo: 'categoria'; valor: CategoriaIndicador | 'todas' }
  | { tipo: 'estado'; valor: EstadoFiltro }
  | { tipo: 'seleccionarUnidad'; valor: string }
  | { tipo: 'quitar'; valor: ClaveFiltro }
  | { tipo: 'atras' }
  | { tipo: 'limpiar' }

const apilar = (e: EstadoFiltros, actual: Filtro): EstadoFiltros =>
  ({ actual, historial: [...e.historial, e.actual] })

/** Reconstruye nivel y área a partir de una unidad seleccionada por clic. */
function desdeUnidad(f: Filtro, unidadId: string): Filtro {
  const u = porId(unidadId)
  if (!u) return f
  const padre = ancestrosDe(unidadId)[0]
  // Solo facultades y vicerrectorías funcionan como "área" en la cascada.
  const areaId = padre && ['facultad', 'vicerrectoria'].includes(padre.tipo)
    ? padre.id : null
  return { ...f, nivel: u.nivel, areaId, unidadId }
}

function quitar(f: Filtro, clave: ClaveFiltro): Filtro {
  switch (clave) {
    case 'nivel':     return { ...f, nivel: null, areaId: null, unidadId: null }
    case 'area':      return { ...f, areaId: null, unidadId: null }
    case 'unidad':    return { ...f, unidadId: null }
    case 'periodo':   return { ...f, periodo: 'mes' }
    case 'categoria': return { ...f, categoria: 'todas' }
    case 'estado':    return { ...f, estado: 'todos' }
  }
}

export function reducir(e: EstadoFiltros, a: Accion): EstadoFiltros {
  const f = e.actual
  switch (a.tipo) {
    case 'nivel':
      return apilar(e, { ...f, nivel: a.valor, areaId: null, unidadId: null })
    case 'area':
      return apilar(e, { ...f, areaId: a.valor, unidadId: null })
    case 'unidad':
      return apilar(e, { ...f, unidadId: a.valor })
    case 'periodo':
      return apilar(e, { ...f, periodo: a.valor })
    case 'categoria':
      return apilar(e, { ...f, categoria: a.valor })
    case 'estado':
      return apilar(e, { ...f, estado: a.valor })
    case 'seleccionarUnidad':
      return apilar(e, desdeUnidad(f, a.valor))
    case 'quitar':
      return apilar(e, quitar(f, a.valor))
    case 'atras':
      return e.historial.length
        ? { actual: e.historial.at(-1)!, historial: e.historial.slice(0, -1) }
        : e
    case 'limpiar':
      return { actual: FILTRO_INICIAL, historial: [] }
  }
}

export interface Chip { clave: ClaveFiltro; etiqueta: string }

const ETIQUETA_PERIODO: Record<Periodo, string> = {
  mes: 'Mes actual', trimestre: 'Trimestre', semestre: 'Semestre',
  anio: 'Año', comparativo: 'Comparativo 2025 vs 2026',
}
const ETIQUETA_ESTADO: Record<EstadoFiltro, string> = {
  todos: 'Todos', verde: 'En meta', ambar: 'En riesgo', rojo: 'Incumplido',
}

export function chipsDe(f: Filtro): Chip[] {
  const chips: Chip[] = []
  if (f.nivel !== null) {
    const n = NIVELES.find(x => x.id === f.nivel)
    if (n) chips.push({ clave: 'nivel', etiqueta: n.nombre })
  }
  if (f.areaId) {
    const a = porId(f.areaId)
    if (a) chips.push({ clave: 'area', etiqueta: a.nombre })
  }
  if (f.unidadId) {
    const u = porId(f.unidadId)
    if (u) chips.push({ clave: 'unidad', etiqueta: u.nombre })
  }
  if (f.periodo !== 'mes')
    chips.push({ clave: 'periodo', etiqueta: ETIQUETA_PERIODO[f.periodo] })
  if (f.categoria !== 'todas')
    chips.push({
      clave: 'categoria',
      etiqueta: f.categoria === 'servicio'
        ? 'Indicadores de Servicio' : 'Indicadores de Proceso',
    })
  if (f.estado !== 'todos')
    chips.push({ clave: 'estado', etiqueta: ETIQUETA_ESTADO[f.estado] })
  return chips
}
```

> **Cuidado:** el test espera el chip literal `'Recintos'`. Esa etiqueta sale de `NIVELES`, donde el nivel 6 se llama exactamente `Recintos`. Si se renombra el nivel, el test falla, y eso es correcto.

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- state/filtros`
Expected: PASS, 14 tests

- [ ] **Step 5: Envolver el reductor en un contexto de React**

`app/src/state/FiltrosContext.tsx`:

```tsx
import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { FILTRO_INICIAL, reducir, type Accion, type EstadoFiltros } from './filtros'
import type { Filtro } from '../data/source'

interface Valor {
  filtro: Filtro
  historial: Filtro[]
  despachar: (a: Accion) => void
}

const Ctx = createContext<Valor | null>(null)

export function ProveedorFiltros({ children }: { children: ReactNode }) {
  const inicial: EstadoFiltros = { actual: FILTRO_INICIAL, historial: [] }
  const [estado, despachar] = useReducer(reducir, inicial)
  return (
    <Ctx.Provider value={{
      filtro: estado.actual, historial: estado.historial, despachar,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useFiltros(): Valor {
  const v = useContext(Ctx)
  if (!v) throw new Error('useFiltros debe usarse dentro de ProveedorFiltros')
  return v
}
```

- [ ] **Step 6: Ejecutar toda la batería**

Run: `cd app && npm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add app/src/state
git commit -m "Añade el estado de filtros en cascada y su contexto de React"
```

---

## Task 7: Barra de filtros

**Files:**
- Create: `app/src/components/filtros/Desplegable.tsx`, `app/src/components/filtros/ChipsFiltros.tsx`, `app/src/components/filtros/BarraFiltros.tsx`
- Test: `app/src/components/filtros/Desplegable.test.tsx`, `app/src/components/filtros/BarraFiltros.test.tsx`

**Interfaces:**
- Consumes: `useFiltros` de `state/FiltrosContext`; `chipsDe` de `state/filtros`; `mockDataSource` de `data/mock/MockDataSource`.
- Produces:
  - `Opcion = { valor: string; texto: string }` y `<Desplegable etiqueta opciones valor onCambio buscable? />` desde `Desplegable.tsx`.
  - `<ChipsFiltros />` y `<BarraFiltros />`.

- [ ] **Step 1: Escribir los tests que fallan del desplegable**

`app/src/components/filtros/Desplegable.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Desplegable } from './Desplegable'

const opciones = [
  { valor: 'a', texto: 'Recinto Santiago' },
  { valor: 'b', texto: 'Recinto Barahona' },
  { valor: 'c', texto: 'Recinto San Juan' },
]

describe('Desplegable', () => {
  it('muestra la etiqueta y el texto de la opción escogida', () => {
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor="b" onCambio={() => {}} />)
    expect(screen.getByText('Unidad')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('Recinto Barahona')
  })

  it('muestra "Todas" cuando no hay selección', () => {
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor={null} onCambio={() => {}} />)
    expect(screen.getByRole('button')).toHaveTextContent('Todas')
  })

  it('abre la lista al hacer clic y avisa la selección', async () => {
    const onCambio = vi.fn()
    const usuario = userEvent.setup()
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor={null} onCambio={onCambio} />)
    await usuario.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await usuario.click(screen.getByRole('option', { name: 'Recinto Barahona' }))
    expect(onCambio).toHaveBeenCalledWith('b')
  })

  it('incluye una opción para limpiar la selección', async () => {
    const onCambio = vi.fn()
    const usuario = userEvent.setup()
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor="a" onCambio={onCambio} />)
    await usuario.click(screen.getByRole('button'))
    await usuario.click(screen.getByRole('option', { name: 'Todas' }))
    expect(onCambio).toHaveBeenCalledWith(null)
  })

  it('filtra la lista con el buscador interno cuando es buscable', async () => {
    const usuario = userEvent.setup()
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor={null}
                        onCambio={() => {}} buscable />)
    await usuario.click(screen.getByRole('button'))
    await usuario.type(screen.getByPlaceholderText('Buscar…'), 'baraho')
    const textos = screen.getAllByRole('option').map(o => o.textContent)
    expect(textos).toEqual(['Todas', 'Recinto Barahona'])
  })

  it('ignora tildes al buscar', async () => {
    const usuario = userEvent.setup()
    render(<Desplegable etiqueta="Unidad"
      opciones={[{ valor: 'x', texto: 'Escuela de Bioanálisis' }]}
      valor={null} onCambio={() => {}} buscable />)
    await usuario.click(screen.getByRole('button'))
    await usuario.type(screen.getByPlaceholderText('Buscar…'), 'bioanalisis')
    expect(screen.getAllByRole('option')).toHaveLength(2)   // Todas + la coincidencia
  })

  it('se deshabilita cuando no hay opciones', () => {
    render(<Desplegable etiqueta="Área" opciones={[]} valor={null} onCambio={() => {}} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('cierra la lista con Escape', async () => {
    const usuario = userEvent.setup()
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor={null} onCambio={() => {}} />)
    await usuario.click(screen.getByRole('button'))
    await usuario.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `cd app && npm test -- Desplegable`
Expected: FAIL — módulo no encontrado

- [ ] **Step 3: Implementar el desplegable**

`app/src/components/filtros/Desplegable.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'

export interface Opcion { valor: string; texto: string }

interface Props {
  etiqueta: string
  opciones: Opcion[]
  valor: string | null
  onCambio: (v: string | null) => void
  buscable?: boolean
}

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function Desplegable({ etiqueta, opciones, valor, onCambio, buscable }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const alClic = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false)
    }
    const alTeclado = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', alClic)
    document.addEventListener('keydown', alTeclado)
    return () => {
      document.removeEventListener('mousedown', alClic)
      document.removeEventListener('keydown', alTeclado)
    }
  }, [abierto])

  const escogida = opciones.find(o => o.valor === valor)
  const visibles = busqueda
    ? opciones.filter(o => normalizar(o.texto).includes(normalizar(busqueda)))
    : opciones

  const escoger = (v: string | null) => { onCambio(v); setAbierto(false); setBusqueda('') }

  return (
    <div ref={contenedor} className="relative min-w-[13rem] flex-1">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-white/50">
        {etiqueta}
      </div>
      <button
        type="button"
        disabled={opciones.length === 0}
        onClick={() => setAbierto(a => !a)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className="flex w-full items-center justify-between gap-2 rounded-lg bg-panel-2
                   px-4 py-3 text-left text-base ring-1 ring-white/10
                   hover:ring-uasd-azul-claro disabled:opacity-40
                   disabled:hover:ring-white/10"
      >
        <span className="truncate">{escogida?.texto ?? 'Todas'}</span>
        <span aria-hidden className="text-white/40">▾</span>
      </button>

      {abierto && (
        <div className="absolute z-40 mt-1 max-h-80 w-full overflow-auto rounded-lg
                        bg-panel-2 py-1 shadow-2xl ring-1 ring-white/15">
          {buscable && (
            <input
              autoFocus
              placeholder="Buscar…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="mx-2 mb-1 w-[calc(100%-1rem)] rounded bg-panel px-3 py-2
                         text-sm outline-none ring-1 ring-white/10"
            />
          )}
          <ul role="listbox">
            <li role="option" aria-selected={valor === null}
                onClick={() => escoger(null)}
                className="cursor-pointer px-4 py-2.5 text-white/60 hover:bg-uasd-azul/40">
              Todas
            </li>
            {visibles.map(o => (
              <li key={o.valor} role="option" aria-selected={o.valor === valor}
                  onClick={() => escoger(o.valor)}
                  className={`cursor-pointer px-4 py-2.5 hover:bg-uasd-azul/40
                              ${o.valor === valor ? 'bg-uasd-azul/25' : ''}`}>
                {o.texto}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

> **Cuidado:** la opción «Todas» está siempre presente y no se filtra por el buscador. Por eso los tests de búsqueda esperan `['Todas', 'Recinto Barahona']` y `2` opciones, no `1`.

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- Desplegable`
Expected: PASS, 8 tests

- [ ] **Step 5: Escribir los tests que fallan de la barra**

`app/src/components/filtros/BarraFiltros.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProveedorFiltros } from '../../state/FiltrosContext'
import { BarraFiltros } from './BarraFiltros'

const montar = () => {
  render(<ProveedorFiltros><BarraFiltros /></ProveedorFiltros>)
  return userEvent.setup()
}

/** Los desplegables se identifican por su etiqueta visible. */
const abrir = async (usuario: ReturnType<typeof userEvent.setup>, etiqueta: string) => {
  const grupo = screen.getByText(etiqueta).parentElement!
  await usuario.click(grupo.querySelector('button')!)
}

describe('BarraFiltros', () => {
  it('muestra los seis filtros', () => {
    montar()
    for (const e of ['Nivel', 'Área / Dependencia', 'Unidad',
                     'Período', 'Tipo de indicador', 'Estado']) {
      expect(screen.getByText(e)).toBeInTheDocument()
    }
  })

  it('al escoger el nivel Recintos, Unidad lista solo los cuatro recintos', async () => {
    const usuario = montar()
    await abrir(usuario, 'Nivel')
    await usuario.click(screen.getByRole('option', { name: 'Recintos' }))
    await abrir(usuario, 'Unidad')
    expect(screen.getAllByRole('option')).toHaveLength(5)   // Todas + 4 recintos
  })

  it('al escoger un nivel aparece su chip', async () => {
    const usuario = montar()
    await abrir(usuario, 'Nivel')
    await usuario.click(screen.getByRole('option', { name: 'Recintos' }))
    expect(screen.getByRole('button', { name: 'Recintos ✕' })).toBeInTheDocument()
  })

  it('Limpiar todo retira los chips', async () => {
    const usuario = montar()
    await abrir(usuario, 'Nivel')
    await usuario.click(screen.getByRole('option', { name: 'Recintos' }))
    await usuario.click(screen.getByRole('button', { name: 'Limpiar todo' }))
    expect(screen.queryByRole('button', { name: 'Recintos ✕' })).not.toBeInTheDocument()
  })

  it('Atrás deshace el último filtro', async () => {
    const usuario = montar()
    await abrir(usuario, 'Nivel')
    await usuario.click(screen.getByRole('option', { name: 'Recintos' }))
    await usuario.click(screen.getByRole('button', { name: '← Atrás' }))
    expect(screen.queryByRole('button', { name: 'Recintos ✕' })).not.toBeInTheDocument()
  })

  it('deshabilita Área cuando el nivel no tiene áreas intermedias', async () => {
    const usuario = montar()
    await abrir(usuario, 'Nivel')
    await usuario.click(screen.getByRole('option', { name: 'Recintos' }))
    const grupo = screen.getByText('Área / Dependencia').parentElement!
    expect(grupo.querySelector('button')).toBeDisabled()
  })
})
```

- [ ] **Step 6: Ejecutar y verificar que falla**

Run: `cd app && npm test -- BarraFiltros`
Expected: FAIL — módulo no encontrado

- [ ] **Step 7: Implementar los chips y la barra**

`app/src/components/filtros/ChipsFiltros.tsx`:

```tsx
import { useFiltros } from '../../state/FiltrosContext'
import { chipsDe } from '../../state/filtros'

export function ChipsFiltros() {
  const { filtro, historial, despachar } = useFiltros()
  const chips = chipsDe(filtro)
  if (!chips.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
      {chips.map(c => (
        <button key={c.clave}
          onClick={() => despachar({ tipo: 'quitar', valor: c.clave })}
          className="rounded-full bg-uasd-azul/30 px-3 py-1.5 text-sm
                     ring-1 ring-uasd-azul-claro/40 hover:bg-uasd-azul/50">
          {c.etiqueta} ✕
        </button>
      ))}
      <button onClick={() => despachar({ tipo: 'atras' })}
        disabled={!historial.length}
        className="rounded-full px-3 py-1.5 text-sm text-white/60
                   hover:text-white disabled:opacity-30">
        ← Atrás
      </button>
      <button onClick={() => despachar({ tipo: 'limpiar' })}
        className="rounded-full px-3 py-1.5 text-sm text-white/60 hover:text-white">
        Limpiar todo
      </button>
    </div>
  )
}
```

`app/src/components/filtros/BarraFiltros.tsx`:

```tsx
import { Desplegable, type Opcion } from './Desplegable'
import { ChipsFiltros } from './ChipsFiltros'
import { useFiltros } from '../../state/FiltrosContext'
import { mockDataSource as ds } from '../../data/mock/MockDataSource'
import type { NivelId, CategoriaIndicador } from '../../data/tipos'
import type { Periodo, EstadoFiltro } from '../../data/source'

const aOpciones = (us: { id: string; nombre: string }[]): Opcion[] =>
  us.map(u => ({ valor: u.id, texto: u.nombre }))

const PERIODOS: Opcion[] = [
  { valor: 'mes', texto: 'Mes actual' }, { valor: 'trimestre', texto: 'Trimestre' },
  { valor: 'semestre', texto: 'Semestre' }, { valor: 'anio', texto: 'Año' },
  { valor: 'comparativo', texto: 'Comparativo 2025 vs 2026' },
]
const CATEGORIAS: Opcion[] = [
  { valor: 'servicio', texto: 'Indicadores de Servicio' },
  { valor: 'proceso', texto: 'Indicadores de Proceso' },
]
const ESTADOS: Opcion[] = [
  { valor: 'verde', texto: 'En meta' }, { valor: 'ambar', texto: 'En riesgo' },
  { valor: 'rojo', texto: 'Incumplido' },
]

export function BarraFiltros() {
  const { filtro, despachar } = useFiltros()

  const niveles: Opcion[] = ds.getNiveles()
    .map(n => ({ valor: String(n.id), texto: n.nombre }))
  const areas = aOpciones(ds.getAreas(filtro.nivel))
  const unidades = aOpciones(ds.getUnidadesDe(filtro.nivel, filtro.areaId))

  return (
    <div className="border-b border-white/10 bg-panel/80 backdrop-blur">
      <div className="flex flex-wrap items-end gap-4 px-6 py-4">
        <Desplegable etiqueta="Nivel" opciones={niveles}
          valor={filtro.nivel === null ? null : String(filtro.nivel)}
          onCambio={v => despachar({
            tipo: 'nivel', valor: v === null ? null : Number(v) as NivelId })} />

        <Desplegable etiqueta="Área / Dependencia" opciones={areas} buscable
          valor={filtro.areaId}
          onCambio={v => despachar({ tipo: 'area', valor: v })} />

        <Desplegable etiqueta="Unidad" opciones={unidades} buscable
          valor={filtro.unidadId}
          onCambio={v => despachar({ tipo: 'unidad', valor: v })} />

        <Desplegable etiqueta="Período" opciones={PERIODOS} valor={filtro.periodo}
          onCambio={v => despachar({ tipo: 'periodo', valor: (v ?? 'mes') as Periodo })} />

        <Desplegable etiqueta="Tipo de indicador" opciones={CATEGORIAS}
          valor={filtro.categoria === 'todas' ? null : filtro.categoria}
          onCambio={v => despachar({
            tipo: 'categoria',
            valor: (v ?? 'todas') as CategoriaIndicador | 'todas' })} />

        <Desplegable etiqueta="Estado" opciones={ESTADOS}
          valor={filtro.estado === 'todos' ? null : filtro.estado}
          onCambio={v => despachar({
            tipo: 'estado', valor: (v ?? 'todos') as EstadoFiltro })} />
      </div>
      <ChipsFiltros />
    </div>
  )
}
```

> **Nota:** sin nivel escogido, el desplegable de Unidad lista las ~150 unidades. Es intencional: el buscador interno existe para eso, y el Rector normalmente escoge nivel primero.

- [ ] **Step 8: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- BarraFiltros`
Expected: PASS, 6 tests

- [ ] **Step 9: Commit**

```bash
git add app/src/components/filtros
git commit -m "Añade la barra de filtros en cascada con chips"
```

---

## Task 8: Componentes de indicador y KPI

**Files:**
- Create: `app/src/components/kpi/formato.ts`, `app/src/components/kpi/Semaforo.tsx`, `app/src/components/kpi/Minigrafico.tsx`, `app/src/components/kpi/TarjetaKPI.tsx`, `app/src/components/kpi/TarjetaIndicador.tsx`
- Test: `app/src/components/kpi/formato.test.ts`, `app/src/components/kpi/TarjetaIndicador.test.tsx`

**Interfaces:**
- Consumes: `Indicador`, `PuntoSerie`, `Semaforo`, `Tendencia`, `TipoMetrica` de `data/tipos.ts`.
- Produces:
  - `formatear(valor: number, tipo: TipoMetrica): string` y `formatearCompacto(n: number): string` desde `formato.ts`.
  - `COLOR: Record<Semaforo, string>` y `<Semaforo estado conEtiqueta? />` desde `Semaforo.tsx`.
  - `<Minigrafico datos={number[]} estado />`.
  - `<TarjetaKPI titulo valor detalle? estado? onClic? />`.
  - `<TarjetaIndicador indicador punto serie={number[]} onClic? />`.

- [ ] **Step 1: Escribir los tests que fallan del formato**

`app/src/components/kpi/formato.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatear, formatearCompacto } from './formato'

describe('formatear', () => {
  it('agrupa los conteos con separador de miles', () => {
    expect(formatear(186000, 'conteo')).toBe('186,000')
    expect(formatear(7, 'conteo')).toBe('7')
  })

  it('añade el signo de porcentaje con un decimal', () => {
    expect(formatear(84.62, 'porcentaje')).toBe('84.6%')
    expect(formatear(100, 'porcentaje')).toBe('100.0%')
  })

  it('expresa los días con un decimal y su unidad', () => {
    expect(formatear(4.25, 'dias')).toBe('4.3 días')
    expect(formatear(1, 'dias')).toBe('1.0 días')
  })

  it('abrevia la moneda en millones y miles de millones', () => {
    expect(formatear(14_800_000_000, 'moneda')).toBe('RD$ 14.80 MM')
    expect(formatear(3_400_000, 'moneda')).toBe('RD$ 3.4 M')
    expect(formatear(52_000, 'moneda')).toBe('RD$ 52,000')
  })
})

describe('formatearCompacto', () => {
  it('abrevia los números grandes para las tarjetas de KPI', () => {
    expect(formatearCompacto(186000)).toBe('186 mil')
    expect(formatearCompacto(1_250_000)).toBe('1.3 M')
    expect(formatearCompacto(842)).toBe('842')
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `cd app && npm test -- formato`
Expected: FAIL — módulo no encontrado

- [ ] **Step 3: Implementar el formato**

`app/src/components/kpi/formato.ts`:

```ts
import type { TipoMetrica } from '../../data/tipos'

const miles = (n: number) => n.toLocaleString('en-US')

export function formatear(valor: number, tipo: TipoMetrica): string {
  switch (tipo) {
    case 'porcentaje':
      return `${valor.toFixed(1)}%`
    case 'dias':
      return `${valor.toFixed(1)} días`
    case 'moneda':
      if (valor >= 1e9) return `RD$ ${(valor / 1e9).toFixed(2)} MM`
      if (valor >= 1e6) return `RD$ ${(valor / 1e6).toFixed(1)} M`
      return `RD$ ${miles(Math.round(valor))}`
    default:
      return miles(Math.round(valor))
  }
}

export function formatearCompacto(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} M`
  if (n >= 1e4) return `${Math.round(n / 1000)} mil`
  return miles(Math.round(n))
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- formato`
Expected: PASS, 7 tests

- [ ] **Step 5: Implementar el semáforo y el minigráfico**

`app/src/components/kpi/Semaforo.tsx`:

```tsx
import type { Semaforo as Estado } from '../../data/tipos'

export const COLOR: Record<Estado, string> = {
  verde: '#1E9E5A', ambar: '#E0A320', rojo: '#D24B3E',
}
const ETIQUETA: Record<Estado, string> = {
  verde: 'En meta', ambar: 'En riesgo', rojo: 'Incumplido',
}

export function Semaforo({ estado, conEtiqueta = false }:
  { estado: Estado; conEtiqueta?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span role="img" aria-label={ETIQUETA[estado]}
        className="inline-block h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: COLOR[estado] }} />
      {conEtiqueta && <span className="text-sm text-white/70">{ETIQUETA[estado]}</span>}
    </span>
  )
}
```

`app/src/components/kpi/Minigrafico.tsx`:

```tsx
import type { Semaforo as Estado } from '../../data/tipos'
import { COLOR } from './Semaforo'

/** Sparkline en SVG puro: sin dependencias y sin costo de layout. */
export function Minigrafico({ datos, estado }: { datos: number[]; estado: Estado }) {
  if (datos.length < 2) return null
  const min = Math.min(...datos), max = Math.max(...datos)
  const rango = max - min || 1
  const puntos = datos.map((v, i) => {
    const x = (i / (datos.length - 1)) * 100
    const y = 28 - ((v - min) / rango) * 24
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full" aria-hidden>
      <polyline points={puntos} fill="none" strokeWidth={2}
        stroke={COLOR[estado]} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
```

- [ ] **Step 6: Escribir los tests que fallan de la tarjeta de indicador**

`app/src/components/kpi/TarjetaIndicador.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TarjetaIndicador } from './TarjetaIndicador'
import type { Indicador, PuntoSerie } from '../../data/tipos'

const indicador: Indicador = {
  id: 'x::servicio::1', unidadId: 'dir-registro',
  nombre: 'Récords oficiales emitidos', categoria: 'servicio',
  tipoMetrica: 'conteo', unidadMedida: '', direccion: 'mayor-mejor',
}
const punto: PuntoSerie = {
  indicadorId: 'x::servicio::1', periodo: '2026-08',
  valor: 4820, meta: 5000, cumplimiento: 96.4,
  semaforo: 'verde', tendencia: 'alza',
}

describe('TarjetaIndicador', () => {
  it('muestra nombre, valor formateado, meta y cumplimiento', () => {
    render(<TarjetaIndicador indicador={indicador} punto={punto} serie={[]} />)
    expect(screen.getByText('Récords oficiales emitidos')).toBeInTheDocument()
    expect(screen.getByText('4,820')).toBeInTheDocument()
    expect(screen.getByText('Meta 5,000')).toBeInTheDocument()
    expect(screen.getByText('96.4%')).toBeInTheDocument()
  })

  it('muestra el semáforo con su etiqueta accesible', () => {
    render(<TarjetaIndicador indicador={indicador} punto={punto} serie={[]} />)
    expect(screen.getByRole('img', { name: 'En meta' })).toBeInTheDocument()
  })

  it('indica la tendencia con una flecha etiquetada', () => {
    render(<TarjetaIndicador indicador={indicador} punto={punto} serie={[]} />)
    expect(screen.getByLabelText('Tendencia al alza')).toBeInTheDocument()
  })

  it('formatea los días con su unidad', () => {
    const dias: Indicador = { ...indicador, tipoMetrica: 'dias', direccion: 'menor-mejor' }
    render(<TarjetaIndicador indicador={dias} punto={{ ...punto, valor: 3.2 }} serie={[]} />)
    expect(screen.getByText('3.2 días')).toBeInTheDocument()
  })

  it('avisa al hacer clic cuando es clicable', async () => {
    const onClic = vi.fn()
    const usuario = userEvent.setup()
    render(<TarjetaIndicador indicador={indicador} punto={punto} serie={[]} onClic={onClic} />)
    await usuario.click(screen.getByRole('button'))
    expect(onClic).toHaveBeenCalledWith('x::servicio::1')
  })

  it('no es un botón cuando no es clicable', () => {
    render(<TarjetaIndicador indicador={indicador} punto={punto} serie={[]} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 7: Ejecutar y verificar que falla**

Run: `cd app && npm test -- TarjetaIndicador`
Expected: FAIL — módulo no encontrado

- [ ] **Step 8: Implementar las tarjetas**

`app/src/components/kpi/TarjetaIndicador.tsx`:

```tsx
import type { Indicador, PuntoSerie, Tendencia } from '../../data/tipos'
import { Semaforo } from './Semaforo'
import { Minigrafico } from './Minigrafico'
import { formatear } from './formato'

const FLECHA: Record<Tendencia, { signo: string; etiqueta: string }> = {
  alza: { signo: '▲', etiqueta: 'Tendencia al alza' },
  baja: { signo: '▼', etiqueta: 'Tendencia a la baja' },
  estable: { signo: '■', etiqueta: 'Tendencia estable' },
}

interface Props {
  indicador: Indicador
  punto: PuntoSerie
  serie: number[]
  onClic?: (indicadorId: string) => void
}

export function TarjetaIndicador({ indicador, punto, serie, onClic }: Props) {
  const flecha = FLECHA[punto.tendencia]
  const contenido = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm leading-snug text-white/80">{indicador.nombre}</span>
        <Semaforo estado={punto.semaforo} />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums">
          {formatear(punto.valor, indicador.tipoMetrica)}
        </span>
        <span aria-label={flecha.etiqueta} className="text-sm text-white/50">
          {flecha.signo}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-white/50">
        <span>{`Meta ${formatear(punto.meta, indicador.tipoMetrica)}`}</span>
        <span className="tabular-nums">{`${punto.cumplimiento.toFixed(1)}%`}</span>
      </div>
      {serie.length > 1 && (
        <div className="mt-2"><Minigrafico datos={serie} estado={punto.semaforo} /></div>
      )}
    </>
  )

  const clases = 'rounded-xl bg-panel-2 p-4 text-left ring-1 ring-white/10'
  return onClic
    ? <button className={`${clases} w-full hover:ring-uasd-azul-claro`}
              onClick={() => onClic(indicador.id)}>{contenido}</button>
    : <div className={clases}>{contenido}</div>
}
```

`app/src/components/kpi/TarjetaKPI.tsx`:

```tsx
import type { Semaforo as Estado } from '../../data/tipos'
import { Semaforo } from './Semaforo'

interface Props {
  titulo: string
  valor: string
  detalle?: string
  estado?: Estado
  onClic?: () => void
}

export function TarjetaKPI({ titulo, valor, detalle, estado, onClic }: Props) {
  const contenido = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-white/50">{titulo}</span>
        {estado && <Semaforo estado={estado} />}
      </div>
      <div className="mt-2 text-5xl font-bold leading-none tabular-nums">{valor}</div>
      {detalle && <div className="mt-2 text-sm text-white/50">{detalle}</div>}
    </>
  )
  const clases = 'rounded-xl bg-panel-2 p-5 text-left ring-1 ring-white/10'
  return onClic
    ? <button className={`${clases} w-full hover:ring-uasd-azul-claro`}
              onClick={onClic}>{contenido}</button>
    : <div className={clases}>{contenido}</div>
}
```

- [ ] **Step 9: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- kpi`
Expected: PASS, 13 tests

- [ ] **Step 10: Ejecutar toda la batería**

Run: `cd app && npm test`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add app/src/components/kpi
git commit -m "Añade los componentes de semáforo, minigráfico y tarjetas de indicador"
```

---

## Task 9: Mapa de la red territorial

**Files:**
- Create: `app/scripts/generar-mapa.mjs`, `app/src/data/mapa-rd.ts` (generado y comiteado), `app/src/components/mapa/MapaRD.tsx`
- Test: `app/src/data/mapa-rd.test.ts`, `app/src/components/mapa/MapaRD.test.tsx`

**Interfaces:**
- Consumes: `mockDataSource.getTerritoriales()`; `useFiltros`; `COLOR` de `kpi/Semaforo`.
- Produces:
  - `PATH_RD: string`, `ANCHO: number`, `ALTO: number`, `proyectar(lon: number, lat: number): [number, number]`, `REFERENCIAS: { lon, lat, x, y }[]` desde `data/mapa-rd.ts`.
  - `<MapaRD alto? seleccionado? />` desde `components/mapa/MapaRD.tsx`.

El mapa se genera **en tiempo de build** y su resultado se comitea, para cumplir la regla de cero red en tiempo de ejecución.

- [ ] **Step 1: Escribir el script generador**

`app/scripts/generar-mapa.mjs`:

```js
// Genera src/data/mapa-rd.ts a partir del atlas mundial empaquetado en node_modules.
// Se ejecuta una sola vez; su salida se comitea. No hay red en tiempo de ejecución.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { feature } from 'topojson-client'
import { geoMercator, geoPath } from 'd3-geo'

const require = createRequire(import.meta.url)
const atlas = JSON.parse(
  readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'))

const paises = feature(atlas, atlas.objects.countries)
const rd = paises.features.find(f => String(f.id) === '214')   // ISO numérico de RD
if (!rd) throw new Error('No se encontró República Dominicana (id 214) en el atlas')

const ANCHO = 1000, ALTO = 520
const proy = geoMercator().fitExtent([[20, 20], [ANCHO - 20, ALTO - 20]], rd)
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
// Fuente: world-atlas/countries-50m.json (dominio público, Natural Earth).
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
```

Añadir a `app/package.json` en `scripts`:

```json
"generar:mapa": "node scripts/generar-mapa.mjs"
```

- [ ] **Step 2: Ejecutar el script**

Run: `cd app && npm run generar:mapa`
Expected: imprime «Generado src/data/mapa-rd.ts» y un número de caracteres mayor que 2000.

Si el atlas no trae el id `214`, inspeccionar los ids disponibles con:

```bash
cd app && node -e "const{feature}=require('topojson-client');const a=require('world-atlas/countries-50m.json');console.log(feature(a,a.objects.countries).features.filter(f=>/Domin/.test(f.properties?.name)).map(f=>[f.id,f.properties?.name]))"
```

y corregir el id en el script.

- [ ] **Step 3: Escribir el test que verifica la proyección**

`app/src/data/mapa-rd.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { PATH_RD, ANCHO, ALTO, proyectar, REFERENCIAS } from './mapa-rd'
import { UNIDADES } from './mock/unidades'

describe('mapa de República Dominicana', () => {
  it('trae un trazado no trivial', () => {
    expect(PATH_RD.startsWith('M')).toBe(true)
    expect(PATH_RD.length).toBeGreaterThan(2000)
  })

  it('reproduce exactamente la proyección de d3 en los puntos de referencia', () => {
    for (const r of REFERENCIAS) {
      const [x, y] = proyectar(r.lon, r.lat)
      expect(x, `x de ${r.lon},${r.lat}`).toBeCloseTo(r.x, 6)
      expect(y, `y de ${r.lon},${r.lat}`).toBeCloseTo(r.y, 6)
    }
  })

  it('sitúa toda la red territorial dentro del lienzo', () => {
    for (const u of UNIDADES.filter(x => x.coords)) {
      const [x, y] = proyectar(u.coords![0], u.coords![1])
      expect(x, u.id).toBeGreaterThan(0)
      expect(x, u.id).toBeLessThan(ANCHO)
      expect(y, u.id).toBeGreaterThan(0)
      expect(y, u.id).toBeLessThan(ALTO)
    }
  })

  it('coloca Santiago al noroeste de Santo Domingo', () => {
    const [xSD, ySD] = proyectar(-69.90, 18.47)
    const [xSt, ySt] = proyectar(-70.70, 19.45)
    expect(xSt).toBeLessThan(xSD)    // más al oeste
    expect(ySt).toBeLessThan(ySD)    // más al norte
  })
})
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- mapa-rd`
Expected: PASS, 4 tests.

Si el segundo test falla, la reimplementación de Mercator no coincide con d3. Corregir la fórmula de `proyectar` en el script (no en el archivo generado) y volver a ejecutar `npm run generar:mapa`. **Nunca ajustar las tolerancias del test.**

- [ ] **Step 5: Escribir los tests que fallan del componente**

`app/src/components/mapa/MapaRD.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProveedorFiltros, useFiltros } from '../../state/FiltrosContext'
import { MapaRD } from './MapaRD'

function Espia() {
  const { filtro } = useFiltros()
  return <div data-testid="espia">{filtro.unidadId ?? 'ninguna'}</div>
}

const montar = () => {
  render(<ProveedorFiltros><MapaRD /><Espia /></ProveedorFiltros>)
  return userEvent.setup()
}

describe('MapaRD', () => {
  it('dibuja un punto por cada unidad territorial', () => {
    montar()
    expect(screen.getAllByRole('button')).toHaveLength(1 + 4 + 18 + 12)
  })

  it('etiqueta cada punto con el nombre de su unidad', () => {
    montar()
    expect(screen.getByRole('button', { name: /Recinto Barahona/ })).toBeInTheDocument()
  })

  it('filtra el tablero al hacer clic en un punto', async () => {
    const usuario = montar()
    await usuario.click(screen.getByRole('button', { name: /Recinto Barahona/ }))
    expect(screen.getByTestId('espia')).toHaveTextContent('recinto-barahona')
  })

  it('dimensiona los puntos según la matrícula', () => {
    montar()
    const santiago = screen.getByRole('button', { name: /Recinto Santiago/ })
    const pedernales = screen.getByRole('button', { name: /Pedernales/ })
    const r = (el: HTMLElement) =>
      Number(el.querySelector('circle')!.getAttribute('r'))
    expect(r(santiago)).toBeGreaterThan(r(pedernales))
  })
})
```

- [ ] **Step 6: Ejecutar y verificar que falla**

Run: `cd app && npm test -- MapaRD`
Expected: FAIL — módulo no encontrado

- [ ] **Step 7: Implementar el componente**

`app/src/components/mapa/MapaRD.tsx`:

```tsx
import { PATH_RD, ANCHO, ALTO, proyectar } from '../../data/mapa-rd'
import { mockDataSource as ds } from '../../data/mock/MockDataSource'
import { useFiltros } from '../../state/FiltrosContext'
import { COLOR } from '../kpi/Semaforo'
import { formatearCompacto } from '../kpi/formato'

/** Radio del punto en función de la matrícula de la unidad, en miles. */
const radio = (peso: number) => Math.max(5, Math.min(26, 4 + Math.sqrt(peso) * 2.4))

export function MapaRD({ alto = '100%' }: { alto?: string | number }) {
  const { filtro, despachar } = useFiltros()
  const filas = ds.getTerritoriales()
  const hayFoco = filtro.unidadId !== null

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
          `Cumplimiento ${f.cumplimiento.toFixed(1)} por ciento.`

        return (
          <g key={f.unidad.id} role="button" aria-label={etiqueta} tabIndex={0}
             className="cursor-pointer"
             opacity={atenuado ? 0.28 : 1}
             onClick={() => despachar({
               tipo: 'seleccionarUnidad', valor: f.unidad.id })}>
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
```

> **Cuidado con el test de conteo de botones:** el `<g role="button">` es lo que Testing Library cuenta. Si se añade cualquier otro botón dentro del SVG, el test de 35 puntos falla — y con razón.

- [ ] **Step 8: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- MapaRD`
Expected: PASS, 4 tests

- [ ] **Step 9: Commit**

```bash
git add app/scripts app/src/data/mapa-rd.ts app/src/components/mapa app/package.json
git commit -m "Añade el mapa de la red territorial con proyección generada en build"
```

---

## Task 10: Portada Rectoral

**Files:**
- Create: `app/src/components/marco/Encabezado.tsx`, `app/src/components/marco/FeedActividad.tsx`, `app/src/components/graficos/GraficoBarras.tsx`, `app/src/vistas/Rectoral.tsx`
- Modify: `app/src/App.tsx`
- Test: `app/src/vistas/Rectoral.test.tsx`, `app/src/components/marco/FeedActividad.test.tsx`

**Interfaces:**
- Consumes: `ANCLAS`; `mockDataSource`; `TarjetaKPI`; `MapaRD`; `useFiltros`.
- Produces:
  - `<Encabezado />` — escudo, título, reloj en vivo, período académico.
  - `<FeedActividad />` — franja de eventos generados de forma determinística.
  - `<GraficoBarras filas onClic />` — ranking horizontal clicable.
  - `<Rectoral />`.

- [ ] **Step 1: Escribir los tests que fallan del feed**

`app/src/components/marco/FeedActividad.test.tsx`:

```tsx
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { FeedActividad } from './FeedActividad'
import { fijarAhora } from '../../data/reloj'

describe('FeedActividad', () => {
  afterEach(() => { fijarAhora(null); vi.useRealTimers() })

  it('muestra eventos con nombre de unidad y hora', () => {
    fijarAhora(new Date('2026-08-25T14:30:00Z'))
    render(<FeedActividad />)
    const items = screen.getAllByRole('listitem')
    expect(items.length).toBeGreaterThanOrEqual(6)
    expect(items[0].textContent).toMatch(/\d{2}:\d{2}/)
  })

  it('es determinístico con la misma hora fijada', () => {
    fijarAhora(new Date('2026-08-25T14:30:00Z'))
    const { unmount } = render(<FeedActividad />)
    const primero = screen.getAllByRole('listitem').map(i => i.textContent)
    unmount()
    render(<FeedActividad />)
    expect(screen.getAllByRole('listitem').map(i => i.textContent)).toEqual(primero)
  })

  it('incorpora un evento nuevo al cabo del intervalo', () => {
    vi.useFakeTimers()
    fijarAhora(new Date('2026-08-25T14:30:00Z'))
    render(<FeedActividad />)
    const antes = screen.getAllByRole('listitem')[0].textContent
    act(() => { vi.advanceTimersByTime(6000) })
    expect(screen.getAllByRole('listitem')[0].textContent).not.toBe(antes)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `cd app && npm test -- FeedActividad`
Expected: FAIL — módulo no encontrado

- [ ] **Step 3: Implementar el encabezado y el feed**

`app/src/components/marco/Encabezado.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { ahora } from '../../data/reloj'
import escudo from '../../assets/escudo-uasd.png'

/** Período académico según el mes: la UASD opera en tres cuatrimestres. */
function periodoAcademico(d: Date): string {
  const m = d.getMonth() + 1
  const ciclo = m <= 4 ? 'Primer' : m <= 8 ? 'Segundo' : 'Tercer'
  return `${ciclo} cuatrimestre ${d.getFullYear()}`
}

export function Encabezado() {
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
    <header className="flex items-center gap-5 border-b border-white/10
                       bg-uasd-azul-oscuro px-6 py-4">
      <img src={escudo} alt="Escudo de la UASD" className="h-14 w-14 object-contain" />
      <div className="flex-1">
        <h1 className="text-2xl font-semibold leading-tight">
          Universidad Autónoma de Santo Domingo
        </h1>
        <p className="text-sm text-white/60">
          Tablero Rectoral de Indicadores · {periodoAcademico(reloj)}
        </p>
      </div>
      <div className="text-right">
        <div className="text-3xl font-semibold tabular-nums">{hora}</div>
        <div className="text-sm capitalize text-white/60">{fecha}</div>
      </div>
    </header>
  )
}
```

`app/src/components/marco/FeedActividad.tsx`:

```tsx
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
```

> **Cuidado con el test de determinismo:** el feed usa `ahora()` solo para calcular la hora mostrada. Con `fijarAhora` puesto, dos montajes producen el mismo resultado. El contador arranca en 0 en cada montaje, que es lo que hace comparable la lista.

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- FeedActividad`
Expected: PASS, 3 tests

- [ ] **Step 5: Escribir los tests que fallan de la portada**

`app/src/vistas/Rectoral.test.tsx`:

```tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProveedorFiltros, useFiltros } from '../state/FiltrosContext'
import { Rectoral } from './Rectoral'
import { fijarAhora } from '../data/reloj'

function Espia() {
  const { filtro } = useFiltros()
  return <div data-testid="espia">{filtro.unidadId ?? 'ninguna'}</div>
}

const montar = () => {
  render(<ProveedorFiltros><Rectoral /><Espia /></ProveedorFiltros>)
  return userEvent.setup()
}

describe('Rectoral', () => {
  afterEach(() => fijarAhora(null))

  it('muestra los seis KPI mayores', () => {
    montar()
    for (const t of ['Matrícula total', 'Nuevo ingreso', 'Egresados del año',
                     'Ejecución presupuestaria', 'Cumplimiento POA',
                     'Satisfacción de usuarios']) {
      expect(screen.getByText(t)).toBeInTheDocument()
    }
  })

  it('ancla la matrícula total a la cifra institucional', () => {
    montar()
    expect(screen.getByText('186 mil')).toBeInTheDocument()
  })

  it('muestra una tarjeta por cada vicerrectoría', () => {
    montar()
    for (const v of ['Vicerrectoría Docente', 'Vicerrectoría Administrativa',
                     'Vicerrectoría de Investigación y Postgrado',
                     'Vicerrectoría de Extensión']) {
      expect(screen.getByRole('button', { name: new RegExp(v) })).toBeInTheDocument()
    }
  })

  it('al hacer clic en una vicerrectoría filtra a esa unidad', async () => {
    const usuario = montar()
    await usuario.click(
      screen.getByRole('button', { name: /Vicerrectoría de Extensión/ }))
    expect(screen.getByTestId('espia')).toHaveTextContent('vic-extension')
  })

  it('muestra los rankings de mejores y en alerta', () => {
    montar()
    expect(screen.getByText('Mejor desempeño')).toBeInTheDocument()
    expect(screen.getByText('Requieren atención')).toBeInTheDocument()
  })

  it('incluye el mapa territorial', () => {
    montar()
    expect(screen.getByRole('group', { name: 'Red territorial de la UASD' }))
      .toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Ejecutar y verificar que falla**

Run: `cd app && npm test -- Rectoral`
Expected: FAIL — módulo no encontrado

- [ ] **Step 7: Implementar el gráfico de barras y la portada**

`app/src/components/graficos/GraficoBarras.tsx`:

```tsx
import type { FilaUnidad } from '../../data/source'
import { COLOR } from '../kpi/Semaforo'

interface Props {
  titulo: string
  filas: FilaUnidad[]
  onClic: (unidadId: string) => void
}

export function GraficoBarras({ titulo, filas, onClic }: Props) {
  const tope = Math.max(...filas.map(f => f.cumplimiento), 100)
  return (
    <div className="rounded-xl bg-panel-2 p-4 ring-1 ring-white/10">
      <div className="mb-3 text-xs uppercase tracking-wide text-white/50">{titulo}</div>
      <ul className="space-y-2">
        {filas.map(f => (
          <li key={f.unidad.id}>
            <button onClick={() => onClic(f.unidad.id)}
              className="group w-full text-left"
              aria-label={`${f.unidad.nombre}, ${f.cumplimiento.toFixed(1)} por ciento`}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate text-white/80 group-hover:text-white">
                  {f.unidad.nombre}
                </span>
                <span className="shrink-0 tabular-nums text-white/60">
                  {f.cumplimiento.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 h-2 w-full rounded bg-white/5">
                <div className="h-2 rounded"
                  style={{
                    width: `${(f.cumplimiento / tope) * 100}%`,
                    backgroundColor: COLOR[f.semaforo],
                  }} />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

`app/src/vistas/Rectoral.tsx`:

```tsx
import { ANCLAS } from '../data/anclas'
import { mockDataSource as ds } from '../data/mock/MockDataSource'
import { useFiltros } from '../state/FiltrosContext'
import { TarjetaKPI } from '../components/kpi/TarjetaKPI'
import { Semaforo } from '../components/kpi/Semaforo'
import { Minigrafico } from '../components/kpi/Minigrafico'
import { MapaRD } from '../components/mapa/MapaRD'
import { GraficoBarras } from '../components/graficos/GraficoBarras'
import { FeedActividad } from '../components/marco/FeedActividad'
import { formatearCompacto, formatear } from '../components/kpi/formato'
import { clasificar } from '../data/mock/generador'

const VICERRECTORIAS = ['vic-docente', 'vic-admin', 'vic-invpos', 'vic-extension']

export function Rectoral() {
  const { filtro, despachar } = useFiltros()
  const resumen = ds.getResumen(filtro)
  const irA = (unidadId: string) =>
    despachar({ tipo: 'seleccionarUnidad', valor: unidadId })

  const kpis = [
    { titulo: 'Matrícula total', valor: formatearCompacto(ANCLAS.matriculaTotal),
      detalle: 'Estudiantes activos', estado: 'verde' as const },
    { titulo: 'Nuevo ingreso', valor: formatearCompacto(ANCLAS.nuevoIngresoAnual),
      detalle: 'Incorporados este año', estado: 'verde' as const },
    { titulo: 'Egresados del año', valor: formatearCompacto(ANCLAS.egresadosAnual),
      detalle: 'Investiduras procesadas', estado: 'ambar' as const },
    { titulo: 'Ejecución presupuestaria',
      valor: `${ANCLAS.ejecucionPresupuestariaPct}%`,
      detalle: formatear(ANCLAS.presupuestoAnualRD, 'moneda'),
      estado: clasificar(ANCLAS.ejecucionPresupuestariaPct) },
    { titulo: 'Cumplimiento POA', valor: `${ANCLAS.cumplimientoPoaPct}%`,
      detalle: `${resumen.totalIndicadores.toLocaleString('en-US')} indicadores`,
      estado: clasificar(ANCLAS.cumplimientoPoaPct) },
    { titulo: 'Satisfacción de usuarios',
      valor: `${ANCLAS.satisfaccionGeneralPct}%`,
      detalle: 'Promedio institucional',
      estado: clasificar(ANCLAS.satisfaccionGeneralPct) },
  ]

  return (
    <div className="grid gap-4 p-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        {kpis.map(k => <TarjetaKPI key={k.titulo} {...k} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
        <div className="rounded-xl bg-panel-2 p-4 ring-1 ring-white/10">
          <div className="mb-2 text-xs uppercase tracking-wide text-white/50">
            Red territorial
          </div>
          <MapaRD alto={420} />
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            {VICERRECTORIAS.map(id => {
              const f = ds.getFilas({ ...filtro, unidadId: id })[0]
              return (
                <button key={id} onClick={() => irA(id)}
                  className="rounded-xl bg-panel-2 p-4 text-left ring-1 ring-white/10
                             hover:ring-uasd-azul-claro">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm leading-snug text-white/80">
                      {f.unidad.nombre}
                    </span>
                    <Semaforo estado={f.semaforo} />
                  </div>
                  <div className="mt-2 text-3xl font-semibold tabular-nums">
                    {f.cumplimiento.toFixed(1)}%
                  </div>
                  <Minigrafico datos={f.serie} estado={f.semaforo} />
                </button>
              )
            })}
          </div>
          <FeedActividad />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <GraficoBarras titulo="Mejor desempeño" filas={resumen.mejores} onClic={irA} />
        <GraficoBarras titulo="Requieren atención" filas={resumen.enAlerta} onClic={irA} />
      </div>
    </div>
  )
}
```

> **Cuidado con `ds.getFilas({ ...filtro, unidadId: id })[0]`:** devuelve la fila de la propia vicerrectoría, porque `alcance` la coloca primero. Si se reordena `alcance`, esta línea rompe.

> **Cuidado con el escudo:** `src/assets/escudo-uasd.png` no existe todavía; se añade en la Tarea 15. Hasta entonces, crear un marcador de posición de 1×1 px para que el build no falle:
> ```bash
> cd app && mkdir -p src/assets && node -e "require('fs').writeFileSync('src/assets/escudo-uasd.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64'))"
> ```

- [ ] **Step 8: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- Rectoral`
Expected: PASS, 6 tests

- [ ] **Step 9: Conectar la portada en App.tsx y verla en el navegador**

`app/src/App.tsx`:

```tsx
import { ProveedorFiltros } from './state/FiltrosContext'
import { Encabezado } from './components/marco/Encabezado'
import { BarraFiltros } from './components/filtros/BarraFiltros'
import { Rectoral } from './vistas/Rectoral'

export default function App() {
  return (
    <ProveedorFiltros>
      <div className="flex min-h-screen flex-col bg-panel">
        <Encabezado />
        <BarraFiltros />
        <main className="flex-1"><Rectoral /></main>
      </div>
    </ProveedorFiltros>
  )
}
```

Run: `cd app && npm run dev`
Expected: la portada carga con los KPI, el mapa con los 35 puntos, las cuatro vicerrectorías y los dos rankings. Hacer clic en Barahona en el mapa y confirmar que aparece su chip en la barra de filtros. Detener con Ctrl+C.

- [ ] **Step 10: Commit**

```bash
git add app/src
git commit -m "Añade la portada rectoral con KPI, mapa, rankings y feed en vivo"
```

---

## Task 11: Vistas de Nivel y de Unidad con enrutado por filtros

**Files:**
- Create: `app/src/vistas/Nivel.tsx`, `app/src/vistas/Unidad.tsx`, `app/src/vistas/Enrutador.tsx`, `app/src/components/graficos/GraficoSerie.tsx`
- Modify: `app/src/App.tsx`
- Test: `app/src/vistas/Enrutador.test.tsx`, `app/src/vistas/Unidad.test.tsx`

**Interfaces:**
- Consumes: `mockDataSource`, `useFiltros`, `TarjetaIndicador`, `Minigrafico`, `Semaforo`.
- Produces:
  - `<GraficoSerie serie={PuntoSerie[]} tipoMetrica />`.
  - `<Nivel />`, `<Unidad />`, `<Enrutador />`.

Regla de enrutado: si hay `unidadId` y esa unidad no tiene hijos, se muestra `<Unidad />`; si hay `unidadId` o `areaId` o `nivel` con descendencia, se muestra `<Nivel />`; sin nada, `<Rectoral />`.

- [ ] **Step 1: Escribir los tests que fallan del enrutador**

`app/src/vistas/Enrutador.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProveedorFiltros, useFiltros } from '../state/FiltrosContext'
import { Enrutador } from './Enrutador'
import type { Accion } from '../state/filtros'

function Disparador({ accion }: { accion: Accion }) {
  const { despachar } = useFiltros()
  return <button onClick={() => despachar(accion)}>disparar</button>
}

const montar = (accion: Accion) => {
  render(
    <ProveedorFiltros>
      <Disparador accion={accion} />
      <Enrutador />
    </ProveedorFiltros>
  )
  return userEvent.setup()
}

describe('Enrutador', () => {
  it('sin filtros muestra la portada rectoral', () => {
    montar({ tipo: 'limpiar' })
    expect(screen.getByText('Matrícula total')).toBeInTheDocument()
  })

  it('con un nivel escogido muestra la rejilla de unidades', async () => {
    const usuario = montar({ tipo: 'nivel', valor: 6 })
    await usuario.click(screen.getByText('disparar'))
    expect(screen.getByRole('heading', { name: 'Recintos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Recinto Barahona/ })).toBeInTheDocument()
  })

  it('con una facultad muestra la rejilla de sus escuelas', async () => {
    const usuario = montar({ tipo: 'seleccionarUnidad', valor: 'fac-salud' })
    await usuario.click(screen.getByText('disparar'))
    expect(screen.getByRole('button', { name: /Escuela de Medicina/ })).toBeInTheDocument()
  })

  it('con una unidad hoja muestra sus veinte indicadores', async () => {
    const usuario = montar({ tipo: 'seleccionarUnidad', valor: 'esc-medicina' })
    await usuario.click(screen.getByText('disparar'))
    expect(screen.getByRole('heading', { name: 'Escuela de Medicina' })).toBeInTheDocument()
    expect(screen.getByText('Indicadores de Servicio')).toBeInTheDocument()
    expect(screen.getByText('Indicadores de Proceso')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `cd app && npm test -- Enrutador`
Expected: FAIL — módulo no encontrado

- [ ] **Step 3: Escribir los tests que fallan de la vista de unidad**

`app/src/vistas/Unidad.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProveedorFiltros, useFiltros } from '../state/FiltrosContext'
import { Unidad } from './Unidad'

function Fijar({ unidadId }: { unidadId: string }) {
  const { filtro, despachar } = useFiltros()
  if (filtro.unidadId !== unidadId)
    despachar({ tipo: 'seleccionarUnidad', valor: unidadId })
  return null
}

const montar = (unidadId: string) => {
  render(
    <ProveedorFiltros>
      <Fijar unidadId={unidadId} />
      <Unidad />
    </ProveedorFiltros>
  )
  return userEvent.setup()
}

describe('Unidad', () => {
  it('muestra los diez indicadores de servicio y los diez de proceso', () => {
    montar('dir-registro')
    // Cada indicador es un botón; más ninguno fuera de la rejilla.
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(20)
    expect(screen.getByText('Récords oficiales emitidos')).toBeInTheDocument()
    expect(screen.getByText('Tiempo promedio de emisión de récord oficial'))
      .toBeInTheDocument()
  })

  it('muestra la ruta jerárquica de la unidad', () => {
    montar('esc-medicina')
    expect(screen.getByText(/Rectoría/)).toBeInTheDocument()
    expect(screen.getByText(/Facultad de Ciencias de la Salud/)).toBeInTheDocument()
  })

  it('abre la serie completa al hacer clic en un indicador', async () => {
    const usuario = montar('dir-registro')
    await usuario.click(screen.getByText('Récords oficiales emitidos'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/24 meses/)).toBeInTheDocument()
  })

  it('cierra la serie con el botón de cerrar', async () => {
    const usuario = montar('dir-registro')
    await usuario.click(screen.getByText('Récords oficiales emitidos'))
    await usuario.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Ejecutar y verificar que falla**

Run: `cd app && npm test -- vistas/Unidad`
Expected: FAIL — módulo no encontrado

- [ ] **Step 5: Implementar el gráfico de serie y las dos vistas**

`app/src/components/graficos/GraficoSerie.tsx`:

```tsx
import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'
import type { PuntoSerie, TipoMetrica } from '../../data/tipos'
import { formatear } from '../kpi/formato'

export function GraficoSerie(
  { serie, tipoMetrica }: { serie: PuntoSerie[]; tipoMetrica: TipoMetrica }
) {
  const datos = serie.map(p => ({
    periodo: p.periodo, valor: p.valor, meta: p.meta,
  }))
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={datos} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="#ffffff14" vertical={false} />
        <XAxis dataKey="periodo" stroke="#ffffff66" fontSize={11} />
        <YAxis stroke="#ffffff66" fontSize={11}
          tickFormatter={(v: number) => formatear(v, tipoMetrica)} width={90} />
        <Tooltip
          contentStyle={{ background: '#132639', border: '1px solid #ffffff22' }}
          formatter={(v: number) => formatear(v, tipoMetrica)} />
        <Line type="monotone" dataKey="meta" stroke="#ffffff55"
          strokeDasharray="4 4" dot={false} name="Meta" />
        <Line type="monotone" dataKey="valor" stroke="#3D82C4"
          strokeWidth={2.5} dot={false} name="Valor" />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
```

`app/src/vistas/Nivel.tsx`:

```tsx
import { mockDataSource as ds } from '../data/mock/MockDataSource'
import { useFiltros } from '../state/FiltrosContext'
import { porId, hijosDe, NIVELES } from '../data/mock/unidades'
import { Semaforo } from '../components/kpi/Semaforo'
import { Minigrafico } from '../components/kpi/Minigrafico'

export function Nivel() {
  const { filtro, despachar } = useFiltros()

  // Qué se está listando: los hijos de la unidad/área escogida, o todo el nivel.
  const foco = filtro.unidadId ?? filtro.areaId
  const unidades = foco
    ? hijosDe(foco)
    : ds.getUnidadesDe(filtro.nivel, null)

  const titulo = foco
    ? porId(foco)!.nombre
    : NIVELES.find(n => n.id === filtro.nivel)?.nombre ?? 'Todas las unidades'

  const filas = unidades.map(u => ds.getFilas({ ...filtro, unidadId: u.id })[0])
    .filter(Boolean)

  return (
    <div className="p-6">
      <h2 className="mb-4 text-xl font-semibold">{titulo}</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {filas.map(f => (
          <button key={f.unidad.id}
            onClick={() => despachar({
              tipo: 'seleccionarUnidad', valor: f.unidad.id })}
            className="rounded-xl bg-panel-2 p-4 text-left ring-1 ring-white/10
                       hover:ring-uasd-azul-claro">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm leading-snug text-white/80">
                {f.unidad.nombre}
              </span>
              <Semaforo estado={f.semaforo} />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {f.cumplimiento.toFixed(1)}%
            </div>
            <div className="text-xs text-white/45">
              {f.indicadoresEnRojo} de 20 indicadores incumplidos
            </div>
            <Minigrafico datos={f.serie} estado={f.semaforo} />
          </button>
        ))}
      </div>
    </div>
  )
}
```

`app/src/vistas/Unidad.tsx`:

```tsx
import { useState } from 'react'
import { mockDataSource as ds } from '../data/mock/MockDataSource'
import { useFiltros } from '../state/FiltrosContext'
import { porId, ancestrosDe } from '../data/mock/unidades'
import { TarjetaIndicador } from '../components/kpi/TarjetaIndicador'
import { GraficoSerie } from '../components/graficos/GraficoSerie'
import type { CategoriaIndicador } from '../data/tipos'

export function Unidad() {
  const { filtro } = useFiltros()
  const [abierto, setAbierto] = useState<string | null>(null)
  const u = filtro.unidadId ? porId(filtro.unidadId) : undefined
  if (!u) return null

  const ruta = [...ancestrosDe(u.id)].reverse().map(a => a.nombre).join(' › ')
  const indicadores = ds.getIndicadores(u.id, filtro)

  const seccion = (categoria: CategoriaIndicador, titulo: string) => {
    const lista = indicadores.filter(i => i.categoria === categoria)
    if (!lista.length) return null
    return (
      <section className="mt-6">
        <h3 className="mb-3 text-xs uppercase tracking-wide text-white/50">{titulo}</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {lista.map(i => (
            <TarjetaIndicador key={i.id} indicador={i}
              punto={ds.getUltimo(i.id)!}
              serie={ds.getSerie(i.id).slice(-12).map(p => p.valor)}
              onClic={setAbierto} />
          ))}
        </div>
      </section>
    )
  }

  const detalle = abierto
    ? indicadores.find(i => i.id === abierto) ?? null : null

  return (
    <div className="p-6">
      <div className="text-xs text-white/45">{ruta}</div>
      <h2 className="text-2xl font-semibold">{u.nombre}</h2>

      {seccion('servicio', 'Indicadores de Servicio')}
      {seccion('proceso', 'Indicadores de Proceso')}

      {detalle && (
        <div role="dialog" aria-label={detalle.nombre}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8">
          <div className="w-full max-w-4xl rounded-2xl bg-panel-2 p-6 ring-1 ring-white/15">
            <div className="mb-1 flex items-start justify-between gap-4">
              <h4 className="text-lg font-semibold">{detalle.nombre}</h4>
              <button onClick={() => setAbierto(null)}
                className="rounded-lg px-3 py-1.5 text-sm text-white/60
                           ring-1 ring-white/15 hover:text-white">
                Cerrar
              </button>
            </div>
            <p className="mb-4 text-xs text-white/45">
              Serie de los últimos 24 meses · {u.nombre}
            </p>
            <GraficoSerie serie={ds.getSerie(detalle.id)}
              tipoMetrica={detalle.tipoMetrica} />
          </div>
        </div>
      )}
    </div>
  )
}
```

`app/src/vistas/Enrutador.tsx`:

```tsx
import { useFiltros } from '../state/FiltrosContext'
import { hijosDe } from '../data/mock/unidades'
import { Rectoral } from './Rectoral'
import { Nivel } from './Nivel'
import { Unidad } from './Unidad'

export function Enrutador() {
  const { filtro } = useFiltros()

  if (filtro.unidadId) {
    // Una unidad sin descendencia es una hoja: se muestran sus indicadores.
    return hijosDe(filtro.unidadId).length ? <Nivel /> : <Unidad />
  }
  if (filtro.areaId || filtro.nivel !== null) return <Nivel />
  return <Rectoral />
}
```

> **Cuidado con el test «con una facultad muestra la rejilla de sus escuelas»:** `fac-salud` tiene hijos, así que el enrutador escoge `<Nivel />`, y `Nivel` lista `hijosDe('fac-salud')`. Si en el futuro se quiere ver también los indicadores propios de la facultad, hace falta una pestaña, no cambiar esta regla.

- [ ] **Step 6: Ejecutar y verificar que pasan**

Run: `cd app && npm test -- vistas`
Expected: PASS, 8 tests

- [ ] **Step 7: Conectar el enrutador en App.tsx**

En `app/src/App.tsx`, sustituir `<Rectoral />` por `<Enrutador />` y ajustar el import.

- [ ] **Step 8: Verificar el recorrido completo en el navegador**

Run: `cd app && npm run dev`
Expected: escoger `Nivel = Escuelas`, luego `Área = Facultad de Ciencias de la Salud`, luego `Unidad = Escuela de Medicina`. Debe aparecer la vista de unidad con 20 indicadores. Hacer clic en uno y ver la serie de 24 meses. Cerrar y pulsar `← Atrás` para retroceder. Detener con Ctrl+C.

- [ ] **Step 9: Commit**

```bash
git add app/src
git commit -m "Añade las vistas de nivel y de unidad con enrutado por filtros"
```

---

## Task 12: Vista Territorial

**Files:**
- Create: `app/src/vistas/Territorial.tsx`
- Modify: `app/src/vistas/Enrutador.tsx`
- Test: `app/src/vistas/Territorial.test.tsx`

**Interfaces:**
- Consumes: `mockDataSource.getTerritoriales()`, `MapaRD`, `useFiltros`.
- Produces: `<Territorial />`. El enrutador la escoge cuando `filtro.nivel` es 6, 7 u 8 y no hay unidad concreta seleccionada.

- [ ] **Step 1: Escribir los tests que fallan**

`app/src/vistas/Territorial.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProveedorFiltros, useFiltros } from '../state/FiltrosContext'
import { Territorial } from './Territorial'

function Espia() {
  const { filtro } = useFiltros()
  return <div data-testid="espia">{filtro.unidadId ?? 'ninguna'}</div>
}

const montar = () => {
  render(<ProveedorFiltros><Territorial /><Espia /></ProveedorFiltros>)
  return userEvent.setup()
}

describe('Territorial', () => {
  it('incluye el mapa y la tabla comparativa', () => {
    montar()
    expect(screen.getByRole('group', { name: 'Red territorial de la UASD' }))
      .toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('lista una fila por unidad territorial', () => {
    montar()
    const cuerpo = within(screen.getByRole('table')).getAllByRole('row')
    expect(cuerpo).toHaveLength(1 + 1 + 4 + 18 + 12)   // encabezado + sede + red
  })

  it('agrupa por tipo con etiqueta legible', () => {
    montar()
    const tabla = within(screen.getByRole('table'))
    expect(tabla.getAllByText('Recinto').length).toBe(4)
    expect(tabla.getAllByText('Centro').length).toBe(18)
    expect(tabla.getAllByText('Subcentro').length).toBe(12)
  })

  it('ordena por cumplimiento al pulsar el encabezado de la columna', async () => {
    const usuario = montar()
    await usuario.click(screen.getByRole('button', { name: /Cumplimiento/ }))
    const filas = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    const valores = filas.map(f =>
      Number(within(f).getAllByRole('cell')[3].textContent!.replace('%', '')))
    expect([...valores].sort((a, b) => b - a)).toEqual(valores)
  })

  it('filtra al hacer clic en una fila', async () => {
    const usuario = montar()
    await usuario.click(screen.getByRole('row', { name: /Recinto Barahona/ }))
    expect(screen.getByTestId('espia')).toHaveTextContent('recinto-barahona')
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `cd app && npm test -- Territorial`
Expected: FAIL — módulo no encontrado

- [ ] **Step 3: Implementar la vista**

`app/src/vistas/Territorial.tsx`:

```tsx
import { useState } from 'react'
import { mockDataSource as ds } from '../data/mock/MockDataSource'
import { useFiltros } from '../state/FiltrosContext'
import { MapaRD } from '../components/mapa/MapaRD'
import { Semaforo } from '../components/kpi/Semaforo'
import { formatearCompacto } from '../components/kpi/formato'
import type { FilaUnidad } from '../data/source'

const ETIQUETA_TIPO: Record<string, string> = {
  recinto: 'Recinto', centro: 'Centro', subcentro: 'Subcentro',
}
const ORDEN_TIPO = ['recinto', 'centro', 'subcentro']

type Columna = 'nombre' | 'matricula' | 'cumplimiento'

export function Territorial() {
  const { despachar } = useFiltros()
  const [orden, setOrden] = useState<Columna>('nombre')

  const filas = [...ds.getTerritoriales()].sort((a, b) => {
    if (orden === 'cumplimiento') return b.cumplimiento - a.cumplimiento
    if (orden === 'matricula') return b.unidad.peso - a.unidad.peso
    const t = ORDEN_TIPO.indexOf(a.unidad.tipo) - ORDEN_TIPO.indexOf(b.unidad.tipo)
    return t !== 0 ? t : a.unidad.nombre.localeCompare(b.unidad.nombre, 'es')
  })

  const encabezado = (col: Columna, texto: string) => (
    <th scope="col" className="px-4 py-3 text-left font-medium">
      <button onClick={() => setOrden(col)}
        className={`hover:text-white ${orden === col ? 'text-white' : 'text-white/60'}`}>
        {texto}
      </button>
    </th>
  )

  return (
    <div className="grid gap-4 p-6 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-xl bg-panel-2 p-4 ring-1 ring-white/10">
        <h2 className="mb-2 text-xl font-semibold">Red territorial</h2>
        <MapaRD alto={560} />
      </div>

      <div className="overflow-auto rounded-xl bg-panel-2 ring-1 ring-white/10">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-panel-2 text-xs uppercase tracking-wide">
            <tr className="border-b border-white/10">
              {encabezado('nombre', 'Unidad')}
              <th scope="col" className="px-4 py-3 text-left font-medium text-white/60">
                Tipo
              </th>
              {encabezado('matricula', 'Matrícula')}
              {encabezado('cumplimiento', 'Cumplimiento')}
              <th scope="col" className="px-4 py-3 text-left font-medium text-white/60">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f: FilaUnidad) => (
              <tr key={f.unidad.id}
                onClick={() => despachar({
                  tipo: 'seleccionarUnidad', valor: f.unidad.id })}
                className="cursor-pointer border-b border-white/5 hover:bg-uasd-azul/25">
                <td className="px-4 py-2.5">{f.unidad.nombre}</td>
                <td className="px-4 py-2.5 text-white/55">
                  {ETIQUETA_TIPO[f.unidad.tipo] ?? 'Sede'}
                </td>
                <td className="px-4 py-2.5 tabular-nums">
                  {formatearCompacto(f.unidad.peso * 1000)}
                </td>
                <td className="px-4 py-2.5 tabular-nums">
                  {f.cumplimiento.toFixed(1)}%
                </td>
                <td className="px-4 py-2.5"><Semaforo estado={f.semaforo} conEtiqueta /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

> **Cuidado con el test de orden:** la columna de cumplimiento es la de índice 3 (`Unidad`, `Tipo`, `Matrícula`, `Cumplimiento`). Si se reordenan las columnas, ajustar el índice del test.

> **Nota sobre la sede:** `sede-central` es de tipo `rectoria` con coordenadas (Tarea 2), por eso cae en la etiqueta `'Sede'` y los conteos de 4 recintos, 18 centros y 12 subcentros cuadran.

- [ ] **Step 4: Enrutar hacia la vista territorial**

En `app/src/vistas/Enrutador.tsx`, antes de la comprobación de `areaId`:

```tsx
  if (!filtro.unidadId && filtro.nivel !== null && [6, 7, 8].includes(filtro.nivel))
    return <Territorial />
```

- [ ] **Step 5: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- Territorial Enrutador`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/src/vistas
git commit -m "Añade la vista territorial con mapa y tabla comparativa"
```

---

## Task 13: Servicios de Registro

**Files:**
- Create: `app/src/data/mock/servicios.ts`, `app/src/vistas/Servicios.tsx`
- Test: `app/src/data/mock/servicios.test.ts`, `app/src/vistas/Servicios.test.tsx`

**Interfaces:**
- Consumes: `mulberry32`, `hashSemilla`, `SEMILLA_GLOBAL`, `formatear`.
- Produces:
  - `SERVICIOS: Servicio[]` con `Servicio = { id, nombre, costoRD, ventanilla, enviaMescyt }` y `metricasServicio(id): { solicitudes, tiempoEmisionDias, metaTiempoDias, recaudacionRD, semaforo }`, más `cargaPorVentanilla(): { ventanilla, solicitudes }[]` desde `mock/servicios.ts`.
  - `<Servicios />`.

Los datos de nombre, costo y ventanilla salen **literalmente** de `Lista de Servicios 21082026.xlsx`. Solo el volumen y el tiempo son simulados. Ese contraste es el argumento de la vista.

- [ ] **Step 1: Escribir los tests que fallan**

`app/src/data/mock/servicios.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { SERVICIOS, metricasServicio, cargaPorVentanilla } from './servicios'

describe('catálogo de servicios de Registro', () => {
  it('trae los servicios del documento fuente', () => {
    const nombres = SERVICIOS.map(s => s.nombre)
    expect(nombres).toContain('Récord de Notas Oficial')
    expect(nombres).toContain('Certificado de Título')
    expect(nombres).toContain('Carta para Exequátur')
    expect(nombres).toContain('Investiduras')
    expect(SERVICIOS.length).toBeGreaterThanOrEqual(18)
  })

  it('conserva los costos reales en pesos', () => {
    const buscar = (n: string) => SERVICIOS.find(s => s.nombre === n)!
    expect(buscar('Récord de Notas Oficial').costoRD).toBe(200)
    expect(buscar('Récord de Notas Interno').costoRD).toBe(30)
    expect(buscar('Investiduras').costoRD).toBe(1855)
    expect(buscar('Lista de Graduados').costoRD).toBe(500)
  })

  it('asigna la ventanilla documentada', () => {
    expect(SERVICIOS.find(s => s.nombre === 'Récord de Notas Oficial')!.ventanilla).toBe(3)
    expect(SERVICIOS.find(s => s.nombre === 'Investiduras')!.ventanilla).toBe(5)
  })

  it('no repite identificadores', () => {
    const ids = SERVICIOS.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('métricas simuladas de servicio', () => {
  it('son determinísticas', () => {
    const id = SERVICIOS[0].id
    expect(metricasServicio(id)).toEqual(metricasServicio(id))
  })

  it('la recaudación es solicitudes por costo', () => {
    for (const s of SERVICIOS) {
      const m = metricasServicio(s.id)
      expect(m.recaudacionRD).toBe(m.solicitudes * s.costoRD)
    }
  })

  it('produce volúmenes y tiempos plausibles', () => {
    for (const s of SERVICIOS) {
      const m = metricasServicio(s.id)
      expect(m.solicitudes).toBeGreaterThan(0)
      expect(m.tiempoEmisionDias).toBeGreaterThan(0)
      expect(m.tiempoEmisionDias).toBeLessThan(30)
      expect(m.metaTiempoDias).toBeGreaterThan(0)
    }
  })

  it('marca en rojo los servicios que exceden su meta de tiempo', () => {
    for (const s of SERVICIOS) {
      const m = metricasServicio(s.id)
      if (m.tiempoEmisionDias > m.metaTiempoDias * 1.25)
        expect(m.semaforo).toBe('rojo')
    }
  })

  it('reparte la carga entre las ventanillas documentadas', () => {
    const carga = cargaPorVentanilla()
    expect(carga.length).toBeGreaterThanOrEqual(4)
    const total = carga.reduce((a, c) => a + c.solicitudes, 0)
    const esperado = SERVICIOS.reduce(
      (a, s) => a + metricasServicio(s.id).solicitudes, 0)
    expect(total).toBe(esperado)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `cd app && npm test -- servicios`
Expected: FAIL — módulo no encontrado

- [ ] **Step 3: Implementar el catálogo de servicios**

`app/src/data/mock/servicios.ts`. Los primeros tres campos son datos **reales** del `.xlsx`; el resto es simulado:

```ts
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
```

> **Cuidado con el test del semáforo rojo:** el umbral del test es `> metaTiempoDias * 1.25`, y la implementación usa `razon <= 1.25 ? 'ambar' : 'rojo'`. Coinciden. Si se cambia un umbral, hay que cambiar el otro.

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- mock/servicios`
Expected: PASS, 9 tests

- [ ] **Step 5: Escribir los tests que fallan de la vista**

`app/src/vistas/Servicios.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ProveedorFiltros } from '../state/FiltrosContext'
import { Servicios } from './Servicios'

const montar = () =>
  render(<ProveedorFiltros><Servicios /></ProveedorFiltros>)

describe('Servicios', () => {
  it('titula la vista con la unidad real de origen', () => {
    montar()
    expect(screen.getByRole('heading', { name: /Registro Universitario/ }))
      .toBeInTheDocument()
  })

  it('advierte qué parte del dato es real', () => {
    montar()
    expect(screen.getByText(/Catálogo, costos y ventanillas: datos reales/))
      .toBeInTheDocument()
  })

  it('lista los servicios con su costo real', () => {
    montar()
    const tabla = within(screen.getByRole('table'))
    expect(tabla.getByText('Investiduras')).toBeInTheDocument()
    expect(tabla.getByText('RD$ 1,855')).toBeInTheDocument()
  })

  it('ordena los servicios por recaudación de mayor a menor', () => {
    montar()
    const filas = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    const montos = filas.map(f => {
      const t = within(f).getAllByRole('cell')[4].textContent!
      return Number(t.replace(/[^0-9.]/g, ''))
    })
    expect(montos[0]).toBeGreaterThanOrEqual(montos[montos.length - 1])
  })

  it('muestra la carga por ventanilla', () => {
    montar()
    expect(screen.getByText('Carga por ventanilla')).toBeInTheDocument()
    expect(screen.getByText('Ventanilla 5')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Ejecutar y verificar que falla**

Run: `cd app && npm test -- vistas/Servicios`
Expected: FAIL — módulo no encontrado

- [ ] **Step 7: Implementar la vista**

`app/src/vistas/Servicios.tsx`:

```tsx
import { SERVICIOS, metricasServicio, cargaPorVentanilla } from '../data/mock/servicios'
import { Semaforo } from '../components/kpi/Semaforo'
import { TarjetaKPI } from '../components/kpi/TarjetaKPI'
import { formatear, formatearCompacto } from '../components/kpi/formato'

export function Servicios() {
  const filas = SERVICIOS
    .map(s => ({ servicio: s, m: metricasServicio(s.id) }))
    .sort((a, b) => b.m.recaudacionRD - a.m.recaudacionRD)

  const totalSolicitudes = filas.reduce((a, f) => a + f.m.solicitudes, 0)
  const totalRecaudado = filas.reduce((a, f) => a + f.m.recaudacionRD, 0)
  const tiempoPromedio =
    filas.reduce((a, f) => a + f.m.tiempoEmisionDias, 0) / filas.length
  const carga = cargaPorVentanilla()
  const topeCarga = Math.max(...carga.map(c => c.solicitudes))

  return (
    <div className="grid gap-4 p-6">
      <div>
        <h2 className="text-2xl font-semibold">
          Servicios de Registro Universitario
        </h2>
        <p className="text-xs text-white/45">
          Catálogo, costos y ventanillas: datos reales de la matriz institucional de
          servicios. Volúmenes y tiempos: simulados para la demostración.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <TarjetaKPI titulo="Solicitudes del mes"
          valor={formatearCompacto(totalSolicitudes)}
          detalle={`${SERVICIOS.length} servicios en catálogo`} />
        <TarjetaKPI titulo="Recaudación del mes"
          valor={formatear(totalRecaudado, 'moneda')}
          detalle="Suma de aranceles cobrados" />
        <TarjetaKPI titulo="Tiempo promedio de emisión"
          valor={formatear(tiempoPromedio, 'dias')}
          detalle="Promedio ponderado del catálogo" />
        <TarjetaKPI titulo="Servicios fuera de meta"
          valor={String(filas.filter(f => f.m.semaforo === 'rojo').length)}
          detalle="Exceden su tiempo objetivo" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[3fr_1fr]">
        <div className="overflow-auto rounded-xl bg-panel-2 ring-1 ring-white/10">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-panel-2 text-xs uppercase
                              tracking-wide text-white/60">
              <tr className="border-b border-white/10">
                <th scope="col" className="px-4 py-3 text-left font-medium">Servicio</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Costo</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Ventanilla</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Solicitudes</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Recaudación</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Emisión</th>
                <th scope="col" className="px-4 py-3 text-left font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ servicio, m }) => (
                <tr key={servicio.id} className="border-b border-white/5">
                  <td className="px-4 py-2.5">{servicio.nombre}</td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {formatear(servicio.costoRD, 'moneda')}
                  </td>
                  <td className="px-4 py-2.5 text-white/55">{servicio.ventanilla}</td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {m.solicitudes.toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {formatear(m.recaudacionRD, 'moneda')}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {formatear(m.tiempoEmisionDias, 'dias')}
                    <span className="text-white/40">
                      {` / meta ${m.metaTiempoDias}`}
                    </span>
                  </td>
                  <td className="px-4 py-2.5"><Semaforo estado={m.semaforo} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl bg-panel-2 p-4 ring-1 ring-white/10">
          <div className="mb-3 text-xs uppercase tracking-wide text-white/50">
            Carga por ventanilla
          </div>
          <ul className="space-y-3">
            {carga.map(c => (
              <li key={c.ventanilla}>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">{`Ventanilla ${c.ventanilla}`}</span>
                  <span className="tabular-nums text-white/60">
                    {c.solicitudes.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded bg-white/5">
                  <div className="h-2 rounded bg-uasd-azul-claro"
                    style={{ width: `${(c.solicitudes / topeCarga) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Enrutar hacia Servicios cuando se filtre a Registro**

En `app/src/vistas/Enrutador.tsx`, como primera comprobación:

```tsx
  if (filtro.unidadId === 'dir-registro') return <Servicios />
```

- [ ] **Step 9: Ejecutar y verificar que pasa**

Run: `cd app && npm test`
Expected: PASS, toda la batería

> Si el test de la Tarea 11 «muestra los diez indicadores de servicio y los diez de proceso» monta `<Unidad />` directamente, sigue pasando: ese test no usa el enrutador.

- [ ] **Step 10: Commit**

```bash
git add app/src
git commit -m "Añade la vista de servicios de Registro sobre el catálogo real"
```

---

## Task 14: Modo kiosco

**Files:**
- Create: `app/src/kiosco/Rotador.tsx`
- Modify: `app/src/App.tsx`
- Test: `app/src/kiosco/Rotador.test.tsx`

**Interfaces:**
- Consumes: `useFiltros`, las cinco vistas.
- Produces: `<Rotador />` — envuelve la aplicación, rota vistas y cede el control al detectar interacción.

Ciclo: Portada → Territorial → Servicios → Vicerrectoría Docente → Vicerrectoría Administrativa → Investigación y Postgrado → Extensión → Portada. Intervalo: 25 segundos.

- [ ] **Step 1: Escribir los tests que fallan**

`app/src/kiosco/Rotador.test.tsx`:

```tsx
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { ProveedorFiltros } from '../state/FiltrosContext'
import { Rotador } from './Rotador'

const montar = () =>
  render(<ProveedorFiltros><Rotador /></ProveedorFiltros>)

describe('Rotador', () => {
  afterEach(() => vi.useRealTimers())

  it('arranca en la portada rectoral', () => {
    vi.useFakeTimers()
    montar()
    expect(screen.getByText('Matrícula total')).toBeInTheDocument()
  })

  it('oculta la barra de filtros mientras rota', () => {
    vi.useFakeTimers()
    montar()
    expect(screen.queryByText('Área / Dependencia')).not.toBeInTheDocument()
  })

  it('avanza a la vista siguiente al cumplirse el intervalo', () => {
    vi.useFakeTimers()
    montar()
    act(() => { vi.advanceTimersByTime(25_000) })
    expect(screen.getByRole('heading', { name: 'Red territorial' })).toBeInTheDocument()
  })

  it('muestra el avance del ciclo', () => {
    vi.useFakeTimers()
    montar()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('congela la rotación y revela los filtros al mover el mouse', () => {
    vi.useFakeTimers()
    montar()
    act(() => { fireEvent.mouseMove(window) })
    expect(screen.getByText('Área / Dependencia')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(60_000) })
    // Sigue en la portada: la rotación está detenida.
    expect(screen.getByText('Matrícula total')).toBeInTheDocument()
  })

  it('reanuda la rotación con la tecla K', () => {
    vi.useFakeTimers()
    montar()
    act(() => { fireEvent.mouseMove(window) })
    act(() => { fireEvent.keyDown(window, { key: 'k' }) })
    expect(screen.queryByText('Área / Dependencia')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `cd app && npm test -- Rotador`
Expected: FAIL — módulo no encontrado

- [ ] **Step 3: Implementar el rotador**

`app/src/kiosco/Rotador.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useFiltros } from '../state/FiltrosContext'
import { BarraFiltros } from '../components/filtros/BarraFiltros'
import { Enrutador } from '../vistas/Enrutador'
import type { Accion } from '../state/filtros'

const INTERVALO_MS = 25_000

/** Cada parada del ciclo es simplemente un estado de filtros. */
const CICLO: Accion[] = [
  { tipo: 'limpiar' },
  { tipo: 'nivel', valor: 6 },
  { tipo: 'seleccionarUnidad', valor: 'dir-registro' },
  { tipo: 'seleccionarUnidad', valor: 'vic-docente' },
  { tipo: 'seleccionarUnidad', valor: 'vic-admin' },
  { tipo: 'seleccionarUnidad', valor: 'vic-invpos' },
  { tipo: 'seleccionarUnidad', valor: 'vic-extension' },
]

export function Rotador() {
  const { despachar } = useFiltros()
  const [rotando, setRotando] = useState(true)
  const [paso, setPaso] = useState(0)

  // Avance del ciclo.
  useEffect(() => {
    if (!rotando) return
    const id = setInterval(() => setPaso(p => (p + 1) % CICLO.length), INTERVALO_MS)
    return () => clearInterval(id)
  }, [rotando])

  // Aplica el estado de filtros de la parada actual.
  useEffect(() => {
    if (rotando) despachar(CICLO[paso])
  }, [paso, rotando, despachar])

  // Toma de control y reanudación.
  useEffect(() => {
    const tomarControl = () => setRotando(false)
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k') { setPaso(0); setRotando(r => !r) }
      else tomarControl()
    }
    window.addEventListener('mousemove', tomarControl)
    window.addEventListener('touchstart', tomarControl)
    window.addEventListener('keydown', alTeclado)
    return () => {
      window.removeEventListener('mousemove', tomarControl)
      window.removeEventListener('touchstart', tomarControl)
      window.removeEventListener('keydown', alTeclado)
    }
  }, [])

  return (
    <>
      {rotando ? (
        <div role="progressbar"
          aria-label={`Vista ${paso + 1} de ${CICLO.length}`}
          aria-valuenow={paso + 1} aria-valuemin={1} aria-valuemax={CICLO.length}
          className="h-1 w-full bg-white/5">
          <div className="h-1 bg-uasd-azul-claro transition-all duration-500"
            style={{ width: `${((paso + 1) / CICLO.length) * 100}%` }} />
        </div>
      ) : (
        <BarraFiltros />
      )}
      <main className="flex-1 overflow-auto"><Enrutador /></main>
    </>
  )
}
```

> **Cuidado con la tecla K:** el manejador de teclado hace ambas cosas — la tecla `k` alterna la rotación, cualquier otra tecla toma el control. Por eso el test que reanuda con `k` funciona: `setRotando(r => !r)` pasa de `false` a `true`.

> **Cuidado con el bucle de efectos:** `despachar` es estable porque viene de `useReducer`. Si se sustituye por una función recreada en cada render, este efecto entra en bucle infinito.

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- Rotador`
Expected: PASS, 6 tests

- [ ] **Step 5: Conectar el rotador en App.tsx**

`app/src/App.tsx`:

```tsx
import { ProveedorFiltros } from './state/FiltrosContext'
import { Encabezado } from './components/marco/Encabezado'
import { Rotador } from './kiosco/Rotador'
import { DistintivoDemo } from './components/marco/DistintivoDemo'

export default function App() {
  return (
    <ProveedorFiltros>
      <div className="flex h-screen flex-col bg-panel">
        <Encabezado />
        <Rotador />
        <DistintivoDemo />
      </div>
    </ProveedorFiltros>
  )
}
```

`DistintivoDemo` se implementa en la Tarea 15. Hasta entonces, crear un marcador mínimo para que el build compile:

```tsx
// app/src/components/marco/DistintivoDemo.tsx (provisional)
export function DistintivoDemo() { return null }
```

- [ ] **Step 6: Verificar el kiosco en el navegador**

Run: `cd app && npm run dev`
Expected: sin tocar nada, la pantalla rota entre las siete paradas cada 25 s con la barra de progreso arriba. Al mover el mouse, la rotación se detiene y baja la barra de filtros. Pulsar `k` reanuda desde la portada. Detener con Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add app/src
git commit -m "Añade el modo kiosco con rotación automática y toma de control"
```

---

## Task 15: Identidad visual y cierre

**Files:**
- Create: `app/src/assets/escudo-uasd.png` (descargado), `app/src/components/marco/DistintivoDemo.tsx`, `app/README.md`
- Modify: `app/index.html`, `app/src/App.tsx`
- Test: `app/src/components/marco/DistintivoDemo.test.tsx`

**Interfaces:**
- Produces: `<DistintivoDemo />` — aviso permanente ocultable con la tecla `D`.

- [ ] **Step 1: Obtener el escudo institucional**

Descargar el escudo oficial de la UASD desde una fuente pública y guardarlo como `app/src/assets/escudo-uasd.png`, sustituyendo el marcador de 1 px creado en la Tarea 10. Requisitos: formato PNG con fondo transparente, al menos 256 px de lado.

Verificar el resultado:

```bash
cd app && node -e "const s=require('fs').statSync('src/assets/escudo-uasd.png');console.log('bytes:',s.size)"
```

Expected: más de 5,000 bytes. Si sigue siendo el marcador de 1 px (menos de 200 bytes), la descarga falló.

> **Uso de marca:** el escudo se emplea aquí para un prototipo interno de demostración. Antes de cualquier difusión pública del tablero debe confirmarse la autorización de uso de la identidad institucional con la UASD.

- [ ] **Step 2: Escribir los tests que fallan del distintivo**

`app/src/components/marco/DistintivoDemo.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { DistintivoDemo } from './DistintivoDemo'

describe('DistintivoDemo', () => {
  it('advierte que los datos son simulados', () => {
    render(<DistintivoDemo />)
    expect(screen.getByText('DATOS SIMULADOS — DEMO')).toBeInTheDocument()
  })

  it('se oculta con la tecla D', () => {
    render(<DistintivoDemo />)
    act(() => { fireEvent.keyDown(window, { key: 'd' }) })
    expect(screen.queryByText('DATOS SIMULADOS — DEMO')).not.toBeInTheDocument()
  })

  it('vuelve a aparecer al pulsar D de nuevo', () => {
    render(<DistintivoDemo />)
    act(() => { fireEvent.keyDown(window, { key: 'd' }) })
    act(() => { fireEvent.keyDown(window, { key: 'D' }) })
    expect(screen.getByText('DATOS SIMULADOS — DEMO')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Ejecutar y verificar que falla**

Run: `cd app && npm test -- DistintivoDemo`
Expected: FAIL — el marcador provisional devuelve `null`

- [ ] **Step 4: Implementar el distintivo**

`app/src/components/marco/DistintivoDemo.tsx`:

```tsx
import { useEffect, useState } from 'react'

export function DistintivoDemo() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'd') setVisible(v => !v)
    }
    window.addEventListener('keydown', alTeclado)
    return () => window.removeEventListener('keydown', alTeclado)
  }, [])

  if (!visible) return null
  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-50 rounded-md
                    bg-black/55 px-3 py-1.5 text-[11px] font-medium
                    tracking-wide text-white/70 ring-1 ring-white/15">
      DATOS SIMULADOS — DEMO
    </div>
  )
}
```

- [ ] **Step 5: Ejecutar y verificar que pasa**

Run: `cd app && npm test -- DistintivoDemo`
Expected: PASS, 3 tests

- [ ] **Step 6: Poner título y favicon a la página**

`app/index.html`: cambiar el `<title>` a `Tablero Rectoral UASD` y el `<link rel="icon">` a `/escudo.png`, copiando el escudo también a `app/public/escudo.png`.

- [ ] **Step 7: Escribir el README de operación**

`app/README.md`, con: cómo arrancar (`npm install`, `npm run dev`, `F11`), los atajos de teclado (`K` para alternar kiosco, `D` para el distintivo), dónde corregir las cifras ancla (`src/data/anclas.ts`), y cómo se sustituiría `MockDataSource` por una implementación real de `DataSource`.

- [ ] **Step 8: Verificación final completa**

```bash
cd app && npm test && npm run build
```

Expected: toda la batería en verde y build sin errores de TypeScript.

Después, `npm run dev` y comprobar manualmente en pantalla completa (`F11`):

1. La portada carga con el escudo real y los seis KPI.
2. El mapa muestra los 35 puntos; al clicar Barahona, el tablero se filtra y aparece el chip.
3. `Nivel = Escuelas` → `Área = Facultad de Ciencias de la Salud` → `Unidad = Escuela de Medicina` llega a los 20 indicadores.
4. Clic en un indicador abre la serie de 24 meses; Cerrar la cierra.
5. `Limpiar todo` vuelve a la portada.
6. Sin tocar nada 25 segundos, el kiosco avanza a la vista territorial.
7. Mover el mouse detiene la rotación y baja la barra de filtros.
8. `D` oculta y muestra el distintivo de datos simulados.

Anotar cualquier fallo y corregirlo antes del commit.

- [ ] **Step 9: Commit**

```bash
git add app
git commit -m "Añade la identidad institucional, el distintivo de demo y el README"
```

---

## Verificación de cobertura del spec

| Requisito del spec | Tarea que lo implementa |
|---|---|
| Capa `DataSource` desacoplada | 5 |
| Modelo de dominio (Unidad, Indicador, PuntoSerie) | 2 |
| Inferencia de tipo de métrica por palabra clave | 3 |
| Generación determinística con semilla | 4 |
| Distribución 70/20/10 de semáforos | 4 |
| Estacionalidad académica | 4 |
| Sensación de tiempo real | 10 (feed de actividad) |
| Cifras ancla centralizadas | 4 |
| Barra horizontal con seis filtros en cascada | 7 |
| Filtrado cruzado completo | 9, 10, 11, 12 |
| Chips, Limpiar todo, Atrás | 6, 7 |
| Portada Rectoral | 10 |
| Vista de Nivel / Área | 11 |
| Vista de Unidad con 20 indicadores | 11 |
| Vista Territorial | 12 |
| Vista de Servicios sobre catálogo real | 13 |
| Modo kiosco con toma de control | 14 |
| Identidad visual y escudo | 15 |
| Distintivo de datos simulados | 15 |
| Cero red en tiempo de ejecución | 9 (mapa generado en build), 15 |
| Niveles 9 y 10 reservados en el árbol | 2 (en `NIVELES`, sin unidades propias) |

## Riesgos de ejecución del plan

| Riesgo | Señal | Respuesta |
|---|---|---|
| El id `214` no identifica a RD en el atlas instalado | El script de la Tarea 9 lanza error | Usar el comando de diagnóstico del Step 2 y corregir el id |
| La reimplementación de Mercator no coincide con d3 | Falla el test de referencias | Corregir la fórmula en el script y regenerar; nunca relajar la tolerancia |
| La distribución de semáforos se sale del ±3% | Falla el test de la Tarea 4 | Ajustar los topes de `BANDAS`, nunca las tolerancias del test |
| Generar 2,900 series bloquea el primer render | El navegador tarda en pintar | La memoización de la Tarea 5 ya evita recalcular; si persiste, generar por unidad bajo demanda |
| `sede-central` cuenta como recinto y rompe el conteo | Falla el test de la Tarea 12 | Darle `tipo: 'rectoria'` conservando coordenadas, como indica la nota de la Tarea 12 |
