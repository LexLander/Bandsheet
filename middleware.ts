import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

const protectedAppPrefixes = ['/dashboard', '/library', '/events', '/groups', '/profile', '/admin']
const authPrefixes = [
  '/auth',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/check-email',
]
const publicPrefixes = ['/', '/invite', '/songs', '/maintenance']

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public and auth routes should pass without auth enforcement.
  if (startsWithAny(pathname, authPrefixes) || startsWithAny(pathname, publicPrefixes)) {
    return NextResponse.next()
  }

  if (startsWithAny(pathname, protectedAppPrefixes)) {
    return updateSession(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
