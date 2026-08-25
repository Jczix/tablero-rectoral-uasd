# Tablero Rectoral UASD

Tablero institucional de indicadores para pantalla de kiosco (televisor,
1920×1080), con portada rectoral, vistas por nivel/área/unidad, vista
territorial, vista de servicios, filtros en cascada, mapa interactivo y
modo kiosco con rotación automática.

> **Este es un prototipo de demostración.** Todas las cifras que se ven en
> pantalla son **simuladas** (generadas de forma determinística a partir de
> unas pocas cifras ancla), no datos reales de la universidad. El distintivo
> "DATOS SIMULADOS — DEMO" en la esquina inferior derecha lo recuerda en
> todo momento; ver la sección de atajos de teclado para ocultarlo/mostrarlo.

## Instalación y arranque

Requiere Node.js (18 o superior) y npm.

```bash
npm install
npm run dev
```

Esto levanta un servidor de desarrollo (Vite) y muestra la URL local en la
terminal (normalmente `http://localhost:5173`). Ábrela en el navegador.

Para producción:

```bash
npm run build     # compila a dist/ (incluye chequeo de tipos con tsc -b)
npm run preview   # sirve dist/ localmente para verificar el build
```

## Pantalla completa (modo televisor)

El tablero está pensado para un televisor a 1920×1080 sin desplazamiento de
página. En el navegador, pulsa **F11** para entrar a pantalla completa (y de
nuevo para salir). En un televisor o pantalla dedicada, se recomienda abrir
el navegador ya en modo kiosco del sistema operativo o usar la bandera de
Chrome/Edge `--kiosk`.

## Atajos de teclado

| Tecla | Efecto |
|---|---|
| `K` | Alterna el modo kiosco (rotación automática entre las siete paradas: portada, niveles, territorial, servicios, etc., cada 25 segundos). |
| `D` | Alterna el distintivo de "DATOS SIMULADOS — DEMO". |
| Mover el ratón | Si el kiosco está rotando, cualquier movimiento del ratón detiene la rotación y muestra la barra de filtros (toma de control manual). Si no se vuelve a tocar nada, el kiosco **reanuda la rotación automáticamente a los 3 minutos** de inactividad. |

## Dónde corregir las cifras

Todo el desglose sintético del tablero se deriva de un puñado de "cifras
ancla" institucionales, centralizadas en:

```
src/data/anclas.ts
```

Cambiar un valor ahí (matrícula, presupuesto, número de facultades, etc.)
recalibra el tablero completo sin tocar ninguna otra línea de código.

> **Importante:** las cifras ancla actuales son aproximaciones de orden de
> magnitud tomadas como referencia de trabajo, **no cifras oficiales
> verificadas**. Están pendientes de validación con la UASD antes de
> cualquier presentación real (por ejemplo, ante el Rector) o difusión
> pública. El propio archivo `anclas.ts` lleva esa advertencia en su
> cabecera; no se debe retirar hasta que alguien de la UASD confirme los
> valores.

## Sustituir los datos simulados por un origen real

Todo el tablero lee los datos a través de la interfaz `DataSource`, definida
en `src/data/source.ts`:

```ts
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

Hoy esa interfaz la implementa `MockDataSource`
(`src/data/mock/MockDataSource.ts`), que genera todo en memoria a partir de
`anclas.ts` y del catálogo de unidades. Para conectar un origen real (una
API institucional) sin reescribir ninguna vista, hay que:

1. Crear una nueva implementación, por ejemplo `ApiDataSource`, que cumpla
   la misma interfaz `DataSource`.
2. Seguir el patrón de **almacén hidratado** que ya está documentado en el
   comentario de cabecera de `src/data/source.ts`: `DataSource` es
   deliberadamente **síncrona**, porque el tablero es de kiosco y debe pintar
   al instante, sin estados de carga. `ApiDataSource` no debe romper esa
   síncronía: al arrancar (y luego periódicamente, o vía websocket/SSE)
   hidrata en segundo plano un almacén en memoria con llamadas asíncronas a
   la API institucional, y cada método de la interfaz sigue leyendo de forma
   síncrona el snapshot ya cargado. Cuando el almacén se actualiza,
   `ApiDataSource` notifica a los suscriptores (por ejemplo un `store` de
   estado externo con `subscribe`) para que las vistas refresquen su
   lectura, sin que su código cambie una sola línea.
3. Cambiar el punto donde se instancia `mockDataSource` (hoy importado
   directamente por las vistas/estado) por la nueva instancia de
   `ApiDataSource`. La frontera `DataSource` es justo lo que permite hacer
   ese cambio sin tocar componentes de vista.

## Identidad visual y uso de marca

El escudo institucional se empaqueta como imagen estática en
`src/assets/escudo-uasd.png` (y una copia en `public/escudo.png` para el
favicon): no se descarga en tiempo de ejecución, para cumplir con el
requisito de cero llamadas de red al abrir la página.

> **Uso de marca:** el escudo y el nombre de la UASD se usan aquí para un
> **prototipo interno de demostración**. Antes de cualquier difusión pública
> de este tablero (fuera de un entorno de prueba interno) debe confirmarse
> con la UASD la autorización de uso de su identidad institucional.
