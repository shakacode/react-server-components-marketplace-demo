import React from 'react';

export function RelatedPostsSkeleton() {
  return (
    <section className="mt-12 pt-8 border-t border-gray-200">
      <div className="h-7 w-40 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-gray-200 p-5"
          >
            <div className="flex gap-1.5 mb-3">
              <div className="h-5 w-14 rounded-full bg-gray-200" />
              <div className="h-5 w-16 rounded-full bg-gray-200" />
            </div>
            <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="space-y-2 mb-3">
              <div className="h-3 w-full bg-gray-200 rounded" />
              <div className="h-3 w-5/6 bg-gray-200 rounded" />
            </div>
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}
