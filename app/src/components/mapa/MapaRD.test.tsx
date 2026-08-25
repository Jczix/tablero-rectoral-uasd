import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProveedorFiltros, useFiltros } from '../../state/FiltrosContext'
import { MapaRD } from './MapaRD'

function Espia() {
  const { filtro } = useFiltros()
  return <div data-testid="espia">{filtro.unidadId ?? 'ninguna'}</div>
}

const montar = () => {
  render(<ProveedorFiltros><MapaRD /><Espia /></ProveedorFiltros>)
  return userEvent.setup()
}

describe('MapaRD', () => {
  it('dibuja un punto por cada unidad territorial', () => {
    montar()
    expect(screen.getAllByRole('button')).toHaveLength(1 + 4 + 18 + 12)
  })

  it('etiqueta cada punto con el nombre de su unidad', () => {
    montar()
    expect(screen.getByRole('button', { name: /Recinto Barahona/ })).toBeInTheDocument()
  })

  it('filtra el tablero al hacer clic en un punto', async () => {
    const usuario = montar()
    await usuario.click(screen.getByRole('button', { name: /Recinto Barahona/ }))
    expect(screen.getByTestId('espia')).toHaveTextContent('recinto-barahona')
  })

  it('dimensiona los puntos según la matrícula', () => {
    montar()
    const santiago = screen.getByRole('button', { name: /Recinto Santiago/ })
    const pedernales = screen.getByRole('button', { name: /Pedernales/ })
    const r = (el: HTMLElement) =>
      Number(el.querySelector('circle')!.getAttribute('r'))
    expect(r(santiago)).toBeGreaterThan(r(pedernales))
  })
})
