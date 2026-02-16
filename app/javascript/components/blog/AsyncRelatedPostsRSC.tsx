// No "use client" — this is a server component (RSC bundle)

import React from 'react';
import { RelatedPosts } from './RelatedPosts';

interface Props {
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function AsyncRelatedPostsRSC({ getReactOnRailsAsyncProp }: Props) {
  const data = await getReactOnRailsAsyncProp('related_posts');

  return <RelatedPosts posts={data.posts} />;
}
