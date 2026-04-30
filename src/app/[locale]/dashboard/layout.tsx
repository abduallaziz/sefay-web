'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import '@/styles/dashboard.css'
import '@/styles/tables.css'
import '@/styles/buttons.css'
import '@/styles/forms.css'
import '@/styles/modals.css'
import '@/styles/reports.css'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const locale   = useLocale()

  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile,   setIsMobile]   = useState(false)
  const [session,    setSession]    = useState<any>(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.push(`/${locale}/login`); return }
    setSession(s)
    checkOnboarding(s.tenant_id)
  }, [])

  useEffect(() => {
    function checkMobile() {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  async function checkOnboarding(tenantId: string) {
    try {
      const { data } = await supabase
        .from('tenants')
        .select('onboarded')
        .eq('id', tenantId)
        .single()

      if (data && !data.onboarded) {
        router.replace(`/${locale}/onboarding`)
        return
      }
    } catch (e) {
      console.error('Onboarding check failed:', e)
      // فشل التحقق → نسمح بالدخول (fail open)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-primary)', fontSize: '14px', fontWeight: '700',
      }}>
        Loading...
      </div>
    )
  }

  const mainMargin = isMobile ? '0' : collapsed ? '70px' : 'var(--sidebar-width)'

  return (
    <div className="dashboard-layout">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        session={session}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div
        className={`dashboard-main ${collapsed ? 'collapsed' : ''}`}
        style={{ marginInlineStart: mainMargin }}
      >
        <Header
          session={session}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <main className="dashboard-page">
          {children}
        </main>
      </div>
    </div>
  )
}