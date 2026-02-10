/**
 * Skeleton placeholder matching the approximate layout of a restaurant card's
 * async widgets: status badge, wait time, rating, specials, and trending items.
 * Sized to minimize CLS when replaced with real content.
 */
export function CardWidgetsSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {/* Status + Wait time row */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-20 rounded-full bg-gray-200" />
        <div className="h-5 w-24 rounded bg-gray-200" />
      </div>

      {/* Rating row */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-8 rounded bg-gray-200" />
        <div className="h-5 w-5 rounded bg-gray-200" />
        <div className="h-4 w-24 rounded bg-gray-200" />
      </div>

      {/* Specials */}
      <div className="space-y-2">
        <div className="h-12 w-full rounded bg-gray-200" />
      </div>

      {/* Trending items */}
      <div className="space-y-1">
        <div className="h-4 w-16 rounded bg-gray-200" />
        <div className="h-4 w-36 rounded bg-gray-200" />
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-4 w-28 rounded bg-gray-200" />
      </div>
    </div>
  );
}
