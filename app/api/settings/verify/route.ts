import { NextResponse } from 'next/server'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { fetchProfileById } from '@/lib/db/profiles'

type VerifyPayload = {
  provider?: string
  apiKey?: string
}

async function getAdminAccess() {
  const user = await getAuthUser()
  if (!user) return { ok: false as const, status: 401 }

  const supabase = await createClient()
  const { data: profile } = await fetchProfileById(supabase, user.id)

  if (!profile || profile.platform_role !== 'admin' || profile.is_blocked || profile.is_blacklisted) {
    return { ok: false as const, status: 403 }
  }

  return { ok: true as const }
}

async function verifyAnthropic(apiKey: string) {
  const response = await fetch('https://api.anthropic.com/v1/models', {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    cache: 'no-store',
  })

  return response.ok
}

async function verifyOpenAI(apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/models', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    cache: 'no-store',
  })

  return response.ok
}

export async function POST(request: Request) {
  const access = await getAdminAccess()
  if (!access.ok) {
    return NextResponse.json({ error: access.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: access.status })
  }

  let payload: VerifyPayload
  try {
    payload = (await request.json()) as VerifyPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const provider = (payload.provider ?? '').trim().toLowerCase()
  const apiKey = (payload.apiKey ?? '').trim()

  if (!apiKey) {
    return NextResponse.json({ valid: false, error: 'API key is required' }, { status: 400 })
  }

  if (provider !== 'anthropic' && provider !== 'openai') {
    return NextResponse.json({ valid: false, error: 'Unsupported provider' }, { status: 400 })
  }

  try {
    const valid = provider === 'anthropic'
      ? await verifyAnthropic(apiKey)
      : await verifyOpenAI(apiKey)

    return NextResponse.json({ valid })
  } catch {
    return NextResponse.json({ valid: false })
  }
}
