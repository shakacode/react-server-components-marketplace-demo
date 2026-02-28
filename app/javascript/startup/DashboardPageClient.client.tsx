'use client';

import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { loadableReady } from '@loadable/component';
import DashboardPageClient from '../components/dashboard/DashboardPageClient';

const App = (props: Record<string, unknown>, _railsContext: Record<string, unknown>, domNodeId: string) => {
  loadableReady(() => {
    const el = document.getElementById(domNodeId);
    if (el) {
      hydrateRoot(el, <DashboardPageClient {...props as any} />);
    }
  });
};

export default App;
