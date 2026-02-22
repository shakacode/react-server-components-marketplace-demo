import React from 'react';

export function BlogContentSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Paragraph lines */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-11/12" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />
      </div>

      {/* Code block */}
      <div className="h-48 bg-gray-200 rounded-lg" />

      {/* More paragraph lines */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-10/12" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>

      {/* Another code block */}
      <div className="h-32 bg-gray-200 rounded-lg" />

      {/* More paragraph lines */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-9/12" />
      </div>
    </div>
  );
}
