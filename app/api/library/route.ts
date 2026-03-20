import { NextResponse } from 'next/server'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { addToLibrary, isSongInLibrary } from '@/lib/db/library'

type AddToLibraryPayload = {
  song_id?: string
  song_source?: 'public' | 'private'
}

export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as AddToLibraryPayload | null
  const songId = body?.song_id?.trim()
  const songSource = body?.song_source === 'private' ? 'private' : 'public'

  if (!songId) {
    return NextResponse.json({ error: 'song_id_required' }, { status: 400 })
  }

  const supabase = await createClient()
  const already = await isSongInLibrary(supabase, user.id, songId)
  if (already) {
    return NextResponse.json({ ok: true, already: true })
  }

  const item = await addToLibrary(supabase, user.id, songId, songSource)
  return NextResponse.json({ ok: true, item })
}