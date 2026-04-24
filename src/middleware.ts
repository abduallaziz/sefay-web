import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

const protectedRoutes = ['/dashboard']
const publicRoutes = ['/login']

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  const isProtected = protectedRoutes.some(route =>
    pathname.includes(route)
  )
  const isPublic = publicRoutes.some(route =>
    pathname.includes(route)
  )

  if (isProtected && !token) {
    const locale = pathname.split('/')[1] || routing.defaultLocale
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  if (isPublic && token) {
    const locale = pathname.split('/')[1] || routing.defaultLocale
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}