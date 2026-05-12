 'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { X } from 'lucide-react'

interface Props {
  isAr: boolean
  selectedDate: string
  onClose: () => void
  onCreated: () => void
}

export default function NewAppointmentModal({ isAr, selectedDate, onClose, onCreated }: Props) {
  const lc = (ar: string, en: string) => isAr ? ar : en

  const [workers, setWorkers]       = useState<any[]>([])
  const [items, setItems]           = useState<any[]>([])
  const [customers, setCustomers]   = useState<any[]>([])
  const [slots, setSlots]           = useState<string[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<any[]>([])

  const [form, setForm] = useState({
    worker_id:   '',
    item_id:     '',
    customer_id: '',
    date:        selectedDate,
    start_time:  '',
    notes:       '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    loadWorkers()
    loadItems()
  }, [])

  useEffect(() => {
    if (form.worker_id && form.date) loadSlots()
    else setSlots([])
  }, [form.worker_id, form.date])

  async function loadWorkers() {
    try {
      const res = await api.workers.getAll()
      setWorkers(res.data || [])
    } catch {}
  }

  async function loadItems() {
    try {
      const res = await api.items.getActive()
      setItems(res.data || [])
    } catch {}
  }

  async function loadSlots() {
    setLoadingSlots(true)
    try {
      const res = await api.appointments.getSlots(form.worker_id, form.date)
      setSlots(res.data?.slots || [])
    } catch {}
    finally { setLoadingSlots(false) }
  }

  async function searchCustomers(q: string) {
    if (q.length < 2) { setCustomerResults([]); return }
    try {
      const res = await api.customers.search(q)
      setCustomerResults(res.data || [])
    } catch {}
  }

  async function submit() {
    if (!form.worker_id || !form.start_time) {
      alert(lc('اختر الموظف والوقت', 'Select worker and time'))
      return
    }
    setSubmitting(true)
    try {
      await api.appointments.create(form)
      onCreated()
    } catch (e: any) {
      alert(e?.response?.data?.message || lc('حدث خطأ', 'Error'))
    } finally { setSubmitting(false) }
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', boxSizing: 'border-box' as const,
    backgroundColor: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: '13px', outline: 'none',
  }

  const labelStyle = {
    fontSize: '12px', fontWeight: '600',
    color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' as const,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: '460px',
        maxHeight: '90vh', overflowY: 'auto',
        padding: '20px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
            {lc('موعد جديد', 'New Appointment')}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* التاريخ */}
          <div>
            <label style={labelStyle}>{lc('التاريخ', 'Date')}</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value, start_time: '' }))}
              style={inputStyle}
            />
          </div>

          {/* الموظف */}
          <div>
            <label style={labelStyle}>{lc('الموظف', 'Worker')}</label>
            <select
              value={form.worker_id}
              onChange={e => setForm(f => ({ ...f, worker_id: e.target.value, start_time: '' }))}
              style={inputStyle}
            >
              <option value="">{lc('اختر الموظف', 'Select worker')}</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* الأوقات المتاحة */}
          <div>
            <label style={labelStyle}>
              {lc('الوقت المتاح', 'Available Slots')}
              {loadingSlots && <span style={{ color: 'var(--color-text-muted)', fontWeight: '400', marginRight: '8px' }}>
                {lc('جاري التحميل...', 'Loading...')}
              </span>}
            </label>
            {slots.length === 0 && form.worker_id && !loadingSlots ? (
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', padding: '8px 0' }}>
                {lc('لا توجد أوقات متاحة', 'No available slots')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {slots.map(slot => (
                  <button key={slot} onClick={() => setForm(f => ({ ...f, start_time: slot }))} style={{
                    padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: '600',
                    border: `1px solid ${form.start_time === slot ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor: form.start_time === slot ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                    color: form.start_time === slot ? '#fff' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}>
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* الخدمة */}
          <div>
            <label style={labelStyle}>{lc('الخدمة (اختياري)', 'Service (optional)')}</label>
            <select
              value={form.item_id}
              onChange={e => setForm(f => ({ ...f, item_id: e.target.value }))}
              style={inputStyle}
            >
              <option value="">{lc('اختر الخدمة', 'Select service')}</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          {/* العميل */}
          <div style={{ position: 'relative' }}>
            <label style={labelStyle}>{lc('العميل (اختياري)', 'Customer (optional)')}</label>
            <input
              value={form.customer_id
                ? (customers.find(c => c.id === form.customer_id)?.name || customerSearch)
                : customerSearch}
              onChange={e => {
                setCustomerSearch(e.target.value)
                setForm(f => ({ ...f, customer_id: '' }))
                searchCustomers(e.target.value)
              }}
              placeholder={lc('ابحث عن عميل...', 'Search customer...')}
              style={inputStyle}
            />
            {customerResults.length > 0 && !form.customer_id && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', marginTop: '4px',
                maxHeight: '140px', overflowY: 'auto',
              }}>
                {customerResults.map(c => (
                  <div key={c.id} onClick={() => {
                    setForm(f => ({ ...f, customer_id: c.id }))
                    setCustomers(prev => [...prev.filter(x => x.id !== c.id), c])
                    setCustomerSearch(c.name)
                    setCustomerResults([])
                  }} style={{
                    padding: '8px 12px', cursor: 'pointer', fontSize: '12px',
                    color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)',
                  }}>
                    <span style={{ fontWeight: '600' }}>{c.name}</span>
                    <span style={{ color: 'var(--color-text-muted)', margin: '0 8px' }}>{c.phone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ملاحظات */}
          <div>
            <label style={labelStyle}>{lc('ملاحظات', 'Notes')}</label>
            <input
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder={lc('ملاحظات اختيارية...', 'Optional notes...')}
              style={inputStyle}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '10px',
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-secondary)',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}>
              {lc('إلغاء', 'Cancel')}
            </button>
            <button onClick={submit} disabled={submitting} style={{
              flex: 2, padding: '10px',
              backgroundColor: 'var(--color-primary)',
              border: 'none', borderRadius: 'var(--radius-md)',
              color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            }}>
              {submitting ? lc('جاري الحفظ...', 'Saving...') : lc('حجز الموعد', 'Book Appointment')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}