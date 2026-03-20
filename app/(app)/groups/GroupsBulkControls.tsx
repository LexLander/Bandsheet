'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { bulkToggleGroups } from './actions'
import { GROUPS_SELECTED_EVENT, type GroupsSelectedDetail } from '@/lib/events/groups'

export default function GroupsBulkControls() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    function onSelected(e: Event) {
      const custom = e as CustomEvent<GroupsSelectedDetail>
      setSelectedIds(custom?.detail?.selectedIds || [])
    }
    window.addEventListener(GROUPS_SELECTED_EVENT, onSelected as EventListener)
    return () => window.removeEventListener(GROUPS_SELECTED_EVENT, onSelected as EventListener)
  }, [])

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return
    // Removed blocking browser confirm to avoid modal popup

    const formData = new FormData()
    selectedIds.forEach((id) => formData.append('group_ids', id))
    formData.set('is_deleted', 'true')

    const res = await bulkToggleGroups(formData)
    if (res?.error) {
      window.alert(res.error)
      return
    }

    // clear selection in list
    window.dispatchEvent(new CustomEvent(GROUPS_SELECTED_EVENT, { detail: { selectedIds: [] } }))
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleBulkDelete}
        className={`items-center gap-1.5 rounded-xl bg-[#e53935] px-4 py-2 text-sm font-medium text-white ${
          selectedIds.length > 0 ? 'flex' : 'hidden'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M2 4h10M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M11 4l-.8 7.2A1 1 0 019.2 12H4.8a1 1 0 01-1-.8L3 4"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Видалити
      </button>
    </div>
  )
}
