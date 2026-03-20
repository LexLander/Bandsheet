export type LoginNoticeKey = 'invalidLink' | 'accountBlocked' | null

export function sanitizeNextPath(raw: string | null) {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (!trimmed.startsWith('/')) return ''
  if (trimmed.startsWith('//')) return ''
  return trimmed
}

export function parseLoginQueryState(search: string) {
  const params = new URLSearchParams(search)
  const resetDone = params.get('reset') === 'success'
  const errorCode = params.get('error')
  const reason = params.get('reason')

  let noticeKey: LoginNoticeKey = null
  if (errorCode === 'invalid_link') noticeKey = 'invalidLink'
  if (reason === 'blocked') noticeKey = 'accountBlocked'

  return {
    resetDone,
    noticeKey,
    nextPath: sanitizeNextPath(params.get('next')),
  }
}