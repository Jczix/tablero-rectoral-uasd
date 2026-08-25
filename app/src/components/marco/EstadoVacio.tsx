import type { EstadoFiltro } from '../../data/source'
import type { CategoriaIndicador } from '../../data/tipos'
import { ETIQUETA_ESTADO } from '../../state/filtros'

const ETIQUETA_CATEGORIA: Record<CategoriaIndicador, string> = {
  servicio: 'de servicio', proceso: 'de proceso',
}

type Que = 'unidad' | 'indicador' | 'servicio'

/** Género gramatical de cada sustantivo, para que la frase concuerde. */
const FEMENINO: Record<Que, boolean> = {
  unidad: true, indicador: false, servicio: false,
}

interface Props {
  /** Qué se está listando y no salió nada. */
  que: Que
  /** Ámbito en palabras, ya contraído si toca: 'esta unidad', 'este nivel',
   *  'la red territorial', 'la Facultad de…'. Se le antepone "de". */
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
  const femenino = FEMENINO[que]
  const plural = que === 'servicio' ? 'servicios' : `${que}es`
  const califica = categoria !== 'todas' ? ` ${ETIQUETA_CATEGORIA[categoria]}` : ''

  const mensaje = estado !== 'todos'
    ? `Ning${femenino ? 'una' : 'ún'} ${que}${califica} de ${ambito} `
      + `está en estado ${ETIQUETA_ESTADO[estado]}.`
    : `No hay ${plural}${califica} que mostrar en ${ambito}.`

  const pista = estado !== 'todos'
    ? `Cambia el filtro Estado para ver ${femenino ? 'las' : 'los'} demás ${plural}.`
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
