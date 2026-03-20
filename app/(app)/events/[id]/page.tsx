import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { fetchEventWithSetlist } from '@/lib/db/events'

function statusLabel(
  status: string,
  t: { statusDraft: string; statusActive: string; statusArchived: string }
) {
  if (status === 'draft') return t.statusDraft
  if (status === 'active') return t.statusActive
  if (status === 'archived') return t.statusArchived
  return status
}

function statusBadge(status: string) {
  if (status === 'active')
    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
  if (status === 'archived') return 'bg-black/10 dark:bg-white/10 text-foreground/50'
  return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [supabase, , { t, locale }] = await Promise.all([
    createClient(),
    getAuthUser(),
    getServerT(),
  ])

  let result
  try {
    result = await fetchEventWithSetlist(supabase, id)
  } catch {
    notFound()
  }

  const { event, setlist, items } = result

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-6 space-y-6">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground transition"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {t.events.back}
      </Link>

      {/* Event header */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <span
            className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${statusBadge(event.status)}`}
          >
            {statusLabel(event.status, t.events)}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
          <span>
            {event.date
              ? new Date(event.date).toLocaleDateString(locale || 'uk-UA', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : t.events.noDate}
          </span>
          {event.venue ? (
            <span>{event.venue}</span>
          ) : (
            <span className="text-foreground/40">{t.events.noVenue}</span>
          )}
        </div>
      </div>

      {/* Setlist */}
      <section className="rounded-2xl border border-black/10 dark:border-white/10 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">
          {t.events.setlist}
        </h2>

        {!setlist || items.length === 0 ? (
          <p className="text-sm text-foreground/50">{t.events.noSetlist}</p>
        ) : (
          <ol className="space-y-2">
            {items.map((item, idx) => (
              <li
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-black/10 dark:border-white/10"
              >
                <span className="text-xs text-foreground/40 w-6 shrink-0 text-right">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.song?.title ?? item.song_id}</p>
                  {item.song?.artist ? (
                    <p className="text-xs text-foreground/50 truncate">{item.song.artist}</p>
                  ) : null}
                </div>
                {(item.transposed_key ?? item.song?.key) ? (
                  <span className="text-xs text-foreground/50 shrink-0">
                    {t.events.key}: {item.transposed_key ?? item.song?.key}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
