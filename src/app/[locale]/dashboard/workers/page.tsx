'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { Clock, Save, X, Users, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react'
import '@/styles/modals.css'
import '@/styles/forms.css'

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DEFAULT_SLOTS = [
  { day: 0, start: '09:00', end: '00:00', active: true  },
  { day: 1, start: '09:00', end: '00:00', active: true  },
  { day: 2, start: '09:00', end: '00:00', active: true  },
  { day: 3, start: '09:00', end: '00:00', active: true  },
  { day: 4, start: '09:00', end: '00:00', active: true  },
  { day: 5, start: '14:00', end: '00:00', active: true  },
  { day: 6, start: '09:00', end: '00:00', active: false },
]

interface Worker {
  id: string
  name: string
  active: boolean
  branch_id?: string
}

interface Slot {
  day: number
  start: string
  end: string
  active: boolean
}

export default function WorkersPage() {
  const locale = useLocale()
  const isAr   = locale === 'ar'
  const lc     = (ar: string, en: string) => isAr ? ar : en

  const [workers,   setWorkers]   = useState<Worker[]>([])
  const [branches,  setBranches]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)

  // ─── Worker Modal ───────────────────────────
  const [showWorker,  setShowWorker]  = useState(false)
  const [selWorker,   setSelWorker]   = useState<Worker | null>(null)
  const [wName,       setWName]       = useState('')
  const [wBranch,     setWBranch]     = useState('')
  const [savingW,     setSavingW]     = useState(false)

  // ─── Availability Modal ─────────────────────
  const [showAvail,  setShowAvail]  = useState(false)
  const [availW,     setAvailW]     = useState<Worker | null>(null)
  const [slots,      setSlots]      = useState<Slot[]>(DEFAULT_SLOTS)
  const [savingA,    setSavingA]    = useState(false)
  const [applyAll,   setApplyAll]   = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const session = getSession()
      if (!session) return
      const [wRes, bRes] = await Promise.all([
        supabase.from('workers').select('*').eq('tenant_id', session.tenant_id).order('name'),
        supabase.from('branches').select('id, name').eq('tenant_id', session.tenant_id).eq('active', true),
      ])
      setWorkers(wRes.data || [])
      setBranches(bRes.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // ─── Worker CRUD ────────────────────────────
  function openNew() {
    setSelWorker(null)
    setWName('')
    setWBranch('')
    setShowWorker(true)
  }

  function openEdit(w: Worker) {
    setSelWorker(w)
    setWName(w.name)
    setWBranch(w.branch_id || '')
    setShowWorker(true)
  }

  async function saveWorker() {
    if (!wName.trim()) return
    setSavingW(true)
    try {
      const session = getSession()
      if (!session) return
      if (selWorker) {
        await supabase.from('workers').update({
          name: wName.trim(),
          branch_id: wBranch || null,
        }).eq('id', selWorker.id)
      } else {
        await supabase.from('workers').insert({
          tenant_id: session.tenant_id,
          name:      wName.trim(),
          branch_id: wBranch || null,
          active:    true,
          busy:      false,
          jobs_done: 0,
        })
      }
      setShowWorker(false)
      loadData()
    } catch (e) { console.error(e) }
    finally { setSavingW(false) }
  }

  async function toggleWorker(w: Worker) {
    await supabase.from('workers').update({ active: !w.active }).eq('id', w.id)
    loadData()
  }

  async function deleteWorker(w: Worker) {
    if (!confirm(lc(`حذف "${w.name}"؟`, `Delete "${w.name}"?`))) return
    await supabase.from('workers').delete().eq('id', w.id)
    loadData()
  }

  // ─── Availability ────────────────────────────
  async function openAvailability(w: Worker) {
    setAvailW(w)
    setApplyAll(false)
    const session = getSession()
    if (!session) return
    try {
      const { data: existing } = await supabase
        .from('availability').select('*')
        .eq('tenant_id', session.tenant_id)
        .eq('worker_id', w.id)

      setSlots(
        Array.from({ length: 7 }, (_, i) => {
          const found = existing?.find((a: any) => a.day_of_week === i)
          return {
            day:    i,
            start:  found ? found.start_time.slice(0, 5) : '09:00',
            end:    found ? found.end_time.slice(0, 5)   : '00:00',
            active: !!found,
          }
        })
      )
    } catch {
      setSlots(DEFAULT_SLOTS.map(s => ({ ...s })))
    }
    setShowAvail(true)
  }

  async function saveAvailability() {
    const session = getSession()
    if (!session || !availW) return
    setSavingA(true)
    try {
      const activeDays    = slots.filter(s => s.active)
      const targetWorkers = applyAll ? workers : [availW]
      for (const w of targetWorkers) {
        await supabase.from('availability').delete()
          .eq('tenant_id', session.tenant_id).eq('worker_id', w.id)
        if (activeDays.length > 0) {
          await supabase.from('availability').insert(
            activeDays.map(s => ({
              tenant_id:   session.tenant_id,
              worker_id:   w.id,
              day_of_week: s.day,
              start_time:  s.start,
              end_time:    s.end,
            }))
          )
        }
      }
      setShowAvail(false)
    } catch (e) { console.error(e) }
    finally { setSavingA(false) }
  }

  return (
    <div>
      {/* Header */}
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{lc('مقدمو الخدمة', 'Service Providers')}</h2>
          <p className="dashboard-page-subtitle">{workers.length} {lc('موظف', 'workers')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            <RefreshCw size={14} /> {lc('تحديث', 'Refresh')}
          </button>
          <button className="btn btn-primary btn-sm" onClick={openNew}>
            <Plus size={14} /> {lc('إضافة', 'Add')}
          </button>
        </div>
      </div>

      {/* ─── Worker Modal ─── */}
      {showWorker && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h3 className="modal-title">
                {selWorker ? lc('تعديل', 'Edit') : lc('إضافة موظف', 'Add Worker')}
              </h3>
              <button className="modal-close" onClick={() => setShowWorker(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{lc('الاسم', 'Name')} *</label>
                <input className="form-input" value={wName}
                  onChange={e => setWName(e.target.value)}
                  placeholder={lc('اسم الموظف', 'Worker name')} />
              </div>
              <div className="form-group">
                <label className="form-label">{lc('الفرع', 'Branch')}</label>
                <select className="form-input form-select" value={wBranch}
                  onChange={e => setWBranch(e.target.value)}>
                  <option value="">{lc('بدون فرع', 'No branch')}</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowWorker(false)}>
                {lc('إلغاء', 'Cancel')}
              </button>
              <button className="btn btn-primary" onClick={saveWorker} disabled={savingW}>
                <Save size={14} />
                {savingW ? lc('جاري...', 'Saving...') : lc('حفظ', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Availability Modal ─── */}
      {showAvail && availW && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h3 className="modal-title">
                <Clock size={16} style={{ marginLeft: '6px' }} />
                {lc(`دوام — ${availW.name}`, `Schedule — ${availW.name}`)}
              </h3>
              <button className="modal-close" onClick={() => setShowAvail(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {slots.map((slot, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px',
                    backgroundColor: slot.active ? 'var(--color-primary-light)' : 'var(--color-bg-tertiary)',
                    border: `1px solid ${slot.active ? 'var(--color-primary-border)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <input type="checkbox" checked={slot.active}
                      onChange={e => setSlots(prev => prev.map((s, j) =>
                        j === i ? { ...s, active: e.target.checked } : s
                      ))}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{
                      width: '75px', fontSize: '13px', fontWeight: '700',
                      color: slot.active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    }}>
                      {isAr ? DAYS_AR[slot.day] : DAYS_EN[slot.day]}
                    </span>
                    <input type="time" value={slot.start} disabled={!slot.active}
                      onChange={e => setSlots(prev => prev.map((s, j) =>
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
                      onChange={e => setSlots(prev => prev.map((s, j) =>
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

              {workers.length > 1 && (
                <div style={{
                  marginTop: '16px', padding: '12px',
                  backgroundColor: applyAll ? '#10b98122' : 'var(--color-bg-tertiary)',
                  border: `1px solid ${applyAll ? '#10b981' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                }} onClick={() => setApplyAll(!applyAll)}>
                  <input type="checkbox" checked={applyAll} readOnly
                    style={{ width: '16px', height: '16px' }} />
                  <Users size={15} style={{ color: applyAll ? '#10b981' : 'var(--color-text-muted)' }} />
                  <span style={{
                    fontSize: '13px', fontWeight: '700',
                    color: applyAll ? '#10b981' : 'var(--color-text-secondary)',
                  }}>
                    {lc('تطبيق على جميع مقدمي الخدمة', 'Apply to all workers')}
                  </span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAvail(false)}>
                {lc('إلغاء', 'Cancel')}
              </button>
              <button className="btn btn-primary" onClick={saveAvailability} disabled={savingA}>
                <Save size={14} />
                {savingA ? lc('جاري...', 'Saving...') : applyAll ? lc('حفظ للكل', 'Save for All') : lc('حفظ', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Table ─── */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">{lc('قائمة مقدمي الخدمة', 'Service Providers')}</h3>
        </div>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {lc('جاري التحميل...', 'Loading...')}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{lc('الاسم', 'Name')}</th>
                <th>{lc('الفرع', 'Branch')}</th>
                <th>{lc('الحالة', 'Status')}</th>
                <th>{lc('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {workers.map(w => (
                <tr key={w.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-light)',
                        border: '1px solid var(--color-primary-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)',
                      }}>
                        {w.name?.charAt(0)}
                      </div>
                      <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{w.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                    {branches.find(b => b.id === w.branch_id)?.name || '—'}
                  </td>
                  <td>
                    <span className={`badge ${w.active ? 'badge-success' : 'badge-danger'}`}>
                      {w.active ? lc('مفعّل', 'Active') : lc('معطّل', 'Inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button className="action-btn" onClick={() => openEdit(w)} title={lc('تعديل', 'Edit')}>✏️</button>
                      <button className="action-btn" onClick={() => openAvailability(w)} title={lc('الدوام', 'Schedule')}>
                        <Clock size={14} />
                      </button>
                      <button className="action-btn" onClick={() => toggleWorker(w)}>
                        {w.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                      <button className="action-btn danger" onClick={() => deleteWorker(w)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {workers.length === 0 && (
                <tr><td colSpan={4}>
                  <div className="table-empty">
                    <div className="table-empty-icon">👷</div>
                    <div className="table-empty-text">{lc('لا يوجد موظفون', 'No workers found')}</div>
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