# Multilingual (12 languages) + SEO plan

Status: **Phases 1a, 1b and 2 shipped; four locales live (en, es, de, ja — see §9)**.
Written 2026-08-20 against v0.8.202. Decisions locked in §6; D4 still open.
Work happens on branch `feat/i18n-seo`.

---

## 1. Where we actually stand today (verified, not assumed)

**i18n: zero.** There is no i18n library in `package.json`, no locale files, no
`Intl.*` usage for user-facing formatting. Every user-facing string is a literal
in a `.tsx`/`.ts` file. `<html lang="en">` is hardcoded in `frontend/index.html`.

String surface, measured:

| Source | Count |
| --- | --- |
| `utils/command-registry.ts` | 322 `label:` entries |
| `components/help-dialog.tsx` | 189 label entries (hotkeys) |
| 238 files in `components/` | ~420 JSX text nodes + ~495 `title`/`placeholder`/`aria-label` attrs |
| All of `frontend/src` | ~2,320 `label|title|tooltip|description:` string properties |
| `help-docs/` (31 lazy-loaded docs) | **14,184 lines of JSX prose** (~908 KB) |
| `data/whats-new.ts` | 595 lines of release copy |

Realistic estimate: **~2,500–3,000 UI keys**, plus **~55–70k words of help prose**.

**SEO: one indexable URL.** `https://yappydraw.com/` — that is essentially the
whole indexable site.

- The router (`frontend/src/index.tsx:33`) is **hash-based**: `#/help`,
  `#/examples`, `#/embed/…`, `#doc=`, `#load=`. Fragments are not separate URLs.
  All 31 help docs and every example are invisible to search engines.
- `frontend/public/sitemap.xml` contains **2 URLs** (`/` and `/privacy-policy.html`),
  `lastmod` frozen at 2026-02-12.
- The `<meta name="keywords">` block in `index.html` is dead weight — Google has
  ignored it since 2009.
- No `hreflang`, no `og:locale`, no per-page `<title>`/description (an SPA with
  one HTML file can't have them without a build step).
- `articles/learn-to-draw/` (8 diagrams + a long-form markdown article) exists in
  the repo and **is not deployed at all**. That is finished content earning nothing.
- Deploy target is static Apache/LiteSpeed with a working `.htaccess`
  (`frontend/public/.htaccess`), so rewrites are available. gh-pages is a second
  target and needs a `404.html` fallback instead.

**The two goals are coupled.** Translating the UI with no indexable per-locale
URLs produces *zero* search traffic. Creating per-locale URLs with no prerendered
HTML also produces roughly zero — Google renders JS inconsistently and slowly, and
a 3 MB canvas bundle is the worst case for it. The SEO win only lands when all
three arrive together: **real paths + prerendered HTML + localized content**.

---

## 2. Which 12 languages

Chosen for (a) size of the online design/diagramming audience, (b) overlap with
where Excalidraw/tldraw/draw.io already get traffic, (c) script/font risk we can
actually absorb.

| # | Locale | Notes |
| --- | --- | --- |
| 1 | `en` | source of truth |
| 2 | `es` | large, low technical risk |
| 3 | `pt-BR` | huge dev community; use pt-BR not pt-PT |
| 4 | `de` | longest strings — the layout stress test |
| 5 | `fr` | |
| 6 | `zh-Hans` | needs Noto Sans SC for canvas text |
| 7 | `ja` | needs Noto Sans JP; also line-breaking rules |
| 8 | `ko` | needs Noto Sans KR |
| 9 | `ru` | |
| 10 | `hi` | needs Noto Sans Devanagari |
| 11 | `id` | cheap win — large audience, Latin script, low competition |
| 12 | `ar` | **RTL** — the only one that changes layout code |

Bench: `tr`, `it`, `vi`, `pl`, `nl`. Swap in if a locale under-performs.

**Arabic is in the twelve, sequenced last** — see D1 in §6. It is the only locale
that forces a CSS logical-properties pass and a `dir="rtl"` audit; letting it
block the other eleven would be a mistake.

---

## 3. Architecture

### 3.1 Runtime: `@solid-primitives/i18n`

Not i18next, not react-intl. Reasons: Solid-native and signal-based, so switching
language re-renders through fine-grained reactivity instead of remounting the app
(which would blow away canvas state); ~1 KB; typed chained dictionaries.

```
frontend/src/i18n/
  index.ts          # createI18n(), locale signal, persistence, fallback chain
  locales/en.ts     # source of truth — its type IS the Dictionary type
  locales/es.ts     # `satisfies Dictionary` → missing keys are compile errors
  locales/…
  plural.ts         # Intl.PluralRules wrapper (the library has no plurals)
  format.ts         # Intl.NumberFormat / DateTimeFormat helpers
```

- `type Dictionary = typeof en` gives **compile-time** detection of missing or
  stale keys. No runtime "key not found" surprises.
- Non-`en` dictionaries load via `import()` so the base bundle carries English only.
- Locale resolution: `localStorage['yappy.locale']` → `navigator.languages` →
  fallback chain (`pt-BR` → `pt` → `en`) → `en`.
- Key naming: `namespace.component.key` (`toolbar.select.tooltip`,
  `panel.property.strokeWidth`).

### 3.2 Extraction order (highest leverage first)

1. `utils/command-registry.ts` — 322 labels in one file, feeds the command palette
   and menus. Best return per hour of work in the codebase.
2. `components/help-dialog.tsx` — 189 hotkey labels, also one file.
3. Toolbar + the `*-tool-group.tsx` family (~200 strings).
4. `property-panel.tsx` (184 blocks), `menu.tsx`, `settings-dialog.tsx`, panels.
5. Welcome screen, `whats-new.ts`, toasts, error and confirm dialogs.
6. The long tail.

Guard against regression: `scripts/i18n-lint.mjs` fails CI on a new hardcoded
JSX text node or `title=`/`aria-label=` literal in `components/`, with an
allowlist for genuinely non-translatable strings.

### 3.3 What must NOT be translated

Keyboard shortcut letters (`R`, `O`, `D` — they are bound to physical keys, and a
"translated" shortcut is a broken shortcut), YSL script keywords, file-format
identifiers, brand and standard names (YappyDraw, BPMN, UML, DFD, SVG). Encode
these in a glossary file used by the translation script.

### 3.4 Non-Latin canvas text — the sharp edge

This is the part that gets missed. Translating the *chrome* is easy; the moment a
user types Japanese or Arabic **into a shape**, we hit three real problems:

1. **Font coverage.** The Google Fonts link in `index.html` loads Caveat, Handlee,
   Inter, JetBrains Mono, Merriweather, Permanent Marker, Poppins, Source Code Pro
   — all Latin-only or Latin-first. Devanagari/Arabic/CJK render as tofu boxes in
   the hand-drawn fonts. Fix: per-script fallback (Noto Sans SC/JP/KR/Devanagari/
   Arabic), **loaded on demand** when a non-Latin codepoint is first typed — never
   up front (adding five CJK families to the boot `<link>` would be a multi-MB
   regression).
2. **`utils/text-to-outlines.ts`** (opentype.js over `public/fonts/outline/*.ttf`)
   has no non-Latin glyphs. "Create Outlines" on translated text will silently
   produce nothing. Needs an on-demand outline-font fetch, or an explicit
   "outlines unavailable for this script" message. Do not let it fail silently.
3. **Bidi/shaping for Arabic.** Canvas `fillText` shapes Arabic correctly via the
   browser; the *outline* path does not. Same mitigation as (2).

Also relevant: **the canvas is not mirrored in RTL.** Only the chrome flips.
Figma and Excalidraw do the same, and mirroring drawing geometry would corrupt
documents.

### 3.5 RTL work (Phase 6)

`document.documentElement.dir = 'rtl'`, plus a CSS pass converting physical
properties (`margin-left`, `padding-right`, `left:`) to logical
(`margin-inline-start`, `inset-inline-start`). The CSS is physical throughout
today, so this is a genuine sweep, not a one-liner. Panels, the toolbar, the
timeline scrubber and the property panel are the risk areas.

---

## 4. SEO re-architecture

### S1 — Real URLs

Move public content off the hash router:

| Today | After |
| --- | --- |
| `/#/help` | `/help/` |
| `/#/help` (doc N) | `/help/<doc-id>/` — 31 pages |
| `/#/examples` | `/examples/`, `/examples/<id>/` |
| (not deployed) | `/learn/<article>/` — the `articles/` content |
| `/#/embed/…` | **unchanged** — iframes, no SEO value, don't touch |

`#/…` URLs must keep working via a redirect shim: existing shared links,
bookmarks and embeds depend on them. Add SPA fallback rewrites to `.htaccess` and
a `404.html` for gh-pages.

### S2 — Prerender, but not the editor

Do **not** SSR the canvas app. Split the site:

- `/` — the editor, client-rendered as today.
- Everything else (`/help/…`, `/learn/…`, `/examples/…`) — **static HTML generated
  at build time**, with the real prose in the initial response and **no editor
  bundle loaded**. These pages should be ~50 KB, not 3 MB.

This requires the single highest-leverage refactor in the plan:

> **Convert `help-docs/**/*.tsx` from JSX prose to Markdown.** (Approved — D3.)

14,184 lines, mostly mechanical. It pays for itself three times: the prose becomes
translatable as *text* (you cannot hand a translator a Solid component), it can be
rendered to static HTML at build time, and it still renders in-app. Keep the
existing `shapeDocuments` registry in `help-page.tsx` as the index; only the body
changes source format.

Add `scripts/prerender.mjs` to the build, plus `scripts/generate-sitemap.mjs`.

**Shipped**, as one step rather than two: `scripts/prerender.ts` (run through
`tsx`, already a devDependency — no second Vite SSR build) writes 35 static
pages and the sitemap from `frontend/src/prerender/`. Notes for whoever extends
it:

- The pages carry **no application bundle at all** — a document is ~26 KB with
  one shared, content-hashed stylesheet and one 11-line inline script for the
  sidebar filter. A test asserts the absence of the bundle, because that is the
  property the whole exercise buys and nothing on screen would show its loss.
- `/examples/<id>/` is deliberately **not** published: 11 generated pages of
  template-name-plus-one-line is the scaled-content pattern §6/D2 refuses. The
  `/examples/` index is a real page; the previews stay client-rendered behind
  the `.htaccess` fallback.
- `lastmod` comes from `git log -1 --format=%cs` per source file. Stamping
  today's date on all 38 URLs every deploy teaches a crawler to ignore the
  field.
- The renderer reads the document ORDER from `help-page.tsx`'s import list, so
  the sidebar a crawler sees matches the sidebar the app draws.

### S3 — Per-locale URLs

Subdirectory strategy — not subdomains, not query parameters:

```
https://yappydraw.com/            (en, unprefixed — x-default)
https://yappydraw.com/es/
https://yappydraw.com/ja/help/flowchart/
```

The path segment is the locale's short PREFIX, not its full tag — `/pt/`, not
`/pt-BR/` — while `hreflang` still carries the full `pt-BR`. See §6b.

Every page ships:
- localized `<title>`, `<meta description>`, `og:*`, `og:locale` +
  `og:locale:alternate`,
- `<link rel="alternate" hreflang="…">` for all 12 + `x-default`,
- self-referencing `<link rel="canonical">`,
- localized JSON-LD (`inLanguage`), plus `SoftwareApplication`, `BreadcrumbList`
  and `FAQPage` schema on doc pages,
- localized PWA manifest `name`/`description`.

Sitemap goes from 2 URLs to a sitemap **index**: roughly
`(1 + 31 help + N examples + M articles) × 12` ≈ **600+ URLs**, generated at build
time with hreflang annotations, real `lastmod` from git.

### S4 — Content SEO (where the traffic actually comes from)

- Drop `<meta name="keywords">`. *(Done.)*
- Per-doc titles aimed at real queries, e.g. "How to draw a BPMN diagram online —
  free, no signup", not "BPMN Documentation". *(Done for the 15 documents that
  map to a real query, via optional `seoTitle` / `seoDescription` front matter.
  The rest fall back to a generated pair — `name` and `description` are written
  for the sidebar, and a label is not a title.)*
- **Localize keywords, don't translate them.** Do per-locale research —
  "pizarra online gratis", "オンラインホワイトボード", "在线白板", "quadro branco
  online". A literal translation of an English keyword usually targets a phrase
  nobody searches.
- Build real landing pages for the comparison queries the current meta description
  already gestures at ("Excalidraw alternative", "Miro alternative",
  "Lucidchart alternative"), one per locale. These are high-intent and currently
  have nowhere to land.
- Ship `articles/learn-to-draw/` as `/learn/` — it is finished long-form content
  sitting unused in the repo.

### S5 — Technical hygiene

- LCP on doc pages: they must not pull the editor chunk (today every route does).
- Heading hierarchy + image `alt` audit on generated pages.
- Keep the known `sw.js` cache-header red line (bug #280) in mind — it is the
  host's, not ours.

---

## 5. Translation pipeline

Source of truth is `locales/en.ts` + the English Markdown docs.

1. `scripts/i18n-translate.mjs` — batch machine translation (Claude, with the
   do-not-translate glossary and screenshots/context per key where it matters).
   **Built (v0.8.213).** `node scripts/i18n-translate.mjs <locale>` reads `en.ts`, sends the
   still-missing keys to `claude-opus-5` in batches, and writes a flat
   `temp/i18n/<locale>.json` table for `i18n-scaffold.mjs` — the two stay separate so a human
   reviewer edits JSON rather than a 900-line `.ts`, and re-scaffolding never re-spends money.
   **Resumable**: the table is saved after every batch and a key already in it is never re-sent,
   which matters at ~681 keys per locale. `--dry-run` prints the exact prompt and batching
   without calling the API; `--only <ns>`, `--limit n`, `--batch n` and `--effort` scope a run.
   The glossary in the system prompt is cached across batches. *Not yet run against the live
   API — no credentials in the authoring environment, so the request path is written from the
   current SDK surface but unexercised. Do a `--limit 5` run first.*
2. Human review per locale. This is an AGPL OSS project — community review via a
   per-locale GitHub issue is realistic and free.
3. `scripts/i18n-check.mjs` in CI — fails if a locale drifts from `en`'s key set.
   *Still unbuilt, and mostly superseded:* `en.ts` defines the `Dictionary` type, so a locale
   missing or inventing a key is a **compile error** — a stronger guarantee than a script, and
   one that cannot be skipped. What a checker would still add is the `coverage` number in
   `SUPPORTED_LOCALES` (currently hand-maintained) that gates the picker at `READY_THRESHOLD`.
4. **Completeness gate:** a locale only appears in the language picker at **≥95%
   key coverage**. A half-translated UI is worse than an English one.
5. **Staleness stamps:** each translated doc records the `en` source version it
   was translated from. When the English doc changes, show a "this translation may
   be out of date" banner rather than silently serving stale instructions. With a
   product shipping several times a week, 12 × 31 = 372 doc files *will* drift.

---

## 6. Decisions

D1–D3 were locked 2026-08-20. D4 was opened during Phase 1a implementation,
on evidence from the pseudo-locale. Recorded here so nobody re-litigates them
mid-build.

### D1 — Arabic is in the twelve, sequenced last

Arabic ships, but as the final locale (Phase 6). Dropping it would mean
retrofitting RTL into a panel-heavy UI later, and that cost only grows — the
codebase is already ~182k lines and gains panels every week. Sequencing it last
means the RTL sweep never blocks the eleven LTR locales.

**Hedge, effective immediately:** CSS logical properties (`margin-inline-start`,
`inset-inline-start`, `padding-block`) become the house style for all new and
touched CSS **from Phase 1 onward**, not just in the RTL phase. The Phase 6 sweep
then shrinks with every release instead of growing.

### D2 — Two-tier doc translation, with the untranslated tier `noindex`

Not "translate everything" (unaffordable: ~65k words × 11 locales of human
review) and not "top 10 only, rest English" (wastes the long-tail indexing that
is most of the SEO case).

| Tier | Content | Translation | Indexing |
| --- | --- | --- | --- |
| **UI chrome** | all ~2,500–3,000 keys | machine + human review, 100% | n/a |
| **Tier A docs** | ~10 highest-intent help docs + all landing/marketing pages | machine + **human review** | indexed, in sitemap, hreflang |
| **Tier B docs** | remaining ~21 help docs | machine only | **`noindex`, not in sitemap** |

Tier B is still served in-app — a Japanese user reading machine-translated docs
on the vector-path page is better off than one hitting a wall of English — but it
is kept out of the index until a human has reviewed it, at which point it is
promoted to Tier A.

**Why the `noindex` matters:** Google's scaled-content-abuse policy targets
*unreviewed* machine translation published at volume. Publishing 21 × 11 = 231
auto-translated pages into the index is exactly the pattern it penalises, and a
penalty would land on the whole domain, not just those pages. `noindex` gets the
UX benefit with none of the risk, and promotion is a one-line change per doc as
review lands.

Every Tier B page carries a visible "machine-translated — read the English
original" banner.

### D3 — The help-docs Markdown refactor is approved, and moves to Phase 1

Converting `help-docs/**/*.tsx` (14,184 lines of JSX prose) to Markdown is not an
optional nicety — prerendering, doc translation, and per-locale doc URLs all
depend on it. Doing it first also stops the problem growing: every release adds
more JSX prose to convert.

The `shapeDocuments` registry in `help-page.tsx` stays as the index and the
lazy-loading structure is preserved; only the body source format changes.

### D4 — OPEN: what to do about prose in the shortcut `keys` field

*Raised during Phase 1a implementation, on evidence rather than speculation.*

The plan said key combinations stay untranslated because they are bound to
physical keys (§3.3). Running the help dialog under the pseudo-locale showed that
category is too coarse. The `keys` field in `components/help-dialog.tsx` holds
**171 distinct values, and 127 of them contain prose**, not just key names:

    'Ctrl+Shift+E'                    ← a binding. Must not be translated.
    'Toolbar button'                  ← a sentence. Renders as English in a
    'Drag on empty space'               fully translated dialog.
    'Right-click → Path → Smooth'     ← menu path: translatable, and it MUST
                                        match the translated menu labels.
    'Double-click a grouped object'   ← gesture verb + object noun.

So the dialog is not actually fully translatable yet: `temp/i18n-verify/04-help-pseudo.png`
shows `Toolbar button` sitting in plain English inside a keycap while every label
around it is pseudoized.

A second question rides along: **modifier names localise.** German keyboards are
labelled Strg, Umschalt and Entf, not Ctrl, Shift and Del. So `Ctrl+Shift+E`
should probably render as `Strg+Umschalt+E` — the *modifiers* translate while the
*letter* must not, because the letter is the binding.

Three options, in increasing cost:

1. **Leave `keys` in English.** Cheapest, and wrong: a German user reads
   "Toolbar button" and an untranslated Ctrl in an otherwise German dialog.
2. **Translate whole `keys` strings.** Simple, but hands a translator
   `Ctrl+Shift+E` and trusts them not to localise the `E`. They eventually will,
   and the shortcut silently stops matching the keybinding.
3. **Tokenise.** Parse `keys` (the component already has `parseKeys`) and
   translate only tokens drawn from a controlled vocabulary — modifiers
   (Ctrl/Shift/Alt/Del/Esc), gesture verbs (Click/Drag/Double-click/Long-press),
   and menu-path words — leaving single letters and digits alone by rule rather
   than by trust. Roughly a 30-token dictionary plus a formatter.

**Recommendation: option 3**, scheduled with Phase 4 (locale expansion), because
it cannot be validated without a real translated locale to look at. Deliberately
not built during Phase 1a: it is a design decision about what German users
expect, and guessing at it now would mean rebuilding it later.

**Update — German is now that real locale.** Shipping `de.ts` produced exactly
the split this section predicted, and it is now visible rather than theoretical:
seven toolbar/status-bar tooltips carry the combination inside the translated
sentence, so they read **"Rückgängig (Strg+Z)"**, while the command palette and
help dialog render their key column from the untranslated registry and read
**"Ctrl+Z"** — the same command, two modifier names, one screen. Japanese shows
the other half: the help dialog is fully translated except for the prose keycaps
(`Toolbar button`, `Double-click a path`, `or`), which sit in English between
Japanese labels. Neither is caught by a test, because each surface is correct on
its own terms. This does not block the locales, but it does mean option 3 is the
answer, not a preference.

---

## 6b. Cross-check against yappykit

`/home/rajesh/work/algo/experiments/yappykit` (branch `seo-i18n-prerender`) has
already shipped the same two things — twelve locales and per-locale prerendering
— on the same stack (SolidJS + Vite, static hosting). It is a browser-only tool
site rather than an editor, so not everything transfers, but it settles several
questions this plan was going to have to guess at. Read `src/i18n/` and
`scripts/prerender.mjs` there before starting Phase 2.

### What transfers directly — adopt in Phase 2

**Locale table carries `prefix` and `ogLocale`, not just the code.** The URL
segment is short (`/pt/`, not `/pt-BR/`) while the hreflang value stays the full
tag, and `og:locale` needs underscores (`pt_BR`) rather than hyphens. This plan
said `/pt-BR/` in §S3 — **that is now corrected to `/pt/`.**

**One route table drives router, language switcher, hreflang and sitemap.**
`routes.ts` there is the single source of truth; `alternatesFor()` emits the
reciprocal, self-inclusive hreflang cluster Google requires, and `allPaths()`
feeds both the prerenderer and the sitemap. Adding a page or a locale is one
edit. This is the concrete shape of §S1/§S3.

**Translated, keyword-bearing slugs — with a per-script policy.** Not
`/es/compress-image` but `/es/comprimir-imagen-a-un-tamano`. Their policy, worth
copying rather than re-deriving: Latin-script locales get translated slugs; **Russian
is transliterated rather than Cyrillic**, because a percent-encoded URL is hostile
to copy and share; **Japanese and Arabic keep the English slug**, which is what
established tool sites do and what those users expect in an address bar.

**Per-route `localized: boolean`.** Their Privacy Policy is deliberately
English-only at a single URL and emits no hreflang, on the grounds that a
machine-translated legal document is a liability rather than an asset. Yappy has
`privacy-policy.html` and `terms-of-service.html` in exactly that position.

**Prerender by compiling the render logic through Vite's own SSR build.** No
extra dependency and, more importantly, no duplicated route list — the
prerenderer imports the app's real route table and message data. Their reason for
existing is worth quoting because it is precisely Yappy's situation: without it
"every route is served the home page's `<head>` — including its canonical, which
tells Google that every tool page is a duplicate of the home page."

**`metaFor(route, messages)` shared by the prerenderer and the client**, so the
static `<head>` and the head patched on client-side navigation cannot disagree.

**Don't publish an untranslated locale at all.** Their prerenderer skips it: no
page, no sitemap entry, no hreflang. This is a **refinement to D2** — for Tier B
docs, serving them in-app while emitting no public URL is cleaner than publishing
a `noindex` page. No page beats a noindex page.

### Where the two deliberately differ

**Context provider vs. reactive signal.** yappykit resolves the locale from the
URL and passes it through a Solid context that never changes for the life of the
page — correct for a prerendered multi-page site. Yappy is a single-page editor
where a user switches language from Settings without navigating, so the locale
here is a *signal* and `t()` is reactive. Neither is portable to the other.
Phase 2's prerendered doc pages will need something closer to theirs.

**Message loading.** yappykit derives its loader map from `import.meta.glob`, so
the set of shipped locales cannot drift from the folder contents. Better
mechanism — but it is a Vite build-time transform, and Yappy's unit tests run
under `bun test` with no Vite in the pipeline, so the same guarantee is enforced
by `locale-registry.test.ts` instead.

**Interpolation syntax.** yappykit uses `{token}`; Yappy uses `{{ token }}`
(`resolveTemplate` from `@solid-primitives/i18n`). Message files are therefore
not interchangeable between the two projects.

### Gap this exposed in Yappy's runtime

yappykit's `parts()` splits a message into literal chunks and token markers so a
token can render as an *element* — a link, a `<strong>` — instead of text. Yappy
has no equivalent: `resolveTemplate` interpolates strings only.

It is not needed for anything extracted in Phase 1a, so it has not been built.
But Phase 3 will hit the first "see our {privacyPolicy} for details" sentence,
and without `parts()` the tempting fix is to split the sentence into three
strings — which hands the translator fragments and freezes English word order.
German puts that link in the middle of the clause. Copy `parts()` from
`yappykit/src/i18n/format.ts` (about 15 lines) when Phase 3 starts.

---

## 7. Phasing

Reordered from the original draft to reflect D3, and to move the SEO work ahead
of full translation — **indexing the 31 help docs in English alone is a large win
and needs no translation at all.** It lands in week 3 instead of week 7.

| Phase | Work | Size |
| --- | --- | --- |
| **1a. i18n foundation** | Runtime (`@solid-primitives/i18n`), typed dictionary, `Intl` helpers, plural helper, locale persistence + fallback chain, language picker, `scripts/i18n-lint.mjs`. Extract the top ~500 keys (command registry + help dialog). English only — **no user-visible change.** | 3–5 days |
| **1b. Docs → Markdown** | Convert 31 help docs from JSX to Markdown, keep the in-app renderer and registry. Runs **parallel** to 1a (different files, no conflicts). | 4–6 days |
| **2. SEO re-architecture** | Path routing + `#/…` redirect shim, prerender build step, sitemap generator, per-page meta/JSON-LD, ship `articles/` as `/learn/`, drop the `keywords` meta. **English only — first real traffic win.** | 1–2 weeks |
| **3. Full UI extraction + pilots** | Remaining ~2,500 keys. Pilot locales `es`, `de`, `ja` — chosen because they break different things (short strings / longest strings / CJK). On-demand CJK font fallback. | 1–2 weeks |
| **4. Locale expansion** | Remaining 8 LTR locales, per-locale URLs, hreflang + `x-default`, per-locale sitemaps, localized manifest, Tier A doc translation, localized landing pages. | 1 week |
| **5. Translation pipeline hardening** | `scripts/i18n-translate.mjs` + glossary, `scripts/i18n-check.mjs` in CI, 95% completeness gate, staleness stamps + banners, Tier B `noindex` plumbing. | 3–4 days |
| **6. Arabic / RTL** | `dir` switching, CSS logical-properties sweep (reduced by the D1 hedge), Arabic canvas font, outline-font fallback message. | 4–6 days |
| **7. Measurement** | Search Console per-locale properties, GoatCounter locale dimension, ranking baseline. | 1–2 days |

Phases 1a and 1b are parallel. Total ≈ **6–8 weeks** of focused work, with the
first search-traffic gain at the end of Phase 2.

---

## 8. Risks

| Risk | Mitigation |
| --- | --- |
| **Precache/bundle bloat** — this repo has a documented incident (5.1 MB of a 9.6 MB precache; every deploy re-downloading it). 12 locale chunks could repeat it. | Lazy locale chunks; exclude inactive locales from the workbox precache via `manifestTransforms`, the same pattern as the existing exclusions in `vite.config.ts`. Verify by grepping the built `sw.js`. |
| **Hash → path migration** breaks shared links and embeds | Permanent redirect shim; leave `#/embed/` alone; a Playwright test per legacy URL shape. |
| **Half-translated UI** | 95% key-coverage gate before a locale appears in the picker. |
| **Scaled-content penalty** from bulk machine translation | D2 — Tier B is `noindex` until human-reviewed. |
| **Machine-translation quality** in a UML/BPMN-heavy domain | Glossary of do-not-translate terms + human review on Tier A + community reporting. |
| **Doc drift** across 12 × 31 = 372 files, on a repo that ships several times a week | Source-version stamps + "may be out of date" banner. |
| **Tofu / silently broken Create Outlines** for non-Latin canvas text | §3.4 — on-demand script fonts; an explicit failure message rather than silence. |
| **German string overflow** in a dense, panel-heavy UI | `de` is a Phase 3 pilot locale precisely to surface this early. |

---

## 9. First tickets (Phase 1a / 1b)

**Phase 1a is complete** (branch `feat/i18n-seo`). 1–5 below are done; 6 (the
Markdown reference conversion, Phase 1b) is not started.

1. Add `@solid-primitives/i18n`; create `frontend/src/i18n/` with `en.ts`,
   `index.ts`, `plural.ts`, `format.ts`; wire the locale signal into `app.tsx`.
   *(Shipped as `locale-resolution.ts` + `format.ts` (plural folded in) +
   `pseudo.ts` + `index.ts`; init is wired in `index.tsx`, not `app.tsx`, so it
   runs before first render.)*
2. Extract `utils/command-registry.ts` (322 labels) to `en.ts`. Highest return
   per hour in the codebase — one file, feeds the command palette and menus.
3. Extract `components/help-dialog.tsx` (189 hotkey labels). Leave the shortcut
   *letters* untranslated (§3.3 glossary rule).
4. Language picker in `settings-dialog.tsx`, persisted to `yappy.locale`.
5. `scripts/i18n-lint.mjs` + CI wiring — fail on new hardcoded JSX text in
   `components/`, with an allowlist. *(Shipped as a RATCHET rather than an
   allowlist: it records the current count per file and fails only on an
   increase, because 1,654 strings are still un-extracted until Phase 3 and a
   lint that fails on all of them would just be switched off. There is no CI in
   this repo to wire it into — `npm run i18n:lint` exists and needs a workflow,
   or a pre-commit hook, when one is set up.)*
6. Convert `help-docs/shapes/basic-shapes-doc.tsx` to Markdown as the reference
   conversion; agree the renderer and front-matter shape before doing the other 30.
   *(Shipped. Then all 30 followed — **Phase 1b is complete**: 14,696 lines of
   JSX are gone, replaced by 31 Markdown documents, and the JSX components were
   deleted. Converted by `scripts/help-doc-to-md.mjs` and verified by
   `scripts/help-doc-verify.mjs`, which renders each `.md` through the real
   renderer and diffs the word stream AND the structural counts against the
   JSX — 29/29 clean, with `basic-shapes` and `bpmn` checked separately.
   Three things came out of it beyond the conversion:*
   - *`bpmn-doc.tsx` was never in the registry — a finished 577-line document
     users could not reach. It is now doc 31, and BPMN is one of §S4's target
     queries.*
   - *Chunk naming feeds the precache filter. The old `*-doc.tsx` chunks were
     excluded by a `-doc-` pattern; Markdown renamed them and silently added
     586 KiB to every visitor's precache. Help-doc chunks now get an explicit
     `helpdoc-` prefix from `vite.config.ts` instead of relying on a filename.*
   - *Unstyled class variants (`doc-table`, `doc-code`, `doc-content`,
     `doc-note`, `doc-title`) were normalised onto the styled house classes,
     because the renderer emits one skeleton. Five tables, three code blocks
     and eleven notes now look like the rest of the docs.)*
