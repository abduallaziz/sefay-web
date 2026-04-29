'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { User } from '@/types'
import { Search, RefreshCw, Plus, X, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import '@/styles/modals.css'
import '@/styles/forms.css'

export default function EmployeesPage() {
  const t = useTranslations('employees')
  const locale = useLocale()

  const [employees, setEmployees] = useState<User[]>([])
  const [branches,  setBranches]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected,  setSelected]  = useState<User | null>(null)
  const [saving,    setSaving]    = useState(false)

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [role,     setRole]     = useState('cashier')
  const [branchId, setBranchId] = useState('')

  const ROLES = [
    { id: 'superadmin', labelAr: 'سوبر ادمن', labelEn: 'Super Admin' },
    { id: 'owner',      labelAr: 'مالك',       labelEn: 'Owner' },
    { id: 'manager',    labelAr: 'مدير',       labelEn: 'Manager' },
    { id: 'cashier',    labelAr: 'كاشير',      labelEn: 'Cashier' },
    { id: 'worker',     labelAr: 'موظف',       labelEn: 'Worker' },
  ]

  const roleColors: Record<string, string> = {
    superadmin: 'badge-danger',
    owner:      'badge-warning',
    manager:    'badge-primary',
    cashier:    'badge-success',
    worker:     'badge-muted',
  }

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const session = getSession()
      if (!session) return
      const [empRes, branchRes] = await Promise.all([
        supabase.from('users').select('*').eq('tenant_id', session.tenant_id).order('name'),
        supabase.from('branches').select('id, name').eq('tenant_id', session.tenant_id).eq('active', true),
      ])
      setEmployees(empRes.data || [])
      setBranches(branchRes.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  function openNew() {
    setSelected(null)
    setName(''); setEmail(''); setPassword('')
    setRole('cashier'); setBranchId('')
    setShowModal(true)
  }

  function openEdit(emp: User) {
    setSelected(emp)
    setName(emp.name || '')
    setEmail((emp as any).email || '')
    setPassword('')
    setRole(emp.role)
    setBranchId(emp.branch_id || '')
    setShowModal(true)
  }

  async function saveEmployee() {
    if (!name.trim() || !email.trim()) return
    if (!selected && !password.trim()) return
    setSaving(true)
    try {
      const session = getSession()
      if (!session) return

      if (selected) {
        const body: any = {
          name: name.trim(),
          email: email.trim(),
          role,
          branch_id: branchId || null,
        }
        if (password.trim()) body.password_hash = password.trim()
        await supabase.from('users').update(body).eq('id', selected.id)
      } else {
        await supabase.from('users').insert({
          tenant_id: session.tenant_id,
          name: name.trim(),
          email: email.trim(),
          password_hash: password.trim(),
          role,
          branch_id: branchId || null,
          is_active: true,
        })
      }
      setShowModal(false)
      loadData()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function toggleEmployee(emp: User) {
    try {
      await supabase.from('users').update({ is_active: !(emp as any).is_active }).eq('id', emp.id)
      loadData()
    } catch (e) { console.error(e) }
  }

  const filtered = employees.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    (e as any).email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{t('title')}</h2>
          <p className="dashboard-page-subtitle">
            {employees.length} {locale === 'ar' ? 'موظف' : 'employees'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            <RefreshCw size={14} />
            {locale === 'ar' ? 'تحديث' : 'Refresh'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={openNew}>
            <Plus size={14} />
            {locale === 'ar' ? 'إضافة موظف' : 'Add Employee'}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h3 className="modal-title">
                {selected
                  ? (locale === 'ar' ? '✏️ تعديل موظف' : '✏️ Edit Employee')
                  : (locale === 'ar' ? '➕ إضافة موظف' : '➕ Add Employee')}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={14} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('employeeName')} <span>*</span></label>
                  <input id="emp-name" name="emp-name" className="form-input"
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder={locale === 'ar' ? 'الاسم الكامل' : 'Full name'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'الإيميل' : 'Email'} <span>*</span></label>
                  <input id="emp-email" name="emp-email" type="email" className="form-input"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="example@email.com" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {locale === 'ar' ? 'كلمة المرور' : 'Password'}
                  {selected && (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginRight: '6px' }}>
                      ({locale === 'ar' ? 'اتركها فارغة للإبقاء على القديمة' : 'Leave blank to keep current'})
                    </span>
                  )}
                  {!selected && <span>*</span>}
                </label>
                <input id="emp-password" name="emp-password" type="password" className="form-input"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" />
              </div>

              <div className="form-group">
                <label className="form-label">{t('role')} <span>*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ROLES.map(r => (
                    <button key={r.id} onClick={() => setRole(r.id)}
                      style={{
                        padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${role === r.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        backgroundColor: role === r.id ? 'var(--color-primary-light)' : 'var(--color-bg-tertiary)',
                        color: role === r.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                      }}>
                      {locale === 'ar' ? r.labelAr : r.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{locale === 'ar' ? 'الفرع' : 'Branch'}</label>
                <select id="emp-branch" name="emp-branch" className="form-input form-select"
                  value={branchId} onChange={e => setBranchId(e.target.value)}>
                  <option value="">{locale === 'ar' ? 'بدون فرع محدد' : 'No specific branch'}</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button className="btn btn-primary" onClick={saveEmployee} disabled={saving}>
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
              <input id="emp-search" name="emp-search"
                placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
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
                <th>{t('employeeName')}</th>
                <th>{locale === 'ar' ? 'الإيميل' : 'Email'}</th>
                <th>{t('role')}</th>
                <th>{locale === 'ar' ? 'الفرع' : 'Branch'}</th>
                <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                <th>{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-light)',
                        border: '1px solid var(--color-primary-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)',
                      }}>
                        {emp.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                        {emp.name || '—'}
                      </span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>
                    {(emp as any).email || '—'}
                  </td>
                  <td>
                    <span className={`badge ${roleColors[emp.role] || 'badge-muted'}`}>
                      {ROLES.find(r => r.id === emp.role)?.[locale === 'ar' ? 'labelAr' : 'labelEn'] || emp.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                    {branches.find(b => b.id === emp.branch_id)?.name || '—'}
                  </td>
                  <td>
                    <span className={`badge ${(emp as any).is_active ? 'badge-success' : 'badge-danger'}`}>
                      {(emp as any).is_active
                        ? (locale === 'ar' ? 'مفعّل' : 'Active')
                        : (locale === 'ar' ? 'معطّل' : 'Inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button className="action-btn" onClick={() => openEdit(emp)}
                        title={locale === 'ar' ? 'تعديل' : 'Edit'}>✏️</button>
                      <button className={`action-btn ${(emp as any).is_active ? '' : 'success'}`}
                        onClick={() => toggleEmployee(emp)}>
                        {(emp as any).is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty">
                      <div className="table-empty-icon">👥</div>
                      <div className="table-empty-text">
                        {locale === 'ar' ? 'لا يوجد موظفين' : 'No employees found'}
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