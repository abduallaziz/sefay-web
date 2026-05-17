'use client'

import { useState } from 'react'
import { useAuditLogs } from '@/features/superadmin/audit/hooks/useAuditLogs'
import type { AuditLog } from '@/features/superadmin/audit/api/audit.api'

export default function AuditPage() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [from_date, setFromDate] = useState('')
  const [to_date, setToDate] = useState('')

  const { data, isLoading, isError } = useAuditLogs({ page, limit: 30, action, from_date, to_date })

  function actionColor(action: string) {
    if (action.includes('delete')) return 'bg-red-500/10 text-red-400'
    if (action.includes('create')) return 'bg-green-500/10 text-green-400'
    if (action.includes('update')) return 'bg-blue-500/10 text-blue-400'
    return 'bg-gray-500/10 text-gray-400'
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">سجل الأحداث</h1>

      <div className="flex gap-3 flex-wrap">
        <input
          placeholder="نوع الإجراء..."
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1) }}
          className="bg-[#141720] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <input
          type="date"
          value={from_date}
          onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
          className="bg-[#141720] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        />
        <input
          type="date"
          value={to_date}
          onChange={(e) => { setToDate(e.target.value); setPage(1) }}
          className="bg-[#141720] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="bg-[#141720] rounded-xl border border-[#1e2130] overflow-hidden">
        <div className="p-4 border-b border-[#1e2130]">
          <p className="text-sm text-gray-500">
            إجمالي: <span className="font-semibold text-white">{data?.total ?? '—'}</span> حدث
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-400">حدث خطأ في تحميل البيانات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0f1117] text-gray-500 text-xs">
                <tr>
                  <th className="text-right px-4 py-3">الإجراء</th>
                  <th className="text-right px-4 py-3">الكيان</th>
                  <th className="text-right px-4 py-3">المستخدم</th>
                  <th className="text-right px-4 py-3">التاريخ</th>
                  <th className="text-right px-4 py-3">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2130]">
                {data?.data.map((log: AuditLog) => {
                  const detailsText = log.details
                    ? Object.entries(log.details)
                        .slice(0, 2)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' | ')
                    : '—'

                  return (
                    <tr key={log.id} className="hover:bg-[#1e2130] transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{log.entity ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                        {log.user_id ? log.user_id.slice(0, 8) : 'system'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(log.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td
                        className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate"
                        title={JSON.stringify(log.details)}
                      >
                        {detailsText}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > 30 && (
          <div className="p-4 border-t border-[#1e2130] flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm text-gray-400 hover:text-white disabled:opacity-30"
            >
              السابق
            </button>
            <span className="text-xs text-gray-500">صفحة {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={data.data.length < 30}
              className="text-sm text-gray-400 hover:text-white disabled:opacity-30"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  )
}