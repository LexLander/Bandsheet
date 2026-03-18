import { createClient, getAuthUser } from '@/lib/supabase/server'
import Link from 'next/link'
import GroupsListClient from './GroupsListClient'
import GroupsBulkControls from './GroupsBulkControls'
import { getServerT } from '@/lib/i18n/server'
import { fetchUserGroupsByMembership } from '@/lib/db/groups'

export default async function GroupsPage() {
  const [supabase, user, { t }] = await Promise.all([createClient(), getAuthUser(), getServerT()])

  const memberships = await fetchUserGroupsByMembership(supabase, user!.id)

  const groups = memberships
    .filter((group) => !group.is_deleted)
    .map((group) => ({
      id: group.id,
      name: group.name,
      avatar_url: group.avatar_url,
      role: roleLabel(group.role ?? 'member'),
    }))

  return (
    <div className="max-w-lg mx-auto px-4 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.groups.title}</h1>
        <div className="flex items-center gap-3">
          <GroupsBulkControls />
          <Link
            href="/groups/new"
            className="px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition"
          >
            {t.groups.create}
          </Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-foreground/50 mb-4">{t.groups.noGroups}</p>
          <Link
            href="/groups/new"
            className="px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition"
          >
            {t.groups.createFirst}
          </Link>
        </div>
      ) : (
        <div>
          {/* Client-rendered interactive list with bulk selection */}
          <GroupsListClient items={groups} />
        </div>
      )}
    </div>
  )
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    leader: 'Лідер',
    deputy: 'Заступник',
    switcher: 'Переключатель',
    member: 'Учасник',
  }
  return labels[role] ?? role
}
