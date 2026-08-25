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
    // Se compara la LISTA completa, no solo el primer elemento: el feed
    // ahora ordena de más reciente a más antiguo (corrección de la Tarea
    // 10), así que el puesto 0 es el evento con el desfase más pequeño
    // dentro de la ventana de 6 horas, y no cambia garantizadamente en
    // cada tic de 5s. El conjunto de 6 eventos sí se desplaza siempre
    // (entra uno nuevo, sale el más antiguo), así que la lista completa es
    // la comparación robusta.
    vi.useFakeTimers()
    fijarAhora(new Date('2026-08-25T14:30:00Z'))
    render(<FeedActividad />)
    const antes = screen.getAllByRole('listitem').map(i => i.textContent)
    act(() => { vi.advanceTimersByTime(6000) })
    const despues = screen.getAllByRole('listitem').map(i => i.textContent)
    expect(despues).not.toEqual(antes)
  })

  it('ordena los eventos de más reciente a más antiguo', () => {
    fijarAhora(new Date('2026-08-25T14:30:00Z'))
    render(<FeedActividad />)
    const horas = screen.getAllByRole('listitem').map(i => {
      const [, hh, mm] = i.textContent!.match(/(\d{2}):(\d{2})/)!
      return Number(hh) * 60 + Number(mm)
    })
    const ordenadas = [...horas].sort((a, b) => b - a)
    expect(horas).toEqual(ordenadas)
  })
})
