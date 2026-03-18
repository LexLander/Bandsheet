'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { bulkToggleGroups } from './actions'

export default function GroupsBulkControls() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    function onSelected(e: Event) {
      const custom = e as CustomEvent<{ selectedIds: string[] }>
      setSelectedIds(custom?.detail?.selectedIds || [])
    }
    window.addEventListener('groups:selected', onSelected as EventListener)
    return () => window.removeEventListener('groups:selected', onSelected as EventListener)
  }, [])

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    // Removed blocking browser confirm to avoid modal popup

    const formData = new FormData()
    selectedIds.forEach((id) => formData.append('group_ids', id))
    formData.set('is_deleted', 'true')

    const res = await bulkToggleGroups(formData)
    if (res?.error) {
      alert(res.error)
      return
    }

    // clear selection in list
    window.dispatchEvent(new CustomEvent('groups:selected', { detail: { selectedIds: [] } }))
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={handleBulkDelete}
        style={{
          display: selectedIds.length > 0 ? 'flex' : 'none',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          background: '#e53935',
          border: 'none',
          borderRadius: 12,
          color: 'white',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 6 }}>
          <path d="M2 4h10M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M11 4l-.8 7.2A1 1 0 019.2 12H4.8a1 1 0 01-1-.8L3 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Видалити
      </button>
    </div>
  )
}
