'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Coupon } from '@/types'
import { Search, RefreshCw } from 'lucide-react'

export default function CouponsPage() {
  const t = useTranslations('coupons')
  const locale = useLocale()

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => { loadCoupons() }, [])

  async function loadCoupons() {
    setLoading(true)
    try {
      const res = await api.coupons.getAll()
      setCoupons(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = coupons.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{t('title')}</h2>
          <p className="dashboard-page-subtitle">
            {coupons.length} {locale === 'ar' ? 'كوبون' : 'coupons'}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadCoupons}>
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
                <th>{t('code')}</th>
                <th>{t('type')}</th>
                <th>{t('value')}</th>
                <th>{t('minOrder')}</th>
                <th>{t('usedCount')}</th>
                <th>{t('expiresAt')}</th>
                <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: '900', color: 'var(--color-primary)', letterSpacing: '2px' }}>
                    {c.code}
                  </td>
                  <td>
                    <span className={`badge ${c.type === 'percent' ? 'badge-purple' : 'badge-warning'}`}>
                      {c.type === 'percent'
                        ? (locale === 'ar' ? 'نسبة %' : 'Percent %')
                        : (locale === 'ar' ? 'مبلغ ثابت' : 'Fixed')}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--color-success)' }}>
                    {c.type === 'percent'
                      ? `${c.value}%`
                      : formatCurrency(c.value, locale === 'ar' ? 'ar-SA' : 'en-US')}
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>
                    {formatCurrency(c.min_order, locale === 'ar' ? 'ar-SA' : 'en-US')}
                  </td>
                  <td>
                    <span className="badge badge-muted">
                      {c.used_count} / {c.max_uses || '∞'}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {c.expires_at ? formatDate(c.expires_at, locale === 'ar' ? 'ar-SA' : 'en-US') : '—'}
                  </td>
                  <td>
                    <span className={`badge ${c.active ? 'badge-success' : 'badge-danger'}`}>
                      {c.active
                        ? (locale === 'ar' ? 'مفعّل' : 'Active')
                        : (locale === 'ar' ? 'معطّل' : 'Inactive')}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="table-empty">
                      <div className="table-empty-icon">🎟️</div>
                      <div className="table-empty-text">
                        {locale === 'ar' ? 'لا توجد كوبونات' : 'No coupons found'}
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