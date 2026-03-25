'use client'

import { useMemo, useState, useTransition, useEffect } from 'react'
import { saveI18nTranslationValue } from '@/app/admin/actions'
import { useLanguage } from '@/components/i18n/LanguageProvider'

type Language = {
  code: string
  name: string
  is_enabled: boolean
}

type Variable = {
  id: string
  var_key: string
  source_text: string
}

type ValueRow = {
  variable_id: string
  language_code: string
  value: string
  status: 'draft' | 'published' | 'needs_review'
}

type TranslationMatrixTableProps = {
  editableLanguages: Language[]
  visibleVariables: Variable[]
  draftMap: Record<string, string>
  valueMap: Map<string, ValueRow>
  onValueChange: (variableId: string, languageCode: string, value: string) => void
  onBlurSave: (variableId: string, languageCode: string) => void
  autoResize: (event: React.FormEvent<HTMLTextAreaElement>) => void
  notFilledLabel: string
  columnKeyLabel: string
  columnEnglishLabel: string
}

function cellKey(variableId: string, languageCode: string) {
  return `${variableId}:${languageCode}`
}

function FilterToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-lg border ${
        active
          ? 'bg-black/10 dark:bg-white/10 border-black/20 dark:border-white/20'
          : 'border-black/15 dark:border-white/15'
      }`}
    >
      {label}
    </button>
  )
}

function TranslationMatrixTable({
  editableLanguages,
  visibleVariables,
  draftMap,
  valueMap,
  onValueChange,
  onBlurSave,
  autoResize,
  notFilledLabel,
  columnKeyLabel,
  columnEnglishLabel,
}: TranslationMatrixTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-black/5 dark:bg-white/5">
          <tr>
            <th className="px-3 py-2 text-left break-words whitespace-pre-line">
              {columnKeyLabel}
            </th>
            <th className="px-3 py-2 text-left break-words whitespace-pre-line">
              {columnEnglishLabel}
            </th>
            {editableLanguages.map((lang) => (
              <th key={lang.code} className="px-3 py-2 text-left break-words whitespace-pre-line">
                {lang.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleVariables.length === 0 ? (
            <tr>
              <td
                colSpan={2 + editableLanguages.length}
                className="px-3 py-6 text-center text-foreground/60 text-sm"
              >
                Нет данных
              </td>
            </tr>
          ) : (
            visibleVariables.map((variable) => (
              <tr
                key={variable.id}
                className="border-t border-black/10 dark:border-white/10 align-top"
              >
                <td className="px-3 py-2 break-words whitespace-pre-line">
                  <code className="text-xs text-foreground/60 font-mono break-words whitespace-pre-line">
                    {variable.var_key}
                  </code>
                </td>
                <td className="px-3 py-2 bg-black/[0.03] dark:bg-white/[0.04] break-words whitespace-pre-line">
                  <p className="text-xs break-words whitespace-pre-line text-foreground/70">
                    {variable.source_text}
                  </p>
                </td>
                {editableLanguages.map((lang) => {
                  const key = cellKey(variable.id, lang.code)
                  const value = draftMap[key] ?? valueMap.get(key)?.value ?? ''

                  return (
                    <td
                      key={key}
                      className="px-3 py-2 bg-[#fffef0] break-words whitespace-pre-line"
                    >
                      <textarea
                        value={value}
                        onChange={(event) =>
                          onValueChange(variable.id, lang.code, event.target.value)
                        }
                        onInput={autoResize}
                        onBlur={() => onBlurSave(variable.id, lang.code)}
                        placeholder={notFilledLabel}
                        rows={1}
                        className="w-full min-h-[32px] resize-y overflow-auto rounded px-0 py-1 text-xs border-none bg-transparent focus:bg-[#fff9c4] focus:outline-none break-words whitespace-pre-line"
                      />
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

const PAGE_SIZE = 50

export default function MatrixTableClient({
  languages,
  variables,
  values,
}: {
  languages: Language[]
  variables: Variable[]
  values: ValueRow[]
}) {
  const { t } = useLanguage()
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<'all' | 'empty'>('all')
  const [page, setPage] = useState(0)

  // ...

  const matrixLanguages = useMemo(() => {
    const active = languages.filter((lang) => lang.is_enabled)
    const en = active.find((lang) => lang.code === 'en')
    const others = active
      .filter((lang) => lang.code !== 'en')
      .sort((a, b) => a.code.localeCompare(b.code))

    return en ? [en, ...others] : others
  }, [languages])

  const editableLanguages = useMemo(
    () => matrixLanguages.filter((lang) => lang.code !== 'en'),
    [matrixLanguages]
  )

  const valueMap = useMemo(() => {
    const map = new Map<string, ValueRow>()
    for (const row of values) {
      map.set(cellKey(row.variable_id, row.language_code), row)
    }
    return map
  }, [values])

  const [draftMap, setDraftMap] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const row of values) {
      initial[cellKey(row.variable_id, row.language_code)] = row.value
    }
    return initial
  })

  const rowsWithMissing = useMemo(() => {
    const set = new Set<string>()
    for (const variable of variables) {
      const hasMissing = editableLanguages.some((lang) => {
        const key = cellKey(variable.id, lang.code)
        const value = draftMap[key] ?? valueMap.get(key)?.value ?? ''
        return !value.trim()
      })
      if (hasMissing) set.add(variable.id)
    }
    return set
  }, [draftMap, editableLanguages, valueMap, variables])

  const filteredVariables = useMemo(() => {
    if (filter === 'all') return variables
    return variables.filter((variable) => rowsWithMissing.has(variable.id))
  }, [filter, rowsWithMissing, variables])

  const totalPages = Math.max(1, Math.ceil(filteredVariables.length / PAGE_SIZE))

  const visibleVariables = useMemo(() => {
    return filteredVariables.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  }, [filteredVariables, page])

  function autoResize(event: React.FormEvent<HTMLTextAreaElement>) {
    const element = event.currentTarget
    element.style.height = '0px'
    element.style.height = `${element.scrollHeight}px`
  }

  function onValueChange(variableId: string, languageCode: string, value: string) {
    const key = cellKey(variableId, languageCode)
    setDraftMap((prev) => ({ ...prev, [key]: value }))
  }

  function onBlurSave(variableId: string, languageCode: string) {
    const key = cellKey(variableId, languageCode)
    const nextValue = draftMap[key] ?? ''
    const current = valueMap.get(key)
    const currentValue = current?.value ?? ''

    if (nextValue === currentValue) return

    startTransition(() => {
      const formData = new FormData()
      formData.set('variable_id', variableId)
      formData.set('language_code', languageCode)
      formData.set('value', nextValue)
      formData.set('status', current?.status ?? 'published')
      void saveI18nTranslationValue(formData)
    })
  }

  return (
    <section className="space-y-4">
      <h3 className="font-medium">{t.admin.languages.matrixTitle}</h3>

      <div className="flex items-center gap-2">
        <FilterToggleButton
          active={filter === 'all'}
          onClick={() => {
            setFilter('all')
            setPage(0)
          }}
          label={t.admin.languages.filterAll}
        />
        <FilterToggleButton
          active={filter === 'empty'}
          onClick={() => {
            setFilter('empty')
            setPage(0)
          }}
          label={t.admin.languages.filterEmpty}
        />
        {isPending && <span className="text-xs text-foreground/60">{t.profile.saving}</span>}
      </div>

      <TranslationMatrixTable
        editableLanguages={editableLanguages}
        visibleVariables={visibleVariables}
        draftMap={draftMap}
        valueMap={valueMap}
        onValueChange={onValueChange}
        onBlurSave={onBlurSave}
        autoResize={autoResize}
        notFilledLabel={t.admin.languages.notFilled}
        columnKeyLabel={t.admin.languages.columnKey}
        columnEnglishLabel={t.admin.languages.columnEnglish}
      />

      <div className="flex items-center justify-center gap-2 mt-2">
        <button
          type="button"
          className="px-3 py-1 rounded border text-sm disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          ←
        </button>
        <span className="text-xs">
          {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          className="px-3 py-1 rounded border text-sm disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
        >
          →
        </button>
      </div>
    </section>
  )
}
