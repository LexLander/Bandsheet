'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logServerError } from '@/lib/logger'

function safeNextPath(token: string) {
  return `/invite/${encodeURIComponent(token)}`
}

function resolveGroupId(data: unknown): string | null {
  if (!data) return null
  if (typeof data === 'string') return data
  if (Array.isArray(data)) {
    const first = data[0]
    if (typeof first === 'string') return first
    if (first && typeof first === 'object' && 'group_id' in first) {
      const value = (first as { group_id?: unknown }).group_id
      return typeof value === 'string' ? value : null
    }
  }
  return null
}

export async function acceptInvitationFromPublic(formData: FormData) {
  const token = (formData.get('token') as string | null)?.trim() ?? ''
  if (!token) redirect('/login')

  const nextPath = safeNextPath(token)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  }

  let data: unknown = null
  let error: unknown = null

  try {
    const rpcResult = await supabase.rpc('accept_invitation', {
      p_token: token,
      p_user_id: user.id,
    })
    data = rpcResult.data
    error = rpcResult.error
  } catch (err) {
    await logServerError('acceptInvitationFromPublic exception', err)
    redirect(`${nextPath}?error=accept_failed`)
  }

  if (error) {
    await logServerError('acceptInvitationFromPublic rpc error', { error, token })
    redirect(`${nextPath}?error=accept_failed`)
  }

  const groupId = resolveGroupId(data)
  if (groupId) {
    redirect(`/groups/${groupId}?accepted=1`)
  }

  redirect('/groups?accepted=1')
}

export async function declineInvitationFromPublic(formData: FormData) {
  const token = (formData.get('token') as string | null)?.trim() ?? ''
  if (!token) redirect('/login')

  const nextPath = safeNextPath(token)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  }

  const { data: invitation, error: invitationError } = await supabase
    .from('invitations')
    .select('id, invited_user_id, status, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (invitationError) {
    await logServerError('declineInvitationFromPublic invitation lookup error', invitationError)
    redirect(`${nextPath}?error=decline_failed`)
  }

  if (!invitation) {
    redirect(`${nextPath}?error=not_found`)
  }

  if (invitation.status !== 'pending') {
    redirect(`${nextPath}?error=already_processed`)
  }

  if (invitation.expires_at && new Date(invitation.expires_at).getTime() < Date.now()) {
    redirect(`${nextPath}?error=expired`)
  }

  if (!invitation.invited_user_id || invitation.invited_user_id !== user.id) {
    redirect(`${nextPath}?error=not_for_user`)
  }

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'expired' })
    .eq('id', invitation.id)
    .eq('status', 'pending')

  if (error) {
    await logServerError('declineInvitationFromPublic update error', error)
    redirect(`${nextPath}?error=decline_failed`)
  }

  redirect(`${nextPath}?declined=1`)
}
