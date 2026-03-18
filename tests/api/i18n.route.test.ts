import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/db/i18n-runtime', () => ({
  fetchEnabledRuntimeLanguages: vi.fn(),
  getRuntimeI18nPayload: vi.fn(),
}))

import { GET } from '@/app/api/i18n/route'
import { createClient } from '@/lib/supabase/server'
import { fetchEnabledRuntimeLanguages, getRuntimeI18nPayload } from '@/lib/db/i18n-runtime'

describe('GET /api/i18n', () => {
  const supabaseMock = { tag: 'mock' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(supabaseMock as never)
  })

  it('returns only languages in list mode', async () => {
    vi.mocked(fetchEnabledRuntimeLanguages).mockResolvedValue([
      { code: 'uk', name: 'Українська' },
      { code: 'en', name: 'English' },
    ])

    const res = await GET(new Request('http://localhost/api/i18n?locale=uk&list=1'))
    const payload = await res.json()

    expect(fetchEnabledRuntimeLanguages).toHaveBeenCalledWith(supabaseMock)
    expect(getRuntimeI18nPayload).not.toHaveBeenCalled()
    expect(payload).toEqual({
      languages: [
        { code: 'uk', name: 'Українська' },
        { code: 'en', name: 'English' },
      ],
    })
  })

  it('returns full payload in default mode', async () => {
    vi.mocked(getRuntimeI18nPayload).mockResolvedValue({
      languages: [{ code: 'en', name: 'English' }],
      overrides: [{ key: 'app.nav.users', value: 'Users' }],
    })

    const res = await GET(new Request('http://localhost/api/i18n?locale=EN'))
    const payload = await res.json()

    expect(getRuntimeI18nPayload).toHaveBeenCalledWith(supabaseMock, 'en')
    expect(payload).toEqual({
      languages: [{ code: 'en', name: 'English' }],
      overrides: [{ key: 'app.nav.users', value: 'Users' }],
    })
  })

  it('returns safe empty payload on errors', async () => {
    vi.mocked(createClient).mockRejectedValue(new Error('boom'))

    const res = await GET(new Request('http://localhost/api/i18n?locale=ru'))
    const payload = await res.json()

    expect(payload).toEqual({ languages: [], overrides: [] })
  })
})
