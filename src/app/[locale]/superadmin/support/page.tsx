'use client'

import { useEffect, useState } from 'react'
import { Plus, CheckCircle, Clock, XCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

function getToken() {
  return localStorage.getItem('token') || ''
}

const statusColors: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<string, string> = {
  open: 'مفتوح',
  in_progress: 'قيد المعالجة',
  resolved: 'محلول',
  closed: 'مغلق',
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [reply, setReply] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [filter])

  async function fetchTickets() {
    setLoading(true)
    try {
      const url = filter
        ? `${API}/superadmin/support/tickets?status=${filter}`
        : `${API}/superadmin/support/tickets`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      setTickets(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(ticketId: string, status?: string) {
    setUpdating(true)
    try {
      await fetch(`${API}/superadmin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reply: reply || undefined }),
      })
      setReply('')
      setSelected(null)
      fetchTickets()
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900">الدعم الفني</h1>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'الكل' : statusLabels[s]}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400">جاري التحميل...</p>
        ) : tickets.length === 0 ? (
          <p className="p-6 text-gray-400">لا توجد تذاكر</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-4 py-3 text-right">الموضوع</th>
                <th className="px-4 py-3 text-right">المشترك</th>
                <th className="px-4 py-3 text-right">الأولوية</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-right">التاريخ</th>
                <th className="px-4 py-3 text-right">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.subject}</td>
                  <td className="px-4 py-3 text-gray-500">{t.tenants?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[t.priority]}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[t.status]}`}>
                      {statusLabels[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(t.created_at).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(t)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      رد / تحديث
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reply Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4" dir="rtl">
            <h3 className="font-bold text-lg">{selected.subject}</h3>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selected.message}</p>

            <textarea
              placeholder="اكتب ردك هنا..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-2 flex-wrap">
              {['in_progress', 'resolved', 'closed'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleUpdate(selected.id, s)}
                  disabled={updating}
                  className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {statusLabels[s]}
                </button>
              ))}
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}