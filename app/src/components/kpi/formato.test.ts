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

  it('expresa la moneda en millones, con "M" = millones y sin usar nunca "MM"', () => {
    // El presupuesto institucional son 14,800 MILLONES de pesos. Con la
    // notación anterior ("RD$ 14.80 MM") la portada anunciaba 14.8 millones,
    // mil veces menos, porque en convención dominicana MM = millones.
    expect(formatear(14_800_000_000, 'moneda')).toBe('RD$ 14,800 M')
    expect(formatear(3_400_000, 'moneda')).toBe('RD$ 3.4 M')
    expect(formatear(52_000, 'moneda')).toBe('RD$ 52,000')
  })

  it('nunca emite la abreviatura ambigua "MM"', () => {
    for (const v of [1e6, 3.4e6, 999_999_999, 1e9, 14.8e9, 1e12])
      expect(formatear(v, 'moneda')).not.toContain('MM')
  })

  it('deja de usar decimales por encima de mil millones', () => {
    // A partir de 1,000 millones el decimal no aporta y estorba en pantalla:
    // se redondea a millones enteros con separador de miles.
    expect(formatear(999_999_999, 'moneda')).toBe('RD$ 1,000 M')
    expect(formatear(1_000_000_000, 'moneda')).toBe('RD$ 1,000 M')
    // Justo por debajo del punto de redondeo: conserva el decimal.
    expect(formatear(999_949_999, 'moneda')).toBe('RD$ 999.9 M')
    // Borde de la frontera miles/M (1e6), sin el bug de redondeo doble.
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
