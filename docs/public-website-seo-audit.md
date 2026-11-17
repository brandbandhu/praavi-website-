# Public website SEO audit — 17 November 2026

## Result

Confirmed initial-HTML defects are fixed locally. The production build passes. The sitemap still contains **167 unique canonical URLs: 61 public/static/service pages and 106 published articles**. Nothing was pushed or deployed; production configuration, credentials, databases and media were not changed.

The complete URL, SEO title, description, H1, canonical and content-word inventory is in [public-seo-routes.csv](./public-seo-routes.csv). This contains public metadata only.

## Root cause and fixes

The public React SPA initially returned an empty `#root` and homepage template metadata. `SeoHead` updated metadata only in a browser effect. Read-only production requests found all 61 non-blog sitemap routes still missing an initial canonical and H1; About's completed local fix was not deployed either. Several service pages, Our Work and Our Clients also lacked their own `SeoHead`.

- Prerender the existing public components, capturing their actual `SeoHead` metadata. Each of the 167 sitemap pages now has one self-referencing www HTTPS canonical, one existing H1, meaningful page-specific HTML and public indexing directives. The 61 non-blog pages have unique titles and descriptions.
- Add distinct metadata to the seven missing top-level pages; derive sub-service metadata from each existing title and introduction. Do not use homepage metadata as a fallback.
- Load complete, exact-count, paginated published/active public collections. Preserve existing mapping, ordering, effects and API revalidation. Initial HTML includes 60 portfolio projects, 47 clients, two published case studies, four active jobs and 106 published article links. Only route-specific mapped public records are serialized, never job applications, admin records or finance/customer data. Missing, duplicate, truncated or changing-count pages fail rather than using seed records during prerendering.
- Keep the separate About, article and internal noindex generators. Generate Home last so its rendered content and schema cannot contaminate their HTML templates. Preserve the blog social/schema lifecycle and deduplicate canonical tags on client navigation.
- Remove broken links from breadcrumb labels for `/industries`, `/pune`, `/services/seo-services`, `/services/social-ads` and `/services/web-development`. Those category index routes do not exist. Labels, classes and visible text remain unchanged.
- Replace the unrecognized homepage schema type `DigitalMarketingAgency` (schema.org returned 404) with `Organization`. Preserve existing business fields; add no reviews, ratings, credentials or unverified business details. No new structured data is invented for other public pages.
- Make the homepage celebration's media-query and portal reads safe during server rendering. Its browser behavior and animations remain unchanged. Decode encoded source asset paths when resolving emitted images, including the existing Team founder filename containing a space.
- Supply the independent June Offer app's existing rendered public content in its static HTML, with a self-canonical and complete text social metadata. Its shipped JavaScript and CSS are unchanged. The snapshot was captured from the local app with external hosts blocked, no submissions or interactions. Its bundle hash is pinned in a regression test: recapture and verify initial HTML when that separately built app changes.
- Add checked local Vercel rewrites for the generated public artifacts, without intercepting `/api`, internal tools, About or article routes. Direct generated artifact URLs redirect to their public routes. These configuration edits have **not** been deployed.

## Router and canonical preferences

Canonical public route families are `/`, `/about`, `/services`, `/website-development`, `/seo-services`, `/social-media-marketing`, `/services/google-ads`, `/services/graphic-design`, `/services/digital-marketing`, `/services/shopify-development`, the Google Ads and other service detail routes, `/ai-solutions`, `/portfolio`, `/case-studies`, `/team`, `/clients`, `/career`, `/contact`, `/blog`, `/blog/:slug`, `/industries/:slug`, `/pune/:slug` and the independently served `/june-offer`. Exact currently published paths are listed in the CSV.

Four existing duplicate service aliases remain functional and outside the sitemap. Their original canonical choices are preserved, rather than changing established URLs:

| Existing alias | Preferred canonical |
|---|---|
| `/services/website-development` | `/website-development` |
| `/services/seo` | `/seo-services` |
| `/services/social-media-management` | `/social-media-marketing` |
| `/services/social-media-marketing` | `/social-media-marketing` |

These aliases also receive prerendered HTML. There are 63 newly rendered public React paths including these four aliases, alongside the existing About/article artifacts and the static June Offer page.

## Validation

| Check | Result |
|---|---|
| Full `npm run build`, including server TypeScript compilation | PASS |
| Frontend automated tests | 53 passed |
| Sitemap, internal noindex, About, blog and public SSR tests | 40 passed |
| All server upload, dependency and collection-guard tests | 29 passed |
| Total automated tests | **122 passed** |
| Generated HTML release gate (`npm run seo:check`) | 167 unique URLs; 106 articles; 61 other pages |
| Local HTTP GET of every sitemap URL, scripts unexecuted | 167 HTTP 200 responses, each with one correct canonical and H1 |
| Internal links and same-page fragment targets | No broken targets; no unlinked sitemap pages |
| Initial local image paths | All resolve to emitted/static files |
| Social metadata and article structured data | One tag per checked property; existing BlogPosting preserved |
| Real headless-browser client navigation | Home → Services → Google Ads → Clients → About → Blog; six states in one document, correct metadata, canonical and schema cleanup |
| Private credential gate | 189 browser text artifacts scanned; no private upload authorization markers or configured private server credential values found |
| Robots and internal tools | Correct www HTTPS sitemap reference; internal noindex regression suite preserved; no global noindex |
| Standalone frontend `tsc --noEmit` | Still fails with the same 40 pre-existing errors; none introduced by these edits |

Existing build warnings remain: large frontend chunks, old Browserslist data and Node's `punycode` deprecation. No dependencies were upgraded for this audit. Temporary audit/browser files under `.tmp/` are local diagnostics, not release files.

## Findings requiring follow-up

1. **Hostname consolidation:** live non-www `/services` and www `/services/` return 200 without redirecting; HTTP www correctly returns 308 to HTTPS. Generated canonicals consistently choose HTTPS www without a trailing slash on non-root paths. Review Vercel/domain-level preferred-host redirects in staging before any authorized production change. No live redirect setting was changed.
2. **Published blog data duplicates:** two distinct published URLs have the title “Shared Hosting vs Cloud Hosting: Which Is Better?” (`shared-hosting-vs-cloud-hosting-which-is-better` and `shared-hosting-vs-cloud-hosting-which-is-better-1776761990173`). Three pairs have identical normalized article bodies and repeated descriptions: `how-landing-pages-increase-business-leads` / `importance-of-ssl-certificate-for-website-security`; `how-website-design-affects-customer-conversion` / `shared-hosting-vs-cloud-hosting-which-is-better`; `what-is-seo-and-why-your-website-needs-it` / `why-website-speed-matters-for-seo-and-users`. Their distinct published canonical records are retained. An editor must decide whether to correct content or consolidate records/redirects; this audit did not alter article content, URLs, database records or blog metadata to conceal the problem.
3. **June Offer content:** its existing app contains placeholder phone/WhatsApp destinations ending in zeroes. These were not invented or replaced during the audit. Confirm the intended contact details and separately authorize a source-content correction. The standalone app's source project was not found in this repository; update its HTML snapshot when its bundle changes.
4. **Content depth:** industry/location pages contain distinct but short existing copy (roughly 98–118 whitespace-delimited words in `main`). They are now readable initially; expansion requires editorial work, which was not authorized here. No empty sitemap pages were found.
5. **Refresh and staging:** the build needs the public data API and fails on incomplete reads. Rebuild after public content changes so initial HTML matches live data. Before deployment, verify the generated artifacts, Vercel checked rewrites, host behavior and existing secure-upload infrastructure on an authorized preview deployment. This audit does not resolve previously pending infrastructure/security sign-off or the existing TypeScript backlog.
6. **Scope of link validation:** local routes, sitemap links, local images and same-page anchors were validated. External third-party destinations were not exhaustively availability-tested; this report does not claim that every external website or social destination is healthy. Official external rich-results/markup validation was not rerun during this task; JSON-LD parsing, expected article types and preservation were checked locally.

## Files changed by this audit

Earlier uncommitted security, About, blog and internal-tool work remains intact. The following list identifies this task's edits, not the entire pre-existing Git working tree:

```text
package.json
public/june-offer/index.html
scripts/about-seo.test.mjs
scripts/check-public-seo.mjs
scripts/public-seo.test.mjs
scripts/lib/aboutPage.mjs
scripts/lib/publicPages.mjs
src/components/GoogleAdsSubServiceLayout.tsx
src/components/PageHero.tsx
src/components/SeoHead.tsx
src/components/diwali/DiwaliCelebration.jsx
src/entry-public.tsx
src/lib/careerApi.ts
src/lib/contentApi.ts
src/lib/publicPrerender.ts
src/lib/publicRows.ts
src/pages/Blog.tsx
src/pages/Career.tsx
src/pages/CaseStudies.tsx
src/pages/Clients.tsx
src/pages/DigitalMarketingService.tsx
src/pages/FacebookAdsService.tsx
src/pages/GoogleAdsService.tsx
src/pages/GraphicDesignService.tsx
src/pages/Index.tsx
src/pages/Portfolio.tsx
src/pages/ShopifyDevelopmentService.tsx
src/test/public-prerender.test.tsx
src/test/public-rows.test.ts
vercel.json
vite.config.ts
docs/public-website-seo-audit.md
docs/public-seo-routes.csv
```

The sitemap was regenerated and retains the same valid 167 entries. No sitemap records, public content or production settings were edited. Generated collector churn from the build is restored to the pre-audit bytes.
