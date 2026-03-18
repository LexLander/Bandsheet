import type { SupabaseClient } from '@supabase/supabase-js'

export type I18nLanguageRow = {
  code: string
  name: string
  native_name: string | null
  is_enabled: boolean
  is_default: boolean
  is_system: boolean
  is_deleted: boolean
  sort_order: number
  updated_at: string
}

export type I18nVariableRow = {
  id: string
  var_key: string
  namespace: string
  description: string | null
  source_language_code: string
  source_text: string
  is_enabled: boolean
  is_deleted: boolean
  updated_at: string
}

export type I18nValueRow = {
  id: string
  variable_id: string
  language_code: string
  value: string
  status: 'draft' | 'published' | 'needs_review'
  provider: string | null
  updated_by: string | null
  is_enabled: boolean
  is_deleted: boolean
  updated_at: string
}

export type I18nLanguageCoverageRow = {
  language_code: string
  published_count: number
}

export type I18nAuditRow = {
  id: string
  action: string
  details: unknown
  created_at: string
}

export async function getI18nLanguages(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('i18n_languages')
    .select('code, name, native_name, is_enabled, is_default, is_system, is_deleted, sort_order, updated_at')
    .eq('is_deleted', false)
    .order('is_default', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('code', { ascending: true })

  return (data ?? []) as I18nLanguageRow[]
}

export async function getI18nVariables(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('i18n_variables')
    .select('id, var_key, namespace, description, source_language_code, source_text, is_enabled, is_deleted, updated_at')
    .eq('is_deleted', false)
    .order('var_key', { ascending: true })

  return (data ?? []) as I18nVariableRow[]
}

export async function getI18nValues(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('i18n_values')
    .select('id, variable_id, language_code, value, status, provider, updated_by, is_enabled, is_deleted, updated_at')
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })

  return (data ?? []) as I18nValueRow[]
}

export async function getI18nLanguageCoverage(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('i18n_values')
    .select('language_code')
    .eq('is_deleted', false)
    .eq('is_enabled', true)
    .eq('status', 'published')

  const counts = new Map<string, number>()
  for (const row of (data ?? []) as Array<{ language_code: string }>) {
    counts.set(row.language_code, (counts.get(row.language_code) ?? 0) + 1)
  }

  return Array.from(counts.entries()).map(([language_code, published_count]) => ({
    language_code,
    published_count,
  })) as I18nLanguageCoverageRow[]
}

export async function getI18nAuditLogs(supabase: SupabaseClient, limit = 20) {
  const { data } = await supabase
    .from('admin_audit_logs')
    .select('id, action, details, created_at')
    .ilike('action', 'i18n_%')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as I18nAuditRow[]
}

export async function getI18nAdminSnapshot(supabase: SupabaseClient) {
  const [languages, variables, values, coverage] = await Promise.all([
    getI18nLanguages(supabase),
    getI18nVariables(supabase),
    getI18nValues(supabase),
    getI18nLanguageCoverage(supabase),
  ])

  return {
    languages,
    variables,
    values,
    coverage,
  }
}
