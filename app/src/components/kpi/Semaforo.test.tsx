import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Semaforo } from './Semaforo'

describe('Semaforo', () => {
  it('expone la etiqueta accesible según el estado', () => {
    render(<Semaforo estado="verde" />)
    expect(screen.getByRole('img', { name: 'En meta' })).toBeInTheDocument()
  })

  it('distingue los tres estados por forma, no solo por color', () => {
    const { container: verde } = render(<Semaforo estado="verde" />)
    const { container: ambar } = render(<Semaforo estado="ambar" />)
    const { container: rojo } = render(<Semaforo estado="rojo" />)

    // "En meta" es un círculo, "En riesgo" un triángulo, "Incumplido" un
    // cuadrado: formas distintas que se leen en escala de grises y con
    // daltonismo, no solo cambiando de color.
    expect(verde.querySelector('circle')).toBeTruthy()
    expect(verde.querySelector('polygon')).toBeNull()
    expect(verde.querySelector('rect')).toBeNull()

    expect(ambar.querySelector('polygon')).toBeTruthy()
    expect(ambar.querySelector('circle')).toBeNull()
    expect(ambar.querySelector('rect')).toBeNull()

    expect(rojo.querySelector('rect')).toBeTruthy()
    expect(rojo.querySelector('circle')).toBeNull()
    expect(rojo.querySelector('polygon')).toBeNull()
  })

  it('puede mostrar la etiqueta de texto cuando conEtiqueta es true', () => {
    render(<Semaforo estado="rojo" conEtiqueta />)
    expect(screen.getAllByText('Incumplido').length).toBeGreaterThan(0)
  })
})
