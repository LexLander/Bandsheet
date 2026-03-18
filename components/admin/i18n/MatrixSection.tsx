import { getI18nLanguages, getI18nValues, getI18nVariables } from '@/lib/db/i18n-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import MatrixTableClient from '@/components/admin/i18n/MatrixTableClient'

export default async function MatrixSection() {
  const admin = createAdminClient()
  const [languages, variables, values] = await Promise.all([
    getI18nLanguages(admin),
    getI18nVariables(admin),
    getI18nValues(admin),
  ])

  return (
    <MatrixTableClient
      languages={languages}
      variables={variables.map((variable) => ({
        id: variable.id,
        var_key: variable.var_key,
        source_text: variable.source_text,
      }))}
      values={values.map((value) => ({
        variable_id: value.variable_id,
        language_code: value.language_code,
        value: value.value,
        status: value.status,
      }))}
    />
  )
}
