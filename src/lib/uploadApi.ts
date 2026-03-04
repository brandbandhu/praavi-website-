type UploadFolder = "blogs" | "works" | "clients";

const normalizeEnvValue = (value: string | undefined) => {
  if (!value) return undefined;
  return value.trim().replace(/^['"]|['"]$/g, "");
};

const UPLOAD_API_URL = normalizeEnvValue(import.meta.env.VITE_UPLOAD_API_URL as string | undefined);
const UPLOAD_API_SECRET = normalizeEnvValue(import.meta.env.VITE_UPLOAD_API_SECRET as string | undefined);

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

const buildUploadCandidates = () => {
  const candidates: string[] = [];

  const isDev = import.meta.env.DEV;

  if (typeof window !== "undefined") {
    const origin = window.location.origin;

    if (isDev) {
      // In local dev, prefer Vite proxy endpoint to avoid cross-origin preflight/CORS failures.
      candidates.push(`${origin}/api/upload.php`);
    }

    if (!isDev) {
      candidates.push(`${origin}/api/upload.php`, `${origin}/upload.php`);
    }
  }

  if (UPLOAD_API_URL) {
    candidates.push(UPLOAD_API_URL);
  }

  if (typeof window !== "undefined" && isDev) {
    const origin = window.location.origin;
    candidates.push(`${origin}/upload.php`);
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

  const errors: string[] = [];
  for (const uploadUrl of uploadUrls) {
    const createFormData = () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      // Include secret in form payload for servers that avoid custom-header preflight.
      formData.append("secret", UPLOAD_API_SECRET);
      formData.append("upload_secret", UPLOAD_API_SECRET);
      return formData;
    };

    const parseResponse = async (response: Response) => {
      const raw = await response.text();
      let result: { url?: string; error?: string } = {};
      try {
        result = raw ? (JSON.parse(raw) as { url?: string; error?: string }) : {};
      } catch {
        result = { error: raw || "Unexpected response from upload API" };
      }
      return { raw, result };
    };

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: createFormData(),
      });

      const { result } = await parseResponse(response);

      if (response.ok && result?.url) {
        return result.url;
      }

      // If server rejects payload-secret auth, retry once with legacy header auth.
      if (response.status === 401 || response.status === 403) {
        const headerResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "x-upload-secret": UPLOAD_API_SECRET,
          },
          body: createFormData(),
        });
        const parsedHeaderResponse = await parseResponse(headerResponse);
        if (headerResponse.ok && parsedHeaderResponse.result?.url) {
          return parsedHeaderResponse.result.url;
        }
        errors.push(
          `${uploadUrl} -> ${headerResponse.status}: ${parsedHeaderResponse.result?.error || "Upload failed"}`
        );
      } else {
        errors.push(`${uploadUrl} -> ${response.status}: ${result?.error || "Upload failed"}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network error";
      errors.push(`${uploadUrl} -> ${message}`);
    }
  }

  throw new Error(errors.join(" | "));
};
