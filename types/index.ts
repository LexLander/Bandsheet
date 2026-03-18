// ============================================================
// Все TypeScript типы проекта BandSheet
// ============================================================

// --- Роли пользователей ---

export type PlatformRole = 'admin' | 'user'

export type GroupRole = 'leader' | 'deputy' | 'switcher' | 'member'

// --- Профиль пользователя ---

export interface Profile {
  id: string
  name: string | null
  email?: string | null
  avatar_url: string | null
  platform_role?: PlatformRole
  is_root_admin?: boolean
  is_blocked?: boolean
  is_blacklisted?: boolean
  created_at: string
  settings?: UserSettings | null
}

export interface UserSettings {
  /** Тема оформления */
  theme?: 'system' | 'light' | 'dark'
  /** Компактный режим отображения */
  compact?: boolean
  /** Показывать временные метки */
  showTimestamps?: boolean
  /** Локаль интерфейса (напр. 'uk', 'en', 'ru') */
  locale?: string
}

// --- Группы ---

export interface Group {
  id: string
  name: string
  leader_id: string
  avatar_url: string | null
  created_at: string
}

export interface GroupMember {
  group_id: string
  user_id: string
  role: GroupRole
  joined_at: string
  profiles?: Profile
}

// --- Песни ---

export type SongSource = 'public' | 'private'

export type AccessType = 'free' | 'subscription'

export interface SongPublic {
  id: string
  title: string
  artist: string | null
  text_chords: string | null  // ChordPro формат
  key: string | null
  bpm: number | null
  time_signature: string | null
  language: string | null
  genre: string | null
  access_type: AccessType
  created_by: string | null
  created_at: string
}

export interface SongPrivate {
  id: string
  group_id: string
  title: string
  artist: string | null
  text_chords: string | null
  key: string | null
  bpm: number | null
  time_signature: string | null
  created_by: string | null
  created_at: string
}

// --- Библиотека лидера ---

export interface LibraryItem {
  id: string
  user_id: string
  song_id: string
  song_source: SongSource
  custom_key: string | null
  custom_bpm: number | null
  custom_time_signature: string | null
  notes: string | null
  created_at: string
  // Join данные
  song?: SongPublic | SongPrivate
}

// --- События ---

export type EventStatus = 'draft' | 'active' | 'archived'

export interface Event {
  id: string
  group_id: string
  name: string
  date: string | null
  venue: string | null
  status: EventStatus
  created_by: string
  created_at: string
  // Join данные
  groups?: { name: string }
}

// --- Сетлист ---

export interface Setlist {
  id: string
  event_id: string
  current_song_index: number
  is_live: boolean
  updated_at: string
}

export interface SetlistItem {
  id: string
  setlist_id: string
  position: number
  song_id: string
  song_source: SongSource
  transposed_key: string | null
  notes: string | null
  // Join данные
  song?: SongPublic | SongPrivate
}

// --- Приглашения ---

export type InvitationStatus = 'pending' | 'accepted' | 'expired'

export interface Invitation {
  id: string
  group_id: string
  email: string
  token: string
  role: Exclude<GroupRole, 'leader'>
  status: InvitationStatus
  expires_at: string | null
  created_at: string
}

// --- Real-time payload типы ---

export type TriggeredByRole = 'leader' | 'deputy' | 'switcher'

export interface SongChangedPayload {
  song_index: number
  transposed_key: string
  triggered_by_role: TriggeredByRole
}

export interface KeyChangedPayload {
  song_index: number
  key: string
  triggered_by_role: TriggeredByRole
}
