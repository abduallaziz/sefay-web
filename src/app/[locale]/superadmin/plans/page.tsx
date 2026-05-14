'use client'

import { useEffect, useState } from 'react'
import { Package, Pencil, X, Check } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

type Plan = {
  id: string
  name: string
  price: number
  currency: string
  max_branches: number
  max_users: number
  features: Record<string, any>
  is_active: boolean
  created_at: string
}

export default function PlansPage() {
  const [plans, setPlans]     = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form, setForm]       = useState<Partial<Plan>>({})

  const token = () => localStorage.getItem('token')

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/superadmin/plans`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await res.json()
      setPlans(Array.isArray(data) ? data : [])
    } catch {
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlans() }, [])

  const openEdit = (plan: Plan) => {
    setEditing(plan)
    setForm({
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      max_branches: plan.max_branches,
      max_users: plan.max_users,
      is_active: plan.is_active,
    })
  }

  const handleSave = async () => {
    if (!editing) return
    const res = await fetch(`${API}/superadmin/plans/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(form),
    })
    if (res.ok) { setEditing(null); fetchPlans() }
    else alert('فشل الحفظ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Package size={24} className="text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">الخطط</h1>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">جاري التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {plan.is_active ? 'نشطة' : 'معطلة'}
                  </span>
                  <button onClick={() => openEdit(plan)} className="text-gray-400 hover:text-blue-600">
                    <Pencil size={16} />
                  </button>
                </div>
              </div>

              <div className="text-3xl font-bold text-blue-600">
                {plan.price} <span className="text-sm text-gray-400">{plan.currency}</span>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>المستخدمين</span>
                  <span className="font-medium">{plan.max_users}</span>
                </div>
                <div className="flex justify-between">
                  <span>الفروع</span>
                  <span className="font-medium">{plan.max_branches}</span>
                </div>
              </div>

              {plan.features && Object.keys(plan.features).length > 0 && (
                <div className="space-y-1 pt-2 border-t border-gray-100">
                  {Object.entries(plan.features).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 text-xs text-gray-600">
                      <Check size={12} className="text-green-500 shrink-0" />
                      <span>{key}: {String(val)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: تعديل خطة */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">تعديل خطة — {editing.name}</h2>
              <button onClick={() => setEditing(null)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">اسم الخطة</label>
                <input
                  value={form.name || ''}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">السعر</label>
                <input
                  type="number"
                  value={form.price || ''}
                  onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">العملة</label>
                <input
                  value={form.currency || ''}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">حد المستخدمين</label>
                  <input
                    type="number"
                    value={form.max_users || ''}
                    onChange={e => setForm(f => ({ ...f, max_users: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">حد الفروع</label>
                  <input
                    type="number"
                    value={form.max_branches || ''}
                    onChange={e => setForm(f => ({ ...f, max_branches: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active ?? true}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">الخطة نشطة</label>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">
                حفظ التعديلات
              </button>
              <button onClick={() => setEditing(null)} className="flex-1 border border-gray-200 py-2 rounded-lg text-sm hover:bg-gray-50">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}