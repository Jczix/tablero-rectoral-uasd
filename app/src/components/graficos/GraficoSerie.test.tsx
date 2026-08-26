import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GraficoSerie } from './GraficoSerie'
import type { PuntoSerie } from '../../data/tipos'

// Recharts no dibuja dentro de ResponsiveContainer en jsdom (mide 0x0),
// así que se comprueba la ELECCIÓN de serie por su clase, no el SVG final.
const serie: PuntoSerie[] = [
  { indicadorId: 'x', periodo: '2026-07', valor: 10, meta: 12,
    cumplimiento: 83, semaforo: 'ambar', tendencia: 'alza' },
  { indicadorId: 'x', periodo: '2026-08', valor: 11, meta: 12,
    cumplimiento: 92, semaforo: 'ambar', tendencia: 'alza' },
]

describe('GraficoSerie — el tipo de gráfico sigue al tipo de dato', () => {
  it('los conteos y el dinero se dibujan como barras', () => {
    for (const tipo of ['conteo', 'moneda'] as const) {
      const { container, unmount } = render(
        <GraficoSerie serie={serie} tipoMetrica={tipo} />)
      expect(container.querySelector('[data-forma]')!
        .getAttribute('data-forma')).toBe('barras')
      unmount()
    }
  })

  it('los porcentajes y los días se dibujan como línea con área', () => {
    for (const tipo of ['porcentaje', 'dias'] as const) {
      const { container, unmount } = render(
        <GraficoSerie serie={serie} tipoMetrica={tipo} />)
      expect(container.querySelector('[data-forma]')!
        .getAttribute('data-forma')).toBe('area')
      unmount()
    }
  })

  it('el comparativo año contra año conserva las dos líneas', () => {
    const { container } = render(
      <GraficoSerie serie={serie} previa={serie} tipoMetrica="conteo" />)
    expect(container.querySelector('[data-forma]')!
      .getAttribute('data-forma')).toBe('comparativo')
  })
})
