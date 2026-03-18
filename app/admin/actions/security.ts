'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAdminActor } from '@/lib/admin/guards'
import { makeDeviceHashFromHeaders } from './_helpers'

export async function verifyAdminDevice(formData: FormData) {
  const actor = await requireAdminActor()
  const code = (formData.get('code') as string | null)?.trim() ?? ''
  const expectedCode = process.env.ADMIN_2FA_CODE

  if (!expectedCode) {
    redirect('/admin/verify-device?error=config')
  }

  if (code !== expectedCode) {
    redirect('/admin/verify-device?error=invalid_code')
  }

  const h = await headers()
  const deviceHash = makeDeviceHashFromHeaders(h)
  const deviceLabel = `${h.get('user-agent') ?? 'unknown device'}`.slice(0, 160)

  const supabase = await createClient()
  const { error } = await supabase
    .from('admin_device_registry')
    .upsert(
      {
        admin_id: actor.id,
        device_hash: deviceHash,
        device_label: deviceLabel,
        is_trusted: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'admin_id,device_hash' },
    )

  if (error) {
    redirect('/admin/verify-device?error=device_save_failed')
  }

  revalidatePath('/admin')
  redirect('/admin')
}
