'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { Building2, Users, TrendingUp, DollarSign } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import api from '@/lib/api'

interface OverviewData {
  totalTenants: number
  activeTenants: number
  trialTenants: number
  totalRevenue: number
  monthlyGrowth: { month: string; count: number }[]
}

async function fetchOverview(): Promise<OverviewData> {
  const { data } = await api.get('/superadmin/overview')
  return data
}

export default function SuperAdminOverviewPage() {
  const t = useTranslations('superadmin.overview')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['superadmin', 'overview'],
    queryFn: fetchOverview,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">{t('loading')}</p>
      </div>
    )
  }

  if (isError || !data) {
    return <p className="text-red-400">{t('error')}</p>
  }

  const stats = [
    { label: t('totalTenants'),  value: data.totalTenants,                       icon: Building2,  color: 'bg-blue-500' },
    { label: t('activeTenants'), value: data.activeTenants,                      icon: Users,       color: 'bg-green-500' },
    { label: t('trialTenants'),  value: data.trialTenants,                       icon: TrendingUp,  color: 'bg-yellow-500' },
    { label: t('totalRevenue'),  value: `${data.totalRevenue} ${t('currency')}`, icon: DollarSign,  color: 'bg-purple-500' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">{t('title')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#141720] rounded-xl p-6 border border-[#1e2130] flex items-center gap-4">
            <div className={`${color} p-3 rounded-lg`}>
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{label}</p>
              <p className="text-xl font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#141720] rounded-xl p-6 border border-[#1e2130]">
        <h2 className="text-lg font-semibold text-gray-300 mb-4">{t('growthChart')}</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.monthlyGrowth}>
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <YAxis allowDecimals={false} tick={{ fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{ background: '#141720', border: '1px solid #1e2130', color: '#fff' }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}