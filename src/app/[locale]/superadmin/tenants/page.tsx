'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Copy } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

type Tenant = {
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

export default function TenantsPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  const headers = { Authorization: `Bearer ${token}` }

  async function fetchTenants() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`${API}/superadmin/tenants?${params}`, { headers })
      const data = await res.json()
      setTenants(data.tenants || data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTenants() }, [])

  function copyId(id: string) {
    navigator.clipboard.writeText(id)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function statusColor(status: string) {
    if (status === 'active') return 'bg-green-100 text-green-700'
    if (status === 'inactive' || status === 'suspended') return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-700'
  }

  function planColor(plan: string) {
    if (plan === 'enterprise') return 'bg-purple-100 text-purple-700'
    if (plan === 'pro') return 'bg-blue-100 text-blue-700'
    if (plan === 'starter') return 'bg-teal-100 text-teal-700'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المشتركين</h1>
      </div>

      <div className="flex gap-3">
        <input
          placeholder="بحث بالاسم أو الجوال..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchTenants()}
          className="border rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchTenants}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <Search size={14} /> بحث
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <p className="text-sm text-gray-500">
            إجمالي: <span className="font-semibold text-gray-800">{tenants.length}</span> مشترك
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center text-gray-400">لا يوجد مشتركين</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
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
              <tbody className="divide-y">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{tenant.name}</td>
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
                    <td className="px-4 py-3 text-gray-500">{tenant.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{tenant.business_type || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-gray-400">{tenant.id}</span>
                        <button
                          onClick={() => copyId(tenant.id)}
                          className="text-gray-400 hover:text-blue-600"
                          title="نسخ"
                        >
                          {copied === tenant.id
                            ? <span className="text-green-500 text-xs">✓</span>
                            : <Copy size={12} />
                          }
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(tenant.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/ar/superadmin/tenants/${tenant.id}`)}
                        className="text-blue-600 hover:underline text-xs"
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