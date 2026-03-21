'use server'

import { getAdminContext, writeAudit } from './_helpers'
import { getServerT } from '@/lib/i18n/server'
import type { FeatureKey, LimitKey } from '@/lib/access'

type FormState = {
  error: string | null
  success: string | null
}

export async function createPlan(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    const { actor, admin } = await getAdminContext()
    const { t } = await getServerT()

    const name = (formData.get('name') as string | null)?.trim()
    const description = (formData.get('description') as string | null)?.trim()
    const priceMonthly = parseFloat((formData.get('price_monthly') as string) || '0') || 0
    const priceYearly = parseFloat((formData.get('price_yearly') as string) || '0') || null
    const firstMonthPrice = parseFloat((formData.get('first_month_price') as string) || '0') || null
    const trialDays = parseInt((formData.get('trial_days') as string) || '0') || 0
    const sortOrder = parseInt((formData.get('sort_order') as string) || '0') || 0
    const isActive = formData.get('is_active') === 'on'
    const isFree = formData.get('is_free') === 'on'

    // Валидация
    if (!name) {
      return { error: t.admin.plans.fieldName + " обов'язковий", success: null }
    }
    if (priceMonthly < 0) {
      return { error: t.admin.plans.fieldPriceMonthly + " не може бути від'ємною", success: null }
    }

    const { data, error } = await admin
      .from('plans')
      .insert({
        name,
        description: description || null,
        is_active: isActive,
        is_free: isFree,
        price_monthly: priceMonthly,
        price_yearly: priceYearly,
        first_month_price: firstMonthPrice,
        trial_days: trialDays,
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Create plan error:', error)
      return { error: t.admin.plans.unknownError, success: null }
    }

    await writeAudit(actor.id, data.id, 'create_plan', { name })

    return { error: null, success: t.admin.plans.successCreated }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Create plan exception:', message)
    return { error: message, success: null }
  }
}

export async function updatePlan(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    const { actor, admin } = await getAdminContext()
    const { t } = await getServerT()

    const planId = (formData.get('plan_id') as string | null)?.trim()
    if (!planId) {
      return { error: "Ідентифікатор плану обов'язковий", success: null }
    }

    // Get existing plan to check if it's free
    const { data: existingPlan, error: fetchError } = await admin
      .from('plans')
      .select('is_free')
      .eq('id', planId)
      .single()

    if (fetchError || !existingPlan) {
      return { error: t.admin.plans.unknownError, success: null }
    }

    const name = (formData.get('name') as string | null)?.trim()
    const description = (formData.get('description') as string | null)?.trim()
    const priceMonthly = parseFloat((formData.get('price_monthly') as string) || '0') || 0
    const priceYearly = parseFloat((formData.get('price_yearly') as string) || '0') || null
    const firstMonthPrice = parseFloat((formData.get('first_month_price') as string) || '0') || null
    const trialDays = parseInt((formData.get('trial_days') as string) || '0') || 0
    const sortOrder = parseInt((formData.get('sort_order') as string) || '0') || 0
    const isActive = formData.get('is_active') === 'on'
    // Protect is_free for free plans
    const isFree = existingPlan.is_free ? true : formData.get('is_free') === 'on'

    if (!name) {
      return { error: t.admin.plans.fieldName + " обов'язковий", success: null }
    }
    if (priceMonthly < 0) {
      return { error: t.admin.plans.fieldPriceMonthly + " не може бути від'ємною", success: null }
    }

    const { error } = await admin
      .from('plans')
      .update({
        name,
        description: description || null,
        is_active: isActive,
        is_free: isFree,
        price_monthly: priceMonthly,
        price_yearly: priceYearly,
        first_month_price: firstMonthPrice,
        trial_days: trialDays,
        sort_order: sortOrder,
      })
      .eq('id', planId)

    if (error) {
      console.error('Update plan error:', error)
      return { error: t.admin.plans.unknownError, success: null }
    }

    await writeAudit(actor.id, planId, 'update_plan', { name })

    return { error: null, success: t.admin.plans.successUpdated }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Update plan exception:', message)
    return { error: message, success: null }
  }
}

export async function deletePlan(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    const { actor, admin } = await getAdminContext()
    const { t } = await getServerT()

    const planId = (formData.get('plan_id') as string | null)?.trim()
    if (!planId) {
      return { error: "Ідентифікатор плану обов'язковий", success: null }
    }

    // Get plan to check if free and get name for audit
    const { data: plan, error: fetchError } = await admin
      .from('plans')
      .select('id, name, is_free')
      .eq('id', planId)
      .single()

    if (fetchError || !plan) {
      return { error: t.admin.plans.unknownError, success: null }
    }

    // Check if it's free plan
    if (plan.is_free) {
      return { error: t.admin.plans.cannotDeleteFree, success: null }
    }

    // Check if any users have this plan
    const { count } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', planId)

    if (count && count > 0) {
      return { error: t.admin.plans.cannotDeleteHasUsers, success: null }
    }

    const { error } = await admin.from('plans').delete().eq('id', planId)

    if (error) {
      console.error('Delete plan error:', error)
      return { error: t.admin.plans.unknownError, success: null }
    }

    await writeAudit(actor.id, planId, 'delete_plan', { name: plan.name })

    return { error: null, success: t.admin.plans.successDeleted }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Delete plan exception:', message)
    return { error: message, success: null }
  }
}

export async function updatePlanLimits(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const { actor, admin } = await getAdminContext()
    const { t } = await getServerT()

    const planId = (formData.get('plan_id') as string | null)?.trim()
    if (!planId) {
      return { error: "Ідентифікатор плану обов'язковий", success: null }
    }

    const limitKeys: LimitKey[] = [
      'max_library_songs',
      'max_groups',
      'max_group_members',
      'max_events_per_month',
      'max_setlist_songs',
    ]

    const upsertPromises = limitKeys.map(async (key) => {
      const raw = formData.get(key) as string | null
      let value: number

      if (!raw || raw === '∞' || raw.trim() === '') {
        value = -1
      } else {
        value = parseInt(raw)
        if (isNaN(value) || value < -1) {
          throw new Error(`Invalid value for ${key}: ${raw}`)
        }
      }

      return admin.from('plan_limits').upsert({ plan_id: planId, key, value })
    })

    const results = await Promise.allSettled(upsertPromises)
    const failed = results.some((r) => r.status === 'rejected')

    if (failed) {
      return { error: t.admin.plans.unknownError, success: null }
    }

    await writeAudit(actor.id, planId, 'update_plan_limits', {})

    return { error: null, success: t.admin.plans.successUpdated }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Update plan limits exception:', message)
    return { error: message, success: null }
  }
}

export async function updatePlanFeatures(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const { actor, admin } = await getAdminContext()
    const { t } = await getServerT()

    const planId = (formData.get('plan_id') as string | null)?.trim()
    if (!planId) {
      return { error: "Ідентифікатор плану обов'язковий", success: null }
    }

    const featureKeys: FeatureKey[] = ['import_url', 'chord_palette', 'song_editor_deputy']

    const upsertPromises = featureKeys.map((key) => {
      const enabled = formData.get(key) === 'on'
      return admin.from('plan_features').upsert({ plan_id: planId, feature_key: key, enabled })
    })

    const results = await Promise.allSettled(upsertPromises)
    const failed = results.some((r) => r.status === 'rejected')

    if (failed) {
      return { error: t.admin.plans.unknownError, success: null }
    }

    await writeAudit(actor.id, planId, 'update_plan_features', {})

    return { error: null, success: t.admin.plans.successUpdated }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Update plan features exception:', message)
    return { error: message, success: null }
  }
}
