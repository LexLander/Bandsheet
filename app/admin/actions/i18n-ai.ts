'use server'

import {
  aiDebugLog,
  parseJsonRecord,
  type TranslationDraftRequest,
  type TranslationDraftResult,
} from './i18n-shared'

async function translateWithAnthropic(
  apiKey: string,
  requests: TranslationDraftRequest[],
  targetLanguage: string
): Promise<TranslationDraftResult> {
  const prompt = [
    'You are a translation engine.',
    `Translate each English source text to ${targetLanguage}.`,
    'Return JSON object where each KEY is the translation key (e.g. "app.nav.users") and VALUE is the translated string.',
    'Example: {"app.nav.users": "Utilisateurs"}',
    'Use exactly the provided keys. Do not use sourceText as keys.',
    'Translate values only.',
    'Do not skip items.',
    'Do not add comments or markdown.',
    JSON.stringify(requests),
  ].join('\n\n')

  aiDebugLog('Prompt sent to Anthropic:', prompt.slice(0, 500))

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error('translation_provider_failed')
  }

  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>
  }

  const text = (payload.content ?? [])
    .filter((item) => item?.type === 'text' && typeof item.text === 'string')
    .map((item) => item.text ?? '')
    .join('\n')

  aiDebugLog('Raw response from Anthropic:', text.slice(0, 1000))

  const valuesByKey = parseJsonRecord(text)
  aiDebugLog('Parsed values sample:', Object.entries(valuesByKey).slice(0, 3))

  return {
    provider: 'anthropic',
    drafts: requests.map((row) => ({
      key: row.key,
      value: valuesByKey[row.key] ?? row.sourceText,
    })),
  }
}

async function translateWithOpenAI(
  apiKey: string,
  requests: TranslationDraftRequest[],
  targetLanguage: string
): Promise<TranslationDraftResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Translate provided English phrases and return strict JSON object: {"key":"translation"}.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            targetLanguage,
            items: requests,
          }),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error('translation_provider_failed')
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const text = payload.choices?.[0]?.message?.content ?? ''
  const valuesByKey = parseJsonRecord(text)

  return {
    provider: 'openai',
    drafts: requests.map((row) => ({
      key: row.key,
      value: valuesByKey[row.key] ?? row.sourceText,
    })),
  }
}

export async function generateAiDrafts(
  provider: 'anthropic' | 'openai',
  apiKey: string,
  requests: TranslationDraftRequest[],
  targetLanguage: string
): Promise<TranslationDraftResult> {
  if (!requests.length) {
    return { provider, drafts: [] }
  }

  return provider === 'openai'
    ? translateWithOpenAI(apiKey, requests, targetLanguage)
    : translateWithAnthropic(apiKey, requests, targetLanguage)
}
