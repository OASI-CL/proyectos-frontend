import {
  Bar, BarChart, Cell, CartesianGrid, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, Treemap, XAxis, YAxis,
} from 'recharts'
import { ChartCard } from './ChartCard'
import { pickChartRow, truncateLabel } from './chartEvents'
import {
  CHART_CURSOR, CHART_GRID, CHART_PRIMARY, CHART_SELECTED,
  RCA_STATUS_FILL, RCA_STATUS_LABELS, RCA_STATUS_STROKE, sectorColor,
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
        <BarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 56 }} barCategoryGap="12%">
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
            maxBarSize={72}
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
  const colors = buildSectorColors(rows.map((row) => row.sector))

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
          isAnimationActive={false}
          content={
            <TreemapCell selected={selected} onSelect={onSelect} colors={colors} />
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
  colors?: Map<string, string>
}

/** Sector colours come from constants.ts (OASI's slide palette), shared with the map. */
function buildSectorColors(sectors: string[]): Map<string, string> {
  return new Map(sectors.map((s) => [s, sectorColor(s)]))
}

/**
 * Custom cell renderer for the sector treemap: solid colour per sector,
 * sector name and % inside when the box is big enough.
 *
 * Text is drawn without opacity and with a thin dark halo
 * (`paintOrder: stroke`). The previous semi-transparent fills blurred the
 * white labels.
 */
function TreemapCell(props: TreemapCellProps) {
  const { x = 0, y = 0, width = 0, height = 0, sector, share = 0, selected, onSelect, colors } = props
  if (!sector) return null

  const isSelected = selected === sector
  const dimmed = selected !== undefined && !isSelected
  const percentLabel = `${Math.round(share * 100)}%`
  const canShowLabel = width > 56 && height > 34
  const canShowPercent = width > 56 && height > 50
  const textStyle = {
    paintOrder: 'stroke' as const,
    stroke: 'rgba(0,0,0,0.35)',
    strokeWidth: 2,
    textRendering: 'geometricPrecision' as const,
  }

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
        fill={colors?.get(sector) ?? CHART_PRIMARY}
        fillOpacity={dimmed ? 0.35 : 1}
        stroke={isSelected ? CHART_SELECTED : '#fff'}
        strokeWidth={isSelected ? 4 : 2}
      />
      {canShowLabel && (
        <text x={x + 8} y={y + 19} fontSize={13} fontWeight={600} fill="#fff" style={textStyle}>
          {truncateLabel(sector, Math.max(8, Math.floor(width / 7.5)))}
        </text>
      )}
      {canShowPercent && (
        <text x={x + 8} y={y + 39} fontSize={17} fontWeight={700} fill="#fff" style={textStyle}>
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
