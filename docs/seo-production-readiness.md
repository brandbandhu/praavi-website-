# SEO production readiness review

Reviewed on 2026-11-16 (Asia/Calcutta). **The upload credential exposure has now been remediated in local code and builds.** Approved rotation, server configuration, the unapplied Storage policy migration, deployment, and live smoke tests are still required. See [the secure upload deployment report](secure-media-uploads.md). No push, deployment, credential rotation, or live configuration change was performed.

## Scope and Git review

The reviewed SEO commits are `8ada848` (semantic blog headings), `5c00bb1` (BlogPosting and social metadata), and `d85cda7` (complete sitemap). Their cumulative diff from `89e95fe` covers 15 SEO, data-adapter, build, and test files. It does not change article content, slugs, canonical URLs, database definitions, hosting configuration, or unrelated website features.

This preparation narrows the shared Supabase adapter to its three required public environment settings. Passing the entire `import.meta.env` object previously included unrelated Vite values in consumers such as the standalone collector. A bundle regression test now verifies that an unrelated synthetic secret does not enter the shared bundle. The generated collector was checked and no longer contains the configured upload secret. The upload feature itself is unchanged.

Private environment files, local `.tmp/` logs/screenshots, and Vite timestamp files are not tracked or included in the preparation commit. The only tracked environment files are existing placeholder examples. The shared Supabase fallback key is the pre-existing public `anon` key, not a service-role credential. The scoped SEO diff check found no private credential patterns or configured secret values; no credential values are recorded in this report.

## Verification results

- `npm run build`: passed, including complete live-dataset sitemap generation, collector compilation, Vite production compilation, and server TypeScript compilation.
- `npm test`: all 31 application tests passed. Blog checks cover one title H1, exact numbered H2 text, paragraph semantics, BlogPosting data, and metadata cleanup on route navigation.
- `npm run test:sitemap`: all 12 tests passed, including pagination beyond 1,000 records, incomplete API failure, indexability exclusions, timestamp provenance, missing article detection, XML validation, and bundled environment isolation.
- `dist/sitemap.xml` and `public/sitemap.xml` match: 167 unique canonical HTTPS URLs, comprising all 106 published blog articles and 61 static/service URLs.
- The Facebook campaigns, voice search, and zero-click search article URLs are present.
- All 106 blog `lastmod` values come from source publication timestamps; static/service entries without verified timestamps omit `lastmod`.
- Production preview served `/sitemap.xml` with HTTP 200 and the exact validated XML.
- `dist/robots.txt` references `https://www.praaviconsultants.in/sitemap.xml`.
- Existing Vercel filesystem handling serves the generated file before the SPA fallback. No hosting configuration change is necessary for that path.

## Remaining risks and approval boundary

1. **Credential remediation is implemented locally.** Browser uploads now use a user session and the authenticated backend; current browser bundles contain no upload credential. The exposed production value still requires an approved coordinated rotation/deployment. The initial review found the older upload flow described above; the subsequent security task replaced it without changing SEO behavior.
2. **Social crawler reliability.** Blog metadata and JSON-LD are still inserted client-side. Reliable article social previews require SSR, prerendering, or article-specific static HTML. Existing crawler checks found generic metadata in the initial HTML.
3. **Schema data limits.** Current blog records have no modification timestamps, so `dateModified` is correctly omitted. Organization authorship was confirmed by the owner. The earlier Schema Markup Validator check returned zero errors/warnings; Google Rich Results Test could not complete because it required login. That external validation remains outstanding.
4. **Sitemap operation.** Generation requires the public Supabase dataset and website to be reachable. API failures, incomplete pages, or unverifiable responses fail the build instead of publishing a partial list. Published/deleted content requires a new production build and deployment to refresh this static sitemap.
5. **Existing canonical mismatch.** `/diwali-wishes` is excluded because its page declares the non-www canonical. That canonical was not changed.
6. **Non-blocking build notices.** The build reports a large JavaScript chunk and outdated Browserslist data. Test output also contains existing Node and React Router notices.

The SEO implementation and sitemap checks pass. Subsequent upload security checks also pass locally, including the browser credential gate. Production approval still requires the rotation, policy/configuration changes, live verification, and existing dependency-advisory review documented in the upload report. Pushes, deployment, credential rotation, and live configuration changes require the owner's confirmation.
