'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { formatCurrency, formatNumber, getTodayDate } from '@/lib/utils'
import { TrendingUp, ShoppingCart, Banknote, Percent, CreditCard, RotateCcw } from 'lucide-react'
import dynamic from 'next/dynamic'
import DateRangePicker from '@/components/ui/DateRangePicker'
import '@/styles/forms.css'

const BarChart           = dynamic(() => import('recharts').then(m => ({ default: m.BarChart })),           { ssr: false })
const Bar                = dynamic(() => import('recharts').then(m => ({ default: m.Bar })),                { ssr: false })
const XAxis              = dynamic(() => import('recharts').then(m => ({ default: m.XAxis })),              { ssr: false })
const YAxis              = dynamic(() => import('recharts').then(m => ({ default: m.YAxis })),              { ssr: false })
const CartesianGrid      = dynamic(() => import('recharts').then(m => ({ default: m.CartesianGrid })),      { ssr: false })
const Tooltip            = dynamic(() => import('recharts').then(m => ({ default: m.Tooltip })),            { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })), { ssr: false })

export default function DashboardPage() {
  const locale = useLocale()

  const [summary,         setSummary]         = useState<any>(null)
  const [orders,          setOrders]          = useState<any[]>([])
  const [branches,        setBranches]        = useState<any[]>([])
  const [selectedBranch,  setSelectedBranch]  = useState<string>('all')
  const [branchSummaries, setBranchSummaries] = useState<any[]>([])
  const [loading,         setLoading]         = useState(true)
  const [fromDate,        setFromDate]        = useState(getTodayDate())
  const [toDate,          setToDate]          = useState(getTodayDate())

  useEffect(() => {
    loadBranches()
    loadData(getTodayDate(), getTodayDate())
  }, [])

  async function loadBranches() {
    try {
      const session = getSession()
      if (!session) return
      const { data } = await supabase
        .from('branches')
        .select('id, name')
        .eq('tenant_id', session.tenant_id)
        .eq('active', true)
      setBranches(data || [])
    } catch (e) { console.error(e) }
  }

  async function loadData(from: string, to: string) {
    setLoading(true)
    try {
      const [summaryRes, ordersRes] = await Promise.all([
        api.orders.summaryByRange(from, to),
        api.orders.getByRange(from, to),
      ])
      setSummary(summaryRes.data)
      const allOrders = ordersRes.data || []
      setOrders(allOrders)

      const session = getSession()
      if (session) {
        const { data: branchList } = await supabase
          .from('branches')
          .select('id, name')
          .eq('tenant_id', session.tenant_id)
          .eq('active', true)

        if (branchList) {
          const summaries = branchList.map(b => {
            const bOrders = allOrders.filter((o: any) =>
              o.branch_id === b.id && ['completed','partially_refunded'].includes(o.status)
            )
            return {
              id:             b.id,
              name:           b.name,
              total_orders:   bOrders.length,
              total_sales:    bOrders.reduce((s: number, o: any) => s + Number(o.total) - (Number(o.refunded_amount) || 0), 0),
              total_refunded: bOrders.reduce((s: number, o: any) => s + (Number(o.refunded_amount) || 0), 0),
              cash:           bOrders.reduce((s: number, o: any) => s + (Number(o.cash_amount) || 0), 0),
              card:           bOrders.reduce((s: number, o: any) => s + (Number(o.card_amount) || 0), 0),
            }
          })
          setBranchSummaries(summaries)
        }
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const filteredOrders = selectedBranch === 'all'
    ? orders
    : orders.filter((o: any) => o.branch_id === selectedBranch)

  const displaySummary = selectedBranch === 'all' ? summary : (() => {
    const bOrders = filteredOrders.filter((o: any) => ['completed','partially_refunded'].includes(o.status))
    return {
      total_orders:   bOrders.length,
      total_sales:    bOrders.reduce((s: number, o: any) => s + Number(o.total) - (Number(o.refunded_amount) || 0), 0),
      total_refunded: bOrders.reduce((s: number, o: any) => s + (Number(o.refunded_amount) || 0), 0),
      total_tax:      bOrders.reduce((s: number, o: any) => s + Number(o.tax), 0),
      total_discount: bOrders.reduce((s: number, o: any) => s + Number(o.discount), 0),
      cash:           bOrders.reduce((s: number, o: any) => s + (Number(o.cash_amount) || 0), 0),
      card:           bOrders.reduce((s: number, o: any) => s + (Number(o.card_amount) || 0), 0),
    }
  })()

  const totalRefunded = displaySummary?.total_refunded || summary?.total_refunded || 0

  const stats = [
    { label: locale === 'ar' ? 'صافي المبيعات' : 'Net Sales',    value: formatCurrency(displaySummary?.total_sales    || 0, locale === 'ar' ? 'ar-SA' : 'en-US'), icon: TrendingUp,  color: 'var(--color-primary)',  bg: 'var(--color-primary-light)',  border: 'var(--color-primary-border)' },
    { label: locale === 'ar' ? 'عدد الطلبات'   : 'Total Orders', value: formatNumber(displaySummary?.total_orders     || 0, locale === 'ar' ? 'ar-SA' : 'en-US'), icon: ShoppingCart, color: 'var(--color-success)',  bg: 'var(--color-success-light)',  border: 'var(--color-success-border)' },
    { label: locale === 'ar' ? 'نقد'           : 'Cash',         value: formatCurrency(displaySummary?.cash           || 0, locale === 'ar' ? 'ar-SA' : 'en-US'), icon: Banknote,    color: 'var(--color-warning)',  bg: 'var(--color-warning-light)',  border: 'var(--color-warning-border)' },
    { label: locale === 'ar' ? 'بطاقة'         : 'Card',         value: formatCurrency(displaySummary?.card           || 0, locale === 'ar' ? 'ar-SA' : 'en-US'), icon: CreditCard,  color: 'var(--color-purple)',   bg: 'var(--color-purple-light)',   border: 'var(--color-purple-border)' },
    { label: locale === 'ar' ? 'ضريبة VAT'     : 'VAT Tax',      value: formatCurrency(displaySummary?.total_tax      || 0, locale === 'ar' ? 'ar-SA' : 'en-US'), icon: Percent,     color: 'var(--color-danger)',   bg: 'var(--color-danger-light)',   border: 'var(--color-danger-border)' },
    { label: locale === 'ar' ? 'مسترجعات'      : 'Refunds',      value: formatCurrency(totalRefunded,                      locale === 'ar' ? 'ar-SA' : 'en-US'), icon: RotateCcw,   color: 'var(--color-danger)',   bg: 'var(--color-danger-light)',   border: 'var(--color-danger-border)' },
  ]

  const profit = (displaySummary?.total_sales || 0) - (displaySummary?.total_tax || 0) - (displaySummary?.total_discount || 0)

  const chartData = selectedBranch === 'all' ? (summary?.orders_by_day || []) : (() => {
    const map: Record<string, number> = {}
    filteredOrders
      .filter((o: any) => ['completed','partially_refunded'].includes(o.status))
      .forEach((o: any) => {
        const day = new Date(o.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })
        map[day] = (map[day] || 0) + Number(o.total) - (Number(o.refunded_amount) || 0)
      })
    return Object.entries(map).map(([date, total]) => ({ date, total }))
  })()

  const paymentLabel = (method: string, order: any) => {
    const isMixed = Number(order.cash_amount) > 0 && Number(order.card_amount) > 0
    if (isMixed) return locale === 'ar' ? 'مختلط' : 'Mixed'
    const map: Record<string, string> = { cash: locale === 'ar' ? 'نقد' : 'Cash', mada: 'Mada', visa: 'Visa', mastercard: 'Mastercard' }
    return map[method] || method
  }

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      completed:          locale === 'ar' ? 'مكتمل'       : 'Completed',
      refunded:           locale === 'ar' ? 'مسترجع'      : 'Refunded',
      partially_refunded: locale === 'ar' ? 'مسترجع جزئي' : 'Partial Refund',
      cancelled:          locale === 'ar' ? 'ملغي'        : 'Cancelled',
    }
    return map[status] || status
  }

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</h2>
          <p className="dashboard-page-subtitle">{fromDate} — {toDate}</p>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <DateRangePicker
          from={fromDate}
          to={toDate}
          onChange={(from, to) => {
            setFromDate(from)
            setToDate(to)
            loadData(from, to)
          }}
        />
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '16px' }}>
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

          <div style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '2px solid var(--color-success-border)',
            borderRadius: 'var(--radius-lg)', padding: '20px',
            marginBottom: '16px', display: 'flex',
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
            {totalRefunded > 0 && (
              <div style={{ textAlign: 'end' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  ↩ {locale === 'ar' ? 'إجمالي المسترجعات' : 'Total Refunds'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-danger)' }}>
                  -{formatCurrency(totalRefunded, locale === 'ar' ? 'ar-SA' : 'en-US')}
                </div>
              </div>
            )}
            <div style={{ fontSize: '48px' }}>📈</div>
          </div>

          {selectedBranch === 'all' && branchSummaries.length > 1 && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '12px' }}>
                🏬 {locale === 'ar' ? 'ملخص الفروع' : 'Branches Summary'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {branchSummaries.map(b => (
                  <div key={b.id} style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)', padding: '16px',
                    cursor: 'pointer', transition: 'var(--transition)',
                  }} onClick={() => setSelectedBranch(b.id)}>
                    <div style={{ fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '10px', fontSize: '14px' }}>🏬 {b.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{locale === 'ar' ? 'الطلبات' : 'Orders'}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-success)' }}>{b.total_orders}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{locale === 'ar' ? 'الصافي' : 'Net'}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)' }}>
                        {formatCurrency(b.total_sales, locale === 'ar' ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                    {b.total_refunded > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-danger)' }}>{locale === 'ar' ? 'مسترجع' : 'Refunded'}</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-danger)' }}>
                          -{formatCurrency(b.total_refunded, locale === 'ar' ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{locale === 'ar' ? 'نقد / بطاقة' : 'Cash / Card'}</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {formatCurrency(b.cash, locale === 'ar' ? 'ar-SA' : 'en-US')} / {formatCurrency(b.card, locale === 'ar' ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="charts-grid" style={{ marginBottom: '16px' }}>
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">{locale === 'ar' ? 'المبيعات اليومية' : 'Daily Sales'}</h3>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                      formatter={(v: any) => [formatCurrency(v, locale === 'ar' ? 'ar-SA' : 'en-US'), locale === 'ar' ? 'الصافي' : 'Net']}
                    />
                    <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
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
                  { label: locale === 'ar' ? 'نقد'      : 'Cash',      value: displaySummary?.cash           || 0, color: 'var(--color-success)' },
                  { label: locale === 'ar' ? 'بطاقة'    : 'Card',      value: displaySummary?.card           || 0, color: 'var(--color-primary)' },
                  { label: locale === 'ar' ? 'ضريبة'    : 'Tax',       value: displaySummary?.total_tax      || 0, color: 'var(--color-purple)' },
                  { label: locale === 'ar' ? 'خصومات'   : 'Discounts', value: displaySummary?.total_discount || 0, color: 'var(--color-warning)' },
                  { label: locale === 'ar' ? 'مسترجعات' : 'Refunds',   value: totalRefunded,                      color: 'var(--color-danger)' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', backgroundColor: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                  }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>{item.label}</span>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: item.color }}>
                      {item.label === (locale === 'ar' ? 'مسترجعات' : 'Refunds') && item.value > 0 ? '-' : ''}
                      {formatCurrency(item.value, locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="table-container">
            <div className="table-header">
              <h3 className="table-title">
                {locale === 'ar' ? 'الطلبات' : 'Orders'}
                <span style={{ marginRight: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  ({filteredOrders.length})
                </span>
              </h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>{locale === 'ar' ? 'رقم الطلب' : 'Order #'}</th>
                  <th>{locale === 'ar' ? 'اللوحة'    : 'Plate'}</th>
                  <th>{locale === 'ar' ? 'الصافي'    : 'Net'}</th>
                  <th>{locale === 'ar' ? 'الدفع'     : 'Payment'}</th>
                  <th>{locale === 'ar' ? 'الحالة'    : 'Status'}</th>
                  <th>{locale === 'ar' ? 'التاريخ'   : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice(0, 20).map((order: any) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                      #{String(order.id).slice(-8).toUpperCase()}
                    </td>
                    <td>{order.vehicles?.plate || '—'}</td>
                    <td style={{ fontWeight: '700' }}>
                      <div>{formatCurrency(Number(order.total) - (Number(order.refunded_amount) || 0), locale === 'ar' ? 'ar-SA' : 'en-US')}</div>
                      {Number(order.refunded_amount) > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--color-danger)' }}>
                          ↩ {formatCurrency(Number(order.refunded_amount), locale === 'ar' ? 'ar-SA' : 'en-US')}
                        </div>
                      )}
                    </td>
                    <td><span className="badge badge-primary">{paymentLabel(order.payment_method, order)}</span></td>
                    <td>
                      <span className={`badge ${
                        order.status === 'completed'          ? 'badge-success' :
                        order.status === 'partially_refunded' ? 'badge-warning' :
                        order.status === 'refunded'           ? 'badge-purple'  :
                        order.status === 'cancelled'          ? 'badge-danger'  : 'badge-secondary'
                      }`}>{statusLabel(order.status)}</span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {new Date(order.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
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