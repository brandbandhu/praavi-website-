# Duplicate blog corrections: before/after editorial review

**Status: proposed, awaiting editorial approval. Nothing in this package is published.**

The published source was read through the existing public API, using complete pagination across 106 records. Four incorrect records and the second, topic-correct hosting record were selected by exact slug and checked for uniqueness. The table is `blog_posts`. Original record snapshots, IDs, publication timestamps and body fingerprints are preserved in [blog-corrections-records.json](./blog-corrections-records.json). That file is review data, not an executable update or import payload.

## Exact records and protected publication dates

| Role | Record ID | Existing slug | Original `published_at`, preserved verbatim |
|---|---|---|---|
| Incorrect landing-page body | `93252b86-22a2-47af-887c-eea758d94e4f` | `how-landing-pages-increase-business-leads` | `2026-04-14T03:43:59.446+00:00` |
| Incorrect speed-importance body | `1aa25abf-1764-42eb-bbcd-71a5efd2f57c` | `why-website-speed-matters-for-seo-and-users` | `2026-03-23T04:06:03.2+00:00` |
| Incorrect loading-speed body | `c4b1340d-425f-4e99-8b35-4a57a4a2f375` | `how-to-improve-website-loading-speed` | `2026-03-31T04:40:55.959+00:00` |
| Incorrect unsuffixed hosting body | `98f292e6-209f-4077-a985-bd1ad5bff001` | `shared-hosting-vs-cloud-hosting-which-is-better` | `2026-04-20T03:49:31.672+00:00` |
| Hosting comparison with the correct subject | `5e855671-65bf-4799-baa5-00a05153be1b` | `shared-hosting-vs-cloud-hosting-which-is-better-1776761990173` | `2026-04-21T08:59:50.176+00:00` |

Every URL remains `https://www.praaviconsultants.in/blog/` followed by its existing slug. No slug, ID, publication date, canonical preference, redirect, status, author/publisher identity, image or other published field has been changed. No modification date is invented for a draft; any later approved publication must use the actual edit timestamp supported by the source.

## Before/after decisions

| Article | Before: confirmed problem | After: proposed editorial direction |
|---|---|---|
| How Landing Pages Increase Business Leads | Body and description explain SSL certificates and duplicate the correctly titled SSL article. | A focused guide to matching an offer, answering buyer questions, designing an enquiry journey and assessing lead quality. Preserve this URL and its topic; leave the SSL article alone. |
| Why Website Speed Matters for SEO and Users | Body duplicates the SEO introduction after whitespace normalization. | Explain visitor tasks, loading/responsiveness/stability, the limits of ranking claims and how an owner should prioritize performance work. Leave SEO basics in the correctly titled SEO article. |
| How to Improve Website Loading Speed | Body and description discuss custom development versus WordPress; 97.9% five-word phrase overlap with that comparison article. | A practical measurement, diagnosis, optimization and retesting checklist. Leave technology selection in the WordPress comparison. |
| Shared Hosting vs Cloud Hosting, unsuffixed record | Body and description duplicate the design/conversion article; title/H1 also duplicate the suffixed hosting record. | Retain both URLs unchanged now. Consider a distinct hosting buying-checklist article for this incorrect record, using the concept below. Do not copy the other hosting article into it or redirect it to the design article. |

## Draft 1: Landing-page enquiries

**Full proposed article:** [landing-page-leads.draft.md](./landing-page-leads.draft.md)

- **Before and proposed title/H1:** How Landing Pages Increase Business Leads. The existing title already matches the intended topic and is unique in the 106-article corpus, so it is intentionally retained.
- **Proposed computed SEO title:** How Landing Pages Increase Business Leads | Praavi Blog
- **Before description:** An SSL certificate is essential for securing your website and protecting user data. Learn why SSL is important for trust, security, and SEO.
- **Proposed description:** Learn how focused landing pages connect an offer, useful information and a clear enquiry process, with practical ways to measure lead quality.
- **Intended reader:** A business owner preparing a campaign or evaluating an enquiry page.
- **Scope boundary:** Offer clarity, enquiry design and lead evaluation; no SSL tutorial and no promised lead increase.

Proposed H2s:

1. Match the page to one customer need
2. Explain the offer before asking for details
3. Choose a clear next step
4. Ask questions that help your team respond
5. Help visitors assess credibility
6. Test the complete mobile enquiry journey
7. Review lead quality alongside completed enquiries

Contextual internal links in the draft:

- [Google Ads campaigns](https://www.praaviconsultants.in/services/google-ads), in the discussion of matching campaign and page messaging.
- [Landing-page development](https://www.praaviconsultants.in/services/web-development/landing-pages), for a focused campaign page.
- [Website development](https://www.praaviconsultants.in/website-development), for a broader site brief.

## Draft 2: Why website performance matters

**Full proposed article:** [website-speed-importance.draft.md](./website-speed-importance.draft.md)

- **Before and proposed title/H1:** Why Website Speed Matters for SEO and Users. Retained because it describes this article's intended subject and is unique.
- **Proposed computed SEO title:** Why Website Speed Matters for SEO and Users | Praavi Blog
- **Before description:** Website speed plays a crucial role in both SEO rankings and user experience. Discover how faster loading times can boost traffic, engagement, and conversions.
- **Proposed description:** Understand how loading, responsiveness and visual stability affect visitors, what speed means for SEO and how to set sensible performance priorities.
- **Intended reader:** An owner deciding why performance work deserves attention and which business journey matters.
- **Scope boundary:** Effects and prioritization. Detailed implementation remains in Draft 3, avoiding two versions of the same checklist.

Proposed H2s:

1. Consider the whole visit
2. Understand what the main experience metrics describe
3. Give performance its proper role in SEO
4. Separate a test run from real visitor experience
5. Prioritize pages that support important tasks
6. Treat performance as ongoing maintenance

Contextual internal links: [SEO services](https://www.praaviconsultants.in/seo-services), when discussing technical priorities and measurement, and [website development](https://www.praaviconsultants.in/website-development), when template or site-structure work is relevant. External references in the article link directly to Google's page-experience, Core Web Vitals and PageSpeed guidance. No claims about Praavi's actual scores or client outcomes are made.

## Draft 3: How to improve loading speed

**Full proposed article:** [website-loading-speed.draft.md](./website-loading-speed.draft.md)

- **Before and proposed title/H1:** How to Improve Website Loading Speed. Retained because it describes the practical intent and is unique.
- **Proposed computed SEO title:** How to Improve Website Loading Speed | Praavi Blog
- **Before description:** Confused between a custom website and a WordPress website? This guide compares both options to help business owners choose the right solution based on cost, flexibility, and scalability.
- **Proposed description:** Use a practical website speed checklist to investigate images, scripts, fonts, caching and server delays, then verify changes without breaking key functions.
- **Intended reader:** An owner briefing a developer, or a team preparing a controlled performance review.
- **Scope boundary:** Investigation and verification of actual bottlenecks. No general WordPress-versus-custom comparison, assumed hosting fault or guaranteed score.

Proposed H2s:

1. Record a baseline for representative pages
2. Find where the delay begins
3. Review the main image and other heavy media
4. Investigate scripts before removing them
5. Check styles, fonts and visual stability
6. Review caching and server-side work
7. Retest the page and its essential functions

Contextual internal links:

- [Website development](https://www.praaviconsultants.in/website-development), for template, integration or maintenance scope.
- [Technical SEO](https://www.praaviconsultants.in/services/seo-services/technical-seo), for search-related prioritization.

The draft links to primary guidance on PageSpeed, browser request inspection, LCP, INP and CLS where those subjects are discussed. It includes no benchmark results or invented improvement percentages.

## Hosting records: recommendation only

### Which record contains the hosting content?

The **suffixed record**, ID `5e855671-65bf-4799-baa5-00a05153be1b`, explains shared hosting, cloud hosting, performance, scalability and the circumstances in which a business might consider each. It is the topic-correct record.

The **unsuffixed record**, ID `98f292e6-209f-4077-a985-bd1ad5bff001`, contains the design/conversion text. Its body is misplaced, not simply an alternative hosting comparison.

Topic-correct does not mean every technical claim in the existing comparison has been independently endorsed. A later fact-check should qualify blanket claims that cloud hosting automatically provides reliability or that a hosting category alone determines performance. Actual configuration, workload, responsibility and support matter.

### Proposed concept for the incorrect record

This is an **outline for approval, not a fourth complete replacement article**. Preserve the current URL and publication timestamp.

- **Before title/H1:** Shared Hosting vs Cloud Hosting: Which Is Better?
- **Proposed title/H1:** Shared vs Cloud Hosting: A Business Buying Checklist
- **Proposed computed SEO title:** Shared vs Cloud Hosting: A Business Buying Checklist | Praavi Blog
- **Before description:** Website design plays a crucial role in converting visitors into customers. Learn how good design improves user experience, builds trust, and boosts conversions.
- **Proposed description:** Compare shared and cloud hosting against your website's workload, support, backups and migration needs before choosing a hosting plan.

Proposed H2s and unique coverage:

1. **Define the website you need to run.** Document the platform, catalogue/content needs, essential integrations and expected usage pattern before comparing plans.
2. **Ask about resource limits and demand.** Identify the actual plan limits and what happens when demand exceeds them; do not equate a product label with an assurance of speed.
3. **Check backups, recovery and responsibilities.** Ask who performs backups, where recovery procedures are documented and what the site owner must maintain.
4. **Review support and deployment needs.** Check how the team will publish changes and obtain help for the actual platform.
5. **Confirm costs and an exit route.** Review renewal terms, separately charged features and how the website and data can be moved.
6. **Record the decision against requirements.** Compare answers against the brief, rather than repeating a generic advantages/disadvantages article.

Suggested contextual link: [website development](https://www.praaviconsultants.in/website-development) when defining platform and deployment requirements. Do not imply that Praavi sells hosting plans or provides a particular hosting SLA.

The suffixed article would retain the conceptual shared-versus-cloud comparison. This proposal gives the other record a practical procurement purpose and a unique title, but some intent overlap remains possible. Approve this direction only if the finished article supplies meaningful additional help. Search Console/backlink review can inform any separate later decision; this package chooses no merger, redirect, replacement canonical or winning URL.

## Renderer and publishing compatibility

The current architecture has one `title` field driving the H1, social headline, BlogPosting headline and the computed SEO title (`title + " | Praavi Blog"`). The `excerpt` supplies the visible excerpt, meta description and structured-data description. There are no independent SEO-title/H1 fields used by the current blog component. The proposals respect these relationships rather than inventing database columns.

The existing `renderContent` in `src/pages/BlogPost.tsx` renders plain lines and turns `1. Heading`-style lines into H2s. Publishing preparation now adds safe inline Markdown links inside those paragraphs/headings. General Markdown block syntax remains unsupported. The original draft files remain human review documents; their top H1 represents the existing `title` field and must not be inserted a second time into body content.

Three body-only review files have been prepared under `publishing/`: their top H1 is omitted and `## 1. Heading` becomes the existing `1. Heading` format. Safe inline-link rendering has been implemented and tested separately, preserving the existing H2 classes, one-H1 rule, prerendering, schema and metadata behaviour. See [the publishing preparation report](./blog-publishing-preparation.md) for current compatibility and validation. No draft or hosting outline has been applied to the published source.

## Approval scope and preservation

Review can approve or revise each of the three complete drafts independently, plus accept or reject the hosting outline. Approval of wording alone is not a database write or deployment instruction. This package contains no SQL, migration, update endpoint or executable import script.

Any later authorized application must re-read the record by both ID and slug, compare the original body fingerprint and publication date, and stop on source drift. Preserve the existing slug, original publication date, image, status, author/publisher identity and canonical URL. A genuine later modification timestamp must reflect the actual edit, not the old publication date or this review's preparation date.

No live forms, uploads or calls were exercised. The original editorial drafting stage did not modify application code; subsequent local inline-link support is documented in the publishing preparation report. Published records, June Offer content, sitemap entries, redirects, canonicals and production settings remain unchanged. All 106 published blog URLs and 167 sitemap URLs remain in place. Nothing was pushed or deployed.

## Initial editorial validation completed

- Re-read all 106 published records after drafting; the five identified records still match the saved IDs, slugs, original publication strings, titles, descriptions and body fingerprints.
- Each complete draft has exactly one H1 and ordered H2s: seven for landing pages, six for speed importance and seven for loading-speed optimization.
- All proposed descriptions are distinct from the published descriptions and from each other. The three retained titles are unique to their respective records; the hosting-checklist concept has a distinct proposed title.
- Every contextual Praavi service link resolves to an existing canonical entry in the unchanged 167-URL sitemap.
- Compared draft body text against the 106-article corpus and between the three drafts using consecutive five-word phrases, with Markdown link destinations excluded. No exact or near-copy body was identified. This is an internal similarity check, not an external plagiarism certification or proof that different articles can never overlap in search intent.
- Draft lengths are approximately 651, 584 and 622 word tokens respectively, excluding their H1s. These are editorial size observations, not ranking targets.
- No production build was necessary or run during the original documentation-only drafting stage. Subsequent renderer tests and build results are recorded in the publishing preparation report. No publishing, SQL or mutation operation was performed.
