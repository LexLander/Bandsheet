import type { SupabaseClient } from '@supabase/supabase-js'
import type { RuntimeLanguage, RuntimeTranslationOverride } from '@/lib/i18n/runtime'

type ValueRow = {
  variable_id: string
  value: string
}

type VariableRow = {
  id: string
  var_key: string
  source_text: string
}

export async function fetchEnabledRuntimeLanguages(
  supabase: SupabaseClient
): Promise<RuntimeLanguage[]> {
  const { data } = await supabase
    .from('i18n_languages')
    .select('code, name, native_name, is_default, sort_order')
    .eq('is_enabled', true)
    .eq('is_deleted', false)
    .order('is_default', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('code', { ascending: true })

  return ((data ?? []) as Array<RuntimeLanguage & { native_name?: string | null }>).map((row) => ({
    code: row.code,
    name: row.native_name?.trim() || row.name,
  }))
}

export async function fetchRuntimeTranslationOverrides(
  supabase: SupabaseClient,
  locale: string
): Promise<RuntimeTranslationOverride[]> {
  const [{ data: variables }, { data: values }] = await Promise.all([
    supabase
      .from('i18n_variables')
      .select('id, var_key, source_text')
      .eq('is_enabled', true)
      .eq('is_deleted', false),
    locale === 'en'
      ? Promise.resolve({ data: [] as ValueRow[] | null })
      : supabase
        .from('i18n_values')
        .select('variable_id, value')
        .eq('language_code', locale)
        .in('status', ['published', 'needs_review'])
        .eq('is_enabled', true)
        .eq('is_deleted', false),
  ])

  const variableRows = (variables ?? []) as VariableRow[]
  const valueMap = new Map(((values ?? []) as ValueRow[]).map((row) => [row.variable_id, row.value]))

  return variableRows.map((row) => ({
    key: row.var_key,
    value: locale === 'en' ? row.source_text : valueMap.get(row.id) ?? row.source_text,
  }))
}

export async function getRuntimeI18nPayload(supabase: SupabaseClient, locale: string) {
  const [languages, overrides] = await Promise.all([
    fetchEnabledRuntimeLanguages(supabase),
    fetchRuntimeTranslationOverrides(supabase, locale),
  ])

  return { languages, overrides }
}
