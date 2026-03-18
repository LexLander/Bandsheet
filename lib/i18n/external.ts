type TranslationDraftRequest = {
  key: string
  sourceText: string
}

export type TranslationDraftResult = {
  provider: string
  drafts: Array<{ key: string; value: string }>
}

async function translateWithDeepL(
  requests: TranslationDraftRequest[],
  targetLanguage: string
): Promise<TranslationDraftResult> {
  const apiKey = process.env.DEEPL_API_KEY
  if (!apiKey) {
    throw new Error('translation_provider_not_configured')
  }

  const endpoint = process.env.DEEPL_API_URL ?? 'https://api-free.deepl.com/v2/translate'
  const body = new URLSearchParams()
  body.set('target_lang', targetLanguage.split('-')[0].toUpperCase())
  body.set('source_lang', 'EN')
  for (const row of requests) {
    body.append('text', row.sourceText)
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    throw new Error('translation_provider_failed')
  }

  const payload = (await response.json()) as {
    translations?: Array<{ text?: string }>
  }

  const translations = payload.translations ?? []
  return {
    provider: 'deepl',
    drafts: requests.map((row, index) => ({
      key: row.key,
      value: translations[index]?.text ?? row.sourceText,
    })),
  }
}

export async function generateTranslationDrafts(
  requests: TranslationDraftRequest[],
  targetLanguage: string
): Promise<TranslationDraftResult> {
  if (!requests.length) {
    return { provider: 'manual', drafts: [] }
  }

  if (process.env.DEEPL_API_KEY) {
    return translateWithDeepL(requests, targetLanguage)
  }

  throw new Error('translation_provider_not_configured')
}