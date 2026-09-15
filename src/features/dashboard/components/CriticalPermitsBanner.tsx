import { useNavigate } from 'react-router-dom'
import { formatDate, formatMmusd, formatNumber, formatText } from '../../../lib/formatters'
import { PERMIT_STATUS_LABELS } from '../constants'
import type { CriticalPermit } from '../types'

/**
 * "Permisos críticos" (README_dashboard section 11).
 *
 * Overdue permits, but ordered by real urgency: an overdue permit blocking a
 * project whose construction starts within 3 months comes first (flagged
 * "Bloquea inicio"), then the longest overdue ones.
 */
export function CriticalPermitsBanner({ permits }: { permits: CriticalPermit[] }) {
  const navigate = useNavigate()
  const blocking = permits.filter((permit) => permit.priority === 'high').length

  return (
    <div className="panel critical-panel">
      <div className="panel__header">
        <h2>Permisos críticos</h2>
        <span className="texto-sm texto-tenue">
          {permits.length > 0
            ? `${formatNumber(permits.length)} permisos atrasados con mayor prioridad${
                blocking > 0 ? `, ${blocking} bloquean un inicio de construcción` : ''
              }`
            : 'Sin permisos atrasados en el universo filtrado'}
        </span>
      </div>

      <div className="panel__cuerpo panel__cuerpo--sin-padding">
        {permits.length === 0 ? (
          <div className="estado-caja">
            <div className="estado-caja__titulo">Nada que priorizar</div>
            <div className="estado-caja__texto">
              Ningún permiso del universo filtrado está atrasado.
            </div>
          </div>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Permiso</th>
                  <th>Proyecto</th>
                  <th>Organismo</th>
                  <th>Estado</th>
                  <th className="der">Días de atraso</th>
                  <th className="der">Resolución esperada</th>
                  <th className="der">Inicio construcción</th>
                  <th className="der">Inversión</th>
                </tr>
              </thead>
              <tbody>
                {permits.map((permit) => (
                  <tr
                    key={permit.id}
                    className="clickeable"
                    onClick={() => navigate(`/permisos/${permit.id}`)}
                  >
                    <td>
                      <div className="celda-principal truncar">{permit.name}</div>
                      <div className="celda-secundaria fila" style={{ gap: 6 }}>
                        {permit.idExcel && <span className="badge-id">{permit.idExcel}</span>}
                        {permit.priority === 'high' && (
                          <span className="badge badge--critico">Bloquea inicio</span>
                        )}
                        {permit.isCritical && (
                          <span className="badge badge--critico-flag">Crítico</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="truncar">{permit.projectName}</div>
                      <div className="celda-secundaria">{formatText(permit.companyName)}</div>
                    </td>
                    <td className="nowrap">{permit.agency}</td>
                    <td>
                      <span className="badge badge--critico">
                        {PERMIT_STATUS_LABELS[permit.trackingStatus]}
                      </span>
                    </td>
                    <td className="der">
                      <strong style={{ color: 'var(--rojo)' }}>
                        {formatNumber(permit.overdueDays)}
                      </strong>
                    </td>
                    <td className="der nowrap">
                      {permit.expectedResolutionOn ? (
                        formatDate(permit.expectedResolutionOn)
                      ) : (
                        <span
                          className="texto-tenue"
                          title="El Excel de origen no trae fecha esperada; el atraso se calcula sobre el umbral de 180 días"
                        >
                          sin fecha
                        </span>
                      )}
                    </td>
                    <td className="der nowrap">
                      {permit.constructionStartOn ? (
                        formatDate(permit.constructionStartOn)
                      ) : (
                        <span className="texto-tenue">—</span>
                      )}
                    </td>
                    <td className="der nowrap">{formatMmusd(permit.investmentMmusd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
