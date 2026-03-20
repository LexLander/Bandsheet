'use client'

import Link from 'next/link'
import { useState } from 'react'
import { login } from '../actions'
import { useLanguage } from '@/components/i18n/LanguageProvider'
import { parseLoginQueryState } from './query-state'

export default function LoginPage() {
  const { t } = useLanguage()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [queryState] = useState(() => {
    if (typeof window === 'undefined') {
      return { resetDone: false, noticeKey: null, nextPath: '' }
    }
    return parseLoginQueryState(window.location.search)
  })

  const authNotice = queryState.noticeKey === 'invalidLink'
    ? t.auth.invalidLink
    : queryState.noticeKey === 'accountBlocked'
      ? t.auth.accountBlocked
      : ''

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8">
      <h2 className="text-lg font-semibold mb-6">{t.auth.loginTitle}</h2>

      {queryState.resetDone && (
        <p className="text-sm text-green-600 mb-4">
          {t.auth.passwordUpdated}
        </p>
      )}

      {authNotice && (
        <p className="text-sm text-amber-600 mb-4">
          {authNotice}
        </p>
      )}

      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="next" value={queryState.nextPath} />
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
            autoComplete="current-password"
            className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition"
            placeholder="••••••••"
          />
          <div className="mt-1 text-right">
            <Link href="/forgot-password" className="text-xs text-foreground/60 hover:text-foreground hover:underline">
              {t.auth.forgotPassword}
            </Link>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? t.auth.loginSubmitting : t.auth.loginSubmit}
        </button>
      </form>

      <p className="text-sm text-center text-foreground/60 mt-6">
        {t.auth.noAccount}{' '}
        <Link href="/register" className="text-foreground font-medium hover:underline">
          {t.auth.registerLink}
        </Link>
      </p>
    </div>
  )
}
