/**
 * Parse register page query parameters safely
 */

export type RegisterNoticeKey = 'duplicateEmail' | null

interface RegisterQueryState {
  noticeKey: RegisterNoticeKey
}

/**
 * Extract and validate notice key from query parameters
 * @param search search string (e.g., '?notice=duplicateEmail')
 */
export function parseRegisterQueryState(search: string): RegisterQueryState {
  if (!search) {
    return { noticeKey: null }
  }

  const params = new URLSearchParams(search)
  const notice = params.get('notice')

  const validNotices: RegisterNoticeKey[] = ['duplicateEmail']
  const noticeKey = (validNotices.includes(notice as RegisterNoticeKey) ? notice : null) as RegisterNoticeKey

  return { noticeKey }
}
