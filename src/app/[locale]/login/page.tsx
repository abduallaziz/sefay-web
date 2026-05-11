'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { setSession } from '@/lib/auth'
import '@/styles/auth.css'

export default function LoginPage() {
  const t = useTranslations()
  const locale = useLocale()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await api.auth.login(email, password)
      const data = res.data

      setSession({
        token:       data.token,
        user:        data.user,
        tenant_id:   data.user.tenant_id,
        tenant_name: data.user.tenant_name || '',
        branch_id:   data.user.branch_id,
        branch_name: data.user.branch_name || '',
      })

      document.cookie = `token=${data.token}; path=/; max-age=86400`
      window.location.href = `/${locale}/dashboard`
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.loginError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-logo">
          <h1>Sefay</h1>
          <p>{t('auth.welcome')}</p>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleLogin}>
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label>{t('auth.email')}</label>
            <input
              type="email"
              placeholder="admin@sefay.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label>{t('auth.password')}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className={`auth-btn ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
          >
            {!loading && t('auth.loginBtn')}
          </button>
        </form>

        {/* Signup */}
        <div className="auth-footer">
          <div className="auth-footer-row">
            <span>{t('auth.noAccount')}</span>
            <a href={`/${locale}/signup`} className="auth-signup-btn">
              {t('auth.signupLink')} ✨
            </a>
          </div>
          <p className="auth-copyright">Sefay ERP © {new Date().getFullYear()}</p>
        </div>

        {/* Features */}
        <div className="auth-card-features">
          <div className="auth-card-feature"><span>🧾</span><span>إدارة الطلبات والمبيعات</span></div>
          <div className="auth-card-feature"><span>📊</span><span>تقارير وإحصائيات لحظية</span></div>
          <div className="auth-card-feature"><span>🏪</span><span>يدعم كافة أنواع الأنشطة</span></div>
          <div className="auth-card-feature"><span>👥</span><span>إدارة الموظفين والفروع</span></div>
        </div>

      </div>
    </div>
  )
}