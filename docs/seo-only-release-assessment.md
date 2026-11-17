# SEO-only production release assessment

Assessed 2026-11-16 (Asia/Calcutta). **STOP / NO-GO: the SEO-only candidate is source-isolatable but cannot be released safely under the stated constraints.** Preserving the legacy primary upload path requires a browser-embedded shared credential; omitting it breaks that path. Existing exposure in production is not a security exception for a rebuilt release.

No push, deployment, production configuration change, credential rotation, SQL application, release commit, or release branch was performed. The unfinished secure-upload working tree was preserved. Only this assessment was added to that working tree during the SEO-only assessment.

## Exact candidate commits

Baseline before the SEO work: `89e95fe972f11d80b401fb235b10c8a6072adcc6`.

| Ordered commit | Completed change |
| --- | --- |
| `8ada848988c80a3c42f6fa1d4e29ac2c9579f972` | Numbered blog sections become semantic H2 elements, preserving presentation and title H1 |
| `5c00bb13b65797c34995ef55b990ec5d63b9e3e0` | BlogPosting JSON-LD, real date metadata, article Open Graph/Twitter metadata, duplicate/stale-tag handling and tests |
| `d85cda736da064e5b9181747d92add6041ae2441` | Complete published-source sitemap with pagination, genuine timestamps, exclusions and validation |
| `1575a7a8c5e78f2e697293999f1933cd7111c917` | Limit shared Supabase bundling to its public settings; additional regression checks and historical readiness document |

The tip already includes the earlier commits. These hashes identify a **blocked prospective candidate**, not an approved release. Do not cherry-pick them again onto the current tip or deploy the diagnostic build.

The fourth commit's configuration isolation matters: the sitemap refactor shares Supabase configuration with frontend consumers, and passing all of `import.meta.env` would spread unrelated Vite settings into additional bundles. This fix limits that spread; it does not remove the legacy uploader's own credential dependency.

## Exact candidate file delta

The cumulative delta from the baseline through the candidate is these 16 files: 15 implementation/build/test files plus one historical review document.

```text
docs/seo-production-readiness.md
index.html
package.json
public/sitemap.xml
scripts/generate-sitemap.mjs
scripts/lib/sitemap.mjs
scripts/sitemap.test.mjs
src/components/SeoHead.tsx
src/lib/blogSchema.ts
src/lib/blogStore.ts
src/lib/contentApi.ts
src/lib/supabase.ts
src/lib/supabaseConfig.mjs
src/pages/BlogPost.tsx
src/test/blog-schema.test.tsx
src/test/seo-head.test.tsx
```

No delta exists in `src/lib/uploadApi.ts`, `src/pages/AdminDashboard.tsx`, `server/src/index.ts`, `vercel.json`, root `package-lock.json`, or the server package/lockfile across that baseline/candidate comparison. Legacy upload handlers and infrastructure remain unchanged in this candidate.

The candidate excludes the new upload route/library, secure-upload SQL migration, Storage policy changes, hardened PHP template/integration, new upload tests, Multer, Sharp, and the modified secure-upload build script. The original baseline PHP example and existing website/backend files remain baseline content; no new PHP integration was imported.

## Isolation and dependency results

- Tracked source at the exact tip was extracted using `git archive` into an isolated temporary directory. No real private environment files or upload credential were copied into it. The original working tree was not checked out, reset, stashed, or rewritten.
- A clean `npm ci` succeeded using the candidate's own unchanged lockfile. Current secure-upload dependencies were not reused through a node_modules junction.
- The only candidate package change is the sitemap test command; it introduces no dependency/lockfile change. No new dependency or native-packaging conflict was observed in the isolated build.
- The secure-upload branch's package/build-script edits cannot be mixed into this candidate: they depend on excluded upload runtime files and would defeat the isolation.
- Clean installation still reports 32 existing npm audit findings, including critical/high findings. Isolation does not resolve them. The prior staging audit provides runtime-versus-tooling classifications and the existing frontend type-error assessment.

## Build, test and security evidence

The isolated directory is `D:/Android/Temp/praavi-seo-only-pvCZ0X`. It is a diagnostic copy, **not a deployable artifact**.

| Check | Result |
| --- | --- |
| Clean lockfile install | Passed |
| Baseline application tests | 31 passed |
| Baseline sitemap tests | 12 passed |
| Complete candidate production build | Passed, including sitemap generation, collector, frontend and existing server TypeScript build |
| Generated `dist/sitemap.xml` | 167 URLs, 167 unique; 106 published blogs and 61 static/service pages |
| External browser-bundle security check | **Failed, exit code 1** |
| Synthetic shared credential in rebuilt asset | **Confirmed in `dist/assets/index-BjgjWueY.js`** |
| Legacy primary upload with synthetic configuration and a mocked destination | Succeeded; the browser code sent the shared authorization header |
| Legacy primary upload without the credential | Failed before any network request |
| Production upload/credential usage during diagnostics | None; remote uploads were mocked and the value was synthetic |

The security checker was invoked externally against the isolated candidate; it was not added as unfinished upload infrastructure to the release. It checked the candidate output and returned both an authorization-marker finding and a credential-value finding. The latter establishes actual value embedding, not merely a variable-name match.

The local diagnostic summaries are `seo-only-audit-results.json` and `legacy-upload-audit-results.json` inside the isolated directory. The complete build includes only read-only public blog/indexability requests; it performs no production uploads or database mutations.

## Why the two requirements conflict

1. The baseline's `uploadImageToGodaddy` reads `VITE_UPLOAD_API_SECRET` and uses it as `x-upload-secret` in a browser request. Preserving that primary behavior requires the credential to be available to the browser.
2. Vite builds a new shared frontend asset for the H2, JSON-LD, and social metadata changes. The isolated experiment proves that a configured upload value is embedded into that asset. A real production value would follow the same path.
3. Publishing that rebuilt asset republishes the credential to every downloader, regardless of whether it appeared in an earlier deployment. This fails the requested security condition.
4. Removing the setting makes the primary uploader throw. Existing direct Storage or embedded-image fallbacks may mask that failure, but they do not establish preservation of the complete upload behavior or equivalent authorization. No fallback-only workaround was introduced.
5. Moving the credential behind verified server-side authorization would require infrastructure/cutover changes excluded from this SEO-only release. Merely renaming the frontend setting, hiding it in an admin chunk, or obfuscating it would not make it private.

The legacy upload source being unchanged therefore proves source separation, **not safe deployment**. The already prepared secure working-tree build has a different security result precisely because it includes the infrastructure explicitly excluded from this candidate; its passing check cannot be substituted for this candidate's failing check.

## Remaining risks and decision

- Blocking: renewed browser distribution of the exposed upload credential if the original upload configuration is preserved.
- Blocking alternative: missing primary upload authorization if that configuration is removed. No live end-to-end success is claimed; mocked compatibility checks only establish the legacy contract.
- Existing dependency advisories remain, including shared API findings documented in the staging audit. Existing frontend type-quality issues are not fixed by this isolation; this assessment did not rerun or remediate that separate type gate after the release security failure.
- Client-rendered social metadata still requires SSR/prerendering/static article HTML for reliable social previews. The existing Diwali canonical mismatch/exclusion is unchanged.

**Deployment is not safe and release preparation has stopped.** No production release package/commit is approved. Finish and validate the authenticated upload cutover, including approved credential rotation and policy/configuration decisions, or obtain approval for another proven secure architecture before reconsidering a rebuilt frontend release. This assessment does not authorize either path or propose deploying a partial workaround.
