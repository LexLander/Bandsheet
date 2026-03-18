import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  redirectMock,
  createClientMock,
  logServerErrorMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
  createClientMock: vi.fn(),
  logServerErrorMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/logger', () => ({
  logServerError: logServerErrorMock,
}))

import {
  acceptInvitationFromPublic,
  declineInvitationFromPublic,
} from '@/app/(public)/invite/[token]/actions'

function makeSupabaseMock(options?: {
  userId?: string | null
  rpcData?: unknown
  rpcError?: unknown
  invitationData?: {
    id: string
    invited_user_id: string | null
    status: string
    expires_at: string | null
  } | null
  invitationError?: unknown
  declineUpdateError?: unknown
}) {
  const rpc = vi.fn().mockResolvedValue({ data: options?.rpcData ?? null, error: options?.rpcError ?? null })

  const maybeSingle = vi.fn().mockResolvedValue({
    data: options?.invitationData ?? null,
    error: options?.invitationError ?? null,
  })

  const selectEq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq: selectEq }))

  const updateEqStatus = vi.fn().mockResolvedValue({ error: options?.declineUpdateError ?? null })
  const updateEqId = vi.fn(() => ({ eq: updateEqStatus }))
  const update = vi.fn(() => ({ eq: updateEqId }))

  const from = vi.fn((table: string) => {
    if (table !== 'invitations') throw new Error(`Unexpected table: ${table}`)
    return {
      select,
      update,
    }
  })

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options?.userId ? { id: options.userId } : null },
      }),
    },
    rpc,
    from,
    __mocks: {
      maybeSingle,
      updateEqStatus,
    },
  }
}

describe('public invite actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('accept redirects unauthenticated user to login with next', async () => {
    const supabase = makeSupabaseMock({ userId: null })
    createClientMock.mockResolvedValue(supabase)

    const fd = new FormData()
    fd.set('token', 'abc123')

    await expect(acceptInvitationFromPublic(fd)).rejects.toThrow('REDIRECT:/login?next=%2Finvite%2Fabc123')
  })

  it('accept redirects to concrete group when rpc returns group id', async () => {
    const supabase = makeSupabaseMock({ userId: 'u-1', rpcData: 'group-42' })
    createClientMock.mockResolvedValue(supabase)

    const fd = new FormData()
    fd.set('token', 'abc123')

    await expect(acceptInvitationFromPublic(fd)).rejects.toThrow('REDIRECT:/groups/group-42?accepted=1')
  })

  it('accept redirects with error when rpc fails', async () => {
    const supabase = makeSupabaseMock({
      userId: 'u-1',
      rpcError: { message: 'rpc failed' },
    })
    createClientMock.mockResolvedValue(supabase)

    const fd = new FormData()
    fd.set('token', 'abc123')

    await expect(acceptInvitationFromPublic(fd)).rejects.toThrow('REDIRECT:/invite/abc123?error=accept_failed')
    expect(logServerErrorMock).toHaveBeenCalled()
  })

  it('decline rejects invitation for another user', async () => {
    const supabase = makeSupabaseMock({
      userId: 'u-1',
      invitationData: {
        id: 'inv-1',
        invited_user_id: 'u-2',
        status: 'pending',
        expires_at: null,
      },
    })
    createClientMock.mockResolvedValue(supabase)

    const fd = new FormData()
    fd.set('token', 'abc123')

    await expect(declineInvitationFromPublic(fd)).rejects.toThrow('REDIRECT:/invite/abc123?error=not_for_user')
  })

  it('decline marks invitation as expired and redirects with declined=1', async () => {
    const supabase = makeSupabaseMock({
      userId: 'u-1',
      invitationData: {
        id: 'inv-1',
        invited_user_id: 'u-1',
        status: 'pending',
        expires_at: null,
      },
    })
    createClientMock.mockResolvedValue(supabase)

    const fd = new FormData()
    fd.set('token', 'abc123')

    await expect(declineInvitationFromPublic(fd)).rejects.toThrow('REDIRECT:/invite/abc123?declined=1')
    expect(supabase.__mocks.updateEqStatus).toHaveBeenCalledWith('status', 'pending')
  })

  it('decline redirects with expired when invitation is outdated', async () => {
    const supabase = makeSupabaseMock({
      userId: 'u-1',
      invitationData: {
        id: 'inv-1',
        invited_user_id: 'u-1',
        status: 'pending',
        expires_at: '2000-01-01T00:00:00.000Z',
      },
    })
    createClientMock.mockResolvedValue(supabase)

    const fd = new FormData()
    fd.set('token', 'abc123')

    await expect(declineInvitationFromPublic(fd)).rejects.toThrow('REDIRECT:/invite/abc123?error=expired')
  })
})
