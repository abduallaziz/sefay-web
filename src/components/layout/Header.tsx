'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, Menu, Globe } from 'lucide-react'
import '@/styles/dashboard.css'

interface HeaderProps {
  session: any
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}

export default function Header({ session, collapsed, setCollapsed }: HeaderProps) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

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
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Menu size={18} />
        </button>
        <h1 className="dashboard-header-title">{getPageTitle()}</h1>
      </div>

      <div className="dashboard-header-right">
        {/* Branch Info */}
        {session?.branch_name && (
          <div className="branch-selector">
            🏬 {session.branch_name}
          </div>
        )}

        {/* Language Toggle */}
        <button className="lang-btn" onClick={toggleLocale}>
          <Globe size={14} style={{ display: 'inline', marginInlineEnd: '4px' }} />
          {locale === 'ar' ? 'EN' : 'AR'}
        </button>

        {/* Notifications */}
        <button className="notification-btn">
          <Bell size={16} />
        </button>

        {/* User */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-tertiary)',
          cursor: 'pointer',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid var(--color-primary-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--color-primary)',
          }}>
            {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
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