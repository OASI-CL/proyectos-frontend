import { useNavigate } from 'react-router-dom'
import {
  CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Scatter,
  ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from 'recharts'
import { ChartCard } from './ChartCard'
import { pickChartRow } from './chartEvents'
import { CHART_GRID, PROJECT_STATUS_FILL, RCA_STATUS_LABELS } from '../constants'
import { formatDate, formatMmusd, formatNumber, formatText } from '../../../lib/formatters'
import type { TimelineProject } from '../types'

interface Props {
  projects: TimelineProject[]
  totalProjects: number
}

interface Point extends TimelineProject {
  x: number
  y: string
  z: number
}

/**
 * Construction-start timeline (README_dashboard section 4).
 *
 * Each project is a dot placed on its estimated construction start date.
 * Sector lanes on the Y axis keep the dots from piling up, and the bubble
 * size carries the investment. Clicking a dot opens the project's page.
 */
export function ConstructionTimeline({ projects, totalProjects }: Props) {
  const navigate = useNavigate()

  const points: Point[] = projects.map((project) => ({
    ...project,
    x: new Date(`${project.constructionStartOn.slice(0, 10)}T00:00:00`).getTime(),
    y: project.sector ?? 'Sin sector',
    z: project.investmentMmusd ?? 0,
  }))

  const missing = totalProjects - projects.length
  const lanes = [...new Set(points.map((point) => point.y))].sort()

  // Explicit yearly ticks: letting recharts derive them from a time scale
  // produces duplicated tick keys when several projects share a date.
  const yearTicks = (() => {
    if (points.length === 0) return []
    const times = points.map((point) => point.x)
    const firstYear = new Date(Math.min(...times)).getFullYear()
    const lastYear = new Date(Math.max(...times)).getFullYear()
    const ticks: number[] = []
    for (let year = firstYear; year <= lastYear; year++) {
      ticks.push(new Date(year, 0, 1).getTime())
    }
    return ticks
  })()

  if (points.length === 0) {
    return (
      <ChartCard title="Línea de tiempo · inicio de construcción" height={160}>
        <div className="estado-caja">
          <div className="estado-caja__titulo">Sin fechas de inicio de construcción</div>
          <div className="estado-caja__texto">
            Ninguno de los proyectos del universo filtrado tiene fecha estimada de inicio.
          </div>
        </div>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title="Línea de tiempo · inicio de construcción"
      hint="Clic en un punto para abrir la ficha del proyecto"
      height={Math.max(300, lanes.length * 42)}
      notice={
        missing > 0 ? (
          <span>
            {formatNumber(missing)} de {formatNumber(totalProjects)} proyectos no tienen
            fecha estimada de inicio de construcción y no aparecen en esta vista.
          </span>
        ) : undefined
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 24, left: 8, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
          <XAxis
            type="number"
            dataKey="x"
            domain={['dataMin', 'dataMax']}
            scale="time"
            ticks={yearTicks}
            tickFormatter={(value: number) => String(new Date(value).getFullYear())}
          />
          {/* allowDuplicatedCategory={false}: without it recharts pairs the
              Nth point with the Nth category instead of matching by value,
              and only one dot per lane shows up. */}
          <YAxis
            type="category"
            dataKey="y"
            width={160}
            interval={0}
            allowDuplicatedCategory={false}
          />
          <ZAxis type="number" dataKey="z" range={[60, 520]} />

          <ReferenceLine
            x={Date.now()}
            stroke="#CC0000"
            strokeDasharray="4 4"
            label={{ value: 'Hoy', position: 'top', fill: '#CC0000', fontSize: 11 }}
          />

          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const point = payload[0].payload as Point
              return (
                <div className="tooltip-custom" style={{ maxWidth: 320 }}>
                  <div className="tooltip-custom__titulo">{point.name}</div>
                  <div>Empresa: <strong>{formatText(point.companyName)}</strong></div>
                  <div>Sector: <strong>{formatText(point.sector)}</strong></div>
                  <div>Región: <strong>{formatText(point.region)}</strong></div>
                  <div>Inversión: <strong>{formatMmusd(point.investmentMmusd)}</strong></div>
                  <div>Estado: <strong>{formatText(point.projectStatus)}</strong></div>
                  <div>Estado RCA: <strong>{RCA_STATUS_LABELS[point.rcaStatus]}</strong></div>
                  <div>
                    Inicio construcción:{' '}
                    <strong>{formatDate(point.constructionStartOn)}</strong>
                  </div>
                  <div className="texto-tenue texto-sm" style={{ marginTop: 4 }}>
                    {formatNumber(point.pendingPermitCount)} permisos pendientes · clic para
                    ver la ficha
                  </div>
                </div>
              )
            }}
          />

          <Scatter
            data={points}
            onClick={(event) => {
              const point = pickChartRow<Point>(event, 'id')
              if (point) navigate(`/proyectos/${point.id}`)
            }}
            style={{ cursor: 'pointer' }}
          >
            {points.map((point) => (
              <Cell
                key={point.id}
                fill={PROJECT_STATUS_FILL[point.projectStatus ?? ''] ?? '#7F7F7F'}
                fillOpacity={0.75}
                stroke="#25306B"
                strokeWidth={0.5}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
