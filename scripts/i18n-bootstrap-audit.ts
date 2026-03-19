import { createAdminClient } from '../lib/supabase/admin'
import { getBuiltInCatalog } from '../lib/i18n/catalog'
import path from 'node:path'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(path.resolve(process.cwd()))

type ValueStatus = 'draft' | 'published' | 'needs_review'

type DbVariable = {
  id: string
  var_key: string
  source_text: string | null
}

type DbValue = {
  variable_id: string
  language_code: 'ru' | 'uk'
  value: string
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function hasUsableSupabaseAuditEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? ''

  if (!url || !serviceRoleKey) return false
  if (url === 'https://test.supabase.co') return false
  if (serviceRoleKey === 'test-service-role-key') return false

  return true
}

async function main() {
  if (!hasUsableSupabaseAuditEnv()) {
    console.log(
      JSON.stringify(
        {
          skipped: true,
          reason: 'supabase_audit_env_not_configured',
        },
        null,
        2
      )
    )
    return
  }

  const admin = createAdminClient()
  const catalog = getBuiltInCatalog()
  const now = new Date().toISOString()
  const keyFormat = /^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)+$/

  const languageRows = [
    { code: 'en', name: 'English', native_name: 'English', is_enabled: true, is_default: true, is_system: true, sort_order: 0, is_deleted: false },
    { code: 'uk', name: 'Ukrainian', native_name: 'Українська', is_enabled: true, is_default: false, is_system: false, sort_order: 10, is_deleted: false },
    { code: 'ru', name: 'Russian', native_name: 'Русский', is_enabled: true, is_default: false, is_system: false, sort_order: 20, is_deleted: false },
  ]

  const { error: langError } = await admin.from('i18n_languages').upsert(languageRows, { onConflict: 'code' })
  if (langError) throw new Error(`LANG_UPSERT_ERROR: ${langError.message}`)

  const invalidByConstraint = catalog
    .map((entry) => entry.key)
    .filter((key) => !keyFormat.test(key))
    .sort()

  const validCatalog = catalog.filter((entry) => keyFormat.test(entry.key))

  const variableRows = validCatalog.map((entry) => ({
    var_key: entry.key,
    namespace: entry.namespace,
    description: null,
    source_language_code: 'en',
    source_text: entry.sourceText,
    is_enabled: true,
    is_deleted: false,
    updated_at: now,
  }))

  for (const part of chunk(variableRows, 200)) {
    const { error } = await admin.from('i18n_variables').upsert(part, { onConflict: 'var_key' })
    if (error) throw new Error(`VAR_UPSERT_ERROR: ${error.message}`)
  }

  const allKeys = validCatalog.map((x) => x.key)
  const keyToId = new Map<string, string>()

  for (const keysPart of chunk(allKeys, 200)) {
    const { data, error } = await admin.from('i18n_variables').select('id,var_key').in('var_key', keysPart)
    if (error) throw new Error(`VAR_FETCH_ERROR: ${error.message}`)

    for (const row of (data ?? []) as Array<{ id: string; var_key: string }>) {
      keyToId.set(row.var_key, row.id)
    }
  }

  const valueRows: Array<{
    variable_id: string
    language_code: 'ru' | 'uk'
    value: string
    status: ValueStatus
    provider: string
    updated_by: null
    is_enabled: boolean
    is_deleted: boolean
  }> = []

  for (const entry of validCatalog) {
    const variableId = keyToId.get(entry.key)
    if (!variableId) continue

    for (const lang of ['ru', 'uk'] as const) {
      const value = (entry.translations[lang] ?? '').trim()
      if (!value) continue

      valueRows.push({
        variable_id: variableId,
        language_code: lang,
        value,
        status: 'published',
        provider: 'bootstrap',
        updated_by: null,
        is_enabled: true,
        is_deleted: false,
      })
    }
  }

  for (const part of chunk(valueRows, 300)) {
    const { error } = await admin.from('i18n_values').upsert(part, { onConflict: 'variable_id,language_code' })
    if (error) throw new Error(`VALUE_UPSERT_ERROR: ${error.message}`)
  }

  const builtInKeys = validCatalog.map((x) => x.key)
  const { data: dbVariables, error: dbVarError } = await admin
    .from('i18n_variables')
    .select('id,var_key,source_text')
    .in('var_key', builtInKeys)

  if (dbVarError) throw new Error(`AUDIT_VAR_FETCH_ERROR: ${dbVarError.message}`)

  const varRows = (dbVariables ?? []) as DbVariable[]
  const dbKeySet = new Set(varRows.map((row) => row.var_key))
  const missingKeys = builtInKeys.filter((key) => !dbKeySet.has(key)).sort()

  const missingEn = varRows
    .filter((row) => !String(row.source_text ?? '').trim())
    .map((row) => row.var_key)
    .sort()

  const idToKey = new Map(varRows.map((row) => [row.id, row.var_key] as const))
  const varIds = varRows.map((row) => row.id)

  const ruByVar = new Map<string, string>()
  const ukByVar = new Map<string, string>()

  for (const idsPart of chunk(varIds, 300)) {
    const { data: values, error: valuesError } = await admin
      .from('i18n_values')
      .select('variable_id,language_code,value,status,is_enabled,is_deleted')
      .in('variable_id', idsPart)
      .in('language_code', ['ru', 'uk'])
      .eq('is_deleted', false)
      .eq('is_enabled', true)
      .in('status', ['published', 'needs_review'])

    if (valuesError) throw new Error(`AUDIT_VAL_FETCH_ERROR: ${valuesError.message}`)

    for (const row of (values ?? []) as DbValue[]) {
      const trimmed = String(row.value ?? '').trim()
      if (row.language_code === 'ru') ruByVar.set(row.variable_id, trimmed)
      if (row.language_code === 'uk') ukByVar.set(row.variable_id, trimmed)
    }
  }

  const missingRu: string[] = []
  const missingUk: string[] = []

  for (const variableId of varIds) {
    const key = idToKey.get(variableId)
    if (!key) continue
    if (!ruByVar.get(variableId)) missingRu.push(key)
    if (!ukByVar.get(variableId)) missingUk.push(key)
  }

  missingRu.sort()
  missingUk.sort()

  console.log(
    JSON.stringify(
      {
        builtInKeys: catalog.length,
        blockedByDbConstraintCount: invalidByConstraint.length,
        blockedByDbConstraintSample: invalidByConstraint.slice(0, 20),
        validForCurrentConstraint: validCatalog.length,
        dbVariablesForBuiltIn: varRows.length,
        dbValuesUpsertedRUUK: valueRows.length,
        missingKeysCount: missingKeys.length,
        missingEnCount: missingEn.length,
        missingRuCount: missingRu.length,
        missingUkCount: missingUk.length,
        sampleMissingKeys: missingKeys.slice(0, 20),
        sampleMissingEn: missingEn.slice(0, 20),
        sampleMissingRu: missingRu.slice(0, 20),
        sampleMissingUk: missingUk.slice(0, 20),
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
