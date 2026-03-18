export default function EventsLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-6 animate-pulse space-y-3">
      <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-700" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-20 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      ))}
    </div>
  )
}