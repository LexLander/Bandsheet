import { verifyAdminDevice } from '@/app/admin/actions'
import { getServerT } from '@/lib/i18n/server'

export default async function VerifyAdminDevicePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { t } = await getServerT()
  const { error } = await searchParams
  const errorMessages: Record<string, string> = {
    invalid_code: t.admin.verifyDevice.errors.invalidCode,
    config: t.admin.verifyDevice.errors.config,
    device_save_failed: t.admin.verifyDevice.errors.deviceSaveFailed,
  }
  const errorMessage = error ? errorMessages[error] ?? t.admin.verifyDevice.errors.fallback : null

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 space-y-4">
        <h1 className="text-xl font-bold">{t.admin.verifyDevice.title}</h1>
        <p className="text-sm text-foreground/60">
          {t.admin.verifyDevice.description}
        </p>
        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        <form action={verifyAdminDevice} className="space-y-3">
          <input
            type="password"
            name="code"
            required
            placeholder={t.admin.verifyDevice.codePlaceholder}
            className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
          />
          <button type="submit" className="w-full px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium">
            {t.admin.verifyDevice.submit}
          </button>
        </form>
      </div>
    </div>
  )
}
