import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import OnboardingWizard from '@/components/OnboardingWizard'

// هذه صفحة server component تتحقق من الـ token
export default async function OnboardingPage({
  params,
}: {
  params: { locale: string }
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  // إذا ما في token → رجّع للـ login
  if (!token) {
    redirect(`/${params.locale}/login`)
  }

  return <OnboardingWizard />
}