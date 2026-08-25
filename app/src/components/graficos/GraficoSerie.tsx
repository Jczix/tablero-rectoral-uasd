import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'
import type { PuntoSerie, TipoMetrica } from '../../data/tipos'
import { formatear } from '../kpi/formato'

export function GraficoSerie(
  { serie, tipoMetrica }: { serie: PuntoSerie[]; tipoMetrica: TipoMetrica }
) {
  const datos = serie.map(p => ({
    periodo: p.periodo, valor: p.valor, meta: p.meta,
  }))
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={datos} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="#ffffff14" vertical={false} />
        <XAxis dataKey="periodo" stroke="#ffffff66" fontSize={11} />
        <YAxis stroke="#ffffff66" fontSize={11}
          tickFormatter={(v: number) => formatear(v, tipoMetrica)} width={90} />
        <Tooltip
          contentStyle={{ background: '#132639', border: '1px solid #ffffff22' }}
          formatter={(v: unknown) => formatear(Number(v), tipoMetrica)} />
        <Line type="monotone" dataKey="meta" stroke="#ffffff55"
          strokeDasharray="4 4" dot={false} name="Meta" />
        <Line type="monotone" dataKey="valor" stroke="#3D82C4"
          strokeWidth={2.5} dot={false} name="Valor" />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
