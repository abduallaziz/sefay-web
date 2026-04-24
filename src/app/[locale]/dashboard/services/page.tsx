'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Service } from '@/types'
import { Search, Plus, RefreshCw, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

export default function ServicesPage() {
  const t = useTranslations('services')
  const locale = useLocale()

  const [services, setServices] = useState<Service[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => { loadServices() }, [])

  async function loadServices() {
    setLoading(true)
    try {
      const res = await api.services.getAll()
      setServices(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(svc: Service) {
    try {
      await api.services.update(svc.id, { active: !svc.active })
      loadServices()
    } catch (e) {
      console.error(e)
    }
  }

  async function deleteService(svc: Service) {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من الحذف النهائي؟' : 'Are you sure you want to permanently delete?')) return
    try {
      await api.services.hardDelete(svc.id)
      loadServices()
    } catch (e) {
      console.error(e)
    }
  }

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{t('title')}</h2>
          <p className="dashboard-page-subtitle">
            {services.length} {locale === 'ar' ? 'خدمة' : 'services'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadServices}>
            <RefreshCw size={14} />
            {locale === 'ar' ? 'تحديث' : 'Refresh'}
          </button>
        </div>
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
                <th>{t('serviceName')}</th>
                <th>{t('category')}</th>
                <th>{t('price')}</th>
                <th>{t('type')}</th>
                <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                <th>{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(svc => (
                <tr key={svc.id} style={{ opacity: svc.active ? 1 : 0.5 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {svc.image_url ? (
                        <img src={svc.image_url} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '8px',
                          backgroundColor: (svc.color || '#00d4ff') + '20',
                          border: `1px solid ${svc.color || '#00d4ff'}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '18px',
                        }}>
                          {svc.icon || '🚗'}
                        </div>
                      )}
                      <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{svc.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{svc.category || '—'}</td>
                  <td style={{ fontWeight: '700', color: svc.color || 'var(--color-primary)' }}>
                    {formatCurrency(svc.price, locale === 'ar' ? 'ar-SA' : 'en-US')}
                  </td>
                  <td>
                    <span className={`badge ${svc.type === 'bundle' ? 'badge-purple' : 'badge-primary'}`}>
                      {svc.type === 'bundle'
                        ? (locale === 'ar' ? 'باقة' : 'Bundle')
                        : (locale === 'ar' ? 'عادية' : 'Single')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${svc.active ? 'badge-success' : 'badge-danger'}`}>
                      {svc.active
                        ? (locale === 'ar' ? 'مفعّل' : 'Active')
                        : (locale === 'ar' ? 'معطّل' : 'Inactive')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className={`action-btn ${svc.active ? '' : 'success'}`}
                        onClick={() => toggleActive(svc)}
                        title={svc.active ? (locale === 'ar' ? 'تعطيل' : 'Disable') : (locale === 'ar' ? 'تفعيل' : 'Enable')}
                      >
                        {svc.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                      <button
                        className="action-btn danger"
                        onClick={() => deleteService(svc)}
                        title={locale === 'ar' ? 'حذف نهائي' : 'Delete'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty">
                      <div className="table-empty-icon">⚙️</div>
                      <div className="table-empty-text">
                        {locale === 'ar' ? 'لا توجد خدمات' : 'No services found'}
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