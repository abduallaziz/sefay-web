export interface Session {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  tenant_id: string
  tenant_name: string
  branch_id: string
  branch_name: string
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('session')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function setSession(session: Session) {
  localStorage.setItem('session', JSON.stringify(session))
  localStorage.setItem('token', session.token)
}

export function clearSession() {
  localStorage.removeItem('session')
  localStorage.removeItem('token')
}

export function isAuthenticated(): boolean {
  return !!getSession()
}