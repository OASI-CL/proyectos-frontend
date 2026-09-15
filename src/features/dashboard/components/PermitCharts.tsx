import {
  Bar, BarChart, Cell, CartesianGrid, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { ChartCard } from './ChartCard'
import { pickChartRow, truncateLabel } from './chartEvents'
import {
  CHART_CURSOR, CHART_GRID,
  PERMIT_STATUS_FILL, PERMIT_STATUS_LABELS, PERMIT_STATUS_ORDER, PERMIT_STATUS_STROKE,
} from '../constants'
import { formatNumber } from '../../../lib/formatters'
import type {
  AgencyPermitRow, PermitStatusRow, PermitTrackingStatus, RegionPermitRow,
} from '../types'

/** Shared tooltip: always shows the three-state breakdown. */
function StatusBreakdownTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { payload: Record<string, unknown> }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload as { total: number } & Record<PermitTrackingStatus, number>

  return (
    <div className="tooltip-custom">
      <div className="tooltip-custom__titulo">{label}</div>
      <div>Total: <strong>{formatNumber(row.total)}</strong></div>
      {PERMIT_STATUS_ORDER.map((status) => (
        <div key={status} style={{ color: PERMIT_STATUS_STROKE[status] }}>
          {PERMIT_STATUS_LABELS[status]}: <strong>{formatNumber(row[status])}</strong>
        </div>
      ))}
    </div>
  )
}

/**
 * Stacked bars for the three permit states.
 *
 * Clicking any segment filters by the row it belongs to (the agency or the
 * region) rather than by the segment's status — the donut is the control for
 * filtering by status, so a bar click has one unambiguous meaning.
 */
function statusBars<T extends object>(
  rowKey: keyof T & string,
  onRowClick: (row: T) => void,
) {
  return PERMIT_STATUS_ORDER.map((status) => (
    <Bar
      key={status}
      dataKey={status}
      name={PERMIT_STATUS_LABELS[status]}
      stackId="permits"
      fill={PERMIT_STATUS_FILL[status]}
      stroke={PERMIT_STATUS_STROKE[status]}
      strokeWidth={1}
      onClick={(event) => {
        const row = pickChartRow<T>(event, rowKey)
        if (row) onRowClick(row)
      }}
      style={{ cursor: 'pointer' }}
    />
  ))
}

// ----------------------------------------------------------------------------
// 8. Permits by agency
// ----------------------------------------------------------------------------

interface AgencyProps {
  rows: AgencyPermitRow[]
  onSelectAgency: (agencyId: number) => void
}

export function PermitsByAgencyChart({ rows, onSelectAgency }: AgencyProps) {
  return (
    <ChartCard
      title="Permisos por organismo"
      hint="Clic en una barra para filtrar por organismo"
      height={Math.max(300, rows.length * 30)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="agency"
            width={170}
            interval={0}
            tickFormatter={(value: string) => truncateLabel(value, 22)}
          />
          <Tooltip cursor={{ fill: CHART_CURSOR, opacity: 0.4 }} content={<StatusBreakdownTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {statusBars<AgencyPermitRow>('agencyId', (row) => onSelectAgency(row.agencyId))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ----------------------------------------------------------------------------
// 9. Permits by region
// ----------------------------------------------------------------------------

interface RegionProps {
  rows: RegionPermitRow[]
  onSelectRegion: (region: string) => void
}

export function PermitsByRegionChart({ rows, onSelectRegion }: RegionProps) {
  return (
    <ChartCard
      title="Permisos por región"
      hint="Clic en una barra para filtrar por región"
      height={340}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 56 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
          <XAxis dataKey="region" angle={-38} textAnchor="end" interval={0} height={70} />
          <YAxis allowDecimals={false} />
          <Tooltip cursor={{ fill: CHART_CURSOR, opacity: 0.4 }} content={<StatusBreakdownTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {statusBars<RegionPermitRow>('region', (row) => onSelectRegion(row.region))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ----------------------------------------------------------------------------
// 10. Permit status donut
// ----------------------------------------------------------------------------

interface DonutProps {
  rows: PermitStatusRow[]
  selected?: string
  onSelect: (status: PermitTrackingStatus) => void
}

export function PermitStatusDonut({ rows, selected, onSelect }: DonutProps) {
  const total = rows.reduce((sum, row) => sum + row.permitCount, 0)

  // Keep the three states in a fixed order so the colours never shuffle.
  const data = PERMIT_STATUS_ORDER.map((status) => ({
    status,
    label: PERMIT_STATUS_LABELS[status],
    permitCount: rows.find((row) => row.status === status)?.permitCount ?? 0,
  })).filter((row) => row.permitCount > 0)

  return (
    <ChartCard
      title="Distribución por estado"
      hint="Clic en un segmento para filtrar"
      height={320}
    >
      {total === 0 ? (
        <div className="estado-caja">
          <div className="estado-caja__titulo">Sin permisos en el universo filtrado</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="permitCount"
              nameKey="label"
              innerRadius={62}
              outerRadius={96}
              paddingAngle={2}
              onClick={(event) => {
                const row = pickChartRow<{ status: PermitTrackingStatus }>(event, 'status')
                if (row) onSelect(row.status)
              }}
              style={{ cursor: 'pointer' }}
            >
              {data.map((row) => (
                <Cell
                  key={row.status}
                  fill={PERMIT_STATUS_FILL[row.status]}
                  stroke={PERMIT_STATUS_STROKE[row.status]}
                  strokeWidth={selected === row.status ? 3 : 1}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as { label: string; permitCount: number }
                const share = Math.round((row.permitCount / total) * 100)
                return (
                  <div className="tooltip-custom">
                    <div className="tooltip-custom__titulo">{row.label}</div>
                    <div>Permisos: <strong>{formatNumber(row.permitCount)}</strong></div>
                    <div>Porcentaje: <strong>{share}%</strong> del total</div>
                  </div>
                )
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
