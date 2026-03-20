'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAdminContext, writeI18nAudit } from './_helpers'
import { ADMIN_LANGUAGES_PATH, deriveNamespace, type I18nImportPayload } from './i18n-shared'

export async function importI18nFromJson(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const payloadRaw = (formData.get('payload') as string | null)?.trim()
  if (!payloadRaw) {
    redirect(`${ADMIN_LANGUAGES_PATH}?error=import_payload_required`)
  }

  let payload: I18nImportPayload
  try {
    payload = JSON.parse(payloadRaw) as I18nImportPayload
  } catch {
    redirect(`${ADMIN_LANGUAGES_PATH}?error=import_invalid_json`)
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

    const { error } = await admin.from('i18n_languages').upsert(
      {
        code,
        name,
        native_name: nativeName,
        is_enabled: code === 'en' ? true : (row.enabled ?? true),
        is_default: code === 'en',
        is_system: code === 'en',
        is_deleted: false,
      },
      { onConflict: 'code' }
    )

    if (!error) languageCount += 1
  }

  for (const row of importedVariables) {
    const varKey = (row.key ?? '').trim().toLowerCase()
    const sourceText =
      (row.sourceText ?? '').trim() ||
      (typeof row.translations?.en === 'string' ? row.translations.en : '')

    if (!varKey || !sourceText) continue

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
        { onConflict: 'var_key' }
      )
      .select('id')
      .single()

    if (variableError || !variable) continue
    variableCount += 1

    const translations = row.translations ?? {}
    for (const [languageCodeRaw, valueRaw] of Object.entries(translations)) {
      const languageCode = languageCodeRaw.trim().toLowerCase()
      if (!languageCode || languageCode === 'en') continue

      const normalizedValue =
        typeof valueRaw === 'string'
          ? { value: valueRaw, enabled: true, status: 'published' as const }
          : {
              value: valueRaw.value ?? '',
              enabled: valueRaw.enabled ?? true,
              status: valueRaw.status ?? 'published',
            }

      const { error } = await admin.from('i18n_values').upsert(
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
        { onConflict: 'variable_id,language_code' }
      )

      if (!error) valueCount += 1
    }
  }

  await writeI18nAudit(actor.id, 'i18n_import_json', {
    languages: languageCount,
    variables: variableCount,
    values: valueCount,
  })

  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=import_done`)
}
