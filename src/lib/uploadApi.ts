import { supabase } from "@/lib/supabase";

type UploadFolder = "blogs" | "works" | "clients" | "case-studies";
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const errorMessages: Record<number, string> = {
  400: "Choose a supported image and upload folder.",
  401: "Please sign in again before uploading images.",
  403: "Administrator access is required to upload images.",
  413: "Images must be no larger than 4 MB.",
  415: "Use JPG, PNG, WebP, or SVG images.",
  422: "The image is invalid, too large in pixels, or contains unsafe SVG content.",
  429: "Too many uploads. Please try again in a minute.",
};

export const uploadAdminImage = async (file: File, folder: UploadFolder): Promise<string> => {
  if (!allowedMimeTypes.has(file.type)) throw new Error(errorMessages[415]);
  if (!file.size || file.size > 4 * 1024 * 1024) throw new Error(errorMessages[413]);
  if (!["blogs", "works", "clients", "case-studies"].includes(folder)) throw new Error(errorMessages[400]);
  let accessToken: string | undefined;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error) accessToken = data.session?.access_token;
  } catch { /* Do not reflect auth-provider errors or credentials into the UI. */ }
  if (!accessToken) throw new Error(errorMessages[401]);
  const body = new FormData();
  body.append("folder", folder);
  body.append("file", file);
  let response: Response;
  try {
    response = await fetch("/api/uploads/images", {
      method: "POST", redirect: "error", credentials: "omit",
      headers: { Authorization: `Bearer ${accessToken}` },
      body, signal: AbortSignal.timeout(90000),
    });
  } catch { throw new Error("Image upload is unavailable. Please try again later."); }
  if (!response.ok) throw new Error(errorMessages[response.status] ?? "Image upload is unavailable. Please try again later.");
  try {
    const result = await response.json() as { url?: unknown };
    if (typeof result.url !== "string") throw new Error();
    if (/^data:image\/webp;base64,[a-zA-Z0-9+/=]+$/.test(result.url) && result.url.length <= 1_500_000) return result.url;
    const url = new URL(result.url);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new Error();
    return url.href;
  } catch { throw new Error("The upload service returned an invalid image URL."); }
};
