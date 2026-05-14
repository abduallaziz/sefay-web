'use client'

import { useEffect, useState } from 'react'
import {
  TrendingUp, AlertTriangle, UserX, BarChart2, RefreshCw,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

type ReportData = {
  mrr: number
  arr: number
  monthRevenue: number
  churnCount: number
  churned: { id: string; cancelled_at: string; tenants: { name: string } | null }[]
  expiringSoon: {
    id: string; expires_at: string; plan: string
    tenants: { name: string; email: string } | null
  }[]
  expiringCritical: number
  inactive: { id: string; name: string; email: string; last_login_at: string | null }[]
  topBusinessTypes: { type: string; count: number }[]
}

export default function ReportsPage() {
  const [data, setData]       = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const token = () => localStorage.getItem('token')

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/superadmin/reports`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      setData(await res.json())
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [])

  if (loading) return <div className="p-12 text-center text-gray-400">جاري التحميل...</div>
  if (!data)   return <div className="p-12 text-center text-red-400">فشل تحميل التقارير</div>

  const maxBiz = Math.max(...data.topBusinessTypes.map(t => t.count), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart2 size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">التقارير المتقدمة</h1>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 border border-gray-200 px-3 py-1.5 rounded-lg"
        >
          <RefreshCw size={14} /> تحديث
        </button>
      </div>

      {/* ── MRR / ARR / Month Revenue ── */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="MRR"
          sublabel="الإيراد الشهري المتكرر"
          value={`${data.mrr.toLocaleString()} ر.س`}
          color="blue"
          icon={<TrendingUp size={20} />}
        />
        <MetricCard
          label="ARR"
          sublabel="الإيراد السنوي المتكرر"
          value={`${data.arr.toLocaleString()} ر.س`}
          color="purple"
          icon={<TrendingUp size={20} />}
        />
        <MetricCard
          label="إيرادات الشهر"
          sublabel="مدفوعات هذا الشهر"
          value={`${data.monthRevenue.toLocaleString()} ر.س`}
          color="green"
          icon={<TrendingUp size={20} />}
        />
      </div>

      {/* ── Churn + Expiring ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Churn */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserX size={18} className="text-red-500" />
            <h2 className="font-semibold text-gray-900">Churn هذا الشهر</h2>
            <span className="mr-auto bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
              {data.churnCount} اشتراك
            </span>
          </div>
          {data.churned.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">لا يوجد churn هذا الشهر 🎉</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.churned.map(c => (
                <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-sm text-gray-800">{c.tenants?.name || '—'}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.cancelled_at).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-yellow-500" />
            <h2 className="font-semibold text-gray-900">على وشك الانتهاء</h2>
            <span className="mr-auto bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
              {data.expiringSoon.length} اشتراك
            </span>
            {data.expiringCritical > 0 && (
              <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                {data.expiringCritical} خلال 7 أيام
              </span>
            )}
          </div>
          {data.expiringSoon.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">لا يوجد اشتراكات قريبة الانتهاء</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.expiringSoon.map(s => {
                const daysLeft = Math.ceil(
                  (new Date(s.expires_at).getTime() - Date.now()) / 86400000,
                )
                const urgent = daysLeft <= 7
                return (
                  <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                    <div>
                      <div className="text-sm text-gray-800">{s.tenants?.name || '—'}</div>
                      <div className="text-xs text-gray-400">{s.tenants?.email || '—'}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      urgent ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {daysLeft} يوم
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Inactive Tenants ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserX size={18} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900">Tenants غير نشطين</h2>
          <span className="text-xs text-gray-400">(لم يدخلوا آخر 90 يوم)</span>
          <span className="mr-auto bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
            {data.inactive.length}
          </span>
        </div>
        {data.inactive.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">كل الـ tenants نشطين 👍</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right py-2 text-gray-500 font-medium">الاسم</th>
                  <th className="text-right py-2 text-gray-500 font-medium">الإيميل</th>
                  <th className="text-right py-2 text-gray-500 font-medium">آخر دخول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.inactive.map(t => (
                  <tr key={t.id}>
                    <td className="py-2 text-gray-800">{t.name}</td>
                    <td className="py-2 text-gray-500">{t.email}</td>
                    <td className="py-2 text-gray-400">
                      {t.last_login_at
                        ? new Date(t.last_login_at).toLocaleDateString('ar-SA')
                        : 'لم يدخل أبداً'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Top Business Types ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 size={18} className="text-blue-500" />
          <h2 className="font-semibold text-gray-900">أكثر أنواع الأعمال</h2>
        </div>
        {data.topBusinessTypes.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">لا توجد بيانات</p>
        ) : (
          <div className="space-y-3">
            {data.topBusinessTypes.map(({ type, count }) => (
              <div key={type} className="flex items-center gap-3">
                <div className="w-28 text-sm text-gray-700 text-right shrink-0">{type}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${(count / maxBiz) * 100}%` }}
                  />
                </div>
                <div className="text-sm font-medium text-gray-700 w-8 text-left">{count}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Metric Card ──────────────────────────────────────────────
function MetricCard({
  label, sublabel, value, color, icon,
}: {
  label: string; sublabel: string; value: string
  color: 'blue' | 'purple' | 'green'; icon: React.ReactNode
}) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   val: 'text-blue-700' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', val: 'text-purple-700' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  val: 'text-green-700' },
  }
  const c = colors[color]
  return (
    <div className={`${c.bg} rounded-xl p-5`}>
      <div className={`${c.text} mb-2`}>{icon}</div>
      <div className={`text-2xl font-bold ${c.val} mb-1`}>{value}</div>
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      <div className="text-xs text-gray-500">{sublabel}</div>
    </div>
  )
}