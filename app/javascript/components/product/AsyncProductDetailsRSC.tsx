// Server-only async component — streams below-the-fold product details.
// Markdown rendering (marked + highlight.js) happens here, never shipped to client.

import React from 'react';
import { ProductDescription } from './ProductDescription';
import { ProductFeatures } from './ProductFeatures';
import { ProductSpecs } from './ProductSpecs';

interface Props {
  getReactOnRailsAsyncProp: (propName: string) => Promise<any>;
}

export default async function AsyncProductDetailsRSC({ getReactOnRailsAsyncProp }: Props) {
  const details = await getReactOnRailsAsyncProp('product_details');

  return (
    <>
      <ProductDescription description={details.description} />
      <ProductFeatures features={details.features} />
      <ProductSpecs specs={details.specs} />
    </>
  );
}
