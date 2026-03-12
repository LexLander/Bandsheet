import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Обновляет сессию Supabase и редиректит неавторизованных пользователей
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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

  // Список защищённых маршрутов — редиректим на /login если не авторизован
  const protectedPaths = ['/dashboard', '/library', '/events', '/groups', '/profile']
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Если уже авторизован и заходит на /login или /register — редирект на /dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}
