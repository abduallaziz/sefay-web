'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Expense } from '@/types'
import { Search, RefreshCw, Plus } from 'lucide-react'

export default function ExpensesPage() {
  const t = useTranslations('expenses')
  const locale = useLocale()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)

  const [title,    setTitle]    = useState('')
  const [amount,   setAmount]   = useState('')
  const [category, setCategory] = useState('عام')
  const [notes,    setNotes]    = useState('')
  const [date,     setDate]     = useState(new Date().toISOString().split('T')[0])

  const CATS = ['عام', 'رواتب', 'إيجار', 'كهرباء', 'ماء', 'صيانة', 'مشتريات', 'أخرى']

  useEffect(() => { loadExpenses() }, [])

  async function loadExpenses() {
    setLoading(true)
    try {
      const session = getSession()
      if (!session) return
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('tenant_id', session.tenant_id)
        .order('date', { ascending: false })
      setExpenses(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function saveExpense() {
    if (!title.trim() || !amount) return
    setSaving(true)
    try {
      const session = getSession()
      if (!session) return
      await supabase.from('expenses').insert({
        tenant_id: session.tenant_id,
        title: title.trim(),
        amount: Number(amount),
        category,
        notes: notes || null,
        date,
      })
      setTitle(''); setAmount(''); setNotes(''); setShowForm(false)
      loadExpenses()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const filtered = expenses.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.toLowerCase().includes(search.toLowerCase())
  )

  const total = expenses.reduce((s, e) => s + e.amount, 0)

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
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} />
            {t('addExpense')}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '16px',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '16px' }}>
            {t('addExpense')}
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('expenseTitle')} <span>*</span></label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder={locale === 'ar' ? 'عنوان المصروف' : 'Expense title'} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('amount')} <span>*</span></label>
              <input className="form-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('category')}</label>
              <select className="form-input form-select" value={category} onChange={e => setCategory(e.target.value)}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('date')}</label>
              <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('notes')}</label>
            <textarea className="form-input form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder={locale === 'ar' ? 'ملاحظات...' : 'Notes...'} />
          </div>
          <div className="form-footer">
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button className="btn btn-primary" onClick={saveExpense} disabled={saving}>
              {saving ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ' : 'Save')}
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">{t('title')}</h3>
          <div className="table-actions">
            <div className="table-search">
              <Search size={14} />
              <input
                placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
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
                <th>{t('expenseTitle')}</th>
                <th>{t('category')}</th>
                <th>{t('amount')}</th>
                <th>{t('date')}</th>
                <th>{t('notes')}</th>
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
                  <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {formatDate(e.date, locale === 'ar' ? 'ar-SA' : 'en-US')}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{e.notes || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5}>
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