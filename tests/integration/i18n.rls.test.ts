import { describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('i18n RLS integration (optional)', () => {
  it('anon client sees only enabled languages when env is configured', async () => {
    const url = process.env.SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !anonKey || !serviceRoleKey) {
      // Optional integration suite: skip when test DB credentials are absent.
      expect(true).toBe(true)
      return
    }

    const admin = createClient(url, serviceRoleKey)
    const anon = createClient(url, anonKey)

    const enabledCode = 'qaenabled'
    const disabledCode = 'qadisabled'

    try {
      await admin.from('i18n_languages').upsert([
        { code: enabledCode, name: 'QA Enabled', is_enabled: true, is_deleted: false },
        { code: disabledCode, name: 'QA Disabled', is_enabled: false, is_deleted: false },
      ], { onConflict: 'code' })

      const { data, error } = await anon
        .from('i18n_languages')
        .select('code, name')
        .in('code', [enabledCode, disabledCode])

      expect(error).toBeNull()

      const codes = (data ?? []).map((row) => row.code)
      expect(codes).toContain(enabledCode)
      expect(codes).not.toContain(disabledCode)
    } finally {
      await admin.from('i18n_languages').delete().in('code', [enabledCode, disabledCode])
    }
  })
})
