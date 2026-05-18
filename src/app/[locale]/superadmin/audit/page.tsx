'use client'

import React, { useState } from 'react'
import { useAuditLogs } from '@/features/superadmin/audit/hooks/useAuditLogs'
import type { AuditLog } from '@/features/superadmin/audit/api/audit.api'
import { DatePicker } from '@/components/ui/date-picker'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${day} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function DetailsCell({ details }: { details: Record<string, unknown> | null }) {
  if (!details) return <span className="text-gray-600">—</span>

  const entries = Object.entries(details).slice(0, 2).reverse()

  return (
    <span className="flex items-center gap-1 flex-wrap justify-end">
      {entries.map(([k, v], i) => {
        if (v === null || v === undefined) return null

        let val = ''
        if (Array.isArray(v)) val = `[${(v as unknown[]).length}]`
        else if (typeof v === 'object') val = '{}'
        else if (typeof v === 'number') val = String(Math.round(v * 100) / 100)
        else val = String(v)

        return (
          <React.Fragment key={k}>
            {i < entries.length - 1 && (
              <span className="text-gray-600 mx-1">•</span>
            )}
            <span className="text-xs" dir="ltr">
              <span className="text-gray-500">{k}:</span>{' '}
              <span className="text-gray-300">{val}</span>
            </span>
          </React.Fragment>
        )
      })}
    </span>
  )
}

export default function AuditPage() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [from_date, setFromDate] = useState('')
  const [to_date, setToDate] = useState('')

  const { data, isLoading, isError } = useAuditLogs({ page, limit: 30, action, from_date, to_date })

  function actionColor(a: string) {
    if (a.includes('delete')) return 'bg-red-500/10 text-red-400'
    if (a.includes('create')) return 'bg-green-500/10 text-green-400'
    if (a.includes('update')) return 'bg-blue-500/10 text-blue-400'
    return 'bg-gray-500/10 text-gray-400'
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">سجل الأحداث</h1>

      <div className="flex gap-3 flex-wrap items-center">
        <input
          placeholder="نوع الإجراء..."
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1) }}
          className="bg-[#141720] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <DatePicker
          value={from_date}
          onChange={(v) => { setFromDate(v); setPage(1) }}
          placeholder="من تاريخ"
        />
        <DatePicker
          value={to_date}
          onChange={(v) => { setToDate(v); setPage(1) }}
          placeholder="إلى تاريخ"
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
                  <th className="text-right px-4 py-3 w-36">الإجراء</th>
                  <th className="text-right px-4 py-3 w-24">الكيان</th>
                  <th className="text-right px-4 py-3 w-32">المستخدم</th>
                  <th className="text-right px-4 py-3 w-32">التاريخ</th>
                  <th className="text-right px-4 py-3">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2130]">
                {data?.data.map((log: AuditLog) => (
                  <tr key={log.id} className="hover:bg-[#1e2130] transition-colors">
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs text-right">
                      {log.entity ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs text-right">
                      {log.users?.name ?? log.users?.email ?? 'system'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs text-right">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <DetailsCell details={log.details} />
                    </td>
                  </tr>
                ))}
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