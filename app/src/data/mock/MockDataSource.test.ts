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

  // --- Corrección de hallazgos de revisión ---

  it('getAreas no mezcla las direcciones de los niveles 3, 4 y 5', () => {
    // Los tres niveles comparten tipo 'direccion', pero cuelgan de padres
    // distintos: derivar el área por tipo (bug original) los mezclaba a todos
    // bajo la misma unión de padres.
    expect(ds.getAreas(1).map(u => u.id)).toEqual(['rectoria'])
    expect(ds.getAreas(2).every(u => u.tipo === 'vicerrectoria')).toBe(true)

    const areas3 = ds.getAreas(3)
    expect(areas3.map(u => u.id).sort()).toEqual(['rectoria', 'vic-admin', 'vic-docente'].sort())

    const areas4 = ds.getAreas(4)
    expect(areas4).toHaveLength(1)
    expect(areas4[0].id).toBe('vic-invpos')

    const areas5 = ds.getAreas(5)
    expect(areas5).toHaveLength(1)
    expect(areas5[0].id).toBe('vic-extension')
  })

  it('las filas de getResumen respetan la categoría del filtro, no solo el agregado', () => {
    // invpos-9 tiene 3 indicadores en rojo de categoría 'servicio' y 1 de 'proceso':
    // si la fila ignorara el filtro, ambos casos darían el mismo indicadoresEnRojo.
    const conServicio = ds.getResumen({ ...base, unidadId: 'invpos-9', categoria: 'servicio' })
    const conProceso = ds.getResumen({ ...base, unidadId: 'invpos-9', categoria: 'proceso' })
    expect(conServicio.mejores[0].indicadoresEnRojo).toBe(3)
    expect(conProceso.mejores[0].indicadoresEnRojo).toBe(1)
  })

  it('mejores y enAlerta nunca se solapan, incluso con alcances pequeños', () => {
    // Facultad de Salud: 9 unidades (1 facultad + 8 escuelas).
    const facSalud = ds.getResumen({ ...base, unidadId: 'fac-salud' })
    const idsSalud = new Set(facSalud.mejores.map(f => f.unidad.id))
    expect(facSalud.enAlerta.every(f => !idsSalud.has(f.unidad.id))).toBe(true)
    expect(facSalud.mejores.length + facSalud.enAlerta.length).toBe(9)

    // Facultad de Ciencias Jurídicas: 3 unidades (1 facultad + 2 escuelas).
    const facJuridicas = ds.getResumen({ ...base, unidadId: 'fac-juridicas' })
    const idsJuridicas = new Set(facJuridicas.mejores.map(f => f.unidad.id))
    expect(facJuridicas.enAlerta.every(f => !idsJuridicas.has(f.unidad.id))).toBe(true)
    expect(facJuridicas.mejores.length + facJuridicas.enAlerta.length).toBe(3)

    // Una unidad sin descendencia: solo cabe en "mejores"; no hay alerta que mostrar.
    const dirRegistro = ds.getResumen({ ...base, unidadId: 'dir-registro' })
    expect(dirRegistro.mejores).toHaveLength(1)
    expect(dirRegistro.enAlerta).toHaveLength(0)
  })
})
