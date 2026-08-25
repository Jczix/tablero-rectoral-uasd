import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { ProveedorFiltros, useFiltros } from '../state/FiltrosContext'
import { Rotador } from './Rotador'

/** Sonda de prueba: expone el largo del historial en el DOM para que los
 * tests puedan comprobar que las paradas del kiosco no lo apilan. */
function SondaHistorial() {
  const { historial, despachar } = useFiltros()
  return (
    <>
      <span data-testid="historial-largo">{historial.length}</span>
      <button onClick={() => despachar({ tipo: 'estado', valor: 'rojo' })}>
        acción manual de prueba
      </button>
    </>
  )
}

const montar = () =>
  render(<ProveedorFiltros><Rotador /><SondaHistorial /></ProveedorFiltros>)

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

  // --- Corrección de hallazgos de revisión de la Tarea 14 ---

  it('la tecla K originada dentro de la barra de filtros no reanuda la rotación', () => {
    vi.useFakeTimers()
    montar()
    act(() => { fireEvent.mouseMove(window) })
    const dentroDeFiltros = screen.getByText('Área / Dependencia')
    act(() => { fireEvent.keyDown(dentroDeFiltros, { key: 'k' }) })
    // Sigue detenido: la barra de filtros sigue visible, no reapareció el
    // progressbar del kiosco.
    expect(screen.getByText('Área / Dependencia')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('la tecla K originada fuera de la barra de filtros sí reanuda la rotación', () => {
    vi.useFakeTimers()
    montar()
    act(() => { fireEvent.mouseMove(window) })
    act(() => { fireEvent.keyDown(document.body, { key: 'k' }) })
    expect(screen.queryByText('Área / Dependencia')).not.toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('muestra un aviso de modo manual al tomar el control, y lo oculta al reanudar', () => {
    vi.useFakeTimers()
    montar()
    expect(screen.queryByText(/modo manual/i)).not.toBeInTheDocument()
    act(() => { fireEvent.mouseMove(window) })
    expect(screen.getByText(/modo manual/i)).toBeInTheDocument()
    act(() => { fireEvent.keyDown(window, { key: 'k' }) })
    expect(screen.queryByText(/modo manual/i)).not.toBeInTheDocument()
  })

  it('reanuda la rotación sola tras 3 minutos de inactividad', () => {
    vi.useFakeTimers()
    montar()
    act(() => { fireEvent.mouseMove(window) })
    expect(screen.getByText('Área / Dependencia')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(3 * 60_000 + 1) })
    expect(screen.queryByText('Área / Dependencia')).not.toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('cada interacción reinicia el plazo de reanudación automática', () => {
    vi.useFakeTimers()
    montar()
    act(() => { fireEvent.mouseMove(window) })
    // A los 2:59 el Rector vuelve a mover el mouse: el plazo se reinicia.
    act(() => { vi.advanceTimersByTime(2 * 60_000 + 59_000) })
    act(() => { fireEvent.mouseMove(window) })
    act(() => { vi.advanceTimersByTime(2 * 60_000 + 59_000) })
    // Todavía dentro de los 3 minutos desde la última interacción.
    expect(screen.getByText('Área / Dependencia')).toBeInTheDocument()
  })

  it('reanudar con K cancela el temporizador de inactividad pendiente, sin saltos espontáneos', () => {
    vi.useFakeTimers()
    montar()
    // Se detiene, pasa un minuto (el temporizador de 3 minutos sigue
    // corriendo) y se reanuda con K.
    act(() => { fireEvent.mouseMove(window) })
    act(() => { vi.advanceTimersByTime(60_000) })
    act(() => { fireEvent.keyDown(window, { key: 'k' }) })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    // Se deja correr el reloj hasta justo pasado el instante en que
    // vencía el temporizador original (2 minutos más desde la
    // reanudación = 3 minutos desde la detención). Sin el arreglo, ese
    // temporizador huérfano dispara `reanudar()` de nuevo y el kiosco
    // salta solo de vuelta a la portada en mitad de una rotación ya en
    // marcha, sin que nadie haya interactuado.
    act(() => { vi.advanceTimersByTime(120_000 + 1) })
    expect(screen.getByRole('progressbar'))
      .toHaveAttribute('aria-label', 'Vista 5 de 7')
  })

  it('las paradas automáticas del kiosco no apilan historial', () => {
    vi.useFakeTimers()
    montar()
    act(() => { vi.advanceTimersByTime(25_000 * 3) })
    expect(screen.getByTestId('historial-largo')).toHaveTextContent('0')
  })

  it('la primera acción manual sí se apila en el historial', () => {
    vi.useFakeTimers()
    montar()
    act(() => { vi.advanceTimersByTime(25_000 * 2) })
    act(() => { fireEvent.mouseMove(window) })
    expect(screen.getByTestId('historial-largo')).toHaveTextContent('0')
    act(() => { fireEvent.click(screen.getByText('acción manual de prueba')) })
    expect(screen.getByTestId('historial-largo')).toHaveTextContent('1')
  })
})
