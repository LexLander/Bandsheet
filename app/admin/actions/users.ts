'use server'

import {
  getAdminContext,
  getRootAdminContext,
  writeAudit,
  cleanupUserPresence,
  finishUserDetailsMutation,
  finishAdminListMutation,
} from './_helpers'

const ACTION_CONFIRMATIONS = {
  hardDelete: { field: 'delete_confirmation', value: 'DELETE', error: 'Підтвердіть видалення: введіть DELETE' },
  blacklist: { field: 'blacklist_confirmation', value: 'BLACKLIST', error: 'Підтвердіть дію: введіть BLACKLIST' },
  removeAdmin: { field: 'remove_admin_confirmation', value: 'REMOVE_ADMIN', error: 'Підтвердіть дію: введіть REMOVE_ADMIN' },
} as const

function requireActionConfirmation(
  formData: FormData,
  config: { field: string; value: string; error: string }
) {
  const confirmation = (formData.get(config.field) as string | null)?.trim().toUpperCase()
  if (confirmation !== config.value) {
    throw new Error(config.error)
  }
}

export async function blockUser(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const targetUserId = (formData.get('target_user_id') as string | null)?.trim()
  const reason = (formData.get('reason') as string | null)?.trim() || null
  if (!targetUserId) throw new Error('Вкажіть користувача')

  const { data: target } = await admin
    .from('profiles')
    .select('id, platform_role, is_root_admin')
    .eq('id', targetUserId)
    .single()

  if (!target) throw new Error('Користувача не знайдено')
  if (target.is_root_admin) throw new Error('Головного адміністратора не можна блокувати')

  const { error } = await admin
    .from('profiles')
    .update({ is_blocked: true, blocked_reason: reason })
    .eq('id', targetUserId)

  if (error) throw new Error('Не вдалося заблокувати користувача')

  await writeAudit(actor.id, targetUserId, 'block_user', { reason })
  finishUserDetailsMutation(targetUserId)
}

export async function unblockUser(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const targetUserId = (formData.get('target_user_id') as string | null)?.trim()
  if (!targetUserId) throw new Error('Вкажіть користувача')

  const { error } = await admin
    .from('profiles')
    .update({ is_blocked: false, blocked_reason: null })
    .eq('id', targetUserId)

  if (error) throw new Error('Не вдалося розблокувати користувача')

  await writeAudit(actor.id, targetUserId, 'unblock_user')
  finishUserDetailsMutation(targetUserId)
}

export async function blacklistUser(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const targetUserId = (formData.get('target_user_id') as string | null)?.trim()
  const reason = (formData.get('reason') as string | null)?.trim() || null
  if (!targetUserId) throw new Error('Вкажіть користувача')

  const { data: target } = await admin
    .from('profiles')
    .select('id, email, is_root_admin')
    .eq('id', targetUserId)
    .single()

  if (!target) throw new Error('Користувача не знайдено')
  if (target.is_root_admin) throw new Error('Головного адміністратора не можна внести в чорний список')

  requireActionConfirmation(formData, ACTION_CONFIRMATIONS.blacklist)

  await cleanupUserPresence(targetUserId, target.email)

  const { error } = await admin
    .from('profiles')
    .update({
      is_blacklisted: true,
      is_blocked: true,
      blacklisted_reason: reason,
      blocked_reason: reason,
    })
    .eq('id', targetUserId)

  if (error) throw new Error('Не вдалося оновити статус користувача')

  await writeAudit(actor.id, targetUserId, 'blacklist_user', { reason })
  finishUserDetailsMutation(targetUserId)
}

export async function hardDeleteUser(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const targetUserId = (formData.get('target_user_id') as string | null)?.trim()
  if (!targetUserId) throw new Error('Вкажіть користувача')

  const { data: target } = await admin
    .from('profiles')
    .select('id, email, platform_role, is_root_admin')
    .eq('id', targetUserId)
    .single()

  if (!target) throw new Error('Користувача не знайдено')
  if (target.is_root_admin) throw new Error('Головного адміністратора не можна видалити')
  if (target.platform_role === 'admin' && !actor.is_root_admin) {
    throw new Error('Лише головний адміністратор може видаляти адміністраторів')
  }

  requireActionConfirmation(formData, ACTION_CONFIRMATIONS.hardDelete)

  await cleanupUserPresence(targetUserId, target.email)
  await admin.from('profiles').delete().eq('id', targetUserId)

  const { error } = await admin.auth.admin.deleteUser(targetUserId)
  if (error) throw new Error(error.message ?? 'Не вдалося видалити auth-користувача')

  await writeAudit(actor.id, targetUserId, 'hard_delete_user')
  finishAdminListMutation()
}

export async function createAdminUser(formData: FormData) {
  const { actor, admin } = await getRootAdminContext()

  const email = (formData.get('email') as string | null)?.trim().toLowerCase()
  const password = (formData.get('password') as string | null)?.trim()
  const name = (formData.get('name') as string | null)?.trim() || 'Administrator'

  if (!email || !password) throw new Error('Email та пароль обовʼязкові')
  if (password.length < 9) throw new Error('Пароль має бути мінімум 9 символів')

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (error || !data.user) {
    throw new Error(error?.message ?? 'Не вдалося створити адміністратора')
  }

  await admin.from('profiles').upsert(
    {
      id: data.user.id,
      email,
      name,
      platform_role: 'admin',
      is_root_admin: false,
      is_blocked: false,
      is_blacklisted: false,
    },
    { onConflict: 'id' },
  )

  await writeAudit(actor.id, data.user.id, 'create_admin_user', { email })
  finishAdminListMutation()
}

export async function removeAdminRights(formData: FormData) {
  const { actor, admin } = await getRootAdminContext()

  const targetUserId = (formData.get('target_user_id') as string | null)?.trim()
  if (!targetUserId) throw new Error('Вкажіть користувача')

  const { data: target } = await admin
    .from('profiles')
    .select('id, is_root_admin, platform_role')
    .eq('id', targetUserId)
    .single()

  if (!target) throw new Error('Користувача не знайдено')
  if (target.is_root_admin) throw new Error('Головного адміністратора не можна розжалувати')
  if (target.platform_role !== 'admin') throw new Error('Користувач не є адміністратором')

  requireActionConfirmation(formData, ACTION_CONFIRMATIONS.removeAdmin)

  const { error } = await admin
    .from('profiles')
    .update({ platform_role: 'user' })
    .eq('id', targetUserId)

  if (error) throw new Error('Не вдалося змінити роль')

  await writeAudit(actor.id, targetUserId, 'remove_admin_rights')
  finishUserDetailsMutation(targetUserId)
}
