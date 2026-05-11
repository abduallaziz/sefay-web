'use client'

import { useTrialStatus } from '@/hooks/useTrialStatus'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'

export function TrialBanner() {
  const { trial, loading } = useTrialStatus()
  const locale = useLocale()
  const pathname = usePathname()

  const isUpgradePage = pathname.includes('/upgrade')

  if (loading || !trial || trial.plan !== 'trial') return null

  if (trial.isExpired) {
    return (
      <>
        <div className="w-full bg-red-600 text-white text-center py-2 text-sm font-medium">
          انتهت فترة التجربة — يرجى الترقية للاستمرار
        </div>

        {!isUpgradePage && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '40px',
              maxWidth: '420px',
              width: '90%',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <div style={{ fontSize: '48px' }}>🔒</div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-text-primary)' }}>
                انتهت فترة التجربة
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                لمواصلة استخدام Sefay، يرجى الترقية إلى إحدى الخطط المدفوعة
              </p>
              <a
                href={`/${locale}/dashboard/upgrade`}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '15px',
                  padding: '13px',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                ترقية الخطة
              </a>
            </div>
          </div>
        )}
      </>
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