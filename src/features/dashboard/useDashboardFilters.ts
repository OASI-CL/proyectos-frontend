import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * The single source of truth for every dashboard filter.
 *
 * README_dashboard section 12: the dashboard must behave as one
 * interconnected filter system, not as isolated charts. So all filters live
 * here, in the URL — which also means a filtered view can be shared by link
 * and survives a refresh.
 *
 * Any chart can write a filter (clicking a sector bar, a donut slice, a
 * region) and every section re-reads the same state.
 */

export const FILTER_KEYS = [
  'ministryId',
  'agencyId',
  'sector',
  'region',
  'projectStatus',
  'permitStatus',
  'companyId',
  'projectId',
  'rcaStatus',
  'startDateFrom',
  'startDateTo',
] as const

export type FilterKey = (typeof FILTER_KEYS)[number]

export type DashboardFilters = Partial<Record<FilterKey, string>>

/**
 * `locked`: filters fixed by the user's scope (a 'region' user's region, an
 * 'organismo' user's agency). They always apply, can't be changed or cleared,
 * and don't count as "active filters". The backend enforces the same scope
 * regardless; locking them here just makes the UI say so.
 */
export function useDashboardFilters(locked: DashboardFilters = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const lockedKey = JSON.stringify(locked)

  const filters = useMemo<DashboardFilters>(() => {
    const result: DashboardFilters = {}
    for (const key of FILTER_KEYS) {
      const value = searchParams.get(key)
      if (value !== null && value !== '') result[key] = value
    }
    return { ...result, ...(JSON.parse(lockedKey) as DashboardFilters) }
  }, [searchParams, lockedKey])

  const setFilter = useCallback(
    (key: FilterKey, value: string | null) => {
      if (key in (JSON.parse(lockedKey) as DashboardFilters)) return
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          if (value === null || value === '') next.delete(key)
          else next.set(key, value)

          // Picking a narrower scope invalidates the wider picks below it.
          if (key === 'ministryId') next.delete('agencyId')
          if (key === 'companyId' || key === 'sector' || key === 'region') {
            next.delete('projectId')
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams, lockedKey],
  )

  /** Click-to-filter: clicking the value that is already active clears it. */
  const toggleFilter = useCallback(
    (key: FilterKey, value: string) => {
      setFilter(key, filters[key] === value ? null : value)
    },
    [filters, setFilter],
  )

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    for (const key of FILTER_KEYS) {
      const value = filters[key]
      if (value) params.set(key, value)
    }
    return params.toString()
  }, [filters])

  const activeCount = Object.keys(filters).filter((key) => !(key in locked)).length

  return {
    filters,
    setFilter,
    toggleFilter,
    clearFilters,
    queryString,
    activeCount,
    hasFilters: activeCount > 0,
  }
}
