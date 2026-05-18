'use client'

import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS_AR = ['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت']
const DAYS_EN = ['Mo','Tu','We','Th','Fr','Sa','Su']

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  locale?: string
}

type View = 'days' | 'months' | 'years'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return (day + 6) % 7 // Monday = 0
}

export function DatePicker({ value, onChange, placeholder = 'اختر تاريخ', locale = 'ar' }: DatePickerProps) {
  const isAr = locale === 'ar'
  const today = new Date()
  const selected = value ? new Date(value) : null

  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('days')
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth())
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor((selected?.getFullYear() ?? today.getFullYear()) / 10) * 10)

  const months = isAr ? MONTHS_AR : MONTHS_EN
  const days = isAr ? DAYS_AR : DAYS_EN

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const displayLabel = selected
    ? `${selected.getDate()} ${months[selected.getMonth()]} ${selected.getFullYear()}`
    : placeholder

  function selectDate(day: number) {
    const month = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${viewYear}-${month}-${d}`)
    setOpen(false)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 bg-[#141720] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 w-44">
          <CalendarIcon size={14} className="text-gray-400" />
          <span className={selected ? 'text-white' : 'text-gray-500'}>{displayLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 bg-[#141720] border border-[#1e2130] rounded-xl" align="start">
        <div className="p-3">

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => view === 'days' ? prevMonth() : view === 'years' ? setYearRangeStart(y => y - 10) : null}
              className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-[#1e2130]">
              <ChevronLeftIcon size={16} />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setView(v => v === 'months' ? 'days' : 'months')}
                className="text-sm font-medium text-white hover:text-blue-400 px-2 py-1 rounded-md hover:bg-[#1e2130]"
              >
                {months[viewMonth]}
              </button>
              <button
                onClick={() => setView(v => v === 'years' ? 'days' : 'years')}
                className="text-sm font-medium text-white hover:text-blue-400 px-2 py-1 rounded-md hover:bg-[#1e2130]"
              >
                {viewYear}
              </button>
            </div>

            <button onClick={() => view === 'days' ? nextMonth() : view === 'years' ? setYearRangeStart(y => y + 10) : null}
              className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-[#1e2130]">
              <ChevronRightIcon size={16} />
            </button>
          </div>

          {/* Days View */}
          {view === 'days' && (
            <>
              <div className="grid grid-cols-7 mb-1">
                {days.map(d => (
                  <div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {cells.map((day, i) => {
                  if (!day) return <div key={i} />
                  const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
                  const isSelected = selected && day === selected.getDate() && viewMonth === selected.getMonth() && viewYear === selected.getFullYear()
                  return (
                    <button
                      key={i}
                      onClick={() => selectDate(day)}
                      className={`h-8 w-8 mx-auto rounded-md text-xs font-medium transition-colors
                        ${isSelected ? 'bg-blue-600 text-white' : isToday ? 'border border-blue-500 text-white' : 'text-gray-300 hover:bg-[#1e2130] hover:text-white'}`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Months View */}
          {view === 'months' && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {months.map((m, i) => (
                <button
                  key={i}
                  onClick={() => { setViewMonth(i); setView('days') }}
                  className={`py-2 rounded-md text-sm transition-colors
                    ${viewMonth === i ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#1e2130] hover:text-white'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* Years View */}
          {view === 'years' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Array.from({ length: 10 }, (_, i) => yearRangeStart + i).map(y => (
                <button
                  key={y}
                  onClick={() => { setViewYear(y); setView('days') }}
                  className={`py-2 rounded-md text-sm transition-colors
                    ${viewYear === y ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#1e2130] hover:text-white'}`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

        </div>
      </PopoverContent>
    </Popover>
  )
}