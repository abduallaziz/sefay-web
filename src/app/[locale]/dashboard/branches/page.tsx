'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { Branch } from '@/types'
import { Search, RefreshCw, Plus } from 'lucide-react'

export default function BranchesPage() {
  const t = useTranslations('branches')
  const locale = useLocale()

  const [branches, setBranches] = useState<Branch[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => { loadBranches() }, [])

  async function loadBranches() {
    setLoading(true)
    try {
      const session = getSession()
      if (!session) return
      const { data } = await supabase
        .from('branches')
        .select('*')
        .eq('tenant_id', session.tenant_id)
        .order('name')
      setBranches(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = branches.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{t('title')}</h2>
          <p className="dashboard-page-subtitle">
            {branches.length} {locale === 'ar' ? 'فرع' : 'branches'}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadBranches}>
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
                <th>{t('branchName')}</th>
                <th>{t('city')}</th>
                <th>{t('phone')}</th>
                <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                    🏬 {b.name}
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{b.city || '—'}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{b.phone || '—'}</td>
                  <td>
                    <span className={`badge ${b.active ? 'badge-success' : 'badge-danger'}`}>
                      {b.active
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
                      <div className="table-empty-icon">🏬</div>
                      <div className="table-empty-text">
                        {locale === 'ar' ? 'لا توجد فروع' : 'No branches found'}
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