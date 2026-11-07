import { build } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
await build({
  configFile: false,
  root,
  build: {
    outDir: path.join(root, "public/diwali-wishes"),
    emptyOutDir: false,
    copyPublicDir: false,
    lib: {
      entry: path.join(root, "src/diwali-wishes/collector.ts"),
      formats: ["es"],
      fileName: () => "collector.js",
    },
  },
});
