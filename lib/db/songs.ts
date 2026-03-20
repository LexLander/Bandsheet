import { SupabaseClient } from '@supabase/supabase-js'

export type Song = {
	id: string
	title: string
	artist: string | null
	text_chords: string | null
	key: string | null
	bpm: number | null
	time_signature: string | null
	language: string | null
	genre: string | null
	access_type: 'free' | 'subscription'
	created_at: string
}

// Пошук пісень у глобальній базі
export async function searchSongs(
	supabase: SupabaseClient,
	query: string,
	limit = 20
): Promise<Song[]> {
	const { data, error } = await supabase
		.from('songs_public')
		.select('id, title, artist, key, bpm, time_signature, language, genre, access_type, created_at')
		.or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
		.order('title')
		.limit(limit)

	if (error) throw error
	return data ?? []
}

// Всі пісні (для адміна або початкового завантаження)
export async function fetchSongs(
	supabase: SupabaseClient,
	limit = 50
): Promise<Song[]> {
	const { data, error } = await supabase
		.from('songs_public')
		.select('id, title, artist, key, bpm, time_signature, language, genre, access_type, created_at')
		.order('title')
		.limit(limit)

	if (error) throw error
	return data ?? []
}

// Одна пісня повністю (з текстом і акордами)
export async function fetchSongById(
	supabase: SupabaseClient,
	id: string
): Promise<Song | null> {
	const { data, error } = await supabase
		.from('songs_public')
		.select('*')
		.eq('id', id)
		.single()

	if (error) return null
	return data
}
