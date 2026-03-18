import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminActor } from '@/lib/admin/guards'
import AdminUserActions from '@/components/admin/AdminUserActions'
import { fetchProfileDetailsForAdmin } from '@/lib/db/admin'
import AdminUserGroupsSection from '@/components/admin/AdminUserGroupsSection'
import { getServerT } from '@/lib/i18n/server'

export default async function AdminUserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [actor, { t }] = await Promise.all([requireAdminActor(), getServerT()])
  const { id } = await params
  const admin = createAdminClient()

  const user = await fetchProfileDetailsForAdmin(admin, id)

  if (!user) {
    return (
      <div className="space-y-4">
        <Link href="/admin" className="text-sm underline-offset-2 hover:underline">{t.admin.users.back}</Link>
        <p>{t.admin.users.notFound}</p>
      </div>
    )
  }

  const cannotManage = user.is_root_admin || user.id === actor.id

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/admin" className="text-sm underline-offset-2 hover:underline">{t.admin.users.backToUsers}</Link>
        <h2 className="text-2xl font-bold">{user.name ?? t.admin.users.noName}</h2>
        <p className="text-sm text-foreground/60">{user.email ?? t.admin.users.noEmail}</p>
        <p className="text-sm text-foreground/60">
          {user.is_root_admin ? t.admin.users.roleRootAdmin : user.platform_role === 'admin' ? t.admin.users.roleAdmin : t.admin.users.roleUser}
          {' · '}
          {user.is_blacklisted ? t.admin.users.statusBlacklisted : user.is_blocked ? t.admin.users.statusBlocked : t.admin.users.statusActive}
        </p>
        {user.blocked_reason && <p className="text-xs text-amber-600">{t.admin.users.blockedReason}: {user.blocked_reason}</p>}
        {user.blacklisted_reason && <p className="text-xs text-red-600">{t.admin.users.blacklistedReason}: {user.blacklisted_reason}</p>}
      </div>

      <AdminUserActions
        userId={user.id}
        cannotManage={cannotManage}
        canRemoveAdmin={actor.is_root_admin && user.platform_role === 'admin' && !user.is_root_admin}
      />

      <Suspense fallback={<GroupsSectionSkeleton />}>
        <AdminUserGroupsSection userId={user.id} />
      </Suspense>
    </div>
  )
}

function GroupsSectionSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-36 rounded bg-black/10 dark:bg-white/10" />
      <div className="space-y-2">
        <div className="h-16 rounded-lg bg-black/10 dark:bg-white/10" />
        <div className="h-16 rounded-lg bg-black/10 dark:bg-white/10" />
      </div>
    </div>
  )
}
