import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { ProveedorFiltros } from '../state/FiltrosContext'
import { Rotador } from './Rotador'

const montar = () =>
  render(<ProveedorFiltros><Rotador /></ProveedorFiltros>)

describe('Rotador', () => {
  afterEach(() => vi.useRealTimers())

  it('arranca en la portada rectoral', () => {
    vi.useFakeTimers()
    montar()
    expect(screen.getByText('Matrícula total')).toBeInTheDocument()
  })

  it('oculta la barra de filtros mientras rota', () => {
    vi.useFakeTimers()
    montar()
    expect(screen.queryByText('Área / Dependencia')).not.toBeInTheDocument()
  })

  it('avanza a la vista siguiente al cumplirse el intervalo', () => {
    vi.useFakeTimers()
    montar()
    act(() => { vi.advanceTimersByTime(25_000) })
    expect(screen.getByRole('heading', { name: 'Red territorial' })).toBeInTheDocument()
  })

  it('muestra el avance del ciclo', () => {
    vi.useFakeTimers()
    montar()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('congela la rotación y revela los filtros al mover el mouse', () => {
    vi.useFakeTimers()
    montar()
    act(() => { fireEvent.mouseMove(window) })
    expect(screen.getByText('Área / Dependencia')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(60_000) })
    // Sigue en la portada: la rotación está detenida.
    expect(screen.getByText('Matrícula total')).toBeInTheDocument()
  })

  it('reanuda la rotación con la tecla K', () => {
    vi.useFakeTimers()
    montar()
    act(() => { fireEvent.mouseMove(window) })
    act(() => { fireEvent.keyDown(window, { key: 'k' }) })
    expect(screen.queryByText('Área / Dependencia')).not.toBeInTheDocument()
  })
})
