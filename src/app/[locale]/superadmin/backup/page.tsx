'use client'

import { useEffect, useState } from 'react'
import { Download, RefreshCw, Server } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

function getToken() {
  return localStorage.getItem('token') || ''
}

export default function BackupPage() {
  const [stats, setStats] = useState<any>(null)
  const [tenantId, setTenantId] = useState('')
  const [exporting, setExporting] = useState(false)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoadingStats(true)
    try {
      const res = await fetch(`${API}/superadmin/backup/system-stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      setStats(data)
    } finally {
      setLoadingStats(false)
    }
  }

  async function handleExport() {
    if (!tenantId.trim()) return alert('أدخل Tenant ID')
    setExporting(true)
    try {
      const res = await fetch(`${API}/superadmin/backup/export/${tenantId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tenant-${tenantId}-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900">النسخ الاحتياطي</h1>

      {/* System Stats */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Server size={20} /> إحصائيات النظام
          </h2>
          <button
            onClick={fetchStats}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <RefreshCw size={14} /> تحديث
          </button>
        </div>

        {loadingStats ? (
          <p className="text-gray-400">جاري التحميل...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'إجمالي المشتركين', value: stats?.total_tenants },
              { label: 'المشتركين النشطين', value: stats?.active_tenants },
              { label: 'إجمالي المستخدمين', value: stats?.total_users },
              { label: 'إجمالي الطلبات', value: stats?.total_orders },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{item.value ?? '-'}</p>
                <p className="text-sm text-gray-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Tenant Data */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Download size={20} /> تصدير بيانات Tenant
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="أدخل Tenant ID"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Download size={16} />
            {exporting ? 'جاري التصدير...' : 'تصدير'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          سيتم تحميل ملف JSON يحتوي على جميع بيانات المشترك
        </p>
      </div>
    </div>
  )
}