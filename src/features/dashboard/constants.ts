import type { PermitTrackingStatus, RcaStatus } from './types'

/**
 * The three permit states, used consistently across every permit
 * visualisation (README_dashboard section 7).
 *
 * Colours are the pastel tones from the institutional palette, with the
 * stronger tone as a stroke so light fills still read against white.
 */
export const PERMIT_STATUS_ORDER: PermitTrackingStatus[] = [
  'pending',
  'overdue',
  'resolved',
]

export const PERMIT_STATUS_LABELS: Record<PermitTrackingStatus, string> = {
  pending: 'Pendiente',
  overdue: 'Pendiente atrasado',
  resolved: 'Resuelto',
}

// Strong, solid colours — went back and forth with pastel a couple of times;
// this is the one that stuck. No border on the shapes (see `statusBars` and
// the donut's Cell below): the "seleccionado" outline is the only border.
export const PERMIT_STATUS_FILL: Record<PermitTrackingStatus, string> = {
  pending: '#FFC93C',
  overdue: '#E8555A',
  resolved: '#3FB878',
}

export const PERMIT_STATUS_STROKE: Record<PermitTrackingStatus, string> = {
  pending: '#B87F00',
  overdue: '#A61E22',
  resolved: '#1E7A47',
}

/** Readable text colour on top of each solid fill. */
export const PERMIT_STATUS_TEXT: Record<PermitTrackingStatus, string> = {
  pending: '#5C4400',
  overdue: '#FFFFFF',
  resolved: '#FFFFFF',
}

// --- RCA status ---------------------------------------------------------------
//
// NOTE: `proyectos.estado_ambiental` is empty for 314 of the 317 projects in
// the source spreadsheet, so almost every project lands on 'unknown' until
// the team fills that column in.

export const RCA_STATUS_ORDER: RcaStatus[] = [
  'approved',
  'in_review',
  'suspended',
  'other',
  'unknown',
]

export const RCA_STATUS_LABELS: Record<RcaStatus, string> = {
  approved: 'RCA aprobada',
  in_review: 'En trámite',
  suspended: 'Suspendida',
  other: 'Otro estado',
  unknown: 'Sin información',
}

export const RCA_STATUS_FILL: Record<RcaStatus, string> = {
  approved: '#CCEBD6',
  in_review: '#FFF5CC',
  suspended: '#F5CCCC',
  other: '#D3DEF2',
  unknown: '#D9D9D9',
}

export const RCA_STATUS_STROKE: Record<RcaStatus, string> = {
  approved: '#009933',
  in_review: '#E0B400',
  suspended: '#CC0000',
  other: '#006BB9',
  unknown: '#7F7F7F',
}

// --- Project status (proyectos.etapa) ------------------------------------------

export const PROJECT_STATUS_FILL: Record<string, string> = {
  'No se ha iniciado': '#006BB9',
  'En fase de construcción': '#6BCCD6',
  'En operación': '#25306B',
}

// --- Sector colours ------------------------------------------------------------
//
// From OASI's "mesas sectoriales" slide (Minería orange, Energía green,
// Infraestructura grey, Pesca blue, Inmobiliario red, Comercio pink, Data
// Centers purple, Forestal light green). Sectors that are not on the slide
// got a colour in the same bright style. "Sin sector" is a light grey, lighter
// than Infraestructura so the two don't get confused.

export const SECTOR_COLORS: Record<string, string> = {
  'Minería': '#FF8C1A',
  'Energía': '#2DB84C',
  'Infraestructura / Obras públicas': '#808080',
  'Pesca y Acuicultura': '#1565C0',
  'Inmobiliario': '#FF2D55',
  'Comercio': '#E889AE',
  'Data Centers': '#9B30F5',
  'Forestal': '#8CCB45',
  'Industria': '#6A1B9A',
  'Instalaciones fabriles varias': '#3F51B5',
  'Agropecuario': '#F2B705',
  'Saneamiento Ambiental': '#00ACC1',
  'Otro': '#E889AE',
}

export const SECTOR_NONE_COLOR = '#C8C8C8'
const SECTOR_FALLBACK = ['#FF6F61', '#00B894', '#FDCB6E', '#6C5CE7', '#E17055']

export function sectorColor(sector: string | null | undefined): string {
  if (!sector || sector === 'Sin sector') return SECTOR_NONE_COLOR
  const known = SECTOR_COLORS[sector]
  if (known) return known
  // A sector added later to the catalog still gets a bright colour.
  let hash = 0
  for (const ch of sector) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return SECTOR_FALLBACK[hash % SECTOR_FALLBACK.length]
}

/**
 * Same tick label on every chart's axis (size, family, colour) — pass to
 * every `<XAxis tick={AXIS_TICK} />` / `<YAxis tick={AXIS_TICK} />`. Relying
 * on the `.recharts-cartesian-axis-tick text` CSS rule alone left a couple
 * of axes inheriting a different size when a chart set its own `tick` prop
 * with a slightly different value; passing the same object everywhere
 * removes the discrepancy instead of hoping the cascade lines up.
 */
export const AXIS_TICK = { fontSize: 11, fontFamily: 'inherit', fill: '#646464' }

/** Chart palette for neutral categorical series (region, sector). */
export const CHART_PRIMARY = '#006BB9'
export const CHART_SECONDARY = '#6BCCD6'
export const CHART_SELECTED = '#25306B'
export const CHART_GRID = '#E1E6F0'
export const CHART_CURSOR = '#D3DEF2'
