export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-8 w-64 rounded bg-black/10 dark:bg-white/10 mb-6" />
      <div className="grid gap-3">
        <div className="h-16 rounded-lg bg-black/10 dark:bg-white/10" />
        <div className="h-16 rounded-lg bg-black/10 dark:bg-white/10" />
        <div className="h-16 rounded-lg bg-black/10 dark:bg-white/10" />
      </div>
    </div>
  )
}
