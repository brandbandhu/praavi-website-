import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { FINANCE_COLLECTION_LIMITS as limits, FINANCE_JSON_BODY_LIMIT_BYTES as byteLimit, financeCollectionLimitError } from "../dist/lib/financeCollectionLimits.js";
import { BUCKET_NAMES } from "../dist/lib/types.js";

process.env.VERCEL = "1";
process.env.DOTENV_CONFIG_PATH = new URL("./nonexistent-test.env", import.meta.url).pathname;
process.env.SUPABASE_URL = "https://isolated-test.invalid";
process.env.SUPABASE_ANON_KEY = "synthetic-public-test-key";
process.env.JWT_SECRET = "synthetic-local-finance-test-key";
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  assert.equal(new URL(input instanceof Request ? input.url : input).hostname, "127.0.0.1");
  return originalFetch(input, init);
};

// Install spies before the real route schemas bind safeParse. This verifies
// oversized HTTP bodies never enter Zod, not just that they return a 400.
let parses = 0;
let objectParses = 0;
let issues = 0;
const originalSafeParse = z.ZodType.prototype.safeParse;
const originalObjectParse = z.ZodObject.prototype._parse;
z.ZodType.prototype.safeParse = function (...args) {
  parses++;
  const result = originalSafeParse.apply(this, args);
  if (!result.success) issues += result.error.issues.length;
  return result;
};
z.ZodObject.prototype._parse = function (...args) {
  objectParses++;
  return originalObjectParse.apply(this, args);
};
const { default: app } = await import("../dist/index.js");
const { prisma } = await import("../dist/lib/db.js");
const { signToken } = await import("../dist/lib/auth.js");
let server;
let base;
let calls = [];
let storedPackage;
let storedQuote;
const item = { deliverableTypeId: "type-1", included: true, quantity: 2 };
const lineItem = { description: "Website", amountPaise: 10000 };
const type = { id: "type-1", name: "Page", unit: "page", sortOrder: 0 };
const note = (name, args) => { calls.push({ name, args }); };
const packageRecord = (data, previous = {}) => ({
  ...previous, ...data, id: "package-1",
  items: data.items ? data.items.create.map((row) => ({ ...row, deliverableType: type })) : previous.items ?? [],
});
const quoteRecord = (data, previous = {}) => ({
  ...previous, ...data, id: "quote-1",
  lineItems: data.lineItems ? data.lineItems.create : previous.lineItems ?? [],
  deliverables: data.deliverables ? data.deliverables.create : previous.deliverables ?? [],
});
prisma.$transaction = async (fn) => fn(prisma);
prisma.deliverableType.findMany = async (args) => { note("types", args); return [type]; };
prisma.quotationPackage.count = async () => { note("package.count"); return 0; };
prisma.quotationPackage.findUnique = async () => { note("package.find"); return storedPackage; };
prisma.quotationPackage.create = async ({ data }) => { note("package.create", data); return storedPackage = packageRecord(data); };
prisma.quotationPackage.update = async ({ data }) => { note("package.update", data); return storedPackage = packageRecord(data, storedPackage); };
prisma.quotation.count = async () => { note("quote.count"); return 0; };
prisma.quotation.findUnique = async () => { note("quote.find"); return storedQuote; };
prisma.quotation.create = async ({ data }) => { note("quote.create", data); return storedQuote = quoteRecord(data); };
prisma.quotation.update = async ({ data }) => { note("quote.update", data); return storedQuote = quoteRecord(data, storedQuote); };
for (const name of ["quotationPackageItem", "quotationLineItem", "quotationDeliverable"]) {
  prisma[name].deleteMany = async (args) => { note(`${name}.delete`, args); return { count: 0 }; };
}
prisma.activityLog.create = async () => { note("activity"); return {}; };
prisma.bucketConfigVersion.create = async ({ data }) => {
  note("bucket.create", data);
  return { ...data, id: "version-1", entries: data.entries.create };
};
const token = (role) => signToken({ userId: "fixture-user", email: "fixture@example.invalid", name: "Fixture", role });
const send = (method, path, body, role = "accountant") => fetch(base + path, {
  method, headers: { "Content-Type": "application/json", ...(role ? { Authorization: `Bearer ${token(role)}` } : {}) },
  body: JSON.stringify(body),
});
const scenarios = [
  { method: "POST", path: "/api/quotation-packages", field: "items" },
  { method: "PUT", path: "/api/quotation-packages/package-1", field: "items" },
  { method: "POST", path: "/api/quotations", field: "lineItems" },
  { method: "PUT", path: "/api/quotations/quote-1", field: "lineItems" },
  { method: "POST", path: "/api/quotations", field: "deliverables" },
  { method: "PUT", path: "/api/quotations/quote-1", field: "deliverables" },
  { method: "POST", path: "/api/bucket-config", field: "entries", role: "founder" },
];
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(() => {
  parses = objectParses = issues = 0;
  calls = [];
  storedPackage = packageRecord({ name: "Original", department: "Web Dev", items: { create: [item] } });
  storedQuote = quoteRecord({ clientName: "Original", department: "Web Dev", lineItems: { create: [lineItem] } });
});
after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  z.ZodType.prototype.safeParse = originalSafeParse;
  z.ZodObject.prototype._parse = originalObjectParse;
  globalThis.fetch = originalFetch;
});

test("metadata guard preserves missing, wrong-type, empty and within-limit values for existing schemas", () => {
  for (const body of [undefined, null, [], "invalid", {}, { items: null }, { items: "invalid" }, { items: [] }]) {
    assert.equal(financeCollectionLimitError(body, ["items"]), undefined);
  }
  for (const field of Object.keys(limits)) {
    assert.equal(financeCollectionLimitError({ [field]: new Array(limits[field]) }, [field]), undefined);
    assert.equal(typeof financeCollectionLimitError({ [field]: new Array(limits[field] + 1) }, [field]), "string");
  }
});

test("guard rejects maximum-length sparse arrays with one length read and no element access", () => {
  for (const field of Object.keys(limits)) {
    let reads = 0;
    const huge = new Proxy(new Array(0xffffffff), {
      get(target, key) {
        assert.equal(key, "length", "guard must not inspect elements or iterate the array");
        reads++;
        return Reflect.get(target, key);
      },
    });
    assert.equal(typeof financeCollectionLimitError({ [field]: huge }, [field]), "string");
    assert.equal(reads, 1);
  }
  assert.equal(parses, 0);
});

test("caps preserve every collection of valid records that can fit the existing decoded JSON budget", () => {
  const minimum = {
    items: { deliverableTypeId: "", included: true, quantity: 0 },
    deliverables: { deliverableTypeId: "", included: true, quantity: 0 },
    lineItems: { description: "a", amountPaise: 1 },
  };
  for (const [field, value] of Object.entries(minimum)) {
    const records = Array(limits[field] + 1).fill(value);
    assert.ok(Buffer.byteLength(JSON.stringify({ [field]: records })) > byteLimit);
    // Find the largest valid collection fitting the actual envelope.
    while (Buffer.byteLength(JSON.stringify({ [field]: records })) > byteLimit) records.pop();
    assert.equal(financeCollectionLimitError({ [field]: records }, [field]), undefined);
  }
  assert.equal(limits.entries, BUCKET_NAMES.length);
});

test("all seven create/update collection paths reject oversized HTTP arrays before any Zod or DB call", async () => {
  for (const scenario of scenarios) {
    const body = { [scenario.field]: Array(limits[scenario.field] + 1).fill(null) };
    assert.ok(Buffer.byteLength(JSON.stringify(body)) < byteLimit, "exercise the guard, not Express's byte limit");
    const response = await send(scenario.method, scenario.path, body, scenario.role);
    assert.equal(response.status, 400, `${scenario.method} ${scenario.path}: ${scenario.field}`);
    assert.deepEqual(await response.json(), { error: financeCollectionLimitError(body, [scenario.field]) });
    assert.equal(parses, 0);
    assert.equal(objectParses, 0);
    assert.equal(calls.length, 0);
  }
});

test("valid package create/update preserve normalization, response status and response fields", async () => {
  const create = await send("POST", "/api/quotation-packages", { name: "Package", department: "Web Dev", items: [item] });
  assert.equal(create.status, 201);
  const created = await create.json();
  assert.equal(created.name, "Package");
  assert.deepEqual(created.items[0], { ...item, deliverableType: type });
  const changed = { ...item, included: false, quantity: 99 };
  const update = await send("PUT", "/api/quotation-packages/package-1", { name: "Updated", items: [changed] });
  assert.equal(update.status, 200);
  const updated = await update.json();
  assert.equal(updated.name, "Updated");
  assert.equal(updated.items[0].quantity, 0);
  assert.equal(parses, 2, "valid payloads still enter the existing schemas");
});

test("valid quotation line-item create/update preserve totals and response arrays", async () => {
  const create = await send("POST", "/api/quotations", { clientName: "Client", department: "Web Dev", lineItems: [lineItem] });
  assert.equal(create.status, 201);
  const created = await create.json();
  assert.equal(created.totalAmountPaise, lineItem.amountPaise);
  assert.deepEqual(created.lineItems, [{ ...lineItem, sortOrder: 0 }]);
  assert.deepEqual(created.deliverables, []);
  const update = await send("PUT", "/api/quotations/quote-1", { lineItems: [{ ...lineItem, amountPaise: 25000 }] });
  assert.equal(update.status, 200);
  assert.equal((await update.json()).totalAmountPaise, 25000);
  assert.equal(parses, 2);
});

test("valid quotation deliverable create/update preserve snapshot data and total pricing", async () => {
  const create = await send("POST", "/api/quotations", { clientName: "Client", department: "Web Dev", deliverables: [item], totalAmountPaise: 50000 });
  assert.equal(create.status, 201);
  const created = await create.json();
  assert.deepEqual(created.deliverables, [{ ...item, name: type.name, unit: type.unit, sortOrder: 0 }]);
  const update = await send("PUT", "/api/quotations/quote-1", { deliverables: [{ ...item, quantity: 3 }], totalAmountPaise: 60000 });
  assert.equal(update.status, 200);
  const updated = await update.json();
  assert.equal(updated.totalAmountPaise, 60000);
  assert.equal(updated.deliverables[0].quantity, 3);
  assert.equal(parses, 2);
});

test("six valid bucket entries publish unchanged and short/wrong-type arrays retain existing errors", async () => {
  const entries = BUCKET_NAMES.map((bucketName, i) => ({ bucketName, percent: [56, 19, 2, 8, 7, 8][i] }));
  const response = await send("POST", "/api/bucket-config", { entries, effectiveFrom: "2026-01-01T00:00:00.000Z" }, "founder");
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.versionId, "version-1");
  assert.equal(result.effectiveFrom, "2026-01-01T00:00:00.000Z");
  assert.deepEqual(result.entries.map(({ bucketName, percentageBps }) => ({ bucketName, percentageBps })), entries.map(({ bucketName, percent }) => ({ bucketName, percentageBps: percent * 100 })));
  for (const [value, error] of [[entries.slice(0, 5), "Array must contain exactly 6 element(s)"], ["wrong", "Expected array, received string"]]) {
    const invalid = await send("POST", "/api/bucket-config", { entries: value }, "founder");
    assert.equal(invalid.status, 400);
    assert.deepEqual(await invalid.json(), { error });
  }
  assert.equal(parses, 3);
});

test("optional omitted collections, empty collections and ordinary invalid payloads retain schema behavior", async () => {
  for (const [path, body] of [["/api/quotation-packages/package-1", { name: "Renamed" }], ["/api/quotations/quote-1", { notes: "Updated" }], ["/api/quotation-packages/package-1", { items: [] }], ["/api/quotations/quote-1", { lineItems: [] }]]) {
    assert.equal((await send("PUT", path, body)).status, 200);
  }
  const invalid = await send("POST", "/api/quotation-packages", { name: "Package", department: "Web Dev", items: "wrong" });
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: "Expected array, received string" });
  assert.equal(parses, 5);
});

test("authentication and finance roles remain enforced before collection guards", async () => {
  for (const [role, expected] of [[null, 401], ["cofounder", 403]]) {
    const response = await send("POST", "/api/quotation-packages", { items: Array(limits.items + 1).fill(null) }, role);
    assert.equal(response.status, expected);
  }
  assert.equal(parses, 0);
  assert.equal(calls.length, 0);
});

test("boundary invalid collections have bounded Zod work and repeated oversized requests do none", async () => {
  for (const scenario of scenarios) {
    parses = objectParses = issues = 0;
    const body = { name: "Package", clientName: "Client", department: "Web Dev", [scenario.field]: Array(limits[scenario.field]).fill({}) };
    assert.equal((await send(scenario.method, scenario.path, body, scenario.role)).status, 400);
    assert.equal(parses, 1);
    assert.equal(objectParses, limits[scenario.field] + 1, "only the bounded collection plus root is visited");
    const requiredFields = { items: 3, lineItems: 2, deliverables: 3, entries: 2 };
    assert.equal(issues, limits[scenario.field] * requiredFields[scenario.field]);
  }
  parses = objectParses = issues = 0;
  for (let i = 0; i < 25; i++) {
    assert.equal((await send("POST", "/api/quotations", { lineItems: Array(limits.lineItems + 1).fill(null) })).status, 400);
  }
  assert.equal(parses, 0);
  assert.equal(objectParses, 0);
  assert.equal(issues, 0);
  assert.equal((await fetch(base + "/api/health")).status, 200);
});
