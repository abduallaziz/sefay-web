'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { Clock, Save, X, Users } from 'lucide-react'
import '@/styles/modals.css'
import '@/styles/forms.css'

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DEFAULT_SLOTS = [
  { day: 0, start: '09:00', end: '21:00', active: true  }, // أحد
  { day: 1, start: '09:00', end: '21:00', active: true  }, // اثنين
  { day: 2, start: '09:00', end: '21:00', active: true  }, // ثلاثاء
  { day: 3, start: '09:00', end: '21:00', active: true  }, // أربعاء
  { day: 4, start: '09:00', end: '21:00', active: true  }, // خميس
  { day: 5, start: '14:00', end: '21:00', active: true  }, // جمعة
  { day: 6, start: '09:00', end: '21:00', active: false }, // سبت
]

interface Worker {
  id: string
  name: string
  active: boolean
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

  const [workers,     setWorkers]     = useState<Worker[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showAvail,   setShowAvail]   = useState(false)
  const [selWorker,   setSelWorker]   = useState<Worker | null>(null)
  const [slots,       setSlots]       = useState<Slot[]>(DEFAULT_SLOTS)
  const [saving,      setSaving]      = useState(false)
  const [applyAll,    setApplyAll]    = useState(false)

  useEffect(() => { loadWorkers() }, [])

  async function loadWorkers() {
    setLoading(true)
    try {
      const session = getSession()
      if (!session) return
      const { data } = await supabase
        .from('workers')
        .select('*')
        .eq('tenant_id', session.tenant_id)
        .order('name')
      setWorkers(data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function openAvailability(worker: Worker) {
    setSelWorker(worker)
    setApplyAll(false)
    const session = getSession()
    if (!session) return
    try {
      const { data: existing } = await supabase
        .from('availability')
        .select('*')
        .eq('tenant_id', session.tenant_id)
        .eq('worker_id', worker.id)

      if (existing && existing.length > 0) {
        setSlots(
          Array.from({ length: 7 }, (_, i) => {
            const found = existing.find((a: any) => a.day_of_week === i)
            return {
              day:    i,
              start:  found ? found.start_time.slice(0, 5) : '09:00',
              end:    found ? found.end_time.slice(0, 5)   : '21:00',
              active: !!found,
            }
          })
        )
      } else {
        setSlots(DEFAULT_SLOTS.map(s => ({ ...s })))
      }
    } catch {
      setSlots(DEFAULT_SLOTS.map(s => ({ ...s })))
    }
    setShowAvail(true)
  }

  async function saveAvailability() {
    const session = getSession()
    if (!session || !selWorker) return
    setSaving(true)
    try {
      const activeDays = slots.filter(s => s.active)
      const targetWorkers = applyAll ? workers : [selWorker]

      for (const w of targetWorkers) {
        await supabase
          .from('availability')
          .delete()
          .eq('tenant_id', session.tenant_id)
          .eq('worker_id', w.id)

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
    finally { setSaving(false) }
  }

  return (
    <div>
      {/* Header */}
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{lc('الموظفون', 'Workers')}</h2>
          <p className="dashboard-page-subtitle">
            {workers.length} {lc('موظف', 'workers')}
          </p>
        </div>
      </div>

      {/* Availability Modal */}
      {showAvail && selWorker && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h3 className="modal-title">
                <Clock size={16} style={{ marginLeft: '6px' }} />
                {lc(`أوقات دوام — ${selWorker.name}`, `Schedule — ${selWorker.name}`)}
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

              {/* تطبيق على الكل */}
              {workers.length > 1 && (
                <div style={{
                  marginTop: '16px', padding: '12px',
                  backgroundColor: applyAll ? '#10b98122' : 'var(--color-bg-tertiary)',
                  border: `1px solid ${applyAll ? '#10b981' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                }} onClick={() => setApplyAll(!applyAll)}>
                  <input type="checkbox" checked={applyAll} onChange={() => setApplyAll(!applyAll)}
                    style={{ width: '16px', height: '16px' }} />
                  <Users size={15} style={{ color: applyAll ? '#10b981' : 'var(--color-text-muted)' }} />
                  <span style={{
                    fontSize: '13px', fontWeight: '700',
                    color: applyAll ? '#10b981' : 'var(--color-text-secondary)',
                  }}>
                    {lc('تطبيق على جميع الموظفين', 'Apply to all workers')}
                  </span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAvail(false)}>
                {lc('إلغاء', 'Cancel')}
              </button>
              <button className="btn btn-primary" onClick={saveAvailability} disabled={saving}>
                <Save size={14} />
                {saving
                  ? lc('جاري الحفظ...', 'Saving...')
                  : applyAll
                    ? lc('حفظ للكل', 'Save for All')
                    : lc('حفظ الدوام', 'Save Schedule')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workers List */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">{lc('قائمة الموظفين', 'Workers List')}</h3>
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
                  <td>
                    <span className={`badge ${w.active ? 'badge-success' : 'badge-danger'}`}>
                      {w.active ? lc('مفعّل', 'Active') : lc('معطّل', 'Inactive')}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openAvailability(w)}>
                      <Clock size={13} />
                      {lc('إعداد الدوام', 'Set Schedule')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
} 