'use client'

import Link from 'next/link'
import { useLanguage } from '@/components/i18n/LanguageProvider'

export default function CheckEmailPage() {
  const { t } = useLanguage()

  return (
    <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8 text-center">
      <div className="text-4xl mb-4">📬</div>
      <h2 className="text-lg font-semibold mb-2">{t.auth.checkEmailTitle}</h2>
      <p className="text-sm text-foreground/60 mb-6">
        {t.auth.checkEmailDescription}
      </p>
      <p className="text-sm text-foreground/40">
        {t.auth.checkEmailConfirmed}{' '}
        <Link href="/login" className="text-foreground font-medium hover:underline">
          {t.auth.loginLink}
        </Link>
      </p>
    </div>
  )
}
