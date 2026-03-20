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

type LanguagePickerFormProps = {
  query: string
  selectedToAdd: LanguageOption | null
  filteredOptions: LanguageOption[]
  searchPlaceholder: string
  addLabel: string
  onQueryChange: (value: string) => void
  onOptionSelect: (option: LanguageOption) => void
}

type SelectedLanguageActionsProps = {
  selectedCode: string
  selectedCountLabel: string
  selectedLanguage: Language
  translateLabel: string
  disableLabel: string
  enableLabel: string
  deleteLabel: string
  onOpenTranslate: () => void
}

type LanguagesCoverageTableProps = {
  languages: Language[]
  selectedCode: string | null
  totalVariables: number
  sourceLabel: string
  systemLabel: string
  enabledLabel: string
  disabledLabel: string
  columnLanguageLabel: string
  columnCodeLabel: string
  columnStatusLabel: string
  columnCoverageLabel: string
  nonEmptyByLanguage: Map<string, Set<string>>
  onSelectionChange: (code: string | null) => void
}

type TranslateModalProps = {
  isOpen: boolean
  selectedLanguage: Language | null
  translateMode: 'empty' | 'all'
  selectedVariableIdsCsv: string
  titleLabel: string
  emptyOnlyLabel: string
  emptyOnlyHint: string
  allValuesLabel: string
  allValuesHint: string
  cancelLabel: string
  translateLabel: string
  onClose: () => void
  onModeChange: (mode: 'empty' | 'all') => void
}

function normalize(text: string) {
  return text.trim().toLowerCase()
}

function useLanguageOptions(languages: Language[], query: string) {
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

  return useMemo(() => {
    const q = normalize(query)
    if (!q) return languageOptions.slice(0, 30)

    return languageOptions
      .filter((row) => {
        return (
          row.code.includes(q) ||
          normalize(row.name).includes(q) ||
          normalize(row.nativeName).includes(q)
        )
      })
      .slice(0, 30)
  }, [languageOptions, query])
}

function useNonEmptyByLanguage(values: ValueRow[]) {
  return useMemo(() => {
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
}

function useValueByVariableAndLanguage(values: ValueRow[]) {
  return useMemo(() => {
    const map = new Map<string, string>()
    for (const row of values) {
      map.set(`${row.variable_id}:${row.language_code}`, row.value)
    }
    return map
  }, [values])
}

function useSelectedLanguageData(
  languages: Language[],
  selectedCode: string | null,
  translateMode: 'empty' | 'all',
  variables: Variable[],
  valueByVariableAndLanguage: Map<string, string>
) {
  const selectedLanguage = useMemo(
    () => languages.find((lang) => lang.code === selectedCode) ?? null,
    [languages, selectedCode]
  )

  const allVariableIdsCsv = useMemo(() => variables.map((row) => row.id).join(','), [variables])

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

  return {
    selectedLanguage,
    selectedVariableIdsCsv: translateMode === 'empty' ? emptyOnlyVariableIdsCsv : allVariableIdsCsv,
  }
}

function LanguagePickerForm({
  query,
  selectedToAdd,
  filteredOptions,
  searchPlaceholder,
  addLabel,
  onQueryChange,
  onOptionSelect,
}: LanguagePickerFormProps) {
  return (
    <form action={createI18nLanguage} className="flex flex-wrap items-start gap-2 relative">
      <input type="hidden" name="code" value={selectedToAdd?.code ?? ''} />
      <input type="hidden" name="name" value={selectedToAdd?.name ?? ''} />
      <input type="hidden" name="native_name" value={selectedToAdd?.nativeName ?? ''} />

      <div className="relative w-full max-w-xl">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
        />

        {filteredOptions.length > 0 && query.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 rounded-lg border border-black/15 dark:border-white/15 bg-background shadow-lg max-h-72 overflow-auto">
            {filteredOptions.map((row) => (
              <button
                key={row.code}
                type="button"
                onClick={() => onOptionSelect(row)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
              >
                <span className="font-medium">{row.name}</span>
                <span className="text-foreground/60">
                  {' '}
                  · {row.nativeName} · {row.code}
                </span>
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
        {addLabel}
      </button>
    </form>
  )
}

function SelectedLanguageActions({
  selectedCode,
  selectedCountLabel,
  selectedLanguage,
  translateLabel,
  disableLabel,
  enableLabel,
  deleteLabel,
  onOpenTranslate,
}: SelectedLanguageActionsProps) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 flex flex-wrap items-center gap-2">
      <span className="text-sm text-foreground/70">{selectedCountLabel}: 1</span>

      <button
        type="button"
        onClick={onOpenTranslate}
        className="px-3 py-1.5 rounded border border-black/15 dark:border-white/15 text-xs"
      >
        {translateLabel}
      </button>

      <form action={setI18nLanguageEnabled}>
        <input type="hidden" name="code" value={selectedCode} />
        <input
          type="hidden"
          name="enabled"
          value={selectedLanguage.is_enabled ? 'false' : 'true'}
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded border border-black/15 dark:border-white/15 text-xs"
        >
          {selectedLanguage.is_enabled ? disableLabel : enableLabel}
        </button>
      </form>

      <form action={deleteI18nLanguage}>
        <input type="hidden" name="code" value={selectedCode} />
        <button
          type="submit"
          className="px-3 py-1.5 rounded border border-red-200 text-red-600 text-xs hover:bg-red-50"
        >
          {deleteLabel}
        </button>
      </form>
    </div>
  )
}

function LanguagesCoverageTable({
  languages,
  selectedCode,
  totalVariables,
  sourceLabel,
  systemLabel,
  enabledLabel,
  disabledLabel,
  columnLanguageLabel,
  columnCodeLabel,
  columnStatusLabel,
  columnCoverageLabel,
  nonEmptyByLanguage,
  onSelectionChange,
}: LanguagesCoverageTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
      <table className="w-full text-sm min-w-[760px]">
        <thead className="bg-black/5 dark:bg-white/5">
          <tr>
            <th className="w-12 px-3 py-2 text-left">☐</th>
            <th className="px-3 py-2 text-left">{columnLanguageLabel}</th>
            <th className="px-3 py-2 text-left">{columnCodeLabel}</th>
            <th className="px-3 py-2 text-left">{columnStatusLabel}</th>
            <th className="px-3 py-2 text-left">{columnCoverageLabel}</th>
          </tr>
        </thead>
        <tbody>
          {languages.map((lang) => {
            const filled = nonEmptyByLanguage.get(lang.code)?.size ?? 0
            const coverage = lang.is_system ? sourceLabel : `${filled}/${totalVariables}`

            return (
              <tr key={lang.code} className="border-t border-black/10 dark:border-white/10">
                <td className="px-3 py-2">
                  {lang.is_system ? (
                    <span title={systemLabel}>🔒</span>
                  ) : (
                    <input
                      type="checkbox"
                      checked={selectedCode === lang.code}
                      onChange={(event) =>
                        onSelectionChange(event.target.checked ? lang.code : null)
                      }
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
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-black/10 dark:bg-white/10">
                      {systemLabel}
                    </span>
                  ) : lang.is_enabled ? (
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {enabledLabel}
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-black/10 dark:bg-white/10">
                      {disabledLabel}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-sm text-foreground/70">{coverage}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TranslateModal({
  isOpen,
  selectedLanguage,
  translateMode,
  selectedVariableIdsCsv,
  titleLabel,
  emptyOnlyLabel,
  emptyOnlyHint,
  allValuesLabel,
  allValuesHint,
  cancelLabel,
  translateLabel,
  onClose,
  onModeChange,
}: TranslateModalProps) {
  if (!isOpen || !selectedLanguage) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-black/10 dark:border-white/10 bg-background p-4 space-y-4">
        <h4 className="text-lg font-semibold">
          {titleLabel}: {selectedLanguage.name}
        </h4>

        <div className="space-y-3">
          <label className="flex items-start gap-2 rounded-lg border border-black/10 dark:border-white/10 p-3">
            <input
              type="radio"
              checked={translateMode === 'empty'}
              onChange={() => onModeChange('empty')}
            />
            <span>
              <span className="block text-sm font-medium">{emptyOnlyLabel}</span>
              <span className="block text-xs text-foreground/60">{emptyOnlyHint}</span>
            </span>
          </label>

          <label className="flex items-start gap-2 rounded-lg border border-black/10 dark:border-white/10 p-3">
            <input
              type="radio"
              checked={translateMode === 'all'}
              onChange={() => onModeChange('all')}
            />
            <span>
              <span className="block text-sm font-medium">{allValuesLabel}</span>
              <span className="block text-xs text-foreground/60">{allValuesHint}</span>
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-black/15 dark:border-white/15 text-sm"
          >
            {cancelLabel}
          </button>

          <form action={bulkGenerateI18nTranslations}>
            <input type="hidden" name="language_code" value={selectedLanguage.code} />
            <input type="hidden" name="selected_variable_ids" value={selectedVariableIdsCsv} />
            <button
              type="submit"
              disabled={!selectedVariableIdsCsv}
              className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-50"
            >
              {translateLabel}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
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

  const filteredOptions = useLanguageOptions(languages, query)

  const totalVariables = variables.length

  const nonEmptyByLanguage = useNonEmptyByLanguage(values)
  const valueByVariableAndLanguage = useValueByVariableAndLanguage(values)
  const { selectedLanguage, selectedVariableIdsCsv } = useSelectedLanguageData(
    languages,
    selectedCode,
    translateMode,
    variables,
    valueByVariableAndLanguage
  )

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/10 p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="font-medium">{t.admin.languages.title}</h3>

        <LanguagePickerForm
          query={query}
          selectedToAdd={selectedToAdd}
          filteredOptions={filteredOptions}
          searchPlaceholder={t.admin.languages.searchPlaceholder}
          addLabel={t.admin.languages.addBtn}
          onQueryChange={(value) => {
            setQuery(value)
            setSelectedToAdd(null)
          }}
          onOptionSelect={(row) => {
            setSelectedToAdd(row)
            setQuery(`${row.name} (${row.code})`)
          }}
        />
      </div>

      {selectedCode && selectedLanguage && (
        <SelectedLanguageActions
          selectedCode={selectedCode}
          selectedCountLabel={t.admin.languages.selected}
          selectedLanguage={selectedLanguage}
          translateLabel={t.admin.languages.translate}
          disableLabel={t.admin.languages.disable}
          enableLabel={t.admin.languages.enable}
          deleteLabel={t.admin.languages.delete}
          onOpenTranslate={() => {
            setTranslateMode('empty')
            setIsTranslateModalOpen(true)
          }}
        />
      )}

      <LanguagesCoverageTable
        languages={languages}
        selectedCode={selectedCode}
        totalVariables={totalVariables}
        sourceLabel={t.admin.languages.source}
        systemLabel={t.admin.languages.system}
        enabledLabel={t.admin.languages.enabled}
        disabledLabel={t.admin.languages.disabled}
        columnLanguageLabel={t.admin.languages.columnLanguage}
        columnCodeLabel={t.admin.languages.columnCode}
        columnStatusLabel={t.admin.languages.columnStatus}
        columnCoverageLabel={t.admin.languages.columnCoverage}
        nonEmptyByLanguage={nonEmptyByLanguage}
        onSelectionChange={setSelectedCode}
      />

      <TranslateModal
        isOpen={isTranslateModalOpen}
        selectedLanguage={selectedLanguage}
        translateMode={translateMode}
        selectedVariableIdsCsv={selectedVariableIdsCsv}
        titleLabel={t.admin.languages.translateTitle}
        emptyOnlyLabel={t.admin.languages.emptyOnly}
        emptyOnlyHint={t.admin.languages.emptyOnlyHint}
        allValuesLabel={t.admin.languages.allValues}
        allValuesHint={t.admin.languages.allValuesHint}
        cancelLabel={t.admin.languages.cancel}
        translateLabel={t.admin.languages.translate}
        onClose={() => setIsTranslateModalOpen(false)}
        onModeChange={setTranslateMode}
      />
    </section>
  )
}
