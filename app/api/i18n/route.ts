import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchEnabledRuntimeLanguages, getRuntimeI18nPayload } from '@/lib/db/i18n-runtime'
import { normalizeLocale } from '@/lib/i18n/translations'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const locale = normalizeLocale(url.searchParams.get('locale'))
    const listOnly = url.searchParams.get('list') === '1'

    const supabase = await createClient()

    if (listOnly) {
      const languages = await fetchEnabledRuntimeLanguages(supabase)
      return NextResponse.json({ languages })
    }

    const payload = await getRuntimeI18nPayload(supabase, locale)
    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ languages: [], overrides: [] })
  }
}
