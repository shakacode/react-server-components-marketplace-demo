#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { formatDiffTable } from './lib/formatters.mjs';

const { positionals } = parseArgs({
  allowPositionals: true,
  strict: false,
});

if (positionals.length < 2) {
  console.error('Usage: node scripts/compare-vitals.mjs <before.json> <after.json>');
  process.exit(1);
}

async function main() {
  const [beforePath, afterPath] = positionals;

  const before = JSON.parse(await readFile(beforePath, 'utf-8'));
  const after = JSON.parse(await readFile(afterPath, 'utf-8'));

  console.log('\nWeb Vitals Comparison');
  console.log('====================\n');
  console.log(`Before: ${before.metadata.label || beforePath}`);
  console.log(`  Date: ${before.metadata.timestamp}`);
  console.log(`After:  ${after.metadata.label || afterPath}`);
  console.log(`  Date: ${after.metadata.timestamp}`);
  console.log('');

  console.log(formatDiffTable(before, after));
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
