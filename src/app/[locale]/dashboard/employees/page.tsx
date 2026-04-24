'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { User } from '@/types'
import { Search, RefreshCw } from 'lucide-react'

export default function EmployeesPage() {
  const t = useTranslations('employees')
  const locale = useLocale()

  const [employees, setEmployees] = useState<User[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')

  useEffect(() => { loadEmployees() }, [])

  async function loadEmployees() {
    setLoading(true)
    try {
      const session = getSession()
      if (!session) return
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', session.tenant_id)
        .order('name')
      setEmployees(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = employees.filter(e =>
  e.name?.toLowerCase().includes(search.toLowerCase()) ||
  (e as any).username?.toLowerCase().includes(search.toLowerCase())
)

  const roleColors: Record<string, string> = {
    superadmin: 'badge-danger',
    owner:      'badge-warning',
    manager:    'badge-primary',
    cashier:    'badge-success',
    worker:     'badge-muted',
  }

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{t('title')}</h2>
          <p className="dashboard-page-subtitle">
            {employees.length} {locale === 'ar' ? 'موظف' : 'employees'}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadEmployees}>
          <RefreshCw size={14} />
          {locale === 'ar' ? 'تحديث' : 'Refresh'}
        </button>
      </div>

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
                <th>{t('employeeName')}</th>
                <th>{locale === 'ar' ? 'اسم المستخدم' : 'Username'}</th>
                <th>{t('role')}</th>
                <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
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
                  <td style={{ color: 'var(--color-text-secondary)' }}>
                    {(emp as any).username || '—'}
                  </td>
                  <td>
                    <span className={`badge ${roleColors[emp.role] || 'badge-muted'}`}>
                      {t(`roles.${emp.role}` as any)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${emp.active ? 'badge-success' : 'badge-danger'}`}>
                      {emp.active
                        ? (locale === 'ar' ? 'مفعّل' : 'Active')
                        : (locale === 'ar' ? 'معطّل' : 'Inactive')}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="table-empty">
                      <div className="table-empty-icon">👥</div>
                      <div className="table-empty-text">
                        {locale === 'ar' ? 'لا يوجد موظفين' : 'No employees found'}
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