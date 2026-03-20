import { SupabaseClient } from '@supabase/supabase-js'
import { SetlistItem } from './events'

// Додати пісню до сетлісту
export async function addToSetlist(
  supabase: SupabaseClient,
  setlistId: string,
  songId: string,
  songSource: 'public' | 'private',
  position: number
): Promise<SetlistItem> {
  const { data, error } = await supabase
    .from('setlist_items')
    .insert({ setlist_id: setlistId, song_id: songId, song_source: songSource, position })
    .select()
    .single()

  if (error) throw error
  return data
}

// Видалити пісню з сетлісту
export async function removeFromSetlist(
  supabase: SupabaseClient,
  itemId: string
): Promise<void> {
  const { error } = await supabase
    .from('setlist_items')
    .delete()
    .eq('id', itemId)

  if (error) throw error
}

// Оновити порядок пісень після drag-and-drop
// items — масив { id, position } в новому порядку
export async function reorderSetlist(
  supabase: SupabaseClient,
  items: { id: string; position: number }[]
): Promise<void> {
  // Оновлюємо кожну позицію окремим запитом (Supabase не підтримує bulk update)
  await Promise.all(
    items.map(({ id, position }) =>
      supabase.from('setlist_items').update({ position }).eq('id', id)
    )
  )
}

// Оновити тональність пісні в сетлісті
export async function updateTransposedKey(
  supabase: SupabaseClient,
  itemId: string,
  transposedKey: string
): Promise<void> {
  const { error } = await supabase
    .from('setlist_items')
    .update({ transposed_key: transposedKey })
    .eq('id', itemId)

  if (error) throw error
}

// Створити сетліст для події (якщо ще не існує)
export async function ensureSetlist(
  supabase: SupabaseClient,
  eventId: string
): Promise<string> {
  // Спочатку перевіряємо чи є вже
  const { data: existing } = await supabase
    .from('setlists')
    .select('id')
    .eq('event_id', eventId)
    .single()

  if (existing) return existing.id

  // Якщо нема — створюємо
  const { data, error } = await supabase
    .from('setlists')
    .insert({ event_id: eventId })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}
