/** @vitest-environment jsdom */

import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ConfirmActionButton from '@/components/ui/ConfirmActionButton'

describe('ConfirmActionButton', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires second click when confirm message is provided', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      React.createElement(ConfirmActionButton, {
        label: 'Delete',
        confirmMessage: 'Are you sure?',
        onConfirm,
      })
    )

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Підтвердити' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Підтвердити' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('renders inline error returned by confirm handler', async () => {
    const onConfirm = vi.fn().mockResolvedValue({ error: 'Failed action' })
    const user = userEvent.setup()

    render(
      React.createElement(ConfirmActionButton, {
        label: 'Delete',
        onConfirm,
      })
    )

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed action')
  })
})
