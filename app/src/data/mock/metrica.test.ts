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
