'use client';

import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ChunkExtractor } from '@loadable/server';
import ProductPageClient from '../components/product/ProductPageClient';

const serverApp = (props: Record<string, unknown>, _railsContext: Record<string, unknown>) => {
  const statsFile = path.resolve(__dirname, 'loadable-stats.json');
  const extractor = new ChunkExtractor({ entrypoints: ['client-bundle'], statsFile });

  const componentHtml = renderToString(
    extractor.collectChunks(<ProductPageClient {...props as any} />)
  );

  return {
    renderedHtml: {
      componentHtml,
      linkTags: extractor.getLinkTags(),
      styleTags: extractor.getStyleTags(),
      scriptTags: extractor.getScriptTags(),
    },
  };
};

export default serverApp;
