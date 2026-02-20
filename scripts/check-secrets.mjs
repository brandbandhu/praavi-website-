import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const blockedPatterns = [
  /sb_secret_[A-Za-z0-9_-]+/g,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*(?!sb_secret_xxxxx)[^\s#]+/g,
];

const skipDirs = new Set([".git", "node_modules", "dist", "dist-ssr"]);
const skipFiles = new Set(["package-lock.json", "bun.lockb"]);

const findings = [];
const allowedValues = new Set(["sb_secret_xxxxx"]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(root, fullPath).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      walk(fullPath);
      continue;
    }

    if (skipFiles.has(entry.name)) continue;

    const content = fs.readFileSync(fullPath, "utf8");
    for (const pattern of blockedPatterns) {
      const matches = content.match(pattern);
      if (!matches) continue;

      for (const match of matches) {
        if (allowedValues.has(match)) continue;
        findings.push({ file: relPath, value: match });
      }
    }
  }
}

walk(root);

if (findings.length > 0) {
  console.error("Secret scan failed. Found potential secret values:");
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.value}`);
  }
  process.exit(1);
}

console.log("Secret scan passed. No secret keys detected.");
