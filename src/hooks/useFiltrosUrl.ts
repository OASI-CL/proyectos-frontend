import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Mantiene los filtros en la URL (query params).
 *
 * Es requisito del proyecto: la vista filtrada se tiene que poder compartir
 * por link, así que la URL es la fuente de verdad de los filtros, no el
 * estado local del componente.
 */
export function useFiltrosUrl() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filtros = useMemo(() => {
    const obj: Record<string, string> = {}
    searchParams.forEach((valor, clave) => {
      obj[clave] = valor
    })
    return obj
  }, [searchParams])

  /** Cambia un filtro. Vuelve a la página 1 porque el resultado cambió. */
  const setFiltro = useCallback(
    (clave: string, valor: string | null) => {
      setSearchParams((previos) => {
        const nuevos = new URLSearchParams(previos)
        if (valor === null || valor === '') nuevos.delete(clave)
        else nuevos.set(clave, valor)
        if (clave !== 'page') nuevos.delete('page')
        return nuevos
      })
    },
    [setSearchParams],
  )

  const limpiarFiltros = useCallback(() => {
    setSearchParams(new URLSearchParams())
  }, [setSearchParams])

  /** Query string lista para pegarle a la API. */
  const queryString = searchParams.toString()

  /** Cuántos filtros hay aplicados (sin contar paginación ni orden). */
  const cantidadFiltros = useMemo(() => {
    const ignorar = new Set(['page', 'pageSize', 'sortBy', 'sortDir'])
    let n = 0
    searchParams.forEach((valor, clave) => {
      if (!ignorar.has(clave) && valor !== '') n++
    })
    return n
  }, [searchParams])

  return { filtros, setFiltro, limpiarFiltros, queryString, cantidadFiltros }
}
