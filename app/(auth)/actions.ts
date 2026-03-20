'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchProfileById } from '@/lib/db/profiles'

const errorMessages: Record<string, string> = {
  'Invalid login credentials': 'Невірний email або пароль',
  'Email not confirmed': 'Email ще не підтверджено. Перевір пошту',
  'User already registered': 'Користувач з таким email вже існує',
  'Email rate limit exceeded': 'Забагато спроб. Спробуй пізніше',
  'email rate limit exceeded': 'Забагато спроб. Спробуй пізніше',
  'Password should be at least 6 characters': 'Пароль має бути не менше 6 символів',
  'Unable to validate email address: invalid format': 'Невірний формат email',
  'Signup is disabled': 'Реєстрація тимчасово недоступна',
}

function translateError(message: string): string {
  return errorMessages[message] ?? message
}

function sanitizeNextPath(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed.startsWith('/')) return null
  if (trimmed.startsWith('//')) return null
  return trimmed
}

async function getAppOrigin() {
  const h = await headers()
  const origin = h.get('origin')?.trim()
  if (origin) {
    return origin.replace(/\/$/, '')
  }

  const host = h.get('x-forwarded-host')?.trim() || h.get('host')?.trim()
  if (host) {
    const proto = h.get('x-forwarded-proto')?.trim() || (host.includes('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim()
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
  }

  return (process.env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/\/$/, '')
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nextPath = sanitizeNextPath(formData.get('next') as string | null)

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: translateError(error.message) }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await fetchProfileById(supabase, user.id)

    if (profile?.is_blocked || profile?.is_blacklisted) {
      await supabase.auth.signOut()
      return { error: 'Ваш акаунт призупинено або внесено до чорного списку' }
    }

    if (profile?.platform_role === 'admin') {
      redirect('/admin/verify-device')
    }
  }

  redirect(nextPath ?? '/dashboard')
}

export async function register(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const appOrigin = await getAppOrigin()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${appOrigin}/auth/confirm`,
    },
  })

  if (error) {
    return { error: translateError(error.message) }
  }

  redirect('/check-email')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string | null)?.trim()
  if (!email) {
    return { error: 'Вкажіть email для відновлення пароля' }
  }

  const appOrigin = await getAppOrigin()
  const redirectTo = `${appOrigin}/auth/confirm?type=recovery&next=/reset-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  if (error) {
    return { error: translateError(error.message) }
  }

  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const password = (formData.get('password') as string | null)?.trim() ?? ''
  const confirmPassword = (formData.get('confirmPassword') as string | null)?.trim() ?? ''

  if (password.length < 6) {
    return { error: 'Пароль має бути не менше 6 символів' }
  }

  if (password !== confirmPassword) {
    return { error: 'Паролі не співпадають' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: translateError(error.message) }
  }

  redirect('/login?reset=success')
}
