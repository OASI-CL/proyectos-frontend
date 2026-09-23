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
  /** Alcance del rol 'region': el id del catálogo `regiones`. */
  regionId: number | null
  /** El mismo alcance resuelto a nombre, solo para mostrar. */
  region: string | null
}

/**
 * Lo que devuelve `/me` cuando el token es válido pero a la persona le falta
 * rol o alcance en `usuarios` (recién invitada, o la fila quedó incompleta).
 * No es un `UsuarioActual` completo — no alcanza para usar la app — pero sí
 * lo suficiente para saludarla por nombre y dejarla cerrar sesión.
 */
export interface IdentidadIncompleta {
  sub: string
  nombre: string
  email: string
  rol: RolUsuario | null
  /** Por qué no se pudo resolver del todo, para mostrar tal cual. */
  alcanceIncompleto: string
}

/**
 * Current session and what the role is allowed to do.
 *
 * The flags below mirror middleware/scope.ts on the backend. They only drive
 * what the UI offers — the backend enforces the same matrix on every request,
 * so hiding a button is a convenience, never the access control.
 *
 * | role      | sees                                      | writes         |
 * |-----------|-------------------------------------------|----------------|
 * | admin     | everything                                | direct         |
 * | oasi      | everything                                | direct+approve |
 * | organismo | its agency's permits + those projects      | needs approval |
 * | empresa   | its own projects + permits                 | needs approval |
 * | region    | every project of its region, all agencies  | read-only      |
 */
export function useAuth() {
  const [usuario, setUsuario] = useState<UsuarioActual | null>(null)
  const [identidadIncompleta, setIdentidadIncompleta] = useState<IdentidadIncompleta | null>(null)
  const [cargando, setCargando] = useState(true)
  const [rolDev, setRolDevEstado] = useState<RolDev>(() => leerRolDev())

  useEffect(() => {
    let cancelado = false
    setCargando(true)

    api
      .get<UsuarioActual | IdentidadIncompleta>('/me')
      .then((r) => {
        if (cancelado) return
        if ('alcanceIncompleto' in r.data) {
          setUsuario(null)
          setIdentidadIncompleta(r.data)
        } else {
          setUsuario(r.data)
          setIdentidadIncompleta(null)
        }
      })
      .catch(() => {
        if (!cancelado) {
          setUsuario(null)
          setIdentidadIncompleta(null)
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [rolDev])

  /** Switches the simulated role and reloads so every view refetches. */
  function cambiarRolDev(nuevo: RolDev) {
    guardarRolDev(nuevo)
    setRolDevEstado(nuevo)
    window.location.reload()
  }

  const rol = usuario?.rol ?? 'oasi'

  const esAdmin = rol === 'admin'
  const esOasi = rol === 'oasi' || rol === 'admin'
  const esEmpresa = rol === 'empresa'
  const esOrganismo = rol === 'organismo'
  const esRegion = rol === 'region'

  return {
    usuario,
    /** Presente cuando hay sesión válida pero `usuario` es null porque falta rol/alcance. */
    identidadIncompleta,
    cargando,
    rol,
    rolDev,
    cambiarRolDev,

    esAdmin,
    esOasi,
    esEmpresa,
    esOrganismo,
    esRegion,

    /** 'region' is the only read-only role. */
    puedeEditar: !esRegion,
    /** Whether this role's edits are queued for OASI instead of applied. */
    requiereAprobacion: esEmpresa || esOrganismo,
    /** Can review other people's change requests. */
    puedeAprobar: esOasi,
    /** An organismo edits its permits but does not own projects. */
    puedeCrearProyectos: esOasi || esEmpresa,
    /** Only OASI and admin run the committee sessions. */
    veComites: esOasi,
  }
}
