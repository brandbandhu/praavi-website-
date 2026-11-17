# Secure media uploads: implementation and deployment

Prepared 2026-11-16. Changes are local. No push, deployment, live SQL execution, infrastructure update, credential rotation, or production upload was performed.

**Staging audit update:** [The staging readiness audit](staging-readiness-audit.md) supersedes the original rollout order. The configured PHP destination was not verified, no isolated staging setup is confirmed, and production cutover remains blocked. Validate/deploy the secure backend and prove its durable fallback before applying production Storage restrictions or rotating the exposed credential.

## Upload flow

Previously, `src/lib/uploadApi.ts` sent a shared `VITE_UPLOAD_API_SECRET` directly from the browser to an external PHP endpoint. Admin handlers then attempted direct Supabase Storage and browser-generated embedded images. The shared credential was therefore in downloaded JavaScript and could authorize requests outside the admin dashboard.

The dashboard now sends a multipart request to same-origin `POST /api/uploads/images` with the signed-in user's Supabase bearer token. There are no shared upload credentials, external endpoint candidates, direct Storage writes, or authorization-error fallbacks in frontend code.

The existing Express backend, exposed through `api/index.js`, mounts the upload route before JSON/body-processing middleware. It calls Supabase Auth `getUser(token)`, then reads `profiles.role` for that verified user ID. Only database role `admin` is authorized; user-editable metadata, finance JWTs, decoded JWT claims, and local browser flags are not trusted.

After authorization, the route parses one file and one folder field, validates the file, decodes and re-encodes it as WebP, and tries the existing destinations in order:

1. Existing PHP media service: only the backend sends `x-upload-secret`, over HTTPS, without following redirects.
2. Existing `case-study-images` Storage bucket: only a server-only Supabase service-role client writes, after the same admin/file checks.
3. Existing embedded-image fallback: a bounded, server-generated WebP data URL. This is not durable file storage, matching the prior fallback's behavior.

Blogs, portfolio works, client logos, and case-study screenshots retain their existing UI and image URL state handling. JPG, PNG, WebP, and safe SVG inputs are accepted. SVG is rasterized; active SVG is never published. SVG with scripts, event handlers, external resources, entities, imports, or foreignObject is rejected.

## Limits and error handling

- Maximum original file: 4 MiB, below Vercel's 4.5 MB function request-body limit with room for multipart framing.
- One file; one folder field; two multipart parts; bounded field names and field lengths. Folders are exactly `blogs`, `works`, `clients`, or `case-studies`.
- File signatures and decoded formats must match the declared MIME type. Corrupt, unsupported, multi-frame, oversized-dimension, and over-40-million-pixel images are rejected.
- Output is metadata-stripped WebP, at most 1920 by 1920 pixels, with a random filename. The embedded fallback is at most 1,500,000 characters.
- Per process: 10 attempts/minute/user, two concurrent uploads/user, four active uploads total. Rate limits are process-local; distributed enforcement would require an approved gateway/shared store.
- Bounded image operations, Auth/Storage requests, upstream requests, and upstream JSON response size. Approved HTTPS media origins and folder paths are checked; URLs with credentials, queries, or fragments are rejected.
- Authentication/role failures return 401/403 before multipart parsing. Oversized inputs return 413; malformed/unsafe inputs return 400/415/422; rate limits return 429. Errors never copy upstream response bodies, tokens, headers, or SDK error messages into logs or API/UI responses.

## Credential inventory and rotation

Confirmed local locations:

- `.env.local` previously configured `VITE_UPLOAD_API_SECRET` and `VITE_UPLOAD_API_URL`. These entries were removed. They were moved, without changing their values, into ignored `server/.env` as `UPLOAD_API_SECRET` and `UPLOAD_API_URL`. `UPLOAD_PUBLIC_ORIGIN` was added there. These private local files are not staged or tracked.
- `.env.example` no longer recommends any frontend upload settings. `server/.env.example` declares placeholders for the private settings only.
- The PHP example formerly under `public/api/` used a hardcoded placeholder. It is now `server/upload.php.example`, outside the public build tree, and reads private environment variables with constant-time credential comparison.
- The generated browser build no longer contains the configured upload credential or private upload header. The previously deployed browser bundles/CDN caches may still contain the old value until old deployments/caches are retired; rotation must make that value unusable.

Remote locations require operator inspection; provider dashboards and live PHP source were not accessed:

- Vercel project environment variables, all Production/Preview/Development scopes and branch overrides.
- CI/CD secret stores and build-agent environment variables for this repository.
- The actual GoDaddy/PHP upload host's environment or private configuration, including any older hardcoded `$secret` configuration.
- Other developer `.env` files, archived build outputs, deployment archives, old preview deployments, and CDN copies.

Never put the replacement in a `VITE_*` variable, browser code, a command-line argument, a public PHP source/example, a Git commit, or an API response. The existing Supabase service-role credential remains server-only and must not be copied to frontend configuration.

## Exact deployment sequence — requires explicit approval

1. Review these changes and approve the production secret/configuration, PHP update, SQL migration, deployment, and any retirement of old deployments separately. The existing exposed upload value must be replaced; moving it locally did not rotate it.
2. Use a supported Node runtime (locked Sharp requires Node >=20.9.0; use an approved supported LTS) and install optional native dependencies. From the repository root run `npm ci`, `npm --prefix server ci`, `npm test`, `npm run test:sitemap`, and `npm run test:uploads`. The root runtime dependencies also include Multer and Sharp so the existing Vercel root-install workflow can resolve them.
3. In a non-public staging environment, verify the backend's `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY` point to the same project as the admin login. Verify users cannot assign their own `profiles.role` and existing administrator profiles have role `admin`.
4. Prepare a new high-entropy upload credential in the operator's secret manager and first configure it in staging as `UPLOAD_API_SECRET` on the Node runtime and PHP host, never as a frontend variable. Configure Node `UPLOAD_API_URL` to the actual final HTTPS PHP upload endpoint (no redirect, credentials, query, or fragment), and `UPLOAD_PUBLIC_ORIGIN` to the exact HTTPS media origin. The current configured path is `/api/upload.php`; validate its final host privately before cutover. Do not switch the production credential during staging validation.
5. Remove `VITE_UPLOAD_API_SECRET` and `VITE_UPLOAD_API_URL` from every applicable Vercel/CI environment scope and branch override. Preserve unrelated settings. Deploy/review the hardened PHP implementation from `server/upload.php.example` on the PHP host, using host-managed private environment variables, writable `uploads/{folder}` directories, Fileinfo/WebP metadata support, and disabled script execution in uploaded-image directories. Do not place the PHP implementation in React's public directory. Node and PHP must use the same replacement credential at cutover.
6. With approval, rehearse `database/supabase-secure-media-uploads.sql` in the isolated staging project. It adds restrictive insert/update/delete policies for `case-study-images` to block direct anon/authenticated writes even if broad permissive policies exist. Service-role writes through the verified backend continue; public reads and other buckets are unchanged. In production, apply it only after the secure backend/client are available and their service-role Storage fallback is proven. This migration has not been executed here.
7. Run `npm run build`. It regenerates the complete sitemap, builds both frontend and backend, and runs `npm run security:bundles` automatically. The credential gate scans browser text artifacts for known private credential values and upload authorization markers, reporting filenames only. The browser output is `dist/`; the backend output is `server/dist/` and is consumed by the existing `api/index.js`. Deploy both through the current Vercel workflow; do not publish only the static `dist/` folder, because authenticated uploads require the backend route. Existing API routing already covers the new path; no `vercel.json` change is included.
8. After staging passes and the owner approves, perform a coordinated production maintenance cutover: prepare the compatible PHP service and private server settings, release and verify the secure Node/frontend application and durable Storage fallback, then apply the reviewed bucket migration and coordinate the PHP/Node credential switch. Remove legacy frontend settings with the secure release, not an old browser-secret build. Steps 4–7 should first be rehearsed in staging. Follow the more detailed staging audit sequence. Once cutover completes, the compromised value must be rejected. During a short primary-service mismatch, verified requests retain the Storage/embedded fallbacks. After approval, retire/purge accessible old deployments and CDN artifacts as supported by the host. Do not restore the exposed value or reintroduce frontend shared-secret authorization during rollback.
9. Perform approved live smoke tests: unsigned request ->401; signed-in non-admin ->403; admin JPG/PNG/WebP/safe-SVG uploads succeed for all four folders; oversized/unsafe images fail; returned URLs load publicly; direct authenticated Storage writes fail; image reads and other-bucket uploads still work. Test server fallback paths in staging. Inspect request headers and responses to confirm no shared credential leaves the backend. Recheck the 167-URL sitemap and robots reference, plus existing blog heading/schema/social metadata behavior.

## Validation and remaining limits

- `npm test`: 35 passed, including four frontend upload tests and all prior SEO/application tests.
- `npm run test:sitemap`: 12 passed.
- `npm run test:uploads`: 10 passed with real multipart HTTP requests and image decoding, mocked Supabase identity/roles, and mocked remote destinations. No production files were uploaded.
- Full production build and browser credential gate passed. The sitemap remains 167 unique URLs (106 published blogs, 61 static/service pages); SEO components/content/canonical URLs are unchanged.
- A local smoke test of the actual compiled Express app confirms unsigned and legacy-shared-header requests return 401 before body parsing, GET on the upload endpoint returns 405, and the existing health endpoint still returns 200.
- The extra standalone frontend type check (`npx tsc --noEmit -p tsconfig.app.json`) still reports 40 existing errors in AdminDashboard, DigitalMarketingTeamRoutes, Index, and ViewDetails. A TypeScript compiler-host comparison with the committed baseline found exactly the same diagnostics and no introduced errors. This is separate from the passing Vite production build and passing server TypeScript build; no unrelated type fixes were made.
- PHP CLI is unavailable locally, so the PHP example still needs host-side syntax/runtime verification. The SQL migration still needs staging/live validation with explicit approval. Native Sharp packaging must be checked in the deployment runtime.
- Dependency audit reports 32 root advisories and four server advisories in existing packages (including existing body-parser/proxy-addr/qs/zod findings on the server). None were reported for the new Multer/Sharp packages. No broad dependency upgrade was performed. Review these advisories separately before approving overall production security.
- Previously exposed credentials must still be rotated. Live behavior cannot be certified until the approved deployment, policy change, and smoke tests are complete. Client-rendered social preview limitations and the existing Diwali canonical mismatch remain as documented in the SEO review.

## Changed files

- Frontend: `src/lib/uploadApi.ts`, `src/pages/AdminDashboard.tsx`, `.env.example`.
- Backend: `server/src/lib/uploads.ts`, `server/src/routes/uploads.ts`, `server/src/index.ts`, `server/.env.example`.
- Policy/template: `database/supabase-secure-media-uploads.sql`, new `server/upload.php.example`, removal of `public/api/upload.php.example`.
- Tests/build gate: `src/test/upload-api.test.ts`, `server/test/uploads.test.mjs`, `scripts/check-upload-bundles.mjs`.
- Dependency/build scripts: root and server `package.json` and `package-lock.json`. The required Sharp semver dependency also updates the root semver resolution.
- Review documents: this file and `docs/seo-production-readiness.md`.
- Ignored local configuration only: `.env.local`, `server/.env` (not committed; existing upload value unchanged).

References: [Supabase server-verified getUser](https://supabase.com/docs/reference/javascript/auth-getuser), [Vercel request-body limits](https://vercel.com/docs/functions/limitations#request-body-size).
