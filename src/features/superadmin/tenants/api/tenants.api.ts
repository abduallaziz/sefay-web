import axiosInstance from '@/lib/api'

export type Tenant = {
  id: string
  name: string
  plan: string
  status: string
  phone: string
  email: string
  business_type: string
  created_at: string
  trial_ends_at: string
}

export async function fetchTenants(search?: string): Promise<Tenant[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  const res = await axiosInstance.get(`/superadmin/tenants?${params}`)
  return res.data.tenants || res.data || []
}