'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAdminContext, writeI18nAudit } from './_helpers'
import { ADMIN_LANGUAGES_PATH } from './i18n-shared'
import { getBuiltInCatalog } from '@/lib/i18n/catalog'
import { translations } from '@/lib/i18n/translations'

export async function bootstrapBuiltInI18nCatalog() {
  const { actor, admin } = await getAdminContext()
  const catalog = getBuiltInCatalog()

  const builtInLanguages = [
    {
      code: 'en',
      name: 'English',
      native_name: 'English',
      is_default: true,
      is_system: true,
      sort_order: 0,
    },
    {
      code: 'uk',
      name: 'Ukrainian',
      native_name: translations.uk.lang.uk,
      is_default: false,
      is_system: false,
      sort_order: 10,
    },
    {
      code: 'ru',
      name: 'Russian',
      native_name: translations.ru.lang.ru,
      is_default: false,
      is_system: false,
      sort_order: 20,
    },
  ]

  for (const language of builtInLanguages) {
    await admin.from('i18n_languages').upsert(
      {
        ...language,
        is_enabled: true,
        is_deleted: false,
      },
      { onConflict: 'code' }
    )
  }

  let valueCount = 0
  for (const entry of catalog) {
    const { data: variable, error } = await admin
      .from('i18n_variables')
      .upsert(
        {
          var_key: entry.key,
          namespace: entry.namespace,
          source_language_code: 'en',
          source_text: entry.sourceText,
          description: null,
          is_enabled: true,
          is_deleted: false,
        },
        { onConflict: 'var_key' }
      )
      .select('id')
      .single()

    if (error || !variable) continue

    for (const [languageCode, value] of Object.entries(entry.translations)) {
      if (languageCode === 'en' || !value) continue

      const { error: valueError } = await admin.from('i18n_values').upsert(
        {
          variable_id: variable.id,
          language_code: languageCode,
          value,
          status: 'published',
          provider: 'builtin',
          updated_by: actor.id,
          is_enabled: true,
          is_deleted: false,
        },
        { onConflict: 'variable_id,language_code' }
      )

      if (!valueError) valueCount += 1
    }
  }

  await writeI18nAudit(actor.id, 'i18n_catalog_bootstrapped', {
    variables: catalog.length,
    values: valueCount,
  })

  revalidatePath(ADMIN_LANGUAGES_PATH)
  redirect(`${ADMIN_LANGUAGES_PATH}?success=catalog_synced`)
}
