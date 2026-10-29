import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDate, formatMmusd, formatNumber, formatText } from '../../../lib/formatters'
import type { InterregionalPermit, InterregionalProject } from '../types'

/** Permit traffic light (v_permisos.semaforo) -> badge class + label. */
const TRAFFIC_LIGHT: Record<string, { className: string; label: string }> = {
  en_plazo: { className: 'badge--en-plazo', label: 'En plazo' },
  en_alerta: { className: 'badge--en-alerta', label: 'En alerta' },
  critico: { className: 'badge--critico', label: 'Atrasado' },
  finalizado: { className: 'badge--finalizado', label: 'Finalizado' },
}

/**
 * "Proyectos interregionales" box.
 *
 * Projects that span several regions (region "Interregional" in the catalog)
 * and their permits. It sits apart from the rest of the dashboard on purpose:
 * EVERYONE sees it the same way, whatever their role or the active filters
 * (the backend builds it without filters or role scope). Click a project to
 * unfold its permits.
 */
export function InterregionalBox({
  projects,
  permits,
}: {
  projects: InterregionalProject[]
  permits: InterregionalPermit[]
}) {
  const [open, setOpen] = useState<number | null>(null)
  const pending = projects.reduce((acc, p) => acc + p.pendingPermitCount, 0)

  return (
    <div className="panel interregional-panel">
      <div className="panel__header">
        <div>
          <h2>Proyectos interregionales</h2>
          <div className="texto-sm texto-tenue">
            Abarcan más de una región. Esta caja la ven todos y no cambia con los filtros.
          </div>
        </div>
        <span className="texto-sm texto-tenue">
          {formatNumber(projects.length)} proyectos · {formatNumber(permits.length)} permisos ·{' '}
          {formatNumber(pending)} pendientes
        </span>
      </div>

      <div className="panel__cuerpo panel__cuerpo--sin-padding">
        {projects.length === 0 ? (
          <div className="estado-caja">
            <div className="estado-caja__titulo">Sin proyectos interregionales</div>
          </div>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Sector</th>
                  <th>Etapa</th>
                  <th className="der">Inversión</th>
                  <th className="der">Permisos</th>
                  <th className="der">Pendientes</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const isOpen = open === project.id
                  const own = permits.filter((permit) => permit.projectId === project.id)
                  return (
                    <Fragment key={project.id}>
                      <tr className="clickeable" onClick={() => setOpen(isOpen ? null : project.id)}>
                        <td>
                          <div className="celda-principal">
                            <span className="interregional-panel__chevron">{isOpen ? '▾' : '▸'}</span>
                            {project.name}
                          </div>
                          <div className="celda-secundaria fila" style={{ gap: 6 }}>
                            {project.code && <span className="badge-id">{project.code}</span>}
                            {formatText(project.company)}
                          </div>
                        </td>
                        <td>{formatText(project.sector)}</td>
                        <td>{formatText(project.projectStatus)}</td>
                        <td className="der nowrap">{formatMmusd(project.investmentMmusd)}</td>
                        <td className="der">{formatNumber(project.permitCount)}</td>
                        <td className="der">
                          {project.pendingPermitCount > 0 ? (
                            <strong>{formatNumber(project.pendingPermitCount)}</strong>
                          ) : (
                            <span className="texto-tenue">0</span>
                          )}
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="interregional-panel__permits">
                          <td colSpan={6}>
                            <div className="fila" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                              <strong className="texto-sm">Permisos de este proyecto</strong>
                              <Link to={`/proyectos/${project.id}`} className="texto-sm">
                                Ver ficha del proyecto →
                              </Link>
                            </div>
                            {own.length === 0 ? (
                              <div className="texto-sm texto-tenue">Sin permisos en el universo.</div>
                            ) : (
                              <table className="tabla">
                                <thead>
                                  <tr>
                                    <th>Permiso</th>
                                    <th>Organismo</th>
                                    <th>Estado</th>
                                    <th>Semáforo</th>
                                    <th className="der">Ingreso</th>
                                    <th className="der">Días</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {own.map((permit) => {
                                    const light = TRAFFIC_LIGHT[permit.trafficLight]
                                    return (
                                      <tr key={permit.id}>
                                        <td>
                                          <Link to={`/permisos/${permit.id}`} className="celda-principal">
                                            {permit.name}
                                          </Link>
                                          {permit.code && (
                                            <div className="celda-secundaria">
                                              <span className="badge-id">{permit.code}</span>
                                            </div>
                                          )}
                                        </td>
                                        <td className="nowrap">{permit.agency}</td>
                                        <td>{permit.status}</td>
                                        <td>
                                          {light && <span className={`badge ${light.className}`}>{light.label}</span>}
                                        </td>
                                        <td className="der nowrap">
                                          {permit.submittedOn ? formatDate(permit.submittedOn) : <span className="texto-tenue">sin fecha</span>}
                                        </td>
                                        <td className="der">{formatNumber(permit.daysInProcess)}</td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
