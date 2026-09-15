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

export const PERMIT_STATUS_FILL: Record<PermitTrackingStatus, string> = {
  pending: '#FFF5CC',
  overdue: '#F5CCCC',
  resolved: '#CCEBD6',
}

export const PERMIT_STATUS_STROKE: Record<PermitTrackingStatus, string> = {
  pending: '#E0B400',
  overdue: '#CC0000',
  resolved: '#009933',
}

/** Readable text colour on top of each pastel fill. */
export const PERMIT_STATUS_TEXT: Record<PermitTrackingStatus, string> = {
  pending: '#7A5C00',
  overdue: '#8A1A1A',
  resolved: '#0A6B2A',
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

/** Chart palette for neutral categorical series (region, sector). */
export const CHART_PRIMARY = '#006BB9'
export const CHART_SECONDARY = '#6BCCD6'
export const CHART_SELECTED = '#25306B'
export const CHART_GRID = '#E1E6F0'
export const CHART_CURSOR = '#D3DEF2'
