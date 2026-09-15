/**
 * DEPRECATED — Spanish aliases kept so the pages written before the switch to
 * English keep working. New code should import from `./formatters`.
 * These re-exports go away as each page is migrated.
 */

export {
  formatDate as fecha,
  formatDateTime as fechaHora,
  toDateInput as fechaInput,
  formatNumber as numero,
  formatMmusd as mmusd,
  formatMmusdCompact as mmusdCompacto,
  formatDays as dias,
  formatBoolean as siNo,
  formatText as texto,
  SEMAFORO_LABELS as ETIQUETAS_SEMAFORO,
  ROLE_LABELS as ETIQUETAS_ROL,
} from './formatters'
