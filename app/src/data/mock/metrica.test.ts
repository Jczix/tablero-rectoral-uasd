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

  it('no pinta en pesos los indicadores que solo mencionan el presupuesto', () => {
    // Los tres salían como "RD$ x.x M" en la Dirección de Presupuesto porque
    // la clave 'presupuest' se comprobaba antes que las de porcentaje.
    expect(inferirMetrica('Modificaciones presupuestarias tramitadas').tipoMetrica)
      .toBe('conteo')
    expect(inferirMetrica('Satisfacción de usuarios presupuestarios').tipoMetrica)
      .toBe('porcentaje')
    expect(inferirMetrica('Cumplimiento del ciclo presupuestario').tipoMetrica)
      .toBe('porcentaje')
  })

  it('da prioridad al porcentaje sobre la moneda cuando el nombre trae ambos', () => {
    expect(inferirMetrica('Porcentaje de recaudación efectiva').tipoMetrica)
      .toBe('porcentaje')
  })
  it('reconoce el monto aunque haya palabras intercaladas (coincidencia por tokens)', () => {
    // La subcadena literal 'fondos gestionados' no lo atrapaba porque
    // "externos" se interpone, y es inequívocamente un monto.
    expect(inferirMetrica('Fondos externos gestionados').tipoMetrica).toBe('moneda')
    expect(inferirMetrica('Recursos propios gestionados').tipoMetrica).toBe('moneda')
    expect(inferirMetrica('Montos desembolsados a proyectos').tipoMetrica).toBe('moneda')
    expect(inferirMetrica('Desembolsos ejecutados').tipoMetrica).toBe('moneda')
  })

  it('la coincidencia por tokens es exacta: no arrastra plurales de otra palabra', () => {
    // "Ejecuciones presupuestarias" cuenta ejecuciones; "Ejecución
    // presupuestaria" es el monto. Sin token exacto, ambas caerían juntas.
    expect(inferirMetrica('Ejecuciones presupuestarias monitoreadas').tipoMetrica)
      .toBe('conteo')
    expect(inferirMetrica('Ejecución presupuestaria administrativa').tipoMetrica)
      .toBe('moneda')
    // Y el orden importa: hace falta la palabra de gestión después del recurso.
    expect(inferirMetrica('Gestión de fondos').tipoMetrica).toBe('conteo')
  })

  it('un nombre encabezado por un sustantivo contador es un conteo, no un monto', () => {
    expect(inferirMetrica('Registros de desembolsos verificados').tipoMetrica)
      .toBe('conteo')
    expect(inferirMetrica('Informes de montos ejecutados').tipoMetrica).toBe('conteo')
  })
})
