import { describe, expect, it } from 'vitest'
import { applyTranslationOverrides, getStaticLanguageList } from '@/lib/i18n/runtime'

describe('i18n runtime overlay', () => {
  it('applies override values by dot-path key', () => {
    const t = applyTranslationOverrides('uk', [
      { key: 'app.nav.users', value: 'Юзери' },
      { key: 'groups.title', value: 'Команди' },
    ])

    expect(t.app.nav.users).toBe('Юзери')
    expect(t.groups.title).toBe('Команди')
  })

  it('keeps base translations for missing keys', () => {
    const t = applyTranslationOverrides('uk', [{ key: 'unknown.path', value: 'X' }])
    expect(t.app.nav.users).toBe('Користувачі')
  })

  it('falls back to English base dictionary for unknown locale', () => {
    const t = applyTranslationOverrides('de', [{ key: 'groups.title', value: 'Gruppen' }])
    expect(t.app.nav.users).toBe('Users')
    expect(t.groups.title).toBe('Gruppen')
  })

  it('returns built-in static languages list', () => {
    const list = getStaticLanguageList().map((x) => x.code)
    expect(list).toContain('uk')
    expect(list).toContain('ru')
    expect(list).toContain('en')
  })
})
