'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import '@/styles/dashboard.css'
import '@/styles/tables.css'
import '@/styles/buttons.css'
import '@/styles/forms.css'
import '@/styles/modals.css'
import '@/styles/reports.css'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = getSession()
    if (!s) {
      router.push('/login')
      return
    }
    setSession(s)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-primary)',
        fontSize: '14px',
        fontWeight: '700',
      }}>
        Loading...
      </div>
    )
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        session={session}
      />
      <div className={`dashboard-main ${collapsed ? 'collapsed' : ''}`}>
        <Header
          session={session}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        <div className="dashboard-page">
          {children}
        </div>
      </div>
    </div>
  )
}