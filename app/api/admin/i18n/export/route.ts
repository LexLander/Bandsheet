import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getI18nAdminSnapshot } from '@/lib/db/i18n-admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('platform_role, is_blocked, is_blacklisted')
    .eq('id', user.id)
    .single()

  if (!profile || profile.platform_role !== 'admin' || profile.is_blocked || profile.is_blacklisted) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { languages, variables, values } = await getI18nAdminSnapshot(admin)

  const payload = {
    exported_at: new Date().toISOString(),
    format_version: 1,
    languages: languages.map((lang) => ({
      code: lang.code,
      name: lang.name,
      native_name: lang.native_name,
      enabled: lang.is_enabled,
      default: lang.is_default,
    })),
    variables: variables.map((variable) => {
      const translations = values
        .filter((row) => row.variable_id === variable.id)
        .reduce<Record<string, { value: string; enabled: boolean; status: string; provider: string | null }>>((acc, row) => {
          acc[row.language_code] = {
            value: row.value,
            enabled: row.is_enabled,
            status: row.status,
            provider: row.provider,
          }
          return acc
        }, {})

      return {
        key: variable.var_key,
        namespace: variable.namespace,
        description: variable.description,
        sourceText: variable.source_text,
        enabled: variable.is_enabled,
        translations,
      }
    }),
  }

  return NextResponse.json(payload, {
    headers: {
      'Content-Disposition': 'attachment; filename="i18n-export.json"',
    },
  })
}
