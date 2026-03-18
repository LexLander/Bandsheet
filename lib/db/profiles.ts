import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserSettings } from '@/types'

export type ProfileRecord = {
  id: string
  name?: string | null
  email?: string | null
  bio?: string | null
  avatar_url?: string | null
  platform_role?: 'admin' | 'user'
  is_root_admin?: boolean
  is_blocked?: boolean
  is_blacklisted?: boolean
  blocked_reason?: string | null
  blacklisted_reason?: string | null
  created_at?: string
  settings?: UserSettings | null
}

type DbResult<T> = {
  data: T | null
  error: { message: string } | null
}

// Универсальная функция для получения профиля по id.
// Принимает существующий supabase-клиент (серверный или админский).
export async function fetchProfileById(
  supabase: SupabaseClient,
  id: string
): Promise<DbResult<ProfileRecord>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, bio, avatar_url, platform_role, is_root_admin, is_blocked, is_blacklisted, blocked_reason, blacklisted_reason, created_at, settings')
    .eq('id', id)
    .single()

  return { data: data as ProfileRecord | null, error }
}

// Читаем текущие настройки и добавляем поверх новые поля.
// Такой merge снижает риск случайно затереть другие ключи.
export async function mergeProfileSettings(
  supabase: SupabaseClient,
  id: string,
  settingsPatch: Partial<UserSettings>
): Promise<DbResult<UserSettings>> {
  const { data: current } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', id)
    .single()

  const merged = { ...(current?.settings ?? {}), ...settingsPatch } as UserSettings

  return { data: merged, error: null }
}

// Обновление bio/settings в единой функции.
export async function updateProfileBioAndSettings(
  supabase: SupabaseClient,
  id: string,
  input: { bio?: string | null; settingsPatch?: Partial<UserSettings> }
): Promise<DbResult<ProfileRecord>> {
  const payload: { bio?: string | null; settings?: UserSettings } = {}

  if (typeof input.bio !== 'undefined') {
    payload.bio = input.bio
  }

  if (input.settingsPatch) {
    const { data: mergedSettings } = await mergeProfileSettings(supabase, id, input.settingsPatch)
    payload.settings = mergedSettings ?? {}
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .select('id, name, email, bio, avatar_url, platform_role, is_root_admin, is_blocked, is_blacklisted, blocked_reason, blacklisted_reason, created_at, settings')
    .single()

  return { data: data as ProfileRecord | null, error }
}
