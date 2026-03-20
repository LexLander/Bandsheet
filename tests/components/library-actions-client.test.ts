/** @vitest-environment jsdom */

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  AddToLibraryButton,
  RemoveFromLibraryButton,
} from '@/app/(app)/library/LibraryActionsClient'

const refreshMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}))

describe('LibraryActionsClient', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows inline error when adding song fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch)

    const user = userEvent.setup()

    render(
      React.createElement(AddToLibraryButton, {
        songId: 'song-1',
        isAdded: false,
        addLabel: 'Add',
        addedLabel: 'Added',
        pendingLabel: 'Adding...',
        errorLabel: 'Cannot add song',
      })
    )

    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot add song')
    expect(refreshMock).not.toHaveBeenCalled()
  })

  it('refreshes router when removing song succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch)

    const user = userEvent.setup()

    render(
      React.createElement(RemoveFromLibraryButton, {
        itemId: 'item-1',
        removeLabel: 'Remove',
        pendingLabel: 'Removing...',
        errorLabel: 'Cannot remove song',
      })
    )

    await user.click(screen.getByRole('button', { name: 'Remove' }))

    expect(refreshMock).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
