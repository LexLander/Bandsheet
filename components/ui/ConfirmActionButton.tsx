'use client'

import { useState } from 'react'

type Props = {
  label: string
  pendingLabel?: string
  confirmMessage?: string
  onConfirm: () => Promise<{ error?: string } | void>
  className?: string
}

export default function ConfirmActionButton({
  label,
  pendingLabel,
  onConfirm,
  confirmMessage,
  className,
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) return
    // No confirmation prompt: assume checkbox selection or explicit action
    setLoading(true)
    const result = await onConfirm()
    setLoading(false)

    if (result && 'error' in result && result.error) {
      window.alert(result.error)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? (pendingLabel ?? 'Виконую...') : label}
    </button>
  )
}
