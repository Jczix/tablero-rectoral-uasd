import { useFiltros } from '../state/FiltrosContext'
import { hijosDe } from '../data/mock/unidades'
import { Rectoral } from './Rectoral'
import { Nivel } from './Nivel'
import { Unidad } from './Unidad'
import { Territorial } from './Territorial'

export function Enrutador() {
  const { filtro } = useFiltros()

  if (filtro.unidadId) {
    // Una unidad sin descendencia es una hoja: se muestran sus indicadores.
    return hijosDe(filtro.unidadId).length ? <Nivel /> : <Unidad />
  }
  // Territorial (recintos/centros/subcentros) usa mapa + tabla en vez de la
  // rejilla genérica de Nivel; solo cuando no hay una unidad concreta ya
  // escogida (comprobado arriba) — por eso va antes de la comprobación de
  // `areaId`, que también dispararía <Nivel />.
  if (filtro.nivel !== null && [6, 7, 8].includes(filtro.nivel)) return <Territorial />
  if (filtro.areaId || filtro.nivel !== null) return <Nivel />
  return <Rectoral />
}
