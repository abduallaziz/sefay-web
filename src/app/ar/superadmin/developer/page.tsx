'use client'

import { useState, useEffect, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL

function getToken() {
  return localStorage.getItem('token') || ''
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── Tab types ────────────────────────────────────────────
type Tab = 'logs' | 'ips' | 'webhooks' | 'db'

export default function DeveloperPage() {
  const [tab, setTab] = useState<Tab>('logs')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'logs',     label: '📋 API Logs' },
    { key: 'ips',      label: '🚫 IP Blocking' },
    { key: 'webhooks', label: '🔗 Webhooks' },
    { key: 'db',       label: '🗄️ DB Viewer' },
  ]

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold">Developer Tools & Security</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'logs'     && <ApiLogsTab />}
      {tab === 'ips'      && <IpBlockingTab />}
      {tab === 'webhooks' && <WebhooksTab />}
      {tab === 'db'       && <DbViewerTab />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// API Logs Tab
// ══════════════════════════════════════════════════════════
function ApiLogsTab() {
  const [logs, setLogs] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [method, setMethod] = useState('')
  const [status, setStatus] = useState('')
  const [path, setPath] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (method) params.set('method', method)
      if (status) params.set('status', status)
      if (path)   params.set('path', path)

      const [logsData, statsData] = await Promise.all([
        apiFetch(`/superadmin/security/api-logs?${params}`),
        apiFetch('/superadmin/security/api-stats'),
      ])
      setLogs(logsData)
      setStats(statsData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [method, status, path])

  useEffect(() => { load() }, [load])

  const statusColor = (code: number) => {
    if (code < 300) return 'text-green-600'
    if (code < 400) return 'text-yellow-600'
    return 'text-red-600'
  }

  const methodColor = (m: string) => {
    const map: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-700',
      POST: 'bg-green-100 text-green-700',
      PATCH: 'bg-yellow-100 text-yellow-700',
      DELETE: 'bg-red-100 text-red-700',
    }
    return map[m] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'إجمالي (24س)', value: stats.total },
            { label: 'أخطاء', value: stats.errors, red: true },
            { label: 'معدل النجاح', value: `${stats.successRate}%` },
            { label: 'متوسط الوقت', value: `${stats.avgDuration}ms` },
          ].map(s => (
            <div key={s.label} className="bg-white border rounded-lg p-4 text-center">
              <p className={`text-2xl font-bold ${s.red ? 'text-red-600' : 'text-gray-900'}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <select value={method} onChange={e => setMethod(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">كل الـ Methods</option>
          {['GET','POST','PATCH','DELETE','PUT'].map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">كل الـ Status</option>
          <option value="200">2xx نجاح</option>
          <option value="400">4xx خطأ عميل</option>
          <option value="500">5xx خطأ سيرفر</option>
        </select>
        <input
          placeholder="فلتر بالـ path..."
          value={path}
          onChange={e => setPath(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-48"
        />
        <button onClick={load} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
          تحديث
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500 text-center py-8">جاري التحميل...</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Method','Path','Status','Duration','IP','التوقيت'].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">لا توجد سجلات</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${methodColor(log.method)}`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-600 max-w-xs truncate">{log.path}</td>
                  <td className={`px-4 py-2 font-mono font-bold ${statusColor(log.status_code)}`}>{log.status_code}</td>
                  <td className="px-4 py-2 text-gray-600">{log.duration_ms}ms</td>
                  <td className="px-4 py-2 font-mono text-xs">{log.ip || '—'}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{new Date(log.created_at).toLocaleString('ar')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// IP Blocking Tab
// ══════════════════════════════════════════════════════════
function IpBlockingTab() {
  const [ips, setIps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newIp, setNewIp] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/superadmin/security/blocked-ips')
      setIps(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const block = async () => {
    if (!newIp.trim()) return setError('أدخل IP')
    setSaving(true)
    setError('')
    try {
      await apiFetch('/superadmin/security/blocked-ips', {
        method: 'POST',
        body: JSON.stringify({ ip: newIp.trim(), reason }),
      })
      setNewIp('')
      setReason('')
      load()
    } catch {
      setError('فشل الحظر')
    } finally {
      setSaving(false)
    }
  }

  const unblock = async (id: string) => {
    if (!confirm('إلغاء الحظر؟')) return
    await apiFetch(`/superadmin/security/blocked-ips/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      {/* Add IP */}
      <div className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">حظر IP جديد</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-sm text-gray-600 mb-1">عنوان IP</label>
            <input
              value={newIp}
              onChange={e => setNewIp(e.target.value)}
              placeholder="192.168.1.1"
              className="border rounded-lg px-3 py-2 text-sm font-mono w-48"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">السبب</label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="سبب الحظر..."
              className="border rounded-lg px-3 py-2 text-sm w-full"
            />
          </div>
          <button
            onClick={block}
            disabled={saving}
            className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {saving ? 'جاري...' : 'حظر'}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      {/* List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-800">IPs المحظورة ({ips.length})</h2>
        </div>
        {loading ? (
          <p className="text-center py-8 text-gray-400">جاري التحميل...</p>
        ) : ips.length === 0 ? (
          <p className="text-center py-8 text-gray-400">لا توجد IPs محظورة</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['IP','السبب','محظور بواسطة','التاريخ',''].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ips.map(ip => (
                <tr key={ip.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-red-600">{ip.ip}</td>
                  <td className="px-4 py-3 text-gray-600">{ip.reason || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{ip.blocked_by}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(ip.created_at).toLocaleDateString('ar')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => unblock(ip.id)} className="text-blue-600 hover:underline text-xs">
                      إلغاء الحظر
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// Webhooks Tab
// ══════════════════════════════════════════════════════════
const WEBHOOK_EVENTS = ['tenant.created','tenant.disabled','subscription.expired','subscription.renewed','payment.added','user.created']

function WebhooksTab() {
  const [hooks, setHooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/superadmin/security/webhooks')
      setHooks(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggleEvent = (e: string) =>
    setEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])

  const create = async () => {
    if (!url.trim() || events.length === 0) return
    setSaving(true)
    try {
      await apiFetch('/superadmin/security/webhooks', {
        method: 'POST',
        body: JSON.stringify({ url: url.trim(), events }),
      })
      setUrl('')
      setEvents([])
      load()
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (id: string, current: boolean) => {
    await apiFetch(`/superadmin/security/webhooks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !current }),
    })
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('حذف الـ webhook؟')) return
    await apiFetch(`/superadmin/security/webhooks/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">إضافة Webhook</h2>
        <div>
          <label className="block text-sm text-gray-600 mb-1">URL</label>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
            className="border rounded-lg px-3 py-2 text-sm font-mono w-full"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-2">Events</label>
          <div className="flex flex-wrap gap-2">
            {WEBHOOK_EVENTS.map(e => (
              <button
                key={e}
                onClick={() => toggleEvent(e)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-colors ${
                  events.includes(e)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={create}
          disabled={saving || !url || events.length === 0}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? 'جاري...' : 'إضافة'}
        </button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h2 className="font-semibold">Webhooks ({hooks.length})</h2>
        </div>
        {loading ? (
          <p className="text-center py-8 text-gray-400">جاري التحميل...</p>
        ) : hooks.length === 0 ? (
          <p className="text-center py-8 text-gray-400">لا توجد webhooks</p>
        ) : (
          <div className="divide-y">
            {hooks.map(h => (
              <div key={h.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-gray-800 truncate">{h.url}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(h.events || []).map((e: string) => (
                      <span key={e} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">{e}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-1 rounded text-xs ${h.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {h.is_active ? 'نشط' : 'متوقف'}
                  </span>
                  <button onClick={() => toggle(h.id, h.is_active)} className="text-xs text-blue-600 hover:underline">
                    {h.is_active ? 'إيقاف' : 'تفعيل'}
                  </button>
                  <button onClick={() => remove(h.id)} className="text-xs text-red-500 hover:underline">حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// DB Viewer Tab
// ══════════════════════════════════════════════════════════
function DbViewerTab() {
  const [tables, setTables] = useState<Record<string, number>>({})
  const [selectedTable, setSelectedTable] = useState('')
  const [tableData, setTableData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    apiFetch('/superadmin/security/db/tables').then(setTables).finally(() => setLoading(false))
  }, [])

  const loadTable = async (table: string, p = 1) => {
    setSelectedTable(table)
    setPage(p)
    setLoadingData(true)
    try {
      const data = await apiFetch(`/superadmin/security/db/tables/${table}?limit=20&page=${p}`)
      setTableData(data)
    } finally {
      setLoadingData(false)
    }
  }

  const columns = tableData?.data?.length > 0 ? Object.keys(tableData.data[0]) : []

  return (
    <div className="space-y-4">
      {/* Tables List */}
      <div className="grid grid-cols-3 gap-3">
        {loading ? (
          <p className="col-span-3 text-center text-gray-400 py-4">جاري التحميل...</p>
        ) : Object.entries(tables).map(([name, count]) => (
          <button
            key={name}
            onClick={() => loadTable(name, 1)}
            className={`p-4 rounded-lg border text-right transition-colors ${
              selectedTable === name
                ? 'border-blue-600 bg-blue-50'
                : 'bg-white border-gray-200 hover:border-gray-400'
            }`}
          >
            <p className="font-mono text-sm font-semibold text-gray-800">{name}</p>
            <p className="text-xs text-gray-500 mt-1">{count.toLocaleString()} سجل</p>
          </button>
        ))}
      </div>

      {/* Table Data */}
      {selectedTable && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="font-mono font-semibold">{selectedTable}</h2>
            <span className="text-xs text-gray-500">
              {tableData?.total?.toLocaleString()} سجل — صفحة {page}
            </span>
          </div>
          {loadingData ? (
            <p className="text-center py-8 text-gray-400">جاري التحميل...</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {columns.map(c => (
                        <th key={c} className="text-right px-3 py-2 text-gray-600 font-mono whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(tableData?.data || []).map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {columns.map(c => (
                          <td key={c} className="px-3 py-2 text-gray-700 font-mono max-w-xs truncate whitespace-nowrap">
                            {row[c] === null ? <span className="text-gray-300">null</span> :
                             typeof row[c] === 'object' ? JSON.stringify(row[c]).slice(0, 50) :
                             String(row[c]).slice(0, 80)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="px-5 py-3 border-t flex gap-2 justify-center">
                <button
                  disabled={page <= 1}
                  onClick={() => loadTable(selectedTable, page - 1)}
                  className="px-3 py-1.5 border rounded text-sm disabled:opacity-40"
                >
                  السابق
                </button>
                <button
                  disabled={!tableData?.data?.length || tableData.data.length < 20}
                  onClick={() => loadTable(selectedTable, page + 1)}
                  className="px-3 py-1.5 border rounded text-sm disabled:opacity-40"
                >
                  التالي
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}