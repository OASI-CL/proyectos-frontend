import { useAuth } from '../../hooks/useAuth'
import { Cargando, ErrorCaja } from '../../components/Estados'
import { useDashboardFilters } from './useDashboardFilters'
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
import { MonitorProjectsBanner } from './components/MonitorProjectsBanner'
import {
  PermitsByAgencyChart,
  PermitsByRegionChart,
  PermitStatusDonut,
} from './components/PermitCharts'
import { CriticalPermitsBanner } from './components/CriticalPermitsBanner'

/**
 * Monitoring dashboard for investment projects and their permits.
 *
 * One filter state drives everything: summary → projects → timeline →
 * monitoring → permits → agencies → regions → donut → critical permits
 * (README_dashboard section 12). Charts are not isolated; clicking a bar, a
 * slice or a region writes into the same filter state.
 */
export function Dashboard() {
  const { rol, esEmpresa } = useAuth()
  const { filters, setFilter, toggleFilter, clearFilters, queryString, activeCount } =
    useDashboardFilters()

  const { data: catalog } = useCatalog()
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
        clearFilters={clearFilters}
        activeCount={activeCount}
      />

      <ActiveFilters filters={filters} catalog={catalog} setFilter={setFilter} />

      {loading && <Cargando />}
      {error && !loading && <ErrorCaja mensaje={error} onReintentar={reload} />}

      {data && !error && (
        <div className={isRefreshing ? 'is-refreshing' : undefined}>
          <KpiRow kpis={data.kpis} />

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

          <div className="graficos">
            <RcaStatusChart
              rows={data.rcaStatus}
              selected={filters.rcaStatus}
              onSelect={(status) => toggleFilter('rcaStatus', status)}
            />
            <div className="panel">
              <div className="panel__header">
                <h2>Resumen del universo</h2>
              </div>
              <div className="panel__cuerpo">
                <div className="datos">
                  <Fact label="Proyectos" value={data.kpis.projectCount} />
                  <Fact label="Regiones representadas" value={data.projectsByRegion.length} />
                  <Fact label="Sectores representados" value={data.projectsBySector.length} />
                  <Fact
                    label="Con fecha de inicio de construcción"
                    value={data.timeline.length}
                  />
                  <Fact
                    label="Aún no inician construcción"
                    value={data.monitor.upcoming.projectCount + data.monitor.later.projectCount}
                  />
                  <Fact label="Organismos involucrados" value={data.permitsByAgency.length} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-24">
            <ConstructionTimeline
              projects={data.timeline}
              totalProjects={data.kpis.projectCount}
            />
          </div>

          <div className="mt-24">
            <MonitorProjectsBanner
              upcoming={data.monitor.upcoming}
              later={data.monitor.later}
            />
          </div>

          {/* ----------------------------- PERMISOS ---------------------------- */}
          <SectionTitle
            title="Permisos"
            description="Los mismos filtros, aplicados a los permisos de esos proyectos."
          />

          <div className="graficos">
            <PermitsByAgencyChart
              rows={data.permitsByAgency}
              onSelectAgency={(agencyId) => toggleFilter('agencyId', String(agencyId))}
            />
            <div className="columna" style={{ gap: 20 }}>
              <PermitStatusDonut
                rows={data.permitStatus}
                selected={filters.permitStatus}
                onSelect={(status) => toggleFilter('permitStatus', status)}
              />
            </div>
          </div>

          <div className="mt-24">
            <PermitsByRegionChart
              rows={data.permitsByRegion}
              onSelectRegion={(region) => toggleFilter('region', region)}
            />
          </div>

          <div className="mt-24">
            <CriticalPermitsBanner permits={data.criticalPermits} />
          </div>

          {rol === 'organismo_lector' && (
            <div className="alerta alerta--info mt-24">
              Estás viendo solo los permisos de tu organismo.
            </div>
          )}
        </div>
      )}
    </>
  )
}

function Fact({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="dato__etiqueta">{label}</div>
      <div className="dato__valor" style={{ fontSize: 20, fontWeight: 600 }}>
        {value.toLocaleString('es-CL')}
      </div>
    </div>
  )
}
