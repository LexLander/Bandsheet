export default function ProfileLoading() {
  return (
    <div className="max-w-lg mx-auto p-6 space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-2">
          <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-52 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-md" />
          </div>
        ))}
        <div className="h-10 w-32 bg-gray-300 dark:bg-gray-600 rounded-md" />
      </div>
    </div>
  )
}
