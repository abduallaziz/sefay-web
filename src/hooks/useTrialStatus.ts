'use client'

import { useEffect, useState } from 'react'
import { getSession } from '@/lib/auth'

export interface TrialStatus {
  plan: string
  daysLeft: number
  isExpired: boolean
  trial_ends_at: string
}

export function useTrialStatus() {
  const [trial, setTrial] = useState<TrialStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrial() {
      const session = getSession()
      if (!session) { setLoading(false); return }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/business/trial`, {
          headers: { Authorization: `Bearer ${session.token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setTrial(data)
        }
      } catch {
        setTrial(null)
      } finally {
        setLoading(false)
      }
    }
    fetchTrial()
  }, [])

  return { trial, loading }
}