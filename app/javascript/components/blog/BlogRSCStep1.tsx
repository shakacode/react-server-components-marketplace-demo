// No "use client" — server component
// Step 1: Pure text, zero dependencies

import React from 'react';

export default function BlogRSCStep1() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-6">
        RSC Step 1: Pure text, zero dependencies
      </p>
      <h1 className="text-3xl font-bold">Hello from RSC</h1>
      <p className="text-gray-600 mt-4">This is a minimal server component with no imports.</p>
    </div>
  );
}
