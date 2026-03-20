import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  redirectMock,
  headersMock,
  createClientMock,
  fetchProfileByIdMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
  headersMock: vi.fn(),
  createClientMock: vi.fn(),
  fetchProfileByIdMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

vi.mock('next/headers', () => ({
  headers: headersMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/db/profiles', () => ({
  fetchProfileById: fetchProfileByIdMock,
}))

import {
  login,
  register,
  requestPasswordReset,
  updatePassword,
} from '@/app/(auth)/actions'

describe('auth actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL
    delete process.env.VERCEL_URL
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    headersMock.mockResolvedValue(new Headers())
  })

  it('login returns localized auth error', async () => {
    const supabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: { message: 'Invalid login credentials' } }),
      },
    }

    createClientMock.mockResolvedValue(supabase)

    const fd = new FormData()
    fd.set('email', 'x@test.dev')
    fd.set('password', 'bad')

    await expect(login(fd)).resolves.toEqual({ error: 'Невірний email або пароль' })
  })

  it('login validates required credentials before hitting auth provider', async () => {
    const signInWithPassword = vi.fn()
    createClientMock.mockResolvedValue({ auth: { signInWithPassword } })

    const fd = new FormData()
    fd.set('email', '   ')
    fd.set('password', '')

    await expect(login(fd)).resolves.toEqual({ error: 'Вкажіть email' })
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('login redirects admin to verify-device', async () => {
    const supabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u-1' } } }),
      },
    }

    createClientMock.mockResolvedValue(supabase)
    fetchProfileByIdMock.mockResolvedValue({ data: { platform_role: 'admin' } })

    const fd = new FormData()
    fd.set('email', 'admin@test.dev')
    fd.set('password', 'ok')

    await expect(login(fd)).rejects.toThrow('REDIRECT:/admin/verify-device')
  })

  it('login redirects to safe next path for non-admin user', async () => {
    const supabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u-10' } } }),
      },
    }

    createClientMock.mockResolvedValue(supabase)
    fetchProfileByIdMock.mockResolvedValue({ data: { platform_role: 'user' } })

    const fd = new FormData()
    fd.set('email', 'user@test.dev')
    fd.set('password', 'ok')
    fd.set('next', '/invite/abc123')

    await expect(login(fd)).rejects.toThrow('REDIRECT:/invite/abc123')
  })

  it('login signs out blocked user and returns blocked message', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u-2' } } }),
        signOut,
      },
    }

    createClientMock.mockResolvedValue(supabase)
    fetchProfileByIdMock.mockResolvedValue({ data: { is_blocked: true } })

    const fd = new FormData()
    fd.set('email', 'user@test.dev')
    fd.set('password', 'ok')

    await expect(login(fd)).resolves.toEqual({
      error: 'Ваш акаунт призупинено або внесено до чорного списку',
    })
    expect(signOut).toHaveBeenCalled()
  })

  it('register returns translated duplicate-user error', async () => {
    const supabase = {
      auth: {
        signUp: vi.fn().mockResolvedValue({ error: { message: 'User already registered' } }),
      },
    }

    createClientMock.mockResolvedValue(supabase)

    const fd = new FormData()
    fd.set('name', 'U')
    fd.set('email', 'user@test.dev')
    fd.set('password', '123456')

    await expect(register(fd)).rejects.toThrow('REDIRECT:/register?notice=duplicateEmail')
  })

  it('register validates required fields before sign up', async () => {
    const signUp = vi.fn()
    createClientMock.mockResolvedValue({ auth: { signUp } })

    const fd = new FormData()
    fd.set('name', '   ')
    fd.set('email', '   ')
    fd.set('password', '123')

    await expect(register(fd)).resolves.toEqual({ error: 'Вкажіть імʼя' })
    expect(signUp).not.toHaveBeenCalled()
  })

  it('register uses forwarded production host for email confirmation redirect', async () => {
    const signUp = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      auth: {
        signUp,
      },
    }

    createClientMock.mockResolvedValue(supabase)
    headersMock.mockResolvedValue(new Headers({
      host: 'bandsheet.vercel.app',
      'x-forwarded-host': 'bandsheet.vercel.app',
      'x-forwarded-proto': 'https',
    }))

    const fd = new FormData()
    fd.set('name', 'Prod User')
    fd.set('email', 'prod@test.dev')
    fd.set('password', '123456')

    await expect(register(fd)).rejects.toThrow('REDIRECT:/check-email')
    expect(signUp).toHaveBeenCalledWith({
      email: 'prod@test.dev',
      password: '123456',
      options: {
        data: { name: 'Prod User' },
        emailRedirectTo: 'https://bandsheet.vercel.app/auth/confirm',
      },
    })
  })

  it('register returns config error when app origin cannot be resolved', async () => {
    const signUp = vi.fn()
    createClientMock.mockResolvedValue({ auth: { signUp } })
    headersMock.mockResolvedValue(new Headers())
    process.env.NEXT_PUBLIC_APP_URL = ''

    const fd = new FormData()
    fd.set('name', 'User')
    fd.set('email', 'user@test.dev')
    fd.set('password', '123456')

    await expect(register(fd)).resolves.toEqual({
      error: 'Помилка конфігурації авторизації. Спробуйте пізніше',
    })
    expect(signUp).not.toHaveBeenCalled()
  })

  it('requestPasswordReset validates email', async () => {
    createClientMock.mockResolvedValue({ auth: { resetPasswordForEmail: vi.fn() } })

    const fd = new FormData()
    await expect(requestPasswordReset(fd)).resolves.toEqual({ error: 'Вкажіть email для відновлення пароля' })
  })

  it('requestPasswordReset returns config error when app origin cannot be resolved', async () => {
    const resetPasswordForEmail = vi.fn()
    createClientMock.mockResolvedValue({ auth: { resetPasswordForEmail } })
    headersMock.mockResolvedValue(new Headers())
    process.env.NEXT_PUBLIC_APP_URL = ''

    const fd = new FormData()
    fd.set('email', 'user@test.dev')

    await expect(requestPasswordReset(fd)).resolves.toEqual({
      error: 'Помилка конфігурації авторизації. Спробуйте пізніше',
    })
    expect(resetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('requestPasswordReset uses origin header and returns success', async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockResolvedValue({ auth: { resetPasswordForEmail } })
    headersMock.mockResolvedValue(new Headers({ origin: 'https://app.example.com' }))

    const fd = new FormData()
    fd.set('email', 'user@test.dev')

    await expect(requestPasswordReset(fd)).resolves.toEqual({ success: true })
    expect(resetPasswordForEmail).toHaveBeenCalledWith('user@test.dev', {
      redirectTo: 'https://app.example.com/auth/confirm?type=recovery&next=/reset-password',
    })
  })

  it('requestPasswordReset falls back to Vercel production url when headers are missing', async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockResolvedValue({ auth: { resetPasswordForEmail } })
    headersMock.mockResolvedValue(new Headers())
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'bandsheet.vercel.app'

    const fd = new FormData()
    fd.set('email', 'user@test.dev')

    await expect(requestPasswordReset(fd)).resolves.toEqual({ success: true })
    expect(resetPasswordForEmail).toHaveBeenCalledWith('user@test.dev', {
      redirectTo: 'https://bandsheet.vercel.app/auth/confirm?type=recovery&next=/reset-password',
    })
  })

  it('updatePassword validates mismatch', async () => {
    createClientMock.mockResolvedValue({ auth: { updateUser: vi.fn() } })

    const fd = new FormData()
    fd.set('password', '123456')
    fd.set('confirmPassword', '654321')

    await expect(updatePassword(fd)).resolves.toEqual({ error: 'Паролі не співпадають' })
  })

  it('updatePassword redirects on success', async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockResolvedValue({ auth: { updateUser } })

    const fd = new FormData()
    fd.set('password', '123456')
    fd.set('confirmPassword', '123456')

    await expect(updatePassword(fd)).rejects.toThrow('REDIRECT:/login?reset=success')
    expect(updateUser).toHaveBeenCalledWith({ password: '123456' })
  })
})
