import { useCallback, useEffect, useState } from 'react'
import { api, mensajeError } from '../lib/api'

export interface EstadoApi<T> {
  datos: T | null
  cargando: boolean
  error: string | null
  recargar: () => void
}

/**
 * Hook genérico de lectura. Centraliza loading/error para que las páginas no
 * repitan lo mismo diez veces.
 *
 * `url` puede ser null para postergar la llamada (ej. mientras falta un id).
 */
export function useApi<T>(url: string | null): EstadoApi<T> {
  const [datos, setDatos] = useState<T | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contador, setContador] = useState(0)

  const recargar = useCallback(() => setContador((n) => n + 1), [])

  useEffect(() => {
    if (!url) {
      setCargando(false)
      return
    }

    let cancelado = false
    setCargando(true)
    setError(null)

    api
      .get<T>(url)
      .then((respuesta) => {
        if (!cancelado) setDatos(respuesta.data)
      })
      .catch((err) => {
        if (!cancelado) {
          setError(mensajeError(err))
          setDatos(null)
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [url, contador])

  return { datos, cargando, error, recargar }
}
