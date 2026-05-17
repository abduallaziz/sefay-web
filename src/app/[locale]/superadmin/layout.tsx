import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getLocale } from 'next-intl/server'
import SuperAdminSidebar from '@/components/layout/SuperAdminSidebar'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect(`/${locale}/login`)
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.role !== 'superadmin') {
      redirect(`/${locale}/dashboard`)
    }
  } catch {
    redirect(`/${locale}/login`)
  }

  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <div className="flex min-h-screen bg-[#0f1117]" dir={dir}>
      <SuperAdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}