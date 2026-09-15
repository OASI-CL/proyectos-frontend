import { useEffect, useState } from 'react'
import { api, leerRolDev, guardarRolDev, type RolDev } from '../lib/api'
import type { RolUsuario } from '../shared/types'

export interface UsuarioActual {
  sub: string
  nombre: string
  email: string
  rol: RolUsuario
  empresaId: number | null
  organismoId: number | null
}

/**
 * Sesión del usuario.
 *
 * Hoy el backend corre en AUTH_MODE=dev y devuelve un usuario simulado según
 * el rol elegido en la barra superior. Cuando Cognito esté montado, acá va el
 * `fetchAuthSession()` de aws-amplify y el rol sale del JWT — la interfaz que
 * consumen las páginas (usuario, puedeEditar, etc.) no cambia.
 */
export function useAuth() {
  const [usuario, setUsuario] = useState<UsuarioActual | null>(null)
  const [cargando, setCargando] = useState(true)
  const [rolDev, setRolDevEstado] = useState<RolDev>(() => leerRolDev())

  useEffect(() => {
    let cancelado = false
    setCargando(true)

    api
      .get<UsuarioActual>('/me')
      .then((r) => {
        if (!cancelado) setUsuario(r.data)
      })
      .catch(() => {
        if (!cancelado) setUsuario(null)
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [rolDev])

  /** Cambia el rol simulado y recarga la app para refrescar todas las vistas. */
  function cambiarRolDev(nuevo: RolDev) {
    guardarRolDev(nuevo)
    setRolDevEstado(nuevo)
    window.location.reload()
  }

  const rol = usuario?.rol ?? 'oasi'

  return {
    usuario,
    cargando,
    rol,
    rolDev,
    cambiarRolDev,
    esAdmin: rol === 'admin',
    esOasi: rol === 'oasi' || rol === 'admin',
    esEmpresa: rol === 'empresa',
    /** organismo_lector es el único rol de solo lectura. */
    puedeEditar: rol !== 'organismo_lector',
    /** Solo OASI y admin ven comités y el resumen completo por organismo. */
    veComites: rol === 'oasi' || rol === 'admin',
  }
}
