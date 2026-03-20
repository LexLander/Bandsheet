import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

import { updateSession } from '@/lib/supabase/middleware'

function makeChain(options: { singleData?: unknown; maybeSingleData?: unknown }) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn().mockResolvedValue({ data: options.singleData ?? null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: options.maybeSingleData ?? null }),
  }

  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  return chain
}

function makeSupabaseMock({
  user = null,
  maintenanceEnabled = 'false',
  profile = null,
  trustedDevice = null,
}: {
  user?: { id: string } | null
  maintenanceEnabled?: string
  profile?: Record<string, unknown> | null
  trustedDevice?: Record<string, unknown> | null
} = {}) {
  const signOut = vi.fn().mockResolvedValue({ error: null })
  const settingsChain = makeChain({ maybeSingleData: { value: maintenanceEnabled } })
  const profileChain = makeChain({ singleData: profile })
  const trustedDeviceChain = makeChain({ maybeSingleData: trustedDevice })

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
      signOut,
    },
    from: vi.fn((table: string) => {
      if (table === 'site_settings') return settingsChain
      if (table === 'profiles') return profileChain
      if (table === 'admin_device_registry') return trustedDeviceChain
      throw new Error(`Unexpected table: ${table}`)
    }),
    signOut,
  }
}

describe('supabase middleware auth flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated protected requests to login and preserves next path', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())

    const request = new NextRequest('https://bandsheet.vercel.app/library?q=worship')
    const response = await updateSession(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://bandsheet.vercel.app/login?next=%2Flibrary%3Fq%3Dworship')
  })

  it('signs out blocked users and redirects to blocked login state', async () => {
    const supabase = makeSupabaseMock({
      user: { id: 'user-1' },
      profile: { platform_role: 'user', is_blocked: true, is_blacklisted: false },
    })
    createServerClientMock.mockReturnValue(supabase)

    const request = new NextRequest('https://bandsheet.vercel.app/dashboard')
    const response = await updateSession(request)

    expect(supabase.signOut).toHaveBeenCalled()
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://bandsheet.vercel.app/login?reason=blocked')
  })

  it('redirects signed in admins away from login page to admin dashboard', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock({
      user: { id: 'admin-1' },
      profile: { platform_role: 'admin', is_blocked: false, is_blacklisted: false },
    }))

    const request = new NextRequest('https://bandsheet.vercel.app/login')
    const response = await updateSession(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://bandsheet.vercel.app/admin')
  })
})