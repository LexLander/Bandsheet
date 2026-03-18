import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const ALLOWED_SETTINGS_KEYS = [
  'app_name',
  'app_slogan',
  'contact_email',
  'privacy_url',
  'terms_url',
  'allow_registration',
  'maintenance_enabled',
  'maintenance_title',
  'maintenance_message',
  'maintenance_eta',
  'ai_provider',
  'ai_api_key',
] as const

export type SiteSettings = {
  [K in (typeof ALLOWED_SETTINGS_KEYS)[number]]: string
}

type SiteSettingRow = {
  id: string
  value: string
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  app_name: 'BandSheet',
  app_slogan: 'OPEN. PLAY. SHINE.',
  contact_email: 'support@bandsheet.app',
  privacy_url: '',
  terms_url: '',
  allow_registration: 'true',
  maintenance_enabled: 'false',
  maintenance_title: "We'll be back soon",
  maintenance_message: "We're updating the site and making improvements. Be right back.",
  maintenance_eta: '',
  ai_provider: 'anthropic',
  ai_api_key: '',
}

type GetSiteSettingsOptions = {
  maskSecrets?: boolean
}

function maskSecret(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.length <= 4) return '****'
  return `••••••••${trimmed.slice(-4)}`
}

function rowsToSettings(rows: SiteSettingRow[], options?: GetSiteSettingsOptions): SiteSettings {
  const shouldMaskSecrets = options?.maskSecrets ?? true
  const map = rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.id] = row.value
    return acc
  }, {})

  return {
    app_name: map.app_name?.trim() || DEFAULT_SITE_SETTINGS.app_name,
    app_slogan: map.app_slogan?.trim() || DEFAULT_SITE_SETTINGS.app_slogan,
    contact_email: map.contact_email?.trim() || DEFAULT_SITE_SETTINGS.contact_email,
    privacy_url: map.privacy_url?.trim() || DEFAULT_SITE_SETTINGS.privacy_url,
    terms_url: map.terms_url?.trim() || DEFAULT_SITE_SETTINGS.terms_url,
    allow_registration: map.allow_registration?.trim() || DEFAULT_SITE_SETTINGS.allow_registration,
    maintenance_enabled: map.maintenance_enabled?.trim() || DEFAULT_SITE_SETTINGS.maintenance_enabled,
    maintenance_title: map.maintenance_title?.trim() || DEFAULT_SITE_SETTINGS.maintenance_title,
    maintenance_message: map.maintenance_message?.trim() || DEFAULT_SITE_SETTINGS.maintenance_message,
    maintenance_eta: map.maintenance_eta?.trim() || DEFAULT_SITE_SETTINGS.maintenance_eta,
    ai_provider: map.ai_provider?.trim() || DEFAULT_SITE_SETTINGS.ai_provider,
    ai_api_key: shouldMaskSecrets
      ? maskSecret(map.ai_api_key ?? '')
      : (map.ai_api_key?.trim() || DEFAULT_SITE_SETTINGS.ai_api_key),
  }
}

export async function getSiteSettings(
  supabase?: SupabaseClient,
  options?: GetSiteSettingsOptions
): Promise<SiteSettings> {
  try {
    const client = supabase ?? await createClient()
    const { data, error } = await client
      .from('site_settings')
      .select('id, value')
      .in('id', ALLOWED_SETTINGS_KEYS)

    if (error) {
      return {
        ...DEFAULT_SITE_SETTINGS,
        ai_api_key: options?.maskSecrets === false ? DEFAULT_SITE_SETTINGS.ai_api_key : '',
      }
    }

    return rowsToSettings((data ?? []) as SiteSettingRow[], options)
  } catch {
    return {
      ...DEFAULT_SITE_SETTINGS,
      ai_api_key: options?.maskSecrets === false ? DEFAULT_SITE_SETTINGS.ai_api_key : '',
    }
  }
}
