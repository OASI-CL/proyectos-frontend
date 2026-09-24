import { useNavigate } from 'react-router-dom'
import { formatDate, formatMmusd, formatNumber, formatText } from '../../../lib/formatters'
import { PERMIT_STATUS_FILL, PERMIT_STATUS_LABELS, PERMIT_STATUS_TEXT } from '../constants'
import type { CriticalPermit } from '../types'

/**
 * "Permisos habilitantes" (README_dashboard section 11).
 *
 * Every permit marked as habilitante de construcción — the only real "this
 * one matters more" flag OASI has (`critico` comes 100% empty from the
 * source spreadsheet, so it's never used for this). Not just the overdue
 * ones: pending and resolved habilitantes show too, but ranked so the ones
 * that need attention surface first — blocking a project whose construction
 * starts within 3 months (flagged "Bloquea inicio"), then overdue, then
 * pending, then resolved.
 */
export function CriticalPermitsBanner({ permits }: { permits: CriticalPermit[] }) {
  const navigate = useNavigate()
  const blocking = permits.filter((permit) => permit.priority === 'high').length
  const overdue = permits.filter((permit) => permit.trackingStatus === 'overdue').length

  return (
    <div className="panel critical-panel">
      <div className="panel__header">
        <h2>Permisos habilitantes</h2>
        <span className="texto-sm texto-tenue">
          {permits.length > 0
            ? `${formatNumber(permits.length)} permisos habilitantes en el universo filtrado${
                overdue > 0 ? `, ${formatNumber(overdue)} atrasados` : ''
              }${blocking > 0 ? `, ${formatNumber(blocking)} bloquean un inicio de construcción` : ''}`
            : 'Sin permisos habilitantes en el universo filtrado'}
        </span>
      </div>

      <div className="panel__cuerpo panel__cuerpo--sin-padding">
        {permits.length === 0 ? (
          <div className="estado-caja">
            <div className="estado-caja__titulo">Nada que priorizar</div>
            <div className="estado-caja__texto">
              Ningún permiso habilitante en el universo filtrado.
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
                      </div>
                    </td>
                    <td>
                      <div className="truncar">{permit.projectName}</div>
                      <div className="celda-secundaria">{formatText(permit.companyName)}</div>
                    </td>
                    <td className="nowrap">{permit.agency}</td>
                    <td>
                      {/* Colour by actual status now that pending/resolved habilitantes
                          show here too — badge--critico (always red) made sense when
                          every row was overdue, not anymore. */}
                      <span
                        className="badge"
                        style={{
                          background: PERMIT_STATUS_FILL[permit.trackingStatus],
                          color: PERMIT_STATUS_TEXT[permit.trackingStatus],
                        }}
                      >
                        {PERMIT_STATUS_LABELS[permit.trackingStatus]}
                      </span>
                    </td>
                    <td className="der">
                      {permit.overdueDays != null ? (
                        <strong style={{ color: 'var(--rojo)' }}>{formatNumber(permit.overdueDays)}</strong>
                      ) : (
                        <span className="texto-tenue">—</span>
                      )}
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
