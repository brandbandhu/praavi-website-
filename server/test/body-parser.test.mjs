import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { gzipSync } from "node:zlib";

// Isolate the server so an asynchronous decompression crash fails the test
// rather than terminating the test runner. Exercise both deployment trees.
const serverCode = `
  const express = require(process.argv[1]);
  const app = express();
  app.use(express.json());
  app.post('/echo', (req, res) => res.json(req.body));
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use((err, _req, res, _next) => res.status(err.status || 500).json({ error: 'Invalid body' }));
  const server = app.listen(0, '127.0.0.1', () => process.send(server.address().port));
`;

for (const [label, manifest] of [
  ["root", new URL("../../package.json", import.meta.url)],
  ["server", new URL("../package.json", import.meta.url)],
]) {
  test(`${label} JSON parser survives compressed bodies with trailing bytes`, { timeout: 15000 }, async () => {
    const require = createRequire(manifest);
    const child = spawn(process.execPath, ["--eval", serverCode, require.resolve("express")], {
      stdio: ["ignore", "ignore", "ignore", "ipc"],
    });
    try {
      const [port] = await once(child, "message", { signal: AbortSignal.timeout(5000) });
      const url = `http://127.0.0.1:${port}`;
      const json = JSON.stringify({ preserved: "upload and finance JSON clients" });
      for (const compressed of [false, true]) {
        const response = await fetch(`${url}/echo`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(compressed ? { "Content-Encoding": "gzip" } : {}) },
          body: compressed ? gzipSync(json) : json,
        });
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), JSON.parse(json));
      }
      for (const body of [
        Buffer.concat([gzipSync(json), Buffer.from("trailing bytes")]),
        Buffer.concat([gzipSync(json), Buffer.from([0x1f, 0x8b, 0x08])]),
      ]) {
        const response = await fetch(`${url}/echo`, {
          method: "POST", headers: { "Content-Type": "application/json", "Content-Encoding": "gzip" }, body,
        });
        assert.ok([200, 400].includes(response.status));
        await response.text();
        // Allow late decoder errors to fire before checking process health.
        await delay(150);
        assert.equal(child.exitCode, null, "compressed request must not terminate the API");
        const health = await fetch(`${url}/health`);
        assert.equal(health.status, 200);
        assert.deepEqual(await health.json(), { ok: true });
      }
    } finally {
      if (child.exitCode === null && child.signalCode === null) {
        const closed = once(child, "exit");
        child.kill();
        await closed;
      }
    }
  });
}
