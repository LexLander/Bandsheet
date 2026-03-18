import { describe, expect, it } from 'vitest'
import { defaultLocale, getBaseTranslations, isLocale, normalizeLocale } from '@/lib/i18n/translations'

describe('i18n translations core', () => {
  it('normalizes locale values safely', () => {
    expect(normalizeLocale('RU')).toBe('ru')
    expect(normalizeLocale('  en  ')).toBe('en')
    expect(normalizeLocale('')).toBe(defaultLocale)
    expect(normalizeLocale(null)).toBe(defaultLocale)
  })

  it('detects static locales only', () => {
    expect(isLocale('uk')).toBe(true)
    expect(isLocale('ru')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('de')).toBe(false)
  })

  it('returns static fallback dictionary for unknown locale', () => {
    const known = getBaseTranslations('ru')
    const fallback = getBaseTranslations('de')

    expect(known.app.nav.users).toBe('Пользователи')
    expect(fallback.app.nav.users).toBe('Users')
  })
})
