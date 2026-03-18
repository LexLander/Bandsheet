import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function makeDeviceHash(request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? 'unknown-ua'
  const lang = request.headers.get('accept-language') ?? 'unknown-lang'
  const platform = request.headers.get('sec-ch-ua-platform') ?? 'unknown-platform'
  const source = `${ua}|${lang}|${platform}`

  // Lightweight deterministic hash for device fingerprinting in middleware runtime.
  let hash = 5381
  for (let i = 0; i < source.length; i += 1) {
    hash = ((hash << 5) + hash) + source.charCodeAt(i)
    hash |= 0
  }
  return `d${Math.abs(hash)}`
}

// Обновляет сессию Supabase и редиректит неавторизованных пользователей
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname
  const isApiRoute = pathname.startsWith('/api')
  const isMaintenanceRoute = pathname.startsWith('/maintenance')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Получаем текущего пользователя (обновляет токен если нужно)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: maintenanceSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('id', 'maintenance_enabled')
    .maybeSingle()

  const maintenanceEnabled = maintenanceSetting?.value?.trim().toLowerCase() === 'true'

  // Список защищённых маршрутов — редиректим на /login если не авторизован
  const protectedPaths = ['/dashboard', '/library', '/events', '/groups', '/profile', '/admin']
  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )

  const userOnlyPaths = ['/dashboard', '/library', '/events', '/groups', '/profile']
  const isUserOnlyPath = userOnlyPaths.some((path) => pathname.startsWith(path))

  if (!user && maintenanceEnabled && !isMaintenanceRoute && !isApiRoute) {
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('platform_role, is_blocked, is_blacklisted')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.platform_role === 'admin'

    if (maintenanceEnabled && !isAdmin && !isMaintenanceRoute && !isApiRoute) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }

    if (maintenanceEnabled && isAdmin && isMaintenanceRoute) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    if (profile?.is_blocked || profile?.is_blacklisted) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?reason=blocked', request.url))
    }

    if (isAdmin && isUserOnlyPath) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    if (pathname.startsWith('/admin')) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      const isVerifyRoute = pathname.startsWith('/admin/verify-device')
      if (!isVerifyRoute) {
        const deviceHash = makeDeviceHash(request)
        const { data: trustedDevice } = await supabase
          .from('admin_device_registry')
          .select('id, is_trusted')
          .eq('admin_id', user.id)
          .eq('device_hash', deviceHash)
          .eq('is_trusted', true)
          .maybeSingle()

        if (!trustedDevice) {
          return NextResponse.redirect(new URL('/admin/verify-device', request.url))
        }
      }
    }
  }

  // Если уже авторизован и заходит на /login или /register — редирект по роли
  if (user && (pathname === '/login' || pathname === '/register')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('platform_role')
      .eq('id', user.id)
      .single()

    if (profile?.platform_role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}
