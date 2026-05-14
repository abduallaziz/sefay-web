'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowRight, Building2, Phone, Mail, MapPin,
  Calendar, Users, GitBranch, Edit2, Trash2,
  ToggleLeft, ToggleRight, Clock, UserPlus,
  ShieldAlert, KeyRound, LogOut, Settings,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

type TenantDetail = {
  id: string; name: string; slug: string; plan: string; status: string
  phone: string; email: string; city: string; district: string
  street: string; address: string; vat_number: string; tax_number: string
  website: string; business_type: string; onboarded: boolean
  created_at: string; trial_ends_at: string | null
  sub_start: string | null; sub_end: string | null; timezone: string
  subscription: Record<string, any> | null
  usersCount: number; branchesCount: number
  max_users?: number; max_branches?: number
  capabilities?: Record<string, boolean>
}

type TenantUser = {
  id: string; name: string; email: string
  phone: string; role: string; is_active: boolean; created_at: string
}

const ROLES = ['owner', 'manager', 'cashier', 'worker']

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [tenant, setTenant]         = useState<TenantDetail | null>(null)
  const [users, setUsers]           = useState<TenantUser[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [editMode, setEditMode]     = useState(false)
  const [form, setForm]             = useState<Partial<TenantDetail>>({})
  const [trialDays, setTrialDays]   = useState(7)
  const [msg, setMsg]               = useState('')
  const [activeTab, setActiveTab]   = useState<'info' | 'users' | 'capabilities'>('info')

  // capabilities override form
  const [capForm, setCapForm] = useState({ max_users: 0, max_branches: 0 })

  // add user form
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', role: 'admin', password: '' })

  // reset password
  const [resetUserId, setResetUserId]   = useState<string | null>(null)
  const [newPassword, setNewPassword]   = useState('')

  const token = () => localStorage.getItem('token')

  const load = async () => {
  if (!id || id === '[id]') return
  setLoading(true)
  try {
    const [tRes, uRes] = await Promise.all([
      fetch(`${API}/superadmin/tenants/${id}`,       { headers: { Authorization: `Bearer ${token()}` } }),
      fetch(`${API}/superadmin/tenants/${id}/users`, { headers: { Authorization: `Bearer ${token()}` } }),
    ])
    const tData = await tRes.json()
    const uData = await uRes.json()
    setTenant(tData)
    setForm(tData)
    setCapForm({ max_users: tData.max_users ?? 0, max_branches: tData.max_branches ?? 0 })
    setUsers(Array.isArray(uData) ? uData : [])
  } finally {
    setLoading(false)
  }
}

useEffect(() => { if (id) load() }, [id])

  const notify = (text: string) => { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  const api = async (url: string, method = 'GET', body?: any) => {
    const res = await fetch(`${API}${url}`, {
      method,
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    return res
  }

  // ── Tenant actions ─────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api(`/superadmin/tenants/${id}`, 'PATCH', form)
      if (res.ok) { await load(); setEditMode(false); notify('✅ تم الحفظ') }
    } finally { setSaving(false) }
  }

  const handleToggle = async () => {
    if (!tenant) return
    const next = tenant.status === 'active' ? 'inactive' : 'active'
    if (!confirm(`تحويل الحالة إلى "${next === 'active' ? 'نشط' : 'معطل'}"؟`)) return
    await api(`/superadmin/tenants/${id}/status`, 'PATCH', { status: next })
    await load(); notify('✅ تم التحديث')
  }

  const handleDelete = async () => {
    if (!confirm('حذف هذا المشترك؟ (soft delete)')) return
    await api(`/superadmin/tenants/${id}`, 'DELETE')
    notify('✅ تم الحذف')
    setTimeout(() => router.push('/ar/superadmin/tenants'), 1500)
  }

  const handleExtendTrial = async () => {
    await api(`/superadmin/tenants/${id}/extend-trial`, 'PATCH', { days: trialDays })
    await load(); notify(`✅ تم تمديد التجربة ${trialDays} يوم`)
  }

  const handleRevokeSessions = async () => {
    if (!confirm('إلغاء كل sessions لهذا المشترك؟')) return
    await api(`/superadmin/tenants/${id}/revoke-sessions`, 'POST')
    notify('✅ تم إلغاء كل الجلسات')
  }

  // ── Capabilities ───────────────────────────────────────────
  const handleSaveCapabilities = async () => {
    await api(`/superadmin/tenants/${id}/capabilities`, 'PATCH', capForm)
    await load(); notify('✅ تم تحديث الصلاحيات')
  }

  // ── User actions ───────────────────────────────────────────
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      notify('⚠️ أدخل الاسم والإيميل وكلمة المرور')
      return
    }
    const res = await api(`/superadmin/tenants/${id}/users`, 'POST', newUser)
    if (res.ok) {
      setShowAddUser(false)
      setNewUser({ name: '', email: '', phone: '', role: 'admin', password: '' })
      await load(); notify('✅ تمت إضافة المستخدم')
    } else {
      const err = await res.json()
      notify(`❌ ${err.message ?? 'حدث خطأ'}`)
    }
  }

  const handleRemoveUser = async (userId: string, name: string) => {
    if (!confirm(`تعطيل مستخدم "${name}"؟`)) return
    await api(`/superadmin/users/${userId}`, 'DELETE')
    await load(); notify('✅ تم التعطيل')
  }

  const handleChangeRole = async (userId: string, role: string) => {
    await api(`/superadmin/users/${userId}/role`, 'PATCH', { role })
    await load(); notify('✅ تم تغيير الدور')
  }

  const handleResetPassword = async () => {
    if (!resetUserId || !newPassword) return
    await api(`/superadmin/users/${resetUserId}/reset-password`, 'PATCH', { password: newPassword })
    setResetUserId(null); setNewPassword(''); notify('✅ تم تغيير كلمة المرور')
  }

  if (loading) return <div className="p-12 text-center text-gray-400">جاري التحميل...</div>
  if (!tenant)  return <div className="p-12 text-center text-gray-400">لم يتم العثور على المشترك</div>

  const isActive = tenant.status === 'active'

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Toast */}
      {msg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm z-50 shadow-lg">
          {msg}
        </div>
      )}

      {/* Reset Password Modal */}
      {resetUserId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 space-y-4 shadow-xl">
            <h3 className="font-bold text-gray-900">تغيير كلمة المرور</h3>
            <input
              type="password"
              placeholder="كلمة المرور الجديدة"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button onClick={handleResetPassword}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">
                تغيير
              </button>
              <button onClick={() => { setResetUserId(null); setNewPassword('') }}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
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
          { label: 'المستخدمين', value: tenant.usersCount,    icon: Users },
          { label: 'الفروع',     value: tenant.branchesCount, icon: GitBranch },
          { label: 'الخطة',      value: tenant.plan || '—',   icon: Building2 },
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: 'info',         label: 'البيانات',    icon: Building2 },
          { key: 'users',        label: 'المستخدمين',  icon: Users },
          { key: 'capabilities', label: 'الصلاحيات',  icon: Settings },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === t.key
                ? 'bg-white shadow text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Info ───────────────────────────────────────── */}
      {activeTab === 'info' && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">بيانات المشترك</h2>
              <button onClick={() => setEditMode(!editMode)}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
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
              <button onClick={handleSave} disabled={saving}
                className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            )}
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">التواريخ</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                { label: 'تاريخ الانضمام', value: tenant.created_at },
                { label: 'بداية الاشتراك', value: tenant.sub_start },
                { label: 'نهاية الاشتراك', value: tenant.sub_end },
                { label: 'انتهاء التجربة', value: tenant.trial_ends_at },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-gray-800">{value ? new Date(value).toLocaleDateString('ar-SA') : '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">الإجراءات</h2>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                  isActive
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                    : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                }`}>
                {isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                {isActive ? 'تعطيل المشترك' : 'تفعيل المشترك'}
              </button>

              <button onClick={handleRevokeSessions}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100">
                <LogOut size={16} />
                إلغاء كل الجلسات
              </button>

              <button onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
                <Trash2 size={16} />
                حذف المشترك
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <Clock size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700">تمديد التجربة:</span>
              <input type="number" min={1} max={90} value={trialDays}
                onChange={e => setTrialDays(Number(e.target.value))}
                className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-blue-500"
              />
              <span className="text-sm text-gray-500">يوم</span>
              <button onClick={handleExtendTrial}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700">
                تمديد
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Tab: Users ──────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">المستخدمين ({users.length})</h2>
            <button onClick={() => setShowAddUser(!showAddUser)}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
              <UserPlus size={14} />
              إضافة مستخدم
            </button>
          </div>

          {/* Add User Form */}
          {showAddUser && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
              <p className="text-sm font-medium text-gray-700">مستخدم جديد</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { placeholder: 'الاسم*',       key: 'name' },
                  { placeholder: 'الإيميل*',     key: 'email' },
                  { placeholder: 'الجوال',       key: 'phone' },
                  { placeholder: 'كلمة المرور*', key: 'password', type: 'password' },
                ].map(({ placeholder, key, type }) => (
                  <input key={key} type={type || 'text'} placeholder={placeholder}
                    value={(newUser as any)[key]}
                    onChange={e => setNewUser(u => ({ ...u, [key]: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                ))}
                <select value={newUser.role}
                  onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddUser}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                  إضافة
                </button>
                <button onClick={() => setShowAddUser(false)}
                  className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">الاسم</th>
                  <th className="pb-2 font-medium">الإيميل</th>
                  <th className="pb-2 font-medium">الدور</th>
                  <th className="pb-2 font-medium">الحالة</th>
                  <th className="pb-2 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-3 text-gray-900">{u.name}</td>
                    <td className="py-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="py-3">
                      <select
                        value={u.role}
                        onChange={e => handleChangeRole(u.id, e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {u.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setResetUserId(u.id); setNewPassword('') }}
                          className="text-blue-500 hover:text-blue-700"
                          title="تغيير كلمة المرور"
                        >
                          <KeyRound size={15} />
                        </button>
                        <button
                          onClick={() => handleRemoveUser(u.id, u.name)}
                          className="text-red-400 hover:text-red-600"
                          title="تعطيل"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">لا يوجد مستخدمين</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Capabilities ───────────────────────────────── */}
      {activeTab === 'capabilities' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="font-semibold text-gray-800">Override الصلاحيات</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">الحد الأقصى للمستخدمين</label>
              <input type="number" min={0}
                value={capForm.max_users}
                onChange={e => setCapForm(f => ({ ...f, max_users: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">الحالي: {tenant.usersCount} / {tenant.max_users ?? '—'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">الحد الأقصى للفروع</label>
              <input type="number" min={0}
                value={capForm.max_branches}
                onChange={e => setCapForm(f => ({ ...f, max_branches: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">الحالي: {tenant.branchesCount} / {tenant.max_branches ?? '—'}</p>
            </div>
          </div>

          <button onClick={handleSaveCapabilities}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700">
            حفظ التغييرات
          </button>
        </div>
      )}

    </div>
  )
}