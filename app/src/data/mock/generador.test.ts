import { describe, it, expect } from 'vitest'
import { generarSerie, clasificar } from './generador'
import { INDICADORES } from './catalogo'

describe('clasificar', () => {
  it('aplica los umbrales de semáforo', () => {
    expect(clasificar(120)).toBe('verde')
    expect(clasificar(95)).toBe('verde')
    expect(clasificar(94.9)).toBe('ambar')
    expect(clasificar(80)).toBe('ambar')
    expect(clasificar(79.9)).toBe('rojo')
  })
})

describe('generarSerie', () => {
  it('es determinística entre llamadas', () => {
    const a = generarSerie('dir-registro::servicio::1')
    const b = generarSerie('dir-registro::servicio::1')
    expect(a).toEqual(b)
  })

  it('devuelve 24 meses en orden cronológico', () => {
    const s = generarSerie('dir-registro::servicio::1')
    expect(s).toHaveLength(24)
    const periodos = s.map(p => p.periodo)
    expect([...periodos].sort()).toEqual(periodos)
    expect(periodos[0]).toMatch(/^\d{4}-\d{2}$/)
  })

  it('nunca produce valores negativos ni metas en cero', () => {
    for (const id of ['dir-registro::servicio::1', 'recinto-santiago::proceso::7',
                      'esc-medicina::servicio::3', 'vic-admin::proceso::10']) {
      for (const p of generarSerie(id)) {
        expect(p.valor, id).toBeGreaterThanOrEqual(0)
        expect(p.meta, id).toBeGreaterThan(0)
      }
    }
  })

  it('mantiene los porcentajes dentro de 0 a 100', () => {
    const pct = INDICADORES.filter(i => i.tipoMetrica === 'porcentaje').slice(0, 50)
    for (const i of pct) {
      for (const p of generarSerie(i.id)) {
        expect(p.valor, i.id).toBeLessThanOrEqual(100)
        expect(p.valor, i.id).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('calcula el cumplimiento invertido cuando menor es mejor', () => {
    const menor = INDICADORES.find(i => i.direccion === 'menor-mejor')!
    const p = generarSerie(menor.id).at(-1)!
    // Con menor-mejor, cumplir la meta significa estar por debajo de ella.
    const esperado = (p.meta / p.valor) * 100
    expect(p.cumplimiento).toBeCloseTo(esperado, 4)
  })

  it('reparte los semáforos del mes vigente en 70 / 20 / 10 con ±3 puntos', () => {
    const ultimos = INDICADORES.map(i => generarSerie(i.id).at(-1)!)
    const pct = (s: string) =>
      (ultimos.filter(p => p.semaforo === s).length / ultimos.length) * 100
    expect(pct('verde')).toBeGreaterThan(67)
    expect(pct('verde')).toBeLessThan(73)
    expect(pct('ambar')).toBeGreaterThan(17)
    expect(pct('ambar')).toBeLessThan(23)
    expect(pct('rojo')).toBeGreaterThan(7)
    expect(pct('rojo')).toBeLessThan(13)
  })

  it('escala la magnitud según el peso de la unidad', () => {
    // La Sede Central pesa mucho más que el subcentro de Pedernales.
    const sede = generarSerie('sede-central::servicio::1').at(-1)!.valor
    const pedernales = generarSerie('subcentro-pedernales::servicio::1').at(-1)!.valor
    expect(sede).toBeGreaterThan(pedernales * 10)
  })

  it('marca la tendencia comparando con el mes anterior', () => {
    const s = generarSerie('dir-registro::servicio::1')
    const [previo, ultimo] = [s.at(-2)!, s.at(-1)!]
    const delta = (ultimo.valor - previo.valor) / previo.valor
    const esperado = delta > 0.02 ? 'alza' : delta < -0.02 ? 'baja' : 'estable'
    expect(ultimo.tendencia).toBe(esperado)
  })

  it('no usa Math.random', async () => {
    const fuente = await import('node:fs/promises')
      .then(fs => fs.readFile('src/data/mock/generador.ts', 'utf8'))
    expect(fuente).not.toContain('Math.random')
    expect(fuente).not.toContain('Date.now')
  })
})
