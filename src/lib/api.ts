import axios from 'axios'
import { cognitoConfigurado, obtenerIdToken } from './auth'
import type { RolUsuario } from '../shared/types'

/**
 * HTTP client for the OASI API.
 *
 * Auth: when Cognito is configured, every request carries the ID token and
 * the backend verifies it against the User Pool's JWKS. When it is not, the
 * backend runs AUTH_MODE=dev and takes the role from the x-dev-* headers (the
 * switcher in the top bar). The x-dev-* headers are ignored by a backend
 * running in cognito mode, so they are harmless either way.
 */

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
})

const CLAVE_ROL_DEV = 'oasi_rol_dev'

export interface RolDev {
  rol: RolUsuario
  empresaId?: number | null
  organismoId?: number | null
  region?: string | null
}

export function leerRolDev(): RolDev {
  try {
    const guardado = localStorage.getItem(CLAVE_ROL_DEV)
    if (guardado) return JSON.parse(guardado) as RolDev
  } catch {
    // localStorage puede fallar (modo privado); seguimos con el default
  }
  return { rol: 'admin' }
}

export function guardarRolDev(valor: RolDev) {
  try {
    localStorage.setItem(CLAVE_ROL_DEV, JSON.stringify(valor))
  } catch {
    // ignorar
  }
}

api.interceptors.request.use(async (config) => {
  // Async on purpose: Amplify refreshes the token here if it is close to
  // expiring, so a long session does not start 401-ing mid-use.
  const token = await obtenerIdToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const dev = leerRolDev()
  config.headers['x-dev-rol'] = dev.rol
  if (dev.empresaId) config.headers['x-dev-empresa-id'] = String(dev.empresaId)
  if (dev.organismoId) config.headers['x-dev-organismo-id'] = String(dev.organismoId)
  // encodeURIComponent: header values must be latin-1, and region names carry
  // accents ("Biobío", "O'Higgins"). The backend decodes it.
  if (dev.region) config.headers['x-dev-region'] = encodeURIComponent(dev.region)

  return config
})

/** Saca un mensaje legible de un error de axios. */
export function mensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401 && cognitoConfigurado) {
      return 'Tu sesión expiró. Volvé a iniciar sesión.'
    }
    if (error.response?.data?.message) return String(error.response.data.message)
    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. ¿Está corriendo el backend en ' +
        (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '?'
    }
    return error.message
  }
  return 'Ocurrió un error inesperado'
}
