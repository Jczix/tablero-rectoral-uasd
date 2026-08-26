import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BarraBala } from './BarraBala'

describe('BarraBala', () => {
  it('dibuja el valor como barra proporcional a la meta', () => {
    const { container } = render(<BarraBala valor={4000} meta={5000} semaforo="ambar" />)
    const barra = container.querySelector('[data-valor]') as HTMLElement
    expect(barra.style.width).toBe('80%')
    expect(barra.style.backgroundColor).toBeTruthy()
  })

  it('colorea la barra según el semáforo del punto', () => {
    const { container } = render(<BarraBala valor={4000} meta={5000} semaforo="rojo" />)
    const barra = container.querySelector('[data-valor]') as HTMLElement
    expect(barra.style.backgroundColor).toBe('rgb(210, 75, 62)') // COLOR.rojo #D24B3E
  })

  it('marca la meta con un tic en su posición', () => {
    const { container } = render(<BarraBala valor={4000} meta={5000} semaforo="verde" />)
    const tic = container.querySelector('[data-meta]') as HTMLElement
    expect(tic).toBeTruthy()
    expect(tic.style.left).toBe('100%')
  })

  it('reescala cuando el valor supera la meta, sin desbordar', () => {
    const { container } = render(<BarraBala valor={6000} meta={5000} semaforo="verde" />)
    const barra = container.querySelector('[data-valor]') as HTMLElement
    const tic = container.querySelector('[data-meta]') as HTMLElement
    expect(barra.style.width).toBe('100%')
    // La meta queda al 5000/6000 ≈ 83.3% para que se vea que se superó.
    expect(parseFloat(tic.style.left)).toBeCloseTo(83.3, 1)
  })

  it('no dibuja nada con meta y valor no positivos', () => {
    const { container } = render(<BarraBala valor={0} meta={0} semaforo="rojo" />)
    expect(container.firstChild).toBeNull()
  })

  it('es decorativa: la tarjeta ya dice valor, meta y cumplimiento', () => {
    const { container } = render(<BarraBala valor={1} meta={2} semaforo="verde" />)
    expect((container.firstChild as HTMLElement).getAttribute('aria-hidden')).toBe('true')
  })
})
