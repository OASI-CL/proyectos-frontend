import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, mensajeError } from '../../lib/api'
import type { Catalog, DashboardData } from './types'
import { filterValues, type DashboardFilters } from './useDashboardFilters'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * Fetches the dashboard payload for the current filter set.
 *
 * `isRefreshing` is kept separate from `loading` so changing a filter does
 * not blank out the whole page: the previous numbers stay on screen, dimmed,
 * while the new universe loads.
 */
export function useDashboardData(queryString: string) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const hasLoadedOnce = useRef(false)

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false

    if (hasLoadedOnce.current) setIsRefreshing(true)
    else setLoading(true)
    setError(null)

    api
      .get<DashboardData>(`/dashboard${queryString ? `?${queryString}` : ''}`)
      .then((response) => {
        if (cancelled) return
        setData(response.data)
        hasLoadedOnce.current = true
      })
      .catch((err) => {
        if (!cancelled) setError(mensajeError(err))
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
        setIsRefreshing(false)
      })

    return () => {
      cancelled = true
    }
  }, [queryString, reloadToken])

  return { data, loading, isRefreshing, error, reload }
}

/** Catalog for the filter bar. Fetched once — it barely changes. */
export function useCatalog(): AsyncState<Catalog> {
  const [data, setData] = useState<Catalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    api
      .get<Catalog>('/catalog')
      .then((response) => {
        if (!cancelled) setData(response.data)
      })
      .catch((err) => {
        if (!cancelled) setError(mensajeError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  return { data, loading, error, reload }
}

/**
 * Narrows each dropdown's options to what the other filters allow
 * (README_dashboard section 1: the filters are dependent on each other).
 *
 * Derived in the browser from the catalog: picking a ministry narrows the
 * agency list, picking a company or sector narrows the project list, and so
 * on. Doing it locally keeps the filter bar instant.
 */
export function useFilterOptions(catalog: Catalog | null, filters: DashboardFilters) {
  return useMemo(() => {
    if (!catalog) {
      return {
        ministries: [],
        agencies: [],
        companies: [],
        sectors: [],
        regions: [],
        projectStatuses: [],
        projects: [],
      }
    }

    // Every filter can hold several values: a project passes a filter when it
    // matches ANY of its values (an empty filter lets everything through).
    const ids = (value: string | undefined) => new Set(filterValues(value).map(Number))
    const names = (value: string | undefined) => new Set(filterValues(value))
    const ministryIds = ids(filters.ministryId)
    const agencyIds = ids(filters.agencyId)
    const companyIds = ids(filters.companyId)
    const sectors = names(filters.sector)
    const regions = names(filters.region)
    const projectStatuses = names(filters.projectStatus)
    const rcaStatuses = names(filters.rcaStatus)
    const passes = (set: Set<string | number>, value: string | number | null) =>
      set.size === 0 || (value !== null && set.has(value))

    // Agencies belonging to the selected ministries.
    const agenciesOfMinistries = ministryIds.size
      ? catalog.agencies.filter((a) => ministryIds.has(a.ministryId))
      : catalog.agencies
    const allowedAgencyIds = new Set(agenciesOfMinistries.map((a) => a.id))

    type Dimension = 'ministry' | 'agency' | 'company' | 'sector' | 'region' | 'projectStatus' | 'rca'

    /**
     * Projects that pass every filter EXCEPT `skip`. Each dropdown is built
     * from this with its own filter skipped: otherwise, once you pick a region,
     * the region list would only show that region and you could never add a
     * second one.
     */
    const projectsExcept = (skip?: Dimension) =>
      catalog.projects.filter((project) => {
        if (skip !== 'company' && !passes(companyIds, project.companyId)) return false
        if (skip !== 'sector' && !passes(sectors, project.sector)) return false
        if (skip !== 'region' && !passes(regions, project.region)) return false
        if (skip !== 'projectStatus' && !passes(projectStatuses, project.projectStatus)) return false
        if (skip !== 'rca' && !passes(rcaStatuses, project.rcaStatus)) return false
        if (skip !== 'agency' && agencyIds.size && !project.agencyIds.some((id) => agencyIds.has(id))) return false
        if (skip !== 'ministry' && ministryIds.size && !project.agencyIds.some((id) => allowedAgencyIds.has(id))) return false
        return true
      })

    const valuesOf = (key: 'sector' | 'region' | 'projectStatus', skip: Dimension) =>
      [...new Set(projectsExcept(skip).map((p) => p[key]).filter((v): v is string => Boolean(v)))].sort()

    const agencyIdsIn = (skip: Dimension) => new Set(projectsExcept(skip).flatMap((p) => p.agencyIds))
    const agencyIdsForMinistries = agencyIdsIn('ministry')
    const agencyIdsForAgencies = agencyIdsIn('agency')
    const companyIdsInScope = new Set(projectsExcept('company').map((p) => p.companyId))

    return {
      ministries: catalog.ministries.filter((ministry) =>
        catalog.agencies.some(
          (agency) => agency.ministryId === ministry.id && agencyIdsForMinistries.has(agency.id),
        ),
      ),
      agencies: agenciesOfMinistries.filter((agency) => agencyIdsForAgencies.has(agency.id)),
      companies: catalog.companies.filter((company) => companyIdsInScope.has(company.id)),
      sectors: valuesOf('sector', 'sector'),
      regions: valuesOf('region', 'region'),
      projectStatuses: valuesOf('projectStatus', 'projectStatus'),
      // The project dropdown is not a project attribute: all other filters apply.
      projects: projectsExcept(),
    }
  }, [catalog, filters])
}
