import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

// cache() мемоізує результат на час одного server-request —
// усі Server Components отримують той самий екземпляр клієнта
export const createClient = cache(async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // In Server Components (e.g. layouts/pages), Next.js forbids cookie mutation.
          // Supabase may still try to persist refreshed auth cookies, so we ignore writes here.
          // Real cookie writes are handled in middleware/route handlers.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // No-op by design: reading auth state in RSC must not crash the render.
          }
        },
      },
    }
  )
})

// Один мережевий виклик auth.getUser() на весь request-дерево
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
