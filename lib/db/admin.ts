import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProfileRecord } from '@/lib/db/profiles'

type GroupRef = { id: string; name: string; created_at: string; leader_id: string }
type GroupMemberRow = {
  group_id: string
  role: string
  joined_at: string
  groups: GroupRef | GroupRef[] | null
}
type ProfileRef = { id: string; name: string | null; email: string | null; avatar_url: string | null }
type GroupMemberWithProfileRow = {
  group_id: string
  role: string
  profiles: ProfileRef | ProfileRef[] | null
}

export type AdminUserGroupCardMember = {
  id: string
  name: string | null
  email: string | null
  role: string
  avatar_url: string | null
}

export type AdminUserGroupRelation = {
  id: string
  name: string
  created_at: string
  leader_id: string
  member_role?: string
}

export async function listProfilesForAdmin(supabase: SupabaseClient): Promise<ProfileRecord[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, name, email, platform_role, is_root_admin, is_blocked, is_blacklisted, created_at')
    .order('created_at', { ascending: false })

  return (data ?? []) as ProfileRecord[]
}

export async function fetchProfileDetailsForAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileRecord | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, name, email, platform_role, is_root_admin, is_blocked, is_blacklisted, blocked_reason, blacklisted_reason, created_at')
    .eq('id', userId)
    .single()

  return (data as ProfileRecord | null) ?? null
}

export async function fetchAdminUserGroupRelations(supabase: SupabaseClient, userId: string): Promise<{
  createdGroups: AdminUserGroupRelation[]
  memberGroups: AdminUserGroupRelation[]
  membersByGroup: Map<string, AdminUserGroupCardMember[]>
}> {
  const [{ data: createdGroups }, { data: memberGroupsRaw }] = await Promise.all([
    supabase
      .from('groups')
      .select('id, name, created_at, leader_id')
      .eq('leader_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('group_members')
      .select('group_id, role, joined_at, groups(id, name, created_at, leader_id)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false }),
  ])

  const memberGroups = ((memberGroupsRaw ?? []) as GroupMemberRow[])
    .map((row) => {
      const g = Array.isArray(row.groups) ? row.groups[0] : row.groups
      if (!g) return null
      return {
        id: g.id,
        name: g.name,
        created_at: g.created_at,
        leader_id: g.leader_id,
        member_role: row.role,
      }
    })
    .filter(Boolean) as AdminUserGroupRelation[]

  const normalizedCreated = (createdGroups ?? []) as AdminUserGroupRelation[]
  const allGroupIds = Array.from(new Set([...normalizedCreated.map((g) => g.id), ...memberGroups.map((g) => g.id)]))

  const { data: allMembersRows } = allGroupIds.length
    ? await supabase
      .from('group_members')
      .select('group_id, role, profiles(id, name, email, avatar_url)')
      .in('group_id', allGroupIds)
      .order('joined_at', { ascending: true })
    : { data: [] as GroupMemberWithProfileRow[] }

  const membersByGroup = new Map<string, AdminUserGroupCardMember[]>()
  for (const row of (allMembersRows ?? []) as GroupMemberWithProfileRow[]) {
    if (!row.profiles) continue
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    if (!p) continue
    const list = membersByGroup.get(row.group_id) ?? []
    list.push({
      id: p.id,
      name: p.name,
      email: p.email,
      role: row.role,
      avatar_url: p.avatar_url,
    })
    membersByGroup.set(row.group_id, list)
  }

  return {
    createdGroups: normalizedCreated,
    memberGroups,
    membersByGroup,
  }
}
