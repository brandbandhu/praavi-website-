# Final server dependency security review

Date: 2026-11-16. Reviewed the current local secure-upload implementation after the body-parser patch. **Two advisory packages are patched; Zod remains a high-severity unresolved dependency finding. Production release is not cleared.**

No push, deployment, credential rotation, migration or production infrastructure/configuration change was performed. Tests used localhost, synthetic identities/credentials and mocked persistence; no production upload or production login was attempted. Both package manifests and all application source files were preserved during this task.

## Exact advisory inventory and dependency paths

The root and server trees had identical relevant versions before this task. These are distinct install roots, not vulnerabilities to sum together.

| Package/version before | Severity / advisory | Affected dependency path in each tree | Result |
| --- | --- | --- | --- |
| proxy-addr 2.0.7 | Critical, [GHSA-jqcg-44mw-7w3h](https://github.com/advisories/GHSA-jqcg-44mw-7w3h), CVE-2026-90711 | Express 4.22.2 -> proxy-addr 2.0.7; `node_modules/proxy-addr` and `server/node_modules/proxy-addr` | Patched to 2.0.8 |
| qs 6.15.3 | Moderate, [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx), CVE-2026-82562 | Express 4.22.2 -> qs 6.15.3; `node_modules/qs` and `server/node_modules/qs` | Patched to 6.16.2 |
| qs 6.15.3 | Moderate, [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g), CVE-2026-82417 | Same Express -> qs path | Patched to 6.16.2 |
| qs 6.15.3 | Moderate, [GHSA-6pq8-jhm2-2vcw](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw), CVE-2026-110816 | Same Express -> qs path | Patched to 6.16.2 |
| zod 3.25.76 | High, [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), CVE-2023-54404 | Direct dependency; `node_modules/zod` and `server/node_modules/zod` | Unchanged; no patched 3.x release available |

Before this task body-parser 1.20.9 also had its own nested qs 6.16.2, which was already patched. After this update it deduplicates to the shared safe qs 6.16.2. Body-parser remains 1.20.9 and its advisory remains absent.

## Reachability in the inspected API

**proxy-addr:** the advisory requires certain IPv4-mapped/zero-prefix IPv6 trusted-proxy subnet configurations. No `trust proxy` configuration is set in source; the actual imported app reports `false`. Finance authentication uses signed tokens; upload authorization verifies Supabase identity and database admin role. Neither uses client IP for authorization or rate limiting. `req.ip` is used for a login audit record. The stated exploit prerequisite is absent in the inspected app, so no current IP-based authorization bypass was demonstrated. A regression verifies that a misleading mapped trust subnet no longer trusts an unrelated IPv4 address and that a correctly expressed mapped subnet still matches. Deployment wrappers/settings have not been inspected through hosting-account access; source/local evidence is not a cloud certification.

**qs bracket/comma array-limit bypass:** Express uses its extended query parser, which runs before route authorization. It does not enable `comma: true` or the advisory's array-limit configuration. The API does not enable an extended URL-encoded body parser. The specific vulnerable options are absent from the inspected request path. Tests verify the patched library rejects the small published bracket/comma limit-bypass shape and that normal API query filters remain intact.

**qs isBuffer serialization crash:** this requires hostile object properties reaching `qs.stringify`, such as a parse-to-stringify round trip retaining a `constructor.isBuffer` property. Express's extended parser retains some prototype-named keys, but no corresponding qs serialization sink was found in the owned API code. API responses use `res.json`. No exploitable round trip was demonstrated. Both installed library copies now safely handle the advisory shape in regression tests.

**qs comma/toString serialization crash:** this requires a qs serialization sink with `arrayFormat: 'comma'`. No such call exists in the inspected API. Public query parsing alone does not establish this sink. Tests verify both patched library copies handle the hostile element with both encoder modes; the real API rejects nested values where scalar query fields are required and remains healthy afterward.

**Zod collection resource amplification:** this risk cannot be dismissed. `server/src/routes/dmCatalog.ts` validates unbounded package `items`; `server/src/routes/quotations.ts` validates unbounded `lineItems`/`deliverables`. Bucket configuration also validates an array, and a length constraint alone is not proof of early termination in the old library. These routes require finance authentication and their write roles before schema validation. The public login schema has scalar fields, not these collection schemas. Global `express.json()` supplies its default approximately 100 KiB decoded-body limit. These controls constrain exposure, but do not prove issue allocation is safely bounded for many invalid small elements. A holder of an authorized finance token can reach collection validation; no unauthenticated exhaustion path or actual memory exhaustion was demonstrated. The new upload route does not use Zod.

Registry metadata reports 3.25.76 as the latest stable 3.x release. The advisory marks all versions below 4.6.6 affected and starts the fix at 4.6.6; current 4.x is a major upgrade. Upgrading automatically would conflict with the requirement to avoid breaking changes. A future fix requires a reviewed Zod 4 migration with API validation/error-contract tests, or an effective pre-validation resource-bound mitigation. Merely adding `.max()` to an old collection schema or using a compatibility entry point is not certified as a fix. This finding remains a dependency-security release blocker until remediated or explicitly accepted through a documented security decision.

## Minimal compatible update applied

Used targeted npm lockfile regeneration in both install roots:

```text
npm update express proxy-addr --package-lock-only --ignore-scripts --no-fund
npm --prefix server update express proxy-addr --package-lock-only --ignore-scripts --no-fund
```

Express 4.22.2 pinned qs to `~6.15.1`, excluding the fully patched line. Registry metadata confirms Express 4.22.3 changes that requirement to `~6.16.0`, permitting patched qs 6.16.2 within the existing Express major and manifest ranges. This avoids dependency overrides. The already installed path-to-regexp version satisfies the patch release's requirement, so it did not change. Both local trees were installed successfully using `npm install --ignore-scripts --no-fund` and its server-prefixed equivalent.

Compared with snapshots immediately before this task, each lockfile has exactly four changed package entries:

- Express: 4.22.2 -> 4.22.3.
- proxy-addr: 2.0.7 -> 2.0.8.
- Shared qs: 6.15.3 -> 6.16.2.
- Removed the redundant nested body-parser/qs 6.16.2 entry through deduplication.

Neither package manifest changed; no unrelated package version changed. `npm ls express body-parser proxy-addr qs zod --all` in each root confirms the installed paths and versions. The current working tree also contains earlier SEO/upload changes; this task's minimal diff is measured against its starting snapshots, not against an older Git commit.

## Test/build results

| Check | Result |
| --- | --- |
| Frontend/application tests | 35 passed |
| Sitemap tests | 12 passed |
| Backend upload tests | 10 passed |
| Prior compressed-body regressions | 2 passed |
| New dependency/API regressions | 6 passed |
| Total | **65 passed** |
| Complete production build | Passed: complete sitemap fetch, collector, Vite, strict server compilation and browser credential gate |
| Credential gate | 19 generated text artifacts scanned; no upload authorization markers or configured private server credential values found |
| Source and generated sitemap | **167 unique URLs each**, with 106 published blogs and 61 static/service URLs |

Commands used:

```text
npm test -- --reporter=dot
npm run test:sitemap
npm --prefix server run build
node --test server/test/uploads.test.mjs server/test/body-parser.test.mjs server/test/dependency-security.test.mjs
npm run build
```

The new regression file imports the actual compiled Express app using synthetic environment values, forbids external fetches and mocks only the needed database delegates. It verifies health/404/405 routing, missing/forged-token rejection, signed-token acceptance, finance role rejection, successful validated create/response shape, invalid login JSON rejection, ordinary query filters and hostile nested query rejection. Separate library regressions cover all patched advisory shapes in both dependency trees. Existing upload tests continue to verify admin/non-admin authorization, all four folders, supported image processing, limits, safe upstream URLs, private-header containment and authenticated fallbacks.

No test claims to validate real production PHP/Supabase integration. Cloud/native packaging and live role-policy protection remain the infrastructure gates already documented. The production build's generated collector was restored to its pre-task bytes; the source sitemap is unchanged. No SEO component, UI, blog content or URL changed. Existing chunk-size/Browserslist/deprecation warnings remain.

## Final audit and release risks

Fresh npm audit results:

| Scope | Critical | High | Moderate | Low | Total |
| --- | --- | --- | --- | --- | --- |
| Server, all dependencies | 0 | 1 | 0 | 0 | **1** |
| Server, `--omit=dev` | 0 | 1 | 0 | 0 | **1** |
| Root, all dependencies | 2 | 19 | 7 | 1 | 29 |
| Root, `--omit=dev` | 0 | 13 | 2 | 0 | 15 |

The sole server finding is Zod GHSA-mrhx-c7xc-m3w5. proxy-addr, qs and body-parser findings are absent from both trees. Audit exits nonzero because remaining findings exist; this is not reported as a clean audit. Root scopes overlap with server scopes and must not be summed. Other root advisories were not upgraded under this targeted scope.

Production release remains blocked by unresolved Zod risk and previously recorded infrastructure/credential gates: verified PHP endpoint/source/contract, isolated staging, Linux Sharp/function packaging, protected Supabase admin-role assignment and Storage policies, and the approved retirement/rotation of the exposed legacy upload credential. Also verify the existing finance `JWT_SECRET` is configured privately in the deployed environment; source has a development fallback, and cloud values were not inspected here. A clean local browser artifact cannot remediate already exposed production assets.

## Files changed in this task

- `package-lock.json`.
- `server/package-lock.json`.
- `server/test/dependency-security.test.mjs` (new).
- `docs/server-dependency-security-review.md` (this report).

No application source or package manifest was changed. Local audit JSON and pre-task snapshots under the already untracked `.tmp/server-security-review/` are diagnostic files, not release inputs. No commit, Git staging operation or remote mutation was performed.
