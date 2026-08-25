import { useFiltros } from '../state/FiltrosContext'
import { hijosDe } from '../data/mock/unidades'
import { Rectoral } from './Rectoral'
import { Nivel } from './Nivel'
import { Unidad } from './Unidad'

export function Enrutador() {
  const { filtro } = useFiltros()

  if (filtro.unidadId) {
    // Una unidad sin descendencia es una hoja: se muestran sus indicadores.
    return hijosDe(filtro.unidadId).length ? <Nivel /> : <Unidad />
  }
  if (filtro.areaId || filtro.nivel !== null) return <Nivel />
  return <Rectoral />
}
