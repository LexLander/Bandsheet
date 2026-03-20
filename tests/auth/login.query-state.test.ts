import { describe, expect, it } from 'vitest'
import { parseLoginQueryState, sanitizeNextPath } from '@/app/(auth)/login/query-state'

describe('login query state parser', () => {
  it('detects reset success and safe next path', () => {
    const state = parseLoginQueryState('?reset=success&next=%2Flibrary%3Fq%3Dslow')

    expect(state).toEqual({
      resetDone: true,
      noticeKey: null,
      nextPath: '/library?q=slow',
    })
  })

  it('maps invalid link errors to invalidLink notice', () => {
    const state = parseLoginQueryState('?error=invalid_link')

    expect(state.noticeKey).toBe('invalidLink')
    expect(state.resetDone).toBe(false)
  })

  it('maps blocked reason to accountBlocked notice', () => {
    const state = parseLoginQueryState('?reason=blocked')

    expect(state.noticeKey).toBe('accountBlocked')
  })

  it('rejects unsafe next values', () => {
    expect(sanitizeNextPath('https://evil.test')).toBe('')
    expect(sanitizeNextPath('//evil.test')).toBe('')
    expect(sanitizeNextPath('javascript:alert(1)')).toBe('')
    expect(sanitizeNextPath('/dashboard')).toBe('/dashboard')
  })
})
