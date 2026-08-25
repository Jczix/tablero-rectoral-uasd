# Tablero Rectoral UASD — Diseño del MVP

**Fecha:** 2026-08-25
**Estado:** Aprobado para planificación
**Propósito:** Prototipo funcional para presentar al Rector de la Universidad Autónoma de Santo Domingo, con el fin de obtener aprobación del proyecto de tablero institucional de indicadores.

---

## 1. Contexto y objetivo

La UASD dispone de un catálogo de indicadores levantado documentalmente que cubre 10 niveles organizacionales y del orden de **2,400 indicadores** (20 por unidad: 10 de Servicio y 10 de Proceso). No existe todavía conexión con los sistemas transaccionales que producirían esos datos.

El objetivo de este MVP **no** es reportar datos reales. Es demostrar, con datos simulados de alta verosimilitud, cómo se vería y se operaría el tablero definitivo, de modo que el Rector apruebe la inversión en la integración de datos.

**Criterio de éxito:** el Rector puede dejar la pantalla encendida en su oficina, entiende la situación institucional en cinco segundos desde la puerta, y al acercarse puede filtrar hasta cualquiera de las ~150 unidades sin teclear.

### Restricciones

- Debe correr sin conexión a internet (la oficina puede no tener red el día de la reunión).
- Debe correr en pantalla completa en un televisor conectado a una laptop.
- La navegación es por **filtros desplegables y clic**, nunca por escritura obligatoria. El Rector no teclea.
- La capa de datos debe ser reemplazable sin tocar la interfaz, para que la migración a datos reales sea un argumento creíble de venta.

---

## 2. Fuentes analizadas

| Archivo | Aporte al diseño |
|---|---|
| `INDICADORES.docx` | Catálogo textual de indicadores para ~95 unidades: Rectoría, 4 Vicerrectorías, 9 Facultades, ~55 Escuelas, 13 Direcciones Generales, 13 Direcciones Operativas. Cada una con 10 indicadores de Servicio y 10 de Proceso. |
| `INDICADORES 2 - RECINTOS UNIVERSITARIOS.docx` | Set propio para los 4 Recintos (Santiago, San Francisco de Macorís, Barahona, San Juan) y un set común aplicable a cada Centro y cada Subcentro. |
| `Lista de Unidades Organizacionales 21082026.xlsx` | Padrón depurado: 4 recintos, 21 centros, 13 subcentros, 9 facultades, 65 escuelas con su facultad padre. Es la fuente autoritativa del árbol. |
| `Lista de Servicios 21082026.xlsx` | Catálogo real de servicios de Registro Universitario con nombre, descripción, costo en RD$ y US$, ventanilla asignada, requisitos y destino MESCYT. Base de la vista de Servicios. |
| `organigrama-general.pdf`, `Estatuto_organico_uasd_vigente.pdf` | Validación de la estructura formal y de los 10 niveles. |

---

## 3. Decisiones tomadas

| Decisión | Elección |
|---|---|
| Modo de uso | Kiosco con rotación automática **y** exploración interactiva al tomar control |
| Alcance | Árbol completo, todas las unidades con datos generados |
| Entrega | Aplicación web local (React + Vite), ejecutada desde la laptop |
| Realismo de cifras | Ancladas a magnitudes públicas reales de la UASD |
| Metas | Cada indicador con meta POA, % de cumplimiento, semáforo y tendencia |
| Identidad | Escudo oficial de la UASD y paleta institucional |
| Navegación | Barra horizontal de filtros en cascada, estilo Power BI |
| Filtrado cruzado | Completo — todo elemento visual filtra el tablero entero |
| Vistas guardadas | No incluidas en el MVP |

---

## 4. Arquitectura

### 4.1 Capa de datos desacoplada

Toda la interfaz consume una única interfaz `DataSource`:

```
getUnidades(): Unidad[]
getIndicadores(unidadId): Indicador[]
getSerie(indicadorId, periodo): PuntoSerie[]
getResumen(filtro): ResumenAgregado
```

El MVP implementa `MockDataSource`. La implementación futura `ApiDataSource` consumirá los sistemas reales. **Ninguna vista conoce el origen de los datos.** Este desacoplamiento es en sí mismo parte del argumento de venta.

### 4.2 Modelo de dominio

**Unidad** — nodo del árbol organizacional.
`id`, `nombre`, `nivel` (1–10), `tipo` (rectoria | vicerrectoria | facultad | escuela | direccion | recinto | centro | subcentro | instituto | servicio), `padreId`, `provincia` (nulo para unidades de sede), `peso` (factor de magnitud relativa, derivado de matrícula estimada).

**Indicador** — definición, no valor.
`id`, `unidadId`, `nombre` (texto literal del documento fuente), `categoria` (servicio | proceso), `tipoMetrica`, `unidadMedida`, `direccionDeseada` (mayor es mejor | menor es mejor).

**PuntoSerie** — valor mensual.
`indicadorId`, `periodo` (AAAA-MM), `valor`, `meta`, `cumplimiento` (%), `semaforo` (verde | ambar | rojo), `tendencia` (alza | baja | estable).

### 4.3 Inferencia del tipo de métrica

El nombre del indicador determina su naturaleza mediante reglas de palabra clave, aplicadas en orden:

1. Comienza con "Tiempo" → **días** (dirección deseada: menor es mejor)
2. Contiene "Nivel de satisfacción", "Índice", "Porcentaje", "Cumplimiento", "Cobertura", "Eficiencia", "Exactitud" → **porcentaje**
3. Contiene "Recursos", "Presupuest", "Ejecución presupuestaria", "Recaudación" → **moneda (RD$)**
4. Cualquier otro caso → **conteo absoluto**

Los indicadores de tiempo y los de errores, reprocesos y riesgos se marcan como "menor es mejor"; el semáforo se invierte para ellos.

### 4.4 Generación de datos

Generador **determinístico con semilla fija**. Los valores son idénticos entre recargas: una cifra que cambia sola mientras el Rector la señala destruye la credibilidad.

Procedimiento por indicador:

1. Se calcula una magnitud base a partir del `peso` de la unidad y del `tipoMetrica`.
2. Se genera una serie de 24 meses con tendencia suave, estacionalidad académica (picos en inscripción de agosto y enero, valle en julio) y ruido acotado.
3. La meta POA se fija como un objetivo alcanzable, y la distribución de resultados se calibra para producir aproximadamente **70% verde, 20% ámbar, 10% rojo** — un cuadro institucional creíble: bueno pero no perfecto. Un tablero todo verde no se cree.
4. Las unidades en rojo se eligen de forma estable para que el discurso de la demo sea repetible.

**Sensación de tiempo real:** un temporizador en vivo incrementa únicamente los contadores del día en curso (trámites atendidos, personas en cola, transacciones) con incrementos pequeños y plausibles. Las series históricas no se mueven nunca.

### 4.5 Cifras ancla

Las magnitudes agregadas se anclan a valores públicos conocidos de la UASD (matrícula total, número de facultades, red territorial, orden de magnitud del presupuesto) y de ahí se deriva el desglose por unidad.

> **Pendiente de confirmación antes de la presentación:** las cifras ancla exactas (matrícula total vigente, presupuesto anual, egresados por año, cantidad de empleados) deben ser validadas con el usuario o con una fuente institucional actualizada. Se centralizan en un único archivo de configuración, `src/data/anclas.ts`, para que corregirlas sea un cambio de una línea.

---

## 5. Navegación

### 5.1 Barra horizontal de filtros

Franja a todo lo ancho bajo el encabezado, presente en todas las vistas. Seis desplegables de destino táctil grande, legibles a distancia:

| Filtro | Contenido | Comportamiento |
|---|---|---|
| **Nivel** | Los 10 niveles organizacionales | Al seleccionar, recorta los filtros siguientes |
| **Área / Dependencia** | Vicerrectoría, Facultad o agrupación territorial según el nivel | Cascada desde Nivel |
| **Unidad** | La unidad concreta | Cascada desde Área |
| **Período** | Mes, Trimestre, Semestre, Año, Comparativo 2025 vs 2026 | Independiente |
| **Tipo de indicador** | Todos / Servicio / Proceso | Independiente |
| **Estado** | Todos / En meta / En riesgo / Incumplido | Independiente |

Cada desplegable incluye un campo de búsqueda **opcional** dentro de la lista, útil para el operador. El Rector solo despliega y selecciona.

**Cascada:** seleccionar `Nivel = Recintos` reduce el desplegable de Unidad a los 4 recintos. Seleccionar `Área = Facultad de Ciencias de la Salud` lo reduce a sus 8 escuelas. Nunca se navega una lista de 150 nombres.

### 5.2 Filtrado cruzado

Todo elemento visual es interactivo y filtra el tablero completo:

- Clic en una provincia o punto del mapa → filtra a ese recinto, centro o subcentro
- Clic en la tarjeta de una Vicerrectoría → filtra a sus direcciones dependientes
- Clic en una barra del ranking → filtra a esa unidad
- Clic en un segmento de gráfico → resalta la selección y filtra el resto del tablero

La selección activa se resalta visualmente; el resto se atenúa. Los desplegables se actualizan solos para reflejar cualquier selección hecha por clic, de modo que ambos mecanismos de filtrado siempre concuerdan.

### 5.3 Chips e historial

Los filtros activos se muestran como chips removibles debajo de la barra (`Recintos ✕` `Barahona ✕` `Trimestre ✕`), acompañados de:

- **Limpiar todo** — vuelve a la vista rectoral completa
- **← Atrás** — deshace el último filtro aplicado

El usuario nunca queda atrapado en un estado sin salida evidente.

---

## 6. Vistas

### 6.1 Portada Rectoral

La vista por defecto y el ancla de la demostración.

- **Encabezado:** escudo de la UASD, título institucional, fecha y hora en vivo, período académico activo.
- **Fila de KPI mayores:** matrícula total, nuevo ingreso, egresados del año, ejecución presupuestaria, cumplimiento del POA institucional, satisfacción de usuarios. Cada uno con valor, meta, tendencia y semáforo.
- **Mapa de la República Dominicana:** la red territorial completa — sede, 4 recintos, 21 centros, 13 subcentros. Puntos dimensionados por matrícula y coloreados por semáforo. Es el mayor golpe visual del tablero.
- **Semáforo de Vicerrectorías:** cuatro tarjetas con porcentaje de cumplimiento agregado.
- **Rankings:** cinco unidades de mejor desempeño y cinco en alerta.
- **Feed de actividad institucional:** franja de eventos recientes que corre en vivo.

### 6.2 Vista de Nivel / Área

Al filtrar a una Vicerrectoría, Facultad o nivel: rejilla de sus unidades dependientes, cada una como tarjeta con semáforo, cumplimiento y minigráfico de tendencia.

### 6.3 Vista de Unidad

Los 20 indicadores de la unidad seleccionada, separados en Servicio y Proceso. Cada indicador presenta valor actual, meta POA, porcentaje de cumplimiento, semáforo, flecha de tendencia y minigráfico de 12 meses. Al hacer clic sobre un indicador se despliega su serie completa de 24 meses.

### 6.4 Vista Territorial

Mapa a pantalla completa junto a una tabla comparativa de Recintos, Centros y Subcentros, ordenable por cualquier indicador común.

### 6.5 Vista de Servicios

Construida sobre el catálogo **real** de Registro Universitario: servicios más solicitados, tiempo de emisión contra meta, recaudación por servicio en RD$, y carga de trabajo por ventanilla.

Esta vista cumple una función argumental específica: demuestra que el tablero se alimenta de datos que la UASD **ya produce hoy**, no de una aspiración.

### 6.6 Modo kiosco

Rotación automática cada 25 segundos en el ciclo: Portada → Territorial → Servicios → carrusel de Vicerrectorías → Portada. Barra de progreso discreta indica el avance.

La barra de filtros permanece oculta. Al mover el mouse o tocar la pantalla, la rotación se congela y la barra de filtros desciende con animación: el gesto natural de *pantalla viva → me acerco → tomo control*. Una tecla reanuda la rotación.

---

## 7. Identidad visual

Escudo oficial de la UASD y paleta institucional azul. Tipografía sobria de alta legibilidad a distancia. Contraste calibrado para lectura desde el otro extremo de una oficina.

> **Nota:** el uso del escudo institucional en el prototipo es para fines de demostración interna. Antes de cualquier difusión pública debe confirmarse la autorización de uso de marca.

---

## 8. Advertencia de datos simulados

Un distintivo discreto y permanente, **"DATOS SIMULADOS — DEMO"**, en una esquina de la pantalla, ocultable mediante una tecla.

Razón: el usuario sabe que la data es ficticia y así se lo comunicará al Rector, pero la pantalla quedará encendida en una oficina por la que pasan terceros. El distintivo evita que el tablero se confunda con un sistema en producción. La decisión de mostrarlo u ocultarlo durante la presentación queda en manos del usuario.

---

## 9. Stack técnico

- **React 18 + TypeScript + Vite** — arranque rápido, recarga en caliente durante los ajustes previos a la reunión
- **Tailwind CSS** — sistema de diseño consistente sin CSS disperso
- **Recharts** — gráficos de series, barras y minigráficos
- **Mapa de República Dominicana en SVG embebido** — sin dependencias de red en tiempo de ejecución
- Ejecución: `npm run dev`, luego `F11` para pantalla completa

Sin llamadas de red en tiempo de ejecución. Todos los recursos, incluidos el escudo y la geometría del mapa, se incorporan al paquete.

---

## 10. Organización del código

```
src/
  data/
    source.ts          Interfaz DataSource
    mock/
      unidades.ts      Árbol organizacional (~150 nodos)
      catalogo.ts      Definiciones de indicadores por unidad
      servicios.ts     Catálogo real de Registro
      generador.ts     Generación determinística de series
      anclas.ts        Cifras ancla — punto único de corrección
  state/
    filtros.ts         Estado de filtros y lógica de cascada
  components/
    filtros/           Barra de filtros, desplegables, chips
    kpi/               Tarjetas de KPI e indicador
    mapa/              Mapa de RD interactivo
    graficos/          Envoltorios de Recharts
  vistas/
    Rectoral.tsx
    Nivel.tsx
    Unidad.tsx
    Territorial.tsx
    Servicios.tsx
  kiosco/
    Rotador.tsx        Ciclo automático y detección de toma de control
```

Cada módulo tiene un propósito único y una interfaz definida. El generador de datos puede probarse de forma aislada verificando determinismo y distribución de semáforos; la lógica de filtros en cascada puede probarse sin renderizar nada.

---

## 11. Fuera de alcance del MVP

- Conexión con sistemas reales de la UASD
- Autenticación y perfiles de usuario
- Exportación a PDF o Excel
- Vistas guardadas o favoritos
- Alertas por correo o notificaciones
- Versión móvil o responsiva por debajo del ancho de escritorio
- Niveles 9 y 10 (Institutos y Servicios institucionales) con indicadores propios: se reservan sus posiciones en el árbol y en el filtro de Nivel, pero heredan el set común hasta que se levante su catálogo específico

---

## 12. Riesgos

| Riesgo | Mitigación |
|---|---|
| Una cifra ancla desactualizada resta credibilidad frente al Rector | Todas centralizadas en `anclas.ts`, validables y corregibles en minutos |
| Un tablero enteramente verde no se cree | Distribución calibrada a 70/20/10 con unidades en rojo estables y explicables |
| Falla de la demo en vivo por dependencia externa | Cero llamadas de red; todos los recursos empaquetados |
| El Rector clica una unidad sin datos y se ve el hueco | Las ~150 unidades del árbol tienen datos generados; no hay ramas vacías |
| Confusión entre demo y producción | Distintivo permanente de datos simulados |
