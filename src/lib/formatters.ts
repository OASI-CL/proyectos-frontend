/**
 * Display formatting.
 *
 * Project rule: dates travel as ISO YYYY-MM-DD over the API and are only
 * turned into DD-MM-YYYY here, at render time.
 *
 * UI-facing strings stay in Spanish — the app is used by a Chilean
 * government team.
 */

const EMPTY = '—'

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return EMPTY
  const [year, month, day] = iso.slice(0, 10).split('-')
  if (!year || !month || !day) return EMPTY
  return `${day}-${month}-${year}`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return EMPTY
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return EMPTY
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${formatDate(date.toISOString())} ${hours}:${minutes}`
}

/** `<input type="date">` needs YYYY-MM-DD. */
export function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : ''
}

/** Short month + year, for chart axes. */
export function formatMonthYear(iso: string | null | undefined): string {
  if (!iso) return EMPTY
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return EMPTY
  return date.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })
}

export function formatNumber(
  value: number | null | undefined,
  decimals = 0,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY
  return value.toLocaleString('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** Rounds to thousands/millions so KPI tiles stay readable. */
export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY
  if (Math.abs(value) >= 1_000_000) return `${formatNumber(value / 1_000_000, 1)}M`
  if (Math.abs(value) >= 10_000) return `${formatNumber(value / 1000, 0)}K`
  return formatNumber(value)
}

/** The value already comes in millions of USD. */
export function formatMmusd(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY
  return `US$ ${formatNumber(value, 0)} MM`
}

/** Just the number — for tiles that label the unit separately. */
export function formatMmusdCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY
  return formatNumber(Math.round(value))
}

export function formatDays(value: number | null | undefined): string {
  if (value === null || value === undefined) return EMPTY
  return `${formatNumber(value)} días`
}

export function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return EMPTY
  return value ? 'Sí' : 'No'
}

/** Text, or a dash, so table cells are never blank. */
export function formatText(value: string | null | undefined): string {
  return value && value.trim() !== '' ? value : EMPTY
}

export const SEMAFORO_LABELS: Record<string, string> = {
  en_plazo: 'En plazo',
  en_alerta: 'En alerta',
  critico: 'Crítico',
  finalizado: 'Finalizado',
}

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  oasi: 'Equipo OASI',
  organismo_lector: 'Organismo (lectura)',
  empresa: 'Empresa titular',
}
