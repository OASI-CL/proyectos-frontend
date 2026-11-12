import type { RolUsuario } from '../shared/types'

/** Catalog name of the region for projects that span several regions. */
export const INTERREGIONAL = 'Interregional'

/**
 * Regions a user may pick in a region filter, or null = any region.
 *
 * A 'region' account sees its own region AND the interregional projects (the
 * backend enforces it, see middleware/scope.ts and models/dashboard.ts). Its
 * region select therefore offers only those two; leaving it empty ("Todas")
 * means both. It used to be a fixed filter on its own region, which hid the
 * interregional projects from every list.
 */
export function allowedRegions(rol: RolUsuario | null | undefined, ownRegion: string | null | undefined): string[] | null {
  if (rol !== 'region' || !ownRegion) return null
  return [ownRegion, INTERREGIONAL]
}

/** Label of the empty option of a region select. */
export function allRegionsLabel(allowed: string[] | null): string {
  return allowed ? `Todas (${allowed[0]} + interregional)` : 'Todas'
}
