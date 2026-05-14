// C:\sefay-platform\apps\web-dashboard\src\app\ar\superadmin\notifications\page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Bell, Send, Trash2, Clock, Users, User } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

type Notification = {
  id: string
  tenant_id: string | null
  title: string
  message: string
  type: string
  is_read: boolean
  scheduled_at: string | null
  sent_at: string | null
  created_at: string
  tenants?: { name: string }
}

type Tenant = { id: string; name: string }

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [form, setForm] = useState({
    tenant_id: '',
    title: '',
    message: '',
    type: 'info',
    scheduled_at: '',
  })

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  async function fetchNotifications() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/superadmin/notifications?limit=50`, { headers })
      const json = await res.json()
      setNotifications(json.data || [])
      setTotal(json.total || 0)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTenants() {
    const res = await fetch(`${API}/superadmin/tenants?limit=200`, { headers })
    const json = await res.json()
    setTenants(json.data || [])
  }

  useEffect(() => {
    fetchNotifications()
    fetchTenants()
  }, [])

  async function handleSend() {
    if (!form.title || !form.message) return alert('العنوان والرسالة مطلوبان')
    setSending(true)
    try {
      const body: any = {
        title: form.title,
        message: form.message,
        type: form.type,
      }
      if (form.tenant_id) body.tenant_id = form.tenant_id
      if (form.scheduled_at) body.scheduled_at = new Date(form.scheduled_at).toISOString()

      const res = await fetch(`${API}/superadmin/notifications`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setForm({ tenant_id: '', title: '', message: '', type: 'info', scheduled_at: '' })
      fetchNotifications()
    } catch {
      alert('حدث خطأ')
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف هذا الإشعار؟')) return
    await fetch(`${API}/superadmin/notifications/${id}`, { method: 'DELETE', headers })
    fetchNotifications()
  }

  const typeColors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700',
    success: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
  }

  const typeLabels: Record<string, string> = {
    info: 'معلومة',
    warning: 'تحذير',
    success: 'نجاح',
    error: 'خطأ',
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Bell className="text-blue-500" size={24} />
        <div>
          <h1 className="text-2xl font-bold">الإشعارات</h1>
          <p className="text-gray-500 text-sm">إرسال وإدارة إشعارات المشتركين</p>
        </div>
      </div>

      {/* فورم الإرسال */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          <Send size={16} /> إرسال إشعار جديد
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {/* tenant */}
          <div className="space-y-1">
            <label className="text-sm text-gray-600">المشترك</label>
            <select
              value={form.tenant_id}
              onChange={e => setForm(f => ({ ...f, tenant_id: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">📢 جماعي — كل المشتركين</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* type */}
          <div className="space-y-1">
            <label className="text-sm text-gray-600">النوع</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="info">معلومة</option>
              <option value="warning">تحذير</option>
              <option value="success">نجاح</option>
              <option value="error">خطأ</option>
            </select>
          </div>

          {/* title */}
          <div className="space-y-1 col-span-2">
            <label className="text-sm text-gray-600">العنوان</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="عنوان الإشعار"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* message */}
          <div className="space-y-1 col-span-2">
            <label className="text-sm text-gray-600">الرسالة</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="نص الإشعار..."
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>

          {/* scheduled_at */}
          <div className="space-y-1 col-span-2">
            <label className="text-sm text-gray-600 flex items-center gap-1">
              <Clock size={14} /> جدولة (اختياري — اتركه فارغ للإرسال الفوري)
            </label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={16} />
            {sending ? 'جاري الإرسال...' : form.tenant_id ? 'إرسال للمشترك' : 'إرسال جماعي'}
          </button>

          {form.tenant_id ? (
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <User size={14} /> إرسال لمشترك واحد
            </span>
          ) : (
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Users size={14} /> إرسال لكل المشتركين النشطين
            </span>
          )}
        </div>
      </div>

      {/* قائمة الإشعارات */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">
            الإشعارات المرسلة ({total})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">لا توجد إشعارات</div>
        ) : (
          <div className="divide-y">
            {notifications.map(n => (
              <div key={n.id} className="p-4 flex items-start justify-between gap-4 hover:bg-gray-50">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[n.type]}`}>
                      {typeLabels[n.type]}
                    </span>
                    {n.tenants ? (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <User size={12} /> {n.tenants.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Users size={12} /> جماعي
                      </span>
                    )}
                    {n.scheduled_at && !n.sent_at && (
                      <span className="text-xs text-orange-500 flex items-center gap-1">
                        <Clock size={12} /> مجدول: {new Date(n.scheduled_at).toLocaleString('ar-SA')}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-gray-500 text-sm">{n.message}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(n.created_at).toLocaleString('ar-SA')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}