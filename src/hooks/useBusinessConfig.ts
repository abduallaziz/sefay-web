'use client'

import { useEffect, useState } from 'react'
import { getSession } from '@/lib/auth'

export interface BusinessConfig {
  capabilities: string[]
  item_type: string
  operation_type: string
}

export function useBusinessConfig() {
  const [config, setConfig] = useState<BusinessConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchConfig() {
      const session = getSession()
      if (!session) { setLoading(false); return }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/business/config`, {
          headers: { Authorization: `Bearer ${session.token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setConfig(data)
        }
      } catch {
        setConfig({ capabilities: [], item_type: 'PRODUCT', operation_type: 'SELL' })
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  const hasCapability = (cap: string) =>
    config?.capabilities?.includes(cap) ?? false

  return { config, loading, hasCapability }
}