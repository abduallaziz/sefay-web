import { useQuery } from '@tanstack/react-query'
import { getAuditLogs, type AuditFilters } from '../api/audit.api'

export function useAuditLogs(filters: AuditFilters) {
  return useQuery({
    queryKey: ['audit', filters],
    queryFn: () => getAuditLogs(filters),
  })
}