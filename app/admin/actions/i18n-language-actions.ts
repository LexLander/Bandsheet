'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAdminContext, normalizeFlag, writeI18nAudit } from './_helpers'
import { ADMIN_LANGUAGES_PATH } from './i18n-shared'

export async function createI18nLanguage(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const code = (formData.get('code') as string | null)?.trim().toLowerCase() ?? ''
  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const nativeName = (formData.get('native_name') as string | null)?.trim() ?? name

  if (!code || !name) redirect(`${ADMIN_LANGUAGES_PATH}?error=language_required`)

  const { error } = await admin.from('i18n_languages').upsert(
    {
      code,
      name,
      native_name: nativeName,
      is_enabled: true,
      is_default: code === 'en',
      is_system: code === 'en',
      is_deleted: false,
    },
    { onConflict: 'code' }
  )

  if (error) redirect(`${ADMIN_LANGUAGES_PATH}?error=language_create_failed`)

  await writeI18nAudit(actor.id, 'i18n_language_saved', { code, name, native_name: nativeName })
  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=language_saved`)
}

export async function setI18nLanguageEnabled(formData: FormData) {
  const { actor, admin } = await getAdminContext()
  const refreshKey = Date.now()

  const code = (formData.get('code') as string | null)?.trim().toLowerCase() ?? ''
  const enabled = normalizeFlag(formData.get('enabled'))

  if (!code) redirect(`${ADMIN_LANGUAGES_PATH}?error=language_required&r=${refreshKey}`)
  if (code === 'en' && !enabled) {
    redirect(`${ADMIN_LANGUAGES_PATH}?error=language_default_locked&r=${refreshKey}`)
  }

  const { error } = await admin
    .from('i18n_languages')
    .update({ is_enabled: enabled })
    .eq('code', code)
  if (error) redirect(`${ADMIN_LANGUAGES_PATH}?error=language_toggle_failed&r=${refreshKey}`)

  await writeI18nAudit(actor.id, 'i18n_language_toggled', { code, enabled })
  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=language_toggled&r=${refreshKey}`)
}

export async function deleteI18nLanguage(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const code = (formData.get('code') as string | null)?.trim().toLowerCase() ?? ''
  if (!code) redirect(`${ADMIN_LANGUAGES_PATH}?error=language_required`)
  if (code === 'en') redirect(`${ADMIN_LANGUAGES_PATH}?error=language_default_locked`)

  const { error } = await admin.from('i18n_languages').delete().eq('code', code)
  if (error) redirect(`${ADMIN_LANGUAGES_PATH}?error=language_delete_failed`)

  await writeI18nAudit(actor.id, 'i18n_language_deleted', { code })
  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=language_deleted`)
}
