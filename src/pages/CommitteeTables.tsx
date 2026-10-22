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
  total: number
  inProgress: number
  resolved: number | null
  progress: number | null
  resolvedSincePreviousSession: number | null
  over6Months: number
  over6MonthsShare: number
  statutoryDays: number
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
  currentSession: Session
  previousSession: Session | null
  sessions: Session[]
  table1: Table1Column[]
  table11: { projects: number; investmentMmusd: number; constructionJobs: number }
  table21: { rows: StageRow[]; total: StageRow }
  table22: { rows: StageRow[]; total: StageRow }
  table3: { rows: Table3Row[]; total: Table3Row }
  table4: { rows: Table4Row[]; total: Table4Row }
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
    <TablePanel title="Tabla 1: proyectos y permisos pendientes por sesión">
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
  const row = (r: Table3Row) => (
    <>
      <td>{r.ministry}</td>
      <td className="der">{formatNumber(r.total)}</td>
      <td className="der">{formatNumber(r.inProgress)}</td>
      <td className="der">{r.resolved === null ? <span className="texto-tenue">{NO_DATA}</span> : formatNumber(r.resolved)}</td>
      <td className="der">{r.progress === null ? '' : percent(r.progress)}</td>
      <td className="der">{r.resolvedSincePreviousSession === null ? '' : formatNumber(r.resolvedSincePreviousSession)}</td>
      <td className="der">{formatNumber(r.over6Months)}</td>
      <td className="der">{percent(r.over6MonthsShare)}</td>
      <td className="der">{formatNumber(r.statutoryDays)}</td>
    </>
  )
  return (
    <TablePanel
      title="Tabla 3: avance y nivel de atraso de permisos por Ministerio"
      subtitle={`Permisos ingresados hasta la sesión ${data.previousSession?.number ?? data.currentSession.number}, resueltos hasta la sesión ${data.currentSession.number}. No incluye los que se registraron en la sesión ${data.currentSession.number}.`}
    >
      <table className="tabla committee-tables">
        <thead>
          <tr>
            <th rowSpan={2}>Ministerio</th>
            <th colSpan={4} className="centro">Permisos totales</th>
            <th className="der">Resueltos desde</th>
            <th colSpan={2} className="centro">Permisos +6 meses</th>
            <th rowSpan={2} className="der">Plazo normativo<br />(días prom. ponderado)</th>
          </tr>
          <tr>
            <th className="der">Totales</th>
            <th className="der">En trámite</th>
            <th className="der">Resueltos</th>
            <th className="der">% Avance</th>
            <th className="der">sesión anterior</th>
            <th className="der">N°</th>
            <th className="der">%</th>
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
          {p === null ? (i === 0 ? <span className="texto-tenue">{NO_DATA}</span> : '') : percent(p)}
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
            Las tablas de la presentación de cada sesión (hoja <strong>"Tablas PPT"</strong> del Excel),
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
                lista en las Tablas 3 y 4 (por ejemplo Medio Ambiente o Transportes), así que no aparecen ahí.
              </div>
            )}
          </>
        )}
      </Contenido>
    </>
  )
}
