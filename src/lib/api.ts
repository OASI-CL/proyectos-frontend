import axios from 'axios'
import type { RolUsuario } from '../shared/types'

/**
 * Cliente HTTP contra la API de OASI.
 *
 * Auth: en producción va el JWT de Cognito en el header Authorization.
 * Mientras Cognito no esté montado, el backend corre con AUTH_MODE=dev y
 * acepta un rol simulado por headers (ver el selector de rol de la barra
 * superior). Los headers x-dev-* los ignora el backend en modo cognito.
 */

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
})

const CLAVE_ROL_DEV = 'oasi_rol_dev'

export interface RolDev {
  rol: RolUsuario
  empresaId?: number | null
  organismoId?: number | null
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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('oasi_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const dev = leerRolDev()
  config.headers['x-dev-rol'] = dev.rol
  if (dev.empresaId) config.headers['x-dev-empresa-id'] = String(dev.empresaId)
  if (dev.organismoId) config.headers['x-dev-organismo-id'] = String(dev.organismoId)

  return config
})

/** Saca un mensaje legible de un error de axios. */
export function mensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) return String(error.response.data.message)
    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. ¿Está corriendo el backend en ' +
        (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '?'
    }
    return error.message
  }
  return 'Ocurrió un error inesperado'
}
