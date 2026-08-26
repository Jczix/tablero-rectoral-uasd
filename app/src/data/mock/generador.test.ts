import { describe, it, expect, afterEach } from 'vitest'
import { generarSerie, clasificar, clasificarUnidad, porcentajeEnMeta } from './generador'
import type { Semaforo } from '../tipos'
import { INDICADORES } from './catalogo'
import { fijarAhora } from '../reloj'

describe('clasificar', () => {
  it('aplica los umbrales de semáforo', () => {
    expect(clasificar(120)).toBe('verde')
    expect(clasificar(95)).toBe('verde')
    expect(clasificar(94.9)).toBe('ambar')
    expect(clasificar(80)).toBe('ambar')
    expect(clasificar(79.9)).toBe('rojo')
  })
})

describe('porcentajeEnMeta', () => {
  const de = (verdes: number, total: number): Semaforo[] => [
    ...Array(verdes).fill('verde' as Semaforo),
    ...Array(total - verdes).fill('rojo' as Semaforo),
  ]

  it('una unidad con sus 20 indicadores en verde da 100', () => {
    expect(porcentajeEnMeta(de(20, 20))).toBe(100)
  })

  it('una unidad con 10 de 20 indicadores en verde da 50', () => {
    expect(porcentajeEnMeta(de(10, 20))).toBe(50)
  })

  it('una unidad sin indicadores da 0, no NaN', () => {
    expect(porcentajeEnMeta([])).toBe(0)
  })
})

describe('clasificarUnidad', () => {
  it('aplica los umbrales 75/55, distintos de los de `clasificar`', () => {
    expect(clasificarUnidad(75)).toBe('verde')
    expect(clasificarUnidad(74.9)).toBe('ambar')
    expect(clasificarUnidad(55)).toBe('ambar')
    expect(clasificarUnidad(54.9)).toBe('rojo')
  })
})

describe('generarSerie', () => {
  afterEach(() => fijarAhora(null))

  it('no recalcula un mes de calendario ya generado cuando el reloj avanza (regresión)', () => {
    // El bug: la deriva y el ruido se indexaban por posición dentro de la
    // ventana de 24 meses, no por mes de calendario. Al desplazarse la
    // ventana un mes, el mismo período pasaba de posición 23 a posición 22
    // y su valor cambiaba solo, aunque el mes ya "hubiera pasado".
    fijarAhora(new Date('2026-08-01T00:00:00Z'))
    const conAgosto = generarSerie('dir-registro::servicio::1')

    fijarAhora(new Date('2026-09-01T00:00:00Z'))
    const conSeptiembre = generarSerie('dir-registro::servicio::1')

    const porPeriodo = new Map(conSeptiembre.map(p => [p.periodo, p]))
    for (const p of conAgosto) {
      const otro = porPeriodo.get(p.periodo)
      if (!otro) continue // el período más antiguo sale de la ventana de septiembre
      expect(otro.valor, p.periodo).toBe(p.valor)
      expect(otro.meta, p.periodo).toBe(p.meta)
      expect(otro.cumplimiento, p.periodo).toBeCloseTo(p.cumplimiento, 9)
      expect(otro.semaforo, p.periodo).toBe(p.semaforo)
    }
    // Verificación de que la superposición no está vacía (si lo estuviera,
    // el test anterior pasaría trivialmente sin comprobar nada).
    expect(porPeriodo.size).toBeGreaterThan(0)
    expect(conAgosto.some(p => porPeriodo.has(p.periodo))).toBe(true)
  })

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

  it('un mismo indicador cambia de semáforo a lo largo de sus 24 meses', () => {
    // El defecto de fondo del Período: la banda se sorteaba una vez por
    // indicador y ninguna banda cruzaba los umbrales de `clasificar` (verde
    // 96–118, ámbar 82–94, rojo 58–78, contra umbrales en 95 y 80), así que
    // el semáforo quedaba determinado por la banda y no por el mes.
    // Promediar 3, 6 o 12 puntos no podía sacarlo de ahí, y Trimestre,
    // Semestre, Año y Comparativo daban exactamente la misma portada.
    const variables = INDICADORES.filter(i => {
      const distintos = new Set(generarSerie(i.id).map(p => p.semaforo))
      return distintos.size > 1
    }).length
    // Con las bandas cruzando los umbrales y dispersión mensual, la mayoría
    // de los indicadores pasa por más de un semáforo en dos años.
    expect(variables / INDICADORES.length).toBeGreaterThan(0.5)
  })

  it('el promedio de una ventana puede dar un semáforo distinto al del último mes', () => {
    // Es la consecuencia que hace que el filtro de Período signifique algo.
    const media = (s: { cumplimiento: number }[]) =>
      s.reduce((a, p) => a + p.cumplimiento, 0) / s.length
    const distintos = INDICADORES.filter(i => {
      const s = generarSerie(i.id)
      return clasificar(media(s.slice(-12))) !== s.at(-1)!.semaforo
    }).length
    expect(distintos).toBeGreaterThan(300)
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
