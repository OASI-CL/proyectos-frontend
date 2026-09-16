import { useApi } from './useApi'

export interface OrganismoCatalogo {
  id: number
  nombre: string
  ministerio_id: number
  ministerio_nombre: string
}

export interface EmpresaCatalogo {
  id: number
  id_excel: string | null
  nombre: string
}

/**
 * Un valor de vocabulario controlado (región, sector, etapa, estado).
 *
 * Antes eran strings sueltos, sacados con un SELECT DISTINCT sobre los
 * proyectos. Ahora son tablas de catálogo, así que vienen con su id:
 *   - los formularios de alta mandan el `id` (region_id, sector_id, ...),
 *   - las barras de filtro siguen mandando el `nombre`, que es lo que las
 *     vistas exponen y lo que el backend sigue aceptando.
 * Vienen en el orden del catálogo (regiones de norte a sur, etapas por avance
 * del proyecto), no alfabético: no hay que reordenarlos acá.
 */
export interface ItemCatalogo {
  id: number
  nombre: string
}

export interface Catalogos {
  organismos: OrganismoCatalogo[]
  ministerios: { id: number; nombre: string }[]
  empresas: EmpresaCatalogo[]
  regiones: ItemCatalogo[]
  sectores: ItemCatalogo[]
  etapas: ItemCatalogo[]
  estados: ItemCatalogo[]
}

/** Listas para los dropdowns de filtros y formularios. */
export function useCatalogos() {
  return useApi<Catalogos>('/catalogos')
}
