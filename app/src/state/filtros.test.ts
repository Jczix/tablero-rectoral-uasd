import { describe, it, expect } from 'vitest'
import { FILTRO_INICIAL, MAXIMO_HISTORIAL, reducir, chipsDe, type EstadoFiltros } from './filtros'

const inicial: EstadoFiltros = { actual: FILTRO_INICIAL, historial: [] }

describe('reducir', () => {
  it('parte sin ningún filtro aplicado', () => {
    expect(FILTRO_INICIAL).toEqual({
      nivel: null, areaId: null, unidadId: null,
      periodo: 'mes', categoria: 'todas', estado: 'todos',
    })
  })

  it('al cambiar el nivel, limpia área y unidad', () => {
    let e = reducir(inicial, { tipo: 'nivel', valor: 12 })
    e = reducir(e, { tipo: 'area', valor: 'fac-salud' })
    e = reducir(e, { tipo: 'unidad', valor: 'esc-medicina' })
    e = reducir(e, { tipo: 'nivel', valor: 6 })
    expect(e.actual.nivel).toBe(6)
    expect(e.actual.areaId).toBeNull()
    expect(e.actual.unidadId).toBeNull()
  })

  it('al cambiar el área, limpia la unidad pero conserva el nivel', () => {
    let e = reducir(inicial, { tipo: 'nivel', valor: 12 })
    e = reducir(e, { tipo: 'area', valor: 'fac-salud' })
    e = reducir(e, { tipo: 'unidad', valor: 'esc-medicina' })
    e = reducir(e, { tipo: 'area', valor: 'fac-ciencias' })
    expect(e.actual.nivel).toBe(12)
    expect(e.actual.areaId).toBe('fac-ciencias')
    expect(e.actual.unidadId).toBeNull()
  })

  it('no limpia nada al cambiar período, categoría o estado', () => {
    let e = reducir(inicial, { tipo: 'unidad', valor: 'dir-registro' })
    e = reducir(e, { tipo: 'periodo', valor: 'anio' })
    e = reducir(e, { tipo: 'categoria', valor: 'servicio' })
    e = reducir(e, { tipo: 'estado', valor: 'rojo' })
    expect(e.actual.unidadId).toBe('dir-registro')
    expect(e.actual.periodo).toBe('anio')
    expect(e.actual.categoria).toBe('servicio')
    expect(e.actual.estado).toBe('rojo')
  })

  it('seleccionar una escuela por clic rellena nivel y área hacia arriba', () => {
    const e = reducir(inicial, { tipo: 'seleccionarUnidad', valor: 'esc-medicina' })
    expect(e.actual.unidadId).toBe('esc-medicina')
    expect(e.actual.areaId).toBe('fac-salud')
    expect(e.actual.nivel).toBe(12)
  })

  it('seleccionar un recinto por clic no inventa área', () => {
    const e = reducir(inicial, { tipo: 'seleccionarUnidad', valor: 'recinto-barahona' })
    expect(e.actual.nivel).toBe(6)
    expect(e.actual.unidadId).toBe('recinto-barahona')
    expect(e.actual.areaId).toBeNull()
  })

  it('apila el historial en cada cambio', () => {
    let e = reducir(inicial, { tipo: 'nivel', valor: 6 })
    e = reducir(e, { tipo: 'unidad', valor: 'recinto-santiago' })
    expect(e.historial).toHaveLength(2)
  })

  it('atrás deshace el último cambio', () => {
    let e = reducir(inicial, { tipo: 'nivel', valor: 6 })
    e = reducir(e, { tipo: 'unidad', valor: 'recinto-santiago' })
    e = reducir(e, { tipo: 'atras' })
    expect(e.actual.unidadId).toBeNull()
    expect(e.actual.nivel).toBe(6)
    expect(e.historial).toHaveLength(1)
  })

  it('atrás sobre historial vacío no rompe nada', () => {
    expect(reducir(inicial, { tipo: 'atras' }).actual).toEqual(FILTRO_INICIAL)
  })

  it('limpiar todo devuelve al estado inicial y vacía el historial', () => {
    let e = reducir(inicial, { tipo: 'nivel', valor: 6 })
    e = reducir(e, { tipo: 'estado', valor: 'rojo' })
    e = reducir(e, { tipo: 'limpiar' })
    expect(e.actual).toEqual(FILTRO_INICIAL)
    expect(e.historial).toEqual([])
  })

  it('quitar un filtro también limpia los que dependen de él', () => {
    let e = reducir(inicial, { tipo: 'seleccionarUnidad', valor: 'esc-medicina' })
    e = reducir(e, { tipo: 'quitar', valor: 'area' })
    expect(e.actual.areaId).toBeNull()
    expect(e.actual.unidadId).toBeNull()
    expect(e.actual.nivel).toBe(12)
  })

  it('quitar el nivel también limpia área y unidad', () => {
    let e = reducir(inicial, { tipo: 'seleccionarUnidad', valor: 'esc-medicina' })
    e = reducir(e, { tipo: 'quitar', valor: 'nivel' })
    expect(e.actual.nivel).toBeNull()
    expect(e.actual.areaId).toBeNull()
    expect(e.actual.unidadId).toBeNull()
  })

  it('seleccionar una unidad inexistente no cambia el filtro ni apila historial', () => {
    const e = reducir(inicial, { tipo: 'seleccionarUnidad', valor: 'no-existe' })
    expect(e.actual).toEqual(FILTRO_INICIAL)
    expect(e.historial).toEqual([])
  })

  it('el área no acepta un id que no sea de facultad o vicerrectoría', () => {
    let e = reducir(inicial, { tipo: 'nivel', valor: 12 })
    e = reducir(e, { tipo: 'area', valor: 'fac-salud' })
    const antes = e.actual
    const historialAntes = e.historial.length
    e = reducir(e, { tipo: 'area', valor: 'recinto-santiago' })
    expect(e.actual).toEqual(antes)
    expect(e.historial).toHaveLength(historialAntes)
  })

  it('el área no acepta un id inexistente', () => {
    let e = reducir(inicial, { tipo: 'nivel', valor: 12 })
    e = reducir(e, { tipo: 'area', valor: 'fac-salud' })
    const antes = e.actual
    e = reducir(e, { tipo: 'area', valor: 'no-existe' })
    expect(e.actual).toEqual(antes)
  })

  it('la acción unidad normaliza nivel y área según la unidad recibida', () => {
    let e = reducir(inicial, { tipo: 'nivel', valor: 12 })
    e = reducir(e, { tipo: 'area', valor: 'fac-salud' })
    e = reducir(e, { tipo: 'unidad', valor: 'esc-medicina' })
    // esc-biologia cuelga de fac-ciencias, no de fac-salud: la cascada debe
    // recalcularse en vez de quedar en un estado incoherente.
    e = reducir(e, { tipo: 'unidad', valor: 'esc-biologia' })
    expect(e.actual.unidadId).toBe('esc-biologia')
    expect(e.actual.areaId).toBe('fac-ciencias')
    expect(e.actual.nivel).toBe(12)
  })

  it('la acción unidad con un id inexistente no cambia el filtro ni apila historial', () => {
    let e = reducir(inicial, { tipo: 'nivel', valor: 12 })
    e = reducir(e, { tipo: 'area', valor: 'fac-salud' })
    const antes = e.actual
    const historialAntes = e.historial.length
    e = reducir(e, { tipo: 'unidad', valor: 'no-existe' })
    expect(e.actual).toEqual(antes)
    expect(e.historial).toHaveLength(historialAntes)
  })

  it('el historial no crece más allá de las últimas entradas permitidas', () => {
    let e: EstadoFiltros = inicial
    for (let i = 0; i < MAXIMO_HISTORIAL + 10; i++) {
      e = reducir(e, { tipo: 'nivel', valor: i % 2 === 0 ? 6 : 7 })
    }
    expect(e.historial).toHaveLength(MAXIMO_HISTORIAL)
    const nivelAntesDeAtras = e.actual.nivel
    e = reducir(e, { tipo: 'atras' })
    expect(e.actual.nivel).not.toBe(nivelAntesDeAtras)
    expect(e.historial).toHaveLength(MAXIMO_HISTORIAL - 1)
  })
})

describe('chipsDe', () => {
  it('no produce chips sin filtros', () => {
    expect(chipsDe(FILTRO_INICIAL)).toEqual([])
  })

  it('produce un chip legible por cada filtro activo', () => {
    let e = reducir(inicial, { tipo: 'seleccionarUnidad', valor: 'recinto-barahona' })
    e = reducir(e, { tipo: 'estado', valor: 'rojo' })
    const etiquetas = chipsDe(e.actual).map(c => c.etiqueta)
    expect(etiquetas).toContain('Recintos')
    expect(etiquetas).toContain('Recinto Barahona')
    expect(etiquetas).toContain('Incumplido')
  })

  it('no produce chip para el período por defecto', () => {
    expect(chipsDe({ ...FILTRO_INICIAL, periodo: 'mes' })
      .find(c => c.clave === 'periodo')).toBeUndefined()
  })
})
