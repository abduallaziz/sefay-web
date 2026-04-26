'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { Tenant } from '@/types'
import { Save, Printer, Star, Upload, AlertTriangle } from 'lucide-react'
import '@/styles/modals.css'
import '@/styles/forms.css'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const locale = useLocale()

  const [tenant,  setTenant]  = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')
  const [tab,     setTab]     = useState<'company' | 'tax' | 'loyalty' | 'printer' | 'reset'>('company')
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetConfirm,   setResetConfirm]   = useState('')
  const [resetting,      setResetting]      = useState(false)
  const [newAdminPass,   setNewAdminPass]   = useState('')

  // Company
  const [name,      setName]      = useState('')
  const [phone,     setPhone]     = useState('')
  const [city,      setCity]      = useState('')
  const [website,   setWebsite]   = useState('')
  const [logoUrl,   setLogoUrl]   = useState('')
  const [uploading, setUploading] = useState(false)

  // Tax
  const [taxRate,   setTaxRate]   = useState('15')
  const [taxNumber, setTaxNumber] = useState('')

  // Loyalty
  const [loyaltyEnabled,      setLoyaltyEnabled]      = useState(false)
  const [loyaltyPointsPerSar, setLoyaltyPointsPerSar] = useState('1')
  const [loyaltyMinRedeem,    setLoyaltyMinRedeem]    = useState('100')
  const [loyaltyRedeemValue,  setLoyaltyRedeemValue]  = useState('1')

  // Printer
  const [autoPrint,    setAutoPrint]    = useState(false)
  const [printerType,  setPrinterType]  = useState('sunmi')
  const [printerWidth, setPrinterWidth] = useState('80')
  const [printFooter,  setPrintFooter]  = useState('')

  useEffect(() => { loadTenant() }, [])

  async function loadTenant() {
    setLoading(true)
    try {
      const session = getSession()
      if (!session) return
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', session.tenant_id)
        .single()
      if (data) {
        setTenant(data)
        setName(data.name || '')
        setPhone(data.phone || '')
        setCity(data.city || '')
        setWebsite(data.website || '')
        setLogoUrl(data.logo_url || '')
        setTaxRate(data.tax_rate !== null ? String(data.tax_rate) : '15')
        setTaxNumber(data.tax_number || '')
        const s = data.settings || {}
        setLoyaltyEnabled(s.loyalty_enabled || false)
        setLoyaltyPointsPerSar(String(s.loyalty_points_per_sar || 1))
        setLoyaltyMinRedeem(String(s.loyalty_min_redeem || 100))
        setLoyaltyRedeemValue(String(s.loyalty_redeem_value || 1))
        setAutoPrint(s.auto_print || false)
        setPrinterType(s.printer_type || 'sunmi')
        setPrinterWidth(String(s.printer_width || 80))
        setPrintFooter(s.print_footer || '')
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function uploadLogo(file: File) {
    setUploading(true)
    try {
      const session = getSession()
      if (!session) return
      const path = `logos/${session.tenant_id}.jpg`
      const { error } = await supabase.storage
        .from('washcloud')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('washcloud').getPublicUrl(path)
      setLogoUrl(data.publicUrl)
    } catch (e) { console.error(e) }
    finally { setUploading(false) }
  }

  async function saveTenant() {
    setSaving(true)
    try {
      const session = getSession()
      if (!session) return
      await supabase
        .from('tenants')
        .update({
          name, phone, city, website,
          logo_url: logoUrl || null,
          tax_rate: taxRate === '' ? 0 : Number(taxRate),
          tax_number: taxNumber,
          settings: {
            loyalty_enabled: loyaltyEnabled,
            loyalty_points_per_sar: Number(loyaltyPointsPerSar),
            loyalty_min_redeem: Number(loyaltyMinRedeem),
            loyalty_redeem_value: Number(loyaltyRedeemValue),
            auto_print: autoPrint,
            printer_type: printerType,
            printer_width: Number(printerWidth),
            print_footer: printFooter,
          },
        })
        .eq('id', session.tenant_id)
      showToast(locale === 'ar' ? '✅ تم حفظ الإعدادات' : '✅ Settings saved')
    } catch (e) {
      showToast(locale === 'ar' ? '❌ حدث خطأ' : '❌ Error occurred')
    } finally { setSaving(false) }
  }

  async function resetSystem() {
    if (resetConfirm !== 'RESET') return
    if (!newAdminPass.trim() || newAdminPass.length < 4) return
    setResetting(true)
    try {
      const session = getSession()
      if (!session) return
      const tid = session.tenant_id

      // حذف كل البيانات
      await supabase.from('order_items').delete().eq('order_id', (
        await supabase.from('orders').select('id').eq('tenant_id', tid)
      ).data?.map((o: any) => o.id) as any)
      await supabase.from('orders').delete().eq('tenant_id', tid)
      await supabase.from('expenses').delete().eq('tenant_id', tid)
      await supabase.from('queue').delete().eq('tenant_id', tid)
      await supabase.from('audit_logs').delete().eq('tenant_id', tid)
      await supabase.from('shifts').delete().eq('tenant_id', tid)
      await supabase.from('vehicles').delete().eq('tenant_id', tid)
      await supabase.from('customers').delete().eq('tenant_id', tid)

      // تحديث كلمة مرور الادمن
      await supabase
        .from('users')
        .update({ password: newAdminPass.trim() })
        .eq('tenant_id', tid)
        .eq('role', 'superadmin')

      showToast(locale === 'ar' ? '✅ تم إعادة تعيين النظام' : '✅ System reset complete')
      setShowResetModal(false)
      setResetConfirm('')
      setNewAdminPass('')
    } catch (e) {
      console.error(e)
      showToast(locale === 'ar' ? '❌ حدث خطأ أثناء الإعادة' : '❌ Reset failed')
    } finally { setResetting(false) }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  const TABS = [
    { id: 'company', labelAr: '🏢 الشركة',    labelEn: '🏢 Company' },
    { id: 'tax',     labelAr: '💰 الضريبة',   labelEn: '💰 Tax' },
    { id: 'loyalty', labelAr: '⭐ الولاء',    labelEn: '⭐ Loyalty' },
    { id: 'printer', labelAr: '🖨️ الطابعة',  labelEn: '🖨️ Printer' },
    { id: 'reset',   labelAr: '🔄 إعادة تعيين', labelEn: '🔄 Reset' },
  ]

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
    </div>
  )

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', insetInlineEnd: '24px',
          backgroundColor: 'var(--color-primary)', color: '#000',
          padding: '10px 20px', borderRadius: 'var(--radius-md)',
          fontWeight: '700', fontSize: '13px', zIndex: 1000,
        }}>
          {toast}
        </div>
      )}

      <div className="dashboard-page-header">
        <div>
          <h2 className="dashboard-page-title">{t('title')}</h2>
          <p className="dashboard-page-subtitle">{tenant?.name || ''}</p>
        </div>
        {tab !== 'reset' && (
          <button className="btn btn-primary" onClick={saveTenant} disabled={saving}>
            <Save size={14} />
            {saving ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t('save')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="table-filters" style={{ marginBottom: '20px' }}>
        {TABS.map(tb => (
          <button key={tb.id}
            className={`table-filter-btn ${tab === tb.id ? 'active' : ''}`}
            onClick={() => setTab(tb.id as any)}>
            {locale === 'ar' ? tb.labelAr : tb.labelEn}
          </button>
        ))}
      </div>

      {/* Company Tab */}
      {tab === 'company' && (
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: '20px',
        }}>
          <h3 className="form-section-title">
            {locale === 'ar' ? '🏢 معلومات الشركة' : '🏢 Company Info'}
          </h3>

          {/* Logo */}
          <div className="form-group">
            <label className="form-label">{locale === 'ar' ? 'شعار الشركة' : 'Company Logo'}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {logoUrl ? (
                <img src={logoUrl} alt="logo" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
              ) : (
                <div style={{
                  width: '80px', height: '80px', borderRadius: '12px',
                  backgroundColor: 'var(--color-primary-light)',
                  border: '1px solid var(--color-primary-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', fontWeight: '900', color: 'var(--color-primary)',
                }}>S</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <Upload size={13} />
                  {uploading ? (locale === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (locale === 'ar' ? 'رفع شعار' : 'Upload logo')}
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading}
                    onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                </label>
                {logoUrl && (
                  <button className="btn btn-danger btn-sm" onClick={() => setLogoUrl('')}>
                    {locale === 'ar' ? 'حذف الشعار' : 'Remove logo'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('shopName')} <span>*</span></label>
              <input id="s-name" name="s-name" className="form-input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('phone')}</label>
              <input id="s-phone" name="s-phone" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05XXXXXXXX" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('city')}</label>
              <input id="s-city" name="s-city" className="form-input" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('website')}</label>
              <input id="s-web" name="s-web" className="form-input" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" />
            </div>
          </div>

          <div style={{
            marginTop: '16px', padding: '12px 16px',
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              {locale === 'ar' ? 'الخطة الحالية' : 'Current Plan'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--color-primary)' }}>
              {tenant?.plan || 'Basic'}
            </div>
            {tenant?.sub_end && (
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {locale === 'ar' ? 'تنتهي في:' : 'Expires:'} {tenant.sub_end}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tax Tab */}
      {tab === 'tax' && (
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: '20px',
        }}>
          <h3 className="form-section-title">
            {locale === 'ar' ? '💰 إعدادات الضريبة' : '💰 Tax Settings'}
          </h3>
          <div className="form-group">
            <label className="form-label">{t('taxRate')} (%)</label>
            <div className="form-input-group">
              <input id="s-tax" name="s-tax" className="form-input" type="number" min="0" max="100"
                value={taxRate} onChange={e => setTaxRate(e.target.value)} placeholder="15" />
              <div className="form-input-group-addon">%</div>
            </div>
            <span className="form-hint">
              {locale === 'ar' ? 'أدخل 0 لتعطيل الضريبة' : 'Enter 0 to disable tax'}
            </span>
          </div>
          <div className="form-group">
            <label className="form-label">{t('taxNumber')}</label>
            <input id="s-taxnum" name="s-taxnum" className="form-input" value={taxNumber}
              onChange={e => setTaxNumber(e.target.value)} placeholder="3XXXXXXXXXXXXXXXX" />
          </div>
        </div>
      )}

      {/* Loyalty Tab */}
      {tab === 'loyalty' && (
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: '20px',
        }}>
          <h3 className="form-section-title">
            ⭐ {locale === 'ar' ? 'نقاط الولاء' : 'Loyalty Points'}
          </h3>

          <div className="form-switch" onClick={() => setLoyaltyEnabled(!loyaltyEnabled)} style={{ marginBottom: '16px' }}>
            <div>
              <div className="form-switch-label">
                {locale === 'ar' ? 'تفعيل نقاط الولاء' : 'Enable Loyalty Points'}
              </div>
              <div className="form-switch-desc">
                {locale === 'ar' ? 'العملاء يكسبون نقاط مع كل عملية شراء' : 'Customers earn points with every purchase'}
              </div>
            </div>
            <div style={{
              width: '40px', height: '22px', borderRadius: '11px',
              backgroundColor: loyaltyEnabled ? 'var(--color-primary)' : 'var(--color-border)',
              position: 'relative', transition: 'var(--transition)',
            }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%',
                backgroundColor: '#fff', position: 'absolute',
                top: '3px', transition: 'var(--transition)',
                left: loyaltyEnabled ? '21px' : '3px',
              }} />
            </div>
          </div>

          {loyaltyEnabled && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    {locale === 'ar' ? 'نقاط لكل ريال' : 'Points per SAR'}
                  </label>
                  <input id="s-lpp" name="s-lpp" className="form-input" type="number" min="0"
                    value={loyaltyPointsPerSar} onChange={e => setLoyaltyPointsPerSar(e.target.value)} />
                  <span className="form-hint">
                    {locale === 'ar' ? 'عدد النقاط لكل ريال ينفقه العميل' : 'Points earned per SAR spent'}
                  </span>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {locale === 'ar' ? 'الحد الأدنى للاسترداد (نقطة)' : 'Min redeem points'}
                  </label>
                  <input id="s-lmr" name="s-lmr" className="form-input" type="number" min="0"
                    value={loyaltyMinRedeem} onChange={e => setLoyaltyMinRedeem(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  {locale === 'ar' ? 'قيمة كل نقطة (ريال)' : 'Value per point (SAR)'}
                </label>
                <input id="s-lrv" name="s-lrv" className="form-input" type="number" min="0" step="0.01"
                  value={loyaltyRedeemValue} onChange={e => setLoyaltyRedeemValue(e.target.value)}
                  style={{ width: '150px' }} />
                <span className="form-hint">
                  {locale === 'ar' ? 'كل نقطة تساوي كم ريال عند الاسترداد' : 'SAR value of each point when redeemed'}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Printer Tab */}
      {tab === 'printer' && (
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: '20px',
        }}>
          <h3 className="form-section-title">
            🖨️ {locale === 'ar' ? 'إعدادات الطابعة' : 'Printer Settings'}
          </h3>

          <div className="form-switch" onClick={() => setAutoPrint(!autoPrint)} style={{ marginBottom: '16px' }}>
            <div>
              <div className="form-switch-label">
                {locale === 'ar' ? 'طباعة تلقائية عند الدفع' : 'Auto print on payment'}
              </div>
              <div className="form-switch-desc">
                {locale === 'ar' ? 'يطبع الفاتورة تلقائياً بعد كل عملية دفع' : 'Automatically prints receipt after each payment'}
              </div>
            </div>
            <div style={{
              width: '40px', height: '22px', borderRadius: '11px',
              backgroundColor: autoPrint ? 'var(--color-primary)' : 'var(--color-border)',
              position: 'relative', transition: 'var(--transition)',
            }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%',
                backgroundColor: '#fff', position: 'absolute',
                top: '3px', transition: 'var(--transition)',
                left: autoPrint ? '21px' : '3px',
              }} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'نوع الطابعة' : 'Printer Type'}</label>
              <select id="s-pt" name="s-pt" className="form-input form-select"
                value={printerType} onChange={e => setPrinterType(e.target.value)}>
                <option value="sunmi">Sunmi (Android)</option>
                <option value="bluetooth">Bluetooth</option>
                <option value="usb">USB</option>
                <option value="network">Network / WiFi</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{locale === 'ar' ? 'عرض الورق (mm)' : 'Paper width (mm)'}</label>
              <select id="s-pw" name="s-pw" className="form-input form-select"
                value={printerWidth} onChange={e => setPrinterWidth(e.target.value)}>
                <option value="58">58mm</option>
                <option value="80">80mm</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{locale === 'ar' ? 'نص أسفل الفاتورة' : 'Receipt footer text'}</label>
            <textarea id="s-pf" name="s-pf" className="form-input form-textarea"
              value={printFooter} onChange={e => setPrintFooter(e.target.value)}
              placeholder={locale === 'ar' ? 'شكراً لزيارتكم...' : 'Thank you for your visit...'} />
          </div>
        </div>
      )}

      {/* Reset Tab */}
      {tab === 'reset' && (
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '2px solid var(--color-danger-border)',
          borderRadius: 'var(--radius-lg)', padding: '20px',
        }}>
          <h3 className="form-section-title" style={{ color: 'var(--color-danger)' }}>
            ⚠️ {locale === 'ar' ? 'إعادة تعيين النظام' : 'System Reset'}
          </h3>

          <div style={{
            padding: '16px', borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-danger-light)',
            border: '1px solid var(--color-danger-border)',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <AlertTriangle size={20} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: '700', color: 'var(--color-danger)', marginBottom: '6px', fontSize: '14px' }}>
                  {locale === 'ar' ? 'تحذير: هذه العملية لا يمكن التراجع عنها!' : 'Warning: This action cannot be undone!'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                  {locale === 'ar'
                    ? 'سيتم حذف جميع البيانات التالية نهائياً:\n• جميع الطلبات والفواتير\n• جميع العملاء والمركبات\n• جميع المصروفات\n• سجلات المزامنة والتدقيق\n• سجلات الوردية\n\nسيتم الاحتفاظ بـ: الخدمات، الموظفين، الفروع، الإعدادات'
                    : 'The following data will be permanently deleted:\n• All orders and invoices\n• All customers and vehicles\n• All expenses\n• Sync and audit logs\n• Shift records\n\nWill be kept: Services, employees, branches, settings'}
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {locale === 'ar' ? 'كلمة مرور الادمن الجديدة (بعد الإعادة)' : 'New admin password (after reset)'}
              <span>*</span>
            </label>
            <input id="s-newpass" name="s-newpass" type="password" className="form-input"
              value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)}
              placeholder="••••••••" />
            <span className="form-hint">
              {locale === 'ar' ? 'ستحتاج هذه الكلمة للدخول بعد إعادة التعيين' : 'You will need this password to login after reset'}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">
              {locale === 'ar' ? 'اكتب RESET للتأكيد' : 'Type RESET to confirm'}
              <span>*</span>
            </label>
            <input id="s-reset" name="s-reset" className="form-input"
              value={resetConfirm} onChange={e => setResetConfirm(e.target.value)}
              placeholder="RESET"
              style={{ letterSpacing: '4px', fontWeight: '700' }} />
          </div>

          <button
            className="btn btn-danger"
            disabled={resetConfirm !== 'RESET' || !newAdminPass.trim() || newAdminPass.length < 4 || resetting}
            onClick={() => setShowResetModal(true)}
            style={{ width: '100%', padding: '14px', fontSize: '14px', fontWeight: '900' }}
          >
            {resetting
              ? (locale === 'ar' ? '⏳ جاري إعادة التعيين...' : '⏳ Resetting...')
              : (locale === 'ar' ? '🔄 إعادة تعيين النظام الآن' : '🔄 Reset System Now')}
          </button>
        </div>
      )}

      {/* Reset Confirm Modal */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--color-danger)' }}>
                ⚠️ {locale === 'ar' ? 'تأكيد نهائي' : 'Final Confirmation'}
              </h3>
            </div>
            <div className="modal-body">
              <div className="confirm-modal">
                <div className="confirm-modal-icon danger">⚠️</div>
                <div className="confirm-modal-title">
                  {locale === 'ar' ? 'هل أنت متأكد 100%؟' : 'Are you 100% sure?'}
                </div>
                <div className="confirm-modal-desc">
                  {locale === 'ar'
                    ? 'سيتم حذف جميع البيانات نهائياً. لا يمكن استعادتها.'
                    : 'All data will be permanently deleted. This cannot be undone.'}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowResetModal(false)}>
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button className="btn btn-danger" onClick={resetSystem} disabled={resetting}>
                {resetting
                  ? (locale === 'ar' ? 'جاري...' : 'Resetting...')
                  : (locale === 'ar' ? 'نعم، احذف كل شيء' : 'Yes, delete everything')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}