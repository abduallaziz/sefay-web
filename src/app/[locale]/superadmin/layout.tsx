import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import SuperAdminSidebar from '@/components/layout/SuperAdminSidebar'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/ar/login')
  }

  // decode JWT بدون verify (verify يصير في الـ API)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.role !== 'superadmin') {
      redirect('/ar/dashboard')
    }
  } catch {
    redirect('/ar/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-100" dir="rtl">
      <SuperAdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}