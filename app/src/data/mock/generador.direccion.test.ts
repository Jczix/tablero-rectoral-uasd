import { vi, describe, it, expect } from 'vitest'

// Hoy no existe ningún indicador porcentaje + menor-mejor en el catálogo
// real (nada lo ejercita), así que el bug —la rama de porcentaje ignoraba
// `direccion` al calcular `valor`, aunque el cumplimiento posterior sí la
// respetaba— no se detecta con datos reales: el semáforo saldría invertido
// en silencio. Se sustituye ./catalogo por varios indicadores sintéticos de
// ese tipo para poder observar el efecto sobre la distribución de semáforos,
// que es donde una inversión de dirección se nota (verde y rojo se
// intercambiarían).
const INDICADORES_TEST = vi.hoisted(() =>
  Array.from({ length: 300 }, (_, i) => ({
    id: `test-menor::porcentaje::${i + 1}`,
    unidadId: 'rectoria',
    nombre: `Porcentaje de quejas sin resolver ${i + 1}`,
    categoria: 'servicio' as const,
    tipoMetrica: 'porcentaje' as const,
    unidadMedida: '%',
    direccion: 'menor-mejor' as const,
  })))

vi.mock('./catalogo', () => ({ INDICADORES: INDICADORES_TEST }))

const { generarSerie } = await import('./generador')

describe('generarSerie — porcentaje con dirección menor-mejor', () => {
  it('mantiene valor, meta y cumplimiento consistentes con la dirección', () => {
    for (const ind of INDICADORES_TEST) {
      for (const p of generarSerie(ind.id)) {
        const esperado = (p.meta / Math.max(p.valor, 0.1)) * 100
        expect(p.cumplimiento).toBeCloseTo(esperado, 4)
        expect(p.valor).toBeGreaterThanOrEqual(0)
        expect(p.valor).toBeLessThanOrEqual(100)
      }
    }
  })

  it('no invierte el semáforo: la distribución sigue siendo 70/20/10 (±3) igual que mayor-mejor', () => {
    // Con el bug, un indicador "sorteado en banda verde" (cumplimiento
    // pensado como alto) generaba un valor que, al pasar por el cálculo
    // menor-mejor, resultaba en un cumplimiento bajo — la distribución
    // habría salido invertida (mayoría en rojo, no en verde).
    const ultimos = INDICADORES_TEST.map(i => generarSerie(i.id).at(-1)!)
    const n = ultimos.length
    const pct = (s: string) => (ultimos.filter(p => p.semaforo === s).length / n) * 100
    expect(pct('verde')).toBeGreaterThan(67)
    expect(pct('verde')).toBeLessThan(73)
    expect(pct('ambar')).toBeGreaterThan(17)
    expect(pct('ambar')).toBeLessThan(23)
    expect(pct('rojo')).toBeGreaterThan(7)
    expect(pct('rojo')).toBeLessThan(13)
  })
})
