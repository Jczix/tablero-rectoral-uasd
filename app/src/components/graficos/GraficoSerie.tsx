import {
  ResponsiveContainer, ComposedChart, Line, Area, Bar, XAxis, YAxis,
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
 * El tipo de gráfico sigue al tipo de dato: los conteos y el dinero son
 * cantidades discretas por mes y se dibujan como barras; los porcentajes y
 * los días son niveles continuos y se dibujan como línea con área
 * sombreada. El comparativo año contra año conserva las dos líneas
 * superpuestas (barras gemelas de 12+12 meses serían ilegibles), con la
 * serie anterior en trazo punteado dorado. La meta va punteada en los tres.
 *
 * Con `previa`, las dos ventanas se emparejan por posición (mes 1 con mes
 * 1); el eje rotula el período del año en curso.
 */
export function GraficoSerie({ serie, previa, tipoMetrica }: Props) {
  const datos = serie.map((p, i) => ({
    periodo: p.periodo,
    valor: p.valor,
    meta: p.meta,
    anterior: previa?.[i]?.valor,
  }))
  const forma = previa
    ? 'comparativo'
    : (tipoMetrica === 'conteo' || tipoMetrica === 'moneda') ? 'barras' : 'area'

  return (
    <div data-forma={forma}>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={datos} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <defs>
            <linearGradient id="relleno-serie" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3D82C4" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3D82C4" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#ffffff14" vertical={false} />
          <XAxis dataKey="periodo" stroke="#ffffff99" fontSize={11} />
          <YAxis stroke="#ffffff99" fontSize={11}
            tickFormatter={(v: number) => formatear(v, tipoMetrica)} width={90} />
          <Tooltip
            contentStyle={{ background: '#132639', border: '1px solid #ffffff22' }}
            formatter={(v: unknown) => formatear(Number(v), tipoMetrica)} />
          {forma === 'comparativo' && <Legend wrapperStyle={{ fontSize: 12 }} />}
          <Line type="monotone" dataKey="meta" stroke="#ffffff55"
            strokeDasharray="4 4" dot={false} name="Meta" />
          {forma === 'comparativo' && (
            <>
              <Line type="monotone" dataKey="anterior" stroke="#C9A227"
                strokeWidth={2} strokeDasharray="6 3" dot={false} name="Año anterior" />
              <Line type="monotone" dataKey="valor" stroke="#3D82C4"
                strokeWidth={2.5} dot={false} name="Año en curso" />
            </>
          )}
          {forma === 'barras' && (
            <Bar dataKey="valor" fill="#3D82C4" radius={[3, 3, 0, 0]}
              maxBarSize={28} name="Valor" />
          )}
          {forma === 'area' && (
            <Area type="monotone" dataKey="valor" stroke="#3D82C4"
              strokeWidth={2.5} fill="url(#relleno-serie)" dot={false} name="Valor" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
