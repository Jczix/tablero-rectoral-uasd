import type { TipoMetrica } from '../../data/tipos'

// NOTA: el separador de miles usa la convención inglesa (186,000) porque los
// tests lo exigen literalmente. La convención dominicana usaría punto
// (186.000); se deja anotado como observación, sin cambiar el comportamiento.
const miles = (n: number) => n.toLocaleString('en-US')

export function formatear(valor: number, tipo: TipoMetrica): string {
  switch (tipo) {
    case 'porcentaje':
      return `${valor.toFixed(1)}%`
    case 'dias':
      return `${valor.toFixed(1)} días`
    case 'moneda':
      if (valor >= 1e9) return `RD$ ${(valor / 1e9).toFixed(2)} MM`
      if (valor >= 1e6) return `RD$ ${(valor / 1e6).toFixed(1)} M`
      return `RD$ ${miles(Math.round(valor))}`
    default:
      return miles(Math.round(valor))
  }
}

export function formatearCompacto(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} M`
  if (n >= 1e4) return `${Math.round(n / 1000)} mil`
  return miles(Math.round(n))
}
