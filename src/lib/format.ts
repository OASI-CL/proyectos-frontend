/**
 * Formateo para el render. Regla del proyecto: las fechas viajan en ISO
 * YYYY-MM-DD por la API y recién acá se pasan a DD-MM-YYYY.
 */

export function fecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  const soloFecha = iso.slice(0, 10)
  const [anio, mes, dia] = soloFecha.split('-')
  if (!anio || !mes || !dia) return '—'
  return `${dia}-${mes}-${anio}`
}

export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${fecha(d.toISOString())} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Para los <input type="date">, que necesitan YYYY-MM-DD. */
export function fechaInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : ''
}

export function numero(valor: number | null | undefined, decimales = 0): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—'
  return valor.toLocaleString('es-CL', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
}

/** Montos en millones de dólares (el dato ya viene en MMUSD). */
export function mmusd(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—'
  return `US$ ${numero(valor, 0)} MM`
}

/** Solo el número, para las tarjetas del dashboard que ya rotulan la unidad. */
export function mmusdCompacto(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—'
  return numero(Math.round(valor))
}

export function dias(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '—'
  return `${numero(valor)} días`
}

export function siNo(valor: boolean | null | undefined): string {
  if (valor === null || valor === undefined) return '—'
  return valor ? 'Sí' : 'No'
}

/** Texto o un guión si está vacío (para no dejar celdas en blanco). */
export function texto(valor: string | null | undefined): string {
  return valor && valor.trim() !== '' ? valor : '—'
}

export const ETIQUETAS_SEMAFORO: Record<string, string> = {
  en_plazo: 'En plazo',
  en_alerta: 'En alerta',
  critico: 'Crítico',
  finalizado: 'Finalizado',
}

export const ETIQUETAS_ROL: Record<string, string> = {
  admin: 'Administrador',
  oasi: 'Equipo OASI',
  organismo_lector: 'Organismo (lectura)',
  empresa: 'Empresa titular',
}
