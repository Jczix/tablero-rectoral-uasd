import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { ProveedorFiltros, useFiltros } from '../state/FiltrosContext'
import { Nivel } from './Nivel'
import type { EstadoFiltro } from '../data/source'

function Fijar({ estado }: { estado?: EstadoFiltro }) {
  const { despachar } = useFiltros()
  useEffect(() => {
    despachar({ tipo: 'nivel', valor: 12 })
    if (estado) despachar({ tipo: 'estado', valor: estado })
    // Se dispara una sola vez al montar: fijar nivel y, si aplica, estado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

const montar = (estado?: EstadoFiltro) => render(
  <ProveedorFiltros>
    <Fijar estado={estado} />
    <Nivel />
  </ProveedorFiltros>
)

describe('Nivel — el filtro de Estado filtra unidades, no destruye su cálculo', () => {
  it('sin filtro de estado, cada escuela muestra su % en meta real', () => {
    montar()
    expect(screen.getByRole('button', { name: /Escuela de Música/ }))
      .toHaveTextContent('40.0%')
    expect(screen.getByRole('button', { name: /Escuela de Estadística/ }))
      .toHaveTextContent('95.0%')
  })

  it('con Estado = Incumplido, solo aparecen unidades en rojo, con el mismo % que sin filtro', () => {
    montar('rojo')
    // Escuela de Música es roja (40.0%, por debajo del umbral de 55): debe
    // aparecer, y con el MISMO porcentaje que sin filtro, no con 0.0%.
    const musica = screen.getByRole('button', { name: /Escuela de Música/ })
    expect(musica).toHaveTextContent('40.0%en meta')
    // Escuela de Estadística (verde, 95.0%) y de Comunicación Social (ámbar,
    // 70.0%) no están en rojo: no deben aparecer en absoluto.
    expect(screen.queryByRole('button', { name: /Escuela de Estadística/ }))
      .not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Escuela de Comunicación Social/ }))
      .not.toBeInTheDocument()
  })

  it('con Estado = En meta, no aparece ninguna unidad roja', () => {
    montar('verde')
    expect(screen.getByRole('button', { name: /Escuela de Estadística/ }))
      .toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Escuela de Música/ }))
      .not.toBeInTheDocument()
  })

  it('el título incluye un contador de unidades que refleja el filtro aplicado', () => {
    montar('rojo')
    // No se fija el número exacto (depende del catálogo generado), pero debe
    // decir cuántas unidades hay y coincidir con los botones renderizados.
    const botones = screen.getAllByRole('button')
    const heading = screen.getByRole('heading')
    expect(heading).toHaveTextContent(`${botones.length} unidades`)
  })
})
