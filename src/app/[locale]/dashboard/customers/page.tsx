'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Search, RefreshCw } from 'lucide-react'

export default function CustomersPage() {
  const t = useTranslations('customers')
  const locale = useLocale()

  const [customers, setCustomers] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')

  useEffect(() => { loadCustomers() }, [])

  async function loadCustomers() {
    setLoading(true)
    try {
      const res = await api.customers.getAll()
      const raw = res.data || []
      // إزالة المكررين بناءً على customer.id
      const seen = new Set()
      const unique = raw.filter((item: any) => {
        if (seen.has(item.customer?.id)) return false
        seen.add(item.customer?.id)
        return true
      })
      setCustomers(unique)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = customers.filter(c =>
    c.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.customer?.phone?.includes(search) ||
    c.plate?.includes(search)
  )

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{t('title')}</h2>
          <p className="dashboard-page-subtitle">
            {customers.length} {locale === 'ar' ? 'عميل' : 'customers'}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadCustomers}>
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
                id="customer-search"
                name="customer-search"
                placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('customerName')}</th>
                <th>{t('phone')}</th>
                <th>{locale === 'ar' ? 'اللوحة' : 'Plate'}</th>
                <th>{locale === 'ar' ? 'نوع السيارة' : 'Car Type'}</th>
                <th>{t('loyaltyPoints')}</th>
                <th>{t('joinDate')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.customer?.id || i}>
                  <td style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                    {c.customer?.name || '—'}
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>
                    {c.customer?.phone || '—'}
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                    {c.plate || '—'}
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>
                    {c.vehicle?.type || '—'}
                  </td>
                  <td>
                    <span className="badge badge-warning">
                      ⭐ {c.customer?.loyalty_points || 0}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {c.customer?.created_at
                      ? formatDate(c.customer.created_at, locale === 'ar' ? 'ar-SA' : 'en-US')
                      : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty">
                      <div className="table-empty-icon">👥</div>
                      <div className="table-empty-text">
                        {locale === 'ar' ? 'لا يوجد عملاء' : 'No customers found'}
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