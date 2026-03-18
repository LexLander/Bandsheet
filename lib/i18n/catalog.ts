import { locales, translations, type StaticLocale } from '@/lib/i18n/translations'

export type BuiltInCatalogEntry = {
  key: string
  namespace: string
  sourceText: string
  translations: Partial<Record<StaticLocale, string>>
}

function flattenLocaleStrings(input: unknown, prefix = '', acc: Record<string, string> = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return acc
  }

  for (const [key, value] of Object.entries(input)) {
    const nextPath = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') {
      acc[nextPath] = value
      continue
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenLocaleStrings(value, nextPath, acc)
    }
  }

  return acc
}

export function getBuiltInCatalog(): BuiltInCatalogEntry[] {
  const flattened = Object.fromEntries(
    locales.map((locale) => [locale, flattenLocaleStrings(translations[locale])])
  ) as Record<StaticLocale, Record<string, string>>

  return Object.entries(flattened.en)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, sourceText]) => ({
      key,
      namespace: key.split('.')[0] ?? 'app',
      sourceText,
      translations: locales.reduce<Partial<Record<StaticLocale, string>>>((acc, locale) => {
        const value = flattened[locale][key]
        if (typeof value === 'string' && value.length > 0) {
          acc[locale] = value
        }
        return acc
      }, {}),
    }))
}