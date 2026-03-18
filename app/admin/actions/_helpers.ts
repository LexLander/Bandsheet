import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminActor, requireRootAdminActor } from '@/lib/admin/guards'

export type AdminActor = Awaited<ReturnType<typeof requireAdminActor>>

// ── Context factories ─────────────────────────────────────────────────────────

export async function getAdminContext() {
  const actor = await requireAdminActor()
  const admin = createAdminClient()
  return { actor, admin }
}

export async function getRootAdminContext() {
  const actor = await requireRootAdminActor()
  const admin = createAdminClient()
  return { actor, admin }
}

// ── Navigation helpers ────────────────────────────────────────────────────────

export function finishUserDetailsMutation(userId: string) {
  revalidatePath('/admin')
  revalidatePath(`/admin/users/${userId}`)
  redirect(`/admin/users/${userId}`)
}

export function finishAdminListMutation() {
  revalidatePath('/admin')
  redirect('/admin')
}

// ── Device fingerprint ────────────────────────────────────────────────────────

export function makeDeviceHashFromHeaders(h: Headers) {
  const ua = h.get('user-agent') ?? 'unknown-ua'
  const lang = h.get('accept-language') ?? 'unknown-lang'
  const platform = h.get('sec-ch-ua-platform') ?? 'unknown-platform'
  const source = `${ua}|${lang}|${platform}`

  let hash = 5381
  for (let i = 0; i < source.length; i += 1) {
    hash = ((hash << 5) + hash) + source.charCodeAt(i)
    hash |= 0
  }
  return `d${Math.abs(hash)}`
}

// ── Audit helpers ─────────────────────────────────────────────────────────────

export async function writeAudit(
  actorId: string,
  targetUserId: string | null,
  action: string,
  details?: Record<string, unknown>,
) {
  const admin = createAdminClient()
  await admin.from('admin_audit_logs').insert({
    actor_id: actorId,
    target_user_id: targetUserId,
    action,
    details: details ?? null,
  })
}

export async function writeI18nAudit(
  actorId: AdminActor['id'],
  action: string,
  details?: Record<string, unknown>,
) {
  await writeAudit(actorId, null, action, details)
}

// ── Presence cleanup ──────────────────────────────────────────────────────────

export async function cleanupUserPresence(targetUserId: string, targetEmail?: string | null) {
  const admin = createAdminClient()
  await admin.from('groups').delete().eq('leader_id', targetUserId)
  await admin.from('group_members').delete().eq('user_id', targetUserId)
  await admin.from('invitations').delete().eq('invited_user_id', targetUserId)
  if (targetEmail) {
    await admin.from('invitations').delete().eq('email', targetEmail.toLowerCase())
  }
}

// ── Flag normalizer ───────────────────────────────────────────────────────────

export function normalizeFlag(value: FormDataEntryValue | null) {
  return String(value ?? '').toLowerCase() === 'true'
}
