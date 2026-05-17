'use client'

import { useEffect, useState } from 'react'
import { Save, RefreshCw } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

function getToken() {
  return localStorage.getItem('token') || ''
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/superadmin/support/settings`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      const map: Record<string, any> = {}
      if (Array.isArray(data)) {
        data.forEach((s: any) => { map[s.key] = s.value })
      }
      setSettings(map)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(key: string, value: any) {
    setSaving(key)
    try {
      await fetch(`${API}/superadmin/support/settings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      })
      fetchSettings()
    } finally {
      setSaving(null)
    }
  }

  const settingLabels: Record<string, string> = {
    maintenance_mode: 'وضع الصيانة',
    allow_new_registrations: 'السماح بالتسجيل الجديد',
    max_trial_days: 'أقصى أيام تجريبية',
    support_email: 'إيميل الدعم',
  }

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900">إعدادات النظام</h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        {loading ? (
          <p className="text-gray-400">جاري التحميل...</p>
        ) : (
          Object.entries(settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium text-sm">{settingLabels[key] || key}</p>
                <p className="text-xs text-gray-400">{key}</p>
              </div>
              <div className="flex items-center gap-3">
                {value === 'true' || value === 'false' ? (
                  <button
                    onClick={() => handleSave(key, value === 'true' ? 'false' : 'true')}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      value === 'true' ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      value === 'true' ? 'translate-x-1' : 'translate-x-7'
                    }`} />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      defaultValue={value}
                      onBlur={(e) => handleSave(key, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {saving === key && (
                      <RefreshCw size={14} className="animate-spin text-blue-600" />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}