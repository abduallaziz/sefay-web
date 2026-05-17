'use client';

import { useTranslations } from 'next-intl';
import { useOverview } from '@/features/superadmin/overview/hooks/useOverview';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function OverviewPage() {
  const t = useTranslations('superadmin.overview');
  const { data, isLoading, isError } = useOverview();

  if (isLoading) {
    return <div className="p-6 text-sm text-zinc-400">{t('loading')}</div>;
  }

  if (isError || !data) {
    return <div className="p-6 text-sm text-red-400">{t('error')}</div>;
  }

  const stats = [
    { label: t('totalTenants'),  value: data.totalTenants,                                            color: 'text-white' },
    { label: t('activeTenants'), value: data.activeTenants,                                           color: 'text-green-400' },
    { label: t('trialTenants'),  value: data.trialTenants,                                            color: 'text-yellow-400' },
    { label: t('totalRevenue'),  value: `${data.totalRevenue.toLocaleString('ar-SA')} ${t('currency')}`, color: 'text-blue-400' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('title')}</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-[#141720] border border-[#1e2130] p-5 space-y-2"
          >
            <p className="text-xs text-zinc-400">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-[#141720] border border-[#1e2130] p-5">
        <p className="text-sm text-zinc-400 mb-4">{t('growthChart')}</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.monthlyGrowth}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
            <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 12 }} />
            <YAxis tick={{ fill: '#71717a', fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#141720', border: '1px solid #1e2130', borderRadius: 8 }}
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#6366f1' }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              fill="url(#colorCount)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}