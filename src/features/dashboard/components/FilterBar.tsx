import { IconoFiltro } from '../../../components/Iconos'
import { PERMIT_STATUS_LABELS, PERMIT_STATUS_ORDER, RCA_STATUS_LABELS, RCA_STATUS_ORDER } from '../constants'
import type { Catalog } from '../types'
import { filterValues, type DashboardFilters, type FilterKey } from '../useDashboardFilters'
import { useFilterOptions } from '../useDashboardData'
import { allRegionsLabel } from '../../../lib/regionScope'
import { MultiSelect, type MultiSelectOption } from './MultiSelect'

interface Props {
  catalog: Catalog | null
  filters: DashboardFilters
  setFilter: (key: FilterKey, value: string | null) => void
  /** Adds/removes one value of a filter, against the latest state. */
  toggleFilter: (key: FilterKey, value: string) => void
  clearFilters: () => void
  activeCount: number
  /** Filters fixed by the user's scope: shown disabled, with a lock. */
  locked?: DashboardFilters
  /** Only these regions can be picked (region accounts: own + interregional); null = all. */
  regionChoices?: string[] | null
}

/**
 * Global filter bar. Every control writes into the shared filter state, so a
 * change here recomputes the whole dashboard at once.
 *
 * Every filter except the dates takes SEVERAL values (checkbox dropdowns):
 * values of the same filter are OR'ed, different filters are AND'ed — e.g.
 * agency CMN or SAG, in region Interregional.
 *
 * The options of each dropdown are narrowed by the other active filters
 * (see useFilterOptions).
 */
export function FilterBar({ catalog, filters, setFilter, toggleFilter, clearFilters, activeCount, locked = {}, regionChoices = null }: Props) {
  const options = useFilterOptions(catalog, filters)
  const isLocked = (key: FilterKey) => key in locked

  /** One multi-value filter, wired to the shared filter state. */
  const multi = (key: FilterKey, label: string, placeholder: string, opts: MultiSelectOption[]) => (
    <MultiSelect
      label={label}
      values={filterValues(filters[key])}
      options={opts}
      placeholder={placeholder}
      onToggle={(value) => toggleFilter(key, value)}
      onClear={() => setFilter(key, null)}
      locked={isLocked(key)}
    />
  )
  const plain = (values: string[]) => values.map((v) => ({ value: v, label: v }))

  return (
    <div className="panel filter-bar">
      <div className="panel__header">
        <h2 className="fila" style={{ gap: 8 }}>
          <IconoFiltro /> Filtros
        </h2>
        <div className="fila" style={{ gap: 10 }}>
          {activeCount > 0 && (
            <span className="texto-sm texto-suave">
              {activeCount} {activeCount === 1 ? 'filtro activo' : 'filtros activos'}
            </span>
          )}
          <button
            type="button"
            className="btn btn--sm btn--secundario"
            onClick={clearFilters}
            disabled={activeCount === 0}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="panel__cuerpo">
        <div className="texto-sm texto-tenue" style={{ marginBottom: 10 }}>
          Puedes marcar varias opciones en cada filtro.
        </div>
        <div className="filtros">
          {multi('ministryId', 'Ministerio', 'Todos',
            options.ministries.map((m) => ({ value: String(m.id), label: m.name })))}

          {multi('agencyId', 'Organismo', 'Todos',
            options.agencies.map((a) => ({ value: String(a.id), label: a.name })))}

          {multi('region', 'Región', allRegionsLabel(regionChoices), plain(regionChoices ?? options.regions))}

          {multi('sector', 'Sector', 'Todos', plain(options.sectors))}

          {multi('projectStatus', 'Estado del proyecto', 'Todos', plain(options.projectStatuses))}

          {multi('permitStatus', 'Estado del permiso', 'Todos',
            PERMIT_STATUS_ORDER.map((status) => ({ value: status, label: PERMIT_STATUS_LABELS[status] })))}

          {multi('companyId', 'Empresa', 'Todas',
            options.companies.map((c) => ({ value: String(c.id), label: c.name })))}

          {multi('projectId', `Proyecto${options.projects.length ? ` (${options.projects.length})` : ''}`, 'Todos',
            options.projects.map((p) => ({
              value: String(p.id),
              label: p.idExcel ? `${p.idExcel} - ${p.name}` : p.name,
            })))}

          {multi('rcaStatus', 'Estado RCA', 'Todos',
            RCA_STATUS_ORDER.map((status) => ({ value: status, label: RCA_STATUS_LABELS[status] })))}

          <div className="campo">
            <label className="campo__label" htmlFor="f-start-from">
              Inicio de construcción desde
            </label>
            <input
              id="f-start-from"
              className="input"
              type="date"
              value={filters.startDateFrom ?? ''}
              max={filters.startDateTo ?? undefined}
              onChange={(event) => setFilter('startDateFrom', event.target.value || null)}
            />
          </div>

          <div className="campo">
            <label className="campo__label" htmlFor="f-start-to">
              Inicio de construcción hasta
            </label>
            <input
              id="f-start-to"
              className="input"
              type="date"
              value={filters.startDateTo ?? ''}
              min={filters.startDateFrom ?? undefined}
              onChange={(event) => setFilter('startDateTo', event.target.value || null)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
