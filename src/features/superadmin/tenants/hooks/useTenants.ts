import { useQuery } from '@tanstack/react-query'
import { fetchTenants } from '../api/tenants.api'

export function useTenants(search?: string) {
  return useQuery({
    queryKey: ['tenants', search],
    queryFn: () => fetchTenants(search),
  })
}