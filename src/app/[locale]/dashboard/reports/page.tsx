'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { formatCurrency, formatNumber, getTodayDate } from '@/lib/utils'
import { TrendingUp, ShoppingCart, Banknote, Percent, CreditCard, Download, Search } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import DateRangePicker from '@/components/ui/DateRangePicker'

export default function ReportsPage() {
  const locale = useLocale()

  const [summary,  setSummary]  = useState<any>(null)
  const [orders,   setOrders]   = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [fromDate, setFromDate] = useState(getTodayDate())
  const [toDate,   setToDate]   = useState(getTodayDate())
  const [search,   setSearch]   = useState('')

  useEffect(() => { loadData(getTodayDate(), getTodayDate()) }, [])

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

  const filtered = orders.filter(o =>
    String(o.id).slice(-8).toLowerCase().includes(search.toLowerCase()) ||
    o.vehicles?.plate?.toLowerCase().includes(search.toLowerCase()) ||
    o.customers?.phone?.includes(search) ||
    o.customers?.name?.toLowerCase().includes(search.toLowerCase())
  )

  function exportCSV() {
    const headers = ['رقم الطلب', 'اسم العميل', 'الجوال', 'اللوحة', 'المجموع قبل', 'الخصم', 'الضريبة', 'الإجمالي', 'الدفع', 'الحالة', 'التاريخ']
    const rows = filtered.map(o => [
      String(o.id).slice(-8).toUpperCase(),
      o.customers?.name || '',
      o.customers?.phone || '',
      o.vehicles?.plate || '',
      o.subtotal,
      o.discount,
      o.tax,
      o.total,
      o.payment_method,
      o.status,
      new Date(o.created_at).toLocaleDateString('ar-SA'),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report_${fromDate}_${toDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportHTML() {
    const rows = filtered.map(o => `
      <tr>
        <td>#${String(o.id).slice(-8).toUpperCase()}</td>
        <td>${o.customers?.name || '—'}</td>
        <td>${o.customers?.phone || '—'}</td>
        <td>${o.vehicles?.plate || '—'}</td>
        <td>${o.subtotal?.toFixed(2)}</td>
        <td>${o.discount?.toFixed(2)}</td>
        <td>${o.tax?.toFixed(2)}</td>
        <td><strong>${o.total?.toFixed(2)}</strong></td>
        <td>${o.payment_method}</td>
        <td>${o.status}</td>
        <td>${new Date(o.created_at).toLocaleDateString('ar-SA')}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<title>تقرير المبيعات ${fromDate} - ${toDate}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  p { color: #666; margin-bottom: 16px; }
  .stats { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
  .stat { border: 1px solid #ddd; border-radius: 8px; padding: 12px 20px; min-width: 140px; }
  .stat-label { font-size: 11px; color: #888; margin-bottom: 4px; }
  .stat-value { font-size: 18px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f5f5f5; padding: 8px; text-align: right; border: 1px solid #ddd; font-size: 11px; }
  td { padding: 7px 8px; border: 1px solid #eee; font-size: 11px; }
  tr:nth-child(even) { background: #fafafa; }
  .footer { margin-top: 24px; font-size: 11px; color: #888; text-align: center; }
</style>
</head>
<body>
<h1>تقرير المبيعات</h1>
<p>الفترة: ${fromDate} — ${toDate}</p>
<div class="stats">
  <div class="stat"><div class="stat-label">إجمالي المبيعات</div><div class="stat-value">${summary?.total_sales?.toFixed(2)} ر.س</div></div>
  <div class="stat"><div class="stat-label">عدد الطلبات</div><div class="stat-value">${summary?.total_orders}</div></div>
  <div class="stat"><div class="stat-label">نقد</div><div class="stat-value">${summary?.cash?.toFixed(2)} ر.س</div></div>
  <div class="stat"><div class="stat-label">بطاقة</div><div class="stat-value">${summary?.card?.toFixed(2)} ر.س</div></div>
  <div class="stat"><div class="stat-label">ضريبة</div><div class="stat-value">${summary?.total_tax?.toFixed(2)} ر.س</div></div>
  <div class="stat"><div class="stat-label">خصومات</div><div class="stat-value">${summary?.total_discount?.toFixed(2)} ر.س</div></div>
</div>
<table>
  <thead><tr><th>رقم الطلب</th><th>اسم العميل</th><th>الجوال</th><th>اللوحة</th><th>المجموع</th><th>الخصم</th><th>الضريبة</th><th>الإجمالي</th><th>الدفع</th><th>الحالة</th><th>التاريخ</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">Sefay ERP — تم الإنشاء بتاريخ ${new Date().toLocaleDateString('ar-SA')}</div>
</body>
</html>`

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html + '<script>window.onload=()=>{window.print();}<\/script>')
      win.document.close()
    }
  }

  const stats = [
    { label: locale === 'ar' ? 'إجمالي المبيعات' : 'Total Sales',  value: formatCurrency(summary?.total_sales || 0,    locale === 'ar' ? 'ar-SA' : 'en-US'), icon: TrendingUp,  color: 'var(--color-primary)',  bg: 'var(--color-primary-light)',  border: 'var(--color-primary-border)' },
    { label: locale === 'ar' ? 'عدد الطلبات'     : 'Total Orders', value: formatNumber(summary?.total_orders || 0,     locale === 'ar' ? 'ar-SA' : 'en-US'), icon: ShoppingCart, color: 'var(--color-success)',  bg: 'var(--color-success-light)',  border: 'var(--color-success-border)' },
    { label: locale === 'ar' ? 'نقد'             : 'Cash',         value: formatCurrency(summary?.cash || 0,           locale === 'ar' ? 'ar-SA' : 'en-US'), icon: Banknote,    color: 'var(--color-warning)',  bg: 'var(--color-warning-light)',  border: 'var(--color-warning-border)' },
    { label: locale === 'ar' ? 'بطاقة'           : 'Card',         value: formatCurrency(summary?.card || 0,           locale === 'ar' ? 'ar-SA' : 'en-US'), icon: CreditCard,  color: 'var(--color-purple)',   bg: 'var(--color-purple-light)',   border: 'var(--color-purple-border)' },
    { label: locale === 'ar' ? 'ضريبة VAT'       : 'VAT Tax',      value: formatCurrency(summary?.total_tax || 0,      locale === 'ar' ? 'ar-SA' : 'en-US'), icon: Percent,     color: 'var(--color-danger)',   bg: 'var(--color-danger-light)',   border: 'var(--color-danger-border)' },
    { label: locale === 'ar' ? 'خصومات'          : 'Discounts',    value: formatCurrency(summary?.total_discount || 0, locale === 'ar' ? 'ar-SA' : 'en-US'), icon: TrendingUp,  color: 'var(--color-success)',  bg: 'var(--color-success-light)',  border: 'var(--color-success-border)' },
  ]

  const profit = (summary?.total_sales || 0) - (summary?.total_tax || 0) - (summary?.total_discount || 0)
  const chartData = summary?.orders_by_day || []

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">
            {locale === 'ar' ? 'التقارير' : 'Reports'}
          </h2>
          <p className="dashboard-page-subtitle">{fromDate} — {toDate}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
            <Download size={14} />
            {locale === 'ar' ? 'تصدير CSV' : 'Export CSV'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportHTML}>
            <Download size={14} />
            {locale === 'ar' ? 'طباعة PDF' : 'Print PDF'}
          </button>
        </div>
      </div>

      {/* Date Picker */}
      <div style={{ marginBottom: '20px' }}>
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
          {/* Stats */}
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

          {/* Profit */}
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
            <div style={{ fontSize: '48px' }}>📈</div>
          </div>

          {/* Charts */}
          <div className="charts-grid" style={{ marginBottom: '16px' }}>
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">
                  {locale === 'ar' ? 'المبيعات اليومية' : 'Daily Sales'}
                </h3>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                      formatter={(v: any) => [formatCurrency(v, locale === 'ar' ? 'ar-SA' : 'en-US'), locale === 'ar' ? 'المبيعات' : 'Sales']}
                    />
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
                <h3 className="chart-card-title">
                  {locale === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: locale === 'ar' ? 'نقد'    : 'Cash',      value: summary?.cash || 0,           color: 'var(--color-success)' },
                  { label: locale === 'ar' ? 'بطاقة'  : 'Card',      value: summary?.card || 0,           color: 'var(--color-primary)' },
                  { label: locale === 'ar' ? 'ضريبة'  : 'Tax',       value: summary?.total_tax || 0,      color: 'var(--color-purple)' },
                  { label: locale === 'ar' ? 'خصومات' : 'Discounts', value: summary?.total_discount || 0, color: 'var(--color-warning)' },
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
                {locale === 'ar' ? 'تفاصيل الطلبات' : 'Orders Details'}
                <span style={{ marginRight: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  ({filtered.length})
                </span>
              </h3>
              <div className="table-actions">
                <div className="table-search">
                  <Search size={14} />
                  <input
                    id="rep-search" name="rep-search"
                    placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>{locale === 'ar' ? 'رقم الطلب' : 'Order #'}</th>
                  <th>{locale === 'ar' ? 'اسم العميل' : 'Customer'}</th>
                  <th>{locale === 'ar' ? 'الجوال' : 'Phone'}</th>
                  <th>{locale === 'ar' ? 'اللوحة' : 'Plate'}</th>
                  <th>{locale === 'ar' ? 'المجموع' : 'Subtotal'}</th>
                  <th>{locale === 'ar' ? 'الخصم' : 'Discount'}</th>
                  <th>{locale === 'ar' ? 'الضريبة' : 'Tax'}</th>
                  <th>{locale === 'ar' ? 'الإجمالي' : 'Total'}</th>
                  <th>{locale === 'ar' ? 'الدفع' : 'Payment'}</th>
                  <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                      #{String(order.id).slice(-8).toUpperCase()}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {order.customers?.name || '—'}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {order.customers?.phone || '—'}
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
                    <td><span className="badge badge-primary">{order.payment_method}</span></td>
                    <td>
                      <span className={`badge ${
                        order.status === 'completed' ? 'badge-success' :
                        order.status === 'refunded'  ? 'badge-purple' :
                        order.status === 'cancelled' ? 'badge-danger' : 'badge-warning'
                      }`}>{order.status}</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10}>
                      <div className="table-empty">
                        <div className="table-empty-icon">📊</div>
                        <div className="table-empty-text">
                          {locale === 'ar' ? 'لا توجد بيانات' : 'No data'}
                        </div>
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