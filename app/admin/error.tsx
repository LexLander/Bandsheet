"use client"

import { useLanguage } from '@/components/i18n/LanguageProvider'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useLanguage()

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h2 className="text-xl font-semibold mb-2">{t.errors.adminFailed}</h2>
      <p className="text-sm text-foreground/60 mb-4">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded bg-primary px-4 py-2 text-white"
      >
        {t.errors.adminRefresh}
      </button>
    </div>
  )
}
