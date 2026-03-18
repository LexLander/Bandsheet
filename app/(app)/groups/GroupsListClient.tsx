'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
        window.dispatchEvent(new CustomEvent('groups:selected', { detail: { selectedIds } }))
      }
      return next
    })
  }


  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((g) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ position: 'relative', cursor: 'pointer', width: 20, height: 20, flexShrink: 0 }}>
              <input
                type="checkbox"
                onChange={() => toggle(g.id)}
                checked={!!selected[g.id]}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, cursor: 'pointer' }}
              />
              <span
                style={{
                  position: 'absolute', inset: 0, borderRadius: 5, border: '2px solid #d0d0d0', background: selected[g.id] ? '#ff4d4d' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s'
                }}
                dangerouslySetInnerHTML={{ __html: selected[g.id] ? '<svg width="11" height="11" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '' }}
              />
            </label>

            <Link href={`/groups/${g.id}`} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, border: '1px solid #e8e8e8', background: '#fff', cursor: 'pointer' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#555', flexShrink: 0 }}>
                {g.avatar_url ? (
                  <Image
                    src={g.avatar_url}
                    alt={g.name}
                    width={44}
                    height={44}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  g.name.charAt(0).toUpperCase()
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#111' }}>{g.name}</div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{g.role}</div>
              </div>

              <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1 1l6 6-6 6" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
