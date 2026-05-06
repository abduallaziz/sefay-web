'use client'

import { useTrialStatus } from '@/hooks/useTrialStatus'

export function TrialBanner() {
  const { trial, loading } = useTrialStatus()

  if (loading || !trial || trial.plan !== 'trial') return null

  if (trial.isExpired) {
    return (
      <div className="w-full bg-red-600 text-white text-center py-2 text-sm font-medium">
        انتهت فترة التجربة — يرجى الترقية للاستمرار
      </div>
    )
  }

  if (trial.daysLeft <= 7) {
    return (
      <div className="w-full bg-amber-500 text-white text-center py-2 text-sm font-medium">
        باقي {trial.daysLeft} {trial.daysLeft === 1 ? 'يوم' : 'أيام'} من فترة التجربة
      </div>
    )
  }

  return (
    <div className="w-full bg-blue-600 text-white text-center py-2 text-sm font-medium">
      أنت في فترة التجربة — باقي {trial.daysLeft} يوم
    </div>
  )
}