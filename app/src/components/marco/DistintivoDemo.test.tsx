import { describe, it, expect } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { DistintivoDemo } from './DistintivoDemo'

describe('DistintivoDemo', () => {
  it('advierte que los datos son simulados', () => {
    render(<DistintivoDemo />)
    expect(screen.getByText('DATOS SIMULADOS — DEMO')).toBeInTheDocument()
  })

  it('no flota sobre el contenido: no usa posicionamiento fijo', () => {
    // Como `fixed bottom-4 right-4` se posaba encima de la cuarta entrada de
    // "Requieren atención" en la portada y del pie de "Carga por ventanilla"
    // en Servicios. Vive en la franja del encabezado, con carril propio.
    render(<DistintivoDemo />)
    const distintivo = screen.getByText('DATOS SIMULADOS — DEMO')
    expect(distintivo.className).not.toMatch(/fixed/)
    expect(distintivo.className).not.toMatch(/absolute/)
  })

  it('conserva el tamaño legible a distancia de televisor', () => {
    render(<DistintivoDemo />)
    expect(screen.getByText('DATOS SIMULADOS — DEMO').className)
      .toMatch(/text-base/)
  })

  it('se oculta con la tecla D', () => {
    render(<DistintivoDemo />)
    act(() => { fireEvent.keyDown(window, { key: 'd' }) })
    expect(screen.queryByText('DATOS SIMULADOS — DEMO')).not.toBeInTheDocument()
  })

  it('vuelve a aparecer al pulsar D de nuevo', () => {
    render(<DistintivoDemo />)
    act(() => { fireEvent.keyDown(window, { key: 'd' }) })
    act(() => { fireEvent.keyDown(window, { key: 'D' }) })
    expect(screen.getByText('DATOS SIMULADOS — DEMO')).toBeInTheDocument()
  })

  it('no se altera al pulsar D dentro de la barra de filtros (p. ej. buscando "Educación")', () => {
    render(
      <>
        <div data-barra-filtros>
          <input aria-label="buscador de filtros" />
        </div>
        <DistintivoDemo />
      </>
    )
    const buscador = screen.getByLabelText('buscador de filtros')
    act(() => { fireEvent.keyDown(buscador, { key: 'd' }) })
    expect(screen.getByText('DATOS SIMULADOS — DEMO')).toBeInTheDocument()
  })

  it('sí se alterna al pulsar D fuera de la barra de filtros', () => {
    render(
      <>
        <div data-barra-filtros>
          <input aria-label="buscador de filtros" />
        </div>
        <DistintivoDemo />
      </>
    )
    act(() => { fireEvent.keyDown(window, { key: 'd' }) })
    expect(screen.queryByText('DATOS SIMULADOS — DEMO')).not.toBeInTheDocument()
  })

  it('no se altera al pulsar D dentro de cualquier campo de texto', () => {
    render(
      <>
        <input aria-label="campo suelto" />
        <DistintivoDemo />
      </>
    )
    const campo = screen.getByLabelText('campo suelto')
    act(() => { fireEvent.keyDown(campo, { key: 'd' }) })
    expect(screen.getByText('DATOS SIMULADOS — DEMO')).toBeInTheDocument()
  })
})
