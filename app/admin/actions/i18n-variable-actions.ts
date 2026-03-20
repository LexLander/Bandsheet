'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAdminContext, normalizeFlag, writeI18nAudit } from './_helpers'
import { ADMIN_LANGUAGES_PATH, deriveNamespace } from './i18n-shared'

export async function createI18nVariable(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const varKey = (formData.get('var_key') as string | null)?.trim().toLowerCase() ?? ''
  const namespace =
    (formData.get('namespace') as string | null)?.trim().toLowerCase() || deriveNamespace(varKey)
  const description = (formData.get('description') as string | null)?.trim() ?? null
  const sourceText = (formData.get('source_text') as string | null)?.trim() ?? ''

  if (!varKey) redirect(`${ADMIN_LANGUAGES_PATH}?error=variable_required`)
  if (!sourceText) redirect(`${ADMIN_LANGUAGES_PATH}?error=variable_source_required`)

  const { error } = await admin.from('i18n_variables').upsert(
    {
      var_key: varKey,
      namespace,
      description,
      source_language_code: 'en',
      source_text: sourceText,
      is_enabled: true,
      is_deleted: false,
    },
    { onConflict: 'var_key' }
  )

  if (error) redirect(`${ADMIN_LANGUAGES_PATH}?error=variable_create_failed`)

  await writeI18nAudit(actor.id, 'i18n_variable_saved', { var_key: varKey, namespace })
  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=variable_saved`)
}

export async function updateI18nVariableMeta(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const variableId = (formData.get('variable_id') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() ?? null
  const sourceText = (formData.get('source_text') as string | null)?.trim() ?? ''

  if (!variableId) redirect(`${ADMIN_LANGUAGES_PATH}?error=variable_required`)
  if (!sourceText) redirect(`${ADMIN_LANGUAGES_PATH}?error=variable_source_required`)

  const { error } = await admin
    .from('i18n_variables')
    .update({ description, source_text: sourceText })
    .eq('id', variableId)

  if (error) redirect(`${ADMIN_LANGUAGES_PATH}?error=variable_update_failed`)

  await writeI18nAudit(actor.id, 'i18n_variable_updated', { variable_id: variableId })
  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=variable_updated`)
}

export async function setI18nVariableEnabled(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const variableId = (formData.get('variable_id') as string | null)?.trim() ?? ''
  const enabled = normalizeFlag(formData.get('enabled'))
  if (!variableId) redirect(`${ADMIN_LANGUAGES_PATH}?error=variable_required`)

  const { error } = await admin
    .from('i18n_variables')
    .update({ is_enabled: enabled })
    .eq('id', variableId)
  if (error) redirect(`${ADMIN_LANGUAGES_PATH}?error=variable_toggle_failed`)

  await writeI18nAudit(actor.id, 'i18n_variable_toggled', { variable_id: variableId, enabled })
  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=variable_toggled`)
}

export async function deleteI18nVariable(formData: FormData) {
  const { actor, admin } = await getAdminContext()

  const variableId = (formData.get('variable_id') as string | null)?.trim() ?? ''
  if (!variableId) redirect(`${ADMIN_LANGUAGES_PATH}?error=variable_required`)

  const { error } = await admin.from('i18n_variables').delete().eq('id', variableId)
  if (error) redirect(`${ADMIN_LANGUAGES_PATH}?error=variable_delete_failed`)

  await writeI18nAudit(actor.id, 'i18n_variable_deleted', { variable_id: variableId })
  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=variable_deleted`)
}
