'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { CheckCircle, ChevronRight, ChevronLeft, Building2, Wrench, FileText, Rocket, AlertCircle, Loader2 } from 'lucide-react'
import Step3Router, { type Step3Item } from './onboarding/step3'

type Step = 1 | 2 | 3 | 4
type State = 'RECOVERY' | 'ACTIVE' | 'COMPLETING' | 'RETRY' | 'COMPLETE' | 'ERROR'

interface OnboardingProgress {
  tenant_id: string; step: Step; business_type: string
  shop_name: string; phone: string; services: Step3Item[]; expires_at: number
}

const STORAGE_KEY = 'onboarding_progress'
const EXPIRY_MS = 24 * 60 * 60 * 1000

const BUSINESS_TYPES = [
  { id: 'car_wash',    emoji: '🚗', ar: 'غسيل سيارات', en: 'Car Wash' },
  { id: 'cafe',        emoji: '☕', ar: 'كافيه',        en: 'Café' },
  { id: 'restaurant',  emoji: '🍽️', ar: 'مطعم',        en: 'Restaurant' },
  { id: 'supermarket', emoji: '🛒', ar: 'سوبرماركت',   en: 'Supermarket' },
  { id: 'tailor',      emoji: '🧵', ar: 'خياطة',       en: 'Tailor' },
  { id: 'workshop',    emoji: '🔧', ar: 'ورشة',        en: 'Workshop' },
  { id: 'other',       emoji: '🏪', ar: 'أخرى',        en: 'Other' },
]

const DEFAULTS_BY_TYPE: Record<string, Step3Item[]> = {
  car_wash:    [{ name: 'غسيل خارجي', price: '30', duration: '20' }, { name: 'غسيل داخلي', price: '50', duration: '30' }, { name: 'بخار كامل', price: '80', duration: '45' }],
  cafe:        [{ name: 'قهوة', price: '15', category: 'مشروبات ساخنة' }, { name: 'شاي', price: '10', category: 'مشروبات ساخنة' }, { name: 'عصير', price: '20', category: 'مشروبات باردة' }],
  restaurant:  [{ name: 'وجبة رئيسية', price: '45', category: 'وجبات' }, { name: 'مقبلات', price: '25', category: 'مقبلات' }],
  supermarket: [{ name: 'منتج 1', price: '10', quantity: '100', sku: '' }, { name: 'منتج 2', price: '25', quantity: '50', sku: '' }],
  tailor:      [{ name: 'خياطة ثوب', price: '150', type: 'ثوب' }, { name: 'تعديل بنطلون', price: '50', type: 'بنطلون' }],
  workshop:    [{ name: 'تغيير زيت', price: '80', duration: '30' }, { name: 'فحص', price: '50', duration: '20' }],
  other:       [{ name: 'خدمة 1', price: '50' }],
}

function saveProgress(data: Omit<OnboardingProgress, 'expires_at'>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, expires_at: Date.now() + EXPIRY_MS })) } catch {}
}

function loadProgress(tenantId: string): OnboardingProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data: OnboardingProgress = JSON.parse(raw)
    if (data.tenant_id !== tenantId) return null
    if (Date.now() > data.expires_at) { localStorage.removeItem(STORAGE_KEY); return null }
    return data
  } catch { return null }
}

function clearProgress() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

export default function OnboardingWizard() {
  const locale = useLocale()
  const router = useRouter()
  const isAr = locale === 'ar'

  const [state,        setState]        = useState<State>('RECOVERY')
  const [step,         setStep]         = useState<Step>(1)
  const [businessType, setBusinessType] = useState('')
  const [shopName,     setShopName]     = useState('')
  const [phone,        setPhone]        = useState('')
  const [services,     setServices]     = useState<Step3Item[]>([])
  const [retryCount,   setRetryCount]   = useState(0)
  const [errorMsg,     setErrorMsg]     = useState('')
  const [session,      setSessionState] = useState<ReturnType<typeof getSession>>(null)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.push(`/${locale}/login`); return }
    setSessionState(s)
    const saved = loadProgress(s.tenant_id)
    if (saved) {
      setStep(saved.step)
      setBusinessType(saved.business_type)
      setShopName(saved.shop_name)
      setPhone(saved.phone)
      setServices(saved.services)
    }
    setState('ACTIVE')
  }, [])

  useEffect(() => {
    if (state !== 'ACTIVE' || !session) return
    saveProgress({ tenant_id: session.tenant_id, step, business_type: businessType, shop_name: shopName, phone, services })
  }, [step, businessType, shopName, phone, services, state, session])

  function selectBusiness(type: string) {
    setBusinessType(type)
    setServices(DEFAULTS_BY_TYPE[type] || DEFAULTS_BY_TYPE.other)
  }

  const complete = useCallback(async (attempt = 1) => {
    if (!session) return
    setState('COMPLETING')
    setErrorMsg('')
    try {
      const { error: tenantErr } = await supabase
        .from('tenants')
        .update({ name: shopName.trim() || undefined, phone: phone.trim() || undefined, business_type: businessType, onboarded: true })
        .eq('id', session.tenant_id)
      if (tenantErr) throw tenantErr

      await supabase.from('items').delete().eq('tenant_id', session.tenant_id).eq('is_default', true)

      const validServices = services.filter(s => s.name.trim() && Number(s.price) > 0)
      const toInsert = validServices.length > 0
        ? validServices
        : [DEFAULTS_BY_TYPE[businessType]?.[0] || { name: 'Service', price: '50' }]

      await supabase.from('items').insert(
        toInsert.map(s => ({
          tenant_id: session.tenant_id,
          branch_id: session.branch_id,
          name: s.name.trim(),
          price: Number(s.price),
          active: true,
          is_default: validServices.length === 0,
          ...(s.duration ? { duration: Number(s.duration) } : {}),
          ...(s.category ? { category: s.category } : {}),
          ...(s.type ? { service_type: s.type } : {}),
        }))
      )

      clearProgress()
      setState('COMPLETE')
      setTimeout(() => { router.push(`/${locale}/dashboard/orders`) }, 2500)
    } catch (err: any) {
      console.error(`Attempt ${attempt} failed:`, err)
      if (attempt < 3) {
        setState('RETRY')
        setRetryCount(attempt)
        setTimeout(() => complete(attempt + 1), attempt === 1 ? 2000 : 4000)
      } else {
        setState('ERROR')
        setErrorMsg(isAr ? 'فشل الحفظ. تحقق من الإنترنت وحاول مجدداً.' : 'Save failed. Check your connection and try again.')
      }
    }
  }, [session, shopName, phone, businessType, services, locale, isAr])

  const STEPS = [
    { num: 1 as Step, icon: Building2, ar: 'نوع النشاط', en: 'Business' },
    { num: 2 as Step, icon: FileText,  ar: 'معلومات',    en: 'Info' },
    { num: 3 as Step, icon: Wrench,    ar: 'الخدمات',    en: 'Services' },
    { num: 4 as Step, icon: Rocket,    ar: 'جاهز',       en: 'Ready' },
  ]

  const canNext = (step === 1 && !!businessType) || (step === 2 && !!shopName.trim()) || step === 3 || step === 4

  if (state === 'RECOVERY') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '580px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)' }}>

        {/* Progress */}
        <div style={{ padding: '28px 28px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px' }}>
            {STEPS.map((s, i) => (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: step > s.num ? 'var(--color-success)' : step === s.num ? 'var(--color-primary)' : 'var(--color-bg-tertiary)', border: `2px solid ${step > s.num ? 'var(--color-success)' : step === s.num ? 'var(--color-primary)' : 'var(--color-border)'}`, transition: 'all 0.3s' }}>
                  {step > s.num ? <CheckCircle size={18} color="#000" /> : <s.icon size={17} color={step === s.num ? '#000' : 'var(--color-text-muted)'} />}
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: '2px', margin: '0 6px', backgroundColor: step > s.num ? 'var(--color-success)' : 'var(--color-border)', transition: 'all 0.3s' }} />}
              </div>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            {isAr ? `خطوة ${step} من ${STEPS.length}` : `Step ${step} of ${STEPS.length}`}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            {step === 1 && (isAr ? '👋 مرحباً! ما نوع نشاطك؟' : '👋 Welcome! What\'s your business?')}
            {step === 2 && (isAr ? '🏪 معلومات النشاط' : '🏪 Business Info')}
            {step === 3 && (isAr ? `⚙️ إعداد ${BUSINESS_TYPES.find(b => b.id === businessType)?.[isAr ? 'ar' : 'en'] || ''}` : `⚙️ Setup ${BUSINESS_TYPES.find(b => b.id === businessType)?.en || ''}`)}
            {step === 4 && (isAr ? '🎉 كل شيء جاهز!' : '🎉 You\'re All Set!')}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            {step === 1 && (isAr ? 'اختر نوع نشاطك التجاري' : 'Choose your business type')}
            {step === 2 && (isAr ? 'أدخل معلومات أساسية عن نشاطك' : 'Basic info about your business')}
            {step === 3 && (isAr ? 'يمكن تعديلها لاحقاً من صفحة المنتجات' : 'You can edit these later from Items')}
            {step === 4 && (isAr ? 'ابدأ في استخدام النظام الآن' : 'Start using the system now')}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '0 28px 28px' }}>

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
              {BUSINESS_TYPES.map(bt => (
                <div key={bt.id} onClick={() => selectBusiness(bt.id)}
                  style={{ padding: '16px 12px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: `2px solid ${businessType === bt.id ? 'var(--color-primary)' : 'var(--color-border)'}`, backgroundColor: businessType === bt.id ? 'var(--color-primary-light)' : 'var(--color-bg-tertiary)', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{bt.emoji}</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: businessType === bt.id ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>{isAr ? bt.ar : bt.en}</div>
                </div>
              ))}
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>{isAr ? 'اسم النشاط *' : 'Business Name *'}</label>
                <input className="form-input" value={shopName} onChange={e => setShopName(e.target.value)} placeholder={isAr ? 'مثال: غسيل الرياض' : 'e.g. Quick Wash'} style={{ fontSize: '15px', padding: '12px 16px' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>{isAr ? 'رقم الجوال' : 'Phone Number'}</label>
                <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05XXXXXXXX" style={{ fontSize: '15px', padding: '12px 16px' }} />
              </div>
            </div>
          )}

          {/* Step 3 — Dynamic */}
          {step === 3 && (
            <div>
              <Step3Router
                businessType={businessType}
                items={services}
                onChange={setServices}
              />
              <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                💡 {isAr ? 'إذا تخطيت هذه الخطوة سيتم إنشاء خدمة افتراضية تلقائياً' : 'Skip this step to auto-create a default service'}
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>🚀</div>

              {state === 'COMPLETE' && (
                <div style={{ padding: '16px', marginBottom: '16px', backgroundColor: 'var(--color-success-light)', border: '1px solid var(--color-success-border)', borderRadius: 'var(--radius-md)', fontSize: '15px', fontWeight: '700', color: 'var(--color-success)' }}>
                  ✅ {isAr ? 'تم الإعداد بنجاح! جاري التوجيه...' : 'Setup complete! Redirecting...'}
                </div>
              )}

              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                {isAr ? 'النظام جاهز للاستخدام!' : 'System is ready!'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                {isAr ? 'يمكنك الآن إنشاء طلبات وعرض التقارير' : 'You can now create orders and view reports'}
              </div>

              {[
                { ar: `نوع النشاط: ${BUSINESS_TYPES.find(b => b.id === businessType)?.ar}`, en: `Business: ${BUSINESS_TYPES.find(b => b.id === businessType)?.en}` },
                { ar: `الاسم: ${shopName}`, en: `Name: ${shopName}` },
                { ar: `العناصر: ${services.filter(s => s.name).length || 1}`, en: `Items: ${services.filter(s => s.name).length || 1}` },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: 'var(--color-success-light)', border: '1px solid var(--color-success-border)', borderRadius: 'var(--radius-sm)', marginBottom: '8px', textAlign: 'start' }}>
                  <CheckCircle size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-success)' }}>{isAr ? item.ar : item.en}</span>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {state === 'ERROR' && (
            <div style={{ marginTop: '16px', padding: '12px 14px', backgroundColor: 'var(--color-danger-light)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AlertCircle size={16} color="var(--color-danger)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: 'var(--color-danger)', fontWeight: '600' }}>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setStep(s => (s - 1) as Step)} disabled={step === 1 || state === 'COMPLETING' || state === 'RETRY'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text-primary)', cursor: step === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', opacity: step === 1 ? 0.3 : 1 }}>
            {isAr ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {isAr ? 'السابق' : 'Back'}
          </button>

          {step < 4 ? (
            <button onClick={() => setStep(s => (s + 1) as Step)} disabled={!canNext} className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: !canNext ? 0.4 : 1 }}>
              {isAr ? 'التالي' : 'Next'}
              {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <button onClick={() => complete(1)} disabled={state === 'COMPLETING' || state === 'RETRY' || state === 'COMPLETE'}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '15px', fontWeight: '900' }}>
              {(state === 'COMPLETING' || state === 'RETRY') && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              {state === 'COMPLETING' && (isAr ? 'جاري الحفظ...' : 'Saving...')}
              {state === 'RETRY'      && (isAr ? `محاولة ${retryCount + 1}...` : `Retry ${retryCount + 1}...`)}
              {state === 'ERROR'      && (isAr ? '🔄 حاول مجدداً' : '🔄 Try Again')}
              {state === 'COMPLETE'   && (isAr ? '✅ تم!' : '✅ Done!')}
              {state === 'ACTIVE'     && (isAr ? '🚀 ابدأ الآن' : '🚀 Get Started')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}