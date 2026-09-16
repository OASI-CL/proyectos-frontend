import {
  Bar, BarChart, Cell, CartesianGrid, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, Treemap, XAxis, YAxis,
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

/**
 * Treemap: each sector is a rectangle sized proportionally to its share of
 * projects, with the % printed inside — the "Tableau-style" square chart
 * with areas, as opposed to a bar chart.
 */
export function ProjectsBySectorChart({ rows, selected, onSelect }: SectorProps) {
  const total = rows.reduce((sum, row) => sum + row.projectCount, 0)

  const data = rows.map((row) => ({
    ...row,
    name: row.sector,
    value: row.projectCount,
    share: total > 0 ? row.projectCount / total : 0,
  }))

  return (
    <ChartCard
      title="Proyectos por sector"
      hint="Clic en un área para filtrar"
      height={PROJECT_CHART_HEIGHT}
    >
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="value"
          nameKey="sector"
          stroke="#fff"
          fill={CHART_PRIMARY}
          animationDuration={200}
          content={
            <TreemapCell selected={selected} onSelect={onSelect} />
          }
        >
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as (typeof data)[number]
              if (!row?.sector) return null
              return (
                <div className="tooltip-custom">
                  <div className="tooltip-custom__titulo">{row.sector}</div>
                  <div>Proyectos: <strong>{formatNumber(row.projectCount)}</strong> ({Math.round(row.share * 100)}%)</div>
                  <div>Inversión: <strong>{formatMmusd(row.investmentMmusd)}</strong></div>
                  <div>Empleo constr.: <strong>{formatNumber(row.constructionJobs)}</strong></div>
                </div>
              )
            }}
          />
        </Treemap>
      </ResponsiveContainer>
    </ChartCard>
  )
}

interface TreemapCellProps {
  x?: number
  y?: number
  width?: number
  height?: number
  index?: number
  sector?: string
  share?: number
  selected?: string
  onSelect?: (sector: string) => void
}

/**
 * Custom cell renderer for the sector treemap.
 *
 * Recharts' Treemap has no built-in "percentage inside the box" label, and
 * its default colouring is a rainbow unrelated to the institutional palette
 * — this renders each rectangle in the same blue as the rest of the
 * dashboard (darker for bigger sectors, so the size differences still read
 * even on same-hue boxes), with the sector name and % printed inside when
 * the box is big enough to hold them.
 */
function TreemapCell(props: TreemapCellProps) {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, sector, share = 0, selected, onSelect } = props
  if (!sector) return null

  const isSelected = selected === sector
  // Darker blue for the largest boxes, lighter for the smallest — a subtle
  // depth cue since every cell shares the same hue.
  const opacity = Math.max(0.45, 1 - index * 0.09)
  const fill = isSelected ? CHART_SELECTED : CHART_PRIMARY
  const percentLabel = `${Math.round(share * 100)}%`
  const canShowLabel = width > 56 && height > 34
  const canShowPercent = width > 56 && height > 50

  return (
    <g
      onClick={() => onSelect?.(sector)}
      style={{ cursor: onSelect ? 'pointer' : undefined }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={isSelected ? 1 : opacity}
        stroke="#fff"
        strokeWidth={2}
      />
      {canShowLabel && (
        <text
          x={x + 8}
          y={y + 18}
          fontSize={12}
          fontWeight={600}
          fill="#fff"
        >
          {truncateLabel(sector, Math.max(8, Math.floor(width / 7)))}
        </text>
      )}
      {canShowPercent && (
        <text x={x + 8} y={y + 36} fontSize={16} fontWeight={700} fill="#fff">
          {percentLabel}
        </text>
      )}
    </g>
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
