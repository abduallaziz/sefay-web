 'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { Plus, ChevronLeft, ChevronRight, Clock, User, Briefcase, CalendarCheck } from 'lucide-react'
import NewAppointmentModal from './NewAppointmentModal'

interface Appointment {
  id: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  workers?: { id: string; name: string }
  customers?: { id: string; name: string; phone: string }
  items?: { id: string; name: string }
}

const STATUS_COLORS: Record<string, string> = {
  pending:   '#f59e0b',
  confirmed: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
}

const STATUS_AR: Record<string, string> = {
  pending:   'معلق',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
}

const STATUS_EN: Record<string, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function AppointmentsPage() {
  const locale = useLocale()
  const isAr   = locale === 'ar'
  const lc     = (ar: string, en: string) => isAr ? ar : en

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading]           = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })
  })
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { loadAppointments() }, [selectedDate])

  async function loadAppointments() {
    setLoading(true)
    try {
      const res = await api.appointments.getAll(selectedDate)
      setAppointments(res.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  function changeDate(delta: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    setSelectedDate(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' }))
  }

  async function updateStatus(id: string, status: string) {
    try {
      await api.appointments.update(id, { status })
      loadAppointments()
    } catch (e) { console.error(e) }
  }

  async function deleteAppointment(id: string) {
    if (!confirm(lc('تأكيد الحذف؟', 'Confirm delete?'))) return
    try {
      await api.appointments.delete(id)
      loadAppointments()
    } catch (e) { console.error(e) }
  }

  // تجميع الحجوزات حسب الساعة
  const byHour = (hour: number) => appointments.filter(a => {
  const h = parseInt(new Date(a.start_time).toLocaleString('en-US', {
    timeZone: 'Asia/Riyadh',
    hour: 'numeric',
    hour12: false
  }))
  return h === hour
})
const hours = Array.from({ length: 18 }, (_, i) => i + 6)
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })
  const isToday  = selectedDate === todayStr

  const dateLabel = isToday
    ? lc('اليوم', 'Today')
    : new Date(selectedDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{ padding: '0', height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', flexShrink: 0,
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CalendarCheck size={20} style={{ color: 'var(--color-primary)' }} />
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
            {lc('المواعيد', 'Appointments')}
          </h1>
          <div style={{
            backgroundColor: 'var(--color-primary)',
            color: '#fff', borderRadius: '12px',
            padding: '2px 10px', fontSize: '12px', fontWeight: '700',
          }}>
            {appointments.length}
          </div>
        </div>

        <button onClick={() => setShowModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', backgroundColor: 'var(--color-primary)',
          color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
          fontSize: '13px', fontWeight: '700', cursor: 'pointer',
        }}>
          <Plus size={16} />
          {lc('موعد جديد', 'New Appointment')}
        </button>
      </div>

      {/* Date Navigator */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '16px', padding: '12px 20px', flexShrink: 0,
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)',
      }}>
        <button onClick={() => changeDate(-1)} style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '1px solid var(--color-border)', cursor: 'pointer',
          backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isAr ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
            {dateLabel}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{selectedDate}</div>
        </div>

        <button onClick={() => changeDate(1)} style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '1px solid var(--color-border)', cursor: 'pointer',
          backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <button onClick={() => setSelectedDate(todayStr)} style={{
          padding: '6px 14px', borderRadius: 'var(--radius-md)',
          border: `1px solid ${isToday ? 'var(--color-primary)' : 'var(--color-border)'}`,
          backgroundColor: isToday ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
          color: isToday ? '#fff' : 'var(--color-text-secondary)',
          fontSize: '12px', fontWeight: '600', cursor: 'pointer',
        }}>
          {lc('اليوم', 'Today')}
        </button>
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
            {lc('جاري التحميل...', 'Loading...')}
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
            <CalendarCheck size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div style={{ fontSize: '15px' }}>{lc('لا توجد مواعيد', 'No appointments')}</div>
          </div>
        ) : (
          hours.map(hour => {
            const appts = byHour(hour)
            if (appts.length === 0) return null
            return (
              <div key={hour} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                {/* Time label */}
                <div style={{
                  width: '52px', flexShrink: 0, paddingTop: '4px',
                  fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600',
                  textAlign: isAr ? 'right' : 'left',
                }}>
                  {String(hour).padStart(2, '0')}:00
                </div>
                {/* Appointments */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {appts.map(appt => {
                    const startT = new Date(appt.start_time).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                    const endT   = new Date(appt.end_time).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                    const color  = STATUS_COLORS[appt.status]
                    return (
                      <div key={appt.id} style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: `1px solid var(--color-border)`,
                        borderRight: isAr ? 'none' : `3px solid ${color}`,
                        borderLeft: isAr ? `3px solid ${color}` : 'none',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                      }}>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '11px', fontWeight: '700', padding: '2px 8px',
                              borderRadius: '10px', backgroundColor: `${color}22`, color,
                            }}>
                              {isAr ? STATUS_AR[appt.status] : STATUS_EN[appt.status]}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={11} /> {startT} → {endT}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {appt.customers && (
                              <span style={{ fontSize: '12px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <User size={11} style={{ color: 'var(--color-primary)' }} />
                                {appt.customers.name}
                              </span>
                            )}
                            {appt.workers && (
                              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Briefcase size={11} />
                                {appt.workers.name}
                              </span>
                            )}
                            {appt.items && (
                              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                {appt.items.name}
                              </span>
                            )}
                          </div>
                          {appt.notes && (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                              {appt.notes}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          {appt.status === 'pending' && (
                            <button onClick={() => updateStatus(appt.id, 'confirmed')} title={lc('تأكيد', 'Confirm')} style={{
                              padding: '5px 10px', borderRadius: 'var(--radius-md)',
                              border: '1px solid #3b82f6', backgroundColor: '#3b82f622',
                              color: '#3b82f6', cursor: 'pointer', fontSize: '11px', fontWeight: '600',
                            }}>
                              {lc('تأكيد', 'Confirm')}
                            </button>
                          )}
                          {['pending', 'confirmed'].includes(appt.status) && (
                            <button onClick={() => updateStatus(appt.id, 'completed')} title={lc('إتمام', 'Complete')} style={{
                              padding: '5px 10px', borderRadius: 'var(--radius-md)',
                              border: '1px solid #10b981', backgroundColor: '#10b98122',
                              color: '#10b981', cursor: 'pointer', fontSize: '11px', fontWeight: '600',
                            }}>
                              {lc('إتمام', 'Done')}
                            </button>
                          )}
                          {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                            <button onClick={() => updateStatus(appt.id, 'cancelled')} title={lc('إلغاء', 'Cancel')} style={{
                              padding: '5px 10px', borderRadius: 'var(--radius-md)',
                              border: '1px solid #ef4444', backgroundColor: '#ef444422',
                              color: '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: '600',
                            }}>
                              {lc('إلغاء', 'Cancel')}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {showModal && (
        <NewAppointmentModal
          isAr={isAr}
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); loadAppointments() }}
        />
      )}
    </div>
  )
}