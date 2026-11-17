import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse } from "dotenv";

const secrets = new Set();
const privateKeys = ["UPLOAD_API_SECRET", "VITE_UPLOAD_API_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET"];
for (const key of privateKeys) if (process.env[key]) secrets.add(process.env[key]);
for (const file of [".env", ".env.local", ".env.production", ".env.production.local", "server/.env"]) {
  try {
    const env = parse(await readFile(file));
    for (const key of privateKeys) if (env[key]) secrets.add(env[key]);
  } catch (error) { if (error.code !== "ENOENT") throw error; }
}
async function walk(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await walk(file));
    else if (/\.(?:js|mjs|map|html|json)$/i.test(entry.name)) found.push(file);
  }
  return found;
}
const findings = [];
const artifacts = await walk("dist");
for (const file of artifacts) {
  const body = await readFile(file, "utf8");
  if (/VITE_UPLOAD_API_SECRET|x-upload-secret/i.test(body)) findings.push({ file, reason: "private upload authorization marker" });
  for (const value of secrets) {
    if (value.length >= 8 && (body.includes(value) || body.includes(JSON.stringify(value).slice(1, -1)))) findings.push({ file, reason: "configured server credential (redacted)" });
  }
}
if (findings.length) {
  console.error("Browser artifact security check failed:", JSON.stringify(findings));
  process.exitCode = 1;
} else {
  console.log(`Browser artifact security check passed: ${artifacts.length} text artifacts; no upload authorization markers or configured private server credential values found.`);
}
