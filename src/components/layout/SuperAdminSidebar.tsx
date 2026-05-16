'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/ar/superadmin',               label: 'نظرة عامة',    icon: LayoutDashboard },
  { href: '/ar/superadmin/tenants',        label: 'المشتركين',    icon: Building2 },
  { href: '/ar/superadmin/subscriptions',  label: 'الاشتراكات',   icon: CreditCard },
  { href: '/ar/superadmin/plans',          label: 'الخطط',        icon: Package },
  { href: '/ar/superadmin/impersonate', label: 'دخول بحساب Tenant', icon: '🎭' },
  { href: '/ar/superadmin/reports',        label: 'التقارير',     icon: BarChart3 },
  { href: '/ar/superadmin/notifications',  label: 'الإشعارات',    icon: Bell },
  { href: '/ar/superadmin/communications', label: 'الرسائل',      icon: MessageSquare },
  { href: '/ar/superadmin/audit',          label: 'سجل العمليات', icon: Shield },
  { href: '/ar/superadmin/settings',       label: 'الإعدادات',    icon: Settings },
]

export default function SuperAdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-gray-950 text-white flex flex-col" dir="rtl">
      <div className="p-6 border-b border-gray-800">
        <p className="text-xs text-gray-500">لوحة تحكم</p>
        <h1 className="text-lg font-bold text-white">Super Admin</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              pathname === href
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white',
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 text-center">Sefay © 2026</p>
      </div>
    </aside>
  )
}