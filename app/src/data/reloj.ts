let fijada: Date | null = null

/** Única fuente de "ahora" en toda la aplicación, para que los tests puedan fijarla. */
export function ahora(): Date {
  return fijada ? new Date(fijada) : new Date()
}

export function fijarAhora(d: Date | null): void {
  fijada = d
}
