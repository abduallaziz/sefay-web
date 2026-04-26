'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { Service } from '@/types'
import { Search, RefreshCw, Trash2, ToggleLeft, ToggleRight, Plus, X, Save, Upload } from 'lucide-react'
import '@/styles/modals.css'
import '@/styles/forms.css'

export default function ServicesPage() {
  const t = useTranslations('services')
  const locale = useLocale()

  const [services,  setServices]  = useState<Service[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected,  setSelected]  = useState<Service | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)

  const [name,         setName]         = useState('')
  const [price,        setPrice]        = useState('')
  const [cashierPrice, setCashierPrice] = useState(false)
  const [category,     setCategory]     = useState('عام')
  const [icon,         setIcon]         = useState('🚗')
  const [color,        setColor]        = useState('#00d4ff')
  const [imageUrl,     setImageUrl]     = useState('')

  const ICONS  = ['🚗','🚙','🏎️','🚕','🚐','🚌','🛻','🚑','🧼','💦','✨','🪣','🧽','🔧','⚙️','💎']
  const COLORS = ['#00d4ff','#00e5a0','#a78bfa','#f0c040','#ff5566','#00b4d8','#4a90d9','#ff9500']
  const CATS   = ['عام','غسيل خارجي','غسيل داخلي','تلميع','صيانة','إضافية']

  useEffect(() => { loadServices() }, [])

  async function loadServices() {
    setLoading(true)
    try {
      const res = await api.services.getAll()
      setServices(res.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  function openNew() {
    setSelected(null)
    setName(''); setPrice(''); setCashierPrice(false)
    setCategory('عام'); setIcon('🚗'); setColor('#00d4ff'); setImageUrl('')
    setShowModal(true)
  }

  function openEdit(svc: Service) {
    setSelected(svc)
    setName(svc.name)
    setPrice(String(svc.price))
    setCashierPrice((svc as any).cashier_price || false)
    setCategory(svc.category || 'عام')
    setIcon(svc.icon || '🚗')
    setColor(svc.color || '#00d4ff')
    setImageUrl(svc.image_url || '')
    setShowModal(true)
  }

  async function uploadImage(file: File) {
    setUploading(true)
    try {
      const session = getSession()
      if (!session) return
      const path = `services/${session.tenant_id}/${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('washcloud')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('washcloud').getPublicUrl(path)
      setImageUrl(data.publicUrl)
    } catch (e) { console.error(e) }
    finally { setUploading(false) }
  }

  async function saveService() {
    if (!name.trim()) return
    if (!cashierPrice && (price === '' || isNaN(Number(price)) || Number(price) < 0)) return
    setSaving(true)
    try {
      const body: any = {
        name: name.trim(),
        price: cashierPrice ? 0 : Number(price),
        category, icon, color,
        image_url: imageUrl || null,
        cashier_price: cashierPrice,
      }
      if (selected) {
        await api.services.update(selected.id, body)
      } else {
        await api.services.create(body)
      }
      setShowModal(false)
      loadServices()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function toggleActive(svc: Service) {
    try {
      await api.services.update(svc.id, { active: !svc.active })
      loadServices()
    } catch (e) { console.error(e) }
  }

  async function deleteService(svc: Service) {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من الحذف النهائي؟' : 'Are you sure?')) return
    try {
      await api.services.hardDelete(svc.id)
      loadServices()
    } catch (e) { console.error(e) }
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
          <button className="btn btn-primary btn-sm" onClick={openNew}>
            <Plus size={14} />
            {t('addService')}
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
                  ? (locale === 'ar' ? '✏️ تعديل خدمة' : '✏️ Edit Service')
                  : (locale === 'ar' ? '➕ إضافة خدمة' : '➕ Add Service')}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={14} />
              </button>
            </div>

            <div className="modal-body">

              {/* صورة الخدمة */}
              <div className="form-group">
                <label className="form-label">{t('image')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {imageUrl ? (
                    <img src={imageUrl} alt="" style={{
                      width: '80px', height: '80px', borderRadius: '8px',
                      objectFit: 'cover', border: '1px solid var(--color-border)',
                    }} />
                  ) : (
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '8px',
                      backgroundColor: color + '20', border: `1px solid ${color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                    }}>{icon}</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                      <Upload size={14} />
                      {uploading
                        ? (locale === 'ar' ? 'جاري الرفع...' : 'Uploading...')
                        : (locale === 'ar' ? 'اختر صورة' : 'Choose image')}
                      <input
                        type="file" accept="image/*"
                        style={{ display: 'none' }}
                        disabled={uploading}
                        onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])}
                      />
                    </label>
                    {imageUrl && (
                      <button className="btn btn-danger btn-sm" onClick={() => setImageUrl('')}>
                        {locale === 'ar' ? '🗑️ حذف الصورة' : '🗑️ Remove'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* اسم الخدمة */}
              <div className="form-group">
                <label className="form-label">{t('serviceName')} <span>*</span></label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)}
                  placeholder={locale === 'ar' ? 'اسم الخدمة' : 'Service name'} />
              </div>

              {/* السعر */}
              <div className="form-group">
                <label className="form-label">{t('price')}</label>
                <div className="form-switch" onClick={() => setCashierPrice(!cashierPrice)} style={{ marginBottom: '8px' }}>
                  <div>
                    <div className="form-switch-label">
                      {locale === 'ar' ? 'الكاشير يحدد السعر' : 'Cashier sets price'}
                    </div>
                    <div className="form-switch-desc">
                      {locale === 'ar' ? 'يطلب من الكاشير إدخال السعر عند البيع' : 'Cashier will be prompted to enter price'}
                    </div>
                  </div>
                  <div style={{
                    width: '40px', height: '22px', borderRadius: '11px',
                    backgroundColor: cashierPrice ? 'var(--color-primary)' : 'var(--color-border)',
                    position: 'relative', transition: 'var(--transition)',
                  }}>
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      backgroundColor: '#fff', position: 'absolute',
                      top: '3px', transition: 'var(--transition)',
                      left: cashierPrice ? '21px' : '3px',
                    }} />
                  </div>
                </div>
                {!cashierPrice && (
                  <input className="form-input" type="number" min="0" value={price}
                    onChange={e => setPrice(e.target.value)} placeholder="0" />
                )}
                {cashierPrice && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-warning-light)',
                    border: '1px solid var(--color-warning-border)',
                    fontSize: '12px', color: 'var(--color-warning)',
                  }}>
                    ⌨️ {locale === 'ar' ? 'سيطلب من الكاشير إدخال السعر عند البيع' : 'Cashier will enter price at time of sale'}
                  </div>
                )}
              </div>

              {/* الفئة */}
              <div className="form-group">
                <label className="form-label">{t('category')}</label>
                <select className="form-input form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* الأيقونة */}
              <div className="form-group">
                <label className="form-label">{t('icon')}</label>
                <div className="icons-grid">
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setIcon(ic)}
                      className={`icon-option ${icon === ic ? 'active' : ''}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* اللون */}
              <div className="form-group">
                <label className="form-label">{t('color')}</label>
                <div className="colors-row">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)}
                      className={`color-option ${color === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button className="btn btn-primary" onClick={saveService} disabled={saving || uploading}>
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
                    <div className="svc-name-cell">
                      {svc.image_url ? (
                        <img src={svc.image_url} className="svc-img" alt="" />
                      ) : (
                        <div className="svc-icon" style={{
                          backgroundColor: (svc.color || '#00d4ff') + '20',
                          border: `1px solid ${svc.color || '#00d4ff'}40`,
                        }}>
                          {svc.icon || '🚗'}
                        </div>
                      )}
                      <div>
                        <div className="svc-label">{svc.name}</div>
                        {(svc as any).cashier_price && (
                          <div style={{ fontSize: '11px', color: 'var(--color-warning)' }}>
                            ⌨️ {locale === 'ar' ? 'الكاشير يحدد السعر' : 'Cashier price'}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{svc.category || '—'}</td>
                  <td style={{ fontWeight: '700', color: svc.color || 'var(--color-primary)' }}>
                    {(svc as any).cashier_price
                      ? <span style={{ color: 'var(--color-warning)', fontSize: '12px' }}>⌨️ {locale === 'ar' ? 'يحدده الكاشير' : 'Cashier sets'}</span>
                      : formatCurrency(svc.price, locale === 'ar' ? 'ar-SA' : 'en-US')}
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
                      {svc.active ? (locale === 'ar' ? 'مفعّل' : 'Active') : (locale === 'ar' ? 'معطّل' : 'Inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button className="action-btn" onClick={() => openEdit(svc)}
                        title={locale === 'ar' ? 'تعديل' : 'Edit'}>✏️</button>
                      <button className={`action-btn ${svc.active ? '' : 'success'}`}
                        onClick={() => toggleActive(svc)}>
                        {svc.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                      <button className="action-btn danger" onClick={() => deleteService(svc)}>
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