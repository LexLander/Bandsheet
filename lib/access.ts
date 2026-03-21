import { createClient } from '@/lib/supabase/server'

export type FeatureKey = 'import_url' | 'chord_palette' | 'song_editor_deputy'

export type LimitKey =
  | 'max_library_songs'
  | 'max_groups'
  | 'max_group_members'
  | 'max_events_per_month'
  | 'max_setlist_songs'

type CheckLimitResult = {
  allowed: boolean
  limit: number
  current: number
}

async function getFreePlanId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('plans')
      .select('id')
      .eq('is_free', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error || !data?.id) return null
    return data.id as string
  } catch {
    return null
  }
}

async function getEffectivePlanId(userId: string): Promise<string | null> {
  const userPlanId = await getUserPlanId(userId)
  if (userPlanId) return userPlanId

  // Fallback for users without explicit assignment.
  return getFreePlanId()
}

export async function getUserPlanId(userId: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('plan_id')
      .eq('id', userId)
      .maybeSingle()

    if (error) return null
    return (data?.plan_id as string | null) ?? null
  } catch {
    return null
  }
}

export async function hasFeature(userId: string, featureKey: FeatureKey): Promise<boolean> {
  try {
    const planId = await getEffectivePlanId(userId)
    if (!planId) return false

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('plan_features')
      .select('enabled')
      .eq('plan_id', planId)
      .eq('feature_key', featureKey)
      .maybeSingle()

    if (error) return false
    return data?.enabled === true
  } catch {
    return false
  }
}

export async function checkLimit(
  userId: string,
  limitKey: LimitKey,
  currentCount: number
): Promise<CheckLimitResult> {
  const fallback: CheckLimitResult = { allowed: false, limit: 0, current: currentCount }

  try {
    const planId = await getEffectivePlanId(userId)
    if (!planId) return fallback

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('plan_limits')
      .select('value')
      .eq('plan_id', planId)
      .eq('key', limitKey)
      .maybeSingle()

    if (error || !data || typeof data.value !== 'number') return fallback

    if (data.value === -1) {
      return { allowed: true, limit: -1, current: currentCount }
    }

    return {
      allowed: currentCount < data.value,
      limit: data.value,
      current: currentCount,
    }
  } catch {
    return fallback
  }
}
