import { Desplegable, type Opcion } from './Desplegable'
import { ChipsFiltros } from './ChipsFiltros'
import { useFiltros } from '../../state/FiltrosContext'
import { mockDataSource as ds } from '../../data/mock/MockDataSource'
import type { NivelId, CategoriaIndicador } from '../../data/tipos'
import type { Periodo, EstadoFiltro } from '../../data/source'

const aOpciones = (us: { id: string; nombre: string }[]): Opcion[] =>
  us.map(u => ({ valor: u.id, texto: u.nombre }))

const PERIODOS: Opcion[] = [
  { valor: 'mes', texto: 'Mes actual' }, { valor: 'trimestre', texto: 'Trimestre' },
  { valor: 'semestre', texto: 'Semestre' }, { valor: 'anio', texto: 'Año' },
  { valor: 'comparativo', texto: 'Comparativo 2025 vs 2026' },
]
const CATEGORIAS: Opcion[] = [
  { valor: 'servicio', texto: 'Indicadores de Servicio' },
  { valor: 'proceso', texto: 'Indicadores de Proceso' },
]
const ESTADOS: Opcion[] = [
  { valor: 'verde', texto: 'En meta' }, { valor: 'ambar', texto: 'En riesgo' },
  { valor: 'rojo', texto: 'Incumplido' },
]

export function BarraFiltros() {
  const { filtro, despachar } = useFiltros()

  const niveles: Opcion[] = ds.getNiveles()
    .map(n => ({ valor: String(n.id), texto: n.nombre }))
  const areas = aOpciones(ds.getAreas(filtro.nivel))
  const unidades = aOpciones(ds.getUnidadesDe(filtro.nivel, filtro.areaId))

  return (
    <div className="border-b border-white/10 bg-panel/80 backdrop-blur">
      <div className="flex flex-wrap items-end gap-4 px-6 py-4">
        <Desplegable etiqueta="Nivel" opciones={niveles}
          valor={filtro.nivel === null ? null : String(filtro.nivel)}
          onCambio={v => despachar({
            tipo: 'nivel', valor: v === null ? null : Number(v) as NivelId })} />

        <Desplegable etiqueta="Área / Dependencia" opciones={areas} buscable
          valor={filtro.areaId}
          onCambio={v => despachar({ tipo: 'area', valor: v })} />

        <Desplegable etiqueta="Unidad" opciones={unidades} buscable
          valor={filtro.unidadId}
          onCambio={v => despachar({ tipo: 'unidad', valor: v })} />

        <Desplegable etiqueta="Período" opciones={PERIODOS} valor={filtro.periodo}
          onCambio={v => despachar({ tipo: 'periodo', valor: (v ?? 'mes') as Periodo })} />

        <Desplegable etiqueta="Tipo de indicador" opciones={CATEGORIAS}
          valor={filtro.categoria === 'todas' ? null : filtro.categoria}
          onCambio={v => despachar({
            tipo: 'categoria',
            valor: (v ?? 'todas') as CategoriaIndicador | 'todas' })} />

        <Desplegable etiqueta="Estado" opciones={ESTADOS}
          valor={filtro.estado === 'todos' ? null : filtro.estado}
          onCambio={v => despachar({
            tipo: 'estado', valor: (v ?? 'todos') as EstadoFiltro })} />
      </div>
      <ChipsFiltros />
    </div>
  )
}
