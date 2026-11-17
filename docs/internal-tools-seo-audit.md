# Internal tools SEO exclusion audit

Date: 2026-11-16. Implemented locally; **not pushed or deployed**. Production settings, credentials, authentication code and database policies were not changed. No private finance/customer records were queried, prerendered or added to HTML or sitemap output.

## Routes found and protected

All listed families, their trailing-slash/direct-HTML aliases and descendants receive `noindex, nofollow` through scoped hosting headers and initial HTML. The shared policy matches whole route segments so public services and articles containing similar words are unaffected.

| Tool | Actual routes |
| --- | --- |
| Social Desk | `/social_desk`; children `/login`, `/reset-password`, `/dashboard`, `/clients`, `/content`, `/calendar`, `/boosts`, `/followers`, `/funds`, `/reports`, `/settings` |
| Internal Quote Tool | `/internal/quote-tool/myadmin`, trailing slash, `/index.html`; parent tool family is also excluded |
| DM Quotation Maker | `/dm_quotation_maker-myadmin`, trailing slash, `/index.html` |
| Finance Dashboard | `/finance-management-system/fms/login`; `/finance-management-system/fms/praavi-internal/admin` and `/finance-team`; standalone `/finance-management-system/fms/praavi-internal/app`, `/app/`, `/app/index.html` and nested app routes |
| Internal Wishes Generator | `/diwali-wishes`, trailing slash and `/index.html`; classified as internal per the requested scope |
| Additional staff-only areas found | `/digital_marketing_team` with login/dashboard/graphics/videos/daily-work/calendar/reports/history; `/my_praavi_consultant_pc_admin_yes/login` and `/dashboard` |

Legacy `/admin` paths are covered as well. Generated `/internal-app.html` is itself noindexed. These are page/source and rewrite observations, not a claim that every arbitrary descendant is a working feature.

## Existing sitemap and live indexing observations

Fresh read-only production observations:

- Live `/sitemap.xml`: HTTP 200, **167 unique URLs**, **zero internal-tool URLs**.
- Live `/robots.txt`: HTTP 200 and the correct production sitemap reference.
- Initial live HTML for Social Desk, DM Quotation Maker, Finance Dashboard and Wishes Generator: HTTP 200, no robots noindex meta and no X-Robots-Tag noindex.
- Initial live Internal Quote Tool HTML: HTTP 200 with an existing noindex meta, but no noindex response header.

The starting local sitemap also had **167 URLs and zero internal-tool entries**. Therefore **zero existing XML entries were removed**. `/diwali-wishes` was still a static generator candidate but happened to be excluded because its declared canonical differs from the sitemap's canonical URL. That candidate is now removed explicitly; exclusion no longer depends on the mismatch or current live HTML.

All internal families are now filtered from static candidates, and sitemap validation fails if an internal URL is accidentally supplied later. Published blog fetching remains paginated against the complete real dataset with no sample-list fallback.

Regenerated `public/sitemap.xml` and `dist/sitemap.xml` contain **167 unique URLs: 106 published blogs and 61 public static/service pages**. Their URL sets are unchanged from the pre-audit sitemap, and the source XML is byte-identical. This unchanged count is the accurate result, not a target count imposed by the implementation.

## Crawler-visible implementation

- The Vite build emits a separate `dist/internal-app.html` from the compiled public entry with a single robots meta tag. The public `index.html` remains unchanged and has no noindex directive.
- Vercel maps internal SPA routes to the internal HTML shell. It keeps standalone quote, wishes and finance app entry points and existing asset/function routes intact, and sends `X-Robots-Tag: noindex, nofollow` only for the internal families. The finance app base/trailing-slash aliases are covered explicitly.
- The existing Internal Quote Tool already had the correct meta and was preserved. Static DM, finance and wishes HTML now contain the meta directly. The wishes rebuild script also emits it so a standalone rebuild does not lose the exclusion.
- Local development and preview middleware serve equivalent initial HTML. React's `InternalRobots` handles later client-side transitions, adding one managed directive internally and removing it when returning to public pages. This React behavior supplements the initial HTML; crawlers do not need JavaScript to see noindex.
- The old admin Disallow rules were removed from the prepared robots.txt so crawlers can retrieve and process noindex. Existing conversion-only rules and the sitemap reference remain. No global noindex or global crawl block was introduced. Google documents that robots.txt must allow fetching for noindex to be read: [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

New HTML generation copies only the existing empty React shell, metadata and asset references. It performs no authenticated rendering, database-record serialization or private data fetching. No invoice, quotation, customer or finance records are written into generated HTML or sitemap entries.

## Public SEO preserved

Homepage, About, Contact, service pages/subservices, industries, Portfolio, published blogs and other existing public sitemap destinations retain their indexing eligibility. Public templates, canonical URLs, content, blog headings, BlogPosting schema and social metadata were not changed. All prior SEO tests pass.

Actual built local HTTP responses were checked without executing JavaScript for ten internal routes and seven representative public routes. Internal responses contained both initial robots meta and noindex headers; public responses contained neither exclusion. Vercel rules were also exercised by a route model against the checked-in configuration. This is not an actual Vercel Preview deployment; deployed rewrites/headers and eventual Google recrawling still require verification after an approved release.

## Authentication and authorization review

**Noindex is indexing control, not authentication or confidentiality.** The existing tool access controls have outstanding findings independent of these SEO changes:

| Area | Source review result / outstanding action |
| --- | --- |
| Internal Quote Tool | Its existing password check and session flag are browser-side, and a password constant is shipped in public HTML. Values are deliberately omitted here. The static assets remain directly retrievable; this does not provide server-side protection for sensitive logic or quotation/pricing material. A separately reviewed server/edge access-control change is needed before treating the tool as confidential. |
| DM Quotation Maker | Standalone static HTML/assets are publicly retrievable. A server-enforced access boundary was not verified; do not assume a browser login or noindex secures its data. |
| Finance API | Inspected routers enforce signed-token authentication, with role restrictions on writes/reporting. Existing regressions verify missing/forged token rejection and allowed/denied roles. However, supplied finance SQL grants broad anonymous access if applied, potentially bypassing the API through direct database requests. Live RLS was not queried or changed. The reported production environment inventory also omitted `JWT_SECRET`; source has a development fallback. Verify the live policies and private signing configuration before declaring finance access secure. |
| Social Desk | UI checks Supabase user authentication. Supplied SQL uses staff-role policies for data access; their actual deployment and role provisioning must be verified. UI gating alone is insufficient. |
| Staff/admin tools | Client profile/member checks exist. Actual protected role assignments and RLS remain the security boundary and require live verification. |
| Wishes Generator | Source SQL allows constrained greeting creation and restricts reads to admin profiles. Live policy enforcement is unverified; no stored greetings or customer details were read during this audit. |

No sensitive values or private record samples appear in this report or test output. Existing public credentials/logic were not copied into the new SPA shell. The SEO work does not certify these tools as access-secure or resolve the previously recorded upload infrastructure/credential blockers.

## Verification results

| Check | Result |
| --- | --- |
| Application/frontend tests | **37 passed**, including 2 new internal/public navigation tests |
| Sitemap/internal SEO command | **20 passed**, including 8 new policy, initial-HTML, Vercel route-model and local HTTP tests |
| Existing backend security/upload/finance tests | **29 passed** |
| Total | **86 passed** |
| Full production build | Passed, including complete sitemap generation, internal HTML output and server TypeScript compilation |
| Browser credential gate | Passed over **20 text artifacts**, including the new internal shell |
| Actual built local HTTP checks | 17 representative internal/public URLs passed |
| XML | Source and dist each contain 167 unique canonical URLs, zero internal routes |

Commands used: `npm test -- --reporter=dot`, `npm run test:sitemap`, the existing four-file backend Node test suite under a 128 MiB JavaScript heap cap, and `npm run build`. Tests executed scripts and local fixtures only; browser JavaScript was not executed for crawler-HTML checks. The generated collector was restored to its pre-audit contents after building. Existing bundle-size/Browserslist/deprecation warnings remain.

## Files changed by this audit

- `src/lib/internalRoutes.mjs` (new shared internal-route policy).
- `src/components/InternalRobots.tsx` (new navigation lifecycle handler).
- `src/App.tsx` (register handler).
- `scripts/lib/internalSeo.mjs` (new build/dev/preview HTML handling).
- `vite.config.ts` (register plugin).
- `vercel.json` (scoped headers and internal HTML rewrites).
- `public/dm_quotation_maker-myadmin/index.html`.
- `public/finance-management-system/fms/praavi-internal/app/index.html`.
- `public/diwali-wishes/index.html`.
- `scripts/build-diwali-wishes.mjs` (persist wishes meta on rebuild).
- `public/robots.txt`.
- `scripts/generate-sitemap.mjs`.
- `scripts/lib/sitemap.mjs`.
- `scripts/internal-seo.test.mjs` (new regressions).
- `src/test/internal-robots.test.tsx` (new regressions).
- `package.json` (include internal SEO regressions in the existing sitemap test command; no dependency changes).
- `docs/internal-tools-seo-audit.md` (this report).

The sitemap was regenerated but has no content diff. Earlier pending secure-upload, dependency and finance-guard changes remain intact. Local `.tmp/internal-seo-audit/` snapshots/observations are diagnostics, not release files. No commit or Git staging operation was performed.
