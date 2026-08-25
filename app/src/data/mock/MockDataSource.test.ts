import { describe, it, expect } from 'vitest'
import { mockDataSource as ds } from './MockDataSource'
import type { Filtro } from '../source'

const base: Filtro = {
  nivel: null, areaId: null, unidadId: null,
  periodo: 'mes', categoria: 'todas', estado: 'todos',
}

describe('MockDataSource', () => {
  it('expone los 12 niveles', () => {
    expect(ds.getNiveles()).toHaveLength(12)
  })

  it('con nivel Escuelas, las áreas son las nueve facultades', () => {
    const areas = ds.getAreas(12)
    expect(areas).toHaveLength(9)
    expect(areas.every(a => a.tipo === 'facultad')).toBe(true)
  })

  it('con nivel Recintos, las unidades son los cuatro recintos', () => {
    expect(ds.getUnidadesDe(6, null)).toHaveLength(4)
  })

  it('recorta las unidades al área escogida', () => {
    const u = ds.getUnidadesDe(12, 'fac-salud')
    expect(u).toHaveLength(8)
    expect(u.every(x => x.padreId === 'fac-salud')).toBe(true)
  })

  it('filtra los indicadores por categoría', () => {
    const ind = ds.getIndicadores('dir-registro', { ...base, categoria: 'servicio' })
    expect(ind).toHaveLength(10)
    expect(ind.every(i => i.categoria === 'servicio')).toBe(true)
  })

  it('filtra los indicadores por estado de semáforo', () => {
    const ind = ds.getIndicadores('dir-registro', { ...base, estado: 'rojo' })
    for (const i of ind) expect(ds.getUltimo(i.id)!.semaforo).toBe('rojo')
  })

  it('devuelve el último punto de la serie', () => {
    const serie = ds.getSerie('dir-registro::servicio::1')
    expect(ds.getUltimo('dir-registro::servicio::1')).toEqual(serie.at(-1))
  })

  it('resume el conjunto institucional completo sin filtros', () => {
    const r = ds.getResumen(base)
    expect(r.totalIndicadores).toBeGreaterThan(2500)
    expect(r.porSemaforo.verde + r.porSemaforo.ambar + r.porSemaforo.rojo)
      .toBe(r.totalIndicadores)
  })

  it('restringe el resumen a la unidad escogida', () => {
    expect(ds.getResumen({ ...base, unidadId: 'dir-registro' }).totalIndicadores).toBe(20)
  })

  it('incluye la descendencia al resumir un área', () => {
    // Facultad de Salud: 1 facultad + 8 escuelas = 9 unidades = 180 indicadores.
    expect(ds.getResumen({ ...base, unidadId: 'fac-salud' }).totalIndicadores).toBe(180)
  })

  it('entrega cinco mejores y cinco en alerta, ordenados', () => {
    const r = ds.getResumen(base)
    expect(r.mejores).toHaveLength(5)
    expect(r.enAlerta).toHaveLength(5)
    const c = r.mejores.map(f => f.cumplimiento)
    expect([...c].sort((a, b) => b - a)).toEqual(c)
    expect(r.mejores[0].cumplimiento).toBeGreaterThan(r.enAlerta[0].cumplimiento)
  })

  it('entrega la red territorial con minigráfico de doce puntos', () => {
    const t = ds.getTerritoriales()
    expect(t.length).toBe(1 + 4 + 18 + 12)   // sede + recintos + centros + subcentros
    expect(t[0].serie).toHaveLength(12)
    expect(t.every(f => f.unidad.coords)).toBe(true)
  })

  it('es estable entre llamadas', () => {
    expect(ds.getResumen(base)).toEqual(ds.getResumen(base))
  })
})
