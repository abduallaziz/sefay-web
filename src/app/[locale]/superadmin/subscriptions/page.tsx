'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Plus, X, Calendar, DollarSign } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

type Subscription = {
  id: string
  tenant_id: string
  plan: string
  status: string
  started_at: string
  expires_at: string
  price: number
  billing_cycle: string
  payment_ref: string | null
  auto_renew: boolean
  cancelled_at: string | null
  tenants: { id: string; name: string; email: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  expired:   'bg-gray-100 text-gray-600',
  trial:     'bg-yellow-100 text-yellow-700',
}

const STATUS_LABELS: Record<string, string> = {
  active:    'نشط',
  cancelled: 'ملغي',
  expired:   'منتهي',
  trial:     'تجريبي',
}

type Modal =
  | { type: 'create' }
  | { type: 'expiry'; id: string; current: string }
  | { type: 'payment'; id: string; tenantId: string }
  | null

export default function SubscriptionsPage() {
  const [subs, setSubs]       = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('')
  const [modal, setModal]     = useState<Modal>(null)

  // ── Create form
  const [form, setForm] = useState({
    tenant_id: '', plan: 'starter', price: '',
    billing_cycle: 'monthly', started_at: '', expires_at: '',
    max_users: '', max_branches: '', payment_ref: '', auto_renew: true,
  })

  // ── Expiry form
  const [newExpiry, setNewExpiry] = useState('')

  // ── Payment form
  const [payment, setPayment] = useState({ amount: '', payment_ref: '', note: '' })

  const token = () => localStorage.getItem('token')

  const fetchSubs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      const res = await fetch(`${API}/superadmin/subscriptions?${params}`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await res.json()
      setSubs(Array.isArray(data) ? data : [])
    } catch {
      setSubs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSubs() }, [status])

  // ── إنشاء اشتراك
  const handleCreate = async () => {
    const res = await fetch(`${API}/superadmin/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        max_users: form.max_users ? Number(form.max_users) : undefined,
        max_branches: form.max_branches ? Number(form.max_branches) : undefined,
      }),
    })
    if (res.ok) { setModal(null); fetchSubs() }
    else alert('فشل إنشاء الاشتراك')
  }

  // ── إلغاء اشتراك
  const handleCancel = async (id: string) => {
    if (!confirm('إلغاء هذا الاشتراك؟')) return
    const res = await fetch(`${API}/superadmin/subscriptions/${id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token()}` },
    })
    if (res.ok) fetchSubs()
    else alert('فشل الإلغاء')
  }

  // ── تعديل تاريخ الانتهاء
  const handleExpiry = async () => {
    if (modal?.type !== 'expiry') return
    const res = await fetch(`${API}/superadmin/subscriptions/${modal.id}/expiry`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ expires_at: new Date(newExpiry).toISOString() }),
    })
    if (res.ok) { setModal(null); fetchSubs() }
    else alert('فشل التعديل')
  }

  // ── دفعة يدوية
  const handlePayment = async () => {
    if (modal?.type !== 'payment') return
    const res = await fetch(`${API}/superadmin/subscriptions/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        subscription_id: modal.id,
        tenant_id: modal.tenantId,
        amount: Number(payment.amount),
        payment_ref: payment.payment_ref,
        note: payment.note,
      }),
    })
    if (res.ok) { setModal(null); setPayment({ amount: '', payment_ref: '', note: '' }); fetchSubs() }
    else alert('فشل تسجيل الدفعة')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">الاشتراكات</h1>
          <span className="bg-blue-100 text-blue-700 text-sm px-2 py-0.5 rounded-full">
            {subs.length}
          </span>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} /> اشتراك جديد
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="cancelled">ملغي</option>
          <option value="expired">منتهي</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">جاري التحميل...</div>
        ) : subs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">لا توجد اشتراكات</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">المشترك</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">الخطة</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">الحالة</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">السعر</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">الدورة</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">تاريخ الانتهاء</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subs.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.tenants?.name || '—'}</div>
                    <div className="text-gray-400 text-xs">{s.tenants?.email || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full capitalize">
                      {s.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{s.price} ر.س</td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.billing_cycle === 'monthly' ? 'شهري' : 'سنوي'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.expires_at ? new Date(s.expires_at).toLocaleDateString('ar-SA') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {s.status === 'active' && (
                        <>
                          <button
                            onClick={() => { setNewExpiry(s.expires_at?.slice(0, 10) || ''); setModal({ type: 'expiry', id: s.id, current: s.expires_at }) }}
                            className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                          >
                            <Calendar size={12} /> تاريخ
                          </button>
                          <button
                            onClick={() => { setPayment({ amount: '', payment_ref: '', note: '' }); setModal({ type: 'payment', id: s.id, tenantId: s.tenant_id }) }}
                            className="text-green-600 hover:underline text-xs flex items-center gap-1"
                          >
                            <DollarSign size={12} /> دفعة
                          </button>
                          <button
                            onClick={() => handleCancel(s.id)}
                            className="text-red-500 hover:underline text-xs flex items-center gap-1"
                          >
                            <X size={12} /> إلغاء
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal: إنشاء اشتراك ── */}
      {modal?.type === 'create' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">اشتراك جديد</h2>
              <button onClick={() => setModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Tenant ID</label>
                <input
                  value={form.tenant_id}
                  onChange={e => setForm(f => ({ ...f, tenant_id: e.target.value }))}
                  placeholder="UUID الـ tenant"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">الخطة</label>
                <select
                  value={form.plan}
                  onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">السعر (ر.س)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">الدورة</label>
                <select
                  value={form.billing_cycle}
                  onChange={e => setForm(f => ({ ...f, billing_cycle: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="monthly">شهري</option>
                  <option value="yearly">سنوي</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">تاريخ البدء</label>
                <input
                  type="date"
                  value={form.started_at}
                  onChange={e => setForm(f => ({ ...f, started_at: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">تاريخ الانتهاء</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">حد المستخدمين</label>
                <input
                  type="number"
                  value={form.max_users}
                  onChange={e => setForm(f => ({ ...f, max_users: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">حد الفروع</label>
                <input
                  type="number"
                  value={form.max_branches}
                  onChange={e => setForm(f => ({ ...f, max_branches: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">رقم الدفع (اختياري)</label>
                <input
                  value={form.payment_ref}
                  onChange={e => setForm(f => ({ ...f, payment_ref: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto_renew"
                  checked={form.auto_renew}
                  onChange={e => setForm(f => ({ ...f, auto_renew: e.target.checked }))}
                />
                <label htmlFor="auto_renew" className="text-sm text-gray-700">تجديد تلقائي</label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreate}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                إنشاء الاشتراك
              </button>
              <button
                onClick={() => setModal(null)}
                className="flex-1 border border-gray-200 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: تعديل تاريخ الانتهاء ── */}
      {modal?.type === 'expiry' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">تعديل تاريخ الانتهاء</h2>
              <button onClick={() => setModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <input
              type="date"
              value={newExpiry}
              onChange={e => setNewExpiry(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-3">
              <button onClick={handleExpiry} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">
                حفظ
              </button>
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm hover:bg-gray-50">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: دفعة يدوية ── */}
      {modal?.type === 'payment' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">تسجيل دفعة يدوية</h2>
              <button onClick={() => setModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">المبلغ (ر.س)</label>
                <input
                  type="number"
                  value={payment.amount}
                  onChange={e => setPayment(p => ({ ...p, amount: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">رقم الدفع / المرجع</label>
                <input
                  value={payment.payment_ref}
                  onChange={e => setPayment(p => ({ ...p, payment_ref: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">ملاحظة (اختياري)</label>
                <input
                  value={payment.note}
                  onChange={e => setPayment(p => ({ ...p, note: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handlePayment} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700">
                تسجيل الدفعة
              </button>
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm hover:bg-gray-50">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}