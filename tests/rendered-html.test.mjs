import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("packages Toveli-owned sessions without preview metadata", async () => {
  const worker = await readFile(new URL("../dist/server/index.js", import.meta.url), "utf8");
  assert.match(worker, /toveli_session/);
  assert.doesNotMatch(worker, /codex-preview/);
});
