import { describe, it, expect } from 'vitest'
import { INDICADORES, indicadoresDe, conjuntoDe } from './catalogo'
import { UNIDADES } from './unidades'

describe('catálogo de indicadores', () => {
  it('asigna exactamente 20 indicadores a cada unidad', () => {
    for (const u of UNIDADES) {
      expect(indicadoresDe(u.id).length, u.id).toBe(20)
    }
  })

  it('reparte 10 de servicio y 10 de proceso', () => {
    const de = indicadoresDe('dir-registro')
    expect(de.filter(i => i.categoria === 'servicio')).toHaveLength(10)
    expect(de.filter(i => i.categoria === 'proceso')).toHaveLength(10)
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

  it('aplica el set común a centros y subcentros', () => {
    const centro = indicadoresDe('centro-la-vega').map(i => i.nombre)
    expect(centro).toContain('Estudiantes matriculados en el centro.')
    const sub = indicadoresDe('subcentro-samana').map(i => i.nombre)
    expect(sub).toContain('Estudiantes matriculados.')
  })

  it('no repite identificadores de indicador', () => {
    const ids = INDICADORES.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('deriva el tipo de métrica de cada indicador', () => {
    const tiempo = INDICADORES.find(i => i.nombre.startsWith('Tiempo'))!
    expect(tiempo.tipoMetrica).toBe('dias')
  })

  it('genera del orden de 2,900 indicadores en total', () => {
    expect(INDICADORES.length).toBe(UNIDADES.length * 20)
    expect(INDICADORES.length).toBeGreaterThan(2500)
  })

  it('usa el respaldo genérico de escuela solo para las 4 sin texto propio', () => {
    const SIN_TEXTO_PROPIO = new Set([
      'esc-geografia', 'esc-matematicas', 'esc-microbiologia-y', 'esc-quimica',
    ])
    const escuelas = UNIDADES.filter(u => u.tipo === 'escuela')
    const genericas = escuelas.filter(e =>
      indicadoresDe(e.id).map(i => i.nombre).includes('Estudiantes matriculados en la escuela'))
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
