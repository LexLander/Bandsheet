import { getBaseTranslations, type Locale, type StaticLocale, translations } from '@/lib/i18n/translations'

export type RuntimeLanguage = {
  code: string
  name: string
}

export type RuntimeTranslationOverride = {
  key: string
  value: string
}

function deepClone<T>(input: T): T {
  if (typeof input === 'function' || input === null || typeof input !== 'object') {
    return input
  }

  if (Array.isArray(input)) {
    return input.map((item) => deepClone(item)) as unknown as T
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    result[key] = deepClone(value)
  }
  return result as T
}

function setByPath(target: Record<string, unknown>, path: string, value: string) {
  const parts = path.split('.').filter(Boolean)
  if (parts.length < 2) return

  let current: Record<string, unknown> = target
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i]
    const next = current[part]
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      current[part] = {}
    }
    current = current[part] as Record<string, unknown>
  }

  const leaf = parts[parts.length - 1]
  if (typeof current[leaf] === 'function') return
  current[leaf] = value
}

export function applyTranslationOverrides(
  locale: Locale,
  overrides: RuntimeTranslationOverride[]
): typeof translations.uk {
  const base = deepClone(getBaseTranslations(locale)) as Record<string, unknown>

  for (const row of overrides) {
    if (!row.key) continue
    setByPath(base, row.key, row.value)
  }

  return base as typeof translations.uk
}

export function getStaticLanguageList(): RuntimeLanguage[] {
  return (Object.keys(translations) as StaticLocale[]).map((code) => {
    const t = translations[code]
    const name = t.lang[code] ?? code.toUpperCase()
    return { code, name }
  })
}
