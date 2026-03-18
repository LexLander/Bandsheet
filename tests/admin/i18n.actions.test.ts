import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  redirectMock,
  revalidatePathMock,
  getAdminContextMock,
  writeI18nAuditMock,
  normalizeFlagMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
  revalidatePathMock: vi.fn(),
  getAdminContextMock: vi.fn(),
  writeI18nAuditMock: vi.fn(),
  normalizeFlagMock: vi.fn((value: FormDataEntryValue | null) => String(value ?? '').toLowerCase() === 'true'),
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}))

vi.mock('@/app/admin/actions/_helpers', () => ({
  getAdminContext: getAdminContextMock,
  writeI18nAudit: writeI18nAuditMock,
  normalizeFlag: normalizeFlagMock,
}))

import { setI18nLanguageEnabled } from '@/app/admin/actions/i18n'
import {
  bulkDeleteI18nTranslations,
  bulkSetI18nTranslationsEnabled,
  createI18nLanguage,
  deleteI18nLanguage,
  importI18nFromJson,
} from '@/app/admin/actions/i18n'

type AdminMock = {
  from: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
}

function createAdminMock(updateError: unknown = null): AdminMock {
  const eq = vi.fn().mockResolvedValue({ error: updateError })
  const update = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ update }))
  return { from, update, eq }
}

describe('setI18nLanguageEnabled action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Date, 'now').mockReturnValue(123456)
  })

  it('redirects with validation error when code is missing', async () => {
    const admin = createAdminMock()
    getAdminContextMock.mockResolvedValue({ actor: { id: 'actor-1' }, admin })

    const formData = new FormData()
    formData.set('enabled', 'true')

    await expect(setI18nLanguageEnabled(formData)).rejects.toThrow(
      'REDIRECT:/admin/languages?error=language_required&r=123456',
    )

    expect(admin.from).not.toHaveBeenCalled()
    expect(writeI18nAuditMock).not.toHaveBeenCalled()
  })

  it('redirects with error when update fails', async () => {
    const admin = createAdminMock({ message: 'db-error' })
    getAdminContextMock.mockResolvedValue({ actor: { id: 'actor-1' }, admin })

    const formData = new FormData()
    formData.set('code', 'ru')
    formData.set('enabled', 'false')

    await expect(setI18nLanguageEnabled(formData)).rejects.toThrow(
      'REDIRECT:/admin/languages?error=language_toggle_failed&r=123456',
    )

    expect(admin.from).toHaveBeenCalledWith('i18n_languages')
    expect(admin.update).toHaveBeenCalledWith({ is_enabled: false })
    expect(admin.eq).toHaveBeenCalledWith('code', 'ru')
  })

  it('writes audit and redirects on success', async () => {
    const admin = createAdminMock(null)
    getAdminContextMock.mockResolvedValue({ actor: { id: 'actor-1' }, admin })

    const formData = new FormData()
    formData.set('code', 'uk')
    formData.set('enabled', 'true')

    await expect(setI18nLanguageEnabled(formData)).rejects.toThrow(
      'REDIRECT:/admin/languages?success=language_toggled&r=123456',
    )

    expect(writeI18nAuditMock).toHaveBeenCalledWith('actor-1', 'i18n_language_toggled', {
      code: 'uk',
      enabled: true,
    })
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/languages')
  })
})

describe('other i18n admin actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createI18nLanguage validates required fields', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const admin = { from: vi.fn(() => ({ upsert })) }
    getAdminContextMock.mockResolvedValue({ actor: { id: 'actor-2' }, admin })

    const formData = new FormData()
    formData.set('code', '')
    formData.set('name', '')

    await expect(createI18nLanguage(formData)).rejects.toThrow(
      'REDIRECT:/admin/languages?error=language_required',
    )
    expect(upsert).not.toHaveBeenCalled()
  })

  it('createI18nLanguage stores language, writes audit and redirects success', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const admin = { from: vi.fn(() => ({ upsert })) }
    getAdminContextMock.mockResolvedValue({ actor: { id: 'actor-2' }, admin })

    const formData = new FormData()
    formData.set('code', 'DE')
    formData.set('name', 'Deutsch')

    await expect(createI18nLanguage(formData)).rejects.toThrow(
      'REDIRECT:/admin/languages?success=language_saved',
    )

    expect(upsert).toHaveBeenCalledWith(
      {
        code: 'de',
        name: 'Deutsch',
        native_name: 'Deutsch',
        is_enabled: true,
        is_default: false,
        is_system: false,
        is_deleted: false,
      },
      { onConflict: 'code' },
    )
    expect(writeI18nAuditMock).toHaveBeenCalledWith('actor-2', 'i18n_language_saved', {
      code: 'de',
      name: 'Deutsch',
      native_name: 'Deutsch',
    })
  })

  it('does not allow disabling english default language', async () => {
    const admin = createAdminMock(null)
    getAdminContextMock.mockResolvedValue({ actor: { id: 'actor-1' }, admin })

    const formData = new FormData()
    formData.set('code', 'en')
    formData.set('enabled', 'false')

    await expect(setI18nLanguageEnabled(formData)).rejects.toThrow(
      'REDIRECT:/admin/languages?error=language_default_locked&r=123456',
    )
  })

  it('deleteI18nLanguage deletes row and redirects success', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn(() => ({ eq }))
    const admin = { from: vi.fn(() => ({ delete: del })) }
    getAdminContextMock.mockResolvedValue({ actor: { id: 'actor-3' }, admin })

    const formData = new FormData()
    formData.set('code', 'ru')

    await expect(deleteI18nLanguage(formData)).rejects.toThrow(
      'REDIRECT:/admin/languages?success=language_deleted',
    )

    expect(eq).toHaveBeenCalledWith('code', 'ru')
    expect(writeI18nAuditMock).toHaveBeenCalledWith('actor-3', 'i18n_language_deleted', { code: 'ru' })
  })

  it('importI18nFromJson rejects invalid json payload', async () => {
    const admin = { from: vi.fn() }
    getAdminContextMock.mockResolvedValue({ actor: { id: 'actor-4' }, admin })

    const formData = new FormData()
    formData.set('payload', '{broken-json')

    await expect(importI18nFromJson(formData)).rejects.toThrow(
      'REDIRECT:/admin/languages?error=import_invalid_json',
    )
  })

  it('importI18nFromJson imports rows and redirects success', async () => {
    const langUpsert = vi.fn().mockResolvedValue({ error: null })
    const variableSingle = vi.fn().mockResolvedValue({ data: { id: 'var-1' }, error: null })
    const variableUpsert = vi.fn(() => ({ select: vi.fn(() => ({ single: variableSingle })) }))
    const valueUpsert = vi.fn().mockResolvedValue({ error: null })

    const admin = {
      from: vi.fn((table: string) => {
        if (table === 'i18n_languages') return { upsert: langUpsert }
        if (table === 'i18n_variables') return { upsert: variableUpsert }
        if (table === 'i18n_values') return { upsert: valueUpsert }
        throw new Error(`Unexpected table: ${table}`)
      }),
    }
    getAdminContextMock.mockResolvedValue({ actor: { id: 'actor-4' }, admin })

    const formData = new FormData()
    formData.set('payload', JSON.stringify({
      languages: [{ code: 'de', name: 'Deutsch', enabled: true }],
      variables: [{
        key: 'app.nav.users',
        description: 'Users menu label',
        sourceText: 'Users',
        enabled: true,
        translations: { de: 'Benutzer' },
      }],
    }))

    await expect(importI18nFromJson(formData)).rejects.toThrow(
      'REDIRECT:/admin/languages?success=import_done',
    )

    expect(langUpsert).toHaveBeenCalled()
    expect(variableUpsert).toHaveBeenCalled()
    expect(valueUpsert).toHaveBeenCalled()
    expect(writeI18nAuditMock).toHaveBeenCalledWith('actor-4', 'i18n_import_json', {
      languages: 1,
      variables: 1,
      values: 1,
    })
  })

  it('bulk actions require selected rows', async () => {
    const admin = { from: vi.fn() }
    getAdminContextMock.mockResolvedValue({ actor: { id: 'actor-8' }, admin })

    const formData = new FormData()
    formData.set('language_code', 'uk')

    await expect(bulkSetI18nTranslationsEnabled(formData)).rejects.toThrow(
      'REDIRECT:/admin/languages?error=bulk_selection_required',
    )
  })

  it('bulkDeleteI18nTranslations deletes selected rows and redirects success', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const inMock = vi.fn(() => ({ eq }))
    const del = vi.fn(() => ({ in: inMock }))

    const admin = {
      from: vi.fn((table: string) => {
        if (table !== 'i18n_values') throw new Error(`Unexpected table: ${table}`)
        return { delete: del }
      }),
    }

    getAdminContextMock.mockResolvedValue({ actor: { id: 'actor-9' }, admin })

    const formData = new FormData()
    formData.set('selected_variable_ids', 'v1,v2')
    formData.set('language_code', 'ru')

    await expect(bulkDeleteI18nTranslations(formData)).rejects.toThrow(
      'REDIRECT:/admin/languages?success=values_bulk_deleted',
    )

    expect(del).toHaveBeenCalled()
    expect(inMock).toHaveBeenCalledWith('variable_id', ['v1', 'v2'])
    expect(eq).toHaveBeenCalledWith('language_code', 'ru')
    expect(writeI18nAuditMock).toHaveBeenCalledWith('actor-9', 'i18n_values_bulk_deleted', {
      language_code: 'ru',
      variable_count: 2,
    })
  })
})
