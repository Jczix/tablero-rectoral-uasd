import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TarjetaIndicador } from './TarjetaIndicador'
import type { Indicador, PuntoSerie } from '../../data/tipos'

const indicador: Indicador = {
  id: 'x::servicio::1', unidadId: 'dir-registro',
  nombre: 'Récords oficiales emitidos', categoria: 'servicio',
  tipoMetrica: 'conteo', unidadMedida: '', direccion: 'mayor-mejor',
}
const punto: PuntoSerie = {
  indicadorId: 'x::servicio::1', periodo: '2026-08',
  valor: 4820, meta: 5000, cumplimiento: 96.4,
  semaforo: 'verde', tendencia: 'alza',
}

describe('TarjetaIndicador', () => {
  it('muestra nombre, valor formateado, meta y cumplimiento', () => {
    render(<TarjetaIndicador indicador={indicador} punto={punto} />)
    expect(screen.getByText('Récords oficiales emitidos')).toBeInTheDocument()
    expect(screen.getByText('4,820')).toBeInTheDocument()
    expect(screen.getByText('Meta 5,000')).toBeInTheDocument()
    expect(screen.getByText('96.4%')).toBeInTheDocument()
  })

  it('muestra el semáforo con su etiqueta accesible', () => {
    render(<TarjetaIndicador indicador={indicador} punto={punto} />)
    expect(screen.getByRole('img', { name: 'En meta' })).toBeInTheDocument()
  })

  it('indica la tendencia con una flecha etiquetada', () => {
    render(<TarjetaIndicador indicador={indicador} punto={punto} />)
    expect(screen.getByLabelText('Tendencia al alza')).toBeInTheDocument()
  })

  it('formatea los días con su unidad', () => {
    const dias: Indicador = { ...indicador, tipoMetrica: 'dias', direccion: 'menor-mejor' }
    render(<TarjetaIndicador indicador={dias} punto={{ ...punto, valor: 3.2 }} />)
    expect(screen.getByText('3.2 días')).toBeInTheDocument()
  })

  it('avisa al hacer clic cuando es clicable', async () => {
    const onClic = vi.fn()
    const usuario = userEvent.setup()
    render(<TarjetaIndicador indicador={indicador} punto={punto} onClic={onClic} />)
    await usuario.click(screen.getByRole('button'))
    expect(onClic).toHaveBeenCalledWith('x::servicio::1')
  })

  it('no es un botón cuando no es clicable', () => {
    render(<TarjetaIndicador indicador={indicador} punto={punto} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('TarjetaIndicador · barra contra la meta', () => {
  it('muestra una barra bullet con la meta marcada, no un sparkline', () => {
    const { container } = render(
      <TarjetaIndicador indicador={indicador} punto={punto} />)
    expect(container.querySelector('[data-valor]')).toBeTruthy()
    expect(container.querySelector('[data-meta]')).toBeTruthy()
    expect(container.querySelector('polyline')).toBeNull()
  })
})
