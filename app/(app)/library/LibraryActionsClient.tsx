'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type AddProps = {
  songId: string
  songSource?: 'public' | 'private'
  isAdded: boolean
  addLabel: string
  addedLabel: string
  pendingLabel: string
  errorLabel: string
}

type RemoveProps = {
  itemId: string
  removeLabel: string
  pendingLabel: string
  errorLabel: string
}

export function AddToLibraryButton({
  songId,
  songSource = 'public',
  isAdded,
  addLabel,
  addedLabel,
  pendingLabel,
  errorLabel,
}: AddProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onAdd() {
    if (isAdded) return

    setLoading(true)
    const response = await fetch('/api/library', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ song_id: songId, song_source: songSource }),
    })
    setLoading(false)

    if (!response.ok) {
      window.alert(errorLabel)
      return
    }

    router.refresh()
  }

  return (
    <button
      type="button"
      disabled={isAdded || loading}
      onClick={onAdd}
      className="px-3 py-1.5 rounded-lg border border-black/15 dark:border-white/15 text-xs disabled:opacity-60"
    >
      {loading ? pendingLabel : isAdded ? addedLabel : addLabel}
    </button>
  )
}

export function RemoveFromLibraryButton({
  itemId,
  removeLabel,
  pendingLabel,
  errorLabel,
}: RemoveProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onRemove() {
    setLoading(true)
    const response = await fetch(`/api/library/${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
    })
    setLoading(false)

    if (!response.ok) {
      window.alert(errorLabel)
      return
    }

    router.refresh()
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onRemove}
      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs hover:bg-red-50 disabled:opacity-60"
    >
      {loading ? pendingLabel : removeLabel}
    </button>
  )
}