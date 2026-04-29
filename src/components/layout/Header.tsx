'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Bell, Menu, Globe, ChevronDown, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import '@/styles/dashboard.css'

interface HeaderProps {
  session: any
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen?: boolean
  setMobileOpen?: (v: boolean) => void
}

export default function Header({ session, collapsed, setCollapsed, mobileOpen, setMobileOpen }: HeaderProps) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const [branches,       setBranches]       = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<any>(null)
  const [branchDropdown, setBranchDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadBranches() }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBranchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadBranches() {
    try {
      const s = getSession()
      if (!s) return
      const { data } = await supabase
        .from('branches')
        .select('id, name')
        .eq('tenant_id', s.tenant_id)
        .eq('active', true)
        .order('name')
      setBranches(data || [])
      const current = data?.find((b: any) => b.id === s.branch_id)
      setSelectedBranch(current || data?.[0] || null)
    } catch (e) { console.error(e) }
  }

  function selectBranch(branch: any) {
    setSelectedBranch(branch)
    setBranchDropdown(false)
    const s = getSession()
    if (s) {
      const updated = { ...s, branch_id: branch.id, branch_name: branch.name }
      localStorage.setItem('session', JSON.stringify(updated))
    }
    router.refresh()
  }

  function toggleLocale() {
    const newLocale = locale === 'ar' ? 'en' : 'ar'
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPath)
  }

  function getPageTitle() {
    if (pathname.includes('/orders'))    return t('nav.orders')
    if (pathname.includes('/services'))  return t('nav.services')
    if (pathname.includes('/customers')) return t('nav.customers')
    if (pathname.includes('/reports'))   return t('nav.reports')
    if (pathname.includes('/branches'))  return t('nav.branches')
    if (pathname.includes('/employees')) return t('nav.employees')
    if (pathname.includes('/expenses'))  return t('nav.expenses')
    if (pathname.includes('/coupons'))   return t('nav.coupons')
    if (pathname.includes('/settings'))  return t('nav.settings')
    return t('nav.dashboard')
  }

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-left">
        {/* Desktop: collapse sidebar | Mobile: open/close sidebar */}
        <button
  className="btn btn-ghost btn-icon"
  onClick={() => {
    console.log('clicked', mobileOpen)
    setMobileOpen?.(!mobileOpen)
  }}
>
  {mobileOpen ? <X size={18} /> : <Menu size={18} />}
</button>
        <h1 className="dashboard-header-title" style={{ fontSize: 'clamp(13px, 2vw, 16px)' }}>
          {getPageTitle()}
        </h1>
      </div>

      <div className="dashboard-header-right" style={{ gap: 'clamp(6px, 1.5vw, 12px)' }}>

        {/* Branch Dropdown */}
        {branches.length > 0 && (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setBranchDropdown(!branchDropdown)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: 'clamp(4px, 1vw, 6px) clamp(8px, 1.5vw, 12px)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
                fontSize: 'clamp(11px, 1.5vw, 13px)',
                fontWeight: '600', cursor: 'pointer',
                transition: 'var(--transition)',
                maxWidth: 'clamp(100px, 20vw, 200px)',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              🏬 {selectedBranch?.name || (locale === 'ar' ? 'فرع' : 'Branch')}
              <ChevronDown size={12} style={{ flexShrink: 0 }} />
            </button>

            {branchDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                insetInlineStart: '0',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                minWidth: '180px',
                zIndex: 1000,
                overflow: 'hidden',
              }}>
                {branches.map(b => (
                  <div
                    key={b.id}
                    onClick={() => selectBranch(b)}
                    style={{
                      padding: '10px 14px', fontSize: '13px', fontWeight: '600',
                      color: selectedBranch?.id === b.id ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      backgroundColor: selectedBranch?.id === b.id ? 'var(--color-primary-light)' : 'transparent',
                      cursor: 'pointer', transition: 'var(--transition)',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                    onMouseEnter={e => { if (selectedBranch?.id !== b.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-bg-tertiary)' }}
                    onMouseLeave={e => { if (selectedBranch?.id !== b.id) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                  >
                    🏬 {b.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Language Toggle */}
        <button className="lang-btn" onClick={toggleLocale} style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', padding: 'clamp(4px, 1vw, 6px) clamp(6px, 1.5vw, 12px)' }}>
          <Globe size={14} style={{ display: 'inline', marginInlineEnd: '4px' }} />
          {locale === 'ar' ? 'EN' : 'AR'}
        </button>

        {/* Notifications */}
        <button className="notification-btn">
          <Bell size={16} />
        </button>

        {/* User — يختفي على الموبايل الصغير */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-tertiary)',
          cursor: 'pointer',
        }}
          className="header-user-btn"
        >
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid var(--color-primary-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)',
            flexShrink: 0,
          }}>
            {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="header-user-info">
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
              {session?.user?.name || ''}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
              {session?.user?.role || ''}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}