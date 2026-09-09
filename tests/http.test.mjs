import test from 'node:test';
import assert from 'node:assert/strict';
import { sameOrigin, boundedJson } from '../lib/http.ts';

test('origin checks accept the configured Render URL and reject other origins', () => {
  const previous = { app: process.env.APP_ORIGIN, render: process.env.RENDER_EXTERNAL_URL };
  try {
    delete process.env.APP_ORIGIN;
    process.env.RENDER_EXTERNAL_URL = 'https://toveli.example.test';
    const req = origin => new Request('http://internal:10000/api/social', { headers: origin ? { origin } : {} });
    assert.equal(sameOrigin(req('https://toveli.example.test')), true);
    assert.equal(sameOrigin(req('https://evil.example.test')), false);
    assert.equal(sameOrigin(req()), false);
    assert.equal(sameOrigin(req('not a URL')), false);
    process.env.APP_ORIGIN = 'https://custom.example.test';
    assert.equal(sameOrigin(req('https://custom.example.test')), true);
    assert.equal(sameOrigin(req('https://toveli.example.test')), false);
  } finally {
    if (previous.app === undefined) delete process.env.APP_ORIGIN; else process.env.APP_ORIGIN = previous.app;
    if (previous.render === undefined) delete process.env.RENDER_EXTERNAL_URL; else process.env.RENDER_EXTERNAL_URL = previous.render;
  }
});
test('bounded JSON rejects oversized bodies without trusting Content-Length', async () => {
  const req = body => new Request('http://localhost/api/social', { method: 'POST', body });
  assert.deepEqual(await boundedJson(req('{"ok":true}')), { ok: true });
  await assert.rejects(boundedJson(req('x'.repeat(101)), 100), /too large/);
  await assert.rejects(boundedJson(req('not json')), SyntaxError);
});
