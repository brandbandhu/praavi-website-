type UploadFolder = "blogs" | "works" | "clients";

const UPLOAD_API_URL = import.meta.env.VITE_UPLOAD_API_URL as string | undefined;
const UPLOAD_API_SECRET = import.meta.env.VITE_UPLOAD_API_SECRET as string | undefined;

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

export const uploadImageToGodaddy = async (file: File, folder: UploadFolder): Promise<string> => {
  if (!UPLOAD_API_URL || !UPLOAD_API_SECRET) {
    throw new Error("Missing upload API env vars: VITE_UPLOAD_API_URL and VITE_UPLOAD_API_SECRET");
  }

  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Unsupported file type. Use JPG, PNG, WEBP, or SVG.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch(UPLOAD_API_URL, {
    method: "POST",
    headers: {
      "x-upload-secret": UPLOAD_API_SECRET,
    },
    body: formData,
  });

  const result = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !result?.url) {
    throw new Error(result?.error || "Upload failed");
  }

  return result.url;
};

