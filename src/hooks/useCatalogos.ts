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

export interface Catalogos {
  organismos: OrganismoCatalogo[]
  ministerios: { id: number; nombre: string }[]
  empresas: EmpresaCatalogo[]
  regiones: string[]
  sectores: string[]
  etapas: string[]
  estados: string[]
}

/** Listas para los dropdowns de filtros y formularios. */
export function useCatalogos() {
  return useApi<Catalogos>('/catalogos')
}
