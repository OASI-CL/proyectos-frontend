import type { EstadoPermiso, Semaforo } from '../shared/types'
import { ETIQUETAS_SEMAFORO } from '../lib/format'

const CLASES_SEMAFORO: Record<string, string> = {
  en_plazo: 'badge--en-plazo',
  en_alerta: 'badge--en-alerta',
  critico: 'badge--critico',
  finalizado: 'badge--finalizado',
}

/**
 * Semáforo del permiso: En plazo (<3m), En alerta (3-6m), Crítico (>6m),
 * Finalizado (resuelto o descartado). El valor lo calcula la vista
 * v_permisos en la base, acá solo se pinta.
 */
export function SemaforoBadge({ valor }: { valor: Semaforo | string | null }) {
  if (!valor) return <span className="texto-tenue">—</span>
  const clase = CLASES_SEMAFORO[valor] ?? 'badge--finalizado'
  return (
    <span className={`badge ${clase}`}>
      <span className="badge__punto" />
      {ETIQUETAS_SEMAFORO[valor] ?? valor}
    </span>
  )
}

const CLASES_ESTADO: Record<string, string> = {
  Pendiente: 'badge--pendiente',
  Resuelto: 'badge--resuelto',
  Descartado: 'badge--descartado',
}

export function EstadoBadge({ valor }: { valor: EstadoPermiso | string | null }) {
  if (!valor) return <span className="texto-tenue">—</span>
  return <span className={`badge ${CLASES_ESTADO[valor] ?? 'badge--info'}`}>{valor}</span>
}

/** Identificador del Excel (P183, PM1377). Informativo, nunca es la PK. */
export function IdExcel({ valor }: { valor: string | null | undefined }) {
  if (!valor) return <span className="texto-tenue texto-sm">sin ID Excel</span>
  return <span className="badge-id">{valor}</span>
}
