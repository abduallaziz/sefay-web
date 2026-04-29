'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { formatCurrency, formatDateTime, getTodayDate } from '@/lib/utils'
import { RefreshCw, Search, Printer, RotateCcw, GitBranch, X, AlertTriangle } from 'lucide-react'
import '@/styles/forms.css'
import '@/styles/modals.css'

interface RefundItem {
  service_name: string
  price: number
  qty: number
  selected: boolean
  refundQty: number
}

interface PartialRefundState {
  order: any
  items: RefundItem[]
  mode: 'items' | 'amount'
  customAmount: string
  loading: boolean
}

function paymentBadge(order: any, locale: string) {
  const isMixed = Number(order.cash_amount) > 0 && Number(order.card_amount) > 0
  if (isMixed) {
    return (
      <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span className="badge badge-warning" style={{ fontSize: '10px' }}>
          {locale === 'ar' ? 'مختلط' : 'Mixed'}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
          {locale === 'ar'
            ? `ن:${Number(order.cash_amount).toFixed(0)} ب:${Number(order.card_amount).toFixed(0)}`
            : `C:${Number(order.cash_amount).toFixed(0)} K:${Number(order.card_amount).toFixed(0)}`}
        </span>
      </span>
    )
  }
  const map: Record<string, string> = {
    cash: locale === 'ar' ? 'نقد' : 'Cash',
    mada: 'Mada', visa: 'Visa', mastercard: 'Mastercard',
  }
  return <span className="badge badge-primary">{map[order.payment_method] || order.payment_method}</span>
}

function getYesterdayDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })
}

function getWeekStartDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })
}

export default function OrdersPage() {
  const t      = useTranslations('orders')
  const locale = useLocale()

  const [orders,      setOrders]      = useState<any[]>([])
  const [branches,    setBranches]    = useState<any[]>([])
  const [selBranch,   setSelBranch]   = useState<string>('all')
  const [filter,      setFilter]      = useState('today')
  const [search,      setSearch]      = useState('')
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [refunding,   setRefunding]   = useState<string | null>(null)
  const [toast,       setToast]       = useState('')
  const [refundModal, setRefundModal] = useState<PartialRefundState | null>(null)

  useEffect(() => {
    loadBranches()
    loadOrders()
  }, [filter])

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

  async function loadOrders() {
    setLoading(true)
    try {
      const date = filter === 'today'     ? getTodayDate()
                 : filter === 'yesterday' ? getYesterdayDate()
                 : filter === 'week'      ? getWeekStartDate()
                 : undefined
      const res = await api.orders.getAll(date)
      setOrders(res.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  function printOrder(order: any) {
    const rows = (order.order_items || []).map((i: any) =>
      `<tr><td>${i.service_name}</td><td style="text-align:center">${i.qty}</td><td style="text-align:left">${(i.price * i.qty).toFixed(0)}</td></tr>`
    ).join('')

    const isMixed = Number(order.cash_amount) > 0 && Number(order.card_amount) > 0
    const paymentLine = isMixed
      ? `<div class="row"><span>نقد:</span><span>${Number(order.cash_amount).toFixed(2)} ر.س</span></div>
         <div class="row"><span>بطاقة:</span><span>${Number(order.card_amount).toFixed(2)} ر.س</span></div>`
      : `<div class="row"><span>طريقة الدفع:</span><span>${order.payment_method === 'cash' ? 'نقد' : order.payment_method}</span></div>`

    const refundLine = Number(order.refunded_amount) > 0
      ? `<div class="row" style="color:red"><span>مُسترجع:</span><span>- ${Number(order.refunded_amount).toFixed(2)} ر.س</span></div>`
      : ''

    const netTotal = Number(order.total) - (Number(order.refunded_amount) || 0)

    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"/>
    <style>
      @page{margin:10mm}body{font-family:Arial,sans-serif;font-size:13px;color:#000}
      .center{text-align:center}.bold{font-weight:bold}
      .dashed{border-top:1px dashed #000;margin:8px 0}
      .row{display:flex;justify-content:space-between;margin:4px 0}
      table{width:100%;border-collapse:collapse;margin:8px 0}
      th{border-bottom:1px solid #000;padding:4px;text-align:right}
      td{padding:4px;text-align:right}td:last-child{text-align:left}
      .total-box{border:1px solid #000;padding:8px;margin:8px 0}
      .grand{font-size:16px;font-weight:bold;display:flex;justify-content:space-between}
    </style></head><body>
    <div class="center bold" style="font-size:18px">فاتورة ضريبية مبسطة</div>
    ${order.status === 'refunded' ? '<div class="center" style="color:red;font-weight:bold">⚠ مسترجع</div>' : ''}
    ${order.status === 'partially_refunded' ? '<div class="center" style="color:orange;font-weight:bold">⚠ مسترجع جزئي</div>' : ''}
    <div class="dashed"></div>
    <div class="row"><span>رقم الطلب:</span><span class="bold">#${String(order.id).slice(-8).toUpperCase()}</span></div>
    <div class="row"><span>التاريخ:</span><span>${new Date(order.created_at).toLocaleString('ar-SA')}</span></div>
    <div class="row"><span>اللوحة:</span><span class="bold">${order.vehicles?.plate || '—'}</span></div>
    <div class="row"><span>الجوال:</span><span>${order.customers?.phone || '—'}</span></div>
    <div class="dashed"></div>
    <table><thead><tr><th>الخدمة</th><th>ك</th><th>المبلغ</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="dashed"></div>
    <div class="total-box">
      <div class="row"><span>المجموع:</span><span>${Number(order.subtotal).toFixed(2)} ر.س</span></div>
      ${order.discount > 0 ? `<div class="row"><span>خصم:</span><span>- ${Number(order.discount).toFixed(2)} ر.س</span></div>` : ''}
      <div class="row"><span>ضريبة:</span><span>${Number(order.tax).toFixed(2)} ر.س</span></div>
      ${paymentLine}${refundLine}
      <div class="dashed"></div>
      <div class="grand"><span>الصافي</span><span>${netTotal <= 0 ? '0.00' : netTotal.toFixed(2)} ر.س</span></div>
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

  async function refundFull(order: any) {
    if (!confirm(
      locale === 'ar'
        ? `استرجاع كامل للطلب #${String(order.id).slice(-8).toUpperCase()}؟`
        : `Full refund for #${String(order.id).slice(-8).toUpperCase()}?`
    )) return
    setRefunding(order.id)
    try {
      await api.orders.refund(order.id, { mode: 'full' })
      showToast(locale === 'ar' ? '✅ تم الاسترجاع الكامل' : '✅ Full refund done')
      loadOrders()
    } catch (e: any) {
      showToast(`❌ ${e?.message || 'Error'}`)
    } finally { setRefunding(null) }
  }

  function openPartialRefund(order: any) {
    const items: RefundItem[] = (order.order_items || []).map((i: any) => ({
      service_name: i.service_name,
      price: i.price,
      qty: i.qty,
      selected: false,
      refundQty: i.qty,
    }))
    setRefundModal({ order, items, mode: 'items', customAmount: '', loading: false })
  }

  async function executePartialRefund() {
    if (!refundModal) return
    const { order, items, mode, customAmount } = refundModal

    let refundAmount = 0

    if (mode === 'items') {
      const selectedItems = items.filter(i => i.selected)
      if (selectedItems.length === 0) {
        showToast(locale === 'ar' ? '⚠ اختر خدمة واحدة على الأقل' : '⚠ Select at least one item')
        return
      }
      const sub     = selectedItems.reduce((s, i) => s + i.price * i.refundQty, 0)
      const taxRate = Number(order.subtotal) > 0 ? Number(order.tax) / Number(order.subtotal) : 0
      refundAmount  = sub * (1 + taxRate)
    } else {
      refundAmount = parseFloat(customAmount)
      if (isNaN(refundAmount) || refundAmount <= 0) {
        showToast(locale === 'ar' ? '⚠ أدخل مبلغاً صحيحاً' : '⚠ Enter a valid amount')
        return
      }
      const maxRefundable = Number(order.total) - (Number(order.refunded_amount) || 0)
      if (refundAmount > maxRefundable) {
        showToast(locale === 'ar' ? `⚠ الحد الأقصى ${maxRefundable.toFixed(2)} ر.س` : `⚠ Max: ${maxRefundable.toFixed(2)}`)
        return
      }
    }

    setRefundModal(prev => prev ? { ...prev, loading: true } : null)
    try {
      await api.orders.refund(order.id, { mode: 'partial', refund_amount: refundAmount })
      showToast(locale === 'ar' ? `✅ تم استرجاع ${refundAmount.toFixed(2)} ر.س` : `✅ Refunded ${refundAmount.toFixed(2)} SAR`)
      setRefundModal(null)
      loadOrders()
    } catch (e: any) {
      showToast(`❌ ${e?.message || 'Error'}`)
    } finally {
      setRefundModal(prev => prev ? { ...prev, loading: false } : null)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const filtered = orders
    .filter(o => selBranch === 'all' || o.branch_id === selBranch)
    .filter(o =>
      String(o.id).slice(-8).toLowerCase().includes(search.toLowerCase()) ||
      (o.vehicles?.plate  || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.customers?.phone || '').includes(search)
    )

  const totalRevenue = filtered
    .filter(o => ['completed','partially_refunded'].includes(o.status))
    .reduce((s, o) => s + Number(o.total) - (Number(o.refunded_amount) || 0), 0)
  const totalOrders = filtered.filter(o => o.status === 'completed').length

  const partialRefundTotal = refundModal?.mode === 'items'
    ? (() => {
        const sel     = (refundModal.items || []).filter(i => i.selected)
        const sub     = sel.reduce((s, i) => s + i.price * i.refundQty, 0)
        const taxRate = Number(refundModal.order?.subtotal) > 0
          ? Number(refundModal.order?.tax) / Number(refundModal.order?.subtotal) : 0
        return sub * (1 + taxRate)
      })()
    : parseFloat(refundModal?.customAmount || '0') || 0

  const filterBtns = [
    { id: 'today',     label: t('filters.today') },
    { id: 'yesterday', label: t('filters.yesterday') },
    { id: 'week',      label: t('filters.week') },
    { id: 'all',       label: t('filters.all') },
  ]

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: '12px 24px',
          boxShadow: 'var(--shadow-lg)', zIndex: 9999,
          color: 'var(--color-text-primary)', fontWeight: '700', fontSize: '14px',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{t('title')}</h2>
          <p className="dashboard-page-subtitle">
            {totalOrders} {locale === 'ar' ? 'طلب مكتمل' : 'completed'} —{' '}
            {formatCurrency(totalRevenue, locale === 'ar' ? 'ar-SA' : 'en-US')}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadOrders}>
          <RefreshCw size={14} />
          {locale === 'ar' ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Branch filter */}
      {branches.length > 1 && (
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <GitBranch size={14} style={{ color: 'var(--color-text-muted)' }} />
          <button className={`table-filter-btn ${selBranch === 'all' ? 'active' : ''}`} onClick={() => setSelBranch('all')}>
            {locale === 'ar' ? 'كل الفروع' : 'All Branches'}
          </button>
          {branches.map(b => (
            <button key={b.id} className={`table-filter-btn ${selBranch === b.id ? 'active' : ''}`} onClick={() => setSelBranch(b.id)}>
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">{t('title')}</h3>
          <div className="table-actions">
            <div className="table-search">
              <Search size={14} />
              <input
                placeholder={locale === 'ar' ? 'بحث رقم / لوحة / جوال...' : 'Search #, plate, phone...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-filters">
          {filterBtns.map(f => (
            <button key={f.id} className={`table-filter-btn ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
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
                  <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                    <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                      #{String(order.id).slice(-8).toUpperCase()}
                    </td>
                    <td>{order.vehicles?.plate || '—'}</td>
                    <td>{order.customers?.phone || '—'}</td>
                    <td style={{ fontWeight: '700' }}>
                      <div>{formatCurrency(Number(order.total) - (Number(order.refunded_amount) || 0), locale === 'ar' ? 'ar-SA' : 'en-US')}</div>
                      {Number(order.refunded_amount) > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: '600' }}>
                          {locale === 'ar' ? '↩ مُسترجع:' : '↩ Refunded:'}{' '}
                          {formatCurrency(Number(order.refunded_amount), locale === 'ar' ? 'ar-SA' : 'en-US')}
                        </div>
                      )}
                    </td>
                    <td>{paymentBadge(order, locale)}</td>
                    <td>
                      <span className={`badge ${
                        order.status === 'completed'          ? 'badge-success'   :
                        order.status === 'partially_refunded' ? 'badge-warning'   :
                        order.status === 'refunded'           ? 'badge-purple'    :
                        order.status === 'cancelled'          ? 'badge-danger'    : 'badge-secondary'
                      }`}>
                        {order.status === 'partially_refunded'
                          ? (locale === 'ar' ? 'مسترجع جزئي' : 'Partial Refund')
                          : t(`statuses.${order.status}` as any)}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {formatDateTime(order.created_at, locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="action-btn" title={locale === 'ar' ? 'طباعة' : 'Print'} onClick={() => printOrder(order)}>
                          <Printer size={14} />
                        </button>
                        {['completed','partially_refunded'].includes(order.status) && (
                          <>
                            <button
                              className="action-btn"
                              style={{ color: 'var(--color-warning)' }}
                              title={locale === 'ar' ? 'استرجاع جزئي' : 'Partial Refund'}
                              onClick={() => openPartialRefund(order)}
                            >
                              <RotateCcw size={13} />
                            </button>
                            <button
                              className="action-btn danger"
                              title={locale === 'ar' ? 'استرجاع كامل' : 'Full Refund'}
                              onClick={() => refundFull(order)}
                              disabled={refunding === order.id}
                            >
                              <AlertTriangle size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {expanded === order.id && (
                    <tr key={`${order.id}-exp`}>
                      <td colSpan={8} style={{ padding: 0 }}>
                        <div style={{ padding: '16px 20px', backgroundColor: 'var(--color-bg-tertiary)', borderTop: '1px solid var(--color-border)' }}>
                          {/* Payment breakdown */}
                          {(Number(order.cash_amount) > 0 || Number(order.card_amount) > 0) && (
                            <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              {Number(order.cash_amount) > 0 && (
                                <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: 'var(--color-warning-light)', border: '1px solid var(--color-warning-border)', fontSize: '12px', fontWeight: '700', color: 'var(--color-warning)' }}>
                                  💵 {locale === 'ar' ? 'نقد' : 'Cash'}: {formatCurrency(Number(order.cash_amount), locale === 'ar' ? 'ar-SA' : 'en-US')}
                                </span>
                              )}
                              {Number(order.card_amount) > 0 && (
                                <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)', fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)' }}>
                                  💳 {locale === 'ar' ? 'بطاقة' : 'Card'}: {formatCurrency(Number(order.card_amount), locale === 'ar' ? 'ar-SA' : 'en-US')}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Items */}
                          <div style={{ marginBottom: '8px', fontWeight: '700', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            {locale === 'ar' ? 'الخدمات' : 'Services'}
                          </div>
                          {(order.order_items || []).map((item: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
                              <span style={{ color: 'var(--color-text-primary)' }}>{item.service_name} ×{item.qty}</span>
                              <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                                {formatCurrency(item.price * item.qty, locale === 'ar' ? 'ar-SA' : 'en-US')}
                              </span>
                            </div>
                          ))}

                          {/* Totals */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', marginTop: '12px', fontSize: '13px', flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              {locale === 'ar' ? 'المجموع:' : 'Sub:'} <strong>{formatCurrency(Number(order.subtotal), locale === 'ar' ? 'ar-SA' : 'en-US')}</strong>
                            </span>
                            {Number(order.discount) > 0 && (
                              <span style={{ color: 'var(--color-success)' }}>
                                {locale === 'ar' ? 'خصم:' : 'Disc:'} <strong>-{formatCurrency(Number(order.discount), locale === 'ar' ? 'ar-SA' : 'en-US')}</strong>
                              </span>
                            )}
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              {locale === 'ar' ? 'ضريبة:' : 'Tax:'} <strong>{formatCurrency(Number(order.tax), locale === 'ar' ? 'ar-SA' : 'en-US')}</strong>
                            </span>
                            {Number(order.refunded_amount) > 0 && (
                              <span style={{ color: 'var(--color-danger)' }}>
                                {locale === 'ar' ? 'مُسترجع:' : 'Refunded:'} <strong>-{formatCurrency(Number(order.refunded_amount), locale === 'ar' ? 'ar-SA' : 'en-US')}</strong>
                              </span>
                            )}
                            <span style={{ color: 'var(--color-primary)', fontWeight: '900', fontSize: '15px' }}>
                              {locale === 'ar' ? 'الصافي:' : 'Net:'}{' '}
                              {formatCurrency(Number(order.total) - (Number(order.refunded_amount) || 0), locale === 'ar' ? 'ar-SA' : 'en-US')}
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
                      <div className="table-empty-text">{locale === 'ar' ? 'لا توجد طلبات' : 'No orders found'}</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Partial Refund Modal */}
      {refundModal && (
        <div className="modal-overlay" onClick={() => setRefundModal(null)}>
          <div className="modal" style={{ maxWidth: '520px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                ↩ {locale === 'ar' ? 'استرجاع جزئي' : 'Partial Refund'}
                <span style={{ marginRight: '8px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '400' }}>
                  #{String(refundModal.order.id).slice(-8).toUpperCase()}
                </span>
              </h3>
              <button className="modal-close" onClick={() => setRefundModal(null)}><X size={18} /></button>
            </div>

            <div className="modal-body">
              {/* Mode tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button className={`table-filter-btn ${refundModal.mode === 'items' ? 'active' : ''}`} onClick={() => setRefundModal(p => p ? { ...p, mode: 'items' } : null)}>
                  {locale === 'ar' ? '📋 حسب البنود' : '📋 By Items'}
                </button>
                <button className={`table-filter-btn ${refundModal.mode === 'amount' ? 'active' : ''}`} onClick={() => setRefundModal(p => p ? { ...p, mode: 'amount' } : null)}>
                  {locale === 'ar' ? '💰 مبلغ محدد' : '💰 Custom Amount'}
                </button>
              </div>

              {/* Items mode */}
              {refundModal.mode === 'items' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {refundModal.items.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px', borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${item.selected ? 'var(--color-primary-border)' : 'var(--color-border)'}`,
                      backgroundColor: item.selected ? 'var(--color-primary-light)' : 'var(--color-bg-secondary)',
                      transition: 'var(--transition)',
                    }}>
                      <input type="checkbox" checked={item.selected}
                        onChange={e => setRefundModal(p => {
                          if (!p) return null
                          const items = [...p.items]
                          items[idx] = { ...items[idx], selected: e.target.checked }
                          return { ...p, items }
                        })}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--color-text-primary)' }}>{item.service_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {formatCurrency(item.price, locale === 'ar' ? 'ar-SA' : 'en-US')} × {item.qty}
                        </div>
                      </div>
                      {item.selected && item.qty > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setRefundModal(p => { if (!p) return null; const items = [...p.items]; items[idx] = { ...items[idx], refundQty: Math.max(1, items[idx].refundQty - 1) }; return { ...p, items } })}>−</button>
                          <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.refundQty}</span>
                          <button style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setRefundModal(p => { if (!p) return null; const items = [...p.items]; items[idx] = { ...items[idx], refundQty: Math.min(item.qty, items[idx].refundQty + 1) }; return { ...p, items } })}>+</button>
                        </div>
                      )}
                      <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--color-primary)', minWidth: '70px', textAlign: 'end' }}>
                        {formatCurrency(item.price * (item.selected ? item.refundQty : item.qty), locale === 'ar' ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Amount mode */}
              {refundModal.mode === 'amount' && (
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'مبلغ الاسترجاع (ر.س)' : 'Refund Amount (SAR)'}</label>
                  <input type="number" className="form-input" placeholder="0.00" min="0"
                    max={Number(refundModal.order.total) - (Number(refundModal.order.refunded_amount) || 0)}
                    step="0.01" value={refundModal.customAmount}
                    onChange={e => setRefundModal(p => p ? { ...p, customAmount: e.target.value } : null)}
                  />
                  <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {locale === 'ar' ? 'الحد الأقصى:' : 'Max:'}{' '}
                    {formatCurrency(Number(refundModal.order.total) - (Number(refundModal.order.refunded_amount) || 0), locale === 'ar' ? 'ar-SA' : 'en-US')}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div style={{ marginTop: '20px', padding: '14px 16px', backgroundColor: 'var(--color-danger-light)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: 'var(--color-danger)', fontSize: '14px' }}>
                  {locale === 'ar' ? 'إجمالي الاسترجاع:' : 'Total to Refund:'}
                </span>
                <span style={{ fontWeight: '900', fontSize: '18px', color: 'var(--color-danger)' }}>
                  {formatCurrency(partialRefundTotal, locale === 'ar' ? 'ar-SA' : 'en-US')}
                </span>
              </div>

              {/* Mixed payment warning */}
              {Number(refundModal.order.cash_amount) > 0 && Number(refundModal.order.card_amount) > 0 && (
                <div style={{ marginTop: '10px', padding: '10px 14px', fontSize: '12px', backgroundColor: 'var(--color-warning-light)', border: '1px solid var(--color-warning-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-warning)' }}>
                  ⚠ {locale === 'ar'
                    ? `دفع مختلط: نقد ${formatCurrency(Number(refundModal.order.cash_amount), 'ar-SA')} + بطاقة ${formatCurrency(Number(refundModal.order.card_amount), 'ar-SA')} — عالج كل طريقة يدوياً`
                    : `Mixed: Cash ${formatCurrency(Number(refundModal.order.cash_amount), 'en-US')} + Card ${formatCurrency(Number(refundModal.order.card_amount), 'en-US')} — handle each method manually`}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRefundModal(null)}>
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button className="btn btn-danger" onClick={executePartialRefund} disabled={refundModal.loading || partialRefundTotal <= 0}>
                {refundModal.loading
                  ? (locale === 'ar' ? 'جاري...' : 'Processing...')
                  : `↩ ${locale === 'ar' ? 'تأكيد الاسترجاع' : 'Confirm Refund'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}