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
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

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

  // Отримуємо пісні сетлісту з JOIN
  const { data: items, error } = await supabase
    .from('setlist_items')
    .select('*, song:songs_public(id, title, artist, key)')
    .eq('setlist_id', setlist.id)
    .order('position')

  if (error) throw error

  return { event, setlist, items: items ?? [] }
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
