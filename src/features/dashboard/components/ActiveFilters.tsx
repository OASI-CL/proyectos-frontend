import { PERMIT_STATUS_LABELS, RCA_STATUS_LABELS } from '../constants'
import type { Catalog, PermitTrackingStatus, RcaStatus } from '../types'
import type { DashboardFilters, FilterKey } from '../useDashboardFilters'

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
}

/**
 * Removable chips for the active filters.
 *
 * They matter because filters can also be set by clicking a chart (a sector
 * bar, a donut slice, a region), and those have no visible dropdown — the
 * chips are how the user sees, and undoes, that selection.
 */
export function ActiveFilters({ filters, catalog, setFilter }: Props) {
  const entries = Object.entries(filters) as [FilterKey, string][]
  if (entries.length === 0) return null

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
      default:
        return value
    }
  }

  return (
    <div className="active-filters">
      {entries.map(([key, value]) => (
        <button
          key={key}
          type="button"
          className="chip"
          onClick={() => setFilter(key, null)}
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
