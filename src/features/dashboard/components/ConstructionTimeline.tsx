import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CartesianGrid, Cell, ComposedChart, ReferenceLine, ResponsiveContainer,
  Scatter, Tooltip, XAxis, YAxis, ZAxis,
} from 'recharts'
import { ChartCard } from './ChartCard'
import { pickChartRow } from './chartEvents'
import { AXIS_TICK, CHART_GRID, PROJECT_STATUS_FILL, RCA_STATUS_LABELS } from '../constants'
import { formatDate, formatMmusd, formatNumber, formatText } from '../../../lib/formatters'
import type { TimelineProject } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000
const YEAR_MS = 365 * DAY_MS
const NAV_HEIGHT = 44

interface Props {
  projects: TimelineProject[]
  totalProjects: number
}

interface Point extends TimelineProject {
  x: number
  y: string
  z: number
}

/** Yearly ticks for a given time range — avoids the duplicated-tick-key
 * warning that comes from letting recharts derive ticks from a time scale
 * when several points share a date. */
function yearTicksFor(minTime: number, maxTime: number): number[] {
  const firstYear = new Date(minTime).getFullYear()
  const lastYear = new Date(maxTime).getFullYear()
  const ticks: number[] = []
  for (let year = firstYear; year <= lastYear; year++) {
    ticks.push(new Date(year, 0, 1).getTime())
  }
  return ticks
}

/**
 * Construction-start timeline (README_dashboard section 4).
 *
 * Each project is a dot placed on its estimated construction start date.
 * Sector lanes on the Y axis keep the dots from piling up, and the bubble
 * size carries the investment. Clicking a dot opens the project's page.
 *
 * Navigation is explicit buttons under the chart: ◀ ▶ move half a window,
 * + − zoom around the centre, a scroll bar drags the window, "Ver todo"
 * resets. It replaced recharts' Brush, whose thin handles users found hard to
 * grab. The window is kept as a time range and passed as the X-axis domain.
 */
export function ConstructionTimeline({ projects, totalProjects }: Props) {
  const navigate = useNavigate()

  const points: Point[] = useMemo(
    () =>
      projects
        .map((project) => ({
          ...project,
          x: new Date(`${project.constructionStartOn.slice(0, 10)}T00:00:00`).getTime(),
          y: project.sector ?? 'Sin sector',
          z: project.investmentMmusd ?? 0,
        }))
        .sort((a, b) => a.x - b.x),
    [projects],
  )

  // Full extent, padded to whole years so the edge dots aren't cut in half.
  const fullMin = points.length ? new Date(new Date(points[0].x).getFullYear(), 0, 1).getTime() : 0
  const fullMax = points.length
    ? new Date(new Date(points[points.length - 1].x).getFullYear() + 1, 0, 1).getTime()
    : 0
  const fullSpan = Math.max(fullMax - fullMin, 1)

  const [view, setView] = useState<[number, number]>([fullMin, fullMax])

  // Reset the zoom whenever the filtered project set changes underneath it.
  useEffect(() => {
    setView([fullMin, fullMax])
  }, [fullMin, fullMax])

  const [visibleMin, visibleMax] = view
  const span = visibleMax - visibleMin
  const zoomed = span < fullSpan - 1

  /** Moves the window keeping its width, never past the data. */
  const moveTo = (start: number) => {
    const clamped = Math.min(Math.max(start, fullMin), fullMax - span)
    setView([clamped, clamped + span])
  }
  const pan = (direction: -1 | 1) => moveTo(visibleMin + direction * span * 0.5)
  const zoom = (factor: number) => {
    const center = (visibleMin + visibleMax) / 2
    const next = Math.min(fullSpan, Math.max(YEAR_MS, span * factor))
    const start = Math.min(Math.max(center - next / 2, fullMin), fullMax - next)
    setView([start, start + next])
  }

  const missing = totalProjects - projects.length
  const lanes = [...new Set(points.map((point) => point.y))].sort()
  const yearTicks = points.length > 0 ? yearTicksFor(visibleMin, visibleMax) : []

  if (points.length === 0) {
    return (
      <ChartCard title="Línea de tiempo de inicio de construcción" height={160}>
        <div className="estado-caja">
          <div className="estado-caja__titulo">Sin fechas de inicio de construcción</div>
          <div className="estado-caja__texto">
            Ninguno de los proyectos del universo filtrado tiene fecha estimada de inicio.
          </div>
        </div>
      </ChartCard>
    )
  }

  const chartAreaHeight = Math.max(300, lanes.length * 42)
  const captionHeight = 26

  return (
    <ChartCard
      title="Línea de tiempo de inicio de construcción"
      hint="Clic en un punto para abrir la ficha. Usá + / − para acercar y ◀ ▶ para moverte"
      height={chartAreaHeight + captionHeight + NAV_HEIGHT}
      notice={
        missing > 0 ? (
          <span>
            {formatNumber(missing)} de {formatNumber(totalProjects)} proyectos no tienen
            fecha estimada de inicio de construcción y no aparecen en esta vista.
          </span>
        ) : undefined
      }
    >
      <div
        className="texto-sm texto-tenue"
        style={{ height: captionHeight, marginBottom: 4 }}
      >
        El tamaño de cada punto representa la inversión del proyecto (MMUSD): a mayor
        inversión, más grande el punto.
      </div>
      <ResponsiveContainer width="100%" height={chartAreaHeight}>
        <ComposedChart data={points} margin={{ top: 12, right: 24, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[visibleMin, visibleMax]}
            allowDataOverflow
            scale="time"
            ticks={yearTicks}
            tick={AXIS_TICK}
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
            tick={AXIS_TICK}
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
                    {formatNumber(point.pendingPermitCount)} permisos pendientes, clic para
                    ver la ficha
                  </div>
                </div>
              )
            }}
          />

          <Scatter
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

        </ComposedChart>
      </ResponsiveContainer>

      <div className="timeline-nav">
        <button type="button" className="btn btn--sm btn--secundario" onClick={() => pan(-1)}
          disabled={visibleMin <= fullMin} aria-label="Mover hacia atrás" title="Mover hacia atrás">
          ◀
        </button>
        <input
          type="range"
          className="timeline-nav__barra"
          min={fullMin}
          max={Math.max(fullMax - span, fullMin)}
          step={DAY_MS}
          value={visibleMin}
          disabled={!zoomed}
          onChange={(event) => moveTo(Number(event.target.value))}
          aria-label="Desplazar la línea de tiempo"
        />
        <button type="button" className="btn btn--sm btn--secundario" onClick={() => pan(1)}
          disabled={visibleMax >= fullMax} aria-label="Mover hacia adelante" title="Mover hacia adelante">
          ▶
        </button>
        <span className="timeline-nav__sep" />
        <button type="button" className="btn btn--sm btn--secundario" onClick={() => zoom(0.5)}
          disabled={span <= YEAR_MS} title="Acercar">
          +
        </button>
        <button type="button" className="btn btn--sm btn--secundario" onClick={() => zoom(2)}
          disabled={!zoomed} title="Alejar">
          −
        </button>
        <button type="button" className="btn btn--sm btn--texto" onClick={() => setView([fullMin, fullMax])}
          disabled={!zoomed}>
          Ver todo
        </button>
        <span className="texto-sm texto-suave" style={{ marginLeft: 'auto' }}>
          {formatDate(new Date(visibleMin).toISOString())} – {formatDate(new Date(visibleMax).toISOString())}
        </span>
      </div>
    </ChartCard>
  )
}
