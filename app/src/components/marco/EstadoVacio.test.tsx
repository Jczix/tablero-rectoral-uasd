import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EstadoVacio } from './EstadoVacio'

describe('EstadoVacio', () => {
  it('nombra el filtro responsable y concuerda el género del sustantivo', () => {
    render(<EstadoVacio que="unidad" ambito="este nivel" estado="rojo" categoria="todas" />)
    expect(screen.getByTestId('estado-vacio'))
      .toHaveTextContent('Ninguna unidad de este nivel está en estado Incumplido.')
    expect(screen.getByTestId('estado-vacio'))
      .toHaveTextContent('Cambia el filtro Estado para ver las demás unidades.')
  })

  it('funciona igual para indicadores y para servicios', () => {
    const { unmount } = render(
      <EstadoVacio que="indicador" ambito="esta unidad" estado="verde" categoria="todas" />)
    expect(screen.getByTestId('estado-vacio'))
      .toHaveTextContent('Ningún indicador de esta unidad está en estado En meta.')
    unmount()

    render(<EstadoVacio que="servicio" ambito="este catálogo" estado="ambar" categoria="todas" />)
    expect(screen.getByTestId('estado-vacio'))
      .toHaveTextContent('Ningún servicio de este catálogo está en estado En riesgo.')
    expect(screen.getByTestId('estado-vacio'))
      .toHaveTextContent('Cambia el filtro Estado para ver los demás servicios.')
  })

  it('menciona la categoría cuando también la hay filtrada', () => {
    render(
      <EstadoVacio que="indicador" ambito="esta unidad" estado="rojo" categoria="proceso" />)
    expect(screen.getByTestId('estado-vacio'))
      .toHaveTextContent('Ningún indicador de proceso de esta unidad está en estado Incumplido.')
  })

  it('explica también el vacío que no viene del filtro de Estado', () => {
    render(
      <EstadoVacio que="unidad" ambito="esta dependencia" estado="todos" categoria="servicio" />)
    expect(screen.getByTestId('estado-vacio'))
      .toHaveTextContent('No hay unidades de servicio que mostrar en esta dependencia.')
  })

  it('va en tamaño legible desde el otro lado de la oficina', () => {
    render(<EstadoVacio que="unidad" ambito="este nivel" estado="rojo" categoria="todas" />)
    const [mensaje] = screen.getByTestId('estado-vacio').querySelectorAll('p')
    expect(mensaje.className).toMatch(/text-2xl/)
  })
})
