// No 'use client' — this is a server component in RSC.
// marked + highlight.js (~350KB) stay server-side.

import React from 'react';
import { renderMarkdown } from '../../utils/renderMarkdown';

interface Props {
  description: string;
}

export function ProductDescription({ description }: Props) {
  const html = renderMarkdown(description);

  return (
    <section className="border-t border-gray-200 pt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Product Description</h2>
      <div
        className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-indigo-600 prose-code:text-indigo-600 prose-pre:bg-gray-900 prose-pre:text-gray-100"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
