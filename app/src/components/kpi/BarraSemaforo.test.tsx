import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BarraSemaforo } from './BarraSemaforo'

describe('BarraSemaforo', () => {
  it('dibuja tres segmentos con ancho proporcional al conteo', () => {
    const { container } = render(
      <BarraSemaforo porSemaforo={{ verde: 12, ambar: 5, rojo: 3 }} />)
    const segmentos = container.querySelectorAll('[data-segmento]')
    expect(segmentos).toHaveLength(3)
    const anchos = Array.from(segmentos).map(s => (s as HTMLElement).style.width)
    expect(anchos).toEqual(['60%', '25%', '15%'])
  })

  it('omite los segmentos con conteo cero en vez de dejar astillas', () => {
    const { container } = render(
      <BarraSemaforo porSemaforo={{ verde: 10, ambar: 0, rojo: 0 }} />)
    expect(container.querySelectorAll('[data-segmento]')).toHaveLength(1)
  })

  it('no dibuja nada cuando el total es cero', () => {
    const { container } = render(
      <BarraSemaforo porSemaforo={{ verde: 0, ambar: 0, rojo: 0 }} />)
    expect(container.firstChild).toBeNull()
  })

  it('es decorativa: el texto de la tarjeta ya dice el desglose', () => {
    const { container } = render(
      <BarraSemaforo porSemaforo={{ verde: 1, ambar: 1, rojo: 1 }} />)
    expect((container.firstChild as HTMLElement).getAttribute('aria-hidden')).toBe('true')
  })
})
