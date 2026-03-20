import { describe, expect, it, vi } from 'vitest'
import {
  addToSetlist,
  ensureSetlist,
  removeFromSetlist,
  reorderSetlist,
  updateTransposedKey,
} from '@/lib/db/setlist'

describe('lib/db/setlist', () => {
  it('addToSetlist inserts item', async () => {
    const row = { id: 'it-1', setlist_id: 'sl-1' }
    const single = vi.fn().mockResolvedValue({ data: row, error: null })
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    const from = vi.fn(() => ({ insert }))

    const result = await addToSetlist({ from } as unknown as never, 'sl-1', 'song-1', 'public', 1)

    expect(result).toEqual(row)
    expect(insert).toHaveBeenCalledWith({ setlist_id: 'sl-1', song_id: 'song-1', song_source: 'public', position: 1 })
  })

  it('reorderSetlist sends updates for each item', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ update }))

    await reorderSetlist({ from } as unknown as never, [
      { id: 'a', position: 1 },
      { id: 'b', position: 2 },
    ])

    expect(update).toHaveBeenCalledTimes(2)
  })

  it('updateTransposedKey throws on error', async () => {
    const eq = vi.fn().mockResolvedValue({ error: new Error('bad') })
    const update = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ update }))

    await expect(updateTransposedKey({ from } as unknown as never, 'it-1', 'D')).rejects.toThrow('bad')
  })

  it('ensureSetlist returns existing id without insert', async () => {
    const singleExisting = vi.fn().mockResolvedValue({ data: { id: 'sl-existing' }, error: null })
    const eqExisting = vi.fn(() => ({ single: singleExisting }))
    const selectExisting = vi.fn(() => ({ eq: eqExisting }))

    const insert = vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) }))

    const from = vi.fn((table: string) => {
      if (table === 'setlists') {
        return {
          select: selectExisting,
          insert,
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    })

    const id = await ensureSetlist({ from } as unknown as never, 'e-1')

    expect(id).toBe('sl-existing')
    expect(insert).not.toHaveBeenCalled()
  })

  it('removeFromSetlist throws on delete failure', async () => {
    const eq = vi.fn().mockResolvedValue({ error: new Error('delete failed') })
    const del = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ delete: del }))

    await expect(removeFromSetlist({ from } as unknown as never, 'it-1')).rejects.toThrow('delete failed')
  })
})
