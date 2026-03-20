export const ADMIN_LANGUAGES_PATH = '/admin/languages'

export type TranslationStatus = 'draft' | 'published' | 'needs_review'

export type TranslationDraftRequest = {
  key: string
  sourceText: string
}

export type TranslationDraftResult = {
  provider: string
  drafts: Array<{ key: string; value: string }>
}

export type I18nImportPayload = {
  languages?: Array<{ code?: string; name?: string; native_name?: string; enabled?: boolean }>
  variables?: Array<{
    key?: string
    namespace?: string
    description?: string | null
    sourceText?: string | null
    enabled?: boolean
    translations?: Record<
      string,
      string | { value?: string; enabled?: boolean; status?: TranslationStatus }
    >
  }>
}

export function deriveNamespace(varKey: string) {
  return varKey.split('.')[0] ?? 'app'
}

export function parseSelectedVariableIds(raw: FormDataEntryValue | null) {
  const text = (raw as string | null)?.trim() ?? ''
  if (!text) return [] as string[]

  return Array.from(
    new Set(
      text
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    )
  )
}

export function normalizeAiProvider(raw: string | undefined) {
  return raw?.trim().toLowerCase() === 'openai' ? 'openai' : 'anthropic'
}

function isI18nAiDebugEnabled() {
  return process.env.I18N_AI_DEBUG === '1'
}

export function aiDebugLog(...args: unknown[]) {
  if (isI18nAiDebugEnabled()) {
    console.warn(...args)
  }
}

export function parseJsonRecord(text: string): Record<string, string> {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const candidate = fenced?.[1] ?? trimmed
  const parsed = JSON.parse(candidate) as unknown

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('translation_provider_invalid_response')
  }

  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'string') {
      result[key] = value
    }
  }

  return result
}
