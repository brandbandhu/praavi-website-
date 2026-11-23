import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";
import { homeHeroSources } from "./src/lib/homeHeroAssets";

const homeHeroPreload = `<script>
  if (location.pathname === "/") {
    const sources = ${JSON.stringify(homeHeroSources)};
    const source = matchMedia(sources.mobile.media).matches ? sources.mobile : sources.wide;
    const preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "image";
    preload.type = "image/avif";
    preload.fetchPriority = "high";
    preload.imageSrcset = source.srcSet;
    preload.imageSizes = source.sizes;
    document.head.append(preload);
  }
</script>`;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    {
      name: "home-hero-preload",
      transformIndexHtml: (html) => html.replace("<!-- Home hero preload -->", homeHeroPreload),
    },
    mode === "development" && componentTagger(),
    {
      name: "serve-landing-static",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || "";
          if (/^\/diwali-wishes\/?$/.test(url.split("?")[0])) {
            const filePath = path.resolve(__dirname, "public/diwali-wishes/index.html");
            if (fs.existsSync(filePath)) {
              res.setHeader("Content-Type", "text/html; charset=utf-8");
              res.end(fs.readFileSync(filePath, "utf-8"));
              return;
            }
          }
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
          if (url === "/dm_quotation_maker-myadmin" || url === "/dm_quotation_maker-myadmin/") {
            const filePath = path.resolve(__dirname, "public/dm_quotation_maker-myadmin/index.html");
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
          if (/^\/diwali-wishes\/?$/.test(url.split("?")[0])) {
            const filePath = path.resolve(__dirname, "public/diwali-wishes/index.html");
            if (fs.existsSync(filePath)) {
              res.setHeader("Content-Type", "text/html; charset=utf-8");
              res.end(fs.readFileSync(filePath, "utf-8"));
              return;
            }
          }
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
          if (url === "/dm_quotation_maker-myadmin" || url === "/dm_quotation_maker-myadmin/") {
            const filePath = path.resolve(__dirname, "public/dm_quotation_maker-myadmin/index.html");
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
