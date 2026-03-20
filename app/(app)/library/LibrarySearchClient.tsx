'use client'

import { FormEvent, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Props = {
  placeholder: string
  initialQuery: string
}

export default function LibrarySearchClient({ placeholder, initialQuery }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const params = new URLSearchParams(searchParams.toString())
    const trimmed = query.trim()

    if (trimmed) {
      params.set('q', trimmed)
    } else {
      params.delete('q')
    }

    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
      />
      <button
        type="submit"
        className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium"
      >
        Search
      </button>
    </form>
  )
}