import { createClient, getAuthUser } from '@/lib/supabase/server'
import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server'
import { fetchProfileById } from '@/lib/db/profiles'
import { fetchUpcomingEventsForGroups, fetchUserGroupsByMembership } from '@/lib/db/groups'

export default async function DashboardPage() {
  const [supabase, user, { t, locale }] = await Promise.all([createClient(), getAuthUser(), getServerT()])

  // Русский комментарий: запросы независимы, поэтому запускаются параллельно.
  const [{ data: profile }, groups] = await Promise.all([
    fetchProfileById(supabase, user!.id),
    fetchUserGroupsByMembership(supabase, user!.id, { limit: 3 }),
  ])

  const groupIds = groups.map((group) => group.id)
  const events = await fetchUpcomingEventsForGroups(supabase, groupIds, 3)

  const name = profile?.name ?? user?.email?.split('@')[0] ?? 'Музикант'

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-foreground/50">{t.dashboard.greeting}</p>
        <h1 className="text-2xl font-bold">{name}</h1>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link href="/groups" className="flex flex-col gap-2 p-4 rounded-2xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition">
          <span className="text-2xl">👥</span>
          <span className="text-sm font-medium">{t.dashboard.myGroups}</span>
          <span className="text-xs text-foreground/40">{t.dashboard.groups(groups.length)}</span>
        </Link>
        <Link href="/library" className="flex flex-col gap-2 p-4 rounded-2xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition">
          <span className="text-2xl">🎵</span>
          <span className="text-sm font-medium">{t.dashboard.library}</span>
          <span className="text-xs text-foreground/40">{t.dashboard.mySongs}</span>
        </Link>
        <Link href="/events" className="flex flex-col gap-2 p-4 rounded-2xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition">
          <span className="text-2xl">🎤</span>
          <span className="text-sm font-medium">{t.dashboard.events}</span>
          <span className="text-xs text-foreground/40">{t.dashboard.concerts}</span>
        </Link>
        <Link href="/profile" className="flex flex-col gap-2 p-4 rounded-2xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition">
          <span className="text-2xl">⚙️</span>
          <span className="text-sm font-medium">{t.dashboard.profile}</span>
          <span className="text-xs text-foreground/40">{t.dashboard.settings}</span>
        </Link>
      </div>

      {/* Active events */}
      {events.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider mb-3">{t.dashboard.upcomingEvents}</h2>
          <div className="space-y-2">
            {events.map((event: { id: string; name: string; date: string | null }) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="flex items-center justify-between p-4 rounded-2xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <div>
                  <p className="font-medium">{event.name}</p>
                  {event.date && (
                    <p className="text-xs text-foreground/40 mt-0.5">
                      {new Date(event.date).toLocaleDateString(locale || 'uk-UA', { day: 'numeric', month: 'long' })}
                    </p>
                  )}
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  {t.dashboard.active}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-foreground/30">
          <p className="text-sm">{t.dashboard.noEvents}</p>
          <Link href="/groups" className="text-sm text-foreground font-medium mt-2 inline-block hover:underline">
            {t.dashboard.createGroup}
          </Link>
        </div>
      )}
    </div>
  )
}
