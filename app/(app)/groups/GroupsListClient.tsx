'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { GROUPS_SELECTED_EVENT } from '@/lib/events/groups'

type GroupItem = {
  id: string
  name: string
  avatar_url?: string | null
  role?: string
}

export default function GroupsListClient({ items }: { items: GroupItem[] }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  // selectedIds are derived inside toggle when needed and dispatched via event

  function toggle(id: string) {
    setSelected((s) => {
      const next = { ...s, [id]: !s[id] }
      const selectedIds = Object.keys(next).filter((k) => next[k])
      // notify other client components (bulk controls) about selection change
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(GROUPS_SELECTED_EVENT, { detail: { selectedIds } }))
      }
      return next
    })
  }

  return (
    <div className="mx-auto max-w-[680px]">
      <div className="flex flex-col gap-2.5">
        {items.map((g) => (
          <div key={g.id} className="flex items-center gap-2.5">
            <label className="relative h-5 w-5 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                onChange={() => toggle(g.id)}
                checked={!!selected[g.id]}
                className="sr-only"
              />
              <span
                className={`absolute inset-0 flex items-center justify-center rounded-[5px] border-2 border-[#d0d0d0] transition ${
                  selected[g.id] ? 'bg-[#ff4d4d]' : 'bg-white'
                }`}
              >
                {selected[g.id] ? (
                  <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
                    <polyline
                      points="2,6 5,9 10,3"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </span>
            </label>

            <Link
              href={`/groups/${g.id}`}
              className="flex flex-1 cursor-pointer items-center gap-3.5 rounded-2xl border border-[#e8e8e8] bg-white px-4 py-3.5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8e8e8] text-lg font-bold text-[#555]">
                {g.avatar_url ? (
                  <Image
                    src={g.avatar_url}
                    alt={g.name}
                    width={44}
                    height={44}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  g.name.charAt(0).toUpperCase()
                )}
              </div>

              <div className="flex-1">
                <div className="text-[15px] font-medium text-[#111]">{g.name}</div>
                <div className="mt-1 text-xs text-[#aaa]">{g.role}</div>
              </div>

              <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true">
                <path
                  d="M1 1l6 6-6 6"
                  stroke="#ccc"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
