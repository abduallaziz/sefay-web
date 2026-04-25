'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { formatCurrency, formatDateTime, getTodayDate } from '@/lib/utils'
import { Order } from '@/types'
import { Search, RefreshCw, Printer, RotateCcw } from 'lucide-react'

export default function OrdersPage() {
  const t = useTranslations('orders')
  const locale = useLocale()

  const [orders,    setOrders]    = useState<Order[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('today')
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [refunding, setRefunding] = useState<string | null>(null)

  useEffect(() => { loadOrders() }, [filter])

  async function loadOrders() {
    setLoading(true)
    try {
      const date = filter === 'today' ? getTodayDate() : undefined
      const res = await api.orders.getAll(date)
      setOrders(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }



  async function printOrder(order: any) {
  const rows = (order.order_items || []).map((i: any) =>
    `<tr><td>${i.service_name}</td><td style="text-align:center">${i.qty}</td><td style="text-align:left">${(i.price * i.qty).toFixed(0)}</td></tr>`
  ).join('')

  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"/>
  <style>
    @page { margin: 10mm; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #000; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .dashed { border-top: 1px dashed #000; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th { border-bottom: 1px solid #000; padding: 4px; text-align: right; }
    td { padding: 4px; text-align: right; }
    td:last-child { text-align: left; }
    .total-box { border: 1px solid #000; padding: 8px; margin: 8px 0; }
    .grand { font-size: 16px; font-weight: bold; display: flex; justify-content: space-between; }
  </style></head><body>
  <div class="center bold" style="font-size:18px">فاتورة ضريبية مبسطة</div>
  <div class="dashed"></div>
  <div class="row"><span>رقم الطلب:</span><span class="bold">#${String(order.id).slice(-8).toUpperCase()}</span></div>
  <div class="row"><span>التاريخ:</span><span>${new Date(order.created_at).toLocaleString('ar-SA')}</span></div>
  <div class="row"><span>اللوحة:</span><span class="bold">${order.vehicles?.plate || '—'}</span></div>
  <div class="row"><span>الجوال:</span><span>${order.customers?.phone || '—'}</span></div>
  <div class="dashed"></div>
  <table>
    <thead><tr><th>الخدمة</th><th>ك</th><th>المبلغ</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="dashed"></div>
  <div class="total-box">
    <div class="row"><span>المجموع:</span><span>${order.subtotal?.toFixed(2)} ر.س</span></div>
    ${order.discount > 0 ? `<div class="row"><span>خصم:</span><span>- ${order.discount?.toFixed(2)} ر.س</span></div>` : ''}
    <div class="row"><span>ضريبة:</span><span>${order.tax?.toFixed(2)} ر.س</span></div>
    <div class="dashed"></div>
    <div class="grand"><span>الإجمالي</span><span>${order.total?.toFixed(2)} ر.س</span></div>
  </div>
  <div class="dashed"></div>
  <div class="center" style="font-size:11px">شكراً لزيارتكم</div>
  </body></html>`

  const win = window.open('', '_blank', 'width=400,height=600')
  if (win) {
    win.document.write(html + '<script>window.onload=()=>{window.print();window.close();}<\/script>')
    win.document.close()
  }
}



  async function refundOrder(order: Order) {
    if (!confirm(
      locale === 'ar'
        ? `هل أنت متأكد من إرجاع الطلب #${String(order.id).slice(-8).toUpperCase()}؟`
        : `Are you sure you want to refund order #${String(order.id).slice(-8).toUpperCase()}?`
    )) return
    setRefunding(order.id)
    try {
      await supabase
        .from('orders')
        .update({ status: 'refunded' })
        .eq('id', order.id)
      loadOrders()
    } catch (e) {
      console.error(e)
    } finally {
      setRefunding(null)
    }
  }

  const filtered = orders.filter(o =>
    String(o.id).slice(-8).toLowerCase().includes(search.toLowerCase()) ||
    (o as any).vehicles?.plate?.toLowerCase().includes(search.toLowerCase()) ||
    (o as any).customers?.phone?.includes(search)
  )

  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0)
  const totalOrders  = orders.filter(o => o.status === 'completed').length

  const filters = [
    { id: 'today',     label: t('filters.today') },
    { id: 'yesterday', label: t('filters.yesterday') },
    { id: 'week',      label: t('filters.week') },
    { id: 'all',       label: t('filters.all') },
  ]

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{t('title')}</h2>
          <p className="dashboard-page-subtitle">
            {totalOrders} {locale === 'ar' ? 'طلب مكتمل' : 'completed orders'} —{' '}
            {formatCurrency(totalRevenue, locale === 'ar' ? 'ar-SA' : 'en-US')}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadOrders}>
          <RefreshCw size={14} />
          {locale === 'ar' ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">{t('title')}</h3>
          <div className="table-actions">
            <div className="table-search">
              <Search size={14} />
              <input
                placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-filters">
          {filters.map(f => (
            <button
              key={f.id}
              className={`table-filter-btn ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('orderNumber')}</th>
                <th>{t('plate')}</th>
                <th>{locale === 'ar' ? 'العميل' : 'Customer'}</th>
                <th>{t('total')}</th>
                <th>{t('paymentMethod')}</th>
                <th>{t('status')}</th>
                <th>{t('date')}</th>
                <th>{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <>
                  <tr
                    key={order.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  >
                    <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                      #{String(order.id).slice(-8).toUpperCase()}
                    </td>
                    <td>{(order as any).vehicles?.plate || '—'}</td>
                    <td>{(order as any).customers?.phone || '—'}</td>
                    <td style={{ fontWeight: '700' }}>
                      {formatCurrency(order.total, locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        {t(`paymentMethods.${order.payment_method}` as any)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        order.status === 'completed' ? 'badge-success' :
                        order.status === 'refunded'  ? 'badge-purple' :
                        order.status === 'cancelled' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {t(`statuses.${order.status}` as any)}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {formatDateTime(order.created_at, locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="action-btn" title={locale === 'ar' ? 'طباعة' : 'Print'}>
                          <Printer size={14} />
                        </button>
                        {order.status === 'completed' && (
                          <button
                            className="action-btn danger"
                            title={locale === 'ar' ? 'إرجاع' : 'Refund'}
                            onClick={() => refundOrder(order)}
                            disabled={refunding === order.id}
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr key={`${order.id}-expanded`}>
                      <td colSpan={8} style={{ padding: '0' }}>
                        <div style={{
                          padding: '16px 20px',
                          backgroundColor: 'var(--color-bg-tertiary)',
                          borderTop: '1px solid var(--color-border)',
                        }}>
                          <div style={{ marginBottom: '12px', fontWeight: '700', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            {locale === 'ar' ? 'الخدمات' : 'Services'}
                          </div>
                          {((order as any).order_items || []).map((item: any, i: number) => (
                            <div key={i} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '8px 0',
                              borderBottom: '1px solid var(--color-border)',
                              fontSize: '13px',
                            }}>
                              <span style={{ color: 'var(--color-text-primary)' }}>
                                {item.service_name} ×{item.qty}
                              </span>
                              <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                                {formatCurrency(item.price * item.qty, locale === 'ar' ? 'ar-SA' : 'en-US')}
                              </span>
                            </div>
                          ))}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '32px',
                            marginTop: '12px',
                            fontSize: '13px',
                          }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              {locale === 'ar' ? 'المجموع:' : 'Subtotal:'}{' '}
                              <strong style={{ color: 'var(--color-text-primary)' }}>
                                {formatCurrency(order.subtotal, locale === 'ar' ? 'ar-SA' : 'en-US')}
                              </strong>
                            </span>
                            {order.discount > 0 && (
                              <span style={{ color: 'var(--color-success)' }}>
                                {locale === 'ar' ? 'خصم:' : 'Discount:'}{' '}
                                <strong>- {formatCurrency(order.discount, locale === 'ar' ? 'ar-SA' : 'en-US')}</strong>
                              </span>
                            )}
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              {locale === 'ar' ? 'ضريبة:' : 'Tax:'}{' '}
                              <strong style={{ color: 'var(--color-text-primary)' }}>
                                {formatCurrency(order.tax, locale === 'ar' ? 'ar-SA' : 'en-US')}
                              </strong>
                            </span>
                            <span style={{ color: 'var(--color-primary)', fontWeight: '900', fontSize: '15px' }}>
                              {locale === 'ar' ? 'الإجمالي:' : 'Total:'}{' '}
                              {formatCurrency(order.total, locale === 'ar' ? 'ar-SA' : 'en-US')}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="table-empty">
                      <div className="table-empty-icon">📋</div>
                      <div className="table-empty-text">
                        {locale === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}