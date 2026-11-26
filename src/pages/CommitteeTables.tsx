import { Fragment, type ReactNode } from 'react'
import { useApi } from '../hooks/useApi'
import { Contenido } from '../components/Estados'
import { formatDate, formatNumber } from '../lib/formatters'

// ----------------------------------------------------------------------------
// "Tablas CME" view: the committee presentation tables, replicating the
// sheet of the same name in the Excel (called "Tablas PPT Actualizada" until
// the 26-11-2026 version). All the logic lives in the backend
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
  withdrawnProjects: number
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
  resolvedAtPrevious: number | null
  resolvedBetween: number | null
  resolvedTotal: number | null
  progress: number | null
  added: number
  statutoryDays: number | null
  noData: boolean
}

interface Table4Row {
  ministry: string
  total: number
  progressBySession: (number | null)[]
  added: number
  noData: boolean
}

interface Table31Row {
  ministry: string
  agency: string
  totalAtPrevious: number
  pendingAtPrevious: number
  resolvedAtPrevious: number
  resolvedBetween: number
  resolvedTotal: number
  progress: number
  added: number
}

interface Table41Row {
  ministry: string
  agency: string
  total: number
  progressBySession: (number | null)[]
  added: number
}

interface UrgencyCounts {
  total: number
  resolved: number
  resolvedBetween: number
  /** null = the sheet's "-" (no permits). */
  resolvedShare: number | null
}

interface UrgencyRow {
  ministry: string
  agency: string
  nearConstruction: UrgencyCounts
  investmentOrJobs: UrgencyCounts
  total: UrgencyCounts
}

interface PriorityGroup {
  projects: number
  investmentMmusd: number
  pendingPermits: number
}

interface CommitteeTablesData {
  computedOn: string
  baselineDate: string
  secondBatchDate: string
  thirdBatchDate: string
  currentSession: Session
  previousSession: Session | null
  sessions: Session[]
  summary: { nearConstruction: PriorityGroup; investmentOrJobs: PriorityGroup }
  table1: Table1Column[]
  table21: { rows: StageRow[]; total: StageRow }
  table22: { rows: StageRow[]; total: StageRow }
  table3: { rows: Table3Row[]; total: Table3Row }
  table4: { rows: Table4Row[]; total: Table4Row; pointsGained: (number | null)[] }
  urgency: { rows: UrgencyRow[]; total: UrgencyRow }
  table31: { rows: Table31Row[]; total: Table31Row }
  table41: { rows: Table41Row[]; total: Table41Row; pointsGained: (number | null)[] }
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
    { label: 'Desistidos', key: 'withdrawnProjects' },
    { label: 'Permisos totales', key: 'totalPermits', group: true },
    { label: 'En trámite', key: 'permitsInProgress' },
    { label: 'Resueltos', key: 'resolvedPermits' },
    { label: 'Nuevos', key: 'newPermits' },
  ]
  return (
    <TablePanel
      title="Tabla 1: proyectos y permisos pendientes por sesión"
      subtitle={
        `Desde el ${formatDate(data.secondBatchDate)} se suman los proyectos del catastro 2 (cada uno desde su sesión de ingreso)` +
        ` y desde el ${formatDate(data.thirdBatchDate)} los del catastro 3. En la última sesión, "Liberados" incluye` +
        ` las correcciones de la columna Factibilidad.`
      }
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

/**
 * The sheet's sentence under Table 1 (B18): priority projects according to
 * the "Urgencia" column, with their investment and pending permits.
 */
function PrioritySummary({ data }: { data: CommitteeTablesData }) {
  const { nearConstruction: near, investmentOrJobs: inv } = data.summary
  return (
    <div className="alerta alerta--info">
      {formatNumber(near.projects)} proyectos priorizados por proximidad a construir, equivalentes a $
      {formatNumber(near.investmentMmusd, 0)} MMUSD, con {formatNumber(near.pendingPermits)} permisos pendientes
      asociados, y {formatNumber(inv.projects)} proyectos priorizados por inversión y/o empleo, equivalentes a $
      {formatNumber(inv.investmentMmusd, 0)} MMUSD, con {formatNumber(inv.pendingPermits)} permisos pendientes asociados
    </div>
  )
}

function StageTable({ title, subtitle, countLabel, table }: { title: string; subtitle?: string; countLabel: string; table: CommitteeTablesData['table21'] }) {
  return (
    <TablePanel title={title} subtitle={subtitle}>
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
  // null = the sheet leaves the cell empty.
  const cell = (value: number | null) => (value === null ? '' : formatNumber(value))
  const row = (r: Table3Row) => (
    <>
      <td>{r.ministry}</td>
      <td className="der">{formatNumber(r.totalAtPrevious)}</td>
      <td className="der">
        {r.noData ? <span className="texto-tenue">{NO_DATA}</span> : cell(r.pendingAtPrevious)}
      </td>
      <td className="der">{cell(r.resolvedAtPrevious)}</td>
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
      subtitle={`Permisos ingresados hasta la sesión ${prev}; los registrados en la sesión ${curr} (la última del calendario) van aparte en "Se añaden".`}
    >
      <table className="tabla committee-tables">
        <thead>
          <tr>
            <th rowSpan={2}>Ministerio</th>
            <th colSpan={2} className="centro">Permisos totales</th>
            <th colSpan={4} className="centro">Resueltos</th>
            <th rowSpan={2} className="der">Se añaden<br />(Comité {curr})</th>
            <th rowSpan={2} className="der">Plazo normativo<br />(días prom. ponderado)</th>
          </tr>
          <tr>
            <th className="der">Totales al Comité {prev}</th>
            <th className="der">Pendientes al Comité {prev}</th>
            <th className="der">Al Comité {prev}</th>
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
          {/* "Sin información" where the sheet says so; empty when the ministry has no permits */}
          {p === null ? (i === 0 && r.noData ? <span className="texto-tenue">{NO_DATA}</span> : '') : percent(p)}
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

/**
 * "Permisos priorizados resueltos por servicio, según urgencia": universe
 * permits of priority projects, by agency, for each "Urgencia" group.
 */
function UrgencyTable({ data }: { data: CommitteeTablesData }) {
  const prev = data.previousSession?.number ?? data.currentSession.number
  const curr = data.currentSession.number
  const groups: { key: 'nearConstruction' | 'investmentOrJobs' | 'total'; label: string }[] = [
    { key: 'nearConstruction', label: 'Urgencia por próximo a inicio de construcción' },
    { key: 'investmentOrJobs', label: 'Urgencia por inversión y/o empleo' },
    { key: 'total', label: 'Totales urgencia' },
  ]
  // "-" where the sheet writes it (no permits in that group).
  const share = (c: UrgencyCounts) => (c.resolvedShare === null ? '-' : percent(c.resolvedShare))
  const row = (r: UrgencyRow) => (
    <>
      <td>{r.ministry}</td>
      <td>{r.agency}</td>
      {groups.map((g) => (
        <Fragment key={g.key}>
          <td className="der">{formatNumber(r[g.key].total)}</td>
          <td className="der">{formatNumber(r[g.key].resolved)}</td>
          <td className="der">{formatNumber(r[g.key].resolvedBetween)}</td>
          <td className="der">{share(r[g.key])}</td>
        </Fragment>
      ))}
    </>
  )
  return (
    <TablePanel
      title="Permisos priorizados resueltos por servicio, según urgencia"
      subtitle={
        'Universo: permisos en universo. Próximo a inicio de construcción = Urgencia "Próximos a iniciar construcción 1/2";' +
        ' inversión y/o empleo = Urgencia "Inversión", "Empleo" o "Inversión y Empleo".'
      }
    >
      <table className="tabla committee-tables">
        <thead>
          <tr>
            <th rowSpan={2}>Ministerio</th>
            <th rowSpan={2}>Servicio</th>
            {groups.map((g) => (
              <th key={g.key} colSpan={4} className="centro">{g.label}</th>
            ))}
          </tr>
          <tr>
            {groups.map((g) => (
              <Fragment key={g.key}>
                <th className="der">Total</th>
                <th className="der">Resueltos (#)</th>
                <th className="der">Resueltos entre {prev} y {curr}</th>
                <th className="der">Resueltos (%)</th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.urgency.rows.map((r) => <tr key={r.agency}>{row(r)}</tr>)}
        </tbody>
        <tfoot>
          <tr>{row(data.urgency.total)}</tr>
        </tfoot>
      </table>
    </TablePanel>
  )
}

/** Tabla 3.1: Table 3 by agency. */
function Table31({ data }: { data: CommitteeTablesData }) {
  const prev = data.previousSession?.number ?? data.currentSession.number
  const curr = data.currentSession.number
  const row = (r: Table31Row) => (
    <>
      <td>{r.ministry}</td>
      <td>{r.agency}</td>
      <td className="der">{formatNumber(r.totalAtPrevious)}</td>
      <td className="der">{formatNumber(r.pendingAtPrevious)}</td>
      <td className="der">{formatNumber(r.resolvedAtPrevious)}</td>
      <td className="der">{formatNumber(r.resolvedBetween)}</td>
      <td className="der">{formatNumber(r.resolvedTotal)}</td>
      <td className="der">{percent(r.progress)}</td>
      <td className="der committee-tables__added">{formatNumber(r.added)}</td>
    </>
  )
  return (
    <TablePanel
      title="Tabla 3.1: avance y nivel de atraso de permisos por Organismo"
      subtitle={`Mismo cálculo que la Tabla 3, por organismo. Los registrados en la sesión ${curr} van aparte en "Se añaden".`}
    >
      <table className="tabla committee-tables">
        <thead>
          <tr>
            <th rowSpan={2}>Ministerio</th>
            <th rowSpan={2}>Servicio</th>
            <th colSpan={2} className="centro">Permisos totales</th>
            <th colSpan={4} className="centro">Resueltos</th>
            <th rowSpan={2} className="der">Se añaden<br />(Comité {curr})</th>
          </tr>
          <tr>
            <th className="der">Totales al Comité {prev}</th>
            <th className="der">Pendientes al Comité {prev}</th>
            <th className="der">Al Comité {prev}</th>
            <th className="der">Entre Comité {prev} y {curr}</th>
            <th className="der">Totales</th>
            <th className="der">% Avance</th>
          </tr>
        </thead>
        <tbody>
          {data.table31.rows.map((r) => <tr key={r.agency}>{row(r)}</tr>)}
        </tbody>
        <tfoot>
          <tr>{row(data.table31.total)}</tr>
        </tfoot>
      </table>
    </TablePanel>
  )
}

/** Tabla 4.1: Table 4 by agency. */
function Table41({ data }: { data: CommitteeTablesData }) {
  const current = data.currentSession
  const row = (r: Table41Row) => (
    <>
      <td>{r.ministry}</td>
      <td>{r.agency}</td>
      <td className="der">{formatNumber(r.total)}</td>
      {r.progressBySession.map((p, i) => (
        // empty when the agency has no permits, like the sheet
        <td key={data.sessions[i].number} className="der">{p === null ? '' : percent(p)}</td>
      ))}
      <td className="der committee-tables__added">{formatNumber(r.added)}</td>
    </>
  )
  return (
    <TablePanel
      title="Tabla 4.1: avance acumulado de permisos resueltos por Organismo, por sesión"
      subtitle={`"Se añaden" = permisos que se registraron en la sesión ${current.number}.`}
    >
      <table className="tabla committee-tables">
        <thead>
          <tr>
            <th>Ministerio</th>
            <th>Servicio</th>
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
          {data.table41.rows.map((r) => <tr key={r.agency}>{row(r)}</tr>)}
        </tbody>
        <tfoot>
          <tr>{row(data.table41.total)}</tr>
          <tr className="committee-tables__points">
            <td>Avance en puntos porcentuales</td>
            <td />
            <td />
            {data.table41.pointsGained.map((p, i) => (
              <td key={data.sessions[i].number} className="der">{p === null ? '' : formatNumber(p, 1)}</td>
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
            Las tablas de la presentación de cada sesión (hoja <strong>"Tablas CME"</strong> del Excel),
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
              <PrioritySummary data={data} />
              <StageTable title="Tabla 2.1: proyectos totales por etapa" countLabel="Cantidad de proyectos" table={data.table21} />
              <StageTable
                title="Tabla 2.2: proyectos liberados por etapa"
                subtitle='Agrupados por la columna "etapa_liberados"; sin los desistidos y con las correcciones de Factibilidad.'
                countLabel="Proyectos liberados"
                table={data.table22}
              />
              <Table3 data={data} />
              <Table4 data={data} />
              <UrgencyTable data={data} />
              <Table31 data={data} />
              <Table41 data={data} />
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
