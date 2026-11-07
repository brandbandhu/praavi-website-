import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

// Build the supplied greeting project with its own React 19 / Tailwind 4 toolchain.
// The main website continues to use its existing dependencies.
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const sourceRoot = path.resolve(
  projectRoot,
  process.argv[2] || "../../Diwali Greeting-Praavi",
);
const sourceRequire = createRequire(path.join(sourceRoot, "package.json"));
const load = (name) => import(pathToFileURL(sourceRequire.resolve(name)).href);
const [{ build }, { default: react }, { default: tailwindcss }] = await Promise.all([
  load("vite"),
  load("@vitejs/plugin-react"),
  load("@tailwindcss/vite"),
]);

await build({
  configFile: false,
  root: sourceRoot,
  base: "/diwali-wishes/",
  cacheDir: path.join(projectRoot, ".tmp/diwali-vite"),
  resolve: { alias: { "@": path.join(sourceRoot, "src") } },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "diwali-main-domain-metadata",
      transformIndexHtml() {
        return [
          {
            tag: "script",
            attrs: { type: "module", src: "/diwali-wishes/collector.js" },
            injectTo: "body",
          },
          {
            tag: "link",
            attrs: { rel: "canonical", href: "https://praaviconsultants.in/diwali-wishes" },
            injectTo: "head",
          },
          {
            tag: "meta",
            attrs: { property: "og:url", content: "https://praaviconsultants.in/diwali-wishes" },
            injectTo: "head",
          },
        ];
      },
    },
  ],
  build: {
    outDir: path.join(projectRoot, "public/diwali-wishes"),
    emptyOutDir: false,
  },
});

await import("./build-diwali-collector.mjs");
