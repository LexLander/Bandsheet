import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getRuntimeI18nPayload } from '@/lib/db/i18n-runtime'
import { applyTranslationOverrides } from './runtime'
import { defaultLocale, normalizeLocale, type Locale } from './translations'

export async function getServerLocale(): Promise<Locale> {
  const jar = await cookies()
  const saved = jar.get('app-locale')?.value
  return normalizeLocale(saved)
}

export async function getServerT() {
  const locale = await getServerLocale()
  try {
    const supabase = await createClient()
    const { overrides } = await getRuntimeI18nPayload(supabase, locale)
    return { t: applyTranslationOverrides(locale, overrides), locale }
  } catch {
    return { t: applyTranslationOverrides(defaultLocale, []), locale }
  }
}
