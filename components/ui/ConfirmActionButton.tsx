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
  const [error, setError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  async function handleClick() {
    if (confirmMessage && !isConfirming) {
      setError(null)
      setIsConfirming(true)
      return
    }

    setError(null)
    setIsConfirming(false)
    setLoading(true)
    const result = await onConfirm()
    setLoading(false)

    if (result && 'error' in result && result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={handleClick} disabled={loading} className={className}>
        {loading ? (pendingLabel ?? 'Виконую...') : isConfirming ? 'Підтвердити' : label}
      </button>

      {isConfirming && confirmMessage ? (
        <div className="space-y-2">
          <p className="text-xs text-red-600">{confirmMessage}</p>
          <button
            type="button"
            onClick={() => setIsConfirming(false)}
            className="text-xs text-foreground/70 underline underline-offset-2"
          >
            Скасувати
          </button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}
