'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { Item } from '@/types'
import { Search, RefreshCw, Trash2, ToggleLeft, ToggleRight, Plus, X, Save, Upload } from 'lucide-react'
import '@/styles/modals.css'
import '@/styles/forms.css'
import VariantsModal from './VariantsModal'

interface BundleItem {
  service_id: string
  service_name: string
  price: number
  custom_price: boolean
}

export default function ItemsPage() {
  const t = useTranslations('items')
  const locale = useLocale()

  const [services,      setServices]      = useState<Item[]>([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [showModal,     setShowModal]     = useState(false)
  const [selected,      setSelected]      = useState<Item | null>(null)
  const [saving,        setSaving]        = useState(false)
  const [uploading,     setUploading]     = useState(false)
  const [variantsItem,  setVariantsItem]  = useState<Item | null>(null)
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string; icon: string; color: string }[]>([])

  const [serviceType,  setServiceType]  = useState<'single' | 'bundle'>('single')
  const [bundleItems,  setBundleItems]  = useState<BundleItem[]>([])
  const [bundleSearch, setBundleSearch] = useState('')

  const [name,         setName]         = useState('')
  const [price,        setPrice]        = useState('')
  const [cashierPrice, setCashierPrice] = useState(false)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [categoryId,   setCategoryId]   = useState('')
  const [category,     setCategory]     = useState('')
  const [icon,         setIcon]         = useState('🚗')
  const [color,        setColor]        = useState('#00d4ff')
  const [imageUrl,     setImageUrl]     = useState('')

  const ICONS  = ['🚗','🚙','🏎️','🚕','🚐','🚌','🛻','🚑','🧼','💦','✨','🪣','🧽','🔧','⚙️','💎']
  const COLORS = ['#00d4ff','#00e5a0','#a78bfa','#f0c040','#ff5566','#00b4d8','#4a90d9','#ff9500']

  useEffect(() => { loadServices(); loadCategories() }, [])

  async function loadServices() {
    setLoading(true)
    try {
      const res = await api.items.getAll()
      setServices(res.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function loadCategories() {
    try {
      const session = getSession()
      if (!session) return
      const { data } = await supabase
        .from('categories')
        .select('id, name, icon, color')
        .eq('tenant_id', session.tenant_id)
        .order('sort_order', { ascending: true })
      setCategoriesList(data || [])
    } catch (e) { console.error(e) }
  }

  function openNew() {
    setSelected(null)
    setName(''); setPrice(''); setCashierPrice(false)
    setServiceType('single'); setBundleItems([])
    setCategory(''); setCategoryId('')
    setIcon('🚗'); setColor('#00d4ff'); setImageUrl('')
    setShowModal(true)
  }

  function openEdit(svc: Item) {
    setSelected(svc)
    setName(svc.name)
    setPrice(String(svc.price))
    setCashierPrice((svc as any).cashier_price || false)
    setServiceType((svc as any).type === 'bundle' ? 'bundle' : 'single')
    setBundleItems((svc as any).bundle_items || [])
    setCategory(svc.category || '')
    setCategoryId((svc as any).category_id || '')
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

  function addBundleItem(svc: Item) {
    if (bundleItems.find(i => i.service_id === svc.id)) return
    setBundleItems([...bundleItems, {
      service_id: svc.id,
      service_name: svc.name,
      price: svc.price,
      custom_price: false,
    }])
  }

  function removeBundleItem(id: string) {
    setBundleItems(bundleItems.filter(i => i.service_id !== id))
  }

  function toggleBundleItemCustomPrice(id: string) {
    setBundleItems(bundleItems.map(i =>
      i.service_id === id ? { ...i, custom_price: !i.custom_price } : i
    ))
  }

  function updateBundleItemPrice(id: string, val: string) {
    setBundleItems(bundleItems.map(i =>
      i.service_id === id ? { ...i, price: Number(val) || 0 } : i
    ))
  }

  async function saveService() {
    if (!name.trim()) return
    setSaving(true)
    try {
      let finalPrice = 0
      if (serviceType === 'bundle') {
        finalPrice = bundleItems.reduce((s, i) => s + (i.custom_price ? 0 : i.price), 0)
      } else {
        if (!cashierPrice && (price === '' || isNaN(Number(price)) || Number(price) < 0)) {
          setSaving(false); return
        }
        finalPrice = cashierPrice ? 0 : Number(price)
      }

      const body: any = {
        name: name.trim(),
        price: finalPrice,
        category: categoriesList.find(c => c.id === categoryId)?.name || category,
        category_id: categoryId || null,
        icon, color,
        image_url: imageUrl || null,
        cashier_price: serviceType === 'single' ? cashierPrice : false,
        type: serviceType,
        bundle_items: serviceType === 'bundle' ? bundleItems : [],
      }

      if (selected) {
        await api.items.update(selected.id, body)
      } else {
        await api.items.create(body)
      }
      setShowModal(false)
      loadServices()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function toggleActive(svc: Item) {
    try {
      await api.items.update(svc.id, { active: !svc.active })
      loadServices()
    } catch (e) { console.error(e) }
  }

  async function deleteService(svc: Item) {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من الحذف النهائي؟' : 'Are you sure?')) return
    try {
      await api.items.hardDelete(svc.id)
      loadServices()
    } catch (e) { console.error(e) }
  }

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  )

  const singleServices = services.filter(s => (s as any).type !== 'bundle' && s.active)
  const filteredBundle = singleServices.filter(s =>
    s.name.toLowerCase().includes(bundleSearch.toLowerCase()) &&
    !bundleItems.find(b => b.service_id === s.id)
  )

  const bundleTotal = bundleItems.reduce((s, i) => s + (i.custom_price ? 0 : i.price), 0)
  const hasCustom   = bundleItems.some(i => i.custom_price)

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{t('title')}</h2>
          <p className="dashboard-page-subtitle">
            {services.length} {locale === 'ar' ? 'منتج' : 'items'}
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
          <div className="modal modal-lg">
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

              {/* نوع الخدمة */}
              <div className="form-group">
                <label className="form-label">{t('type')}</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[
                    { id: 'single', labelAr: '🔧 خدمة عادية', labelEn: '🔧 Single Service' },
                    { id: 'bundle', labelAr: '📦 خدمات مجمّعة', labelEn: '📦 Bundle' },
                  ].map(tp => (
                    <button key={tp.id}
                      onClick={() => setServiceType(tp.id as any)}
                      style={{
                        flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${serviceType === tp.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        backgroundColor: serviceType === tp.id ? 'var(--color-primary-light)' : 'var(--color-bg-tertiary)',
                        color: serviceType === tp.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                      }}>
                      {locale === 'ar' ? tp.labelAr : tp.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* صورة + اسم */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div>
                  {imageUrl ? (
                    <img src={imageUrl} alt="" style={{
                      width: '72px', height: '72px', borderRadius: '8px',
                      objectFit: 'cover', border: '1px solid var(--color-border)',
                    }} />
                  ) : (
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '8px',
                      backgroundColor: color + '20', border: `1px solid ${color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                    }}>{icon}</div>
                  )}
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', marginTop: '6px', display: 'flex', gap: '4px' }}>
                    <Upload size={12} />
                    {uploading ? '...' : (locale === 'ar' ? 'صورة' : 'Image')}
                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading}
                      onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                  </label>
                  {imageUrl && (
                    <button className="btn btn-danger btn-sm" onClick={() => setImageUrl('')}
                      style={{ marginTop: '4px', width: '100%' }}>
                      {locale === 'ar' ? 'حذف' : 'Remove'}
                    </button>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="form-group">
                    <label className="form-label">{t('serviceName')} <span>*</span></label>
                    <input className="form-input" value={name} onChange={e => setName(e.target.value)}
                      placeholder={locale === 'ar' ? 'اسم الخدمة' : 'Service name'} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('category')}</label>
                    {categoriesList.length > 0 ? (
  <div style={{ position: 'relative' }}>
    <div
      onClick={() => setCategoryDropdownOpen(v => !v)}
      className="form-input"
      style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
      {categoryId ? (() => {
        const cat = categoriesList.find(c => c.id === categoryId)
        return cat ? (
          <>
            <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {cat.icon?.startsWith('http')
                ? <img src={cat.icon} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '16px' }}>{cat.icon}</span>}
            </div>
            <span style={{ fontSize: '13px' }}>{cat.name}</span>
          </>
        ) : null
      })() : (
        <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          {locale === 'ar' ? '— بدون فئة —' : '— No category —'}
        </span>
      )}
    </div>

    {categoryDropdownOpen && (
      <div style={{ position: 'absolute', top: '100%', insetInlineStart: 0, insetInlineEnd: 0, zIndex: 100, backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)', maxHeight: '200px', overflowY: 'auto' }}>
        <div
          onClick={() => { setCategoryId(''); setCategoryDropdownOpen(false) }}
          style={{ padding: '10px 12px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          {locale === 'ar' ? '— بدون فئة —' : '— No category —'}
        </div>
        {categoriesList.map(c => (
          <div key={c.id}
            onClick={() => { setCategoryId(c.id); setCategoryDropdownOpen(false) }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: c.color || 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {c.icon?.startsWith('http')
                ? <img src={c.icon} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '16px' }}>{c.icon}</span>}
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{c.name}</span>
          </div>
        ))}
      </div>
    )}
  </div>
) : (
  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', padding: '8px 0' }}>
    {locale === 'ar' ? 'لا توجد فئات — أضفها من الإعدادات' : 'No categories — add them from Settings'}
  </div>
)}
                  </div>
                </div>
              </div>

              {/* Single: السعر */}
              {serviceType === 'single' && (
                <div className="form-group">
                  <label className="form-label">{t('price')}</label>
                  <div className="form-switch" onClick={() => setCashierPrice(!cashierPrice)} style={{ marginBottom: '8px' }}>
                    <div>
                      <div className="form-switch-label">
                        {locale === 'ar' ? 'الكاشير يحدد السعر' : 'Cashier sets price'}
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
                </div>
              )}

              {/* Bundle */}
              {serviceType === 'bundle' && (
                <div className="form-group">
                  <label className="form-label">
                    {locale === 'ar' ? 'الخدمات داخل الباقة' : 'Services in bundle'}
                  </label>
                  {bundleItems.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      {bundleItems.map(item => (
                        <div key={item.service_id} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '10px 12px', marginBottom: '6px',
                          backgroundColor: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                              {item.service_name}
                            </div>
                            {!item.custom_price && (
                              <input type="number" min="0" value={item.price}
                                onChange={e => updateBundleItemPrice(item.service_id, e.target.value)}
                                style={{
                                  marginTop: '4px', padding: '4px 8px',
                                  backgroundColor: 'var(--color-bg-secondary)',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: '6px', fontSize: '12px',
                                  color: 'var(--color-primary)', width: '100px',
                                }} />
                            )}
                            {item.custom_price && (
                              <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '4px' }}>
                                ⌨️ {locale === 'ar' ? 'الكاشير يحدد السعر' : 'Cashier sets price'}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                              {locale === 'ar' ? 'كاشير' : 'Cashier'}
                            </span>
                            <div onClick={() => toggleBundleItemCustomPrice(item.service_id)}
                              style={{
                                width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer',
                                backgroundColor: item.custom_price ? 'var(--color-warning)' : 'var(--color-border)',
                                position: 'relative', transition: 'var(--transition)',
                              }}>
                              <div style={{
                                width: '14px', height: '14px', borderRadius: '50%',
                                backgroundColor: '#fff', position: 'absolute',
                                top: '3px', transition: 'var(--transition)',
                                left: item.custom_price ? '19px' : '3px',
                              }} />
                            </div>
                          </div>
                          <button onClick={() => removeBundleItem(item.service_id)}
                            style={{
                              width: '28px', height: '28px', borderRadius: '6px',
                              border: '1px solid var(--color-danger-border)',
                              backgroundColor: 'var(--color-danger-light)',
                              color: 'var(--color-danger)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <div style={{
                        padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-success-light)',
                        border: '1px solid var(--color-success-border)',
                        fontSize: '13px', fontWeight: '700', color: 'var(--color-success)',
                      }}>
                        {locale === 'ar' ? 'إجمالي الباقة:' : 'Bundle total:'}{' '}
                        {formatCurrency(bundleTotal, locale === 'ar' ? 'ar-SA' : 'en-US')}
                        {hasCustom && (
                          <span style={{ color: 'var(--color-warning)', marginRight: '8px', fontWeight: '400', fontSize: '12px' }}>
                            + {locale === 'ar' ? 'يحدده الكاشير' : 'cashier sets'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: '8px' }}>
                    <input className="form-input"
                      placeholder={locale === 'ar' ? 'ابحث عن خدمة لإضافتها...' : 'Search service to add...'}
                      value={bundleSearch} onChange={e => setBundleSearch(e.target.value)} />
                  </div>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                    {filteredBundle.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                        {locale === 'ar' ? 'لا توجد خدمات' : 'No services'}
                      </div>
                    ) : filteredBundle.map(svc => (
                      <div key={svc.id} onClick={() => addBundleItem(svc)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 12px', cursor: 'pointer',
                          borderBottom: '1px solid var(--color-border)',
                          transition: 'var(--transition)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary-light)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ fontSize: '18px' }}>{svc.icon || '🚗'}</div>
                        <div style={{ flex: 1, fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: '600' }}>{svc.name}</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)' }}>
                          {formatCurrency(svc.price, locale === 'ar' ? 'ar-SA' : 'en-US')}
                        </div>
                        <Plus size={14} color="var(--color-primary)" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
              <input placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                value={search} onChange={e => setSearch(e.target.value)} />
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
                        {(svc as any).type === 'bundle' && (
                          <div style={{ fontSize: '11px', color: 'var(--color-purple)' }}>
                            📦 {((svc as any).bundle_items || []).map((i: any) => i.service_name).join(' · ')}
                          </div>
                        )}
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
                    <span className={`badge ${(svc as any).type === 'bundle' ? 'badge-purple' : 'badge-primary'}`}>
                      {(svc as any).type === 'bundle'
                        ? (locale === 'ar' ? '📦 باقة' : '📦 Bundle')
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
                      <button className="action-btn" onClick={() => setVariantsItem(svc)}
                        title="Variants">🎛️</button>
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
                        {locale === 'ar' ? 'لا توجد منتجات' : 'No items found'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {variantsItem && (
        <VariantsModal
          itemId={variantsItem.id}
          itemName={variantsItem.name}
          trackInventory={(variantsItem as any).track_inventory || false}
          onClose={() => setVariantsItem(null)}
        />
      )}
    </div>
  )
}