import LanguagesTableClient from '@/components/admin/i18n/LanguagesTableClient'
import { getI18nLanguages, getI18nValues, getI18nVariables } from '@/lib/db/i18n-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function LanguagesSection() {
  const admin = createAdminClient()
  const [languages, variables, values] = await Promise.all([
    getI18nLanguages(admin),
    getI18nVariables(admin),
    getI18nValues(admin),
  ])

  return <LanguagesTableClient languages={languages} variables={variables} values={values} />
}
