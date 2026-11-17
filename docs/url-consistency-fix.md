# WWW and trailing-slash consistency — 17 November 2026

## Result

Implemented locally, not deployed. Preferred public origin: **https://www.praaviconsultants.in**. Non-root public pages use their existing canonical paths without trailing slashes; the root remains `/`.

Read-only production HEAD checks covered all **167 sitemap routes and 666 distinct HTTPS variants** (www/non-www, with/without trailing slash; root variants deduplicated). All 666 returned HTTP 200 with no Location header. The changes below are therefore not yet active on production. The previous audit separately confirmed Vercel's existing HTTP-to-HTTPS redirect; this change does not alter that platform behavior.

## Implementation

- `proxy.ts` is a small Vercel Routing Middleware using the documented Node runtime and official `next()` helper. `vercel.json` explicitly registers its entrypoint and public-page matchers. Its existing `routes` array is unchanged, including API routing, uploads, prerendered public/blog/About artifacts, static apps and internal noindex headers.
- `src/lib/publicUrl.mjs` selects only public page GET/HEAD requests. Known production hosts normalize to HTTPS www; trailing slashes are removed from non-root paths in the same **308** response. Requests already at their preferred URL terminate without another redirect.
- It changes only origin and terminal slashes. It never parses/rebuilds `searchParams`, so query order, repeated keys, empty values, plus signs and percent-encoded values survive. Article slugs and existing service alias paths are preserved.
- `/api` and descendants, upload/media/storage paths, internal tools and non-page assets pass through. Non-GET/HEAD requests, including public form POSTs and OPTIONS preflights, also pass through. The middleware never reads request bodies, authentication tokens, credentials or environment variables.
- Public matchers exclude the API and internal families entirely. Static files underneath matched public prefixes, such as June Offer assets, can enter the middleware but immediately continue without normalization.
- Preview and localhost hosts stay on their own origins; only their public trailing-slash paths normalize. Preview links never redirect visitors into production.
- Footer and Services links now use the existing canonical `/website-development`, `/seo-services` and `/social-media-marketing` paths. Visible labels, UI, events, article content and animations are unchanged. Existing alias routes remain functional.
- The generated-HTML SEO gate now rejects same-site public links using HTTP, non-www, a non-root trailing slash or a known duplicate service alias.

The explicit middleware is used instead of a blanket dashboard domain redirect or global `trailingSlash` setting, which could also affect API requests and standalone internal apps. Existing legacy route syntax is retained; no migration to a different routing configuration was attempted.

## Validation

| Check | Result |
|---|---|
| Public URL live baseline | 167 canonical routes; 666 variants; 666 HTTP 200, zero redirects |
| Redirect regressions across every sitemap URL | PASS for apex/www, HTTP/HTTPS, slash variants, GET/HEAD and repeated/encoded queries |
| Actual local HTTP middleware responses | 308 with original query bytes; POST/OPTIONS bodies and paths preserved |
| Loop/open-redirect checks | Canonical destinations return no redirect; query values cannot choose a redirect host |
| API, upload, internal route and method exclusions | PASS; no body reads; existing `/api/(.*)` → `/api/index.js` route retained |
| Vercel configuration | Proxy property validated against the official published proxy JSON schema; existing route array preserved |
| Node compatibility | Proxy compiled targeting Node 24 and its packaged handler exercised locally; helper requires Node >=20 |
| Frontend tests | 53 passed |
| Sitemap/SEO/redirect tests | 48 passed, including eight new redirect tests |
| All server upload/dependency/collection-guard tests | 29 passed |
| Total automated tests | **130 passed** |
| Full production build | PASS, including server compilation and HTML/security gates |
| Sitemap | **167 unique URLs: 106 blogs and 61 other public pages** |
| Initial HTML/canonical/link checks | PASS for all 167 sitemap pages; no broken internal links or unlinked sitemap pages |
| Browser credential scan | 189 text artifacts passed; no private upload authorization markers or configured private server credential values |

Production was not changed. Local middleware tests and schema checks are not a substitute for an authorized Vercel preview build. The normal Vite build does not itself create Vercel's hosted proxy artifact; the additional local Node 24 compilation checks the code, while final Vercel packaging remains a hosting check.

## Dependencies

Added exact `@vercel/functions@3.11.3` and its required lockfile entries for the official continuation helper. Application Express, body-parser, proxy-addr, qs and finance Zod versions remain unchanged. No server dependencies or server lockfile were changed. The SDK has its own transitive packages, including a separate Zod 4 dependency; finance continues using its existing Zod 3 version and guards. No new secret or environment variable is required by the redirect code.

## Remaining hosting checks and safe activation

1. Review these local files together with earlier uncommitted SEO/security work. No push or deployment is authorized by this report.
2. On an explicitly authorized Vercel preview deployment, confirm that the Node proxy is detected and packaged and that it runs before the existing public rewrites. Test `/about/?tag=one&tag=two&encoded=%2f`, a service detail, an article and `/june-offer/`; each should produce one 308 on the preview origin, then the correct prerendered page. Already-normalized URLs must return their page without another normalization redirect.
3. Verify POST, OPTIONS and GET requests to `/api/uploads/images` bypass this proxy, retain authentication/CORS behavior and reach the existing API. Run the previously required authenticated upload staging verification separately; no live files were uploaded during this task.
4. Read-only dashboard checks must confirm apex and www DNS/TLS both point to the intended Vercel project. An account-level/domain-level apex redirect must not override these API exclusions. Do not add an unconditional dashboard redirect that would redirect API traffic.
5. Only after separate approval, deploy through the existing Vercel build process. Copying `dist/` alone to a static host will **not** install this proxy. Recheck the same public variants, query retention, loop absence and API exclusions after the authorized deployment.
6. Roll back the proxy registration/code and helper dependency to the pre-change release if hosting verification fails; restore the previous Footer/Services links and HTML gate together if rolling back the whole change. Existing canonical tags and sitemap already choose www, so preserve those. No database or credential rollback is involved.

Existing unrelated TypeScript errors, dependency advisories and secure-upload infrastructure sign-off are not resolved by this URL-normalization change. Existing editorial findings in `public-website-seo-audit.md` also remain.

## Exact files changed by this task

```text
package.json
package-lock.json
proxy.ts
vercel.json
src/lib/publicUrl.mjs
src/components/Footer.tsx
src/pages/Services.tsx
scripts/check-public-seo.mjs
scripts/url-consistency.test.mjs
docs/url-consistency-fix.md
```

The sitemap was rebuilt without changing its entries. Generated collector churn was restored to its pre-task bytes. `.tmp/url-consistency/` contains local-only audit observations, snapshots and test logs and is not part of the release.

References: [Vercel Routing Middleware](https://vercel.com/docs/routing-middleware), [JavaScript reference](https://vercel.com/docs/routing-middleware/js-reference), [official configuration schema](https://openapi.vercel.sh/vercel.json).
