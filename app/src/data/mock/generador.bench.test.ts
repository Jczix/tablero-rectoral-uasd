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
