export default function MessageSkeleton() {
  return (
    <div className="space-y-4 px-4 py-6 animate-pulse">
      {/* Other user's message */}
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex flex-col gap-2 max-w-[70%]">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-2xl w-48" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-2xl w-32" />
        </div>
      </div>

      {/* Own message */}
      <div className="flex items-start gap-2 justify-end">
        <div className="flex flex-col gap-2 max-w-[70%] items-end">
          <div className="h-10 bg-brand/20 rounded-2xl w-40" />
          <div className="h-10 bg-brand/20 rounded-2xl w-56" />
        </div>
      </div>

      {/* Other user's message */}
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex flex-col gap-2 max-w-[70%]">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-2xl w-64" />
        </div>
      </div>

      {/* Own message */}
      <div className="flex items-start gap-2 justify-end">
        <div className="flex flex-col gap-2 max-w-[70%] items-end">
          <div className="h-10 bg-brand/20 rounded-2xl w-44" />
        </div>
      </div>

      {/* Other user's message */}
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex flex-col gap-2 max-w-[70%]">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-2xl w-52" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-2xl w-36" />
        </div>
      </div>
    </div>
  );
}

