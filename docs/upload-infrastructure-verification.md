# Secure upload infrastructure verification

Audit date: 2026-11-16. Source baseline: `1575a7a`, with the existing uncommitted secure-upload implementation. Decision: **architecture is feasible on the existing services, but production compatibility and authorization are not yet verified. Release remains blocked.**

This audit changed documentation only. No push, deployment, credential rotation, production configuration change, database migration, or production upload was performed. HTTP probes used GET/HEAD only. One authenticated Supabase request read bucket configuration; credential values remained in memory and are not recorded here. No hosting control panel is connected.

## Current architecture and fresh evidence

| Component | Confirmed evidence | Outstanding information |
| --- | --- | --- |
| React frontend | `https://www.praaviconsultants.in/`: HTTP 200, Vercel headers. DNS CNAME is `cname.vercel-dns.com`. | Vercel project/team, billing plan, build settings, environment scopes, region and account ownership require dashboard access. |
| Existing API | `/api/health`: HTTP 200, Express/Vercel headers, healthy and database-configured flags. `api/index.js` exports `server/dist/index.js`; `vercel.json` maps `/api/(.*)` to that function before the SPA fallback. | Actual deployed revision and function settings are not available from public responses. No evidence requires a separate Render/Railway service. The older server README describes an alternative, not the current verified route. |
| New secure route | `/api/uploads/images`: HTTP 404 on the live site. Local route exists in `server/src/routes/uploads.ts`. | Not deployed; real cloud multipart handling, native imports and cold starts remain untested. |
| Configured PHP destination | Locally configured hostname is `praaviconsultants.in`, path `/api/upload.php`. HEAD returns HTTP 404 with Express/Vercel headers. | Cloud environment values cannot be read here; verify whether production/preview settings contain the same destination. |
| PHP candidate | `https://media.praaviconsultants.in/api/upload.php`: HEAD returns HTTP 405, `Server: LiteSpeed`, `X-Powered-By: PHP/8.3.36`. Media DNS resolves to `82.25.120.140`, distinct from the main site's address. `/upload.php` on this host returns 404. | Hosting provider/account, document root, actual script source, authentication, accepted formats/fields, limits, returned URL and write access are unverified. A PHP header and 405 do not prove the upload contract. Do not assume GoDaddy from the legacy helper's name. |
| Existing media | Media subdomain is a separate public host. Supabase also supplies the `case-study-images` fallback bucket. Fresh bucket-metadata GET returned 200, `public=true`, no bucket-specific MIME or size limits. | Media filesystem mapping, backup/quota status and current live Storage/profile policies require operator verification. Public bucket status does not authorize writes. |
| Supabase Auth/data | Frontend and server use Supabase; the proposed API uses the same identity source as existing admin login. Earlier comparison found local settings production-connected. | No isolated staging project is configured in this checkout. Cloud staging may exist; its existence is unverified. |

### Why PHP returns 404

The configured request reaches the main-domain Vercel **Node/Express API**, not the separate PHP host. The repository routes `/api/*` to Express, and Express has no `/api/upload.php` handler. The fresh response carries Express/Vercel headers and no redirect. A PHP filename does not cause Vercel's Node function to execute PHP.

This establishes a wrong destination/runtime for the locally configured URL. It does not prove a PHP file is missing from the media host. The media-host candidate may be the intended target, but its source and contract must be inspected before changing `UPLOAD_API_URL`. The backend deliberately rejects upstream redirects, so use the final HTTPS endpoint. No DNS or rewrite change is needed merely to reach a verified separate PHP host.

## Recommended deployment approach

Retain the existing Vercel frontend and same-origin Node API:

1. Browser sends its Supabase bearer session and multipart `file`/`folder` to `/api/uploads/images`.
2. Node validates identity and the protected admin role before its multipart parser, validates/decodes the image, and re-encodes it to WebP.
3. Node sends the private upload credential to the verified PHP media endpoint over HTTPS. PHP stores a randomly named WebP beneath the existing public media origin.
4. If the primary destination fails, Node uses a private Supabase service-role client for the existing `case-study-images` fallback. The existing bounded embedded-image fallback remains last.
5. Browser receives the public image URL or bounded image data; it never receives the private shared upload credential or service-role key.

This preserves the four admin upload folders (`blogs`, `works`, `clients`, `case-studies`), existing media URLs/reads and fallback behavior. Do not move persistent files into a Vercel function's ephemeral filesystem. Do not remove credentials from the legacy client and assume a fallback response preserves the primary upload service.

No additional paid service is inherently required by this architecture. Existing Vercel Node functions, PHP hosting and Supabase are already present. **No-cost operation is not verified:** an owner must confirm current plan eligibility, function usage/limits, PHP disk/bandwidth quotas, Supabase quotas and staging capacity. Vercel Hobby is restricted to personal, non-commercial use; do not assume that tier is suitable for this business website. See [Vercel Express support](https://vercel.com/docs/frameworks/backend/express), [function limits](https://vercel.com/docs/functions/limitations), and [Hobby restrictions](https://vercel.com/docs/plans/hobby).

## Runtime and packaging requirements

**Node:** use a provider-supported LTS version satisfying Sharp 0.35.5's Node >=20.9.0 requirement. Build/install on Linux for the function's target architecture, retain optional native Sharp/libvips dependencies, and do not copy Windows `node_modules`. Both runtime manifests and lockfiles contain Sharp; verify Vercel traces its binaries and `server/dist` through `api/index.js`. Deploying only `dist/` is insufficient. Confirm actual install/build commands and both dependency trees in the dashboard. Source: [Sharp installation](https://sharp.pixelplumbing.com/install/).

**Sharp is necessary for the selected implementation.** `server/src/lib/uploads.ts` uses it to decode and validate image bytes/dimensions, rotate, resize, remove metadata, rasterize accepted SVG and generate WebP, including the compact fallback. PHP does not replace this processing. Removing Sharp or switching to a PHP-only authorizer requires another implementation with equivalent security and format support; neither PHP GD nor Imagick capability is verified. Sharp is imported at shared API startup, so missing Linux binaries can prevent finance and health routes from starting too.

**PHP:** the example requires file uploads, Fileinfo, writable upload temporary/final directories, `hash_equals`, `random_bytes`, and WebP support in `getimagesize`. The effective legacy minimum is PHP 7.1 for WebP metadata, but deploy only a supported, patched PHP 8.x version. The advertised 8.3.36 is evidence of a PHP response, not proof of current maintenance status or enabled extensions. No GD/Imagick or native Sharp is required on the PHP host for this design. Inspect the web SAPI configuration, not just CLI PHP. Source: [PHP getimagesize changelog](https://www.php.net/manual/en/function.getimagesize.php).

The example belongs at `<media-document-root>/api/upload.php`; its `__DIR__ . '/../uploads/'` must map to `<media-document-root>/uploads/`. Confirm private environment injection, `file_uploads`, `upload_max_filesize >=4M`, `post_max_size` greater than the multipart envelope (for example 5M), writable temporary storage, disk quotas and permissions. Deny executable handlers/directory listing under `/uploads`, disable error display, preserve existing files and verify the exact public-origin mapping. PHP's runtime may parse/spool multipart bodies before script authorization; configure host-level request limits too. No PHP CLI exists locally, so syntax/extension/host checks remain manual.

The Node limit is 4 MiB per file with bounded multipart fields, below Vercel's 4.5 MB request ceiling. Verify a full-size request in the actual staging function. Confirm memory, timeout and native cold start: the implementation has multiple Auth/storage/upstream timeouts, so total execution may exceed a short function default. Process-local concurrency/rate limits do not enforce a fleet-wide ceiling on serverless instances; assess provider abuse limits before release. Source: [Vercel function limits](https://vercel.com/docs/functions/limitations).

## Authentication and authorization

`authorizeUpload` calls Supabase `auth.getUser(token)` with the submitted bearer token, then performs a user-scoped `profiles.select('role').eq('id', verifiedUser.id).maybeSingle()`. Only `role === 'admin'` passes. It does not trust decoded JWT payloads, browser flags, finance JWTs, or editable `user_metadata`. Missing/invalid identity is 401; a verified non-admin is 403; missing configuration/role-query failure fails closed with 503. Authorization precedes the application multipart parser. Source: [server-verified getUser](https://supabase.com/docs/reference/javascript/auth-getuser).

Manual database verification is essential: authenticated users must be able to read their own role, must not assign/promote their own role through profile INSERT/UPDATE, signup triggers, RPCs or metadata, and administrators must be provisioned through a trusted path. The full profiles policy/grant/trigger definition is not present in the inspected SQL. Tests mock role reads; they cannot certify live protection.

The prepared Storage migration blocks direct anon/authenticated media writes, including direct browser admin writes, using restrictive INSERT/UPDATE/DELETE policies. Only the authorized backend service-role fallback writes this bucket. It does not change public SELECT/read behavior, other buckets or existing objects. It remains unapplied. Verify actual policies and expected behavior in staging before any production approval.

## Smallest body-parser remediation

Both installed/locked trees have Express 4.22.2 and body-parser 1.20.6. Express declares `body-parser: ~1.20.5`, which permits patched 1.20.9. The shared `express.json()` uses vulnerable default decompression on sibling routes before their authorization; mounting uploads ahead of it does not protect the shared process.

The smallest normal fix is a targeted body-parser 1.x lockfile update in **both** root and server trees (for example `npm update body-parser --package-lock-only --ignore-scripts`, then the same command with `--prefix server`), reviewing only the parser's necessary dependency subtree and installing with `npm ci`. Registry metadata confirms 1.20.9 exists; its compatible subtree also updates dependencies such as `raw-body`/`qs`. Verify the resulting resolved version is >=1.20.9 and still 1.x; do not perform a blanket `npm audit fix --force`, upgrade Express to 5, or assume editing only the server lock changes Vercel's root dependency tree.

Add a local regression proving valid JSON still works, compressed/trailing-byte inputs cannot terminate the process, and subsequent health requests succeed; rerun upload, finance API smoke, build and audit checks. The advisory also offers `express.json({ inflate: false })` as a mitigation if compressed clients are unnecessary, but patching within the existing semver range preserves supported compressed-client behavior with less behavior change. No dependency edits or exploit requests against production were made during this audit. Source: [body-parser advisory and patched versions](https://github.com/advisories/GHSA-27r3-jxmh-p828).

## Required environment names

| Scope | Required names | Notes |
| --- | --- | --- |
| Frontend build | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` or supported `VITE_SUPABASE_PUBLISHABLE_KEY` | Public values for the matching project only. Upload route is relative/same-origin; no upload-secret or upload-URL variable is required in the browser. |
| Node identity | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Prefer explicit public/anon key for the user-scoped Auth/role client. |
| Node persistence fallback | `SUPABASE_SERVICE_ROLE_KEY` | Private matching-project server credential. Never prefix with `VITE_`. |
| Node PHP integration | `UPLOAD_API_URL`, `UPLOAD_API_SECRET`, `UPLOAD_PUBLIC_ORIGIN` | Verified final HTTPS PHP endpoint, private shared credential and exact allowed public origin. |
| PHP host | `UPLOAD_API_SECRET`, `UPLOAD_PUBLIC_ORIGIN` | Environment-specific credential matching Node and correct filesystem/public-origin mapping. |
| Existing shared API | `JWT_SECRET`, conditional `FMS_ADMIN_USERNAME`, `FMS_ADMIN_PASSWORD`, `FMS_FINANCE_USERNAME`, `FMS_FINANCE_PASSWORD`, `META_GRAPH_ACCESS_TOKEN`, `META_GRAPH_API_VERSION`; runtime `PORT`, `NODE_ENV`, provider-managed `VERCEL` | Preserve these existing features; finance credentials are not upload authorization. Do not manually override provider flags. |
| Retire during approved cutover | `VITE_UPLOAD_API_SECRET`, `VITE_UPLOAD_API_URL` | Inspect Vercel Production/Preview/Development, branch overrides, CI/build settings, local envs and PHP configuration; do not copy the exposed credential into a new browser build. |

Other existing frontend webhook settings are unrelated to upload authorization. Preserve their behavior and isolate their staging destinations. Ignored local files include private settings; their presence is not proof of cloud configuration. No credential values are included here.

## Staging setup and verification sequence

All resource creation, remote deployment, configuration changes, migrations and rotation below require separate explicit approval. None were executed.

1. Owner inventories Vercel project/settings/deployments, PHP hosting/document root/script source and Supabase projects/policies using read-only account access. Confirm whether isolated staging already exists, current plan/capacity, and which Git events auto-deploy. Do not push to a production-watched branch as a way to test.
2. Apply the targeted dependency remediation locally and review its diff; add the local parser regression. Keep completed SEO and upload behavior intact.
3. Approve a protected Vercel Preview or separate staging project using the same Node/static layout. Use an isolated Supabase project with synthetic admin/non-admin users and representative data, and a separate PHP document root/media origin with its own credentials. Verify staging capacity on existing subscriptions; do not purchase a service implicitly.
4. Explicitly configure matching staging frontend/backend Supabase settings. Production fallback defaults exist in source, so missing overrides must fail the environment review. Replace unrelated outgoing integrations with staging destinations to avoid production writes/notifications. Keep staging access-protected and noindexed.
5. Install/verify the PHP staging handler, private environment, WebP contract, four folders, file limits, safe serving and writable paths. Verify syntax with `php -l` and extensions/web-SAPI settings on the host. Record returned origin/path, then configure Node to the verified nonredirecting endpoint. Never infer PHP readiness from a 200 fallback response.
6. Deploy the approved staging artifact with Linux native binaries and the Node function. Cold-start `/api/health` and existing finance routes, then verify actual multipart requests near the byte limit, timeout/memory behavior and public persistence. Inspect deployed function contents/log configuration for credential safety.
7. Verify Auth/role protections: missing/expired/forged bearer ->401, non-admin ->403, trusted admin ->success, role self-promotion forbidden. Test all four folders and supported types; reject oversized/malformed/active SVG requests. Inspect browser requests/responses to ensure the shared upload secret stays server-side.
8. Rehearse the Storage migration only on approved staging after the authorized backend fallback works. Verify direct anon/non-admin/admin browser writes denied, service-role API fallback permitted, public old/new reads preserved and other buckets unaffected. Force PHP failure in staging and verify a durable Supabase URL, then test the final embedded fallback separately.
9. Rerun the complete build, all tests, parser regression, audit and browser credential gate. Check all 167 production sitemap URLs against the production dataset; an isolated synthetic staging dataset need not itself contain 106 blogs. Recheck SEO metadata and finance health. A data URL alone is not proof of persistent upload readiness.
10. Only after staged evidence and explicit production approval: establish the verified secure backend and durable fallback, release the secure frontend/backend together, enforce approved Storage restrictions after the backend is functional, coordinate a new private PHP/Node credential, verify rejection of the exposed old credential, remove old build settings and retire accessible legacy artifacts where supported. Rehearse the sequence first; do not rotate before the replacement path is ready. Use a previously verified **secure** artifact for rollback, retaining secure credentials/policies and public reads. Never roll back to the browser-secret uploader or restore the exposed credential.

## Checks performed and security blockers

Fresh local results:

- Application/SEO/frontend upload tests: **35 passed**.
- Sitemap tests: **12 passed**.
- Backend upload tests, real local multipart/decoding with mocked remote services: **10 passed**; server TypeScript compilation passed.
- Full production build: **passed**, including sitemap, Vite, server compilation and browser credential scan.
- Browser credential gate: **passed**, 19 generated text artifacts, no upload authorization markers or configured private server values found.
- `public/sitemap.xml` and `dist/sitemap.xml`: **167 unique URLs each** (106 published blogs and 61 static/service).
- Fresh production-dependency audits: root **18** findings (1 critical, 14 high, 3 moderate); server **4** (1 critical, 2 high, 1 moderate). Server packages are body-parser, proxy-addr, qs and zod. No broad fixes applied. Other findings need reachability review/remediation; fixing body-parser alone does not certify the dependency tree.
- Existing build warnings: large bundle and old Browserslist data. Prior audited 40 frontend type diagnostics remain a separately documented quality gate; no new standalone type-check claim is made here.
- No Linux deployment, PHP execution, real RLS/auth integration, remote uploads or hosting-account inspection occurred. Locally passing mocks do not close those gates.

Blocking items: previously exposed production credential remains unrotated; configured primary destination is wrong/unverified; actual PHP contract/private configuration is unknown; Linux Sharp startup is unverified; profile role integrity and live Storage policies are unverified; isolated staging is unverified; body-parser remains vulnerable and other production advisories need decisions. No production release is cleared.

**Exact next implementation step:** make the targeted body-parser lockfile remediation in both trees and add the local shared-API regression, without changing infrastructure. In parallel, an owner must provide a read-only inspection of the media host's `/api/upload.php` source/document root and Vercel project settings. Then prepare the isolated staging configuration using the confirmed contract; do not substitute the candidate URL or deploy based solely on its response headers.
