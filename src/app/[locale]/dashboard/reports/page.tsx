'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { formatCurrency, getTodayDate } from '@/lib/utils'
import { Download, Search, X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import DateRangePicker from '@/components/ui/DateRangePicker'
import '@/styles/modals.css'
import '@/styles/forms.css'

type TabType = 'sales' | 'finance' | 'tax'
type ReportType =
  | 'sales_summary' | 'sales_by_branch' | 'sales_by_employee'
  | 'sales_by_service' | 'sales_by_payment' | 'customers_report'
  | 'expenses_report' | 'expenses_by_category' | 'net_profit'
  | 'tax_report'

interface ReportCard {
  id: ReportType
  title: string
  desc: string
  icon: string
  tab: TabType
}

export default function ReportsPage() {
  const locale = useLocale()

  const [tab,         setTab]         = useState<TabType>('sales')
  const [activeReport,setActiveReport]= useState<ReportType | null>(null)
  const [search,      setSearch]      = useState('')
  const [loading,     setLoading]     = useState(false)
  const [reportData,  setReportData]  = useState<any>(null)
  const [fromDate,    setFromDate]    = useState(getTodayDate())
  const [toDate,      setToDate]      = useState(getTodayDate())
  const [tableSearch, setTableSearch] = useState('')

  const REPORTS: ReportCard[] = [
    { id: 'sales_summary',        tab: 'sales',   icon: '📊', title: locale === 'ar' ? 'ملخص المبيعات'            : 'Sales Summary',       desc: locale === 'ar' ? 'إجمالي المبيعات والطلبات بفترة زمنية محددة'        : 'Total sales and orders for a period' },
    { id: 'sales_by_branch',      tab: 'sales',   icon: '🏬', title: locale === 'ar' ? 'المبيعات لكل فرع'         : 'Sales by Branch',      desc: locale === 'ar' ? 'مقارنة أداء الفروع من حيث المبيعات والطلبات'       : 'Compare branch performance' },
    { id: 'sales_by_employee',    tab: 'sales',   icon: '👤', title: locale === 'ar' ? 'المبيعات لكل موظف'        : 'Sales by Employee',    desc: locale === 'ar' ? 'راقب أداء موظفيك ومبيعاتهم خلال فترة محددة'       : 'Track employee sales performance' },
    { id: 'sales_by_service',     tab: 'sales',   icon: '🔧', title: locale === 'ar' ? 'المبيعات حسب الخدمة'      : 'Sales by Service',     desc: locale === 'ar' ? 'أكثر الخدمات مبيعاً وإيراداً خلال الفترة'          : 'Top selling services' },
    { id: 'sales_by_payment',     tab: 'sales',   icon: '💳', title: locale === 'ar' ? 'المبيعات حسب طريقة الدفع' : 'Sales by Payment',     desc: locale === 'ar' ? 'توزيع المبيعات بين النقد والبطاقة والتحويل'        : 'Payment method breakdown' },
    { id: 'customers_report',     tab: 'sales',   icon: '👥', title: locale === 'ar' ? 'تقرير العملاء'            : 'Customers Report',     desc: locale === 'ar' ? 'أكثر العملاء شراءً وزيارةً خلال الفترة'            : 'Top customers by purchases' },
    { id: 'expenses_report',      tab: 'finance', icon: '💸', title: locale === 'ar' ? 'تقرير المصاريف'           : 'Expenses Report',      desc: locale === 'ar' ? 'جميع المصاريف المسجلة خلال الفترة الزمنية'         : 'All recorded expenses for a period' },
    { id: 'expenses_by_category', tab: 'finance', icon: '📂', title: locale === 'ar' ? 'المصاريف حسب الفئة'      : 'Expenses by Category', desc: locale === 'ar' ? 'توزيع المصاريف حسب الفئات المختلفة'               : 'Expense breakdown by category' },
    { id: 'net_profit',           tab: 'finance', icon: '📈', title: locale === 'ar' ? 'صافي الربح'               : 'Net Profit',           desc: locale === 'ar' ? 'المبيعات مطروحاً منها المصاريف والضريبة والخصومات' : 'Sales minus expenses, tax and discounts' },
    { id: 'tax_report',           tab: 'tax',     icon: '🧾', title: locale === 'ar' ? 'الإقرار الضريبي'          : 'Tax Declaration',      desc: locale === 'ar' ? 'ملخص شامل للضريبة المحصلة خلال الفترة'             : 'Complete VAT tax summary' },
  ]

  const TABS = [
    { id: 'sales',   labelAr: '📊 المبيعات', labelEn: '📊 Sales' },
    { id: 'finance', labelAr: '💰 المالية',  labelEn: '💰 Finance' },
    { id: 'tax',     labelAr: '🧾 الضريبة',  labelEn: '🧾 Tax' },
  ]

  const filteredReports = REPORTS.filter(r =>
    r.tab === tab &&
    (search === '' || r.title.toLowerCase().includes(search.toLowerCase()))
  )

  async function openReport(id: ReportType) {
    setActiveReport(id)
    setTableSearch('')
    await loadReport(id, fromDate, toDate)
  }

  async function loadReport(id: ReportType, from: string, to: string) {
    setLoading(true)
    setReportData(null)
    try {
      const session = getSession()
      if (!session) return

      if (id === 'sales_summary') {
        const [summaryRes, ordersRes] = await Promise.all([
          api.orders.summaryByRange(from, to),
          api.orders.getByRange(from, to),
        ])
        setReportData({ summary: summaryRes.data, orders: ordersRes.data || [] })

      } else if (id === 'sales_by_branch') {
        const ordersRes = await api.orders.getByRange(from, to)
        const orders = ordersRes.data || []
        const { data: branches } = await supabase.from('branches').select('id, name').eq('tenant_id', session.tenant_id)
        const map: Record<string, any> = {}
        orders.forEach((o: any) => {
          const br  = branches?.find((b: any) => b.id === o.branch_id)
          const key = o.branch_id || 'unknown'
          if (!map[key]) map[key] = { name: br?.name || (locale === 'ar' ? 'غير محدد' : 'Unassigned'), total: 0, orders: 0 }
          map[key].total += Number(o.total)
          map[key].orders += 1
        })
        setReportData({ rows: Object.values(map) })

      } else if (id === 'sales_by_employee') {
        const ordersRes = await api.orders.getByRange(from, to)
        const orders = ordersRes.data || []
        const { data: users } = await supabase.from('users').select('id, name').eq('tenant_id', session.tenant_id)
        const map: Record<string, any> = {}
        orders.forEach((o: any) => {
          const user = users?.find((u: any) => u.id === o.cashier_id)
          const key  = o.cashier_id || 'unknown'
          if (!map[key]) map[key] = { name: user?.name || '—', total: 0, orders: 0 }
          map[key].total += Number(o.total)
          map[key].orders += 1
        })
        setReportData({ rows: Object.values(map).sort((a, b) => b.total - a.total) })

      } else if (id === 'sales_by_service') {
        const ordersRes = await api.orders.getByRange(from, to)
        const orders = ordersRes.data || []
        const map: Record<string, any> = {}
        orders.forEach((o: any) => {
          ;(o.order_items || []).forEach((item: any) => {
            const key = item.service_name || '—'
            if (!map[key]) map[key] = { name: key, total: 0, count: 0 }
            map[key].total += Number(item.price) * Number(item.qty)
            map[key].count += Number(item.qty)
          })
        })
        setReportData({ rows: Object.values(map).sort((a, b) => b.total - a.total) })

      } else if (id === 'sales_by_payment') {
        const [summaryRes, ordersRes] = await Promise.all([
          api.orders.summaryByRange(from, to),
          api.orders.getByRange(from, to),
        ])
        const orders = ordersRes.data || []
        const map: Record<string, any> = {}
        orders.forEach((o: any) => {
          const key = o.payment_method || '—'
          if (!map[key]) map[key] = { method: key, total: 0, count: 0 }
          map[key].total += Number(o.total)
          map[key].count += 1
        })
        setReportData({ summary: summaryRes.data, rows: Object.values(map).sort((a, b) => b.total - a.total) })

      } else if (id === 'customers_report') {
        const ordersRes = await api.orders.getByRange(from, to)
        const orders = ordersRes.data || []
        const map: Record<string, any> = {}
        orders.forEach((o: any) => {
          if (!o.customer_id) return
          const key = o.customer_id
          if (!map[key]) map[key] = { name: o.customers?.name || '—', phone: o.customers?.phone || '—', total: 0, visits: 0 }
          map[key].total += Number(o.total)
          map[key].visits += 1
        })
        setReportData({ rows: Object.values(map).sort((a, b) => b.total - a.total) })

      } else if (id === 'expenses_report') {
        const res = await api.expenses.getAll(from, to)
        setReportData({ expenses: res.data || [] })

      } else if (id === 'expenses_by_category') {
        const res = await api.expenses.getAll(from, to)
        const expenses = res.data || []
        const map: Record<string, any> = {}
        expenses.forEach((e: any) => {
          const key = e.category || 'عام'
          if (!map[key]) map[key] = { category: key, total: 0, count: 0 }
          map[key].total += Number(e.amount)
          map[key].count += 1
        })
        setReportData({ rows: Object.values(map).sort((a, b) => b.total - a.total) })

      } else if (id === 'net_profit') {
        const [summaryRes, expensesRes] = await Promise.all([
          api.orders.summaryByRange(from, to),
          api.expenses.getAll(from, to),
        ])
        const summary  = summaryRes.data
        const expenses = expensesRes.data || []
        const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0)
        const netProfit = (summary?.total_sales || 0) - totalExpenses - (summary?.total_tax || 0) - (summary?.total_discount || 0)
        setReportData({ summary, totalExpenses, netProfit })

      } else if (id === 'tax_report') {
        const [summaryRes, ordersRes, expensesRes] = await Promise.all([
          api.orders.summaryByRange(from, to),
          api.orders.getByRange(from, to),
          api.expenses.getAll(from, to),
        ])
        const expenses = expensesRes.data || []
        const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0)
        setReportData({ summary: summaryRes.data, orders: ordersRes.data || [], totalExpenses })
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  function exportCSV(rows: any[], headers: string[], filename: string) {
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `${filename}_${fromDate}_${toDate}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function handleExport() {
    if (!reportData) return
    if (activeReport === 'sales_summary') {
      exportCSV((reportData.orders || []).map((o: any) => [String(o.id).slice(-8).toUpperCase(), o.customers?.name || '', o.customers?.phone || '', o.subtotal, o.discount, o.tax, o.total, o.payment_method, o.status, new Date(o.created_at).toLocaleDateString('ar-SA')]), ['رقم الطلب','العميل','الجوال','المجموع','الخصم','الضريبة','الإجمالي','الدفع','الحالة','التاريخ'], 'sales_summary')
    } else if (activeReport === 'sales_by_branch') {
      exportCSV(reportData.rows.map((r: any) => [r.name, r.orders, r.total.toFixed(2)]), ['الفرع','عدد الطلبات','الإجمالي'], 'sales_by_branch')
    } else if (activeReport === 'sales_by_employee') {
      exportCSV(reportData.rows.map((r: any) => [r.name, r.orders, r.total.toFixed(2)]), ['الموظف','عدد الطلبات','الإجمالي'], 'sales_by_employee')
    } else if (activeReport === 'sales_by_service') {
      exportCSV(reportData.rows.map((r: any) => [r.name, r.count, r.total.toFixed(2)]), ['الخدمة','الكمية','الإجمالي'], 'sales_by_service')
    } else if (activeReport === 'sales_by_payment') {
      exportCSV(reportData.rows.map((r: any) => [r.method, r.count, r.total.toFixed(2)]), ['طريقة الدفع','عدد الطلبات','الإجمالي'], 'sales_by_payment')
    } else if (activeReport === 'customers_report') {
      exportCSV(reportData.rows.map((r: any) => [r.name, r.phone, r.visits, r.total.toFixed(2)]), ['العميل','الجوال','الزيارات','الإجمالي'], 'customers')
    } else if (activeReport === 'expenses_report') {
      exportCSV(reportData.expenses.map((e: any) => [e.title, e.category, e.amount, e.date, e.notes || '']), ['العنوان','الفئة','المبلغ','التاريخ','ملاحظات'], 'expenses')
    } else if (activeReport === 'expenses_by_category') {
      exportCSV(reportData.rows.map((r: any) => [r.category, r.count, r.total.toFixed(2)]), ['الفئة','عدد المصاريف','الإجمالي'], 'expenses_by_category')
    } else if (activeReport === 'tax_report') {
      exportCSV((reportData.orders || []).map((o: any) => [String(o.id).slice(-8).toUpperCase(), o.subtotal, o.tax, o.total, new Date(o.created_at).toLocaleDateString('ar-SA')]), ['رقم الطلب','المجموع قبل الضريبة','الضريبة','الإجمالي','التاريخ'], 'tax_report')
    }
  }

  const activeCard = REPORTS.find(r => r.id === activeReport)

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{locale === 'ar' ? 'التقارير' : 'Reports'}</h2>
          <p className="dashboard-page-subtitle">{locale === 'ar' ? 'اختر تقريراً لعرض تفاصيله' : 'Select a report to view details'}</p>
        </div>
      </div>

      <div className="table-filters" style={{ marginBottom: '20px' }}>
        {TABS.map(t => (
          <button key={t.id}
            className={`table-filter-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => { setTab(t.id as TabType); setActiveReport(null) }}>
            {locale === 'ar' ? t.labelAr : t.labelEn}
          </button>
        ))}
        <div className="table-search" style={{ marginRight: 'auto' }}>
          <Search size={14} />
          <input placeholder={locale === 'ar' ? 'بحث عن تقرير...' : 'Search report...'} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {!activeReport && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {filteredReports.map(r => (
            <div key={r.id} onClick={() => openReport(r.id)}
              style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px', cursor: 'pointer', transition: 'var(--transition)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = 'var(--color-primary-light)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)' }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>{r.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: '6px' }}>{r.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>{r.desc}</div>
            </div>
          ))}
        </div>
      )}

      {activeReport && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '16px 20px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveReport(null)}>
              <X size={14} />{locale === 'ar' ? 'رجوع' : 'Back'}
            </button>
            <div style={{ fontSize: '20px' }}>{activeCard?.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-text-primary)' }}>{activeCard?.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{fromDate} — {toDate}</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleExport} disabled={!reportData}>
              <Download size={14} />{locale === 'ar' ? 'تصدير CSV' : 'Export CSV'}
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <DateRangePicker from={fromDate} to={toDate}
              onChange={(from, to) => { setFromDate(from); setToDate(to); loadReport(activeReport, from, to) }} />
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : reportData ? (
            <ReportContent id={activeReport} data={reportData} locale={locale}
              tableSearch={tableSearch} setTableSearch={setTableSearch}
              fromDate={fromDate} toDate={toDate} />
          ) : null}
        </div>
      )}
    </div>
  )
}

function ReportContent({ id, data, locale, tableSearch, setTableSearch, fromDate, toDate }: any) {
  const fc = (v: number) => formatCurrency(v, locale === 'ar' ? 'ar-SA' : 'en-US')

  if (id === 'sales_summary') {
    const { summary, orders } = data
    const filtered = orders.filter((o: any) =>
      String(o.id).slice(-8).toLowerCase().includes(tableSearch.toLowerCase()) ||
      o.customers?.name?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      o.vehicles?.plate?.toLowerCase().includes(tableSearch.toLowerCase())
    )
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: locale === 'ar' ? 'إجمالي المبيعات' : 'Total Sales',  value: fc(summary?.total_sales || 0),    color: 'var(--color-primary)' },
            { label: locale === 'ar' ? 'عدد الطلبات'     : 'Total Orders', value: summary?.total_orders || 0,       color: 'var(--color-success)' },
            { label: locale === 'ar' ? 'نقد'             : 'Cash',         value: fc(summary?.cash || 0),           color: 'var(--color-warning)' },
            { label: locale === 'ar' ? 'بطاقة'           : 'Card',         value: fc(summary?.card || 0),           color: 'var(--color-purple)' },
            { label: locale === 'ar' ? 'ضريبة'           : 'Tax',          value: fc(summary?.total_tax || 0),      color: 'var(--color-danger)' },
            { label: locale === 'ar' ? 'خصومات'          : 'Discounts',    value: fc(summary?.total_discount || 0), color: 'var(--color-success)' },
          ].map((s, i) => (
            <div key={i} style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>{s.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        {summary?.orders_by_day?.length > 0 && (
          <div style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
              {locale === 'ar' ? 'المبيعات اليومية' : 'Daily Sales'}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary.orders_by_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">{locale === 'ar' ? 'تفاصيل الطلبات' : 'Orders'} ({filtered.length})</h3>
            <div className="table-search">
              <Search size={14} />
              <input placeholder={locale === 'ar' ? 'بحث...' : 'Search...'} value={tableSearch} onChange={e => setTableSearch(e.target.value)} />
            </div>
          </div>
          <table><thead><tr>
            <th>{locale === 'ar' ? 'رقم الطلب' : 'Order #'}</th>
            <th>{locale === 'ar' ? 'العميل' : 'Customer'}</th>
            <th>{locale === 'ar' ? 'اللوحة' : 'Plate'}</th>
            <th>{locale === 'ar' ? 'الإجمالي' : 'Total'}</th>
            <th>{locale === 'ar' ? 'الدفع' : 'Payment'}</th>
            <th>{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
          </tr></thead>
          <tbody>
            {filtered.map((o: any) => (
              <tr key={o.id}>
                <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>#{String(o.id).slice(-8).toUpperCase()}</td>
                <td>{o.customers?.name || '—'}</td>
                <td>{o.vehicles?.plate || '—'}</td>
                <td style={{ fontWeight: '700' }}>{fc(o.total)}</td>
                <td><span className="badge badge-primary">{o.payment_method}</span></td>
                <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{new Date(o.created_at).toLocaleDateString('ar-SA')}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6}><div className="table-empty"><div className="table-empty-icon">📊</div><div className="table-empty-text">{locale === 'ar' ? 'لا توجد بيانات' : 'No data'}</div></div></td></tr>}
          </tbody></table>
        </div>
      </div>
    )
  }

  if (id === 'sales_by_branch' || id === 'sales_by_employee') {
    const label = id === 'sales_by_branch' ? (locale === 'ar' ? 'الفرع' : 'Branch') : (locale === 'ar' ? 'الموظف' : 'Employee')
    return (
      <div className="table-container">
        <table><thead><tr>
          <th>{label}</th>
          <th>{locale === 'ar' ? 'عدد الطلبات' : 'Orders'}</th>
          <th>{locale === 'ar' ? 'الإجمالي' : 'Total'}</th>
        </tr></thead>
        <tbody>
          {data.rows.map((r: any, i: number) => (
            <tr key={i}>
              <td style={{ fontWeight: '700' }}>{r.name}</td>
              <td><span className="badge badge-primary">{r.orders}</span></td>
              <td style={{ fontWeight: '700', color: 'var(--color-success)' }}>{fc(r.total)}</td>
            </tr>
          ))}
          {data.rows.length === 0 && <tr><td colSpan={3}><div className="table-empty"><div className="table-empty-icon">📊</div><div className="table-empty-text">{locale === 'ar' ? 'لا توجد بيانات' : 'No data'}</div></div></td></tr>}
        </tbody></table>
      </div>
    )
  }

  if (id === 'sales_by_service') {
    return (
      <div className="table-container">
        <table><thead><tr>
          <th>{locale === 'ar' ? 'الخدمة' : 'Service'}</th>
          <th>{locale === 'ar' ? 'الكمية' : 'Qty'}</th>
          <th>{locale === 'ar' ? 'الإجمالي' : 'Total'}</th>
        </tr></thead>
        <tbody>
          {data.rows.map((r: any, i: number) => (
            <tr key={i}>
              <td style={{ fontWeight: '700' }}>{r.name}</td>
              <td><span className="badge badge-muted">{r.count}</span></td>
              <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{fc(r.total)}</td>
            </tr>
          ))}
          {data.rows.length === 0 && <tr><td colSpan={3}><div className="table-empty"><div className="table-empty-icon">🔧</div><div className="table-empty-text">{locale === 'ar' ? 'لا توجد بيانات' : 'No data'}</div></div></td></tr>}
        </tbody></table>
      </div>
    )
  }

  if (id === 'sales_by_payment') {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: locale === 'ar' ? 'إجمالي المبيعات' : 'Total', value: fc(data.summary?.total_sales || 0), color: 'var(--color-primary)' },
            { label: locale === 'ar' ? 'نقد'   : 'Cash', value: fc(data.summary?.cash || 0), color: 'var(--color-warning)' },
            { label: locale === 'ar' ? 'بطاقة' : 'Card', value: fc(data.summary?.card || 0), color: 'var(--color-purple)' },
          ].map((s, i) => (
            <div key={i} style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>{s.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div className="table-container">
          <table><thead><tr>
            <th>{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</th>
            <th>{locale === 'ar' ? 'عدد الطلبات' : 'Orders'}</th>
            <th>{locale === 'ar' ? 'الإجمالي' : 'Total'}</th>
          </tr></thead>
          <tbody>
            {data.rows.map((r: any, i: number) => (
              <tr key={i}>
                <td><span className="badge badge-primary">{r.method}</span></td>
                <td>{r.count}</td>
                <td style={{ fontWeight: '700', color: 'var(--color-success)' }}>{fc(r.total)}</td>
              </tr>
            ))}
            {data.rows.length === 0 && <tr><td colSpan={3}><div className="table-empty"><div className="table-empty-icon">💳</div><div className="table-empty-text">{locale === 'ar' ? 'لا توجد بيانات' : 'No data'}</div></div></td></tr>}
          </tbody></table>
        </div>
      </div>
    )
  }

  if (id === 'customers_report') {
    return (
      <div className="table-container">
        <table><thead><tr>
          <th>{locale === 'ar' ? 'العميل' : 'Customer'}</th>
          <th>{locale === 'ar' ? 'الجوال' : 'Phone'}</th>
          <th>{locale === 'ar' ? 'الزيارات' : 'Visits'}</th>
          <th>{locale === 'ar' ? 'الإجمالي' : 'Total'}</th>
        </tr></thead>
        <tbody>
          {data.rows.map((r: any, i: number) => (
            <tr key={i}>
              <td style={{ fontWeight: '700' }}>{r.name}</td>
              <td style={{ color: 'var(--color-text-secondary)' }}>{r.phone}</td>
              <td><span className="badge badge-primary">{r.visits}</span></td>
              <td style={{ fontWeight: '700', color: 'var(--color-success)' }}>{fc(r.total)}</td>
            </tr>
          ))}
          {data.rows.length === 0 && <tr><td colSpan={4}><div className="table-empty"><div className="table-empty-icon">👥</div><div className="table-empty-text">{locale === 'ar' ? 'لا توجد بيانات' : 'No data'}</div></div></td></tr>}
        </tbody></table>
      </div>
    )
  }

  if (id === 'expenses_report') {
    return (
      <div className="table-container">
        <table><thead><tr>
          <th>{locale === 'ar' ? 'العنوان' : 'Title'}</th>
          <th>{locale === 'ar' ? 'الفئة' : 'Category'}</th>
          <th>{locale === 'ar' ? 'المبلغ' : 'Amount'}</th>
          <th>{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
          <th>{locale === 'ar' ? 'ملاحظات' : 'Notes'}</th>
        </tr></thead>
        <tbody>
          {data.expenses.map((e: any) => (
            <tr key={e.id}>
              <td style={{ fontWeight: '700' }}>{e.title}</td>
              <td><span className="badge badge-muted">{e.category}</span></td>
              <td style={{ fontWeight: '700', color: 'var(--color-danger)' }}>- {fc(e.amount)}</td>
              <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{e.date}</td>
              <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{e.notes || '—'}</td>
            </tr>
          ))}
          {data.expenses.length === 0 && <tr><td colSpan={5}><div className="table-empty"><div className="table-empty-icon">💸</div><div className="table-empty-text">{locale === 'ar' ? 'لا توجد مصاريف' : 'No expenses'}</div></div></td></tr>}
        </tbody></table>
      </div>
    )
  }

  if (id === 'expenses_by_category') {
    return (
      <div className="table-container">
        <table><thead><tr>
          <th>{locale === 'ar' ? 'الفئة' : 'Category'}</th>
          <th>{locale === 'ar' ? 'عدد المصاريف' : 'Count'}</th>
          <th>{locale === 'ar' ? 'الإجمالي' : 'Total'}</th>
        </tr></thead>
        <tbody>
          {data.rows.map((r: any, i: number) => (
            <tr key={i}>
              <td><span className="badge badge-muted">{r.category}</span></td>
              <td>{r.count}</td>
              <td style={{ fontWeight: '700', color: 'var(--color-danger)' }}>- {fc(r.total)}</td>
            </tr>
          ))}
          {data.rows.length === 0 && <tr><td colSpan={3}><div className="table-empty"><div className="table-empty-icon">📂</div><div className="table-empty-text">{locale === 'ar' ? 'لا توجد بيانات' : 'No data'}</div></div></td></tr>}
        </tbody></table>
      </div>
    )
  }

  if (id === 'net_profit') {
    const { summary, totalExpenses, netProfit } = data
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {[
          { label: locale === 'ar' ? 'إجمالي المبيعات' : 'Total Sales',     value: fc(summary?.total_sales || 0),    color: 'var(--color-success)' },
          { label: locale === 'ar' ? 'إجمالي المصاريف' : 'Total Expenses',  value: fc(totalExpenses || 0),           color: 'var(--color-danger)' },
          { label: locale === 'ar' ? 'إجمالي الضريبة'  : 'Total Tax',       value: fc(summary?.total_tax || 0),      color: 'var(--color-purple)' },
          { label: locale === 'ar' ? 'إجمالي الخصومات' : 'Total Discounts', value: fc(summary?.total_discount || 0), color: 'var(--color-warning)' },
        ].map((s, i) => (
          <div key={i} style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: s.color }}>{s.value}</div>
          </div>
        ))}
        <div style={{ gridColumn: '1 / -1', backgroundColor: netProfit >= 0 ? 'var(--color-success-light)' : 'var(--color-danger-light)', border: `2px solid ${netProfit >= 0 ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`, borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>💰 {locale === 'ar' ? 'صافي الربح' : 'Net Profit'}</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{fc(netProfit)}</div>
          </div>
          <div style={{ fontSize: '56px' }}>{netProfit >= 0 ? '📈' : '📉'}</div>
        </div>
      </div>
    )
  }

  if (id === 'tax_report') {
    const { summary, orders, totalExpenses } = data
    const salesBeforeTax = (summary?.total_sales || 0) - (summary?.total_tax || 0)
    const vatOnSales     = summary?.total_tax || 0
    const vatOnExpenses  = (totalExpenses || 0) * 0.15
    const netVat         = vatOnSales - vatOnExpenses

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* رأس الإقرار */}
        <div style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Sefay ERP</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--color-text-primary)', marginBottom: '4px' }}>🧾 {locale === 'ar' ? 'الإقرار الضريبي' : 'VAT Tax Declaration'}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {locale === 'ar' ? 'من' : 'From'} {fromDate} {locale === 'ar' ? 'إلى' : 'to'} {toDate}
          </div>
        </div>

        {/* المبيعات */}
        <div style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', fontWeight: '800', fontSize: '14px', color: 'var(--color-text-primary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{locale === 'ar' ? 'المبيعات' : 'Sales'}</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{locale === 'ar' ? 'المبلغ' : 'Amount'}</span>
          </div>
          {[
            { label: locale === 'ar' ? 'المبيعات الخاضعة للنسبة الأساسية (0%)' : 'Sales at standard rate (0%)', value: 0 },
            { label: locale === 'ar' ? 'المبيعات المحلية الخاضعة للنسبة الصغرى (15%)' : 'Local sales at reduced rate (15%)', value: salesBeforeTax },
          ].map((row, i) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{row.label}</span>
              <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{fc(row.value)}</span>
            </div>
          ))}
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-primary-light)' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)' }}>{locale === 'ar' ? 'ضريبة القيمة المضافة على المبيعات' : 'VAT on Sales'}</span>
            <span style={{ fontWeight: '900', color: 'var(--color-primary)', fontSize: '15px' }}>{fc(vatOnSales)}</span>
          </div>
        </div>

        {/* المشتريات */}
        <div style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', fontWeight: '800', fontSize: '14px', color: 'var(--color-text-primary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{locale === 'ar' ? 'المشتريات' : 'Purchases'}</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{locale === 'ar' ? 'المبلغ' : 'Amount'}</span>
          </div>
          {[
            { label: locale === 'ar' ? 'المشتريات الخاضعة للنسبة الأساسية (0%)' : 'Purchases at standard rate (0%)', value: 0 },
            { label: locale === 'ar' ? 'المشتريات المحلية الخاضعة للنسبة الصغرى (15%)' : 'Local purchases at reduced rate (15%)', value: totalExpenses || 0 },
          ].map((row, i) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{row.label}</span>
              <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{fc(row.value)}</span>
            </div>
          ))}
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-danger-light)' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-danger)' }}>{locale === 'ar' ? 'ضريبة القيمة المضافة على المشتريات' : 'VAT on Purchases'}</span>
            <span style={{ fontWeight: '900', color: 'var(--color-danger)', fontSize: '15px' }}>{fc(vatOnExpenses)}</span>
          </div>
        </div>

        {/* صافي الضريبة */}
        <div style={{ padding: '20px 24px', backgroundColor: netVat >= 0 ? 'var(--color-danger-light)' : 'var(--color-success-light)', border: `2px solid ${netVat >= 0 ? 'var(--color-danger-border)' : 'var(--color-success-border)'}`, borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{locale === 'ar' ? 'صافي الضريبة للفترة المحددة' : 'Net Tax for Period'}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              {netVat >= 0 ? (locale === 'ar' ? 'ضريبة مستحقة للدفع' : 'Tax payable') : (locale === 'ar' ? 'ضريبة مستردة' : 'Tax refundable')}
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: netVat >= 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
              {fc(Math.abs(netVat))}
            </div>
          </div>
          <div style={{ fontSize: '48px' }}>{netVat >= 0 ? '🧾' : '✅'}</div>
        </div>
      </div>
    )
  }

  return null
}