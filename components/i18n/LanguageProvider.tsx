'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  applyTranslationOverrides,
  getStaticLanguageList,
  type RuntimeLanguage,
} from '@/lib/i18n/runtime'
import { defaultLocale, normalizeLocale, type Locale } from '@/lib/i18n/translations'

type LanguageContextValue = {
  locale: Locale
  setLocale: (next: Locale) => void
  t: ReturnType<typeof applyTranslationOverrides>
  languages: RuntimeLanguage[]
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('app-locale')
      if (saved) return normalizeLocale(saved)
    }
    return defaultLocale
  })
  const [languages, setLanguages] = useState<RuntimeLanguage[]>(() => getStaticLanguageList())
  const [t, setT] = useState(() => applyTranslationOverrides(locale, [])) // applyTranslationOverrides вже повертає TranslationTree

  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Track locale at last full-fetch so the language-list refresh effect
  // can avoid an extra duplicate fetch when locale itself changes.
  const lastFetchedLocale = useRef<string>('')

  const setLocale = useCallback((next: Locale) => {
    const normalized = normalizeLocale(next)
    setLocaleState(normalized)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('app-locale', normalized)
      document.cookie = `app-locale=${normalized}; path=/; max-age=31536000; samesite=lax`
      document.documentElement.lang = normalized
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    let active = true

    async function loadRuntimeI18n() {
      try {
        const res = await fetch(`/api/i18n?locale=${encodeURIComponent(locale)}`)
        if (!res.ok) return

        const data = (await res.json()) as {
          languages?: RuntimeLanguage[]
          overrides?: Array<{ key: string; value: string }>
        }

        if (!active) return

        const nextLanguages =
          data.languages && data.languages.length > 0 ? data.languages : getStaticLanguageList()

        setLanguages(nextLanguages)
        setT(applyTranslationOverrides(locale, data.overrides ?? []))
        lastFetchedLocale.current = locale
      } catch {
        if (!active) return
        setLanguages(getStaticLanguageList())
        setT(applyTranslationOverrides(locale, []))
      }
    }

    loadRuntimeI18n()
    return () => {
      active = false
    }
  }, [locale])

  // Lightweight language-list refresh on navigation.
  // Runs when the user navigates (e.g. after admin disables/enables a language
  // and the action redirects back to the admin page). Skips when locale changes
  // since the main effect above already handles that case.
  useEffect(() => {
    if (lastFetchedLocale.current !== locale) return // main effect will run
    let active = true
    fetch(`/api/i18n?locale=${encodeURIComponent(locale)}&list=1`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { languages?: RuntimeLanguage[] } | null) => {
        if (!active || !data) return
        const next =
          data.languages && data.languages.length > 0 ? data.languages : getStaticLanguageList()
        setLanguages(next)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [pathname, searchParams, locale])

  // If current locale got disabled, move user to the first available locale.
  useEffect(() => {
    if (!languages.length) return
    if (languages.some((lang) => lang.code === locale)) return
    const fallback = normalizeLocale(languages[0].code)
    queueMicrotask(() => setLocale(fallback))
  }, [languages, locale, setLocale])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      languages,
    }),
    [locale, setLocale, t, languages]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }
  return ctx
}
