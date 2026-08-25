import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProveedorFiltros, useFiltros } from '../state/FiltrosContext'
import { Enrutador } from './Enrutador'
import type { Accion } from '../state/filtros'

function Disparador({ accion }: { accion: Accion }) {
  const { despachar } = useFiltros()
  return <button onClick={() => despachar(accion)}>disparar</button>
}

const montar = (accion: Accion) => {
  render(
    <ProveedorFiltros>
      <Disparador accion={accion} />
      <Enrutador />
    </ProveedorFiltros>
  )
  return userEvent.setup()
}

describe('Enrutador', () => {
  it('sin filtros muestra la portada rectoral', () => {
    montar({ tipo: 'limpiar' })
    expect(screen.getByText('Matrícula total')).toBeInTheDocument()
  })

  it('con un nivel escogido muestra la rejilla de unidades', async () => {
    const usuario = montar({ tipo: 'nivel', valor: 6 })
    await usuario.click(screen.getByText('disparar'))
    // El título lleva además un contador de unidades ("Recintos · 4
    // unidades"), añadido en la corrección de la Tarea 11 para que la
    // rejilla avise cuánto contenido hay aunque no quepa en pantalla.
    expect(screen.getByRole('heading', { name: /^Recintos/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Recinto Barahona/ })).toBeInTheDocument()
  })

  it('con una facultad muestra la rejilla de sus escuelas', async () => {
    const usuario = montar({ tipo: 'seleccionarUnidad', valor: 'fac-salud' })
    await usuario.click(screen.getByText('disparar'))
    expect(screen.getByRole('button', { name: /Escuela de Medicina/ })).toBeInTheDocument()
  })

  it('con una unidad hoja muestra sus veinte indicadores', async () => {
    const usuario = montar({ tipo: 'seleccionarUnidad', valor: 'esc-medicina' })
    await usuario.click(screen.getByText('disparar'))
    expect(screen.getByRole('heading', { name: 'Escuela de Medicina' })).toBeInTheDocument()
    expect(screen.getByText('Indicadores de Servicio')).toBeInTheDocument()
    expect(screen.getByText('Indicadores de Proceso')).toBeInTheDocument()
  })
})
