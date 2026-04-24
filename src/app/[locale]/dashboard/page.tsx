'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { formatCurrency, formatNumber, getTodayDate } from '@/lib/utils'
import { DailySummary } from '@/types'
import {
  TrendingUp, ShoppingCart, Banknote,
  CreditCard, Receipt, Percent,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const [summary, setSummary]   = useState<DailySummary | null>(null)
  const [loading, setLoading]   = useState(true)
  const [orders,  setOrders]    = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const today = getTodayDate()
      const [summaryRes, ordersRes] = await Promise.all([
        api.orders.summary(today),
        api.orders.getAll(today),
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
    {
      label: t('todaySales'),
      value: formatCurrency(summary?.total_sales || 0, locale === 'ar' ? 'ar-SA' : 'en-US'),
      icon: TrendingUp,
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-light)',
      border: 'var(--color-primary-border)',
    },
    {
      label: t('totalOrders'),
      value: formatNumber(summary?.total_orders || 0, locale === 'ar' ? 'ar-SA' : 'en-US'),
      icon: ShoppingCart,
      color: 'var(--color-success)',
      bg: 'var(--color-success-light)',
      border: 'var(--color-success-border)',
    },
    {
      label: t('cashRevenue'),
      value: formatCurrency(summary?.cash || 0, locale === 'ar' ? 'ar-SA' : 'en-US'),
      icon: Banknote,
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-light)',
      border: 'var(--color-warning-border)',
    },
    {
      label: t('totalTax'),
      value: formatCurrency(summary?.total_tax || 0, locale === 'ar' ? 'ar-SA' : 'en-US'),
      icon: Percent,
      color: 'var(--color-purple)',
      bg: 'var(--color-purple-light)',
      border: 'var(--color-purple-border)',
    },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: '700' }}>
          {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{t('title')}</h2>
          <p className="dashboard-page-subtitle">
            {new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">{stat.label}</span>
              <div className="stat-card-icon" style={{
                backgroundColor: stat.bg,
                border: `1px solid ${stat.border}`,
                color: stat.color,
              }}>
                <stat.icon size={18} />
              </div>
            </div>
            <div className="stat-card-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Orders Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">
              {locale === 'ar' ? 'الطلبات اليوم' : "Today's Orders"}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={orders.slice(0, 10).map((o, i) => ({
              name: `#${String(o.id).slice(-4)}`,
              total: o.total,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)',
                }}
              />
              <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Breakdown */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">
              {locale === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {[
              { label: locale === 'ar' ? 'نقد' : 'Cash', value: summary?.cash || 0, color: 'var(--color-success)' },
              { label: locale === 'ar' ? 'بطاقة' : 'Card', value: summary?.card || 0, color: 'var(--color-primary)' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '900', color: item.color }}>
                  {formatCurrency(item.value, locale === 'ar' ? 'ar-SA' : 'en-US')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">{t('recentOrders')}</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>{locale === 'ar' ? 'رقم الطلب' : 'Order #'}</th>
              <th>{locale === 'ar' ? 'اللوحة' : 'Plate'}</th>
              <th>{locale === 'ar' ? 'الإجمالي' : 'Total'}</th>
              <th>{locale === 'ar' ? 'الدفع' : 'Payment'}</th>
              <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 8).map(order => (
              <tr key={order.id}>
                <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                  #{String(order.id).slice(-8).toUpperCase()}
                </td>
                <td>{order.vehicles?.plate || '—'}</td>
                <td style={{ fontWeight: '700' }}>
                  {formatCurrency(order.total, locale === 'ar' ? 'ar-SA' : 'en-US')}
                </td>
                <td>
                  <span className={`badge badge-primary`}>
                    {order.payment_method}
                  </span>
                </td>
                <td>
                  <span className={`badge ${
                    order.status === 'completed' ? 'badge-success' :
                    order.status === 'refunded'  ? 'badge-purple' :
                    order.status === 'cancelled' ? 'badge-danger'  : 'badge-warning'
                  }`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="table-empty">
                    <div className="table-empty-icon">📋</div>
                    <div className="table-empty-text">
                      {locale === 'ar' ? 'لا توجد طلبات اليوم' : 'No orders today'}
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