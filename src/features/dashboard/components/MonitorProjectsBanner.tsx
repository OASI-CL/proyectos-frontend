import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatMmusd, formatNumber, formatText } from '../../../lib/formatters'
import type { MonitorBucket, MonitorProject } from '../types'

interface Props {
  upcoming: MonitorBucket
}

/**
 * "Monitorear proyectos" (README_dashboard section 5).
 *
 * Projects that have not started construction yet, with an estimated start
 * within the next 6 months. Used to be a two-card grid (this one plus
 * "Menos de 3 permisos"); OASI only wanted this lens, so the second card is
 * gone and this is back to a single toggle card, not a grid.
 *
 * Starts collapsed (`abierto = false`) — it used to default open, which,
 * combined with a small caption as the only "this expands" cue, wasn't
 * obviously a button. The whole card is now the button, with a clear
 * chevron + label that both change on click.
 */
export function MonitorProjectsBanner({ upcoming }: Props) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="panel">
      <div className="panel__header">
        <h2>Monitorear proyectos</h2>
        <span className="texto-sm texto-tenue">
          Proyectos que aún no inician construcción
        </span>
      </div>

      <div className="panel__cuerpo">
        <button
          type="button"
          className={`monitor-card monitor-card--urgent ${abierto ? 'monitor-card--open' : ''}`}
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
        >
          <div className="monitor-card__title">Próximos a iniciar</div>
          <div className="monitor-card__caption">Inician construcción en los próximos 6 meses</div>
          <div className="monitor-card__count">{formatNumber(upcoming.projectCount)}</div>
          <dl className="monitor-card__stats">
            <div>
              <dt>Inversión</dt>
              <dd>{formatMmusd(upcoming.investmentMmusd)}</dd>
            </div>
            <div>
              <dt>Empleo constr.</dt>
              <dd>{formatNumber(upcoming.constructionJobs)}</dd>
            </div>
            <div>
              <dt>Empleo oper.</dt>
              <dd>{formatNumber(upcoming.operationJobs)}</dd>
            </div>
          </dl>
          <div className="monitor-card__toggle">
            <span className="monitor-card__toggle-flecha">{abierto ? '▲' : '▼'}</span>
            {abierto ? 'Ocultar proyectos' : 'Ver proyectos'}
          </div>
        </button>

        {abierto && <ProjectList projects={upcoming.projects} />}
      </div>
    </div>
  )
}

function ProjectList({ projects }: { projects: MonitorProject[] }) {
  const navigate = useNavigate()

  if (projects.length === 0) {
    return (
      <div className="estado-caja">
        <div className="estado-caja__titulo">Sin proyectos en esta categoría</div>
      </div>
    )
  }

  return (
    <div className="tabla-scroll" style={{ marginTop: 16 }}>
      <table className="tabla">
        <thead>
          <tr>
            <th>Proyecto</th>
            <th>Empresa</th>
            <th>Sector</th>
            <th>Región</th>
            <th className="der">Inicio construcción</th>
            <th className="der">Permisos pendientes</th>
            <th className="der">Inversión</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr
              key={project.id}
              className="clickeable"
              onClick={() => navigate(`/proyectos/${project.id}`)}
            >
              <td>
                <div className="celda-principal truncar">{project.name}</div>
                {project.idExcel && (
                  <div className="celda-secundaria">
                    <span className="badge-id">{project.idExcel}</span>
                  </div>
                )}
              </td>
              <td>{formatText(project.companyName)}</td>
              <td>{formatText(project.sector)}</td>
              <td>{formatText(project.region)}</td>
              <td className="der nowrap">{formatDate(project.constructionStartOn)}</td>
              <td className="der">
                {project.pendingPermitCount > 0 ? (
                  <strong>{formatNumber(project.pendingPermitCount)}</strong>
                ) : (
                  <span className="texto-tenue">0</span>
                )}
              </td>
              <td className="der nowrap">{formatMmusd(project.investmentMmusd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
