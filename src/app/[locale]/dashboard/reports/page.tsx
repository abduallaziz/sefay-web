'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { formatCurrency, getTodayDate } from '@/lib/utils'
import { DailySummary } from '@/types'
import { RefreshCw, TrendingUp, ShoppingCart, Banknote, Percent, CreditCard } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function ReportsPage() {
  const t = useTranslations('reports')
  const locale = useLocale()

  const [summary,  setSummary]  = useState<DailySummary | null>(null)
  const [orders,   setOrders]   = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('today')

  useEffect(() => { loadData() }, [filter])

  async function loadData() {
    setLoading(true)
    try {
      const date = filter === 'today' ? getTodayDate() : undefined
      const [summaryRes, ordersRes] = await Promise.all([
        api.orders.summary(getTodayDate()),
        api.orders.getAll(date),
      ])
      setSummary(summaryRes.data)
      setOrders(ordersRes.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: t('totalSales'),    value: formatCurrency(summary?.total_sales || 0,    locale === 'ar' ? 'ar-SA' : 'en-US'), icon: TrendingUp, color: 'var(--color-primary)',  bg: 'var(--color-primary-light)',  border: 'var(--color-primary-border)' },
    { label: t('totalOrders'),   value: String(summary?.total_orders || 0),           icon: ShoppingCart, color: 'var(--color-success)', bg: 'var(--color-success-light)', border: 'var(--color-success-border)' },
    { label: t('totalTax'),      value: formatCurrency(summary?.total_tax || 0,      locale === 'ar' ? 'ar-SA' : 'en-US'), icon: Percent,   color: 'var(--color-purple)',   bg: 'var(--color-purple-light)',   border: 'var(--color-purple-border)' },
    { label: t('totalDiscount'), value: formatCurrency(summary?.total_discount || 0, locale === 'ar' ? 'ar-SA' : 'en-US'), icon: CreditCard, color: 'var(--color-warning)',  bg: 'var(--color-warning-light)',  border: 'var(--color-warning-border)' },
  ]

  const filters = [
    { id: 'today',     label: locale === 'ar' ? 'اليوم'          : 'Today' },
    { id: 'yesterday', label: locale === 'ar' ? 'أمس'            : 'Yesterday' },
    { id: 'week',      label: locale === 'ar' ? 'هذا الأسبوع'   : 'This Week' },
    { id: 'all',       label: locale === 'ar' ? 'الكل'           : 'All' },
  ]

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{t('title')}</h2>
          <p className="dashboard-page-subtitle">
            {new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadData}>
          <RefreshCw size={14} />
          {locale === 'ar' ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="report-filters" style={{ marginBottom: '24px' }}>
        <div className="report-filter-group">
          {filters.map(f => (
            <button
              key={f.id}
              className={`report-filter-btn ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="reports-grid">
        {stats.map((stat, i) => (
          <div key={i} className="report-card">
            <div className="report-card-header">
              <div className="report-card-icon" style={{ backgroundColor: stat.bg, border: `1px solid ${stat.border}`, color: stat.color }}>
                <stat.icon size={18} />
              </div>
            </div>
            <div className="report-card-label">{stat.label}</div>
            <div className="report-card-value" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="report-charts-grid">
        <div className="report-chart-container">
          <div className="report-chart-header">
            <h3 className="report-chart-title">
              {locale === 'ar' ? 'المبيعات' : 'Sales'}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={orders.slice(0, 15).map(o => ({
              name: `#${String(o.id).slice(-4)}`,
              total: o.total,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)' }} />
              <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-chart-container">
          <div className="report-chart-header">
            <h3 className="report-chart-title">
              {locale === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
            </h3>
          </div>
          <div className="report-breakdown">
            {[
              { label: locale === 'ar' ? 'نقد' : 'Cash',   value: summary?.cash || 0,  color: 'var(--color-success)', emoji: '💵' },
              { label: locale === 'ar' ? 'بطاقة' : 'Card', value: summary?.card || 0,  color: 'var(--color-primary)', emoji: '💳' },
            ].map((item, i) => (
              <div key={i} className="report-breakdown-item">
                <div className="report-breakdown-left">
                  <div className="report-breakdown-icon">{item.emoji}</div>
                  <div>
                    <div className="report-breakdown-label">{item.label}</div>
                  </div>
                </div>
                <div className="report-breakdown-value" style={{ color: item.color }}>
                  {formatCurrency(item.value, locale === 'ar' ? 'ar-SA' : 'en-US')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">{locale === 'ar' ? 'تفاصيل الطلبات' : 'Orders Details'}</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>{locale === 'ar' ? 'رقم الطلب' : 'Order #'}</th>
              <th>{locale === 'ar' ? 'اللوحة' : 'Plate'}</th>
              <th>{locale === 'ar' ? 'المجموع' : 'Subtotal'}</th>
              <th>{locale === 'ar' ? 'الخصم' : 'Discount'}</th>
              <th>{locale === 'ar' ? 'الضريبة' : 'Tax'}</th>
              <th>{locale === 'ar' ? 'الإجمالي' : 'Total'}</th>
              <th>{locale === 'ar' ? 'الدفع' : 'Payment'}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                  #{String(order.id).slice(-8).toUpperCase()}
                </td>
                <td>{order.vehicles?.plate || '—'}</td>
                <td>{formatCurrency(order.subtotal, locale === 'ar' ? 'ar-SA' : 'en-US')}</td>
                <td style={{ color: 'var(--color-success)' }}>
                  {order.discount > 0 ? `- ${formatCurrency(order.discount, locale === 'ar' ? 'ar-SA' : 'en-US')}` : '—'}
                </td>
                <td style={{ color: 'var(--color-purple)' }}>
                  {formatCurrency(order.tax, locale === 'ar' ? 'ar-SA' : 'en-US')}
                </td>
                <td style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  {formatCurrency(order.total, locale === 'ar' ? 'ar-SA' : 'en-US')}
                </td>
                <td>
                  <span className="badge badge-primary">{order.payment_method}</span>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="table-empty">
                    <div className="table-empty-icon">📊</div>
                    <div className="table-empty-text">
                      {locale === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}