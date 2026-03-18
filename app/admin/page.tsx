import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminActor } from '@/lib/admin/guards'
import CreateAdminForm from '@/components/admin/CreateAdminForm'
import { listProfilesForAdmin } from '@/lib/db/admin'
import { getServerT } from '@/lib/i18n/server'

export default async function AdminUsersPage() {
  const [actor, { t }] = await Promise.all([requireAdminActor(), getServerT()])
  const admin = createAdminClient()
  const users = await listProfilesForAdmin(admin)

  return (
    <div className="space-y-6">
      {actor.is_root_admin && (
        <CreateAdminForm />
      )}

      <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="text-left px-3 py-2">{t.admin.users.tableUser}</th>
              <th className="text-left px-3 py-2">{t.admin.users.tableRole}</th>
              <th className="text-left px-3 py-2">{t.admin.users.tableStatus}</th>
              <th className="text-left px-3 py-2">{t.admin.users.tableActions}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-black/10 dark:border-white/10">
                <td className="px-3 py-2">
                  <div className="font-medium">{u.name ?? t.admin.users.noName}</div>
                  <div className="text-xs text-foreground/60">{u.email ?? t.admin.users.noEmail}</div>
                </td>
                <td className="px-3 py-2">
                  {u.is_root_admin ? t.admin.users.roleRootAdmin : u.platform_role === 'admin' ? t.admin.users.roleAdmin : t.admin.users.roleUser}
                </td>
                <td className="px-3 py-2">
                  {u.is_blacklisted ? t.admin.users.statusBlacklisted : u.is_blocked ? t.admin.users.statusBlocked : t.admin.users.statusActive}
                </td>
                <td className="px-3 py-2">
                  <Link href={`/admin/users/${u.id}`} className="underline-offset-2 hover:underline">{t.admin.users.open}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
