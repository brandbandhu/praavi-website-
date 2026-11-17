# Minimum Zod collection security mitigation

Date: 2026-11-16. Implements an application-level mitigation for GHSA-mrhx-c7xc-m3w5 without upgrading Zod or changing infrastructure. **Local implementation and verification passed; production upload infrastructure is still unverified.**

No push, deployment, credential rotation, database migration, production configuration change or production write occurred. Regression tests use synthetic configuration and mocked database delegates, and explicitly prohibit external fetches. Zod remains **3.25.76** in both installed dependency trees. Both manifests and lockfiles are byte-identical to their pre-task snapshots.

## Route review and coverage

Reviewed all `safeParse` calls and collection schemas in `server/src`. Finance create/update validation in auth, employees, payments, receivables, subscriptions, scalar catalog records, scalar bucket metadata, quotation status and social follower sync does not use collection schemas. No recursive, union, record, map or set collection schema was found in the reviewed finance validation.

All collection-bearing handlers now check array lengths after authentication/role authorization and **before** their existing `.safeParse()` call:

| Handler | Fields checked |
| --- | --- |
| POST `/api/quotation-packages` | `items` |
| PUT `/api/quotation-packages/:id` | `items` |
| POST `/api/quotations` | `lineItems`, `deliverables` |
| PUT `/api/quotations/:id` | `lineItems`, `deliverables` |
| POST `/api/bucket-config` | `entries` |

These are five handlers and seven field/route paths. The bucket POST publishes a new effective-dated configuration version; there is no separate collection-bearing bucket PUT route. The due-day PATCH is scalar and unchanged.

## Limits and preservation of valid requests

The existing JSON parser accepts at most **100 KiB (102,400 bytes)** of decoded body data. That same default is now explicit and shared with the finance guard; its value has not changed. Uploads remain mounted before JSON parsing and keep their existing separate 4 MiB limit.

| Collection | Early count cap | Basis |
| --- | --- | --- |
| `items` | 1,896 | Existing JSON byte budget divided by the smallest valid package item plus comma |
| `lineItems` | 2,844 | Existing JSON byte budget divided by the smallest valid line item plus comma |
| `deliverables` | 1,896 | Existing JSON byte budget divided by the smallest valid deliverable plus comma |
| Bucket `entries` | 6 | Existing `BUCKET_NAMES.length` and exact-length schema |

The previously uncapped collections have no existing business count limit. Rather than impose an arbitrary lower ceiling, their caps derive from the smallest valid JSON records in the current schemas: a one-character description and positive integer amount for line items, and the minimum permitted ID/boolean/quantity for deliverables/items. Ignoring envelope overhead makes the bounds generous. Any collection exceeding these caps contains more records than can fit as valid data inside the pre-existing body budget. Tests verify this relationship and that the largest minimum-record payload fitting the envelope passes the guard.

The helper reads only selected field values and array `.length`; it never traverses, copies or validates elements. Missing fields, wrong types, empty arrays, optional update collections and ordinary bounded invalid values continue to the existing schemas unchanged. Valid routes retain their persistence logic, calculations, statuses and response fields.

Oversized collections receive HTTP **400** with the existing `{ error: string }` response shape. Oversized bucket entries retain the existing exact-six error wording. An early size error can intentionally take precedence over other errors in a request containing both an oversized collection and malformed scalar fields.

Zod 3's `.max()`/`.length()` alone are not the mitigation: its array implementation records a length issue and still parses the elements. These guards return before Zod is invoked. Future collection schemas, changes to record minimums or changes to the JSON byte budget must retain the corresponding guard and compatibility tests.

## Regression and resource evidence

New file: `server/test/finance-collection-limits.test.mjs`, **11 tests**.

- Real HTTP requests exercise all seven guarded field/route paths, using bodies below 100 KiB so rejection comes from the guard rather than the transport limit.
- Spies installed before the actual schemas are created show **zero `.safeParse()` calls, zero object-element parses and zero database calls** for oversized collections.
- A maximum-length sparse-array proxy (4,294,967,295 slots) is rejected with one `.length` read and no element access or iteration, demonstrating constant guard work without allocating those elements.
- Boundary-sized invalid object collections verify the exact bounded object-parse and issue counts, including multiple missing-field issues per record.
- Twenty-five repeated oversized quotation requests produce no Zod issues and leave health responding successfully.
- Real create/update paths with mocked persistence preserve package normalization, quotation totals, deliverable snapshots and successful response shapes.
- Bucket publication accepts six valid entries; short/wrong-type errors, optional and empty update collections, finance authentication and role checks remain intact.

The backend suite passed with `--max-old-space-size=128`; finance boundary and repeated-request checks ran within this JavaScript heap cap. This is local bounded-work evidence, not a guarantee about total process RSS, native allocations, serverless fleet concurrency or provider resource settings. Those remain staging concerns.

## Complete verification

| Check | Result |
| --- | --- |
| Application/frontend/SEO tests | 35 passed |
| Sitemap tests | 12 passed |
| Backend tests | 29 passed: 10 upload, 2 body-parser, 6 dependency/API, 11 new finance guards |
| Total | **76 passed** |
| Complete production build | Passed: sitemap fetch, collector, Vite, strict server compilation and browser credential gate |
| Browser credential scan | Passed across 19 generated text artifacts; no upload authorization markers or configured private server credential values found |
| `public/sitemap.xml` and `dist/sitemap.xml` | **167 unique URLs each**, comprising 106 published blogs and 61 static/service URLs |
| Generated robots.txt | Correct production sitemap reference |
| Secure upload source | Frontend helper, backend upload library and upload router byte-identical to pre-task snapshots; all upload tests passed |
| Dependencies | Both manifests/lockfiles unchanged; Zod 3.25.76 retained |
| Server npm audit | One high finding, Zod GHSA-mrhx-c7xc-m3w5, still reported as expected |

Commands:

```text
npm test -- --reporter=dot
npm run test:sitemap
npm --prefix server run build
node --max-old-space-size=128 --test server/test/uploads.test.mjs server/test/body-parser.test.mjs server/test/dependency-security.test.mjs server/test/finance-collection-limits.test.mjs
npm run build
```

The source sitemap is unchanged. Generated collector differences from building were restored to the exact pre-task contents. No SEO source, blog content, UI, canonical URL or upload implementation changed. Existing build warnings about bundle size, Browserslist data and deprecations remain.

## Remaining deployment blockers

The current finance collection paths now have a locally verified application mitigation. This is **not** a patched Zod release or a clean dependency audit; the package finding remains visible, and a future reviewed upgrade can remove it. New collection-validation paths must not bypass the guard.

Production readiness still requires the previously identified isolated staging rehearsal and hosting verification: real PHP script/contract and corrected endpoint, Linux Sharp/API packaging, actual Supabase session/admin-role protection and Storage write/read policies, durable PHP and server-only Storage fallback behavior, and safe frontend/backend cutover followed by approved retirement/rotation of the exposed credential. Other root dependency findings still need their recorded reachability/security disposition. Existing production assets and infrastructure were not changed by this work.

## Files changed by this task

- `server/src/lib/financeCollectionLimits.ts` (new metadata guard and shared limit).
- `server/src/index.ts` (make the existing JSON byte ceiling explicit).
- `server/src/routes/quotations.ts` (create/update guards).
- `server/src/routes/dmCatalog.ts` (package create/update guards).
- `server/src/routes/bucketConfig.ts` (configuration publication guard).
- `server/test/finance-collection-limits.test.mjs` (new regressions).
- `docs/zod-collection-mitigation.md` (this report).

Earlier uncommitted SEO/upload/dependency work was preserved. Local snapshots and audit JSON under the already untracked `.tmp/zod-collection-mitigation/` are diagnostics, not release inputs. No commit or Git staging operation was performed.
