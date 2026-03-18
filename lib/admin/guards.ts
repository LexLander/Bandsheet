import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchProfileById } from '@/lib/db/profiles'

export type AdminActor = {
  id: string
  name: string | null
  platform_role: 'admin' | 'user'
  is_root_admin: boolean
  is_blocked: boolean
  is_blacklisted: boolean
}

export async function requireAdminActor(): Promise<AdminActor> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: actor, error } = await fetchProfileById(supabase, user.id)

  if (error || !actor || actor.platform_role !== 'admin' || actor.is_blocked || actor.is_blacklisted) {
    redirect('/dashboard')
  }

  return actor as AdminActor
}

export async function requireRootAdminActor(): Promise<AdminActor> {
  const actor = await requireAdminActor()
  if (!actor.is_root_admin) {
    const supabase = await createClient()
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_root_admin', true)

    if ((count ?? 0) === 0) {
      const { error } = await supabase
        .from('profiles')
        .update({ is_root_admin: true, platform_role: 'admin' })
        .eq('id', actor.id)

      if (!error) {
        return { ...actor, is_root_admin: true }
      }
    }

    redirect('/admin')
  }
  return actor
}
