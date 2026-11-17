# Three duplicate-canonical blog URLs: audit and fix

Date: 2026-11-16. Implemented and verified locally. No push, deployment, database/content edit, credential rotation or production setting change occurred. All external checks used read-only public requests.

## Findings for the reported URLs

| Canonical path | Actual title / H1 | Source body words | Genuine publication date |
| --- | --- | --- | --- |
| `/blog/facebook-vs-instagram-ads-which-one-works-better` | Facebook vs Instagram Ads: Which One Works Better? | 411 | 2026-05-22T11:34:34.481Z |
| `/blog/how-to-create-viral-content-on-instagram-reels` | How to Create Viral Content on Instagram Reels | 310 | 2026-05-11T05:13:30.460Z |
| `/blog/how-to-choose-the-perfect-domain-name-for-your-business` | How to Choose the Perfect Domain Name for Your Business | 385 | 2026-03-19T11:59:51.780Z |

The titles, excerpts and full content were read from each uniquely matching published blog record. They are distinct meaningful articles about platform comparison, Reels content strategy, and domain selection. No content was rewritten or generated. All three were already present in the canonical sitemap and remain there exactly once.

Fresh production GETs for all three www URLs and all three non-www variants returned **200**, with no unexpected redirect. Each initial response instead contained:

- The homepage title and homepage meta description.
- **Zero canonical links**, zero H1 headings and an empty React root.
- No JSON-LD script and `og:type=website`.

HTTP www variants correctly returned **308 to the same HTTPS www article URL**. Non-www HTTPS variants currently return 200 rather than redirecting to www. No duplicate canonical tags were present in the old responses; the defect was their absence.

## Root cause

The existing shared blog component had correct article metadata, schema, title/H1 and content **after fetching and rendering in React**. Vercel served the homepage SPA shell on direct article requests, so none of those article signals existed in initial HTML. This is the confirmed implementation defect consistent with the supplied Search Console finding; Google's internal canonical-selection decision is not observable here.

## Fix

The build now prerenders the **complete published, canonical, indexable blog dataset**, not a hardcoded three-article sample. Current output is **106 article HTML files**. It reuses the same article component, row mapping and BlogPosting builder as the browser.

The data fetch retains the existing pagination/exact-count protections. Indexability is checked with the existing sitemap rules, then the fresh eligible dataset and genuine lastmod timestamps must match this build's sitemap. Missing rows, duplicate slugs, incomplete content, API failures or sitemap drift fail the build instead of producing partial output or seed content.

Each initial article response contains:

- Exactly one `https://www.praaviconsultants.in/blog/<slug>` canonical.
- Its real title followed by ` | Praavi Blog`, and its existing excerpt as description.
- One real title H1 and all existing article paragraphs/numbered semantic H2 sections.
- One BlogPosting JSON-LD script from the existing builder, retaining confirmed Praavi Consultants organization authorship/publisher, genuine source dates and image. No modification date is invented when the source has none.
- Dynamic article Open Graph and Twitter metadata, with one tag per property/card, real image and publication time where available, and no unverified Twitter handle.
- The actual built official logo URL, rather than an SSR source-file URL.

Vercel checks for the generated `/blog/<slug>.html` artifact before the SPA fallback. Missing files fall through to the existing client-rendered behavior, preserving unpublished/unknown/new-route handling. The advanced route `check` and capture syntax follow [Vercel's documented route model](https://vercel.com/docs/build-output-api/configuration#routes). Direct artifact URLs redirect to their extensionless public path. Existing public slugs are unchanged.

Trailing-slash and query variants receive the same preferred canonical. All canonical, schema and social URLs consistently use HTTPS www. Domain-wide non-www redirect settings were not changed; requests reaching these artifacts receive the preferred www canonical even on another attached hostname.

## Client behavior and preservation

The original article markup, styling, headings, numbering, image fallback and links are reused without modification. A source comparison against the pre-task snapshot confirmed both the content-rendering helper and article JSX are identical. The default component now delegates its resolved post to that same presentational component.

An escaped public JSON payload lets React keep the already-rendered article visible while its existing API revalidation runs. The payload is accepted only for the matching slug with the expected fields. It does not expose draft/private records. Client navigation ignores another article's payload and retains the existing live fetch behavior.

A snapshot of the original public social defaults prevents prerendered article metadata from becoming the fallback metadata on later non-article navigation. Existing metadata/script cleanup remains in place. JSON payloads/schema escape HTML-significant characters; malicious `</script>` content does not create executable markup or alter the article text.

No new backend endpoint, privileged API access, dependency upgrade or production infrastructure is required for this build-time change. No authenticated data is prerendered. Existing secure-upload and finance safeguards were preserved.

## Validation results

| Check | Result |
| --- | --- |
| Frontend/application tests | **42 passed**, including 3 new prerender-data/navigation tests |
| Sitemap/prerender tests | **32 passed**, including 7 new article HTML, schema, social, safe JSON, dataset completeness and routing tests |
| Existing backend security/upload/finance tests | **29 passed** |
| Total | **103 passed** |
| Full production build | Passed; **106 complete published/indexable articles** prerendered |
| Browser credential scan | Passed across **127 text artifacts**, including all article HTML |
| Generated article audit | All 106 files have one matching canonical, H1 and BlogPosting script, matching title/description/social metadata and resolved publisher logo URLs |
| Three target pages: actual built local HTTP | 200 for extensionless, slash and query variants; one correct self-canonical/H1/schema; matching source title/excerpt/content |
| Article content | Every nonempty source line is present in initial article text after the existing heading whitespace normalization |
| Real dates | Publication dates match source ISO values; modification date absent for all three because the source provides none |
| Social metadata | `og:type=article`, `twitter:card=summary_large_image` for each target; one card/property per page |
| Logo | Built publisher logo resolves successfully over local HTTP |
| Artifact aliases | 308 to the same extensionless article path |
| Sitemap | **167 unique URLs**, including all three once; source XML unchanged |
| Additional frontend type check | Existing **40 diagnostics**, zero in changed blog/client/schema-head/entry/test files |

Commands: `npm test -- --reporter=dot`, `npm run test:sitemap`, the existing four-file backend Node suite under a 128 MiB JavaScript heap cap, and `npm run build`. SSR test files run serially to avoid Vite 5's shared test WebSocket-port collision; the final 32-test command passed without that collision. Existing Browserslist/chunk-size/deprecation warnings remain.

Actual local preview checks inspected raw HTML without running browser JavaScript, and compared target payloads against freshly fetched published API data. Vercel configuration was exercised with a route model; no real cloud deployment was made. Generated collector differences were restored to their pre-task contents after building.

## Files changed by this task

- `src/pages/BlogPost.tsx` — reuse the article component and matching prerender payload.
- `src/lib/contentApi.ts` — share the existing blog row mapping without changing its field behavior.
- `src/lib/blogPrerender.ts` — new validated public payload reader.
- `src/entry-blog.tsx` — new build-only public article renderer.
- `src/components/SeoHead.tsx` — restore original social defaults after prerendered article navigation.
- `scripts/lib/blogPages.mjs` — new full-dataset prerender, initial metadata/schema and local serving logic.
- `scripts/lib/aboutPage.mjs` — export the existing built-asset resolver for reuse by blog output.
- `vite.config.ts` — register blog prerender plugin.
- `vercel.json` — prepared static article rewrites, existence checks and artifact redirects.
- `src/test/blog-prerender.test.tsx` — new client regressions.
- `scripts/blog-seo.test.mjs` — new initial HTML/data/routing regressions.
- `scripts/internal-seo.test.mjs` — account for checked static rewrites in its route model.
- `package.json` — include article regressions and serialize SSR test files.
- `docs/blog-canonical-audit.md` — this report.

`src/lib/blogSchema.ts` was not modified. No blog content, database records, slugs, URLs, package versions or production settings were changed. `dist/blog/*.html` are generated artifacts, not hand-edited sources. Local `.tmp/blog-canonical/` snapshots are diagnostics, not release files.

## Deployment limits

The live responses remain unchanged until an approved deployment and Google recrawl. Initial HTML is a build-time snapshot: publishing, editing, unpublishing or deleting an article requires a new build/deployment to refresh or retire its static artifact, as with the existing generated sitemap. Browser revalidation does not refresh what non-JavaScript crawlers receive. No automatic publishing hook or production configuration was added.

After an approved release, verify actual Vercel rewrites/aliases and Search Console's received HTML for the three URLs. Canonical selection and indexing remain Google's decisions; these local checks do not claim that Search Console has already cleared the reports. Previously documented deployment/security blockers are outside this article-specific fix.
