import { describe, it, expect } from 'vitest'
import { formatear, formatearCompacto } from './formato'

describe('formatear', () => {
  it('agrupa los conteos con separador de miles', () => {
    expect(formatear(186000, 'conteo')).toBe('186,000')
    expect(formatear(7, 'conteo')).toBe('7')
  })

  it('añade el signo de porcentaje con un decimal', () => {
    expect(formatear(84.62, 'porcentaje')).toBe('84.6%')
    expect(formatear(100, 'porcentaje')).toBe('100.0%')
  })

  it('expresa los días con un decimal y su unidad', () => {
    expect(formatear(4.25, 'dias')).toBe('4.3 días')
    expect(formatear(1, 'dias')).toBe('1.0 días')
  })

  it('no confunde una demora mínima con ausencia de demora', () => {
    expect(formatear(0.04, 'dias')).toBe('< 0.1 días')
    expect(formatear(0, 'dias')).toBe('0.0 días')
  })

  it('abrevia la moneda en millones y miles de millones', () => {
    expect(formatear(14_800_000_000, 'moneda')).toBe('RD$ 14.80 MM')
    expect(formatear(3_400_000, 'moneda')).toBe('RD$ 3.4 M')
    expect(formatear(52_000, 'moneda')).toBe('RD$ 52,000')
  })

  it('no anuncia mil millones cuando el valor redondea justo al límite', () => {
    // Bordes de la frontera M/MM (1e9): el valor real está bajo mil
    // millones, pero al redondear a un decimal de millones cae en 1000.0,
    // así que debe subir de unidad en vez de mostrar "1000.0 M".
    expect(formatear(999_999_999, 'moneda')).toBe('RD$ 1.00 MM')
    expect(formatear(1_000_000_000, 'moneda')).toBe('RD$ 1.00 MM')
    // Justo por debajo del punto de redondeo: no debe subir de unidad.
    expect(formatear(999_949_999, 'moneda')).toBe('RD$ 999.9 M')
    // Bordes de la frontera miles/M (1e6), sin el bug de redondeo doble.
    expect(formatear(999_999, 'moneda')).toBe('RD$ 999,999')
    expect(formatear(1_000_000, 'moneda')).toBe('RD$ 1.0 M')
  })
})

describe('formatearCompacto', () => {
  it('abrevia los números grandes para las tarjetas de KPI', () => {
    expect(formatearCompacto(186000)).toBe('186 mil')
    expect(formatearCompacto(1_250_000)).toBe('1.3 M')
    expect(formatearCompacto(842)).toBe('842')
  })

  it('no anuncia mil "mil" cuando el valor redondea justo al límite', () => {
    // Frontera mil/M (1e6): 999,999 y 999,500 redondean a 1000 al dividir
    // entre mil, así que deben subir a notación de millones en vez de
    // mostrar "1000 mil".
    expect(formatearCompacto(999_999)).toBe('1.0 M')
    expect(formatearCompacto(999_500)).toBe('1.0 M')
    expect(formatearCompacto(1_000_000)).toBe('1.0 M')
  })
})
