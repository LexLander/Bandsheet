import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  getAuthUser: vi.fn(),
}))

vi.mock('@/lib/db/library', () => ({
  removeFromLibrary: vi.fn(),
}))

import { DELETE } from '@/app/api/library/[id]/route'
import { removeFromLibrary } from '@/lib/db/library'
import { createClient, getAuthUser } from '@/lib/supabase/server'

describe('DELETE /api/library/[id]', () => {
  const supabaseMock = { tag: 'supabase' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(supabaseMock as never)
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-1' } as never)
  })

  it('returns 401 for unauthorized user', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null)

    const res = await DELETE(new Request('http://localhost/api/library/item-1', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'item-1' }),
    })

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 400 when id is missing', async () => {
    const res = await DELETE(new Request('http://localhost/api/library/', { method: 'DELETE' }), {
      params: Promise.resolve({ id: '' }),
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'id_required' })
  })

  it('returns 400 when id is only whitespace', async () => {
    const res = await DELETE(new Request('http://localhost/api/library/   ', { method: 'DELETE' }), {
      params: Promise.resolve({ id: '   ' }),
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'id_required' })
    expect(removeFromLibrary).not.toHaveBeenCalled()
  })

  it('removes library item for current user', async () => {
    vi.mocked(removeFromLibrary).mockResolvedValue(undefined)

    const res = await DELETE(new Request('http://localhost/api/library/item-1', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'item-1' }),
    })

    expect(res.status).toBe(200)
    expect(removeFromLibrary).toHaveBeenCalledWith(supabaseMock, 'item-1', 'user-1')
    expect(await res.json()).toEqual({ ok: true })
  })
})
