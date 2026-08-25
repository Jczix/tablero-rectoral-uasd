import { describe, it, expect } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { DistintivoDemo } from './DistintivoDemo'

describe('DistintivoDemo', () => {
  it('advierte que los datos son simulados', () => {
    render(<DistintivoDemo />)
    expect(screen.getByText('DATOS SIMULADOS — DEMO')).toBeInTheDocument()
  })

  it('se oculta con la tecla D', () => {
    render(<DistintivoDemo />)
    act(() => { fireEvent.keyDown(window, { key: 'd' }) })
    expect(screen.queryByText('DATOS SIMULADOS — DEMO')).not.toBeInTheDocument()
  })

  it('vuelve a aparecer al pulsar D de nuevo', () => {
    render(<DistintivoDemo />)
    act(() => { fireEvent.keyDown(window, { key: 'd' }) })
    act(() => { fireEvent.keyDown(window, { key: 'D' }) })
    expect(screen.getByText('DATOS SIMULADOS — DEMO')).toBeInTheDocument()
  })
})
