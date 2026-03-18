import { NextResponse } from 'next/server'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchProfileById } from '@/lib/db/profiles'
import { ALLOWED_SETTINGS_KEYS, getSiteSettings } from '@/lib/db/settings'

export async function GET() {
  const settings = await getSiteSettings()
  return NextResponse.json(settings)
}

export async function PUT(request: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data: profile } = await fetchProfileById(supabase, user.id)

  if (!profile || profile.platform_role !== 'admin' || profile.is_blocked || profile.is_blacklisted) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const rows = Object.entries(body)
    .filter(([key]) => ALLOWED_SETTINGS_KEYS.includes(key as (typeof ALLOWED_SETTINGS_KEYS)[number]))
    .map(([id, value]) => {
      if (typeof value === 'boolean') return { id, value: value ? 'true' : 'false' }
      if (typeof value === 'number') return { id, value: String(value) }
      if (typeof value === 'string') return { id, value: value.trim() }
      return null
    })
    .filter((row): row is { id: string; value: string } => row !== null)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('site_settings')
    .upsert(rows, { onConflict: 'id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const settings = await getSiteSettings(admin)
  return NextResponse.json(settings)
}
