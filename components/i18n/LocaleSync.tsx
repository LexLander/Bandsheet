'use client'

import { useEffect, useRef } from 'react'
import { Locale } from '@/lib/i18n/translations'
import { useLanguage } from './LanguageProvider'

export default function LocaleSync({ serverLocale }: { serverLocale: Locale }) {
  const { setLocale } = useLanguage()
  const synced = useRef(false)

  useEffect(() => {
    if (synced.current) return
    synced.current = true
    setLocale(serverLocale)
  }, [serverLocale, setLocale])

  return null
}
