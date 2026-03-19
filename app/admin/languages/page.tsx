import LanguagesSection from '@/components/admin/i18n/LanguagesSection'
import MatrixSection from '@/components/admin/i18n/MatrixSection'
import { getServerT } from '@/lib/i18n/server'

export const revalidate = 0

export default async function AdminLanguagesPage() {
  const { t } = await getServerT()

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t.admin.languages.title}</h2>
      </section>

      <LanguagesSection />
      <MatrixSection />
    </div>
  )
}
