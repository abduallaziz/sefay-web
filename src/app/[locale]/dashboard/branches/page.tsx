'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { Search, RefreshCw, Plus, X, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import '@/styles/modals.css'
import '@/styles/forms.css'

export default function BranchesPage() {
  const locale = useLocale()

  const [branches,  setBranches]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected,  setSelected]  = useState<any>(null)
  const [saving,    setSaving]    = useState(false)

  const [name,    setName]    = useState('')
  const [city,    setCity]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => { loadBranches() }, [])

  async function loadBranches() {
    setLoading(true)
    try {
      const session = getSession()
      if (!session) return
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('tenant_id', session.tenant_id)
        .order('name')
      if (error) throw error
      setBranches(data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  function openNew() {
    setSelected(null)
    setName(''); setCity(''); setPhone(''); setAddress('')
    setShowModal(true)
  }

  function openEdit(b: any) {
    setSelected(b)
    setName(b.name || '')
    setCity(b.city || '')
    setPhone(b.phone || '')
    setAddress(b.address || '')
    setShowModal(true)
  }

  async function saveBranch() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const session = getSession()
      if (!session) return
      const body = {
        name: name.trim(),
        city: city.trim(),
        phone: phone.trim(),
        address: address.trim(),
      }
      if (selected) {
        const { error } = await supabase
          .from('branches')
          .update(body)
          .eq('id', selected.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('branches')
          .insert({ ...body, tenant_id: session.tenant_id, active: true })
        if (error) throw error
      }
      setShowModal(false)
      loadBranches()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function toggleBranch(b: any) {
    try {
      await supabase.from('branches').update({ active: !b.active }).eq('id', b.id)
      loadBranches()
    } catch (e) { console.error(e) }
  }

  const filtered = branches.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">
            {locale === 'ar' ? 'الفروع' : 'Branches'}
          </h2>
          <p className="dashboard-page-subtitle">
            {branches.length} {locale === 'ar' ? 'فرع' : 'branches'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadBranches}>
            <RefreshCw size={14} />
            {locale === 'ar' ? 'تحديث' : 'Refresh'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={openNew}>
            <Plus size={14} />
            {locale === 'ar' ? 'إضافة فرع' : 'Add Branch'}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h3 className="modal-title">
                {selected
                  ? (locale === 'ar' ? '✏️ تعديل فرع' : '✏️ Edit Branch')
                  : (locale === 'ar' ? '➕ إضافة فرع' : '➕ Add Branch')}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={14} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  {locale === 'ar' ? 'اسم الفرع' : 'Branch Name'} <span>*</span>
                </label>
                <input
                  id="br-name" name="br-name"
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={locale === 'ar' ? 'الفرع الرئيسي' : 'Main Branch'}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'المدينة' : 'City'}</label>
                  <input
                    id="br-city" name="br-city"
                    className="form-input"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder={locale === 'ar' ? 'الرياض' : 'Riyadh'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الجوال' : 'Phone'}</label>
                  <input
                    id="br-phone" name="br-phone"
                    className="form-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'العنوان' : 'Address'}</label>
                <textarea
                  id="br-address" name="br-address"
                  className="form-input form-textarea"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder={locale === 'ar' ? 'العنوان التفصيلي' : 'Detailed address'}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button className="btn btn-primary" onClick={saveBranch} disabled={saving}>
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
          <h3 className="table-title">{locale === 'ar' ? 'الفروع' : 'Branches'}</h3>
          <div className="table-actions">
            <div className="table-search">
              <Search size={14} />
              <input
                id="br-search" name="br-search"
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
                <th>{locale === 'ar' ? 'اسم الفرع' : 'Branch'}</th>
                <th>{locale === 'ar' ? 'المدينة' : 'City'}</th>
                <th>{locale === 'ar' ? 'الجوال' : 'Phone'}</th>
                <th>{locale === 'ar' ? 'العنوان' : 'Address'}</th>
                <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                <th>{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                    🏬 {b.name}
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{b.city || '—'}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{b.phone || '—'}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                    {b.address || '—'}
                  </td>
                  <td>
                    <span className={`badge ${b.active ? 'badge-success' : 'badge-danger'}`}>
                      {b.active
                        ? (locale === 'ar' ? 'مفعّل' : 'Active')
                        : (locale === 'ar' ? 'معطّل' : 'Inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button className="action-btn" onClick={() => openEdit(b)}>✏️</button>
                      <button className={`action-btn ${b.active ? '' : 'success'}`} onClick={() => toggleBranch(b)}>
                        {b.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty">
                      <div className="table-empty-icon">🏬</div>
                      <div className="table-empty-text">
                        {locale === 'ar' ? 'لا توجد فروع' : 'No branches found'}
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