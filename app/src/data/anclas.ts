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
  // METAS de los tres KPI con semáforo de la portada. Sin ellas, esos tres
  // porcentajes se clasificaban con `clasificar()` (95/80), que está
  // calibrada para CUMPLIMIENTO CONTRA META, no para porcentajes crudos: la
  // fila superior del tablero salía entera en rojo y ámbar, y desde la
  // puerta de la oficina se leía "la universidad está en rojo", que es
  // falso. Ahora cada uno se clasifica contra su propia meta.
  // PENDIENTE DE VALIDACIÓN con la UASD, igual que el resto de las anclas.
  /** Ejecución ACUMULADA A LA FECHA esperada, no la del cierre anual: a
   *  finales de agosto (dos tercios del ejercicio) una ejecución del 80%
   *  es el ritmo normal de una institución que no subejecuta. */
  metaEjecucionPresupuestariaPct: 80,
  /** Meta institucional de cumplimiento del POA. */
  metaCumplimientoPoaPct: 85,
  /** Meta de satisfacción de usuarios: se fija más alta que las otras dos
   *  a propósito, porque es la promesa de servicio a la comunidad
   *  universitaria y el tablero no debe declararla cumplida a la ligera. */
  metaSatisfaccionGeneralPct: 90,
  facultades: 9,
  escuelas: 52,
  recintos: 4,
  centros: 18,
  subcentros: 12,
} as const
