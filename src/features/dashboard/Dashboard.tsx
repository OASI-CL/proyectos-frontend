import { useAuth } from '../../hooks/useAuth'
import { Cargando, ErrorCaja } from '../../components/Estados'
import { useMemo } from 'react'
import { filterValues, useDashboardFilters, type DashboardFilters } from './useDashboardFilters'
import { useCatalog, useDashboardData } from './useDashboardData'
import { FilterBar } from './components/FilterBar'
import { ActiveFilters } from './components/ActiveFilters'
import { KpiRow } from './components/KpiRow'
import { SectionTitle } from './components/ChartCard'
import {
  ProjectsByRegionChart,
  ProjectsBySectorChart,
  RcaStatusChart,
} from './components/ProjectCharts'
import { ConstructionTimeline } from './components/ConstructionTimeline'
import { ProjectsMap } from './components/ProjectsMap'
import { MonitorProjectsBanner } from './components/MonitorProjectsBanner'
import {
  PermitsByAgencyChart,
  PermitsByRegionChart,
  PermitStatusDonut,
} from './components/PermitCharts'
import { CriticalPermitsBanner } from './components/CriticalPermitsBanner'
import { InterregionalBox } from './components/InterregionalBox'
import { allowedRegions } from '../../lib/regionScope'

/**
 * Monitoring dashboard for investment projects and their permits.
 *
 * One filter state drives everything: summary → projects (region/sector) →
 * timeline+RCA status → monitoring → permits (region+donut) → permits by
 * agency → critical permits (README_dashboard section 12). Charts are not
 * isolated; clicking a bar, a slice or a region writes into the same filter
 * state.
 *
 * Two pairings are purely about page layout, not section boundaries:
 *   - RCA status sits next to the construction timeline (both tall content,
 *     side by side keeps the Proyectos section from being one long column).
 *   - The permit status donut sits next to permits-by-region, matching the
 *     order in README_dashboard section 6 (region first, then agency below).
 */
export function Dashboard() {
  const { rol, esEmpresa, usuario } = useAuth()
  const { data: catalog } = useCatalog()

  // An organismo user only sees its agency (and that agency's ministry): those
  // filters are fixed. A region user is NOT locked to its region anymore: it
  // sees its region + interregional (enforced by the backend), and its region
  // select only offers those two (see lib/regionScope.ts).
  const regionChoices = allowedRegions(rol, usuario?.region)
  const locked = useMemo<DashboardFilters>(() => {
    if (rol === 'organismo' && usuario?.organismoId) {
      const agency = catalog?.agencies.find((a) => a.id === usuario.organismoId)
      return {
        agencyId: String(usuario.organismoId),
        ...(agency ? { ministryId: String(agency.ministryId) } : {}),
      }
    }
    return {}
  }, [rol, usuario, catalog])

  const { filters, setFilter, toggleFilter, clearFilters, queryString, activeCount } =
    useDashboardFilters(locked)
  const { data, loading, isRefreshing, error, reload } = useDashboardData(queryString)

  return (
    <>
      <div className="pagina-header">
        <div className="pagina-header__texto">
          <h1>Dashboard</h1>
          <p className="pagina-header__descripcion">
            {esEmpresa
              ? 'Monitoreo de tus proyectos y sus permisos sectoriales.'
              : 'Monitoreo de proyectos de inversión y sus permisos sectoriales.'}
          </p>
        </div>
      </div>

      <FilterBar
        catalog={catalog}
        filters={filters}
        setFilter={setFilter}
        toggleFilter={toggleFilter}
        clearFilters={clearFilters}
        activeCount={activeCount}
        locked={locked}
        regionChoices={regionChoices}
      />

      <ActiveFilters
        filters={Object.fromEntries(Object.entries(filters).filter(([key]) => !(key in locked)))}
        catalog={catalog}
        setFilter={setFilter}
      />

      {loading && <Cargando />}
      {error && !loading && <ErrorCaja mensaje={error} onReintentar={reload} />}

      {data && !error && (
        <div className={isRefreshing ? 'is-refreshing' : undefined}>
          <KpiRow kpis={data.kpis} />

          {/* Apart from everything else: same for every role, ignores filters */}
          <div className="mt-24">
            <InterregionalBox
              projects={data.interregional?.projects ?? []}
              permits={data.interregional?.permits ?? []}
            />
          </div>

          <div className="mt-24">
            <ProjectsMap
              projects={data.mapProjects ?? []}
              sectors={data.projectsBySector}
              selectedSector={filters.sector}
              onSelectSector={(sector) => toggleFilter('sector', sector)}
              // Zoom to a region only when exactly one is picked; with several,
              // the map stays on all of Chile.
              selectedRegion={filterValues(filters.region).length === 1 ? filters.region : undefined}
            />
          </div>

          {/* ---------------------------- PROYECTOS ---------------------------- */}
          <SectionTitle
            title="Proyectos"
            description="Distribución, estado ambiental y avance temporal del universo filtrado."
          />

          <div className="graficos">
            <ProjectsByRegionChart
              rows={data.projectsByRegion}
              selected={filters.region}
              onSelect={(region) => toggleFilter('region', region)}
            />
            <ProjectsBySectorChart
              rows={data.projectsBySector}
              selected={filters.sector}
              onSelect={(sector) => toggleFilter('sector', sector)}
            />
          </div>

          <div className="graficos mt-24">
            <ConstructionTimeline
              projects={data.timeline}
              totalProjects={data.kpis.projectCount}
            />
            <RcaStatusChart
              rows={data.rcaStatus}
              selected={filters.rcaStatus}
              onSelect={(status) => toggleFilter('rcaStatus', status)}
            />
          </div>

          <div className="mt-24">
            <MonitorProjectsBanner upcoming={data.monitor.upcoming} />
          </div>

          {/* ----------------------------- PERMISOS ---------------------------- */}
          <SectionTitle
            title="Permisos"
            description="Los mismos filtros, aplicados a los permisos de esos proyectos."
          />

          <div className="graficos">
            <PermitsByRegionChart
              rows={data.permitsByRegion}
              onSelectRegion={(region) => toggleFilter('region', region)}
            />
            <PermitStatusDonut
              rows={data.permitStatus}
              selected={filters.permitStatus}
              onSelect={(status) => toggleFilter('permitStatus', status)}
            />
          </div>

          <div className="mt-24">
            <PermitsByAgencyChart
              rows={data.permitsByAgency}
              onSelectAgency={(agencyId) => toggleFilter('agencyId', String(agencyId))}
            />
          </div>

          <div className="mt-24">
            <CriticalPermitsBanner permits={data.criticalPermits} />
          </div>

          {/* The scope is enforced server-side; this just says so out loud, so
              nobody reads a partial number as the national total. */}
          {rol === 'organismo' && (
            <div className="alerta alerta--info mt-24">
              Estás viendo solo los permisos de tu organismo y los proyectos asociados.
            </div>
          )}
          {rol === 'region' && (
            <div className="alerta alerta--info mt-24">
              Estás viendo los proyectos de tu región y los interregionales, de todos los
              organismos. Usa el filtro de región para ver solo uno de los dos.
            </div>
          )}
          {rol === 'empresa' && (
            <div className="alerta alerta--info mt-24">
              Estás viendo solo tus proyectos y sus permisos.
            </div>
          )}
        </div>
      )}
    </>
  )
}
