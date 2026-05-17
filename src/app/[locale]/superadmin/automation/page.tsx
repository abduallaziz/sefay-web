'use client'

import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL

export default function AutomationPage() {
  const [loadingExpired, setLoadingExpired] = useState(false)
  const [loadingExpiring, setLoadingExpiring] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const getToken = () => localStorage.getItem('token')

  async function runCheck(endpoint: string, setLoading: (v: boolean) => void) {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`${API}/superadmin/automation/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      setResult(data.message ?? 'تم')
    } catch {
      setResult('حصل خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">⚙️ الأتمتة</h1>

      {/* القواعد */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* إيقاف عند انتهاء الاشتراك */}
        <div className="border rounded-xl p-5 space-y-3 bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚫</span>
            <div>
              <h2 className="font-semibold text-lg">إيقاف عند انتهاء الاشتراك</h2>
              <p className="text-sm text-gray-500">يشتغل تلقائياً كل يوم الساعة 2 صباحاً</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
            <span>✅</span> مفعّل
          </div>
          <p className="text-sm text-gray-600">
            يفحص كل الاشتراكات المنتهية ويوقف الـ tenant تلقائياً ويسجل العملية في الـ Audit Log.
          </p>
          <button
            onClick={() => runCheck('run-expired-check', setLoadingExpired)}
            disabled={loadingExpired}
            className="w-full bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {loadingExpired ? 'جاري التشغيل...' : '▶ تشغيل الآن'}
          </button>
        </div>

        {/* تذكير قبل الانتهاء */}
        <div className="border rounded-xl p-5 space-y-3 bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔔</span>
            <div>
              <h2 className="font-semibold text-lg">تذكير قبل انتهاء الاشتراك</h2>
              <p className="text-sm text-gray-500">يشتغل تلقائياً كل يوم الساعة 9 صباحاً</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
            <span>✅</span> مفعّل
          </div>
          <p className="text-sm text-gray-600">
            يرسل إشعار لكل tenant اشتراكه ينتهي خلال 7 أيام.
          </p>
          <button
            onClick={() => runCheck('run-expiring-check', setLoadingExpiring)}
            disabled={loadingExpiring}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {loadingExpiring ? 'جاري التشغيل...' : '▶ تشغيل الآن'}
          </button>
        </div>

      </div>

      {/* نتيجة */}
      {result && (
        <div className="bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-700">
          📋 النتيجة: <span className="font-medium">{result}</span>
        </div>
      )}

      {/* معلومات */}
      <div className="border rounded-xl p-5 bg-blue-50 space-y-2">
        <h2 className="font-semibold text-blue-800">ℹ️ كيف تشتغل الأتمتة</h2>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>الـ Cron jobs تشتغل تلقائياً على الـ server بدون أي تدخل</li>
          <li>زر "تشغيل الآن" للاختبار اليدوي فقط</li>
          <li>كل عملية إيقاف تُسجل في Audit Log</li>
          <li>التذكيرات تظهر في صفحة الإشعارات لكل tenant</li>
        </ul>
      </div>
    </div>
  )
}