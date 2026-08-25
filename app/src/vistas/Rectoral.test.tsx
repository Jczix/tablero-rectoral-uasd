import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProveedorFiltros, useFiltros } from '../state/FiltrosContext'
import { Rectoral } from './Rectoral'
import { fijarAhora } from '../data/reloj'

function Espia() {
  const { filtro } = useFiltros()
  return <div data-testid="espia">{filtro.unidadId ?? 'ninguna'}</div>
}

const montar = () => {
  render(<ProveedorFiltros><Rectoral /><Espia /></ProveedorFiltros>)
  return userEvent.setup()
}

describe('Rectoral', () => {
  afterEach(() => fijarAhora(null))

  it('muestra los seis KPI mayores', () => {
    montar()
    for (const t of ['Matrícula total', 'Nuevo ingreso', 'Egresados del año',
                     'Ejecución presupuestaria', 'Cumplimiento POA',
                     'Satisfacción de usuarios']) {
      expect(screen.getByText(t)).toBeInTheDocument()
    }
  })

  it('ancla la matrícula total a la cifra institucional', () => {
    montar()
    expect(screen.getByText('186 mil')).toBeInTheDocument()
  })

  it('muestra una tarjeta por cada vicerrectoría', () => {
    montar()
    for (const v of ['Vicerrectoría Docente', 'Vicerrectoría Administrativa',
                     'Vicerrectoría de Investigación y Postgrado',
                     'Vicerrectoría de Extensión']) {
      expect(screen.getByRole('button', { name: new RegExp(v) })).toBeInTheDocument()
    }
  })

  it('al hacer clic en una vicerrectoría filtra a esa unidad', async () => {
    const usuario = montar()
    await usuario.click(
      screen.getByRole('button', { name: /Vicerrectoría de Extensión/ }))
    expect(screen.getByTestId('espia')).toHaveTextContent('vic-extension')
  })

  it('muestra los rankings de mejores y en alerta', () => {
    montar()
    expect(screen.getByText('Mejor desempeño')).toBeInTheDocument()
    expect(screen.getByText('Requieren atención')).toBeInTheDocument()
  })

  it('incluye el mapa territorial', () => {
    montar()
    expect(screen.getByRole('group', { name: 'Red territorial de la UASD' }))
      .toBeInTheDocument()
  })
})
