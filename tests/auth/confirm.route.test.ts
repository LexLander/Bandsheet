import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

import { GET } from '@/app/auth/confirm/route'

describe('GET /auth/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to dashboard after successful email confirmation', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockResolvedValue({ auth: { verifyOtp } })

    const response = await GET(new Request('https://bandsheet.vercel.app/auth/confirm?token_hash=hash-1&type=email') as never)

    expect(verifyOtp).toHaveBeenCalledWith({ type: 'email', token_hash: 'hash-1' })
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://bandsheet.vercel.app/dashboard')
  })

  it('sanitizes recovery next path and falls back to /reset-password', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockResolvedValue({ auth: { verifyOtp } })

    const response = await GET(new Request('https://bandsheet.vercel.app/auth/confirm?token_hash=hash-2&type=recovery&next=//evil.test') as never)

    expect(verifyOtp).toHaveBeenCalledWith({ type: 'recovery', token_hash: 'hash-2' })
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://bandsheet.vercel.app/reset-password')
  })

  it('redirects invalid or expired links to login error page', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: { message: 'expired' } })
    createClientMock.mockResolvedValue({ auth: { verifyOtp } })

    const response = await GET(new Request('https://bandsheet.vercel.app/auth/confirm?token_hash=hash-3&type=email') as never)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://bandsheet.vercel.app/login?error=invalid_link')
  })

  it('rejects unsupported confirmation types without calling supabase', async () => {
    const response = await GET(new Request('https://bandsheet.vercel.app/auth/confirm?token_hash=hash-4&type=magiclink') as never)

    expect(createClientMock).not.toHaveBeenCalled()
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://bandsheet.vercel.app/login?error=invalid_link')
  })
})