'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import '@/styles/datepicker.css'

interface DateRangePickerProps {
  from: string
  to: string
  onChange: (from: string, to: string, preset?: string) => void
}

type Preset = {
  id: string
  labelAr: string
  labelEn: string
}

const PRESETS: Preset[] = [
  { id: 'today',    labelAr: 'اليوم',        labelEn: 'Today' },
  { id: 'yesterday',labelAr: 'أمس',          labelEn: 'Yesterday' },
  { id: '7days',    labelAr: '٧ أيام',       labelEn: '7 Days' },
  { id: '30days',   labelAr: '٣٠ يوم',       labelEn: '30 Days' },
  { id: '3months',  labelAr: '٣ أشهر',       labelEn: '3 Months' },
  { id: '6months',  labelAr: '٦ أشهر',       labelEn: '6 Months' },
  { id: '1year',    labelAr: 'سنة كاملة',    labelEn: '1 Year' },
  { id: 'custom',   labelAr: 'مخصص',         labelEn: 'Custom' },
]

function toSaudiDate(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })
}

function getPresetRange(id: string): { from: string; to: string } {
  const now = new Date()
  const today = toSaudiDate(now)
  switch (id) {
    case 'today':     return { from: today, to: today }
    case 'yesterday': { const d = new Date(now); d.setDate(d.getDate()-1); const y = toSaudiDate(d); return { from: y, to: y } }
    case '7days':     { const d = new Date(now); d.setDate(d.getDate()-6); return { from: toSaudiDate(d), to: today } }
    case '30days':    { const d = new Date(now); d.setDate(d.getDate()-29); return { from: toSaudiDate(d), to: today } }
    case '3months':   { const d = new Date(now); d.setMonth(d.getMonth()-3); return { from: toSaudiDate(d), to: today } }
    case '6months':   { const d = new Date(now); d.setMonth(d.getMonth()-6); return { from: toSaudiDate(d), to: today } }
    case '1year':     { const d = new Date(now); d.setFullYear(d.getFullYear()-1); return { from: toSaudiDate(d), to: today } }
    default:          return { from: today, to: today }
  }
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const [open, setOpen] = useState(false)
  const [activePreset, setActivePreset] = useState('today')
  const [selecting, setSelecting] = useState<'from' | 'to'>('from')
  const [tempFrom, setTempFrom] = useState(from)
  const [tempTo, setTempTo] = useState(to)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const ref = useRef<HTMLDivElement>(null)

  const today = toSaudiDate(new Date())

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectPreset(id: string) {
    setActivePreset(id)
    if (id === 'custom') return
    const range = getPresetRange(id)
    setTempFrom(range.from)
    setTempTo(range.to)
    onChange(range.from, range.to, id)
    setOpen(false)
  }

  function handleDayClick(dateStr: string) {
    if (selecting === 'from') {
      setTempFrom(dateStr)
      setTempTo(dateStr)
      setSelecting('to')
    } else {
      if (dateStr < tempFrom) {
        setTempTo(tempFrom)
        setTempFrom(dateStr)
      } else {
        setTempTo(dateStr)
      }
      setSelecting('from')
    }
  }

  function applyCustom() {
    onChange(tempFrom, tempTo, 'custom')
    setOpen(false)
  }

  const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAY_NAMES_AR   = ['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت']
  const DAY_NAMES_EN   = ['Su','Mo','Tu','We','Th','Fr','Sa']

  const daysInMonth  = getDaysInMonth(calYear, calMonth)
  const firstDay     = getFirstDayOfMonth(calYear, calMonth)
  const prevDays     = getDaysInMonth(calYear, calMonth - 1)

  const cells: { date: string; day: number; otherMonth: boolean }[] = []
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(calYear, calMonth - 1, prevDays - i)
    cells.push({ date: toSaudiDate(d), day: prevDays - i, otherMonth: true })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(calYear, calMonth, i)
    cells.push({ date: toSaudiDate(d), day: i, otherMonth: false })
  }
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(calYear, calMonth + 1, i)
    cells.push({ date: toSaudiDate(d), day: i, otherMonth: true })
  }

  function getDayClass(cell: { date: string; otherMonth: boolean }) {
    const classes = ['drp-cal-day']
    if (cell.otherMonth) classes.push('other-month')
    if (cell.date === today) classes.push('today')
    if (cell.date === tempFrom && cell.date === tempTo) classes.push('selected')
    else if (cell.date === tempFrom) classes.push('range-start')
    else if (cell.date === tempTo) classes.push('range-end')
    else if (cell.date > tempFrom && cell.date < tempTo) classes.push('in-range')
    return classes.join(' ')
  }

  const displayLabel = activePreset !== 'custom'
    ? PRESETS.find(p => p.id === activePreset)?.[isRtl ? 'labelAr' : 'labelEn']
    : `${from} — ${to}`

  return (
    <div className="drp-wrapper" ref={ref}>
      <button className="drp-trigger" onClick={() => setOpen(!open)}>
        <Calendar size={14} />
        {displayLabel}
      </button>

      {open && (
        <div className="drp-dropdown">
          {/* Presets */}
          <div className="drp-presets">
            {PRESETS.map(p => (
              <button
                key={p.id}
                className={`drp-preset-btn ${activePreset === p.id ? 'active' : ''}`}
                onClick={() => selectPreset(p.id)}
              >
                {isRtl ? p.labelAr : p.labelEn}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="drp-calendar">
              <div className="drp-cal-header">
                <button className="drp-cal-nav" onClick={() => {
                  if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
                  else setCalMonth(m => m - 1)
                }}>
                  <ChevronLeft size={14} />
                </button>
                <span className="drp-cal-title">
                  {isRtl ? MONTH_NAMES_AR[calMonth] : MONTH_NAMES_EN[calMonth]} {calYear}
                </span>
                <button className="drp-cal-nav" onClick={() => {
                  if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
                  else setCalMonth(m => m + 1)
                }}>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="drp-cal-grid">
                {(isRtl ? DAY_NAMES_AR : DAY_NAMES_EN).map(d => (
                  <div key={d} className="drp-cal-day-name">{d}</div>
                ))}
                {cells.map((cell, i) => (
                  <div key={i} className={getDayClass(cell)} onClick={() => {
                    setActivePreset('custom')
                    handleDayClick(cell.date)
                  }}>
                    {cell.day}
                  </div>
                ))}
              </div>
            </div>

            <div className="drp-footer">
              <span className="drp-selected-range">
                {tempFrom} — {tempTo}
              </span>
              <div className="drp-footer-btns">
                <button className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button className="btn btn-primary btn-sm" onClick={applyCustom}>
                  {isRtl ? 'تطبيق' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}