// ----------------------------------------------------------------------------
// "Exportar a Excel" of the Permisos page: builds a real .xlsx in the browser
// from GET /permisos/export (pending permits matching the page filters).
//
// Built here and not in the backend because returning a binary file through
// API Gateway + Lambda is fragile; JSON is not. exceljs is loaded on demand
// (dynamic import) so it only weighs on the page when someone clicks export.
// ----------------------------------------------------------------------------

/** One row of GET /permisos/export (camelCase, see models/permisos.ts). */
export interface PermitExportRow {
  permitCode: string | null
  agency: string
  ministry: string
  permitName: string
  permitType: string | null
  fileNumber: string | null
  status: string
  submittedOn: string | null
  daysInProcess: number | null
  trafficLight: string | null
  enablesConstruction: boolean | null
  projectCode: string | null
  projectName: string
  owner: string | null
  company: string | null
  sector: string | null
  region: string | null
  investmentMmusd: number | null
  constructionJobs: number | null
  operationJobs: number | null
}

const TRAFFIC_LIGHT_LABELS: Record<string, string> = {
  en_plazo: 'En plazo',
  en_alerta: 'En alerta',
  critico: 'Atrasado',
  finalizado: 'Finalizado',
}

/** Columns in the order the team asked for: permit first, then its project. */
const COLUMNS: { header: string; width: number; value: (r: PermitExportRow) => unknown; numFmt?: string }[] = [
  { header: 'Código permiso', width: 14, value: (r) => r.permitCode },
  { header: 'Organismo', width: 22, value: (r) => r.agency },
  { header: 'Ministerio', width: 34, value: (r) => r.ministry },
  { header: 'Nombre permiso (titular)', width: 60, value: (r) => r.permitName },
  { header: 'Tipo de permiso', width: 24, value: (r) => r.permitType },
  { header: 'N° expediente', width: 18, value: (r) => r.fileNumber },
  { header: 'Estado', width: 12, value: (r) => r.status },
  { header: 'Fecha de ingreso', width: 14, value: (r) => toDate(r.submittedOn), numFmt: 'dd-mm-yyyy' },
  { header: 'Días de tramitación', width: 12, value: (r) => r.daysInProcess },
  { header: 'Semáforo', width: 12, value: (r) => (r.trafficLight ? TRAFFIC_LIGHT_LABELS[r.trafficLight] ?? r.trafficLight : null) },
  { header: 'Habilitante construcción', width: 14, value: (r) => (r.enablesConstruction ? 'Sí' : 'No') },
  { header: 'Código proyecto', width: 12, value: (r) => r.projectCode },
  { header: 'Proyecto', width: 50, value: (r) => r.projectName },
  { header: 'Titular', width: 34, value: (r) => r.owner },
  { header: 'Empresa', width: 28, value: (r) => r.company },
  { header: 'Sector', width: 16, value: (r) => r.sector },
  { header: 'Región', width: 16, value: (r) => r.region },
  { header: 'Inversión (MMUSD)', width: 14, value: (r) => r.investmentMmusd, numFmt: '#,##0.0' },
  { header: 'Empleo construcción', width: 14, value: (r) => r.constructionJobs, numFmt: '#,##0' },
  { header: 'Empleo operación', width: 14, value: (r) => r.operationJobs, numFmt: '#,##0' },
]

/** 'YYYY-MM-DD' -> Date at noon UTC (so no timezone can move it to the day before). */
function toDate(iso: string | null): Date | null {
  if (!iso) return null
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12))
}

/** Builds the workbook and makes the browser download it. */
export async function downloadPermitsXlsx(rows: PermitExportRow[], fileName: string) {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Permisos pendientes', {
    views: [{ state: 'frozen', ySplit: 1 }], // header row stays visible
  })

  sheet.columns = COLUMNS.map((c, i) => ({ header: c.header, key: `c${i}`, width: c.width }))
  for (const row of rows) {
    sheet.addRow(Object.fromEntries(COLUMNS.map((c, i) => [`c${i}`, c.value(row) ?? null])))
  }
  COLUMNS.forEach((c, i) => {
    if (c.numFmt) sheet.getColumn(i + 1).numFmt = c.numFmt
  })

  const header = sheet.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F69B4' } }
  header.alignment = { vertical: 'middle', wrapText: true }
  header.height = 30
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } }

  const buffer = await workbook.xlsx.writeBuffer()
  const url = URL.createObjectURL(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
