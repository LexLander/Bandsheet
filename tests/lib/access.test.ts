import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkLimit, hasFeature } from '@/lib/access'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

type DbResponse = {
  data: Record<string, unknown> | null
  error: { message: string } | null
}

type MockConfig = {
  profile?: DbResponse
  freePlan?: DbResponse
  feature?: DbResponse
  limit?: DbResponse
}

function makeSupabaseMock(config: MockConfig) {
  const profilesMaybeSingle = vi
    .fn()
    .mockResolvedValue(config.profile ?? { data: null, error: null })
  const profilesEq = vi.fn(() => ({ maybeSingle: profilesMaybeSingle }))
  const profilesSelect = vi.fn(() => ({ eq: profilesEq }))

  const plansMaybeSingle = vi.fn().mockResolvedValue(config.freePlan ?? { data: null, error: null })
  const plansLimit = vi.fn(() => ({ maybeSingle: plansMaybeSingle }))
  const plansOrder = vi.fn(() => ({ limit: plansLimit }))
  const plansEq = vi.fn(() => ({ order: plansOrder }))
  const plansSelect = vi.fn(() => ({ eq: plansEq }))

  const featureMaybeSingle = vi
    .fn()
    .mockResolvedValue(config.feature ?? { data: null, error: null })
  const featureEqFeature = vi.fn(() => ({ maybeSingle: featureMaybeSingle }))
  const featureEqPlan = vi.fn(() => ({ eq: featureEqFeature }))
  const featureSelect = vi.fn(() => ({ eq: featureEqPlan }))

  const limitMaybeSingle = vi.fn().mockResolvedValue(config.limit ?? { data: null, error: null })
  const limitEqKey = vi.fn(() => ({ maybeSingle: limitMaybeSingle }))
  const limitEqPlan = vi.fn(() => ({ eq: limitEqKey }))
  const limitSelect = vi.fn(() => ({ eq: limitEqPlan }))

  const from = vi.fn((table: string) => {
    if (table === 'profiles') return { select: profilesSelect }
    if (table === 'plans') return { select: plansSelect }
    if (table === 'plan_features') return { select: featureSelect }
    if (table === 'plan_limits') return { select: limitSelect }
    return { select: vi.fn() }
  })

  return { from }
}

describe('lib/access hasFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when plan exists and feature enabled', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({
        profile: { data: { plan_id: 'plan-pro' }, error: null },
        feature: { data: { enabled: true }, error: null },
      }) as unknown as never
    )

    await expect(hasFeature('u1', 'import_url')).resolves.toBe(true)
  })

  it('returns false when plan exists and feature disabled', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({
        profile: { data: { plan_id: 'plan-pro' }, error: null },
        feature: { data: { enabled: false }, error: null },
      }) as unknown as never
    )

    await expect(hasFeature('u1', 'import_url')).resolves.toBe(false)
  })

  it('uses free plan when profile.plan_id is null and returns true when enabled', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({
        profile: { data: { plan_id: null }, error: null },
        freePlan: { data: { id: 'plan-free' }, error: null },
        feature: { data: { enabled: true }, error: null },
      }) as unknown as never
    )

    await expect(hasFeature('u1', 'chord_palette')).resolves.toBe(true)
  })

  it('uses free plan when profile.plan_id is null and returns false when disabled', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({
        profile: { data: { plan_id: null }, error: null },
        freePlan: { data: { id: 'plan-free' }, error: null },
        feature: { data: { enabled: false }, error: null },
      }) as unknown as never
    )

    await expect(hasFeature('u1', 'song_editor_deputy')).resolves.toBe(false)
  })

  it('returns false on DB error', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({
        profile: { data: null, error: { message: 'boom' } },
      }) as unknown as never
    )

    await expect(hasFeature('u1', 'import_url')).resolves.toBe(false)
  })

  it('returns false when free plan is not found', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({
        profile: { data: { plan_id: null }, error: null },
        freePlan: { data: null, error: null },
      }) as unknown as never
    )

    await expect(hasFeature('u1', 'import_url')).resolves.toBe(false)
  })
})

describe('lib/access checkLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns unlimited when value is -1', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({
        profile: { data: { plan_id: 'plan-pro' }, error: null },
        limit: { data: { value: -1 }, error: null },
      }) as unknown as never
    )

    await expect(checkLimit('u1', 'max_events_per_month', 999)).resolves.toEqual({
      allowed: true,
      limit: -1,
      current: 999,
    })
  })

  it('returns allowed=true when currentCount is below limit', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({
        profile: { data: { plan_id: 'plan-pro' }, error: null },
        limit: { data: { value: 10 }, error: null },
      }) as unknown as never
    )

    await expect(checkLimit('u1', 'max_groups', 3)).resolves.toEqual({
      allowed: true,
      limit: 10,
      current: 3,
    })
  })

  it('returns allowed=false when currentCount reached limit', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({
        profile: { data: { plan_id: 'plan-pro' }, error: null },
        limit: { data: { value: 3 }, error: null },
      }) as unknown as never
    )

    await expect(checkLimit('u1', 'max_groups', 3)).resolves.toEqual({
      allowed: false,
      limit: 3,
      current: 3,
    })
  })

  it('returns deny-safe when key is not found', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({
        profile: { data: { plan_id: 'plan-pro' }, error: null },
        limit: { data: null, error: null },
      }) as unknown as never
    )

    await expect(checkLimit('u1', 'max_setlist_songs', 4)).resolves.toEqual({
      allowed: false,
      limit: 0,
      current: 4,
    })
  })

  it('returns deny-safe on DB error', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({
        profile: { data: { plan_id: 'plan-pro' }, error: null },
        limit: { data: null, error: { message: 'db error' } },
      }) as unknown as never
    )

    await expect(checkLimit('u1', 'max_groups', 2)).resolves.toEqual({
      allowed: false,
      limit: 0,
      current: 2,
    })
  })

  it('returns deny-safe when free plan is not found', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseMock({
        profile: { data: { plan_id: null }, error: null },
        freePlan: { data: null, error: null },
      }) as unknown as never
    )

    await expect(checkLimit('u1', 'max_library_songs', 1)).resolves.toEqual({
      allowed: false,
      limit: 0,
      current: 1,
    })
  })
})
