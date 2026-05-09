'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { setSession } from '@/lib/auth'
import '@/styles/auth.css'

export default function SignupPage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError(t('auth.passwordMismatch'))
      return
    }

    setLoading(true)
    try {
      const res = await api.auth.register({ name, email, password, phone })
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

      router.push(`/${locale}/onboarding`)
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.signupError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Sefay</h1>
          <p>{t('auth.signupWelcome')}</p>
        </div>

        <form className="auth-form" onSubmit={handleSignup}>
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label>{t('auth.name')}</label>
            <input
              type="text"
              placeholder={t('auth.namePlaceholder')}
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>{t('auth.email')}</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label>{t('auth.phone')}</label>
            <input
              type="tel"
              placeholder="05xxxxxxxx"
              value={phone}
              onChange={e => setPhone(e.target.value)}
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
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label>{t('auth.confirmPassword')}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className={`auth-btn ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
          >
            {!loading && t('auth.signupBtn')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {t('auth.hasAccount')}{' '}
            <a href={`/${locale}/login`}>{t('auth.loginLink')}</a>
          </p>
        </div>
      </div>
    </div>
  )
}