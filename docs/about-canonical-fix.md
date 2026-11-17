# About page canonical fix

Date: 2026-11-16. Implemented and verified locally. No push, deployment, production configuration change, credential rotation or Search Console action was performed.

## Confirmed cause

The About component had no `SeoHead`, so it did not declare an About canonical/title/description after rendering. Navigating from the homepage could leave the homepage metadata/canonical behind. The hosting catch-all also served the shared homepage SPA entry for direct About requests.

Fresh read-only production GET checks confirmed that `/`, `/about`, `/about/`, non-www `/about` and an About query variant returned identical initial HTML (SHA-256 prefix `8e4389a63c188e2a`). They contained the homepage title/description, no canonical link, no H1 and an empty React root. No canonical HTTP Link header or duplicate canonical tags were found. These are verified missing/duplicate signals consistent with the supplied Search Console report; Google's internal selection decision cannot be inspected here.

Redirect checks:

- HTTPS www `/about`: 200, no redirect to the homepage.
- HTTPS www `/about/` and query variant: 200, same old shared HTML.
- HTTPS non-www `/about`: 200, not redirected to www.
- HTTP www `/about`: 308 to the correct HTTPS www About URL.

## Change

The About page now uses shared page-specific metadata for both client navigation and build-time HTML:

- Canonical: `https://www.praaviconsultants.in/about`.
- Title: `About Praavi Consultants | Digital Marketing & Web Development in Pune`.
- Description: `Learn about Praavi Consultants, our data-driven approach, core values, and experience helping brands grow through digital marketing and web development in Pune.`
- H1: the existing **Promote With Us**, preserved unchanged and different from the homepage's **We Build Websites, Generate Leads & Scale Businesses**.

The production build prerenders the actual public About component inside its existing Layout/StaticRouter and emits `dist/about.html`. This contains the self-canonical, unique title/description, existing H1, company overview, statistics, core values and public contact form in the initial response. It does not wait for a client effect. Social title/description/URL metadata also agrees with the page rather than retaining the homepage values.

Vercel rewrites `/about` and `/about/` to that artifact before filesystem/SPA fallback. Query variants get the same canonical. Direct requests to the newly introduced `/about.html` artifact redirect 308 to `/about`, avoiding a new preferred public URL. Development/preview serve equivalent About HTML.

The metadata helper removes existing canonical duplicates, including non-www/homepage/uppercase-rel variants, before adding one canonical. Ordinary About requests remain 200 and indexable. Host-wide redirect settings are unchanged; non-www requests reaching this artifact will receive the same absolute www canonical. A domain-wide non-www redirect remains a separately scoped hosting decision, not something changed in production here.

## Content, UI and scope preservation

About focuses on company background, approach, values and experience. The homepage focuses on business growth, service offerings, industries, process, pricing and testimonials. They intentionally share navigation, some metrics and the contact component; their substantive page sections and H1s differ. The old initial HTML concealed all those differences behind the same empty shell; the new About initial response contains its actual content.

The About source was compared against its pre-task snapshot after removing only the added SEO imports/element: **all existing visible text, JSX, classes, animation settings and functionality are unchanged**. The existing client `createRoot` rendering remains unchanged and takes over the same page components; no hydration or site-wide SSR conversion was introduced.

Prerendered image URLs are resolved to the same build's emitted hashed assets, preventing source-only `/src/assets` URLs from leaking into production markup. Actual local HTTP checks confirmed all referenced About/logo images load successfully. The shared public `index.html` is byte-identical to the pre-task template. Internal noindex handling, blog metadata/schema, public URLs, secure-upload implementation and finance guards remain intact.

Rendering uses only public components and empty form state. Regression tests block external fetches during module loading/rendering; no private data is read or prerendered. No runtime server endpoint, dependency version or database schema changed.

## Verification

| Check | Result |
| --- | --- |
| Application/frontend tests | **39 passed**, including 2 new About metadata/H1/navigation tests |
| Sitemap/initial HTML tests | **25 passed**, including 5 new About prerender/canonical/alias tests |
| Existing backend tests | **29 passed** |
| Total | **93 passed** |
| Full production build | Passed, emitting the distinct approximately 32 KB About HTML artifact |
| Browser credential gate | Passed across **21 generated text artifacts**, including About HTML |
| Actual built local HTTP | `/about`, `/about/` and query variant: 200, exactly one correct canonical, unique metadata, one existing H1, no noindex |
| Artifact alias | `/about.html`: 308 to `/about` |
| Asset checks | Prerendered images returned 200; no unresolved `/src/assets/` references |
| Sitemap | About appears exactly once; **167 unique URLs** remain, with source XML unchanged |
| Public/internal isolation | Homepage/contact shared template remains indexable; Social Desk still receives noindex |
| Additional frontend type check | Existing **40 diagnostics**, zero in the changed About/entry/test files; server compilation and Vite build pass |

Tests cover duplicate canonical replacement, initial HTML without JavaScript, real About SSR markup, client homepage/About navigation, route aliases, canonical sitemap presence and preserved internal SEO behavior. Node tests use local fixtures and a model of the checked-in Vercel rules; no actual Vercel Preview was deployed.

Commands: `npm test -- --reporter=dot`, `npm run test:sitemap`, the existing four-file backend Node regression suite, and `npm run build`. A local preview verified the actual built responses separately. Existing chunk-size/Browserslist/deprecation warnings remain. Generated collector differences were restored to their exact pre-task contents after building.

## Files changed by this task

- `src/pages/About.tsx` (register page metadata).
- `src/lib/aboutSeo.mjs` (new shared About metadata).
- `src/entry-about.tsx` (new public-only build renderer).
- `scripts/lib/aboutPage.mjs` (new HTML generation, asset resolution and dev/preview handling).
- `vite.config.ts` (register About build plugin).
- `vercel.json` (About artifact rewrite/alias redirect).
- `src/test/about-seo.test.tsx` (new client metadata/H1/navigation regressions).
- `scripts/about-seo.test.mjs` (new initial HTML/canonical/route regressions).
- `scripts/internal-seo.test.mjs` (preserve public-indexability assertion with the About-specific destination).
- `package.json` (include About regressions in the existing sitemap test command).
- `docs/about-canonical-fix.md` (this report).

Generated `dist/about.html` is a build artifact, not a source file to hand-edit. The sitemap was rebuilt but has no content diff. Earlier pending changes remain untouched. `.tmp/about-canonical/` contains local diagnostic snapshots, not release files.

## Remaining limits

The live site still serves the old response because this fix has not been deployed. Following an approved release, verify the actual Vercel response and request Google recrawling/validation through Search Console. A canonical is a selection signal; no local test can promise Google's eventual indexing choice. Other pages' initial SPA metadata and the previously documented deployment/security blockers are outside this About-specific fix.
