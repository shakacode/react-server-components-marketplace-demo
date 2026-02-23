// No 'use client' — this is a server component (RSC bundle).

import React from 'react';
import { RelatedProducts } from './RelatedProducts';

interface Props {
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function AsyncRelatedProductsRSC({ getReactOnRailsAsyncProp }: Props) {
  const data = await getReactOnRailsAsyncProp('related_products');

  return <RelatedProducts products={data.products} />;
}
