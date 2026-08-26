import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MedidorArco } from './MedidorArco'
import { COLOR } from './Semaforo'

describe('MedidorArco', () => {
  it('dibuja un semicírculo con el avance proporcional al cumplimiento', () => {
    const { container } = render(<MedidorArco cumplimiento={64.2} semaforo="ambar" />)
    const arco = container.querySelector('[data-avance]')!
    expect(arco.getAttribute('pathLength')).toBe('100')
    expect(arco.getAttribute('stroke-dasharray')).toBe('64.2 100')
  })

  it('colorea el avance según el semáforo', () => {
    const { container } = render(<MedidorArco cumplimiento={30} semaforo="rojo" />)
    expect(container.querySelector('[data-avance]')!.getAttribute('stroke')).toBe(COLOR.rojo)
  })

  it('acota el avance a [0, 100]: superar la meta llena el arco, no lo desborda', () => {
    const { container } = render(<MedidorArco cumplimiento={112} semaforo="verde" />)
    expect(container.querySelector('[data-avance]')!.getAttribute('stroke-dasharray'))
      .toBe('100 100')
  })

  it('es decorativo: la tarjeta ya dice valor, meta y cumplimiento en texto', () => {
    const { container } = render(<MedidorArco cumplimiento={50} semaforo="verde" />)
    expect((container.firstChild as HTMLElement).getAttribute('aria-hidden')).toBe('true')
  })
})
