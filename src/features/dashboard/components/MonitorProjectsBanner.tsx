import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatMmusd, formatNumber, formatText } from '../../../lib/formatters'
import type { MonitorBucket, MonitorProject } from '../types'

interface Props {
  upcoming: MonitorBucket
  fewPermits: MonitorBucket
}

type BucketKey = 'upcoming' | 'fewPermits'

/**
 * "Monitorear proyectos" (README_dashboard section 5).
 *
 * Two independent lenses on projects that have not started construction yet
 * — a project can show up in both cards:
 *   - upcoming: construction starts within the next 3 months
 *   - fewPermits: only 1 or 2 pending permits left, close to fully cleared
 */
export function MonitorProjectsBanner({ upcoming, fewPermits }: Props) {
  const [openBucket, setOpenBucket] = useState<BucketKey | null>('upcoming')

  const buckets: { key: BucketKey; title: string; caption: string; bucket: MonitorBucket; tone: string }[] = [
    {
      key: 'upcoming',
      title: 'Próximos a iniciar',
      caption: 'Inician construcción en los próximos 3 meses',
      bucket: upcoming,
      tone: 'monitor-card--urgent',
    },
    {
      key: 'fewPermits',
      title: 'Menos de 3 permisos',
      caption: 'No iniciaron construcción y les quedan 1 o 2 permisos pendientes',
      bucket: fewPermits,
      tone: 'monitor-card--later',
    },
  ]

  return (
    <div className="panel">
      <div className="panel__header">
        <h2>Monitorear proyectos</h2>
        <span className="texto-sm texto-tenue">
          Proyectos que aún no inician construcción
        </span>
      </div>

      <div className="panel__cuerpo">
        <div className="monitor-grid">
          {buckets.map(({ key, title, caption, bucket, tone }) => (
            <button
              key={key}
              type="button"
              className={`monitor-card ${tone} ${openBucket === key ? 'monitor-card--open' : ''}`}
              onClick={() => setOpenBucket(openBucket === key ? null : key)}
              aria-expanded={openBucket === key}
            >
              <div className="monitor-card__title">{title}</div>
              <div className="monitor-card__caption">{caption}</div>
              <div className="monitor-card__count">{formatNumber(bucket.projectCount)}</div>
              <dl className="monitor-card__stats">
                <div>
                  <dt>Inversión</dt>
                  <dd>{formatMmusd(bucket.investmentMmusd)}</dd>
                </div>
                <div>
                  <dt>Empleo constr.</dt>
                  <dd>{formatNumber(bucket.constructionJobs)}</dd>
                </div>
                <div>
                  <dt>Empleo oper.</dt>
                  <dd>{formatNumber(bucket.operationJobs)}</dd>
                </div>
              </dl>
              <div className="monitor-card__toggle">
                <span className="monitor-card__toggle-flecha">{openBucket === key ? '▲' : '▼'}</span>
                {openBucket === key ? 'Ocultar proyectos' : 'Ver proyectos'}
              </div>
            </button>
          ))}
        </div>

        {openBucket && (
          <ProjectList
            projects={buckets.find((b) => b.key === openBucket)!.bucket.projects}
          />
        )}
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
