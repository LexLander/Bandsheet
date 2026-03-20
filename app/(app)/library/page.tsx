import { redirect } from 'next/navigation'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { fetchLibraryItems } from '@/lib/db/library'
import { searchSongs } from '@/lib/db/songs'
import LibrarySearchClient from './LibrarySearchClient'
import { AddToLibraryButton, RemoveFromLibraryButton } from './LibraryActionsClient'

type LibrarySearchParams = {
  q?: string
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<LibrarySearchParams>
}) {
  const [supabase, user, { t }, query] = await Promise.all([
    createClient(),
    getAuthUser(),
    getServerT(),
    searchParams,
  ])

  if (!user) redirect('/login')

  const q = (query.q ?? '').trim()

  const [libraryItems, results] = await Promise.all([
    fetchLibraryItems(supabase, user.id),
    q ? searchSongs(supabase, q, 20) : Promise.resolve([]),
  ])

  const librarySongIds = new Set(libraryItems.map((item) => item.song_id))

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-6 space-y-8">
      <h1 className="text-2xl font-bold">{t.library.title}</h1>

      <section className="rounded-2xl border border-black/10 dark:border-white/10 p-4 space-y-4">
        <LibrarySearchClient
          placeholder={t.library.searchPlaceholder}
          submitLabel={t.library.searchButton}
          initialQuery={q}
        />

        {q ? (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-foreground/70">{t.library.searchResults}</h2>
            {results.length === 0 ? (
              <p className="text-sm text-foreground/60">{t.library.noResults}</p>
            ) : (
              <div className="space-y-2">
                {results.map((song) => {
                  const inLibrary = librarySongIds.has(song.id)
                  return (
                    <div
                      key={song.id}
                      className="rounded-xl border border-black/10 dark:border-white/10 p-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-medium text-sm">{song.title}</p>
                        <p className="text-xs text-foreground/60">{song.artist ?? '—'}</p>
                      </div>
                      <AddToLibraryButton
                        songId={song.id}
                        isAdded={inLibrary}
                        addLabel={t.library.addToLibrary}
                        addedLabel={t.library.added}
                        pendingLabel={t.library.adding}
                        errorLabel={t.library.addFailed}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-black/10 dark:border-white/10 p-4 space-y-4">
        <h2 className="text-sm font-medium text-foreground/70">{t.library.myLibrary}</h2>

        {libraryItems.length === 0 ? (
          <div className="text-sm text-foreground/60">
            <p>{t.library.empty}</p>
            <p className="text-xs mt-1">{t.library.emptyHint}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {libraryItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-black/10 dark:border-white/10 p-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-sm">{item.song?.title ?? item.song_id}</p>
                  <p className="text-xs text-foreground/60">{item.song?.artist ?? '—'}</p>
                  <p className="text-xs text-foreground/50 mt-1">
                    {t.library.songKey}: {item.custom_key ?? item.song?.key ?? '—'} · {t.library.songBpm}: {item.custom_bpm ?? item.song?.bpm ?? '—'}
                  </p>
                </div>

                <RemoveFromLibraryButton
                  itemId={item.id}
                  removeLabel={t.library.remove}
                  pendingLabel={t.library.removing}
                  errorLabel={t.library.removeFailed}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}