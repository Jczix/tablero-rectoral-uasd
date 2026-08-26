import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnilloCumplimiento } from './AnilloCumplimiento'
import { COLOR } from './Semaforo'

describe('AnilloCumplimiento', () => {
  it('dibuja el arco proporcional al porcentaje sobre una pista completa', () => {
    const { container } = render(
      <AnilloCumplimiento porcentaje={72.3} semaforo="ambar" />)
    const arco = container.querySelector('[data-arco]')!
    // pathLength=100 normaliza la circunferencia: el dasharray es el % directo.
    expect(arco.getAttribute('pathLength')).toBe('100')
    expect(arco.getAttribute('stroke-dasharray')).toBe('72.3 100')
  })

  it('muestra el porcentaje en el centro con su rótulo', () => {
    render(<AnilloCumplimiento porcentaje={72.3} semaforo="verde" etiqueta="en meta" />)
    expect(screen.getByText('72.3%')).toBeInTheDocument()
    expect(screen.getByText('en meta')).toBeInTheDocument()
  })

  it('colorea el arco según el semáforo', () => {
    const { container } = render(
      <AnilloCumplimiento porcentaje={40} semaforo="rojo" />)
    expect(container.querySelector('[data-arco]')!.getAttribute('stroke')).toBe(COLOR.rojo)
  })

  it('acota el arco a [0, 100] aunque el dato se salga', () => {
    const { container } = render(
      <AnilloCumplimiento porcentaje={130} semaforo="verde" />)
    expect(container.querySelector('[data-arco]')!.getAttribute('stroke-dasharray'))
      .toBe('100 100')
  })
})
