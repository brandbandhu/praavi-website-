import { supabase } from "@/lib/supabase";

type UploadFolder = "blogs" | "works" | "clients" | "case-studies";

const UPLOAD_API_URL = import.meta.env.VITE_UPLOAD_API_URL as string | undefined;
const UPLOAD_API_SECRET = import.meta.env.VITE_UPLOAD_API_SECRET as string | undefined;

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

const buildUploadCandidates = () => {
  const candidates: string[] = [];

  if (UPLOAD_API_URL?.trim()) {
    candidates.push(UPLOAD_API_URL.trim());
  }

  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    candidates.push(`${origin}/api/upload.php`, `${origin}/upload.php`);
  }

  return [...new Set(candidates)];
};

export const uploadImageToGodaddy = async (file: File, folder: UploadFolder): Promise<string> => {
  if (!UPLOAD_API_SECRET) {
    throw new Error("Missing VITE_UPLOAD_API_SECRET in frontend env.");
  }

  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Unsupported file type. Use JPG, PNG, WEBP, or SVG.");
  }

  const uploadUrls = buildUploadCandidates();
  if (uploadUrls.length === 0) {
    throw new Error("No upload endpoint configured. Set VITE_UPLOAD_API_URL or host /api/upload.php.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const errors: string[] = [];
  for (const uploadUrl of uploadUrls) {
    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "x-upload-secret": UPLOAD_API_SECRET,
        },
        body: formData,
      });

      const raw = await response.text();
      let result: { url?: string; error?: string } = {};
      try {
        result = raw ? (JSON.parse(raw) as { url?: string; error?: string }) : {};
      } catch {
        result = { error: raw || "Unexpected response from upload API" };
      }

      if (response.ok && result?.url) {
        return result.url;
      }

      errors.push(`${uploadUrl} -> ${response.status}: ${result?.error || "Upload failed"}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network error";
      errors.push(`${uploadUrl} -> ${message}`);
    }
  }

  throw new Error(errors.join(" | "));
};

export const uploadImageToSupabaseStorage = async (file: File, folder: UploadFolder): Promise<string> => {
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Unsupported file type. Use JPG, PNG, WEBP, or SVG.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const path = `${folder}/${Date.now()}-${safeName || "image"}.${extension}`;

  const { error } = await supabase.storage.from("case-study-images").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("case-study-images").getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Could not create public URL for uploaded image.");
  return data.publicUrl;
};
