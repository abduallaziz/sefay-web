'use client'

import { useEffect, useState } from 'react'
import { Building2, Users, TrendingUp, DollarSign } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface OverviewData {
  totalTenants: number
  activeTenants: number
  trialTenants: number
  totalRevenue: number
  monthlyGrowth: { month: string; count: number }[]
}

export default function SuperAdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/overview`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    )
  }

  if (!data) {
    return <p className="text-red-500">فشل تحميل البيانات</p>
  }

  const stats = [
    { label: 'إجمالي المشتركين', value: data.totalTenants,  icon: Building2,   color: 'bg-blue-500' },
    { label: 'مشتركين نشطين',   value: data.activeTenants, icon: Users,        color: 'bg-green-500' },
    { label: 'على تجربة مجانية', value: data.trialTenants,  icon: TrendingUp,  color: 'bg-yellow-500' },
    { label: 'إجمالي الإيرادات', value: `${data.totalRevenue} ر.س`, icon: DollarSign, color: 'bg-purple-500' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">نظرة عامة</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-6 shadow-sm flex items-center gap-4">
            <div className={`${color} p-3 rounded-lg`}>
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Growth Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">نمو المشتركين (آخر 6 أشهر)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.monthlyGrowth}>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}