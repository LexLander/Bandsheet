'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAdminContext, writeI18nAudit, normalizeFlag } from './_helpers'
import { getBuiltInCatalog } from '@/lib/i18n/catalog'
import { translations } from '@/lib/i18n/translations'
import { generateTranslationDrafts } from '@/lib/i18n/external'
import { getSiteSettings } from '@/lib/db/settings'

type TranslationDraftRequest = {
  key: string
  sourceText: string
}

type TranslationDraftResult = {
  provider: string
  drafts: Array<{ key: string; value: string }>
}

type I18nImportPayload = {
  languages?: Array<{ code?: string; name?: string; native_name?: string; enabled?: boolean }>
  variables?: Array<{
    key?: string
    namespace?: string
    description?: string | null
    sourceText?: string | null
    enabled?: boolean
    translations?: Record<string, string | { value?: string; enabled?: boolean; status?: 'draft' | 'published' | 'needs_review' }>
  }>
}

function deriveNamespace(varKey: string) {
  return varKey.split('.')[0] ?? 'app'
}

function parseSelectedVariableIds(raw: FormDataEntryValue | null) {
  const text = (raw as string | null)?.trim() ?? ''
  if (!text) return [] as string[]
  return Array.from(new Set(text.split(',').map((id) => id.trim()).filter(Boolean)))
}

function normalizeAiProvider(raw: string | undefined) {
  return raw?.trim().toLowerCase() === 'openai' ? 'openai' : 'anthropic'
}

function isI18nAiDebugEnabled() {
  return process.env.I18N_AI_DEBUG === '1'
}

function aiDebugLog(...args: unknown[]) {
  if (isI18nAiDebugEnabled()) {
    console.log(...args)
  }
}

function parseJsonRecord(text: string): Record<string, string> {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const candidate = fenced?.[1] ?? trimmed
  const parsed = JSON.parse(candidate) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('translation_provider_invalid_response')
  }

  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'string') {
      result[key] = value
    }
  }
  return result
}

async function translateWithAnthropic(
  apiKey: string,
  requests: TranslationDraftRequest[],
  targetLanguage: string
): Promise<TranslationDraftResult> {
  const prompt = [
    'You are a translation engine.',
    `Translate each English source text to ${targetLanguage}.`,
    'Return JSON object where each KEY is the translation key (e.g. "app.nav.users") and VALUE is the translated string.',
    'Example: {"app.nav.users": "Utilisateurs"}',
    'Use exactly the provided keys. Do not use sourceText as keys.',
    'Translate values only.',
    'Do not skip items.',
    'Do not add comments or markdown.',
    JSON.stringify(requests),
  ].join('\n\n')

  aiDebugLog('Prompt sent to Anthropic:', prompt.slice(0, 500))

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error('translation_provider_failed')
  }

  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>
  }

  const text = (payload.content ?? [])
    .filter((item) => item?.type === 'text' && typeof item.text === 'string')
    .map((item) => item.text ?? '')
    .join('\n')

  aiDebugLog('Raw response from Anthropic:', text.slice(0, 1000))

  const valuesByKey = parseJsonRecord(text)
  aiDebugLog('Parsed values sample:', Object.entries(valuesByKey).slice(0, 3))

  return {
    provider: 'anthropic',
    drafts: requests.map((row) => ({
      key: row.key,
      value: valuesByKey[row.key] ?? row.sourceText,
    })),
  }
}

async function translateWithOpenAI(
  apiKey: string,
  requests: TranslationDraftRequest[],
  targetLanguage: string
): Promise<TranslationDraftResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Translate provided English phrases and return strict JSON object: {"key":"translation"}.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            targetLanguage,
            items: requests,
          }),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error('translation_provider_failed')
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const text = payload.choices?.[0]?.message?.content ?? ''
  const valuesByKey = parseJsonRecord(text)

  return {
    provider: 'openai',
    drafts: requests.map((row) => ({
      key: row.key,
      value: valuesByKey[row.key] ?? row.sourceText,
    })),
  }
}

async function generateAiDrafts(
  provider: 'anthropic' | 'openai',
  apiKey: string,
  requests: TranslationDraftRequest[],
  targetLanguage: string
): Promise<TranslationDraftResult> {
  if (!requests.length) {
    return { provider, drafts: [] }
  }

  return provider === 'openai'
    ? translateWithOpenAI(apiKey, requests, targetLanguage)
    : translateWithAnthropic(apiKey, requests, targetLanguage)
}

export async function importI18nFromJson(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const payloadRaw = (formData.get('payload') as string | null)?.trim()
  if (!payloadRaw) {
    redirect('/admin/languages?error=import_payload_required')
  }

  let payload: I18nImportPayload
  try {
    payload = JSON.parse(payloadRaw) as I18nImportPayload
  } catch {
    redirect('/admin/languages?error=import_invalid_json')
  }

  const importedLanguages = Array.isArray(payload.languages) ? payload.languages : []
  const importedVariables = Array.isArray(payload.variables) ? payload.variables : []

  let languageCount = 0
  let variableCount = 0
  let valueCount = 0

  for (const row of importedLanguages) {
    const code = (row.code ?? '').trim().toLowerCase()
    const name = (row.name ?? '').trim()
    const nativeName = (row.native_name ?? '').trim() || name
    if (!code || !name) continue

    const { error } = await admin
      .from('i18n_languages')
      .upsert({
        code,
        name,
        native_name: nativeName,
        is_enabled: code === 'en' ? true : (row.enabled ?? true),
        is_default: code === 'en',
        is_system: code === 'en',
        is_deleted: false,
      }, { onConflict: 'code' })

    if (!error) languageCount += 1
  }

  for (const row of importedVariables) {
    const varKey = (row.key ?? '').trim().toLowerCase()
    const sourceText = (row.sourceText ?? '').trim() || (typeof row.translations?.en === 'string' ? row.translations.en : '')
    if (!varKey) continue
    if (!sourceText) continue

    const { data: variable, error: variableError } = await admin
      .from('i18n_variables')
      .upsert(
        {
          var_key: varKey,
          namespace: (row.namespace ?? '').trim() || deriveNamespace(varKey),
          description: row.description ?? null,
          source_language_code: 'en',
          source_text: sourceText,
          is_enabled: row.enabled ?? true,
          is_deleted: false,
        },
        { onConflict: 'var_key' },
      )
      .select('id')
      .single()

    if (variableError || !variable) continue
    variableCount += 1

    const translations = row.translations ?? {}
    for (const [languageCodeRaw, valueRaw] of Object.entries(translations)) {
      const languageCode = languageCodeRaw.trim().toLowerCase()
      if (!languageCode) continue

      const normalizedValue =
        typeof valueRaw === 'string'
          ? { value: valueRaw, enabled: true, status: 'published' as const }
          : { value: valueRaw.value ?? '', enabled: valueRaw.enabled ?? true, status: valueRaw.status ?? 'published' }

      if (languageCode === 'en') {
        continue
      }

      const { error } = await admin
        .from('i18n_values')
        .upsert(
          {
            variable_id: variable.id,
            language_code: languageCode,
            value: normalizedValue.value,
            status: normalizedValue.status,
            provider: 'import',
            updated_by: actor.id,
            is_enabled: normalizedValue.enabled,
            is_deleted: false,
          },
          { onConflict: 'variable_id,language_code' },
        )

      if (!error) valueCount += 1
    }
  }

  await writeI18nAudit(actor.id, 'i18n_import_json', {
    languages: languageCount,
    variables: variableCount,
    values: valueCount,
  })

  revalidatePath('/admin/languages')
  redirect('/admin/languages?success=import_done')
}

export async function createI18nLanguage(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const code = (formData.get('code') as string | null)?.trim().toLowerCase() ?? ''
  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const nativeName = (formData.get('native_name') as string | null)?.trim() ?? name
  if (!code || !name) redirect('/admin/languages?error=language_required')

  const { error } = await admin
    .from('i18n_languages')
    .upsert({
      code,
      name,
      native_name: nativeName,
      is_enabled: true,
      is_default: code === 'en',
      is_system: code === 'en',
      is_deleted: false,
    }, { onConflict: 'code' })

  if (error) redirect('/admin/languages?error=language_create_failed')

  await writeI18nAudit(actor.id, 'i18n_language_saved', { code, name, native_name: nativeName })
  revalidatePath('/admin/languages')
  redirect('/admin/languages?success=language_saved')
}

export async function setI18nLanguageEnabled(formData: FormData) {
  const { actor, admin } = await getAdminContext()
  const refreshKey = Date.now()

  const code = (formData.get('code') as string | null)?.trim().toLowerCase() ?? ''
  const enabled = normalizeFlag(formData.get('enabled'))
  if (!code) redirect(`/admin/languages?error=language_required&r=${refreshKey}`)
  if (code === 'en' && !enabled) redirect(`/admin/languages?error=language_default_locked&r=${refreshKey}`)

  const { error } = await admin.from('i18n_languages').update({ is_enabled: enabled }).eq('code', code)
  if (error) redirect(`/admin/languages?error=language_toggle_failed&r=${refreshKey}`)

  await writeI18nAudit(actor.id, 'i18n_language_toggled', { code, enabled })
  revalidatePath('/admin/languages')
  redirect(`/admin/languages?success=language_toggled&r=${refreshKey}`)
}

export async function deleteI18nLanguage(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const code = (formData.get('code') as string | null)?.trim().toLowerCase() ?? ''
  if (!code) redirect('/admin/languages?error=language_required')
  if (code === 'en') redirect('/admin/languages?error=language_default_locked')

  const { error } = await admin.from('i18n_languages').delete().eq('code', code)
  if (error) redirect('/admin/languages?error=language_delete_failed')

  await writeI18nAudit(actor.id, 'i18n_language_deleted', { code })
  revalidatePath('/admin/languages')
  redirect('/admin/languages?success=language_deleted')
}

export async function createI18nVariable(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const varKey = (formData.get('var_key') as string | null)?.trim().toLowerCase() ?? ''
  const namespace = (formData.get('namespace') as string | null)?.trim().toLowerCase() || deriveNamespace(varKey)
  const description = (formData.get('description') as string | null)?.trim() ?? null
  const sourceText = (formData.get('source_text') as string | null)?.trim() ?? ''
  if (!varKey) redirect('/admin/languages?error=variable_required')
  if (!sourceText) redirect('/admin/languages?error=variable_source_required')

  const { error } = await admin
    .from('i18n_variables')
    .upsert({
      var_key: varKey,
      namespace,
      description,
      source_language_code: 'en',
      source_text: sourceText,
      is_enabled: true,
      is_deleted: false,
    }, { onConflict: 'var_key' })

  if (error) redirect('/admin/languages?error=variable_create_failed')

  await writeI18nAudit(actor.id, 'i18n_variable_saved', { var_key: varKey, namespace })
  revalidatePath('/admin/languages')
  redirect('/admin/languages?success=variable_saved')
}

export async function updateI18nVariableMeta(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const variableId = (formData.get('variable_id') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() ?? null
  const sourceText = (formData.get('source_text') as string | null)?.trim() ?? ''
  if (!variableId) redirect('/admin/languages?error=variable_required')
  if (!sourceText) redirect('/admin/languages?error=variable_source_required')

  const { error } = await admin
    .from('i18n_variables')
    .update({ description, source_text: sourceText })
    .eq('id', variableId)

  if (error) redirect('/admin/languages?error=variable_update_failed')

  await writeI18nAudit(actor.id, 'i18n_variable_updated', { variable_id: variableId })
  revalidatePath('/admin/languages')
  redirect('/admin/languages?success=variable_updated')
}

export async function setI18nVariableEnabled(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const variableId = (formData.get('variable_id') as string | null)?.trim() ?? ''
  const enabled = normalizeFlag(formData.get('enabled'))
  if (!variableId) redirect('/admin/languages?error=variable_required')

  const { error } = await admin.from('i18n_variables').update({ is_enabled: enabled }).eq('id', variableId)
  if (error) redirect('/admin/languages?error=variable_toggle_failed')

  await writeI18nAudit(actor.id, 'i18n_variable_toggled', { variable_id: variableId, enabled })
  revalidatePath('/admin/languages')
  redirect('/admin/languages?success=variable_toggled')
}

export async function deleteI18nVariable(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const variableId = (formData.get('variable_id') as string | null)?.trim() ?? ''
  if (!variableId) redirect('/admin/languages?error=variable_required')

  const { error } = await admin.from('i18n_variables').delete().eq('id', variableId)
  if (error) redirect('/admin/languages?error=variable_delete_failed')

  await writeI18nAudit(actor.id, 'i18n_variable_deleted', { variable_id: variableId })
  revalidatePath('/admin/languages')
  redirect('/admin/languages?success=variable_deleted')
}

export async function saveI18nTranslationValue(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const variableId = (formData.get('variable_id') as string | null)?.trim() ?? ''
  const languageCode = (formData.get('language_code') as string | null)?.trim().toLowerCase() ?? ''
  const value = (formData.get('value') as string | null) ?? ''
  const status = ((formData.get('status') as string | null)?.trim() ?? 'published') as 'draft' | 'published' | 'needs_review'
  if (!variableId || !languageCode) redirect('/admin/languages?error=value_required')
  if (languageCode === 'en') redirect('/admin/languages?error=value_required')

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
    { onConflict: 'variable_id,language_code' },
  )

  if (error) redirect('/admin/languages?error=value_save_failed')

  await writeI18nAudit(actor.id, 'i18n_value_saved', { variable_id: variableId, language_code: languageCode, status })
  revalidatePath('/admin/languages')
  redirect('/admin/languages?success=value_saved')
}

export async function setI18nTranslationEnabled(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const valueId = (formData.get('value_id') as string | null)?.trim() ?? ''
  const enabled = normalizeFlag(formData.get('enabled'))
  if (!valueId) redirect('/admin/languages?error=value_required')

  const { error } = await admin.from('i18n_values').update({ is_enabled: enabled }).eq('id', valueId)
  if (error) redirect('/admin/languages?error=value_toggle_failed')

  await writeI18nAudit(actor.id, 'i18n_value_toggled', { value_id: valueId, enabled })
  revalidatePath('/admin/languages')
  redirect('/admin/languages?success=value_toggled')
}

export async function deleteI18nTranslationValue(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const valueId = (formData.get('value_id') as string | null)?.trim() ?? ''
  if (!valueId) redirect('/admin/languages?error=value_required')

  const { error } = await admin.from('i18n_values').delete().eq('id', valueId)
  if (error) redirect('/admin/languages?error=value_delete_failed')

  await writeI18nAudit(actor.id, 'i18n_value_deleted', { value_id: valueId })
  revalidatePath('/admin/languages')
  redirect('/admin/languages?success=value_deleted')
}

export async function bulkSetI18nTranslationsEnabled(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const variableIds = parseSelectedVariableIds(formData.get('selected_variable_ids'))
  const languageCode = (formData.get('language_code') as string | null)?.trim().toLowerCase() ?? ''
  const enabled = normalizeFlag(formData.get('enabled'))

  if (!languageCode || languageCode === 'en') redirect('/admin/languages?error=bulk_language_required')
  if (!variableIds.length) redirect('/admin/languages?error=bulk_selection_required')

  const { error } = await admin
    .from('i18n_values')
    .update({ is_enabled: enabled })
    .in('variable_id', variableIds)
    .eq('language_code', languageCode)

  if (error) redirect('/admin/languages?error=bulk_toggle_failed')

  await writeI18nAudit(actor.id, 'i18n_values_bulk_toggled', {
    language_code: languageCode,
    variable_count: variableIds.length,
    enabled,
  })

  revalidatePath('/admin/languages')
  redirect('/admin/languages?success=values_bulk_toggled')
}

export async function bulkDeleteI18nTranslations(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const variableIds = parseSelectedVariableIds(formData.get('selected_variable_ids'))
  const languageCode = (formData.get('language_code') as string | null)?.trim().toLowerCase() ?? ''

  if (!languageCode || languageCode === 'en') redirect('/admin/languages?error=bulk_language_required')
  if (!variableIds.length) redirect('/admin/languages?error=bulk_selection_required')

  const { error } = await admin
    .from('i18n_values')
    .delete()
    .in('variable_id', variableIds)
    .eq('language_code', languageCode)

  if (error) redirect('/admin/languages?error=bulk_delete_failed')

  await writeI18nAudit(actor.id, 'i18n_values_bulk_deleted', {
    language_code: languageCode,
    variable_count: variableIds.length,
  })

  revalidatePath('/admin/languages')
  redirect('/admin/languages?success=values_bulk_deleted')
}

export async function bulkGenerateI18nTranslations(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const variableIds = parseSelectedVariableIds(formData.get('selected_variable_ids'))
  const languageCode = (formData.get('language_code') as string | null)?.trim().toLowerCase() ?? ''
  const translateModeRaw = (formData.get('mode') as string | null)
    ?? (formData.get('translate_mode') as string | null)
  const translateMode = (translateModeRaw ?? '').trim().toLowerCase() === 'empty' ? 'empty' : 'all'

  if (!languageCode || languageCode === 'en') redirect('/admin/languages?error=bulk_language_required')

  let effectiveVariableIds = variableIds
  if (!effectiveVariableIds.length) {
    const { data: allEnabledVariables } = await admin
      .from('i18n_variables')
      .select('id')
      .eq('is_enabled', true)
      .eq('is_deleted', false)

    effectiveVariableIds = ((allEnabledVariables ?? []) as Array<{ id: string }>).map((row) => row.id)
  }

  if (!effectiveVariableIds.length) redirect('/admin/languages?error=bulk_selection_required')

  const settings = await getSiteSettings(admin, { maskSecrets: false })
  const aiProvider = normalizeAiProvider(settings.ai_provider)
  const aiApiKey = settings.ai_api_key?.trim() ?? ''
  aiDebugLog('AI provider:', aiProvider, 'has key:', !!aiApiKey)
  if (!aiApiKey) redirect('/admin/languages?error=translation_provider_not_configured')

  const { data: variables } = await admin
    .from('i18n_variables')
    .select('id, var_key, source_text')
    .in('id', effectiveVariableIds)
    .eq('is_enabled', true)
    .eq('is_deleted', false)
    .order('var_key', { ascending: true })

  const variableRows = (variables ?? []) as Array<{ id: string; var_key: string; source_text: string }>

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
    redirect(`/admin/languages?error=${code}`)
  }

  const valueMap = new Map(drafts.drafts.map((row) => [row.key, row.value]))
  let generated = 0

  for (const variable of targetVariables) {
    const value = valueMap.get(variable.var_key)
    if (!value) continue

    const { error } = await admin.from('i18n_values').upsert({
      variable_id: variable.id,
      language_code: languageCode,
      value,
      status: 'published',
      provider: drafts.provider,
      updated_by: actor.id,
      is_enabled: true,
      is_deleted: false,
    }, { onConflict: 'variable_id,language_code' })

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

  revalidatePath('/admin/languages')
  redirect('/admin/languages?success=values_bulk_generated')
}

export async function bootstrapBuiltInI18nCatalog() {
  const { actor, admin } = await getAdminContext()
  const catalog = getBuiltInCatalog()

  const builtInLanguages = [
    { code: 'en', name: 'English', native_name: 'English', is_default: true, is_system: true, sort_order: 0 },
    { code: 'uk', name: 'Ukrainian', native_name: translations.uk.lang.uk, is_default: false, is_system: false, sort_order: 10 },
    { code: 'ru', name: 'Russian', native_name: translations.ru.lang.ru, is_default: false, is_system: false, sort_order: 20 },
  ]

  for (const language of builtInLanguages) {
    await admin.from('i18n_languages').upsert({
      ...language,
      is_enabled: true,
      is_deleted: false,
    }, { onConflict: 'code' })
  }

  let valueCount = 0
  for (const entry of catalog) {
    const { data: variable, error } = await admin
      .from('i18n_variables')
      .upsert({
        var_key: entry.key,
        namespace: entry.namespace,
        source_language_code: 'en',
        source_text: entry.sourceText,
        description: null,
        is_enabled: true,
        is_deleted: false,
      }, { onConflict: 'var_key' })
      .select('id')
      .single()

    if (error || !variable) continue

    for (const [languageCode, value] of Object.entries(entry.translations)) {
      if (languageCode === 'en' || !value) continue
      const { error: valueError } = await admin.from('i18n_values').upsert({
        variable_id: variable.id,
        language_code: languageCode,
        value,
        status: 'published',
        provider: 'builtin',
        updated_by: actor.id,
        is_enabled: true,
        is_deleted: false,
      }, { onConflict: 'variable_id,language_code' })

      if (!valueError) valueCount += 1
    }
  }

  await writeI18nAudit(actor.id, 'i18n_catalog_bootstrapped', {
    variables: catalog.length,
    values: valueCount,
  })

  revalidatePath('/admin/languages')
  redirect('/admin/languages?success=catalog_synced')
}

export async function generateI18nDraftTranslations(formData: FormData) {
  const { actor, admin } = await getAdminContext()
  const languageCode = (formData.get('language_code') as string | null)?.trim().toLowerCase() ?? ''
  if (!languageCode) redirect('/admin/languages?error=language_required')
  if (languageCode === 'en') redirect('/admin/languages?error=language_default_locked')

  const { data: variables } = await admin
    .from('i18n_variables')
    .select('id, var_key, source_text')
    .eq('is_enabled', true)
    .eq('is_deleted', false)
    .order('var_key', { ascending: true })

  const requests = (variables ?? []).map((row) => ({ key: row.var_key, sourceText: row.source_text }))

  let drafts
  try {
    drafts = await generateTranslationDrafts(requests, languageCode)
  } catch (error) {
    const code = error instanceof Error ? error.message : 'translation_provider_failed'
    redirect(`/admin/languages?error=${code}`)
  }

  const valueMap = new Map(drafts.drafts.map((row) => [row.key, row.value]))
  let generated = 0
  for (const variable of (variables ?? []) as Array<{ id: string; var_key: string }>) {
    const value = valueMap.get(variable.var_key)
    if (!value) continue
    const { error } = await admin.from('i18n_values').upsert({
      variable_id: variable.id,
      language_code: languageCode,
      value,
      status: 'needs_review',
      provider: drafts.provider,
      updated_by: actor.id,
      is_enabled: true,
      is_deleted: false,
    }, { onConflict: 'variable_id,language_code' })

    if (!error) generated += 1
  }

  await writeI18nAudit(actor.id, 'i18n_drafts_generated', {
    language_code: languageCode,
    generated,
    provider: drafts.provider,
  })

  revalidatePath('/admin/languages')
  redirect('/admin/languages?success=draft_generated')
}
