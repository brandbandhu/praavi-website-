import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    {
      name: "serve-landing-static",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || "";
          if (url === "/landing" || url === "/landing/") {
            const filePath = path.resolve(__dirname, "public/landing/index.html");
            if (fs.existsSync(filePath)) {
              res.setHeader("Content-Type", "text/html; charset=utf-8");
              res.end(fs.readFileSync(filePath, "utf-8"));
              return;
            }
          }
          if (url === "/june-offer" || url === "/june-offer/") {
            const filePath = path.resolve(__dirname, "public/june-offer/index.html");
            if (fs.existsSync(filePath)) {
              res.setHeader("Content-Type", "text/html; charset=utf-8");
              res.end(fs.readFileSync(filePath, "utf-8"));
              return;
            }
          }
          if (url === "/thank-you" || url === "/thank-you/") {
            const filePath = path.resolve(__dirname, "public/thank-you/index.html");
            if (fs.existsSync(filePath)) {
              res.setHeader("Content-Type", "text/html; charset=utf-8");
              res.end(fs.readFileSync(filePath, "utf-8"));
              return;
            }
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || "";
          if (url === "/landing" || url === "/landing/") {
            const filePath = path.resolve(__dirname, "public/landing/index.html");
            if (fs.existsSync(filePath)) {
              res.setHeader("Content-Type", "text/html; charset=utf-8");
              res.end(fs.readFileSync(filePath, "utf-8"));
              return;
            }
          }
          if (url === "/june-offer" || url === "/june-offer/") {
            const filePath = path.resolve(__dirname, "public/june-offer/index.html");
            if (fs.existsSync(filePath)) {
              res.setHeader("Content-Type", "text/html; charset=utf-8");
              res.end(fs.readFileSync(filePath, "utf-8"));
              return;
            }
          }
          if (url === "/thank-you" || url === "/thank-you/") {
            const filePath = path.resolve(__dirname, "public/thank-you/index.html");
            if (fs.existsSync(filePath)) {
              res.setHeader("Content-Type", "text/html; charset=utf-8");
              res.end(fs.readFileSync(filePath, "utf-8"));
              return;
            }
          }
          next();
        });
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
