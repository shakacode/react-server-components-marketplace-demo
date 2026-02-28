// No 'use client' — server component that awaits streamed review snippets.

import React from 'react';
import type { ReviewSnippet } from './types';

interface Props {
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function AsyncReviewSnippetsRSC({ getReactOnRailsAsyncProp }: Props) {
  const data = await getReactOnRailsAsyncProp('review_snippets');
  const snippets: Record<number, ReviewSnippet> = data.snippets || {};

  // This component doesn't render visible content on its own.
  // The review snippets are consumed by the results grid above.
  // We render a hidden marker to confirm streaming completed.
  return (
    <div data-review-snippets-loaded="true" className="hidden" aria-hidden="true">
      {Object.keys(snippets).length} review snippets loaded
    </div>
  );
}
