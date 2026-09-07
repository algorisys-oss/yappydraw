# Dependency vulnerability audit

Why the open advisories against this project are what they are, and what was decided about
each. Written so the same investigation is not repeated every time a scanner reports them.

**How to redo this from scratch:** `npm audit`, then for each finding `npm ls <package>` to see
what pulls it in, then check whether it actually reaches users — the `browser` field of the
parent package, and a fingerprint grep over `dist/assets/*.js`. A vulnerability in code that is
never bundled and never executed is a different thing from one that ships.

Last reviewed: **2026-08-21** (v0.8.210).

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
