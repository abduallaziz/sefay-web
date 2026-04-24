'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Order } from '@/types'
import { Search, RefreshCw, Printer } from 'lucide-react'

export default function OrdersPage() {
  const t = useTranslations('orders')
  const locale = useLocale()

  const [orders,   setOrders]   = useState<Order[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('today')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { loadOrders() }, [filter])

  async function loadOrders() {
    setLoading(true)
    try {
      const date = filter === 'today' ? new Date().toISOString().split('T')[0] : undefined
      const res = await api.orders.getAll(date)
      setOrders(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = orders.filter(o =>
    String(o.id).slice(-8).toLowerCase().includes(search.toLowerCase()) ||
    o.vehicles?.plate?.toLowerCase().includes(search.toLowerCase()) ||
    o.customers?.phone?.includes(search)
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
                    <td>{order.vehicles?.plate || '—'}</td>
                    <td>{order.customers?.phone || '—'}</td>
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
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="action-btn" title={locale === 'ar' ? 'طباعة' : 'Print'}>
                          <Printer size={14} />
                        </button>
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
                          {(order.order_items || []).map((item, i) => (
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