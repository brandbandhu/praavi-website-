import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const normalizedUploadApiUrl = env.VITE_UPLOAD_API_URL?.trim().replace(/^['"]|['"]$/g, "");
  const parsedUploadApiUrl = normalizedUploadApiUrl ? new URL(normalizedUploadApiUrl) : null;

  const uploadProxy = parsedUploadApiUrl
    ? {
        target: parsedUploadApiUrl.origin,
        changeOrigin: true,
        secure: parsedUploadApiUrl.protocol === "https:",
      }
    : undefined;

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: uploadProxy
        ? {
            "/api/upload.php": {
              ...uploadProxy,
              rewrite: () => parsedUploadApiUrl!.pathname + parsedUploadApiUrl!.search,
            },
            "/upload.php": {
              ...uploadProxy,
              rewrite: () => parsedUploadApiUrl!.pathname + parsedUploadApiUrl!.search,
            },
          }
        : undefined,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
