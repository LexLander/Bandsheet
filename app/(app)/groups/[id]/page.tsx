import { createClient, getAuthUser } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import InviteForm from './InviteForm'
import CancelInvitationButton from './CancelInvitationButton'
import { getServerT } from '@/lib/i18n/server'

type ProfileRef = { id: string; name: string; avatar_url: string | null }
type MemberRow = {
  role: string
  joined_at: string
  profiles: ProfileRef | ProfileRef[] | null
}

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [supabase, user, { t }] = await Promise.all([createClient(), getAuthUser(), getServerT()])

  // Три незалежні запити — один round trip
  const [{ data: group }, { data: members }, { data: invitations }, { data: profiles }] = await Promise.all([
    supabase.from('groups').select('id, name, avatar_url, leader_id, is_deleted').eq('id', id).single(),
    supabase.from('group_members').select('role, joined_at, profiles(id, name, avatar_url)').eq('group_id', id).order('joined_at', { ascending: true }),
    supabase.from('invitations').select('id, email, role, status, expires_at, invited_user_id').eq('group_id', id).eq('status', 'pending'),
    supabase.from('profiles').select('id, name, email, avatar_url').not('email', 'is', null).neq('id', user!.id).order('name', { ascending: true }).limit(200),
  ])

  if (!group) notFound()

  const typedMembers = (members ?? []) as MemberRow[]

  const myMembership = typedMembers.find((m) => {
    const pid = Array.isArray(m.profiles) ? m.profiles[0]?.id : m.profiles?.id
    return pid === user!.id
  })
  const canInvite = !!myMembership && ['leader', 'deputy'].includes((myMembership as { role?: string }).role ?? '')

  const memberIds = new Set(
    typedMembers
      .map((m) => (Array.isArray(m.profiles) ? m.profiles[0]?.id : m.profiles?.id))
      .filter((v): v is string => Boolean(v))
  )
  const invitedIds = new Set(
    (invitations ?? [])
      .map((inv: { invited_user_id?: string | null }) => inv.invited_user_id)
      .filter((v): v is string => Boolean(v))
  )
  const inviteCandidates = (profiles ?? []).filter((p: { id: string }) => !memberIds.has(p.id) && !invitedIds.has(p.id))

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
      <Link href="/groups" className="flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground mb-6 transition">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        {t.groups.title}
      </Link>

      {/* Group header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-black/10 dark:bg-white/10 flex items-center justify-center text-2xl font-bold shrink-0">
          {group.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-sm text-foreground/40">{t.groups.membersCount(members?.length ?? 0)}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Per-group delete controls removed — bulk deletion available on groups list */}
        </div>
      </div>

      {/* Members */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider mb-3">{t.groups.members}</h2>
        <div className="space-y-2">
          {typedMembers.map((m) => {
            const p: ProfileRef = Array.isArray(m.profiles)
              ? (m.profiles[0] ?? { id: '', name: '', avatar_url: null })
              : (m.profiles ?? { id: '', name: '', avatar_url: null })
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-black/10 dark:border-white/10">
                <div className="w-9 h-9 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">
                  {p.avatar_url ? (
                    <Image
                      src={p.avatar_url}
                      alt={p.name}
                      width={36}
                      height={36}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (p.name ?? '?').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name ?? t.groups.unknownUser}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge(m.role)}`}>
                  {roleLabel(m.role, t)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Invite */}
      {canInvite && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider mb-3">{t.groups.inviteTitle}</h2>
          <InviteForm groupId={id} profiles={inviteCandidates} />
        </div>
      )}

      {/* Pending invitations */}
      {canInvite && invitations && invitations.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider mb-3">{t.groups.pendingTitle}</h2>
          <div className="space-y-2">
            {invitations.map((inv: { id: string; email: string; role?: string }) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-black/10 dark:border-white/10">
                <div className="min-w-0">
                  <p className="text-sm text-foreground/60 truncate">{inv.email}</p>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                    {roleLabel(inv.role ?? '', t)}
                  </span>
                  <CancelInvitationButton invitationId={inv.id} groupId={id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function roleLabel(role: string, t: Awaited<ReturnType<typeof getServerT>>['t']) {
  const labels: Record<string, string> = {
    leader: t.groups.roles.leader,
    deputy: t.groups.roles.deputy,
    switcher: t.groups.roles.switcher,
    member: t.groups.roles.member,
  }
  return labels[role] ?? role
}

function roleBadge(role: string) {
  switch (role) {
    case 'leader': return 'bg-black text-white dark:bg-white dark:text-black'
    case 'deputy': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
    case 'switcher': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
    default: return 'bg-black/10 dark:bg-white/10 text-foreground/60'
  }
}
