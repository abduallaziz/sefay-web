 'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { RefreshCw, CheckCircle, XCircle, Clock, Wifi } from 'lucide-react'
import '@/styles/modals.css'
import '@/styles/forms.css'

export default function SyncPage() {
  const locale = useLocale()

  const [loading,    setLoading]    = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const [apiStatus,      setApiStatus]      = useState<'online' | 'offline' | 'checking'>('checking')
  const [supabaseStatus, setSupabaseStatus] = useState<'online' | 'offline' | 'checking'>('checking')

  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [shifts,    setShifts]    = useState<any[]>([])
  const [queue,     setQueue]     = useState<any[]>([])
  const [branches,  setBranches]  = useState<any[]>([])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    setApiStatus('checking')
    setSupabaseStatus('checking')
    try {
      const session = getSession()
      if (!session) return
      const tid = session.tenant_id

      // فحص API
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: AbortSignal.timeout(5000),
        })
        setApiStatus(res.ok ? 'online' : 'offline')
      } catch {
        setApiStatus('offline')
      }

      // فحص Supabase + جلب البيانات
      const [
        { data: branchesData },
        { data: logsData },
        { data: shiftsData },
        { data: queueData },
      ] = await Promise.all([
        supabase.from('branches').select('id, name, active').eq('tenant_id', tid),
        supabase.from('audit_logs').select('*').eq('tenant_id', tid)
          .order('created_at', { ascending: false }).limit(20),
        supabase.from('shifts').select('*').eq('tenant_id', tid)
          .order('created_at', { ascending: false }).limit(10),
        supabase.from('queue').select('*').eq('tenant_id', tid)
          .order('created_at', { ascending: false }).limit(10),
      ])

      setSupabaseStatus('online')
      setBranches(branchesData || [])
      setAuditLogs(logsData || [])
      setShifts(shiftsData || [])
      setQueue(queueData || [])
      setLastUpdate(new Date())
    } catch (e) {
      console.error(e)
      setSupabaseStatus('offline')
    } finally {
      setLoading(false)
    }
  }

  function formatTime(dateStr: string) {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function timeSince(dateStr: string) {
    if (!dateStr) return '—'
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return locale === 'ar' ? 'الآن' : 'just now'
    if (mins < 60) return locale === 'ar' ? `منذ ${mins} د` : `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return locale === 'ar' ? `منذ ${hrs} س` : `${hrs}h ago`
    return locale === 'ar' ? `منذ ${Math.floor(hrs / 24)} ي` : `${Math.floor(hrs / 24)}d ago`
  }

  const STATUS_COLOR = {
    online:   'var(--color-success)',
    offline:  'var(--color-danger)',
    checking: 'var(--color-warning)',
  }

  const STATUS_BG = {
    online:   'var(--color-success-light)',
    offline:  'var(--color-danger-light)',
    checking: 'var(--color-warning-light)',
  }

  const STATUS_BORDER = {
    online:   'var(--color-success-border)',
    offline:  'var(--color-danger-border)',
    checking: 'var(--color-border)',
  }

  function StatusIcon({ status }: { status: 'online' | 'offline' | 'checking' }) {
    if (status === 'online')   return <CheckCircle size={18} color="var(--color-success)" />
    if (status === 'offline')  return <XCircle size={18} color="var(--color-danger)" />
    return <Clock size={18} color="var(--color-warning)" />
  }

  function statusLabel(status: 'online' | 'offline' | 'checking') {
    const map = {
      online:   locale === 'ar' ? 'متصل' : 'Online',
      offline:  locale === 'ar' ? 'غير متصل' : 'Offline',
      checking: locale === 'ar' ? 'جاري الفحص...' : 'Checking...',
    }
    return map[status]
  }

  // آخر shift لكل فرع
  const branchShifts = branches.map(br => {
    const shift = shifts.find(s => s.branch_id === br.id)
    return { ...br, lastShift: shift || null }
  })

  const actionLabel = (action: string) => {
    const map: Record<string, string> = {
      create_order:   locale === 'ar' ? 'طلب جديد' : 'New order',
      update_service: locale === 'ar' ? 'تعديل خدمة' : 'Update service',
      create_expense: locale === 'ar' ? 'مصروف جديد' : 'New expense',
      login:          locale === 'ar' ? 'تسجيل دخول' : 'Login',
      logout:         locale === 'ar' ? 'تسجيل خروج' : 'Logout',
    }
    return map[action] || action
  }

  return (
    <div>
      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">
            {locale === 'ar' ? '🔄 المزامنة' : '🔄 Sync'}
          </h2>
          <p className="dashboard-page-subtitle">
            {lastUpdate
              ? `${locale === 'ar' ? 'آخر تحديث:' : 'Last update:'} ${formatTime(lastUpdate.toISOString())}`
              : (locale === 'ar' ? 'جاري الفحص...' : 'Checking...')}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadAll} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {locale === 'ar' ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* بطاقات الحالة */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          {
            label: locale === 'ar' ? 'الـ API' : 'API Server',
            sub: 'Railway',
            status: apiStatus,
            icon: '🚀',
          },
          {
            label: locale === 'ar' ? 'قاعدة البيانات' : 'Database',
            sub: 'Supabase',
            status: supabaseStatus,
            icon: '🗄️',
          },
          {
            label: locale === 'ar' ? 'الأجهزة' : 'Devices',
            sub: `${branches.filter(b => b.active).length} ${locale === 'ar' ? 'فرع' : 'branches'}`,
            status: supabaseStatus === 'online' ? 'online' : 'checking',
            icon: '📱',
          },
        ].map((card, i) => (
          <div key={i} style={{
            backgroundColor: STATUS_BG[card.status as keyof typeof STATUS_BG],
            border: `1px solid ${STATUS_BORDER[card.status as keyof typeof STATUS_BORDER]}`,
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{ fontSize: '28px' }}>{card.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                {card.sub}
              </div>
              <div style={{
                fontSize: '12px', fontWeight: '700',
                color: STATUS_COLOR[card.status as keyof typeof STATUS_COLOR],
              }}>
                {statusLabel(card.status as any)}
              </div>
            </div>
            <StatusIcon status={card.status as any} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* الأجهزة / الفروع */}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">
              <Wifi size={14} style={{ marginInlineEnd: '6px' }} />
              {locale === 'ar' ? 'حالة الفروع' : 'Branch Status'}
            </h3>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{locale === 'ar' ? 'الفرع' : 'Branch'}</th>
                  <th>{locale === 'ar' ? 'آخر وردية' : 'Last Shift'}</th>
                  <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {branchShifts.map(br => (
                  <tr key={br.id}>
                    <td style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                      🏬 {br.name}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {br.lastShift
                        ? timeSince(br.lastShift.created_at)
                        : (locale === 'ar' ? 'لا يوجد' : 'None')}
                    </td>
                    <td>
                      <span className={`badge ${br.active ? 'badge-success' : 'badge-danger'}`}>
                        {br.active
                          ? (locale === 'ar' ? 'مفعّل' : 'Active')
                          : (locale === 'ar' ? 'معطّل' : 'Inactive')}
                      </span>
                    </td>
                  </tr>
                ))}
                {branchShifts.length === 0 && (
                  <tr>
                    <td colSpan={3}>
                      <div className="table-empty">
                        <div className="table-empty-icon">🏬</div>
                        <div className="table-empty-text">
                          {locale === 'ar' ? 'لا توجد فروع' : 'No branches'}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* قائمة الانتظار */}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">
              🚗 {locale === 'ar' ? 'قائمة الانتظار' : 'Queue'}
            </h3>
            <span className="badge badge-primary">{queue.length}</span>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{locale === 'ar' ? 'اللوحة' : 'Plate'}</th>
                  <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th>{locale === 'ar' ? 'الوقت' : 'Time'}</th>
                </tr>
              </thead>
              <tbody>
                {queue.map(q => (
                  <tr key={q.id}>
                    <td style={{ fontWeight: '700', color: 'var(--color-text-primary)', fontSize: '13px' }}>
                      {q.plate_number || '—'}
                    </td>
                    <td>
                      <span className={`badge ${
                        q.status === 'done'       ? 'badge-success' :
                        q.status === 'in_service' ? 'badge-primary' :
                        'badge-warning'
                      }`}>
                        {q.status === 'done'       ? (locale === 'ar' ? 'منتهي' : 'Done') :
                         q.status === 'in_service' ? (locale === 'ar' ? 'في الخدمة' : 'In Service') :
                         (locale === 'ar' ? 'انتظار' : 'Waiting')}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {timeSince(q.created_at)}
                    </td>
                  </tr>
                ))}
                {queue.length === 0 && (
                  <tr>
                    <td colSpan={3}>
                      <div className="table-empty">
                        <div className="table-empty-icon">🚗</div>
                        <div className="table-empty-text">
                          {locale === 'ar' ? 'القائمة فارغة' : 'Queue is empty'}
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

      {/* سجل العمليات */}
      <div className="table-container" style={{ marginTop: '16px' }}>
        <div className="table-header">
          <h3 className="table-title">
            📋 {locale === 'ar' ? 'سجل العمليات' : 'Activity Log'}
          </h3>
          <span className="badge badge-primary">{auditLogs.length}</span>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{locale === 'ar' ? 'العملية' : 'Action'}</th>
                <th>{locale === 'ar' ? 'الجهة' : 'Entity'}</th>
                <th>{locale === 'ar' ? 'المستخدم' : 'User'}</th>
                <th>{locale === 'ar' ? 'الوقت' : 'Time'}</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td>
                    <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                      {actionLabel(log.action)}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {log.entity || '—'}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {log.user_id ? log.user_id.slice(0, 8) + '...' : '—'}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {timeSince(log.created_at)}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="table-empty">
                      <div className="table-empty-icon">📋</div>
                      <div className="table-empty-text">
                        {locale === 'ar' ? 'لا توجد سجلات' : 'No logs found'}
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