'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { User } from '@/types'
import { Search, RefreshCw, Plus, X, Save, ToggleLeft, ToggleRight, Trash2, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import '@/styles/modals.css'
import '@/styles/forms.css'

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function EmployeesPage() {
  const t = useTranslations('employees')
  const locale = useLocale()
  const isAr = locale === 'ar'

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

  // ─── Availability Modal ───────────────────────
  const [showAvail,     setShowAvail]     = useState(false)
  const [availWorker,   setAvailWorker]   = useState<User | null>(null)
  const [availSlots,    setAvailSlots]    = useState<{ day: number; start: string; end: string; active: boolean }[]>(
    Array.from({ length: 7 }, (_, i) => ({ day: i, start: '09:00', end: '17:00', active: false }))
  )
  const [savingAvail, setSavingAvail] = useState(false)

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

  async function hashPassword(pass: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(pass)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
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

  async function openAvailability(emp: User) {
    setAvailWorker(emp)
    // جيب الدوام الحالي
    try {
      const res = await api.appointments.getAvailability((emp as any).worker_id || emp.id)
      const existing = res.data || []
      setAvailSlots(
        Array.from({ length: 7 }, (_, i) => {
          const found = existing.find((a: any) => a.day_of_week === i)
          return {
            day:    i,
            start:  found ? found.start_time.slice(0, 5) : '09:00',
            end:    found ? found.end_time.slice(0, 5)   : '17:00',
            active: !!found,
          }
        })
      )
    } catch {
      setAvailSlots(Array.from({ length: 7 }, (_, i) => ({ day: i, start: '09:00', end: '17:00', active: false })))
    }
    setShowAvail(true)
  }

  async function saveAvailability() {
    if (!availWorker) return
    setSavingAvail(true)
    try {
      const session = getSession()
      if (!session) return

      const activeDays = availSlots.filter(s => s.active)

      // احذف القديم وأضف الجديد مباشرة في Supabase
      await supabase
        .from('availability')
        .delete()
        .eq('tenant_id', session.tenant_id)
        .eq('worker_id', availWorker.id)

      if (activeDays.length > 0) {
        await supabase.from('availability').insert(
          activeDays.map(s => ({
            tenant_id:   session.tenant_id,
            worker_id:   availWorker.id,
            day_of_week: s.day,
            start_time:  s.start,
            end_time:    s.end,
          }))
        )
      }

      setShowAvail(false)
    } catch (e) { console.error(e) }
    finally { setSavingAvail(false) }
  }

  async function saveEmployee() {
    if (!name.trim() || !email.trim()) return
    if (!selected && !password.trim()) return
    setSaving(true)
    try {
      const session = getSession()
      if (!session) return
      if (selected) {
        const body: any = { name: name.trim(), email: email.trim(), role, branch_id: branchId || null }
        if (password.trim()) body.password_hash = await hashPassword(password.trim())
        await supabase.from('users').update(body).eq('id', selected.id)
      } else {
        await supabase.from('users').insert({
          tenant_id: session.tenant_id,
          name: name.trim(), email: email.trim(),
          password_hash: await hashPassword(password.trim()),
          role, branch_id: branchId || null, is_active: true,
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

  async function deleteEmployee(emp: User) {
    if (!confirm(isAr ? `هل أنت متأكد من حذف "${emp.name}"؟` : `Delete "${emp.name}"?`)) return
    try {
      await supabase.from('users').delete().eq('id', emp.id)
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
            {employees.length} {isAr ? 'موظف' : 'employees'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            <RefreshCw size={14} />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={openNew}>
            <Plus size={14} />
            {isAr ? 'إضافة موظف' : 'Add Employee'}
          </button>
        </div>
      </div>

      {/* ─── Employee Modal ─── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h3 className="modal-title">
                {selected ? (isAr ? '✏️ تعديل موظف' : '✏️ Edit Employee') : (isAr ? '➕ إضافة موظف' : '➕ Add Employee')}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('employeeName')} <span>*</span></label>
                  <input className="form-input" value={name} onChange={e => setName(e.target.value)}
                    placeholder={isAr ? 'الاسم الكامل' : 'Full name'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'الإيميل' : 'Email'} <span>*</span></label>
                  <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="example@email.com" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  {isAr ? 'كلمة المرور' : 'Password'}
                  {selected && <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginRight: '6px' }}>
                    ({isAr ? 'اتركها فارغة للإبقاء على القديمة' : 'Leave blank to keep current'})
                  </span>}
                  {!selected && <span>*</span>}
                </label>
                <input type="password" className="form-input" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('role')} <span>*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ROLES.map(r => (
                    <button key={r.id} onClick={() => setRole(r.id)} style={{
                      padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                      border: `1.5px solid ${role === r.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: role === r.id ? 'var(--color-primary-light)' : 'var(--color-bg-tertiary)',
                      color: role === r.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                    }}>
                      {isAr ? r.labelAr : r.labelEn}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'الفرع' : 'Branch'}</label>
                <select className="form-input form-select" value={branchId} onChange={e => setBranchId(e.target.value)}>
                  <option value="">{isAr ? 'بدون فرع محدد' : 'No specific branch'}</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button className="btn btn-primary" onClick={saveEmployee} disabled={saving}>
                <Save size={14} />
                {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Availability Modal ─── */}
      {showAvail && availWorker && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h3 className="modal-title">
                <Clock size={16} style={{ marginLeft: '8px' }} />
                {isAr ? `أوقات دوام — ${availWorker.name}` : `Schedule — ${availWorker.name}`}
              </h3>
              <button className="modal-close" onClick={() => setShowAvail(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {availSlots.map((slot, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px',
                    backgroundColor: slot.active ? 'var(--color-primary-light)' : 'var(--color-bg-tertiary)',
                    border: `1px solid ${slot.active ? 'var(--color-primary-border)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                  }}>
                    {/* Toggle Day */}
                    <input type="checkbox" checked={slot.active}
                      onChange={e => setAvailSlots(prev => prev.map((s, j) =>
                        j === i ? { ...s, active: e.target.checked } : s
                      ))}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{
                      width: '80px', fontSize: '13px', fontWeight: '700',
                      color: slot.active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    }}>
                      {isAr ? DAYS_AR[slot.day] : DAYS_EN[slot.day]}
                    </span>
                    {/* Times */}
                    <input type="time" value={slot.start} disabled={!slot.active}
                      onChange={e => setAvailSlots(prev => prev.map((s, j) =>
                        j === i ? { ...s, start: e.target.value } : s
                      ))}
                      style={{
                        padding: '5px 8px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)', fontSize: '12px',
                        opacity: slot.active ? 1 : 0.4,
                      }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>→</span>
                    <input type="time" value={slot.end} disabled={!slot.active}
                      onChange={e => setAvailSlots(prev => prev.map((s, j) =>
                        j === i ? { ...s, end: e.target.value } : s
                      ))}
                      style={{
                        padding: '5px 8px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)', fontSize: '12px',
                        opacity: slot.active ? 1 : 0.4,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAvail(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button className="btn btn-primary" onClick={saveAvailability} disabled={savingAvail}>
                <Save size={14} />
                {savingAvail ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ الدوام' : 'Save Schedule')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Table ─── */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">{t('title')}</h3>
          <div className="table-actions">
            <div className="table-search">
              <Search size={14} />
              <input placeholder={isAr ? 'بحث...' : 'Search...'}
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {isAr ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('employeeName')}</th>
                <th>{isAr ? 'الإيميل' : 'Email'}</th>
                <th>{t('role')}</th>
                <th>{isAr ? 'الفرع' : 'Branch'}</th>
                <th>{isAr ? 'الحالة' : 'Status'}</th>
                <th>{isAr ? 'إجراءات' : 'Actions'}</th>
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
                  <td style={{ color: 'var(--color-text-secondary)' }}>{(emp as any).email || '—'}</td>
                  <td>
                    <span className={`badge ${roleColors[emp.role] || 'badge-muted'}`}>
                      {ROLES.find(r => r.id === emp.role)?.[isAr ? 'labelAr' : 'labelEn'] || emp.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                    {branches.find(b => b.id === emp.branch_id)?.name || '—'}
                  </td>
                  <td>
                    <span className={`badge ${(emp as any).is_active ? 'badge-success' : 'badge-danger'}`}>
                      {(emp as any).is_active ? (isAr ? 'مفعّل' : 'Active') : (isAr ? 'معطّل' : 'Inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button className="action-btn" onClick={() => openEdit(emp)}
                        title={isAr ? 'تعديل' : 'Edit'}>✏️</button>
                      <button className="action-btn" onClick={() => openAvailability(emp)}
                        title={isAr ? 'الدوام' : 'Schedule'}>
                        <Clock size={14} />
                      </button>
                      <button className={`action-btn ${(emp as any).is_active ? '' : 'success'}`}
                        onClick={() => toggleEmployee(emp)}>
                        {(emp as any).is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                      <button className="action-btn danger" onClick={() => deleteEmployee(emp)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="table-empty">
                    <div className="table-empty-icon">👥</div>
                    <div className="table-empty-text">{isAr ? 'لا يوجد موظفين' : 'No employees found'}</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}