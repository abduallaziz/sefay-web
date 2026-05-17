export const tenantKeys = {
  all: ['tenants'] as const,
  list: (search?: string) => ['tenants', search] as const,
  detail: (id: string) => ['tenant', id] as const,
}