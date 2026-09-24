import { IconoFiltro } from '../../../components/Iconos'
import { PERMIT_STATUS_LABELS, PERMIT_STATUS_ORDER, RCA_STATUS_LABELS, RCA_STATUS_ORDER } from '../constants'
import type { Catalog } from '../types'
import type { DashboardFilters, FilterKey } from '../useDashboardFilters'
import { useFilterOptions } from '../useDashboardData'

interface Props {
  catalog: Catalog | null
  filters: DashboardFilters
  setFilter: (key: FilterKey, value: string | null) => void
  clearFilters: () => void
  activeCount: number
  /** Filters fixed by the user's scope: shown disabled, with a lock. */
  locked?: DashboardFilters
}

/**
 * Global filter bar. Every control writes into the shared filter state, so a
 * change here recomputes the whole dashboard at once.
 *
 * The options of each dropdown are narrowed by the other active filters
 * (see useFilterOptions).
 */
export function FilterBar({ catalog, filters, setFilter, clearFilters, activeCount, locked = {} }: Props) {
  const options = useFilterOptions(catalog, filters)
  const isLocked = (key: FilterKey) => key in locked

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
        <div className="filtros">
          <Select
            id="f-ministry"
            label="Ministerio"
            value={filters.ministryId ?? ''}
            onChange={(value) => setFilter('ministryId', value)}
            placeholder="Todos"
            options={options.ministries.map((m) => ({ value: String(m.id), label: m.name }))}
            locked={isLocked('ministryId')}
          />

          <Select
            id="f-agency"
            label="Organismo"
            value={filters.agencyId ?? ''}
            onChange={(value) => setFilter('agencyId', value)}
            placeholder="Todos"
            options={options.agencies.map((a) => ({ value: String(a.id), label: a.name }))}
            locked={isLocked('agencyId')}
          />

          <Select
            id="f-region"
            label="Región"
            value={filters.region ?? ''}
            onChange={(value) => setFilter('region', value)}
            placeholder="Todas"
            options={options.regions.map((r) => ({ value: r, label: r }))}
            locked={isLocked('region')}
          />

          <Select
            id="f-sector"
            label="Sector"
            value={filters.sector ?? ''}
            onChange={(value) => setFilter('sector', value)}
            placeholder="Todos"
            options={options.sectors.map((s) => ({ value: s, label: s }))}
          />

          <Select
            id="f-project-status"
            label="Estado del proyecto"
            value={filters.projectStatus ?? ''}
            onChange={(value) => setFilter('projectStatus', value)}
            placeholder="Todos"
            options={options.projectStatuses.map((s) => ({ value: s, label: s }))}
          />

          <Select
            id="f-permit-status"
            label="Estado del permiso"
            value={filters.permitStatus ?? ''}
            onChange={(value) => setFilter('permitStatus', value)}
            placeholder="Todos"
            options={PERMIT_STATUS_ORDER.map((status) => ({
              value: status,
              label: PERMIT_STATUS_LABELS[status],
            }))}
          />

          <Select
            id="f-company"
            label="Empresa"
            value={filters.companyId ?? ''}
            onChange={(value) => setFilter('companyId', value)}
            placeholder="Todas"
            options={options.companies.map((c) => ({ value: String(c.id), label: c.name }))}
          />

          <Select
            id="f-project"
            label={`Proyecto${options.projects.length ? ` (${options.projects.length})` : ''}`}
            value={filters.projectId ?? ''}
            onChange={(value) => setFilter('projectId', value)}
            placeholder="Todos"
            options={options.projects.map((p) => ({
              value: String(p.id),
              label: p.idExcel ? `${p.idExcel} - ${p.name}` : p.name,
            }))}
          />

          <Select
            id="f-rca"
            label="Estado RCA"
            value={filters.rcaStatus ?? ''}
            onChange={(value) => setFilter('rcaStatus', value)}
            placeholder="Todos"
            options={RCA_STATUS_ORDER.map((status) => ({
              value: status,
              label: RCA_STATUS_LABELS[status],
            }))}
          />

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

interface SelectProps {
  id: string
  label: string
  value: string
  placeholder: string
  options: { value: string; label: string }[]
  onChange: (value: string | null) => void
  locked?: boolean
}

function Select({ id, label, value, placeholder, options, onChange, locked }: SelectProps) {
  // A locked value may not be among the narrowed options; keep it visible anyway.
  const shown = locked && value && !options.some((o) => o.value === value)
    ? [...options, { value, label: value }]
    : options
  return (
    <div className="campo">
      <label className="campo__label" htmlFor={id}>
        {label}
        {locked && <span className="texto-tenue" title="Fijo según tu cuenta"> 🔒</span>}
      </label>
      <select
        id={id}
        className="select"
        value={value}
        disabled={locked}
        title={locked ? 'Fijo según tu cuenta' : undefined}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">{placeholder}</option>
        {shown.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
