import { SupabaseClient } from '@supabase/supabase-js'
import { Song } from './songs'

export type LibraryItem = {
  id: string
  user_id: string
  song_id: string
  song_source: 'public' | 'private'
  custom_key: string | null
  custom_bpm: number | null
  custom_time_signature: string | null
  notes: string | null
  created_at: string
  // JOIN з songs_public
  song?: Song
}

// Особиста бібліотека користувача з даними пісень.
// Не використовуємо relation-join через PostgREST, бо song_id тут без FK до songs_public.
export async function fetchLibraryItems(
  supabase: SupabaseClient,
  userId: string
): Promise<LibraryItem[]> {
  const { data: items, error: itemsError } = await supabase
    .from('library_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (itemsError) throw itemsError
  if (!items || items.length === 0) return []

  const songIds = Array.from(new Set(items.map((item) => item.song_id))).filter(Boolean)
  if (songIds.length === 0) return items

  const { data: songs, error: songsError } = await supabase
    .from('songs_public')
    .select(
      'id, title, artist, text_chords, key, bpm, time_signature, language, genre, access_type, created_at'
    )
    .in('id', songIds)

  if (songsError) throw songsError

  const songsById = new Map((songs ?? []).map((song) => [song.id, song]))
  return items.map((item) => ({
    ...item,
    song: songsById.get(item.song_id),
  }))
}

// Додати пісню до бібліотеки
export async function addToLibrary(
  supabase: SupabaseClient,
  userId: string,
  songId: string,
  songSource: 'public' | 'private' = 'public'
): Promise<LibraryItem> {
  const { data, error } = await supabase
    .from('library_items')
    .insert({ user_id: userId, song_id: songId, song_source: songSource })
    .select()
    .single()

  if (error) throw error
  return data
}

// Видалити пісню з бібліотеки
export async function removeFromLibrary(
  supabase: SupabaseClient,
  itemId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('library_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId) // захист: тільки свої

  if (error) throw error
}

// Перевірити чи пісня вже є в бібліотеці
export async function isSongInLibrary(
  supabase: SupabaseClient,
  userId: string,
  songId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('library_items')
    .select('id')
    .eq('user_id', userId)
    .eq('song_id', songId)
    .single()

  return !!data
}
