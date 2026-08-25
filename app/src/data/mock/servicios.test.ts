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
