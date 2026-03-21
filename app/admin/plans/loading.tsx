export default function PlansLoading() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="h-6 bg-black/10 dark:bg-white/10 rounded w-32 animate-pulse" />
        <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-48 animate-pulse" />
      </section>

      {/* Create form skeleton */}
      <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 space-y-3">
        <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-24 animate-pulse" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-10 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
          <div className="h-10 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="h-10 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
          <div className="h-10 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
          <div className="h-10 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
          <div className="h-10 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-10 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
          <div className="h-10 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
          <div className="h-10 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
        <table className="w-full">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              {Array.from({ length: 8 }).map((_, i) => (
                <th key={i} className="px-3 py-2">
                  <div className="h-4 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 3 }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-t border-black/10 dark:border-white/10">
                {Array.from({ length: 8 }).map((_, colIdx) => (
                  <td key={colIdx} className="px-3 py-2">
                    <div className="h-4 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
