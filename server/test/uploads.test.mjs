import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import sharp from "sharp";
import { authorizeUpload, MAX_UPLOAD_BYTES, normalizeUpload, persistUpload, safeMediaUrl, UploadError } from "../dist/lib/uploads.js";
import { createUploadsRouter } from "../dist/routes/uploads.js";

const fakeSecret = "synthetic-server-credential-for-tests";
const png = await sharp({ create: { width: 8, height: 8, channels: 4, background: "#ff7700" } }).png().toBuffer();
const publicUrl = "https://media.praaviconsultants.in/uploads/blogs/image.webp";
const missingStorage = { storage: { from: () => ({ upload: async () => ({ error: new Error("unavailable") }) }) } };
const admin = { userId: "verified-user", client: missingStorage };
function authClient({ role = "admin", authError = false, roleError = false } = {}) {
  const calls = [];
  return { calls,
    auth: { getUser: async (token) => { calls.push(["verify", token]); return { data: { user: authError ? null : { id: "verified-user", user_metadata: { role: "admin" } } }, error: authError ? new Error(fakeSecret) : null }; } },
    from: (table) => { calls.push(["table", table]);
      const query = { select: () => query, eq: (field, value) => { calls.push([field, value]); return query; }, maybeSingle: async () => ({ data: role ? { role } : null, error: roleError ? new Error(fakeSecret) : null }) };
      return query;
    },
  };
}
async function withServer(deps, run) {
  const app = express(); app.use("/api/uploads", createUploadsRouter(deps));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try { await run(`http://127.0.0.1:${server.address().port}/api/uploads/images`); }
  finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
}
const form = (bytes = png, mime = "image/png", folder = "blogs") => {
  const body = new FormData(); body.append("folder", folder);
  body.append("file", new Blob([bytes], { type: mime }), "untrusted-name.png"); return body;
};
const authorized = { Authorization: "Bearer admin-token" };

test("verifies Supabase identity and the database admin role rather than user metadata", async () => {
  const client = authClient();
  assert.equal((await authorizeUpload("session-token", client)).userId, "verified-user");
  assert.deepEqual(client.calls, [["verify", "session-token"], ["table", "profiles"], ["id", "verified-user"]]);
  for (const role of ["editor", "authenticated", null]) await assert.rejects(authorizeUpload("session-token", authClient({ role })), (error) => error.status === 403);
  await assert.rejects(authorizeUpload("expired-token", authClient({ authError: true })), (error) => error.status === 401);
  await assert.rejects(authorizeUpload("session-token", authClient({ roleError: true })), (error) => error.status === 503 && !error.message.includes(fakeSecret));
});
test("rejects missing, malformed and forged sessions before parsing or processing files", async () => {
  let authCalls = 0; let processed = 0;
  await withServer({ authorize: async () => { authCalls++; throw new UploadError(401, "Please sign in again."); }, normalize: async () => { processed++; return png; } }, async (url) => {
    for (const header of [undefined, "Basic fake", "Bearer invalid-token"]) {
      const response = await fetch(url, { method: "POST", headers: { ...(header ? { Authorization: header } : {}), "Content-Type": "multipart/form-data; boundary=broken" }, body: "malformed body" });
      assert.equal(response.status, 401); assert.ok(!(await response.text()).includes(fakeSecret));
    }
  });
  assert.equal(authCalls, 1); assert.equal(processed, 0);
});
test("rejects authenticated non-admins without forwarding files", async () => {
  let forwarded = 0;
  await withServer({ authorize: async () => { throw new UploadError(403, "Administrator access is required."); }, persist: async () => { forwarded++; return publicUrl; } }, async (url) => {
    assert.equal((await fetch(url, { method: "POST", headers: authorized, body: form() })).status, 403);
  }); assert.equal(forwarded, 0);
});
test("uploads authorized images for blogs, works, clients and case studies", async () => {
  let forwarded = 0;
  await withServer({ authorize: async () => admin, persist: async (bytes, folder) => { forwarded++; assert.equal((await sharp(bytes).metadata()).format, "webp"); return `https://media.praaviconsultants.in/uploads/${folder}/image.webp`; } }, async (url) => {
    for (const folder of ["blogs", "works", "clients", "case-studies"]) {
      const response = await fetch(url, { method: "POST", headers: authorized, body: form(png, "image/png", folder) });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).url, `https://media.praaviconsultants.in/uploads/${folder}/image.webp`);
      assert.equal(response.headers.get("cache-control"), "no-store");
    }
  }); assert.equal(forwarded, 4);
});
test("enforces byte size, MIME, folder, file count and multipart limits", async () => {
  await withServer({ authorize: async () => admin, persist: async () => publicUrl }, async (url) => {
    for (const [body, expected] of [[form(Buffer.alloc(MAX_UPLOAD_BYTES + 1)), 413], [form(png, "application/octet-stream"), 415], [form(png, "image/png", "../private"), 400], [form(Buffer.from("not a PNG")), 422]]) {
      assert.equal((await fetch(url, { method: "POST", headers: authorized, body })).status, expected);
    }
    const extra = form(); extra.append("file", new Blob([png], { type: "image/png" }), "second.png");
    assert.equal((await fetch(url, { method: "POST", headers: authorized, body: extra })).status, 400);
    assert.equal((await fetch(url, { method: "POST", headers: { ...authorized, "Content-Type": "application/json" }, body: "{}" })).status, 415);
  });
});
test("decodes JPG, PNG, WebP and SVG, rejecting spoofed, active and oversized inputs", async () => {
  for (const [format, mime] of [["jpeg", "image/jpeg"], ["png", "image/png"], ["webp", "image/webp"]]) assert.equal((await sharp(await normalizeUpload(await sharp(png)[format]().toBuffer(), mime)).metadata()).format, "webp");
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="red"/></svg>';
  assert.equal((await sharp(await normalizeUpload(Buffer.from(svg), "image/svg+xml")).metadata()).format, "webp");
  for (const unsafe of [svg.replace("<rect", '<script>alert(1)</script><rect'), svg.replace("<rect", '<image href="https://example.com/a.png"/><rect'), svg.replace("<rect", '<foreignObject><body/></foreignObject><rect'), '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]>' + svg]) await assert.rejects(normalizeUpload(Buffer.from(unsafe), "image/svg+xml"), (error) => error.status === 422);
  await assert.rejects(normalizeUpload(png, "image/jpeg"), (error) => error.status === 422);
  await assert.rejects(normalizeUpload(Buffer.from(svg.replace('width="20"', 'width="10001"')), "image/svg+xml"), (error) => error.status === 422);
});
test("only the backend sends the private upstream credential; redirects are forbidden", async () => {
  const image = await normalizeUpload(png, "image/png"); let called = false;
  const result = await persistUpload(image, "blogs", admin, { UPLOAD_API_URL: "https://praaviconsultants.in/api/upload.php", UPLOAD_API_SECRET: fakeSecret }, async (_url, options) => {
    called = true; assert.deepEqual(options.headers, { "x-upload-secret": fakeSecret }); assert.equal(options.redirect, "error");
    assert.equal(options.body.get("folder"), "blogs"); const file = options.body.get("file");
    assert.equal(file.type, "image/webp"); assert.match(file.name, /^[a-f0-9-]+\.webp$/);
    return Response.json({ url: publicUrl });
  }); assert.ok(called); assert.equal(result, publicUrl); assert.ok(!result.includes(fakeSecret));
});
test("preserves authorized Storage and embedded fallbacks without upstream error disclosure", async () => {
  const image = await normalizeUpload(png, "image/png");
  const context = { userId: "verified-user", client: { storage: { from: (bucket) => {
    assert.equal(bucket, "case-study-images");
    return { upload: async (path, bytes, options) => { assert.ok(path.startsWith("works/")); assert.equal(options.contentType, "image/webp"); return { error: null }; }, getPublicUrl: () => ({ data: { publicUrl: "https://test.supabase.co/storage/v1/object/public/case-study-images/works/image.webp" } }) };
  } } } };
  const env = { SUPABASE_URL: "https://test.supabase.co", UPLOAD_API_URL: "https://praaviconsultants.in/api/upload.php", UPLOAD_API_SECRET: fakeSecret };
  const failing = async () => new Response(fakeSecret, { status: 500 });
  assert.ok((await persistUpload(image, "works", context, env, failing, context.client)).startsWith("https://test.supabase.co/storage/"));
  const inline = await persistUpload(image, "blogs", admin, env, failing);
  assert.match(inline, /^data:image\/webp;base64,/); assert.ok(inline.length <= 1_500_000); assert.ok(!inline.includes(fakeSecret));
});
test("rejects unsafe upstream URLs and suppresses credential-bearing errors", async () => {
  for (const url of ["javascript:alert(1)", "http://media.praaviconsultants.in/uploads/blogs/a.webp", "https://evil.example/uploads/blogs/a.webp", "https://media.praaviconsultants.in/uploads/blogs/a.webp?secret=x", "https://media.praaviconsultants.in/uploads/clients/a.webp"]) assert.equal(safeMediaUrl(url, "blogs"), undefined);
  await withServer({ authorize: async () => { throw new Error(fakeSecret); } }, async (url) => {
    const response = await fetch(url, { method: "POST", headers: authorized, body: form() });
    assert.equal(response.status, 503); assert.ok(!(await response.text()).includes(fakeSecret));
  });
});
test("rate limits authenticated users and resets the window", async () => {
  let time = 0;
  await withServer({ authorize: async () => admin, persist: async () => publicUrl, now: () => time }, async (url) => {
    for (let i = 0; i < 10; i++) assert.equal((await fetch(url, { method: "POST", headers: authorized, body: form() })).status, 200);
    const limited = await fetch(url, { method: "POST", headers: authorized, body: form() });
    assert.equal(limited.status, 429); assert.equal(limited.headers.get("retry-after"), "60");
    time = 60001; assert.equal((await fetch(url, { method: "POST", headers: authorized, body: form() })).status, 200);
  });
});
