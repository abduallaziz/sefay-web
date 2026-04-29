'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, getTodayDate } from '@/lib/utils'
import { Expense } from '@/types'
import { Search, RefreshCw, Plus, X, Save, Trash2, RepeatIcon } from 'lucide-react'
import '@/styles/modals.css'
import '@/styles/forms.css'

type RecurringType = 'none' | 'daily' | 'weekly' | 'monthly'

export default function ExpensesPage() {
  const t = useTranslations('expenses')
  const locale = useLocale()

  const [expenses,  setExpenses]  = useState<Expense[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [tab,       setTab]       = useState<'all' | 'recurring'>('all')

  const [title,        setTitle]        = useState('')
  const [amount,       setAmount]       = useState('')
  const [category,     setCategory]     = useState('عام')
  const [notes,        setNotes]        = useState('')
  const [date,         setDate]         = useState(getTodayDate())
  const [recurring,    setRecurring]    = useState<RecurringType>('none')
  const [recurringDay, setRecurringDay] = useState('1')

  const DEFAULT_CATS = ['عام','رواتب','إيجار','كهرباء','ماء','صيانة','مشتريات','تأمين','ضرائب','أخرى']
  const [extraCats, setExtraCats] = useState<string[]>([])
  const CATS = [...new Set([...DEFAULT_CATS, ...extraCats])]

  const RECURRING_OPTS: { id: RecurringType; labelAr: string; labelEn: string }[] = [
    { id: 'none',    labelAr: 'مره واحده', labelEn: 'One time' },
    { id: 'daily',   labelAr: 'يومي',      labelEn: 'Daily' },
    { id: 'weekly',  labelAr: 'أسبوعي',    labelEn: 'Weekly' },
    { id: 'monthly', labelAr: 'شهري',      labelEn: 'Monthly' },
  ]

  useEffect(() => { loadExpenses() }, [])

  async function loadExpenses() {
    setLoading(true)
    try {
      const res = await api.expenses.getAll()
      const data = res.data || []
      setExpenses(data)
      const cats = data
        .map((e: any) => e.category)
        .filter((c: string) => c && !DEFAULT_CATS.includes(c))
      setExtraCats([...new Set(cats)] as string[])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  function openNew() {
    setTitle(''); setAmount(''); setCategory('عام')
    setNotes(''); setDate(getTodayDate())
    setRecurring('none'); setRecurringDay('1')
    setShowModal(true)
  }

  function addNewCategory() {
    const cat = prompt(locale === 'ar' ? 'اسم الفئة الجديدة:' : 'New category name:')
    if (cat?.trim()) {
      setExtraCats(prev => [...new Set([...prev, cat.trim()])])
    }
  }

  async function saveExpense() {
    if (!title.trim() || !amount) return
    setSaving(true)
    try {
      await api.expenses.create({
        title: title.trim(),
        amount: Number(amount),
        category,
        notes: notes || null,
        date,
        recurring_type: recurring,
        recurring_day: recurring === 'monthly' ? Number(recurringDay) : null,
      })
      setShowModal(false)
      loadExpenses()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function deleteExpense(id: string) {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) return
    try {
      await api.expenses.delete(id)
      loadExpenses()
    } catch (e) { console.error(e) }
  }

  const allFiltered = expenses.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.toLowerCase().includes(search.toLowerCase())
  )

  const recurringExpenses = expenses.filter(e =>
    (e as any).recurring_type && (e as any).recurring_type !== 'none'
  )
  const filtered = tab === 'recurring' ? recurringExpenses : allFiltered
  const total = allFiltered.reduce((s, e) => s + e.amount, 0)

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{t('title')}</h2>
          <p className="dashboard-page-subtitle">
            {locale === 'ar' ? 'الإجمالي:' : 'Total:'}{' '}
            {formatCurrency(total, locale === 'ar' ? 'ar-SA' : 'en-US')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadExpenses}>
            <RefreshCw size={14} />
            {locale === 'ar' ? 'تحديث' : 'Refresh'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={addNewCategory}>
            <Plus size={14} />
            {locale === 'ar' ? 'إضافة فئة' : 'Add Category'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={openNew}>
            <Plus size={14} />
            {t('addExpense')}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h3 className="modal-title">
                {locale === 'ar' ? '➕ إضافة مصروف' : '➕ Add Expense'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={14} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('expenseTitle')} <span>*</span></label>
                  <input id="exp-title" name="exp-title" className="form-input"
                    value={title} onChange={e => setTitle(e.target.value)}
                    placeholder={locale === 'ar' ? 'عنوان المصروف' : 'Expense title'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('amount')} (ر.س) <span>*</span></label>
                  <input id="exp-amount" name="exp-amount" className="form-input"
                    type="number" min="0" value={amount}
                    onChange={e => setAmount(e.target.value)} placeholder="0" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('category')}</label>
                  <select id="exp-cat" name="exp-cat" className="form-input form-select"
                    value={category} onChange={e => setCategory(e.target.value)}>
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('date')}</label>
                  <input id="exp-date" name="exp-date" className="form-input"
                    type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <RepeatIcon size={13} style={{ display: 'inline', marginInlineEnd: '6px' }} />
                  {locale === 'ar' ? 'التكرار التلقائي' : 'Auto Repeat'}
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {RECURRING_OPTS.map(r => (
                    <button key={r.id} onClick={() => setRecurring(r.id)}
                      style={{
                        padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${recurring === r.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        backgroundColor: recurring === r.id ? 'var(--color-primary-light)' : 'var(--color-bg-tertiary)',
                        color: recurring === r.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                      }}>
                      {locale === 'ar' ? r.labelAr : r.labelEn}
                    </button>
                  ))}
                </div>

                {recurring === 'monthly' && (
                  <div style={{ marginTop: '10px' }}>
                    <label className="form-label">
                      {locale === 'ar' ? 'يوم الشهر (1-28)' : 'Day of month (1-28)'}
                    </label>
                    <input id="exp-day" name="exp-day" className="form-input"
                      type="number" min="1" max="28"
                      value={recurringDay} onChange={e => setRecurringDay(e.target.value)}
                      style={{ width: '100px' }} />
                  </div>
                )}

                {recurring !== 'none' && (
                  <div style={{
                    marginTop: '8px', padding: '8px 12px',
                    backgroundColor: 'var(--color-primary-light)',
                    border: '1px solid var(--color-primary-border)',
                    borderRadius: 'var(--radius-sm)', fontSize: '12px',
                    color: 'var(--color-primary)',
                  }}>
                    🔁 {locale === 'ar'
                      ? `سيتم تسجيل هذا المصروف تلقائياً ${RECURRING_OPTS.find(r => r.id === recurring)?.labelAr}`
                      : `This expense will be automatically recorded ${RECURRING_OPTS.find(r => r.id === recurring)?.labelEn}`}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">{t('notes')}</label>
                <textarea id="exp-notes" name="exp-notes"
                  className="form-input form-textarea"
                  value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder={locale === 'ar' ? 'ملاحظات...' : 'Notes...'} />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button className="btn btn-primary" onClick={saveExpense} disabled={saving}>
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
              <input id="exp-search" name="exp-search"
                placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="table-filters">
          <button className={`table-filter-btn ${tab === 'all' ? 'active' : ''}`}
            onClick={() => setTab('all')}>
            {locale === 'ar' ? 'الكل' : 'All'}
          </button>
          <button className={`table-filter-btn ${tab === 'recurring' ? 'active' : ''}`}
            onClick={() => setTab('recurring')}>
            🔁 {locale === 'ar' ? 'التلقائية' : 'Recurring'}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('expenseTitle')}</th>
                <th>{t('category')}</th>
                <th>{t('amount')}</th>
                <th>{locale === 'ar' ? 'التكرار' : 'Recurring'}</th>
                <th>{t('date')}</th>
                <th>{t('notes')}</th>
                <th>{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{e.title}</td>
                  <td><span className="badge badge-muted">{e.category}</span></td>
                  <td style={{ fontWeight: '700', color: 'var(--color-danger)' }}>
                    - {formatCurrency(e.amount, locale === 'ar' ? 'ar-SA' : 'en-US')}
                  </td>
                  <td>
                    {(e as any).recurring_type && (e as any).recurring_type !== 'none' ? (
                      <span className="badge badge-primary">
                        🔁 {RECURRING_OPTS.find(r => r.id === (e as any).recurring_type)?.[locale === 'ar' ? 'labelAr' : 'labelEn']}
                        {(e as any).recurring_type === 'monthly' && (e as any).recurring_day
                          ? ` (${locale === 'ar' ? 'يوم' : 'day'} ${(e as any).recurring_day})`
                          : ''}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {formatDate(e.date, locale === 'ar' ? 'ar-SA' : 'en-US')}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{e.notes || '—'}</td>
                  <td>
                    <button className="action-btn danger" onClick={() => deleteExpense(e.id)}
                      title={locale === 'ar' ? 'حذف' : 'Delete'}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="table-empty">
                      <div className="table-empty-icon">💸</div>
                      <div className="table-empty-text">
                        {locale === 'ar' ? 'لا توجد مصاريف' : 'No expenses found'}
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