'use client'

import Link from 'next/link'
import { useState } from 'react'
import { requestPasswordReset } from '../actions'
import { useLanguage } from '@/components/i18n/LanguageProvider'

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSent(false)

    const result = await requestPasswordReset(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  return (
    <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8">
      <h2 className="text-lg font-semibold mb-2">{t.auth.forgotTitle}</h2>
      <p className="text-sm text-foreground/60 mb-6">
        {t.auth.forgotDescription}
      </p>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition"
            placeholder="you@example.com"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {sent && (
          <p className="text-sm text-green-600">
            {t.auth.forgotSent}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? t.auth.forgotSubmitting : t.auth.forgotSubmit}
        </button>
      </form>

      <p className="text-sm text-center text-foreground/60 mt-6">
        <Link href="/login" className="text-foreground font-medium hover:underline">
          {t.auth.backToLogin}
        </Link>
      </p>
    </div>
  )
}
