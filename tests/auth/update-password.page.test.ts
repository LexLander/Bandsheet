import { describe, expect, it, vi } from 'vitest'

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

import UpdatePasswordPage from '@/app/auth/update-password/page'

describe('/auth/update-password compatibility page', () => {
  it('redirects to unified /reset-password flow', () => {
    expect(() => UpdatePasswordPage()).toThrow('REDIRECT:/reset-password')
    expect(redirectMock).toHaveBeenCalledWith('/reset-password')
  })
})
