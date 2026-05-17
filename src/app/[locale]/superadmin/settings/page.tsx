'use client'

import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import api from '@/lib/api'

interface Setting {
  key: string
  value: string
}

async function fetchSettings(): Promise<Record<string, string>> {
  const { data } = await api.get('/superadmin/support/settings')
  const map: Record<string, string> = {}
  if (Array.isArray(data)) {
    data.forEach((s: Setting) => { map[s.key] = s.value })
  }
  return map
}

async function saveSetting(payload: { key: string; value: string }) {
  await api.post('/superadmin/support/settings', payload)
}

export default function SettingsPage() {
  const t = useTranslations('superadmin.settings')
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['superadmin', 'settings'],
    queryFn: fetchSettings,
  })

  const { mutate, isPending, variables } = useMutation({
    mutationFn: saveSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'settings'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('title')}</h1>

      <div className="bg-[#141720] rounded-xl border border-[#1e2130] p-6 space-y-4">
        {Object.entries(settings ?? {}).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between py-3 border-b border-[#1e2130] last:border-0"
          >
            <div>
              <p className="font-medium text-sm text-white">
                {t(`keys.${key}` as any) ?? key}
              </p>
              <p className="text-xs text-gray-500">{key}</p>
            </div>

            <div className="flex items-center gap-3">
              {value === 'true' || value === 'false' ? (
                <button
                  onClick={() =>
                    mutate({ key, value: value === 'true' ? 'false' : 'true' })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    value === 'true' ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      value === 'true' ? 'translate-x-1' : 'translate-x-7'
                    }`}
                  />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue={value}
                    onBlur={(e) => mutate({ key, value: e.target.value })}
                    className="bg-[#0f1117] border border-[#1e2130] text-white rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {isPending && variables?.key === key && (
                    <RefreshCw size={14} className="animate-spin text-blue-400" />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}