'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { Tenant } from '@/types'
import { Save } from 'lucide-react'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const locale = useLocale()

  const [tenant,  setTenant]  = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')

  const [name,      setName]      = useState('')
  const [phone,     setPhone]     = useState('')
  const [city,      setCity]      = useState('')
  const [taxRate,   setTaxRate]   = useState('15')
  const [taxNumber, setTaxNumber] = useState('')
  const [website,   setWebsite]   = useState('')

  useEffect(() => { loadTenant() }, [])

  async function loadTenant() {
    setLoading(true)
    try {
      const session = getSession()
      if (!session) return
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', session.tenant_id)
        .single()
      if (data) {
        setTenant(data)
        setName(data.name || '')
        setPhone(data.phone || '')
        setCity(data.city || '')
        setTaxRate(data.tax_rate !== null && data.tax_rate !== undefined ? String(data.tax_rate) : '15')
        setTaxNumber(data.tax_number || '')
        setWebsite(data.website || '')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function saveTenant() {
    setSaving(true)
    try {
      const session = getSession()
      if (!session) return
      await supabase
        .from('tenants')
        .update({
          name,
          phone,
          city,
          tax_rate: taxRate === '' ? 0 : Number(taxRate),
          tax_number: taxNumber,
          website,
        })
        .eq('id', session.tenant_id)
      showToast(locale === 'ar' ? '✅ تم حفظ الإعدادات' : '✅ Settings saved')
    } catch (e) {
      console.error(e)
      showToast(locale === 'ar' ? '❌ حدث خطأ' : '❌ Error occurred')
    } finally {
      setSaving(false)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
      </div>
    )
  }

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px',
          backgroundColor: 'var(--color-primary)', color: '#000',
          padding: '10px 20px', borderRadius: 'var(--radius-md)',
          fontWeight: '700', fontSize: '13px', zIndex: 1000,
        }}>
          {toast}
        </div>
      )}

      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{t('title')}</h2>
          <p className="dashboard-page-subtitle">{tenant?.name || ''}</p>
        </div>
        <button className="btn btn-primary" onClick={saveTenant} disabled={saving}>
          <Save size={14} />
          {saving ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t('save')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>

        {/* معلومات الشركة */}
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <h3 className="form-section-title">
            {locale === 'ar' ? '🏢 معلومات الشركة' : '🏢 Company Info'}
          </h3>
          <div className="form-group">
            <label className="form-label">{t('shopName')} <span>*</span></label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder={locale === 'ar' ? 'اسم الشركة' : 'Company name'} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('phone')}</label>
            <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05XXXXXXXX" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('city')}</label>
            <input className="form-input" value={city} onChange={e => setCity(e.target.value)} placeholder={locale === 'ar' ? 'الرياض' : 'Riyadh'} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('website')}</label>
            <input className="form-input" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" />
          </div>
        </div>

        {/* إعدادات الضريبة */}
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <h3 className="form-section-title">
            {locale === 'ar' ? '💰 إعدادات الضريبة' : '💰 Tax Settings'}
          </h3>
          <div className="form-group">
            <label className="form-label">{t('taxRate')} (%)</label>
            <div className="form-input-group">
              <input
                className="form-input"
                type="number"
                min="0"
                max="100"
                value={taxRate}
                onChange={e => setTaxRate(e.target.value)}
                placeholder="15"
              />
              <div className="form-input-group-addon">%</div>
            </div>
            <span className="form-hint">
              {locale === 'ar' ? 'أدخل 0 لتعطيل الضريبة' : 'Enter 0 to disable tax'}
            </span>
          </div>
          <div className="form-group">
            <label className="form-label">{t('taxNumber')}</label>
            <input className="form-input" value={taxNumber} onChange={e => setTaxNumber(e.target.value)} placeholder="3XXXXXXXXXXXXXXXX" />
          </div>
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              {locale === 'ar' ? 'الخطة الحالية' : 'Current Plan'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--color-primary)' }}>
              {tenant?.plan || 'Basic'}
            </div>
            {tenant?.sub_end && (
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {locale === 'ar' ? 'تنتهي في:' : 'Expires:'} {tenant.sub_end}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}