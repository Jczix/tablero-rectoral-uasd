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
      // Un valor positivo pero muy pequeño redondearía a "0.0 días", lo cual
      // se lee como "sin demora" cuando en realidad la hay.
      if (valor > 0 && valor < 0.05) return '< 0.1 días'
      return `${valor.toFixed(1)} días`
    case 'moneda': {
      if (valor >= 1e9) return `RD$ ${(valor / 1e9).toFixed(2)} MM`
      if (valor >= 1e6) {
        // Comprobar el umbral DESPUÉS de redondear: un valor como
        // 999,999,999 redondea a "1000.0 M" si no se vuelve a comprobar,
        // lo cual se lee como mil millones cuando son casi (pero no) mil.
        const enMillones = (valor / 1e6).toFixed(1)
        if (Number(enMillones) >= 1000) return `RD$ ${(valor / 1e9).toFixed(2)} MM`
        return `RD$ ${enMillones} M`
      }
      return `RD$ ${miles(Math.round(valor))}`
    }
    default:
      return miles(Math.round(valor))
  }
}

export function formatearCompacto(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} M`
  if (n >= 1e4) {
    // Mismo problema que en formatear('moneda'): comprobar el umbral
    // después de redondear, no antes, para no anunciar "1000 mil".
    const enMiles = Math.round(n / 1000)
    if (enMiles >= 1000) return `${(n / 1e6).toFixed(1)} M`
    return `${enMiles} mil`
  }
  return miles(Math.round(n))
}
