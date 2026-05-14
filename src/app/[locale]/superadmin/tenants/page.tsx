// C:\sefay-platform\apps\web-dashboard\src\app\ar\superadmin\audit\page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Shield, Search, Filter } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

type AuditLog = {
  id: string
  tenant_id: string | null
  user_id: string | null
  action: string
  entity: string | null
  entity_id: string | null
  details: any
  created_at: string
  tenants?: { name: string }
  users?: { name: string; email: string }
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [filters, setFilters] = useState({
    tenant_id: '',
    action: '',
    from_date: '',
    to_date: '',
  })

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  const headers = { Authorization: `Bearer ${token}` }

  async function fetchLogs(p = 1) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '30' })
      if (filters.tenant_id) params.set('tenant_id', filters.tenant_id)
      if (filters.action) params.set('action', filters.action)
      if (filters.from_date) params.set('from_date', filters.from_date)
      if (filters.to_date) params.set('to_date', filters.to_date)

      const res = await fetch(`${API}/superadmin/audit?${params}`, { headers })
      const json = await res.json()
      setLogs(json.data || [])
      setTotal(json.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs(1) }, [])

  function handleSearch() {
    setPage(1)
    fetchLogs(1)
  }

  const totalPages = Math.ceil(total / 30)

  // لون حسب نوع العملية
  function actionColor(action: string) {
    if (action.includes('delete') || action.includes('حذف')) return 'bg-red-100 text-red-700'
    if (action.includes('create') || action.includes('إنشاء')) return 'bg-green-100 text-green-700'
    if (action.includes('update') || action.includes('تعديل')) return 'bg-blue-100 text-blue-700'
    if (action.includes('login') || action.includes('تسجيل')) return 'bg-purple-100 text-purple-700'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Shield className="text-blue-500" size={24} />
        <div>
          <h1 className="text-2xl font-bold">سجل العمليات</h1>
          <p className="text-gray-500 text-sm">تتبع كل العمليات الحساسة في النظام</p>
        </div>
      </div>

      {/* فلاتر */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-600">
          <Filter size={14} /> فلترة
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input
            placeholder="بحث بالعملية..."
            value={filters.action}
            onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="ID المشترك..."
            value={filters.tenant_id}
            onChange={e => setFilters(f => ({ ...f, tenant_id: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={filters.from_date}
            onChange={e => setFilters(f => ({ ...f, from_date: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={filters.to_date}
            onChange={e => setFilters(f => ({ ...f, to_date: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleSearch}
          className="mt-3 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <Search size={14} /> بحث
        </button>
      </div>

      {/* الجدول */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <p className="text-sm text-gray-500">إجمالي: <span className="font-semibold text-gray-800">{total}</span> سجل</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">لا توجد سجلات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-right px-4 py-3">التاريخ</th>
                  <th className="text-right px-4 py-3">العملية</th>
                  <th className="text-right px-4 py-3">المشترك</th>
                  <th className="text-right px-4 py-3">المستخدم</th>
                  <th className="text-right px-4 py-3">الكيان</th>
                  <th className="text-right px-4 py-3">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('ar-SA')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {log.tenants?.name ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {log.users?.name ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {log.entity ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <button
              onClick={() => { setPage(p => p - 1); fetchLogs(page - 1) }}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              السابق
            </button>
            <span className="text-sm text-gray-500">
              صفحة {page} من {totalPages}
            </span>
            <button
              onClick={() => { setPage(p => p + 1); fetchLogs(page + 1) }}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  )
}