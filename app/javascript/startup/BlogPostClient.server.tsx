'use client';

import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ChunkExtractor } from '@loadable/server';
import BlogPostClient from '../components/blog/BlogPostClient';

const serverApp = (props: Record<string, unknown>, _railsContext: Record<string, unknown>) => {
  // React on Rails Pro copies loadable-stats.json to the same directory as server-bundle.js
  const statsFile = path.resolve(__dirname, 'loadable-stats.json');
  const extractor = new ChunkExtractor({ entrypoints: ['client-bundle'], statsFile });

  const componentHtml = renderToString(
    extractor.collectChunks(<BlogPostClient {...props as any} />)
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
