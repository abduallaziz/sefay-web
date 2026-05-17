'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Search, Copy } from 'lucide-react'
import { useTenants } from '@/features/superadmin/tenants/hooks/useTenants'
import type { Tenant } from '@/features/superadmin/tenants/api/tenants.api'

export default function TenantsPage() {
  const { locale } = useParams<{ locale: string }>()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const { data: tenants = [], isLoading } = useTenants(activeSearch)

  function copyId(id: string) {
    navigator.clipboard.writeText(id)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function statusColor(status: string) {
    if (status === 'active') return 'bg-green-500/10 text-green-400'
    if (status === 'suspended') return 'bg-red-500/10 text-red-400'
    return 'bg-yellow-500/10 text-yellow-400'
  }

  function planColor(plan: string) {
    if (plan === 'enterprise') return 'bg-purple-500/10 text-purple-400'
    if (plan === 'pro') return 'bg-blue-500/10 text-blue-400'
    return 'bg-gray-500/10 text-gray-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">المشتركين</h1>
      </div>

      <div className="flex gap-3 flex-row-reverse justify-end">
        <input
          placeholder="بحث بالاسم أو الجوال..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setActiveSearch(search)}
          className="bg-[#141720] border border-[#1e2130] rounded-lg px-3 py-2 text-sm w-72 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={() => setActiveSearch(search)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <Search size={14} /> بحث
        </button>
      </div>

      <div className="bg-[#141720] rounded-xl border border-[#1e2130] overflow-hidden">
        <div className="p-4 border-b border-[#1e2130]">
          <p className="text-sm text-gray-500">
            إجمالي: <span className="font-semibold text-white">{tenants.length}</span> مشترك
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">لا يوجد مشتركين</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0f1117] text-gray-500 text-xs">
                <tr>
                  <th className="text-right px-4 py-3">الاسم</th>
                  <th className="text-right px-4 py-3">الخطة</th>
                  <th className="text-right px-4 py-3">الحالة</th>
                  <th className="text-right px-4 py-3">الجوال</th>
                  <th className="text-right px-4 py-3">النوع</th>
                  <th className="text-right px-4 py-3">ID</th>
                  <th className="text-right px-4 py-3">تاريخ التسجيل</th>
                  <th className="text-right px-4 py-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2130]">
                {tenants.map((tenant: Tenant) => (
                  <tr key={tenant.id} className="hover:bg-[#1e2130] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{tenant.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColor(tenant.plan)}`}>
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(tenant.status)}`}>
                        {tenant.status === 'active' ? 'نشط' : 'معطّل'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{tenant.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{tenant.business_type || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-gray-500">{tenant.id.slice(0, 8)}...</span>
                        <button onClick={() => copyId(tenant.id)} className="text-gray-500 hover:text-blue-400">
                          {copied === tenant.id
                            ? <span className="text-green-400 text-xs">✓</span>
                            : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(tenant.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/${locale}/superadmin/tenants/${tenant.id}`)}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        تفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}