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
