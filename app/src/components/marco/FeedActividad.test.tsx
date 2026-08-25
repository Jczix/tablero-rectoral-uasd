import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { FeedActividad } from './FeedActividad'
import { fijarAhora } from '../../data/reloj'

describe('FeedActividad', () => {
  afterEach(() => { fijarAhora(null); vi.useRealTimers() })

  it('muestra eventos con nombre de unidad y hora', () => {
    fijarAhora(new Date('2026-08-25T14:30:00Z'))
    render(<FeedActividad />)
    const items = screen.getAllByRole('listitem')
    expect(items.length).toBeGreaterThanOrEqual(6)
    expect(items[0].textContent).toMatch(/\d{2}:\d{2}/)
  })

  it('es determinístico con la misma hora fijada', () => {
    fijarAhora(new Date('2026-08-25T14:30:00Z'))
    const { unmount } = render(<FeedActividad />)
    const primero = screen.getAllByRole('listitem').map(i => i.textContent)
    unmount()
    render(<FeedActividad />)
    expect(screen.getAllByRole('listitem').map(i => i.textContent)).toEqual(primero)
  })

  it('incorpora un evento nuevo al cabo del intervalo', () => {
    vi.useFakeTimers()
    fijarAhora(new Date('2026-08-25T14:30:00Z'))
    render(<FeedActividad />)
    const antes = screen.getAllByRole('listitem')[0].textContent
    act(() => { vi.advanceTimersByTime(6000) })
    expect(screen.getAllByRole('listitem')[0].textContent).not.toBe(antes)
  })
})
