import type { EstadoFiltro } from '../../data/source'
import type { CategoriaIndicador } from '../../data/tipos'
import { ETIQUETA_ESTADO } from '../../state/filtros'

const ETIQUETA_CATEGORIA: Record<CategoriaIndicador, string> = {
  servicio: 'de servicio', proceso: 'de proceso',
}

interface Props {
  /** Qué se está listando y no salió nada: 'unidad' o 'indicador'. */
  que: 'unidad' | 'indicador'
  /** Ámbito en palabras: 'esta unidad', 'este nivel', 'la Facultad de...'. */
  ambito: string
  estado: EstadoFiltro
  categoria: CategoriaIndicador | 'todas'
}

/**
 * Estado vacío EXPLICADO. Cuando el filtro deja la lista sin nada, antes se
 * veía el marco y el cuerpo en blanco: en un televisor de pared eso se lee
 * como "el tablero se rompió", no como "el filtro no encontró nada". El
 * texto va en tamaño grande a propósito, porque quien lo necesita lo está
 * leyendo desde el otro lado de la oficina, y nombra el filtro responsable
 * para que se sepa cuál soltar.
 */
export function EstadoVacio({ que, ambito, estado, categoria }: Props) {
  const sustantivo = que === 'unidad' ? 'unidad' : 'indicador'
  const califica = categoria !== 'todas' ? ` ${ETIQUETA_CATEGORIA[categoria]}` : ''

  const mensaje = estado !== 'todos'
    ? `Ning${que === 'unidad' ? 'una' : 'ún'} ${sustantivo}${califica} de ${ambito} `
      + `está en estado ${ETIQUETA_ESTADO[estado]}.`
    : `No hay ${sustantivo}es${califica} que mostrar en ${ambito}.`

  const pista = estado !== 'todos'
    ? `Cambia el filtro Estado para ver ${que === 'unidad' ? 'las demás unidades' : 'los demás indicadores'}.`
    : 'Retira algún filtro de la barra superior para ver más.'

  return (
    <div data-testid="estado-vacio"
      className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <p className="max-w-3xl text-2xl font-semibold leading-snug text-white/85">
        {mensaje}
      </p>
      <p className="text-lg text-white/70">{pista}</p>
    </div>
  )
}
