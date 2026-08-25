import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProveedorFiltros, useFiltros } from '../state/FiltrosContext'
import { Unidad } from './Unidad'

function Fijar({ unidadId }: { unidadId: string }) {
  const { filtro, despachar } = useFiltros()
  if (filtro.unidadId !== unidadId)
    despachar({ tipo: 'seleccionarUnidad', valor: unidadId })
  return null
}

const montar = (unidadId: string) => {
  render(
    <ProveedorFiltros>
      <Fijar unidadId={unidadId} />
      <Unidad />
    </ProveedorFiltros>
  )
  return userEvent.setup()
}

describe('Unidad', () => {
  it('muestra los diez indicadores de servicio y los diez de proceso', () => {
    montar('dir-registro')
    // Cada indicador es un botón; más ninguno fuera de la rejilla.
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(20)
    expect(screen.getByText('Récords oficiales emitidos')).toBeInTheDocument()
    expect(screen.getByText('Tiempo promedio de emisión de récord oficial'))
      .toBeInTheDocument()
  })

  it('muestra la ruta jerárquica de la unidad', () => {
    montar('esc-medicina')
    expect(screen.getByText(/Rectoría/)).toBeInTheDocument()
    expect(screen.getByText(/Facultad de Ciencias de la Salud/)).toBeInTheDocument()
  })

  it('abre la serie completa al hacer clic en un indicador', async () => {
    const usuario = montar('dir-registro')
    await usuario.click(screen.getByText('Récords oficiales emitidos'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/24 meses/)).toBeInTheDocument()
  })

  it('cierra la serie con el botón de cerrar', async () => {
    const usuario = montar('dir-registro')
    await usuario.click(screen.getByText('Récords oficiales emitidos'))
    await usuario.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
