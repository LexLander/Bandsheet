'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAdminContext, normalizeFlag, writeI18nAudit } from './_helpers'
import { generateAiDrafts } from './i18n-ai'
import {
  ADMIN_LANGUAGES_PATH,
  aiDebugLog,
  normalizeAiProvider,
  parseSelectedVariableIds,
  type TranslationStatus,
} from './i18n-shared'
import { getSiteSettings } from '@/lib/db/settings'
import { generateTranslationDrafts } from '@/lib/i18n/external'

export async function saveI18nTranslationValue(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const variableId = (formData.get('variable_id') as string | null)?.trim() ?? ''
  const languageCode = (formData.get('language_code') as string | null)?.trim().toLowerCase() ?? ''
  const value = (formData.get('value') as string | null) ?? ''
  const status = ((formData.get('status') as string | null)?.trim() ??
    'published') as TranslationStatus

  if (!variableId || !languageCode || languageCode === 'en') {
    redirect(`${ADMIN_LANGUAGES_PATH}?error=value_required`)
  }

  const { error } = await admin.from('i18n_values').upsert(
    {
      variable_id: variableId,
      language_code: languageCode,
      value,
      status,
      provider: 'manual',
      updated_by: actor.id,
      is_enabled: true,
      is_deleted: false,
    },
    { onConflict: 'variable_id,language_code' }
  )

  if (error) redirect(`${ADMIN_LANGUAGES_PATH}?error=value_save_failed`)

  await writeI18nAudit(actor.id, 'i18n_value_saved', {
    variable_id: variableId,
    language_code: languageCode,
    status,
  })

  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=value_saved`)
}

export async function setI18nTranslationEnabled(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const valueId = (formData.get('value_id') as string | null)?.trim() ?? ''
  const enabled = normalizeFlag(formData.get('enabled'))
  if (!valueId) redirect(`${ADMIN_LANGUAGES_PATH}?error=value_required`)

  const { error } = await admin
    .from('i18n_values')
    .update({ is_enabled: enabled })
    .eq('id', valueId)
  if (error) redirect(`${ADMIN_LANGUAGES_PATH}?error=value_toggle_failed`)

  await writeI18nAudit(actor.id, 'i18n_value_toggled', { value_id: valueId, enabled })
  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=value_toggled`)
}

export async function deleteI18nTranslationValue(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const valueId = (formData.get('value_id') as string | null)?.trim() ?? ''
  if (!valueId) redirect(`${ADMIN_LANGUAGES_PATH}?error=value_required`)

  const { error } = await admin.from('i18n_values').delete().eq('id', valueId)
  if (error) redirect(`${ADMIN_LANGUAGES_PATH}?error=value_delete_failed`)

  await writeI18nAudit(actor.id, 'i18n_value_deleted', { value_id: valueId })
  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=value_deleted`)
}

export async function bulkSetI18nTranslationsEnabled(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const variableIds = parseSelectedVariableIds(formData.get('selected_variable_ids'))
  const languageCode = (formData.get('language_code') as string | null)?.trim().toLowerCase() ?? ''
  const enabled = normalizeFlag(formData.get('enabled'))

  if (!languageCode || languageCode === 'en') {
    redirect(`${ADMIN_LANGUAGES_PATH}?error=bulk_language_required`)
  }
  if (!variableIds.length) redirect(`${ADMIN_LANGUAGES_PATH}?error=bulk_selection_required`)

  const { error } = await admin
    .from('i18n_values')
    .update({ is_enabled: enabled })
    .in('variable_id', variableIds)
    .eq('language_code', languageCode)

  if (error) redirect(`${ADMIN_LANGUAGES_PATH}?error=bulk_toggle_failed`)

  await writeI18nAudit(actor.id, 'i18n_values_bulk_toggled', {
    language_code: languageCode,
    variable_count: variableIds.length,
    enabled,
  })

  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=values_bulk_toggled`)
}

export async function bulkDeleteI18nTranslations(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const variableIds = parseSelectedVariableIds(formData.get('selected_variable_ids'))
  const languageCode = (formData.get('language_code') as string | null)?.trim().toLowerCase() ?? ''

  if (!languageCode || languageCode === 'en') {
    redirect(`${ADMIN_LANGUAGES_PATH}?error=bulk_language_required`)
  }
  if (!variableIds.length) redirect(`${ADMIN_LANGUAGES_PATH}?error=bulk_selection_required`)

  const { error } = await admin
    .from('i18n_values')
    .delete()
    .in('variable_id', variableIds)
    .eq('language_code', languageCode)

  if (error) redirect(`${ADMIN_LANGUAGES_PATH}?error=bulk_delete_failed`)

  await writeI18nAudit(actor.id, 'i18n_values_bulk_deleted', {
    language_code: languageCode,
    variable_count: variableIds.length,
  })

  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=values_bulk_deleted`)
}

export async function bulkGenerateI18nTranslations(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const variableIds = parseSelectedVariableIds(formData.get('selected_variable_ids'))
  const languageCode = (formData.get('language_code') as string | null)?.trim().toLowerCase() ?? ''
  const translateModeRaw =
    (formData.get('mode') as string | null) ?? (formData.get('translate_mode') as string | null)
  const translateMode = (translateModeRaw ?? '').trim().toLowerCase() === 'empty' ? 'empty' : 'all'

  if (!languageCode || languageCode === 'en') {
    redirect(`${ADMIN_LANGUAGES_PATH}?error=bulk_language_required`)
  }

  let effectiveVariableIds = variableIds
  if (!effectiveVariableIds.length) {
    const { data: allEnabledVariables } = await admin
      .from('i18n_variables')
      .select('id')
      .eq('is_enabled', true)
      .eq('is_deleted', false)

    effectiveVariableIds = ((allEnabledVariables ?? []) as Array<{ id: string }>).map(
      (row) => row.id
    )
  }

  if (!effectiveVariableIds.length) {
    redirect(`${ADMIN_LANGUAGES_PATH}?error=bulk_selection_required`)
  }

  const settings = await getSiteSettings(admin, { maskSecrets: false })
  const aiProvider = normalizeAiProvider(settings.ai_provider)
  const aiApiKey = settings.ai_api_key?.trim() ?? ''
  aiDebugLog('AI provider:', aiProvider, 'has key:', !!aiApiKey)
  if (!aiApiKey) redirect(`${ADMIN_LANGUAGES_PATH}?error=translation_provider_not_configured`)

  const { data: variables } = await admin
    .from('i18n_variables')
    .select('id, var_key, source_text')
    .in('id', effectiveVariableIds)
    .eq('is_enabled', true)
    .eq('is_deleted', false)
    .order('var_key', { ascending: true })

  const variableRows = (variables ?? []) as Array<{
    id: string
    var_key: string
    source_text: string
  }>

  let targetVariables = variableRows
  if (translateMode === 'empty') {
    const { data: existingValues } = await admin
      .from('i18n_values')
      .select('variable_id, value')
      .in('variable_id', effectiveVariableIds)
      .eq('language_code', languageCode)
      .eq('is_deleted', false)

    const nonEmptyVariableIds = new Set(
      ((existingValues ?? []) as Array<{ variable_id: string; value: string }>)
        .filter((row) => row.value?.trim())
        .map((row) => row.variable_id)
    )

    targetVariables = variableRows.filter((row) => !nonEmptyVariableIds.has(row.id))
  }

  const requests = targetVariables.map((row) => ({ key: row.var_key, sourceText: row.source_text }))

  let drafts
  try {
    drafts = await generateAiDrafts(aiProvider, aiApiKey, requests, languageCode)
    aiDebugLog('Drafts received:', drafts.drafts.length, 'provider:', drafts.provider)
  } catch (error) {
    console.error('Translation error:', error)
    const code = error instanceof Error ? error.message : 'translation_provider_failed'
    redirect(`${ADMIN_LANGUAGES_PATH}?error=${code}`)
  }

  const valueMap = new Map(drafts.drafts.map((row) => [row.key, row.value]))
  let generated = 0

  for (const variable of targetVariables) {
    const value = valueMap.get(variable.var_key)
    if (!value) continue

    const { error } = await admin.from('i18n_values').upsert(
      {
        variable_id: variable.id,
        language_code: languageCode,
        value,
        status: 'published',
        provider: drafts.provider,
        updated_by: actor.id,
        is_enabled: true,
        is_deleted: false,
      },
      { onConflict: 'variable_id,language_code' }
    )

    if (!error) generated += 1
  }

  aiDebugLog('Generated:', generated, 'of', targetVariables.length)

  await writeI18nAudit(actor.id, 'i18n_values_bulk_generated', {
    language_code: languageCode,
    variable_count: targetVariables.length,
    generated,
    provider: drafts.provider,
    mode: translateMode,
  })

  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=values_bulk_generated`)
}

export async function generateI18nDraftTranslations(formData: FormData) {
  const { actor, admin } = await getAdminContext()
  const languageCode = (formData.get('language_code') as string | null)?.trim().toLowerCase() ?? ''

  if (!languageCode) redirect(`${ADMIN_LANGUAGES_PATH}?error=language_required`)
  if (languageCode === 'en') redirect(`${ADMIN_LANGUAGES_PATH}?error=language_default_locked`)

  const { data: variables } = await admin
    .from('i18n_variables')
    .select('id, var_key, source_text')
    .eq('is_enabled', true)
    .eq('is_deleted', false)
    .order('var_key', { ascending: true })

  const requests = (variables ?? []).map((row) => ({
    key: row.var_key,
    sourceText: row.source_text,
  }))

  let drafts
  try {
    drafts = await generateTranslationDrafts(requests, languageCode)
  } catch (error) {
    const code = error instanceof Error ? error.message : 'translation_provider_failed'
    redirect(`${ADMIN_LANGUAGES_PATH}?error=${code}`)
  }

  const valueMap = new Map(drafts.drafts.map((row) => [row.key, row.value]))
  let generated = 0

  for (const variable of (variables ?? []) as Array<{ id: string; var_key: string }>) {
    const value = valueMap.get(variable.var_key)
    if (!value) continue

    const { error } = await admin.from('i18n_values').upsert(
      {
        variable_id: variable.id,
        language_code: languageCode,
        value,
        status: 'needs_review',
        provider: drafts.provider,
        updated_by: actor.id,
        is_enabled: true,
        is_deleted: false,
      },
      { onConflict: 'variable_id,language_code' }
    )

    if (!error) generated += 1
  }

  await writeI18nAudit(actor.id, 'i18n_drafts_generated', {
    language_code: languageCode,
    generated,
    provider: drafts.provider,
  })

  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=draft_generated`)
}
