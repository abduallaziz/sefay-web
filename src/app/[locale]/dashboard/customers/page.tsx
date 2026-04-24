'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Customer } from '@/types'
import { Search, RefreshCw } from 'lucide-react'

export default function CustomersPage() {
  const t = useTranslations('customers')
  const locale = useLocale()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')

  useEffect(() => { loadCustomers() }, [])

  async function loadCustomers() {
    setLoading(true)
    try {
      const res = await api.customers.getAll()
      setCustomers(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
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
                <th>{t('loyaltyPoints')}</th>
                <th>{t('joinDate')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                    {c.name || '—'}
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{c.phone}</td>
                  <td>
                    <span className="badge badge-warning">
                      ⭐ {c.loyalty_points}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {formatDate(c.created_at, locale === 'ar' ? 'ar-SA' : 'en-US')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4}>
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