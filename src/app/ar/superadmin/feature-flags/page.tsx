'use client';

import { useState, useEffect } from 'react';

interface Tenant {
  id: string;
  name: string;
  plan: string;
  max_users: number | null;
  max_branches: number | null;
  max_invoices: number | null;
}

interface Flag {
  feature: string;
  label: string;
  group: string;
  enabled: boolean;
  note: string | null;
}

export default function FeatureFlagsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingFlags, setLoadingFlags] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Limits state
  const [maxUsers, setMaxUsers] = useState<string>('');
  const [maxBranches, setMaxBranches] = useState<string>('');
  const [maxInvoices, setMaxInvoices] = useState<string>('');
  const [unlimitedUsers, setUnlimitedUsers] = useState(false);
  const [unlimitedBranches, setUnlimitedBranches] = useState(false);
  const [unlimitedInvoices, setUnlimitedInvoices] = useState(false);
  const [savingLimits, setSavingLimits] = useState(false);

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
    setLoadingTenants(false);
  }

  async function fetchFlags(tenant: Tenant) {
    setSelectedTenant(tenant);
    setLoadingFlags(true);

    // Set limits
    setUnlimitedUsers(tenant.max_users === null);
    setMaxUsers(tenant.max_users?.toString() ?? '');
    setUnlimitedBranches(tenant.max_branches === null);
    setMaxBranches(tenant.max_branches?.toString() ?? '');
    setUnlimitedInvoices(tenant.max_invoices === null);
    setMaxInvoices(tenant.max_invoices?.toString() ?? '');

    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/superadmin/feature-flags/${tenant.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setFlags(data);
    setLoadingFlags(false);
  }

  async function toggleFlag(feature: string, enabled: boolean) {
    if (!selectedTenant) return;
    setSaving(feature);
    const token = localStorage.getItem('token');
    await fetch(`${API}/superadmin/feature-flags/${selectedTenant.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feature, enabled }),
    });
    setFlags((prev) =>
      prev.map((f) => (f.feature === feature ? { ...f, enabled } : f)),
    );
    setSaving(null);
  }

  async function saveLimits() {
    if (!selectedTenant) return;
    setSavingLimits(true);
    const token = localStorage.getItem('token');
    await fetch(`${API}/superadmin/tenants/${selectedTenant.id}/capabilities`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_users:    unlimitedUsers    ? null : parseInt(maxUsers) || null,
        max_branches: unlimitedBranches ? null : parseInt(maxBranches) || null,
        max_invoices: unlimitedInvoices ? null : parseInt(maxInvoices) || null,
      }),
    });
    setSavingLimits(false);
  }

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Feature Flags</h1>
      <div className="grid grid-cols-3 gap-6">

        {/* قائمة التيننتس */}
        <div className="col-span-1 bg-white rounded-xl border overflow-hidden">
          <div className="p-3 border-b">
            <input
              type="text"
              placeholder="ابحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {loadingTenants ? (
            <p className="p-4 text-sm text-gray-500">جاري التحميل...</p>
          ) : (
            <div className="divide-y max-h-[700px] overflow-y-auto">
              {filtered.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => fetchFlags(tenant)}
                  className={`w-full text-right px-4 py-3 text-sm hover:bg-gray-50 ${
                    selectedTenant?.id === tenant.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  <div className="font-medium">{tenant.name}</div>
                  <div className="text-xs text-gray-400">{tenant.plan}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* المحتوى */}
        <div className="col-span-2 space-y-4">
          {!selectedTenant ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
              اختر tenant من القائمة
            </div>
          ) : loadingFlags ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
              جاري التحميل...
            </div>
          ) : (
            <>
              {/* Limits */}
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <h2 className="font-semibold text-gray-700">الحدود — {selectedTenant.name}</h2>
                </div>
                <div className="p-4 space-y-4">
                  {/* Max Users */}
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-sm text-gray-600">عدد المستخدمين</div>
                    <label className="flex items-center gap-1.5 text-sm text-gray-500">
                      <input
                        type="checkbox"
                        checked={unlimitedUsers}
                        onChange={(e) => setUnlimitedUsers(e.target.checked)}
                        className="rounded"
                      />
                      بدون حد
                    </label>
                    {!unlimitedUsers && (
                      <input
                        type="number"
                        value={maxUsers}
                        onChange={(e) => setMaxUsers(e.target.value)}
                        placeholder="مثال: 10"
                        className="border rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>

                  {/* Max Branches */}
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-sm text-gray-600">عدد الفروع</div>
                    <label className="flex items-center gap-1.5 text-sm text-gray-500">
                      <input
                        type="checkbox"
                        checked={unlimitedBranches}
                        onChange={(e) => setUnlimitedBranches(e.target.checked)}
                        className="rounded"
                      />
                      بدون حد
                    </label>
                    {!unlimitedBranches && (
                      <input
                        type="number"
                        value={maxBranches}
                        onChange={(e) => setMaxBranches(e.target.value)}
                        placeholder="مثال: 5"
                        className="border rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>

                  {/* Max Invoices */}
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-sm text-gray-600">عدد الفواتير</div>
                    <label className="flex items-center gap-1.5 text-sm text-gray-500">
                      <input
                        type="checkbox"
                        checked={unlimitedInvoices}
                        onChange={(e) => setUnlimitedInvoices(e.target.checked)}
                        className="rounded"
                      />
                      بدون حد
                    </label>
                    {!unlimitedInvoices && (
                      <input
                        type="number"
                        value={maxInvoices}
                        onChange={(e) => setMaxInvoices(e.target.value)}
                        placeholder="مثال: 500"
                        className="border rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>

                  <button
                    onClick={saveLimits}
                    disabled={savingLimits}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {savingLimits ? 'جاري الحفظ...' : 'حفظ الحدود'}
                  </button>
                </div>
              </div>

              {/* Feature Flags */}
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <h2 className="font-semibold text-gray-700">الميزات</h2>
                </div>
                {['صفحات', 'capabilities'].map((group) => (
                  <div key={group}>
                    <div className="px-4 py-2 bg-gray-100 text-xs font-bold text-gray-500 uppercase">
                      {group}
                    </div>
                    {flags
                      .filter((f) => f.group === group)
                      .map((flag) => (
                        <label
                          key={flag.feature}
                          className="flex items-center justify-between px-4 py-3 border-b hover:bg-gray-50 cursor-pointer"
                        >
                          <div>
                            <div className="text-sm font-medium text-gray-700">
                              {flag.label}
                            </div>
                            <div className="text-xs text-gray-400">{flag.feature}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={flag.enabled}
                            disabled={saving === flag.feature}
                            onChange={() => toggleFlag(flag.feature, !flag.enabled)}
                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer disabled:opacity-50"
                          />
                        </label>
                      ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}