import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProveedorFiltros, useFiltros } from '../state/FiltrosContext'
import { Territorial } from './Territorial'
import type { EstadoFiltro } from '../data/source'
import { useEffect } from 'react'

function FijarEstado({ estado }: { estado: EstadoFiltro }) {
  const { despachar } = useFiltros()
  useEffect(() => {
    despachar({ tipo: 'estado', valor: estado })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

const montarConEstado = (estado: EstadoFiltro) => {
  render(
    <ProveedorFiltros><FijarEstado estado={estado} /><Territorial /></ProveedorFiltros>
  )
  return userEvent.setup()
}

function Espia() {
  const { filtro } = useFiltros()
  return <div data-testid="espia">{filtro.unidadId ?? 'ninguna'}</div>
}

const montar = () => {
  render(<ProveedorFiltros><Territorial /><Espia /></ProveedorFiltros>)
  return userEvent.setup()
}

describe('Territorial', () => {
  it('incluye el mapa y la tabla comparativa', () => {
    montar()
    expect(screen.getByRole('group', { name: 'Red territorial de la UASD' }))
      .toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('lista una fila por unidad territorial', () => {
    montar()
    const cuerpo = within(screen.getByRole('table')).getAllByRole('row')
    expect(cuerpo).toHaveLength(1 + 1 + 4 + 18 + 12)   // encabezado + sede + red
  })

  it('agrupa por tipo con etiqueta legible', () => {
    montar()
    const tabla = within(screen.getByRole('table'))
    expect(tabla.getAllByText('Recinto').length).toBe(4)
    expect(tabla.getAllByText('Centro').length).toBe(18)
    expect(tabla.getAllByText('Subcentro').length).toBe(12)
  })

  it('ordena por cumplimiento al pulsar el encabezado de la columna', async () => {
    const usuario = montar()
    await usuario.click(screen.getByRole('button', { name: /% en meta/ }))
    const filas = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    const valores = filas.map(f =>
      Number(within(f).getAllByRole('cell')[3].textContent!.replace('%', '')))
    expect([...valores].sort((a, b) => b - a)).toEqual(valores)
  })

  it('filtra al hacer clic en una fila', async () => {
    const usuario = montar()
    await usuario.click(screen.getByRole('row', { name: /Recinto Barahona/ }))
    expect(screen.getByTestId('espia')).toHaveTextContent('recinto-barahona')
  })

  it('activa la fila con el teclado (Enter)', async () => {
    const usuario = montar()
    const fila = screen.getByRole('row', { name: /Recinto Barahona/ })
    fila.focus()
    await usuario.keyboard('{Enter}')
    expect(screen.getByTestId('espia')).toHaveTextContent('recinto-barahona')
  })

  it('resalta en la tabla la unidad seleccionada en el mapa', async () => {
    const usuario = montar()
    const botonMapa = screen.getByRole('button', { name: /Recinto Barahona/ })
    await usuario.click(botonMapa)
    const fila = screen.getByRole('row', { name: /Recinto Barahona/ })
    expect(fila).toHaveAttribute('aria-current', 'true')
  })

  it('anuncia con aria-sort qué columna y en qué sentido está ordenando', async () => {
    const usuario = montar()
    const tabla = within(screen.getByRole('table'))
    // Por defecto ordena por 'Unidad' (nombre), ascendente.
    expect(tabla.getByRole('columnheader', { name: /^Unidad/ }))
      .toHaveAttribute('aria-sort', 'ascending')
    expect(tabla.getByRole('columnheader', { name: /% en meta/ }))
      .not.toHaveAttribute('aria-sort')

    await usuario.click(screen.getByRole('button', { name: /% en meta/ }))

    expect(tabla.getByRole('columnheader', { name: /% en meta/ }))
      .toHaveAttribute('aria-sort', 'descending')
    expect(tabla.getByRole('columnheader', { name: /^Unidad/ }))
      .not.toHaveAttribute('aria-sort')
  })

  it('muestra una flecha visual junto al encabezado activo', async () => {
    const usuario = montar()
    expect(screen.getByRole('button', { name: /^Unidad/ }).textContent).toContain('▲')

    await usuario.click(screen.getByRole('button', { name: /% en meta/ }))
    expect(screen.getByRole('button', { name: /% en meta/ }).textContent).toContain('▼')
  })

  it('la fila anuncia la unidad y que se puede abrir su detalle', () => {
    montar()
    const fila = screen.getByRole('row', { name: /Recinto Barahona/ })
    expect(fila.getAttribute('aria-label')).toMatch(/Recinto Barahona/)
    expect(fila.getAttribute('aria-label')).toMatch(/detalle/i)
  })
  it('el filtro Estado recorta la tabla pero deja el mapa completo', () => {
    montarConEstado('ambar')
    // El mapa sigue dibujando las 35 unidades: un mapa con la mitad de los
    // puntos borrados no es un mapa filtrado, es un mapa roto.
    expect(screen.getAllByRole('button', { name: /estudiantes/ }))
      .toHaveLength(1 + 4 + 18 + 12)
    // La tabla, en cambio, solo lista las que están en riesgo.
    const filas = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    expect(filas.length).toBeGreaterThan(0)
    expect(filas.length).toBeLessThan(35)
    for (const f of filas)
      expect(within(f).getByText('En riesgo')).toBeInTheDocument()
  })

  it('cuando ninguna unidad territorial está en el estado escogido, lo explica', () => {
    // Con el mes vigente ninguna unidad territorial cae en rojo: antes se veía
    // el marco de la tabla con "· 0" y el cuerpo en blanco.
    montarConEstado('rojo')
    expect(screen.getByRole('heading', { name: /Unidades territoriales · 0/ }))
      .toBeInTheDocument()
    expect(screen.getByTestId('estado-vacio'))
      .toHaveTextContent('Ninguna unidad de la red territorial está en estado Incumplido.')
    // Y el mapa sigue completo aun con la tabla vacía.
    expect(screen.getAllByRole('button', { name: /estudiantes/ }))
      .toHaveLength(1 + 4 + 18 + 12)
  })

})
