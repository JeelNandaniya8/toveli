import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

async function readCssTree(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const contents = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return readCssTree(entryPath);
    return entry.name.endsWith('.css') ? readFile(entryPath, 'utf8') : '';
  }));
  return contents.join('\n');
}

test('production CSS keeps the finite-feed and reduced-motion contracts', async () => {
  const css = await readCssTree(path.join(root, '.next', 'static'));
  assert.match(css, /v3-end/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /scrollbar-width:\s*none/);
});

test('Render blueprint uses Node and PostgreSQL', async () => {
  const blueprint = await readFile(path.join(root, 'render.yaml'), 'utf8');
  assert.match(blueprint, /runtime:\s*node/);
  assert.match(blueprint, /DATABASE_URL/);
  assert.match(blueprint, /npm run db:migrate/);
  assert.doesNotMatch(blueprint, /cloudflare|wrangler/i);
});
