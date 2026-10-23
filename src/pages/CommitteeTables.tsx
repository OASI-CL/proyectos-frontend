import type { ReactNode } from 'react'
import { useApi } from '../hooks/useApi'
import { Contenido } from '../components/Estados'
import { formatDate, formatNumber } from '../lib/formatters'

// ----------------------------------------------------------------------------
// "Tablas PPT" view: the committee presentation tables, replicating the
// sheet of the same name in the Excel. All the logic lives in the backend
// (src/models/committeeTables.ts); this page only lays the numbers out with
// the same rows/columns as the sheet so they can be copied into the deck.
// ----------------------------------------------------------------------------

interface Session {
  number: number
  date: string
}

interface Table1Column {
  label: string
  date: string
  totalProjects: number
  projectsInProgress: number
  releasedProjects: number
  totalPermits: number
  permitsInProgress: number
  resolvedPermits: number
  newPermits: number | null
}

interface StageRow {
  stage: string
  projects: number
  constructionJobs: number
  investmentMmusd: number
}

interface Table3Row {
  ministry: string
  totalAtPrevious: number
  pendingAtPrevious: number | null
  resolvedBetween: number | null
  resolvedTotal: number | null
  progress: number | null
  added: number
  statutoryDays: number | null
}

interface Table4Row {
  ministry: string
  total: number
  progressBySession: (number | null)[]
  added: number
}

interface CommitteeTablesData {
  computedOn: string
  baselineDate: string
  secondBatchDate: string
  currentSession: Session
  previousSession: Session | null
  sessions: Session[]
  table1: Table1Column[]
  table11: { projects: number; investmentMmusd: number; constructionJobs: number }
  table21: { rows: StageRow[]; total: StageRow }
  table22: { rows: StageRow[]; total: StageRow }
  table3: { rows: Table3Row[]; total: Table3Row }
  table4: { rows: Table4Row[]; total: Table4Row; pointsGained: (number | null)[] }
  permitsOutsideListedMinistries: number
}

const NO_DATA = 'Sin información'

const percent = (value: number | null) => (value === null ? NO_DATA : `${formatNumber(value * 100, 0)}%`)

/** "14 de mayo" — the sheet's sub-header for each session. */
function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })
}

/** Panel with the table title, same look as the rest of the app. */
function TablePanel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <h2 className="committee-tables__title">{title}</h2>
          {subtitle && <div className="texto-tenue texto-sm">{subtitle}</div>}
        </div>
      </div>
      <div className="panel__cuerpo panel__cuerpo--sin-padding tabla-scroll">{children}</div>
    </div>
  )
}

function Table1({ data }: { data: CommitteeTablesData }) {
  const rows: { label: string; key: keyof Table1Column; group?: boolean }[] = [
    { label: 'Proyectos totales', key: 'totalProjects', group: true },
    { label: 'En trámite', key: 'projectsInProgress' },
    { label: 'Liberados', key: 'releasedProjects' },
    { label: 'Permisos totales', key: 'totalPermits', group: true },
    { label: 'En trámite', key: 'permitsInProgress' },
    { label: 'Resueltos', key: 'resolvedPermits' },
    { label: 'Nuevos', key: 'newPermits' },
  ]
  return (
    <TablePanel
      title="Tabla 1: proyectos y permisos pendientes por sesión"
      subtitle={`Desde el ${formatDate(data.secondBatchDate)} se suman los proyectos del catastro 2 que siguen activos.`}
    >
      <table className="tabla committee-tables">
        <thead>
          <tr>
            <th />
            {data.table1.map((c) => (
              <th key={c.label} className="der">
                {c.label}
                <div className="committee-tables__date">({shortDate(c.date)})</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className={r.group ? 'committee-tables__group' : undefined}>
              <td className={r.group ? undefined : 'committee-tables__indent'}>{r.label}</td>
              {data.table1.map((c) => (
                <td key={c.label} className="der">
                  {c[r.key] === null ? '-' : formatNumber(c[r.key] as number)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TablePanel>
  )
}

function Table11({ data }: { data: CommitteeTablesData }) {
  const t = data.table11
  return (
    <TablePanel
      title="Tabla 1.1: proyectos con 100% de sus trámites con más de 6 meses"
      subtitle={`Calculado a hoy (${formatDate(data.computedOn)}), igual que la planilla.`}
    >
      <div className="alerta alerta--info committee-tables__summary">
        {formatNumber(t.projects)} proyectos con 100% de trámites +6 meses, equivalentes a $
        {formatNumber(Math.trunc(t.investmentMmusd))} MMUSD inversión y {formatNumber(t.constructionJobs)} empleo
      </div>
      <table className="tabla committee-tables committee-tables--narrow">
        <tbody>
          <tr><td>Cantidad de proyectos</td><td className="der">{formatNumber(t.projects)}</td></tr>
          <tr><td>Inversión (MMUSD)</td><td className="der">{formatNumber(t.investmentMmusd, 0)}</td></tr>
          <tr><td>Empleo</td><td className="der">{formatNumber(t.constructionJobs)}</td></tr>
        </tbody>
      </table>
    </TablePanel>
  )
}

function StageTable({ title, countLabel, table }: { title: string; countLabel: string; table: CommitteeTablesData['table21'] }) {
  return (
    <TablePanel title={title}>
      <table className="tabla committee-tables">
        <thead>
          <tr>
            <th>Etapa del proyecto</th>
            <th className="der">{countLabel}</th>
            <th className="der">Empleo en construcción</th>
            <th className="der">Inversión (MMUSD)</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r) => (
            <tr key={r.stage}>
              <td>{r.stage}</td>
              <td className="der">{formatNumber(r.projects)}</td>
              <td className="der">{formatNumber(r.constructionJobs)}</td>
              <td className="der">{formatNumber(r.investmentMmusd, 0)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td className="der">{formatNumber(table.total.projects)}</td>
            <td className="der">{formatNumber(table.total.constructionJobs)}</td>
            <td className="der">{formatNumber(table.total.investmentMmusd, 0)}</td>
          </tr>
        </tfoot>
      </table>
    </TablePanel>
  )
}

function Table3({ data }: { data: CommitteeTablesData }) {
  const prev = data.previousSession?.number ?? data.currentSession.number
  const curr = data.currentSession.number
  // null = the sheet leaves the cell empty; the first one says "Sin información".
  const cell = (value: number | null, firstOfRow = false) =>
    value === null ? (firstOfRow ? <span className="texto-tenue">{NO_DATA}</span> : '') : formatNumber(value)
  const row = (r: Table3Row) => (
    <>
      <td>{r.ministry}</td>
      <td className="der">{formatNumber(r.totalAtPrevious)}</td>
      <td className="der">{cell(r.pendingAtPrevious, true)}</td>
      <td className="der">{cell(r.resolvedBetween)}</td>
      <td className="der">{cell(r.resolvedTotal)}</td>
      <td className="der">{r.progress === null ? '' : percent(r.progress)}</td>
      <td className="der committee-tables__added">{formatNumber(r.added)}</td>
      <td className="der">{cell(r.statutoryDays)}</td>
    </>
  )
  return (
    <TablePanel
      title="Tabla 3: avance y nivel de atraso de permisos por Ministerio"
      subtitle={`Permisos ingresados hasta la sesión ${prev}; los registrados en la sesión ${curr} van aparte en "Se añaden".`}
    >
      <table className="tabla committee-tables">
        <thead>
          <tr>
            <th rowSpan={2}>Ministerio</th>
            <th colSpan={2} className="centro">Permisos totales</th>
            <th colSpan={3} className="centro">Resueltos</th>
            <th rowSpan={2} className="der">Se añaden<br />(Comité {curr})</th>
            <th rowSpan={2} className="der">Plazo normativo<br />(días prom. ponderado)</th>
          </tr>
          <tr>
            <th className="der">Totales al Comité {prev}</th>
            <th className="der">Pendientes al Comité {prev}</th>
            <th className="der">Entre Comité {prev} y {curr}</th>
            <th className="der">Totales</th>
            <th className="der">% Avance</th>
          </tr>
        </thead>
        <tbody>
          {data.table3.rows.map((r) => <tr key={r.ministry}>{row(r)}</tr>)}
        </tbody>
        <tfoot>
          <tr>{row(data.table3.total)}</tr>
        </tfoot>
      </table>
    </TablePanel>
  )
}

function Table4({ data }: { data: CommitteeTablesData }) {
  const current = data.currentSession
  const row = (r: Table4Row) => (
    <>
      <td>{r.ministry}</td>
      <td className="der">{formatNumber(r.total)}</td>
      {r.progressBySession.map((p, i) => (
        <td key={data.sessions[i].number} className="der">
          {/* Empty when the ministry has no permits; "Sin información" when the sheet says so */}
          {p === null ? (i === 0 && r.total > 0 ? <span className="texto-tenue">{NO_DATA}</span> : '') : percent(p)}
        </td>
      ))}
      <td className="der committee-tables__added">{formatNumber(r.added)}</td>
    </>
  )
  return (
    <TablePanel
      title="Tabla 4: % de avance acumulado por Ministerio"
      subtitle={`"Se añaden" = permisos que se registraron en la sesión ${current.number}.`}
    >
      <table className="tabla committee-tables">
        <thead>
          <tr>
            <th>Ministerio</th>
            <th className="der">
              Permisos totales
              {data.previousSession && <div className="committee-tables__date">({shortDate(data.previousSession.date)})</div>}
            </th>
            {data.sessions.map((s) => (
              <th key={s.number} className="der">
                Sesión {s.number}
                <div className="committee-tables__date">({shortDate(s.date)})</div>
              </th>
            ))}
            <th className="der">
              Se añaden
              <div className="committee-tables__date">({shortDate(current.date)})</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.table4.rows.map((r) => <tr key={r.ministry}>{row(r)}</tr>)}
        </tbody>
        <tfoot>
          <tr>{row(data.table4.total)}</tr>
          {/* "Avance en puntos porcentuales": how much the total moved since the previous session */}
          <tr className="committee-tables__points">
            <td>Avance en puntos porcentuales</td>
            <td />
            {data.table4.pointsGained.map((p, i) => (
              <td key={data.sessions[i].number} className="der">
                {p === null ? '' : formatNumber(p, 1)}
              </td>
            ))}
            <td />
          </tr>
        </tfoot>
      </table>
    </TablePanel>
  )
}

export function CommitteeTables() {
  const { datos, cargando, error, recargar } = useApi<CommitteeTablesData>('/committee-tables')

  return (
    <>
      <div className="pagina-header">
        <div className="pagina-header__texto">
          <h1>Tablas del comité</h1>
          <p className="pagina-header__descripcion">
            Las tablas de la presentación de cada sesión (hoja <strong>"Tablas PPT Actualizada"</strong> del Excel),
            calculadas en vivo con los datos de la base.
          </p>
        </div>
      </div>

      <Contenido cargando={cargando} error={error} datos={datos} recargar={recargar}>
        {(data) => (
          <>
            <div className="alerta alerta--info">
              Sesión vigente: <strong>Sesión {data.currentSession.number}</strong> ({formatDate(data.currentSession.date)})
              {data.previousSession && (
                <> · sesión anterior: Sesión {data.previousSession.number} ({formatDate(data.previousSession.date)})</>
              )}
              {' '}· línea base: {formatDate(data.baselineDate)}.
            </div>

            <div className="committee-tables__stack">
              <Table1 data={data} />
              <Table11 data={data} />
              <StageTable title="Tabla 2.1: proyectos totales por etapa" countLabel="Cantidad de proyectos" table={data.table21} />
              <StageTable title="Tabla 2.2: proyectos liberados por etapa" countLabel="Proyectos liberados" table={data.table22} />
              <Table3 data={data} />
              <Table4 data={data} />
            </div>

            {data.permitsOutsideListedMinistries > 0 && (
              <div className="alerta alerta--aviso mt-16">
                {formatNumber(data.permitsOutsideListedMinistries)} permisos son de ministerios que la planilla no
                lista en las Tablas 3 y 4, así que no aparecen ahí.
              </div>
            )}
          </>
        )}
      </Contenido>
    </>
  )
}
