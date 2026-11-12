import { PERMIT_STATUS_LABELS, RCA_STATUS_LABELS } from '../constants'
import { formatDate } from '../../../lib/formatters'
import type { Catalog, PermitTrackingStatus, RcaStatus } from '../types'
import {
  filterValues,
  joinFilterValues,
  MULTI_VALUE_KEYS,
  type DashboardFilters,
  type FilterKey,
} from '../useDashboardFilters'

interface Props {
  filters: DashboardFilters
  catalog: Catalog | null
  setFilter: (key: FilterKey, value: string | null) => void
}

const FILTER_LABELS: Record<FilterKey, string> = {
  ministryId: 'Ministerio',
  agencyId: 'Organismo',
  sector: 'Sector',
  region: 'Región',
  projectStatus: 'Estado proyecto',
  permitStatus: 'Estado permiso',
  companyId: 'Empresa',
  projectId: 'Proyecto',
  rcaStatus: 'Estado RCA',
  startDateFrom: 'Inicio construcción desde',
  startDateTo: 'Inicio construcción hasta',
}

/**
 * Removable chips for the active filters.
 *
 * They matter because filters can also be set by clicking a chart (a sector
 * bar, a donut slice, a region), and those have no visible dropdown — the
 * chips are how the user sees, and undoes, that selection.
 */
export function ActiveFilters({ filters, catalog, setFilter }: Props) {
  // One chip per picked VALUE (multi-value filters hold several): removing a
  // chip removes just that value, not the whole filter.
  const entries = (Object.entries(filters) as [FilterKey, string][]).flatMap(([key, raw]) =>
    MULTI_VALUE_KEYS.has(key)
      ? filterValues(raw).map((value) => [key, value] as [FilterKey, string])
      : [[key, raw] as [FilterKey, string]],
  )
  if (entries.length === 0) return null

  const remove = (key: FilterKey, value: string) => {
    if (!MULTI_VALUE_KEYS.has(key)) return setFilter(key, null)
    setFilter(key, joinFilterValues(filterValues(filters[key]).filter((v) => v !== value)))
  }

  const describe = (key: FilterKey, value: string): string => {
    switch (key) {
      case 'ministryId':
        return catalog?.ministries.find((m) => String(m.id) === value)?.name ?? value
      case 'agencyId':
        return catalog?.agencies.find((a) => String(a.id) === value)?.name ?? value
      case 'companyId':
        return catalog?.companies.find((c) => String(c.id) === value)?.name ?? value
      case 'projectId': {
        const project = catalog?.projects.find((p) => String(p.id) === value)
        return project?.name ?? value
      }
      case 'permitStatus':
        return PERMIT_STATUS_LABELS[value as PermitTrackingStatus] ?? value
      case 'rcaStatus':
        return RCA_STATUS_LABELS[value as RcaStatus] ?? value
      case 'startDateFrom':
      case 'startDateTo':
        return formatDate(value)
      default:
        return value
    }
  }

  return (
    <div className="active-filters">
      {entries.map(([key, value]) => (
        <button
          key={`${key}:${value}`}
          type="button"
          className="chip"
          onClick={() => remove(key, value)}
          title="Quitar este filtro"
        >
          <span className="chip__key">{FILTER_LABELS[key]}:</span>
          <span className="chip__value">{describe(key, value)}</span>
          <span className="chip__remove" aria-hidden="true">×</span>
        </button>
      ))}
    </div>
  )
}
