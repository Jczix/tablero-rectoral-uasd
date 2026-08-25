import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Minigrafico } from './Minigrafico'

describe('Minigrafico', () => {
  it('no renderiza nada con menos de dos puntos', () => {
    const { container: vacio } = render(<Minigrafico datos={[]} estado="verde" />)
    const { container: uno } = render(<Minigrafico datos={[5]} estado="verde" />)
    expect(vacio.querySelector('svg')).toBeNull()
    expect(uno.querySelector('svg')).toBeNull()
  })

  it('centra verticalmente una serie plana en vez de pegarla al fondo', () => {
    const { container } = render(<Minigrafico datos={[10, 10, 10]} estado="verde" />)
    const polyline = container.querySelector('polyline')
    expect(polyline).toBeTruthy()
    const puntos = polyline!.getAttribute('points')!.trim().split(' ')
    const ys = puntos.map((p) => Number(p.split(',')[1]))
    // Todas las "y" deben ser iguales y estar en el centro del viewBox
    // (0 a 30), no pegadas al borde inferior (28).
    expect(new Set(ys).size).toBe(1)
    expect(ys[0]).toBe(16)
  })
})
