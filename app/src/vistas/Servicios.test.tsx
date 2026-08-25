import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { useEffect } from 'react'
import { ProveedorFiltros, useFiltros } from '../state/FiltrosContext'
import { Servicios } from './Servicios'
import type { EstadoFiltro } from '../data/source'

const montar = () =>
  render(<ProveedorFiltros><Servicios /></ProveedorFiltros>)

function FijarEstado({ estado }: { estado: EstadoFiltro }) {
  const { despachar } = useFiltros()
  useEffect(() => {
    despachar({ tipo: 'estado', valor: estado })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

const montarConEstado = (estado: EstadoFiltro) =>
  render(
    <ProveedorFiltros><FijarEstado estado={estado} /><Servicios /></ProveedorFiltros>
  )

describe('Servicios', () => {
  it('titula la vista con la unidad real de origen', () => {
    montar()
    expect(screen.getByRole('heading', { name: /Registro Universitario/ }))
      .toBeInTheDocument()
  })

  it('advierte qué parte del dato es real', () => {
    montar()
    expect(screen.getByText(/Catálogo, costos y ventanillas: datos reales/))
      .toBeInTheDocument()
  })

  it('lista los servicios con su costo real', () => {
    montar()
    const tabla = within(screen.getByRole('table'))
    expect(tabla.getByText('Investiduras')).toBeInTheDocument()
    expect(tabla.getByText('RD$ 1,855')).toBeInTheDocument()
  })

  it('ordena los servicios por recaudación de mayor a menor', () => {
    montar()
    const filas = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    const montos = filas.map(f => {
      const t = within(f).getAllByRole('cell')[4].textContent!
      return Number(t.replace(/[^0-9.]/g, ''))
    })
    expect(montos[0]).toBeGreaterThanOrEqual(montos[montos.length - 1])
  })

  it('muestra la carga por ventanilla', () => {
    montar()
    expect(screen.getByText('Carga por ventanilla')).toBeInTheDocument()
    expect(screen.getByText('Ventanilla 5')).toBeInTheDocument()
  })

  it('marca los servicios que se envían al MESCYT', () => {
    montar()
    const tabla = within(screen.getByRole('table'))
    // 'Lista de Graduados' es uno de los servicios reales marcados para
    // envío al MESCYT en la matriz institucional.
    expect(tabla.getByLabelText('Lista de Graduados: se envía al MESCYT'))
      .toBeInTheDocument()
    // 'Récord de Notas Oficial' no está marcado: no debe llevar la marca.
    expect(tabla.queryByLabelText('Récord de Notas Oficial: se envía al MESCYT'))
      .not.toBeInTheDocument()
  })
  it('el filtro Estado recorta el catálogo listado', () => {
    montar()
    const todas = within(screen.getByRole('table')).getAllByRole('row').length - 1

    screen.getByRole('table')   // guarda: la tabla existe sin filtro
    montarConEstado('rojo')
    const tablas = screen.getAllByRole('table')
    const filas = within(tablas[tablas.length - 1]).getAllByRole('row').length - 1
    expect(filas).toBeGreaterThan(0)
    expect(filas).toBeLessThan(todas)
  })

})
