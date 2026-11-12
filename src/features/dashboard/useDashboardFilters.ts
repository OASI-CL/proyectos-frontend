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

/**
 * A filter's value as it lives in the URL. Every filter except the two dates
 * is MULTI-VALUE: several picks of the same filter are joined with
 * MULTI_VALUE_SEPARATOR ("3|13" = agencies 3 or 13). Same separator as the
 * backend (models/dashboard.ts). Use `filterValues()` to read them as a list.
 */
export type DashboardFilters = Partial<Record<FilterKey, string>>

export const MULTI_VALUE_SEPARATOR = '|'

/** Filters that accept several values at once (all but the date range). */
export const MULTI_VALUE_KEYS: ReadonlySet<FilterKey> = new Set(
  FILTER_KEYS.filter((key) => key !== 'startDateFrom' && key !== 'startDateTo'),
)

/** "a|b" -> ['a', 'b']; undefined/'' -> []. */
export function filterValues(value: string | undefined): string[] {
  return value ? value.split(MULTI_VALUE_SEPARATOR).filter(Boolean) : []
}

/** Is `value` among the picks of a (multi-value) filter? For chart highlighting. */
export function isPicked(filterValue: string | undefined, value: string | null | undefined): boolean {
  return value != null && filterValues(filterValue).includes(value)
}

/** ['a', 'b'] -> "a|b"; [] -> null (= no filter). */
export function joinFilterValues(values: string[]): string | null {
  return values.length ? values.join(MULTI_VALUE_SEPARATOR) : null
}

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

          // Narrowing a wider filter drops the picks below it that no longer
          // fit. With multi-value filters a whole reset would be annoying
          // (adding a 2nd ministry shouldn't wipe the agencies), so the
          // dependent filter is only cleared when the wider one is cleared.
          if (key === 'ministryId' && (value === null || value === '')) next.delete('agencyId')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams, lockedKey],
  )

  /**
   * Click-to-filter (a chart bar, a donut slice, a checkbox): adds the value
   * to that filter, or removes it if it was already picked. Single-value
   * filters (dates) just switch on/off.
   */
  const toggleFilter = useCallback(
    (key: FilterKey, value: string) => {
      if (key in (JSON.parse(lockedKey) as DashboardFilters)) return
      // Computed from the URL as it is RIGHT NOW (functional update), not from
      // the last render: two quick clicks (tick CMN, tick SAG) must add up,
      // not have the second one overwrite the first.
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          const current = filterValues(previous.get(key) ?? undefined)
          const picked = MULTI_VALUE_KEYS.has(key)
            ? current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
            : current[0] === value ? [] : [value]
          const joined = joinFilterValues(picked)
          if (joined === null) next.delete(key)
          else next.set(key, joined)
          if (key === 'ministryId' && joined === null) next.delete('agencyId')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams, lockedKey],
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
