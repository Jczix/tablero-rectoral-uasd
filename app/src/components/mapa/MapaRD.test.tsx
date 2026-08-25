import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('distingue por tamaño entre los subcentros por al menos 1.5px, sin bajar de 7', () => {
    montar()
    const r = (el: HTMLElement) =>
      Number(el.querySelector('circle')!.getAttribute('r'))
    // Pedernales (0.10) es el subcentro de menor peso; Verón Punta Cana
    // (0.22) el de mayor peso. Una diferencia sub-pixel (como daba la
    // escala de raíz cuadrada anterior) es imperceptible en un televisor;
    // se exige una separación real de al menos 1.5px.
    const pedernales = screen.getByRole('button', { name: /Pedernales/ })
    const veron = screen.getByRole('button', { name: /Verón Punta Cana/ })
    expect(r(pedernales)).toBeGreaterThanOrEqual(7)
    expect(r(veron) - r(pedernales)).toBeGreaterThanOrEqual(1.5)
  })

  it('distingue por tamaño entre los centros por al menos 1.5px', () => {
    montar()
    const r = (el: HTMLElement) =>
      Number(el.querySelector('circle')!.getAttribute('r'))
    // Centro Santiago Rodríguez (0.4) es el centro de menor peso;
    // Centro Santo Domingo Este (2.2) el de mayor peso.
    const menor = screen.getByRole('button', { name: /Centro Santiago Rodríguez/ })
    const mayor = screen.getByRole('button', { name: /Centro Santo Domingo Este/ })
    expect(r(mayor) - r(menor)).toBeGreaterThanOrEqual(1.5)
  })

  it('mantiene la jerarquía visual: recintos > centros > subcentros', () => {
    montar()
    const r = (el: HTMLElement) =>
      Number(el.querySelector('circle')!.getAttribute('r'))
    const menorRecinto = r(screen.getByRole('button', { name: /Recinto San Juan/ }))
    const mayorCentro = r(screen.getByRole('button', { name: /Centro Santo Domingo Este/ }))
    const menorCentro = r(screen.getByRole('button', { name: /Centro Santiago Rodríguez/ }))
    const mayorSubcentro = r(screen.getByRole('button', { name: /Verón Punta Cana/ }))
    // Incluso el recinto más chico debe superar claramente al centro más
    // grande, y el centro más chico al subcentro más grande.
    expect(menorRecinto).toBeGreaterThan(mayorCentro)
    expect(menorCentro).toBeGreaterThan(mayorSubcentro)
  })

  it('activa un punto con Enter desde el teclado', async () => {
    montar()
    const barahona = screen.getByRole('button', { name: /Recinto Barahona/ })
    barahona.focus()
    fireEvent.keyDown(barahona, { key: 'Enter' })
    expect(screen.getByTestId('espia')).toHaveTextContent('recinto-barahona')
  })

  it('activa un punto con la barra espaciadora desde el teclado', async () => {
    montar()
    const barahona = screen.getByRole('button', { name: /Recinto Barahona/ })
    barahona.focus()
    fireEvent.keyDown(barahona, { key: ' ' })
    expect(screen.getByTestId('espia')).toHaveTextContent('recinto-barahona')
  })
})
