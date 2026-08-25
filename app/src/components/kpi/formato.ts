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
      // NOTACIÓN ÚNICA: "M" = MILLONES de pesos, siempre, sin excepción.
      // Antes se usaba "MM" para 10^9, pero en la convención dominicana MM
      // significa millones: el presupuesto institucional de 14,800 millones
      // se anunciaba como "RD$ 14.80 MM", es decir 14.8 millones, mil veces
      // menos. Es la cifra más grande de la portada y la que el Rector
      // conoce de memoria, así que se elimina "MM" del tablero y las
      // magnitudes de miles de millones se expresan en millones con
      // separador de miles: "RD$ 14,800 M".
      if (valor >= 1e6) {
        const enMillones = valor / 1e6
        // Por encima de mil millones el decimal ya no aporta y estorba a
        // distancia: se redondea a millones enteros con separador.
        if (Number(enMillones.toFixed(1)) >= 1000)
          return `RD$ ${miles(Math.round(enMillones))} M`
        return `RD$ ${enMillones.toFixed(1)} M`
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
