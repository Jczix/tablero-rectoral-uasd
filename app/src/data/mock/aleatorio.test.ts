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
