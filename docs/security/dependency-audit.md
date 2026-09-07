# Dependency vulnerability audit

Why the open advisories against this project are what they are, and what was decided about
each. Written so the same investigation is not repeated every time a scanner reports them.

**How to redo this from scratch:** `npm audit`, then for each finding `npm ls <package>` to see
what pulls it in, then check whether it actually reaches users — the `browser` field of the
parent package, and a fingerprint grep over `dist/assets/*.js`. A vulnerability in code that is
never bundled and never executed is a different thing from one that ships.

Last reviewed: **2026-09-07** (v0.8.236).

---

## Fixed by override: four transitive advisories (2026-09-07)

All four were resolved with `overrides` in `package.json` — patch-level bumps, every one inside
the parent's own declared range, so nothing was forced past what its dependant asked for.

| Package | Advisory | Was → now | Parent's range | Ships to browser? |
|---|---|---|---|---|
| `@xmldom/xmldom` | GHSA-6gmq-8vp8-gcm6 — XML fragment injection via `EntityReference.nodeName` | 0.9.10 → 0.9.12 | `speech-rule-engine` pins `0.9.10` | **No** |
| `dompurify` | GHSA-55q2-fjhq-7xh7 — `IN_PLACE` hook removal leaves a detached subtree executable (XSS) | 3.4.12 → 3.4.15 | `jspdf` optional `^3.3.1` | **Yes** |
| `fflate` | GHSA-px8p-9vwx-vf98 — `unzipSync` infinite loop on malformed ZIP64 | 0.8.2 → 0.8.3 | `jspdf` `^0.8.1` | No |
| `qs` | GHSA-x5fp-wj9c-mxmx, GHSA-4mjr-xmp4-gh2g | 6.15.3 → 6.16.0 | `express` (backend only) | **No** |

Only **one of the four was reachable at all**, and it is worth recording why the other three were
not, because the severity ordering and the exploitability ordering disagree completely:

- **`@xmldom/xmldom`** (the only *open* Dependabot alert, #5) needs two things: the app calling
  `createEntityReference()` with attacker input, then serializing with
  `{ requireWellFormed: true }`. `speech-rule-engine` does neither — neither symbol appears
  anywhere in it. And it never loads the package in a browser at all:
  `system_external.js` reads `documentSupported ? window : extRequire('@xmldom/xmldom')`, so the
  native DOM is used and Vite drops the package. Zero hits in `dist/`. Inert twice over.
- **`fflate`** is used by jspdf for *deflate* when writing a PDF. The vulnerable `unzipSync` does
  not appear in jspdf's bundle at all (0 hits), so the parser is never reached.
- **`qs`** arrives via `express`, which is the backend. Fingerprinting `dist/assets/*.js` for
  `arrayLimit|allowPrototypes` and `X-Powered-By|expressInit` returns nothing, and
  `publish-oss.sh` strips server dependencies from the published `package.json` — which is why
  Dependabot never raised it against the OSS repo.
- **`dompurify` is the real one.** It ships: there is a dedicated `purify.es-*.js` chunk. We only
  use jsPDF's constructor, not its `.html()` path, so the hook behaviour is not exercised today —
  but it is *present in the product*, which is a different category from the other three, and a
  patch bump was free.

Note the grep discipline this repeated: a bare `grep -rl qs dist/` matched 9 files and meant
nothing, because `qs` is a substring of half the identifiers in minified output. Only a
package-specific fingerprint answers the question.

---

## Dismissed: `image-size` — CVE-2025-71329, CVE-2025-71330 (both HIGH)

*Dependabot alerts #3 and #4 on `algorisys-oss/yappydraw`, dismissed as `not_used`.*

Two denial-of-service advisories: infinite loops in the ICNS parser and in the JXL/HEIF
parsers, affecting all versions `<= 2.0.2`.

**It does not reach users.** It arrives only through `pptxgenjs@4.0.1` (`npm ls image-size`),
and pptxgenjs excludes it from browser builds itself:

```json
"browser": { "image-size": false, "fs": false, "https": false, "path": false, "os": false }
```

It is a Node-only path for reading image dimensions off disk. Yappy is a client-only app, so
there is nowhere for it to run. Verified empirically rather than taken on trust: **0 of 160**
files in `dist/assets/` contain any image-size fingerprint (`icns`, `ic10`, `mif1`, `ftypheic`,
`jxlc`, `PSD_MAGIC`) — including the 372 KB `pptxgen.es-*.js` chunk itself.

**There is also no fix to take.** `first_patched_version` is `null` — nothing is patched
upstream. npm's only proposed remedy is downgrading pptxgenjs **4.0.1 → 1.1.5**, three major
versions back, to avoid a vulnerability that is not in the bundle. That trade is plainly worse
than the exposure.

**Re-open if** pptxgenjs is ever run server-side (an export worker, an SSR path, a CLI), or if
the `browser` field stops excluding `image-size` in a future release. Both would put the parser
back in reach. Check with the fingerprint grep above after any pptxgenjs upgrade.

---

## Not flagged by Dependabot, present in `npm audit`: build-time only

These three sit under `vite` and `vite-plugin-pwa`, both **devDependencies**. They run on our
own source at build time, on this machine, and are never shipped. Dependabot does not raise
them and no action is warranted.

| Package | Advisory | Path |
|---|---|---|
| `brace-expansion` | GHSA-rgw5-rvv9-x895 — DoS via unbounded intermediate arrays | `vite-plugin-pwa → workbox-build → glob → minimatch` |
| `fast-uri` | GHSA-7p8r-x3mc-p8w7 — host confusion via backslash authority | `vite-plugin-pwa → workbox-build → ajv` |
| `nanoid` | GHSA-2v37-7h3g-55p8 — infinite loop when size is zero | `vite → postcss` |

The distinction that matters: a DoS in a build tool means *our* build could hang on *our* input,
which is a broken build, not a vulnerability in the product. Fix them when the parent packages
update naturally; do not force-resolve transitive versions under a bundler for this.

---

## The rule this file exists to record

**"Has a CVE" and "is exploitable here" are different questions, and only the second one should
drive a change.** Both alerts above are genuine, correctly reported, HIGH severity, and
completely inert in this project. Acting on the severity alone would have meant a three-major
downgrade of the PowerPoint exporter in exchange for nothing.

The check that settles it is cheap — the parent's `browser` field, and a grep of the built
output — and it should be run before any dependency change made "because of a security alert".
