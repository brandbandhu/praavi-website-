import { Router } from "express";
import multer from "multer";
import { authorizeUpload, IMAGE_TYPES, MAX_UPLOAD_BYTES, normalizeUpload, persistUpload, UPLOAD_FOLDERS, UploadError, type UploadFolder } from "../lib/uploads.js";

export function createUploadsRouter(deps: {
  authorize?: typeof authorizeUpload;
  normalize?: typeof normalizeUpload;
  persist?: typeof persistUpload;
  now?: () => number;
} = {}) {
  const router = Router();
  const authorize = deps.authorize ?? authorizeUpload;
  const normalize = deps.normalize ?? normalizeUpload;
  const persist = deps.persist ?? persistUpload;
  const now = deps.now ?? Date.now;
  const attempts = new Map<string, { count: number; until: number }>();
  const active = new Map<string, number>();
  let activeTotal = 0;
  const parse = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 1, parts: 2, fieldSize: 32, fieldNameSize: 32 },
    fileFilter: (_req, file, done) => {
      if (!IMAGE_TYPES.has(file.mimetype)) return done(new UploadError(415, "Use JPG, PNG, WebP, or SVG images."));
      done(null, true);
    },
  }).single("file");

  router.post("/images", async (req, res) => {
    res.set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    let release: (() => void) | undefined;
    try {
      const token = req.get("authorization")?.match(/^Bearer ([^\s]+)$/i)?.[1];
      if (!token || token.length > 8192) throw new UploadError(401, "Please sign in again.");
      const admin = await authorize(token);
      const time = now();
      for (const [id, value] of attempts) if (value.until <= time) attempts.delete(id);
      const rate = attempts.get(admin.userId) ?? { count: 0, until: time + 60000 };
      if (rate.count >= 10 || (active.get(admin.userId) ?? 0) >= 2 || activeTotal >= 4) {
        res.set("Retry-After", "60");
        throw new UploadError(429, "Too many uploads. Please try again in a minute.");
      }
      rate.count++;
      attempts.set(admin.userId, rate);
      active.set(admin.userId, (active.get(admin.userId) ?? 0) + 1);
      activeTotal++;
      release = () => {
        const remaining = (active.get(admin.userId) ?? 1) - 1;
        if (remaining) active.set(admin.userId, remaining); else active.delete(admin.userId);
        activeTotal--;
      };
      if (!req.is("multipart/form-data")) throw new UploadError(415, "Send a multipart image upload.");
      if (Number(req.get("content-length")) > MAX_UPLOAD_BYTES + 65536) throw new UploadError(413, "Images must be no larger than 4 MB.");
      await new Promise<void>((resolve, reject) => parse(req, res, (error) => error ? reject(error) : resolve()));
      if (!req.file || Object.keys(req.body).length !== 1 || !UPLOAD_FOLDERS.includes(req.body.folder)) throw new UploadError(400, "Invalid upload request.");
      const image = await normalize(req.file.buffer, req.file.mimetype);
      const url = await persist(image, req.body.folder as UploadFolder, admin);
      res.json({ url });
    } catch (error) {
      if (error instanceof UploadError) res.status(error.status).json({ error: error.message });
      else if (error instanceof multer.MulterError) {
        const tooLarge = error.code === "LIMIT_FILE_SIZE";
        res.status(tooLarge ? 413 : 400).json({ error: tooLarge ? "Images must be no larger than 4 MB." : "Invalid upload request." });
      } else {
        // Own the error boundary; never pass credentials/errors to the legacy logger.
        res.status(503).json({ error: "Upload service is unavailable. Try again later." });
      }
    } finally { release?.(); }
  });
  router.all("/images", (_req, res) => { res.set("Allow", "POST").status(405).json({ error: "Method not allowed." }); });
  return router;
}

export const uploadsRouter = createUploadsRouter();
