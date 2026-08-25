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

  // --- Corrección de hallazgos de revisión de la Tarea 7 ---

  it('devuelve el foco al botón disparador al cerrar con Escape', async () => {
    const usuario = userEvent.setup()
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor={null} onCambio={() => {}} />)
    const boton = screen.getByRole('button')
    await usuario.click(boton)
    await usuario.keyboard('{Escape}')
    expect(boton).toHaveFocus()
  })

  it('devuelve el foco al botón disparador al escoger una opción', async () => {
    const usuario = userEvent.setup()
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor={null} onCambio={() => {}} />)
    const boton = screen.getByRole('button')
    await usuario.click(boton)
    await usuario.click(screen.getByRole('option', { name: 'Recinto Barahona' }))
    expect(boton).toHaveFocus()
  })

  it('devuelve el foco al botón disparador al hacer clic fuera', async () => {
    const usuario = userEvent.setup()
    render(
      <div>
        <Desplegable etiqueta="Unidad" opciones={opciones} valor={null} onCambio={() => {}} />
        <p>Fuera del desplegable</p>
      </div>,
    )
    const boton = screen.getByRole('button')
    await usuario.click(boton)
    await usuario.click(screen.getByText('Fuera del desplegable'))
    expect(boton).toHaveFocus()
  })

  it('navega las opciones con flechas y escoge con Enter', async () => {
    const onCambio = vi.fn()
    const usuario = userEvent.setup()
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor={null} onCambio={onCambio} />)
    await usuario.click(screen.getByRole('button'))
    // Todas (activa al abrir) -> Recinto Santiago -> Recinto Barahona
    await usuario.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(onCambio).toHaveBeenCalledWith('b')
  })

  it('marca la opción activa con aria-activedescendant al navegar con flechas', async () => {
    const usuario = userEvent.setup()
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor={null} onCambio={() => {}} />)
    await usuario.click(screen.getByRole('button'))
    await usuario.keyboard('{ArrowDown}')
    const lista = screen.getByRole('listbox')
    const activa = screen.getByRole('option', { name: 'Recinto Santiago' })
    expect(lista).toHaveAttribute('aria-activedescendant', activa.id)
  })

  it('cierra el panel cuando el foco sale del componente con Tab', async () => {
    const usuario = userEvent.setup()
    render(
      <div>
        <Desplegable etiqueta="Unidad" opciones={opciones} valor={null}
                     onCambio={() => {}} buscable />
        <button>Siguiente control</button>
      </div>,
    )
    await usuario.click(screen.getByRole('button', { name: 'Todas' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await usuario.tab()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Siguiente control' })).toHaveFocus()
  })

  it('limpia el texto de búsqueda al cerrar sin escoger', async () => {
    const usuario = userEvent.setup()
    render(<Desplegable etiqueta="Unidad" opciones={opciones} valor={null}
                        onCambio={() => {}} buscable />)
    const boton = screen.getByRole('button')
    await usuario.click(boton)
    await usuario.type(screen.getByPlaceholderText('Buscar…'), 'baraho')
    await usuario.keyboard('{Escape}')
    await usuario.click(boton)
    expect(screen.getByPlaceholderText('Buscar…')).toHaveValue('')
  })
})
