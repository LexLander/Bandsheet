import Link from 'next/link'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { fetchUserGroupsByMembership } from '@/lib/db/groups'
import { getServerT } from '@/lib/i18n/server'

type EventRow = {
  id: string
  name: string
  date: string | null
  status: string
}

export default async function EventsPage() {
  const [supabase, user, { t, locale }] = await Promise.all([
    createClient(),
    getAuthUser(),
    getServerT(),
  ])

  const groups = await fetchUserGroupsByMembership(supabase, user!.id)
  const groupIds = groups.map((group) => group.id)

  let events: EventRow[] = []
  if (groupIds.length > 0) {
    const { data } = await supabase
      .from('events')
      .select('id, name, date, status')
      .in('group_id', groupIds)
      .order('date', { ascending: true })
      .limit(50)

    events = (data ?? []) as EventRow[]
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-6">
      <h1 className="text-2xl font-bold mb-6">{t.dashboard.events}</h1>

      {events.length === 0 ? (
        <div className="text-center py-16 border border-black/10 dark:border-white/10 rounded-2xl">
          <p className="text-sm text-foreground/60 mb-3">{t.dashboard.noEvents}</p>
          <Link href="/groups" className="text-sm font-medium underline-offset-2 hover:underline">
            {t.dashboard.createGroup}
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="block p-4 rounded-2xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <p className="font-medium">{event.name}</p>
              {event.date ? (
                <p className="text-xs text-foreground/50 mt-1">
                  {new Date(event.date).toLocaleDateString(locale || 'uk-UA', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              ) : null}
              <p className="text-xs text-foreground/40 mt-1">{event.status}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
