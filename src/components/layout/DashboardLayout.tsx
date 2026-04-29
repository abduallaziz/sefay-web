'use client'

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import '@/styles/dashboard.css'

interface DashboardLayoutProps {
  children: React.ReactNode
  session: any
}

export default function DashboardLayout({ children, session }: DashboardLayoutProps) {
  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile,   setIsMobile]   = useState(false)

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) setMobileOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const mainMargin = isMobile
    ? '0'
    : collapsed
    ? '70px'
    : 'var(--sidebar-width)'

  return (
    <div className="dashboard-layout">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        session={session}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main
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
        <div className="dashboard-page">
          {children}
        </div>
      </main>
    </div>
  )
}