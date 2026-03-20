import { NextResponse } from 'next/server'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { removeFromLibrary } from '@/lib/db/library'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const itemId = id?.trim()
  if (!itemId) {
    return NextResponse.json({ error: 'id_required' }, { status: 400 })
  }

  const supabase = await createClient()
  await removeFromLibrary(supabase, itemId, user.id)
  return NextResponse.json({ ok: true })
}