import { describe, expect, it, vi } from 'vitest'
import {
  addToLibrary,
  fetchLibraryItems,
  isSongInLibrary,
  removeFromLibrary,
} from '@/lib/db/library'

describe('lib/db/library', () => {
  it('fetchLibraryItems returns list with joined public songs', async () => {
    const rows = [{ id: 'li-1', user_id: 'u1', song_id: 's1' }]
    const songs = [{ id: 's1', title: 'Song 1', artist: 'Artist 1' }]

    const libraryOrder = vi.fn().mockResolvedValue({ data: rows, error: null })
    const libraryEq = vi.fn(() => ({ order: libraryOrder }))
    const librarySelect = vi.fn(() => ({ eq: libraryEq }))

    const songsIn = vi.fn().mockResolvedValue({ data: songs, error: null })
    const songsSelect = vi.fn(() => ({ in: songsIn }))

    const from = vi.fn((table: string) => {
      if (table === 'library_items') return { select: librarySelect }
      if (table === 'songs_public') return { select: songsSelect }
      return { select: vi.fn() }
    })

    const result = await fetchLibraryItems({ from } as unknown as never, 'u1')

    expect(result).toEqual([{ ...rows[0], song: songs[0] }])
    expect(from).toHaveBeenCalledWith('library_items')
    expect(from).toHaveBeenCalledWith('songs_public')
    expect(songsIn).toHaveBeenCalledWith('id', ['s1'])
  })

  it('addToLibrary inserts row', async () => {
    const row = { id: 'li-2', user_id: 'u1', song_id: 's2' }
    const single = vi.fn().mockResolvedValue({ data: row, error: null })
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    const from = vi.fn(() => ({ insert }))

    const result = await addToLibrary({ from } as unknown as never, 'u1', 's2')

    expect(result).toEqual(row)
    expect(insert).toHaveBeenCalledWith({ user_id: 'u1', song_id: 's2', song_source: 'public' })
  })

  it('removeFromLibrary throws on delete error', async () => {
    const eqUser = vi.fn().mockResolvedValue({ error: new Error('denied') })
    const eqId = vi.fn(() => ({ eq: eqUser }))
    const del = vi.fn(() => ({ eq: eqId }))
    const from = vi.fn(() => ({ delete: del }))

    await expect(removeFromLibrary({ from } as unknown as never, 'li-1', 'u1')).rejects.toThrow(
      'denied'
    )
  })

  it('isSongInLibrary returns boolean', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 'li-9' }, error: null })
    const eqSong = vi.fn(() => ({ single }))
    const eqUser = vi.fn(() => ({ eq: eqSong }))
    const select = vi.fn(() => ({ eq: eqUser }))
    const from = vi.fn(() => ({ select }))

    const exists = await isSongInLibrary({ from } as unknown as never, 'u1', 's1')

    expect(exists).toBe(true)
  })
})
