import { describe, it, expect } from 'vitest'
import { UNIDADES, NIVELES, porId, hijosDe, ancestrosDe } from './unidades'

const cuenta = (tipo: string) => UNIDADES.filter(u => u.tipo === tipo).length

describe('padrón de unidades', () => {
  it('tiene exactamente una rectoría en la raíz', () => {
    const raices = UNIDADES.filter(u => u.padreId === null)
    expect(raices).toHaveLength(1)
    expect(raices[0].tipo).toBe('rectoria')
  })

  it('respeta las cantidades reales del padrón', () => {
    expect(cuenta('vicerrectoria')).toBe(4)
    expect(cuenta('facultad')).toBe(9)
    expect(cuenta('escuela')).toBe(52)
    expect(cuenta('recinto')).toBe(4)
    expect(cuenta('centro')).toBe(18)
    expect(cuenta('subcentro')).toBe(12)
  })

  it('no repite identificadores', () => {
    const ids = UNIDADES.map(u => u.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('excluye Neyba de subcentros por estar duplicado como centro', () => {
    const neyba = UNIDADES.filter(u => u.nombre.includes('Neyba'))
    expect(neyba).toHaveLength(1)
    expect(neyba[0].tipo).toBe('centro')
  })

  it('todo padre referenciado existe', () => {
    const ids = new Set(UNIDADES.map(u => u.id))
    const huerfanos = UNIDADES.filter(u => u.padreId !== null && !ids.has(u.padreId))
    expect(huerfanos.map(u => u.id)).toEqual([])
  })

  it('toda unidad territorial trae provincia y coordenadas', () => {
    const territoriales = UNIDADES.filter(u =>
      ['recinto', 'centro', 'subcentro'].includes(u.tipo))
    const incompletas = territoriales.filter(u => !u.provincia || !u.coords)
    expect(incompletas.map(u => u.id)).toEqual([])
  })

  it('sitúa las coordenadas dentro de República Dominicana', () => {
    const fuera = UNIDADES.filter(u => u.coords).filter(u => {
      const [lon, lat] = u.coords!
      return lon < -72.1 || lon > -68.2 || lat < 17.4 || lat > 20.1
    })
    expect(fuera.map(u => u.id)).toEqual([])
  })

  it('toda unidad tiene un peso positivo', () => {
    expect(UNIDADES.filter(u => !(u.peso > 0))).toEqual([])
  })

  it('expone los 10 niveles del Rector más Facultades y Escuelas', () => {
    expect(NIVELES).toHaveLength(12)
    expect(NIVELES.map(n => n.id).sort((a, b) => a - b))
      .toEqual([1,2,3,4,5,6,7,8,9,10,11,12])
  })

  it('ordena Facultades y Escuelas justo después de Vicerrectorías', () => {
    const porOrden = [...NIVELES].sort((a, b) => a.orden - b.orden).map(n => n.id)
    expect(porOrden.slice(0, 4)).toEqual([1, 2, 11, 12])
  })

  it('encuentra unidades por identificador', () => {
    expect(porId('recinto-santiago')?.nombre).toContain('Santiago')
    expect(porId('inexistente')).toBeUndefined()
  })

  it('lista los hijos directos de una unidad', () => {
    const escuelasSalud = hijosDe('fac-salud')
    expect(escuelasSalud).toHaveLength(8)
    expect(escuelasSalud.every(u => u.tipo === 'escuela')).toBe(true)
  })

  it('lista los ancestros desde la unidad hasta la raíz', () => {
    const cadena = ancestrosDe('esc-medicina').map(u => u.id)
    expect(cadena).toEqual(['fac-salud', 'vic-docente', 'rectoria'])
  })
})
