'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Tenant {
  id: string;
  name: string;
  plan: string;
  is_active: boolean;
}

export default function ImpersonatePage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/superadmin/tenants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setTenants(data.tenants || data || []);
    setLoading(false);
  }

  async function handleImpersonate(tenantId: string, tenantName: string) {
    const confirmed = confirm(`هل تريد الدخول بحساب "${tenantName}"؟`);
    if (!confirmed) return;

    setImpersonating(tenantId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/superadmin/impersonate/${tenantId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('فشل الاتصال');

      const data = await res.json();

      const originalToken = localStorage.getItem('token');
      const originalUser = localStorage.getItem('user');
      localStorage.setItem('superadmin_token', originalToken || '');
      localStorage.setItem('superadmin_user', originalUser || '');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      router.push('/ar/dashboard');
    } catch {
      alert('حدث خطأ أثناء الدخول');
    } finally {
      setImpersonating(null);
    }
  }

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">دخول بحساب Tenant</h1>
        <p className="text-sm text-gray-500 mt-1">
          ستدخل بصلاحيات الـ owner — تنتهي الجلسة بعد ساعتين
        </p>
      </div>

      <input
        type="text"
        placeholder="ابحث عن tenant..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading ? (
        <p className="text-gray-500">جاري التحميل...</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-right">الاسم</th>
                <th className="px-4 py-3 text-right">الخطة</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-right">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{tenant.name}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        tenant.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {tenant.is_active ? 'نشط' : 'معطّل'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleImpersonate(tenant.id, tenant.name)}
                      disabled={impersonating === tenant.id}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {impersonating === tenant.id ? 'جاري الدخول...' : 'دخول'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}