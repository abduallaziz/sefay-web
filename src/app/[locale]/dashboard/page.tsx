'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { formatCurrency, formatNumber, getTodayDate } from '@/lib/utils'
import { TrendingUp, ShoppingCart, Banknote, Percent, CreditCard, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type RangePreset = 'today' | 'yesterday' | '7days' | '30days' | '3months' | '6months' | '1year' | 'custom'

function getDateRange(preset: RangePreset): { from: string; to: string } {
  const now = new Date()
  const toSaudiDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })
  const today = toSaudiDate(now)
  switch (preset) {
    case 'today':     return { from: today, to: today }
    case 'yesterday': { const d = new Date(now); d.setDate(d.getDate()-1); const y = toSaudiDate(d); return { from: y, to: y } }
    case '7days':     { const d = new Date(now); d.setDate(d.getDate()-6); return { from: toSaudiDate(d), to: today } }
    case '30days':    { const d = new Date(now); d.setDate(d.getDate()-29); return { from: toSaudiDate(d), to: today } }
    case '3months':   { const d = new Date(now); d.setMonth(d.getMonth()-3); return { from: toSaudiDate(d), to: today } }
    case '6months':   { const d = new Date(now); d.setMonth(d.getMonth()-6); return { from: toSaudiDate(d), to: today } }
    case '1year':     { const d = new Date(now); d.setFullYear(d.getFullYear()-1); return { from: toSaudiDate(d), to: today } }
    default:          return { from: today, to: today }
  }
}

export default function DashboardPage() {
  const locale = useLocale()
  const [summary,  setSummary]  = useState<any>(null)
  const [orders,   setOrders]   = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [preset,   setPreset]   = useState<RangePreset>('today')
  const [fromDate, setFromDate] = useState(getTodayDate())
  const [toDate,   setToDate]   = useState(getTodayDate())

  useEffect(() => {
    if (preset !== 'custom') {
      const range = getDateRange(preset)
      setFromDate(range.from)
      setToDate(range.to)
      loadData(range.from, range.to)
    }
  }, [preset])

  async function loadData(from: string, to: string) {
    setLoading(true)
    try {
      const [summaryRes, ordersRes] = await Promise.all([
        api.orders.summaryByRange(from, to),
        api.orders.getByRange(from, to),
      ])
      setSummary(summaryRes.data)
      setOrders(ordersRes.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const presets: { id: RangePreset; label: string }[] = [
    { id: 'today',     label: locale === 'ar' ? 'اليوم'      : 'Today' },
    { id: 'yesterday', label: locale === 'ar' ? 'أمس'        : 'Yesterday' },
    { id: '7days',     label: locale === 'ar' ? '٧ أيام'     : '7 Days' },
    { id: '30days',    label: locale === 'ar' ? '٣٠ يوم'     : '30 Days' },
    { id: '3months',   label: locale === 'ar' ? '٣ أشهر'     : '3 Months' },
    { id: '6months',   label: locale === 'ar' ? '٦ أشهر'     : '6 Months' },
    { id: '1year',     label: locale === 'ar' ? 'سنة'        : '1 Year' },
    { id: 'custom',    label: locale === 'ar' ? 'مخصص'       : 'Custom' },
  ]

  const stats = [
    { label: locale === 'ar' ? 'إجمالي المبيعات' : 'Total Sales',    value: formatCurrency(summary?.total_sales || 0,    locale === 'ar' ? 'ar-SA' : 'en-US'), icon: TrendingUp,  color: 'var(--color-primary)',  bg: 'var(--color-primary-light)',  border: 'var(--color-primary-border)' },
    { label: locale === 'ar' ? 'عدد الطلبات'     : 'Total Orders',   value: formatNumber(summary?.total_orders || 0,     locale === 'ar' ? 'ar-SA' : 'en-US'), icon: ShoppingCart, color: 'var(--color-success)',  bg: 'var(--color-success-light)',  border: 'var(--color-success-border)' },
    { label: locale === 'ar' ? 'نقد'             : 'Cash',           value: formatCurrency(summary?.cash || 0,           locale === 'ar' ? 'ar-SA' : 'en-US'), icon: Banknote,    color: 'var(--color-warning)',  bg: 'var(--color-warning-light)',  border: 'var(--color-warning-border)' },
    { label: locale === 'ar' ? 'بطاقة'           : 'Card',           value: formatCurrency(summary?.card || 0,           locale === 'ar' ? 'ar-SA' : 'en-US'), icon: CreditCard,  color: 'var(--color-purple)',   bg: 'var(--color-purple-light)',   border: 'var(--color-purple-border)' },
    { label: locale === 'ar' ? 'ضريبة VAT'       : 'VAT Tax',        value: formatCurrency(summary?.total_tax || 0,      locale === 'ar' ? 'ar-SA' : 'en-US'), icon: Percent,     color: 'var(--color-danger)',   bg: 'var(--color-danger-light)',   border: 'var(--color-danger-border)' },
    { label: locale === 'ar' ? 'خصومات'          : 'Discounts',      value: formatCurrency(summary?.total_discount || 0, locale === 'ar' ? 'ar-SA' : 'en-US'), icon: TrendingUp,  color: 'var(--color-success)',  bg: 'var(--color-success-light)',  border: 'var(--color-success-border)' },
  ]

  const profit = (summary?.total_sales || 0) - (summary?.total_tax || 0) - (summary?.total_discount || 0)
  const chartData = summary?.orders_by_day || []

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</h2>
          <p className="dashboard-page-subtitle">{fromDate} — {toDate}</p>
        </div>
      </div>

      {/* Date Presets */}
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Calendar size={16} color="var(--color-text-muted)" />
          {presets.map(p => (
            <button key={p.id}
              className={`table-filter-btn ${preset === p.id ? 'active' : ''}`}
              onClick={() => setPreset(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
            <input type="date" className="form-input" value={fromDate}
              onChange={e => setFromDate(e.target.value)} style={{ width: 'auto' }} />
            <span style={{ color: 'var(--color-text-muted)' }}>—</span>
            <input type="date" className="form-input" value={toDate}
              onChange={e => setToDate(e.target.value)} style={{ width: 'auto' }} />
            <button className="btn btn-primary btn-sm" onClick={() => loadData(fromDate, toDate)}>
              {locale === 'ar' ? 'تطبيق' : 'Apply'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
            {stats.map((stat, i) => (
              <div key={i} className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-label">{stat.label}</span>
                  <div className="stat-card-icon" style={{ backgroundColor: stat.bg, border: `1px solid ${stat.border}`, color: stat.color }}>
                    <stat.icon size={18} />
                  </div>
                </div>
                <div className="stat-card-value" style={{ color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Profit */}
          <div style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '2px solid var(--color-success-border)',
            borderRadius: 'var(--radius-lg)', padding: '20px',
            marginBottom: '20px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                💰 {locale === 'ar' ? 'صافي الربح' : 'Net Profit'}
              </div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--color-success)' }}>
                {formatCurrency(profit, locale === 'ar' ? 'ar-SA' : 'en-US')}
              </div>
            </div>
            <div style={{ fontSize: '48px' }}>📈</div>
          </div>

          {/* Charts */}
          <div className="charts-grid" style={{ marginBottom: '20px' }}>
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">{locale === 'ar' ? 'المبيعات اليومية' : 'Daily Sales'}</h3>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                      formatter={(v: any) => [formatCurrency(v, locale === 'ar' ? 'ar-SA' : 'en-US'), locale === 'ar' ? 'المبيعات' : 'Sales']} />
                    <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  {locale === 'ar' ? 'لا توجد بيانات' : 'No data'}
                </div>
              )}
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">{locale === 'ar' ? 'تفاصيل الفترة' : 'Period Details'}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: locale === 'ar' ? 'نقد'     : 'Cash',      value: summary?.cash || 0,           color: 'var(--color-success)' },
                  { label: locale === 'ar' ? 'بطاقة'   : 'Card',      value: summary?.card || 0,           color: 'var(--color-primary)' },
                  { label: locale === 'ar' ? 'ضريبة'   : 'Tax',       value: summary?.total_tax || 0,      color: 'var(--color-purple)' },
                  { label: locale === 'ar' ? 'خصومات'  : 'Discounts', value: summary?.total_discount || 0, color: 'var(--color-warning)' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', backgroundColor: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                  }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>{item.label}</span>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: item.color }}>
                      {formatCurrency(item.value, locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="table-container">
            <div className="table-header">
              <h3 className="table-title">
                {locale === 'ar' ? 'الطلبات' : 'Orders'}
                <span style={{ marginRight: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>({orders.length})</span>
              </h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>{locale === 'ar' ? 'رقم الطلب' : 'Order #'}</th>
                  <th>{locale === 'ar' ? 'اللوحة' : 'Plate'}</th>
                  <th>{locale === 'ar' ? 'الإجمالي' : 'Total'}</th>
                  <th>{locale === 'ar' ? 'الدفع' : 'Payment'}</th>
                  <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th>{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 20).map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>#{String(order.id).slice(-8).toUpperCase()}</td>
                    <td>{order.vehicles?.plate || '—'}</td>
                    <td style={{ fontWeight: '700' }}>{formatCurrency(order.total, locale === 'ar' ? 'ar-SA' : 'en-US')}</td>
                    <td><span className="badge badge-primary">{order.payment_method}</span></td>
                    <td>
                      <span className={`badge ${order.status === 'completed' ? 'badge-success' : order.status === 'refunded' ? 'badge-purple' : order.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {new Date(order.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="table-empty">
                        <div className="table-empty-icon">📊</div>
                        <div className="table-empty-text">{locale === 'ar' ? 'لا توجد طلبات' : 'No orders'}</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}