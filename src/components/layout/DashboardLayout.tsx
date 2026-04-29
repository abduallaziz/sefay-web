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
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  // إغلاق الـ sidebar لما يتغير الـ route على الموبايل
  useEffect(() => {
    setMobileOpen(false)
  }, [])

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
        style={{ marginInlineStart: 'var(--sidebar-width)' }}
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