# SEO changes: review for a future merge into main

Review date: 2026-11-17 (Asia/Calcutta). Decision: **NO-GO for a production-triggering merge today.** Review preparation only; no branch deletion, merge, push, deployment, environment update or database operation is authorized or performed by this review.

## Verified Git comparison

- GitHub main: `d85cda736da064e5b9181747d92add6041ae2441`.
- GitHub backup branch: `backup/praavi-seo-updates-2026-11-17` at `56008097bbf0f67a274ed8ea1de9aed19b946aca`.
- Remote tips were read during this review and match the local comparison refs. Main is an ancestor of the candidate: zero commits behind, three ahead. A fast-forward is structurally possible; this is not a safety approval.
- Local main is at `1575a7a`, ahead of remote main. Do not substitute local main for the actual GitHub baseline.
- The active Vercel production deployment SHA and Production Branch dashboard setting remain unverified. Main may trigger production deployment; explicit approval and hosting verification are required before any update.

| Commit after remote main | Scope | Review result |
| --- | --- | --- |
| `1575a7a` | Public Supabase environment isolation and regression coverage | Retain the scoped public configuration guard |
| `0570ee0` | SEO prerendering, canonicals, public metadata, redirects, internal noindex and Markdown links; also secure upload/backend/dependency changes | Mixed commit: do not treat as SEO-only or cherry-pick wholesale under an SEO-only approval |
| `5600809` | June Offer initial-HTML SEO and portable regression checks | Tested local correction; cloud Preview outcome not verified here |

## What is already on GitHub main

The semantic blog heading commit `8ada848`, BlogPosting/social metadata commit `5c00bb1` and published-source sitemap commit `d85cda7` are already in main ancestry. This does not establish that the active production deployment serves their output. Do not cherry-pick those commits again.

## Exact remaining file scope

The committed comparison contains **103 paths**. See [the complete file inventory](seo-main-merge-review-files.csv). The two new local review artifacts themselves are outside that committed comparison and are not staged.

| Group | Paths | Handling |
| --- | ---: | --- |
| SEO implementation, static HTML, routing and regression checks | 63 | Review as the public SEO scope; route/build dependencies must remain consistent |
| Shared build and public environment isolation | 4 | Split package/lockfile changes carefully for a source-only proposal; retain the environment guard |
| Frontend upload security and upload bundle gate | 5 | Required to avoid restoring the legacy browser-secret uploader; not an SEO-only change |
| Backend upload, finance guards, dependency patches and tests | 14 | Runtime infrastructure and production authorization must be verified before promotion |
| Historical review documentation | 17 | Optional release documentation; historical test counts/status are not current deployment proof |

The additional public SEO scope includes About/all-blog/all-public prerendering, one canonical per public page, page-specific titles/descriptions/H1, WWW/trailing-slash redirects, internal-tool initial-HTML noindex, Pune targeting and service links, safe Markdown links, and the approved June Offer metadata/initial-content correction. The June app runtime/assets and rendered content were preserved.

## Why a blind SEO-only merge is not safe

The legacy main frontend uploader requires `VITE_UPLOAD_API_SECRET`. Retaining that uploader while rebuilding SEO republishes the credential; removing the setting breaks its primary upload contract. The newer candidate avoids that browser credential by depending on `/api/uploads/images` and its server authorization/storage configuration. These are different release candidates, with different security and infrastructure requirements.

Do not omit the secure uploader while using the secure candidate bundle-check result as evidence. Do not include the secure uploader without its tested API and backend environment. The mixed package/lockfile changes include `@vercel/functions` for SEO routing, and Multer/Sharp plus server dependency patches for uploads/security. File-level cherry-picking of package manifests alone would not provide a valid isolated lockfile.

## Latest available verification evidence

These are results from the immediately preceding clean-candidate verification, re-read during this review; no new full test/build run was performed just to write this document. The candidate was extracted from the committed backup baseline with only the two approved June files overlaid, then those exact files were committed as `5600809`. Private env files, unpublished drafts and the unapplied migration were not supplied.

| Check | Result and boundary |
| --- | --- |
| Candidate full production build | Passed, including server compilation and SEO/security artifact gates |
| Frontend tests | 78 passed in the clean candidate |
| Backend security/upload/finance tests | 29 passed in the clean candidate |
| SEO tests with local editorial material present | 55 passed |
| SEO tests without excluded editorial files | 54 passed, one failed: the draft-review test reads an intentionally absent JSON record file |
| Sitemap | 167 unique URLs, 106 published blogs and 61 other public pages; URL set unchanged |
| Public SEO artifact gate | Zero broken internal links or orphan pages |
| Browser credential verification | 189 text artifacts; no configured private server values matched |
| June browser preservation | Desktop/mobile text, links, forms, section geometry, heading styles and runtime assets unchanged; mobile menu unchanged; external requests blocked; no submissions |
| Frontend standalone TypeScript | Prior audit: 40 unchanged errors; current Vite build passes, a mandatory tsc CI gate would fail |

The missing-draft test dependency must be separated from release tests or replaced with self-contained test fixtures while retaining meaningful coverage. Do not commit unpublished editorial material merely to make release CI green, and do not silently ignore/skip this failure. No test behavior is changed by this review.

## Production blockers and verification limits

1. Earlier today, count-only anonymous Supabase reads using the public project/key present in the live bundle found visible rows in `User`, `Employee` and `Quotation`. No row bodies were downloaded and writes were not attempted. This review did not repeat those requests. Obtain an authorized grant/RLS inventory and reviewed remediation; noindex and rotating a public anon key do not solve direct data access.
2. The prior live bundle still contained the legacy upload credential. The new candidate passes browser credential checks, but secure backend/media authorization, durable storage and a coordinated retirement/rotation remain required. No credential was rotated.
3. Preview protection and safeguards were confirmed by the owner for the latest push. That confirmation does not verify production environment variables, admin/non-admin upload responses, Linux Sharp loading, PHP authenticated POST compatibility, or actual Storage policies. Confirm the latest Preview builds commit `5600809` and exercise approved isolated workflows before promotion.
4. Confirm explicit server `JWT_SECRET`, immutable admin-role assignment and service-role usage boundaries. The existing Sheets browser key authority and deployed handler remain unverified; the repository example key differs from the frontend fallback. Review private-data authority and production form destinations rather than assuming Preview isolation.
5. Resolve the excluded-draft test dependency before requiring a clean CI run. Existing TypeScript errors and reachable dependency advisories need explicit triage. The residual Zod advisory remains open despite tested collection guards.
6. Main push/merge authorization has not been given. Vercel Production Branch settings and a secure-compatible rollback artifact must be confirmed; current legacy production is not an automatically safe rollback target.

## Required configuration verification (names only)

- Public frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` or the supported publishable-key alternative.
- Server: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, strong explicit `JWT_SECRET`.
- PHP media branch, when used: `UPLOAD_API_URL`, `UPLOAD_API_SECRET`, `UPLOAD_PUBLIC_ORIGIN`. Match server-only authorization at both ends.
- Existing finance bootstrap credentials are conditional on that login flow. Do not place private credentials in any VITE-prefixed variable.
- Dashboard presence/scope is not verified by local env files. No values are recorded or changed here.

## Recommended route to a reviewed production change

1. Keep both main and the existing backup branch unchanged while this review is pending. Retain the backup as a recovery/reference point.
2. Verify the active production SHA/branch and save deployment/configuration rollback references without exposing env values.
3. Make the release tests independent of unpublished drafts, then rerun the exact clean committed candidate, including appropriate type-gate acceptance.
4. Obtain separate approval for database security remediation and upload infrastructure changes; test anonymous denial, intended authenticated roles and public media reads without breaking existing data/media.
5. Verify the protected Preview result and Linux function packaging; exercise admin login, unauthorized/admin uploads, media/Storage fallbacks, returned images, isolated forms, redirects, initial HTML and internal-tool access. Do not submit staging forms to real production destinations unintentionally.
6. Review the actual combined release manifest, including necessary security dependencies, rather than labeling the current mixed branch SEO-only. No source branch or PR is created by this review.
7. Only after blockers are resolved and explicit production approval is given, update main or promote the approved deployment through the agreed deployment process. Coordinate the old upload credential retirement/rotation after a verified secure cutover.
8. Smoke-test production after an authorized release. Roll back only to a secure-compatible artifact; never restore exposed browser credentials or permissive anonymous finance policies.

## Exclusions and scan scope

The committed-delta scan found no matches for locally configured private values or common private-token/key patterns. This is not a claim that every historical integration is safe. `.env.example` and `server/.env.example` pending edits remain local; private env files are ignored. `.tmp`, Vite timestamp artifacts, the prepared Storage SQL migration and unpublished editorial files remain outside the release. Existing tracked SQL/history is not removed by that exclusion.

This review creates only this Markdown document and its CSV inventory. It changes no application code, June Offer content, test implementation, environment setting or database record. It does not authorize a production deployment.
