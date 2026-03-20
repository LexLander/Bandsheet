import { describe, expect, it, vi } from 'vitest'
import { fetchSongById, fetchSongs, searchSongs } from '@/lib/db/songs'

describe('lib/db/songs', () => {
  it('searchSongs returns rows', async () => {
    const rows = [{ id: 's1', title: 'Song', artist: 'Artist' }]
    const limit = vi.fn().mockResolvedValue({ data: rows, error: null })
    const order = vi.fn(() => ({ limit }))
    const or = vi.fn(() => ({ order }))
    const select = vi.fn(() => ({ or }))
    const from = vi.fn(() => ({ select }))

    const result = await searchSongs({ from } as unknown as never, 'so', 10)

    expect(result).toEqual(rows)
    expect(from).toHaveBeenCalledWith('songs_public')
    expect(limit).toHaveBeenCalledWith(10)
  })

  it('fetchSongs throws on error', async () => {
    const limit = vi.fn().mockResolvedValue({ data: null, error: new Error('boom') })
    const order = vi.fn(() => ({ limit }))
    const select = vi.fn(() => ({ order }))
    const from = vi.fn(() => ({ select }))

    await expect(fetchSongs({ from } as unknown as never, 5)).rejects.toThrow('boom')
  })

  it('fetchSongById returns null when not found', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
    const eq = vi.fn(() => ({ single }))
    const select = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ select }))

    const result = await fetchSongById({ from } as unknown as never, 'missing')

    expect(result).toBeNull()
  })
})
