'use server'

import { revalidatePath } from 'next/cache'
import { logServerError } from '@/lib/logger'
import { getAuthContext } from './actions.auth'
import { GROUPS_LIST_PATH, parseRequiredFormValue } from './actions.shared'

async function getActorGroupRole(
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

  return member?.role ?? null
}

function canManageInvitations(role: string | null) {
  return role === 'leader' || role === 'deputy'
}

export async function inviteMember(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const groupId = parseRequiredFormValue(formData, 'group_id')
  const selectedProfileId = parseRequiredFormValue(formData, 'invited_user_id') || null
  const emailInput = parseRequiredFormValue(formData, 'email').toLowerCase()
  const role = ((formData.get('role') as string | null) ?? 'member').trim() || 'member'

  const actorRole = await getActorGroupRole(supabase, groupId, user.id)
  if (!canManageInvitations(actorRole)) {
    return { error: 'Немає прав для запрошення' }
  }

  const profileQuery = supabase.from('profiles').select('id, email')
  const { data: profile, error: profileErr } = selectedProfileId
    ? await profileQuery.eq('id', selectedProfileId).maybeSingle()
    : await profileQuery.eq('email', emailInput).maybeSingle()

  if (profileErr) {
    return { error: 'Помилка при перевірці профілю' }
  }

  if (!profile || !profile.id || !profile.email) {
    return {
      error:
        'Користувача з таким email не знайдено. Можна запрошувати лише зареєстрованих користувачів.',
    }
  }

  const email = profile.email.toLowerCase()

  await supabase
    .from('invitations')
    .delete()
    .eq('group_id', groupId)
    .eq('email', email)
    .eq('status', 'pending')

  const { error } = await supabase.from('invitations').insert({
    group_id: groupId,
    email,
    role,
    invited_user_id: profile.id,
  })

  if (error) return { error: 'Не вдалось створити запрошення' }

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

export async function cancelInvitation(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const invitationId = parseRequiredFormValue(formData, 'invitation_id')
  const groupId = parseRequiredFormValue(formData, 'group_id')
  if (!invitationId || !groupId) return { error: 'Невірні дані запрошення' }

  const actorRole = await getActorGroupRole(supabase, groupId, user.id)
  if (!canManageInvitations(actorRole)) {
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

  const token = (
    (formData.get('token') as string | null) ??
    (formData.get('invitation_token') as string | null) ??
    ''
  ).trim()
  if (!token) return { error: 'Невірний токен' }

  try {
    const { data, error } = await supabase.rpc('accept_invitation', {
      p_token: token,
      p_user_id: user.id,
    })

    if (error) {
      await logServerError('acceptInvitation rpc error', { error })
      return { error: error.message ?? 'Не вдалося прийняти запрошення' }
    }

    const resolvedGroupId = Array.isArray(data) ? (data[0] ?? null) : (data ?? null)
    revalidatePath(GROUPS_LIST_PATH)
    return { success: true, group: resolvedGroupId }
  } catch (err) {
    await logServerError('acceptInvitation exception', err)
    return { error: 'Помилка при прийомі запрошення' }
  }
}

export async function declineInvitation(formData: FormData) {
  const { supabase, user } = await getAuthContext()

  const invitationId = parseRequiredFormValue(formData, 'invitation_id')
  if (!invitationId) return { error: 'Невірні дані' }

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

  revalidatePath(GROUPS_LIST_PATH)
  return { success: true }
}

export async function removeMember(groupId: string, userId: string) {
  const { supabase } = await getAuthContext()

  await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
  revalidatePath(`/groups/${groupId}`)
}
