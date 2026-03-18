import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  redirectMock,
  revalidatePathMock,
  headersMock,
  createClientMock,
  requireAdminActorMock,
  makeDeviceHashFromHeadersMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
  revalidatePathMock: vi.fn(),
  headersMock: vi.fn(),
  createClientMock: vi.fn(),
  requireAdminActorMock: vi.fn(),
  makeDeviceHashFromHeadersMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({ redirect: redirectMock }))
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }))
vi.mock('next/headers', () => ({ headers: headersMock }))
vi.mock('@/lib/supabase/server', () => ({ createClient: createClientMock }))
vi.mock('@/lib/admin/guards', () => ({ requireAdminActor: requireAdminActorMock }))
vi.mock('@/app/admin/actions/_helpers', () => ({ makeDeviceHashFromHeaders: makeDeviceHashFromHeadersMock }))

import { verifyAdminDevice } from '@/app/admin/actions/security'

describe('verifyAdminDevice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminActorMock.mockResolvedValue({ id: 'admin-1' })
    headersMock.mockResolvedValue(new Headers({ 'user-agent': 'UA', 'accept-language': 'uk', 'sec-ch-ua-platform': 'macOS' }))
    makeDeviceHashFromHeadersMock.mockReturnValue('d123')
  })

  it('redirects to config error when ADMIN_2FA_CODE is missing', async () => {
    vi.stubEnv('ADMIN_2FA_CODE', '')

    const fd = new FormData()
    fd.set('code', '111111')

    await expect(verifyAdminDevice(fd)).rejects.toThrow('REDIRECT:/admin/verify-device?error=config')
  })

  it('redirects to invalid_code when code does not match', async () => {
    vi.stubEnv('ADMIN_2FA_CODE', '123456')

    const fd = new FormData()
    fd.set('code', '654321')

    await expect(verifyAdminDevice(fd)).rejects.toThrow('REDIRECT:/admin/verify-device?error=invalid_code')
  })

  it('redirects to device_save_failed on upsert error', async () => {
    vi.stubEnv('ADMIN_2FA_CODE', '123456')

    const upsert = vi.fn().mockResolvedValue({ error: { message: 'db fail' } })
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ upsert })),
    })

    const fd = new FormData()
    fd.set('code', '123456')

    await expect(verifyAdminDevice(fd)).rejects.toThrow('REDIRECT:/admin/verify-device?error=device_save_failed')
  })

  it('revalidates and redirects to /admin on success', async () => {
    vi.stubEnv('ADMIN_2FA_CODE', '123456')

    const upsert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn(() => ({ upsert }))
    createClientMock.mockResolvedValue({ from })

    const fd = new FormData()
    fd.set('code', '123456')

    await expect(verifyAdminDevice(fd)).rejects.toThrow('REDIRECT:/admin')

    expect(from).toHaveBeenCalledWith('admin_device_registry')
    expect(upsert).toHaveBeenCalled()
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
  })
})
