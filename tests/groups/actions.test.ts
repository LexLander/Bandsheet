import { beforeEach, describe, expect, it, vi } from 'vitest'

const { redirectMock, revalidatePathMock, createClientMock, logServerErrorMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
  revalidatePathMock: vi.fn(),
  createClientMock: vi.fn(),
  logServerErrorMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/logger', () => ({
  logServerError: logServerErrorMock,
}))

import {
  createGroup,
  inviteMember,
  deleteGroup,
  bulkToggleGroups,
} from '@/app/(app)/groups/actions'

function makeAuthUser() {
  return {
    id: 'user-1',
    email: 'leader@test.dev',
    user_metadata: { name: 'Leader' },
  }
}

describe('groups actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createGroup validates non-empty name', async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: makeAuthUser() } }) },
    })

    const fd = new FormData()
    fd.set('name', '   ')

    const result = await createGroup(fd)
    expect(result).toEqual({ error: 'Введи назву групи' })
  })

  it('inviteMember denies when actor has no leader/deputy role', async () => {
    const single = vi.fn().mockResolvedValue({ data: { role: 'member' } })

    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: makeAuthUser() } }) },
      from: vi.fn((table: string) => {
        if (table !== 'group_members') throw new Error(`Unexpected table: ${table}`)
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ single })) })) })),
        }
      }),
    }

    createClientMock.mockResolvedValue(supabase)

    const fd = new FormData()
    fd.set('group_id', 'g-1')
    fd.set('email', 'target@test.dev')

    const result = await inviteMember(fd)
    expect(result).toEqual({ error: 'Немає прав для запрошення' })
  })

  it('inviteMember creates invitation on happy path', async () => {
    const roleSingle = vi.fn().mockResolvedValue({ data: { role: 'leader' } })
    const profileMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'target-1', email: 'target@test.dev' },
      error: null,
    })
    const deleteStatusEq = vi.fn().mockResolvedValue({ error: null })
    const invitationsInsert = vi.fn().mockResolvedValue({ error: null })

    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: makeAuthUser() } }) },
      from: vi.fn((table: string) => {
        if (table === 'group_members') {
          return {
            select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ single: roleSingle })) })) })),
          }
        }
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: profileMaybeSingle })) })),
          }
        }
        if (table === 'invitations') {
          return {
            delete: vi.fn(() => ({
              eq: vi.fn(() => ({ eq: vi.fn(() => ({ eq: deleteStatusEq })) })),
            })),
            insert: invitationsInsert,
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    createClientMock.mockResolvedValue(supabase)

    const fd = new FormData()
    fd.set('group_id', 'g-1')
    fd.set('email', 'target@test.dev')
    fd.set('role', 'member')

    const result = await inviteMember(fd)

    expect(result).toEqual({ success: true })
    expect(invitationsInsert).toHaveBeenCalledWith({
      group_id: 'g-1',
      email: 'target@test.dev',
      role: 'member',
      invited_user_id: 'target-1',
    })
    expect(revalidatePathMock).toHaveBeenCalledWith('/groups/g-1')
  })

  it('deleteGroup blocks non-leader', async () => {
    const roleSingle = vi.fn().mockResolvedValue({ data: { role: 'member' } })

    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: makeAuthUser() } }) },
      from: vi.fn((table: string) => {
        if (table !== 'group_members') throw new Error(`Unexpected table: ${table}`)
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ single: roleSingle })) })) })),
        }
      }),
    }

    createClientMock.mockResolvedValue(supabase)

    const fd = new FormData()
    fd.set('group_id', 'g-22')

    const result = await deleteGroup(fd)
    expect(result).toEqual({ error: 'Немає прав на видалення групи' })
  })

  it('bulkToggleGroups validates non-empty ids', async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: makeAuthUser() } }) },
    })

    const fd = new FormData()
    fd.set('is_deleted', 'true')

    const result = await bulkToggleGroups(fd)
    expect(result).toEqual({ error: 'Немає обраних груп' })
  })
})
