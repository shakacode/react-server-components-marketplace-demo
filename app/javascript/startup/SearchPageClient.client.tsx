'use client';

import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { loadableReady } from '@loadable/component';
import SearchPageClient from '../components/search/SearchPageClient';

const App = (props: Record<string, unknown>, _railsContext: Record<string, unknown>, domNodeId: string) => {
  loadableReady(() => {
    const el = document.getElementById(domNodeId);
    if (el) {
      hydrateRoot(el, <SearchPageClient {...props as any} />);
    }
  });
};

export default App;
