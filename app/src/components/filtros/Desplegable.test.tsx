import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Desplegable } from './Desplegable'

const opciones = [
  { valor: 'a', texto: 'Recinto Santiago' },
  { valor: 'b', texto: 'Recinto Barahona' },
  { valor: 'c', texto: 'Recinto San Juan' },
]

describe('Desplegable', () => {
  it('muestra la etiqueta y el texto de la opción escogida', () => {
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor="b" onCambio={() => {}} />)
    expect(screen.getByText('Unidad')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('Recinto Barahona')
  })

  it('muestra "Todas" cuando no hay selección', () => {
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor={null} onCambio={() => {}} />)
    expect(screen.getByRole('button')).toHaveTextContent('Todas')
  })

  it('abre la lista al hacer clic y avisa la selección', async () => {
    const onCambio = vi.fn()
    const usuario = userEvent.setup()
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor={null} onCambio={onCambio} />)
    await usuario.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await usuario.click(screen.getByRole('option', { name: 'Recinto Barahona' }))
    expect(onCambio).toHaveBeenCalledWith('b')
  })

  it('incluye una opción para limpiar la selección', async () => {
    const onCambio = vi.fn()
    const usuario = userEvent.setup()
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor="a" onCambio={onCambio} />)
    await usuario.click(screen.getByRole('button'))
    await usuario.click(screen.getByRole('option', { name: 'Todas' }))
    expect(onCambio).toHaveBeenCalledWith(null)
  })

  it('filtra la lista con el buscador interno cuando es buscable', async () => {
    const usuario = userEvent.setup()
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor={null}
                        onCambio={() => {}} buscable />)
    await usuario.click(screen.getByRole('button'))
    await usuario.type(screen.getByPlaceholderText('Buscar…'), 'baraho')
    const textos = screen.getAllByRole('option').map(o => o.textContent)
    expect(textos).toEqual(['Todas', 'Recinto Barahona'])
  })

  it('ignora tildes al buscar', async () => {
    const usuario = userEvent.setup()
    render(<Desplegable etiqueta="Unidad"
      opciones={[{ valor: 'x', texto: 'Escuela de Bioanálisis' }]}
      valor={null} onCambio={() => {}} buscable />)
    await usuario.click(screen.getByRole('button'))
    await usuario.type(screen.getByPlaceholderText('Buscar…'), 'bioanalisis')
    expect(screen.getAllByRole('option')).toHaveLength(2)   // Todas + la coincidencia
  })

  it('se deshabilita cuando no hay opciones', () => {
    render(<Desplegable etiqueta="Área" opciones={[]} valor={null} onCambio={() => {}} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('cierra la lista con Escape', async () => {
    const usuario = userEvent.setup()
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor={null} onCambio={() => {}} />)
    await usuario.click(screen.getByRole('button'))
    await usuario.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
