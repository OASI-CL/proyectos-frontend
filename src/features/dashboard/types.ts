/** Types for the dashboard payload (`GET /dashboard`) and catalog. */

export type PermitTrackingStatus = 'pending' | 'overdue' | 'resolved'

export type RcaStatus = 'approved' | 'in_review' | 'suspended' | 'unknown' | 'other'

export interface DashboardKpis {
  projectCount: number
  investmentMmusd: number
  constructionJobs: number
  operationJobs: number
  permitCount: number
  pendingPermitCount: number
  overduePermitCount: number
  resolvedPermitCount: number
}

export interface RegionProjectRow {
  region: string
  projectCount: number
  investmentMmusd: number
  constructionJobs: number
  operationJobs: number
}

export interface SectorProjectRow {
  sector: string
  projectCount: number
  investmentMmusd: number
  constructionJobs: number
  operationJobs: number
}

export interface RcaStatusRow {
  rcaStatus: RcaStatus
  projectCount: number
  investmentMmusd: number
}

export interface TimelineProject {
  id: number
  idExcel: string | null
  name: string
  companyName: string | null
  sector: string | null
  region: string | null
  projectStatus: string | null
  rcaStatus: RcaStatus
  investmentMmusd: number | null
  constructionStartOn: string
  permitCount: number
  pendingPermitCount: number
}

export interface MapProject {
  id: number
  idExcel: string | null
  name: string
  companyName: string | null
  sector: string | null
  region: string | null
  projectStatus: string | null
  investmentMmusd: number | null
}

export interface MonitorProject {
  id: number
  idExcel: string | null
  name: string
  companyName: string | null
  sector: string | null
  region: string | null
  investmentMmusd: number | null
  constructionStartOn: string
  pendingPermitCount: number
}

export interface MonitorBucket {
  projectCount: number
  investmentMmusd: number
  constructionJobs: number
  operationJobs: number
  projects: MonitorProject[]
}

export interface AgencyPermitRow {
  agency: string
  agencyId: number
  ministry: string
  total: number
  pending: number
  overdue: number
  resolved: number
}

export interface RegionPermitRow {
  region: string
  total: number
  pending: number
  overdue: number
  resolved: number
}

export interface PermitStatusRow {
  status: PermitTrackingStatus
  permitCount: number
}

export interface CriticalPermit {
  id: number
  idExcel: string | null
  name: string
  agency: string
  projectId: number
  projectName: string
  companyName: string | null
  trackingStatus: PermitTrackingStatus
  overdueDays: number | null
  daysInProcess: number | null
  expectedResolutionOn: string | null
  investmentMmusd: number | null
  constructionStartOn: string | null
  priority: 'high' | 'normal'
}

export interface DashboardData {
  kpis: DashboardKpis
  projectsByRegion: RegionProjectRow[]
  projectsBySector: SectorProjectRow[]
  rcaStatus: RcaStatusRow[]
  timeline: TimelineProject[]
  mapProjects: MapProject[]
  monitor: { upcoming: MonitorBucket }
  permitsByAgency: AgencyPermitRow[]
  permitsByRegion: RegionPermitRow[]
  permitStatus: PermitStatusRow[]
  criticalPermits: CriticalPermit[]
}

// --- Catalog (`GET /catalog`) -----------------------------------------------

export interface CatalogProject {
  id: number
  idExcel: string | null
  name: string
  companyId: number
  sector: string | null
  region: string | null
  projectStatus: string | null
  rcaStatus: RcaStatus
  agencyIds: number[]
}

export interface Catalog {
  ministries: { id: number; name: string }[]
  agencies: { id: number; name: string; ministryId: number }[]
  companies: { id: number; name: string }[]
  sectors: string[]
  regions: string[]
  projectStatuses: string[]
  projects: CatalogProject[]
}
