import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  fetchAdminUserGroupRelations,
  type AdminUserGroupCardMember,
} from '@/lib/db/admin'
import { getServerT } from '@/lib/i18n/server'

export default async function AdminUserGroupsSection({ userId }: { userId: string }) {
  const { t } = await getServerT()
  const admin = createAdminClient()
  const { createdGroups, memberGroups, membersByGroup } = await fetchAdminUserGroupRelations(admin, userId)

  return (
    <>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">{t.admin.userGroups.createdGroups}</h3>
        {createdGroups.length === 0 ? (
          <p className="text-sm text-foreground/60">{t.admin.userGroups.noCreatedGroups}</p>
        ) : (
          <div className="space-y-3">
            {createdGroups.map((g) => (
              <GroupCard key={g.id} groupId={g.id} groupName={g.name} relationLabel={t.admin.userGroups.leader} members={membersByGroup.get(g.id) ?? []} t={t} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">{t.admin.userGroups.memberGroups}</h3>
        {memberGroups.length === 0 ? (
          <p className="text-sm text-foreground/60">{t.admin.userGroups.noMemberGroups}</p>
        ) : (
          <div className="space-y-3">
            {memberGroups.map((g) => (
              <GroupCard key={g.id} groupId={g.id} groupName={g.name} relationLabel={`${t.admin.userGroups.rolePrefix}: ${roleLabel(g.member_role ?? '', t)}`} members={membersByGroup.get(g.id) ?? []} t={t} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function GroupCard({
  groupId,
  groupName,
  relationLabel,
  members,
  t,
}: {
  groupId: string
  groupName: string
  relationLabel: string
  members: AdminUserGroupCardMember[]
  t: Awaited<ReturnType<typeof getServerT>>['t']
}) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{groupName}</p>
          <p className="text-xs text-foreground/60">{relationLabel}</p>
        </div>
        <Link href={`/groups/${groupId}`} className="text-xs underline-offset-2 hover:underline">{t.admin.userGroups.openAsApp}</Link>
      </div>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={`${groupId}-${m.id}`} className="flex items-center justify-between rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{m.name ?? t.admin.userGroups.noName}</p>
              <p className="truncate text-xs text-foreground/60">{m.email ?? t.admin.userGroups.noEmail}</p>
            </div>
            <span className="text-xs text-foreground/70">{roleLabel(m.role, t)}</span>
          </div>
        ))}
      </div>
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
