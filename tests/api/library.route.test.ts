import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  getAuthUser: vi.fn(),
}))

vi.mock('@/lib/db/library', () => ({
  addToLibrary: vi.fn(),
  isSongInLibrary: vi.fn(),
}))

import { POST } from '@/app/api/library/route'
import { addToLibrary, isSongInLibrary } from '@/lib/db/library'
import { createClient, getAuthUser } from '@/lib/supabase/server'

describe('POST /api/library', () => {
  const supabaseMock = { tag: 'supabase' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(supabaseMock as never)
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-1' } as never)
  })

  it('returns 401 for unauthorized user', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)

    const res = await POST(new Request('http://localhost/api/library', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ song_id: 'song-1' }),
    }))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 400 when song_id is missing', async () => {
    const res = await POST(new Request('http://localhost/api/library', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'song_id_required' })
  })

  it('returns already=true when song is already in library', async () => {
    vi.mocked(isSongInLibrary).mockResolvedValue(true)

    const res = await POST(new Request('http://localhost/api/library', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ song_id: 'song-1' }),
    }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, already: true })
    expect(addToLibrary).not.toHaveBeenCalled()
  })

  it('adds song with explicit private source', async () => {
    vi.mocked(isSongInLibrary).mockResolvedValue(false)
    vi.mocked(addToLibrary).mockResolvedValue({ id: 'item-1' } as never)

    const res = await POST(new Request('http://localhost/api/library', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ song_id: 'song-1', song_source: 'private' }),
    }))

    expect(res.status).toBe(200)
    expect(addToLibrary).toHaveBeenCalledWith(supabaseMock, 'user-1', 'song-1', 'private')
    expect(await res.json()).toEqual({ ok: true, item: { id: 'item-1' } })
  })

  it('trims song_id and falls back to public source for unknown values', async () => {
    vi.mocked(isSongInLibrary).mockResolvedValue(false)
    vi.mocked(addToLibrary).mockResolvedValue({ id: 'item-2' } as never)

    const res = await POST(new Request('http://localhost/api/library', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ song_id: '  song-2  ', song_source: 'external' }),
    }))

    expect(res.status).toBe(200)
    expect(addToLibrary).toHaveBeenCalledWith(supabaseMock, 'user-1', 'song-2', 'public')
    expect(await res.json()).toEqual({ ok: true, item: { id: 'item-2' } })
  })
})
