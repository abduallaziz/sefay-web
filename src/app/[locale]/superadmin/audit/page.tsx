'use client'

import React, { useState } from 'react'
import { useLocale } from 'next-intl'
import { useAuditLogs } from '@/features/superadmin/audit/hooks/useAuditLogs'
import type { AuditLog } from '@/features/superadmin/audit/api/audit.api'
import { DatePicker } from '@/components/ui/date-picker'

const skipKeys = new Set(['icon', 'email', 'items', 'color', 'name'])
const hideKey = new Set(['name'])

const keyLabels: Record<string, { ar: string; en: string }> = {
  mode:          { ar: 'النوع', en: 'Mode' },
  active:        { ar: 'الحالة', en: 'Status' },
  refund_amount: { ar: 'مبلغ الاسترداد', en: 'Refund' },
  total:         { ar: 'الإجمالي', en: 'Total' },
  items_count:   { ar: 'عدد الأصناف', en: 'Items' },
  price:         { ar: 'السعر', en: 'Price' },
  category:      { ar: 'الفئة', en: 'Category' },
  type:          { ar: 'النوع', en: 'Type' },
}

const valueLabels: Record<string, { ar: string; en: string }> = {
  full:    { ar: 'كامل', en: 'Full' },
  partial: { ar: 'جزئي', en: 'Partial' },
  true:    { ar: 'نشط', en: 'Active' },
  false:   { ar: 'غير نشط', en: 'Inactive' },
  single:  { ar: 'فردي', en: 'Single' },
  price:   { ar: 'السعر', en: 'Price' },
  bundle:  { ar: 'حزمة', en: 'Bundle' },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${day} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function DetailsCell({ details, locale }: { details: Record<string, unknown> | null; locale: string }) {
  const isAr = locale === 'ar'
  if (!details) return <span className="text-gray-600">—</span>

  const entries = Object.entries(details)
    .filter(([k, v]) => {
      if (v === null || v === undefined) return false
      if (typeof v === 'object' && !Array.isArray(v)) return false
      if (skipKeys.has(k)) return false
      return true
    })
    .slice(0, 2)

  if (entries.length === 0) {
    const nameVal = details['name']
    if (nameVal) return <span className="text-gray-300 text-xs">{String(nameVal)}</span>
    return <span className="text-gray-600">—</span>
  }

  const parts = entries.map(([k, v]) => {
    const rawVal = String(typeof v === 'number'
      ? (Number.isInteger(v) ? v : parseFloat(v.toFixed(2)))
      : v)
    const translated = valueLabels[rawVal]
    const displayVal = translated ? (isAr ? translated.ar : translated.en) : rawVal

    if (hideKey.has(k)) return displayVal

    const keyLabel = keyLabels[k]
    const label = keyLabel ? (isAr ? keyLabel.ar : keyLabel.en) : k
    return `${label}: ${displayVal}`
  })

  return (
    <span className="flex items-center gap-1 flex-nowrap overflow-hidden">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <span className="text-gray-300 text-xs whitespace-nowrap">{part}</span>
          {i < parts.length - 1 && (
            <span className="text-gray-600 text-xs mx-1">•</span>
          )}
        </React.Fragment>
      ))}
    </span>
  )
}

export default function AuditPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
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
      <h1 className="text-2xl font-bold text-white">
        {isAr ? 'سجل الأحداث' : 'Audit Log'}
      </h1>

      <div className="flex gap-3 flex-wrap items-center">
        <input
          placeholder={isAr ? 'نوع الإجراء...' : 'Action type...'}
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1) }}
          className="bg-[#141720] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <DatePicker
          value={from_date}
          onChange={(v) => { setFromDate(v); setPage(1) }}
          placeholder={isAr ? 'من تاريخ' : 'From date'}
        />
        <DatePicker
          value={to_date}
          onChange={(v) => { setToDate(v); setPage(1) }}
          placeholder={isAr ? 'إلى تاريخ' : 'To date'}
        />
      </div>

      <div className="bg-[#141720] rounded-xl border border-[#1e2130] overflow-hidden">
        <div className="p-4 border-b border-[#1e2130]">
          <p className="text-sm text-gray-500">
            {isAr ? 'إجمالي:' : 'Total:'}{' '}
            <span className="font-semibold text-white">{data?.total ?? '—'}</span>{' '}
            {isAr ? 'حدث' : 'events'}
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            {isAr ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-400">
            {isAr ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-[#0f1117] text-gray-500 text-xs">
                <tr>
                  <th className="text-right px-4 py-3 w-[140px]">{isAr ? 'الإجراء' : 'Action'}</th>
                  <th className="text-right px-4 py-3 w-[100px]">{isAr ? 'الكيان' : 'Entity'}</th>
                  <th className="text-right px-4 py-3 w-[130px]">{isAr ? 'المستخدم' : 'User'}</th>
                  <th className="text-right px-4 py-3 w-[130px]">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="text-right px-4 py-3">{isAr ? 'التفاصيل' : 'Details'}</th>
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
                    <td className="px-4 py-3 text-gray-400 text-xs text-right truncate">
                      {log.users?.name ?? log.users?.email ?? 'system'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs text-right">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3 overflow-hidden">
                      <DetailsCell details={log.details} locale={locale} />
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
              {isAr ? 'السابق' : 'Previous'}
            </button>
            <span className="text-xs text-gray-500">
              {isAr ? `صفحة ${page}` : `Page ${page}`}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={data.data.length < 30}
              className="text-sm text-gray-400 hover:text-white disabled:opacity-30"
            >
              {isAr ? 'التالي' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}