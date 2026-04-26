import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  const locale = pathname.split('/')[1] || routing.defaultLocale
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'

  const isProtected = pathWithoutLocale.startsWith('/dashboard')
  const isLoginPage = pathWithoutLocale.startsWith('/login')
  const isRoot      = pathWithoutLocale === '/' || pathWithoutLocale === ''

  if (isProtected && !token) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  if (isRoot) {
    if (token) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
    } else {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}