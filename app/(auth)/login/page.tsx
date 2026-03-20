'use client'

import Link from 'next/link'
import { useState } from 'react'
import { login } from '../actions'
import { useLanguage } from '@/components/i18n/LanguageProvider'

export default function LoginPage() {
  const { t } = useLanguage()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetDone] = useState(() => {
    if (typeof window === 'undefined') return false
    return new URLSearchParams(window.location.search).get('reset') === 'success'
  })
  const [authNotice] = useState(() => {
    if (typeof window === 'undefined') return ''
    const params = new URLSearchParams(window.location.search)
    const errorCode = params.get('error')
    const reason = params.get('reason')

    if (errorCode === 'invalid_link') return t.auth.invalidLink
    if (reason === 'blocked') return t.auth.accountBlocked
    return ''
  })
  const [nextPath] = useState(() => {
    if (typeof window === 'undefined') return ''
    const raw = new URLSearchParams(window.location.search).get('next')
    if (!raw) return ''
    if (!raw.startsWith('/')) return ''
    if (raw.startsWith('//')) return ''
    return raw
  })

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

      {resetDone && (
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
        <input type="hidden" name="next" value={nextPath} />
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
