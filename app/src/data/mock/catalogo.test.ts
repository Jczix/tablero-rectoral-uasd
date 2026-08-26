import { describe, it, expect } from 'vitest'
import { INDICADORES, indicadoresDe, conjuntoDe } from './catalogo'
import { UNIDADES } from './unidades'
import { CONJUNTO_POR_ID, CENTRO, ESCUELA } from './catalogo-textos'

describe('catálogo de indicadores', () => {
  it('conserva completo el catálogo de las unidades con texto propio', () => {
    // La lista transcrita del documento fuente no se recorta: es la parte
    // "idéntica a la realidad". 10 de servicio + 10 de proceso. La Sede
    // Central NO está aquí: usa el set genérico de recinto (sin bloque
    // propio en el documento) y se recorta como cualquier genérica.
    for (const id of Object.keys(CONJUNTO_POR_ID)) {
      expect(indicadoresDe(id).length, id).toBe(20)
    }
    expect(indicadoresDe('sede-central').length).toBeLessThan(20)
  })

  it('reparte 10 de servicio y 10 de proceso en las unidades con texto propio', () => {
    const de = indicadoresDe('dir-registro')
    expect(de.filter(i => i.categoria === 'servicio')).toHaveLength(10)
    expect(de.filter(i => i.categoria === 'proceso')).toHaveLength(10)
  })

  it('varía el tamaño del catálogo genérico entre 12 y 20, determinista', () => {
    const genericas = UNIDADES.filter(u => !CONJUNTO_POR_ID[u.id])
    for (const u of genericas) {
      const n = indicadoresDe(u.id).length
      expect(n, u.id).toBeGreaterThanOrEqual(12)
      expect(n, u.id).toBeLessThanOrEqual(20)
      const porCategoria = indicadoresDe(u.id)
      expect(porCategoria.filter(i => i.categoria === 'servicio').length,
        u.id).toBeGreaterThanOrEqual(6)
      expect(porCategoria.filter(i => i.categoria === 'proceso').length,
        u.id).toBeGreaterThanOrEqual(6)
    }
  })

  it('los centros no comparten todos el mismo tamaño: sin eso, el % en meta cae siempre en múltiplos de 5 y la tabla territorial se ve clonada', () => {
    const centros = UNIDADES.filter(u => u.tipo === 'centro')
    const tamanos = new Set(centros.map(u => indicadoresDe(u.id).length))
    expect(tamanos.size).toBeGreaterThanOrEqual(3)
  })

  it('usa los textos literales del documento fuente para Registro', () => {
    const nombres = indicadoresDe('dir-registro').map(i => i.nombre)
    expect(nombres).toContain('Récords oficiales emitidos')
    expect(nombres).toContain('Certificados de título emitidos')
    expect(nombres).toContain('Tiempo promedio de emisión de récord oficial')
  })

  it('usa los textos propios de los recintos', () => {
    const nombres = indicadoresDe('recinto-santiago').map(i => i.nombre)
    expect(nombres).toContain('Estudiantes matriculados en el Recinto Santiago.')
    expect(nombres).toContain('Ejecución del POA del recinto.')
  })

  it('aplica el set común a centros y subcentros (cada uno con su tramo)', () => {
    const nombresGenericos = new Set([...CENTRO.servicio, ...CENTRO.proceso])
    for (const nombre of indicadoresDe('centro-la-vega').map(i => i.nombre)) {
      expect(nombresGenericos.has(nombre), nombre).toBe(true)
    }
  })

  it('no repite identificadores de indicador', () => {
    const ids = INDICADORES.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('deriva el tipo de métrica de cada indicador', () => {
    const tiempo = INDICADORES.find(i => i.nombre.startsWith('Tiempo'))!
    expect(tiempo.tipoMetrica).toBe('dias')
  })

  it('genera del orden de 2,500+ indicadores en total', () => {
    const suma = UNIDADES.reduce((a, u) => a + indicadoresDe(u.id).length, 0)
    expect(INDICADORES.length).toBe(suma)
    expect(INDICADORES.length).toBeGreaterThan(2500)
  })

  it('usa el respaldo genérico de escuela solo para las 4 sin texto propio', () => {
    const SIN_TEXTO_PROPIO = new Set([
      'esc-geografia', 'esc-matematicas', 'esc-microbiologia-y', 'esc-quimica',
    ])
    const escuelas = UNIDADES.filter(u => u.tipo === 'escuela')
    // Genérica = todos sus nombres provienen del set de respaldo ESCUELA
    // (con el recorte por tramos ya no se puede detectar por UN nombre fijo:
    // el tramo de una unidad puede no incluirlo).
    const nombresGenericos = new Set([...ESCUELA.servicio, ...ESCUELA.proceso])
    const genericas = escuelas.filter(e =>
      indicadoresDe(e.id).every(i => nombresGenericos.has(i.nombre)))
    expect(genericas.map(e => e.id).sort()).toEqual([...SIN_TEXTO_PROPIO].sort())
  })

  it('resuelve un conjunto completo de 10+10 textos para cada una de las 158 unidades', () => {
    // Regresión del bug real de esta tarea: conjuntoDe devolvía `undefined`
    // para las 42 unidades que dependían de un respaldo genérico no
    // exportado, y el TypeError solo aparecía al construir INDICADORES en la
    // carga del módulo, sin decir a qué unidad pertenecía. Esta prueba falla
    // señalando el id de la primera unidad afectada, sin que el fallo pueda
    // repetirse en silencio.
    for (const u of UNIDADES) {
      const c = conjuntoDe(u.id, u.tipo)
      expect(c, `conjuntoDe(${u.id}) no debe ser undefined`).toBeDefined()
      expect(c.servicio, `${u.id}: conjunto.servicio`).toHaveLength(10)
      expect(c.proceso, `${u.id}: conjunto.proceso`).toHaveLength(10)
    }
  })

  it('no usa respaldo genérico para ninguna facultad ni recinto', () => {
    const facultadesYRecintos = UNIDADES.filter(u => u.tipo === 'facultad' || u.tipo === 'recinto')
    for (const u of facultadesYRecintos) {
      const nombres = indicadoresDe(u.id).map(i => i.nombre)
      expect(nombres.includes('Solicitudes atendidas por la dirección'), u.id).toBe(false)
      expect(nombres.includes('Solicitudes institucionales atendidas'), u.id).toBe(false)
    }
  })
})
