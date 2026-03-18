'use client'

import Link from 'next/link'
import { useState } from 'react'
import { register } from '../actions'
import { useLanguage } from '@/components/i18n/LanguageProvider'

export default function RegisterPage() {
  const { t } = useLanguage()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await register(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8">
      <h2 className="text-lg font-semibold mb-6">{t.auth.registerTitle}</h2>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="name">
            {t.auth.nameLabel}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition"
            placeholder={t.auth.namePlaceholder}
          />
        </div>

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

        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="password">
            {t.auth.passwordLabel}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition"
            placeholder={t.auth.passwordPlaceholder}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? t.auth.registerSubmitting : t.auth.registerSubmit}
        </button>
      </form>

      <p className="text-sm text-center text-foreground/60 mt-6">
        {t.auth.hasAccount}{' '}
        <Link href="/login" className="text-foreground font-medium hover:underline">
          {t.auth.loginLink}
        </Link>
      </p>
    </div>
  )
}
