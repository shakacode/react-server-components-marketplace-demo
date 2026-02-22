// No "use client" — server component
// Step 1b: Same pure text as Step 1, but receives post props (to test if props cause the hang)

import React from 'react';

export default function BlogRSCStep1b({ post }: { post: any }) {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-6">
        RSC Step 1b: Pure text component but receives post props
      </p>
      <h1 className="text-3xl font-bold">Hello from RSC</h1>
      <p className="text-gray-600 mt-4">Post title: {post.title}</p>
    </div>
  );
}
