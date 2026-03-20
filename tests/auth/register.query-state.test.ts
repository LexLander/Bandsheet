import { describe, it, expect } from 'vitest'
import { parseRegisterQueryState } from '@/app/(auth)/register/query-state'

describe('register query-state parser', () => {
  it('returns null noticeKey when search is empty', () => {
    const result = parseRegisterQueryState('')
    expect(result.noticeKey).toBe(null)
  })

  it('detects duplicateEmail notice', () => {
    const result = parseRegisterQueryState('?notice=duplicateEmail')
    expect(result.noticeKey).toBe('duplicateEmail')
  })

  it('ignores invalid notice values', () => {
    const result = parseRegisterQueryState('?notice=invalidValue')
    expect(result.noticeKey).toBe(null)
  })

  it('ignores multiple query params and extracts only notice', () => {
    const result = parseRegisterQueryState('?foo=bar&notice=duplicateEmail&baz=qux')
    expect(result.noticeKey).toBe('duplicateEmail')
  })
})
