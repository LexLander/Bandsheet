/** @vitest-environment jsdom */

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminSettingsClient from '@/components/admin/settings/AdminSettingsClient'
import type { SiteSettings } from '@/lib/db/settings'

const useLanguageMock = vi.fn()

vi.mock('@/components/i18n/LanguageProvider', () => ({
  useLanguage: () => useLanguageMock(),
}))

const translationStub = {
  profile: {
    saving: 'Saving...',
  },
  admin: {
    settings: {
      title: 'Settings',
      description: 'Manage site settings',
      menuSite: 'Site',
      menuAccess: 'Access',
      menuIntegrations: 'Integrations',
      general: 'General',
      contacts: 'Contacts',
      registration: 'Registration',
      maintenance: 'Maintenance',
      aiTranslation: 'AI Translation',
      appName: 'App name',
      appSlogan: 'App slogan',
      contactEmail: 'Contact email',
      privacyUrl: 'Privacy URL',
      termsUrl: 'Terms URL',
      allowRegistration: 'Allow registration',
      allowRegistrationHint: 'New users can sign up',
      enableMaintenance: 'Enable maintenance',
      enableMaintenanceHint: 'Show maintenance page',
      maintenanceWarning: 'Maintenance mode is active',
      maintenanceTitle: 'Maintenance title',
      maintenanceMessage: 'Maintenance message',
      maintenanceEta: 'ETA',
      maintenanceEtaPlaceholder: 'Tomorrow at 10:00',
      preview: 'Preview',
      aiHint: 'Configure AI provider',
      aiProvider: 'Provider',
      providerAnthropic: 'Anthropic',
      providerOpenai: 'OpenAI',
      aiApiKey: 'API key',
      currentKey: 'Current key',
      hide: 'Hide',
      show: 'Show',
      verify: 'Verify',
      verifyValid: 'Key valid',
      verifyInvalid: 'Key invalid',
      save: 'Save',
      saved: 'Saved successfully',
    },
  },
}

function makeInitialSettings(): SiteSettings {
  return {
    app_name: 'BandSheet',
    app_slogan: 'OPEN. PLAY. SHINE.',
    contact_email: 'support@bandsheet.app',
    privacy_url: 'https://bandsheet.app/privacy',
    terms_url: 'https://bandsheet.app/terms',
    allow_registration: 'true',
    maintenance_enabled: 'false',
    maintenance_title: "We'll be back soon",
    maintenance_message: "We're updating the site and making improvements. Be right back.",
    maintenance_eta: '',
    ai_provider: 'anthropic',
    ai_api_key: '••••••••1234',
  }
}

describe('AdminSettingsClient', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    useLanguageMock.mockReturnValue({ t: translationStub })
  })

  it('switches sections from the menu', async () => {
    const user = userEvent.setup()

    render(<AdminSettingsClient initialSettings={makeInitialSettings()} />)

    expect(screen.getByRole('heading', { name: 'General' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Contacts' }))

    expect(screen.getByRole('heading', { name: 'Contacts' })).toBeInTheDocument()
    expect(screen.getByLabelText('Contact email')).toHaveValue('support@bandsheet.app')
  })

  it('saves general settings and shows success state', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
    const user = userEvent.setup()

    render(<AdminSettingsClient initialSettings={makeInitialSettings()} />)

    await user.clear(screen.getByLabelText('App name'))
    await user.type(screen.getByLabelText('App name'), 'New BandSheet')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(fetchMock).toHaveBeenCalledWith('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_name: 'New BandSheet',
        app_slogan: 'OPEN. PLAY. SHINE.',
      }),
    })
    expect(await screen.findByText('Saved successfully')).toBeInTheDocument()
    expect(dispatchEventSpy).toHaveBeenCalledTimes(1)
  })

  it('renders inline error when save fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Save failed' }),
    })
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const user = userEvent.setup()

    render(<AdminSettingsClient initialSettings={makeInitialSettings()} />)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Save failed')).toBeInTheDocument()
  })

  it('verifies ai api key and shows valid status', async () => {
    const fetchMock = vi.fn().mockImplementation((input: string, init?: RequestInit) => {
      if (input === '/api/settings/verify' && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ valid: true }),
        })
      }

      return Promise.reject(new Error(`Unexpected fetch: ${input}`))
    })
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const user = userEvent.setup()

    render(<AdminSettingsClient initialSettings={makeInitialSettings()} />)

    await user.click(screen.getByRole('button', { name: 'AI Translation' }))
    await user.type(screen.getByLabelText('API key'), 'secret-key')
    await user.click(screen.getByRole('button', { name: 'Verify' }))

    expect(fetchMock).toHaveBeenCalledWith('/api/settings/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'anthropic', apiKey: 'secret-key' }),
    })
    const validLabels = await screen.findAllByText('Key valid')
    expect(validLabels).toHaveLength(2)
  })
})
