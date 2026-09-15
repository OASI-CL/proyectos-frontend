import {
  Bar, BarChart, Cell, CartesianGrid, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { ChartCard } from './ChartCard'
import { pickChartRow, truncateLabel } from './chartEvents'
import {
  CHART_CURSOR, CHART_GRID, CHART_PRIMARY, CHART_SELECTED,
  RCA_STATUS_FILL, RCA_STATUS_LABELS, RCA_STATUS_STROKE,
} from '../constants'
import { formatMmusd, formatNumber } from '../../../lib/formatters'
import type { RcaStatus, RcaStatusRow, RegionProjectRow, SectorProjectRow } from '../types'

/** Shared by region/sector so the two panels always line up at the same height. */
export const PROJECT_CHART_HEIGHT = 340

// ----------------------------------------------------------------------------
// 3.1 Projects by region
// ----------------------------------------------------------------------------

interface RegionProps {
  rows: RegionProjectRow[]
  selected?: string
  onSelect: (region: string) => void
}

export function ProjectsByRegionChart({ rows, selected, onSelect }: RegionProps) {
  return (
    <ChartCard
      title="Proyectos por región"
      hint="Clic en una barra para filtrar"
      height={PROJECT_CHART_HEIGHT}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 56 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
          <XAxis dataKey="region" angle={-38} textAnchor="end" interval={0} height={70} />
          <YAxis allowDecimals={false} />
          <Tooltip
            cursor={{ fill: CHART_CURSOR, opacity: 0.4 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as RegionProjectRow
              return (
                <div className="tooltip-custom">
                  <div className="tooltip-custom__titulo">{row.region}</div>
                  <div>Proyectos: <strong>{formatNumber(row.projectCount)}</strong></div>
                  <div>Inversión: <strong>{formatMmusd(row.investmentMmusd)}</strong></div>
                  <div>Empleo constr.: <strong>{formatNumber(row.constructionJobs)}</strong></div>
                  <div>Empleo oper.: <strong>{formatNumber(row.operationJobs)}</strong></div>
                </div>
              )
            }}
          />
          <Bar
            dataKey="projectCount"
            name="Proyectos"
            radius={[3, 3, 0, 0]}
            onClick={(event) => {
              const row = pickChartRow<RegionProjectRow>(event, 'region')
              if (row) onSelect(row.region)
            }}
            style={{ cursor: 'pointer' }}
          >
            {rows.map((row) => (
              <Cell
                key={row.region}
                fill={selected === row.region ? CHART_SELECTED : CHART_PRIMARY}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ----------------------------------------------------------------------------
// 3.2 Projects by sector — bidirectional filter
// ----------------------------------------------------------------------------

interface SectorProps {
  rows: SectorProjectRow[]
  selected?: string
  onSelect: (sector: string) => void
}

export function ProjectsBySectorChart({ rows, selected, onSelect }: SectorProps) {
  return (
    <ChartCard
      title="Proyectos por sector"
      hint="Clic en una barra para filtrar"
      height={PROJECT_CHART_HEIGHT}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="sector"
            width={180}
            interval={0}
            tickFormatter={(value: string) => truncateLabel(value, 24)}
          />
          <Tooltip
            cursor={{ fill: CHART_CURSOR, opacity: 0.4 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as SectorProjectRow
              return (
                <div className="tooltip-custom">
                  <div className="tooltip-custom__titulo">{row.sector}</div>
                  <div>Proyectos: <strong>{formatNumber(row.projectCount)}</strong></div>
                  <div>Inversión: <strong>{formatMmusd(row.investmentMmusd)}</strong></div>
                  <div>Empleo constr.: <strong>{formatNumber(row.constructionJobs)}</strong></div>
                </div>
              )
            }}
          />
          <Bar
            dataKey="projectCount"
            name="Proyectos"
            radius={[0, 3, 3, 0]}
            onClick={(event) => {
              const row = pickChartRow<SectorProjectRow>(event, 'sector')
              if (row) onSelect(row.sector)
            }}
            style={{ cursor: 'pointer' }}
          >
            {rows.map((row) => (
              <Cell
                key={row.sector}
                fill={selected === row.sector ? CHART_SELECTED : CHART_PRIMARY}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ----------------------------------------------------------------------------
// 3.3 RCA status
// ----------------------------------------------------------------------------

interface RcaProps {
  rows: RcaStatusRow[]
  selected?: string
  onSelect: (status: RcaStatus) => void
}

export function RcaStatusChart({ rows, selected, onSelect }: RcaProps) {
  const total = rows.reduce((sum, row) => sum + row.projectCount, 0)
  const unknown = rows.find((row) => row.rcaStatus === 'unknown')?.projectCount ?? 0
  const unknownShare = total > 0 ? Math.round((unknown / total) * 100) : 0

  const data = rows.map((row) => ({
    ...row,
    label: RCA_STATUS_LABELS[row.rcaStatus] ?? row.rcaStatus,
  }))

  return (
    <ChartCard
      title="Estado RCA de los proyectos"
      hint="Clic en un segmento para filtrar"
      height={320}
      notice={
        unknownShare >= 50 ? (
          <span>
            <strong>{unknownShare}% de los proyectos no tiene Estado RCA registrado.</strong>{' '}
            La columna viene vacía en el Excel de origen; el gráfico se va a poblar solo
            cuando se complete ese dato.
          </span>
        ) : undefined
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="projectCount"
            nameKey="label"
            innerRadius={58}
            outerRadius={92}
            paddingAngle={2}
            onClick={(event) => {
              const row = pickChartRow<RcaStatusRow>(event, 'rcaStatus')
              if (row) onSelect(row.rcaStatus)
            }}
            style={{ cursor: 'pointer' }}
          >
            {data.map((row) => (
              <Cell
                key={row.rcaStatus}
                fill={RCA_STATUS_FILL[row.rcaStatus] ?? '#D9D9D9'}
                stroke={RCA_STATUS_STROKE[row.rcaStatus] ?? '#7F7F7F'}
                strokeWidth={selected === row.rcaStatus ? 3 : 1}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as RcaStatusRow & { label: string }
              const share = total > 0 ? Math.round((row.projectCount / total) * 100) : 0
              return (
                <div className="tooltip-custom">
                  <div className="tooltip-custom__titulo">{row.label}</div>
                  <div>Proyectos: <strong>{formatNumber(row.projectCount)}</strong> ({share}%)</div>
                  <div>Inversión: <strong>{formatMmusd(row.investmentMmusd)}</strong></div>
                </div>
              )
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
