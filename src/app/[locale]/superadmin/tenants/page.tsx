'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Search, Filter, Plus } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

type Tenant = {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  phone: string
  email: string
  city: string
  business_type: string
  onboarded: boolean
  created_at: string
  trial_ends_at: string | null
  sub_end: string | null
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  inactive:  'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
  deleted:   'bg-red-200 text-red-800',
  trial:     'bg-yellow-100 text-yellow-700',
}

const STATUS_LABELS: Record<string, string> = {
  active:    'نشط',
  inactive:  'معطل',
  suspended: 'موقوف',
  deleted:   'محذوف',
  trial:     'تجريبي',
}

export default function TenantsPage() {
  const router = useRouter()
  const [tenants, setTenants]   = useState<Tenant[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [plan, setPlan]         = useState('')

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (plan)   params.set('plan', plan)

      const res = await fetch(`${API}/superadmin/tenants?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setTenants(Array.isArray(data) ? data : [])
    } catch {
      setTenants([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTenants() }, [status, plan])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTenants()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">المشتركين</h1>
          <span className="bg-blue-100 text-blue-700 text-sm px-2 py-0.5 rounded-full">
            {tenants.length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute right-3 top-2.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الإيميل أو الجوال..."
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="trial">تجريبي</option>
            <option value="inactive">معطل</option>
            <option value="suspended">موقوف</option>
            <option value="deleted">محذوف</option>
          </select>

          <select
            value={plan}
            onChange={e => setPlan(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">كل الخطط</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
          >
            <Search size={14} />
            بحث
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">جاري التحميل...</div>
        ) : tenants.length === 0 ? (
          <div className="p-12 text-center text-gray-400">لا توجد نتائج</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">الاسم</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">النوع</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">الخطة</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">الحالة</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">المدينة</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">تاريخ الانتهاء</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">تاريخ الانضمام</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{t.name}</div>
                    <div className="text-gray-400 text-xs">{t.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.business_type || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full capitalize">
                      {t.plan || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[t.status] || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.city || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.sub_end ? new Date(t.sub_end).toLocaleDateString('ar-SA') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(t.created_at).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => router.push(`/ar/superadmin/tenants/${t.id}`)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      تفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}