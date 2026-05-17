import api from '@/lib/api'

export interface AuditLog {
  id: string
  tenant_id: string | null
  user_id: string | null
  action: string
  entity: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export interface AuditLogsResponse {
  data: AuditLog[]
  total: number
}

export interface AuditFilters {
  page?: number
  limit?: number
  tenant_id?: string
  action?: string
  from_date?: string
  to_date?: string
}

export async function getAuditLogs(filters: AuditFilters = {}): Promise<AuditLogsResponse> {
  const res = await api.get('/superadmin/audit', { params: filters })
  return res.data
}