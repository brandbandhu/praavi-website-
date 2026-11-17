# body-parser security remediation

Date: 2026-11-16. Resolves [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828) in the local dependency trees. No push, deployment, credential rotation, migration or production configuration change occurred.

## Scope and exact dependency changes

Both root and server `package.json` files declare Express `^4.21.0`; both lockfiles resolve Express 4.22.2, which accepts body-parser `~1.20.5`. Before this task, each installed/locked tree contained one body-parser resolution, version 1.20.6. After the update, `npm ls body-parser --all` and its `--prefix server` equivalent each show only `express@4.22.2 -> body-parser@1.20.9`.

Both lockfiles were regenerated with npm's targeted `update body-parser --package-lock-only --ignore-scripts --no-fund` command. Compared with snapshots taken immediately before this task, the only changed package entries in each lockfile are:

| Entry | Before | After |
| --- | --- | --- |
| `node_modules/body-parser` | 1.20.6 | 1.20.9 |
| `node_modules/body-parser/node_modules/qs` | Absent | 6.16.2, required by patched body-parser |

No unrelated package versions changed. Express remains 4.22.2. Neither package manifest changed during this task; no overrides or direct body-parser dependency were necessary. Existing uncommitted secure-upload dependencies and application changes were preserved.

Server `npm ci --no-fund` passed. Root `npm ci` encountered Windows EPERM on an in-use esbuild executable; no running processes were stopped. Root `npm install --ignore-scripts --no-fund` then restored the lockfile-defined dependencies successfully, with cleanup warnings for locked old native binaries. The lockfile diff remained limited to the two entries above. Tests and production build passed against the installed patched trees. This was not a successful clean root installation, and the cleanup warning is not hidden by the build result.

## Verification

| Command/check | Result |
| --- | --- |
| `npm test -- --reporter=dot` | 35 passed |
| `npm run test:sitemap` | 12 passed |
| `npm run test:uploads` | 10 passed; includes server TypeScript compilation |
| `node --test server/test/body-parser.test.mjs` | 2 new regression tests passed, one per dependency tree |
| Existing test total | All 57 passed |
| Total including new regressions | 59 passed |
| `npm run build` | Passed: complete-data sitemap generation, collector, Vite, server compilation and bundle credential gate |
| Browser credential gate | Passed across 19 generated text artifacts; no upload authorization markers or configured private server credential values found |
| Public and generated sitemap | Both contain 167 unique URLs: 106 published blogs plus 61 static/service URLs |
| Generated robots.txt | References `https://www.praaviconsultants.in/sitemap.xml` |
| Compiled `api/index.js` localhost smoke | Health 200; unsigned upload 401; synthetic legacy-shared-header upload 401; GET upload 405 |

The new regression file runs a separate Express process for each installed dependency tree. It verifies ordinary and gzip JSON requests still succeed, sends compressed bodies containing trailing bytes, and checks that the process remains alive and subsequent health requests succeed. The tests use localhost only and load no private environment files. Run the command explicitly above; no package scripts were changed.

The existing upload tests validate authorized uploads for all four folders, missing/forged sessions and non-admin rejection, file/size/MIME validation, image decoding, server-only shared-secret forwarding, safe returned URLs, sanitized errors, rate limiting, and authenticated Storage/embedded fallbacks. Remote Auth/PHP/Storage operations are mocked. A separate smoke test imported the actual compiled API with synthetic local configuration; its first attempt without required Supabase configuration correctly failed startup, and the synthetic-config rerun passed all four checks. No production upload was made or claimed to work.

SEO source was unchanged. Generated collector changes were restored to the exact pre-task snapshot; the source sitemap is byte-identical to its pre-task snapshot. Existing build warnings about chunk size, Browserslist data and deprecations remain.

## Remaining npm audit findings

Fresh audit queries completed successfully and returned nonzero status because other advisories remain. **No body-parser finding remains in either tree.** Counts below overlap and must not be added together.

| Tree | Critical | High | Moderate | Low | Total |
| --- | --- | --- | --- | --- | --- |
| Root, all dependencies | 3 | 19 | 8 | 1 | 31 |
| Root, `--omit=dev` | 1 | 13 | 3 | 0 | 17 |
| Server, all dependencies | 1 | 1 | 1 | 0 | 3 |
| Server, `--omit=dev` | 1 | 1 | 1 | 0 | 3 |

Server findings remain **proxy-addr (critical), zod (high), and qs (moderate)**. The remaining qs finding is outside the patched parser's new nested qs resolution; it was not silently upgraded as part of this fix.

Root production-filter findings are `@remix-run/router`, `brace-expansion`, `glob`, `lodash`, `minimatch`, `nanoid`, `picomatch`, `postcss`, `postcss-selector-parser`, `proxy-addr`, `qs`, `react-router`, `react-router-dom`, `source-map-js`, `ws`, `yaml`, and `zod`. These are npm dependency classifications; they do not by themselves prove every package is reachable in a deployed browser or function.

The all-dependencies root report additionally includes `@humanfs/node`, `@tailwindcss/typography`, `@tootallnate/once`, `@vitest/mocker`, `ajv`, `browserslist`, `esbuild`, `flatted`, `form-data`, `js-yaml`, `rollup`, `tinypool`, `vite`, and `vitest`. These remain separate follow-up work; no broad audit fix was applied.

The targeted body-parser blocker is resolved locally. Overall production readiness still depends on the previously documented PHP contract/destination, Linux Sharp packaging, isolated staging, live protected admin-role and Storage policies, remaining advisory decisions, and approved rotation of the previously exposed credential. A passing local bundle scan does not rotate or remove the secret from existing production artifacts.

## Files changed by this task

- `package-lock.json`
- `server/package-lock.json`
- `server/test/body-parser.test.mjs` (new)
- `docs/body-parser-remediation.md` (this report)

Local dependency installation and diagnostic snapshots/audit JSON under the already untracked `.tmp/body-parser-remediation/` are not release files. No Git commit or staging operation was performed. Other pending SEO/secure-upload files predate this task and were not included in the dependency update.
