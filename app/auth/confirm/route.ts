import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function sanitizeNextPath(value: string | null) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed.startsWith('/')) return null
  if (trimmed.startsWith('//')) return null
  return trimmed
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const typeParam = searchParams.get('type')
  const type = typeParam === 'email' || typeParam === 'recovery' ? typeParam : null
  const nextParam = sanitizeNextPath(searchParams.get('next'))

  // Prevent open redirects and provide dedicated fallback for password recovery.
  const defaultNext = type === 'recovery' ? '/reset-password' : '/dashboard'
  const next = nextParam ?? defaultNext

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=invalid_link', request.url))
}
