import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProveedorFiltros } from '../../state/FiltrosContext'
import { BarraFiltros } from './BarraFiltros'

const montar = () => {
  render(<ProveedorFiltros><BarraFiltros /></ProveedorFiltros>)
  return userEvent.setup()
}

/** Los desplegables se identifican por su etiqueta visible. */
const abrir = async (usuario: ReturnType<typeof userEvent.setup>, etiqueta: string) => {
  const grupo = screen.getByText(etiqueta).parentElement!
  await usuario.click(grupo.querySelector('button')!)
}

describe('BarraFiltros', () => {
  it('muestra los seis filtros', () => {
    montar()
    for (const e of ['Nivel', 'Área / Dependencia', 'Unidad',
                     'Período', 'Tipo de indicador', 'Estado']) {
      expect(screen.getByText(e)).toBeInTheDocument()
    }
  })

  it('al escoger el nivel Recintos, Unidad lista solo los cuatro recintos', async () => {
    const usuario = montar()
    await abrir(usuario, 'Nivel')
    await usuario.click(screen.getByRole('option', { name: 'Recintos' }))
    await abrir(usuario, 'Unidad')
    expect(screen.getAllByRole('option')).toHaveLength(5)   // Todas + 4 recintos
  })

  it('al escoger un nivel aparece su chip', async () => {
    const usuario = montar()
    await abrir(usuario, 'Nivel')
    await usuario.click(screen.getByRole('option', { name: 'Recintos' }))
    expect(screen.getByRole('button', { name: 'Recintos ✕' })).toBeInTheDocument()
  })

  it('Limpiar todo retira los chips', async () => {
    const usuario = montar()
    await abrir(usuario, 'Nivel')
    await usuario.click(screen.getByRole('option', { name: 'Recintos' }))
    await usuario.click(screen.getByRole('button', { name: 'Limpiar todo' }))
    expect(screen.queryByRole('button', { name: 'Recintos ✕' })).not.toBeInTheDocument()
  })

  it('Atrás deshace el último filtro', async () => {
    const usuario = montar()
    await abrir(usuario, 'Nivel')
    await usuario.click(screen.getByRole('option', { name: 'Recintos' }))
    await usuario.click(screen.getByRole('button', { name: '← Atrás' }))
    expect(screen.queryByRole('button', { name: 'Recintos ✕' })).not.toBeInTheDocument()
  })

  it('deshabilita Área cuando el nivel no tiene áreas intermedias', async () => {
    const usuario = montar()
    await abrir(usuario, 'Nivel')
    await usuario.click(screen.getByRole('option', { name: 'Recintos' }))
    const grupo = screen.getByText('Área / Dependencia').parentElement!
    expect(grupo.querySelector('button')).toBeDisabled()
  })
})
