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

  it('abrevia la moneda en millones y miles de millones', () => {
    expect(formatear(14_800_000_000, 'moneda')).toBe('RD$ 14.80 MM')
    expect(formatear(3_400_000, 'moneda')).toBe('RD$ 3.4 M')
    expect(formatear(52_000, 'moneda')).toBe('RD$ 52,000')
  })
})

describe('formatearCompacto', () => {
  it('abrevia los números grandes para las tarjetas de KPI', () => {
    expect(formatearCompacto(186000)).toBe('186 mil')
    expect(formatearCompacto(1_250_000)).toBe('1.3 M')
    expect(formatearCompacto(842)).toBe('842')
  })
})
