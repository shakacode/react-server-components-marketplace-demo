'use client';

import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { loadableReady } from '@loadable/component';
import ProductSearchClient from '../components/product-search/ProductSearchClient';

const App = (props: Record<string, unknown>, _railsContext: Record<string, unknown>, domNodeId: string) => {
  loadableReady(() => {
    const el = document.getElementById(domNodeId);
    if (el) {
      hydrateRoot(el, <ProductSearchClient {...props as any} />);
    }
  });
};

export default App;
