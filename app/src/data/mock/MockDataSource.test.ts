import { describe, it, expect } from 'vitest'
import { mockDataSource as ds } from './MockDataSource'
import type { Filtro } from '../source'
import { NIVELES } from './unidades'

const base: Filtro = {
  nivel: null, areaId: null, unidadId: null,
  periodo: 'mes', categoria: 'todas', estado: 'todos',
}

describe('MockDataSource', () => {
  it('expone solo los niveles que tienen al menos una unidad', () => {
    const niveles = ds.getNiveles()
    // Los 12 del árbol menos los dos reservados sin catálogo todavía.
    expect(niveles).toHaveLength(10)
    const ids = niveles.map(n => n.id)
    expect(ids).not.toContain(9)    // Institutos y centros especializados
    expect(ids).not.toContain(10)   // Servicios institucionales
    // La regla es general, no una lista fija: cada nivel ofrecido tiene
    // unidades de verdad, así que ninguno lleva a una pantalla vacía.
    for (const n of niveles)
      expect(ds.getUnidadesDe(n.id, null).length, n.nombre).toBeGreaterThan(0)
  })

  it('los niveles reservados siguen declarados en el árbol', () => {
    // Excluirlos del desplegable no es borrarlos: el documento de diseño los
    // contempla y deben reaparecer solos cuando se les levante el catálogo.
    expect(NIVELES.map(n => n.id)).toContain(9)
    expect(NIVELES.map(n => n.id)).toContain(10)
    expect(NIVELES).toHaveLength(12)
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
    const t = ds.getTerritoriales(base)
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
    // invpos-9 tiene 2 indicadores en rojo de categoría 'servicio' y 1 de 'proceso'
    // (cifras del catálogo determinista vigente): si la fila ignorara el
    // filtro, ambos casos darían el mismo indicadoresEnRojo.
    const conServicio = ds.getResumen({ ...base, unidadId: 'invpos-9', categoria: 'servicio' })
    const conProceso = ds.getResumen({ ...base, unidadId: 'invpos-9', categoria: 'proceso' })
    expect(conServicio.mejores[0].indicadoresEnRojo).toBe(2)
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
  // --- Oleada final: el filtro Estado, el Período y la coherencia mapa/rankings ---

  it('el conteo de indicadores del resumen refleja el filtro de Estado', () => {
    const todos = ds.getResumen(base)
    const rojo = ds.getResumen({ ...base, estado: 'rojo' })
    // Antes el agregado ignoraba `estado` y la portada quedaba idéntica,
    // incluidos los "3,160 indicadores" del KPI de POA.
    expect(rojo.totalIndicadores).toBeLessThan(todos.totalIndicadores)
    expect(rojo.totalIndicadores).toBe(todos.porSemaforo.rojo)
    expect(rojo.porSemaforo.verde).toBe(0)
    expect(rojo.porSemaforo.ambar).toBe(0)
  })

  it('los rankings se recortan al estado escogido, conservando el % real de cada unidad', () => {
    const rojo = ds.getResumen({ ...base, estado: 'rojo' })
    expect(rojo.mejores.length).toBeGreaterThan(0)
    for (const f of [...rojo.mejores, ...rojo.enAlerta])
      expect(f.semaforo, f.unidad.nombre).toBe('rojo')

    // El % en meta de una unidad no se calcula sobre el subconjunto ya
    // filtrado (eso daría 0.0% por construcción): es el mismo que sin filtro.
    const todos = ds.getFilas(base)
    const porId = new Map(todos.map(f => [f.unidad.id, f.cumplimiento]))
    for (const f of rojo.mejores)
      expect(f.cumplimiento).toBe(porId.get(f.unidad.id))
  })

  it('cambiar el período cambia las cifras del resumen', () => {
    const mes = ds.getResumen(base)
    const trimestre = ds.getResumen({ ...base, periodo: 'trimestre' })
    const anio = ds.getResumen({ ...base, periodo: 'anio' })
    // Promediar 3 o 12 meses no puede dar exactamente el mismo reparto de
    // semáforos que un único mes suelto sobre 3,160 indicadores.
    expect(trimestre.porSemaforo).not.toEqual(mes.porSemaforo)
    expect(anio.porSemaforo).not.toEqual(mes.porSemaforo)
    expect(anio.cumplimiento).not.toBe(mes.cumplimiento)
  })

  it('cambiar el período cambia el % en meta de las unidades', () => {
    const de = (periodo: Filtro['periodo']) =>
      ds.getFilas({ ...base, nivel: 12, periodo })
        .map(f => `${f.unidad.id}:${f.cumplimiento}`)
    const mes = de('mes')
    // Las 52 escuelas no pueden dar exactamente el mismo % en meta
    // promediando 3, 6 o 12 meses que mirando un único mes suelto.
    for (const p of ['trimestre', 'semestre', 'anio'] as const)
      expect(de(p), p).not.toEqual(mes)
    // Y al menos una unidad concreta cambia de cifra de forma visible.
    const distintas = de('anio').filter((v, i) => v !== mes[i])
    expect(distintas.length).toBeGreaterThan(5)
  })

  it("'Mes actual' no altera ninguna cifra respecto al último punto de la serie", () => {
    // Garantía de que implementar el período de verdad no movió el
    // comportamiento por defecto del tablero.
    const fila = ds.getFilas({ ...base, unidadId: 'dir-registro' })[0]
    const ind = ds.getIndicadores('dir-registro', base)
    const verdes = ind.filter(i => ds.getUltimo(i.id)!.semaforo === 'verde').length
    expect(fila.cumplimiento).toBeCloseTo((verdes / ind.length) * 100, 10)
  })

  it("'comparativo' entrega dos ventanas de doce meses superpuestas", () => {
    const id = 'dir-registro::servicio::1'
    const completa = ds.getSerie(id)
    const c = ds.getSeriePeriodo(id, { ...base, periodo: 'comparativo' })
    expect(c.serie).toHaveLength(12)
    expect(c.previa).toHaveLength(12)
    expect(c.serie).toEqual(completa.slice(-12))
    expect(c.previa).toEqual(completa.slice(0, 12))
  })

  it('el diálogo recorta la serie a la ventana del período', () => {
    const id = 'dir-registro::servicio::1'
    expect(ds.getSeriePeriodo(id, base).serie).toHaveLength(24)
    expect(ds.getSeriePeriodo(id, { ...base, periodo: 'trimestre' }).serie).toHaveLength(3)
    expect(ds.getSeriePeriodo(id, { ...base, periodo: 'semestre' }).serie).toHaveLength(6)
    expect(ds.getSeriePeriodo(id, { ...base, periodo: 'anio' }).serie).toHaveLength(12)
  })

  it('el mapa y los rankings dan la misma cifra para la misma unidad bajo el mismo filtro', () => {
    // Con `getTerritoriales()` sin filtro, la portada mostraba a la vez
    // "Verón Punta Cana 40.0% en meta" en el ranking y "55.0%" en el mapa.
    for (const f of [
      { ...base, categoria: 'proceso' as const },
      { ...base, categoria: 'servicio' as const },
      { ...base, periodo: 'trimestre' as const },
    ]) {
      const territoriales = new Map(
        ds.getTerritoriales(f).map(x => [x.unidad.id, x.cumplimiento]))
      for (const x of ds.getFilas(f)) {
        if (!territoriales.has(x.unidad.id)) continue
        expect(territoriales.get(x.unidad.id), x.unidad.nombre).toBe(x.cumplimiento)
      }
    }
  })

  it('cada fila trae el desglose completo, y suma el total de indicadores', () => {
    for (const f of ds.getFilas({ ...base, nivel: 12 })) {
      const { verde, ambar, rojo } = f.porSemaforo
      expect(verde + ambar + rojo, f.unidad.nombre).toBe(f.totalIndicadores)
      expect(f.indicadoresEnRojo).toBe(rojo)
      expect(f.cumplimiento).toBeCloseTo((verde / f.totalIndicadores) * 100, 10)
    }
  })
  // --- Última ronda: varianza mensual real y criterio de ventana unificado ---

  const PERIODOS: Filtro['periodo'][] =
    ['mes', 'trimestre', 'semestre', 'anio', 'comparativo']

  it('todo indicador listado bajo un filtro de Estado muestra ese mismo estado en su tarjeta', () => {
    // La contradicción: con Estado = Incumplido y Período = Año,
    // `getIndicadores` listaba 6 indicadores cuya tarjeta pintaba ámbar,
    // porque el filtro usaba el semáforo de ventana y la tarjeta el del
    // último mes. Se comprueba en los cinco períodos y sobre un alcance
    // amplio, no sobre una unidad escogida a mano.
    const unidades = ['dir-registro', 'esc-medicina', 'vic-admin', 'invpos-9',
      'recinto-santiago', 'esc-musica', 'org-6']
    let comprobados = 0
    for (const periodo of PERIODOS) {
      for (const estado of ['verde', 'ambar', 'rojo'] as const) {
        for (const u of unidades) {
          const f = { ...base, unidadId: u, periodo, estado }
          for (const i of ds.getIndicadores(u, f)) {
            expect(ds.getIndicadorEnPeriodo(i.id, f).punto.semaforo,
              `${u} ${periodo} ${estado} ${i.nombre}`).toBe(estado)
            comprobados++
          }
        }
      }
    }
    // Si el alcance quedara vacío, el bucle pasaría sin comprobar nada.
    expect(comprobados).toBeGreaterThan(300)
  })

  it('el desglose de la rejilla cuadra con las tarjetas de la vista de unidad', () => {
    // "13 en meta · 7 en riesgo" en la rejilla y 14 / 6 al abrir la unidad:
    // eran dos criterios distintos sobre el mismo dato.
    for (const periodo of PERIODOS) {
      for (const fila of ds.getFilas({ ...base, nivel: 12, periodo })) {
        const f = { ...base, unidadId: fila.unidad.id, periodo }
        const tarjetas = ds.getIndicadores(fila.unidad.id, f)
          .map(i => ds.getIndicadorEnPeriodo(i.id, f).punto.semaforo)
        const cuenta = { verde: 0, ambar: 0, rojo: 0 }
        for (const s of tarjetas) cuenta[s]++
        expect(cuenta, `${fila.unidad.nombre} · ${periodo}`).toEqual(fila.porSemaforo)
      }
    }
  })

  it("'Mes actual' deja la tarjeta exactamente igual que el último punto de la serie", () => {
    for (const i of ds.getIndicadores('dir-registro', base)) {
      const { punto } = ds.getIndicadorEnPeriodo(i.id, base)
      const ultimo = ds.getUltimo(i.id)!
      expect(punto.valor).toBeCloseTo(ultimo.valor, 9)
      expect(punto.meta).toBeCloseTo(ultimo.meta, 9)
      expect(punto.cumplimiento).toBeCloseTo(ultimo.cumplimiento, 9)
      expect(punto.semaforo).toBe(ultimo.semaforo)
      expect(punto.tendencia).toBe(ultimo.tendencia)
    }
  })

  it('el minigráfico de la tarjeta termina en la misma cifra que el número grande', () => {
    for (const periodo of PERIODOS) {
      const f = { ...base, unidadId: 'dir-registro', periodo }
      for (const i of ds.getIndicadores('dir-registro', f)) {
        const { punto, serie } = ds.getIndicadorEnPeriodo(i.id, f)
        expect(serie).toHaveLength(12)
        expect(serie.at(-1), `${i.nombre} · ${periodo}`).toBeCloseTo(punto.valor, 9)
      }
    }
  })

  it('los cinco períodos NO producen el mismo tablero', () => {
    // El defecto de fondo: la banda de cumplimiento se sorteaba una vez por
    // indicador y ninguna banda cruzaba los umbrales de `clasificar`, así que
    // promediar 3, 6 o 12 puntos no podía cambiar ningún semáforo y
    // Trimestre, Semestre, Año y Comparativo daban una portada idéntica.
    const huella = (periodo: Filtro['periodo']) =>
      ds.getFilas({ ...base, periodo })
        .map(f => `${f.unidad.id}:${f.cumplimiento.toFixed(1)}`).join(',')
    const distintos = ['mes', 'trimestre', 'semestre', 'anio'] as const
    for (let i = 0; i < distintos.length; i++)
      for (let j = i + 1; j < distintos.length; j++)
        expect(huella(distintos[i]), `${distintos[i]} vs ${distintos[j]}`)
          .not.toBe(huella(distintos[j]))

    // Y la diferencia es sustancial, no un decimal suelto en una unidad.
    const a = huella('trimestre').split(',')
    const b = huella('anio').split(',')
    expect(a.filter((v, k) => v !== b[k]).length).toBeGreaterThan(30)

    // 'comparativo' SÍ coincide con 'anio' en las cifras agregadas: por
    // diseño usa la ventana del año en curso, y lo que lo distingue es que
    // el diálogo superpone además el año anterior.
    expect(huella('comparativo')).toBe(huella('anio'))
  })
})
