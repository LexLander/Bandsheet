import { describe, expect, it, vi } from 'vitest'
import { fetchEventById, fetchEventWithSetlist, fetchGroupEvents } from '@/lib/db/events'

describe('lib/db/events', () => {
  it('fetchEventById returns null on error', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: new Error('missing') })
    const eq = vi.fn(() => ({ single }))
    const select = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ select }))

    const result = await fetchEventById({ from } as unknown as never, 'e1')

    expect(result).toBeNull()
  })

  it('fetchEventWithSetlist returns empty items when setlist absent', async () => {
    const eventSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: 'e1', group_id: 'g1', name: 'Event' }, error: null })
    const eventEq = vi.fn(() => ({ single: eventSingle }))
    const eventSelect = vi.fn(() => ({ eq: eventEq }))

    const setlistSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const setlistEq = vi.fn(() => ({ single: setlistSingle }))
    const setlistSelect = vi.fn(() => ({ eq: setlistEq }))

    const from = vi.fn((table: string) => {
      if (table === 'events') return { select: eventSelect }
      if (table === 'setlists') return { select: setlistSelect }
      throw new Error(`Unexpected table: ${table}`)
    })

    const result = await fetchEventWithSetlist({ from } as unknown as never, 'e1')

    expect(result.setlist).toBeNull()
    expect(result.items).toEqual([])
  })

  it('fetchEventWithSetlist joins song data for setlist items', async () => {
    const event = { id: 'e1', group_id: 'g1', name: 'Concert' }
    const setlist = { id: 'sl1', event_id: 'e1', current_song_index: 0, is_live: false }
    const rawItems = [
      { id: 'si1', setlist_id: 'sl1', position: 0, song_id: 's1', song_source: 'public' },
    ]
    const songs = [{ id: 's1', title: 'Song', artist: null, key: 'C' }]

    const eventSingle = vi.fn().mockResolvedValue({ data: event, error: null })
    const eventEq = vi.fn(() => ({ single: eventSingle }))
    const eventSelect = vi.fn(() => ({ eq: eventEq }))

    const setlistSingle = vi.fn().mockResolvedValue({ data: setlist, error: null })
    const setlistEq = vi.fn(() => ({ single: setlistSingle }))
    const setlistSelect = vi.fn(() => ({ eq: setlistEq }))

    const itemsOrder = vi.fn().mockResolvedValue({ data: rawItems, error: null })
    const itemsEq = vi.fn(() => ({ order: itemsOrder }))
    const itemsSelect = vi.fn(() => ({ eq: itemsEq }))

    const songsIn = vi.fn().mockResolvedValue({ data: songs, error: null })
    const songsSelect = vi.fn(() => ({ in: songsIn }))

    const from = vi.fn((table: string) => {
      if (table === 'events') return { select: eventSelect }
      if (table === 'setlists') return { select: setlistSelect }
      if (table === 'setlist_items') return { select: itemsSelect }
      if (table === 'songs_public') return { select: songsSelect }
      throw new Error(`Unexpected table: ${table}`)
    })

    const result = await fetchEventWithSetlist({ from } as unknown as never, 'e1')

    expect(result.items).toHaveLength(1)
    expect(result.items[0].song).toEqual(songs[0])
    expect(songsIn).toHaveBeenCalledWith('id', ['s1'])
  })

  it('fetchGroupEvents returns rows ordered by date', async () => {
    const rows = [{ id: 'e1' }, { id: 'e2' }]
    const order = vi.fn().mockResolvedValue({ data: rows, error: null })
    const eq = vi.fn(() => ({ order }))
    const select = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ select }))

    const result = await fetchGroupEvents({ from } as unknown as never, 'g1')

    expect(result).toEqual(rows)
    expect(order).toHaveBeenCalledWith('date', { ascending: true })
  })
})
