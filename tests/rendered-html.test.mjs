import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses Toveli-owned sessions without platform-specific identity", async () => {
  const auth = await readFile(new URL("../app/auth.ts", import.meta.url), "utf8");
  assert.match(auth, /toveli_session/);
  assert.doesNotMatch(auth, /cloudflare:|oai-authenticated/);
});
