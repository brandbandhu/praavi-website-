# Secure media uploads: staging readiness audit

Audit date: 2026-11-16, Asia/Calcutta. Baseline commit: `1575a7a`; the secure-upload changes are still local and uncommitted.

**Decision: locally validated, but not cleared for production. An isolated, protected staging rehearsal is required.** No staging deployment was created. No push, deployment, credential rotation, SQL migration, production upload, or production configuration change was performed. Production observations below used read-only GET/HEAD requests or a read-only bucket-metadata request; credential values were kept in memory and never displayed.

This audit supersedes the deployment order in the earlier upload report. In particular, do not apply the Storage restrictions or rotate the production credential before the secure backend and its service-role fallback are ready.

## 1. Checks passed

| Check | Result |
| --- | --- |
| Application tests | 35 passed, including four frontend upload tests and all prior SEO tests |
| Sitemap tests | 12 passed |
| Backend upload tests | 10 passed, using real local multipart requests/decoding and mocked Auth/remote destinations |
| Total automated tests | 57 passed |
| Complete production build | Passed: sitemap, standalone collector, Vite, server TypeScript, and credential gate |
| Browser credential gate | Passed across 19 generated text artifacts; no private upload-header marker or configured private server credential values found |
| Real `api/index.js` smoke test on localhost | Express export detected; unsigned and legacy-shared-header requests returned 401 before body parsing; GET upload returned 405; existing health returned 200 |
| Local runtime proxy setting | `trust proxy` is false |
| Native image library locally | Sharp 0.35.5 and libvips 8.18.7 loaded and processed raster/SVG input on Windows x64, Node 25.5.0 |
| SEO artifacts | 167 unique sitemap URLs, matching public/build XML; correct robots reference; all heading/schema/social tests passed |
| Changed application scope during this audit | No application or infrastructure configuration changes; audit/report documentation only |

Local tests cover missing/forged sessions, non-admin rejection, four upload folders, signature/MIME validation, invalid and oversized files, unsafe SVG, server-only upstream headers, restricted upstream URLs, authenticated fallbacks, sanitized failures, and per-process rate limits. These are not a substitute for cloud, PHP, or real RLS tests.

## 2. Hosting and integration findings

| Read-only observation | Result | Meaning |
| --- | --- | --- |
| Public website | HTTP 200 with Vercel headers | Confirms the current public frontend is served through Vercel |
| Existing `/api/health` | HTTP 200, healthy/configured response | Existing same-origin Node API routing is live |
| New `/api/uploads/images`, GET | HTTP 404 | Expected while the new route remains undeployed; not proof of upload compatibility |
| Currently configured PHP destination, HEAD | HTTP 404 with Vercel headers; no PHP version disclosed | **Primary upload destination is not verified and must be corrected/confirmed before release** |
| Public media host `/api/upload.php` candidate, HEAD | HTTP 405, advertises PHP 8.3.36 | Plausible existing PHP service; method response/header do not prove its private credential, multipart contract, folder support, or new WebP handling |
| Public media host `/upload.php` candidate, HEAD | HTTP 404 | Not a confirmed alternative |
| Existing public media image | HTTP 200 | Current media reads work; no files were changed |
| Supabase `case-study-images` bucket metadata | HTTP 200; public bucket; no bucket-specific MIME/byte limits configured | Public reads are compatible; API validation and the restrictive write policies are essential |
| Public production browser bundle | Still contains the known exposed upload value | **The production exposure has not been remediated by local changes. Value omitted from this report** |
| Local frontend project versus public production bundle | Match | Current local configuration is production-connected, not isolated staging |

The repository structure is compatible in principle with a Vite frontend plus a Node Vercel function: `api/index.js` exports the compiled Express app, `/api/(.*)` is routed before the SPA fallback, and the frontend posts to a relative same-origin path. Upload routing precedes JSON parsing. Do not deploy only `dist/`: the function and `server/dist/` must also be packaged. PHP runs on the separate media host, not in Vite's static output or the Node function.

The current Vercel Node adapter recognizes an Express export by its `listen` function and skips its generic request helpers for that export. That supports the Multer stream approach; it does not replace testing the actual deployed multipart path. Platform buffering and its request ceiling may occur before application authorization. No Next.js body-parser setting is prescribed for this Express/Node entry point. Sources: [Vercel Express](https://vercel.com/docs/frameworks/backend/express), [Node adapter implementation](https://github.com/vercel/vercel/blob/main/packages/node/src/serverless-functions/serverless-handler.mts).

**Important blast radius:** the upload module imports Sharp at API startup. Missing/incompatible Linux native binaries can prevent the entire shared API, including finance/health routes, from starting. A Linux/cloud cold-start test is a release gate, not an optional upload-only check.

An HTTP 200 upload response is insufficient proof of primary service readiness: the implementation intentionally falls back to Storage and then an embedded image. Acceptance tests must verify the returned URL's expected destination and retrieve the persisted object. Do not accept an inline data URL as proof of durable PHP/Storage success.

## 3. Supabase policy review

The migration is `database/supabase-secure-media-uploads.sql`. It has **not** been applied or SQL-executed during this audit. Its transaction creates three restrictive policies for insert/update/delete on `storage.objects`, scoped by the `case-study-images` bucket condition. There are no object renames/deletions, bucket-public changes, or SELECT-policy changes.

| Actor/operation | Intended result after migration |
| --- | --- |
| Anonymous upload through API | 401 before multipart parsing |
| Authenticated non-admin through API | 403 after server Auth/role verification |
| Verified database admin through API | Allowed, subject to file/rate limits |
| Direct anonymous or authenticated Storage insert/update/delete, including direct admin SDK writes | Denied for this bucket by design |
| Backend service-role Storage fallback after API admin checks | Allowed; service role bypasses Storage RLS |
| Public GET of existing media | Preserved; bucket is public and no read policy changes |
| Existing objects, names, URLs and historical formats | Preserved; the migration does not touch media data |
| Other buckets | Restrictive condition permits them to retain their existing policy behavior; it grants no new permission |

This is **server-only bucket writing**, not a policy that grants direct authenticated-admin uploads. Admin eligibility is enforced by `getUser(token)` plus `profiles.role = 'admin'` in the backend. The private service credential must never reach browsers. Restrictive policies are combined with existing permissive policies using AND, so a broad existing authenticated-write policy does not defeat this restriction. Sources: [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [Supabase service-key behavior](https://supabase.com/docs/guides/storage/security/access-control).

Still pending in isolated staging: apply the transaction; test each identity/operation above; confirm update/delete rejection via SDK errors or zero affected objects as appropriate; verify public GET of pre-existing objects; verify another bucket's existing behavior. Also inspect actual `profiles` grants/policies and triggers to ensure a user cannot self-assign an admin role. Bucket metadata alone does not establish the live object/profile policy definitions.

Read-only policy inventory an approved operator can run in the matching project:

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'storage' and tablename = 'objects')
   or (schemaname = 'public' and tablename = 'profiles')
order by schemaname, tablename, policyname;
```

Do not run authorized manual upload tests using the current local environment: it points to the same project as production. Current automated tests use mocks and do not create remote objects.

## 4. PHP and Sharp requirements

**PHP:** the sample's language/randomness requirements are met by PHP 7+, but WebP `getimagesize` support makes PHP 7.1 the practical compatibility floor. Those obsolete branches are not acceptable deployment targets. The candidate header advertises PHP 8.3.36; PHP 8.3 remains security-supported on the audit date. Verify a current supported patch through the host console rather than relying only on a header. PHP 8.4/8.5 are supported alternatives. Require Fileinfo (`finfo`), WebP-aware `getimagesize`, `hash_equals`, `random_bytes`, multipart uploads, writable temporary/target directories, private environment access, and no script execution in media directories. GD is not used by this PHP implementation. Set `upload_max_filesize` to admit the 4 MiB application limit and `post_max_size` above it for framing. Confirm web-SAPI/FPM configuration, not just CLI settings. Sources: [PHP WebP support](https://www.php.net/manual/en/function.getimagesize.php), [supported PHP versions](https://www.php.net/supported-versions.php).

PHP CLI is absent locally, so `php -l server/upload.php.example`, extension checks, and web-runtime tests remain pending. The example is outside the public tree and was not installed on the host.

**Sharp:** locked version 0.35.5 requires Node >=20.9.0; use an approved provider-supported LTS. Root and server runtime dependency manifests include Sharp/Multer, and both lockfiles include Linux x64 Sharp/libvips optional packages. Local Windows codec success does not validate Linux packaging. Install optional dependencies on the target Linux architecture, do not upload Windows `node_modules`, and verify native package tracing plus a fresh API cold start. No Docker or Vercel CLI is installed locally, so target packaging is pending. See [Sharp installation requirements](https://sharp.pixelplumbing.com/install/).

The 4 MiB file ceiling plus bounded multipart fields is below Vercel's 4.5 MB request limit. The embedded response ceiling is also below that response limit. Verify actual function memory, timeout, tracing size, architecture, and provider settings in staging; the in-process rate/concurrency limits are not distributed limits. Source: [Vercel limits](https://vercel.com/docs/functions/limitations).

## 5. Environment inventory — names only

No environment variable values are included here. Local presence is verified; cloud scopes/branch overrides remain unverified.

| Location | Names | Requirement |
| --- | --- | --- |
| Frontend/staging build | `VITE_SUPABASE_URL`; `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY` | Explicit isolated-project settings; do not rely on the production fallback defaults |
| Node Auth | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Match the frontend project; code can fall back to the private service credential, but prefer the anon key for user-scoped verification |
| Node Storage | `SUPABASE_SERVICE_ROLE_KEY` | Private, matching-project credential needed for the server-only Storage fallback |
| Node primary media integration | `UPLOAD_API_URL`, `UPLOAD_API_SECRET`, `UPLOAD_PUBLIC_ORIGIN` | Private server configuration; confirm final nonredirecting PHP endpoint and public origin |
| PHP host | `UPLOAD_API_SECRET`, `UPLOAD_PUBLIC_ORIGIN` | Same environment-specific upload credential/public origin as the Node integration |
| Existing shared backend | `JWT_SECRET`; conditional existing `FMS_ADMIN_USERNAME`, `FMS_ADMIN_PASSWORD`, `FMS_FINANCE_USERNAME`, `FMS_FINANCE_PASSWORD`, `META_GRAPH_ACCESS_TOKEN`, `META_GRAPH_API_VERSION` | These are not upload authorization inputs. Keep staging values isolated; configure only if those separate features are tested |
| Local/provider runtime | `PORT`, provider-managed `VERCEL`, `NODE_ENV` | Respect existing local proxy and provider runtime behavior; do not manually change production during this audit |
| Retire after secure rollout | `VITE_UPLOAD_API_SECRET`, `VITE_UPLOAD_API_URL` | Absent locally; inspect/remove from all applicable production/preview/development scopes and CI/branch overrides during approved cutover |

Current local frontend/server project identifiers match one another and the public production browser bundle. Private settings exist in ignored `server/.env`; no values were changed during this audit. Remote PHP configuration and provider/CI inventories still require operator access. A Vercel integration is available but not installed/connected; suggesting it did not connect or modify an account.

## 6. Forty TypeScript errors: scope and release impact

Fresh compiler-host comparison with the committed baseline returned **40 baseline errors, 40 current errors, zero introduced diagnostics**. The production Vite build and server TypeScript compilation pass. Vite does not make a passing standalone frontend type check part of the current build script.

| File/group | Count | Impact |
| --- | --- | --- |
| `src/pages/AdminDashboard.tsx`, TS2339 | 1 | Legacy crypto/UUID feature-detection narrowing; in a changed file, but outside changed upload lines |
| `src/pages/digital-marketing-team/DigitalMarketingTeamRoutes.tsx`, TS2550 | 1 | Existing `replaceAll` usage versus declared library target |
| `src/pages/Index.tsx`, TS2322 | 36 | Existing Lucide component/size type incompatibilities |
| `src/pages/ViewDetails.tsx`, TS2322 | 2 | Existing unsupported `noIndex` and `badge` props; component is not registered in the current router |

No diagnostic points to the new upload client, upload test, or backend code. These are not observed upload regressions, but **they block a release policy requiring a green frontend type gate** and need fixes or an explicit documented waiver. Unsupported `noIndex` is not enforced by the component; fix access/metadata behavior before exposing that dormant internal page. No unrelated type fixes were attempted.

## 7. Dependency advisories and reachability

Fresh npm reports, not summed because the trees overlap:

| Dependency tree | npm vulnerability total | Severity totals |
| --- | --- | --- |
| Root, all dependencies | 32 | 3 critical, 20 high, 8 moderate, 1 low |
| Root, production only | 18 | 1 critical, 14 high, 3 moderate |
| Server, all / production only | 4 in each report | 1 critical, 2 high, 1 moderate |

No npm finding names the newly added Multer 2.5.0 or Sharp 0.35.5. This is not a guarantee against every native-library vulnerability.

| Finding | Relation to the changed deployment | Release assessment |
| --- | --- | --- |
| `body-parser` 1.20.6, high | Shared Express app still runs default `express.json()` on other routes before their authorization. The multipart upload route bypasses this parser, but an affected sibling request can crash the shared process | **Production release blocker until patched to a fixed compatible version or an approved effective mitigation is implemented/tested** |
| `proxy-addr` 2.0.7, critical | Present in shared Express runtime. The cited exploit requires particular trusted-proxy subnet configuration; local `trust proxy` is false and upload authorization/rate limiting uses verified user ID, not IP | Not a demonstrated upload-auth bypass under current source settings; patch or obtain a documented configuration-specific security decision before public release |
| `qs` 6.15.3, moderate | Express extended query parser runs in the shared request pipeline; individual advisories have different parse/stringify/option prerequisites | Shared runtime risk, not safely dismissible as dev-only; patch and regression-test or document verified non-reachability per advisory |
| `zod` 3.25.76, high | New upload route uses manual validation, not Zod. Existing finance routes validate arrays/collections using Zod | No direct new-upload exposure identified; assess collection/body bounds and remediation. Audit proposes a major-version fix, so do not apply blindly |
| React Router stack, high | Browser runtime dependency, including the existing application/router. SSR-specific advisories differ from redirect advisories; this app uses client rendering | Runtime security review/upgrade remains pending; no new untrusted navigation was added by upload code |
| Vite/Vitest/Tinypool, including critical findings | Development/build/test tools; no test UI server is part of the production app | Do not expose dev/test servers or run untrusted jobs with secrets. Address tooling risk separately; not direct production upload handlers |

The body-parser advisory describes an unauthenticated compressed-body crash condition with default parsing; it is a meaningful shared-API blocker even though tests pass. The proxy advisory is configuration-dependent, so severity alone is not evidence of current exploitability. No DoS exploitation was attempted. Sources: [body-parser advisory](https://github.com/advisories/GHSA-27r3-jxmh-p828), [proxy-addr advisory](https://github.com/advisories/GHSA-jqcg-44mw-7w3h), [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). No packages or lockfiles were updated during this audit.

## 8. Staging existence and safe setup plan

No staging project binding, staging environment file, staging hostname, or CI deployment workflow is recorded in the inspected checkout. `.vercel/project.json` is absent and no connected Vercel account is available. **A separate cloud staging environment is unverified, not proven absent.** An owner should first inspect the Vercel project/deployment inventory and Supabase/PHP environments through read-only account access.

If none is isolated, obtain explicit approval before creating or deploying anything:

1. Use a protected separate Vercel staging project or a carefully scoped Preview environment. Ensure it deploys the Node function and static frontend together. Never use a publicly exposed Vite development server as staging.
2. Use a separate Supabase project with synthetic admin/non-admin users and representative media fixtures. Use a separate PHP staging host/document root and media directory/origin. Never reuse production service credentials, upload credentials, storage buckets, or role records.
3. Explicitly override frontend and backend Supabase settings. The shared source has production fallback defaults; a missing staging override is dangerous. Validate that both point to the same isolated project before any authorized upload test. Audit other outgoing integrations so staging cannot send production leads, emails, webhooks, or finance writes.
4. Add access protection and preview-only noindex headers through an approved staging configuration. Keep the canonical production-domain SEO implementation unchanged; the build's sitemap/domain checks are production-oriented. Rehearse with an appropriate synthetic content set rather than assuming an empty staging database must produce 167 URLs.
5. Verify Node/Linux Sharp packaging, PHP support, the genuine PHP upload destination, role-protection policies, service-role writes, and public image reads. Rehearse the migration and credential lifecycle only on staging resources after approval.
6. Run the existing test/build gates, then the identity/format/folder/limits/fallback test matrix. Distinguish a Vercel protection login response from an application 401/403. Browser sessions or an approved private protection-bypass mechanism may be needed for this check; do not put bypass credentials in command arguments or logs.

## 9. Release blockers and required manual actions

1. **Current production credential exposure:** the known value is still in the public production bundle. Only an approved rotation makes old copies unusable; do not confuse the clean local bundle with a production fix.
2. **Unverified primary service target:** the current configured destination returns 404. Confirm the media-host candidate's source, credential handling, exact multipart contract, four folders, output path/origin, and WebP acceptance, then correct configuration/examples through an approved change.
3. **No validated isolated staging:** confirm or prepare it before authorized uploads; local configuration currently points at production.
4. **Unexecuted policy/auth verification:** prove restrictive RLS, public reads, other-bucket compatibility, and protected admin-role assignment in staging.
5. **Unverified cloud native/runtime packaging:** test a real Linux function cold start and health route, supported Node, PHP web SAPI, optional binaries, memory and timeouts.
6. **Shared runtime security gate:** remediate the body-parser issue and review the other production dependency findings. Passing tests do not waive the advisories.
7. **Frontend type-quality gate:** resolve or explicitly waive the existing 40 errors according to the owner's release standard; no new upload errors were introduced.

## 10. Safe deployment and exact credential-rotation order

All remote actions below require explicit approval; none were executed here.

1. Finish the protected isolated staging rehearsal and security/type decisions. Freeze reviewed source and both lockfiles. Prepare an immutable secure rollback candidate that includes the backend proxy and new client; the current committed/deployed legacy uploader is not a safe rollback target.
2. Reserve a short admin publishing/upload maintenance window and record non-secret configuration/policy backups and media recovery references. Do not delete or rewrite existing media.
3. Prepare the real PHP service to handle the new WebP contract using private environment configuration. At initial backend readiness verification it may temporarily retain the existing matching upload credential; this is not the final security state. Do not require operators to disclose it.
4. Deploy the secure Node API and frontend with the required private server variables and verified same-project service-role fallback. Do not rely on publishing `dist/` alone. Confirm the API cold start, 401/403 behavior, and authorized primary and Storage destinations before restricting old clients.
5. Only after the new client/backend are available and service-role writes are proven, apply the reviewed restrictive Storage migration during the approved cutover. Verify public reads and other buckets. Refresh admin browser sessions so cached legacy clients cannot depend on direct Storage writes.
6. **Rotate after the secure backend is ready:** generate a fresh high-entropy value in the operator's secret manager. Configure it privately on PHP, then update the Node `UPLOAD_API_SECRET` and release/restart the function instances so they use it. Coordinate closely; while PHP and Node briefly differ, the verified backend must retain the already-tested durable Storage fallback. Never accept the exposed key as a long-lived secondary key. Stage this handoff first.
7. Remove the retired `VITE_UPLOAD_*` settings from all relevant provider scopes, CI stores, and branch overrides. Build/redeploy the secure code as required by provider environment propagation. Do not rebuild the old browser-secret implementation. Keep the replacement private.
8. In an approved operator harness, verify the old value receives 401 from PHP without writing a file, and the replacement allows a verified admin upload through the Node API. Use secret-manager/process-memory inputs, not literal command arguments or logs. Verify warm/cold function instances, all four folders and supported formats, correct persisted object origins, rejected invalid inputs, and no direct client Storage writes.
9. Confirm both old and new upload values are absent from fresh browser assets, retire accessible vulnerable old deployments/caches where supported, and monitor sanitized 401/403/413/422/429/5xx counts and primary/fallback behavior. Retest existing media and all SEO checks, including the production 167-URL sitemap.

The previous order, applying restrictive Storage policies or rotating the credential before the secure backend is functioning, can break legacy uploads and must not be followed. Initial fallback success is not a primary-service sign-off.

## 11. Rollback plan

- Keep the replacement credential, secure Node authorization boundary, and restrictive Storage policies. Do not restore the exposed value, frontend shared-secret code, or direct authenticated bucket writes.
- Roll back only to a tested **secure** artifact compatible with the current private credential and API contract. Staging frontend artifacts containing staging Supabase settings cannot simply be promoted as production artifacts; build the production candidate with approved production public settings.
- If PHP alone fails, keep the secure app running and use the tested service-role Storage fallback while reverting to a compatible hardened PHP implementation with the replacement credential. Embedded images are a last resort, not proof of durable recovery.
- If Sharp packaging prevents the shared API from starting, restore the secure candidate with verified Linux binaries. A legacy insecure deployment is not an acceptable default rollback. The first secure release needs this recovery candidate before cutover.
- If a policy regression occurs, pause admin writes and obtain approval for a narrowly scoped correction. Reversing the migration wholesale reopens the direct-write bypass. Preserve public reads and other buckets.
- Retain newly uploaded objects and content records across rollback; deleting them can break already published image URLs. Clean up staging fixtures or production canaries only with approval and only when no live content references them.

## 12. Pending evidence for sign-off

Owner/account confirmation of actual staging isolation; actual provider runtime and function trace; PHP host source/extensions/settings and private configuration; staging Auth/profile grants and RLS matrix; primary and durable fallback end-to-end uploads; secure rollback artifact; dependency/type decisions; approved coordinated rotation; and post-deployment smoke tests. Local tests and public metadata checks pass, but these pending items prevent production sign-off.
