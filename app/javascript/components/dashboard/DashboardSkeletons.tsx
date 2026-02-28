import React from 'react';

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="w-10 h-10 bg-gray-100 rounded-lg" />
          </div>
          <div className="h-8 w-28 bg-gray-200 rounded mb-3" />
          <div className="h-4 w-20 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ title, height = 'h-72' }: { title: string; height?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-100 rounded" />
      </div>
      <div className={`${height} bg-gray-50 rounded-lg flex items-center justify-center`}>
        <span className="text-gray-300 text-sm">{title}</span>
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="p-6 pb-4">
        <div className="h-5 w-32 bg-gray-200 rounded" />
      </div>
      <div className="px-6">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50">
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
            <div className="h-4 w-16 bg-gray-100 rounded ml-auto" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TopItemsSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
      <div className="space-y-3">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-6 bg-gray-100 rounded" style={{ width: `${90 - i * 8}%` }} />
            <div className="h-4 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
