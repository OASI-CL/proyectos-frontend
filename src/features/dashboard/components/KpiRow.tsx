import { formatMmusdCompact, formatNumber } from '../../../lib/formatters'
import type { DashboardKpis } from '../types'

/**
 * Executive summary of the filtered universe (README_dashboard section 2):
 * investment, employment, projects, permits, overdue permits.
 *
 * All tiles share the same plain border — no per-tile colour coding.
 */
export function KpiRow({ kpis }: { kpis: DashboardKpis }) {
  const overdueShare =
    kpis.pendingPermitCount + kpis.overduePermitCount > 0
      ? Math.round(
          (kpis.overduePermitCount / (kpis.pendingPermitCount + kpis.overduePermitCount)) * 100,
        )
      : 0

  return (
    <div className="kpis">
      <div className="kpi">
        <div className="kpi__etiqueta">Inversión total</div>
        <div className="kpi__valor">{formatMmusdCompact(kpis.investmentMmusd)}</div>
        <div className="kpi__detalle">MMUSD</div>
      </div>

      <div className="kpi">
        <div className="kpi__etiqueta">Empleo asociado</div>
        <div className="kpi__valor">{formatNumber(kpis.constructionJobs)}</div>
        <div className="kpi__detalle">
          en construcción, {formatNumber(kpis.operationJobs)} en operación
        </div>
      </div>

      <div className="kpi">
        <div className="kpi__etiqueta">Proyectos</div>
        <div className="kpi__valor">{formatNumber(kpis.projectCount)}</div>
        <div className="kpi__detalle">en el universo filtrado</div>
      </div>

      <div className="kpi">
        <div className="kpi__etiqueta">Permisos</div>
        <div className="kpi__valor">{formatNumber(kpis.permitCount)}</div>
        <div className="kpi__detalle">
          {formatNumber(kpis.pendingPermitCount + kpis.overduePermitCount)} pendientes,{' '}
          {formatNumber(kpis.resolvedPermitCount)} resueltos
        </div>
      </div>

      <div className="kpi">
        <div className="kpi__etiqueta">Permisos atrasados</div>
        <div className="kpi__valor">{formatNumber(kpis.overduePermitCount)}</div>
        <div className="kpi__detalle">{overdueShare}% de los pendientes</div>
      </div>
    </div>
  )
}
