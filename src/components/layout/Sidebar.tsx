'use client'

import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { clearSession } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Users, Wrench,
  BarChart3, GitBranch, UserCog, Receipt,
  Tag, Settings, LogOut, ChevronLeft, ChevronRight,
  DollarSign, RefreshCw,
} from 'lucide-react'
import '@/styles/sidebar.css'

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  session: any
}

export default function Sidebar({ collapsed, setCollapsed, session }: SidebarProps) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { href: '/dashboard',           icon: LayoutDashboard, label: t('dashboard') },
    { href: '/dashboard/orders',    icon: ShoppingCart,    label: t('orders') },
    { href: '/dashboard/services',  icon: Wrench,          label: t('services') },
    { href: '/dashboard/customers', icon: Users,           label: t('customers') },
    { href: '/dashboard/reports',   icon: BarChart3,       label: t('reports') },
    { href: '/dashboard/branches',  icon: GitBranch,       label: t('branches') },
    { href: '/dashboard/employees', icon: UserCog,         label: t('employees') },
    { href: '/dashboard/expenses',  icon: DollarSign,      label: t('expenses') },
    { href: '/dashboard/coupons',   icon: Tag,             label: t('coupons') },
    { href: '/dashboard/sync',      icon: RefreshCw,       label: t('sync') },
    { href: '/dashboard/settings',  icon: Settings,        label: t('settings') },
  ]

  function handleLogout() {
    clearSession()
    document.cookie = 'token=; path=/; max-age=0'
    router.push(`/${locale}/login`)
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname.endsWith('/dashboard')
    return pathname.includes(href)
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span>S</span>
        </div>
        {!collapsed && (
          <div className="sidebar-brand">
            <h2>Sefay</h2>
            <p>{session?.tenant_name || 'ERP System'}</p>
          </div>
        )}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {locale === 'ar'
            ? (collapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />)
            : (collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />)
          }
        </button>
      </div>

      <nav className="sidebar-nav">
        {!collapsed && (
          <span className="sidebar-section-title">
            {locale === 'ar' ? 'القائمة' : 'MENU'}
          </span>
        )}
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href as any}
            className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
          >
            <item.icon className="sidebar-item-icon" size={18} />
            {!collapsed && (
              <span className="sidebar-item-label">{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout}>
          <div className="sidebar-user-avatar">
            {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{session?.user?.name}</div>
              <div className="sidebar-user-role">{session?.user?.role}</div>
            </div>
          )}
          {!collapsed && <LogOut size={16} color="var(--color-text-muted)" />}
        </div>
      </div>
    </aside>
  )
}