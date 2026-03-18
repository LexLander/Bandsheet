import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getAdminContextMock,
  getRootAdminContextMock,
  writeAuditMock,
  cleanupUserPresenceMock,
  finishUserDetailsMutationMock,
  finishAdminListMutationMock,
} = vi.hoisted(() => ({
  getAdminContextMock: vi.fn(),
  getRootAdminContextMock: vi.fn(),
  writeAuditMock: vi.fn(),
  cleanupUserPresenceMock: vi.fn(),
  finishUserDetailsMutationMock: vi.fn(),
  finishAdminListMutationMock: vi.fn(),
}))

vi.mock('@/app/admin/actions/_helpers', () => ({
  getAdminContext: getAdminContextMock,
  getRootAdminContext: getRootAdminContextMock,
  writeAudit: writeAuditMock,
  cleanupUserPresence: cleanupUserPresenceMock,
  finishUserDetailsMutation: finishUserDetailsMutationMock,
  finishAdminListMutation: finishAdminListMutationMock,
}))

import {
  blockUser,
  blacklistUser,
  hardDeleteUser,
  createAdminUser,
  removeAdminRights,
} from '@/app/admin/actions/users'

function createAdminMock() {
  const eqSelectSingle = vi.fn()
  const eqUpdate = vi.fn()
  const eqDelete = vi.fn()

  const select = vi.fn(() => ({ eq: vi.fn(() => ({ single: eqSelectSingle })) }))
  const update = vi.fn(() => ({ eq: eqUpdate }))
  const del = vi.fn(() => ({ eq: eqDelete }))
  const upsert = vi.fn().mockResolvedValue({ error: null })

  const from = vi.fn((table: string) => {
    if (table !== 'profiles') throw new Error(`Unexpected table: ${table}`)
    return {
      select,
      update,
      delete: del,
      upsert,
    }
  })

  return {
    from,
    auth: {
      admin: {
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
        createUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'new-admin-id' } },
          error: null,
        }),
      },
    },
    mocks: {
      eqSelectSingle,
      eqUpdate,
      eqDelete,
      upsert,
    },
  }
}

describe('admin users actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blockUser updates profile, writes audit and finishes details mutation', async () => {
    const admin = createAdminMock()
    getAdminContextMock.mockResolvedValue({ actor: { id: 'actor-1' }, admin })
    admin.mocks.eqSelectSingle.mockResolvedValue({ data: { id: 'u-1', is_root_admin: false }, error: null })
    admin.mocks.eqUpdate.mockResolvedValue({ error: null })

    const formData = new FormData()
    formData.set('target_user_id', 'u-1')
    formData.set('reason', 'abuse')

    await blockUser(formData)

    expect(writeAuditMock).toHaveBeenCalledWith('actor-1', 'u-1', 'block_user', { reason: 'abuse' })
    expect(finishUserDetailsMutationMock).toHaveBeenCalledWith('u-1')
  })

  it('hardDeleteUser forbids deleting admin by non-root actor', async () => {
    const admin = createAdminMock()
    getAdminContextMock.mockResolvedValue({ actor: { id: 'actor-1', is_root_admin: false }, admin })
    admin.mocks.eqSelectSingle.mockResolvedValue({
      data: { id: 'u-admin', email: 'admin@test.dev', platform_role: 'admin', is_root_admin: false },
      error: null,
    })

    const formData = new FormData()
    formData.set('target_user_id', 'u-admin')

    await expect(hardDeleteUser(formData)).rejects.toThrow('Лише головний адміністратор може видаляти адміністраторів')
    expect(cleanupUserPresenceMock).not.toHaveBeenCalled()
  })

  it('hardDeleteUser requires explicit DELETE confirmation', async () => {
    const admin = createAdminMock()
    getAdminContextMock.mockResolvedValue({ actor: { id: 'actor-1', is_root_admin: true }, admin })
    admin.mocks.eqSelectSingle.mockResolvedValue({
      data: { id: 'u-user', email: 'user@test.dev', platform_role: 'user', is_root_admin: false },
      error: null,
    })

    const formData = new FormData()
    formData.set('target_user_id', 'u-user')
    formData.set('delete_confirmation', 'WRONG')

    await expect(hardDeleteUser(formData)).rejects.toThrow('Підтвердіть видалення: введіть DELETE')
    expect(cleanupUserPresenceMock).not.toHaveBeenCalled()
  })

  it('blacklistUser requires explicit BLACKLIST confirmation', async () => {
    const admin = createAdminMock()
    getAdminContextMock.mockResolvedValue({ actor: { id: 'actor-1', is_root_admin: true }, admin })
    admin.mocks.eqSelectSingle.mockResolvedValue({
      data: { id: 'u-user', email: 'user@test.dev', is_root_admin: false },
      error: null,
    })

    const formData = new FormData()
    formData.set('target_user_id', 'u-user')
    formData.set('blacklist_confirmation', 'WRONG')

    await expect(blacklistUser(formData)).rejects.toThrow('Підтвердіть дію: введіть BLACKLIST')
    expect(cleanupUserPresenceMock).not.toHaveBeenCalled()
  })

  it('createAdminUser creates auth user, upserts profile and writes audit', async () => {
    const admin = createAdminMock()
    getRootAdminContextMock.mockResolvedValue({ actor: { id: 'root-1' }, admin })

    const formData = new FormData()
    formData.set('email', 'new-admin@test.dev')
    formData.set('password', 'StrongPass123')
    formData.set('name', 'New Admin')

    await createAdminUser(formData)

    expect(admin.auth.admin.createUser).toHaveBeenCalled()
    expect(admin.mocks.upsert).toHaveBeenCalled()
    expect(writeAuditMock).toHaveBeenCalledWith('root-1', 'new-admin-id', 'create_admin_user', {
      email: 'new-admin@test.dev',
    })
    expect(finishAdminListMutationMock).toHaveBeenCalled()
  })

  it('removeAdminRights updates role and writes audit for valid admin target', async () => {
    const admin = createAdminMock()
    getRootAdminContextMock.mockResolvedValue({ actor: { id: 'root-1' }, admin })
    admin.mocks.eqSelectSingle.mockResolvedValue({
      data: { id: 'u-2', is_root_admin: false, platform_role: 'admin' },
      error: null,
    })
    admin.mocks.eqUpdate.mockResolvedValue({ error: null })

    const formData = new FormData()
    formData.set('target_user_id', 'u-2')
    formData.set('remove_admin_confirmation', 'REMOVE_ADMIN')

    await removeAdminRights(formData)

    expect(writeAuditMock).toHaveBeenCalledWith('root-1', 'u-2', 'remove_admin_rights')
    expect(finishUserDetailsMutationMock).toHaveBeenCalledWith('u-2')
  })

  it('removeAdminRights requires explicit REMOVE_ADMIN confirmation', async () => {
    const admin = createAdminMock()
    getRootAdminContextMock.mockResolvedValue({ actor: { id: 'root-1' }, admin })
    admin.mocks.eqSelectSingle.mockResolvedValue({
      data: { id: 'u-2', is_root_admin: false, platform_role: 'admin' },
      error: null,
    })

    const formData = new FormData()
    formData.set('target_user_id', 'u-2')
    formData.set('remove_admin_confirmation', 'WRONG')

    await expect(removeAdminRights(formData)).rejects.toThrow('Підтвердіть дію: введіть REMOVE_ADMIN')
  })
})
