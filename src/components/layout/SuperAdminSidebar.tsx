'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  BarChart3,
  Bell,
  Shield,
  Settings,
  Package,
  MessageSquare,
  Flag,
  UserCheck,
  Zap,
  Terminal,
  Database,
  HeadphonesIcon,
} from 'lucide-react'

export default function SuperAdminSidebar() {
  const pathname = usePathname()
  const { locale } = useParams<{ locale: string }>()
  const t = useTranslations('superadmin.nav')

  const links = [
    { href: `/${locale}/superadmin`,                label: t('overview'),       icon: LayoutDashboard },
    { href: `/${locale}/superadmin/tenants`,         label: t('tenants'),        icon: Building2 },
    { href: `/${locale}/superadmin/subscriptions`,   label: t('subscriptions'),  icon: CreditCard },
    { href: `/${locale}/superadmin/plans`,           label: t('plans'),          icon: Package },
    { href: `/${locale}/superadmin/impersonate`,     label: t('impersonate'),    icon: UserCheck },
    { href: `/${locale}/superadmin/feature-flags`,   label: t('featureFlags'),   icon: Flag },
    { href: `/${locale}/superadmin/reports`,         label: t('reports'),        icon: BarChart3 },
    { href: `/${locale}/superadmin/notifications`,   label: t('notifications'),  icon: Bell },
    { href: `/${locale}/superadmin/communications`,  label: t('communications'), icon: MessageSquare },
    { href: `/${locale}/superadmin/automation`,      label: t('automation'),     icon: Zap },
    { href: `/${locale}/superadmin/developer`,       label: t('developer'),      icon: Terminal },
    { href: `/${locale}/superadmin/backup`,          label: t('backup'),         icon: Database },
    { href: `/${locale}/superadmin/support`,         label: t('support'),        icon: HeadphonesIcon },
    { href: `/${locale}/superadmin/settings`,        label: t('settings'),       icon: Settings },
  ]

  return (
    <aside className="w-64 min-h-screen bg-[#141720] text-white flex flex-col border-l border-[#1e2130]">
      <div className="p-6 border-b border-[#1e2130]">
        <p className="text-xs text-gray-500">Super Admin</p>
        <h1 className="text-lg font-bold text-white">Sefay</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              pathname === href
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-[#1e2130] hover:text-white',
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-[#1e2130]">
        <p className="text-xs text-gray-500 text-center">Sefay © 2026</p>
      </div>
    </aside>
  )
}