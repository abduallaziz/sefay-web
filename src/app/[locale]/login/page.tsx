'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { setSession } from '@/lib/auth'
import '@/styles/auth.css'

export default function LoginPage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()

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

      {/* بانر علوي */}
      <div className="auth-hero">
        <div className="auth-hero-badge">✦ نظام إدارة الأعمال</div>
        <h1 className="auth-hero-title">Sefay</h1>
        <p className="auth-hero-sub">منصة متكاملة لإدارة نشاطك التجاري</p>
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <p>{t('auth.welcome')}</p>
        </div>

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

        <div className="auth-footer">
          <p>
            {t('auth.noAccount')}{' '}
            <a href={`/${locale}/signup`}>{t('auth.signupLink')}</a>
          </p>
          <p className="auth-copyright">Sefay ERP © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}