'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowRight, Building2, Phone, Mail, MapPin,
  Calendar, Users, GitBranch, Edit2, Trash2,
  ToggleLeft, ToggleRight, Clock,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

type TenantDetail = {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  phone: string
  email: string
  city: string
  district: string
  street: string
  address: string
  vat_number: string
  tax_number: string
  website: string
  business_type: string
  onboarded: boolean
  created_at: string
  trial_ends_at: string | null
  sub_start: string | null
  sub_end: string | null
  timezone: string
  subscription: Record<string, any> | null
  usersCount: number
  branchesCount: number
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [tenant, setTenant]       = useState<TenantDetail | null>(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [editMode, setEditMode]   = useState(false)
  const [form, setForm]           = useState<Partial<TenantDetail>>({})
  const [trialDays, setTrialDays] = useState(7)
  const [msg, setMsg]             = useState('')

  const token = () => localStorage.getItem('token')

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${API}/superadmin/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await res.json()
      setTenant(data)
      setForm(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const notify = (text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  // ── Update ─────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API}/superadmin/tenants/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        await load()
        setEditMode(false)
        notify('✅ تم الحفظ')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle Status ──────────────────────────────────────────
  const handleToggle = async () => {
    if (!tenant) return
    const next = tenant.status === 'active' ? 'inactive' : 'active'
    const confirmed = confirm(`تحويل الحالة إلى "${next === 'active' ? 'نشط' : 'معطل'}"؟`)
    if (!confirmed) return

    await fetch(`${API}/superadmin/tenants/${id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: next }),
    })
    await load()
    notify(`✅ تم التحديث`)
  }

  // ── Soft Delete ────────────────────────────────────────────
  const handleDelete = async () => {
    const confirmed = confirm('حذف هذا المشترك؟ (soft delete)')
    if (!confirmed) return

    await fetch(`${API}/superadmin/tenants/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    })
    notify('✅ تم الحذف')
    setTimeout(() => router.push('/ar/superadmin/tenants'), 1500)
  }

  // ── Extend Trial ───────────────────────────────────────────
  const handleExtendTrial = async () => {
    await fetch(`${API}/superadmin/tenants/${id}/extend-trial`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ days: trialDays }),
    })
    await load()
    notify(`✅ تم تمديد التجربة ${trialDays} يوم`)
  }

  if (loading) return <div className="p-12 text-center text-gray-400">جاري التحميل...</div>
  if (!tenant) return <div className="p-12 text-center text-gray-400">لم يتم العثور على المشترك</div>

  const isActive = tenant.status === 'active'

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Toast */}
      {msg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm z-50 shadow-lg">
          {msg}
        </div>
      )}

      {/* Back + Title */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700">
          <ArrowRight size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
          <p className="text-gray-400 text-sm">{tenant.slug}</p>
        </div>
        <span className={`mr-auto text-xs px-3 py-1 rounded-full ${
          isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {isActive ? 'نشط' : tenant.status}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'المستخدمين',  value: tenant.usersCount,    icon: Users },
          { label: 'الفروع',      value: tenant.branchesCount, icon: GitBranch },
          { label: 'الخطة',       value: tenant.plan || '—',   icon: Building2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <Icon size={20} className="text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-800">بيانات المشترك</h2>
          <button
            onClick={() => setEditMode(!editMode)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
          >
            <Edit2 size={14} />
            {editMode ? 'إلغاء' : 'تعديل'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'الاسم',         key: 'name' },
            { label: 'الإيميل',       key: 'email' },
            { label: 'الجوال',        key: 'phone' },
            { label: 'المدينة',       key: 'city' },
            { label: 'الحي',          key: 'district' },
            { label: 'نوع النشاط',    key: 'business_type' },
            { label: 'الرقم الضريبي', key: 'tax_number' },
            { label: 'الموقع',        key: 'website' },
          ].map(({ label, key }) => (
            <div key={key}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              {editMode ? (
                <input
                  value={(form as any)[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-800">{(tenant as any)[key] || '—'}</p>
              )}
            </div>
          ))}
        </div>

        {editMode && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        )}
      </div>

      {/* Dates */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">التواريخ</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {[
            { label: 'تاريخ الانضمام',    value: tenant.created_at },
            { label: 'بداية الاشتراك',    value: tenant.sub_start },
            { label: 'نهاية الاشتراك',    value: tenant.sub_end },
            { label: 'انتهاء التجربة',    value: tenant.trial_ends_at },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-gray-800">
                {value ? new Date(value).toLocaleDateString('ar-SA') : '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">الإجراءات</h2>

        <div className="flex flex-wrap gap-3">
          {/* Toggle active/inactive */}
          <button
            onClick={handleToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
              isActive
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
            }`}
          >
            {isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
            {isActive ? 'تعطيل المشترك' : 'تفعيل المشترك'}
          </button>

          {/* Soft delete */}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
          >
            <Trash2 size={16} />
            حذف المشترك
          </button>
        </div>

        {/* Extend trial */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <Clock size={16} className="text-gray-500" />
          <span className="text-sm text-gray-700">تمديد التجربة:</span>
          <input
            type="number"
            min={1}
            max={90}
            value={trialDays}
            onChange={e => setTrialDays(Number(e.target.value))}
            className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-blue-500"
          />
          <span className="text-sm text-gray-500">يوم</span>
          <button
            onClick={handleExtendTrial}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700"
          >
            تمديد
          </button>
        </div>
      </div>

    </div>
  )
}