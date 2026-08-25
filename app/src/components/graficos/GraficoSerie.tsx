import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import type { PuntoSerie, TipoMetrica } from '../../data/tipos'
import { formatear } from '../kpi/formato'

interface Props {
  serie: PuntoSerie[]
  /** Ventana anterior a superponer (período 'comparativo'). */
  previa?: PuntoSerie[]
  tipoMetrica: TipoMetrica
}

/**
 * Con `previa` el gráfico dibuja DOS ventanas superpuestas sobre el mismo eje
 * de meses: el año en curso y el inmediatamente anterior. Se emparejan por
 * posición dentro de la ventana (mes 1 con mes 1), que es lo que hace legible
 * la comparación; el eje rotula el período del año en curso y la serie
 * anterior se identifica por su leyenda y su trazo punteado.
 */
export function GraficoSerie({ serie, previa, tipoMetrica }: Props) {
  const datos = serie.map((p, i) => ({
    periodo: p.periodo,
    valor: p.valor,
    meta: p.meta,
    anterior: previa?.[i]?.valor,
  }))
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={datos} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="#ffffff14" vertical={false} />
        <XAxis dataKey="periodo" stroke="#ffffff99" fontSize={11} />
        <YAxis stroke="#ffffff99" fontSize={11}
          tickFormatter={(v: number) => formatear(v, tipoMetrica)} width={90} />
        <Tooltip
          contentStyle={{ background: '#132639', border: '1px solid #ffffff22' }}
          formatter={(v: unknown) => formatear(Number(v), tipoMetrica)} />
        {previa && <Legend wrapperStyle={{ fontSize: 12 }} />}
        <Line type="monotone" dataKey="meta" stroke="#ffffff55"
          strokeDasharray="4 4" dot={false} name="Meta" />
        {previa && (
          <Line type="monotone" dataKey="anterior" stroke="#C9A227"
            strokeWidth={2} strokeDasharray="6 3" dot={false} name="Año anterior" />
        )}
        <Line type="monotone" dataKey="valor" stroke="#3D82C4"
          strokeWidth={2.5} dot={false}
          name={previa ? 'Año en curso' : 'Valor'} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
