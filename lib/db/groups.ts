import type { SupabaseClient } from '@supabase/supabase-js'

export type GroupPreview = { id: string; name: string; avatar_url?: string | null; is_deleted?: boolean }
type GroupMemberJoinRow = { groups: GroupPreview | GroupPreview[] | null; role?: string }

export type UpcomingEvent = {
  id: string
  name: string
  date: string | null
  status: string
}

// Получение групп пользователя через membership-таблицу.
// Вынесено отдельно, чтобы страницы не дублировали один и тот же map/filter-код.
export async function fetchUserGroupsByMembership(
  supabase: SupabaseClient,
  userId: string,
  options?: { limit?: number; includeDeleted?: boolean }
): Promise<Array<{ id: string; name: string; avatar_url?: string | null; is_deleted?: boolean; role?: string }>> {
  let query = supabase
    .from('group_members')
    .select('role, groups(id, name, avatar_url, is_deleted)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data } = options?.includeDeleted
    ? await query
    : await query.eq('groups.is_deleted', false)

  return ((data ?? []) as GroupMemberJoinRow[])
    .map((row) => {
      const g = Array.isArray(row.groups) ? row.groups[0] : row.groups
      if (!g) return null
      return {
        id: g.id,
        name: g.name,
        avatar_url: g.avatar_url,
        is_deleted: g.is_deleted,
        role: row.role,
      }
    })
    .filter(Boolean) as Array<{ id: string; name: string; avatar_url?: string | null; is_deleted?: boolean; role?: string }>
}

export async function fetchUpcomingEventsForGroups(
  supabase: SupabaseClient,
  groupIds: string[],
  limit = 3
): Promise<UpcomingEvent[]> {
  if (!groupIds.length) return []

  const { data } = await supabase
    .from('events')
    .select('id, name, date, status')
    .in('group_id', groupIds)
    .eq('status', 'active')
    .order('date', { ascending: true })
    .limit(limit)

  return (data ?? []) as UpcomingEvent[]
}
