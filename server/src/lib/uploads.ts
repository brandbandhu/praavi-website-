import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const UPLOAD_FOLDERS = ["blogs", "works", "clients", "case-studies"] as const;
export type UploadFolder = typeof UPLOAD_FOLDERS[number];
export const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpeg"], ["image/png", "png"],
  ["image/webp", "webp"], ["image/svg+xml", "svg"],
]);

export class UploadError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export interface UploadAdmin { userId: string }

const createUploadClient = (token: string) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new UploadError(503, "Upload service is unavailable. Try again later.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }),
    },
  });
};

// Validate with the Auth server, then read the protected database role. Never
// trust a decoded token, browser session flags, or user-editable user_metadata.
export async function authorizeUpload(token: string, client = createUploadClient(token)): Promise<UploadAdmin> {
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new UploadError(401, "Please sign in again.");
  const { data: profile, error: roleError } = await client.from("profiles")
    .select("role").eq("id", data.user.id).maybeSingle();
  if (roleError) throw new UploadError(503, "Upload service is unavailable. Try again later.");
  if (profile?.role !== "admin") throw new UploadError(403, "Administrator access is required.");
  return { userId: data.user.id };
}

export async function normalizeUpload(buffer: Buffer, mime: string): Promise<Buffer> {
  if (!buffer.length || buffer.length > MAX_UPLOAD_BYTES) throw new UploadError(413, "Images must be between 1 byte and 4 MB.");
  const expected = IMAGE_TYPES.get(mime);
  if (!expected) throw new UploadError(415, "Use JPG, PNG, WebP, or SVG images.");
  const signaturesMatch = expected === "jpeg" ? buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    : expected === "png" ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : expected === "webp" ? buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP"
    : /^\s*(?:<\?xml[\s\S]*?\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg(?:\s|>)/i.test(buffer.toString("utf8"));
  if (!signaturesMatch) throw new UploadError(422, "The image content does not match its declared type.");
  if (expected === "svg") {
    const svg = buffer.toString("utf8");
    const references = [...svg.matchAll(/\b(?:href|src)\s*=\s*(["'])([\s\S]*?)\1/gi)].map((match) => match[2].trim());
    const urls = [...svg.matchAll(/url\s*\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi)].map((match) => (match[1] ?? match[2] ?? match[3]).trim());
    if (/<!DOCTYPE|<!ENTITY|@import|xml:base|<\s*(?:script|foreignObject)\b|\bon\w+\s*=/i.test(svg) || [...references, ...urls].some((ref) => !/^#[\w:.-]+$/.test(ref))) {
      throw new UploadError(422, "SVG images must not contain scripts or external resources.");
    }
  }
  try {
    const options = { limitInputPixels: 40_000_000, failOn: "warning" as const, sequentialRead: true };
    const metadata = await sharp(buffer, options).timeout({ seconds: 5 }).metadata();
    if (metadata.format !== expected || !metadata.width || !metadata.height || metadata.width > 10000 || metadata.height > 10000 || (metadata.pages ?? 1) > 1) throw new Error("Invalid image");
    return await sharp(buffer, options).rotate()
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 }).timeout({ seconds: 5 }).toBuffer();
  } catch {
    throw new UploadError(422, "The image is invalid, too large in pixels, or unsupported.");
  }
}

async function limitedJson(response: Response): Promise<{ url?: unknown }> {
  if (!response.ok || !response.body) throw new Error("Upstream unavailable");
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.length;
      if (length > 16384) throw new Error("Upstream response too large");
      chunks.push(Buffer.from(chunk.value));
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

export function safeMediaUrl(value: unknown, folder: UploadFolder, publicOrigin?: string): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    const origins = publicOrigin ? [new URL(publicOrigin).origin] : [
      "https://media.praaviconsultants.in", "https://www.praaviconsultants.in", "https://praaviconsultants.in",
    ];
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || !origins.includes(url.origin)) return undefined;
    if (!new RegExp(`^/uploads/${folder}/[a-zA-Z0-9_-]+\\.webp$`).test(url.pathname)) return undefined;
    return url.href;
  } catch { return undefined; }
}

export async function persistUpload(buffer: Buffer, folder: UploadFolder, _admin: UploadAdmin, env = process.env, fetchUpstream: typeof fetch = fetch, storageClient?: SupabaseClient): Promise<string> {
  const filename = `${randomUUID()}.webp`;
  if (env.UPLOAD_API_URL && env.UPLOAD_API_SECRET) {
    try {
      const endpoint = new URL(env.UPLOAD_API_URL);
      if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error("Invalid upstream configuration");
      const body = new FormData();
      body.append("folder", folder);
      body.append("file", new Blob([new Uint8Array(buffer)], { type: "image/webp" }), filename);
      const response = await fetchUpstream(endpoint, {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(20000),
        headers: { "x-upload-secret": env.UPLOAD_API_SECRET }, body,
      });
      const result = await limitedJson(response);
      if (typeof result?.url === "string" && result.url.includes(env.UPLOAD_API_SECRET)) throw new Error("Invalid upstream URL");
      const url = safeMediaUrl(result?.url, folder, env.UPLOAD_PUBLIC_ORIGIN);
      if (url) return url;
    } catch { /* Never return or log upstream bodies, headers, credentials or errors. */ }
  }

  // Only this authorized server path may write the media bucket. The supplied
  // restrictive SQL policies deny direct browser writes, including other users.
  try {
    const path = `${folder}/${filename}`;
    const client = storageClient ?? (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) },
    }) : undefined);
    if (!client) throw new Error("Server storage is unavailable");
    const bucket = client.storage.from("case-study-images");
    const { error } = await bucket.upload(path, buffer, { cacheControl: "31536000", upsert: false, contentType: "image/webp" });
    if (!error) {
      const { data } = bucket.getPublicUrl(path);
      const url = new URL(data.publicUrl);
      if (url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash && url.origin === new URL(env.SUPABASE_URL ?? "").origin && url.pathname.startsWith("/storage/v1/object/public/case-study-images/")) return url.href;
    }
  } catch { /* Continue to the existing embedded-image fallback after validation. */ }

  for (const quality of [82, 62, 42]) {
    const compact = await sharp(buffer).resize({ width: 1400, height: 900, fit: "inside", withoutEnlargement: true })
      .webp({ quality }).timeout({ seconds: 5 }).toBuffer();
    const url = `data:image/webp;base64,${compact.toString("base64")}`;
    if (url.length <= 1_500_000) return url;
  }
  throw new UploadError(502, "Could not store this image. Try a smaller image later.");
}
