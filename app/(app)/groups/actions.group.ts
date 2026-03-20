'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logServerError } from '@/lib/logger'
import { getAuthContext } from './actions.auth'
import { GROUPS_LIST_PATH, parseBooleanFormValue, parseRequiredFormValue } from './actions.shared'

async function requireLeaderRole(
  supabase: Awaited<ReturnType<typeof getAuthContext>>['supabase'],
  groupId: string,
  userId: string
) {
  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()

  return member?.role === 'leader'
}

export async function createGroup(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const name = parseRequiredFormValue(formData, 'name')
  if (!name) return { error: 'Введи назву групи' }

  try {
    const { data: existing, error: rpcErr } = await supabase.rpc(
      'find_recent_group_by_leader_name',
      { p_leader: user.id, p_name: name, p_seconds: 30 }
    )

    if (rpcErr) {
      await logServerError('createGroup: duplicate_check rpc error', rpcErr)
    } else if (existing && Array.isArray(existing) && existing.length > 0) {
      redirect(`/groups/${existing[0].id}`)
    }
  } catch (err) {
    await logServerError('createGroup: duplicate_check exception', err)
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      name: user.user_metadata?.name ?? user.email?.split('@')[0] ?? null,
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    return { error: 'Не вдалось підготувати профіль користувача' }
  }

  const groupId = crypto.randomUUID()
  const { error: groupError } = await supabase.from('groups').insert({
    id: groupId,
    name,
    leader_id: user.id,
  })

  if (groupError) {
    await logServerError('createGroup: group insert error', groupError)
    return { error: groupError.message ?? 'Не вдалось створити групу' }
  }

  const { error: memberError } = await supabase.from('group_members').insert({
    group_id: groupId,
    user_id: user.id,
    role: 'leader',
  })

  if (memberError) {
    await logServerError('createGroup: group_members insert error', memberError)
    await supabase.from('groups').delete().eq('id', groupId)
    return { error: memberError.message ?? 'Не вдалось додати вас у створену групу' }
  }

  redirect(`/groups/${groupId}`)
}

export async function leaveGroup(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const groupId = parseRequiredFormValue(formData, 'group_id')
  if (!groupId) return { error: 'Невірні дані' }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  if (error) {
    await logServerError('leaveGroup error', error)
    return { error: 'Не вдалося вийти з групи' }
  }

  revalidatePath(GROUPS_LIST_PATH)
  return { success: true }
}

export async function deleteGroup(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const groupId = parseRequiredFormValue(formData, 'group_id')
  if (!groupId) return { error: 'Невірні дані' }

  const isLeader = await requireLeaderRole(supabase, groupId, user.id)
  if (!isLeader) {
    return { error: 'Немає прав на видалення групи' }
  }

  const { error } = await supabase
    .from('groups')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', groupId)

  if (error) {
    await logServerError('deleteGroup error', error)
    return { error: 'Не вдалося позначити групу для видалення' }
  }

  revalidatePath(GROUPS_LIST_PATH)
  return { success: true }
}

export async function purgeMarkedGroup(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const groupId = parseRequiredFormValue(formData, 'group_id')
  if (!groupId) return { error: 'Невірні дані' }

  const isLeader = await requireLeaderRole(supabase, groupId, user.id)
  if (!isLeader) {
    return { error: 'Немає прав на видалення групи' }
  }

  const { data: group } = await supabase
    .from('groups')
    .select('is_deleted')
    .eq('id', groupId)
    .single()
  if (!group || !group.is_deleted) return { error: 'Група не позначена для видалення' }

  const { error } = await supabase.from('groups').delete().eq('id', groupId)
  if (error) {
    await logServerError('purgeMarkedGroup error', error)
    return { error: 'Не вдалося остаточно видалити групу' }
  }

  revalidatePath(GROUPS_LIST_PATH)
  return { success: true }
}

export async function setGroupDeleted(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const groupId = parseRequiredFormValue(formData, 'group_id')
  const isDeleted = parseBooleanFormValue(formData, 'is_deleted')
  if (!groupId) return { error: 'Невірні дані' }

  const isLeader = await requireLeaderRole(supabase, groupId, user.id)
  if (!isLeader) {
    return { error: 'Немає прав' }
  }

  const updatePayload: { is_deleted?: boolean; deleted_at?: string | null } = {
    is_deleted: isDeleted,
  }
  updatePayload.deleted_at = isDeleted ? new Date().toISOString() : null

  const { error } = await supabase.from('groups').update(updatePayload).eq('id', groupId)
  if (error) {
    await logServerError('setGroupDeleted error', error)
    return { error: 'Не вдалося оновити статус групи' }
  }

  revalidatePath(GROUPS_LIST_PATH)
  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

export async function bulkToggleGroups(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const ids = formData.getAll('group_ids') as string[]
  const isDeleted = parseBooleanFormValue(formData, 'is_deleted')
  if (!ids || ids.length === 0) return { error: 'Немає обраних груп' }

  const { data: existingGroups, error: fetchErr } = await supabase
    .from('groups')
    .select('id, leader_id')
    .in('id', ids)

  if (fetchErr) {
    await logServerError('bulkToggleGroups: fetchErr', { fetchErr, ids, userId: user.id })
  } else {
    await logServerError('bulkToggleGroups: fetched', {
      existing: existingGroups,
      ids,
      userId: user.id,
    })
  }

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

  const updatedIds = ((updated as Array<{ id: string }> | null) ?? []).map((row) => row.id)
  await logServerError('bulkToggleGroups: updated', { updatedIds })

  revalidatePath(GROUPS_LIST_PATH)
  return { success: true }
}
