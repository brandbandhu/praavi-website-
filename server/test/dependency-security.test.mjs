import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

// Import the real API with synthetic configuration and deny remote network I/O.
process.env.VERCEL = "1";
process.env.DOTENV_CONFIG_PATH = new URL("./nonexistent-test.env", import.meta.url).pathname;
process.env.SUPABASE_URL = "https://isolated-test.invalid";
process.env.SUPABASE_ANON_KEY = "synthetic-public-test-key";
process.env.JWT_SECRET = "synthetic-local-security-test-signing-key";
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input);
  assert.equal(url.hostname, "127.0.0.1", "tests must not contact external services");
  return originalFetch(input, init);
};
const { default: app } = await import("../dist/index.js");
const { prisma } = await import("../dist/lib/db.js");
const { signToken } = await import("../dist/lib/auth.js");
const record = { id: "fixture-type", name: "Website", unit: "page", department: "Web Dev", sortOrder: 0 };
let databaseCalls = [];
prisma.deliverableType.findMany = async (args) => { databaseCalls.push(args); return [record]; };
prisma.deliverableType.count = async () => 0;
prisma.deliverableType.create = async ({ data }) => ({ id: record.id, ...data });
let server;
let base;
const headersFor = (role = "accountant") => ({
  Authorization: `Bearer ${signToken({ userId: "fixture-user", email: "fixture@example.invalid", name: "Fixture", role })}`,
});
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  globalThis.fetch = originalFetch;
});

test("real API preserves routing, health, proxy defaults and upload authorization", async () => {
  assert.equal(app.get("trust proxy"), false);
  assert.equal(app.get("query parser"), "extended");
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
  assert.equal((await fetch(`${base}/api/nonexistent-fixture-route`)).status, 404);
  assert.equal((await fetch(`${base}/api/uploads/images`)).status, 405);
  const response = await fetch(`${base}/api/uploads/images`, {
    method: "POST", headers: { "x-upload-secret": "synthetic-obsolete-secret", "Content-Type": "multipart/form-data; boundary=broken" }, body: "invalid",
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Please sign in again." });
});

test("real API rejects missing/forged finance tokens and accepts a verified token", async () => {
  for (const headers of [{}, { Authorization: "Bearer forged-token" }]) {
    assert.equal((await fetch(`${base}/api/auth/me`, { headers })).status, 401);
  }
  const response = await fetch(`${base}/api/auth/me`, { headers: headersFor() });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.userId, "fixture-user");
});

test("real API preserves query filters and safely rejects hostile nested query values", async () => {
  databaseCalls = [];
  const response = await fetch(`${base}/api/deliverable-types?department=Web%20Dev&includeInactive=true`, { headers: headersFor() });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), [record]);
  assert.deepEqual(databaseCalls[0].where, { department: "Web Dev" });
  for (const query of ["department[]=Web%20Dev", "department[constructor][isBuffer]=x", "department[0][toString]=x"]) {
    assert.equal((await fetch(`${base}/api/deliverable-types?${query}`, { headers: headersFor() })).status, 400);
  }
  assert.equal(databaseCalls.length, 1);
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
});

test("real API preserves role checks, JSON validation and successful response shape", async () => {
  const post = (body, role = "accountant") => fetch(`${base}/api/deliverable-types`, {
    method: "POST", headers: { ...headersFor(role), "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const body = { name: record.name, unit: record.unit, department: record.department };
  assert.equal((await post(body, "cofounder")).status, 403);
  assert.equal((await post({ ...body, name: [] })).status, 400);
  const response = await post(body);
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), record);
  const invalidLogin = await fetch(`${base}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: [], password: [] }),
  });
  assert.equal(invalidLogin.status, 400);
  assert.deepEqual(await invalidLogin.json(), { error: "Invalid username or password" });
});

for (const [label, manifest] of [
  ["root", new URL("../../package.json", import.meta.url)],
  ["server", new URL("../package.json", import.meta.url)],
]) {
  test(`${label} proxy trust and qs advisory regressions`, () => {
    const require = createRequire(manifest);
    const proxyaddr = require("proxy-addr");
    assert.equal(proxyaddr.compile("::ffff:10.0.0.0/8")("203.0.113.7"), false);
    assert.equal(proxyaddr.compile("::ffff:10.0.0.0/104")("10.1.2.3"), true);
    const qs = require("qs");
    assert.throws(() => qs.parse("a[]=1,2,3,4", { comma: true, arrayLimit: 3, throwOnLimitExceeded: true }), RangeError);
    assert.doesNotThrow(() => qs.stringify(qs.parse("x[constructor][isBuffer]=y", { plainObjects: true })));
    for (const encodeValuesOnly of [false, true]) {
      assert.doesNotThrow(() => qs.stringify({ a: [{ toString: "x" }] }, { arrayFormat: "comma", encodeValuesOnly }));
    }
  });
}
