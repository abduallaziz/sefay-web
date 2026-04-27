'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import '@/styles/datepicker.css'

interface Props {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}

const PRESETS_AR = ['اليوم','امس','اسبوع','شهر','شهرين','ثلاث اشهر','سته اشهر','سنه','تارخ مخصص']
const PRESETS_EN = ['Today','Yesterday','Week','Month','2 Months','3 Months','6 Months','Year','Custom']

function toSaudiDate(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })
}

function getPresetRange(idx: number): { from: string; to: string } {
  const now = new Date()
  const today = toSaudiDate(now)
  const d = (n: number) => { const x = new Date(now); x.setDate(x.getDate() + n); return toSaudiDate(x) }
  const m = (n: number) => { const x = new Date(now); x.setMonth(x.getMonth() + n); return toSaudiDate(x) }
  const y = (n: number) => { const x = new Date(now); x.setFullYear(x.getFullYear() + n); return toSaudiDate(x) }
  switch (idx) {
    case 0: return { from: today, to: today }
    case 1: return { from: d(-1), to: d(-1) }
    case 2: return { from: d(-6), to: today }
    case 3: return { from: m(-1), to: today }
    case 4: return { from: m(-2), to: today }
    case 5: return { from: m(-3), to: today }
    case 6: return { from: m(-6), to: today }
    case 7: return { from: y(-1), to: today }
    default: return { from: today, to: today }
  }
}

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y: number, m: number) { return new Date(y, m, 1).getDay() }

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_AR   = ['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت']
const DAYS_EN   = ['Su','Mo','Tu','We','Th','Fr','Sa']

export default function DateRangePicker({ from, to, onChange }: Props) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [open,      setOpen]      = useState(false)
  const [preset,    setPreset]    = useState(0)
  const [tempFrom,  setTempFrom]  = useState(from)
  const [tempTo,    setTempTo]    = useState(to)
  const [selecting, setSelecting] = useState<'from'|'to'>('from')
  const [calYear,   setCalYear]   = useState(new Date().getFullYear())
  const [calMonth,  setCalMonth]  = useState(new Date().getMonth())
  const ref = useRef<HTMLDivElement>(null)
  const today = toSaudiDate(new Date())

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function clickPreset(idx: number) {
    setPreset(idx)
    if (idx === 8) return // custom
    const r = getPresetRange(idx)
    setTempFrom(r.from)
    setTempTo(r.to)
    setSelecting('from')
  }

  function clickDay(date: string) {
    setPreset(8)
    if (selecting === 'from') {
      setTempFrom(date); setTempTo(date); setSelecting('to')
    } else {
      if (date < tempFrom) { setTempFrom(date); setTempTo(tempFrom) }
      else setTempTo(date)
      setSelecting('from')
    }
  }

  function apply() {
    onChange(tempFrom, tempTo)
    setOpen(false)
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1) }
    else setCalMonth(m => m-1)
  }

  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1) }
    else setCalMonth(m => m+1)
  }

  // بناء أيام التقويم
  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay    = getFirstDay(calYear, calMonth)
  const prevDays    = getDaysInMonth(calYear, calMonth-1)
  const cells: { date: string; day: number; other: boolean }[] = []

  for (let i = firstDay-1; i >= 0; i--) {
    const d = new Date(calYear, calMonth-1, prevDays-i)
    cells.push({ date: toSaudiDate(d), day: prevDays-i, other: true })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ date: toSaudiDate(new Date(calYear, calMonth, i)), day: i, other: false })
  }
  for (let i = 1; cells.length < 42; i++) {
    cells.push({ date: toSaudiDate(new Date(calYear, calMonth+1, i)), day: i, other: true })
  }

  function dayClass(cell: { date: string; other: boolean }) {
    if (cell.other) return 'drp-cal-day other-month'
    if (cell.date === today && cell.date !== tempFrom && cell.date !== tempTo) return 'drp-cal-day today'
    if (cell.date === tempFrom && cell.date === tempTo) return 'drp-cal-day selected'
    if (cell.date === tempFrom) return 'drp-cal-day range-start'
    if (cell.date === tempTo)   return 'drp-cal-day range-end'
    if (cell.date > tempFrom && cell.date < tempTo) return 'drp-cal-day in-range'
    return 'drp-cal-day'
  }

  const label = preset === 8 ? `${from} — ${to}` : (isAr ? PRESETS_AR[preset] : PRESETS_EN[preset])

  return (
    <div className="drp-wrapper" ref={ref}>
      <button className="drp-trigger" onClick={() => setOpen(!open)}>
      <Calendar size={14} />
      <span>{from === to ? from : `${from} — ${to}`}</span>
    </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          insetInlineStart: '0',
          zIndex: 1000,
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: isAr ? 'row' : 'row-reverse',
          overflow: 'hidden',
          minWidth: '520px',
        }}>
          {/* Presets — على اليمين للعربي */}
          <div style={{
            width: '140px',
            borderInlineStart: '1px solid var(--color-border)',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            backgroundColor: 'var(--color-bg-tertiary)',
          }}>
            {(isAr ? PRESETS_AR : PRESETS_EN).map((p, i) => (
              <button key={i} onClick={() => clickPreset(i)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: preset === i ? '700' : '500',
                  color: preset === i ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  backgroundColor: preset === i ? 'var(--color-primary-light)' : 'transparent',
                  border: preset === i ? '1px solid var(--color-primary-border)' : '1px solid transparent',
                  textAlign: 'start',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}>
                {p}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <button className="drp-cal-nav" onClick={prevMonth}><ChevronRight size={14} /></button>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  {isAr ? MONTHS_AR[calMonth] : MONTHS_EN[calMonth]} {calYear}
                </span>
                <button className="drp-cal-nav" onClick={nextMonth}><ChevronLeft size={14} /></button>
              </div>

              {/* Days Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                {(isAr ? DAYS_AR : DAYS_EN).map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', padding: '4px 0' }}>
                    {d}
                  </div>
                ))}
                {cells.map((cell, i) => (
                  <div key={i} className={dayClass(cell)} onClick={() => !cell.other && clickDay(cell.date)}
                    style={{ cursor: cell.other ? 'default' : 'pointer' }}>
                    {cell.day}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px',
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-tertiary)',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {tempFrom} — {tempTo}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button className="btn btn-primary btn-sm" onClick={apply}>
                  {isAr ? 'تطبيق' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}