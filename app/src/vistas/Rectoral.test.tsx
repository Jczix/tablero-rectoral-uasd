import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProveedorFiltros, useFiltros } from '../state/FiltrosContext'
import { Rectoral } from './Rectoral'
import { fijarAhora } from '../data/reloj'

function Espia() {
  const { filtro } = useFiltros()
  return <div data-testid="espia">{filtro.unidadId ?? 'ninguna'}</div>
}

const montar = () => {
  render(<ProveedorFiltros><Rectoral /><Espia /></ProveedorFiltros>)
  return userEvent.setup()
}

describe('Rectoral', () => {
  afterEach(() => fijarAhora(null))

  it('muestra los seis KPI mayores', () => {
    montar()
    for (const t of ['Matrícula total', 'Nuevo ingreso', 'Egresados del año',
                     'Ejecución presupuestaria', 'Cumplimiento POA',
                     'Satisfacción de usuarios']) {
      expect(screen.getByText(t)).toBeInTheDocument()
    }
  })

  it('ancla la matrícula total a la cifra institucional', () => {
    montar()
    expect(screen.getByText('186 mil')).toBeInTheDocument()
  })

  it('muestra una tarjeta por cada vicerrectoría', () => {
    montar()
    for (const v of ['Vicerrectoría Docente', 'Vicerrectoría Administrativa',
                     'Vicerrectoría de Investigación y Postgrado',
                     'Vicerrectoría de Extensión']) {
      expect(screen.getByRole('button', { name: new RegExp(v) })).toBeInTheDocument()
    }
  })

  it('al hacer clic en una vicerrectoría filtra a esa unidad', async () => {
    const usuario = montar()
    await usuario.click(
      screen.getByRole('button', { name: /Vicerrectoría de Extensión/ }))
    expect(screen.getByTestId('espia')).toHaveTextContent('vic-extension')
  })

  it('clasifica los KPI institucionales contra su meta, no contra 95/80', () => {
    montar()
    // Con `clasificar()` aplicada al porcentaje crudo, la fila superior salía
    // entera en rojo y ámbar: ejecución 78.4% "Incumplido", POA 84.6% y
    // satisfacción 82.1% "En riesgo". Desde la puerta se leía "la
    // universidad está en rojo", que es falso.
    const estadoDe = (titulo: string) => {
      const tarjeta = screen.getByText(titulo).closest('div')!.parentElement!
      return within(tarjeta).getByRole('img').getAttribute('aria-label')
    }
    expect(estadoDe('Ejecución presupuestaria')).toBe('En meta')
    expect(estadoDe('Cumplimiento POA')).toBe('En meta')
    // Satisfacción sigue en ámbar contra su meta de 90%: el arreglo no es
    // pintarlo todo de verde, es medir contra la referencia correcta.
    expect(estadoDe('Satisfacción de usuarios')).toBe('En riesgo')
  })

  it('cada KPI con semáforo declara su meta, para que el color se pueda explicar', () => {
    fijarAhora(new Date('2026-08-25T14:30:00Z'))
    montar()
    // La meta de ejecución es ACUMULADA A LA FECHA, y el rótulo lo dice con
    // el mes que marca el reloj: "meta 80%" a secas se leía como meta de
    // cierre anual, y un 80% anual sería subejecutar.
    expect(screen.getByText(/meta acumulada a agosto 80%/)).toBeInTheDocument()
    expect(screen.getByText(/meta 85%/)).toBeInTheDocument()
    expect(screen.getByText(/meta 90%/)).toBeInTheDocument()
  })

  it('el rótulo de la meta acumulada sigue al reloj, no fija agosto', () => {
    fijarAhora(new Date('2026-11-10T14:30:00Z'))
    montar()
    expect(screen.getByText(/meta acumulada a noviembre 80%/)).toBeInTheDocument()
  })

  it('anuncia el presupuesto en millones, sin la abreviatura ambigua MM', () => {
    montar()
    expect(screen.getByText(/RD\$ 14,800 M/)).toBeInTheDocument()
  })

  it('muestra los rankings de mejores y en alerta', () => {
    montar()
    expect(screen.getByText('Mejor desempeño')).toBeInTheDocument()
    expect(screen.getByText('Requieren atención')).toBeInTheDocument()
  })

  it('incluye el mapa territorial', () => {
    montar()
    expect(screen.getByRole('group', { name: 'Red territorial de la UASD' }))
      .toBeInTheDocument()
  })

  // --- Corrección de hallazgos de revisión: la portada no cabía en 1080px ---
  //
  // jsdom no calcula layout CSS real (no hay box model, ni flex ni grid): no
  // puede medir un `scrollHeight` de verdad, así que esta prueba no puede
  // repetir la medición pixel a pixel. Esa medición se hizo en un navegador
  // real a 1920×1080 (ver la sección de corrección del informe de la Tarea
  // 10): antes, scrollHeight daba 1236px contra 1080 disponibles y los tres
  // últimos puestos de cada ranking quedaban fuera de pantalla; después de
  // este cambio, scrollHeight da exactamente 1080, sin desplazamiento, y
  // ningún contenedor interno (mapa, feed, rankings) queda recortado.
  //
  // Lo que SÍ puede fijar esta prueba, y por lo que es una guarda real
  // contra la regresión, son los tres cambios estructurales que hicieron
  // posible ese resultado: el contenedor raíz no crece sin límite
  // (`overflow-hidden`), y los rankings y el feed muestran una cantidad
  // acotada de elementos en vez de la que quepa.
  it('el contenedor raíz no crece sin límite: overflow-hidden ancla la portada a su contenedor', () => {
    montar()
    expect(screen.getByTestId('portada-rectoral')).toHaveClass('overflow-hidden')
  })

  it('cada ranking muestra cuatro puestos, no cinco, para caber en 1080px de alto', () => {
    montar()
    const mejores = within(screen.getByTestId('Mejor desempeño')).getAllByRole('listitem')
    const enAlerta = within(screen.getByTestId('Requieren atención')).getAllByRole('listitem')
    expect(mejores).toHaveLength(4)
    expect(enAlerta).toHaveLength(4)
  })

  it('el feed muestra seis eventos, no ocho, para caber en 1080px de alto', () => {
    fijarAhora(new Date('2026-08-25T14:30:00Z'))
    montar()
    const eventos = within(screen.getByTestId('feed-actividad')).getAllByRole('listitem')
    expect(eventos).toHaveLength(6)
  })
})

describe('Rectoral — las vicerrectorías llevan anillo, no barra apilada', () => {
  it('cada tarjeta de vicerrectoría dibuja su dona y ninguna un segmento apilado', () => {
    const { container } = render(<ProveedorFiltros><Rectoral /></ProveedorFiltros>)
    expect(container.querySelectorAll('[data-arco]').length).toBe(4)
    expect(container.querySelector('[data-segmento]')).toBeNull()
  })
})
