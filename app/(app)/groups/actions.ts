'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logServerError } from '@/lib/logger'

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user: user! }
}

export async function createGroup(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  // NOTE: removed verbose debug logging for production. Use `logServerError` for persistent logs.

  const name = (formData.get('name') as string).trim()
  if (!name) return { error: 'Введи назву групи' }

  // Idempotency check: if a group with same name was created by this leader
  // in the last 30 seconds, redirect to it instead of creating a duplicate.
  try {
    const { data: existing, error: rpcErr } = await supabase.rpc('find_recent_group_by_leader_name', { p_leader: user.id, p_name: name, p_seconds: 30 })
    if (rpcErr) {
      await logServerError('createGroup: duplicate_check rpc error', rpcErr)
    } else if (existing && Array.isArray(existing) && existing.length > 0) {
      // existing is an array with one row from SECURITY DEFINER helper
      // Redirect the user to the already-created group.
      redirect(`/groups/${existing[0].id}`)
    }
  } catch (err) {
    await logServerError('createGroup: duplicate_check exception', err)
  }

  // Ensure profile exists; without it groups.leader_id FK insert may fail.
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        name: user.user_metadata?.name ?? user.email?.split('@')[0] ?? null,
      },
      { onConflict: 'id' }
    )

  if (profileError) {
    return { error: 'Не вдалось підготувати профіль користувача' }
  }

  // Generate id in app to avoid INSERT ... RETURNING under restrictive SELECT RLS.
  const groupId = crypto.randomUUID()

  // Створюємо групу
  const { error: groupError } = await supabase
    .from('groups')
    .insert({ id: groupId, name, leader_id: user.id })

  if (groupError) {
    await logServerError('createGroup: group insert error', groupError)
    return { error: groupError.message ?? 'Не вдалось створити групу' }
  }

  // Додаємо лідера в group_members
  const { error: memberError } = await supabase.from('group_members').insert({
    group_id: groupId,
    user_id: user.id,
    role: 'leader',
  })

  if (memberError) {
    await logServerError('createGroup: group_members insert error', memberError)
    // Rollback orphan group so user can retry safely.
    await supabase.from('groups').delete().eq('id', groupId)
    return { error: memberError.message ?? 'Не вдалось додати вас у створену групу' }
  }

  redirect(`/groups/${groupId}`)
}

export async function inviteMember(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const group_id = formData.get('group_id') as string
  const selectedProfileId = (formData.get('invited_user_id') as string | null)?.trim() || null
  const emailInput = (formData.get('email') as string | null)?.trim().toLowerCase() || ''
  const role = (formData.get('role') as string) || 'member'

  // Перевіряємо що поточний юзер — лідер або заступник
  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', group_id)
    .eq('user_id', user.id)
    .single()

  if (!member || !['leader', 'deputy'].includes(member.role)) {
    return { error: 'Немає прав для запрошення' }
  }

  // Разрешаем приглашать только зарегистрированных пользователей
  const profileQuery = supabase
    .from('profiles')
    .select('id, email')

  const { data: profile, error: profileErr } = selectedProfileId
    ? await profileQuery.eq('id', selectedProfileId).maybeSingle()
    : await profileQuery.eq('email', emailInput).maybeSingle()

  if (profileErr) {
    return { error: 'Помилка при перевірці профілю' }
  }

  if (!profile || !profile.id || !profile.email) {
    return { error: 'Користувача з таким email не знайдено. Можна запрошувати лише зареєстрованих користувачів.' }
  }

  const email = profile.email.toLowerCase()

  // Видаляємо старі pending запрошення на цей email у цю групу
  await supabase
    .from('invitations')
    .delete()
    .eq('group_id', group_id)
    .eq('email', email)
    .eq('status', 'pending')

  const { error } = await supabase.from('invitations').insert({
    group_id,
    email,
    role,
    invited_user_id: profile.id,
  })

  if (error) return { error: 'Не вдалось створити запрошення' }

  revalidatePath(`/groups/${group_id}`)
  return { success: true }
}

export async function removeMember(groupId: string, userId: string) {
  const { supabase } = await getAuthContext()

  await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  revalidatePath(`/groups/${groupId}`)
}

export async function cancelInvitation(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const invitationId = formData.get('invitation_id') as string
  const groupId = formData.get('group_id') as string
  if (!invitationId || !groupId) return { error: 'Невірні дані запрошення' }

  // Only leader/deputy can cancel invitations for the group.
  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!member || !['leader', 'deputy'].includes(member.role)) {
    return { error: 'Немає прав для скасування запрошення' }
  }

  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)
    .eq('group_id', groupId)
    .eq('status', 'pending')

  if (error) return { error: 'Не вдалось скасувати запрошення' }

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

export async function acceptInvitation(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const token = (formData.get('token') as string) || (formData.get('invitation_token') as string)
  if (!token) return { error: 'Невірний токен' }

  try {
    const { data, error } = await supabase.rpc('accept_invitation', { p_token: token, p_user_id: user.id })
    if (error) {
      await logServerError('acceptInvitation rpc error', { error })
      return { error: error.message ?? 'Не вдалося прийняти запрошення' }
    }

    // RPC returns group_id as uuid (legacy installations may still return array)
    const resolvedGroupId = Array.isArray(data) ? (data[0] ?? null) : (data ?? null)

    revalidatePath('/groups')
    return { success: true, group: resolvedGroupId }
  } catch (err) {
    await logServerError('acceptInvitation exception', err)
    return { error: 'Помилка при прийомі запрошення' }
  }
}

export async function declineInvitation(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const invitationId = formData.get('invitation_id') as string
  if (!invitationId) return { error: 'Невірні дані' }

  // Only invited user may decline (policies allow this after migration)
  const { error } = await supabase
    .from('invitations')
    .update({ status: 'expired' })
    .eq('id', invitationId)
    .eq('invited_user_id', user.id)
    .eq('status', 'pending')

  if (error) {
    await logServerError('declineInvitation error', error)
    return { error: 'Не вдалося відхилити запрошення' }
  }

  revalidatePath('/groups')
  return { success: true }
}

export async function leaveGroup(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const groupId = formData.get('group_id') as string
  if (!groupId) return { error: 'Невірні дані' }

  // User may remove themselves from the group
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  if (error) {
    await logServerError('leaveGroup error', error)
    return { error: 'Не вдалося вийти з групи' }
  }

  revalidatePath('/groups')
  return { success: true }
}

export async function deleteGroup(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const groupId = formData.get('group_id') as string
  if (!groupId) return { error: 'Невірні дані' }

  // Only a leader may mark the group as deleted
  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'leader') {
    return { error: 'Немає прав на видалення групи' }
  }

  // Soft-delete: set flag and timestamp so it can be purged later
  const { error } = await supabase
    .from('groups')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', groupId)

  if (error) {
    await logServerError('deleteGroup error', error)
    return { error: 'Не вдалося позначити групу для видалення' }
  }

  revalidatePath('/groups')
  return { success: true }
}

export async function purgeMarkedGroup(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const groupId = formData.get('group_id') as string
  if (!groupId) return { error: 'Невірні дані' }

  // Only leader may permanently purge their own group that was marked
  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'leader') {
    return { error: 'Немає прав на видалення групи' }
  }

  // Ensure it's marked first
  const { data: group } = await supabase.from('groups').select('is_deleted').eq('id', groupId).single()
  if (!group || !group.is_deleted) return { error: 'Група не позначена для видалення' }

  const { error } = await supabase.from('groups').delete().eq('id', groupId)
  if (error) {
    await logServerError('purgeMarkedGroup error', error)
    return { error: 'Не вдалося остаточно видалити групу' }
  }

  revalidatePath('/groups')
  return { success: true }
}

export async function setGroupDeleted(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const groupId = formData.get('group_id') as string
  const isDeleted = (formData.get('is_deleted') as string) === 'true'
  if (!groupId) return { error: 'Невірні дані' }

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'leader') {
    return { error: 'Немає прав' }
  }

  const updatePayload: { is_deleted?: boolean; deleted_at?: string | null } = { is_deleted: isDeleted }
  if (isDeleted) updatePayload.deleted_at = new Date().toISOString()
  else updatePayload.deleted_at = null

  const { error } = await supabase.from('groups').update(updatePayload).eq('id', groupId)
  if (error) {
    await logServerError('setGroupDeleted error', error)
    return { error: 'Не вдалося оновити статус групи' }
  }

  revalidatePath('/groups')
  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

export async function bulkToggleGroups(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const ids = formData.getAll('group_ids') as string[]
  const isDeleted = (formData.get('is_deleted') as string) === 'true'
  if (!ids || ids.length === 0) return { error: 'Немає обраних груп' }

  // Fetch existing groups to see which ids belong to the current leader (for debugging)
  const { data: existingGroups, error: fetchErr } = await supabase
    .from('groups')
    .select('id, leader_id')
    .in('id', ids)

  if (fetchErr) {
    await logServerError('bulkToggleGroups: fetchErr', { fetchErr, ids, userId: user.id })
  } else {
    await logServerError('bulkToggleGroups: fetched', { existing: existingGroups, ids, userId: user.id })
  }

  // Only update groups where current user is leader
  const { data: updated, error } = await supabase
    .from('groups')
    .update({ is_deleted: isDeleted, deleted_at: isDeleted ? new Date().toISOString() : null })
    .in('id', ids)
    .eq('leader_id', user.id)
    .select('id')

  if (error) {
    await logServerError('bulkToggleGroups error', error)
    return { error: 'Не вдалося оновити статус груп' }
  }

  const updatedIds = (updated as Array<{ id: string }> | null) ? (updated as Array<{ id: string }>).map(r => r.id) : []
  await logServerError('bulkToggleGroups: updated', { updatedIds })

  revalidatePath('/groups')
  return { success: true }
}
