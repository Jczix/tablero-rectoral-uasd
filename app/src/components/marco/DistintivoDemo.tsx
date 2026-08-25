import { useEffect, useState } from 'react'

/**
 * Aviso permanente de que el tablero opera con datos simulados. No es un
 * detalle decorativo: en las Tareas 13 y 14 este mismo mensaje se corrigió
 * dos veces por quedar en el tamaño de fuente más pequeño de la app
 * (`text-[11px]`), donde nadie que mire el televisor desde el otro lado de
 * la oficina llega a leerlo. Su única función es que alguien lo lea y
 * actúe, así que se usa `text-base` (16px, más grande que cualquier chip o
 * rótulo secundario del tablero) con `font-semibold` y buen contraste: se
 * lee a distancia de televisor sin robarle protagonismo a los KPI, que
 * siguen siendo mucho más grandes.
 *
 * VIVE EN LA FRANJA DEL ENCABEZADO, con carril propio. Antes era
 * `fixed bottom-4 right-4`, y ahí se posaba encima de la cuarta entrada de
 * "Requieren atención" en la portada y del pie de "Carga por ventanilla" en
 * Servicios; además perdía legibilidad al quedar sobre una tarjeta clara.
 * En el encabezado no puede tapar nada en ninguna vista, porque el
 * encabezado no se superpone al contenido: lo empuja.
 */
export function DistintivoDemo() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const alTeclado = (e: KeyboardEvent) => {
      // Igual que en `Rotador.tsx`: dentro de la barra de filtros el
      // Rector puede estar escribiendo en un desplegable buscable
      // ("Educación", "Facultad de...", "Administrativa" — casi cualquier
      // nombre del padrón lleva una "d"), y ninguna tecla ahí debe
      // interpretarse como atajo del tablero. Se añade además la regla
      // general de ignorar cualquier campo de texto/edición, no solo la
      // barra de filtros, para cubrir campos futuros sin tener que volver
      // a tocar este componente.
      const objetivo = e.target instanceof Element ? e.target : null
      const dentroDeFiltros = objetivo?.closest('[data-barra-filtros]') != null
      const enCampoDeTexto = objetivo instanceof HTMLElement && (
        objetivo.tagName === 'INPUT' ||
        objetivo.tagName === 'TEXTAREA' ||
        objetivo.isContentEditable
      )
      if (dentroDeFiltros || enCampoDeTexto) return
      if (e.key.toLowerCase() === 'd') setVisible(v => !v)
    }
    window.addEventListener('keydown', alTeclado)
    return () => window.removeEventListener('keydown', alTeclado)
  }, [])

  // Se reserva el carril aunque esté oculto: si el distintivo desapareciera
  // del flujo, el encabezado se reacomodaría y el reloj daría un salto.
  if (!visible) return <div aria-hidden className="shrink-0" />
  return (
    <div className="shrink-0 rounded-md bg-black/40 px-4 py-2 text-base
                    font-semibold tracking-wide text-white
                    ring-1 ring-white/25">
      DATOS SIMULADOS — DEMO
    </div>
  )
}
