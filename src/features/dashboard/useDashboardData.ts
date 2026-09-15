import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, mensajeError } from '../../lib/api'
import type { Catalog, DashboardData } from './types'
import type { DashboardFilters } from './useDashboardFilters'

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

    const ministryId = filters.ministryId ? Number(filters.ministryId) : undefined
    const agencyId = filters.agencyId ? Number(filters.agencyId) : undefined
    const companyId = filters.companyId ? Number(filters.companyId) : undefined

    // Agencies belonging to the selected ministry.
    const agencies = ministryId
      ? catalog.agencies.filter((a) => a.ministryId === ministryId)
      : catalog.agencies

    const allowedAgencyIds = new Set(agencies.map((a) => a.id))

    // Projects that satisfy every filter except the project filter itself.
    const projects = catalog.projects.filter((project) => {
      if (companyId && project.companyId !== companyId) return false
      if (filters.sector && project.sector !== filters.sector) return false
      if (filters.region && project.region !== filters.region) return false
      if (filters.projectStatus && project.projectStatus !== filters.projectStatus) return false
      if (filters.rcaStatus && project.rcaStatus !== filters.rcaStatus) return false
      if (agencyId && !project.agencyIds.includes(agencyId)) return false
      if (ministryId && !project.agencyIds.some((id) => allowedAgencyIds.has(id))) return false
      return true
    })

    // The remaining dropdowns only offer values present in that project set.
    const valuesOf = (key: 'sector' | 'region' | 'projectStatus') =>
      [...new Set(projects.map((p) => p[key]).filter((v): v is string => Boolean(v)))].sort()

    const companyIdsInScope = new Set(projects.map((p) => p.companyId))
    const agencyIdsInScope = new Set(projects.flatMap((p) => p.agencyIds))

    return {
      ministries: catalog.ministries.filter((ministry) =>
        catalog.agencies.some(
          (agency) => agency.ministryId === ministry.id && agencyIdsInScope.has(agency.id),
        ),
      ),
      agencies: agencies.filter((agency) => agencyIdsInScope.has(agency.id)),
      companies: catalog.companies.filter((company) => companyIdsInScope.has(company.id)),
      sectors: valuesOf('sector'),
      regions: valuesOf('region'),
      projectStatuses: valuesOf('projectStatus'),
      projects,
    }
  }, [catalog, filters])
}
