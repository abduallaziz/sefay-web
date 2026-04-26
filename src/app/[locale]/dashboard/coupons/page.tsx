'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Coupon } from '@/types'
import { Search, RefreshCw, Plus, X, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import '@/styles/modals.css'
import '@/styles/forms.css'

export default function CouponsPage() {
  const t = useTranslations('coupons')
  const locale = useLocale()

  const [coupons,   setCoupons]   = useState<Coupon[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected,  setSelected]  = useState<Coupon | null>(null)
  const [saving,    setSaving]    = useState(false)

  const [code,      setCode]      = useState('')
  const [type,      setType]      = useState<'percent' | 'fixed'>('percent')
  const [value,     setValue]     = useState('')
  const [minOrder,  setMinOrder]  = useState('0')
  const [maxUses,   setMaxUses]   = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  useEffect(() => { loadCoupons() }, [])

  async function loadCoupons() {
    setLoading(true)
    try {
      const res = await api.coupons.getAll()
      setCoupons(res.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  function openNew() {
    setSelected(null)
    setCode(''); setType('percent'); setValue('')
    setMinOrder('0'); setMaxUses(''); setExpiresAt('')
    setShowModal(true)
  }

  function openEdit(c: Coupon) {
    setSelected(c)
    setCode(c.code); setType(c.type as any); setValue(String(c.value))
    setMinOrder(String(c.min_order || 0))
    setMaxUses(c.max_uses ? String(c.max_uses) : '')
    setExpiresAt(c.expires_at ? c.expires_at.split('T')[0] : '')
    setShowModal(true)
  }

  async function saveCoupon() {
    if (!code.trim() || !value) return
    setSaving(true)
    try {
      const body: any = {
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        min_order: Number(minOrder) || 0,
        max_uses: maxUses ? Number(maxUses) : null,
        expires_at: expiresAt || null,
        active: true,
      }
      if (selected) {
        await api.coupons.update(selected.id, body)
      } else {
        await api.coupons.create(body)
      }
      setShowModal(false)
      loadCoupons()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function toggleCoupon(c: Coupon) {
    try {
      await api.coupons.toggle(c.id, !c.active)
      loadCoupons()
    } catch (e) { console.error(e) }
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadCoupons}>
            <RefreshCw size={14} />
            {locale === 'ar' ? 'تحديث' : 'Refresh'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={openNew}>
            <Plus size={14} />
            {locale === 'ar' ? 'إضافة كوبون' : 'Add Coupon'}
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h3 className="modal-title">
                {selected
                  ? (locale === 'ar' ? '✏️ تعديل كوبون' : '✏️ Edit Coupon')
                  : (locale === 'ar' ? '➕ إضافة كوبون' : '➕ Add Coupon')}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={14} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('code')} <span>*</span></label>
                <input
                  id="coupon-code"
                  name="coupon-code"
                  className="form-input"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="SUMMER20"
                  style={{ letterSpacing: '2px', fontWeight: '700' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('type')}</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[
                    { id: 'percent', labelAr: '% نسبة مئوية', labelEn: '% Percentage' },
                    { id: 'fixed',   labelAr: 'ر.س مبلغ ثابت', labelEn: 'SAR Fixed Amount' },
                  ].map(tp => (
                    <button key={tp.id}
                      onClick={() => setType(tp.id as any)}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${type === tp.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        backgroundColor: type === tp.id ? 'var(--color-primary-light)' : 'var(--color-bg-tertiary)',
                        color: type === tp.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                      }}>
                      {locale === 'ar' ? tp.labelAr : tp.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    {t('value')} {type === 'percent' ? '(%)' : '(ر.س)'} <span>*</span>
                  </label>
                  <input
                    id="coupon-value"
                    name="coupon-value"
                    className="form-input"
                    type="number" min="0"
                    max={type === 'percent' ? '100' : undefined}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={type === 'percent' ? '20' : '50'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('minOrder')} (ر.س)</label>
                  <input
                    id="coupon-min"
                    name="coupon-min"
                    className="form-input"
                    type="number" min="0"
                    value={minOrder}
                    onChange={e => setMinOrder(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('maxUses')}</label>
                  <input
                    id="coupon-max"
                    name="coupon-max"
                    className="form-input"
                    type="number" min="1"
                    value={maxUses}
                    onChange={e => setMaxUses(e.target.value)}
                    placeholder={locale === 'ar' ? 'غير محدود' : 'Unlimited'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('expiresAt')}</label>
                  <input
                    id="coupon-expires"
                    name="coupon-expires"
                    className="form-input"
                    type="date"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button className="btn btn-primary" onClick={saveCoupon} disabled={saving}>
                <Save size={14} />
                {saving
                  ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                  : (locale === 'ar' ? 'حفظ' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">{t('title')}</h3>
          <div className="table-actions">
            <div className="table-search">
              <Search size={14} />
              <input
                id="coupon-search"
                name="coupon-search"
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
                <th>{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
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
                    {c.type === 'percent' ? `${c.value}%` : formatCurrency(c.value, locale === 'ar' ? 'ar-SA' : 'en-US')}
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
                      {c.active ? (locale === 'ar' ? 'مفعّل' : 'Active') : (locale === 'ar' ? 'معطّل' : 'Inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button className="action-btn" onClick={() => openEdit(c)}
                        title={locale === 'ar' ? 'تعديل' : 'Edit'}>✏️</button>
                      <button
                        className={`action-btn ${c.active ? '' : 'success'}`}
                        onClick={() => toggleCoupon(c)}
                        title={c.active ? (locale === 'ar' ? 'تعطيل' : 'Disable') : (locale === 'ar' ? 'تفعيل' : 'Enable')}
                      >
                        {c.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
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