import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  const supportedLocales = ['ar', 'en']
  const firstSegment = pathname.split('/')[1]
  const locale = supportedLocales.includes(firstSegment) ? firstSegment : routing.defaultLocale
  const pathWithoutLocale = supportedLocales.includes(firstSegment)
    ? pathname.slice(firstSegment.length + 1) || '/'
    : pathname

  const isProtected = pathWithoutLocale.startsWith('/dashboard')
  const isAuthPage  = pathWithoutLocale === '/login' || pathWithoutLocale === '/signup'
  const isRoot      = pathWithoutLocale === '/' || pathWithoutLocale === ''

  if (isProtected && !token) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  if (isRoot) {
    return token
      ? NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
      : NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}