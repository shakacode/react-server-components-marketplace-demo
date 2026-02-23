import React from 'react';

export function ReviewStatsSkeleton() {
  return (
    <div className="animate-pulse bg-gray-50 rounded-2xl p-6">
      <div className="flex items-start gap-8">
        <div className="text-center flex-shrink-0">
          <div className="w-20 h-14 bg-gray-200 rounded mb-2 mx-auto" />
          <div className="flex gap-1 justify-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-5 h-5 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="w-24 h-4 bg-gray-200 rounded mt-2 mx-auto" />
        </div>
        <div className="flex-1 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-4 bg-gray-200 rounded" />
              <div className="flex-1 h-3 bg-gray-200 rounded-full" />
              <div className="w-16 h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReviewsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-40 bg-gray-200 rounded" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="py-6 border-b border-gray-100">
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="w-4 h-4 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 rounded" />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="w-7 h-7 bg-gray-200 rounded-full" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RelatedProductsSkeleton() {
  return (
    <section className="border-t border-gray-200 pt-8">
      <div className="h-7 w-48 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-200 overflow-hidden">
            <div className="aspect-square bg-gray-200" />
            <div className="p-3.5 space-y-2">
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="w-3 h-3 bg-gray-200 rounded" />
                ))}
              </div>
              <div className="h-5 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
