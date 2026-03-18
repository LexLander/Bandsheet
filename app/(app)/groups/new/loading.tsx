export default function NewGroupLoading() {
  return (
    <div className="max-w-md mx-auto p-6 space-y-6 animate-pulse">
      <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-gray-300 dark:bg-gray-600 rounded-md" />
      </div>
    </div>
  )
}
