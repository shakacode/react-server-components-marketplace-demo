// No "use client" — this is a server component (RSC bundle)

import React, { Suspense } from 'react';
import { BlogPost } from '../../types/blog';
import { renderMarkdown } from '../../utils/renderMarkdown';
import { BlogPostHeader } from './BlogPostHeader';
import { InteractiveSection } from './InteractiveSection';
import { RelatedPostsSkeleton } from './RelatedPostsSkeleton';
import AsyncRelatedPostsRSC from './AsyncRelatedPostsRSC';

interface Props {
  post: BlogPost;
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function BlogPostRSC({ post, getReactOnRailsAsyncProp }: Props) {
  const html = renderMarkdown(post.content);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-6">
        V3: RSC Streaming — marked + highlight.js stay server-side, 0KB to client
      </p>

      <BlogPostHeader post={post} />

      <article
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <InteractiveSection />

      <Suspense fallback={<RelatedPostsSkeleton />}>
        <AsyncRelatedPostsRSC getReactOnRailsAsyncProp={getReactOnRailsAsyncProp} />
      </Suspense>
    </div>
  );
}
