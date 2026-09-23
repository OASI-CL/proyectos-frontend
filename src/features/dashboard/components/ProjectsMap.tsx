import 'leaflet/dist/leaflet.css'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleMarker, MapContainer, TileLayer, Tooltip as MapTooltip } from 'react-leaflet'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { pickChartRow, truncateLabel } from './chartEvents'
import { CHART_GRID, SECTOR_NONE_COLOR, sectorColor } from '../constants'
import { formatMmusd, formatNumber, formatText } from '../../../lib/formatters'
import type { MapProject, SectorProjectRow } from '../types'

/**
 * Map of Chile with one dot per project (colour = sector, size = investment)
 * next to a bar chart of investment by sector. Modelled on OASI's Tableau
 * view.
 *
 * The data has no coordinates, only the region. So each dot sits near its
 * region's reference point, shifted by a small fixed offset derived from the
 * project id so that dots don't stack. The offset is the same on every
 * render, so a project never jumps around. The position shows the region,
 * not the exact site. "Interregional" and "Nivel Central" projects have no
 * place on the map and are only counted in the note.
 */

/** Reference point per region: an inland spot roughly in the middle of each. */
const REGION_POINT: Record<string, [number, number]> = {
  'Arica y Parinacota': [-18.6, -69.9],
  'Tarapacá': [-20.2, -69.4],
  'Antofagasta': [-23.4, -69.6],
  'Atacama': [-27.4, -70.1],
  'Coquimbo': [-30.3, -71.0],
  'Valparaíso': [-32.9, -71.1],
  'Metropolitana': [-33.5, -70.7],
  "O'Higgins": [-34.4, -71.0],
  'Maule': [-35.6, -71.5],
  'Ñuble': [-36.6, -72.0],
  'Biobío': [-37.3, -72.4],
  'La Araucanía': [-38.7, -72.4],
  'Los Ríos': [-40.0, -72.6],
  'Los Lagos': [-41.6, -72.9],
  'Aysén': [-45.6, -72.2],
  'Magallanes': [-52.5, -71.5],
}

function hash(n: number, salt: number) {
  const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function positionFor(project: MapProject): [number, number] | null {
  const base = project.region ? REGION_POINT[project.region] : undefined
  if (!base) return null
  // Chile is narrow: spread more north-south than east-west.
  return [base[0] + (hash(project.id, 1) - 0.5) * 1.4, base[1] + (hash(project.id, 2) - 0.5) * 0.9]
}

function radiusFor(investment: number | null) {
  return Math.min(22, 4 + Math.sqrt(Math.max(0, investment ?? 0)) * 0.3)
}

interface Props {
  projects: MapProject[]
  sectors: SectorProjectRow[]
  selectedSector?: string
  onSelectSector: (sector: string) => void
}

export function ProjectsMap({ projects, sectors, selectedSector, onSelectSector }: Props) {
  const navigate = useNavigate()

  const placed = useMemo(
    () =>
      projects
        .map((p) => ({ ...p, pos: positionFor(p) }))
        .filter((p): p is MapProject & { pos: [number, number] } => p.pos !== null)
        // Big bubbles first, so the small ones are drawn on top and stay clickable.
        .sort((a, b) => (b.investmentMmusd ?? 0) - (a.investmentMmusd ?? 0)),
    [projects],
  )
  const unplaced = projects.length - placed.length

  const bars = [...sectors]
    .map((s) => ({ ...s, investmentMmusd: Number(s.investmentMmusd) }))
    .sort((a, b) => a.investmentMmusd - b.investmentMmusd)

  return (
    <div className="panel">
      <div className="panel__header">
        <h2>Proyectos por sector e inversión</h2>
        <span className="texto-sm texto-suave">
          Clic en una barra para filtrar el sector. Clic en un punto para abrir el proyecto
        </span>
      </div>
      <div className="panel__cuerpo">
        <div className="mapa-sector">
          <div className="mapa-sector__izq">
            <div className="mapa-sector__titulo">Inversión por sector (MMUSD)</div>
            <div style={{ height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bars} margin={{ top: 22, right: 8, left: 0, bottom: 40 }} barCategoryGap="12%">
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                  <XAxis
                    dataKey="sector"
                    interval={0}
                    angle={-38}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => truncateLabel(v, 16)}
                  />
                  <YAxis tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}K` : String(v))} width={40} />
                  <Tooltip
                    cursor={{ fill: '#EEF2F8' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const row = payload[0].payload as SectorProjectRow
                      return (
                        <div className="tooltip-custom">
                          <div className="tooltip-custom__titulo">{row.sector}</div>
                          <div>Inversión: <strong>{formatMmusd(row.investmentMmusd)}</strong></div>
                          <div>Proyectos: <strong>{formatNumber(row.projectCount)}</strong></div>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="investmentMmusd"
                    maxBarSize={72}
                    style={{ cursor: 'pointer' }}
                    onClick={(event) => {
                      const row = pickChartRow<SectorProjectRow>(event, 'sector')
                      if (row) onSelectSector(row.sector)
                    }}
                  >
                    {bars.map((row) => (
                      <Cell
                        key={row.sector}
                        fill={sectorColor(row.sector)}
                        fillOpacity={selectedSector && selectedSector !== row.sector ? 0.35 : 1}
                      />
                    ))}
                    <LabelList
                      dataKey="investmentMmusd"
                      position="top"
                      fontSize={11}
                      formatter={(v: unknown) => formatNumber(Math.round(Number(v)))}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mapa-sector__mapa">
            <MapContainer
              center={[-36.5, -71]}
              zoom={4}
              minZoom={3}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%', borderRadius: 6 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {placed.map((p) => (
                <CircleMarker
                  key={p.id}
                  center={p.pos}
                  radius={radiusFor(p.investmentMmusd)}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 1,
                    fillColor: sectorColor(p.sector),
                    fillOpacity: selectedSector && selectedSector !== (p.sector ?? 'Sin sector') ? 0.2 : 0.85,
                  }}
                  eventHandlers={{ click: () => navigate(`/proyectos/${p.id}`) }}
                >
                  <MapTooltip>
                    <strong>{p.name}</strong>
                    <br />
                    {formatText(p.sector)} · {formatText(p.region)}
                    <br />
                    Inversión: {formatMmusd(p.investmentMmusd)}
                    <br />
                    {formatText(p.projectStatus)}
                  </MapTooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="mapa-sector__leyenda texto-sm">
          {[...new Set(projects.map((p) => p.sector ?? 'Sin sector'))].sort().map((s) => (
            <span key={s}>
              <i style={{ background: s === 'Sin sector' ? SECTOR_NONE_COLOR : sectorColor(s) }} />
              {s}
            </span>
          ))}
        </div>
        <div className="texto-sm texto-tenue" style={{ marginTop: 6 }}>
          El tamaño del punto representa la inversión. La ubicación es aproximada dentro de la región
          (los datos no traen coordenadas).
          {unplaced > 0 && ` ${formatNumber(unplaced)} proyecto(s) interregionales, de nivel central o sin región no aparecen en el mapa.`}
        </div>
      </div>
    </div>
  )
}
