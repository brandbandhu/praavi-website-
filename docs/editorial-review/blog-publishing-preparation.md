# Blog publishing preparation

Status: **renderer implemented and verified locally; content remains unpublished**. No production database update, push or deployment occurred.

## Draft review and prepared bodies

The three complete correction drafts retain their distinct purposes: landing-page enquiry design, the importance of website performance, and a practical loading-speed investigation checklist. Their proposed title/H1 and excerpt mappings remain in `blog-corrections-records.json`, with original IDs, slugs, publication dates and before-body fingerprints intact. Editorial approval flags remain false.

Three body-only review files are prepared for a later authorized publishing task:

| Existing article slug | Prepared file |
|---|---|
| `how-landing-pages-increase-business-leads` | [Body file](./publishing/how-landing-pages-increase-business-leads.content.txt) |
| `why-website-speed-matters-for-seo-and-users` | [Body file](./publishing/why-website-speed-matters-for-seo-and-users.content.txt) |
| `how-to-improve-website-loading-speed` | [Body file](./publishing/how-to-improve-website-loading-speed.content.txt) |

Preparation removes each review document's top H1 and converts `## 1. Heading` into the existing `1. Heading` content convention. Paragraph wording and inline Markdown link text/destinations are preserved. The article title continues to supply the page's single H1. These files reside only under `docs/`; no application, sitemap or production build imports them as published articles.

The hosting outline is still incomplete. It has **no prepared body file** and is excluded from the three-article publishing batch. Both hosting URLs remain unchanged. The suffixed record remains the topic-correct comparison; the other record's checklist concept still needs a complete, reviewed article and a decision on distinct intent before it can be considered for publication.

## Rendering compatibility and security

`BlogInlineLinks.tsx` adds narrowly scoped inline link rendering inside the existing blog paragraphs and numbered H2s:

- `[label](https://example.com/path)`, explicit HTTP URLs, root-relative paths such as `/seo-services`, and same-page fragments are supported.
- Multiple links, URL queries/fragments and balanced URL parentheses are supported. Targets are limited to 4,096 characters and eight levels of URL-parenthesis nesting.
- JavaScript, data, file, blob and other unsupported schemes remain literal text. Protocol-relative links, backslashes, whitespace/control characters and URLs containing embedded username/password credentials are rejected. Mailto/tel Markdown targets are outside this deliberately limited syntax and remain text.
- React renders both labels and surrounding text normally. There is no raw HTML execution, `dangerouslySetInnerHTML`, HTML insertion or script evaluation. Malformed/rejected links preserve their original visible text.
- Links are ordinary `<a href>` anchors, so they work without page JavaScript and appear in prerendered HTML. They open in the same tab, without `_blank`/opener behaviour or a blanket `nofollow` directive. Existing brand link classes are reused.
- Markdown image syntax, escaped links and inline-code examples remain literal. This is not a general Markdown renderer: block headings, lists, tables, optional link titles and rich inline formatting are not newly interpreted. The prepared body files remove the block-heading incompatibility for the three reviewed drafts.

The existing paragraph classes, numbered-heading markup, number styling, spacing, article H1, URL construction, dates, canonical handling, BlogPosting schema and social metadata code are unchanged. No Markdown dependency or other package was added.

## Validation results

| Check | Result |
|---|---|
| Frontend tests | 78 passed, including 25 new link/formatting/security cases |
| Sitemap, public/internal SEO, prerendering and redirect tests | 55 passed, including two new Markdown/prepared-draft SSR tests |
| Complete server upload/dependency/collection-guard tests | 29 passed |
| Total | **162 passed** |
| Full production build | PASS, including server compilation |
| Sitemap comparison | All **167 URLs** preserved; `public/sitemap.xml` and `dist/sitemap.xml` byte-identical to the pre-task snapshot |
| Published article comparison | All **106** retain identical body HTML, content, titles, descriptions, H1s, canonicals, publication values and complete JSON-LD objects |
| Draft prerendering | All three prepared bodies produce correct H2s, one H1, crawlable anchors, original publication instants and unchanged canonical URLs in fixture HTML; hosting excluded |
| Protected-file comparison | June Offer and 14 protected source/static files retain their hashes, including homepage/service improvements, About, BlogPosting schema, internal rules, proxy and Vercel configuration |
| Browser credential gate | 189 text artifacts passed; no private upload authorization markers or configured private server credential values found |

There were no Markdown links in the current 106 published body snapshots, so the new renderer does not change their existing presentation. The new links are exercised in tests and prepared-draft fixture HTML, not inserted into published articles. Generated collector changes from the build were restored to pre-task bytes.

The standalone frontend TypeScript check reports the same **40 pre-existing errors** as the previous task; the normalized error lists match and there are no new findings. Existing bundle-size, Browserslist-data and deprecation warnings remain outside this change.

## Files changed in this task

1. `src/components/BlogInlineLinks.tsx` — safe inline link renderer.
2. `src/pages/BlogPost.tsx` — use inline rendering inside existing paragraphs/H2 text.
3. `src/test/blog-markdown-links.test.tsx` — frontend regression/security cases.
4. `scripts/blog-seo.test.mjs` — prerendered anchors, metadata/date preservation and three-draft/hosting-exclusion tests.
5. `docs/editorial-review/blog-corrections-review.md` — current compatibility notes; original editorial decisions remain intact.
6. `docs/editorial-review/blog-corrections-records.json` — review-only compatibility notes; no approval flags, source snapshots, IDs or dates changed.
7. `docs/editorial-review/publishing/how-landing-pages-increase-business-leads.content.txt`.
8. `docs/editorial-review/publishing/why-website-speed-matters-for-seo-and-users.content.txt`.
9. `docs/editorial-review/publishing/how-to-improve-website-loading-speed.content.txt`.
10. `docs/editorial-review/blog-publishing-preparation.md` — this report.

Earlier uncommitted work in the shared repository is preserved. Temporary baselines and logs under `.tmp/blog-markdown` are local diagnostics, not release files.

## Remaining publishing steps

1. Review/approve the final wording and proposed descriptions of the three complete corrections. Do not include the hosting outline in that approval or update batch.
2. In a separately authorized database-edit task, re-read each article by its exact ID and slug, compare its before fingerprint/publication date, and stop if the source has changed. Apply only the approved title/excerpt and prepared body for those three records. Preserve IDs, slugs, publication dates, images, status, author/publisher identity and canonical choices. Use a genuine modification timestamp supported by the actual source when an edit occurs.
3. Preview and rebuild against the approved records; recheck heading structure, actual internal links, metadata/schema, visible article content and all 167 sitemap URLs. Unchanged URL membership does not mean a genuine later lastmod must remain unchanged.
4. Complete the existing secure-upload/Vercel infrastructure release checks and obtain separate push/deployment approval. This renderer preparation does not remove those prior release requirements.
5. Only after authorized activation, inspect the affected public URLs and request appropriate Search Console re-evaluation. Finish and review the hosting article separately before proposing any publishing action for that record.

No database update, merge, deletion, redirect, canonical change, June Offer edit, production setting change, push or deployment is part of the completed work above.
