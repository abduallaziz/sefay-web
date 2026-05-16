'use client';

import { useState, useEffect } from 'react';

interface Tenant {
  id: string;
  name: string;
  plan: string;
}

interface Flag {
  feature: string;
  label: string;
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

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Feature Flags</h1>
      <div className="grid grid-cols-3 gap-6">
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
            <div className="divide-y max-h-[600px] overflow-y-auto">
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
        <div className="col-span-2">
          {!selectedTenant ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
              اختر tenant من القائمة
            </div>
          ) : loadingFlags ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
              جاري التحميل...
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-700">
                  {selectedTenant.name}
                </h2>
              </div>
              <div className="divide-y">
                {flags.map((flag) => (
                  <div
                    key={flag.feature}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        {flag.label}
                      </div>
                      <div className="text-xs text-gray-400">{flag.feature}</div>
                    </div>
                    <button
                      onClick={() => toggleFlag(flag.feature, !flag.enabled)}
                      disabled={saving === flag.feature}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        flag.enabled ? 'bg-green-500' : 'bg-gray-300'
                      } disabled:opacity-50`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          flag.enabled ? 'translate-x-1' : 'translate-x-6'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}