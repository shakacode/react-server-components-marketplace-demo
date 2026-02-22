// No "use client" — server component
// Step 1c: Simple props (just a string and number, no markdown)

import React from 'react';

export default function BlogRSCStep1c({ name, count }: { name: string; count: number }) {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-6">
        RSC Step 1c: Simple string + number props
      </p>
      <h1 className="text-3xl font-bold">Hello {name}</h1>
      <p className="text-gray-600 mt-4">Count: {count}</p>
    </div>
  );
}
