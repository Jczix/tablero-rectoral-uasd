import { describe, it, expect, afterEach } from 'vitest'
import { ahora, fijarAhora } from './reloj'

describe('reloj', () => {
  afterEach(() => fijarAhora(null))

  it('devuelve la fecha fijada cuando hay una', () => {
    fijarAhora(new Date('2026-08-25T10:00:00Z'))
    expect(ahora().toISOString()).toBe('2026-08-25T10:00:00.000Z')
  })

  it('vuelve al reloj del sistema al liberar la fecha fijada', () => {
    fijarAhora(new Date('2020-01-01T00:00:00Z'))
    fijarAhora(null)
    expect(ahora().getFullYear()).toBeGreaterThan(2020)
  })
})
