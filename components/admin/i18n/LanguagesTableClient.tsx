'use client'

import { useMemo, useState } from 'react'
import ISO6391 from 'iso-639-1'
import {
  bulkGenerateI18nTranslations,
  createI18nLanguage,
  deleteI18nLanguage,
  setI18nLanguageEnabled,
} from '@/app/admin/actions'
import { useLanguage } from '@/components/i18n/LanguageProvider'

type Language = {
  code: string
  name: string
  native_name: string | null
  is_enabled: boolean
  is_default: boolean
  is_system: boolean
}

type Variable = {
  id: string
}

type ValueRow = {
  variable_id: string
  language_code: string
  value: string
}

type LanguageOption = {
  code: string
  name: string
  nativeName: string
}

function normalize(text: string) {
  return text.trim().toLowerCase()
}

export default function LanguagesTableClient({
  languages,
  variables,
  values,
}: {
  languages: Language[]
  variables: Variable[]
  values: ValueRow[]
}) {
  const { t } = useLanguage()

  const [query, setQuery] = useState('')
  const [selectedToAdd, setSelectedToAdd] = useState<LanguageOption | null>(null)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false)
  const [translateMode, setTranslateMode] = useState<'empty' | 'all'>('empty')

  const existingCodes = useMemo(
    () => new Set(languages.map((lang) => lang.code.toLowerCase())),
    [languages]
  )

  const languageOptions = useMemo(() => {
    const allCodes = ISO6391.getAllCodes() as string[]
    return allCodes
      .map((code) => {
        const name = ISO6391.getName(code)
        const nativeName = ISO6391.getNativeName(code) || name
        return {
          code,
          name,
          nativeName,
        }
      })
      .filter((row) => row.name && !existingCodes.has(row.code))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [existingCodes])

  const filteredOptions = useMemo(() => {
    const q = normalize(query)
    if (!q) return languageOptions.slice(0, 30)

    return languageOptions
      .filter((row) => {
        return (
          row.code.includes(q)
          || normalize(row.name).includes(q)
          || normalize(row.nativeName).includes(q)
        )
      })
      .slice(0, 30)
  }, [languageOptions, query])

  const totalVariables = variables.length

  const nonEmptyByLanguage = useMemo(() => {
    const map = new Map<string, Set<string>>()

    for (const row of values) {
      if (!row.value.trim()) continue
      if (!map.has(row.language_code)) {
        map.set(row.language_code, new Set())
      }
      map.get(row.language_code)?.add(row.variable_id)
    }

    return map
  }, [values])

  const valueByVariableAndLanguage = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of values) {
      map.set(`${row.variable_id}:${row.language_code}`, row.value)
    }
    return map
  }, [values])

  const selectedLanguage = useMemo(
    () => languages.find((lang) => lang.code === selectedCode) ?? null,
    [languages, selectedCode]
  )

  const allVariableIdsCsv = useMemo(
    () => variables.map((row) => row.id).join(','),
    [variables]
  )

  const emptyOnlyVariableIdsCsv = useMemo(() => {
    if (!selectedCode) return ''

    const emptyIds = variables
      .filter((variable) => {
        const value = valueByVariableAndLanguage.get(`${variable.id}:${selectedCode}`)
        return !value || !value.trim()
      })
      .map((variable) => variable.id)

    return emptyIds.join(',')
  }, [selectedCode, valueByVariableAndLanguage, variables])

  const selectedVariableIdsCsv = translateMode === 'empty'
    ? emptyOnlyVariableIdsCsv
    : allVariableIdsCsv

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/10 p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="font-medium">{t.admin.languages.title}</h3>

        <form action={createI18nLanguage} className="flex flex-wrap items-start gap-2 relative">
          <input type="hidden" name="code" value={selectedToAdd?.code ?? ''} />
          <input type="hidden" name="name" value={selectedToAdd?.name ?? ''} />
          <input type="hidden" name="native_name" value={selectedToAdd?.nativeName ?? ''} />

          <div className="relative w-full max-w-xl">
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setSelectedToAdd(null)
              }}
              placeholder={t.admin.languages.searchPlaceholder}
              className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
            />

            {filteredOptions.length > 0 && query.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 rounded-lg border border-black/15 dark:border-white/15 bg-background shadow-lg max-h-72 overflow-auto">
                {filteredOptions.map((row) => (
                  <button
                    key={row.code}
                    type="button"
                    onClick={() => {
                      setSelectedToAdd(row)
                      setQuery(`${row.name} (${row.code})`)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <span className="font-medium">{row.name}</span>
                    <span className="text-foreground/60"> · {row.nativeName} · {row.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!selectedToAdd}
            className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-50"
          >
            {t.admin.languages.addBtn}
          </button>
        </form>
      </div>

      {selectedCode && selectedLanguage && (
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-foreground/70">{t.admin.languages.selected}: 1</span>

          <button
            type="button"
            onClick={() => {
              setTranslateMode('empty')
              setIsTranslateModalOpen(true)
            }}
            className="px-3 py-1.5 rounded border border-black/15 dark:border-white/15 text-xs"
          >
            {t.admin.languages.translate}
          </button>

          <form action={setI18nLanguageEnabled}>
            <input type="hidden" name="code" value={selectedCode} />
            <input type="hidden" name="enabled" value="false" />
            <button type="submit" className="px-3 py-1.5 rounded border border-black/15 dark:border-white/15 text-xs">
              {t.admin.languages.disable}
            </button>
          </form>

          <form action={deleteI18nLanguage}>
            <input type="hidden" name="code" value={selectedCode} />
            <button type="submit" className="px-3 py-1.5 rounded border border-red-200 text-red-600 text-xs hover:bg-red-50">
              {t.admin.languages.delete}
            </button>
          </form>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="w-12 px-3 py-2 text-left">☐</th>
              <th className="px-3 py-2 text-left">{t.admin.languages.columnLanguage}</th>
              <th className="px-3 py-2 text-left">{t.admin.languages.columnCode}</th>
              <th className="px-3 py-2 text-left">{t.admin.languages.columnStatus}</th>
              <th className="px-3 py-2 text-left">{t.admin.languages.columnCoverage}</th>
            </tr>
          </thead>
          <tbody>
            {languages.map((lang) => {
              const filled = nonEmptyByLanguage.get(lang.code)?.size ?? 0
              const coverage = lang.is_system
                ? t.admin.languages.source
                : `${filled}/${totalVariables}`

              return (
                <tr key={lang.code} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-3 py-2">
                    {lang.is_system ? (
                      <span title={t.admin.languages.system}>🔒</span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={selectedCode === lang.code}
                        onChange={(event) => {
                          if (!event.target.checked) {
                            setSelectedCode(null)
                            return
                          }
                          setSelectedCode(lang.code)
                        }}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{lang.name}</div>
                    <div className="text-xs text-foreground/60">{lang.native_name ?? lang.name}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-foreground/70">{lang.code}</td>
                  <td className="px-3 py-2">
                    {lang.is_system ? (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-black/10 dark:bg-white/10">{t.admin.languages.system}</span>
                    ) : lang.is_enabled ? (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{t.admin.languages.enabled}</span>
                    ) : (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-black/10 dark:bg-white/10">{t.admin.languages.disabled}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-foreground/70">{coverage}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isTranslateModalOpen && selectedLanguage && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-black/10 dark:border-white/10 bg-background p-4 space-y-4">
            <h4 className="text-lg font-semibold">{t.admin.languages.translateTitle}: {selectedLanguage.name}</h4>

            <div className="space-y-3">
              <label className="flex items-start gap-2 rounded-lg border border-black/10 dark:border-white/10 p-3">
                <input
                  type="radio"
                  checked={translateMode === 'empty'}
                  onChange={() => setTranslateMode('empty')}
                />
                <span>
                  <span className="block text-sm font-medium">{t.admin.languages.emptyOnly}</span>
                  <span className="block text-xs text-foreground/60">{t.admin.languages.emptyOnlyHint}</span>
                </span>
              </label>

              <label className="flex items-start gap-2 rounded-lg border border-black/10 dark:border-white/10 p-3">
                <input
                  type="radio"
                  checked={translateMode === 'all'}
                  onChange={() => setTranslateMode('all')}
                />
                <span>
                  <span className="block text-sm font-medium">{t.admin.languages.allValues}</span>
                  <span className="block text-xs text-foreground/60">{t.admin.languages.allValuesHint}</span>
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTranslateModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-black/15 dark:border-white/15 text-sm"
              >
                {t.admin.languages.cancel}
              </button>

              <form action={bulkGenerateI18nTranslations}>
                <input type="hidden" name="language_code" value={selectedLanguage.code} />
                <input type="hidden" name="selected_variable_ids" value={selectedVariableIdsCsv} />
                <button
                  type="submit"
                  disabled={!selectedVariableIdsCsv}
                  className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-50"
                >
                  {t.admin.languages.translate}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
