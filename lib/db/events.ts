import { SupabaseClient } from '@supabase/supabase-js'

export type Event = {
  id: string
  group_id: string
  name: string
  date: string | null
  venue: string | null
  status: 'draft' | 'active' | 'archived'
  created_by: string
  created_at: string
}

export type Setlist = {
  id: string
  event_id: string
  current_song_index: number
  is_live: boolean
  updated_at: string
}

export type SetlistItem = {
  id: string
  setlist_id: string
  position: number
  song_id: string
  song_source: 'public' | 'private'
  transposed_key: string | null
  notes: string | null
  // JOIN з songs_public
  song?: {
    id: string
    title: string
    artist: string | null
    key: string | null
  }
}

// Одна подія за id
export async function fetchEventById(
  supabase: SupabaseClient,
  eventId: string
): Promise<Event | null> {
  const { data, error } = await supabase.from('events').select('*').eq('id', eventId).single()

  if (error) return null
  return data
}

// Подія разом з сетлістом і піснями
export async function fetchEventWithSetlist(
  supabase: SupabaseClient,
  eventId: string
): Promise<{ event: Event; setlist: Setlist | null; items: SetlistItem[] }> {
  const event = await fetchEventById(supabase, eventId)
  if (!event) throw new Error('Event not found')

  // Отримуємо сетліст події
  const { data: setlist } = await supabase
    .from('setlists')
    .select('*')
    .eq('event_id', eventId)
    .single()

  if (!setlist) return { event, setlist: null, items: [] }

  // Отримуємо пісні сетлісту без relation-join (song_id без FK до songs_public)
  const { data: rawItems, error: itemsError } = await supabase
    .from('setlist_items')
    .select('*')
    .eq('setlist_id', setlist.id)
    .order('position')

  if (itemsError) throw itemsError

  const songIds = Array.from(new Set((rawItems ?? []).map((item) => item.song_id))).filter(Boolean)

  let songsById = new Map<
    string,
    { id: string; title: string; artist: string | null; key: string | null }
  >()
  if (songIds.length > 0) {
    const { data: songs, error: songsError } = await supabase
      .from('songs_public')
      .select('id, title, artist, key')
      .in('id', songIds)

    if (songsError) throw songsError
    songsById = new Map((songs ?? []).map((song) => [song.id, song]))
  }

  const items: SetlistItem[] = (rawItems ?? []).map((item) => ({
    ...item,
    song: songsById.get(item.song_id),
  }))

  return { event, setlist, items }
}

// Список подій групи
export async function fetchGroupEvents(
  supabase: SupabaseClient,
  groupId: string
): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('group_id', groupId)
    .order('date', { ascending: true })

  if (error) throw error
  return data ?? []
}
