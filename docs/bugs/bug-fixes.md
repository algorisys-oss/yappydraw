# Bug Fixes Log

## 2026-09-08

### 359. Every YSL text diagram imported as an empty slide deck

**Symptom:** reported as "most import text diagrams are not working … it's only importing
into slides". **Menu → Templates → Text Diagrams**, pick any of the 15 YSL templates, and the
import dialog badged it *Markdown → Slides*, the button read **Import Slides**, and clicking it
replaced the document with a deck of blank slides. No diagram, and whatever you had been
drawing was gone. The 14 Mermaid templates were fine, which is why it read as "most" rather
than "all".

**Cause:** three separate faults, stacked.

1. **Format detection.** The dialog sniffed the format itself, and its Markdown test
   (`isMarkdownSlideContent`) claims any text containing a `^---$` line, because Markdown uses
   that as a slide break. Every YSL source *opens* with `---` frontmatter. So all 15 YSL
   templates — and any DSL a user pastes with a `layout:` block — were routed to the slide
   importer. The dialog also carried its own short list of Mermaid headers, which had drifted
   from the adapter's: `gantt`, `gitGraph`, `journey`, `quadrantChart`, `xychart-beta` and
   `block-beta` parsed correctly but were labelled *Text DSL*.
2. **Parser routing.** Three templates failed even on the DSL path. `isYSLScript` treated a
   bare keyword prefix — `/^(let|const|fn|for|if|else|end|…)\b/` — as proof of a script, so a
   flowchart's last box (`end [circle] "End"`) or a sequence diagram's `loop … end` fragment
   sent plain text DSL to the YSL parser, where both are syntax errors. The text parser
   handles those `loop/alt/else/end` fragments itself.
3. **Destructive import.** The dialog passed `clearCanvas: true`, which deletes every element
   and forces the document back to an infinite canvas. Importing a diagram onto work in
   progress threw the work away. That flag came from v0.25.6 ("fix AI drawing/DSL import adding
   to existing slides"), aimed at the AI path.

**Fix:**
- Detection moved into the DSL module as `detectDSLFormat`, which asks the Mermaid adapter
  directly and recognises a diagram by structure Markdown cannot produce — DSL frontmatter
  keys, an edge operator, or a node's `[shape]` bracket. Markdown is now the fallback, claimed
  only when the text is not a diagram. The dialog calls it instead of keeping a second copy.
- `isYSLScript` matches full statement forms (`let x =`, `fn name(`, `for x in`, …) instead of
  bare keywords. `end` and `else` are gone from the list: neither can *open* a script.
- Import draws into the document you are in — placed at the viewport when there is already
  content, fit to screen only on an empty canvas.

**Verified:** all 29 templates and all 24 `examples/dsl/` files parse; all 29 render through the
real app (the five chart types — pie, gantt, journey, quadrant, xychart — are one element each
by design). In the browser: badge *Text DSL*, "Valid — 6 nodes, 6 edges", **Import Diagram**,
12 elements added, and a pre-existing rectangle and text both still there afterwards. Markdown
decks still detect as Markdown.

**Also:** text-diagram import is parked behind **Settings → Dev Mode** while the rest of it is
worked through — the menu item, its `Ctrl+Shift+I` palette command and the *Text Diagrams*
template category all disappear with Dev Mode off. `Yappy.importDSL()` is unaffected.

### 358. The Export dialog hid Animated GIF on an infinite canvas

**Symptom:** on an infinite-canvas document, **Menu → Export** offered PNG, JPG, SVG, PDF,
PPTX, WebM Video and MP4 Video — but no **Animated GIF**. Reported as "we do have GIF export,
so why can't I see it?", which is exactly right: the feature was complete, the file format was
shipped, and the entry point was missing on one document type.

**Cause:** the GIF radio was wrapped in `<Show when={isPaged()}>` in `export-dialog.tsx`.
`isPagedDocType` matches only `slides | design | game | animation`, so `infinite` failed it.
The gate was defensible when written — `exportPageGif` renders offline against page bounds and
toasts "GIF export needs a page/slide document" without them — but WebM and MP4 have the *same*
constraint and stayed visible, because `handleExport` gives them a fallback: no page bounds
means capture the live canvas instead. GIF never got that fallback, so it was hidden rather
than wired up. And outside presentation mode it had no other route either: the film button
lives in `PresentationCaptureButtons`, which only mounts in the two presentation toolbars. Net
effect — a working feature with no way to reach it while editing.

**Fix:** three changes, all mirroring what the video formats already do.
- The GIF radio is offered on every document type.
- `handleExport` routes a non-paged GIF to `startCanvasGif({ fps })` — the live capture — and
  keeps the paged case on the offline page-framed `exportPageGif`.
- `RecordingOverlay` gained optional `label` / `accent` / `elapsedMs` / `detail` props, and
  `canvas.tsx` renders a blue **GIF** instance of it whenever a capture runs outside
  presentation mode. Without that there is a Start with no Stop while editing, and the capture
  could only end by hitting the 60s cap.

The elapsed/size readout moved to `gifElapsedText()` / `gifSizeText()` in `recording-manager.ts`
so the toolbar button and the overlay cannot drift apart on formatting.

**Guard:** `tests/recording-capture.spec.ts` — one test drives the dialog on an infinite canvas
and asserts the downloaded bytes are a valid looping GIF; a second asserts a paged document
still takes the offline route (no capture overlay), so the fallback cannot swallow the case it
was added beside.

## 2026-09-07 — Anshika's week-one review of the vector workflow

Ten defects from a designer's first sustained week in the app (31 Aug – 4 Sep). Grouped because
they came from one report and were fixed together; each stands on its own.

### 348. Exports disagreed with the canvas whenever a drawing used more than one layer

**Symptom:** an illustration built across several layers exported to PNG and JPG with its shapes
stacked differently — shadows and highlights buried, the shirt over the neck. The canvas was
right; every exported file was wrong. Reported with a before/after pair that made it
unmistakable.

**Cause:** the canvas renderer buckets elements by `layerId` and walks the buckets in
`layer.order` (`renderLayersAndElements`). Every exporter instead iterated `store.elements` in
raw array order and never looked at the layer at all — so the exported z-order was whatever order
the elements happened to sit in the array, which only coincides with layer order in a
single-layer document. That is why it had gone unnoticed for so long: it is invisible until you
work the way a vector illustrator actually works. All of PNG, JPG, SVG, PDF, PPTX, paged export,
copy-as-PNG, rasterize and slice shared the bug; one of them even carried a comment asserting the
opposite ("Keep document order so the raster stacks the same way the canvas does").

**Fix:** `elementsInRenderOrder()` in `app-store.ts` — layer rank first, document order within a
layer, orphaned layers last — and all twelve call sites in `export.ts` now go through it.

### 349. A locked layer froze panning

**Symptom:** with a locked layer active, the canvas could not be panned at all — Hand tool or
space-hold.

**Cause:** the "Cannot draw on a locked layer" guard in `canvas.tsx` sat *above* the tool
dispatch, so `if (selectedTool === 'pan')` was never reached. Space-hold pan works by selecting
the `pan` tool, so it was caught by the same guard. Panning is a view operation with no
relationship to any layer.

**Fix:** Pan and Laser (both non-destructive) are dispatched before the guard.

### 350. Deleting a group layer destroyed its contents with no prompt

**Symptom:** deleting a layer group removed everything inside it immediately — no confirmation,
even though deleting an ordinary layer with content asks.

**Cause:** the confirm was gated on `store.elements.filter(el => el.layerId === id).length > 0`.
A group layer holds no elements itself — its artwork lives on its child layers — so the count was
always 0, the prompt was skipped, and only the group row was removed. The children survived in
`store.layers` with a `parentId` pointing at nothing, which made them invisible everywhere at
once: the panel's tree walk only descends from parentless roots, and `isLayerVisible()` recurses
into the missing parent and returns false, so the artwork vanished from the canvas *and* from
every export. Silent data loss recoverable only by undo.

**Fix:** `layerSubtreeIds()` counts the whole subtree; the prompt now offers "delete everything
inside" or "keep the contents", the latter promoting the children into the deleted layer's own
parent (Affinity's behaviour). Deleting a group that contains every other layer is refused.

### 351. The colour wheel's hue ring stole pure black and pure white

**Symptom:** dragging the shade handle to the black or white corner spun the hue instead —
reproduced on video, the hex crawling `1A1A1A → 212121` while the wheel jumped orange to green.

**Cause:** geometry, not user error. The shade triangle was inscribed in the ring itself
(vertices at `R_IN`), while the ring's hit test claimed everything from `R_IN - 4` outwards — so
the two corners you most often want exactly sat *inside* the ring's grab band. Compounding it,
the drag handler re-decided ring-vs-triangle on every `pointermove`, so a gesture could hop
between the two controls mid-drag.

**Fix:** the triangle is inscribed in `R_TRI = R_IN - 12`, leaving real dead space, and the
sub-widget is chosen once on press and held for the whole drag (Krita's and Illustrator's rule).

### 352. The stick-figure library's Mono tab looked identical to Colour

**Symptom:** switching Colour → Mono changed nothing in the panel.

**Cause:** two implementations of "monochrome" that had drifted. The DROP path
(`prepareStickFigureElements`) clears `accent`, `hair` **and** `garment` fills; the THUMBNAIL
path (`toMonochromeSvg`) cleared only `accent` and `hair`. Every female/girl pose wears a skirt
tagged `data-sf-role="garment"`, so the thumbnails kept their blue fill — while the figures
actually dropped correctly. The comment above the preview claimed it was "exactly what the figure
will look like when dropped".

**Fix:** `toMonochromeSvg` clears `garment` too.

### 353. Right-clicking with the eyedropper armed opened the context menu over the target

**Cause:** `onContextMenu` had no `store.eyedropper.active` check.

**Fix:** the eyedropper owns the next click, right button included.

### 354. Layer drag-reorder failed with a pen but worked with a touchpad

**Cause:** the reorder is a window-level pointer drag started from `.drag-handle`, but nothing
set `touch-action` on it. With a pen or finger, a drag down a scrollable list is a pan gesture as
far as the browser is concerned: it claims the pointer, fires `pointercancel`, and the drag is
torn down mid-way. `preventDefault()` on pointerdown does not prevent that — only `touch-action:
none` does. (The canvas already had it; the panel never did.)

**Fix:** `touch-action: none` on `.drag-handle`, plus `setPointerCapture` so the moves keep
arriving if the row re-renders under the stylus.

### 355. New layers jumped to the top of the stack and out of the current group

**Cause:** `addLayer` hardcoded `order: maxOrder + 1` and only nested when a caller passed an
explicit `parentId`, which the panel's + button never did.

**Fix:** directly above the active layer, in the same parent — Illustrator's and Affinity's
placement. An explicit `parentId` still wins.

### 356. Duplicating a group layer produced an empty group

**Cause:** `duplicateLayer` copied the one layer row and the elements whose `layerId` was
literally that layer — for a group, none of them, since a group's artwork lives on its children.

**Fix:** the whole subtree is duplicated, with layer ids, parent links, element ids, group ids
and bindings remapped together so the copy is independent of the original.

### 357. Shape Builder painted every face with the backmost shape's appearance

**Symptom:** after a merge the artwork looked as though it had moved or changed shape.

**Cause:** `commitShapeBuilderFaces` took `els[0]` — the *backmost* shape after a back-to-front
sort — and applied its style to every resulting face, touched and untouched alike. Illustrator
colours each face by the topmost shape covering it, and this file's own `applyPathfinderRegion`
already did exactly that; the two neighbouring functions simply disagreed.

**Fix:** each face takes the style of the topmost shape in its own subset.

**Not a bug:** the same report described the merged shape landing "at a different position".
`path-boolean-position.test.ts` now pins the whole chain — element → world polygon → boolean
result → path element bbox — across rectangles, ellipses, editable paths and far-from-origin
shapes, and the pipeline is position-preserving at every step. The apparent move was #357
repainting the untouched faces. Worth re-confirming against the original file.

## 2026-09-06 — the OSS mirror was publishing an article marked internal

### 346. `articles/` was never excluded from the public repo

**Symptom:** `articles/vibe-architecting-yappydraw/vibe-architecting-yappydraw.md` carries
`internal: true` in its frontmatter and a comment saying it is deliberately not published to
`/learn/`. It was nonetheless readable at
`https://github.com/algorisys-oss/yappydraw/blob/main/articles/…`, along with
`articles/learn-to-draw`.

**Cause:** `publish-oss.sh` builds the public tree with `git archive HEAD` and then deletes
whatever `.ossignore` lists. `articles/` was tracked and was not in `.ossignore`, so it shipped.
Nothing else was wrong: the exclusion had simply never been written, and `articles/` was added
(`c1f6350e`, `d54fd213`) long after `.ossignore` was last thought about. The frontmatter flag
only governs the in-app `/learn/` route, so it read like protection while protecting nothing.

**Fix:** `articles` added to `.ossignore`, verified with a dry run. Nothing in `frontend/` or
`scripts/prerender.ts` reads `articles/`, so the OSS build is unaffected.

**Still open:** the two articles remain in the OSS repo's history (4 commits, earliest
`ef1083a`, 2026-03-25). Removing them from HEAD is one publish away; scrubbing history is not,
because of #347.

### 347. `publish-oss.sh --force` does not rewrite history, despite saying so

**Symptom:** the script's own dry-run help offers `--push --force` as the way to "rewrite OSS
history, e.g. to scrub a leaked secret". It does not do that.

**Cause:** the push path clones the OSS remote with `--depth=1`, replaces the tree, commits on
top, and then runs `git push --force-with-lease`. That is a new commit over a shallow clone. The
old commits are untouched, so anything already published stays reachable.

**Not fixed yet.** A real scrub needs `git-filter-repo` (not installed) over a full clone plus a
force-push, and even then GitHub keeps unreferenced blobs addressable by SHA until Support
purges them. Recorded here so the next person does not trust the flag's description, which is
the same failure as "known failure is a label that stops people looking".

## 2026-09-04 — the production build had been one unlucky run from failing

### 345. The OSS mirror would not have received the build fix

Found while shipping #344. `scripts/publish-oss.sh` rewrites `package.json` for the public
copy, and it wrote the build script out as a **hardcoded literal**:

```js
build: 'tsc -b && vite build && npm run prerender',
```

A duplicate of a line that lives in `package.json`, with nothing holding the two together. It
had been correct for as long as nobody changed the real one — so the very first change to the
build command (the `--max-old-space-size` heap cap, minutes earlier) would have shipped to the
main repo and *not* to `algorisys-oss/yappydraw`, leaving anyone building the public copy with
the exact OOM that had just been fixed, and no way to tell from the commit that they had been
left behind.

It now copies `pkg.scripts.build` from the upstream manifest, with a throw if it is missing, so
the OSS build command cannot silently drift from the one that is actually tested.

Two smaller things came out of the same edit:

- The `node -e` block runs inside a **double-quoted** shell string, so backticks in it are
  command substitution rather than code font. The first draft of the new comment used them and
  the dry run printed `line 99: build: command not found` — harmless there only because the
  mangled text landed inside a `//` comment. A note now says so at the top of the block.
- **The dry run is what caught it.** `publish-oss.sh` without `--push` prints the patched
  `package.json` scripts, and reading that output rather than skimming past it is the only
  reason this was found before the mirror went out wrong.


### 344. The Hostinger deploy of v0.8.234 failed with no logs at all

Reported as *"Build failed — the build process encountered an error and couldn't finish"*,
with a host-generated analysis blaming missing `tsx` / `typescript` / `vite` and a bad
tsconfig. All four were wrong, and the analysis said why in its own first line: **the build
logs were `null`**, so it had diagnosed nothing and guessed.

A fresh clone of `main` at 0.8.234 with `npm ci` builds fine, which rules out every dependency
and configuration theory. What it actually was:

```
FATAL ERROR: Ineffective mark-compacts near heap limit
Allocation failed - JavaScript heap out of memory
```

`vite build` peaks at **~2.2 GB RSS**, and the builder killed it. That also explains the null
logs — an OOM kill is a SIGKILL, so the process never gets to write an error for anyone to
read. **A build that dies with no output is evidence, not an absence of it.**

The part worth keeping is that **this was not the release that broke it.** Measured across
clean clones, v0.8.233 peaked at 1.88–2.14 GB and v0.8.234 at 2.17–2.24 GB — two distributions
that overlap inside ~250 MB of run-to-run variance. The previous release did not pass because
it was under the limit; it passed because it drew 1.88 GB that time. The build had been sitting
on the edge for several releases with nothing measuring it, so the first symptom was a failed
production deploy rather than a warning.

Fixed by capping V8's heap for the one step that needs it:

```
tsc -b && node --max-old-space-size=1536 node_modules/vite/bin/vite.js build && npm run prerender
```

V8 grows its heap lazily toward whatever the machine allows, so on a development box with
64 GB it never bothers collecting — the 2.2 GB is laziness, not need. Capping it forces GC
instead of growth: **peak 2.18 GB → 1.65 GB**, at the cost of ~15 s of extra GC. The emitted
bundle is **byte-identical** (every chunk in `dist/assets` fingerprinted from a capped and an
uncapped build — same hash), so this changes how the build runs and nothing about what ships.

`node` is invoked directly rather than through an inline `NODE_OPTIONS=` prefix, which would
not work on Windows.

The floor was measured too, not assumed: 1024 MB and 768 MB both still OOM, so ~1.3 GB of heap
is the real requirement. If a host ever caps below that, the fix is code-splitting the 2.7 MB
`index` and 2.0 MB `export-game` chunks rather than another number here.

## 2026-09-04 — the help page for a feature nobody could find

### 343. The Arcade help doc named a menu path that no longer existed

`arcade.md` opened with **Menu → Game Builder** and told you to right-click a sprite for
**Edit Behaviors**. Neither is what the app says: the game tools were collapsed into a
**Game** group some releases ago, so the real paths are **Menu → Game → Build** and
**Edit Behaviors (Game)…**. Two paragraphs further down, the same document had the correct
path — it was only the opening instruction, the one a beginner follows, that was stale.

Nothing reported it, and the reason is worth writing down: **nobody reads a help page for a
feature they already know how to open.** A stale path in a doc's first step is invisible to
everyone except the one audience it is written for, and they have no way to tell a wrong
instruction from a feature that does not work.

Found while gating Arcade behind the new Dev Mode setting, which forced the question "how
does someone find this?" — the only question a help page exists to answer. Both paths
corrected, and the doc now says up front that the Game group needs
**Settings ▸ General ▸ Dev Mode**, so following step 1 cannot fail on an empty menu.

## 2026-09-04 — the founders page in dev was the editor

### 342. `/founders/` and `/learn/` rendered the drawing canvas on localhost

Reported as *"on localhost /founder page is loading the yappy home page"*, and it was doing
exactly that. Both pages exist only as prerendered HTML written into `dist/` by
`npm run prerender`; Apache serves them as real files, and the editor has no client route for
either. Under `vite dev` there is no file and no route, so the SPA fallback answered with
`index.html` — the editor, at a URL that is not the editor.

Production was never affected, which is the reason it survived: the page it produced looked
like a working home page rather than an error, so it read as "the founders page is broken"
rather than "dev cannot serve this page at all". Every edit to `/founders/` or `/learn/` had
to be checked through a full `npm run build`.

Fixed with a dev-only Vite plugin (`frontend/src/prerender/vite-plugin-prerender-dev.ts`)
that renders those pages on demand and serves them, stylesheet included. It is
`apply: 'serve'`, so the production build still goes through `scripts/prerender.ts`
unchanged.

It also calls `loadEnv` into `process.env`, because the renderer reads `process.env` rather
than `import.meta.env`. Without that the dev page said the Founding Supporter programme
"is not open yet" while the built page offered checkout — the same disagreement
`scripts/prerender.ts` already carries a comment about.

## 2026-09-03 — export produced a blank page

### 340. A black canvas exported as blank white paper

Reported by a user: *"in Yappy the background colour is set to black and the font colour is
set to white. but when I download it the background is changing to white, due to which the
white font is not visible."*

Exactly right, and worse than it sounds. Every non-slide exporter hardcoded the page fill:

```
if (background) { ctx.fillStyle = '#ffffff'; ctx.fillRect(...); }
```

`store.canvasBackgroundColor` drives what the canvas looks like on screen and was read by
none of them. Black canvas, white text, and the exported PNG is a **completely blank white
rectangle** with the artwork present but invisible. Reproduced before fixing: the file was
1016x453 and every pixel was #ffffff.

Six paths had it: `exportToPng`, `exportToJpg`, `exportPageToPng`, `copyCanvasAsPng`, and the
single-page branches of `exportToPdf` and `exportToPptx`. Slides never did, because they
already read `slide.backgroundColor`. All six now go through one `documentBackground()`
helper. It defaults to white, so nothing changes for anyone who never set a background.

The lesson is about where a default is written. Seven copies of `'#ffffff'` are seven places
to forget a setting exists, and the setting had existed for a long time.

### 341. A transparent PDF exported as a solid black page

Found while investigating #340, and a separate fault. The PDF exporter encoded its canvas
with `canvas.toDataURL('image/jpeg')`. **JPEG has no alpha channel**, so with the background
switched off every transparent pixel encoded to black: the PDF opened as a black page with
the artwork nearly invisible on it.

PDF export now uses PNG when the background is off and keeps JPEG when it is on, where the
alpha channel would be wasted and JPEG is far smaller. `exportToPptx` already used PNG
throughout, which is why it never had this fault and was the clue to the fix.

**Trade-off worth knowing:** the transparent PDF is much larger, because PNG is lossless. A
three-shape test drawing went from 40 KB to 4.2 MB. Correctness first, on the grounds that a
black page is unusable while a large file is merely large, but if that size becomes a problem
the alternative is to treat a PDF page as white paper and keep JPEG throughout.

Colour fidelity was measured after both fixes rather than assumed: sampled against the source
hex values, the PNG path is exact and the JPEG path is off by at most 1 in one channel.

## 2026-09-03 — the documentation site nobody with a service worker could reach

### 339. Every prerendered page served the app shell to returning visitors

Reported as "/founders just keeps loading or loads the same YappyDraw canvas", and it was not
about /founders.

`navigateFallback: 'index.html'` answers **every** navigation from the service worker cache,
and the denylist held one entry (`oauth-callback.html`). So for anyone whose browser had the
worker installed — everyone except a first-time visitor — `/help/`, `/help/uml/`, `/learn/`,
`/examples/` and `/founders/` all returned the editor's app shell instead of the page.

The reason it read as a `/founders/` bug is the recovery path. `/help/` and `/examples/` have
client-side routes in the SPA router, so when the shell loads, the SPA recognises the path and
renders its own help page: it works, and the fault is invisible. What is lost there is quiet —
the prerendered HTML, the page's `<title>`, its canonical and its JSON-LD — so it costs search
rather than users. `/learn/` and `/founders/` have no such route, fall through to `<App />`,
and show the canvas. Same bug; only one face of it was visible.

A/B under identical conditions, with the worker confirmed to be *controlling* the page rather
than merely registered:

| | before | after |
|---|---|---|
| `/founders/` | app shell | prerendered |
| `/help/` | app shell | prerendered |
| `/learn/` | app shell | prerendered |

Two things to keep:

- **`verify:deploy` could not have caught this and still cannot.** It fetches with curl, which
  never installs a service worker, so it verified that the origin serves the pages correctly —
  which was true throughout. What was never checked is whether a *browser* asks for them.
- **The first attempt at verifying the fix was worthless.** It reported `PRERENDERED ✓` on all
  four paths while `navigator.serviceWorker.controller` was `null`: no worker was in the way,
  so nothing was being tested. `registerType: 'prompt'` deliberately does not `skipWaiting`, so
  a test has to reload and wait for `controller` before it is testing anything at all.

## 2026-09-03 — three found by measuring rather than looking

### 338. One build, two answers: the bundle offered Founders while the page said it was closed

Found during the release verification for 0.8.227, which is the only reason it was found at all.

`vite build` loads `.env` automatically. `scripts/prerender.ts` runs afterwards as a separate
`tsx` process and does not, so it saw only `process.env`. With the support URLs in `.env` and
nowhere else, a single `npm run build` produced a site that contradicted itself: the bundle had
`VITE_SUPPORT_FOUNDERS_URL` baked in and offered the Founding Supporter option, while the
prerendered `/founders/` page said the programme was not open yet.

The prerender step now loads the same `.env` Vite does, via Vite's own `loadEnv`, with existing
`process.env` values winning so a host or CI build environment still overrides the file.

What made this easy to miss: every check up to that point had sourced `.env` by hand before
running the prerender, which supplied the variable the pipeline itself was failing to pass
along. **A verification that repairs the thing it is verifying cannot fail.** The bug was only
visible on a plain `npm run build`, which is precisely what the deploy runs.


### 335. The header wordmark rendered as "Yappy Draw", two words

The markup was already correct: `<span>Yappy</span><span>Draw</span>`, adjacent with no
whitespace between them. The gap came from CSS. `.text-logo` is `display: flex` with
`gap: 4px`, and flex applies that gap between **every** pair of items, so the two halves of
the wordmark were spaced exactly like the Beta pill beside them.

The gap is needed for the pill, so the fix is a wrapper: the wordmark is now its own
`inline-flex` item and the parent's gap falls outside it rather than through it. Measured
after: `getBoundingClientRect()` puts the gap at 0px and the text at `YappyDraw`.

The general point is that `gap` on a flex container is not a property of the layout you were
thinking about. It applies to every pair of children, including the two you never intended to
separate.

### 336. Dialogs opened from the menu did nothing in Zen mode

The Support and About dialogs were mounted inside `<StatusBar />`, following the precedent of
`WhatsNewDialog`. That precedent did not transfer: the What's-new popup is only ever *opened
from* the status bar, so mounting it there is safe. Support and About are opened from the
menu, and `<StatusBar />` sits under `<Show when={!store.zenMode}>`.

So in Zen mode (<kbd>Alt</kbd>+<kbd>Z</kbd>) the status bar unmounts, both dialogs cease to
exist, and their menu items silently do nothing. Both are now mounted at the top level of
`app.tsx`.

**A dialog has to outlive every panel that can open it.** Mounting one inside a conditionally
rendered component couples its existence to something unrelated, and the failure is silent:
no error, no console warning, just a menu item that does not respond.

### 337. Close icons rendering 1.6px wide

The Support dialog's ✕ measured **1.625px**. The colour was right, the element was present,
`isVisible()` returned true, and it looked like a faint smudge. As a flex item inside a
fixed-size button the SVG was being *shrunk* rather than drawn small.

The codebase already had the fix — `.ep-icon-btn svg`, `.gs-icon-btn svg` and
`.pat-icon-btn svg` all pin `flex: 0 0 auto` with an explicit width and height — and it is the
same crush that hit the Layers panel row actions in v0.8.222. Applied to every icon in the new
dialogs.

Worth recording how it was found: not by looking at the screenshot, where it read as a slightly
faint icon, but by asking the page for `getBoundingClientRect().width`. **A rendering bug that
still renders something is invisible to a screenshot and obvious to a measurement.**

## 2026-08-30 — a tester's session, and the one bug behind two of its reports

### 334. "Something went wrong" on Delete, and again on Pathfinder — with no way to undo

*"I had a sketch layer and I had pathfinder selected, I selected 'unite' and it showed
something went wrong and now I cannot undo the sketch back to normal. 'Something went wrong'
happened a lot of times today, like when clicked delete instead of backspace to delete a
selected object. Problem is things cannot be undone using undo after this happens."*

Two reports, one bug, and it is a class rather than an instance.

`store.selection` is a list of **ids**. Removing the elements it names took two store writes:

```
setStore('elements', els => els.filter(...))   // the elements are gone
setStore('selection', [])                      // ...and now the selection is
```

Solid runs effects **between** those two writes, so for one frame the selection named
elements that no longer existed. Every reader that pairs the two lists saw a selection it
could not resolve, and one of them did not survive it:

```
const sel = store.elements.filter(e => store.selection.includes(e.id));   // []
const first = of(sel[0]);                                                  // 💥
```

`paintColorIsMixed` — read from the Fill & Stroke swatch's `title`, i.e. from inside a
reactive binding. A throw there does not fail one control; it reaches the **top-level
ErrorBoundary**, which replaces the entire editor with the error screen. That is the second
half of the report: the document and the whole undo stack were still intact in the
module-level store, but the toolbar was gone, and with it every route to Ctrl+Z. The work was
recoverable and unreachable at the same time.

Every operation that consumes a multi-selection went through that window — Delete, all four
Pathfinder booleans, compound shapes, Shape Builder, Scissors, Distort. Backspace looked
"safe" purely by timing.

Three changes, deliberately at three levels:

1. **The guard.** `paintColorIsMixed` returns `false` when the selection cannot be resolved.
   "The selection names a missing element" is a state a reactive reader must simply survive.
2. **The window.** `deleteElements` batches, and `replaceElementsPreservingOrder` now takes
   the new selection and sets it inside the same `batch()`. All eight call sites went through
   it, so the invariant is structural rather than a convention each one has to remember.
3. **The blast radius.** The error screen gained an **Undo last change** button — it undoes
   the edit that threw and remounts, which is what turns "your work is gone" back into "your
   work is here". Ordering matters: undo before remount, or the bad state throws again.

`tests/selection-teardown-crash.spec.ts` — 8 tests; 3 of the 4 originals fail on the old code.

### 333. Tool flyouts opened off-screen from a right- or bottom-docked toolbar

*"The toolbar works fine when docked to the left or top, but when docked to the right or
bottom, we cannot see clearly the expanded tools of any tool."*

Seventeen tool-group components each carried a **byte-identical** copy of:

```
return { top: `${rect.bottom + 4}px`, left: `${rect.left}px` };
```

which is only correct while the bar is on the left or the top. Docked right, the panel starts
a few pixels from the window's right edge and runs off it; docked bottom, `rect.bottom` is
already at the foot of the window. The tools were not merely awkward — they were unreachable.

One shared `placeFlyout` now answers "where does it fit?" in the order a menu should try it:
below → above → left of the anchor → right of the anchor → clamped. Below stays first, so the
two edges that already worked are untouched; a right-docked bar gets the *side* placement
rather than a clamp, because clamping alone would slide the panel under the toolbar and hide
the buttons it belongs to. The panel is **measured** before the final placement — these range
from a 3-icon strip to a titled 4-column grid, and guessing the width is exactly what leaves a
wide one hanging over the edge.

`tests/tool-flyout-dock.spec.ts` (right + bottom fail on the old code) and unit tests for the
geometry in `popover-placement.test.ts`.

### 332. The P3 palette moved the swatch but not the colour picker

*"The display colors should change when we select from the swatch in the P3 wide gamut like
it happens in all others."*

Every P3 Wide-Gamut swatch is stored as `color(display-p3 r g b)`. The colour picker synced
itself with `hexToRgb`, which rejects anything that is not `#rrggbb` — so picking a P3 swatch
updated the Fill chip and the object, while the saturation square, the hue slider and the hex
field went on showing the *previous* colour. Every other palette is hex, which is why only
this one looked broken.

Replaced with a general `cssColorToRgb255`: hex, `color(display-p3 …)` (via a proper
linear-P3 → linear-sRGB homography), `color(srgb …)`, `oklch(…)`, and — delegated to the
browser through a canvas — `rgb()`, `hsl()` and CSS colour names, which is what imported SVG
brings. Out-of-sRGB P3 colours clamp for *display* only; the object keeps the true P3 value.

`frontend/src/utils/color-utils.test.ts`.

### 331. The Layers panel could be moved, and could also be lost

*"Please make the Layer panel movable, it is currently fixed."*

It was movable — every dock panel is dragged by its title bar. Three things made that
untrue in practice, and all three are fixed:

- **Touch and pen did nothing.** The dock zone is a scroll container and the title bar had no
  `touch-action: none`, so a finger drag scrolled the stack instead of moving the panel.
  `preventDefault()` on `pointerdown` does not stop that; only the CSS property does.
- **Nothing said it was draggable.** `cursor: move` only appears once you are already on the
  bar. There is now a grip (⣿) beside the panel name and a tooltip.
- **A floating panel could be stranded.** Its position is persisted and was never clamped, so
  dragging one past an edge — or reopening the app in a smaller window — put its title bar
  off-screen or *behind* the opaque top bar. The title bar is the only handle a panel has, so
  that made it genuinely immovable. Positions are now clamped, on every move and on resize.

Plus `setPointerCapture` and a `pointercancel` teardown, so a fast drag cannot hand the
pointer stream to the canvas mid-gesture. `tests/panel-move.spec.ts`.

### 330. The Pen drew nothing when the stroke was set to None

*"If I want to create a filled shape with no stroke using a pen tool, I do not see any path —
a blue rubberband kind of thing like in Adobe software is very helpful to see what we are
creating."*

The only feedback the Pen gave was the element's own stroke. Set the stroke to *None* — which
is precisely what you do when the goal is a filled shape with no outline — and clicking out a
path drew a row of anchor squares connected by nothing.

`rendering/pen-construction.ts` draws the path under construction as a thin blue guide with a
white casing (so it stays legible over dark artwork), square anchors, a hollow trailing anchor
for the uncommitted rubber-band point, and the Bézier arms of the anchor being pulled. It is
independent of the element's paint by design: it is a guide, not a preview of the result. Every
dimension is divided by the zoom, so it stays a hairline at any scale, and it disappears the
moment the path is finished. `tests/pen-construction-guide.spec.ts` probes segment *midpoints*
— counting blue pixels over the whole canvas passes on the broken build, because the anchors
were always drawn.

## 2026-08-25 — an icon crushed to a sliver by a padding meant for text

### 329. The layer swipe-tray icons were a 6px sliver in a 44px block

*"The layer icons container is very big, but the icons themselves are very small."*

Not an icon-size problem — a flexbox squeeze, and the numbers say it plainly:

```
button (index.css:394)   padding: 0.6em 1.2em      ->  9.6px 19.2px
.tray-btn                width: 44px, border-box
                         content box = 44 - 19.2 - 19.2  =  5.6px
svg                      width="20", flex-shrink: 1
                         rendered                   =  5.6 x 20
```

The icon was never small; it was crushed to a **6px-wide sliver** inside a full-height
coloured block, which is exactly what the screenshot showed. `.layer-action-btn` escapes the
same fate only because it happens to set `padding: 3px`; `.tray-btn` never overrode the global
rule and inherited a padding intended for text buttons.

`padding: 0` on `.tray-btn` — these are full-bleed touch targets — plus `flex-shrink: 0` on
the icon, so it can never be squeezed by its own button again whatever a future global rule
adds. Icons now render 20x20 in a 44x54 button.

A page-wide sweep for the same defect — every `<button>`/`<a>` svg whose rendered box is under
75% of its declared size — comes back with **none**, so this was the only one exposed.

### 328. Layer reorder moved off HTML5 drag-and-drop entirely

Not a new report — this removes the CLASS behind #323 rather than the instance.

#323 was possible because `DataTransfer` is shared state: any listener on the way up can
change a drag out from under the component that started it, and `app.tsx`'s global image-drop
handler did exactly that, forcing `dropEffect = 'copy'` onto a drag that had declared
`effectAllowed = 'move'`. The browser answers that illegal pair by refusing the drop outright
— no `drop` event, and a no-entry cursor. The fix was an exemption (`data-internal-drag`),
which works until the next global handler forgets about it.

Reordering is now a POINTER drag: `pointerdown` on the grip attaches `pointermove` /
`pointerup` / `pointercancel` to the window, rows register themselves so the target resolves
from the pointer's Y, and nothing is shared with anything else on the page. This is how
happypaint's layer panel has always worked, and it is why happypaint could never have had
#323.

The drop semantics are byte-for-byte the old ones — grouping mode, the root drop zone, the
reversed-index arithmetic all moved across unchanged into `applyDrop`. Only how the two ids
are gathered is different, so a reorder that misbehaves after this is the transport and
nothing else.

Two things had to keep working and did:

- **The swipe gesture.** Rows carry a Procreate-style horizontal swipe, the grip a vertical
  reorder. They used to coexist because only `.drag-handle` was `draggable`; now the grip's
  `pointerdown` stops propagation, so a vertical drag on the grip never becomes a swipe and a
  horizontal drag on the row body never becomes a reorder.
- **The root drop zone** ("Move to Top Level" in grouping mode), now driven by
  `pointerenter` / `pointerup`.

`data-internal-drag` is removed from the layer list, because there is no longer an HTML5 drag
there to exempt. The guard in `app.tsx` stays: the slide navigator still uses drag-and-drop
and still needs it.

One thing improves for free. The target resolves from the pointer's Y rather than from which
element the browser decided the drag was over, so the drag now works across the list's padding
and past the ends of the list. Releasing over the panel header — the exact gesture in the
original bug report screenshot — now cancels cleanly instead of showing a no-entry cursor.

### 327. …and the fills that assumed no shape ever would

#326 fitted nine shapes to their boxes. Two kinds of shape are outside their box **on purpose**
— a puzzle piece whose tabs stopped at the box would not interlock with the piece beside it,
and a 3D solid's extruded depth is drawn beside the front face the box describes — so they
were exempted, and the exemption quietly left #322 alive for exactly those shapes.

The buffer-backed fills rasterise a buffer the size of the ELEMENT and clip it to the OUTLINE:

```ts
const buf = rasterizePatternBuffer(pf, w, h);   // buffer = the element's box
renderer.clipPath(geometry.path);                // clip   = the real outline
renderer.drawImage(buf, -w / 2, -h / 2, w, h);
```

Where the outline reaches past the element, the buffer has already run out. A pattern or image
fill on a `puzzlePiece` left its tabs empty — the cloud bug, on a shape that had just been
formally blessed as overflowing.

`utils/geometry-extent.ts` now answers "what box does this geometry actually occupy", and
`fillBufferRect` sizes the buffer from it: exactly the element's box for any shape that fits,
grown only where a shape draws outside it. Wired into all five buffer-backed paths — pattern,
mesh, inflate, image and the appearance-fills list — and into the SVG exporter, so the
exported `<pattern>` tile matches the rect the canvas draws into.

Solved analytically (curve extrema from the derivative's roots, arc extrema from the
parametric angles where the tangent goes axis-aligned) rather than by flattening. Flattening
is simpler and always *under*-estimates, and under-estimating here is the one error that clips
artwork. The tests measure the same shapes by flattening instead, so the two disagree loudly
rather than quietly.

Two things went wrong on the way and are worth keeping:

- The first version subtracted a half-pixel of slack from every extent so that path rounding
  would not grow a buffer by a ten-thousandth of a pixel. That also shaved half a pixel off
  *genuine* overflow, leaving the puzzle piece's buffer short of its own tabs — the bug, in
  miniature, inside its own fix. Slack now suppresses sub-pixel overflow and, where overflow
  is real, grows all the way to it.
- Growing the buffer must not move the picture. For image fills and for inflate's image
  material, the cover-fit is still composed against the ELEMENT's box; only the buffer around
  it grows. Otherwise applying a fill to an overflowing shape would shift the artwork sideways.

**On believing screenshots.** This was called fixed, then not-fixed, twice, from looking at
pictures of a checkerboard: the checker pattern's default background is transparent, so a
correctly filled tab looks half empty. Sampling the canvas along the tab's centre line with an
opaque pattern settled it in one call — every pixel from the box edge to the tab tip is
pattern. Eyeballing a fill against a transparent background is not evidence.

## 2026-08-25 — the other eight clouds

### 326. Eight more shapes drew outside their own bounding box

No user reported these. They are the rest of #322.

The cloud was fixed as one shape. It was never one shape: "draws outside its own box" is a
whole bug class, and it is close to invisible, because *drawing* the shape looks perfect. What
breaks is everything downstream that trusts `width` x `height` to be the truth — the pattern,
mesh and image fills rasterise a `w x h` buffer and stop dead where it runs out, and the
selection handles draw a rectangle through the middle of the artwork. Solid fill hides all of
it, which is exactly why the cloud arrived as a *fill* bug about a shape.

An audit over every element type, at four aspect ratios, found eight more:

| shape | outside its box | cause |
| --- | --- | --- |
| `lightbulb` | 16.7% | arc radius too small for its chord — SVG inflates it (spec F.6.6) |
| `magnet` | 15.0% | the U's bend radius came from the width alone |
| `scroll` | 11.3% | the rolled ends curled outward from a full-width sheet |
| `gauge` | 30.0% | `Math.min(w / 2, h * 0.8)` — `h * 0.8` is not a half-height |
| `chainLink` | 5.0% | corner radius exceeded the link's width |
| `flag` | 2.4% | the wave's control point lifted the banner above the pole |
| `externalEntity` | 1.3% | the offset shadow was full-size, so the pair overflowed |
| `burstBlob` | 0.6% | spikes varied OUTWARD, and `(w / h)` was used as a scale factor |
| `handPointRight` | 1.0% | the closing curve's control point sat left of the edge |

`chainLink`'s cause was shared: `getRoundedRectPath` never clamped its radius, so a radius
wider than the box put `x + w - r` to the LEFT of `x + r` and turned the rect inside out. Fixed
in the helper rather than at the call site, since no caller expects to have to think about it.

`puzzlePiece` also protrudes and is exempt with a reason recorded in the test: a piece whose
tabs stopped at the box would not interlock with the piece beside it. `solidBlock`,
`perspectiveBlock`, `openBox` and `isometricCube` are exempt too — their extruded depth is
drawn beside the front face, and the box describes the face.

The gate is `shape-box-fit.test.ts`, which reads the element-type union so a newly added shape
is covered without anyone remembering to add it, and asserts both directions: inside the box,
and still reaching its edges — because shrinking every shape would also "fit".

**A warning for whoever touches that test.** Its first draft was a throwaway script that
skipped the arc's x-axis-rotation parameter, and it reported the `cylinder` as **562%**
oversized. The cylinder is fine; its arcs are rotated 90°, so `rx` and `ry` swap. Two of the
nine real numbers it produced were also wrong by a factor. A measuring tool that is confidently
wrong is worse than none, so the sampler now has eight tests of its own — rotation, both flags,
the radius correction, the reflected control point of a smooth curve — and they run before any
shape is judged.

## 2026-08-25 — one shape on two pages, because two rules disagreed about what a page is

### 324. Artwork bled onto the next page, and deleting it "from one page" deleted it outright

*"Elements added in the design show up on both pages (if you have two created), and deleting
elements from one page also deletes the element from the other page — deletes the element
completely."*

Reported as a curiosity about the Pages panel; it was two rules disagreeing.

Pages are frames on one shared canvas, not separate documents, so exactly one element exists and
some rule has to say which page it belongs to. There were **two** rules, and they gave different
answers:

- **Ownership** (save, export, animation builds) used the element's **centre point**.
- **On-canvas visibility** used an AABB **overlap** with the active page.

Anything hanging over a page edge therefore drew on the *neighbouring* page as well — one shape,
two pages, and deleting it from either was deleting the only copy. Reproduced with a single
700x400 rect at x=1600 across page 1 (0–1920) and page 2 (2000–3920): it appeared on both pages
and in both thumbnails.

Nothing clipped either, so the overhang spilled straight across the gutter — which is not what
this editor's own exporter produces. `exportPageToPng` has done `ctx.clip()` to the page bounds
all along, so the canvas had never matched its own output.

`ownerSlideIndex` is now the single answer: centre-in-page, else the page the box overlaps most,
else nobody. The renderer draws an element only on its owner page and **clips it to that page**,
so the page edge trims artwork the way a paint canvas does. Export (PNG, per-page PNG, PDF,
PPTX) and the page thumbnails were switched to the same rule — the thumbnail capture had no page
filter at all and was drawing the entire document into every page's preview.

The element being drawn and anything selected are exempt from both the clip and the ownership
test, so a drag never cuts its subject in half or makes it vanish mid-move; it re-owns on
release. `canInteractWithElement` follows the same rule, because an element that isn't drawn on
this page must not be clickable on it either.

### 325. An element straddling the gutter belonged to no page at all

Found while reproducing #324. Pages sit ~80px apart, and the centre test asked only "is the
centre inside this page". An element straddling the gap has its centre in the gap — inside no
page — so `getElementsOnSlide` returned it for **neither**. Animation builds
(`slide-build-manager`), the per-page element count in the slide toolbar, and PDF/PPTX export
all silently skipped it while the canvas drew it perfectly happily.

The overlap-area fallback in `ownerSlideIndex` fixes it without adopting scratch artwork parked
beside the document: no overlap with any page still means no owner.

## 2026-08-24 — a cloud that drew outside its own box, and a CSS class that had moved house

Two reports from the same user, unrelated to each other, and both about something quietly
disagreeing with something else.

### 322. Pattern fills stopped in a straight line partway up a cloud

*"This the cloud shape filled with solid fill (works fine), and other fill styles (these have
some issue)."*

Solid fill was fine; dots, grid, checker, crosshatch and noise all ended in a dead horizontal
line across the top of the cloud, with the outline carrying on above it in bumps the fill never
reached. Reported as a fill bug; it was a geometry bug.

The cloud is ten scallops, each an `A r r 0 0 1` arc whose radius is `0.62 x` its own chord. That
factor is what makes a scallop bulge, and it bulges *outside* the ring its two endpoints sit on —
by about a quarter of the chord. The ring was placed on the edge of the element's box, so the
bumps hung **outside the element's declared bounds**: 41% of the height over on a wide, short
cloud, 207px on the one in the report.

Nothing complained, because most things that draw a cloud draw the path. The ones that broke are
the fills that rasterise a buffer first — pattern, mesh, image — because the buffer is `w x h`:

```ts
renderer.drawImage(buf, -w / 2, -h / 2, w, h);   // clip is right; buffer runs out
```

The clip was the true outline all along. Above `-h/2` there was simply no buffer left, so the
fill stopped square at the top of the box while the stroke kept going. Solid fill has no buffer,
which is exactly why it was the one style that looked correct. The same overflow is why the
selection handles cut through the shape.

`fitCloudRing` now pulls the ring in until the *scallops*, not the ring, land on the box. Moving
the ring changes the chords, which resizes the scallops, so the fit iterates; a final **uniform**
scale makes containment exact, because scaling the points scales the chords, radii and bulges by
one factor. Past about 4.5:1 no ring can fill the box at that bulge — the chords along the long
axis are then so long that their scallops alone overflow the short one, and fitting alone shrank
a 50:1 cloud to 15% of its width — so the fit also flattens the scallops by the least amount that
lets the cloud reach the edges. The solve is cached per ~0.5% aspect bucket, since a resize drag
walks through aspect ratios continuously and an exact key would miss on every frame.

Two things nearly hid the fix. The radius rule carried an absolute floor (`Math.max(0.5, …)`)
which is below every real chord but *above* every chord in the normalised box the fit works in,
so the solver silently solved a rounder cloud than the one being drawn. And the analytic
arc-extent helper normalised its angle only upward (`while (t < 0) t += TAU`), so an extreme past
`2pi` was never brought back down and the widest bump on the shape went unmeasured. Both were
caught by a test that samples the arcs instead of solving them, which is the point of writing the
check a different way from the code.

### 323. Layers could not be reordered — the drag showed a no-entry cursor

*"It shows a red cross when we try to reorder layer."*

Dragging a layer's grip produced 🚫 and no reorder. The panel's own handlers were correct: it set
`effectAllowed = 'move'` on dragstart and `dropEffect = 'move'` on dragover. But `app.tsx`'s
global image/colour drop handlers were also claiming the drag, calling `preventDefault()` and
forcing `dropEffect = 'copy'`. `copy` is not within an `effectAllowed` of `move`, so the browser
rejected the drop outright — the no-entry cursor, and **no `drop` event at all**:

```
dragstart -> dragover (prevented, effect: copy) -> dragleave -> dragend      // no drop
```

Those global handlers had an escape hatch for exactly this — `closest('.slide-navigator,
.layer-panel')` — and it had rotted. The layer panel was re-homed inside the generic dock-panel
wrapper (`.dock-floating > .dock-panel > .dock-panel-body > .layer-list`), the old `.layer-panel`
wrapper went with it, and the selector matched nothing. Slide reordering kept working the whole
time because `.slide-navigator` still exists, which is why this looked like a layers-only bug.

The layer list now carries `data-internal-drag="layers"`, set by the panel itself so it travels
with the panel, and the guard is a named `isInternalPanelDrag` used by all three handlers. The
type of the drag can't be used instead: a layer drag and a colour-swatch drag both carry nothing
but `text/plain`.

## 2026-08-23 — eight fixes from a pillar drawing, and none of them was about pillars

Follow-up to the cylinder work below (#312), from the same user. Having got a working cylinder
they went on to build a stone pillar out of shapes, blocks and a `database` converted to a path,
and every complaint that came back was about a *different* tool that had quietly assumed nobody
would push it this far.

### 314. Convert to Path turned every curve into a polygon

*"A 'database' shape after converting into path, loses some of its shape smoothness and the
curve above."*

`shapeToPath`'s fallback for `path`/`multi` geometry walked the outline at 96 even steps and ran
Ramer–Douglas–Peucker over the points:

```ts
for (let i = 0; i < N; i++) raw.push(L(PathUtils.getPointOnPath(cmds, i / N)));
const simplified = rdp(raw, Math.max(1, Math.min(w, h) * 0.01));
```

That is a reasonable last resort for geometry you cannot read, but it was the *first* resort for
everything arc-based — database, cloud, capsule, lightbulb, magnet, pin, storage blob. All of them
converted into faceted polygons with straight chords where the curves had been. The irony is that
`parsePath` already lowers `A` to cubics (fixed earlier, when arcs were being skipped outright),
so every command already had an exact anchor+handle form and there was nothing left to
approximate. `commandsToSubpaths` now converts command by command; a database comes back as **six
anchors** — two straight sides, two arcs — instead of thirty. Sampling survives only as a fallback
for geometry that yields no usable contour, and multi-contour outlines now stay compound instead
of being welded into one ring.

### 315. …and dropped the cap, because the fill geometry never had one

*"If it could retain the cap it can be more useful to create custom cylinders."*

The `database` renderer draws **two** paths: the body silhouette, and the cap ellipse on top.
`getShapeGeometry` returns only the first — it is what fills and clips are built from — so
Convert to Path had never seen the cap and handed back a bare barrel. `shapeDecorationSubpaths`
now publishes the stroke-only decoration a renderer draws but the fill geometry does not carry
(the database cap, the bars of a predefined process, the rules of an internal storage), and the
user-facing Convert to Path emits them as **sibling paths** next to the body.

Siblings rather than extra subpaths on the body: `pathSubpaths` fills **even-odd**, so a cap ring
folded into the body would punch a hole through the lid. The silent conversion (the first half of
Simplify, Warp, Turntable, …) is unchanged and still returns exactly one element per input.

### 316. The database's fill outline was a different shape from the database

Found while fixing #314. `shape-geometry`'s database path closed its top with the arc **under**
the cap (`A … 0 0 1`) while the renderer fills the barrel plus the **whole** cap ellipse. So the
geometry described a silhouette about `h * 0.1` shorter than the one on screen. Nothing pointed
at it directly, but everything downstream of it was subtly wrong: gradient, pattern, image and
hachure fills were clipped away across the lid, hit-testing missed the top of the shape, and a
converted path came back with the lid sliced off. One sweep flag.

### 317. Undo mid-path threw the whole path away

*"Point-level undo during path construction — when a user undoes once, it should remove the most
recent anchor point rather than undoing the entire path as a single operation."*

Exactly right, and the mechanism is that the in-progress path is **one** history entry: the
snapshot is taken on the first click, so the document undo rewinds past the whole thing.
`Backspace` already stepped back one anchor, but Ctrl+Z is the reflex, and it took all of it —
then left the Pen pointing at a deleted element (that half was already handled by
`penDropIfOrphaned`, see #298, which is why it only *looked* like a lost path rather than a broken
tool).

The fix is not another keydown listener. The Pen's handler and the global shortcut are both
**capture-phase listeners on `window`**, where `stopPropagation` does nothing between listeners on
the same target — so which one won came down to component mount order, and the first attempt
worked in the unit test and failed in the browser. `utils/point-undo.ts` is a one-function
registry the global Ctrl+Z consults *before* undoing the document; it answers "did a building tool
consume this", and `false` when nothing is building. Polyline gets it for free.

### 318. Open paths looked impossible, so people drew them with a brush instead

*"Yappy Draw should support open paths like Photoshop… in Yappy you cannot leave paths open. This
is the reason I had to resort to drawing with fine liner, which later showed up when we used shape
building."*

Open paths were supported — Enter, Escape and double-click all finish one — but every way in is a
keyboard-or-timing gesture, and with a stylus in your hand none of them is reachable. A feature
nobody can find is a feature that does not exist, and the cost here was concrete: the curve got
drawn with a liner brush, which behaves like a stroke and not a path, and that is what showed up
when the result was fed to the Shape Builder.

**Ctrl/Cmd + click anywhere** now ends the path where it is, open, without adding an anchor there
— and unlike the other three it **keeps the Pen selected**, so a run of separate open curves is
one continuous gesture. A single-anchor path is still discarded rather than left as a stub.

### 319. Hidden layers were in every export — including the crop box

*"The image on the infinite canvas is exported as a small object in far left when exported as a
png file. It should have all the objects at the centre."*

The export crop is already a tight box around the artwork, so a drawing pushed into one corner of
a mostly-empty image means something is in the box that should not be. `isExportable` — the single
gate every export walk in `export.ts` goes through — checked only the element's own `visible`
flag:

```ts
export const isExportable = (el) => el.visible !== false;
```

The canvas renderer skips whole layers whose eye is off (`renderElements`, the `isLayerVisible`
check per bucket). Export did not. So everything on a hidden layer was drawn into every PNG, JPG,
SVG, PDF, PPTX, Rasterize and Slice — **and** widened the bounding box those exports size
themselves from. A single stray object parked off to one side of the canvas, on a layer the user
had turned off precisely so they would not have to look at it, was enough to blow the crop up and
leave the drawing in the corner. Added the layer check to the gate.

`elementsBounds` also now drops non-finite boxes instead of unioning them: `Math.min(NaN, x)` is
NaN, so one element with a NaN coordinate (degenerate boolean results, hand-edited documents) took
the whole crop with it and the export came out blank or absurdly large.

### 320. Rounded corners were dropped by every polygon operation in the app

*"The shapes and 3d blocks should have an option to curve down their edges easily, for example
if someone wants a design like a dice (almost a cube with blunt edges)."*

The recipe for that already exists — round a rectangle's corners, add a 3D Extrude, raise
**Bevel** — and it did not work: the extruded block came out with sharp corners, and turning
Bevel on squared the *front face* off too (with a bevel the effect owns the front, so it was
drawing the same wrong outline). Chasing it landed a long way from the 3D code:

```ts
if (geo.type === 'rect') {
    const { x, y, w, h } = geo;                       // ...and never `geo.r`
    return [[W(x, y), W(x + w, y), W(x + w, y + h), W(x, y + h), W(x, y)]];
}
```

`geometryToRings` — the flattener behind `elementToMultiPolygon` — read a rect's `x/y/w/h` and
ignored its corner radii. So it is not a 3D bug at all: **everything** built on polygon
flattening had been operating on a shape that was not the one on screen. Pathfinder booleans,
the Shape Builder, the Knife, Distort and Live Paint all squared a rounded rectangle off, which
also explains the other half of the same report — a pillar outline built with the Shape Builder
came back with the curves gone.

`shapeToPath` had been taught about corner radii long ago (see the rounded-rectangle branch it
grew for the Knife); this flattener is a *second*, independent path from geometry to polygons,
and the lesson only reached one of them. It now builds the same quadratic-corner path the
renderer draws (`roundedRectPath`) and flattens it through the existing `path` branch, so the
ring matches the shape exactly, per-corner radii included, with the radius clamped to half the
shorter side so an over-large value degenerates into a stadium rather than an inside-out ring.

### 321. 3D blocks could not be converted to a path at all

*"We need this as the 3d shapes do not have an option to convert them to path and tweak nodes
into desired shape."*

Literally true, and it was a hole rather than a decision. `shapeToPath`'s `multi` branch looked
for the geometry's published `outline`, and failing that for "the first `path` face" — a guess
the comment itself admitted to. The block primitives (`isometricCube`, `solidBlock`,
`perspectiveBlock`, `openBox`) are built entirely from `points` faces and publish no outline, so
both lookups came back empty and the function returned `null`. Everything gated on it therefore
refused them: Convert to Path, the Node tool, Warp, Envelope/Mesh distort, Turntable, the Knife,
the Scissors and the Pathfinder. `canTurntable` and the context menu simply hid the options,
which is why it read as "there is no option" rather than as a failure.

The silhouette of a multi-face solid is the **union** of its faces, and the polygon machinery to
compute that was already in the file. Two details cost a round each:

- `elementToMultiPolygon` was the wrong entry point. It runs a containment pass to work out
  which rings are holes, and a solid's faces overlap each other, so it grouped six quads into
  two three-ring "polygons" with faces read as holes in other faces. `geometryToRings` is now
  exported for callers that want the raw rings and will union them themselves.
- Collecting the rings is not unioning them. Faces that merely touch stay separate polygons, so
  without a real `unionPolys` a cube converted to its three quads rather than to one hexagon.

An isometric cube now converts to a six-anchor hexagon spanning its box; the cylinder is
unaffected because it already publishes an exact `outline` (arcs included), which still wins.

## 2026-08-22 — the cylinder was an extruded ellipse pretending to be a solid

### 312. Making a cylinder taller made it flatter, and only one of its two circles moved

Reported by a user drawing a pillar: *"the cylinder is not very easy to use. The database looked
more of a cylinder than the cylinder. When we increase the height of the cylinder to make a
heightened cylinder, it collapses flat. Also we are only able to give angle to the upper circle
while the circle below is fixed."*

All three complaints were one modelling mistake. `cylinder` was an **ellipse the size of the
whole element box, extruded** by a separate `depth`:

```ts
const rx = w / 2, ry = h / 2;                              // cap = the entire box
const depth = Math.min(depthBase, Math.min(w, h) * 0.5);   // barrel, clamped
```

So the box sized the *cap*, not the solid, and the barrel could never be longer than half the
short side. Dragging a 100-wide cylinder to 400 tall gave a 100×400 **ellipse** with a 50px
stub — a standing pancake, which is exactly the screenshot that came in. The `database` shape,
whose box genuinely is the whole drum, therefore looked more like a cylinder than the cylinder.

The front cap was also pinned at the box centre with only the back one offset by `viewAngle`, so
the angle control sheared the solid and moved one circle — "the circle below is fixed". And
because the caps stayed axis-aligned while the extrusion rotated, a diagonal `viewAngle` was a
shear, not a rotation: it never read as 3D at all.

Two more defects fell out of the same geometry:

- The barrel was a plain quad, and its **end edges are chords through the cap centres** — they
  were stroked, drawing a line straight across the middle of a squat cylinder.
- The far cap was drawn as a full ellipse. With a transparent fill its hidden half showed
  through the barrel, which is the crossed-X look in the report.

**The fix is a different model.** The cylinder is now a tube *inscribed in its box*: width is the
diameter, height is the whole solid. `getCylinderFrame()` solves a 2×2 system for the
cross-section radius and the barrel length so the caps plus the barrel exactly fill the box, with
a fallback for the degenerate diagonal-in-a-square case. `viewAngle` is the axis direction (90 =
upright, the new default), the caps are genuine rotated ellipses, and a new `capRatio` sets the
foreshortening of **both** of them. Only the visible half of the far cap is stroked, and the
barrel is filled and stroked separately so its chords are never drawn.

The tangent formula was wrong too, and had been all along: it used `atan2(dy·rx², dx·ry²) + π/2`,
which is off by `rx/ry` from the point where an ellipse's tangent runs parallel to the extrusion.
It happened to agree for an axis-aligned extrusion, which is the only case anyone checked. The
new frame does not need it — in the tube's own coordinates the barrel meets each cap at its ±r
poles, and there is nothing to solve.

Existing drawings mostly improve rather than break: shape creation never wrote `viewAngle`, so a
cylinder that was left alone has it `undefined` and picks up the new upright default.

### 313. A property declared twice was only ever written to the first declaration's shapes

`supportedSelection()` in `property-panel.tsx` narrowed a write to the types in
`properties.find(p => p.key === key).applicableTo` — the **first** definition with that key.
`renderStyle` already had two definitions, and `viewAngle` now needs two (a block's "View Angle"
and a cylinder's axis, with different labels and defaults), at which point every type covered
only by the later definition silently stopped receiving the write. Now it unions
`applicableTo` across all definitions sharing the key.


## 2026-08-21 — the i18n ratchet had nothing to run it

### 311. Teaching Mode shipped three hardcoded strings past a guard designed to catch them

`scripts/i18n-lint.mjs` is a ratchet: it records the number of hardcoded user-facing strings
per file and fails on an increase. It was built in Phase 1a precisely to stop new untranslated
text entering `components/`. It worked. Nothing ran it.

The plan said so at the time — *"There is no CI in this repo to wire it into — `npm run
i18n:lint` exists and needs a workflow, or a pre-commit hook, when one is set up"* — and that
sentence sat in the doc while the count climbed. Teaching Mode (v0.8.207) added a menu label, a
button `title` and an `aria-label` in English:

```
frontend/src/components/menu.tsx  120 → 122  (+2)
```

It then shipped across **four releases** (0.8.207 → 0.8.210) with the ratchet red, because the
only thing that would have noticed was a command nobody had reason to type.

Two fixes, and the second is the one that matters.

**The strings are extracted.** New `menu.*` namespace in all four locales, with real
translations (`Unterrichtsmodus`, `Modo enseñanza`, `授業モード`) rather than English
placeholders — `en.ts` defines the `Dictionary` type, so a locale missing a key is a compile
error, and a placeholder would have been a silent lie in three languages. This also makes
`menu.tsx` the first file in the top-bar group to use `t()` at all; it is step 4 of the plan's
extraction order and otherwise entirely un-extracted.

**The ratchet now runs on commit.** `.githooks/pre-commit` gained an i18n block that, unlike
the repo-map refresh beside it, **blocks**. It fires only on a real increase and only when the
commit touches `frontend/src/components/`, and the message names both ways out (extract with
`t()`, or `--update` when the string genuinely is not user-facing). `--no-verify` remains the
escape hatch.

The baseline was also tightened, 1629 → 1628: extracting three strings and adding none back
left `menu.tsx` one better than it started, and a ratchet that does not bank an improvement is
only half a ratchet.

**The pattern, which this session hit three times:** a check that nothing invokes is not a
check. The same shape as the `sw.js` "expected failure" that hid a fix, and the `verify:deploy`
default that pointed at a broken hostname — a signal exists, nobody is listening, and its
silence reads as good news.


## 2026-08-21 — the undo-depth control did not enforce the range it advertised

### 310. `min="10"` on the input, `Math.max(1, …)` in the handler

Found while answering "can a user control max undo/redo?" — the answer was yes, but the control
was not honouring its own bounds. The number input in *Settings → Pen & Input* declares
`min="10" max="500"`, and the browser enforces that for the **spinner arrows only**. Typing a
value straight into the field bypasses it entirely, and the change handler clamped with
`Math.max(1, …)` and no ceiling at all — so `3` was accepted and stored, and
`Yappy.setHistoryDepth(50000)` was too.

Nothing crashed; a depth of 3 simply gives three undo steps while the UI says the minimum is
ten. That is the quiet kind of wrong — the control states a constraint it does not keep.

Three routes set this value — the dialog, the scripting API, and a hand-edited `historyDepth`
in localStorage — and each had its own idea of the valid range (or none). They now share one:
`HISTORY_DEPTH_MIN`/`MAX`/`DEFAULT` and `clampHistoryDepth()` in `app-store.ts`, applied at the
top of `updateGlobalSettings`.

The clamp had to go at the **entry point**, not the persistence step. `updateGlobalSettings`
writes the store first and persists afterwards, so clamping on the way to localStorage would
have left the in-memory value and the stored one disagreeing until the next reload — a second
bug of exactly the shape as the first. A test asserts the two agree.

The input also snaps back to the stored value on change, so a typed out-of-range number cannot
sit in the box looking accepted.

Also fixed alongside: the setting was **entirely absent from the help**. `workspace.md`
documented the History panel and `Alt+H` in detail but never mentioned the depth was adjustable,
so anyone hitting the 50-step ceiling had no way to discover the setting existed.


## 2026-08-21 — the www hostname was a dead link, and it was our rule

### 309. `%1` backreferenced the wrong RewriteCond, so every www URL lost its hostname

Reported as a question — "www.yappydraw.com, how to fix that?" — after two releases had recorded
it as an un-fixable setting on the host. It was ours.

```apache
RewriteCond %{HTTP_HOST} ^www\.(.+)$ [NC]
RewriteCond %{HTTPS} on
RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L]
```

`%N` is a backreference to the **last `RewriteCond` that matched** — not to the first, and not
to "the one that has a group in it". The last one here is `%{HTTPS} on`, which has no capture
group, so `%1` expanded to the empty string:

```
www.yappydraw.com/help/  ->  301  https://help/     (DNS failure — no such host)
www.yappydraw.com/       ->  301  https://          (unparseable)
```

Identical on IPv4 and IPv6, so not a CDN-node split. The fix is to write the capturing
condition **last**; the conditions are ANDed, so reordering changes nothing except which one
`%1` resolves against.

Two things made this survive longer than it should have.

**It was ruled out by reading the top of the file.** The first investigation grepped and read
the first 60 lines of a 115-line `.htaccess`, found no www rule, and concluded the redirect
must be a control-panel setting — which was then written into `CLAUDE.md`, the bug log and a
release note as an un-fixable known failure. The rule is at line 100. "Not in this file" is a
claim about the whole file, and it takes reading the whole file.

**Browsers hide it.** Typing a bare `www.yappydraw.com` into the address bar usually
autocompletes to an apex URL already in history, so no www request is ever made and the site
appears to work — which is exactly the report that reopened the investigation. `curl` on the
full URL is the honest test: it refuses to follow, with `Could not resolve host: help`.

The *good* consequence of the two-release detour: the Alternate hostname check added in
v0.8.208 is what turned this from "seven confusing failures" into one line naming the exact
malformed `Location`, and it now verifies the fix rather than being a permanent excuse.


## 2026-08-21 — the deploy check was checking the wrong hostname

### 308. `verify:deploy` reported seven failures on a perfectly good deploy

Run straight after shipping v0.8.207 it came back with seven red lines: no `Cache-Control` on
`index.html` or `sw.js`, a missing `sitemap.xml`, and 301s from `/help/`, `/help/uml/` and
`/learn/` — the signature of a half-finished upload, and alarming right after a release.

None of it was true. The script defaulted to `https://www.yappydraw.com`, and the **www
hostname is broken at the host**: it answers every URL with a 301 whose `Location` has lost the
domain.

```
https://www.yappydraw.com/       → 301  location: https://
https://www.yappydraw.com/help/  → 301  location: https://help/
https://yappydraw.com/help/      → 200
```

The path is being substituted for the hostname. **This diagnosis was wrong in one important
respect**, corrected in #309 below: the cause was a rule in `frontend/public/.htaccess` all
along. It was ruled out by reading the top of a 115-line file and not finding a www rule —
the rule is at line 100. Every check the script makes passes against the apex host, which is
also what the prerendered pages declare as their canonical.

Two changes. The default is now the apex host, because that is the address that actually has to
be correct. And the www breakage did not just get hidden: `scripts/verify-deploy.sh` gained an
**Alternate hostname** check that derives the other form of the host, follows one request, and
fails if the `Location` host has no dot in it — which is exactly the shape of this bug, and of
the `https://` case where the host is dropped entirely. So the defect is reported once, named
precisely, with the fix pointed at the control panel instead of at a re-upload.

The failure text at the bottom of the script also had to change. It explained split builds and
told you to re-deploy — advice that is actively wrong when the only failure is a DNS-level
redirect, and re-uploading would have "confirmed" the problem was unfixable.

**The wider point: a verification that always fails is worse than none.** It was one release
away from being a script whose output everyone had learned to skim past — and the previous
standing failure (#280's cacheable `sw.js`) had already trained exactly that habit. Which is
how the *good* news here nearly went unnoticed: `sw.js` now returns
`no-cache, must-revalidate, max-age=0`. Bug #280 is genuinely fixed on the host, and `CLAUDE.md`
had been telling every session to expect it and wave it through.


## 2026-08-21 — pasted objects you could see but not touch

### 307. Paste left the drawing tool armed, so the result was inert

Paste an image (or any object) while a brush, pen or shape tool was active and it appeared on
the canvas, correctly selected — and then refused to do anything. No resize handles, no drag,
no rotate. The next stroke drew straight over it.

Nothing was wrong with the paste itself: `store.selection` held the new ids. The problem is that
being selected is only half of being editable. `selection-renderer` draws the handle box **only**
under the selection tool, and `canvas.tsx` routes a pointer drag to move/resize **only** for
`selection` and `lasso`. Under any drawing tool the same drag starts a new stroke. So the
selection was real but unreachable, and — because continuous tools never reassign the selection —
it then went quietly stale as the user kept drawing.

This is the same convention Select-All already follows (`app-store.ts`, the `selectAll` comment
about acting on existing objects), and the same one finishing a pen path or placing an image
follows. Paste simply never got it. `selectPastedElements` in
`frontend/src/utils/object-context-actions.ts` now owns the ending for every paste path:

```ts
if (store.selectedTool !== 'selection' && store.selectedTool !== 'lasso') setSelectedTool('selection');
setStore('selection', ids);
```

Order matters and is easy to get backwards: `setSelectedTool` **clears** the selection on its way
into most tools (and `exitAllToolModes` can drop it too), so selecting first and switching second
throws the selection away. Switch, then select.

Every path that lands a placeable object was routed through it: clipboard paste of images, of
Yappy JSON, and of plain text; the two image drag-and-drop handlers plus the DataTransfer
fallback; the mindmap-outline paste; and the SVG file drop. Lasso is left alone — it is already
a selection tool, and yanking a user out of it would be its own bug.

The SVG drop had a second, quieter fault found on the way: `importSvgToCanvas` selects its own
shapes, so dropping several SVGs at once left only the last file selected. The ids are collected
across the whole drop now and selected together, matching what the multi-image drop already did.

Pinned by `frontend/src/utils/paste-tool-switch.test.ts` — five cases covering the switch, the
lasso exemption, the empty-paste no-op (which must not clobber an existing selection), and the
Yappy-JSON and plain-text paths end to end.


## 2026-08-20 — the path menu ate the element menu

### 306. Ungroup (and everything else) vanished when you right-clicked the artwork

Reported with a screenshot: an outlined word, selected, and a context menu offering only
*Insert Point Here* and *Constrain Handles (90°/45°)*. No Ungroup — and on a tablet no
`Ctrl+Shift+G` either, so the group could not be taken apart at all.

Fallout from #305. Anchor hit-testing moved into a long-press / right-click menu, and that menu
was wired in as a **replacement**:

```tsx
items={anchorMenuItems() ?? genericMenu()}
```

`buildAnchorMenu` fires whenever the press lands on a selected single path's anchor *or*
anywhere along its outline (`canInsertPathAnchor`). On an outlined word that is most of the
artwork, so the ordinary press target — the letters themselves — reliably produced the four-item
path menu and nothing else. Ungroup, Group, Pathfinder, Arrange, Copy, Lock: all unreachable,
with no visible sign that a menu had been swapped out. Press slightly off the glyph and the full
menu returns, which is what makes it read as "not available in some cases" rather than as a
missing feature.

The two menus were never in competition. Path actions are the more specific thing about *where*
you pressed, so they lead; the element menu follows below a separator, the way Illustrator's
right-click menu carries both. `mergePathMenu` (`frontend/src/utils/path-menu-merge.ts`) does the
join and trims the seam so the two never double a separator; a null/empty path menu returns the
element menu untouched.

The general shape, worth keeping: **a context-sensitive menu should prepend, not replace.** The
more specific menu knows what it adds; it does not know what the user came for.

## 2026-08-18 — outlined text was roughened, and Select owned nodes it shouldn't

### 304. Text → Outlines silently restyled the letterforms

Reported externally with three screenshots: a word, the same word after *Create Outlines*
(letters visibly chewed — polygonal bowls, ragged serifs), and a third after *Smooth* made it
worse. No edit had been made between the first two.

Text and paths take different render routes. Glyphs are drawn with `fillText`, which rough.js
never touches — the sketch style has no effect on text at all. A `path`, however, goes through
`SpecialtyShapeRenderer.renderSketchGeometry` → `rc.path(d, …)` in sketch style, which redraws
every contour as a wobbly hand-drawn line. `convertTextToOutlines` spread `...el` onto the new
path, so the outline inherited the text's (never-honoured) `renderStyle: 'sketch'` and started
honouring it. The conversion is supposed to be visually lossless — the whole point is that it
hands back the *same* letters as editable geometry — so the outline is now forced to
`renderStyle: 'architectural'`. Sketch stays one click away in the Style control for anyone who
wants a roughened wordmark.

The "smooth made it worse" third screenshot follows from the same cause: smoothing a glyph
contour that was already being rendered wobbly compounds it.

### 305. The Selection tool drew (and hit-tested) every path anchor

Same report: *"in complex objects there are unnecessary nodes that are distracting when you are
not looking to adjust them."* Selecting a path painted every anchor and Bézier handle on the
canvas — fine for a four-point curve, unusable for an outlined word or an imported icon, where
the artwork disappears under hundreds of blue squares.

Worse, it wasn't only cosmetic. `getHandleAtPosition` returned `path-anchor-*` **before** the
bounding-box resize grips, deliberately, so an extreme anchor would win over the corner handle
sitting on top of it. On a path whose anchors touch its bbox (any outlined glyph), grabbing a
corner to scale the object silently dragged one node instead.

Both halves are gone: the Selection tool is a move/resize/rotate tool, and anchors belong to the
Node tool (`N`, or the new double-click-a-path gesture). Anchor hit-testing lives on in
`getPathHandleAtPosition`, called explicitly by the right-click / long-press menu — deliberate,
invisible until invoked, so it costs no clutter. Alt-click-to-convert and Ctrl-click-to-delete
moved into the Node tool overlay, which previously offered them only as toolbar buttons.

## 2026-08-16 — two silent-no-op bugs found while building the Callipeg picks

### 302. Clearing the play range never cleared it — an omitted key is not a deletion

`opSetMarkRange(tl, null, null)` returned the timeline with `markIn`/`markOut` **destructured
away**:

```ts
const { markIn: _i, markOut: _o, ...rest } = tl;
return rest;
```

That is correct for a plain object and wrong for this store. `setAnimTimeline` writes with
`setStore('animTimeline', next)`, and Solid **merges** an object into the live one — it walks
`Object.keys(value)` and assigns each. A key that isn't in the object is a key it never touches,
so the old range survived every "Clear Play Range". The fix is to say it explicitly:

```ts
return { ...tl, markIn: undefined, markOut: undefined };
```

`{ ...tl, k: undefined }` *does* include `k` in `Object.keys`, and Solid deletes on `undefined`.
The rest of the file already did it this way (`opClearCameraKey`, `opRemoveMarker`); only the
destructuring shortcut got it wrong. Caught by a store-level test, not a pure-op test — the pure
op looked perfect in isolation, which is exactly why it survived.

### 303. The timeline grid never redrew for an edit that moved nothing else

Typing a new length into the timeline's **frames** field updated `frameCount` but left the grid
canvas at its old width, so the ruler stopped where it used to and clicking past that point did
nothing. Same root cause as #302: the redraw effect's only timeline dependency was

```ts
tl();   // → store.animTimeline
```

which reads a property whose **reference never changes**, because every write merges into the same
proxy. Every other frame edit happened to redraw only because it also moved the playhead or the
selection — both of which the effect does track. Change *just* the frame count and nothing
invalidated.

`animTimelineRev` already existed for exactly this hazard (the hit-test caches key on it), but it
was a plain counter, so reading it in an effect tracked nothing. It is now a `createSignal`, and
the redraw effect depends on it. Pre-existing — it predates the zoom work that surfaced it, and it
would have bitten anything that edits the timeline without touching the playhead.

## 2026-08-16 — a shortcut the help dialog promised and the code never reached

### 300. Shift+S never toggled stroke stabilization — the bare `S` branch ate it

Reported from outside: driving the app with Playwright, three `Shift+S` presses left
`getPenStabilization()` at `0`. The stabilizer itself was fine — `setPenStabilization(0.5)`
worked, and measurably so (mean |second difference| along one tremor path: **7.23 → 0.22** at
half strength, **→ 0.11** at full, identical input). Only the keyboard route was dead.

The keydown handler lowercases once at the top (`const key = e.key.toLowerCase()`, app.tsx:241),
so **a bare letter branch also matches its Shift form**. The chain ran:

```
if (key === 's')                    -> cycleStrokeStyle()   // line 715, matched Shift+S too
...
} else if (e.shiftKey && key === 's')  -> togglePenStabilization()   // line 891, unreachable
```

Pressing Shift+S silently cycled the stroke style instead. The branch at 891 could never run.

Fixed by guarding the bare branch (`key === 's' && !e.shiftKey`) rather than moving the Shift
branch, which would have split it out of the block of Shift handlers it belongs to. The file
already knew about this hazard and solved it the other way for `f`: `key === 'f' && e.shiftKey`
is deliberately placed *before* bare `key === 'f'`.

**`s` was the only one affected.** Every other Shift branch in that chain
(`m i x n p l c t h v q`) has no bare counterpart earlier in it — checked one by one. Shift+Q
worked throughout, which is what made this look like a stabilizer bug rather than a routing one.

The help dialog had listed `Shift+S — Stroke Stabilization (lazy brush)` correctly the whole
time; the docs were right and the code was wrong, so nothing needed correcting there.

Regression test: `tests/hotkeys.spec.ts` — *"Shift+S toggles stroke stabilization, and is not
eaten by the bare S branch"*. It also asserts a bare `s` leaves stabilization alone, so the guard
cannot over-correct. Verified red before the fix, green after.

## 2026-08-15 — tools that stopped working underneath you

### 299. The Knife turned a cut line into filled shapes (and couldn't cut a plain line at all)

Reported as "cutting a line using the Knife/Scissor tool converts it into a shape. It would be
useful if the cut remained a path/line where applicable".

`knifeCut` ran every target through `elementToMultiPolygon`, i.e. treated everything as a filled
region. Two different failures fell out of that one assumption:

- A **2-point line** produced a ring of 2 points, and `geometryToRings` filters rings below 4
  points — so `mp` came back empty and the loop `continue`d. The knife silently did nothing.
- A **multi-anchor open path** had its anchors closed into a ring, so cutting a drawn curve
  returned `pathClosed: true` pieces. A 5-anchor open path came back as **4 closed shapes**.

Open geometry is now separated from areas (`isOpenStrokeGeometry`) and split at the crossings
(`knifeCrossings` + the Scissors' exact de Casteljau cut) instead of being polygonised. A knife
stroke that crosses the same open path several times cuts it at each crossing, resolving which
piece carries each one by outline distance. The whole stroke is one undo step: `splitPathAt` grew
`{ history, toast }` options so driving it per crossing doesn't push an entry (and a toast) each
time.

**The Scissors had the same root cause and was also broken on a plain line.** A line created from
a bounding box carries no `points`, and `getShapeGeometry` has no case for `line`/`arrow`, so
`shapeToPath` returned null and the Scissors answered "cannot split this shape". `shapeToPath` now
converts a point-less line/arrow from its endpoints — (0,0) → (width, height) in element-origin
coords, keeping the element's own sign convention — which repairs both tools from one place.

Minor knock-on, noted rather than fixed: `cornerTargets` in `vector-tools-panel.tsx` treats
"convertible by shapeToPath" as "has corners", so a selected line now offers the Live Corners
control. A 2-anchor open path has no interior anchor to fillet, so it does nothing.

### 298. Undo made the Pen tool stop working

Reported as "when using the Pen Tool, pressing Undo causes the Pen Tool to stop functioning for
some time".

The Pen's building state (`isPenBuilding`, `currentId`, `penAnchors`) lives in a module-level
`pState`, while the element it writes to lives in the store — and the store can be rewound
independently. One `pushToHistory()` is taken when a path starts, so a global undo mid-path
restores a snapshot from *before the path existed*. That left `isPenBuilding` true with
`currentId` naming a deleted element: every later click took the "continue the current path"
branch and called `updateElement` on nothing. Measured: three anchors placed, Ctrl+Z, then two
more clicks produced **zero** elements.

"For some time" was the tell — Escape appeared to fix it, because `penFinalize` resets `pState`
as a side effect.

Fixed with `penDropIfOrphaned(pState)`, called from every Pen entry point (down/move/up/finalize/
undo) rather than hooked to undo specifically: if `currentId` no longer exists in the store, the
building state is dropped and the next click starts a fresh path. Because it guards the entry
points, *any* source of removal — undo, redo, deleting the element, a script, a cleared layer —
heals on the next interaction instead of wedging the tool.


## 2026-08-13 — colours you pick and colours you can change

### 297. Fill-mode strokes were stuck on the colour they were drawn in

Reported as "when an area is filled using Fill Mode, the fill colour cannot be changed
afterward". Fill mode (the paint-bucket toggle in the footer, `fillShapeMode`) commits a freehand
stroke as a filled silhouette, baking the fill in at commit time:

```ts
updateElement(id, { fillSilhouette: true, backgroundColor: filled.strokeColor, fillStyle: 'solid' });
```

The renderer honours `el.backgroundColor` and always had, so the fill was editable in principle —
but `backgroundColor`'s `applicableTo` list in `config/properties.ts` (172 element types) doesn't
include `fineliner` / `inkbrush` / `marker` / `ink`, so the Properties panel never drew a
**Background** control for a freehand mark. There was no control anywhere that could change it.

The confusing part for the user: the panel *does* offer **Stroke**, and changing it recolours only
the thin outline drawn on top of the silhouette, leaving the filled body on its original colour —
so it reads as "the fill won't change" rather than "the fill has no control".

Fixed by adding those four types to the list, gated with `visibleWhen: el => !FILL_SILHOUETTE_TYPES
.includes(el.type) || !!el.fillSilhouette` so a plain (unfilled) freehand stroke — which has no
fill — still doesn't get the control.

### 296. The eyedropper picked a slightly different colour than the shape it sampled

Reported with a video: a `#FF0000` square, sampled with the picker's pipette, came back
`#EA3323`. Not a rounding error — that pair is a signature. sRGB red expressed in Display-P3
primaries is `color(display-p3 0.9175 0.2003 0.1386)` → `(234, 51, 35)` → `#EA3323`. Same colour,
different encoding.

The picker used the browser's `EyeDropper` API, which samples the **composited screen**. On a
wide-gamut display the OS holds that framebuffer in P3, and the API hands the raw value back in a
field named `sRGBHex`. Every pick therefore came out re-encoded — visually right on screen, wrong
the moment it was written back into a document that means sRGB.

Not fixable by converting the result: whether it needs converting depends on the user's display,
which we can't reliably detect, so a blind P3→sRGB step would break ordinary sRGB monitors.

Fixed by not going through the screen at all. `startColorEyedropper()` arms an in-canvas pick; the
click resolves the shape under the pointer and reads its **authored** colour straight out of the
document — exact by construction, and working in every browser rather than only Chromium. Where
there is no single authored colour (images, pattern/mesh fills, bare canvas) it samples the pixel
from our own backing store, whose context is sRGB, so that path is colour-managed too. The screen
eyedropper stays as a clearly-labelled second button, since sampling *outside* the app is the one
thing only it can do.

One trap while building it: the first version returned `#000000` for every image, because the
fallback chain ended `solid(el.backgroundColor) ?? solid(el.strokeColor)` and an image element
carries a default black stroke. Raster and texture fills now return null explicitly so they reach
the pixel sampler.

## 2026-08-13 — guides, and what a stroke does at its edges

### 295. Export cropped outside-aligned strokes at the canvas edge

`elementExportBounds` padded every element by `strokeWidth / 2` — correct only for a centred
stroke. An `outside`-aligned stroke reaches a *full* width past the outline, so the last few pixels
of the border fell outside the exported viewBox; an `inside` one reaches nothing and got a margin
it hadn't earned. The padding now asks `effectiveStrokeAlign()` and pads by `0 / w/2 / w`. A 150px
rect with a 10px stroke exports 154 / 164 / 174px wide for inside / center / outside.

### 294. Every guide shared the id `guid-1`, so dragging one moved all of them

`generateId()` finds the next free id by scanning the store's collections for the current maximum
suffix — but `store.guides` was never in that scan list. Guides therefore always computed `max = 0`
and every one of them came out as `guid-1`.

`updateGuide` / `removeGuide` both match by id (`guides.map(g => g.id === id ? … : g)`), so with
duplicate ids *every* guide moved when one was dragged, and deleting one deleted the lot. The bug
was invisible for as long as guides were only ever created and dragged one at a time; adding a
guide *selection* made it immediate, because a selection can never address a single line when the
ids collide.

Fixed at the source — `scanMax(store.guides)` — rather than in the guide actions, since the same
omission would resurface for any future collection stored outside `elements` (the file already
carries three similar notes: live-paint groups, TeX groups, and `groupIds` tags).

### 293b. Outside-aligned shapes lost their container text

Found while building stroke alignment. The `outside` render draws fill+text in one unclipped pass,
then the stroke in an inverse-clipped pass. Suppressing the stroke for the fill pass by setting
`strokeColor: 'transparent'` also blanked the *text*, because `RenderPipeline.renderText` falls back
to `el.textColor || el.strokeColor` — so the label rendered in transparent. The fill pass now pins
`textColor` before clearing the stroke.

## 2026-08-11 — zoom and pan in paged documents

### 293. Loading a presentation or design template killed zoom and pan entirely

Reported as "when using any template, zooming and panning are completely disabled" — and *every*
route was dead at once: <kbd>Ctrl</kbd>+<kbd>+</kbd>/<kbd>−</kbd>, <kbd>Ctrl</kbd>+scroll, the
status-bar zoom buttons, the Pan tool and <kbd>Space</kbd>+drag. That breadth was the clue: those
five paths share nothing except the store, so the fault had to be *downstream* of the view change,
not in any input handler.

It was, and one level up from the store. `canvas.tsx` has an effect that re-lays-out the canvas
when the toolbar docks/undocks, zen mode toggles, or a panel changes zone:

```ts
createEffect(() => {
    store.globalSettings.toolbarDock; store.zenMode; store.appMode;
    dockInsets();
    handleResize();   // ← ends in draw()
});
```

`handleResize()` finishes by calling `draw()`, and `draw()` reads `store.viewState` (plus most of
the document) — so all of that became a dependency of the effect. Any zoom or pan re-ran it, and
`handleResize()` re-fits the slide for a paged document:

```ts
if (isPagedDocType(store.docType)) { zoomToFitSlide(); setTimeout(zoomToFitSlide, 50); }
```

So the view was written, the effect fired, and the view was immediately snapped back to "fit
slide". Nothing appeared to happen. Presentation and design templates switch `docType` to `slides`
/ `design`, which is why the bug arrived with a template and why diagram templates (which stay
`infinite`) were fine — there the same feedback loop existed, it just re-drew instead of re-fitting.

Fixed by calling `untrack(handleResize)`. The effect's real dependencies are read explicitly on the
lines above it, so untracking the body changes nothing about when it fires — it only stops the
render from smuggling the whole document in as a dependency. Window resize and fullscreen changes
still re-fit the slide: they call `handleResize` through their own listeners, outside any effect.

`tests/paged-doc-zoom-pan.spec.ts` covers it — zoom sticks (and is still there 300ms later, since
the old bug re-fit asynchronously) in both a presentation and a design template, `Space`+drag pans,
and a viewport resize still re-fits. Three of the four fail on the pre-fix build.

## 2026-08-09 — independent corner radii

### 292. Rectangles could only round all four corners together

Requested for packaging, UI and logo work: "the top-left corner could have 20px radius, while the
top-right, bottom-left, and bottom-right can have different values or remain sharp".

Four flat fields — `radiusTL/TR/BR/BL` — rather than a nested object, so the declarative property
panel, the migration whitelist and `updateElement` all work with no new machinery. They are a
**percent of the shorter side**, the same unit as `borderRadius`: mixing a percent uniform with
pixel corners would make a resize change the shape's character. A corner left unset **follows
`borderRadius`**, so setting one corner doesn't silently square the other three, while an explicit
`0` means sharp.

`utils/corner-radius.ts` resolves an element to its four radii, and everything that needs a
rectangle's outline goes through it — the renderer (both draw styles), `shape-geometry` (which
fills, clips and hit-tests against it), `shape-to-path` (Knife/Warp/Pathfinder/Convert to Path)
and the SVG exporter. One resolver, so they cannot disagree about what the corners are.

Details worth keeping:

- **Geometry, not decoration.** `getShapeGeometry`'s rect now carries `r?: number | [4]`, because
  fills and clip masks trace that same geometry — without it a one-corner-rounded shape would
  fill as though it were uniform.
- **A zero-radius corner emits no arc and no handles**, so mixed sharp/round rectangles convert to
  paths with genuinely sharp corners rather than degenerate zero-length curves (same reasoning as
  #286).
- The inset "inner border" keeps each corner's own curvature, just tighter.

**Verified** in the app by pixel-probing 3% inside each bbox corner: only-top-left, a rounded
diagonal pair, uniform-with-one-squared and a plain rectangle all render exactly as specified —
**identically in Sketch and Architectural** — the SVG export emits exactly one arc per rounded
corner, and Convert to Path yields 8 anchors with 4 curved and renders unchanged. Plus 18 unit
tests.

## 2026-08-09 — line spacing is a setting

### 290. No leading control; 1.2× was hardcoded in eleven places

Requested alongside letter-spacing, which has had a property for a while: "a line spacing /
leading control in the text settings".

`fontSize * 1.2` was written out at every site that lays text out — the canvas renderer, three
measurement helpers, text-to-outlines, the rich-text layout, the typewriter animation, both
editing overlays, the SVG export (twice) and several auto-height floors. Fine as a constant, a
liability as a setting: miss one and the editor disagrees with the canvas, or the export
disagrees with both.

`utils/text-line-height.ts` now owns the definition (default 1.2, clamped to 0.5–4) and every
site routes through it. `lineHeight` on the element is a **multiple** of the font size rather than
px, so it survives resizing and still means something when rich-text spans on one line differ in
size. The panel control comes from `config/properties.ts` (declarative, same `applicableTo` list
as Letter Spacing).

Two things the work turned up:

- **The metrics cache key.** `measureContainerText` memoises on text+font+width+type+tracking.
  Without adding the factor, changing line spacing would keep returning the cached height and the
  control would look inert.
- **Rich text and SVG export ignored the first pass.** They build a `defaults` object to hand to
  `layoutRichText`, and adding the field to the *type* is not the same as passing it: the
  end-to-end check caught both still sitting at 1.2 (48px where 80px was expected) after the
  types compiled clean.

**Verified** by measuring the gap between rendered ink bands, 40px font: unset → 48px, 0.9 → 36px,
2.0 → 80px, for plain text, text inside a shape, and rich text; and the same 80px in the `y`
attributes of the exported SVG. Plus 8 unit tests on the helper.

### 291. Legacy documents lost letter spacing and all rich-text runs

Found while adding `lineHeight` to `migrateElement`, whose own comment warns "THIS FUNCTION IS A
WHITELIST … new fields must be added". `letterSpacing`, `richText` and `richContainerText` were
never added, so opening a pre-slide-format drawing silently flattened tracking and every bold /
coloured / sized run in it. Current documents are unaffected — every caller runs the whitelist
only when `isSlideDocument()` is false — which is why it went unnoticed. All four fields are
listed now.

## 2026-08-09 — per-word font size in one text box

### 289. The rich-text toolbar had no size control

Requested after a packaging design needed one word of a line larger than the rest, which meant
splitting the line into separate text objects and aligning them by hand.

The model was already there and unused: `RichTextSpan.fontSize` is serialized by `spansToHtml`,
parsed back by `htmlToSpans`, compared in span equality, and honoured by `spanFont()` at render.
The toolbar simply offered bold/italic/underline/strike, lists, colour and font family — no size.
So this was one control, not a feature.

**How it applies.** `execCommand('fontSize')` only speaks the legacy HTML 1–7 scale, so it is used
purely as a **marker**: it does the fiddly part (splitting partially-selected runs, spanning
several nodes), and the `<font size="7">` elements it leaves are rewritten into real inline
`font-size` styles, which is what `htmlToSpans` reads. Nested sizes inside the new run are
cleared, or a smaller run inside the selection would keep overriding the size just applied.

**Verified in the browser** against the real parser: selecting one word of "THE LAST FRAME" and
applying 64 produces `THE <span style="font-size: 64px;">LAST</span> FRAME`, parses to three spans
with only the middle one sized, round-trips through `spansToHtml`→`htmlToSpans` unchanged, and
leaves no legacy `<font>` tags. Rendering was checked by measuring ink height per column: the tall
band sits exactly over the middle word. Plus 4 unit tests on the serialization contract.

**Known wart, documented in help**: the "Default" entry writes the element's current size onto the
run explicitly rather than clearing the property, so such a run will not follow a later change to
the element's base Font Size.

## 2026-08-09 — moving an anchor on a rotated path moved the whole shape

### 288. Re-normalizing a rotated path's bbox swung the untouched anchors

**Symptom** (user report): "after rotating a shape, when I try to move its anchor point, the
opposite side of the object moves instead."

**Measured**, dragging one anchor of a 4-anchor path by a fixed world delta:

| angle | dragged anchor lands off by | the other three anchors move |
| --- | --- | --- |
| 0° | 0 px | 0 px |
| 30° | 8.1 px | 15.6 px |
| 45° | 12.4 px | 23.2 px |

**Cause.** Editing a path changes which anchors are extreme, so the bbox is recomputed and the
anchors re-based against the new origin (`writeEditableSubpaths`, `normalizePathElement`). For an
unrotated element that is invisible — each anchor's world position is preserved by construction.
But rotation is applied about the element's **centre**, and re-normalizing moves the centre. A
point stored at `p` renders at `C + R·(p − C)`, so moving `C` by Δ moves every rendered point by
`(I − R)·Δ` — including anchors nobody touched. At 0°, R = I and the drift is exactly zero, which
is why this hid for so long and why it scaled with the angle.

**Fix.** `utils/rotated-bbox.ts` computes the compensating translation, applied by both
normalizers. It is a pure translation: shifting origin and centre together moves every rendered
point by exactly that amount, so the drift cancels in one step — no iteration.

**Verified**: 10 unit tests (including a no-correction control that reproduces the drift, and a
50-edit loop that shows no accumulation), plus the live repro above now reporting **0.000 px**
error at 0/30/45/90/137°.

A note on the tests: the first version of them passed a fixed *world* point through the before and
after boxes, and failed against correct code. Anchors are stored relative to the origin, so
translating the origin moves them too — the test has to model the element the way the app does, or
it tests different arithmetic than the one that ships.

## 2026-08-09 — cutting a rounded rectangle squared it off

### 286. shapeToPath dropped the corner radius

Reported after a packaging design lost its rounded corners to the Knife.

`shapeToPath` emitted a rectangle as four sharp corner anchors and never read `borderRadius`.
It is the single door every "make this a real path" feature goes through — Knife/Scissors,
Warp presets, Pathfinder, Convert to Path — so *all* of them squared off rounded rectangles,
not just the Knife.

Rounded rects now convert to eight anchors, two per corner, joined by the KAPPA quarter-circle
Bézier approximation, using the same radius formula as `rectangle-renderer` and `shape-geometry`
(percent of the shorter side, clamped to half of it).

Two details the tests pinned down:

- **Only the handle a corner uses is written.** A zero-valued handle is not the same as an absent
  one — `anchorsToPathData` emits a cubic whenever either endpoint defines *any* handle, so
  explicit zeros would have turned all four straight edges into degenerate curves and hung
  phantom handles off every anchor in the node editor. (The first draft did exactly that; the
  test caught it.)
- **`kind: 'corner'`, not `'smooth'`.** The arc does meet the edge tangentially, but pairing the
  handles would mean dragging one bends the straight edge beside it.

**Verified**: 11 unit tests, plus in the app — a rounded rect converts to 8 curved anchors while a
sharp one still gives 4 sharp ones, and pixel-sampling the bbox corners shows they stay empty
after conversion (i.e. it still *looks* rounded), with the centre and straight edges still filled.

### 287. No keyboard shortcut for the Eyedropper

Only reachable from the right-click menu, which is slow when matching colours across many
elements. Now **Shift+I** — Illustrator's plain `I` is taken here by image upload, so it joins the
Shift+letter block with the other Illustrator-class tools (Shape Builder Shift+M, Width Shift+W,
Blob Brush Shift+B). Pressing it again cancels. Verified end-to-end: arm, click a source object,
and the fill/stroke/width land on the selection; toggled off, clicking does nothing.

## 2026-08-09 — groups can be named

### 284. Groups showed "Group (n)" and could not be renamed

Layers renamed, objects renamed, groups didn't — the object tree's group rows rendered a derived
`Group (4)` and simply weren't wired for editing.

**Why it wasn't just a missing flag.** A group is not an entity: it exists only as an id shared by
its members' `groupIds`, so there is no record to hang a name on. The name now lives on the
MEMBERS — `DrawingElement.groupNames`, a `{ [groupId]: name }` map, written to every member of the
group. The alternative, a document-level `groupNames` map in the store, would have needed adding to
`captureSnapshot`, `restoreSnapshot`, `buildSlideDocument`, `normalizeDocument` and the exporters —
five places to forget, and forgetting one gives you a name that survives undo but not save.
On the elements it rides along with everything that already serializes them. `migrateElements`
whitelists element fields, so that one did need the new key adding.

### 285. Ungroup → regroup resurrected a name you had just discarded

Found while checking a sentence written for the help doc ("ungrouping discards the name").

Ungroup removes the id from `groupIds` but left the `groupNames` entry behind. That would be
harmless — `groupNameOf` ignores entries for groups the element is no longer in — except that
**group ids are handed out by a counter that reuses ids**: ungrouping and regrouping the same
objects produced `grup-1` again, the stale entry matched, and the discarded name came back on a
group the user had just recreated from scratch. Worse in principle for a *different* set of
objects that happens to receive the recycled id.

`ungroupSelected` now prunes the dissolved groups' entries. Verified: regroup starts unnamed even
though the id is reused, undo restores the name along with the group, and ungrouping an outer
group leaves an inner group's name untouched.

## 2026-08-09 — undo after a Bend drag did nothing

### 283. The warp Bend slider pushed its history snapshot too late

Found while checking a claim written into the help doc — "one undo step per drag" turned out to be
false, so the doc check found the bug.

**Symptom:** drag the WARP PRESET **Bend** slider, press Ctrl+Z, nothing happens. A second undo
jumps past the warp entirely, so the bend you started the drag from is unreachable.

**Cause.** `pushToHistory()` snapshots the state *as it is now*. The slider drove
`applyWarpPreset(…, history: false)` on `input` (live re-warp, no snapshot) and
`history: true` on `change` — so the one snapshot it took was pushed at the *end* of the drag,
capturing the value just dragged to. Undo restored that same value: a no-op.

**Fix.** Snapshot once at the *start* of the interaction (`WarpPresetEditor` in
`property-panel.tsx`) and run every re-warp in the drag history-free. Keyed off the first `input`
rather than `pointerdown`, because arrow keys on a focused slider fire `input`/`change` with no
pointer event and must stay undoable. That's the pattern the same file already uses elsewhere
(`onStart`/`onMouseDown` → `pushToHistory`).

**Verified** live: drag → undo lands on the pre-drag bend, redo returns to the dragged value, a
second drag is likewise one step, and a keyboard-only change both applies and undoes.

**Same shape elsewhere, not fixed here:** `setExtrude` and `setTransformEffect` also
`pushToHistory()` inside the `history: true` commit call, so the Extrude and Transform-effect
sliders in the same panel will undo to the value you just dragged to. Same one-line-per-editor
remedy; left alone as out of scope for this change.

## 2026-08-09 — Shift didn't reach the pen's segments

### 282. Holding Shift with the Pen constrained the handles but not the line

**Symptom** (same user report as #281): "Holding Shift while drawing with pen tool should help
make perfectly straight lines and fixed angles." It didn't — a horizontal pen segment was a matter
of aim.

**Cause.** `e.shiftKey` was already being passed into `penOnMove` (`canvas.tsx`), but only the
handle-drag branch read it — that's the 45° Clock Method for Bézier handles. The rubber-band
branch ignored it, and `penOnDown`, which is what actually commits the anchor, never received the
flag at all. So Shift shaped curves and did nothing to straight lines.

**Fix.** `placeAnchor` in `pen-path-handler.ts` snaps the candidate point to the nearest **15°**
from the previous anchor — the same increment `drawOnMove` uses for Line/Arrow, so a Shift-drawn
pen segment lines up with a Shift-drawn line. Applied on the committing click *and* the preview,
so the rubber-band is honest about where the point will land. `penOnDown` now takes the constrain
flag, wired to the same `shift || second-finger || penConstrain` expression the move already used,
so the tablet toggle gets straight segments too.

Three details:

- **The angle beats grid snap**, matching the line tool — snapping the constrained point to the
  grid is exactly what would bend it back off the angle.
- **Closing still works.** The close test runs on the *unconstrained* point, or holding Shift
  could aim the candidate away from the first anchor and make "click the start to close"
  unreachable.
- Shift now means two things, but never at once: mid-drag it aims the handles (45°), between
  clicks it aims the segment (15°). Disjoint gesture states, so no mode to switch.

**Verified** with 12 unit tests (`pen-angle-constrain.test.ts`, A/B-checked: 7 fail without the
fix) plus real dispatched pointer events in the app — a near-horizontal Shift-click lands at
exactly 0°, a near-vertical one at exactly −90°, an unshifted click lands exactly where clicked,
and Shift+drag still constrains handles to 45° with the in-handle mirroring the out.

## 2026-08-09 — flip left the anchors behind

### 281. Flipping a vector path moved the shape but not its anchor points

**Symptom** (user report, while drawing a racing-track illustration): flip a pen path
horizontally or vertically and "the anchor points don't flip properly with the shape". The
outline mirrors; the anchor squares and Bézier handles stay where they were.

**Cause.** There are two ways to mirror an element and `flipSelected` picked the wrong one for
paths. Elements with a `points` array had their points mirrored, but everything else — including
every `path` element — fell through to `flipX = !flipX`, a render-time canvas transform
(`render-pipeline.ts`, `scale(-1, 1)`). The anchor overlay (`selection-renderer.renderPathAnchors`)
and the anchor hit-test (`handle-detection`) both read `pathAnchors` raw and compensate for
**rotation only** — neither knows the flip flags exist. So the renderer mirrored and the two
overlays did not, and the handles you saw (and could grab) were no longer on the curve. Node
editing, pathfinder, offset path and SVG export read the anchors raw too, so they were all
working from the un-mirrored geometry.

Two more defects of the same shape were sitting next to it:

- **Mirror Copy** (`reflectClone` in `app-store`) had a verbatim copy of the same logic, so its
  clones had the same detached anchors.
- **Bezier/organic connectors**: `controlPoints` are stored in WORLD coordinates (a move
  translates them by dx/dy), and flip left them untouched — so a curved connector's control
  points stayed on the old side of the axis and the curve tore.

**Fix.** New `utils/geometry-mirror.ts` owns the whole decision. Elements carrying explicit
geometry (`pathAnchors`, `pathSubpaths`, `points`) get the mirror **baked into that geometry**;
only shapes with nothing to bake (rect, ellipse, image, …) still use the flip flag. `controlPoints`
reflect about the world axis. `flipSelected` and `reflectClone` both call it, so they cannot drift
apart again.

Two details worth keeping:

- **It heals old drawings.** A path already mirrored by the flag is folded back into its data on
  the next flip (mirror the stored anchors only when the flag was *not* already set, then clear
  it) — the visual result is identical either way, and afterwards no flag is left to disagree
  with the anchors.
- Mirroring in place is just a reflection about the element's own centre, so single-element and
  multi-selection flips are one code path rather than two.

Handles negate only on the mirrored axis and in/out are **not** swapped: a reflection leaves the
anchor order alone, so `out` still serves the segment toward the next anchor. A missing handle
stays missing — writing `inX: -0` where there was none turns a corner into a half-curve.

**Verified** with 25 unit tests (`geometry-mirror.test.ts`) plus a live-canvas check: sample the
painted pixels around each anchor's screen position. After the fix every anchor sits **0 px** from
the stroke; recreating the pre-fix state (flag set, anchors un-mirrored) finds no stroke within
12 px of any anchor, so the probe discriminates. A before/after image diff of a flipped bezier
connector matches its own mirror at 100% of stroke cells (±2 cells, i.e. rasterization noise).

## 2026-08-07 — the origin was serving two different builds

### 279. Same URL, different build, depending on which fetch you made

**Symptom:** the precache trim shipped in 0.8.181 kept "un-shipping" itself. Checking
`https://www.yappydraw.com/sw.js` returned 178 precache entries once and 220 the next time.

**Evidence.** Eight consecutive fetches of the same URL:

```
220 220 220 220 220 220 220 178
```

| Response | `last-modified` | Precache | Build |
| --- | --- | --- | --- |
| 7 of 8 | 09:13 | 220 entries, incl. export-game/MathJax | pre-0.8.181 |
| 1 of 8 | 12:10 | 178 entries, trimmed | current |

Both `x-hcdn-cache-status: MISS`, so this is not CDN caching — **the origin holds inconsistent
copies**. The asset directory is mixed too: a v0.8.180 chunk (`index-CMiHwNyo.js`) still returned
200 while a v0.8.181 one (`index-QsW40a8k.js`) returned 404. Files from different deploys,
coexisting unevenly.

**Consequences.** Most visitors were running a service worker from several releases back, so the
9.6MB → 4.6MB saving never reached them. Worse, it is a strong candidate for the *real* cause of
the recurring "Something went wrong" screen (#275): a visitor can get an `index.html` naming
chunks that the node answering the next request does not have. That is random per request, fits
"frequently", and reloading fixes it — matching the report better than browser caching alone did.

**Fix from our side** — the host is not ours to change, so the fix is to make this fail loudly:
`scripts/verify-deploy.sh` (`npm run verify:deploy`) samples `sw.js` and `index.html` N times and
fails if the responses differ, checks every chunk `index.html` references resolves, and asserts
the `.htaccess` cache headers actually arrived. Added to the "ship it" flow in `CLAUDE.md` as a
post-deploy step. **A single fetch cannot detect a split origin** — that is why the earlier
"verified live" claim for 0.8.181 was wrong: it was true of the node that answered.

### 280. The sw.js cache rule silently did nothing

Found immediately by the new verifier: `sw.js` was coming back with the host's own
`public, max-age=604800` while the `.html` and hashed-asset rules from the same `.htaccess` were
working. So the third block was not being applied — most likely a host-level `mod_expires`
`ExpiresByType` for JavaScript overwriting what `mod_headers` set, since mod_expires runs later.

Rewritten as an exact `<Files "sw.js">` with `Header always set` (applied later than plain `set`)
plus `ExpiresActive Off` for that file. A cached service worker delays every update by however
long the cache says — browsers cap SW script caching at 24h, still a day of serving a build we
have replaced.


## 2026-08-07 — the object tree

### 278. The layer panel never showed what was on a layer

**Symptom:** reported as "no layer panel" — there is one, and it does rename / lock / hide /
drag-reorder / nesting, but only for *layers*. In a complex document the thing you need to manage
is objects, and the only way to reach one was to find it on the canvas and click it.

**Fix:** an object tree (`components/object-tree.tsx`) under each layer row, opened from a box
icon. Lists every object top-of-stack first, nests groups, and per row: select (including a single
object inside a group), hide, lock, rename, and drag to restack.

Two new optional fields on `DrawingElement`:

- **`visible?: boolean`** — absent means visible, so every document saved before this release
  behaves identically. Read as `visible !== false` at every site, never `=== true`.
- **`name?: string`** — a display label, distinct from the element `id` that `renameElement`
  changes. Absent → the tree derives one from the object's text, else its type
  (`utils/object-label.ts`).

Both are registered in `normalizeElement`, which is a **whitelist**: a field not listed there is
silently dropped from anything passing through it (templates, imports). No document version bump
was needed — `loadDocument` passes v4 elements through untouched, and save is a structured clone.

`visible` is honoured in every place that walks elements: canvas render, hit-testing
(`canInteractWithElement`, which also covers marquee and lasso), the minimap, and all export paths
via a single `isExportable` in `utils/export.ts` (PNG, JPG, SVG, PDF, PPTX, artboard, page, region
and rasterize). Hiding an object also drops it from the selection — leaving it selected would
float transform handles around nothing and let the next drag move something invisible.

Also fixed while building it: `moveElementsNextTo` computes the new order, *then* pushes history,
then commits. Pushing history after the mutation (the first draft) snapshots the new state and
makes undo a no-op.

## 2026-08-07 — "all my saved drawings are gone"

### 277. A failed IndexedDB open made every saved drawing look deleted

**Symptom:** a user reported that all previously saved local drawings had disappeared.

**Investigation first — it was not the recent releases.** `git log` confirms neither v0.8.180 nor
v0.8.181 touched `frontend/src/storage/`, and `idb-kv.ts` has exactly one commit in its history:
DB `yappy`, version **1**, store `kv`, no upgrade path and no `deleteObjectStore`. There is no
migration that could have dropped data.

**What the code does allow.** The drawings gallery, autosave *and* version history all sit behind
the same `idb-kv` handle, and `openDb()` resolved `null` on any failure:

- every read fell through to an empty in-memory `Map`, so `listDrawings()` returned `[]` and the
  gallery rendered its "No saved drawings yet" empty state — **indistinguishable from deletion**,
  with both recovery copies invisible at the same moment;
- the failed open was **cached in `dbPromise` for the whole page session**, so a *transient*
  failure was permanent until reload. `onblocked` — another tab holding the database open — was
  enough to trigger it;
- `idbSet` returned `true` for writes that only reached memory, so the UI said "Saved" for data
  that dies with the tab;
- worst: `saveCurrentToGallery` called `clearAutoSave()` unconditionally afterwards, on the
  premise that the document was "now safely on disk". A save into dead storage therefore
  **deleted the crash-recovery copy** while reporting success.

**Fix:**
1. `openDb()` no longer caches a failure — the next call retries. `onclose`/`onversionchange`
   also drop the cached handle, so an evicted or externally-closed database doesn't leave a dead
   one behind.
2. `idbFailure()` exposes *why* storage is unavailable, and `galleryReadable()` lets the gallery
   distinguish "you have no drawings" from "I cannot read your drawings" — the latter now shows a
   warning saying nothing has been deleted and to close other tabs and reload.
3. `idbSet` returns `false` when a write only reached memory; `saveDrawingDoc` throws
   `StorageUnavailableError`, which is thrown **before** `clearAutoSave()`, so a failed save can
   no longer destroy the recovery slot. Call sites (gallery dialog, menu quick-save, the new-
   drawing path) surface it instead of claiming success.

`tests/storage-failure.spec.ts` stubs `indexedDB.open` to fail from boot and covers all three:
the honest failure, the retry after a transient failure, and the gallery's wording.

**Still true, and worth telling users:** the gallery is convenience storage, not a backup. Browsers
can evict non-persistent origin storage wholesale (Safari/iOS ITP wipes script-writable storage
after 7 days of no interaction). The app already requests `navigator.storage.persist()` on first
save, but Chrome grants it based on engagement and can refuse. Export to `.yappy` or use cloud
sync for anything that matters.

## 2026-08-07 — the error screen nobody could reproduce

### 275. "Something went wrong" on a healthy build — the host never sent Cache-Control

**Symptom:** users hitting the route ErrorBoundary ("Something went wrong… reloading fixes it")
often, on a deployed build that works. Reloading did fix it. The console showed
`ERR_BLOCKED_BY_CLIENT` on the GoatCounter beacon right next to it, which is what it got blamed
on.

**Not the cause:** the analytics block. GoatCounter is a separate `async <script>`; a blocked
beacon inside it cannot reach a Solid ErrorBoundary. Verified by booting the production build with
`gc.zgo.at` and `goatcounter.com` aborted — clean boot, no error screen (now a spec, in
`boot-resilience`).

**Actual cause — response headers, checked with `curl -I` against the live site:**

| Path | Cache-Control served |
| --- | --- |
| `/` (index.html) | **none at all** |
| `/assets/*.js` | `public, max-age=604800` |
| `/sw.js` | `public, max-age=604800` |

With no freshness directive on index.html, browsers fall back to *heuristic* caching — commonly
10% of the time since `Last-Modified` — and reuse it **without revalidating**. Every deploy
replaces the content-hashed chunks and deletes the old ones. So a returning visitor loads a stale
index.html naming `/assets/index-OLDHASH.js`, gets a 404 (served as an HTML error page, so the
module parse fails too), and lands on the boundary. The more often we ship, the more often it
happens — and we ship several times a day. Reload fixed it because a reload revalidates the
top-level document.

**Fix, two layers:**
1. `frontend/public/.htaccess` — hashed assets `immutable` for a year; `*.html`, `sw.js`,
   `workbox-*.js` and the manifest `no-cache, must-revalidate`. This is the actual fix; it has to
   reach the web root for the deploy to pick it up.
2. `utils/stale-build.ts` — recognise the "chunk is gone" wordings (including the
   HTML-parsed-as-JS `Unexpected token '<'` shape) and reload **once**, guarded by sessionStorage
   against a loop, so a stale visit self-heals instead of showing an error screen. Also hooked to
   `unhandledrejection`, which covers lazy imports fired from a button (Help, export) that reject
   outside any boundary.

**Also fixed while in there:** the error screen printed only `err.message` and always blamed a
stale cache. It now logs the error with its stack to the console and shows the stack, so the next
report is actionable — the copy no longer asserts a cause it can't know.

### 276. Every deploy made returning visitors re-download the whole 9.6MB app

**Symptom:** "Yappy is slow to load — better than before, but still slow."

**Cause:** `globPatterns: ['**/*.{js,css,html,svg,png,ttf,wasm}']` precached **220 entries,
9.6MB** — including 5.1MB of chunks behind a lazy `import()` that most visitors never trigger:
the HTML-player exporter (1.9MB), MathJax's SVG renderer (1.2MB) and TeX packages, jsPDF, pptxgen,
html2canvas, every help doc, the docs search index. Worse, filenames are content-hashed, so *every
release invalidates every entry* and the whole precache is fetched again in the background.

**Fix:** extended the existing `manifestTransforms` filter (the one already excluding
`fonts/outline/`) to drop those chunks, plus a `CacheFirst` runtime-caching rule for `/assets/*`
so they are still cached after first use — safe because hashed URLs can never change meaning.
**220 entries / 9.6MB → 178 / 4.6MB.** Verified with the production build: LaTeX rendering
(11 specs) and SVG/player export still work, since the chunks are simply fetched on demand.
Trade-off, knowingly accepted and identical to the outline-fonts one: the *first* use of
export/help/maths while offline now needs the network.

## 2026-08-07 — align exploded groups, Bring Forward went nowhere, no way inside a group

### 270. Align and distribute moved every group member independently

**Symptom:** select two groups, hit Align Left → both groups collapse. Every member lands on the
same x, and the artwork is destroyed. Same for distribute and distribute-spacing.

**Cause:** `utils/alignment.ts` only ever saw a flat list of ids. `calculateAlignment` filtered
`elements` by the selection and moved each one to the frame edge, with no notion that a set of
those elements is one object. Nothing in the align path read `groupIds` at all — and because
clicking a group selects *all* its members (`selection-handler.ts:767`), a grouped selection is
exactly the case that hit the bug.

**Fix:** a `clusterSelection` helper buckets the selection by outermost `groupIds` — one cluster
per group, plus a cluster of one for each loose object. Align/distribute now position the
*cluster's* box and apply the resulting delta to its members, so internal arrangement is
untouched. All three entry points (`calculateAlignment`, `calculateDistribution`,
`calculateSpacingDistribution`) share it. Side-effect worth knowing: a lone group is a single
unit, so selecting one group and aligning is now a no-op instead of a scramble.

### 271. Bring Forward: N undos, leapfrogging, and cross-layer no-ops

**Symptom:** three related complaints about stepping objects through the stack — undoing a
multi-object "bring forward" took one Ctrl+Z per object; two adjacent selected objects would swap
past each other and end up where they started; and stepping an object forward sometimes did
nothing at all.

**Cause:** there was no selection-level operation. Call sites looped —
`store.selection.forEach(id => moveElementZIndex(id, 'forward'))` — and `moveElementZIndex`
spliced one element by index and called `pushToHistory()` each time. Hence one undo entry per
element. Because each element moved independently, a selected element could step onto the slot
of another selected element (leapfrog). And the splice was over the flat `store.elements` array,
while paint order is *layer order first, then array index* — so stepping past an element on a
different layer changed the array and nothing on screen.

**Fix:** `moveSelectionZIndex(ids, direction)` in `app-store.ts` restacks the whole selection as
a block: one `pushToHistory()`, selected elements keep their relative order, steps happen only
within each affected layer, and a group is treated as one unit (so one press clears a whole
group instead of nudging past one member per press). `moveElementZIndex` now delegates to it, so
the single-element path behaves identically.

### 272. Ctrl+] / Ctrl+[ were bound to front/back, not forward/backward

**Symptom:** no shortcut existed for stepping one layer at a time — the two bracket shortcuts
jumped straight to the front or the back.

**Cause/Fix:** Yappy's binding was the non-standard one. Illustrator and Figma both use
`Ctrl+]` for *Bring Forward*, with a modified variant for *Bring to Front*. Standardized:
`Ctrl+]` / `Ctrl+[` step one, `Ctrl+Shift+]` / `Ctrl+Shift+[` go to front/back. The handler
matches `code === 'BracketRight'` as well as the key, because Shift+`]` emits `}` on a US layout.
`Alt+[` / `Alt+]` (reorder *layers*) are unchanged.

### 273. You could not select a single object inside a group

**Symptom:** the root cause behind "aligning objects inside a group shifts everything together".
Clicking any member of a group selected the entire group, and there was no way to get at one
child — so moving, restyling or aligning one object inside a group was impossible.

**Cause:** `selection-handler.ts` unconditionally expanded a hit to the outermost group
(`groupIds[groupIds.length - 1]`). Symbol instances and compound shapes had edit-in-place
sessions; plain groups had nothing equivalent.

**Fix:** group isolation. `store.isolatedGroupIds` holds a path (outermost → innermost);
double-clicking a grouped object steps in one level and selects the object under the cursor, Esc
(or the new banner's *Up one*) steps back out, and clicking outside the group leaves entirely.
While inside, the selection unit is one level deeper (`unitGroupId` in `group-utils.ts`), so
clicks, marquee, `Ctrl+A`, align/distribute and z-order stepping all operate on the group's
members. Marquee and select-all are confined to the isolated group.

Separately, align/distribute now treat a group as one unit only when the group is *entirely*
selected — a marquee that picks up part of a group aligns those members individually, since the
user clearly targeted the objects rather than the group.

### 274. Align-to-key was invisible, so nobody found it

**Symptom:** reported as a missing feature ("align relative to a chosen reference object, like
Illustrator"). The mode already existed — `store.alignToKeyObject`, honoured by
`alignSelectedElements` — but it was undiscoverable.

**Cause:** the toggle lived only in the Properties panel (not the Align dock panel), the key
object was silently "last in the selection array" with no way to see or choose which one, and
nothing on canvas marked it.

**Fix:** the key object now draws with a thicker outline plus a corner pip
(`renderKeyObjectHighlight`); with the mode on, clicking an already-selected object promotes it
to the key (Illustrator's gesture — implemented as moving it to the end of the selection, and
*only* in key mode so other order-sensitive features aren't disturbed); and the toggle is
mirrored into the dock's Align panel.

## 2026-08-07 — the specs that were testing nothing

### 269. A family of e2e specs aimed at the wrong place, and some passed anyway

**Symptom:** ~16 specs across `node-tool`, `snapping`, `point-snapping`,
`path-intersection-snap`, `select-and-constrain`, `spacing-guides`, `text-autosize`,
`artboard-overlay`, `panel-drag` and `uml-tools` had been red for a while, and the ones that
were *green* were worse — they asserted the right thing about a gesture that never happened.

**Cause — four separate ones, all "the spec describes a UI that moved".**

1. **World coordinates passed to `page.mouse`.** `page.mouse` is in VIEWPORT px; the app's
   world→screen maths is CANVAS-LOCAL. The canvas is inset by the docked chrome (46px tool
   column, 52px top bar), so "press the middle of the rectangle at (490, 390)" landed 46px left
   and 52px up — on a resize handle, on the tool column, or on nothing. Where the target was a
   selected element, the press often grabbed its corner handle instead; where the app opened on
   a pen (before 0.8.178) the press just drew a stroke, the element never moved, and
   `expect(x).toBe(250)` passed for entirely the wrong reason.
2. **Overlays that were fixed, breaking the specs that clicked them.** `getPathNodes()` reports
   world coordinates and the node overlay moved onto `worldToWindow` in 0.8.163 — so the anchors
   started being drawn where they belong and the specs, still clicking raw world coordinates,
   started missing them.
3. **UI that was restructured.** `uml-tool-group.tsx` is no longer rendered anywhere (folded
   into the Architecture group), so `button[title="UML: Class"]` could never match; the toolbar
   also opens in Brainstorm mode, which has no tool groups at all. The Swatches panel moved onto
   the dock, so `.swatches-panel` / `.swatches-panel-header` stopped existing — the same
   migration that had already left `builtin-panel-drag.spec.ts` red.
4. **A target parked under other chrome.** `artboard-overlay` moved its artboard down 40px, which
   put the SE resize handle at viewport y≈832 — beneath the status bar. `boundingBox()` still
   reported it (it is covered, not hidden), so the press went to the status bar.

**Fix.** New `tests/_canvas-coords.ts` — `canvasOrigin`, `toViewport`, `addOrigin`, and a
`worldMouse(page)` that binds `page.mouse` to world coordinates — used by every spec that drives
the canvas. `canvasOrigin` *waits for the rect to stop moving* rather than reading it once: the
canvas is positioned by `handleResize` after mount, so an early read returns (0, 0) and
reintroduces the exact bug the module exists to prevent (this bit during the fix — one spec kept
failing with a suspiciously round pointer coordinate). The restructured-UI specs were retargeted
at the real DOM, `uml-tools` now leaves Brainstorm mode and waits on the tool being armed rather
than on a sleep, and `artboard-overlay` pans so its handle stays clear of the status bar.

Result: 13 spec files, 47 tests, all green — including 3 that were passing vacuously before.


## 2026-08-06 (b) — bulk font editing, a safer opening tool, an opt-in dimension badge, and a tidier top bar

### 268. The top bar collapsed to its phone layout on an iPad

**Symptom:** on an iPad in portrait the top bar showed only the hamburger — no view controls, no
palette picker, no theme toggle — while the left tool column was the full desktop column. Half
the shell in one layout, half in the other.

**Cause.** `isMobile` in menu.tsx was `window.innerWidth <= 768`, and an iPad portrait is
**exactly** 768. Harmless-looking until #267 and the Pan move emptied those controls out of the
tool column: on the one device where the toolbar is driven by touch, they were then reachable
only through the menu.

**Fix.** The gate is `< TOPBAR_FULL_MIN_WIDTH` (700). Not `PHONE_MAX_WIDTH` (600): the bar is a
`nowrap` flex row with `overflow: visible`, so what doesn't fit is *clipped*, not scrollable —
measured, the full row needs 628px, and at 601 the theme toggle hung 14px off the right edge.
700 leaves headroom and puts every iPad (mini 744 → Pro 1024) on the full bar.

Swept 390 / 430 / 600 / 601 / 699 / 700 / 744 / 768 / 834 / 1024 / 1366: zero clipping and zero
page overflow at every width, full bar from 700 up. Below that the same entries are in the
hamburger menu's Panels group, beside Rulers & Guides.

### 267. Command palette, Vector Tools and Shape Builder sat in the drawing-tool column

**Symptom:** three buttons that don't draw anything — one opens a searchable action list, one a
floating palette, one enters a mode — lived in the left tool column among the pens and shapes,
lengthening a column whose whole job is "pick something to draw with".

**Fix.** Moved to the top bar's `.topbar-view-controls` cluster, ahead of Settings / Properties /
Show Dimensions / Help, where the other non-drawing controls already are. **Pan** went with them
for the same reason — it moves the view, not the drawing — leaving Selection as the only
navigation entry in the column. The toggles keep their
active state. That cluster is desktop-only, so all four also appear in the hamburger menu's View
section — otherwise they'd be unreachable on a phone.


### 266. The dimension badge was always on, and sat in the wrong place

**Symptom:** every selection carried a `W × H` / `X, Y` badge, with no way to turn it off — and
it didn't sit under the selection, it overlapped the object itself.

**Cause.** Two things. It had no setting at all, and `TransformHud` positioned itself with
`worldToScreen` (canvas-local px) while `.transform-hud-layer` is `position: fixed; inset: 0`
(window px) — the same frame mismatch as #262, so it drew 46px left and 52px above its anchor.

**Fix.** `globalSettings.showDimensions`, **default off**, persisted in localStorage and
toggled from a Proportions button in the top bar beside Settings/Properties (plus a
*Show Dimensions* item in the mobile View menu, and `Yappy.setShowDimensions` /
`toggleShowDimensions` / `getShowDimensions`). The HUD now goes through
`overlay-transform`'s `worldToWindow`, so when it is on it lands where it belongs.
The preference is read from **localStorage only**, never from the loaded document: it is an
app-level choice like `defaultTool`, and the first version of the fix used `lsBool`, whose
fallback is the document's own value — so a drawing autosaved while the badge was on turned it
back on for good, defeating the default.

## 2026-08-06 (b) — bulk font editing, and a safer opening tool

### 265. The app opened on a pen, so the first click drew on your drawing

**Symptom:** reload Yappy (or start a new sketch) and the active tool was the **Ink Brush**, so
the first click on the canvas laid down a stroke instead of selecting the thing you clicked. You
then had to notice the stray mark and undo it. Starting a new document was worse: it inherited
whatever tool the *previous* drawing ended in.

**Fix.** Two changes:

- `readDefaultTool`'s fallback is now `selection` (`DEFAULT_TOOL_FALLBACK`). Selection does
  nothing until you aim it, which is the right opening state. This is only the fallback —
  anyone who has set Settings → Pen & Input → **Default Tool** still gets their choice, because
  that preference is what `readDefaultTool` reads from localStorage first.
- `resetToNewDocument` now sets `selectedTool` back to the default tool (and clears
  `toolLocked`), so a new sketch opens the same way a fresh load does rather than carrying the
  previous document's tool across.

`api.ts`'s `getDefaultTool()` and the Settings dropdown read the same constant, and Select is now
listed first in that dropdown.

### 263. Ctrl+A hid the Font control instead of applying it to everything

**Symptom:** "select all, then change the font" didn't work on a real drawing. With a mixed
selection the Properties panel dropped Font, Size, Bold, Align — every text control — so there
was no way to express the edit at all. Adding a single freehand stroke to a 3-shape selection
was enough to make them vanish.

**Cause.** `activeProperties` required **every** selected element's type to list the property in
`applicableTo`. A freehand stroke doesn't take `fontFamily`, so the whole row disappeared for the
three labels that did.

**Fix.** A property now shows when **any** selected element supports it — the rule the
`dependsOn` check next to it already used. The subset it applies to is computed once by a new
`supportedSelection(key)` helper, and every multi-select write in `handleChange` (the generic
patch plus the mesh/pattern/gradient/filter/openBox/text-effect/transform special cases) and the
value read in `getPropertyValue` go through it. Without narrowing the *read* as well, the
unsupported element's `undefined` would make every text row report "Mixed" forever.

### 264. Bold and Italic showed as ticked on Regular, upright text

**Symptom:** the Properties panel's Bold and Italic checkboxes were checked for text that was
plainly neither, so they read as "on" and the first click appeared to do nothing (it turned them
off).

**Cause.** Leftover from the 0.8.175 boolean → 100–900 weight axis change. The toggle rendered
`checked={!!value}`, and after the migration `fontWeight` is `400` and `fontStyle` is
`'normal'` — **both truthy**. `docs/learnings.md` names this exact trap ("400 is truthy"); the
quick toolbar's `IconToggleControl` was updated for it, this checkbox was missed.

**Fix.** The checkbox now reads through `normalizeFontWeight` / `normalizeFontStyle` — on means
SemiBold-and-up (so ExtraBold from the Style dropdown doesn't leave Bold unticked) or
`fontStyle === 'italic'` — and writes back `700`/`400` and `'italic'`/`'normal'` rather than a
bare boolean. Same rule as `quick-controls.tsx`, which had it right.

## 2026-08-06 — the text editor sat where the text wasn't

### 262. Double-clicking a shape moved its label

**Symptom:** double-click a shape to edit its text and the text jumped — left and up by a
constant amount in the default layout — so the editing caret was outside the shape it belonged
to. On a circle it also re-flowed onto fewer lines and sat below centre.

**Cause — two independent ones.**

1. **Wrong coordinate frame.** `TextEditingOverlay` (and `RichTextEditingOverlay`) positioned
   themselves with `worldToScreen`, which speaks **canvas-local** px — `clientX/Y` minus the
   canvas's bounding rect. But both overlays render as *siblings* of `.canvas-drop-zone`, and
   every ancestor up to `<body>` is `position: static`, so their `top/left` resolved against the
   document. The canvas is not at the document origin: `handleResize` insets it by the docked
   chrome (`marginLeft/Top` = `--dock-left`/`--dock-top`), so the editor opened **46px left and
   52px above** the text it was editing. Exactly the bug the rulers, symmetry axes, artboard
   frames and the node tool each had, and the same class of mistake: an overlay assuming the two
   frames coincide, which they do only while the canvas fills the window.
2. **Wrong wrap width.** The renderer wraps container text in the shape's *inscribed* width — a
   circle or diamond gets 0.707 of its box, a banner 0.65 — while the overlay's textarea wrapped
   at the full width. So "Circle Label" was two lines on canvas and one in the editor, and since
   the vertical padding was computed from the canvas's two-line height, the single line sat half
   a line low.

**Fix.**

- Both overlays now go through `utils/overlay-transform`'s `worldToWindow` and are
  `position: fixed`, i.e. window coordinates — the same helper the other overlays were moved to.
  It reads the origin from the canvas *element*, so it tracks resizes and dock changes, and it
  supplies the rotation centre the old `store.viewState` cast left at 0 (a rotated view was
  wrong too).
- The inscribed-width table now lives once in `text-utils` as `inscribedTextFactor` /
  `containerTextAvailableWidth` / `containerTextWrapWidth`; `measureContainerText`,
  `fitShapeToText`, `RenderPipeline.renderContainerText` and the overlay all read it, so the
  editor wraps where the canvas wraps.
- While matching the renderer's box, the overlay also picked up three things it had been
  ignoring for container shapes: **`verticalAlign`** (a top- or bottom-aligned label jumped to
  the middle on double-click), the hand-drawn **baseline nudge**, and the user's draggable
  label offset **`textOffsetX/Y`**.

## 2026-08-05 (f) — closing the two gaps left open by 0.8.175

### 260. Italic text outlined upright

**Symptom:** `Create Outlines` ignored `fontStyle` entirely — italic text converted to upright
vector paths, so an italic wordmark silently lost its slant. Flagged as a known gap when the
rest of the outline work shipped in 0.8.175, on the grounds that no italic binaries were
bundled.

**Cause.** `FONT_FILES` mapped each family to a `{ regular, bold }` pair with nowhere for a
slant to live, and `textElementToOutline` never read `el.fontStyle`.

**Fix.** Bundled real italic faces and taught the resolver about slant:

- `FONT_FILES` is now `{ upright: {400,700}, italic?: {400,700} }` per family.
- Italic faces added for Inter, Poppins, Merriweather, Source Code Pro and JetBrains Mono.
  Sourcing note: four of the five have moved to variable fonts upstream, and Merriweather's
  variable italic is **4.6 MB**; fontsource's static per-weight **WOFF** instances are 48–77 KB
  with full glyph coverage, and opentype.js 1.x reads WOFF (just not WOFF2). Merriweather's
  bold-italic WOFF fails to parse ("Data error") and is deliberately not bundled.
- `resolveFace` matches **slant first, then weight**, which is CSS's own font-matching order
  and the one that keeps letterforms right: a true italic is a different design, not a sloped
  roman, so a Bold Italic in a family with italic only at 400 uses the 400 italic rather than a
  sheared Bold.
- Families with **no** italic face (Virgil, Marker, Caveat) — and user fonts where the chosen
  file is upright — are sheared by 0.2, matching Chrome's synthetic oblique, which is exactly
  what the canvas is already displaying. Shearing is applied per *line*, about that line's own
  baseline; a single reference line would slide successive lines sideways instead of slanting
  them.

**Also:** the glyph binaries are now excluded from the PWA precache (`globIgnores`). They are
fetched lazily, only when something is actually outlined, so precaching them made every visitor
download megabytes up front for a feature most never touch. They are not the fonts the app
renders with, so nothing about display changes.

**Verified** in the real app by shape, not by eye: Caveat's italic outline is an *exact* shear
of its upright (y unchanged, `dx + 0.2y` constant to 0 residual across 148 anchors), while
Poppins' italic is **not** a shear of its upright — it comes from the italic binary.

### 261. Knife pieces came back as corner points, not curves

**Symptom:** cutting a circle produced pieces whose arc was ~20 corner anchors. Geometrically
accurate, but not editable as the curve it obviously is, and dozens of points where the
original had four. Flagged as a known gap in 0.8.175.

**Cause.** Polygon clipping only works on straight-edged rings, so `buildPathFromPoly` had two
modes and neither fit: plain corner anchors (the literal polygon), or `polyToSmoothSubpaths`,
which Catmull-Roms *every* vertex — right for the Blob Brush, wrong here, because it rounds off
the shape's real corners and bows the straight edge the knife just cut.

**Fix.** New `utils/curve-refit.ts`: detect corners by turn angle, keep those sharp, and fit
curves only to the runs between them. Two things had to be got right:

- **Thinning by curvature, not by distance.** Douglas–Peucker measures how far dropped points
  sit from the straight chord between survivors, but a *curve* replaces them — on a 48-point
  circle of r=100 the sagitta across two segments is 0.86, so DP kept all 48 and simplified
  nothing. Spending one anchor per 45° of turn also makes the anchor count depend on the shape
  rather than the sampling density (48-point and 240-point circles both give 8).
- **Even spacing and the exact arc factor.** Greedy emit-on-budget left a 7.5° stub against the
  seam (handle ~6× too short, 5.9 units of error on the neighbouring segments); dividing the
  total turn into equal parts removes it. And chord/3 handles are 4% short at 45°, a
  *systematic* inward bias that put the refit 0.29 units inside a 100-unit circle; the exact
  circular-arc factor (4/3)·tan(θ/4), applied per segment, takes it to 0.000.

Opt-in via `buildPathFromPoly(..., refit)` and currently used only by the Knife; Pathfinder
booleans still return literal polygons.

**Verified** in the real app: knifing a circle in half now yields 5 anchors per piece — 2
corners at the ends of the cut, 3 smooth on the arc — with the arc anchors 0.008 units off the
true circle and the cut segment carrying zero handles (a genuine straight line).

## 2026-08-05 (e) — designer review: Font Family / Font Style split, and a real weight axis

### 259. Every font file was a separate "family" in the picker

**Symptom (user report):** "The font list currently displays all font families and their
variants (Regular, Bold, Light, ExtraBold, etc.) together in a single dropdown. Separating Font
Family and Font Style into two dropdowns, similar to Adobe Illustrator, would make font selection
much easier."

**Cause.** Two halves of one problem.

The picker's option list was flat: built-ins plus one entry per user-added file, straight from
`customFontOptions()`. Font files are named `Family-Weight`, so installing a family put
`Montserrat-Light`, `Montserrat-Regular`, `Montserrat-Bold` and `Montserrat-SemiBoldItalic` in the
list as four unrelated typefaces.

And `fontWeight?: boolean` could express Regular and Bold and nothing else — so even with the
files present there was nowhere for Light, Medium, SemiBold or Black to live. The flat list was a
symptom of the type.

**Fix.**

- `fontWeight` is now a number on the CSS 100–900 axis; `fontStyle` is `'normal' | 'italic'`.
  Both legacy encodings (`true`, `'bold'`) are still read correctly — `normalizeFontWeight`
  handles every form, so **saved documents need no migration and render identically**.
- `utils/font-variants.ts` parses a file name into family + weight + slant (`Montserrat-
  SemiBoldItalic` → Montserrat / 600 / italic), groups the option list into families, and picks
  the best variant when switching family so the style carries over.
- The property panel shows **Font** (families, one row each) and **Style** (that family's
  weights and italics). The Style row only appears when the family has more than one style.
  Bold/Italic buttons still work and are a two-state view of the axis — Bold lights for ≥600.
- Built-ins keep their curated label as the family and offer only the styles they can actually
  synthesise, honouring the existing `fontCapabilities` table (Hand-drawn offers Regular only).

**Three bugs fixed on the way, none of them reported:**

- `connector-renderer` and `bpmn-renderer` built their font as
  `${el.fontWeight || 'normal'} ${size}px ${family}`, which with the old boolean produced
  `"true 16px Inter"` — **not a valid CSS font string**, so the canvas ignored the whole
  assignment. Bold connector labels and bold BPMN text had never actually been bold. The
  in-place text-editing overlay had the same bug, so the editing textarea didn't match the
  canvas behind it.
- `text-renderer` tested `el.fontWeight === true || === 'bold'`, so every weight on the axis
  except exactly 700 would have rendered Regular.
- SVG export collapsed weight to `'bold' | 'normal'`, so a Light or SemiBold wordmark exported
  as Regular. It now emits the numeric weight, which SVG takes natively.

All font strings now come from one `fontShorthand`.

**Verified** in the real app with four Montserrat files installed the way the app loads them:
the picker lists "Montserrat" **once** with styles Light / Regular / Bold / Bold Italic; selecting
Light stores `fontFamily: custom-11, fontWeight: 300`; a Bold *file* with no `fontWeight` set
still reads as "Bold" in the Style row; switching Montserrat Bold → Poppins → Montserrat keeps
Bold throughout and lands back on the real Bold file; a single-style built-in shows no Style row;
and `getFontString` emits `300 40px Poppins` / `700 40px Poppins` / `40px Poppins`, with the
legacy `fontWeight: true` still giving 700.

## 2026-08-05 (d) — designer review: Create Outlines used the wrong font, silently

### 258. Outlining custom or Google fonts produced the right letters in the wrong typeface

**Context (user report):** "It would be useful to have a Convert Text to Shapes feature so text
can be converted into editable vector paths. This would make logo design and custom typography
much more flexible."

The feature already shipped (`Ctrl+Shift+O`, Create Outlines) — but not in a state where a
logo designer would find it, because it only worked for 8 fonts and lied about the rest.

**Cause.** `text-to-outlines.ts` mapped `fontFamily` keys to bundled TTFs and ended with
`FONT_FILES[familyKey] ?? FONT_FILES['sans-serif']`. Any font the user had added — from a file
*or* from Google Fonts — hit the fallback and was outlined **in sans-serif**. The result was a
correct-looking vector path of the right letters in the wrong face, with no error and no log.
Custom typography is exactly the case where you are never on a bundled font, so for its main
audience the feature was silently wrong 100% of the time.

**Fix.**

- **Fonts added from a file** (`.ttf`/`.otf`/`.woff`) now outline properly: the binary is already
  held in the font's `dataUrl`, so it's decoded and parsed directly. This is the case that
  matters for logo work.
- **Fonts added by name from Google Fonts** cannot be outlined and now say so. They are a
  `@font-face` reference — the browser renders them, but there is no readable binary, and the
  served file is WOFF2 (Brotli-compressed; opentype.js 1.x can't parse it and the platform
  offers no Brotli decoder). The message names the fix: download the family and add the .ttf.
- **Unknown keys** (a document authored elsewhere, a font since removed) also error rather than
  substitute.
- WOFF2 uploads are detected by their `wOF2` signature, so they produce a sentence rather than an
  opaque parser exception.
- Failures no longer collapse into "Could not outline text" — the specific reason is surfaced,
  including on partial success where some elements converted and others didn't.

The source text is left untouched when outlining fails, so nothing is lost.

**Verified** in the real app: a TTF added through the same path as the "Add font…" picker
outlines to a path with the correct 7 subpaths for "Logo" (L + three counters), and outlining
"Logotype" through the uploaded font gives a width of **336.46** — identical to the built-in
Poppins Bold and distinct from the old sans-serif fallback's **311.45**, which is what proves the
real typeface is being used. A Google font shows the explanatory toast and leaves the text as text.

## 2026-08-05 (c) — designer review: Knife / Scissors cutting accuracy

### 257. Scissors cut at the nearest anchor, not where you clicked

**Symptom (user report):** "The Knife/Scissors tool could be more precise when cutting shapes.
Improving the cutting accuracy so it follows the intended path more closely would make detailed
vector editing easier."

Four separate defects, all of which read as "the cut doesn't follow the shape".

**a) Scissors snapped to the nearest anchor.** `splitPathAt` compared the click against
`pathAnchors` and split at the closest one, so a tool's resolution was capped at however many
anchors the artist happened to draw. A circle drawn as the usual four-anchor Bézier could only be
cut in four places; clicking its 45° point cut **76 units away** at the nearest quadrant. It also
read only `pathAnchors`, so compound paths (`pathSubpaths` — outlined text, a donut, an 'O') fell
through to re-deriving a single outline, and rotation was ignored entirely so cutting a rotated
path compared world coordinates against un-rotated anchors.

*Fixed* by projecting the click onto the outline (`closestPointOnSubpaths`, coarse scan +
golden-section refinement) and subdividing that segment with de Casteljau (`splitSegmentAt`). The
split is exact — the two halves reproduce the original curve — so the shape doesn't shift when
cut. Rotation is undone first; compound paths cut the ring you clicked and keep the others.

**b) Multi-contour paths were welded into one ring.** `PathUtils.parsePath` emits no command for
`M`, so contour boundaries were simply absent from its output, and `geometryToRings` sampled the
whole command list as a single ring. Knifing outlined text or a donut produced a ring that jumped
between contours — geometric nonsense. *Fixed* by stamping a `subpath` index on each command
(additive; existing consumers ignore it) and flattening per contour.

**c) Curves were flattened to a fixed sample count.** 96 samples across the path's *total* arc
length is a budget, not a tolerance: a detailed path got a few points per curve and came back
faceted. Ellipses had a flat 64-gon, which is 0.12 units off a 100-unit circle and 1.2 off a
1000-unit one. *Fixed* with adaptive subdivision on a flatness test (0.25 units) and an ellipse
segment count derived from the same tolerance.

**d) Holes were lost.** `elementToMultiPolygon` ended in `rings.map(r => [r])` — every ring its
own *solid* polygon — so any shape with a counter lost it through any polygon operation. Knifing
a donut filled the middle in. *Fixed* by nesting rings by containment depth (odd = hole, even =
solid), matching the even-odd rule the renderer already fills with.

**Also fixed while in here:** `splitPathAt` minted piece ids with `generateId('path')` and no
batch set. Since that is "highest existing + 1" over the store and the pieces aren't stored until
the end, both pieces of every two-piece split were getting the **same id**. Pre-existing; surfaced
because the rewrite can emit more than two pieces.

**Verified.** 25 new unit tests (exact-curve-reproduction after a split, refinement below the
coarse scan's resolution, contour separation, hole nesting, islands-inside-holes, tolerance held
across shape sizes), plus the real app: cutting a circle at (370.711, 229.289) now lands at
(370.711, 229.289) to three decimals where it previously snapped 76.5 units away; knifing a donut
yields two crescents with 33 vertices on the hole edge and 33 on the outer, max radius 120.03
against a true 120.

## 2026-08-05 (b) — designer review: locking an object was a one-way door

### 256. A locked object could never be unlocked

**Symptom (user report):** "Once an object is locked, it cannot be selected individually to
unlock it. Allowing users to select locked objects for unlocking, or managing them through a
Layers panel or context menu, would make the workflow more convenient."

**Cause.** Exactly as described, and structural rather than a slip:

- `canInteractWithElement` (`canvas.tsx`) returns `false` for `el.locked`, so hit testing,
  dragging and marquee all skip it — correct, and the point of the feature.
- Therefore a locked element can never be in `store.selection`.
- Every unlock path read the selection: the `Ctrl+Shift+L` handler (`app.tsx`), the
  `action-lock` command, and the right-click *Lock/Unlock* item all do
  `store.selection.some(... locked)` then `lockSelected(!isLocked)`.

So the command that frees an object could never see one. The single undocumented escape was
`Ctrl+A` — `selectAll` does *not* filter locked elements — followed by `Ctrl+Shift+L`, which
unlocks everything and is not something a user discovers.

**Fix.** Three ways back in, none of which route through the selection:

- **Right-click the object → `Unlock "…"`.** The context menu is built from a world point
  (`worldX`/`worldY`) rather than from the selection, so it can offer the locked thing directly
  under the cursor. Overlapping locked objects are listed individually, topmost first, plus an
  "unlock all of these". (`lockedElementsAt` in `object-context-actions.ts`.)
- **`Unlock All`** — `Ctrl+Alt+2` (Illustrator's Object ▸ Unlock All), also in the right-click
  menu with a live count, and in the command palette. For an object that's off-screen or lost.
- **API** — `Y.setLocked(ids, bool)`, `Y.getLocked()`, `Y.unlockAll()`.

Unlocking selects what it freed — you're unlocking it because you want to work on it.

**Verified** by driving the real app: locking a rect and clicking its centre leaves the selection
empty (the dead end, reproduced); `Ctrl+Alt+2` then unlocks and selects it; right-clicking a
locked object with nothing selected shows `Unlock rectangle` + `Unlock All (n)`, and clicking it
unlocks that one element and leaves the other locked; right-clicking where two locked objects
overlap shows the `Unlock (2 here)` submenu.

## 2026-08-05 — designer review: Bézier handles could not be broken apart

### 255. A smooth anchor's two handles could never be moved independently

**Symptom (user report, logo/typography session):** "The Pen Tool currently allows either smooth
or corner anchor points, but it doesn't allow one Bézier handle to be edited independently.
Supporting Alt + Click and Alt + Drag to break and adjust handles separately would provide much
better control over curves."

**Cause.** Handle dragging is implemented in three places, and they had drifted apart:

| Where | Mirroring | Alt to break? |
|---|---|---|
| Pen, mid-draw (`pen-path-handler.penOnMove`) | forced equal length (`inX: -ox`) | **no** |
| Selection tool direct-select (`selection-handler.handlePathNodeDrag`) | forced equal length | **no** — `altKey` was never even passed in |
| Node tool overlay (`node-editing.moveNodeHandle`) | preserved the far handle's own length | yes, but it did not stick |

So the gesture was missing entirely from the two tools a user is most likely to be holding, and
where it *did* exist it was ineffective: `moveNodeHandle` left the anchor `kind: 'smooth'`, so the
next drag without Alt re-mirrored the handle and silently undid the cusp.

Two further bugs fell out of the same drift. The Selection tool's `a.inX = -hx; a.inY = -hy`
forced the opposite handle to the length of the one being dragged, so adjusting one side of an
anchor quietly retensioned the segment on the *other* side — a curve you had already shaped
changed behind your back. And a zero-length drag (pointer exactly on the anchor) divided by a
`|| 1` fallback rather than bailing, snapping the far handle to a unit vector.

**Fix.** Extracted the single rule into a pure `setAnchorHandle` (`utils/anchor-handle.ts`) and
routed all three call sites through it:

- Alt breaks the pair, and **demotes the anchor to `corner`** so the break survives letting go of
  Alt. (Rendering reads the handles, not `kind`, so the demotion changes no geometry by itself.)
- Mirroring keeps the opposite handle's **own length** when editing an existing anchor, and
  matches lengths only when `symmetric` is set — which the Pen passes, because pulling handles
  out of a fresh anchor is one symmetric motion.
- A zero-length drag leaves the opposite handle alone instead of flinging it.
- In the Pen, the break is sticky for the rest of the drag (`pState.penHandleBroken`), so
  releasing Alt part-way through doesn't snap the incoming side back into line.

Alt on an *anchor* (convert smooth ↔ corner) and Alt on a *segment* (insert anchor) already
existed and are untouched — this claims Alt only over the in/out handles themselves, so there is
no collision.

**Verified.** 9 unit tests on `setAnchorHandle` (mirroring, own-length vs symmetric, zero-length,
break, persistence-after-break, corner no-op), plus driving the real Pen tool in a browser: a
plain drag gives `out (40,40) / in (−40,−40) smooth`; continuing with Alt gives `out (60,0) / in
(−40,−40) corner`; continuing after *releasing* Alt gives `out (80,0)` with `in` still frozen.

## 2026-08-03 (c) — user-reported follow-up: alignment and bullets, re-verified

### 254. SVG export dropped every list marker

**Symptom (user report):** a re-test of the 0.8.170 fixes — "the horizontal and vertical
alignment options appear to be swapped" and "the bullet points shown while editing do not match
the final output after exiting the text editor".

**What was actually true.** Both reports were re-run against the shipped build by driving the real
UI in a browser, not by reading code:

- *Alignment* — all six Properties-panel buttons move the correct axis and land on the correct
  edge (Align Left → every `x` equal, Align Bottom → every bottom edge equal, and so on). Nothing
  is swapped. The 0.8.170 fix (#251) changed only the *icons*; a reporter on ≤0.8.169, or holding
  a cached PWA bundle, still sees the old misleading pictures over correct behaviour. The reporter
  confirmed it was right after reloading. No code change.
- *Bullets on canvas* — the editor→canvas round-trip matches line for line for bullet lists,
  numbered lists, and a mixed heading + list + trailing-paragraph block. No code change.
- *Bullets in **SVG export*** — genuinely broken, and the one thing that could make "the final
  output" disagree with the editor.

**Cause:** `exportToSvg` emits a `<tspan>` per laid-out segment but never read
`RichTextSegment.listMarker` — the flag `layoutRichText` sets on the first segment of each list
item (added in #251 so a word-wrapped item doesn't grow a second bullet). Both canvas renderers
(`text-renderer.ts`, `render-pipeline.ts`) draw the marker from that flag; the SVG path was the
only one of the three that didn't. It still kept the 20px gutter the layout reserves for the
marker, so the export didn't look plain — it looked misindented.

**Fix:** a shared `listMarkerTspan` helper in `utils/export.ts`, applied in both rich-text
branches of the exporter (standalone `text`/`richtext` elements and rich container text). It
emits `•` or `<n>.` at `xOffset + listLevel * 20`, styled from the span's own colour, font,
size and weight — the same arithmetic the two canvas renderers use.

**Guarded by:** `tests/rich-text-lists.spec.ts` → "SVG export keeps the bullets and the numbers".
Stashing the `export.ts` change turns it red (zero markers found).

## 2026-08-03 (b) — user-reported: switching shapes inside the Node tool

### 253. Clicking another shape while node-editing did nothing

**Symptom (user report):** "If I select a rect and then the node tool, and if I have to select
another shape, it's a two step process. First, deselect the node tool and then select another
shape. Is this experience good? How does inkscape/illustrator work here?"

**Cause:** `node-tool-overlay`'s `onDown` is a capture-phase `pointerdown` on `window`, and every
one of its branches — handle hit, node hit, Alt-click-insert, else rubber-band — calls
`stopPropagation()`. That capture is deliberate (it stops the canvas stealing anchor drags), but
there was no "was a shape clicked?" case, so the canvas never saw the click and a click on another
shape merely started a rubber band over zero anchors.

**Fix:** ported from Inkscape (`src/ui/tools/node-tool.cpp`, verified in source):

- `NodeTool::select_point` — an item under the cursor is selected (`selection->set`), Shift
  toggles it in so several paths node-edit at once, and empty space deselects in **two stages**:
  the first click clears the node selection, the second clears the object.
- `NodeTool::select_area` — when `_multipath->empty()` the rubber band selects **items**, not
  nodes. With nothing to node-edit, a drag can only sensibly mean "pick a shape".

`elementAt()` mirrors the canvas's narrow-phase (reverse z-order, skipping locked elements and
hidden/locked layers), so the Node tool can't reach what the Selection tool wouldn't. Clicking the
shape already being edited still falls through to the anchor rubber band, so you can band-select
anchors starting from inside the shape.

**Guarded by:** `tests/node-tool-switch-shape.spec.ts` (4 tests). Stubbing the element hit-test
turns the two switching tests red.

## 2026-08-03 — user-reported: the Node tool, onion-skin selection, and a timeline you couldn't reach

### 252. Path anchors were drawn — and hit-tested — at the wrong place

**Symptom (user report):** "When I converted this square to path, are the anchor/handle shown
correctly?" — with a screenshot showing four anchors forming a square of the right size, sitting
up and to the left of the shape they belonged to. Earlier in the same session: "difficult to
manipulate".

**Cause:** `.node-tool-layer` is `position: fixed; inset: 0` — window space — but
`node-tool-overlay.tsx` computed positions with `worldToScreen()` from `utils/viewport-transforms`,
which speaks CANVAS-LOCAL px. The canvas starts at (`--dock-left`, `--dock-top`), so every anchor
was translated by exactly the dock insets: 46px left, 52px up in the default layout. This is the
same bug 0.8.163 fixed for rulers, symmetry axes and artboard frames, and `utils/overlay-transform`
was created for it — the overlay simply never used it.

Not merely cosmetic: `nodeAt()` compares `e.clientX/Y` against `toScreen(...)`, so the *hit targets*
were displaced by the same amount. With a 9px hit radius you had to click 46px right and 52px below
an anchor to grab it, which is what "difficult to manipulate" was.

A third defect rode along: `store.viewState as any` type-checks as a `Viewport` but leaves
`centerX`/`centerY` undefined, so a rotated view rotated about the canvas's top-left corner
instead of its centre.

**Fix:** use `worldToWindow` / `windowToWorld` from `utils/overlay-transform`, which own the origin
and supply the real rotation centre via `overlayViewport()`.

**Guarded by:** a fifth case in `tests/overlay-alignment.spec.ts`, which measures in **two** dock
layouts. Reverting the fix reports "node anchor off by -46px" (left dock) and "-52px" (right dock),
so a hardcoded offset fails one of them.

### 251. The Select tool's transform chrome was painted on top of the anchors

**Cause:** with the Node tool active, `renderElementOverlays` still drew the full Select kit for the
selected element — 8 resize handles, the rotate grip, the quick-delete ⊗, the quick-connect buttons
— all positioned on the bounding box, which for a converted rectangle is exactly where its corner
anchors sit. None of it was clickable, because `node-tool-overlay`'s capture-phase `pointerdown`
`stopPropagation()`s on every branch. So it was inert decoration burying live targets. The canvas
also ran `renderPathAnchors` for the selected path, duplicating the anchors the SVG overlay already
drew, in a slightly different style.

**Fix:** thread `nodeToolActive` through the render params; in node mode draw the selection outline
and return. One early exit suppresses the handles, the buttons and the duplicate anchors. Multi-
selection box and its delete handle gated the same way. Matches Illustrator/Inkscape.

**Guarded by:** `frontend/src/utils/node-tool-chrome.test.ts` (5 tests, recording 2D context).

### 250. A marquee selected onion-skin ghosts, locked elements, and hidden layers

**Symptom (user report):** "when i move after onion skinning the box is shown?" — screenshot showing
a selection bounding box stretched across both the current cel and a red onion ghost, "5 selected".

**Cause:** `selectionOnUp` (`utils/tool-handlers/selection-handler.ts`) ran both the rectangle
marquee and the lasso over `store.elements` with **no filter at all**, while narrow-phase click
hit-testing correctly gated on `canInteractWithElement` + `isLayerVisible`. In Animation mode that
meant area-select reached other frames' cels — which onion skinning paints right under the marquee
— so the selection bounds spanned a pose the playhead wasn't on. Locked elements and elements on
hidden layers leaked through the same hole.

**Fix:** one shared `selectable()` gate applied to both loops.

**Guarded by:** `frontend/src/utils/tool-handlers/selection-marquee.test.ts` (5 tests).

### 249. The animation timeline ran underneath a docked toolbar

**Symptom (user report):** "when the tool menu is on the left, the timeline is overlapped."

**Cause:** `.atl-panel` was `position: fixed; left: 0; right: 0` — pinned to the window, not the
canvas — so with the toolbar docked left (the default) the layer-name column and the start of the
frame ruler sat behind the tool icons.

**Fix:** offset by `--toolbar-left` / `--toolbar-right` (the toolbar's own edge, not
`--dock-left/right`, which also include docked panel widths — the timeline is stage-width chrome
and should still run beneath a docked Properties panel). Added `--toolbar-bottom` to
`publishDockVars()` so a bottom-docked toolbar is cleared too, and folded the hardcoded
`bottom: 28px` plus its mobile `36px` media-query twin into one `calc()` over `--statusbar-h`.

### 248. Timeline icons and the Audio label failed on contrast

**Symptom (user report):** "plus button color contrast issue on dark/light mode."

**Cause:** `.atl-icon` used `--text-secondary` (#6b7280 on white = 4.8:1, #9ca3af on #1e1e1e =
6.6:1). Fine as a colour pair, but these are 12–13px one-pixel-stroke glyphs, where that reads as
barely-there — the `+` that adds a layer was the one people couldn't find. Separately, the **♪
Audio** label's amber `#b45309` is 6.4:1 on white but only **3.3:1** on the dark panel, a real AA
failure for 10px bold text; and `.atl-danger:hover`'s `#ef4444` is 3.76:1 on white.

**Fix:** icons drive from `--text-primary` at `opacity: .75` → 1 on hover/focus; the two *add*
buttons get a standing background + border; the Audio label gets `#fbbf24` on dark; the danger red
deepens to `#dc2626` on light.

### 247. The Node tool's hint described a state you weren't in

**Cause:** the tool-options bar always read "Alt-click a segment to add a node · drag a handle to
bend", even when the selection was a rectangle with no anchors — so the tool looked broken when it
was working correctly and simply had nothing to edit.

**Fix:** state-aware hint — nothing selected, a non-path selected (pointing at the Convert to Path
button beside it), or the real gesture hint.

### 246. Help search for "ruler" returned nothing

**Cause:** `help-page.tsx`'s filter matches a doc's `name`, `description`, `category` and
`keywords` — never body text. No registry entry contained the word "ruler", and no doc had a
rulers/guides section; the feature was mentioned only in passing clauses inside three unrelated
pages.

**Fix:** a full **Rulers & guides** section in the Workspace doc, plus `keywords` on that entry.
Also documented the Node tool in Vector Paths with `direct selection` / `white arrow` keywords.

## 2026-08-02 — user-reported: swapped align icons, and bullets that didn't survive the editor

### 245. The Properties panel's align buttons carried the wrong axis's icon

**Symptom (user report):** "the horizontal and vertical alignment options appear to be swapped —
horizontal alignment performs vertical alignment and vice versa."

**Cause:** nothing wrong with the alignment itself. `calculateAlignment` (`utils/alignment.ts`) is
correct, and the dock Align panel (`components/dock/align-panel.tsx`) picks the right icons. The
Properties panel (`components/property-panel.tsx:345-354`) did not: lucide names an align icon
after the axis of its **guide line**, so `AlignStartVertical` (guide `M2 2v20`, a vertical rule at
the left) means *align left*, while `AlignCenterHorizontal` (guide `M2 12h20`) means *align
middle*. The panel used `AlignCenterHorizontal` for horizontal centring and the whole
`*-Vertical` set for top/middle/bottom — so the second row read as left/centre/right while doing
top/middle/bottom. The first row also used `AlignLeft`/`AlignRight`, which are *text*-align icons.

**Fix:** horizontal alignment (moves X) now uses `AlignStart/Center/EndVertical`, vertical
alignment (moves Y) uses `AlignStart/Center/EndHorizontal` — matching the dock panel. Behaviour
and tooltips unchanged.

### 244. Bullet lists looked different after you left the text editor

**Symptom (user report):** "the bullet points shown while editing text don't match the final output
after exiting the text editor."

**Cause:** three separate defects between the contenteditable and the canvas, all in the
list path. Reproduced against real Chromium `execCommand` output:

1. `htmlToSpans` (`utils/rich-text-utils.ts`) walked only the `li` **children** of a `ul`/`ol`.
   Browsers emit a nested list as a *sibling* of the `<li>` it belongs to (that is what
   `execCommand('indent')` produces, and what pasted outlines contain), so every nested item was
   dropped outright — the editor showed 4 bullets, the canvas 3.
2. An item only got a line break when its next *element* sibling was an `li`. After a nested list,
   or between two lists, or before text following a list, no break was emitted, so
   `mergeAdjacentSpans` fused the texts: "Three" + "Plain tail" rendered as one bullet.
3. `layoutRichText` only recomputed the list indent when the line started at x=0, which after a
   break was never true — so a deeper level kept its parent's indent, and text *after* a list
   stayed indented in the list's text column. Separately, both renderers drew a marker for the
   first list span on **every** line, so a word-wrapped item grew a second bullet on its
   continuation line.

**Fix:** the `ul`/`ol` walker now iterates children in document order (handling nested lists in
either shape browsers produce) and emits an explicit break before every item and after the list,
via a `pushBreak()` that won't double up. `layoutRichText` recomputes the indent at every line
start and tags the item's first segment with `listMarker`; `text-renderer.ts` and
`render-pipeline.ts` draw the bullet/number only for that segment. `spansToHtml` was rewritten to
emit nesting as a stack of `<ul>`/`<ol>` (the browsers' own shape) and to drop the newline that
butts against a list block, so edit → commit → re-edit is now a fixed point instead of growing a
blank line each round.

**Covered by** `tests/rich-text-lists.spec.ts` — all three assertions fail on the pre-fix code.

**Still open (pre-existing, not part of this fix):** SVG/PNG export (`utils/export.ts`) lays list
text out with the indent but never draws the markers, so an exported diagram loses its bullets.

## 2026-07-31 — Ctrl+A handed you a selection you couldn't touch

### 243. Select-all left the drawing tool armed, so the selection was inert and went stale

**Symptom:** with a brush active, `Ctrl+A` draws a selection box around everything — and nothing
can be done with it on the canvas. Clicking a selected shape doesn't grab it, dragging paints
another stroke, no resize/rotate handles respond.

**Cause:** `selectAll()` (`store/app-store.ts`) only wrote `store.selection`; it never touched
`selectedTool`. Every direct-manipulation path is gated on the selection tool — `selectionOnDown`
at `canvas.tsx:1678`, and control points / path anchors / connector handles at
`selection-renderer.ts:621,664,675` — so with a drawing tool armed the selection could only be
acted on through the keyboard and the property panel. Worse, brushes are in `CONTINUOUS_TOOLS`
(`draw-handler.ts:68`), so the post-stroke branch that would normally reassign the selection is
skipped: the Ctrl+A selection stayed painted over the canvas while the user kept drawing, and
silently went stale — it never included the strokes drawn after it.

**Fix:** `selectAll()` now arms the selection tool when a non-selection tool is active, matching
the convention every other "you now have objects to manipulate" moment already follows (finishing
a pen path, closing a polyline, placing an image, leaving text editing, exiting crop). `lasso` is
exempt — it is already selection-capable. An empty canvas leaves the tool alone, so the shortcut
can't yank a brush out of a user's hand for nothing. Fixing it in the store rather than the
keyboard handler means the two context-menu "Select all" entries (`context-menu-builder.ts:332`,
`:1562`) get the same behaviour.

**Trap:** ordering. `setSelectedTool` clears `store.selection` for drawing tools
(`app-store.ts:1410`), so the tool switch has to happen *before* the selection is written, not
after — the reverse order silently select-alls into an empty selection.

**Also fixed: `app-store.test.ts` had not run at all.** It errored out during import with
`Cannot find module 'react/jsx-dev-runtime'` and `bun test` reported it as an "unhandled error
between tests" rather than a failure, so the suite looked green at 389 passing while this file
contributed zero. Bun resolves JSX from the *nearest* `tsconfig.json`, which is the root
solution-style config — it has no `compilerOptions`, so any `.tsx` pulled in transitively (here
`config/ui-shape-defs.tsx`) was compiled against the React runtime. Root `tsconfig.json` now
mirrors `jsx`/`jsxImportSource` from `tsconfig.app.json`; it has `"files": []`, so `tsc -b` is
unaffected. Suite went 389 → 393.

## 2026-07-31 — The first diagram rendered in a page was measured against the wrong font

### 242. Auto-sized text baked fallback-font metrics into the saved document

**Symptom:** the first diagram imported in a freshly-loaded page came out a few percent wider
than the same source imported again later in that page's life. Originally reported as
"`Yappy.clear()` leaks state", because `clear()` was the call that happened to sit between the
cold render and the warm one.

**Cause:** not `clear()` at all. Text-bearing shapes are auto-sized from `ctx.measureText()` at
creation (`dsl-engine.ts` → `fitShapeToText`), and on a cold page the webfonts were not yet
available, so the measurement used the fallback face. The trap is that every obvious guard says
the fonts *are* ready:

```
document.fonts.status                 → "loaded"
await document.fonts.ready            → resolves immediately
document.fonts.check('28px Handlee')  → false            ← the truth
```

`document.fonts.ready` only settles faces that have been **requested**, and a family delivered
via the `<link>` to Google Fonts in `index.html` is not requested until something first renders
with it. Measured: `"AbstractFactory"` at 28px Handlee is **180.39px cold vs 187.00px warm**, a
3.7% error. Because auto-sizing writes to `el.width`/`el.height`, which are *saved*, this was a
permanent property of the document rather than a momentary mis-draw.

**Fix:** new `frontend/src/utils/font-loading.ts` calls `document.fonts.load()` — the call that
actually forces the request — for every built-in family × {400, 700, italic 400, italic 700} and
memoises the resulting promise. `index.tsx` fires it at boot (fire-and-forget; it can never
delay or break boot, and an offline font degrades to fallback metrics rather than stalling).
Exposed as `Yappy.fontsReady()` / `Yappy.fontsLoaded()` so headless and embedded callers can
await a known-good state, and `scripts/render-dsl.mjs` now awaits it before `importDSL`.

**Verified** (headless Chromium, A/B against the pre-fix tree):

| probe | pre-fix | fixed |
|---|---|---|
| `document.fonts.check('28px Handlee')` after `fonts.ready` | **false** | true |
| `measureText("AbstractFactory")` on a cold page | **180.39px** | 187.00px |
| geometry baked by the first import | **166×90** | 150×109 |

The pre-fix numbers reproduce the reported defect exactly; the fixed tree measures warm from
boot, so first and subsequent imports agree.

**Regression test:** `tests/font-metrics.spec.ts`, 4 cases. Every guard is anchored to
`measureText` rather than to rendered geometry — see the open item below for why geometry
assertions would be vacuous. The load-bearing one compares a built-in family against
`"__NoSuchFamily__"` with the same generic fallback: on a cold page the two measure *identically*
(both fall through), so divergence is proof the real face is in use, independent of whichever
font version the machine fetched. Reducing `preloadAppFonts()` back to `document.fonts.ready`
fails 3 of the 4, at exactly 180.39 vs 187.00.

### OPEN — a cold measurement is not recoverable by re-importing

Found while verifying the above, **not fixed** (the preload makes it unreachable on the normal
path, but the underlying defect stands). On a page whose first import ran cold, calling
`clear()` and re-importing the same source reproduces the **cold geometry exactly**, even though
the fonts have demonstrably arrived by then:

```
measureText probe:  180.39px  →  187.00px      (fonts really did load)
geometry, cold:     AbstractFactory:166x90
geometry, after clear() + re-import: 166x90    ← unchanged; nothing re-measured
```

A fresh canvas context re-measures correctly at that point, and the shared measurement context
in `text-utils.ts` was ruled out (a context created cold recovers on its own — tested). So the
sizes are not being recomputed from `measureText` on the second import at all. Root cause not
yet located; worth a pass through the `importDSL` → `computeFittedSize` path.

## 2026-07-31 — Connectors left a box along the chord, not out of their own edge

Full analysis in `docs/connector-anchor-direction-spec.md`. Found by the audit that the
v0.8.165 arrowhead fix made possible: with the heads finally faithful to their curves, the
curves themselves turned out to be leaving in the wrong direction.

### 241. A connector left a bottom edge heading sideways

**Symptom:** an arrowhead lying **flat against the box edge it terminates on**, pointing along
the edge instead of standing on it — sometimes past the corner entirely, so the glyph appeared
to float beside the node. Reported independently from three diagrams (Abstract Factory's
`Button ▷—— MacButton`, Decorator's `Decorator ◇—— Component`, Actor's `Sender B -> Mailbox`).

**Cause:** `defaultControlPoints()` picked its departure axis from the **chord's dominant
axis**:

```ts
return Math.abs(width) > Math.abs(height)
    ? [{ x: start.x + width / 2, y: start.y }, ...]   // horizontal, even off a bottom edge
```

That is a property of where the two boxes sit relative to one another. What actually determines
the only sensible departure direction is **which edge of the box the endpoint is anchored to**.
The two agree for a typical `tree-down` layout — top/bottom anchors *and* vertically dominant —
and diverge exactly when a node is far enough sideways that `|dx| > |dy|` while the anchor is
still on a horizontal edge. `Button → MacButton` spans dx = −507, dy = +442.

Corpus: **97 of 653** edge-anchored endpoints across **33 of 101** diagrams, every one of them
*exactly* 90° off its edge normal — laid flat along the edge rather than merely askew.

**Fix:** direction from the edge's outward normal, via a new `anchorEdge(binding)` reading the
`anchorFractionX/Y` that `api.connect()` already records. The offset **magnitude** is unchanged,
so connectors where the two rules already agreed re-render bit-for-bit identically. Unbound
ends, corner anchors and non-box shapes (circle/diamond/star/hexagon, whose anchors sit at
neither 0 nor 1) keep the chord rule. Re-rendered corpus: 97 → **0**, worst residual 0.1°.

The arrowhead was never wrong here — it faithfully followed a curve that left in a direction no
box connector should.

### 242. A connector label exported as one word per line

**Symptom:** Actor's `mailbox -> actor "one at a time"` exported as four stacked single-word
`<text>` elements dropped straight down the connector and over the line itself.

**Cause:** `export.ts` wraps `containerText` to `maxWidth = el.width - 20`. For a connector
`el.width` is the chord's `dx` — **zero** for a vertical connector, so `maxWidth` is −20 and
every word overflows. The canvas renderer never wrapped connector labels (it splits on `\n`
only), making this another export-only divergence of the same family as bug 237.

**Fix:** no wrap width for `line`/`arrow`/`bezier`.

### 243. Connector labels sat on the bounding-box centre, not the path midpoint

**Cause:** export used `el.x + el.width / 2`. These coincide for a default-control-point curve —
which is why only the wrapping above was visible — but diverge for authored control points.
`ConnectorGeometry` gained a `mid` field computing the path midpoint the way the canvas always
has (cubic at `t = 0.5`; arc-length midpoint for a connected elbow; bounding-box centre for a
standalone polyline). That canvas label block was the **seventh and last** inline copy of the
control-point derivation in `connector-renderer.ts`; it now uses the helper.

### 244. `textAlign: left`/`right` was applied to connector labels

**Cause:** the same export branch offset the label to `el.x + 10` / `el.x + el.width - 10` —
the chord's corner and `dx`, which describe no text box. The canvas hard-codes centre for
connector labels.

Covered by `connector-geometry.test.ts` (+9 cases, 23 total) and
`tests/connector-anchor-direction.spec.ts` (5 cases; four fail on the pre-fix tree, the fifth
is the "unchanged" control).

## 2026-07-31 — Arrowheads were rotated off the curve they terminate

Full analysis in `docs/arrowhead-orientation-spec.md`.

### 237. Exported arrowheads used the bounding-box chord instead of the path tangent

**Symptom:** in exported SVG, UML and open-V arrowheads pointed the wrong way. The tip was in
the right place; the glyph was rotated — by up to 45°. In a `tree-down` class diagram the
child directly below its parent looked perfect and the children left and right were visibly
tilted.

**Cause:** `export.ts` computed one angle for both ends, `Math.atan2(el.height, el.width)` —
the chord of the bounding box. The stroke it actually drew was `connectorCurvePath(el)`, a
cubic whose *default* control points are offset half the dominant axis, making the true
tangent exactly horizontal or vertical at both ends. Chord and tangent coincide only when the
connector is straight or perfectly axis-aligned; the error is maximal when the horizontal and
vertical offsets are equal.

**Fix:** both the path and the angles come from the new shared `connectorGeometry()`.

### 238. The architectural canvas renderer pointed start arrowheads due east

**Symptom:** in the clean (non-sketch) drawing style, the start arrowhead of any curved
connector pointed right regardless of the line's direction. Not previously reported — the
original spec concluded the bug was export-only, having checked sketch mode.

**Cause:** six places derive connector geometry by hand. Five have a default-control-point
fallback; `renderArchitectural` did not:

```js
const cp1 = el.controlPoints?.[0] || { x: start.x, y: start.y };
const cp2 = el.controlPoints?.[1] || cp1;
```

`controlPoints` is undefined on every DSL- and API-authored edge (neither `api.connect()` nor
`dsl-engine` ever writes it), so this collapsed to `cp1 = cp2 = start` and `startAngle`
became `atan2(0, 0)` — which is **0**, not an error. `endAngle` degenerated to the chord, i.e.
bug 237 again. Measured: start −14.6° and end +106° where the truth was −90°/+90°; sketch
gave −87.7°/+90.6° on the same element.

**Fix:** the same shared helper, plus a degenerate guard that walks along the control polygon
to the next distinct point (for a cubic with `cp1` on the start the real tangent is toward
`cp2`, not the chord) before falling back.

### 239. Export ignored a rerouted connector's waypoints

**Cause:** `connectorCurvePath` always spanned `(el.x, el.y) → (el.x + w, el.y + h)` and never
read `el.points`. `api.connect()` writes `points: [0, 0, dx, dy]`, which agrees with the box —
so this stayed invisible until someone dragged a bound connector's midpoint.

**Fix:** the helper takes its endpoints from `el.points` when there are at least two.

### 240. Elbow angles could be read from a zero-length segment

**Cause:** `renderElbow` de-duplicated consecutive waypoints within 0.1px before taking its
angles; `renderArchitectural`'s elbow branch did not, so two coincident waypoints gave
`atan2(0, 0)` → due east.

**Fix:** de-duplication happens once, in the helper.

Covered by `frontend/src/utils/connector-geometry.test.ts` (14 `bun:test` cases) and
`tests/arrowhead-orientation.spec.ts` (4 Playwright cases; measured max error 0.000°).

## 2026-07-31 — The whole mobile shell was broken by the desktop dock refactor

### 231. On a phone the toolbar covered the entire screen

**Symptom:** on a phone-width viewport the tool icons sat stranded in the *vertical middle*
of the screen and nothing on the canvas responded to taps. The app looked empty and inert.

**Cause:** the shell refactor (v0.8.16x) added

```css
.toolbar-container:not(.docked) { top: calc(12px + var(--dock-top, 0px)); }
```

to keep the *floating* bar clear of the new header. That selector is **0-2-0**; the phone
rule it has to lose to is `@media (max-width: 600px) { .toolbar-container { top: auto } }`,
which is **0-1-0**. A media query adds no specificity, so `top: auto` never applied. The bar
therefore had `top` *and* `bottom: 36px` pinned with `height: auto` — which stretches an
element between the two edges. The result was a 796px-tall opaque panel spanning the window,
painted in `--bg-panel` (white on white, hence invisible) and swallowing every pointer event.

**Fix:** the phone rule is scoped `:not(.docked)` too, so it ties on specificity and wins on
source order. Mobile always floats, so it matches exactly the same element.

### 232. The phone toolbar was 24px wider than the phone

**Symptom:** the last tool was cut off at the right edge and the page scrolled sideways.

**Cause:** the phone rule sets `width: 100%` and `padding: 8px 12px`. There is no global
`box-sizing: border-box` reset in this project, so the padding was *added* to the 100%.

**Fix:** `box-sizing: border-box` on the phone rule.

### 233. Phone tool buttons were 28px, not the 40px the CSS asked for

**Symptom:** fingertip-hostile targets on mobile despite a rule explicitly setting 40px.

**Cause:** the same specificity-vs-source-order trap in the other direction. The mobile
`.toolbar-btn { width: 40px }` lives *above* the base `.toolbar-btn { width: 28px }` in
`toolbar.css`; equal specificity, so the later base rule won.

**Fix:** scoped it to `.toolbar-container .toolbar-btn` (0-2-0).

### 234. The header and the phone toolbar painted over the canvas

**Symptom:** taps in the top ~52px and the bottom ~57px of the "canvas" did nothing.

**Cause:** `dockInsets()` skipped the top-bar inset on narrow viewports, but `app.tsx`
mounts `<Menu>` (and its opaque, full-width, z-10050 `.shell-topbar`) whenever the app isn't
in Zen or Presentation mode — phones included. So the bar was drawn and reserved nothing.
The phone toolbar strip had the same problem at the bottom.

**Fix:** the top inset is now conditioned on exactly what gates the render (`chromeless`),
with no width test; and a phone-width viewport adds `PHONE_TOOLBAR_H` to the bottom inset
when the toolbar is mounted.

### 235. 601–699px docked the toolbar over the drawing

**Symptom:** in that band a 46px tool column sat on top of the canvas rather than beside it.

**Cause:** two breakpoints for one concept. `toolbar.tsx` and `toolbar.css` drew the phone
line at **600**; `dock-layout.ts` independently drew it at **700**. Between them the toolbar
docked to an edge while the insets still called the viewport narrow and reserved nothing.

**Fix:** one exported `PHONE_MAX_WIDTH = 600` in `utils/dock-layout.ts`, consumed by
`toolbar.tsx` via `isPhoneWidth()`; the CSS media query names it in a comment.

### 236. Floating undo/redo landed on top of the phone toolbar

**Cause:** pinned at a hand-tuned `bottom: 60px`, which was clear of a 36px status bar alone
but not of the 36px bar *plus* the 57px toolbar strip above it.

**Fix:** offsets by `var(--dock-bottom)` — correct in both the phone and the 601–768px
tablet layout, where the same cluster shows but the toolbar has taken a side edge instead.

Also: `--statusbar-h` was published as a flat 28px while `status-bar.css` makes the bar 36px
at ≤768px, so mobile chrome anchored to it was 8px out. It is width-dependent now.

Covered by `tests/mobile-shell.spec.ts` (all six fail on the pre-fix tree).

## 2026-07-30 — Bezier handles were visible but not grabbable in the Node tool

### 230. Smooth nodes showed handles you couldn't touch

**Symptom:** making a node smooth drew the expected leader line with a small square at
its end, but the square could not be dragged — the curve could be created and then not
adjusted.

**Cause:** self-inflicted by v0.8.159. The Node tool overlay installs a capture-phase
`pointerdown` on `window` (necessary to beat the canvas) and calls `stopPropagation()`
for anything that isn't an anchor hit. The handles were still being drawn by the *existing*
selection overlay, and `handlePathNodeDrag` already supports dragging them
(`path-in-*` / `path-out-*`) — but the event never reached it.

**Fix:** the Node tool owns handles now rather than letting the old path leak through.
`selectedNodeHandles()` returns the handles of the *selected* anchors in world space
(only the selected ones — every handle on a busy path is noise, and matching Inkscape);
the overlay draws them and hit-tests them *above* anchors, since a handle often sits right
next to its own anchor. `moveNodeHandle()` drags one, and on a `smooth` anchor mirrors the
opposite handle — opposite in direction, unchanged in length, which is what makes the node
smooth. Hold **Alt** while dragging to break the mirror and give a smooth node a cusp.

## 2026-07-30 — The Node tool stole Ctrl+A and Backspace from text inputs

### 229. Node tool hotkeys fired regardless of focus

**Symptom:** with the Node tool active, `Ctrl+A` and `Delete`/`Backspace` were captured
even while typing in a text field, a layer-rename box or a dialog — so `Ctrl+A` in an
input selected path nodes instead of the text.

**Cause:** the overlay's key handler is a **capture-phase** `window` listener (it has to
be, to beat the canvas), but unlike the app's global hotkey handler it had no
input-focus exemption. `app.tsx` already guards on
`INPUT / TEXTAREA / SELECT / isContentEditable / .fp-trigger, .fp-popup, .gf-modal,
[role="dialog"]`; the overlay simply didn't reuse it.

**Fix:** the same exemption, applied first. Also made `Ctrl+A` fall through when there is
no path selected — with no nodes to take it now reaches the app's normal select-all
instead of being swallowed. (`Ctrl+A` = "all nodes of the selected path" while in the
mode is deliberate: it is what Inkscape's node tool does.)

## 2026-07-29 — The wrapped toolbar's icons didn't line up

### 228. Ragged columns in the wrapped/vertical toolbar

**Symptom:** with the toolbar in its wrapped grid (vertical orientation, or dragged
narrow), the icons didn't align into columns — the first row sat offset from every row
below it, so a grid of otherwise identical 28px buttons read as untidy.

**Cause:** not the tool *groups*, which was the obvious suspect — measuring showed every
button is a uniform 28x28 whether or not it carries a submenu chevron. The culprit was
the **drag grip**: a 40x12 box sitting inline in the flex-wrap flow. It consumed one
cell of the first row, so the first two icons landed at x61/x93 while every row below
them started at x17/x49/x81. Five distinct column edges for what should be a 3-column
grid.

**Fix:** in wrap mode the grip takes a full-width row of its own (`flex: 0 0 100%`),
becoming a header strip above the grid. Cells are also pinned to a 28px box explicitly,
so a future group wrapper can't stretch one. Gap/padding nudged 4px → 6px so the grid
doesn't crowd the resize grip in the corner.

Measured after: one distinct cell width, three evenly spaced columns (19/53/87, uniform
34px pitch), no scroll/clipping. A/B'd by reverting — the column count goes back to 5.

## 2026-07-29 — Cold load was carrying 1.8 MB it never used, and Shift didn't constrain shapes

### 226. Shift did nothing when drawing a shape

**Symptom:** holding Shift while dragging a rectangle gave a free rectangle, not a
square — and the same for circles, diamonds and every other shape tool. The status bar
has been advertising `Shift · Constrain` for shape tools the whole time.

**Cause:** `drawOnMove` only ever implemented an *angle* constraint, and only for
`['line', 'arrow', 'bezier']`. There was no aspect constraint at all; for a shape tool
the Shift flag was read and then unused.

**Fix:** shape tools now constrain the drag to a square (so ellipses come out as perfect
circles). Takes the larger drag axis so the shape follows where the cursor was reaching,
and keeps each axis's sign so it still draws in all four directions. The 15° angle snap
keeps precedence for the connector tools.

### 227. ~1.8 MB gzip of never-used code on every cold load

**Symptom:** YappyDraw took noticeably longer to become usable than HappyPaint.

**Cause:** three separate things sat on the cold-load critical path:

1. `components/menu.tsx` **statically** imported `exportSceneAsHtml`, and that chain ends
   at `assets/player-assets.ts` — a generated file holding the entire player bundle as a
   2.4 MB string literal. `api.ts` already loaded it dynamically; the menu didn't, and one
   static import is enough.
2. `utils/export.ts` imported `jspdf` and `pptxgenjs` at module level for the two
   functions that use them, but seven modules import that file statically for plain
   PNG/SVG export — so ~744 kB of export-only vendor code was pulled in for everyone.
3. `manualChunks` named `lucide-solid`, which forces the **entire** icon package into a
   chunk and defeats tree-shaking of the ~40 icons actually used.

**Fix:** dynamic-import `export-game` at both call sites; move the jspdf/pptxgenjs
imports inside `exportToPdf`/`exportToPptx`; drop `jspdf`, `pptxgenjs` and `lucide-solid`
from `manualChunks`. Cold-load JS: **1,821 kB → 694 kB gzip (−62%)**, with
`vendor-rendering` alone going 660 kB → 28 kB as the unused icons finally got dropped.

Worth noting for next time: making the imports dynamic was *not* sufficient on its own —
a `manualChunks` entry keeps forcing its modules into a chunk reachable from the entry.
Both halves were needed.

## 2026-07-29 — Live symmetry wasn't live for pen tools, and fill mode filled everything

### 223. Mirrored pen strokes only appeared when the pointer was released

**Symptom:** with symmetry on, shapes mirrored live as you dragged, but Pencil / Ink Brush
/ Marker showed only the half you were drawing — the mirrored copies popped in on
pointer-up.

**Cause:** the copies were in the document from the first pointer move (the store was
right), but never painted. `renderLayersAndElements` culls sub-pixel elements:

```js
if (el.id === currentDrawingId) return true;      // the stroke being drawn is exempt
const screenWidth = Math.abs(el.width) * scale;
const screenHeight = Math.abs(el.height) * scale;
if (screenWidth < 1 && screenHeight < 1) return false;
```

An uncommitted freehand stroke carries its whole extent in `points`; `width`/`height`
stay 0 until `normalizePencil` runs on pointer-up. The stroke being drawn survives via
the `currentDrawingId` exemption — its mirrored copies had no such exemption, so they
were culled every frame until release. Geometric shapes have real width/height during
the drag, which is exactly why they looked fine.

**Fix:** elements that carry their extent in `points` and have a ~0×0 box skip the
sub-pixel cull. Verified by pixels rather than store contents: mirrored ink now grows
52 → 137 → 256 → 350 across a drag and matches the source exactly on release. A/B'd by
disabling the fix — mirrored ink drops to 0 mid-drag.

### 224. Every freehand stroke rendered as a filled blob

**Symptom:** after fill mode landed, Pencil and Ink Brush strokes came out as solid
silhouettes whether or not fill mode was on.

**Cause:** the renderer decided to fill based on `el.backgroundColor` being set. Freehand
elements are created from `store.defaultElementStyles`, which already carries a
background — so the condition was true for every stroke ever drawn.

**Fix:** an explicit `fillSilhouette` flag on the element, set only by the fill-mode
commit path. Intent is now recorded rather than inferred from a property that happened to
be present.

### 225. "Default" symmetry state was whatever you last drew with

**Symptom:** loading a document saved before symmetry existed kept the *previous*
document's axis instead of resetting.

**Cause:** the reset read `initialState.symmetry`, but the store is seeded from
`initialState` by reference — so every `setSymmetryMode` / `setSymmetryCenter` call had
been mutating the "defaults" in place.

**Fix:** `defaultSymmetryState()` returns a fresh object each call, used both to seed the
store and to reset on load.

## 2026-07-29 — drawIn popped from a clean line into a sketchy one at the last frame

### 221. Sketch-style drawIn revealed geometry the finished shape never had

**Symptom:** with `drawIn` on a shape in **sketch** render style, the outline traced on as
a clean, single, precise line — then snapped to RoughJS's wobbly two-pass stroke the
instant progress reached 100%. In a whiteboard-style animation with several shapes drawing
at once this reads as the whole scene flickering as each element lands.

**Cause:** `ShapeRenderer.renderDrawProgress` never touched RoughJS. It dash-traced the
shape's *geometric* outline (`definePath` / `estimatePathLength`) with a plain canvas
stroke, while the finished shape is drawn by RoughJS. The reveal and its own end state
were two different pictures. Measured on a 260×180 rectangle, the last frame of the
reveal had only 73% of the finished shape's ink — the missing 27% appeared in one frame.

**Fix:** the reveal now traces the shape's *own* RoughJS strokes. `renderDrawProgress`
re-runs the renderer's real `renderSketch()` against a capture proxy that generates
Drawables without painting them, flattens their `path` opsets to polylines
(`utils/animation/rough-stroke-trace.ts`), and dash-reveals those. Because it is literally
the final geometry, there is nothing left to pop. Architectural style keeps the old
outline trace, and any shape that produces no RoughJS geometry falls back to it.

Two details the real geometry forced, neither of which synthetic test data would have
surfaced:

- RoughJS emits **only** `move` and `bcurveTo` — never `lineTo` — so flattening has to
  sample cubics.
- It traces each segment **twice**. A rectangle arrives as 8 subpaths (4 edges × 2 passes,
  in perimeter order), so the passes must be paired and revealed in lockstep while edges
  advance sequentially. Pairing is decided on bounding box, not endpoints: for closed
  shapes the two passes deliberately start and end at different points around the loop —
  at roughness 3 an ellipse's two passes finish ~90px apart while tracing the same oval.

### 222. A `null` drawProgress made a shape vanish

**Symptom:** setting `drawProgress` to `null` (rather than `undefined`) rendered nothing
at all instead of rendering the finished shape.

**Cause:** all four draw-progress guards tested `dp !== undefined`, so `null` passed
through into the reveal branch and `(null ?? 0) / 100` evaluated to a progress of 0.

**Fix:** the guards now test `dp != null`, covering both. Found while building the
Playwright coverage for #221, where Playwright turns an `undefined` evaluate argument
into `null`.

## 2026-07-29 — Scientific notation in path data broke every shape you'd already edited

### 220. Paths from boolean ops became unselectable and impossible to combine

**Symptom:** after any Pathfinder operation, the resulting shapes could no longer be
click-selected (only a marquee drag caught them), and every further operation on them
reported "Pathfinder: empty result". Freshly drawn shapes were fine — it only ever
affected shapes that had already been through a path operation.

**Cause:** `PathUtils.parsePath` tokenised with
`/[a-zA-Z]|[-+]?[0-9]*\.?[0-9]+/g` — no exponent support. Given a coordinate like
`7.105427357601002e-15` it matched the number, then matched **`e` as a command**, then
`-15` as another number, desynchronising every coordinate after it into `NaN`.

Boolean results are precisely where such values arise: an anchor at
`x = 118.45292097131303` in a frame offset by `-118.45292097131296` cancels to ~7e-15.
One `NaN` then explained both symptoms at once — hit-testing compared against `NaN`
(so no click ever landed) and the flattened polygon was invalid (so `polygon-clipping`
returned nothing and Pathfinder reported an empty result).

**Fix:** add the exponent group to the tokeniser. Scientific notation is also legal in
SVG path data, so imported files were hitting the same trap. Regression in
`tests/path-exponent-parse.spec.ts`, verified against a reverted build and against the
user's exported document.

**Diagnosis note:** four plausible causes were tried and measured first — the polygon
flattener, hit-test sampling resolution, region-op output, and stroke tolerance — and
every one was disproved by a negative control. What finally located it was asking for
the real document and reproducing from its JSON; the synthetic shapes never contained
a coordinate small enough to trigger it.

### 223. The boolean toolbar only recognised 19 of 70+ shape types

**Symptom:** with two ordinary new shapes selected the toolbar simply didn't appear —
while it appeared normally for other, visually similar selections.

**Cause:** the gate was a hardcoded allowlist of type names
(`rectangle`, `circle`, `path`, …) written from memory. The app has 70+ element types
with area — `pentagon`, `septagon`, `rightTriangle`, `cylinder`, `speechBubble`,
`solidBlock`, `callout` and so on — and anything absent from that list silently
disabled the whole toolbar with nothing to explain the absence.

**Fix:** gate on the geometry instead of the type name — an element qualifies if
`elementToMultiPolygon` yields at least one ring, which is the exact precondition the
boolean engine itself applies. It therefore cannot drift out of step with the engine,
and zero-area marks (lines, arrows) are still excluded for the right reason. Selections
above 60 elements skip the probe and go by count, so flattening cost stays bounded.
Regression in `tests/boolean-ops-ux.spec.ts`, verified against a restored allowlist.

**Lesson:** an allowlist written from memory is a silent-failure generator. Where a
real precondition already exists in the code, test that.

### 221. The boolean toolbar could be positioned off-screen

**Symptom:** with a perfectly ordinary two-shape selection the contextual toolbar
sometimes didn't appear at all.

**Cause:** the position clamped `left` to the window but only clamped `top` at its
upper bound. With the selection near or past a viewport edge the strip rendered
outside the window — `top: -507` at negative world coordinates, `top: 720` zoomed out.

**Fix:** clamp into the viewport on both axes, and bail out rather than render when a
malformed viewport makes the coordinates non-finite. Regression in
`tests/boolean-ops-ux.spec.ts` ("stays on screen at any pan/zoom").

### 222. A stray line emptied the whole operation

**Symptom:** selecting two shapes plus a line and hitting Unite did nothing and
reported an empty result.

**Cause:** lines and arrows flatten to zero polygons, and the boolean engine bails when
fewer than two inputs with area survive — so one unrelated line was enough to void the
whole selection.

**Fix:** the toolbar and shortcuts now pass only the combinable elements, so the shapes
combine and the line is left untouched. The empty-result message also names what was
skipped instead of saying only "empty result".

## 2026-07-28 — Scrubbing showed a stale canvas; two equations shared a group id

### 218. Seeking while paused never repainted the canvas

**Symptom:** `seekScene(t)` moved the playhead and `evaluateComposition(t)` returned
the right values, but the canvas kept showing whatever frame it last painted. An
opacity keyframe appeared to do nothing at all; a position keyframe appeared to
work *sometimes*, because unrelated interactions happened to trigger a repaint.

**Cause:** the canvas render effect (`canvas.tsx`) has an explicit dependency list.
It tracked `effectiveTime()` — the animation clock — but not `store.storyTime`.
Playback ticks the clock, so playing looked fine; scrubbing while paused changes
only `storyTime`, so nothing re-ran. Every data-level assertion passed, because the
data was never wrong: the evaluator and the renderer simply disagreed about *when*
to look.

**Fix:** add `store.storyTime` and `store.compositionTracks` to the effect's deps.
Regression in `tests/scene-playback.spec.ts` compares canvas *pixels* across two
seeks — the only kind of check that could have caught this, since every value-based
assertion was already green.

Third bug in this family (see #215, #216): the composition spine is sound, and each
failure has been in what *triggers* work from it.

### 219. A second equation re-used the first equation's group id

**Symptom:** with two `Yappy.tex` equations on one canvas, `texPart(groupId, 'x')`
returned glyphs from **both**, and `texTransform` saw one merged equation instead of
a source and a target (it reported 6 matches for two 3-glyph equations).

**Cause:** `generateId` derives "max + 1" by scanning `.id` fields across the store.
`texGroupId` is a *tag* on elements, not an element id, so the scan couldn't see it
and handed every equation `texg-1`. The id generator already carries two patches for
exactly this shape — `livePaintGroupId` and `groupIds` — with a comment noting that
without them "a new group re-uses the same id and cross-wires two groups".

**Fix:** scan `texGroupId` tags too. Regression in `tests/tex-and-fields.spec.ts`
asserts two equations get distinct ids and that `texPart` stays within one of them.

## 2026-07-28 — API-authored scenes truncated at 4s; onboarding tour came back

### 215. Scene Timeline auto-duration ignored composition tracks

**Symptom:** a scene built entirely through the API (`addKeyframe`, absolute
seconds) played only its first 4 seconds. The Scene Timeline read "2.0 / 4.0s"
for a 6.5s composition; the playhead simply stopped at 4s. Found while building
`examples/manim-gradient-descent.js` — 7 of its 12 descent steps and the final
"converged" label were unreachable.

**Cause:** `scene-timeline.tsx` derived duration as
`Math.max(4, ...figureClipDurations)` — animated stick-figure clips only.
Composition keyframes were never consulted, so a document with no stick figures
(i.e. every API-authored scene) was pinned to the 4s floor. The comment read
"Auto scene duration = longest track", which is what made it look correct: the
composition keys *are* tracks, they just weren't in the list.

**Fix:** fold the composition tracks' last keyframe time into the same max.
Both clocks now feed the duration; the 4s minimum still applies to short scenes.
Regression: `tests/scene-duration.spec.ts`.

### 216. Scene Timeline rendered but never played without a stick figure

**Symptom:** pressing Play on a scene built purely from composition keyframes drew
everything correctly but the playhead never moved — stuck at "0.0 / …". Scrubbing
with `seekScene(t)` worked fine, so the evaluator and renderer were never suspect.

**Cause:** the timeline's play controller advances `storyTime` from the global
animation clock, but `canvas.tsx` only kept that clock ticking for presentation
mode, flow (marching-ants) animations, a playing `stickRig`, or a page-video
export. An API-authored scene has none of those, so the ticker stayed parked and
the controller's effect never re-ran. Same blind spot as #215: the Scene Timeline
assumed stick-figure content exists.

**Fix:** add `store.storyPlaying` to the ticker condition. Regression:
`tests/scene-playback.spec.ts`, verified against a reverted build.

### 217. Skipping the onboarding tour didn't always stick

**Symptom:** the first-visit tour could reappear on a later load after the user
had already dismissed it.

**Cause:** `yappy:tour:seen` was written only in `endTour()` — i.e. only on Skip,
Esc, or reaching the last step. Any other exit (reloading, closing the tab, or
navigating away mid-tour) left the flag unwritten, so the next load auto-started
it again.

**Fix:** mark it seen when the tour *auto-opens*, not when it finishes — the
auto-tour is a one-shot offer, so every exit path leaves it dismissed. Added an
in-memory fallback for when localStorage is unavailable (private mode). Replay
from Help (?) calls `startTour()` directly and is unaffected. Regression:
`tests/onboarding-tour.spec.ts`, verified against a reverted build.

## 2026-07-28 — Beta badge contrast, and the audit that couldn't see it (v0.8.148)

### 213. The Beta badge failed WCAG AA, and had done since it shipped

**Symptom:** the BETA badge on the wordmark was hard to read. White 8px text on
a gradient measuring 4.47 / 3.96 / 3.53:1 across its three stops — all under the
4.5:1 AA requires at that size.

**Cause:** the gradient used 500-level stops. The source comment asserted
"4.6:1 against the lighter end", but the lighter end is the PINK stop at 3.53:1
— the number appears to have been measured against the indigo end and then
rounded up.

**Fix:** one shade deeper (`#4f46e5 / #9333ea / #db2777` → 6.29 / 5.38 / 4.60:1),
keeping the indigo→purple→pink identity. Comment corrected with all three
measured ratios so the next person can check it.

### 214. The contrast audit was blind to gradient backdrops

**Symptom:** `contrast.spec.ts` reported `span.beta-badge` at "1:1
fg=rgb(255,255,255) bg=rgb(255,255,255)" — white on white — repeated for every
surface the sweep visited. Nonsense on its face, which is presumably why it was
tolerated rather than chased.

**Cause:** the backdrop walk read only `backgroundColor`. An element painted
with `background: linear-gradient(...)` has a TRANSPARENT computed
`backgroundColor`, so the walk skipped it entirely and compared the text against
the nearest solid ancestor — the white header. The badge's real backdrop was
never considered, so a genuine AA failure (#213) hid behind a bogus one.

**Fix:** the probe extracts the gradient's colour stops and scores the text
against the WORST stop — text must stay readable everywhere the gradient lands.
Strictly stricter than before, and the whole-app sweep passes under the new rule,
so nothing else was hiding behind the same blind spot.

### 215. Three specs pointed at a hardcoded port, and set state that could not take

**Symptom:** `contrast`, `ui-panels` and `hotkeys` failed in ways that had
nothing to do with what they claimed to test.

**Cause:** two independent mistakes. (a) All three called
`page.goto('http://localhost:5173')` instead of the configured `baseURL`, so
they audited whatever else was on that port. (b) `hotkeys` set up state by
assigning into `window.Yappy.state` — a Solid store proxy, where outside writes
are silently discarded, so every test ran from unprepared state.

**Fix:** `goto('/')`, and setup through the real APIs. While in there, four more
stale assertions from the dock refactor were corrected against verified live
behaviour: Layers is `isPanelOpen('layers')` (Property panel's flag IS still
live — they had to be checked separately), minimap is `minimapVisible`, canvas
background is `canvasBackgroundColor`, and the theme cycle is three steps not
four. Zen mode's test was rewritten to assert on rendered DOM: zen deliberately
does not clear panel flags, it gates rendering, so leaving zen restores the
layout — the old test asserted on flags that were never meant to flip.

## 2026-07-28 — The app could hang on the loading screen (v0.8.147)

### 210. The boot splash was only dismissed if the first render succeeded

**Symptom:** intermittently, the editor never got past the mascot splash. No
error visible, no way out but a manual reload; reloading usually "fixed" it,
which is why it read as random.

**Cause:** `index.tsx` ended with `render(() => <Router />, root!)` and then, on
the *next* statement, faded the splash out. That statement was outside any
guard, so ANY exception thrown during the initial synchronous render skipped it
entirely — including the 900ms `setTimeout` fallback, which lived inside the
same never-reached block.

**Fix:** the dismissal moved into a `finally`, so it runs whether render returns
or throws; a render failure additionally replaces `#root` with a short
"failed to start / Reload" message rather than leaving a blank page.

### 211. A corrupt localStorage value crashed the first render

**Symptom:** the trigger for #210, and the reason it was intermittent — it only
hit browser profiles whose stored value had gone bad.

**Cause:** two component initializers used the tempting one-liner
`JSON.parse(localStorage.getItem(key) || '[]')`. The `|| '[]'` guards a MISSING
key, not a corrupt one, so a truncated write (quota pressure), a value from an
older build, or anything pasted into devtools threw at component construction —
inside the render tree, at boot. `property-panel.tsx` (`collapsed-prop-groups`)
and `color-picker-pro.tsx` (`colorPickerRecents`). Note the safe pattern already
existed in `custom-fonts.ts` and `dock-layout.ts`; these two just missed it.

**Fix:** new `utils/safe-storage.ts` (`readJson` / `readJsonArray` / `writeJson`)
which tolerates missing keys, corrupt values AND storage being unavailable
(private mode, blocked cookies). Corrupt keys are removed on read so they cannot
keep breaking every subsequent boot.

### 212. A failed lazy-route chunk showed "Loading..." forever

**Symptom:** the Help / Examples / embed routes occasionally stuck on the bare
text "Loading...".

**Cause:** those routes are `lazy()` behind `<Suspense>`, and Suspense has no
concept of "this promise will never resolve". A chunk that fails to fetch —
canonically a cached `index.html` referencing hashes that no longer exist after
a deploy, with a service worker in play — leaves the fallback on screen forever.
There was no `ErrorBoundary` anywhere in the app.

**Fix:** an `ErrorBoundary` around the router offering **Reload** and **Try
again**. Plus a last-resort failsafe inline in `index.html` (outside the module
graph, so it survives a module-level throw or a missing entry chunk): after 15s
without a mount, the splash swaps its dots for a message and a Reload button.

## 2026-07-28 — Arc geometry, stale panel flags, drifted specs

### 207. `PathUtils.parsePath` silently dropped every SVG arc (`A`) command

**Symptom:** nine shapes — cloud, database, lightbulb, magnet, magnifyingGlass,
pin, puzzlePiece, storageBlob, umlRequiredInterface — could not be converted to
an editable path. "Convert to Path" simply wasn't offered for them, and
Simplify / Smooth / Offset Path / text-on-path did nothing.

**Cause:** `parsePath` handles `M`, `L`, `Q`, `C`, `Z` and has no `A` case. An
arc's command letter fell through the switch WITHOUT consuming its seven
arguments, so those numbers were then skipped one at a time by the outer loop.
The arcs vanished, the command list came back empty, and `shapeToPath` returned
null for the whole shape — which is exactly the "not convertible" signal, so
every caller quietly opted out. Found while testing Simplify's new auto-convert
against a cloud.

**Fix:** added an `A` case that flattens the arc into ≤90° cubic segments via
the SVG spec's endpoint→centre parameterization (F.6.5/F.6.6, including the
radii-too-small correction), emitting ordinary `C` commands. No new command
type, so length, point-at-t, tangent and outline sampling all work unchanged;
a degenerate arc falls back to a straight line as the spec requires
(`utils/math/path-utils.ts`).

### 208. Panel-visibility booleans in AppState were dead and lying

**Symptom:** `Y.state.showSymbolsPanel` (and `showRecolorPanel`,
`showBehaviorsPanel`) stayed `false` no matter what — including right after
`Y.toggleSymbolsPanel(true)`. A spec asserting on it had been failing silently.

**Cause:** the dockable-panel refactor moved visibility into the persisted dock
layout (`store/dock-layout`); the toggles now call `setPanelOpen(...)` and
nothing writes the old fields any more. `showVectorToolsPanel` had already been
annotated as dead; these three hadn't.

**Fix:** annotated all three as dead flags at their initializers, and exposed
the real answer as `Y.isPanelOpen(id)` (reads the dock layout). Also exposed
`Y.toggleVectorToolsPanel()`, which existed in the store but not on the API.

### 209. Three specs asserted against pre-dock-refactor behaviour

**Symptom:** `symbols-panel`, `vector-tools-panel` (×2) and `symbol-edit` had
been failing on `dev` before any of this work.

**Cause:** three separate drifts. (a) `symbols-panel` queried the dead
`showSymbolsPanel` flag and looked for a `.symbols-panel` wrapper that the dock
no longer renders (it's `.dock-panel > .dock-panel-body > .symbols-panel-body`).
(b) `vector-tools-panel` opened the palette by setting the dead
`showVectorToolsPanel` localStorage key, so the panel never appeared and no
`.vt-row` existed. (c) `symbol-edit` drove selection with raw canvas clicks, but
the app now opens on the **inkbrush** — those clicks were drawing, not
selecting, so nothing was ever hit-tested.

**Fix:** updated the three specs to query `isPanelOpen`, target
`.symbols-panel-body`, open the palette via `toggleVectorToolsPanel(true)`, and
explicitly `setSelectedTool('selection')` before clicking the canvas. All were
test drift — no product behaviour changed for (a) and (c).

## 2026-07-22 — Legacy migration stripped symbol instances (v0.8.143)

### 206. normalizeElement dropped symbolId (and other whitelisted-out fields)

**Symptom:** loading a legacy (v1/v2) document containing symbol instances
rendered grey placeholder boxes — the instances had lost the link to their
symbol definition.

**Cause:** `normalizeElement` passes optional fields through an explicit
whitelist, and `symbolId` was never added to it (nor the new `loopMode` /
`firstFrame` / `contentId`). The v4 load path doesn't normalize, so only
legacy-migration hit it — found while building the animation templates, whose
test suite routes elements through the normalizer.

**Fix:** added the four fields to the whitelist (`utils/migration.ts`). Also
decoupled the module from the store (`generateId` → `crypto.randomUUID` for
the one migrated-slide id) so pure consumers and unit tests can use it.

## 2026-07-21 — Crop ignored rotation (v0.8.141)

### 205. Cropping a rotated image moved it

**Symptom:** crop a rotated image and it jumps. 76.5px off for a 400x200 image
at 45 degrees; worse the further it is rotated.

**Cause:** a crop rect is expressed in the element's own UNROTATED frame, but
both places that reposition the element from it — the apply path in
`exitCropMode` and the temporary expansion in `enterCropMode` (added in
0.8.139) — added the offset straight to `x`/`y`. Correct only at 0 degrees.

**Fix:** a `rotateOffset` helper turns the local offset by `el.angle` before it
is applied, in both places. Drift at 45 degrees: 76.5px -> 0.0px.

**Confirmed working while testing:** undo/redo for crop. Undo restores the
uncropped frame and position, redo re-applies exactly, and entering/cancelling
crop mode leaves no phantom undo step (the temporary expansion is applied with
history disabled). All now asserted.

**Measurement note:** the first run set `angle: 45` assuming degrees; `angle` is
in RADIANS. The corrected run gave the same drift, so the finding stood — but
the expectation had been computed for the wrong rotation, and that is the kind
of coincidence that can validate a wrong conclusion.

## 2026-07-21 — Crop tool stayed armed after applying (v0.8.140)

### 204. Clicking a cropped image looked like it undid the crop

**Symptom:** crop an image, then click it again — the full original picture
reappears with the crop dialog. Continuing and applying crops it again, so
nothing is lost, but it reads as the crop being thrown away.

**Cause:** applying left the Crop tool selected, so the click re-entered crop
mode. Since 0.8.139 crop mode deliberately expands the element to show the
whole image while editing (so a crop can be widened), that re-entry is
indistinguishable from an undo.

**Fix:** finishing a crop — Apply or Cancel — switches to the Select tool and
selects the image. A modal edit on one object shouldn't leave its tool armed;
same reasoning as the image-insert fix (#197).

## 2026-07-21 — Re-cropping and touch-reachable crop controls (v0.8.139)

### 201. A crop could never be widened or removed

**Cause:** `renderCropOverlay` draws the full image into the element's frame.
After 0.8.136 shrank that frame to the cropped region, re-entering crop mode
squeezed the whole picture into the small frame, and the crop rect — clamped to
the frame — could only shrink further. **A regression introduced by the crop fix
itself**, and only visible on the second crop of the same image.

**Fix:** crop mode temporarily expands the element to show the whole image
(positioned so the visible region doesn't move) and clears `crop` for the
duration of the edit; the rect starts on the region currently kept. Dragging
outward reveals more; dragging to the edges removes the crop. `cropRestore`
holds the original geometry so Cancel puts it back exactly.

### 202. Crop had no on-screen controls — unusable on a tablet

Apply was Enter or a click outside the crop rect; cancel was Escape only. On a
tablet applying was an undiscoverable tap and **cancelling was impossible**.
Added a crop bar with Cancel / Apply; the shortcuts still work.

### 203. enterCropMode threw on an already-cropped image

`el` is a live SolidJS store proxy. `enterCropMode` called `updateElement(...,
{ crop: null })` and then read `el.crop.x`, which by then was null — throwing
and leaving crop mode half-entered. Values are snapshotted before the update.

## 2026-07-21 — Floating panels white in dark mode; 24 undefined tokens (v0.8.138)

### 199. Floating dock panels rendered white in dark and focus mode

**Symptom:** open Swatches (or History, Symbols, Stick Figures, Brand Kit,
Elements, Recolor) in dark mode and the panel is a white box with pale grey
text on it.

**Cause:** `.dock-floating` uses `background: var(--bg-primary, #fff)`, and
`--bg-primary` is **defined nowhere**, so the declaration always took the `#fff`
fallback. Panels inside are transparent, so the whole stack sat on white while
the text used the dark theme's light colours.

Auditing every `var(--x)` against the tokens actually defined found **24
referenced-but-undefined names** across ~60 files: `--accent-color` (29 files),
`--bg-hover` (17), `--shadow-lg` (11), `--bg-primary` (6), `--primary-hover`,
`--bg-surface`, `--bg-subtle`, `--bg-tertiary`, `--text-muted`, `--panel-bg`,
`--toolbar-bg`, and more.

**Fix:** all 24 defined per theme in `index.css`. Light values are *exactly*
the previous fallbacks, so light mode is unchanged by construction; the dark and
focus blocks give them real themed values.

**Side effect, intended:** `.toolbar-btn.active` specifies
`background-color: var(--primary-light)`. Undefined, that declaration was
invalid and the active tool button had no tint; it now has one.

### 200. Contrast failures in panels the sweep had never opened

The 0.8.134 sweep visited nine surfaces. Widening it to 27 found: stick-figure
mode/variant/animation chips (white on the indigo accent — 4.47 light, 2.98
dark), History row counts, the States panel's Capture button (3.68) and empty
state, the hotkey badge on the newly-tinted active toolbar button (3.96), and
the layer drag handle (4.2). All fixed.

**Method note:** the audit now skips disabled controls. WCAG 1.4.3 exempts
inactive components, and dimming is how "disabled" is conveyed — flagging them
would push the UI toward making disabled look enabled.

## 2026-07-21 — The crop fix reached the wrong path (v0.8.137)

### 198. 0.8.136's crop fix never ran in the editor

**Symptom:** cropping still stretched the image after 0.8.136 shipped "fixed".

**Cause:** the fix went into `exitCropMode(apply)`. That is what the new
`Yappy.exitCropMode()` API calls, and what the test drove. The UI never calls
it with `apply = true`: both apply paths in `canvas.tsx` — the Enter key and
clicking outside the crop rect — converted the rect inline with
`finalizeCropRect` and then called `exitCropMode(false)`. Neither resized the
frame, which was the whole bug.

**Fix:** both UI paths now call `exitCropMode(true)`; `finalizeCropRect` is no
longer used by the canvas. `exitCropMode` absorbed its "crop covering the whole
frame means no crop" rule so that behaviour survives.

**Process note:** the 0.8.136 test passed and proved nothing about the editor.
An API-level test for a feature whose only real entry point is the UI is not
verification. The replacement drives the pointer and the keyboard, and was
confirmed to fail against the old code (frame stayed 2:1 while showing a 1:1
region) before being kept.

## 2026-07-21 — Crop distortion, dead theme token, invisible swatches (v0.8.136)

### 194. Cropping an image changed its aspect ratio and cropped the wrong area

**Cause (two, compounding):**
1. Unit mismatch. `enterCropMode` converted a stored crop from SOURCE PIXELS to
   ELEMENT-LOCAL coordinates, but `exitCropMode` wrote the element-local rect
   straight into `el.crop`, which `image-renderer` reads as source pixels. On a
   1500px photo shown 500px wide, the committed crop covered a third of the
   selected region.
2. The frame was never resized, so the new source rect was stretched back over
   the old `width`/`height` — a wide strip cropped from a tall photo distorted.

**Fix:** map the crop back to source pixels RELATIVE TO THE REGION CURRENTLY
DISPLAYED (so repeated crops compose), and shrink the frame to the cropped
region. `enterCropMode` now always starts at the full frame, because the frame
already shows exactly the current crop — the old conversion there was only
correct for an uncropped image.

**Test:** `tests/image-and-swatches.spec.ts` — a 2:1 image cropped to a 1:1
region must yield a 1:1 frame with the crop in source pixels.

### 195. Layers panel title unreadable in dark mode (1.30:1)

**Cause:** `color: var(--text-color, #0f172a)` in `dock.css`. **`--text-color`
is defined nowhere in the codebase** — every use silently took its fallback, so
the title was pinned to a near-black literal in all themes. Six files referenced
the dead token.

**Fix:** all uses point at `--text-primary`. Also on the selected layer row: the
drag handle (1.31-1.45:1 grey on the accent fill) now inherits the row colour,
and the layer name's hardcoded `white` (2.54:1 on the dark theme's light accent)
became `inherit`.

**Note:** the whole-app sweep added in 0.8.134 missed this because it visits
nine named surfaces and the Layers panel isn't one. The sweep proves the
surfaces it opens, not the app.

### 196. Saving a colour from the OKLCH picker looked like nothing happened

**Cause:** `createSwatch` stored it correctly and toasted "Swatch added", but
swatches only render in the Swatches panel. The palette the button lives in
never changed, so from the user's view the action failed.

**Fix:** saved swatches render under a SAVED row in the palette itself, saving
returns to that view, and each chip has an x to remove it.

### 197. Image tool stayed armed after inserting an image

**Symptom:** the click after placing an image reopened the file picker instead
of selecting or moving it.

**Fix:** both insert paths (upload and empty placeholder) select the new element
and switch to the Select tool.

## 2026-07-21 — Focus theme was a duplicate of Dark (v0.8.135)

### 193. Focus theme was indistinguishable from Dark

**Symptom:** user asked "is focus necessary, appears same as dark?"

**Measured:** identical apart from the theme-toggle icon — 152 of 921,600
pixels (0.017%) on infinite canvas and design docs, 167 on slides, all inside a
16x14 region in the top-right corner. All 19 CSS variables byte-identical, all
22 `[data-theme="focus"]` selectors shared with dark, every runtime check
written `theme === 'dark' || theme === 'focus'`.

**Cause:** `index.css` describes Focus as "dark UI chrome AND dark canvas for
distraction-free drawing", and a comment in `app-store.ts` claimed `setTheme`
adjusts `canvasBackgroundColor` for it. `setTheme` has never done that, and the
page surface is rendered WYSIWYG white in every theme, so the canvas half of
Focus did not exist.

**Fix:** `renderSlideBackground` takes an opt-in `focusDim` that dark-adjusts
the page surface (solid, gradient stops, and hatch fills — hatching too, or it
would be black-on-dark and vanish). Only the live editing canvas passes it, so
exports, thumbnails, recordings, time-lapse and presentation mode stay WYSIWYG.
Focus is also removed from the theme cycle on infinite-canvas documents, where
it has nothing to distinguish it. Stale comment deleted.

**Measurement gotcha:** an early comparison showed 23,000-31,000 differing
pixels on paged docs, implying a real difference. That was a toast present in
one screenshot and faded in the next. Suppress transient UI before diffing.

## 2026-07-21 — Whole-app contrast audit (v0.8.134)

### 192. Faint text across the UI failed WCAG AA in every theme

**Symptom:** none reported directly — found by auditing after #191, on the
suspicion that the button was a sample rather than the population. It was.

**Method:** a browser-side sweep of every element owning visible text, in three
themes across nine surfaces, compositing each foreground against its true
backdrop (translucent layers and inherited opacity included). 635 failing
instances, 11 distinct selectors.

**Cause:** nine of eleven were `opacity`. Fading text composites it toward the
backdrop, so a colour already chosen to be muted (`--text-secondary`) loses the
contrast it was designed for. `--text-secondary` at full strength measures
4.83 (light) / 6.57 (dark) — better than itself faded, in every case. So the fix
was usually to DELETE the opacity, not to pick a new colour.

The other two were colours no single value could fix across themes:
- the global link `#646cff` measured 4.07-4.09:1 in every theme (just under AA)
- the "Draw" wordmark `#4f6df5` was 3.84:1 on the dark panel

New per-theme tokens: `--link-color`, `--link-color-hover`, `--logo-accent`,
`--danger-text` (`--danger-color` is fine as a fill or icon, but only 3.8:1 as a
label on white).

**Also:** two command-palette chips became outlined rather than filled — a wash
over the row's accent lightened them enough to put their own labels below AA,
and no non-zero alpha cleared it in light mode.

**Scope discipline:** every changed line is a colour, an opacity, or a comment.
The one `.tsx` change removes an `opacity` key from an inline style object and
leaves the rest untouched.

**Test:** `tests/contrast.spec.ts` now sweeps the whole app per theme. It also
asserts the page rendered (>200 elements) before auditing — an early run
reported a clean pass that was really Vite's cold start serving a blank page.

## 2026-07-21 — Button contrast fails WCAG AA (v0.8.133)

### 191. Filled primary buttons failed AA contrast in every state

**Symptom:** reported as a contrast issue when hovering Settings → Done.

**Measured:** the hover was the smaller half — the button failed AA at rest too,
in both themes. Light 3.68 → 3.21 on hover; dark 2.54 → 2.44. At 0.85rem regular
weight there is no large-text exemption.

**Cause (two):**
1. `--primary-color` is tuned for borders, icons and active states, where a
   lighter blue reads better. As a button fill under white text it is 3.7:1.
2. Hover used `opacity: 0.9`. Opacity fades the WHOLE element toward the panel
   behind it, so the fill lightened while the white label stayed white — hover
   *lowered* contrast, the opposite of what a hover affordance should do.

**Fix:** new `--btn-primary-bg` / `--btn-primary-bg-hover` / `--btn-primary-fg`
tokens, kept separate from `--primary-color` so the two roles can diverge. Light
uses a deeper blue + white text; dark inverts to a light accent + dark text
(white on light blue is 2.5:1). Hover swaps the fill instead of fading it, and in
dark mode hovers *lighter* — darkening would drop the surface below 3:1 against
the `#1e1e1e` panel. Results: light 5.17 → 6.70, dark 7.36 → 10.38, all four
states passing text (4.5:1) and non-text (3:1).

**Scope:** the reported button was one of **19** rules across 13 files with the
same `--primary-color` fill + white text combination. All converted.

**Also:** the command palette's category label faded to `opacity: 0.8` on the
highlighted row (3.89:1 light) — a partial concession to the same problem. The
11px uppercase treatment already carries the hierarchy, so the fade is gone.

**Test:** `tests/contrast.spec.ts` measures computed colours per theme and state,
asserting 4.5:1 text, 3:1 surface and `opacity: 1`. Verified to fail against the
original CSS.

## 2026-07-21 — Toasts covering the presentation toolbar (v0.8.132)

### 190. Toasts covered the presentation toolbar and ate its clicks

**Symptom:** while presenting, a pop-up message hid the toolbar buttons behind
it, and pressing a covered button did nothing. The toast then faded, leaving no
sign of why the click was lost.

**Cause:** both are `position: fixed` at the bottom centre — `.toast` at
`bottom: 24px`, the presentation toolbars at `bottom: 40px`, same
`left: 50% / translateX(-50%)` — and the toast has the higher z-index (10010 vs
10000). Measured overlap: **59px**, with the toast's 300px minimum width sitting
over the middle of the bar.

**Fix:** two independent changes, because each addresses a different half.
`.toast` is now `pointer-events: none` (with `.toast-close` opting back in), so
it can never intercept a press; and `bottom` reads
`var(--toast-bottom, 24px)`, which `PresentationCaptureButtons` sets to `110px`
while mounted. That component renders inside both presentation toolbars and
unmounts with their auto-hide, so the offset follows visibility and cannot
diverge between the two toolbars.

**Test:** `tests/recording-capture.spec.ts` — asserts computed `pointer-events`,
that the toast clears the toolbar geometrically, and that a toolbar button still
responds to a plain click while a toast is up. Both assertions were checked to
fail against their own half of the bug.

## 2026-07-21 — Live GIF capture (v0.8.130)

### 189. A failed GIF capture killed the feature until reload

**Symptom:** clicking the GIF button did nothing — and kept doing nothing, for
any duration, on every subsequent attempt.

**Cause:** the capture's `requestAnimationFrame` loop had no error handling. Any
throw inside it (a tainted canvas from a cross-origin image being the likely
one — `getImageData` raises `SecurityError`) killed the loop silently: no toast,
no file, no console trace surfaced to the user. Worse, the capturing flag was
left set, and the buttons are disabled while it's true — so a single failure
made every later click a no-op with no way back short of a reload.

**Fix:** the frame loop and the finish step are wrapped; failures always clear
the flag, log to console, and toast the reason. `SecurityError` gets a specific
message naming the cross-origin image, because "GIF failed" sends people looking
in the wrong place. A capture that produced zero frames reports that rather than
writing an empty file.

**Also:** the live canvas is now looked up via the registered getter *or*
`document.querySelector('canvas')` as a fallback. A hot module reload can leave
the registration on a stale copy of the module while the toolbar imports the
new one — another silent-nothing path, now a toast telling the user to reload.

**Lesson:** state that gates a control (`disabled={busy}`) must be cleared on
every exit path including the throwing one, or one transient failure becomes a
permanent one. See `docs/learnings.md`.

## 2026-07-21 — Record from the presentation toolbar; export shortcut fix (v0.8.129)

### 187. Ctrl+Shift+E did nothing while presenting, then opened on Esc

**Symptom:** pressing Ctrl+Shift+E during a presentation appeared to do nothing.
Pressing Esc to leave the presentation then popped up the Export dialog, long
after the user had moved on.

**Cause:** `<ExportDialog>` is rendered inside `<Menu>`, which sits behind
`<Show when={store.appMode !== 'presentation'}>`. The shortcut set
`showExportDialog = true` against a component that wasn't mounted, so nothing
rendered; leaving presentation mode remounted `<Menu>` and the still-true flag
drew the dialog.

**Fix:** the shortcut now declines during a presentation and says what to do
instead ("Exit the presentation (Esc) to export — or use the Record button…"),
and entering presentation mode clears `showExportDialog` so a dialog left open
beforehand can't reappear on exit either.

**Note:** the general shape — setting UI state that a `<Show>` has unmounted —
applies to anything else hosted inside `<Menu>`. Only the export path is fixed
here because it's the only one with a global shortcut.

### 188. Record button reached only half the presentation toolbars

**Symptom:** the new record button appeared while presenting a deck, but not on
an infinite-canvas document.

**Cause:** there are TWO presentation toolbars — `presentation-controls.tsx`
(paged docs; slide arrows + counter) and `canvas-toolbar.tsx` (infinite canvas;
tools only). The button was added to the first only, and it was verified on a
slides document, so the gap survived review.

**Fix:** added to both. This matters most on the infinite canvas: with no page
bounds the offline page export cannot run at all, so live recording is the only
way to get a video out of that document type.

## 2026-07-21 — My Drawings kept only the latest; startup tool settings (v0.8.128)

### 184. "My Drawings" only ever held the most recent drawing

**Symptom:** save a drawing, File → New, draw and save again — the first drawing
was gone. The library never held more than the latest one.

**Cause:** `saveCurrentToGallery` writes to `activeDrawingId` when one is set,
which is right for re-saving the drawing you have open. `handleNew` never
cleared it, so the save after a New overwrote **and renamed** the previous
entry instead of creating a new one.

**Fix:** made it an invariant rather than a patch at one call site — loading or
resetting a document detaches from the library entry (`loadDocument` clears
`activeDrawingId`), and only `openDrawing` re-attaches, which it already did
right after loading. That covers File → New, open-from-disk, paste-JSON, cloud
load and template restore; all five previously left the pointer dangling.

**Structural note:** the active id moved to its own leaf module
(`storage/active-drawing.ts`) so `app-store` can clear it — `drawings-store`
imports `app-store`, so the dependency could only run the other way.
`drawings-store` re-exports both names, so no caller changed.

### 185. Save, then New, still asked "save or discard?"

**Symptom:** saving to My Drawings and immediately choosing File → New raised
the unsaved-changes dialog for work that had just been saved.

**Cause:** `clearAutoSave()` is what resets `isDirty`, and `performSave` only
called it on the *workspace* path. My Drawings saves never cleared the flag.

**Fix:** `saveCurrentToGallery` calls `clearAutoSave()` after a successful
write. That also drops the crash-recovery slot, which can only be staler than
what was just saved — same as a workspace save.

### 186. Brainstorm toolbar's pen button was pinned to Fineliner

**Symptom:** with the Ink Brush active, no toolbar button was highlighted; and
clicking the pen button silently switched the pen back to the Fineliner.

**Cause:** the compact brainstorm toolbar (`toolbar.tsx`, the layout the app
opens in) is a separate component from the full toolbar's `PenToolGroup`, and
its pen entry was hard-coded to `type: 'fineliner'`. The active check is
`store.selectedTool === tool.type`, so any other pen left it dark.

**Fix:** the entry is marked `penGroup` and resolves its type, icon and click
target from `store.selectedPenType`, matching what the full toolbar's pen group
already did. Pre-existing, but the new Ink-Brush-by-default setting made it
obvious.

## 2026-07-21 — Smart-shape recognition made reliable (v0.8.127)

### 182. Smart shapes only recognised a stroke some of the time

**Symptom:** hold-to-correct worked on one attempt and silently did nothing on
the next, drawing the same shape. Worst with a mouse, where strokes are jerkier.

**Cause:** `recognizeStrokeShape` read the corner count straight off the RDP
simplification and rejected anything with more than 4 corners. RDP leaves
redundant points on straight edges, so even a near-perfect rectangle reported 5
corners and was rejected; with mouse tremor it reported 10. Fit quality was never
the problem — the rectangle scored `polyErr` 2.44 against `ellipseErr` 7.99 and
would have won easily. The count was just unstable, so whether a gesture worked
came down to where the noise happened to land.

**Fix:** the count is no longer trusted. RDP over-supplies corners, then corners
are removed one at a time — each step dropping whichever costs the least fit
accuracy — recording the best polygon at every size. That yields a 3- and
4-corner candidate for any stroke, judged on fit against an absolute error gate.
Supporting changes: triangle-vs-rectangle now decided by whether the stroke
actually turns at the fourth corner (>45°) rather than by an error ratio too
tight to split; `meanEdgeDist` uses segment distance instead of
perpendicular-to-infinite-line, which was flattering bad candidates; the line
test uses mean deviation with max as a backstop plus a path-length check; and
open strokes bail out before polygon fitting.

**Also fixed:** a wide arc could be fitted to a triangle whose third edge was a
chord the user never drew. Open strokes are now only ever recognised as a line.

**Perf:** greedy reduction is O(corners³·points), and a slow deliberate stroke
carrying ~2000 samples cost 22ms — fired from the dwell timer with the pen still
down, where a hitch is felt. Fit scoring now runs on a 240-point even subsample
(every metric is a mean, so the answer is unchanged): 5.4ms.

**Tests:** `frontend/src/utils/shape-recognition.test.ts` — 22 tests including
rate assertions over 100 seeded attempts per shape, because the property that
regressed was reliability across attempts, not any single case.

### 183. Corrected shape stayed selected on top of the drawing

**Symptom:** after a snap the new shape kept its selection handles, which sat
over the sketch the user was still working on.

**Cause:** 0.8.126 kept `setStore('selection', [id])` when it dropped the switch
to the Select tool, so the quick toolbar would still target the new shape.

**Fix:** clear the selection instead. With the pen tool active the handles aren't
interactive anyway (handle-drag and marquee are gated on the Select tool), so
they were purely visual noise. `V` + click selects the shape when wanted.

## 2026-07-21 — Smart shapes keep your pen (v0.8.126)

### 181. Smart-shape snap kicked you out of the pen tool

**Symptom:** hold-to-correct worked, but the moment the stroke snapped the active
tool flipped to Select. Sketching a diagram meant re-picking the fineliner/brush
after every corrected shape.

**Cause:** `fireShapeHold` in `components/canvas.tsx` called
`setSelectedTool('selection')` to "present the corrected shape for editing".

**Fix:** dropped the tool switch — the pen tool stays active and the shape is
still left selected, so the quick toolbar and Properties panel target it.

**Watch out:** the tool switch was doing double duty. The heal-on-move path
re-opens a stroke when a pointer-driven stylus is in contact but `isDrawing` is
false, gated on `isPenDrawingTool()` — going false was what stopped a
still-touching Surface/Wacom pen from laying down a stray mark right after the
snap. `smartShapeSuppress` only covered the iPad TouchEvent path. It is now set
unconditionally after a snap, and its reset moved out of the pen-only branch of
`handlePointerDown` so a mouse-driven snap can clear it too.

## 2026-07-19 — Connector routing channels (v0.8.110)

### 174. Connector endpoints piled onto a single anchor

**Symptom:** several arrows meeting the same side of a shape (a hub) all landed on
the same point and drew on top of each other; you couldn't tell them apart.

**Cause:** each endpoint resolved independently to the shape's anchor, with no
awareness of the other endpoints sharing that side.

**Fix:** `utils/connector-routing.ts` — endpoints on a side are distributed into
evenly spaced ports, ordered by the neighbouring shapes' positions so the lines
don't cross. Applied transiently during refresh; anchor fractions are not persisted.

### 175. Endpoints stayed on a stale side after moving a shape

**Symptom:** moving connected shapes to the other side of a node left the connector
starts on the original edge, so lines doubled back. Intermittent — it only bit when
two or more connectors shared a side.

**Cause:** the first implementation derived the side from the persisted
`anchorFractionX/Y`, which is written once at connect time. After a move it was
stale, and it overrode `resolveBindingPoint`'s dynamic re-facing.

**Fix:** derive the side from which neighbour the endpoint faces (node centre →
opposite element), which is inherently move-aware.

### 176. Two connectors could land on the same port after a drag

**Symptom:** dragging one spoke of a hub put its connector on top of a peer's
endpoint, and it stayed that way until an unrelated edit.

**Cause:** port assignment is a *group* function, but only connectors bound to the
moved element were refreshed, so peers kept ports sized for a stale group. The old
sibling-spread was pair-local, so the existing invalidation had been sufficient.

**Fix:** `expandToPortGroups()` in `utils/binding-logic.ts`, applied at the
interaction boundaries where group membership/order changes — drag
(`selection-handler`) and connector creation (`draw-handler`, `minor-handlers`).

### 177. Connector routes drifted after unrelated edits

**Symptom:** moving a shape away and back did not restore the original routes;
geometry depended on edit history.

**Cause:** the canvas refresh effect visited nodes in arbitrary order, so a
connector could route against a peer's previous-frame geometry.

**Fix:** refresh is de-duplicated and processed in ascending id order. Because
connector avoidance only consults lower ids, each pass is a fixpoint of the current
shape positions. (Expanding port groups inside the reactive effect was tried and
reverted — it caused a re-entrant refresh storm.)

### 178. Connector avoidance silently disabled by over-eager filtering

**Symptom:** two elbow connectors ran fully along each other (475px of overlap)
despite the avoidance feature.

**Cause:** the obstacle filter clipped **per segment** to the route's own start→end
box. A detour by definition leaves that box, so the filter dropped exactly the
segments that needed avoiding.

**Fix:** filter per connector (bbox reject) and never per segment, plus a hard cap
on obstacle count so a busy document can't inflate the A* grid until the router
exhausts its iteration budget and falls back to a naive elbow.

### 179. `bun run dev` failed to compile AssemblyScript

**Symptom:** `[assemblyscript] Compilation failed: /bin/sh: 1: npx: not found`, and
the `.wasm` was never built.

**Cause:** the Vite plugin shelled out to `npx asc`; in a bun-only environment
neither `npx` nor `node` is on `PATH`.

**Fix:** `frontend/src/wasm/vite-plugin-as.ts` runs the local compiler entry with
`process.execPath` (the runtime already running Vite), falling back to `npx`.

### 180. WASM memory pool detached an already-created buffer view

**Symptom:** latent — with WASM batch rendering enabled, element bounds writes were
silently discarded and elements could vanish from the canvas.

**Cause:** `initMemoryPool` created each `Float64Array` view immediately after its
allocation. Adding a fourth buffer meant a later `__new` grew the heap, detaching
the earlier `elementBuffer` view. `refreshViews()` had no callers.

**Fix:** allocate every buffer first, then build all views via `refreshViews()`.


## 2026-07-18 — Google Drive sign-in popup hung on "Connecting…"

### 173. Service worker served the app shell for the OAuth callback page

**Symptom:** After completing Google sign-in, the OAuth popup at
`/oauth-callback.html?state=…&code=…&iss=…` showed the main YappyDraw loading
screen (bicycle logo) instead of the tiny dark "Connecting…" page — its
`<script>` never ran, no auth code was posted back, and the parent dialog was
stuck on "Connecting…" forever.

**Cause:** the PWA workbox service worker registered `navigateFallback:
'index.html'` with **no `navigateFallbackDenylist`**. `oauth-callback.html` is
precached under the query-less key `/oauth-callback.html`, but the callback
returns as a *navigation* request carrying an OAuth query string. Workbox's
default `ignoreURLParametersMatching` only strips `utm_*`/`fbclid`, so the
query-laden URL failed to match the precache, fell through to the navigation
route, and was served the precached `index.html` app shell.

**Fix:** added `navigateFallbackDenylist: [/oauth-callback\.html/]` in
`vite.config.ts` (matched against `url.pathname`, so the query string is
irrelevant). The callback navigation now bypasses the app-shell fallback and is
served from network/precache as the real static page, so its script posts the
auth code back to the opener. NOTE: existing clients hold the old SW
(`registerType: 'prompt'`) — they pick up the fix on the next version-tap hard
refresh / SW update, not automatically.

## 2026-07-16 — `createLine`/`createRectGrid` sprouted stray arrowheads

### 172. Scriptable plain lines defaulted to an arrowhead

**File:** `frontend/src/api.ts` (`createElement`).

**Symptom:** construction scaffolds built with `Yappy.createRectGrid(...)` (and any
`Yappy.createLine(...)`) rendered little chevron/arrowhead end-caps on their outer
lines — wrong for guides/grids, and inconsistent with the *interactive* line tool,
which draws a plain line (the separate **arrow** tool is what adds a head).

**Cause:** `createElement` fell back to `endArrowhead: … ?? 'arrow'` for **every**
element type, so lines/beziers created via the API inherited an arrowhead the
line/polyline tool handlers (`polyline-handler.ts`, `draw-handler.ts`) never set.
Tell-tale: five existing logo specs (`propeak-1`, `algorisys-logo`,
`algorisys-poster`, `mono-logo`, `propeak-variations`) all manually passed
`startArrowhead:null, endArrowhead:null` to `createLine` — a standing workaround.

**Fix:** default the head only for the arrow type —
`endArrowhead: … ?? (type === 'arrow' ? 'arrow' : null)`. Plain lines, beziers and
non-connector shapes are now headless by default; `createArrow` (type `'arrow'`)
still gets its head, and an explicit `endArrowhead` override still wins. Covered by
`tests/line-arrowhead-default.spec.ts`.

## 2026-07-16 — Random text pasted on click (Linux middle-click)

### 171. Accidental middle-click dumped the X11 primary selection into a text label

**Files:** `frontend/src/components/text-editing-overlay.tsx`, `frontend/src/components/rich-text-editing-overlay.tsx`.

**Symptom (user-reported):** "sometimes randomly when I click, some previous random things get
pasted in text."

**Cause:** on Linux/X11, middle-clicking inside a focused editable pastes the **PRIMARY selection**
— whatever text was last *highlighted* anywhere (this canvas, another window, the URL bar), with no
Ctrl+V. Both on-canvas editors are real editable DOM nodes (a `<textarea>` and a `contentEditable`
div) with no middle-click guard, and the app's global paste handler deliberately steps aside for
editables (`app.tsx:826`), so the stray primary paste flowed straight in. Intermittent because it
only happens while editing a label AND when a middle-click lands (scroll-wheel press, tilt-wheel, or
a trackpad/WM gesture mapped to button 2).

**Fix:** both editors now `preventDefault()` a button-1 (middle) `mousedown`/`auxclick`, which blocks
the X11 primary paste. Ctrl/Cmd+V and right-click→Paste are untouched. Covered by
`tests/paste-guard.spec.ts` (asserts a middle-button mousedown on the editor is defaultPrevented while
a left-button one is not; fails on the old code). Note: headless Chromium has no PRIMARY buffer, so
the test verifies the guard fires rather than pasting for real.

## 2026-07-16 — Behaviors panel buried under the slide-navigator on game docs

### 170. Non-Blueprint (behaviors) games: the builder panel's left half was unclickable

**Files:** `frontend/src/store/dock-layout.ts` (`togglePanel` default float position),
`frontend/src/components/dock/dock-container.tsx` (floating fallback), plus stale-test repairs in
`tests/behaviors-panel.spec.ts` and `tests/behaviors-header-fit.spec.ts`.

**Symptom (from checking the non-Blueprint game path):** the behaviors *engine* is healthy — Pong /
Catch / Platformer compile and run with no errors (12/12 `behaviors-builder.spec.ts` pass). But the
**Behaviors (Game Builder) panel** couldn't be fully used on a game document: clicks on its left
portion (the Sprite/Scene/Vars/Code tabs, WHEN/DO selects, reorder buttons) did nothing.

**Cause:** floating dock panels open at a default `floatX: 140` (`togglePanel`), but the
slide-navigator is a `position: fixed`, 240px-wide left column at **z-index 1000** whose list area
(`.slide-list-container`, `pointer-events: auto`) intercepts pointer events, while floating panels
sit at **z-index 45**. Game docs are paged (`isPagedDocType('game') === true`), so the navigator is
present and covered the panel's left ~100px. `elementFromPoint` over a tab returned the navigator; a
`{force:true}` click worked, confirming the content was fine and only the stacking/position was wrong.

**Fix:** default floating panels now open at `floatX: 260`, clearing the 240px navigator column
(also updated the dock's render-time `?? 140` fallback to `260`). Persisted panel positions are
unaffected (only first-open uses the default). New regression `tests/behaviors-panel-overlap.spec.ts`
asserts the panel's left edge clears the column (x ≥ 240; fails at x=141 on the old code). Separately,
three specs in `behaviors-panel.spec.ts` and one in `behaviors-header-fit.spec.ts` had been silently
failing since the v0.8.61 dock migration (they targeted the removed `.behaviors-panel` wrapper class);
repointed them at `.dock-panel[data-panel-id="behaviors"]`. **Noted, not changed:**
`store.showBehaviorsPanel` is orphaned dead state after that migration (the panel is driven through
`setPanelOpen('behaviors', …)`).

## 2026-07-16 — Blueprint Slingshot felt "broken": bird nearly ungrabbable

### 169. Sprite `tap` was a bare AABB — a few-px miss on a small sprite did nothing

**Files:** `frontend/src/game/blueprint-to-script.ts` (`tap` case, new `TAP_GRAB_PAD`).

**Symptom (user-reported):** the Blueprint Slingshot game "seems broken" — the bird sits on the
sling and dragging it does nothing. The game **renders and its logic is fine** (launch, collision,
pig removal, and the win rule were all verified end-to-end with real mouse input and zero console
errors).

**Cause:** the drag-launch mechanic is gated entirely by an `aiming` variable that is set **only**
by a sprite `tap`, and the compiled sprite-tap was a strict axis-aligned box test
(`px >= _me.x && px <= _me.x + _me.width && …`). The Slingshot bird is a **40×40** circle
(`blueprint-examples.ts:217`), so pressing even ~10px off it set nothing — no aim, no launch, no
feedback. Casual drags that grabbed slightly off-centre produced total silence, i.e. "broken".

**Fix:** added an 18px `TAP_GRAB_PAD` grab margin to the sprite-tap hit-test, so small sprites are
forgiving to grab (also helps touch input). Applies to every Blueprint game's sprite taps, not just
Slingshot. Covered by a new near-miss test in `tests/blueprint-games.spec.ts` (presses 10px outside
the bird's box and asserts it still launches; fails on the old code — the bird never moves).
**Not changed (optional polish noted for later):** `POWER = 7` makes aiming touchy, and there's no
aim-line while `aiming` is set — both would further reduce the "nothing happened" feel.

**Follow-up (same sample, user-requested polish):** the sample looked bare — the "sling" was a
single vertical `Post` (a plain stick with the bird balanced on top), and there were no hurdles.
Added (a) a Y-fork: two angled prong rectangles (`ForkL`/`ForkR`, `angle: ∓0.42`) around the trunk
so it reads as a slingshot with the bird in the crook, and (b) a 2×2 wall of destructible wooden
blocks (`Block1..4`) guarding the pigs, each with a `hit → destroy + score(250) + 'hit' sound` rule
(no effect on the pig counter / win rule). The runtime has no solid-collision/bounce, so blocks are
destructible-on-contact rather than solid obstacles. Verified by screenshot + a block-smash test in
`tests/blueprint-games.spec.ts`.

**Follow-up 2 (user: "the sling thread is missing"):** the fork had no elastic bands. The existing
action set couldn't express a stretching band — `rotate` is a relative delta and `scale` a factor,
so there was no way to set an element's absolute angle/length per frame. Added a new **`tether`**
action (`{ kind: 'tether'; ax; ay; target }`) to the shared model — it renders a sprite as a thin
bar from a fixed anchor `(ax, ay)` to a target sprite's centre, re-fitted each tick; a general
connector (bands, ropes, beams, links). Files: `behavior-types.ts` (union), `behaviors-to-script.ts`
(`emitAction` case + `_tether` preamble helper, shared by the behaviors AND blueprint compilers),
`behavior-ui.ts` (picker label + default), `behavior-editors.tsx` (param UI). The sample gained two
`Band` sprites, each with its own graph that tethers it from a fork tip to the bird while a new
`launched` var is 0, and hides it after release; the bird's release/reset chains toggle `launched`.
Verified by screenshots (rest + mid-aim) and a bands test (rest opacity 100 / width re-fit from the
6px placeholder to ~56; opacity 0 after launch).

**Follow-up 3 (user: "the Blueprint pulling/gravity isn't like the non-Blueprint version"):** the two
samples had drifted apart — the code Slingshot (`game-templates.ts`) uses `POWER 10.5`, `GRAV 1600`,
anchor `X+150/GROUND-100`; the Blueprint one used `POWER 7`, the global `GRAV 2200`, anchor
`X+130/GROUND-120`. Matched POWER and anchor. Gravity couldn't be matched before: `GRAV` is a single
global constant in the generated preamble (Platformer jump heights are tuned to 2200), and velocity
isn't readable via any data node, so manual integration in the blueprint was impossible. Added a
general **per-sprite gravity**: the `gravity` action gained an optional `strength` (px/s²) that
overrides the global default for that sprite (`_gravG` map; the tick integrator uses
`_gravG.get(id) ?? GRAV`). The Blueprint bird now uses `strength: 1600`, matching the code version's
fall; other sprites/games are unaffected. Verified by `tests/game-gravity.spec.ts` (a light-gravity
sprite falls ~4.4× less than a default-gravity one; fails on the old code where both fall identically).
**Still not matched (blueprint-model limit):** the code version clamps the pull to `MAXPULL 145`; a
distance clamp needs `hypot`/`min` math the blueprint's `math` node (only `+ - * /`) can't express, so
the Blueprint pull is still unbounded. Noted for a future math-node/clamp primitive.

**Also found, not yet fixed (game engine sweep):** `tests/behaviors-panel.spec.ts` (all 3) is stale
since the v0.8.61 dock migration removed the `.behaviors-panel` wrapper class its selectors target;
and the `slide-navigator` (`position:fixed; z-index:1000`) overlaps the floating Behaviors panel's
default position and can swallow clicks. The panel itself renders. `store.showBehaviorsPanel` is now
orphaned (dead) after that migration.

## 2026-07-16 — New mindmap nodes (Tab/Enter) lost the parent's fonts & style

### 168. Tab/Enter-created mindmap node reverted to tool defaults instead of inheriting style

**Files:** `frontend/src/store/app-store.ts` (`addChildNode`, `addSiblingNode`),
`frontend/src/utils/object-context-actions.ts` (`getStyleSnapshot`).

**Symptom (user-reported):** pressing Tab (add child) or Enter (add sibling) on a styled node
created a node that did **not** carry the parent's font, size, bold/italic, text alignment/colour,
fill style, or rounding — it fell back to the current tool defaults.

**Cause:** both functions hand-picked a *partial* set of properties to inherit
(strokeColor/backgroundColor/fillStyle/strokeWidth/roughness/renderStyle/opacity/strokeStyle) and
omitted **all font/text styling** and roundness (they even forced `roundness: null`). So only colour
and fill carried over; typography did not.

**Fix:** both now spread the canonical `getStyleSnapshot(source)` — the same "what counts as style"
list used by Copy/Paste Style and Graphic Styles — then re-apply the depth-based branch tapering
(stroke colour/width/opacity) on top, preserving the mindmap's visual hierarchy. Also extended
`getStyleSnapshot` with the font/text keys it was missing (`fontWeight`, `fontStyle`,
`verticalAlign`, `letterSpacing`, `textColor`), which additionally fixes a latent gap where Copy
Style / Graphic Styles silently dropped bold/italic/text-colour. Covered by
`tests/mindmap-inherit.spec.ts` (child + sibling inheritance fail on the old code; a third test
asserts branch tapering is *not* clobbered).

## 2026-07-16 — Text auto-size unreachable and non-sticky

### 167. "Auto Resize" never shown for text; resizing an auto-width text box didn't stick

**Files:** `frontend/src/config/properties.ts`, `frontend/src/store/app-store.ts` (`needsTextRefit`,
`autoSizeTextUpdates`, `updateElement`), `frontend/src/utils/tool-handlers/selection-handler.ts`.

**Symptom (user-reported):** "autoresize is not visible in property window?" — confirmed: the toggle
rendered for a rectangle-with-label but never for a `text` element.

**Causes (three, stacked):**
1. `properties.ts` declared the `autoResize` toggle with an `applicableTo` list of ~200 shape types
   that **omitted `'text'`/`'richtext'`**, so the panel's `applicableTo` filter dropped it. The mode
   was therefore fixed at creation time — click → auto-width, drag → fixed-width
   (`minor-handlers.ts`) — and unchangeable by any means afterwards.
2. Resizing an auto-width text wrote a new width, but nothing cleared `autoResize`, so the renderer
   kept refusing to wrap and `commitText` (already guarded on `el.autoResize`) re-hugged the box on
   the next edit — the width silently snapped back. The `lm/rm` branch also computed a *wrapped*
   height that contradicted the non-wrapping renderer.
3. Flipping the toggle wouldn't have re-fitted the box anyway: `updateElement` gated the re-fit on
   `FONT_METRIC_KEYS.some(...)`, a **duplicate** of the condition inside `autoSizeTextUpdates`, so an
   `autoResize`-only patch never reached it.

**Fix:** added `'text'`/`'richtext'` to `applicableTo`; side-handle (`lm`/`rm`) resize now sets
`autoResize: false`, converting auto-width → fixed-width as in Figma (which also makes the wrapped-height
measurement true); and collapsed the duplicated trigger into one `needsTextRefit(updates)` predicate used
by both `updateElement` (as its cheap gate before the O(n) lookup) and `autoSizeTextUpdates`, now also
firing on `autoResize` so the box re-fits when the mode flips. Covered by `tests/text-autosize.spec.ts`
(all 3 fail on the old code). **Not fixed / still open:** single-select resize keeps font size constant
while multi-select resize scales it (`selection-handler.ts`) — same gesture, different result; and there
is no third "fixed size" (clip) mode.

## 2026-07-16 — Alt+Enter with nothing selected only shuffled the top-right icons

### 166. Toggling Properties with an empty selection moved two buttons and nothing else

**Files:** `frontend/src/store/app-store.ts` (`propertyPanelTarget`, `isPropertyPanelVisible`,
`togglePropertyPanel`), `frontend/src/components/property-panel.tsx`, `frontend/src/components/menu.tsx`.

**Symptom (user-reported):** with nothing selected, Alt+Enter made the palette/theme buttons in the
top-right slide ~290px left/right — no panel ever appeared.

**Cause:** two conditions had drifted apart. The panel renders on
`showPropertyPanel && (activeTarget() || isPropertyPanelMinimized)`, and `activeTarget()` returns
`null` for the Select/Pan tool with an empty selection — so nothing rendered. But `propPanelOffset`
in `menu.tsx` shifted the fixed top-right controls off `store.showPropertyPanel` **alone**, so the
flag flipping was visible *only* as those buttons moving to clear a header that wasn't there.
(The panel's own `"No Selection"` fallback was unreachable dead code — the outer `Show` already
required a target.)

**Fix:** hoisted `activeTarget` into the store as `propertyPanelTarget()` so panel and menu share one
source of truth, and keyed `propPanelOffset` off a new `isPropertyPanelVisible()` (flag AND a target)
instead of the raw flag. `togglePropertyPanel` now falls back to **Canvas properties** when it would
otherwise show an empty panel, so the toggle always does something visible; it clears
`showCanvasProperties` on close, and `selection-handler` already clears it on empty-canvas click, so a
later deselect can't resurrect it. Regression test in `tests/hotkeys.spec.ts` (asserts the panel is in
the DOM, not just that the flag flipped — the old assertion passed against the bug).

## 2026-07-14 — Boolean-result hard to select + Shift-constrained move

### 164. Unfilled boolean/compound result only selectable by its outline (had to marquee)

**Files:** `frontend/src/utils/hit-testing.ts` (`hitTestPathElement`).

**Symptom (user-reported):** after Unite/Intersect/etc., the resulting shape was hard to click —
you had to drag a marquee around it. **Cause:** the path fill hit-test only counted an interior
hit when the element had a visible `backgroundColor` (`fillable`), so an *unfilled* result (transparent
fill, common when the operands were unfilled) was grabbable only on its stroke outline — unlike
rectangles/circles/etc., which select anywhere inside their bounds regardless of fill.

**Fix:** drop the `fillable` gate — a **closed** subpath's interior counts as a hit even when unfilled
(even-odd across subpaths still handles holes), matching every other shape. Narrow-phase only (JS),
so no WASM change (the WASM path does bbox broad-phase, which is unchanged).

### 165. Shift+drag couldn't move a selected element (instantly deselected it)

**Files:** `frontend/src/utils/tool-handlers/selection-handler.ts`, `pointer-state.ts`.

**Context:** added **Shift+drag = axis-constrained move** (horizontal/vertical/45°, keeping the drag
length — great for logos). But Shift+**pointer-down** on an already-selected element toggled it *out*
of the selection immediately, so the move set was empty and nothing moved.

**Fix:** defer the modifier-toggle. Shift/Ctrl/Cmd on an already-selected element keeps it selected and
records a `pendingShiftDeselect`; on pointer-up, if the pointer didn't drag (< slop) it was a
modifier-*click* → toggle it out then; if it dragged, it was a move (Shift → constrained via
`constrainToAngle(…,45)`). Illustrator/Figma parity.


## 2026-07-13 — Native colour picker couldn't be dragged in the APPEARANCE fill/stroke rows

### 162. `<input type="color">` popup wouldn't drag in the Appearance stack editor

**Files:** `frontend/src/components/property-panel.tsx` (`AppearanceEditor`).

**Symptom (user-reported):** open a per-fill/stroke row's colour swatch (the browser's native
`<input type="color">` popup — SV square + hue bar + R/G/B fields), and dragging the crosshair in
the SV square did nothing / kept resetting.

**Cause:** same root cause as fix #114 (recolor). `editFill`/`editStroke` rebuild *every* fill/stroke
object on each `onInput` tick, and the rows were rendered with reference-keyed `<For>`. New object
identities each tick → `<For>` disposed and recreated each row's DOM, destroying the open native
colour input mid-drag, so the drag never registered.

**Fix:** render both the fills and strokes lists with `<Index>` (keys by position, reuses the DOM
nodes) instead of `<For>`. The native picker's element now survives a live drag. Callbacks updated
for Index's accessor-item / numeric-index signature.

## 2026-07-13 — Sketch-mode hatch/zig-zag fill bled outside the shape

### 161. Zig-zag / hachure fill lines overshot the outline (intermittent, sketch style)

**Files:** `frontend/src/shapes/base/render-pipeline.ts`.

**Symptom (user-reported):** filling a shape with a **zig-zag / hachure** style, the fill lines
sometimes extended slightly **beyond the shape outline**, and at other times rendered correctly —
inconsistent, not every-time.

**Cause:** the intermittency was the tell. In **architectural** mode the hatch fill is drawn by the
clean, shape-**clipped** `applyHatchFill`. In **sketch** mode the fill was left to **RoughJS**
(`buildRenderOptions` kept `fill` set for hatch styles, and `applyComplexFills`' clipped hatch was
gated to architectural). RoughJS's hachure/zig-zag fill is **unclipped**, and with `roughness` its
randomized line endpoints overshoot the polygon edge by a few px — the overshoot varies with the
element `seed`, so the same shape looked fine or bled depending on its seed (→ "sometimes proper").

**Fix:** route the hatch fill through the clean, clipped path in **both** render modes:
- `buildRenderOptions` now suppresses RoughJS's own `fill` for **all** `HATCH_FILL_STYLES`
  (hachure / cross-hatch / zigzag / zigzag-line / dashed), not just architectural.
- `applyComplexFills`' `useHatch` no longer requires architectural, so `applyHatchFill` (which
  `clip()`s to the shape/`clipPath`s the geometry) draws the fill in sketch mode too.
The **sketchy outline stroke is still drawn by RoughJS** — only the fill hatching is now clean and
clipped, so it can no longer bleed. Fixes all five hatch styles at once. Change is gated on the fill
style, so solid/gradient/dots/image/mesh/pattern fills (already clipped) are untouched.

## 2026-07-13 — Right-clicking an existing group offered "Group" instead of "Ungroup"

### 160. Context menu showed "Group" prominently on an already-grouped selection

**Files:** `frontend/src/utils/context-menu-builder.ts`.

**Symptom (user-reported):** grouping elements, then right-clicking the group, showed **Group** near
the top of the context menu — reading as a bug, since the thing is already grouped. Expected
**Ungroup**.

**Cause:** clicking a grouped element selects all its members (`selectionCount > 1`), so the menu
pushed "Group" unconditionally (gated only on `selectionCount > 1`). "Ungroup" *was* also added, but
~68 lines lower — after the Pathfinder / Compound Shape / Dimensions submenus — so the prominent
"Group" is what the user saw. The two grouping actions weren't aware of each other.

**Fix:** hoisted the grouped-detection above the grouping block and added `isFullyGrouped` (every
selected element shares one common outer group id ⇒ the selection *is* a single existing group). When
`isFullyGrouped`, the top grouping slot now shows **Ungroup** instead of Group (re-grouping an
existing group just nests it, rarely wanted). The buried Ungroup now only appears for a *mixed*
selection (a group + loose elements / several distinct groups), where Group up top is still valid —
so it's never duplicated.

## 2026-07-13 — Swarm of green connector arrows on a grouped/multi-selection

### 159. Quick-connect ports drawn N×4 times across a multi-selection

**Files:** `frontend/src/utils/selection-renderer.ts`.

**Symptom (user-reported):** grouping / multi-selecting several elements (e.g. an imported icon such
as a trophy = many path parts) covered the selection in dozens of green circle-with-arrow handles —
one set of 4 per child element. Cluttered and confusing, though each handle was still individually
draggable.

**Cause:** the connector quick-connect ports are drawn inside `renderElementOverlays`, which runs
once per element (`canvas-renderer.ts`). The connector block was gated only on element type +
`selectedTool === 'selection'`, **not** on `selectionLength === 1` — so every selected element in a
group painted its own 4 ports (N×4 total). Same class of bug as #157 (path-anchor squares on a
multi-selection): sibling handle blocks (resize handles, path anchors) already gate on
`selectionLength === 1`; the connector block was simply missed.

**Fix:** added `&& selectionLength === 1` to the connector-handle guard, matching the adjacent
path-anchor and resize-handle blocks. Quick-connect ports now appear only for a single selected
element — the only case where connecting from a specific shape (rather than a whole group) is
meaningful. One-line change + explanatory comment.

## 2026-07-13 — AI in-progress indicator vanished mid-operation

### 158. AI "…" toast auto-hid after 3s while the operation was still running

**Files:** `frontend/src/ai/canva-ai.ts`.

**Symptom (user-reported):** starting an AI image op (Remove/Replace Background, Magic Edit/Expand,
image generation) briefly flashed a "Removing background…" message that disappeared after a few
seconds, then the result popped in much later — so for most of the wait the screen looked idle with
no sign work was happening.

**Cause:** the in-progress messages were shown as `showToast('…', 'info')`, whose default duration is
3000ms. Every AI edit takes longer than that, so the indicator auto-hid long before the async
`fetch` to OpenAI resolved. The app already had a `'loading'` toast type (duration 0 ⇒ no auto-hide,
spinning `Loader2` icon, pinned bottom-center) built for exactly this — it just wasn't being used.

**Fix:** switched all six in-progress toasts (`magicWrite`, `generateImage`, `magicEditImage`,
`replaceBackground`, `expandImage`, `removeBackground`) to `type: 'loading'`. The spinner now
persists for the whole operation and is replaced by the terminal success/error toast on completion.
Because a `loading` toast never auto-hides, audited every exit path: added an `errored` flag +
`hideToast()` to `magicWrite`'s no-op case (all targets returned empty text, no error), and an error
toast to `expandImage`'s rare "no canvas 2D context" return. All other paths already ended in a
success/error toast that replaces the spinner.

## 2026-07-13 — Baked stick figure shows un-draggable path anchor squares; figures drop too large

### 157. Anchor squares appear on a grouped/baked figure but can't be node-edited

**Files:** `frontend/src/utils/selection-renderer.ts`, `frontend/src/library/stick-figures/index.ts`.

**Symptom:** clicking **Bake** on an animated stick figure (or selecting any dropped figure) showed
small rectangles (path node handles) all over the shape, but they couldn't be grabbed to
reshape/morph the path. Separately, figures dropped from the library were larger than expected.

**Cause:** a draw/edit gate mismatch. `selection-renderer.ts` drew the editable-path anchor squares
for **every** selected `path` element (`el.type === 'path' && selectedTool === 'selection'`), with
no single-selection check — but node hit-testing/dragging is gated on `selection.length === 1`
(`handle-detection.ts`). A baked/dropped figure is a **group of many path parts**, so selecting it
makes `selection.length > 1`: every part rendered its squares, yet none were hit-testable. (Clicking
a grouped element always selects the whole outermost group, so the count is never 1 while grouped.)

**Fix:**
- Gate the anchor-square drawing on `selectionLength === 1`, matching the hit-test gate — squares now
  appear **iff** they're editable. To node-edit a baked figure, ungroup it and select a single part
  (or use the **Reshape** tool, which bends whichever part you grab). No more dead handles on a group.
- Reduced `STICK_DEFAULT_WIDTH` 130 → **110** (figure viewBox 140×260 ⇒ ~110×204), so library drops
  land at a more reasonable size next to ~120px icon inserts.

## 2026-07-13 — 3D Extrude on an image loses the bitmap when tilted / beveled / expanded

### 156. Tilted/beveled/expanded image extrude renders a flat base colour instead of the image

**Files:** `frontend/src/utils/extrude.ts`, `frontend/src/store/app-store.ts`.

**Symptom:** applying **3D Extrude & Bevel** to an image and then giving it a **Tilt X/Y** or a
**Bevel** (or running **Expand to Faces**) replaced the image's front face with a solid **base
colour** rectangle — the picture vanished. A non-tilted, non-beveled extrude was fine (the normal
image render still drew the front).

**Cause:** when the extrude *owns the front* (`extrudeOwnsFront` → tilt or bevel), the caller skips
the element's normal render and `extrude.ts` draws the front itself. `drawFront` /
`drawBevelFront` unconditionally **filled** the (foreshortened) outline with `baseColor(el)`,
never consulting the bitmap. `expandExtrude` likewise baked the front via `buildPathFromPoly` as a
solid-fill path.

**Fix:**
- **Live render** — new `drawImageFront()` helper: for `type === 'image'` with a loaded bitmap
  (`getImage`), clip to the front outline (full face, or the bevel-inset ring) and `drawImage`
  through the front-face world transform — element rotation, then a world-axis foreshorten about
  the centre (the exact map `tilted()` applies to the outline), honouring `el.crop`. `drawFront`
  and `drawBevelFront` call it first and only fall back to the flat base fill for non-image shapes
  (or while the bitmap is still loading). `extrudeGeometry` now also returns the foreshorten
  factors `fx`/`fy`.
- **Expand to Faces** — for image elements, the front face is emitted as a real **image element**
  (bitmap preserved) instead of a flat path: untilted/bevel-only keeps the original image geometry
  exactly; tilted fits the bitmap to the foreshortened front bbox.

**Verified:** Playwright — tilted and beveled extrudes sample the image's saturated colours on the
front face (not a flat fill); Expand yields 2 path faces + 1 image front, source removed.

## 2026-07-12 — Animation presets (drawIn/shakeX/…) not working on paths & groups

### 155. drawIn/drawOut invisible on freehand strokes; broken on SVG `path`; presets unavailable on groups

**Files:** `frontend/src/shapes/base/shape-renderer.ts`,
`frontend/src/shapes/renderers/specialty-shape-renderer.ts`,
`frontend/src/shapes/renderers/freehand-renderer.ts`,
`frontend/src/components/animation-panel.tsx`.

**Symptom:** applying entrance presets like `drawIn` / `shakeX` did nothing (or made the element
pop in at the end) on freehand strokes, SVG pen `path` elements, and grouped/multi-selected
elements.

**Causes (three distinct):**
1. **Freehand** (`fineliner/inkbrush/marker/ink`): `FreehandRenderer.render()` overrode the base
   and never checked `drawProgress`. `drawIn` sets `opacity:0` and animates `drawProgress` 0→100,
   so the stroke rendered fully but invisibly, then popped in on completion. (The renderer already
   had `definePath`/`estimatePathLength`, so the base reveal was ready to use — just unwired.)
2. **SVG `path`** (via `SpecialtyShapeRenderer`): base `renderDrawProgress` traced the reveal
   stroke with `beginPath()+definePath()+stroke()`. For these shapes `definePath` lays down a
   self-contained `Path2D` (`renderGeometry`→`fillPath`), which does **not** append to the current
   path — so the dashed reveal stroke drew nothing (element stayed hidden by `opacity:0`).
3. **Groups**: a group is a multi-selection (shared `groupIds`, no container element), so the
   Animation panel routed to the "Stagger" branch, whose preset list excluded
   `drawIn/drawOut/shakeX/shakeY/revolve/glitch`, and whose preview used a hardcoded property-tween
   shim that couldn't express those effects.

**Fix:**
1. Wired the `drawProgress` branch into `FreehandRenderer.render()`.
2. Extracted the reveal stroke into an overridable `ShapeRenderer.traceDrawStroke()`;
   `SpecialtyShapeRenderer` overrides it to stroke the SVG `d` directly via
   `renderer.strokePath(d)` (honoring the active `lineDash`), using `geometryToDs()`.
3. Expanded `STAGGER_PRESETS` to mirror `COMMON_PRESETS`, and rewrote `handlePlayStagger` to run
   the real preset function per element (via `sequenceAnimator.playAnimation`) with per-member
   stagger delays — so a group animates each member with the genuine effect. (`handleApplyStagger`
   already persisted the preset onto each member.)

## 2026-07-12 — Layer panel & dock fixes (contrast, copy linkage, tray icons, first-open flash)

### 156. Layer-toolbar New-Group / Add-layer icons render as black blocks; unstyled buttons black on dark-mode OS

**Files:** `frontend/src/components/layer-panel.css`, `frontend/src/index.css`.

**Symptom:** the Folder (New Group) and Plus (Add layer) buttons in the layer toolbar showed as
solid near-black rounded rectangles with no contrast (esp. in light theme on a dark-mode OS).

**Cause:** `.icon-button` had **no CSS rule anywhere**, so it fell back to the bare `<button>`
default. `index.css` still carried leftover Vite boilerplate — a 3rd `button {}` block with
`background-color: #1a1a1a`, only overridden by `@media (prefers-color-scheme: light)`. So every
unstyled button went near-black whenever the OS wasn't in light mode, regardless of app theme.

**Fix:** added a themed `.layer-toolbar .icon-button` rule (CSS vars, hover, disabled). Changed the
stale `button` default `#1a1a1a` → `var(--btn-bg)` + `color: var(--text-primary)`, and removed the
`@media (prefers-color-scheme: light) button { background: #f9f9f9 }` override so the app theme
(`--btn-bg`), not the OS, governs bare buttons. (Same class as #154.)

### 157. Duplicating a layer linked the copy to the original (move one → both move)

**Files:** `frontend/src/store/app-store.ts`.

**Symptom:** after "Duplicate" on a layer, selecting/moving an element in the copy also moved the
matching element in the original — they behaved as one.

**Cause:** `duplicateLayer` deep-cloned elements and remapped `id`, `layerId`, bindings and
`parentId`, but **not `groupIds`/`clipMaskId`**. The copies kept the originals' group ids, so the
selection handler (which selects every element sharing the outermost groupId) grabbed both the
original's and the copy's members together.

**Fix:** remap each distinct original group id (and `clipMaskId`) to a fresh id, consistently across
the duplicated members, so the copied layer's groups are independent.

### 158. Layer swipe-tray action icons too small

**Files:** `frontend/src/components/layer-panel.tsx`.

**Symptom:** the three swipe-tray buttons (Lock / Duplicate / Delete) had undersized glyphs in their
44px buttons.

**Fix:** bumped the tray icon size `15` → `20`.

### 159. First Alt+L (open Layers) flashed/"refreshed" the whole screen

**Files:** `frontend/src/components/dock/dock-container.tsx`, `frontend/src/components/dock/dock.css`.

**Symptom:** the first time a dock panel was opened (e.g. Alt+L for Layers), the entire UI chrome
appeared to blink/refresh; subsequent toggles were clean.

**Cause:** dock panel bodies are `lazy()`-loaded, but `dock-container` had no `Suspense` of its own,
so a panel's first-open suspension bubbled up to app.tsx's single shared `<Suspense fallback={null}>`
that wraps the toolbar, dock, property panel and status bar — blanking all of them for a frame while
the chunk loaded.

**Fix:** wrapped each panel body in its own `<Suspense fallback={<div class="dock-panel-loading"/>}>`
so a first-open load only affects that panel, leaving the rest of the chrome mounted.

## 2026-07-12 — Deployed app blank on first load; dropdown text illegible

### 153. yappydraw.com renders blank on first visit, works after a refresh

**Files:** `vite.config.ts`, `frontend/src/utils/pwa.ts` (new), `frontend/src/app.tsx`,
`frontend/src/utils/hard-refresh.ts`, `tsconfig.app.json`.

**Symptom:** visiting the deployed static app showed a blank page (splash faded, `#root` empty);
a manual refresh then loaded it fine — reproducibly, especially for returning visitors after a
new deploy.

**Cause:** the PWA used `registerType: 'autoUpdate'`, so Workbox emitted `self.skipWaiting()` +
`clientsClaim()` in `sw.js`. When a returning visitor loaded the page after a new deploy, the
freshly-installed SW would activate and **evict the old precache while the previous page was still
fetching its old content-hashed chunks** (`vendor-export`, `solid-framework`, …). Those chunks
404'd (gone from cache *and* from the server), the ESM module graph failed to execute, and the
inline splash-fade code in `index.tsx` still cleared the splash → empty `#root` = blank. A refresh
loaded the now-consistent new build, so it "worked on refresh".

**Fix:** switched to `registerType: 'prompt'` (`injectRegister: false`, register via
`registerSW()`). The generated SW no longer calls `clientsClaim()` and only calls `skipWaiting()`
on an explicit `SKIP_WAITING` message — so a new build installs and *waits* instead of hijacking
the running page. New `utils/pwa.ts#initPWA` shows offline-ready / update-available toasts; the
status-bar version-tap `hardRefresh` applies the waiting update. Verified from the build output:
`clientsClaim` = 0 occurrences in `dist/sw.js`, `skipWaiting` is message-gated.

### 154. Palette/Background dropdown options unreadable (light text on white popup)

**Files:** `frontend/src/index.css`, `frontend/src/components/property-panel.css`.

**Symptom:** opening the Background/Color-Palette `<select>` showed nearly-invisible option text
(light grey on a white native popup) while the app was in dark theme.

**Cause:** `:root` and the select rules hardcoded `color-scheme: light dark`, which makes the
OS-native option popup follow the **OS** light/dark preference. The app forces its own theme via
`data-theme`, so a dark app on a light-mode OS got a white system popup while the `option` text was
`var(--text-primary)` = light → illegible.

**Fix:** bound `color-scheme` to the applied theme in `index.css`
(`[data-theme="dark"|"focus"] { color-scheme: dark } [data-theme="light"] { color-scheme: light }`)
and changed `.palette-selector` / `select` to `color-scheme: inherit` so the native popup follows
the app theme, not the OS.

## 2026-07-11 (pm) — Non-destructive compound shapes

### 151. Single-ring compound shape rendered blank

**Files:** `frontend/src/store/app-store.ts` (`buildCompoundPath`).

**Symptom:** a compound whose boolean result is a single ring (e.g. Unite, or a Minus with
no hole) drew nothing on the canvas, while multi-ring results (Exclude, holes) drew fine.

**Cause:** the compound path was always built with `pathSubpaths`. A `path` element fills a
lone subpath via `pathAnchors`+`pathClosed` (see `buildPathFromPoly`) — a single `pathSubpaths`
entry with no `pathAnchors` does not fill. So single-ring compounds had geometry but no fill.

**Fix:** mirror `buildPathFromPoly` — `single = subpaths.length === 1` → set
`pathAnchors`+`pathClosed`; only use `pathSubpaths` for holes/disjoint results. `setCompoundShapeOp`
now carries all three path fields from the rebuild. Caught by an e2e that compares the union frame
against an *empty* canvas (a "differs from empty" assertion, not just "union ≠ exclude").

## 2026-07-11 (pm) — Dimension annotations (Phase 5)

### 149. Store field name collided with the page-size `dimensions`

**Files:** `frontend/src/store/app-store.ts` (+ callers).

**Symptom (caught at build):** adding a `dimensions: DimensionAnnotation[]` store field
produced `Property 'some' does not exist on type '{ width; height }'` — and worse, the
initial value `dimensions: []` would have silently overwritten the existing page-size
`dimensions: { width, height }` at runtime.

**Cause:** the store already had `dimensions` (the canvas/page size). Two keys can't
coexist; the later literal wins.

**Fix:** renamed the annotation collection to `dimensionAnnotations` everywhere
(store field, history snapshot, save/load, API, renderer, context menu).

### 150. Second dimension re-used the first's id

**Files:** `frontend/src/utils/id-generator.ts`.

**Symptom:** adding a width **and** a height dimension to the same element produced two
annotations with the same id (`dime-1`), so `getDimensionValue`/remove hit the wrong one.

**Cause:** `generateId` (max-suffix scan) scanned elements/layers/slides/… but not the
new `dimensionAnnotations` collection, so the second id's "max" was 0 again.

**Fix:** added `store.dimensionAnnotations` to the `generateId` scan list. Caught by the
Phase 5 e2e (a height dimension reported the width's value).

## 2026-07-11 — After-Effects keyframe timeline (Phases 0–3)

### 146. Keyframes dope-sheet playhead didn't repaint the canvas

**Files:** `frontend/src/components/canvas.tsx`.

**Symptom:** with the Keyframes panel open, scrubbing/playing its playhead updated the
timeline UI and the evaluator, but the shapes on the canvas didn't move. Only obvious once
transform parenting (Phase 3) made a static-looking result visible in a screenshot.

**Cause:** the canvas composition clock was gated on `store.showSceneTimeline` only
(`compTime = showSceneTimeline ? storyTime : freeClock`). Opening the Keyframes panel sets
`showSceneTimeline = false`, so `compTime` fell back to the free-running clock and never
followed `storyTime`. Every earlier e2e asserted `evaluateComposition(...)`/DOM diamonds, not
canvas pixels, so it slipped through three phases.

**Fix:** gate on either panel — `compTime = (showSceneTimeline || showKeyframePanel) ? storyTime
: freeClock` — and added a canvas-pixel diff across a scrub to the Phase 3 e2e so it can't
regress silently.

### 147. Stopwatch recorded the evaluated value, not the stored one

**Files:** `frontend/src/components/keyframe-panel.tsx`.

**Symptom:** after keyframing a property, moving the playhead, changing the value, and adding a
second keyframe, both keyframes held the same value — no interpolation ever appeared.

**Cause:** "add keyframe" read `evaluateCompositionAt(playhead)`. Once a track exists it *holds*
at its last key outside the keyed range, so the second key just cloned the first's value.

**Fix:** the stopwatch snapshots the element's **stored** property (`el[prop]`, the value the
user just set), which is AE's model. Caught by the Phase 1 e2e (midpoint X came back 100, not 200).

## 2026-07-10 (pm) — Invisible "ghost" line/arrow/pen elements from a stray click

### 144. Single click/tap with line, arrow, or pen tools left an invisible element

**Files:** `frontend/src/utils/tool-handlers/draw-handler.ts`.

**Symptom:** a stray single click (line/arrow) or tap (fine-liner/ink-brush/marker)
created a 0×0 element that renders nothing, yet stayed in the document — the
status bar showed e.g. "3 elements" with only one visible, and the ghosts
survived reload (reported as "fine-1 / arrw-1 is hidden after refresh").

**Cause:** `drawOnUp`'s degenerate-discard (`CLICK_EXEMPT`) intentionally exempts
`line`, `arrow`, and the pen tools so that legitimately short or multi-point
strokes aren't deleted — but that also let a zero-drag click through as an
invisible element.

**Fix:** after the existing discard, a targeted `GHOST_PRONE` check deletes a
just-drawn line/arrow/pen element whose bounding box is < 3px in **both**
dimensions — unless it's a bound connector (a deliberately short arrow snapped
between adjacent shapes) or has real extent. Verified: stray tap+click → 0
elements; two proper strokes → 2 elements kept.

## 2026-07-10 — Mobile/tablet responsive pass

### 141. Phone: Settings / Properties / Help buttons were untappable

**Files:** `frontend/src/app.tsx`, `frontend/src/index.css`.

**Symptom:** on phones (≤600px) the three floating utility buttons
(Settings, Properties toggle, Help) did nothing when tapped.

**Cause:** the tool toolbar force-docks to the bottom band on phones with
`z-index:10002`; the floating buttons sat at `bottom:34px` beneath it, so the
toolbar physically intercepted their pointer events (verified: Playwright
reported `toolbar-container intercepts pointer events`).

**Fix:** refactored the three inline-positioned buttons into a single
`.floating-tools-cluster`. Desktop/tablet keep the bottom-left row; on phones the
cluster relocates to a top-right vertical rail (`z-index:10003`), clear of the
bottom toolbar, status bar, and property bottom-sheet.

### 142. Phone: property bottom-sheet hidden behind the docked toolbar

**Files:** `frontend/src/components/property-panel.css`.

**Symptom:** the property panel's `≤768px` bottom-sheet had its lower half
covered by the bottom-docked toolbar + status bar on phones.

**Fix:** phone-only (`≤600px`) rule lifts the sheet to
`bottom: calc(84px + safe-area)` so it clears the toolbar; tablets (601–768px,
toolbar at top) keep `bottom:0`.

### 143. Phone: floating panels/dialogs ran off-screen or overflowed

**Files:** `settings-dialog.css`, `stick-figure-panel.css`, `brand-kit-panel.css`,
`behaviors-panel.css`.

**Symptom:** Settings modal (`width:420px`) clipped horizontally; the Stick-figure
and Brand-kit panels (`left:260px`) sat entirely off-screen; the Behaviors panel
(`340px`) clipped on ≤360px phones.

**Fix:** Settings modal gained `max-width:92vw`; the three floating panels become
full-width bottom sheets (clearing the toolbar) at `≤600px`.

## 2026-07-07 (pm) — Game Stop button needed two clicks

### 140. Stop button (game play) required two clicks

**Files:** `frontend/src/components/game-overlay.tsx`.

**Symptom:** after playing a game (especially after interacting with it), the
first click on the **Stop** pill did nothing; a second click stopped it.

**Cause:** the full-viewport `.game-overlay` calls `setPointerCapture` on
pointerdown to forward input to the runtime. A lingering capture redirects the
Stop button's `pointerup` to the overlay, so a `click` (which needs down+up on the
same element) never fires on the button — the first press is lost.

**Fix:** the Stop / Replay / Exit buttons now act on `pointerdown` (with
`stopPropagation`) instead of `click`, and the overlay releases the pointer capture
on pointerup so the next tap lands on the control it hit.

## 2026-07-07 — Blueprint empty-state box collapsed + manual Save dropped game data

### 139. Blueprint empty-state hint rendered ~80px wide (one word per line)

**Files:** `frontend/src/components/blueprint-graph.css`.

**Symptom:** with no nodes, the Blueprint's "Add an Event, an Action, then drag…"
hint box was a tall, ~80px-wide sliver wrapping one word per line.

**Cause:** `.bp-empty` is absolutely positioned inside `.bp-surface`, which is
itself `position:absolute` with no intrinsic width. An absolutely-positioned block
with only `max-width` (no `width`) resolves its width to the containing block —
which is 0 — so it shrank to min-content.

**Fix:** give `.bp-empty` an explicit `width: 320px` instead of `max-width: 320px`.

### 138. Manual Save dropped Blueprint + authoring mode (games saved to disk lost logic)

**Files:** `frontend/src/components/menu.tsx`.

**Symptom:** saving a game via the Save dialog (workspace/disk) and reopening it
lost its Blueprint; a code-authored game could come back regenerated from blocks.

**Cause:** the two Save paths hand-built a `SlideDocument` that never included
`blueprints` or `gameAuthoringMode`, and called `effectiveGameScript` without the
mode. Autosave (`buildCurrentDocument`) had them; the manual paths had drifted.

**Fix:** both Save paths now persist `blueprints` + `gameAuthoringMode` and pass
the mode to `effectiveGameScript`.


## 2026-07-07 — Design export was cropped to elements

### 137. Exporting a Design/Slides doc to PNG/JPG/SVG didn't show the whole design

**Files:** `frontend/src/utils/export.ts`.

**Symptom:** downloading a Canva-style **Design** document (or a multi-page
Slides doc) as PNG, JPG or SVG produced an image cropped tightly around the
elements — the page's background (colour/gradient/texture) and any empty margin
were missing, and multi-page designs only exported a jumbled element-bounding
box. "The entire design isn't showing up."

**Cause:** `exportToPng` / `exportToJpg` / `exportToSvg` always computed bounds
from the element bounding box and rendered on a single flat white background,
with no notion of page frames. Only `exportToPdf` / `exportToPptx` rendered
paged docs per-page (background + exact page bounds). So the whole-document
raster/vector export ignored the pages entirely.

**Fix:** whole-document PNG/JPG export of a paged doc (`design`/`slides`, when
not "selection only") now renders **every page at its exact page bounds with its
own background**, stacked vertically with a gap (widest page sets the width,
narrower pages centred) — via a new `renderPagedDocToCanvas` helper that mirrors
the proven `exportPageToPng` clip-and-background logic. SVG export now unions the
page rectangles into the bounds and draws each page's background rect beneath its
elements (solid colours exact; gradient/texture/image backgrounds fall back to
the page base colour). PDF/PPTX were already correct and are unchanged.

## 2026-07-06 — Quick toolbar font colour

### 136. Quick toolbar "Text Color" did nothing for text/rich-text

**Files:** `frontend/src/components/quick-toolbar.tsx`.

**Symptom:** selecting a text (or rich-text) element and picking a colour from
the floating quick ("Shape") toolbar's **Text Color** swatch moved the swatch
but never changed the actual font colour — the text stayed its original colour.

**Cause:** the visible font colour is resolved as `textColor || strokeColor`,
and new elements are created with a baked-in default `textColor: '#000000'`
(`app-store.ts`). The quick toolbar's colour control only wrote `strokeColor`
via `handlePropertyChange`, so the baked-in `textColor` always won. The main
color picker (`p3-color-picker.tsx`) already guards against this by writing both
keys for text/rich-text; the quick toolbar didn't.

**Fix:** `handlePropertyChange` now mirrors the color picker — when the
`strokeColor` control is applied to a `text`/`richtext` element it writes both
`strokeColor` and `textColor`. Shape stroke-colour behaviour is unchanged.

## 2026-06-28 (pm) — Table reorder feedback + touch select-all

### 134. Table column reorder was a blind drag (no drop feedback)

**Files:** `frontend/src/utils/tool-handlers/selection-handler.ts`,
`frontend/src/utils/canvas-renderer.ts`, `frontend/src/utils/pointer-helpers.ts`,
`frontend/src/components/canvas.tsx`.

**Symptom:** dragging a table column header to reorder felt finicky — the only
feedback was the cursor turning to `grabbing`, so you couldn't tell which column
you were over or where the column would land.

**Fix:** a live drop indicator via a new `tableColumnDrop` signal — the move
handler computes the target column under the pointer; `renderSelectionOverlays`
fades the grabbed column, highlights the target, and draws a thick blue
insertion line on the side the column will land (right of target when moving
right, left when moving left, matching the splice-reorder on drop). Cleared on
release.

### 135. No keyboard-free "Select all" on tablet

**Files:** `frontend/src/store/app-store.ts`,
`frontend/src/utils/context-menu-builder.ts`, `frontend/src/app.tsx`.

**Symptom:** select-all was `Ctrl/Cmd+A` only; keyboard-less tablets had no path
(the empty-canvas context menu's "Select all" wasn't reachable until the Phase 1
long-press landed, and it was absent once something was already selected).

**Fix:** shared `selectAll()` store action used by the shortcut and the menu;
added "Select all" to the selection branch of the context menu too. Reachable on
tablet via long-press (empty canvas or with a selection) → Select all.

## 2026-06-28 — Tablet select+delete (Phase 1)

### 132. Context menu un-dismissable on touch / pen

**Files:** `frontend/src/components/context-menu.tsx`.

**Root cause:** the outside-click close listener was registered on `mousedown` only. Touch/pen taps
don't reliably synthesize a `mousedown`, so once a context menu opened on a keyboard-less tablet
there was no way to dismiss it (ESC needs a keyboard). **Fix:** also listen on `pointerdown`
(and remove it on cleanup). Same close semantics, now fires for touch/pen.

### 133. 2-finger gesture cooldown could strand single-finger input

**Files:** `frontend/src/components/canvas.tsx`.

**Root cause:** after a 2-finger gesture, `gestureCooldown` blocks single-finger touch until *all*
fingers lift (cleared on `touches.length === 0`). A dropped/out-of-order `touchend` (frequent on
iPadOS Safari) could leave it `true` indefinitely, permanently killing single-finger select/marquee.
**Fix:** `isTouchBlockedByGesture()` records when the cooldown was armed and self-heals any cooldown
older than `GESTURE_COOLDOWN_MAX_MS` (1.5s) on the next touch — the active-gesture and short
resting-finger guards are unchanged.

## 2026-06-26 (pm, 13)

### 131. Layer-panel duplicate/delete buttons rendered as black boxes

**Files:** `frontend/src/components/layer-panel.tsx`, `frontend/src/components/layer-panel.css`.

**Root cause:** the per-row Duplicate/Delete controls were raw Unicode glyphs (`⎘`, `×`) inside
`<button class="icon-button">`, but **`.icon-button` had no CSS** — the stylesheet defined
`.layer-duplicate-btn` / `.layer-delete-btn` instead, class names the markup never used. With no
matching rule the browser fell back to default button chrome (bordered box) plus a heavy solid-black
glyph. `⎘` (NEXT PAGE) in particular renders as a black rounded-rect + square — the "black buttons"
the user saw. Visible on light theme because everything else in the panel is light/secondary.

**Resolution:** swapped the glyphs for proper **lucide icons** (`Copy`, `Trash2`), matching the
Eye/Lock/Folder icons used elsewhere in the panel, and added the missing CSS
(`.layer-actions` / `.layer-action-btn`) styled like the lock control — transparent, `--text-secondary`,
subtle until row hover, red on delete-hover, white when the row is active. Lesson: when a control looks
unstyled, check the class name in the markup actually matches a CSS selector (silent class-name drift).

## 2026-06-26 (pm, 12)

### 130. Dark mode mangled saturated colours (yellow → brown)

**Files:** `frontend/src/shapes/base/render-pipeline.ts`, `frontend/src/utils/canvas-renderer.ts`,
`frontend/src/components/canvas.tsx`, `frontend/src/components/text-editing-overlay.tsx`,
`frontend/src/components/rich-text-editing-overlay.tsx`. Design doc: `docs/design/dark-mode.md`.

**Root cause:** dark mode was a global CSS `invert(93%) hue-rotate(180deg)` filter on the
`<canvas>`. That flips black↔white but is lossy for saturated colours — a bright yellow `#fcc419`
came out **brown** (invert flips lightness for *every* pixel; hue-rotate only approximately restores
hue). The stored colour was fine; only the dark-mode display was wrong (which is why buffer pixel
reads were identical — the filter is display-only).

**Resolution:** replaced the global filter with a **per-colour, render-time** mapping
(`RenderPipeline.adjustColor`): invert **lightness weighted by greyness** (`newL = L + (1-2L)(1-S)`)
so greys/black/white swap but saturated hues stay true. Routed the canvas background, grid, textures,
and text-editing overlays through it; removed the canvas filter; fixed `isDarkMode` to use the
*resolved* theme. Verified: yellow stays yellow, black→white, blue stays blue, canvas→dark. Bonus:
embedded images now render true-colour in dark mode (the filter used to invert them). See the design
doc for how to tune it.

## 2026-06-26 (pm, 11)

### 129. Property-panel Background swatch showed the wrong colour (didn't reset fillStyle)

**Files:** `frontend/src/components/property-panel.tsx`

**Root cause:** the panel's colour apply set only `backgroundColor`. If the element's `fillStyle`
was non-solid (e.g. a `linear` gradient, which renders from `gradientStart`/`gradientEnd` and
ignores `backgroundColor`), picking a solid swatch appeared to do nothing or show an odd colour.
The popup colour picker already set `fillStyle: 'solid'` alongside the colour; the panel didn't.

**Resolution:** when a (non-transparent) `backgroundColor` is applied from the panel, also set
`fillStyle: 'solid'` (single and multi-selection) — so a solid swatch yields a solid fill.

## 2026-06-26 (pm, 10)

### 128. Node-editing a ROTATED path edited the wrong anchor (handles ignored rotation)

**Files:** `frontend/src/utils/tool-handlers/selection-handler.ts`, `frontend/src/utils/handle-detection.ts`, `frontend/src/utils/selection-renderer.ts`

**Root cause:** path anchors are stored in the element's un-rotated local frame, but the anchor
**overlay drawing, hit-testing, and drag** all used the raw world pointer / `el.x + a.x` without
applying `el.angle`. So after rotating a path (e.g. a Pathfinder Unite result), the node handles
sat in the un-rotated positions — grabbing the bottom of the shape edited the top.

**Resolution:** all three are now rotation-aware. `handlePathNodeDrag` un-rotates the pointer
into the element's local frame before writing the anchor; `getHandleAtPosition` un-rotates the
pointer before testing anchor/handle positions; and `renderPathAnchors` draws the overlay inside
the element's rotated frame. Verified: on a 45°-rotated square path, dragging the visible anchor
moves exactly that anchor (others unchanged, element doesn't move).

## 2026-06-26 (pm, 9)

### 127. Multi-selection / group couldn't be rotated (e.g. a Pathfinder result that split into pieces)

**Files:** `frontend/src/utils/handle-detection.ts`, `frontend/src/utils/selection-renderer.ts`,
`frontend/src/utils/tool-handlers/selection-handler.ts`

**Root cause:** the rotate handle (drawing + hit-detection + rotate logic) existed only for a
**single** selected element. Multi-element selections had resize handles but **no rotate handle**.
So a Pathfinder op that yields multiple paths (Exclude, Divide, or a union that splits) — which
looks like one shape but is really 2+ elements — couldn't be rotated. Same for groups.

**Resolution:** added multi-selection rotation. `renderMultiSelectionBox` now draws a rotate
handle above the group box; `getHandleAtPosition` detects it (`{id:'multi', handle:'rotate'}`);
and `handleResize` rotates **every** selected element around the group centre, using the initial
positions captured on pointer-down (drift-free / absolute) — each element both spins and orbits the
centre. Verified via a handle-drag test (two rects → 90°: both spin and orbit).

## 2026-06-26 (pm, 8)

### 126. Changing a text's colour via the colour picker didn't reflect (textColor overrode strokeColor)

**Files:** `frontend/src/components/p3-color-picker.tsx`

**Root cause:** interactively-created text gets `textColor: '#000000'` from `defaultElementStyles`,
and the text renderer uses `textColor || strokeColor`. The colour picker's "stroke" mode only set
`strokeColor`, so the baked-in `textColor` kept overriding it and the font colour never changed.
(Flipping the text was a red herring — verified that flipped text recolours fine via the API.)

**Resolution:** in stroke mode the picker now sets `textColor` as well as `strokeColor` for
text/richtext elements, so the visible font colour actually updates (for new and existing texts).

### 125. (feature) Pathfinder region ops — Divide / Trim / Merge / Crop / Outline

**Files:** `frontend/src/store/app-store.ts`, `frontend/src/api.ts`, `frontend/src/utils/context-menu-builder.ts`

Added the rest of Illustrator's Pathfinder set on top of the existing atomic-face engine
(`computeShapeFaces`): **Divide** (every overlap region → its own path), **Trim** (drop covered
parts, one path per shape), **Merge** (trim + fuse same-fill shapes), **Crop** (keep only what's
inside the frontmost shape, which is discarded), **Outline** (region boundaries → strokes).
Exposed via right-click → Pathfinder and `Yappy.pathfinderRegion(ids, op)`. The 4 boolean modes
(Unite/Subtract/Intersect/Exclude) were already supported.

## 2026-06-26 (pm, 7)

### 124. Vector Tools → Vertical Type only affected one text in a multi-selection

**Files:** `frontend/src/components/vector-tools-panel.tsx`

**Root cause:** the panel's `selText()` helper looked only at `store.selection[0]`, so "Vertical
Type" toggled a single element — and if the first-selected element wasn't a text, it returned
`null` and nothing happened at all.

**Resolution:** replaced `selText()` with `selTexts()` (every selected text/richtext element).
"Vertical Type" now applies to the whole selection with a unified target state (if any selected
text isn't vertical → make them all vertical; otherwise toggle them all off); the button's active
state reflects "all selected texts are vertical".

## 2026-06-26 (pm, 6)

### 123. Pen control points still not visible while drawing (the pm,4 "fix" was dead code)

**Files:** `frontend/src/utils/selection-renderer.ts`

**Root cause:** bug #119's fix added a `penBuildingId` branch to the path anchor/handle block —
but that block lives **inside `if (isSelected)`**, and a path being built isn't selected yet. So the
new condition was unreachable; live anchors/handles never rendered. The earlier change shipped but
did nothing.

**Resolution:** extracted the anchor/handle drawing into a shared `renderPathAnchors()` helper.
Selected paths call it (as before); a path being built calls it from a block **outside** the
`isSelected` guard (`el.type==='path' && !isSelected && el.id===penBuildingId`), with the first-anchor
close-ring. Now anchors (corner/smooth squares) + Bézier handles show live as you draw, like Illustrator.

## 2026-06-26 (pm, 5)

### 121. Vector pen had no hotkey + clashed visually with the freehand brush

**Files:** `frontend/src/app.tsx`, `frontend/src/components/toolbar.tsx`, `frontend/src/components/pen-tool-group.tsx`

**Root cause:** the Illustrator-style vector pen (`path` tool) had no keyboard shortcut and used a
nib icon that looked almost identical to the freehand brush's `Pen` icon — and the brush owned both
`p` and `7`, so users kept grabbing the brush ("it just draws") instead of the vector pen.

**Resolution:** `P` now selects the vector pen (Illustrator parity); the freehand brush keeps `7`
(its `p` binding removed). Added a `P` badge to the pen button, relabelled the brush to "Brush / Fine
Liner (7)", and switched the brush's representative icon to `PenLine` so the two are visually distinct.

### 122. Programmatic `createText` ignored the architectural default (hardcoded sketch)

**Files:** `frontend/src/api.ts`

**Root cause:** the default drawing style is `architectural` and interactive text creation honours
`store.defaultElementStyles`, but `YappyAPI.createText` hardcoded `renderStyle: 'sketch'` — so
API/script/template-created text came out hand-drawn regardless of the default.

**Resolution:** `createText` now uses `defaults.renderStyle ?? 'architectural'`. (The two remaining
hardcoded-`sketch` spots are image pastes, where `renderStyle` has no effect on a bitmap.) Note: a
returning user who has an older `defaultElementStyles` persisted in `localStorage` still loads their
saved style — the built-in default only applies to fresh state.

### 120. Blob Brush edges still scalloped on tight curves (faceted polygon)

**Files:** `frontend/src/store/app-store.ts`, `frontend/src/utils/path-boolean.ts`

**Root cause:** the blob was the union of disks converted to **corner** anchors — i.e. a many-sided
*polygon*. Chaikin pre-smoothing only added more straight segments; the edge was still faceted, and
the residual scallops/union noise showed on tight curves and self-overlaps.

**Resolution:** new `polyToSmoothSubpaths` builds the blob outline as a true **Bézier** edge — RDP-
simplify each union ring (drops scallop/union noise), then fit a closed Catmull-Rom spline through the
survivors (smooth anchors with handles). `buildPathFromPoly` takes an optional `smoothEps` used only by
the Blob Brush (every other caller stays polygonal). Disks bumped 24→32 sides. Both the fresh stroke and
the same-colour merge use the smooth path.

## 2026-06-26 (pm, 4)

### 119. Pen tool felt like it "just drew" — no anchors/handles shown while building

**Files:** `frontend/src/utils/selection-renderer.ts`, `frontend/src/utils/canvas-renderer.ts`

**Root cause:** the pen (`path` tool) already implements the full Illustrator interaction
(click=corner, drag=smooth+handles, click-first=close, Enter/Esc finish, Backspace undo), but the
anchor/handle overlay was gated `selectedTool === 'selection'` — so during a build (tool=`path`,
element not yet selected) nothing was drawn except the path geometry. It looked like a dumb polyline.

**Resolution:** added a `penBuildingId` overlay option (fed from `currentDrawingId` when the pen tool
is active) so the path being built renders its anchors (corner/smooth squares) + Bézier handles live,
plus a ring on the first anchor showing where to click to close.

## 2026-06-26 (pm, 3)

### 118. Drawing toolbar could vanish off-screen with no way to recover

**Files:** `frontend/src/components/toolbar.tsx`

**Root cause:** the dragged toolbar position is persisted to `localStorage.toolbarPos` as a
*delta* from its CSS-anchored spot and restored on mount with **no bounds check**. Parked near
an edge — or reopened in a smaller window — it rendered fully off-screen, and the main toolbar
has no close/reopen control, so it was unrecoverable.

**Resolution:** added `clampIntoView()` (keeps ≥32px on every edge) that runs on mount via
`requestAnimationFrame` (auto-recovers an already-stranded toolbar on next load) and on every
window resize.

### 117. Vector Tools close (X) button effectively invisible

**Files:** `frontend/src/components/vector-tools-panel.css`, `frontend/src/components/vector-tools-panel.tsx`

**Root cause:** the close button existed but was a borderless `--text-secondary` X on a
`--bg-secondary` header (same family), and its hover background matched the header — so it blended
in and read as "no close button," especially in some themes.

**Resolution:** made it an explicit bordered button (`--text-primary` X on `--bg-panel`, `flex:0 0 auto`
so it never clips) with a red `#ef4444` hover — the standard, unmistakable close affordance. Icon 14→16.

## 2026-06-26 (pm, 2)

### 116. Two separate groups (e.g. two Lens Flares) selected together — duplicate group ids

**Files:** `frontend/src/utils/id-generator.ts`

**Root cause:** `generateId('group')` derives the next id by scanning existing element `.id`
fields for the max `grup-N`. But a group id lives in `element.groupIds[]`, never as an
element's `.id`, so the scan never sees it — `max` stayed 0 and **every** group got `grup-1`.
Two flares (or any two groups) shared one id, so clicking one selected both. The same class
of bug had already been patched for Live Paint (`livePaintGroupId`) but not for regular
groups / clip / trace ids, which all live in `groupIds[]`.

**Resolution:** also scan every `element.groupIds[]` entry when computing the max, so
`grup-`/`clip-`/`trace-` ids stay unique.

### 115. Lens Flare rays read as flat construction lines

**Files:** `frontend/src/api.ts`

**Root cause:** rays were uniform-width `createLine` strokes from the dead centre to a hard
tip at constant opacity — no taper, no fade — so they looked like drafted scaffolding, not light.

**Resolution:** each ray is now a tapered spike (a thin closed `path` triangle, fill-only,
emerging from outside the core and narrowing to a point), drawn as two layers — a wide faint
amber halo behind a narrow warm-white (`#fffbeb`) hot core — so it reads as a light streak on
both light and dark canvases. Flare colour now also follows the active stroke (rays/rings) and
fill (glow); the white-hot core is intentionally fixed.

## 2026-06-26 (pm)

### 114. Recolor Artwork applied only on click-away, not live

**Files:** `frontend/src/components/recolor-panel.tsx`, `frontend/src/store/app-store.ts`

**Root cause:** the swatch `<input type="color">` used `onChange` (fires on commit) and `recolorSelectionColor` pushed history + re-derived the swatch list each tick, so live drags either didn't apply or jumped.

**Resolution:** `onInput` for live updates; the swatch list is frozen during a drag (`<Index>`), each tick remaps the swatch's *current* colour → the new one (`recolorSelectionColor(..., record=false)`), and history is snapshotted once on press.

### 113. Toolbar orientation + dragged position not persisted; menu hidden behind toolbar

**Files:** `frontend/src/store/app-store.ts`, `frontend/src/components/toolbar.tsx`, `frontend/src/components/menu.tsx`, `frontend/src/components/menu.css`

**Root cause:** `loadDocument` set `globalSettings` from the saved doc, clobbering the localStorage-backed `toolbarVertical`; the dragged toolbar `position` signal was never persisted; and the menu wrapper (z 10001) sat below the floating toolbar (z 10002), trapping the dropdown's z-index in a lower stacking context.

**Resolution:** loadDocument now re-applies the localStorage UI prefs after the doc's globalSettings; the toolbar position is saved to `localStorage.toolbarPos` and restored on mount; the menu wrapper + container were raised to z 10060 (above the toolbar). See [learnings.md](../learnings.md).

## 2026-06-26

### 111. Polygon ops (Pathfinder / Shape Builder / Knife / Distort / Live Paint) ignored element rotation

**Files modified:** `frontend/src/utils/path-boolean.ts`

**Observation:** Rotate a shape, then run any boolean/region op — it operated on the *un-rotated* outline, so cuts/merges/fills landed in the wrong place and didn't match what the user saw.

**Root cause:** `getShapeGeometry` returns center-local, unrotated geometry; `geometryToRings` only translated by the centre and never applied `el.angle`. A long-standing Pathfinder bug, inherited by every new region feature.

**Resolution:** `geometryToRings`/`elementToMultiPolygon` now rotate each ring point about the element centre by `el.angle` (radians — fed straight to `ctx.rotate`). Verified by an intersect of two identical bars, one rotated 90° → correct central square (`tests/review-fixes.spec.ts`). See [learnings.md](../learnings.md).

### 110. Live Paint left orphan region-fills when its source group was dissolved

**Files modified:** `frontend/src/store/app-store.ts`

**Observation:** Delete a Live Paint group's source shapes down to <2 — the locked region fills stayed in the document forever, un-selectable and un-deletable.

**Root cause:** `regenerateAllLivePaint` only collected group ids from surviving members and `continue`d when `members.length < 2`, never cleaning the fills (and a fully-deleted group wasn't detected at all).

**Resolution:** Collect group ids from both members and fills; when a group falls below 2 members, strip its `livePaintFillFor` fills and drop its signature.

### 109. Live Paint group ids collided after reload (data corruption)

**Files modified:** `frontend/src/utils/id-generator.ts`

**Root cause:** `generateId('lpg')` only scans `.id` fields, but a group id lives on the `livePaintGroupId` *tag* — so after reload it always returned the same id, cross-wiring two groups' members and fills.

**Resolution:** `generateId` now also scans `livePaintGroupId` tags on elements.

### 108. Replace-style ops promoted results to the top of the z-stack

**Files modified:** `frontend/src/store/app-store.ts`

**Observation:** Pathfinder / Knife / Distort / Shape Builder / Scissors results jumped in front of everything; Illustrator keeps the original stacking position.

**Resolution:** Added `replaceElementsPreservingOrder` (splices results at the first consumed element's z-index) and routed all five ops through it.

### 107. Width tool pushed a phantom undo step on closed/invalid paths

**Files modified:** `frontend/src/store/app-store.ts`

**Root cause:** `setWidthPoint` called `pushToHistory()` / converted the shape to a path *before* validating closedness, then bailed — leaving a no-op undo step (and a half-applied conversion).

**Resolution:** Validate convertibility + open-ness first; only `pushToHistory` once a real mutation is guaranteed. Also fixed in the same pass: Scissors pieces now clear stale `widthProfile`/live-paint tags; the 8-shape face cap surfaces a toast; Vertical Type columns advance right→left; spiral grows from the centre; polar-grid rings are closed. See [learnings.md](../learnings.md).

## 2026-06-25

### 106. Resizing a rotated element scaled along world axes and drifted the rotation centre

**Files modified:** `frontend/src/utils/tool-handlers/selection-handler.ts`

**Observation:** Rotate a shape, then drag a corner/edge handle — the shape resized along the *screen* axes instead of its own, and the handle opposite the one being dragged didn't stay put, so the element appeared to slide/swim as it scaled.

**Root cause:** `handleResize` computed handle deltas in world space (`dx = x - startX`) and pinned the top-left in world coordinates, ignoring `el.angle`. The handle *hit-test* already un-rotated the pointer (so the right handle was grabbed), but the resize math didn't — a half-rotation-aware pipeline.

**Resolution (Free Transform Phase 1a):** For a single rotated element, project the drag delta into the element's local frame via `Rot(-angle)`, then recompute `newX/newY` from a pinned anchor (the corner/edge opposite the dragged handle) using `RESIZE_ANCHOR_SIGNS`. Multi-selection group resize stays world-axis-aligned (Illustrator parity). Gated behind `angle !== 0`, so the unrotated path is byte-for-byte unchanged. Verified end-to-end at 90° and 45° (`tests/free-transform-rotated-resize.spec.ts`). See [learnings.md](../learnings.md).

## 2026-06-24

### 105. Aligning/distributing multiple selected elements (and cycling stroke/fill style) didn't redraw immediately

**Files modified:** `frontend/src/store/app-store.ts`

**Observation:** Select 2+ elements and click an alignment button (or Distribute) in the Properties panel — the elements moved in the data model but the canvas didn't visibly update until the next unrelated event (mouse move, selection change, etc.). Same latent issue for `cycleStrokeStyle`/`cycleFillStyle`.

**Root cause:** The canvas render `createEffect` deliberately tracks a single coarse `store.dirtyRevision` counter instead of per-element property reads (a 120 Hz perf optimization — see [canvas.tsx](../../frontend/src/components/canvas.tsx) ~L421). Most mutators call `bumpDirtyRevision()` after their `setStore('elements', …)`, but `alignSelectedElements`, `distributeSelectedElements`, `cycleStrokeStyle`, and `cycleFillStyle` were missing the bump — so their geometry/style writes never triggered a redraw on their own.

**Resolution:** Added `bumpDirtyRevision()` after the `setStore` in all four functions. Alignment/distribution/style-cycling now repaint immediately.

### 104. Architectural drawing style rendered no stroke for SVG-`path` geometry shapes (incl. the new vector path)

**Files modified:** `frontend/src/shapes/renderers/specialty-shape-renderer.ts`

**Observation:** Switching a vector `path` element (and other path-geometry shapes like heart/cloud) to **Architectural** drawing style rendered the fill but **no stroke** — the outline disappeared. Sketch style was fine.

**Root cause:** `renderArchitectural`'s standard 2D path did `beginPath(); renderGeometry(); fill()` then `beginPath(); renderGeometry(); stroke()`. That works for geometries that *append to the current path* (rect/ellipse/points via roundRect/ellipse/moveTo/lineTo). But for `geo.type === 'path'`, `RenderPipeline.renderGeometry` calls `renderer.fillPath(d)` — a **self-contained** `ctx.fill(new Path2D(d))` that fills immediately and leaves the current path empty. So the fill happened to work, but the subsequent `stroke()` had an empty path and drew nothing (and the stroke block re-filled instead).

**Resolution:** In the architectural standard-merged block, special-case path geometry: fill via `renderer.fillPath(d)` and stroke via `renderer.strokePath(d)` (don't route a self-contained Path2D through `beginPath/fill/stroke`). This also restores the missing stroke for every other path-geometry shape in architectural mode. Verified with Playwright: a closed vector path now shows a clean precise stroke in Architectural and a rough hand-drawn stroke in Sketch. Codified the rule in CLAUDE.md (render-style parity).

### 103. Connector endpoint stays on the wrong edge after moving a bound shape to the opposite side

**Files modified:** `frontend/src/utils/binding-logic.ts`

**Observation:** Draw two boxes with an arrow (1 → 2), then move box 2 to the left of (or above/below) box 1. The arrow's start point stays pinned to box 1's *right* edge and the end stays on box 2's *left* edge, so the connector crosses through the shapes and looks misaligned instead of re-routing to the facing edges.

**Root cause:** `refreshBoundLine` → `resolveBindingPoint` deliberately did "no automatic anchor switching" — it resolved each endpoint to its stored anchor (`anchorFractionX/Y` for user/`connect()` arrows, or a named `position` for mindmap branches) regardless of where the other shape moved. A right-edge pin stays on the right edge even when the other shape is now on the left.

**Resolution:** Added a dynamic re-facing step. After resolving the stored anchor, compare its outward direction (anchor−center) against the direction to the other endpoint (other−center); if the dot product is negative (the anchor now points *away*, >90°), re-anchor to the boundary point facing the other shape via `intersectElementWithLine`. Anchors that still face correctly are kept (preserves intentional placement), and the original anchor re-applies if the shape returns to a facing position. `refreshBoundLine` now resolves each end toward the *other element's centre* (not the line's current endpoint) so the test is stable and order-independent. Verified with Playwright: dragging box 2 to the upper-left re-faced the start to box 1's left edge (720→595) and the end to box 2's right edge (900→365); no errors.

### 102. Mindmap: F2 "edit node text" was documented but did nothing; nodes couldn't be labelled by keyboard

**Files modified:** `frontend/src/components/canvas.tsx`, `frontend/src/app.tsx`, `frontend/src/help-docs/shapes/mindmap-doc.tsx`, `frontend/src/components/help-dialog.tsx`

**Observation:** A mindmap review flagged the feature as only ~70% keyboard-operable. You could create nodes (`Tab`/`Enter`), navigate (arrows), collapse (`Space`) and delete — but you could **not** set a node's label without the mouse. The help docs advertised `F2` = "Edit node text", yet pressing `F2` on a node did nothing.

**Root cause:** The only `F2` handler in `app.tsx` was gated behind a *table* cell selection (it returns early for tables). There was no keyboard entry point into text editing for a regular node — editing was reachable solely via mouse double-click (`handleDoubleClick`). Newly created `Tab`/`Enter` nodes were selected but left with empty text and no way to fill it from the keyboard, so the create→navigate→collapse→delete loop had a mouse-only gap exactly where labelling happens.

**Resolution:** Added a `window.__nodeTextEdit.startEditing(id, {selectAll?})` bridge in `canvas.tsx` (mirroring the existing `__tableCellNav` pattern and the `containerText`/`text` branch of `handleDoubleClick`). It refuses bare connectors, picks `text` vs `containerText` by element type, and inherits the canvas-rotation guard (no-op + toast when rotated). Wired into the global keyboard handler: `F2` edits the selected node (select-all), and `Tab`/`Enter` now drop the freshly created node straight into editing. No double-fire — the overlay is a `<textarea>`, so `isInputFocused` short-circuits the global handler while editing. Build (tsc + vite) passes.

## 2026-06-22

### 101. Dark theme: text being edited shows wrong color (black) until committed

**Files modified:** `frontend/src/components/text-editing-overlay.tsx`, `frontend/src/components/rich-text-editing-overlay.tsx`

**Observation:** In dark (and focus) theme, while typing into a text element the text appeared black, but as soon as editing was committed it flipped to the correct color (white). The mismatch was only visible during editing.

**Root cause:** Dark/focus presentation is done Excalidraw-style — the host `<canvas>` carries a CSS `filter: invert(93%) hue-rotate(180deg)` (`canvas.tsx`) that visually flips canonically-stored light-mode colors at render time (black→white), without mutating stored values. The text-editing overlays (`<textarea>` for plain text, the contenteditable `.rt-editor` for rich text) are separate DOM elements layered *on top* of the canvas, so the canvas filter doesn't apply to them. They showed the raw stored color (black); only after commit did the glyphs land on the filtered canvas and appear white.

**Resolution:** Mirror the same `invert(93%) hue-rotate(180deg)` filter on the text-bearing editing element while `resolvedTheme` is `dark` or `focus`. Applied to the `<textarea>` and to the `.rt-editor` contenteditable only (not their containers), so backgrounds, borders, and the rich-text toolbar chrome are unaffected. WYSIWYG during editing now matches the committed result.

**Prevention:** Any new on-canvas editing overlay (DOM layered over the canvas) must replicate the canvas dark-mode invert filter on its text element, since stored colors are canonical light-mode and only the canvas filter inverts them for presentation.

## 2026-06-21

### 100. Huion pen cursor invisible on Linux

**Files modified:** `frontend/src/app.tsx`, `frontend/src/index.css`

**Observation:** With a Huion tablet on Linux, the pen had no visible cursor while hovering — over the canvas and over the UI panels — so you couldn't tell where the pen was pointing. Mouse worked fine.

**Root cause:** On Linux, Chromium frequently stops painting the system cursor for a tablet pen while it hovers a page that behaves as a drawing target (our canvas/panels), even though hover/`pointermove` still fire. CSS `cursor` values (crosshair, resize, grab, etc.) are simply not rendered for the pen pointer.

**Resolution:** Ported happypaint's app-drawn pen cursor. A window-level capture-phase `pointermove`/`pointerdown` listener in `app.tsx` tracks `pointerType === 'pen'` and renders a small fixed-position dot (`.pen-cursor` in `index.css`: white fill + dark ring, `pointer-events: none`, top `z-index`) at the pen's client coords across the whole editor. Mouse/touch set the position to `null` so the normal system cursor shows; `pointerout` with no `relatedTarget` and window `blur` hide the dot when the pen leaves.

**Prevention:** Listener is capture-phase on `window`, so it keeps updating even while the canvas holds pointer capture mid-stroke. Scoped to `pointerType === 'pen'` only — mouse/touch are unaffected.

### 99. Huion H64 (Linux): slow/light freehand strokes split into gappy fragments — pen end-grace de-split (REVERTED)

**Files modified:** `frontend/src/components/canvas.tsx` (implemented, then reverted)

**Observation:** Drawing slowly and lightly with a budget digitiser (Huion H64 on Linux, pointer-event path) split one drawn line into several elements/undo entries, left visible gaps at the seams, and occasionally snapped mid-stroke to a smart shape.

**Attempted fix:** Ported happypaint's pen end-grace de-split — defer `drawOnUp` on a pen `pointerup` by a short grace window, buffer the dip's hover moves, and replay them into the same element on a nearby re-contact (sliding proximity anchor).

**Why reverted:** On this Huion the pen emits a continuous hover stream *between deliberate strokes* too, not only during a tip-chatter dip. The sliding anchor then chained across that hover path, so adjacent intentional strokes (dense sketching, hatching, close handwriting) were merged into one element AND the inter-stroke hover path was replayed as an unwanted **connecting line** ("extra strokes"). The discriminator happypaint relies on — "a genuine lift stops the hover stream within 110ms" — does not hold on this hardware. Tuning it reliably isn't possible without the device, and the false-merge artifact is worse than the original gaps, so the de-split was removed entirely (back to immediate `drawOnUp`).

**Status:** Reverted. The unrelated pen-cursor fix (#100) is kept. The original gappy-stroke root cause remains hardware — the real cure is Huion driver tuning (tip-activation force / pressure curve). If revisited in software, the merge must key on something more robust than hover continuity (e.g. an explicit hover-gap timeout that commits aggressively, or a user-toggle defaulted off).

## 2026-06-17

### 98. Welcome/landing screen reappears after deleting all elements

**Files modified:** `frontend/src/components/welcome-screen.tsx`

**Observation:** On first visit the landing/welcome screen shows. Drawing a shape hides it (expected). But deleting that shape (returning the canvas to empty) brought the landing screen back — undesired once the user has already started working.

**Root cause:** `isVisible()` gated the welcome screen purely on `store.elements.length === 0` (plus tool/mode flags and `!welcomeDismissed`). Drawing only hid it as a side effect of the element count going above 0; it never set `welcomeDismissed`. So any path back to an empty canvas (delete-all, undo) re-satisfied the condition and the screen returned.

**Resolution:** Added a `createEffect` in `WelcomeScreen` that sets `welcomeDismissed = true` the moment `store.elements.length > 0`. This covers every drawing path (freehand, shapes, paste, etc.) in one place rather than patching each call site, and composes with the existing explicit dismiss calls (image import, drag-drop, example load). Once the user draws anything, the landing screen stays gone for the session even if the canvas is later emptied.

## 2026-06-16

### 97. Freehand stroke becomes invisible after select + resize (stale `pointsEncoding`)

**Files modified:** `frontend/src/utils/tool-handlers/selection-handler.ts`, `frontend/src/components/canvas.tsx` (`normalizePencil`), `frontend/src/utils/export.ts`, `frontend/src/store/app-store.ts`

**Observation:** Draw a freehand line/curve (Pen tools), select it, drag a resize handle → the stroke vanishes.

**Root cause:** On finish, `normalizePencil` rewrites a stroke's `points` from a flat `number[]` to an `{x,y}` **object** array but left `pointsEncoding: 'flat'` stale. The single-element resize branch trusted that flag (`if (el.pointsEncoding === 'flat' || …)`) and scaled each *object* as a number — `pts[i] * scaleX` → `NaN` coordinates → nothing renders. Multi-select resize was unaffected because it already keyed off the runtime type. The same stale flag also broke SVG export and risked shared-reference aliasing on duplicate.

**Resolution:** Two-part. (1) `normalizePencil` now returns `pointsEncoding: undefined` so the flag matches the object output. (2) Defense-in-depth: every consumer that branched on `pointsEncoding === 'flat'` (resize, SVG export, element clone) now detects encoding by the actual runtime type (`typeof points[0] === 'number'`), matching `normalizePoints`. Strokes already on the canvas resize correctly immediately; documents saved with the stale flag also export/clone correctly.

## 2026-06-12

### 96. Partially-erased shape "loses its shape" when resized — erase holes didn't scale

**Files modified:** `frontend/src/utils/tool-handlers/selection-handler.ts`

**Observation:** Draw a circle, partially erase a few gaps into it, then select and drag a resize handle. The erased gaps stayed at their original size/position while the circle grew or shrank, so the resized copy no longer looked like the same erased circle — the erase pattern appeared shifted and mis-scaled.

**Root cause:** Non-destructive erase strokes (`el.eraseStrokes`) store points in element-local **absolute** units (relative to `x/y`). Moving a shape works for free (points are relative to `x/y`), but resizing changes `width/height` without touching the stored points, so holes drift. The deeper trap: `applyResize` reads its initial snapshot from `pState.initialPositions`, which for resize is populated by **inline** `initialPositions.set(...)` calls (one for single-element, one for multi/box resize) — *not* the `captureInitialPositions` helper. The first fix added scaling + captured `eraseStrokes` in the helper, but the inline snapshots still omitted it, so `init.eraseStrokes` was `undefined` and the scaling silently no-opped.

**Resolution:** Added a `scaleEraseStrokes(strokes, scaleX, scaleY)` helper (points scaled by `scaleX/scaleY`, radius by the geometric mean for area-preserving behavior under non-uniform resize) and applied it in both the single-element and group branches of `applyResize`. Crucially, also added `eraseStrokes` capture to **all three** initial-position snapshot sites (the `captureInitialPositions` helper plus the two inline `initialPositions.set` calls). Holes now track the shape through resize and flips. Related: hit-testing now treats a click inside an erased hole as a miss (`isPointInEraseHole` in `hit-testing.ts`).

---

## 2026-05-22

### 95. Mermaid sequenceDiagram: all messages overlapped on a single horizontal line + label overflow above the head box

**Files modified:** `frontend/src/dsl/layout/strategies/sequence-layout.ts`, `frontend/src/dsl/engine/dsl-engine.ts`, `frontend/src/shapes/renderers/uml-general-renderer.ts`, `frontend/src/dsl/adapters/mermaid/sequence-parser.ts`

**Observation:** Imported Mermaid sequence diagrams rendered the lifeline header boxes correctly across the top, but every message arrow piled up on the same horizontal line below — labels mashed together, completely unreadable.

**Root cause:** Two bugs stacking.
1. `sequence-layout.ts` only positioned the lifeline nodes (all at `y = originY`) and never produced per-edge Y coordinates. Edges then went through the default `renderEdge → YappyAPI.connect()` path, which computes each connector's start/end by intersecting a straight line from source-center to target-center against the source/target bounding boxes. Because every lifeline shared a center-Y, every message resolved to the same horizontal line.
2. Compounding it: `umlLifeline`'s head-box was sized as `max(30, h * 0.2)`, so making a lifeline tall enough for many messages (e.g. `h = 1400`) also made its header box ~280 px tall — visually wrong.

**Resolution:**
- Made `computeSequenceLayout` give all lifelines a uniform tall height = `HEADER_HEIGHT + topPadding + edges.length * vSpacing + bottomPadding`, so their dashed bodies line up.
- Added a sequence-specific edge renderer `renderSequenceEdge` in the DSL engine. When `diagram.layout.strategy === 'sequence'`, the main edge loop dispatches to it instead of `renderEdge`. It places each message as a standalone arrow at `y = sourceLifelineTop + HEADER_HEIGHT + topPadding + i * vSpacing` going from `sourceCx` to `targetCx`. Self-messages (`A->>A`) render as a 3-segment elbow U-shape on the right side of the lifeline — the conventional UML notation.
- Capped `umlLifeline`'s head-box at 60 px (`min(60, max(30, h * 0.2))`) so tall sequence lifelines still get a normal-looking header. Backward-compatible: for `h ≤ 300` (all existing usage), the cap is a no-op.
- Gave `umlLifeline` a custom auto-size path in `computeFittedSize`. The generic `fitShapeToText` targets a square-ish aspect ratio, which made lifelines narrow and forced the label to wrap into 3–4 lines that then spilled out the top of the 60 px head-box. The lifeline path instead measures single-line label width *using the same font string as the renderer* (`getFontString`) and picks `width = ceil(singleLineW / 1.7) + padding` for labels wider than ~260 px (single-line up to that), so the label fits in ≤ 2 lines inside the head-box.
- Set `fontSize: 16` on lifeline nodes in the Mermaid sequence parser. The shape default is 28 px, and at 28 px a 2-line wrap totals ~67 px — overflowing the 60 px head-box bottom (`UploadFileData)` hanging out the bottom of the Postgres lifeline was the visible symptom). 16 px keeps 2 lines at ~38 px which fits cleanly. The autosize measurement now agrees with the renderer because both use the explicit `fontSize: 16` instead of disagreeing on which default to apply.

---

### 94. Mermaid sequenceDiagram import failed with "YSL lexer error" on Unicode arrows

**Files modified:** `frontend/src/dsl/parser/index.ts`

**Observation:** Pasting a valid Mermaid `sequenceDiagram` containing a `loop ... end` block and Unicode arrows (`→`) into the Import-from-Text dialog produced a YSL lexer error like `Line 17: [YSL lexer error] Line 17:31 — Unexpected character '→'.` The same diagram rendered fine on mermaid.live.

**Root cause:** `parseDSL` ran format detection in the order JSON → YSL → Mermaid → Text. `isYSLScript`'s heuristic flags any input where a trimmed line starts with `let|const|fn|for|if|else|end|template|use|group|animate|on|Yappy.`. Mermaid sequence diagrams legitimately contain `end` (closing a `loop`/`alt`/`opt` block), so the heuristic claimed the input as YSL before the Mermaid adapter ever got a chance. The YSL lexer then crashed on the first non-ASCII character it didn't recognise (`→` inside an edge label).

**Resolution:** Reordered detection so the Mermaid adapter runs before the YSL heuristic. The Mermaid adapter's `canParse` requires a strict diagram header (`sequenceDiagram`, `flowchart`, `classDiagram`, …) on the first non-comment line, so it cannot false-positive on a real YSL script — making it safe to consult first.

---

## 2026-05-07

### 93. Ink Brush — earlier strokes appeared lightened/erased where a new stroke crossed them

**Files modified:** `frontend/src/shapes/renderers/freehand-renderer.ts`

**Observation:** On iPad the user reported that drawing a new ink brush stroke that crossed an existing ink brush stroke made the **older** stroke look partially erased / lighter at the overlap region. Fineliner had no such artifact.

**Root cause:** `renderInkbrush` built a single closed polygon — left edge (forward) → end-cap arc → right edge (reversed) → start-cap arc — and filled it once. The edges go through perpendicular blending (`blend = 0.6`) and two passes of `smoothEdge`, and the path itself uses `quadraticCurveTo`. On curvy or back-tracking strokes the resulting polygon was self-intersecting. Under the canvas default `nonzero` fill rule, regions with even winding count don't fill, leaving small holes inside the new stroke. Where a hole sat over an earlier stroke, the gap revealed the canvas behind, and the user read that as the earlier stroke being "lightened/erased" at the overlap. Fineliner uses `stroke()` with rounded caps so it is immune to this class of artifact.

**Resolution:** Replaced the single-polygon-and-fill with per-segment trapezoids + per-point joint circles. Variable width and velocity-based taper are preserved unchanged. Joint circles also serve as round start/end caps.

**First pass had a winding bug — fixed in second pass:** initial implementation batched all trapezoids and circles into ONE path with a single `fill()`, expecting nonzero to sum windings. It did not work: trapezoids ordered `A-left → B-left → B-right → A-right` are visually CCW on screen, while `arc(x, y, r, 0, 2π)` with the canvas-default `counterclockwise=false` is visually CW. Under nonzero, opposite windings *cancel* where they overlap. The result was a beaded chain — every joint circle cancelled the trapezoid stretch beneath it, leaving the stroke as discrete pearls separated by gaps. Switched to one `beginPath() + fill()` per trapezoid and per circle; independent fills compose via `source-over` regardless of winding, and the per-stroke fill cost is bounded (a typical stroke has tens-to-low-hundreds of small convex fills).

---

## 2026-05-06

### 92. iPad Apple Pencil strict alternate-empty-stroke pattern — touchend self-heal

**Files modified:** `frontend/src/components/canvas.tsx`

**Observation:** User report after v0.27.13: writing 1-2-3-4-5 with Apple Pencil produced **only odd strokes** (1, 3, 5). Strict alternation is the diagnostic — it means stroke 2's `touchstart` was reaching the handler but bailing on the `pState.isDrawing` early-return.

**Root cause:** v0.27.11 added a `findTouchById(e, activeTouchIdentifier)` gate to `handleTouchEnd` for palm safety. On iPad, `touchend` events sometimes don't carry the tracked identifier in `changedTouches` — and when that happens, the gate silently dropped the legitimate end. `pState.isDrawing` and `touchDrivingPenStroke` stayed stuck. Stroke 2 then saw the stuck state and bailed. After its silent failure the state reset, stroke 3 started clean, stroke 4 hit the same trap, etc.

**Resolution:** Two fixes.
1. `handleTouchEnd` now finalizes unconditionally when `touchDrivingPenStroke` is true. iPadOS's system-level palm rejection filters non-pen touches when an Apple Pencil is paired, so the gate was over-defensive.
2. `handleTouchStart` self-heals any stuck state at the top via a `finalizeTouchStroke()` helper. A stuck flag from any cause now resolves on the next touch instead of blocking every subsequent stroke.

---

### 91. iPad Apple Pencil stroke latency — sync flush + sync draw in touchmove

**Files modified:** `frontend/src/components/canvas.tsx`

**Observation:** Even after v0.27.12 reduced the reactive-cascade cost, user reported persistent visible lag — same on Chrome on iPad (which uses WebKit on iOS, so it's engine-wide). The reference demo at https://github.com/shuding/apple-pencil-safari-api-test runs perfectly because it draws synchronously inside `touchmove`.

**Root cause:** Our `handleTouchMove` was scheduling `flushPenPoints` and `draw` via `requestAnimationFrame`, adding 1-2 frames of delay between pen tip and visible stroke.

**Resolution:** Switched `handleTouchMove` to call `flushPenPoints()` and `draw()` synchronously, matching the demo's pattern. With v0.27.12's O(1) reactive cascade, sync flush is sub-ms and sync draw fits inside a frame at typical doc sizes. The compositor picks up the canvas at next vsync — same latency profile as the demo.

---

### 90. iPad Apple Pencil stroke latency — O(n × 80) per-element property iteration in main redraw effect

**Files modified:** `frontend/src/components/canvas.tsx`, `frontend/src/store/app-store.ts`

**Observation:** User reported persistent stroke lag with Apple Pencil on **both Safari and Chrome on iPad**. Both use WebKit on iOS, so the bottleneck is engine-wide.

**Root cause:** The canvas's main redraw effect was iterating every element and reading 80+ properties on each one (`e.x; e.y; ... e.bpmnEventType; ... e.orbitDirection;`) to subscribe to all possible per-property change triggers. Solid stores its proxy traversal cost per access. At Apple Pencil's ~120 Hz event rate every `flushPenPoints` triggered the effect; with even 50 elements that's 4000 proxy reads per flush, tens of thousands per second. JS thread saturation, visible stroke lag.

**Resolution:** Replaced the per-element forEach with a single dependency on `store.dirtyRevision`. `updateElement` (and `addElement` / `deleteElements`) bump it on every mutation. The effect fires the same way as before but at O(1) cost instead of O(elements × properties). The 80-property reads were a maintenance liability anyway — every time someone added a property they had to remember to add a tracking line here.

---

### 89. iPad palm + pen multi-touch dropped strokes — pick stylus from changedTouches

**Files modified:** `frontend/src/components/canvas.tsx`

**Observation:** v0.27.9's TouchEvent path didn't fully fix the alternate-empty-stroke pattern when the user wrote with Apple Pencil while resting their palm on the canvas.

**Root cause:** `handleTouchStart` bailed early on `e.touches.length !== 1`, which is true whenever palm + pen are both on the screen. The TouchEvent path then deferred to PointerEvents, which is the broken path on iPad.

**Resolution:** Pick the `touchType: 'stylus'` Touch from `changedTouches` (Apple Pencil reports `'stylus'`, finger reports `'direct'`), track it by `identifier` for the rest of the stroke, and ignore moves/ends for any other touch (palm shifting, palm lift). Also call `requestAnimationFrame(draw)` per `touchmove` to match the pointer-path's draw cadence.

---

### 88. Apple Pencil hover triggered drawing

**Files modified:** `frontend/src/components/canvas.tsx`

**Observation:** After v0.27.9, Apple Pencil 2 / Pro made marks on the canvas just from hovering, before actually touching.

**Root cause:** Apple Pencil 2 / Pro fire `pointermove` events with `pointerType: 'pen'` and `pressure: 0` while hovering near the screen. v0.27.8's pointermove recovery branch synthesized a `drawOnDown` from any pen pointermove without an active stroke — when the `pressure > 0` check was loosened in a follow-up iteration, hovers started triggering strokes.

**Resolution:** Removed the pointermove recovery branch entirely. v0.27.9's TouchEvent path is the load-bearing fix for missed-pointerdown on Apple Pencil; the pointermove synthesizer was a redundant safety net that became hover-active.

---

### 87. iPad Apple Pencil alternate-stroke loss — TRUE fix: switch pen tools to TouchEvents

**Files modified:** `frontend/src/components/canvas.tsx`

**Critical user reference:** https://github.com/shuding/apple-pencil-safari-api-test works perfectly on iPad with Apple Pencil. That demo uses **TouchEvents** (`touchstart`/`touchmove`/`touchend`), not PointerEvents.

**Root cause:** iPad Safari's PointerEvent delivery for Apple Pencil drops alternate events on rapid lift+recontact. The OS swallows the next `pointerdown` while it checks for system gestures (Apple Pencil double-tap shortcut, etc.). No JavaScript palm-rejection logic, snapshot optimization, capture try/catch, or pointermove fallback can rescue the stroke if the events never reach the page. **TouchEvents are unaffected** — Apple's Pencil Safari API is designed around TouchEvents and surfaces all pen-specific data (`force`, `touchType: 'stylus'`, `altitudeAngle`, `azimuthAngle`) through them.

**Resolution:** Added native TouchEvent listeners on the canvas (registered with `passive: false` so `preventDefault()` works). For pen-drawing tools (fineliner, inkbrush, marker, ink), TouchEvents drive the entire stroke:
- `touchstart` → preventDefault, mark `touchDrivingPenStroke = true`, call `drawOnDown` with the touch's coordinates.
- `touchmove` → push to `penPointsBuffer`, schedule RAF flush.
- `touchend` / `touchcancel` → flush buffer, `drawOnUp`, clear flag.

The `touchDrivingPenStroke` flag tells the existing PointerEvent handlers to skip cleanly. iOS fires both PointerEvents and TouchEvents for the same physical contact; without the flag, the same stroke would be processed twice. For non-drawing tools (selection, pan, shapes, etc.) and for desktop mouse, PointerEvents continue to drive everything — no behavioral change.

The chain of prior partial fixes (v0.27.4, v0.27.6, v0.27.7, v0.27.8) each addressed a real but secondary issue and are carried over. None of them could fully solve the symptom because the underlying PointerEvent suppression was at the OS level, beyond JS's reach. The TouchEvent path bypasses it entirely.

---

### 86. iPad Apple Pencil alternate-stroke loss — REAL cause: iPadOS double-tap gesture suppression

**Files modified:** `frontend/src/components/canvas.tsx`

**Critical diagnostic from the user:** finger writing on iPad works fine. Mouse on desktop works fine. **Only Apple Pencil fails on rapid lift+recontact.** That rules out every prior hypothesis (JS blocking, history cost, reactive cascades, capture timing) — those would affect finger too.

**Root cause:** iPadOS's Apple Pencil double-tap gesture detector. When the Pencil lifts and re-contacts within ~150 ms (the tap-the-side-of-the-Pencil shortcut window), iPadOS briefly suppresses the alternate `pointerdown` event from being dispatched to web JS while it disambiguates the gesture. The `pointermove` and `pointerup` events for that stroke still fire normally — but `pState.isDrawing` is `false` because `drawOnDown` never ran. `handlePointerMove`'s `if (!isDrawing) return;` early-return then drops the entire stroke. The user sees alternate empty characters.

This is consistent with every observed symptom: cursive works (no lift), slow writing works (time exceeds the gesture window), finger works (not a Pencil gesture), mouse works (not a Pencil gesture).

**Resolution:** Added a recovery branch in `handlePointerMove`: when a `pointerType: 'pen'` event arrives with `pressure > 0` while a pen-drawing tool is active and `!pState.isDrawing`, synthesize the missed `drawOnDown` from the move's coordinates and fall through to the normal pen-on-move path. The synthesized stroke starts ~1 pointermove later than the real would have (~8 ms at Pencil's 120 Hz) — invisible at the same animation frame.

This is a workaround, not a fix to the OS behavior. Web JS can't intercept iPadOS gesture detection. But the recovery rescues every stroke whose `pointerdown` got swallowed.

The defensive triple in v0.27.7 (try/catch on capture, loosened palm rejection, RAF flag reset) and the v0.27.6 shallow snapshot are still correct fixes for separate problems and stay in place.

---

### 85. iPad alternate-stroke loss — defensive triple (capture throw, palm window, RAF flag)

**Files modified:** `frontend/src/components/canvas.tsx`

**Observation:** Even after v0.27.6's history-snapshot fix, fast non-cursive writing on iPad with Apple Pencil still showed every-other-stroke going empty. Cursive (one continuous stroke) remained fine. Mouse on desktop fine.

**Root cause(s) — three independent failures, each enough to drop a stroke:**

1. **`setPointerCapture` throwing `InvalidStateError`.** When iPad hasn't fully released the previous pointer by the time the next `pointerdown` fires very quickly, calling `setPointerCapture(newPointerId)` can throw. An uncaught throw inside an event handler aborts the rest of the handler, so `drawOnDown` never ran and the stroke was silently lost.

2. **Palm-rejection 700 ms grace window.** v0.27.1 rejected any `pointerType: 'touch'` event for 700 ms after a pen contact. iPad Safari occasionally re-classifies an Apple Pencil tap as `touch` with `width: 0` (no contact-area data) — v0.27.4's width heuristic only caught events with explicit small width, not the no-width case. The window was filtering legitimate Pencil downs between rapid strokes.

3. **`penUpdatePending` RAF flag stuck.** If the previous stroke's scheduled `requestAnimationFrame` hadn't fired by the time the next stroke started, the flag remained `true` and the new stroke's first pointermoves skipped scheduling their own flush. Doesn't lose data outright (the stale RAF eventually flushes to the current stroke), but combined with the other two failures this could mask which one was actually firing.

**Resolution:**
1. Wrapped `setPointerCapture` and `releasePointerCapture` in try/catch. Capture failure no longer aborts the handler — `drawOnDown` always gets to run.
2. Dropped the 700 ms time window. Touch events are now only blocked while a pen is **currently** in contact (`activePenPointerId !== null`). Relies on iPadOS's system-level palm rejection (which is excellent for paired Apple Pencils) as the primary defense; this JS check is now just a safety net for during-stroke palm interference.
3. Reset `pState.penUpdatePending = false` and `pState.penPointsBuffer = []` on every `pointerdown` so each stroke starts with a clean RAF state.

The v0.27.4 `isPencilSizedTouch` heuristic and v0.27.6 structural-share history snapshot remain in place — both are correct fixes for separate problems. The "alternate empty strokes" bug was a stack of four independent issues, with each release peeling off one layer.

---

### 84. iPad/Apple Pencil alternate-stroke loss — REAL root cause: pushToHistory deep clone

**Files modified:** `frontend/src/store/app-store.ts`

**Observation:** v0.27.4's palm-rejection heuristic (`isPencilSizedTouch`) was claimed to fix the alternate-stroke loss but didn't. User reports persisted: writing fast on iPad with Apple Pencil → every other character empty.

**Root cause (the real one):** Every stroke's `drawOnDown` calls `addElement`, which calls `pushToHistory()`. `pushToHistory` snapshots the document via `JSON.parse(JSON.stringify(...))` on `elements`, `layers`, `slides`, `states`, and `gridSettings`. On iPad with a populated document this synchronous serialize+parse takes 50-100 ms per call. At Apple Pencil's writing-speed cadence (5+ chars/sec), that 50-100 ms blocks the JS main thread long enough for Safari to coalesce or drop the next stroke's `pointerdown`. With no `pointerdown`, `drawOnDown` never runs, `isDrawing` stays false, and the subsequent `pointermove`/`pointerup` events have nothing to attach to. The whole stroke is silently lost.

This explains every symptom: slow writing works (thread recovers), cursive works (one snapshot per stroke regardless of length), mouse on desktop unaffected (slower event rate + faster JSON on desktop CPU), iPad fast writing drops alternates (each snapshot eats the window).

**Resolution:** Replaced the deep clone with a structural-share shallow snapshot:

```ts
const captureSnapshot = (): HistorySnapshot => ({
    elements: store.elements.slice(),
    layers: store.layers.slice(),
    slides: store.slides.slice(),
    states: store.states.slice(),
    gridSettings: { ...store.gridSettings },
    canvasBackgroundColor: store.canvasBackgroundColor,
    docType: store.docType,
});
```

Safe because every mutation in the app goes through Solid's `setStore` (verified by grep — no direct array/property mutations anywhere in `frontend/src`). Solid's reactive store replaces references on the modified path, so unchanged elements keep their refs and the snapshot's array is an immutable view of state at snapshot time. Cost drops from O(n × depth) to O(n) — sub-millisecond even with 1000+ elements. Main thread stays responsive.

The v0.27.4 `isPencilSizedTouch` heuristic remains in place (still useful for the rare case Safari truly misclassifies a Pencil tap), but the structural snapshot is the load-bearing fix.

---

### 83. iPad: no gesture to open per-tool defaults (right-click was the only path)

**Files modified:** `frontend/src/components/toolbar.tsx` and all 16 tool-group components (`pen-tool-group.tsx`, `shape-tool-group.tsx`, `text-tool-group.tsx`, `connector-tool-group.tsx`, `infra-tool-group.tsx`, `cloud-infra-tool-group.tsx`, `data-metrics-tool-group.tsx`, `connection-rel-tool-group.tsx`, `wireframe-tool-group.tsx`, `sketchnote-tool-group.tsx`, `status-tool-group.tsx`, `mindmap-tool-group.tsx`, `bpmn-tool-group.tsx`, `uml-tool-group.tsx`, `ds-tool-group.tsx`, `technical-tool-group.tsx`).

**Observation:** Right-clicking a toolbar button on desktop opens the property panel for that tool, with the panel auto-switching into "Defaults" mode — anything set there is saved to `store.toolStyles[tool]` and applied to future strokes drawn with that tool. iPad users had no equivalent gesture; the v0.27.1 `if (e.button !== 2) return` filter (added to suppress canvas palm-rest contextmenu) was inadvertently blocking iPadOS's native long-press → contextmenu mapping on toolbar buttons too.

**Resolution:**
- Removed the `e.button === 2` filter from every toolbar `handleRightClick`. iPad long-press now opens the property panel via the native contextmenu pathway. Toolbar buttons aren't a palm-rest target, so re-enabling this doesn't reintroduce the v0.27.1 canvas issue (canvas `onContextMenu` keeps its filter).
- Added `onDblClick={handleRightClick}` to every toolbar button. Two quick taps on a tool button also opens its defaults panel — faster than long-press for users who learn the gesture.

The two gestures share a handler so behavior is identical.

---

### 82. iPad: alternate Apple Pencil strokes dropped when writing fast; Canvas Settings unreachable

**Files modified:** `frontend/src/components/canvas.tsx`, `frontend/src/components/menu.tsx`

**Observation:** With Apple Pencil on iPad, writing characters quickly produced a "skip every other one" pattern — first character draws, next empty, third draws, fourth empty. Cursive (one continuous stroke) was fine. Separately, since v0.27.1's `e.button === 2` filter on the canvas `onContextMenu`, iPad users had no way to open Canvas Settings (the only entry point was the canvas right-click menu).

**Root cause #1 (alternate strokes):** iPad Safari occasionally misclassifies the first `pointerdown` of a rapid consecutive Apple Pencil tap as `pointerType: 'touch'` instead of `'pen'`. v0.27.1's palm rejection blocked such events whenever a pen had been used in the last 700 ms — exactly the situation between fast strokes — so `drawOnDown` never ran. Subsequent `pointermove` and `pointerup` events arrived correctly as `'pen'` but had nothing to attach to (`isDrawing` was still false), so the whole stroke disappeared.

**Root cause #2 (Canvas Settings access):** `setShowCanvasProperties(true)` was only wired to the "Canvas Settings" item in the canvas context menu (`context-menu-builder.ts:1135`). After the v0.27.1 contextmenu filter blocked touch/pen long-press, iPad had no path to it.

**Resolution:**
- **Heuristic palm rejection:** added `isPencilSizedTouch(e)` checking `PointerEvent.width` and `height`. Apple Pencil tip reports ~1-2 px; finger ~25-40 px; palm 50+. Touch events with `width ≤ 5 && height ≤ 5` are treated as misclassified Pencil contact — they pass the rejection filter and also promote `activePenPointerId` so palm contacts in the same stroke are still blocked. Real palm contacts (large contact area) remain rejected.
- **Pointer cancel:** added `onPointerCancel={handlePointerUp}` so iOS-initiated stroke cancellations don't leave `isDrawing: true` and `currentId` set.
- **Menu entry:** added "Canvas Settings" to the main hamburger menu (alongside Properties Panel). Clearing selection + opening the property panel in canvas-properties mode is the same effect as the context-menu item.

---

### 81. iPad fast-write with Apple Pencil pops iOS "Copy / Look Up / Translate" menu

**Files modified:** `frontend/src/index.css`

**Observation:** Writing quickly with Apple Pencil on iPad would intermittently surface iOS Safari's native text-selection callout (Copy / Find Selection / Look Up / Translate), interrupting the stroke and breaking the user's flow.

**Root cause:** v0.27.1 set `-webkit-touch-callout: none` and `-webkit-user-select: none` **inline on the `<canvas>` element only**. The callout-suppress rules don't reach the `.canvas-drop-zone` wrapper or any other element on the page; rapid Pencil contact that briefly lands on the wrapper (or any chrome under it) is enough for iPadOS Safari to interpret it as the start of a text-selection gesture and surface the menu.

**Resolution:** Moved the suppression up to `html, body` in `index.css`, where the inheritable properties (`-webkit-touch-callout`, `-webkit-user-select`, `user-select`) cascade to every descendant. Added explicit `input, textarea, [contenteditable]` overrides so editable surfaces keep working as text fields. Also added `-webkit-tap-highlight-color: transparent` (kills iOS's grey tap flash) and `overscroll-behavior: none` (kills the rubber-band that can also be misread as a gesture). `touch-action` is intentionally left default so scrollable panels still scroll on touch — only the canvas itself opts into `touch-action: none`.

---

### 80. iPad / Apple Pencil: 0.27.1 dropped strokes between letters; inkbrush flickered white

**Files modified:** `frontend/src/utils/tool-handlers/pen-handler.ts`

**Observation (regression introduced by #79 in 0.27.1):** With fineliner on iPad + Apple Pencil, the first letter rendered fine, the next sometimes produced nothing, the third worked again — clearly a dropped `pointerdown`. Cursive (one continuous stroke) was fine. Inkbrush appeared to "erase" itself with white as the user wrote. Desktop mouse was unaffected.

**Root cause:** #79 removed the 16 ms wall-clock throttle in `penOnMove` and replaced it with a synchronous `flushPenPoints()` on **every** `pointermove`. Apple Pencil fires `pointermove` at ~120 Hz on iPad; that meant 120 Solid `setStore` calls per second, each cascading through every reactive subscriber on the canvas. The JS main thread saturated, occasionally swallowing the next stroke's `pointerdown` and rendering inkbrush mid-update (which paints multiple semi-transparent passes — caught half-way it looks like a white wash). Mouse worked because mouse fires at ~60 Hz so the store wasn't overwhelmed.

**Resolution:** Replaced sync flush with a RAF-coalesced flush. Coalesced events still push every Pencil sample into `penPointsBuffer` (no input resolution lost), but the buffer is flushed to the store at most once per animation frame via `requestAnimationFrame`. Mutation rate is now capped at display refresh (~60 Hz), the main thread stays responsive for pointer events, and inkbrush only sees complete points arrays per draw.

The implementation is tighter than 0.27.0's original code — no wall-clock branch, just the RAF path — so Pencil samples never wait an *extra* frame; they hit the very next vsync.

---

### 79. iPad / Apple Pencil: palm rest opens context UI; pen drawing feels laggy

**Files modified:** `frontend/src/components/canvas.tsx`, `frontend/src/utils/pointer-state.ts`, `frontend/src/utils/tool-handlers/pen-handler.ts`, plus `handleRightClick` filter added to all 17 toolbar/tool-group components (`toolbar.tsx`, `pen-tool-group.tsx`, `shape-tool-group.tsx`, `text-tool-group.tsx`, `connector-tool-group.tsx`, `infra-tool-group.tsx`, `cloud-infra-tool-group.tsx`, `data-metrics-tool-group.tsx`, `connection-rel-tool-group.tsx`, `wireframe-tool-group.tsx`, `sketchnote-tool-group.tsx`, `status-tool-group.tsx`, `mindmap-tool-group.tsx`, `bpmn-tool-group.tsx`, `uml-tool-group.tsx`, `ds-tool-group.tsx`, `technical-tool-group.tsx`).

**Observation:** On iPad, resting a palm on the screen while drawing with Apple Pencil (a) opened the canvas context menu / property panel (depending on which surface the palm landed on) and (b) drew/dragged through the palm contact. Separately, Apple Pencil strokes felt jittery and laggy compared to native iPadOS apps.

**Root cause:**
- iOS Safari synthesizes a `contextmenu` MouseEvent (with `button === 0`) from any long-press, including a resting palm. The canvas `onContextMenu` handler and every toolbar button's `handleRightClick` blindly opened menus on any contextmenu — desktop or touch.
- No code looked at `e.pointerType` anywhere — palm touches and the Pencil were treated identically, so a palm landing during a stroke generated competing `pointerdown`/`move` events.
- `pen-handler.ts` buffered coalesced events but flushed the store at most once per 16ms wall-clock (`PEN_UPDATE_THROTTLE_MS`). Combined with the outer pointermove RAF, an Apple Pencil sample at ~120Hz could sit one full frame in the buffer before being drawn — visibly laggy and stuttery.

**Resolution:**
1. **Palm rejection.** Added `lastPenInputAt` / `activePenPointerId` / `lastPointerType` to `PointerState`. `handlePointerDown/Move/Up` now record pen contact and ignore any `pointerType === 'touch'` event while a pen is active or was used within the last 700ms. The canvas `<canvas>` also gains `-webkit-user-select: none` and `-webkit-touch-callout: none` inline styles to suppress iOS's own callout.
2. **Context menu filter.** Both the canvas `onContextMenu` and every toolbar `handleRightClick` now early-return unless `e.button === 2` — only a real mouse right-click opens menus. Touch/pen long-press is silently swallowed.
3. **Pen smoothness.** Removed the 16ms wall-clock throttle in `pen-handler.ts`. Coalesced events are still collected (so no resolution is lost), but the store flush now runs on every pointermove and naturally batches with the existing RAF draw scheduled by `handlePointerMove`. Apple Pencil samples no longer wait a frame before becoming visible.

The `PEN_UPDATE_THROTTLE_MS` constant in `canvas.tsx` is preserved for now but unused inside `penOnMove` (parameter renamed to `_PEN_UPDATE_THROTTLE_MS` to mark deprecated).

---

## 2026-05-03

### 78. Dark mode only re-skinned UI; no system theme; legacy drawings invisible on dark canvas

**Files modified:** `frontend/src/types/slide-types.ts`, `frontend/src/store/app-store.ts`, `frontend/src/utils/canvas-renderer.ts`, `frontend/src/components/canvas.tsx`, `frontend/src/components/menu.tsx`, `frontend/src/components/property-panel.tsx`, `frontend/src/config/properties.ts`, `frontend/src/utils/command-registry.ts`, `docs/dark-light-theme.md`

**Observation:** The `dark` theme only restyled UI chrome — the canvas stayed white. A real dark drawing surface only existed in `focus` mode, and even there a black-stroked drawing imported from light mode was invisible until manually re-colored. There was also no way to follow the OS theme.

**Root cause:** `setTheme()` treated only `focus` as "dark" for canvas purposes, and yappy painted shape colors as-is — there was no concept of theme-canonical colors or render-time inversion. No `prefers-color-scheme` listener existed.

**Resolution:** Adopted Excalidraw's model. Added a `system` choice and a `resolvedTheme` derived value (light/dark/focus). Stored colors are now treated as canonical (light-mode); a CSS `invert(93%) hue-rotate(180deg)` filter applied to the host `<canvas>` element handles dark presentation without mutating any stored data. A `matchMedia` listener re-resolves live when the OS flips and the user's choice is `system`. One-time migration (gated by `theme-canonical-v1` localStorage flag) flips any saved `#ffffff` default stroke/text back to `#000000` so older focus-mode users don't regress. Toggle now cycles `light → dark → focus → system`. Known limitation: embedded raster images appear inverted in dark/focus until per-image counter-inversion is implemented (TODO marker in `canvas.tsx`).

---

## 2026-04-11

### 77. Canvas Texture dropdown not persisted — reset on reload or slide switch

**Files modified:** `frontend/src/types/slide-types.ts`, `frontend/src/store/app-store.ts`, `frontend/src/config/properties.ts`, `frontend/src/utils/canvas-renderer.ts`, `frontend/src/components/canvas.tsx`, `frontend/src/api.ts`

**Observation:** The Canvas Texture dropdown (None / Dots / Grid / Graph Paper / Recycled Paper) in the canvas property panel appeared to "work" in a single session, but choosing a texture was forgotten on reload. Switching slides did not carry the choice either — the texture silently reverted to `'none'`.

**Root cause:** `canvasTexture` was a global field on the `AppState` store only. It was never mirrored onto the active slide, never included in `saveActiveSlide`, never restored in `setActiveSlide` / `loadDocument`, and the `Slide` interface had no `canvasTexture` field, so the v4 document format had nowhere to hold it.

**Resolution:** Promoted `canvasTexture` to a per-slide setting. Added the field to `Slide`, updated `setCanvasTexture` to write through to the active slide (+ `bumpDirtyRevision`), taught `saveActiveSlide` / `setActiveSlide` / `loadDocument` to round-trip it, and kept the store field as a reactive projection of the active slide so the renderer path is unchanged. Also added a new `'notebook'` texture option (faint blue ruled horizontal lines) for classroom-notebook style canvases. Intentionally no vertical margin rule — infinite canvas has no meaningful anchor for a single vertical line.

---

## 2026-03-25

### 76. containerText verticalAlign ignored — text always centered, overlapping arrows

**Files modified:** `frontend/src/shapes/base/render-pipeline.ts`

**Observation:** Shapes with `containerText` and bound arrows had text rendering at the vertical center, overlapping with arrows passing through the shape. Setting `verticalAlign: 'top'` or `'bottom'` had no effect.

**Root cause:** `renderText()` calculated `startY` as `cy - metrics.textHeight / 2 + metrics.lineHeight / 2`, always centering at the shape's center point. The `verticalAlign` property was never read for containerText (only worked for standalone text elements in `text-renderer.ts`). Same issue in `renderRichText()`.

**Resolution:** Added verticalAlign support to both `renderText()` and `renderRichText()` in render-pipeline.ts. When `verticalAlign` is `'top'`, text starts at `cy - height/2 + padding`. When `'bottom'`, text positions near the bottom edge. Default `'middle'` preserves existing behavior.

---

## 2026-03-05

### 75. Slide panel drag-to-rearrange not working

**Files modified:** `frontend/src/app.tsx`

**Observation:** In the slide navigator panel, dragging slides to rearrange their order did nothing — the drop never registered.

**Root cause:** Three global drag-and-drop handlers in `app.tsx` (for image file drops onto the canvas) were registered on `window` in capture phase. `handleGlobalDrop` called `e.preventDefault()` + `e.stopPropagation()` on every drop event, killing it before the slide navigator's `handleDrop` could fire. `handleGlobalDragEnter` and `handleGlobalDragOver` also overrode `dropEffect` to `'copy'`.

**Resolution:** Added early-return guards to all three global handlers: if the event target is inside `.slide-navigator` or `.layer-panel`, the global handler steps aside and lets the component handle its own drag-to-rearrange logic.

---

### 74. Presentation mode: clicking locked elements selects instead of advancing slide

**Files modified:** `frontend/src/utils/tool-handlers/minor-handlers.ts`

**Observation:** In slide presentation mode (F5), clicking anywhere on a slide with locked elements would select the topmost element rather than advancing to the next slide. Clicking outside the slide boundary (empty canvas) worked correctly.

**Root cause:** In `presentationOnDown()`, the hit-test loop iterates elements top-to-bottom. When a hit is found, it checks for special types (openBox, DS elements) then falls through with `return false`, passing control to `selectionOnDown` which selects the element. Locked elements were not exempted from this path.

**Resolution:** Added `if (el.locked) break;` before the `return false` fallthrough. When a locked element is hit, the loop breaks out, skips to the deselect/dismiss logic, and falls through to `advancePresentation()`. Unlocked elements (ink annotations, moved shapes) remain interactive.

---

## 2026-03-02

### 73. Flow animation reverse shows solid dark line instead of animated dashes

**Files modified:** `frontend/src/shapes/renderers/connector-renderer.ts`, `frontend/src/shapes/renderers/path-renderer.ts`

**Observation:** Enabling flow animation on an arrow/connector and then toggling "Reverse" produced a solid dark line instead of dashes flowing in the opposite direction.

**Root cause:** JavaScript's modulo operator (`%`) returns negative values for negative operands. When `flowReverse = true`, the offset becomes negative, making `(d + offset) % gap` return negative results that always satisfy `< speed / 10` — so every pulse/dot is drawn, creating a solid line.

**Resolution:** Changed all modulo checks from `(d + offset) % gap` to `((d + offset) % gap + gap) % gap` (positive modulo) in connector-renderer (3 occurrences: bezier, elbow, straight) and path-renderer (1 occurrence).

---

### 72. High CPU usage on idle canvas (no animations, no interaction)

**Files modified:** `frontend/src/utils/animation/animation-engine.ts`, `frontend/src/store/app-store.ts`, `frontend/src/components/canvas.tsx`, `frontend/src/utils/tool-handlers/minor-handlers.ts`, `frontend/src/utils/recording-manager.ts`

**Observation:** Chrome/Edge tabs running yappydraw showed elevated CPU even when the canvas was idle with no active features.

**Root cause:** Multiple issues: (1) Animation engine rAF loop continued running when paused/idle animations existed in the map (condition `this.animations.size > 0`), and unconditionally updated SolidJS signals (`effectiveTime`, `globalTime`) every frame, triggering the main canvas createEffect to schedule full-scene redraws at 60fps. (2) Ink overlay cleanup `setInterval` ran every 500ms forever, scanning all elements. (3) `setCursorPosition` updated the SolidJS store on every pointermove (60+/sec). (4) Recording manager thumbnail effect tracked `store.elements` proxy, firing on every deep property change.

**Resolution:** (1) Changed loop condition to `hasRunningAnimations || this.forceTicker` and gated signal updates behind the same check. (2) Converted ink cleanup to demand-based interval that starts when ink elements are created and stops when none remain. (3) Coalesced cursor position updates via `requestAnimationFrame`. (4) Changed thumbnail effect to track `store.elements.length` instead of `store.elements`.

---

## 2026-03-01

### 71. Slide content invisible after exiting presentation mode

**Files modified:** `src/components/canvas.tsx`, `src/store/app-store.ts`

**Observation:** After exiting slideshow presentation and returning to design mode, clicking on slides in the navigator showed a blank canvas — the slide content existed but was out of the viewport.

**Root cause:** When exiting presentation mode, `appMode` switches to `'design'` before `exitFullscreen()` fires. The `fullscreenchange` → `handleResize` handler only called `zoomToFitSlide()` when `appMode === 'presentation'`, so the viewport was never re-fitted to the smaller design-mode window. Additionally, clicking the already-active slide in the navigator early-returned without correcting the viewport.

**Resolution:** (1) Changed `handleResize` to zoom-to-fit for all slide documents (`store.docType === 'slides'`) regardless of app mode. (2) When clicking the already-active slide in the navigator, call `zoomToFitSlide()` before returning to re-center the viewport.

---

## 2026-02-28

### 70. Slide element strokes invisible despite strokeColor being set

**Files modified:** `src/utils/slide-element-factory.ts`

**Observation:** AI-generated slide elements that had an explicit `strokeColor` (e.g., card-grid icons with `p.primary`, two-column cards with `p.primary + '33'`) showed no visible stroke/border.

**Root cause:** All element factory helpers (`rectEl`, `gradientRectEl`, `cardEl`, `shapeEl`) hardcoded `strokeWidth: 0` regardless of whether a `strokeColor` was provided.

**Resolution:** Each helper now derives `strokeWidth` from the resolved `strokeColor`: `stroke !== 'transparent' ? 1 : 0`. Elements without an explicit stroke still default to transparent/0.

---

### 69. Unsaved changes dialog Save & Continue button turns white on hover

**Files modified:** `src/components/unsaved-changes-dialog.css`

**Observation:** Hovering over the blue "Save & Continue" button in the unsaved changes dialog turned it white instead of maintaining its blue background.

**Root cause:** Global `button:hover { background-color: var(--btn-hover) }` rule in `index.css` (line 98) overrides the component's `.unsaved-btn-save` blue background on hover.

**Resolution:** Explicitly set `background: var(--primary-color)` on `.unsaved-btn-save:hover` and `.unsaved-btn-save:active`. Also fixed `.unsaved-btn-discard` hover/active states with explicit background colors.

---

## 2026-02-26

### 68. Slide operations (reorder, insert, delete, add) missing undo support and state persistence

**Files modified:** `src/store/app-store.ts`

**Observation:** Dragging slides to rearrange in the slide navigator didn't persist correctly — the active slide's state (background, dimensions) could be lost. Insert, delete, and add slide operations lacked undo support. Additionally, deleting the currently active slide left stale canvas background/dimensions because `setActiveSlide` returned early when the target index equaled the current active index.

**Root cause:** `reorderSlides()` was missing `saveActiveSlide()` (to persist active slide data before reorder) and `pushToHistory()` (for undo). Similarly, `addSlide()` and `insertNewSlide()` lacked `pushToHistory()`. `deleteSlide()` called `setActiveSlide(nextIndex)` inside a batch, but when deleting the active slide, `nextIndex === store.activeSlideIndex` caused the early return, leaving stale background/dimensions.

**Resolution:**
- Added `saveActiveSlide()`, `pushToHistory()`, bounds validation, and `batch()` to `reorderSlides()`
- Added `pushToHistory()` to `addSlide()` and `insertNewSlide()`
- Fixed `deleteSlide()` to temporarily set `activeSlideIndex = -1` when deleting the active slide, forcing `setActiveSlide` to re-sync background/dimensions. Also added `pushToHistory()`.

---

### 67. Animation state not restored when exiting presentation/slideshow mode

**Files modified:** `src/store/app-store.ts`, `src/utils/animation/slide-build-manager.ts`

**Observation:** After running animations in slideshow mode and pressing Escape to exit, elements remained in their mid-animation positions (moved, rotated, faded, etc.) in design mode, even though "restore state" was enabled. Infinite animations (spin, orbit) continued running after exit.

**Root cause:** The exit path called `slideBuildManager.restoreAll()` which ONLY restored opacity for `startHidden` elements. It did NOT: (1) stop running animations via `sequenceAnimator.stopAll()`, (2) restore element properties (x, y, angle, width, height, strokeColor, backgroundColor, etc.) that animations had directly mutated in the store.

**Resolution:**
- On presentation entry: snapshot all animatable properties (x, y, angle, opacity, width, height, colors, 3D props, etc.) for every element that has animations or physics
- On exit: call `slideBuildManager.reset()` (which stops all running animations AND restores hidden element opacities), then restore all captured element properties from the snapshot
- This ensures a clean return to the pre-presentation state regardless of what animations ran

---

## 2026-02-24

### 66. Sketch upload immediately cleared in AI Prompt Dialog

**Files modified:** `frontend/src/components/ai-prompt-dialog.tsx`

**Observation:** After uploading or pasting a sketch image in the AI Prompt Dialog, the image was immediately cleared — the preview never appeared and the dialog reverted to the empty upload state.

**Root cause:** The `createEffect` that handles dialog open/close reset called `clearSketch()` to reset state on open. However, `clearSketch()` reads `sketchPreview()` (to revoke the old object URL), and SolidJS automatically tracked this signal read as a dependency of the effect. When the user uploaded an image and `setSketchPreview(url)` fired, the effect re-triggered, calling `clearSketch()` which immediately nullified the just-uploaded image.

**Resolution:** Wrapped `clearSketch()` in `untrack(() => clearSketch())` inside the `createEffect`. `untrack()` executes the callback without tracking any signal reads, preventing `sketchPreview` from becoming a reactive dependency of the effect. The effect now only depends on `props.isOpen` as intended.

---

### 65. Slide panel not visible and numbering absent after localStorage restore

**Files modified:** `frontend/src/storage/auto-save.ts`, `frontend/src/store/app-store.ts`

**Observation:** After restoring a slide document from localStorage auto-save, the slide panel (SlideNavigator) was not visible. Pressing F5 entered presentation mode but without the slide numbering display (PresentationControls).

**Root cause:** `loadAutoSave()` had a guard `if (meta.elementCount === 0) return false;` that skipped restoring documents with zero drawn elements. A slides-mode document with slides but no drawn elements (e.g., just created or with only slide backgrounds) had `elementCount: 0`, so the restore was skipped entirely. The app stayed in its initial state (`docType: 'infinite'`), causing the outer `<Show when={store.docType === 'slides'}>` to be false — hiding both the SlideNavigator and the PresentationControls fallback.

**Resolution:**
1. Added `docType` and `slideCount` to `AutoSaveMeta` so the skip check can distinguish slides-mode documents from truly empty infinite canvases.
2. Changed the skip condition to: only skip if `elementCount === 0 AND not a slides document`.
3. Added bounds validation for `meta.activeSlideIndex` against `store.slides.length` during restore to prevent out-of-bounds index.
4. Normalized slide `order` property to match array index in `loadDocument()` to prevent order drift.

---

### 64. zoomIn/zoomOut animations not working on text elements

**Files modified:** `frontend/src/types.ts`, `frontend/src/utils/animation/element-animator.ts`, `frontend/src/shapes/base/render-pipeline.ts`

**Observation:** Applying zoomIn or zoomOut animations to text/richtext elements produced no visible zoom effect. The text just appeared in a tiny bounding box or reflowed awkwardly instead of visually scaling.

**Root cause:** Zoom animations worked by animating `width`/`height` of the element. For shape elements (rectangles, circles, etc.), this works because the shape geometry scales with dimensions. But text elements render at a fixed `fontSize` regardless of element width/height — text just wraps within the bounding box. Shrinking width/height to 10% made the bounding box tiny while text stayed the same size, producing no visual zoom.

**Resolution:** Added a `renderScale` property to `DrawingElement` that applies a canvas-level `ctx.scale()` transform around the element center in `RenderPipeline.applyTransformations`. Modified `zoomInEffect`/`zoomOutEffect` to detect text/richtext elements and animate `renderScale` (0.1→1 for zoomIn, 1→0.1 for zoomOut) + `opacity` instead of width/height. Non-text elements retain the original width/height animation behavior. Preview base states updated to save/restore `renderScale`.

---

## 2026-02-23

### 63. Duplicated slide not visible when clicked in slide panel

**Files modified:** `frontend/src/store/app-store.ts`

**Observation:** After duplicating a slide, clicking the new slide in the slide panel showed a blank canvas. The slide only became visible after running a slideshow and returning.

**Root cause:** `duplicateSlide()` deep-copies the source slide via `JSON.parse(JSON.stringify(sourceSlide))`, which copies `lastViewState`. This `lastViewState` contains `panX`/`panY`/`scale` pointing the viewport at the source slide's spatial position. But the duplicated slide lives at a new `spatialPosition` (2000px further right). When `applyImmediateSwitch` runs, it uses the inherited `lastViewState` (design mode prefers saved viewport), so the viewport points at the source slide's location while the renderer filters elements based on the duplicate's position — resulting in elements rendered off-screen.

**Resolution:** Added `lastViewState: undefined` to the new slide object in `duplicateSlide()`, forcing `applyImmediateSwitch` to call `calculateSlideViewState()` which computes the correct viewport from the slide's actual spatial position.

---

### 62. Canvas not redrawn when switching slides

**Files modified:** `frontend/src/components/canvas.tsx`

**Observation:** When switching between slides in the slide panel, the canvas sometimes didn't update to show the new slide's content.

**Root cause:** The main `createEffect` in `canvas.tsx` that triggers canvas redraws did not track `store.activeSlideIndex` as a reactive dependency. While `viewState` changes usually triggered redraws, `activeSlideIndex` itself — which determines which elements are filtered for rendering in `renderLayersAndElements()` — was not tracked.

**Resolution:** Added `store.activeSlideIndex` to the reactive dependency list in the canvas `createEffect`.

---

### 61. Text animations (scramble, typewriter, wordByWord, lineByLine) not rendering

**Files modified:** `frontend/src/utils/animation/element-animator.ts`

**Observation:** Text animations like textScramble, typewriter, wordByWord, lineByLine appeared to do nothing — the text remained static. Kinetic animations (move, fade, scale) worked fine.

**Root cause:** When text is edited via the text editor modal, both `text` (plain string) and `richText` (formatted spans array) are saved on the element. The text renderer always checks `richText` first (`text-renderer.ts:46`) — if it exists and has length > 0, it uses the rich text rendering path, completely ignoring `el.text`. Text animations only updated the `text` property via `updateElement()`, but never touched `richText`. So the renderer kept showing the unchanged `richText` content while the animated `text` was invisible. The guard in `updateElement` that auto-clears `richText` only applied to `type === 'richtext'` elements, not `type === 'text'` elements that also had `richText` set.

**Resolution:** Updated `getElementText()` to also return `richTextKey` and `savedRichText` when rich text formatting exists. All 8 text animation functions (typewriter, typewriterCursor, wordByWord, textScramble, textDelete, textReplace, textCountUp, lineByLine) now clear `richText`/`richContainerText` at animation start (so the renderer falls back to the plain text path) and restore the original rich text on animation complete (preserving formatting). Also fixed `getElementText` to handle `type === 'richtext'` elements which were previously excluded.

---

### 60. Dialogs still close when selecting text on Windows/Chrome

**Files modified:** `frontend/src/components/ai-prompt-dialog.tsx`, `frontend/src/components/ai-settings-dialog.tsx`, `frontend/src/components/cloud-storage-dialog.tsx`, `frontend/src/components/command-palette.tsx`, `frontend/src/components/dsl-import-dialog.tsx`, `frontend/src/components/export-dialog.tsx`, `frontend/src/components/file-open-dialog.tsx`, `frontend/src/components/help-dialog.tsx`, `frontend/src/components/load-export-dialog.tsx`, `frontend/src/components/menu.tsx`, `frontend/src/components/rocket-settings-dialog.tsx`, `frontend/src/components/save-dialog.tsx`, `frontend/src/components/settings-dialog.tsx`, `frontend/src/components/template-browser.tsx`, `frontend/src/components/text-editor-modal.tsx`

**Observation:** Despite the fix in #59, dialogs were still closing on text selection on Windows/Chrome. Additionally, 4 dialogs (text-editor-modal, rocket-settings-dialog, command-palette, menu backdrop) were missed entirely by fix #59 and had no `e.target === e.currentTarget` guard at all.

**Root cause:** On Windows/Chrome, when a user drag-selects text inside a dialog and the mouse drifts slightly outside the dialog content onto the overlay backdrop, the `mouseup` fires on the overlay. The resulting `click` event has `e.target` set to the overlay itself, so the `e.target === e.currentTarget` guard passes and the dialog closes. This behavior differs between platforms — Linux/Edge handles pointer events differently and does not trigger this issue.

**Resolution:** Added `!window.getSelection()?.toString()` check to all 15 overlay `onClick` handlers. This prevents the close handler from firing whenever text is actively selected, regardless of where the click event target is. Also added the missing `e.target === e.currentTarget` guard to the 4 dialogs that were missed in fix #59.

---

### 59. Dialogs close when selecting text inside modals

**Files modified:** `frontend/src/components/ai-prompt-dialog.tsx`, `frontend/src/components/dsl-import-dialog.tsx`, `frontend/src/components/template-browser.tsx`, `frontend/src/components/file-open-dialog.tsx`, `frontend/src/components/help-dialog.tsx`, `frontend/src/components/cloud-storage-dialog.tsx`, `frontend/src/components/ai-settings-dialog.tsx`, `frontend/src/components/load-export-dialog.tsx`, `frontend/src/components/export-dialog.tsx`, `frontend/src/components/settings-dialog.tsx`, `frontend/src/components/save-dialog.tsx`

**Observation:** In AI Drawing, Import from Text, and Templates → Text Diagrams → Import Diagram from Text features, clicking inside a textarea to select or edit existing text caused the dialog to close, returning the user to the main canvas.

**Root cause:** All 11 modal dialogs used the pattern `<div class="overlay" onClick={props.onClose}>` on the backdrop, relying solely on `e.stopPropagation()` on the inner modal div to prevent clicks inside the modal from reaching the overlay. This failed because SolidJS uses event delegation — `onClick` handlers are registered on the `document`, not on the elements themselves. The framework simulates bubbling by walking the DOM tree, but `stopPropagation()` can behave unreliably in this delegated context. Additionally, when text selection involves a click-drag where the mouse exits the modal boundary, the resulting `click` event fires on the nearest common ancestor of the `mousedown`/`mouseup` targets (the overlay), completely bypassing the modal's `stopPropagation` handler.

**Resolution:** Added `e.target === e.currentTarget` guard to all 11 overlay `onClick` handlers. This ensures the close handler only fires when the user clicks directly on the dark backdrop (where `e.target` is the overlay div itself), not from any bubbled or misrouted child events. The existing `stopPropagation` on the modal div is retained as a secondary layer of protection.

---

## 2026-02-22

### 58. Toast messages overlapped by slide toolbar

**Files modified:** `frontend/src/components/toast.css`

**Observation:** In slide document mode, toast messages (e.g., "layer locked", validation errors) were hidden behind the Slide Control Toolbar and other toolbars. Users couldn't see important status messages.

**Root cause:** Toast had `z-index: 2000` while the Slide Control Toolbar used `z-index: 10002`, Quick Toolbar used `10000–10002`, and Presentation Controls used `10000`. Any toast appearing while toolbars were visible was rendered behind them.

**Resolution:** Raised toast `z-index` from `2000` to `10010`, placing it above all toolbars in the z-index stack. The z-index hierarchy is now: toasts (10010) > toolbars (10002) > presentation controls (10000).

---

### 57. Rocket UI not gated behind feature flag

**Files modified:** `frontend/src/components/ai-prompt-dialog.tsx`, `frontend/src/components/menu.tsx`, `.env.example`

**Observation:** The "Generate for Rocket Backend" checkbox, Rocket Settings link, and RocketSettingsDialog were always visible regardless of the `VITE_ENABLE_ROCKET_EXPORT` feature flag setting.

**Root cause:** The Rocket-specific UI elements added in the AI Rocket mode feature were not wrapped in `<Show when={features.enableRocketExport}>` guards, unlike the existing "Export to Rocket" and "Deploy to Rocket" options in the export dialog.

**Resolution:** Wrapped the Rocket mode checkbox and Rocket Settings link in `ai-prompt-dialog.tsx`, and the `RocketSettingsDialog` in `menu.tsx`, behind `features.enableRocketExport`. Added `VITE_ENABLE_ROCKET_EXPORT` documentation to `.env.example`.

---

### 56. Preserve leading whitespace in text element rendering

**Files modified:** `frontend/src/utils/text-utils.ts` (or related renderer)

**Observation:** Text elements with leading whitespace (indentation) lost their whitespace when rendered on the canvas.

**Root cause:** The text wrapping/rendering pipeline trimmed or ignored leading whitespace characters.

**Resolution:** Updated text rendering to preserve leading whitespace in text elements.

---

## 2026-02-17

### 55. Text jumping when editing containerText on shapes

**Files modified:** `src/components/text-editing-overlay.tsx`

**Observation:** When double-clicking to edit containerText on shapes (rectangles, circles, banners, etc.), the text visually jumped from its canvas position when the editing overlay appeared. The same issue had been fixed for standalone text/richtext elements but not for shapes with containerText.

**Root cause:** The text editing overlay used `translate(-50%, -50%)` CSS transform for container shapes, which centers the overlay relative to its own rendered size. Since the rendered size depends on text content, any change in content causes a position shift. Additionally, the overlay didn't account for the canvas renderer's vertical centering formula (`startY = cy - textHeight/2 + lineHeight/2 + startYOffset`) or shape-specific Y offsets.

**Resolution:** Extended the top-left anchoring approach (already used for standalone text) to container shapes. Added computed vertical padding using `measureContainerText()` metrics to match the canvas renderer's positioning formula. Included shape-specific Y offsets for doubleBanner, starPerson, lightbulb, signpost, and UI shapes (via `getUIShapeDef`). Set horizontal padding to `10 * scale` to match canvas margins. Disabled auto-resize for container shapes since they have fixed dimensions.

---

### 54. Control point drag does not show real-time preview

**Files modified:** `src/components/canvas.tsx`, `src/utils/tool-handlers/selection-handler.ts`

**Observation:** When dragging control points on bezier curves, the canvas did not update in real-time. The curve only snapped to the new position after releasing the mouse.

**Root cause:** Two issues: (1) `controlPoints` and `curveType` were not accessed in the reactive `createEffect` in canvas.tsx that triggers redraws — SolidJS requires explicit property access to track dependencies. (2) `handleControlPointDrag` in selection-handler.ts did not call `requestAnimationFrame(helpers.draw)` after updating element state. The `helpers` parameter was even named `_helpers` (indicating unused).

**Resolution:** Added `e.controlPoints; e.curveType;` to the reactive tracking effect in canvas.tsx. Renamed `_helpers` to `helpers` and added `requestAnimationFrame(helpers.draw)` call in `handleControlPointDrag`.

---

### 53. Elbow line drawing creates too many bends from mouse wobble

**Files modified:** `src/utils/tool-handlers/draw-handler.ts`

**Observation:** When drawing elbow lines interactively, normal mouse movement produced messy paths with many unnecessary turns instead of clean L-shaped paths. Small mouse wobbles triggered new bend points.

**Root cause:** The elbow drawing algorithm tracked `elbowCommittedPoints` and committed a new bend every time perpendicular movement exceeded `BEND_THRESHOLD = 15px`. Normal mouse wobble easily triggers 15px changes, creating many spurious bends.

**Resolution:** Replaced the complex multi-bend direction-tracking algorithm with a simple L-shaped path. The new algorithm: (1) Detects initial direction (horizontal or vertical) based on first significant movement (threshold increased to 20px). (2) Produces a clean 3-point path with exactly 1 bend — horizontal-then-vertical or vertical-then-horizontal based on initial drag direction. Bound connectors (A* routing) are unaffected.

---

### 52. Line/arrow/bezier refactor — default control points and text editing

**Files modified:** `src/utils/tool-handlers/draw-handler.ts`, `src/utils/tool-handlers/minor-handlers.ts`, `src/utils/tool-handlers/selection-handler.ts`, `src/utils/tool-handlers/text-editing-handler.ts`, `src/components/text-editing-overlay.tsx`

**Description:** Refactored line/arrow/bezier elements to always have default control points at creation time. Previously, control points were only added when converting from straight to bezier. Now lines and arrows get 2 default cubic bezier control points positioned at 1/3 and 2/3 along the line. Added double-click text editing support for lines and arrows (editing containerText). Updated text-editing-overlay to handle connector elements with special sizing and positioning.

---

### 51. Consistent fontSize default (20) for text element creation

**Files modified:** `src/utils/tool-handlers/minor-handlers.ts`

**Observation:** Text elements created via different code paths (click-to-create, property panel) used inconsistent fontSize defaults — some used 16, others used the store default.

**Resolution:** Unified all text element creation paths to use `store.defaults?.fontSize ?? 20` as the default.

---

### 50. Text editing overlay positioning — no jump, no double border

**Files modified:** `src/components/text-editing-overlay.tsx`, `src/utils/canvas-renderer.ts`

**Observation:** When double-clicking a text element to edit, the textarea visually jumped from the canvas text position. The overlay also showed a double border (canvas text border + overlay border).

**Root cause:** The overlay used `translate(-50%, -50%)` CSS transform to center itself, which depends on rendered content size. When the textarea appeared with different dimensions than the canvas text, the position shifted. The canvas renderer continued drawing the text element border even during editing.

**Resolution:** Switched standalone text elements to top-left anchoring with computed vertical padding matching the canvas renderer's formula. Set `isEditing = true` on the rendered element so the canvas renderer skips drawing text during editing, eliminating the double border.

---

### 49. Text drag preview shows dashed outline instead of subtle fill

**Files modified:** `src/shapes/renderers/text-renderer.ts`

**Observation:** When dragging text elements, a distracting dashed outline was shown as the preview.

**Resolution:** Replaced the dashed outline with a subtle semi-transparent fill for a cleaner drag preview appearance.

---

### 48.5. Rich text editing — bullet lists, text color, drag visibility

**Files modified:** `src/components/rich-text-editing-overlay.tsx`, `src/components/rich-text-editing-overlay.css`, `src/components/text-editor-modal.tsx`, `src/components/text-editor-modal.css`, `src/shapes/base/render-pipeline.ts`, `src/shapes/renderers/text-renderer.ts`, `src/types.ts`, `src/utils/rich-text-utils.ts`

**Description:** Fixed multiple rich text editing issues: bullet list rendering and indentation, text color application in the editor matching canvas rendering, and drag visibility for rich text elements. Extended the rich text span types and rendering pipeline.

---

### 48.1. Text elements invisible due to missing textColor default

**Files modified:** `src/shapes/base/render-pipeline.ts`, `src/shapes/renderers/text-renderer.ts`, `src/store/app-store.ts`

**Observation:** Newly created text elements were invisible on the canvas despite being selectable.

**Root cause:** Text rendering used `el.textColor` for fill color, but newly created elements had `textColor: undefined`. The renderer set `fillStyle = undefined`, which the canvas treated as transparent.

**Resolution:** Added `textColor: '#000000'` to default element properties in app-store.ts. Updated text-renderer.ts and render-pipeline.ts to fall back to `el.strokeColor` when `el.textColor` is undefined.

---

### 48. Puzzle piece shape invisible in architectural mode when dragged left/right

**Files modified:** `src/shapes/renderers/connection-rel-renderer.ts`

**Observation:** The puzzle piece shape renders correctly in sketch mode and can be resized by dragging in any direction. In architectural mode, dragging the shape edges left or upward (creating negative width/height) causes the shape to become invisible.

**Root cause:** The `renderArchitectural` method used raw `el.width` and `el.height` directly for coordinate calculations and `arc()` radius parameters. When the user drags a handle to the left of the origin, `el.width` becomes negative. The Canvas 2D `arc()` API silently rejects negative radius values (e.g., `w * 0.15` = negative), causing the entire path to not render. All coordinate calculations (`x + w * 0.35`, etc.) also invert, producing a degenerate path.

**Resolution:** Normalized dimensions at the top of `renderArchitectural`: `w = Math.abs(el.width)`, `h = Math.abs(el.height)`, with `x`/`y` adjusted to the correct top-left corner when dimensions are negative. This fixes all 8 shapes in the connection-rel renderer (puzzlePiece, chainLink, bridge, magnet, scale, seedling, tree, mountain).

---

### 47. Arrow connections fail for BPMN/UML shapes — binding resolution returns null

**Files modified:** `src/utils/geometry.ts`, `src/api.ts`

**Observation:** Arrows connecting BPMN shapes (tasks, events, gateways) and UML shapes (classes, interfaces) don't properly bind. When shapes are moved, arrows may not follow or may drift to incorrect positions. The `connect()` API creates arrows that lack precise anchor data.

**Root cause:** Two issues:
1. `intersectElementWithLine()` in `geometry.ts` had explicit type checks for known shapes (rectangle, circle, diamond, and a long list of polygon types) but returned `null` for ALL BPMN types (bpmnStartEvent, bpmnTask, bpmnExclusiveGateway, etc.), ALL UML types (umlClass, umlInterface, etc.), ALL data structure types, and many other shape types. When `refreshBoundLine` called `resolveBindingPoint` for these shapes, the intersection fallback returned `null`, breaking binding resolution.
2. The `connect()` method in `api.ts` created bindings without `anchorFractionX`/`anchorFractionY`, forcing the binding system to rely solely on the intersection fallback (which failed for unhandled types).

**Resolution:**
1. Added BPMN circular shapes (start/end/intermediate events, data store) and UML use-case to the ellipse intersection branch. Added BPMN gateway shapes to the diamond intersection branch. Added a default bounding-box fallback at the end of the function for any unrecognized type — no more `return null`.
2. Added anchor fraction computation to `connect()` so all programmatic connections (API, DSL import, AI drawing) have precise, stable bindings. Also added `anchorFractionX`/`anchorFractionY` to the `ElementOptions` binding type.

---

### 46. AI Drawing Engine — new feature (not a bug fix)

**Files created:** `src/ai/ai-settings.ts`, `src/ai/ai-providers.ts`, `src/ai/system-prompt.ts`, `src/ai/drawing-engine.ts`, `src/components/ai-prompt-dialog.tsx`, `src/components/ai-prompt-dialog.css`, `src/components/ai-settings-dialog.tsx`, `src/components/ai-settings-dialog.css`

**Files modified:** `src/components/menu.tsx`, `src/app.tsx`, `src/api.ts`

**Description:** Added AI Drawing Engine that generates entire diagrams from natural language prompts. Users configure their own API keys (OpenAI, Google Gemini, Anthropic) via AI Settings dialog. The engine sends prompts to the LLM with a condensed API spec, receives JSON DSL, validates with `parseDSL()`, and renders with `renderDiagram()`. Supports domain-specific shapes (BPMN, UML, infrastructure). Accessible via menu or `Ctrl+Shift+A`. Also exposed as `window.Yappy.generateDiagram()`.

---

### 33. Image drag-and-drop from file manager unreliable on Linux/Wayland

**Files modified:** `src/app.tsx`, `src/components/canvas.tsx`, `src/utils/tool-handlers/canvas-event-handlers.ts`

**Observation:** Dragging images from Ubuntu file manager (Nautilus) to the canvas works intermittently. Sometimes the image appears, sometimes nothing happens. The drop event fires but `e.dataTransfer.files` is empty (`types: Array(0)`).

**Root cause:** Multiple compounding issues on Linux (especially Wayland):
1. **Nautilus/DataTransfer inconsistency**: Ubuntu's file manager (Nautilus) does not consistently populate the `Files` type in the DataTransfer. It may send `text/uri-list`, `text/plain`, or sometimes nothing at all.
2. **Canvas is a weak drop target**: The HTML `<canvas>` element is less reliable as a drop target on Linux compared to `<div>` elements. The browser may not fully populate the DataTransfer when the drop target is a canvas.
3. **Wayland DnD protocol bugs**: On Wayland sessions (`XDG_SESSION_TYPE=wayland`), cross-application drag-and-drop is notoriously unreliable. The browser sometimes receives an empty DataTransfer from the compositor.
4. **Async handler clearing**: The original drop handler was `async`, which on some browser/OS combos causes the DataTransfer to be cleared before file data can be read.

**Resolution (partial — Wayland bug is an OS-level issue):**
1. Wrapped `<canvas>` in a `<div class="canvas-drop-zone">` and attached drag handlers to the wrapper div instead of the canvas directly — div is a stronger drop target on Linux.
2. Made drop handlers non-async: all DataTransfer reading (`files`, `items`, `getData()`) is done synchronously in `extractDropData()`, then async processing happens separately.
3. Added `e.dataTransfer.items` API fallback when `files` is empty (more reliable on some Linux setups).
4. Added `text/uri-list` and `text/plain` URL fallback — fetches image URLs as blobs when file APIs fail.
5. Added visible "Click to select image" fallback prompt when DataTransfer is completely empty but drag activity was detected.
6. Always call `e.preventDefault()` on the drop event to prevent browser navigation.

**Status:** Works reliably when the OS/browser delivers the DataTransfer data. The Wayland empty DataTransfer bug is an OS-level issue that cannot be fully resolved in JavaScript. Fallback prompt provides a workaround. Recommend testing with `echo $XDG_SESSION_TYPE` — if `wayland`, suggest user try X11/Xorg session for reliable DnD.

---

### 33. Rich text first newline lost on save

**Files modified:** `src/utils/rich-text-utils.ts`

**Observation:** When editing rich text (contenteditable), multiline text loses its first newline on save. The canvas renders "HelloWorld" instead of "Hello\nWorld" after committing.

**Root cause:** The `htmlToSpans()` DOM parser only handled newlines AFTER `<div>`/`<p>` block elements (when `nextSibling` exists). It did NOT add a newline BEFORE a block element preceded by a non-block sibling (text node, `<span>`, etc.).

Browsers (especially Chrome) can structure contenteditable DOM as `text<div>next line</div>` — wrapping subsequent lines in `<div>` blocks while leaving the first line as a bare text node. The visual line break before the `<div>` was not captured, so `htmlToSpans` produced `"textNext line"` instead of `"text\nNext line"`.

**Resolution:** Added a pre-block newline check in `htmlToSpans`: before recursing into a `<div>`/`<p>`, check if `previousSibling` exists and is NOT another block element or `<br>` (which already emits its own `\n`). If so, push a `{text: '\n'}` span before the block's content. This ensures all DOM layouts — `text<div>`, `<div><div>`, `<span><div>`, `<br><div>` — produce correct newlines.

---

### 32. First Enter key press doesn't create newline in text editors

**Files modified:** `src/components/text-editing-overlay.tsx`, `src/components/rich-text-editing-overlay.tsx`

**Observation:** When editing text on canvas elements (both plain textarea and rich text contenteditable), the first Enter key press is swallowed — no newline is created. Subsequent Enter presses work correctly.

**Root cause:** SolidJS event delegation combined with the app's global keyboard handler creates a complex event flow:
1. The app registers a capture-phase `keydown` handler on `window` (for global hotkeys like Delete, Ctrl+Z, etc.).
2. SolidJS delegates `onKeyDown` handlers to the `document` element (bubbling phase), not on the target element.
3. The global capture-phase handler fires BEFORE the textarea/contenteditable can process the key. While it checks `isInputFocused()` and returns early for most keys, the Enter key was still being intercepted by the mindmap sibling-node creation code.
4. Even after fixing the capture handler, SolidJS's delegated `onKeyDown` fires at the document level, which can conflict with native textarea behavior.

**Resolution:** Replaced SolidJS JSX `onKeyDown` with native `addEventListener('keydown', ...)` in the `ref` callback for both text editors. The native handler:
1. Always manually handles Enter — calls `e.preventDefault()` + `e.stopImmediatePropagation()` and manually inserts `\n` (textarea) or `document.execCommand('insertLineBreak')` (contenteditable).
2. Stops immediate propagation for ALL keys to prevent global hotkeys from interfering.
3. Handles Escape to commit text and switch to selection tool.
4. Preserves table cell navigation (Tab/Enter for cell movement).

This guarantees newlines work regardless of capture-phase interference, SolidJS delegation, or any other event handler in the chain.

---

### 31. Google OAuth popup fails with Cross-Origin-Opener-Policy (COOP)

**Files modified:** `src/storage/cloud/providers/google-drive-auth.ts`, `public/oauth-callback.html`

**Observation:** After Google OAuth approval, the auth code never reached the parent window. Console showed repeated "Cross-Origin-Opener-Policy policy would block the window.closed call" errors. Upload to Google Drive failed because no valid tokens were obtained.

**Root cause:** When COOP headers are active (set by the browser, hosting platform, or default policy), the `window.opener` reference is severed when the popup navigates cross-origin to `accounts.google.com`. When Google redirects back to `oauth-callback.html`, `window.opener` is `null`, so `postMessage()` silently fails. The auth code from Google is lost. Additionally, `popup.closed` access from the parent window is blocked or unreliable under COOP, causing console error spam.

**Resolution:** Added a dual-channel communication strategy:
1. **localStorage fallback**: The callback page now always writes the auth result to `localStorage` under key `yappy:oauth:result`, regardless of whether `window.opener` is available. This works because localStorage is shared across same-origin windows regardless of COOP.
2. **Parent-side polling**: The parent window now polls `localStorage` every 500ms in addition to listening for `postMessage` and `storage` events. This catches the result even if the `storage` event doesn't fire (e.g., popup closes immediately after writing).
3. **Graceful COOP handling**: `popup.closed` check is wrapped in try-catch. localStorage check runs first each tick, so even if COOP blocks `popup.closed`, the auth code is retrieved.
4. **Cleanup**: The `yappy:oauth:result` key is cleared on both flow start and cleanup to prevent stale results.

---

### 30. SVG export missing 80+ shape types, fonts not embedded, flip/crop/diamond broken

**Files modified:** `src/utils/export.ts`

**Observation:** SVG export only rendered a handful of shape types (rectangle, circle, line, arrow, text, freehand, image). All other shapes — diamond, stickyNote, polygons, flowchart shapes, sketchnote shapes, infra shapes, specialty shapes, UML, people, status, cloud infra, data structures, BPMN, tables, code blocks, and more — were completely absent from exported SVGs. Additionally:
- Diamond shape had no SVG handler
- `ink` freehand type was not included with other freehand tools
- Image crop was not handled (cropped images exported at full size)
- `flipX`/`flipY` transforms were not applied to native SVG shapes
- Fonts were not embedded, causing text to fall back to system defaults when the SVG was opened outside the browser
- Canvas fallback shapes had opacity/rotation/container-text applied twice (once from canvas render, once from SVG attributes)

**Root cause:** The SVG export had a separate, hand-coded rendering path that only covered the original basic shape types. As new shape types were added to the canvas rendering pipeline (via the shape registry), they were never added to the SVG export. PNG/JPG/PDF/PPTX exports were unaffected because they use `renderElement()` which delegates to the shape registry.

**Resolution:**
1. **Canvas fallback for all unhandled shapes**: Any shape type without a native SVG handler is now rendered to an offscreen canvas at 2x resolution via `renderElement()` and embedded as an `<image>` element in the SVG. This provides 100% shape coverage. Padding accounts for rotation bounds extension and drop shadows.
2. **Diamond shape**: Added native vector SVG rendering via `rc.polygon()` with the four diamond vertices.
3. **`ink` freehand type**: Added to the freehand condition alongside fineliner, inkbrush, and marker.
4. **Image crop**: Images with `el.crop` now fall through to the canvas fallback (which handles crop via `ctx.drawImage` source rect), instead of rendering uncropped.
5. **Font embedding**: Added `<defs><style>` with `@import url(...)` for all Google Fonts used by the app (Handlee, Inter, Source Code Pro, Caveat, Poppins, Merriweather, Permanent Marker, JetBrains Mono).
6. **Flip support**: Added `translate/scale/translate` transform for `flipX`/`flipY` on native SVG shapes.
7. **Canvas fallback isolation**: Canvas fallback nodes skip SVG-level opacity, rotation, flip, and container text (these are already baked into the canvas render).

---

### 29. DSL/Mermaid diagrams not loading correctly in production (silent failures)

**Files modified:** `src/dsl/index.ts`, `src/dsl/engine/dsl-engine.ts`, `src/dsl/parser/text-parser.ts`, `src/dsl/adapters/mermaid/state-parser.ts`, `src/components/dsl-import-dialog.tsx`

**Observation:** After deploying to production, many DSL and Mermaid diagrams failed to load without any visible error messages. Diagrams that worked in development sometimes failed silently in production.

**Root causes identified:**
1. **Module side-effect registration**: MermaidAdapter was registered via a module-level side effect in `parser/index.ts`. Production builds with tree-shaking/code-splitting could skip this registration.
2. **Global module state**: State diagram parser used module-level counters (`startCounter`, `endCounter`) that could cause issues with concurrent parses or HMR differences between dev/prod.
3. **Silent edge skipping**: Edges referencing missing nodes were silently skipped without any warning.
4. **No error handling in render engine**: `renderDiagram()` had no try-catch, so any exception would fail silently.
5. **Default layout 'manual'**: Text parser defaulted to 'manual' layout which requires explicit x/y positions — nodes would stack at (0,0) without them.
6. **Incomplete format detection**: UI format badge detection missed `erDiagram`, `pie`, and `mindmap` Mermaid types.

**Resolution:**
1. Added explicit adapter registration guard in `dsl/index.ts` that runs on module load, ensuring MermaidAdapter is always registered regardless of tree-shaking.
2. Moved `startCounter`/`endCounter` inside `parseMermaidState()` function scope to avoid module-level state.
3. Added `console.warn` when edges are skipped due to missing nodes, showing which node is missing.
4. Wrapped entire `renderDiagram()` in try-catch with `console.error` logging.
5. Changed default layout from 'manual' to 'tree-down' for automatic positioning.
6. Updated format detection regex to include all Mermaid diagram types: `erDiagram|pie|mindmap`.

---

### 27. ER parser attributes not recognized ("Unrecognized attribute" warnings)

**Files modified:** `src/dsl/adapters/mermaid/er-parser.ts`

**Observation:** Mermaid ER diagram entity attributes like `string id PK`, `string name` etc. were reported as "Unrecognized attribute" warnings instead of being parsed correctly.

**Root cause:** The attribute regex `ATTR_RE = /^\s+(\S+)\s+(\S+)(?:\s+(PK|FK|UK))?\s*$/` required at least one leading whitespace character (`\s+`). But earlier in the parsing loop (line 61), the line was already trimmed with `.trim()`, removing all leading whitespace. So the regex never matched.

**Resolution:** Changed `^\s+` to `^\s*` (zero or more whitespace) so the regex matches trimmed lines. The constraint part (`PK|FK|UK`) was already optional and unaffected.

---

### 28. Negative radius crash in data structure renderer

**Files modified:** `src/shapes/renderers/data-structure-renderer.ts`, `src/utils/render-element.ts`, `src/shapes/base/shape-renderer.ts`

**Observation:** `RangeError: Failed to execute 'roundRect' on 'CanvasRenderingContext2D': Radius value -12.8 is negative` — crashed the entire canvas rendering when data structure elements had very small dimensions.

**Root cause:** `drawRoundedRect` computed `r = Math.min(r, w/2, h/2)` which became negative when cell dimensions were negative (e.g., during resize). The `ctx.roundRect()` API throws on negative radius values.

**Resolution:** Three-layer fix:
1. Clamped w, h, r to non-negative in `drawRoundedRect`: `w = Math.max(0, w)`, `h = Math.max(0, h)`, `r = Math.max(0, ...)`.
2. Added try-catch around `renderer.render()` in `renderElement` to prevent one element's error from stopping all rendering.
3. Added try-finally in `ShapeRenderer.render()` to ensure `restoreTransformations()` always runs even if rendering throws, preventing canvas state corruption.

---

## 2026-02-12

### 26. Group toolbar/submenus not working on mobile and Safari

**Files modified:** All 15 `*-tool-group.tsx` components, `pen-tool-group.css`, `connector-tool-group.css`, `toolbar.css`

**Observation:** Tapping group tool buttons (pen, shape, connector, UML, etc.) on mobile did not open the dropdown submenu. On Safari desktop, the dropdowns also failed to open reliably.

**Root cause:** Three compounding issues:
1. **Dropdown positioned off-screen on mobile**: The toolbar is fixed at the bottom on mobile, but `getDropdownPosition()` used `top: rect.bottom + 8px` which placed the dropdown BELOW the already-bottom toolbar, off-screen.
2. **SolidJS delegated `onClick` unreliable on Safari/WebKit**: The toggle buttons used `onClick` (SolidJS event delegation via document root). Safari/WebKit can fail to bubble click events from elements inside `overflow-x: auto` scrollable containers to the document root, preventing the delegated handler from firing.
3. **Dropdown z-index (1001) lower than toolbar z-index (10002)**: Any dropdown overlap with the toolbar area was hidden behind it.

**Resolution:**
- Changed mobile dropdown position to open ABOVE the toolbar using `bottom: window.innerHeight - rect.top + 8px` instead of `top: rect.bottom + 8px` in all 15 tool groups.
- Changed toggle buttons from `onClick={toggleMenu}` (delegated) to `on:click={toggleMenu}` (native binding) in all 15 tool groups for reliable Safari/mobile behavior.
- Increased dropdown z-index from 1001 to 10003 (above toolbar's 10002) in both `pen-tool-dropdown` and `connector-tool-dropdown` CSS.
- Added `touch-action: manipulation` on `.toolbar-btn` (mobile) and `.dropdown-item` to eliminate 300ms tap delay on touch devices.

---

## 2026-02-10

### 25. Paste JSON shows "Invalid JSON" for valid JSON / Load JSON button does nothing

**Files modified:** `src/components/load-export-dialog.tsx`, `src/components/load-export-dialog.css`

**Observation:** When pasting valid JSON (v1 or v4 format documents) into the new "Paste JSON" textarea, clicking "Load JSON" either showed "Invalid JSON" error or did nothing. Additionally, the Load JSON button appeared white on hover, and the textarea did not auto-focus when opened.

**Root cause:** The `handleLoadJson` function had a single try/catch wrapping both `JSON.parse(text)` and `props.onLoadJson(text)`. If `onLoadJson` threw (e.g., from SolidJS reactive cascades during `loadDocument()`), the catch block incorrectly showed "Invalid JSON". Separately, the HTML `autofocus` attribute doesn't work with SolidJS `<Show>` conditional rendering, and the button hover style was inherited from the base `.action-trigger:hover` filter which created a washed-out appearance.

**Resolution:** Separated JSON validation into its own try/catch with early return, calling `props.onLoadJson(text)` outside the try block. Replaced `autofocus` attribute with `ref={(el) => setTimeout(() => el.focus(), 0)}`. Added explicit `.json-load-btn:hover:not(:disabled)` CSS rule and `pointer-events: none` on disabled state.

---

### 24. Code Block shape not selectable / double-click to edit not working

**Files modified:** `src/utils/hit-testing.ts`, `src/utils/tool-handlers/text-editing-handler.ts`

**Observation:** After implementing the codeBlock shape, it rendered correctly on canvas but could not be selected (clicked) or edited (double-clicked). The element appeared to be non-interactive.

**Root cause:** The `hitTestElement()` function in `hit-testing.ts` uses a large type-check list for bounding-box hit testing. The new `codeBlock` type was not included in this list, so `hitTestElement()` returned `false` for all click/selection attempts. Similarly, the `shapeTypes` array in `text-editing-handler.ts` was missing `codeBlock`, preventing double-click text editing.

**Resolution:** Added `el.type === 'codeBlock'` to the bounding-box hit-test check in `hit-testing.ts` and added `'codeBlock'` to the `shapeTypes` array in `text-editing-handler.ts`. Also added special handling so codeBlock edits the `text` property (like text elements) rather than `containerText` (like most shapes).

---

### 23. Multi-select property panel shows shape-specific properties (e.g., table Row Color)

**File modified:** `src/components/property-panel.tsx`

**Observation:** When selecting multiple shapes (e.g., a rectangle and a diamond), the property panel displayed shape-specific properties like "Row Color", "Alt Row Color", "Header Text" that only apply to table elements. Only properties common to the selected shapes should appear.

**Root cause:** The multi-select filter in `activeProperties` only excluded properties whose `applicableTo` array was *exclusively* slides/canvas types. Any array-based `applicableTo` (like `['table']`) passed through because `['table'].every(t => t === 'slide' || t === 'canvas')` is `false`. This meant table-only, speech-bubble-only, and other shape-specific properties all appeared in multi-select regardless of what was actually selected.

**Resolution:** Replaced the "exclusive to slides" check with a positive match: collect the types of all selected elements, then only show a property if at least one selected element's type appears in the property's `applicableTo` array. Properties with `applicableTo: 'all'` (backgroundColor, strokeColor, etc.) always show.

---

### 22. Diamond shape fill color wrong in architectural mode with borderRadius > 0

**Files modified:** `src/shapes/renderers/diamond-renderer.ts`

**Observation:** When a diamond shape had a background color and `borderRadius > 0` in architectural rendering mode, the fill appeared as the wrong color (inherited from the previously rendered shape). Setting roundness back to 0 restored the correct color. Sketch mode was unaffected.

**Root cause:** In `drawDiamondArch`, the rounded path branch (`r > 0`) used `ctx.fill(new Path2D(path))` without first setting `ctx.fillStyle`. The non-rounded branch (`r === 0`) correctly set `ctx.fillStyle = fill` before `ctx.fill()`. Since `ctx.fillStyle` was never set for the rounded case, the diamond inherited whatever fillStyle was left on the canvas context from the previously rendered shape.

**Resolution:**
1. Moved `ctx.fillStyle = fill` before the `if (r > 0)` branch so it applies to both paths
2. Replaced `ctx.fill(new Path2D(path))` with `this.executePath()` + `ctx.fill()`, matching the stroke path which already used `executePath` to avoid Path2D rendering quirks
3. Unified both branches to share a single `ctx.fill()` call after path construction

---

## 2026-02-09

### 21. SVG export missing text (standalone text and container text)

**Files modified:** `src/utils/export.ts`

**Observation:** Exported SVG files contained no text at all — both standalone text elements and text inside shapes (containerText) were missing or invisible.

**Root cause (standalone text):** The SVG text renderer created a single `<text>` element with `textContent`, which doesn't handle multi-line text (SVG ignores `\n`). Additionally, font family was hardcoded to `'sans-serif'` (ignoring `el.fontFamily`), text color used `el.strokeColor` instead of `el.textColor || el.strokeColor`, and font weight/style/alignment were not applied.

**Root cause (container text):** The SVG export had no handling for `el.containerText` at all. Shapes like rectangles and circles that display text on canvas were exported as empty shapes.

**Resolution:**
- Standalone text: Replaced single `<text>` with a `<g>` group containing one `<text>` per wrapped line, using `wrapText()` and `getMeasurementContext()` from text-utils for word wrapping that matches canvas rendering. Added proper `font-family` (via `resolveFontFamily`), `font-weight`, `font-style`, `text-anchor` (alignment), `textColor` support, and vertical centering.
- Container text: Added a post-shape pass that checks for `el.containerText`, wraps the shape node in a `<g>` group, and appends centered text lines with word wrapping.

---

### 20. Arrow endpoint corrupted when moving shape+arrow selection together

**Files modified:** `src/utils/tool-handlers/selection-handler.ts`

**Observation:** When selecting both a shape and its connected arrow (or two shapes connected by an arrow) and moving them, the arrow would snap back to its original endpoint position instead of translating with the group.

**Root cause:** In `handleMove`, element positions are updated one-by-one in a forEach loop. When a shape was processed before its connected arrow, `updateElement` on the shape triggered `refreshBoundLine` (both explicitly in the loop and via a reactive `createEffect` in canvas.tsx). At that point the arrow hadn't been moved yet, so `refreshBoundLine` recalculated the arrow's geometry using the shape's new position but the arrow's old end position — corrupting the arrow's `width`/`height`. When the arrow was subsequently processed, only `x`/`y` were updated, leaving the corrupted dimensions. SolidJS pointer events are non-delegated and don't auto-batch store mutations, so the reactive effect could fire between individual `updateElement` calls.

**Resolution:**
1. Wrapped the entire move loop in `batch()` from solid-js so all position updates are atomic — the reactive `createEffect` only fires after every element has its final position
2. Split into two passes: first update all positions, then refresh bound lines
3. Skip `refreshBoundLine` for arrows that are also in the selection (`initialPositions.has(b.id)`) since they translate by the same delta and their binding geometry is preserved

---

### 19. Connector handle arrows missing position in endBinding

**Files modified:** `src/utils/tool-handlers/minor-handlers.ts`

**Observation:** Arrows created by dragging from connector handle dots (the circles that appear on shape hover) did not properly track their endpoint when the connected target shape was moved. The arrow endpoint would drift to edge intersection positions instead of staying at the correct anchor.

**Root cause:** In `connectorHandleOnUp`, the `endBinding` was created without a `position` property: `{ elementId, focus, gap }`. The manual arrow tool's `drawOnUp` correctly included `position: binding.position`. Without `position`, `refreshBoundLine` fell back to less reliable edge intersection instead of anchor-based tracking, and dynamic anchor switching couldn't function properly.

**Resolution:** Added `position: binding.position` to the `endBinding` data in `connectorHandleOnUp`, matching the pattern in `drawOnUp`.

---

### 17. Pasted organic branches orientation changes (control points not offset)

**Files modified:** `src/utils/object-context-actions.ts`

**Observation:** When copying an organic branch shape and pasting it, the pasted branch's curve orientation was visibly different from the original. The duplicate feature (Ctrl+D) worked correctly.

**Root cause:** `controlPoints` on organic branches are stored as **absolute** canvas coordinates (unlike `points` which are relative to element `x`/`y`). During paste, `x` and `y` were shifted by `dx`/`dy` to center the pasted content in the viewport, but `controlPoints` were copied as-is via the spread operator. With a large offset (paste moves to viewport center), the control points remained at original absolute positions while the element moved, distorting the curve. Duplicate only offsets by 20px, making the distortion imperceptible.

**Resolution:** Added explicit `controlPoints` offset by `dx`/`dy` in `pasteYappyElements`, matching the same pattern used by the move handler in `selection-handler.ts`.

---

### 18. Pasted connectors anchor to original shape when moved

**Files modified:** `src/utils/object-context-actions.ts`

**Observation:** When pasting shapes that had connectors to elements outside the copied selection, selecting and moving the pasted shape caused connectors to snap back to the original element instead of staying free.

**Root cause:** In `remapElementBindings`, `startBinding`/`endBinding` were only remapped when the target `elementId` existed in the `idMap` (i.e., was part of the pasted set). Bindings referencing elements **not** in the selection were silently preserved with the original element ID. When the pasted shape was moved, `refreshBoundLine()` followed the stale binding back to the original element. The `boundElements` array already handled this correctly (skipping elements not in the selection), but bindings did not.

**Resolution:** In `remapElementBindings`, if a binding's target `elementId` is not in the `idMap`, it is now cleared to `null` instead of preserved. This makes connectors free-ended when pasted without their target, consistent with how `boundElements` already drops references to elements outside the selection.

---

### 15. Copy-paste overlaps shapes instead of maintaining relative positions

**Files modified:** `src/utils/object-context-actions.ts`, `src/app.tsx`

**Observation:** When selecting multiple shapes and pressing Ctrl+C then Ctrl+V, all pasted shapes pile up at the same position instead of maintaining their original relative spacing.

**Root cause:** Two issues combined:
1. In `handlePaste` (app.tsx), the clipboard text was parsed and verified as Yappy JSON, but the parsed data was thrown away. Instead, `pasteFromClipboard()` was called, which re-reads the clipboard asynchronously via `navigator.clipboard.readText()`. This async re-read after the synchronous paste event handler returns can fail or return different data on some browsers.
2. In `copyToClipboard`, SolidJS store proxy objects were serialized directly without unwrapping. SolidJS proxies may not enumerate all properties correctly during `JSON.stringify`, causing `width`/`height` to be lost. When the bounding box calculation in `pasteYappyElements` encountered `undefined` width/height, `el.x + undefined` produced `NaN`, which cascaded through the entire offset calculation, giving all elements `NaN` coordinates (rendered at origin).

**Resolution:**
1. `handlePaste` now calls `pasteYappyElements(data)` directly with the already-parsed data instead of re-reading the clipboard
2. `copyToClipboard` now unwraps SolidJS store proxies via `JSON.parse(JSON.stringify(...))` before serialization, matching the pattern used throughout the rest of the codebase
3. Bounding box calculation now guards against undefined/falsy width/height with `el.width || 0`

---

### 16. Duplicate and paste produce non-unique / GUID-style element IDs

**Files modified:** `src/utils/id-generator.ts`, `src/app.tsx`, `src/utils/object-context-actions.ts`

**Observation:** Duplicated elements (Ctrl+D) received GUID-style IDs like `941b9041-a2e7-490c-a4ad-8cff1b8702fe` instead of the human-readable pattern (`rect-1`, `text-2`). Additionally, pasting multiple elements of the same type produced duplicate IDs because `generateId` only scanned the store (not IDs already generated in the same batch).

**Root cause:**
1. The duplicate function in `app.tsx` used `crypto.randomUUID()` instead of the `generateId()` utility
2. `generateId()` scans `store.elements` for the max existing number, but when called multiple times in a loop (before the new elements are added to the store), it returns the same ID for each call of the same type
3. `pasteImageFromBlob` and `pasteAsTextElement` also used `crypto.randomUUID()`

**Resolution:**
1. Added optional `batchIds` parameter to `generateId()` — a `Set<string>` that tracks IDs generated in the same batch, ensuring uniqueness across multiple calls before store update
2. Duplicate function now uses `generateId(el.type, batchIds)` instead of `crypto.randomUUID()`
3. Paste functions (`pasteYappyElements`, `pasteImageFromBlob`, `pasteAsTextElement`) now all use `generateId()` with proper type-based naming
4. Group IDs also use `generateId('group', batchIds)` instead of `crypto.randomUUID()`

---

## 2026-02-08

### 14. Table click/drag conflict — clicking a cell blocks table movement

**Files modified:** `src/utils/pointer-state.ts`, `src/utils/tool-handlers/selection-handler.ts`, `src/utils/selection-renderer.ts`, `src/utils/handle-detection.ts`

**Observation:** Clicking on a table body cell immediately entered cell-selection mode on mouseDown, setting `isDragging = true` and returning early. This prevented the normal drag-to-move flow, so users couldn't move a table by dragging from the cell area.

**Root cause:** At `selection-handler.ts:249-261`, a plain left-click on a table body cell immediately set `tableCellSelectionDragging = true` and `isDragging = true` without any drag threshold, unlike normal elements which use a 3px threshold.

**Resolution:**
1. Added `pendingCellClick` field to `PointerState` to record click intent without committing
2. On mouseDown, plain left-click records pending cell and falls through to normal drag flow
3. On mouseUp, if drag distance < 3px (a click), cell selection is applied; if >= 3px (a drag), table moves normally
4. Added a dedicated move handle (blue circle with 4-way arrow) at the top-left corner of selected tables for explicit move intent

---

### 13. Property panel intermittently missing UI elements (icons, context menus)

**File modified:** `src/components/property-panel.tsx`

**Observation:** On some occasions, the property panel would not show certain UI elements (icons, context menu items, etc.) when selecting an element. A page refresh would fix it.

**Root cause:** SolidJS reactivity issue. `activeTarget()` (a `createMemo`) was called repeatedly across many independent `<Show when={...}>` conditions. If the store updated between evaluations, different Show blocks could see different states, causing some sections to not render. Additionally, `el()` in `MindmapActions` was a plain function (not `createMemo`), so it wasn't properly tracked by SolidJS's reactivity system.

**Resolution:**
1. Converted `el()` in `MindmapActions` to `createMemo` for proper dependency tracking
2. Added derived memos (`targetType`, `targetData`, `targetElementId`, `isElement`, `isMulti`, `isElementOrMulti`) that cache `activeTarget()` results
3. Replaced all repeated `activeTarget()?.type === 'element'` calls in Show conditions with the stable memo values

---

### 12. Right-click on table header loses multi-column selection

**File modified:** `src/utils/tool-handlers/selection-handler.ts`

**Observation:** After selecting multiple table columns (click header + Shift+click another header), right-clicking to open the context menu caused the multi-column selection to be replaced with a single column.

**Root cause:** The `selectionOnDown` handler's header cell check (`hitCell.row === 0 && !e.shiftKey`) did not exclude right-clicks (button === 2). A right-click on a header entered the column drag path, setting `pState.tableDragCol`. On mouseUp, the drag handler's column-select code overwrote the existing multi-column selection with a single column.

**Resolution:** Added `&& e.button !== 2` to the header cell check condition (line 199), so right-clicks skip the drag/sort path entirely and preserve the existing cell selection for the context menu.

---

## 2026-02-04

### 11. Resize handlers not oriented correctly when shape is rotated

**File modified:** `src/utils/selection-renderer.ts`

**Observation:** When a shape element was rotated, the resize handles appeared visually misaligned from the rotated bounding box corners. Clicking still worked (because hit detection properly unrotates mouse coordinates), but the visual feedback was incorrect.

**Root cause:** The rendering code applied a canvas rotation transform around the element center, then drew handles at unrotated coordinate positions. This caused handles to appear at wrong visual locations because:
1. Canvas was rotated (lines 47-50)
2. Handle positions were calculated in unrotated space
3. Drawing unrotated coordinates onto a rotated canvas produced incorrect visual positions

**Resolution:**
- Removed the canvas rotation transform approach
- Pre-compute rotated positions for bounding box corners and handles using `rotatePoint()` utility
- Draw the bounding box as a path connecting the four rotated corners
- Draw each resize handle at its rotated position, with the handle itself also rotated to align with the bounding box edges
- Rotate handle (for rotation) line and circle also computed with proper rotated coordinates

---

## 2026-01-31

### 7. Preset animations (shakeX, shakeY, bounce, pulse) ignore "Loop Infinitely" checkbox

**Files modified:** `src/utils/animation/element-animator.ts`, `src/utils/animation/sequence-animator.ts`

**Observation:** Adding two animations to a rectangle (shakeX and autoSpin) with "Loop Infinitely" enabled on both resulted in only autoSpin looping. shakeX always stopped after one cycle.

**Root cause:** Four preset functions hardcoded their own loop parameters and ignored `config.loop` / `config.loopCount` passed from the animation panel:
- `shakeX` / `shakeY` hardcoded `loopCount: 4`
- `bounce` / `pulse` used chained two-step animations that never passed through the loop config

Other presets (`fadeIn`, `slideIn`, `zoomIn`, `revolve`) worked because they used `...config` spread, passing loop settings through to the animation engine.

**Resolution:**
- `shakeX` / `shakeY`: When `config.loop === true`, use `loopCount: Infinity` instead of 4
- `bounce` / `pulse`: When `config.loop === true`, recursively restart their multi-step cycle after each completion
- Infinite loop handling moved to `sequence-animator.ts` `runStep()`: when `anim.repeat === -1`, pass a no-op `onComplete` and let the sequence handle unblocking

---

### 8. Infinite animation as last/only in sequence stops immediately

**File modified:** `src/utils/animation/sequence-animator.ts`

**Observation:** Adding a single animation with "Loop Infinitely" enabled caused it to stop after one iteration. The same happened when an infinite animation was the last in a multi-animation sequence.

**Root cause:** Infinite animations used `setTimeout(() => onComplete(), 0)` to unblock the sequence. When the animation was last (or only), this triggered `onAllComplete()`, which called `stopAllElementAnimations()` — killing the animation that was supposed to loop forever. This also created a race condition: if the user clicked Stop before the `setTimeout` fired, the deferred callback would create orphaned animations that ran forever with no way to stop them.

**Resolution:**
- Removed `setTimeout(onComplete)` pattern from all preset functions
- `runStep()` now checks `isInfiniteLoop` (`anim.repeat === -1`) and passes a no-op `onComplete` to the animation engine. The sequence stays active until the user clicks Stop.
- Infinite animations block `after-prev` successors (the animation never finishes, so "after" never comes). Use `with-prev` trigger for concurrent playback.
- Added guard `if (!this.activeSequences.has(elementId)) return` at the top of `runStep()` and `onAllComplete()` to prevent race conditions from deferred callbacks.

---

### 9. Animation engine tick loop and console noise after stopping preview

**Files modified:** `src/components/canvas.tsx`, `src/utils/animation/element-animator.ts`, `src/shapes/base/shape-renderer.ts`, `src/utils/animation/slide-build-manager.ts`

**Observation:** After stopping an animation preview, `console.log` output continued in the browser console. Off-screen elements with continuous animations also produced per-frame log noise.

**Root cause:** Debug `console.log` statements were left in per-frame code paths:
- `[Canvas] draw()` in `canvas.tsx` — fired every frame
- `[Morph] Starting morph` and `[Morph] Progress` in `element-animator.ts` — fired per-frame during morph
- `[renderCustomPoints]` debug logs in `shape-renderer.ts` — fired per-frame during rendering
- `[BuildManager]` initialization logs in `slide-build-manager.ts`

**Resolution:** Removed all debug `console.log` statements from per-frame code paths.

---

### 10. Off-screen elements with continuous animations cause unnecessary per-frame computation on infinite canvas

**File modified:** `src/components/canvas.tsx`

**Observation:** On an infinite canvas with one on-screen element and one off-screen element with continuous animation (auto-spin), the animation engine kept computing states for the off-screen element every frame, even though it was nowhere near the viewport.

**Root cause:** The `elementsToAnimate` filter in `draw()` only applied spatial culling for slide documents (checking elements against the active slide bounds). For infinite canvas mode (`docType !== 'slides'`), it passed all `store.elements` to `calculateAllAnimatedStates()` with no viewport filtering.

**Resolution:**
- Moved viewport bounds calculation (`viewportBounds`, `bufferX`, `bufferY`) to before the animation state computation so it can be reused for both animation culling and render culling
- Added an `else` branch for infinite canvas that applies AABB viewport culling with a 10% buffer — the same test used by the render pass
- Orbit center elements are still included even if off-screen (same dependency-aware pattern as the slide culling branch)
- Removed the duplicate viewport bounds calculation that previously existed further down in the render section

---

## 2026-01-29

### 1. "Scroll back to content" and "Zoom to Fit" broken in Slide documents

**Files modified:** `src/components/canvas.tsx`, `src/components/menu.tsx`

**Observation:** After panning away from a slide in design mode, clicking "Scroll back to content" or "Zoom to Fit" did not restore focus to the active slide. The same features worked correctly in Infinite Canvas mode.

**Root cause:** Three functions used `store.elements` (all elements across all slides) to compute content bounds, instead of using the active slide's spatial region:
- `showScrollBack` detection effect checked if any element from any slide was in the viewport
- `handleScrollBack()` centered the viewport on the bounding box of all elements, landing between slides
- Context menu "Zoom to Fit" and menu bar "Reset View" called `zoomToFit()` (fits all elements) instead of `zoomToFitSlide()` (fits the active slide)

**Resolution:**
- `showScrollBack` now checks visibility of the active slide's `spatialPosition` + `dimensions` bounds in slide mode
- `handleScrollBack()` delegates to `zoomToFitSlide()` in slide mode
- Context menu "Zoom to Fit" and menu "Reset View" dispatch `zoomToFitSlide()` when `docType === 'slides'`

---

### 2. Slide transitions all produce the same visual effect

**File modified:** `src/utils/animation/slide-transition-manager.ts`

**Observation:** Selecting different slide transition types (slide-left, slide-right, slide-up, slide-down, zoom-in, zoom-out) resulted in nearly identical animations during presentation mode.

**Root cause (directional slides):** The pan offset for slide-left/right/up/down was hardcoded to 200 pixels. Slides are positioned ~2000+ units apart spatially, making a 200px offset negligible. All four directions produced the same generic pan between spatial positions.

**Root cause (zoom):** The zoom transitions used a two-phase split at `progress < 0.5`, applying the easing function to full progress then doubling it. This caused values to exceed 1.0 in the first half and created a visible discontinuity at the midpoint. Both zoom-in and zoom-out looked similar.

**Resolution (directional slides):** Replaced the fixed 200px offset with full viewport width/height offsets. Each direction now clearly animates the new slide entering from the correct screen edge:
- `slide-left` — enters from the right edge
- `slide-right` — enters from the left edge
- `slide-up` — enters from the bottom edge
- `slide-down` — enters from the top edge
- Going backward automatically reverses the direction

**Resolution (zoom):** Replaced the broken two-phase animation with a single-phase smooth interpolation. Pan is computed mathematically from scale to keep the slide perfectly centered throughout:
- `zoom-in` — starts at 15% of target scale, grows into view
- `zoom-out` — starts at 300% of target scale, shrinks to fit

---

### 3. Slide navigator panel does not scroll to active slide

**File modified:** `src/components/slide-navigator.tsx`

**Observation:** When navigating slides via keyboard, toolbar buttons, or other means, the slide navigator sidebar did not scroll to keep the active slide thumbnail visible.

**Resolution:** Added a `createEffect` watching `store.activeSlideIndex` that calls `scrollIntoView({ block: 'nearest', behavior: 'smooth' })` on the active slide's thumbnail wrapper. Uses `block: 'nearest'` so it only scrolls when the active thumbnail is out of view.

---

### 4. Slide toolbar missing navigation controls

**File modified:** `src/components/slide-control-toolbar.tsx`

**Observation:** The slide control toolbar only had "Play Presentation" and "Preview Animations" buttons. There was no way to navigate between slides directly from the toolbar.

**Resolution:** Added a navigation group between the drag handle and the action buttons:
- Previous/Next slide buttons (chevron icons) with disabled state at bounds
- A small text input showing the current slide number (1-based) with `/ N` total count
- Input supports typing a number + Enter to jump to any slide, Escape to cancel
- Keyboard events stop propagation to prevent canvas shortcut interference
- Visual separator between navigation and action groups
- `ToolbarButton` component updated to support a `disabled` prop with appropriate styling

---

### 5. Animations after spinning stop working / infinite spin never stops

**File modified:** `src/utils/animation/sequence-animator.ts`

**Observation:** When an element had multiple animations in its sequence (e.g., spin followed by fade or bounce), animations after a spinning animation would either not run correctly or the element would continue spinning indefinitely after the preview ended.

**Root cause (infinite spin leak):** `animateAutoSpin` with `iterations === Infinity` called `onComplete()` immediately via `setTimeout` to unblock the sequence, but the actual spin animation continued running in the animation engine indefinitely. When the sequence completed, `onAllComplete` cleaned up sequence state (`activeSequences`, `isPreviewing`) but did NOT stop the still-running spin animation. Result: the element kept spinning after preview ended, and state restoration was immediately overwritten by the running spin on the next frame.

**Root cause (multi-iteration snap):** For finite iterations > 1, the code used `loop: true, loopCount: N` with per-loop duration. Each loop iteration re-interpolated from `startAngle` to `startAngle + 2π`. At each loop boundary, progress jumped from 1 back to 0, causing a visible angle snap-back instead of smooth continuous rotation.

**Resolution (infinite spin):** Added `stopAllElementAnimations(elementId)` at the top of `onAllComplete` to ensure any still-running animations (including infinite spins) are stopped before cleanup and state restoration.

**Resolution (multi-iteration snap):** Replaced the loop-based approach with a single continuous animation from `startAngle` to `startAngle + (2π × iterations)`. A 3-iteration spin now smoothly rotates 1080° in one animation instead of three 360° loops with snaps between them.

---

### 6. Master layer elements invisible when drawn on non-first slides

**Files modified:** `src/components/canvas.tsx`, `src/utils/slide-utils.ts`

**Observation:** Adding elements to a slide master layer worked correctly in some drawings but not others. Elements placed on the master layer while viewing certain slides would become invisible on all slides.

**Root cause:** The rendering projection for master layer elements did `renderedEl.x += activeSlide.spatialPosition.x`, assuming all master elements are stored relative to coordinate (0,0). However, elements are stored in world coordinates — if a user draws on a master layer while viewing slide 3 (spatial position 4000,0), the element is stored at e.g. (4100, 100). The projection then produces `4100 + 4000 = 8100`, placing the element far off-screen. Master layers only worked correctly when elements were drawn while slide 1 (position 0,0) was active.

**Resolution:**
- Added `projectMasterPosition()` utility in `slide-utils.ts` that determines which slide an element was originally placed on (by checking which slide's spatial region contains the element's center), computes the element's local offset within that slide, then re-projects to the target slide
- Updated the main rendering loop to use `projectMasterPosition()` instead of blind `+= sX/sY`
- Updated all 5 hit-test locations to apply the same projection, so master layer elements are selectable at their rendered position
- Updated thumbnail rendering to project master layer elements correctly

---

## 2026-02-16

### 41. Connector convergence from smart flip auto-switching anchors

**Files modified:** `src/utils/binding-logic.ts`

**Observation:** When moving shapes left/right or top/bottom, connectors would converge to a single point instead of maintaining their spread positions. Multiple arrows between shapes would overlap or fan into one spot.

**Root cause:** The `smartFlipBinding()` function in `refreshBoundLine` ran on every reactive refresh when shapes were on opposite sides of each other. It flipped ALL connectors sharing the same edge to the same new position, causing them to converge. The flip could not distinguish between intentional anchor placement and positions needing correction, and it overrode manual anchor changes.

**Resolution:** Removed the smart flip logic entirely. The anchor fraction system (`anchorFractionX`/`anchorFractionY`) already handles movement correctly — each connector maintains its exact relative position on the shape surface. Connectors stretch or compress when shapes move but never auto-switch edges.

---

### 40. Settings dialog strokeWidth default shows 2 instead of 4

**Files modified:** `src/components/settings-dialog.tsx`, `src/shapes/renderers/data-structure-renderer.ts`

**Observation:** The global settings dialog showed stroke width default as 2, and data structure shapes used a fallback of 1 for stroke width, inconsistent with the intended default of 4.

**Resolution:** Updated settings dialog fallback from 2 to 4. Updated all 6 `el.strokeWidth || 1` fallbacks in `data-structure-renderer.ts` to `|| 4`.

---

### 39. Connectors bunch/overlap when shapes are moved

**Files modified:** `src/utils/binding-logic.ts`, `src/types.ts`, `src/utils/pointer-state.ts`, `src/utils/tool-handlers/draw-handler.ts`, `src/utils/tool-handlers/minor-handlers.ts`

**Observation:** Connectors between shapes would overlap and bunch to the same point when shapes were moved. The original dynamic anchor switching automatically recalculated anchor positions on every move, causing all connectors to converge. Edge-type bindings recalculated dynamically from the other endpoint, drifting on each refresh.

**Root cause:** Three issues: (1) Dynamic anchor switching changed anchor positions on every `refreshBoundLine` call, overriding user-placed positions. (2) Edge-type bindings (`position: 'edge'`) computed intersection points dynamically, causing drift. (3) When `checkBinding` snapped endpoints to anchor centers during drawing, all connectors to the same anchor got identical coordinates.

**Resolution:** Introduced anchor fractions (`anchorFractionX`/`anchorFractionY`) — 0-1 values relative to shape bounding box — for precise, stable endpoint positioning. Resolution priority: fractions > named anchor > edge intersection fallback. Raw mouse position (`lastRawEndX`/`lastRawEndY` in PointerState) is tracked before anchor snapping to compute unique fractions per connector. Sibling spread logic offsets connectors sharing identical anchor positions.

---

### 38. Connector handle drag defaults to plain line instead of arrow

**Files modified:** `src/utils/tool-handlers/minor-handlers.ts`

**Observation:** Dragging from the connector handle icon on shapes created a plain line without an arrowhead, unlike the manual arrow tool which defaulted to arrow endpoints.

**Resolution:** Added `endArrowhead: 'arrow'` to the element creation in `connectorHandleOnDown`.

---

### 37. Kubernetes shape fill color leaks + zen mode exit button missing

**Files modified:** Various

**Observation:** Kubernetes shapes had fill color leaking between shapes. Zen mode had no visible exit button.

**Resolution:** Fixed fill state management in kubernetes shape renderer. Added zen mode exit button.

---

## 2026-02-15

### 34. Rich text formatting lost on blur/commit

**Files modified:** `src/store/app-store.ts`

**Observation:** When editing a rich text element with formatting (bold, italic, underline, strikethrough, color), the formatting displayed correctly in the contenteditable editor. However, as soon as the editor lost focus (blur), all formatting was stripped and only plain text rendered on the canvas.

**Root cause:** The `updateElement()` function in `app-store.ts` had a guard intended for property panel edits:
```typescript
if ('text' in updates) {
    const el = store.elements.find(e => e.id === id);
    if (el?.type === 'richtext') {
        updates = { ...updates, richText: undefined };
    }
}
```
When `commitRichText()` called `updateElement(id, { richText: spans, text: plainText, height })`, the updates object contained **both** `text` and `richText`. The guard saw `'text' in updates`, and since the element was type `'richtext'`, it overwrote `richText` with `undefined` — destroying the formatting spans that were being intentionally saved.

**Resolution:** Added a check to skip the guard when `richText` is already being explicitly set in the same update:
```typescript
if ('text' in updates && !('richText' in updates)) {
```
This preserves the original intent (clear formatting when plain text is edited via property panel) while allowing `commitRichText()` to save both text and richText together.

---

### 35. Text tool resets to selection despite double-click lock

**Files modified:** `src/components/text-editing-overlay.tsx`, `src/components/rich-text-editing-overlay.tsx`, `src/utils/tool-handlers/draw-handler.ts`

**Observation:** After double-clicking to lock the text or rich text tool, typing in an element and clicking away (blur) would reset the tool to selection mode, breaking the tool-lock behavior.

**Root cause:** Four locations unconditionally called `setSelectedTool('selection')` after text commit/blur/escape without checking `store.toolLocked`:
1. `text-editing-overlay.tsx` blur handler
2. `text-editing-overlay.tsx` Escape handler
3. `rich-text-editing-overlay.tsx` blur handler
4. `rich-text-editing-overlay.tsx` Escape handler

Additionally, `'richtext'` was missing from the `CONTINUOUS_TOOLS` and `CLICK_EXEMPT` arrays in `draw-handler.ts`.

**Resolution:** Added `!store.toolLocked` guard to all four reset locations. Added `'richtext'` to both `CONTINUOUS_TOOLS` and `CLICK_EXEMPT` arrays.

---

### 36. Text element displays unnecessary placeholder dashed border

**Files modified:** `src/shapes/renderers/text-renderer.ts`

**Observation:** Empty text elements rendered a double dashed border (green and blue), which was distracting for end users. The rich text element had this fixed previously, but the plain text element still showed it.

**Resolution:** Removed the placeholder dashed border rendering code from the empty text check in `text-renderer.ts`. Now empty text elements simply render nothing (early return).

---

## 2026-02-16 (v1.19.0)

### 42. HTML export missing fonts — standalone player uses wrong fonts

**Files modified:** `src/utils/export-to-html.ts`

**Observation:** Exported standalone HTML files rendered text in browser default fonts instead of the correct Google Fonts (Handlee, Inter, Caveat, etc.). The main `index.html` includes Google Fonts `<link>` tags, but the HTML export template did not.

**Resolution:** Added Google Fonts preconnect and stylesheet `<link>` tags to the exported HTML `<head>`, matching the same font families loaded in the main app's `index.html`.

---

### 43. First slide on-load animation not playing in exported HTML player

**Files modified:** `src/components/player-app.tsx`

**Observation:** When opening an exported HTML file, the first slide's on-load animations do not trigger. Navigating away and back to slide 1 correctly plays them. The player sets `appMode = "presentation"` directly but never calls `slideBuildManager.init()` / `playInitial()`.

**Root cause:** In the main app, `togglePresentationMode()` and `setActiveSlide()` both call `slideBuildManager.init()` and `playInitial()`. The player bypasses both functions and sets store values directly, so animations are never initialized for the first slide.

**Resolution:** Added `slideBuildManager.init()` and `playInitial()` calls in a `setTimeout(300ms)` after `setIsReady(true)`. The delay is necessary because `setIsReady(true)` triggers SolidJS's `<Show>` → Canvas → onMount chain, and the Canvas must be fully mounted before animations can run.

---

### 44. Manual arrow start point drifts when connected shape moves

**Files modified:** `src/utils/tool-handlers/draw-handler.ts`, `src/utils/tool-handlers/minor-handlers.ts`

**Observation:** When drawing a manual arrow from shape A to shape B, then moving shape B downward, the arrow's start point on shape A shifted down too. The connector handle (green icons) did not have this issue.

**Root cause:** In `drawOnUp`, start binding fraction computation (`computeAnchorFractions`) was inside the `suggestedBinding()` block. If no end binding was created, start fractions were never computed. Without fractions, `resolveBindingPoint` falls back to `intersectElementWithLine(el, otherEnd, ...)` which depends on the other endpoint's position — causing drift.

**Resolution:** Moved start binding fraction computation outside the `suggestedBinding()` block in both `draw-handler.ts` and `minor-handlers.ts`, so fractions are always computed when a start binding exists.

---

### 45. Canvas background color bleeds between documents on load/new

**Files modified:** `src/store/app-store.ts`

**Observation:** When loading a new document or creating a new drawing after having a document with a custom canvas/slide background, the previous document's background color persisted. The new document would inherit the old background instead of resetting to white.

**Root cause:** `loadDocument()` set `activeSlideIndex = 0` directly without calling `setActiveSlide()`, which normally syncs `canvasBackgroundColor` from the slide's `backgroundColor`. The store's `canvasBackgroundColor` was never reset during document load, so it retained whatever value the previous document had set.

**Resolution:** Added a 3-step background initialization in `loadDocument`:
1. Reset `canvasBackgroundColor` to `#ffffff` (default) before theme application
2. Let `setTheme()` adjust for focus theme (white → dark automatically)
3. Override with first slide's explicit `backgroundColor` if one is saved

---

### 46. Backend path traversal guard bypassable for sibling directories

**Files modified:** `backend/server/index.ts`

**Observation:** A request like `../data2/secrets` resolves to a sibling path such as `/.../data2/...`, which still starts with the string `/.../data` and therefore passes the `startsWith(DATA_DIR)` check even though it is outside the intended data directory.

**Root cause:** `DATA_DIR` does not end with a path separator, so `startsWith(DATA_DIR)` matches any path sharing the same prefix (e.g. `data2`, `data-backup`).

**Resolution:** Introduced `DATA_DIR_PREFIX = DATA_DIR + path.sep` and replaced all `startsWith(DATA_DIR)` checks with `startsWith(DATA_DIR_PREFIX)` across GET, POST, and DELETE endpoints.

---

### 47. Deleting a slide does not remove elements belonging to that slide

**Files modified:** `frontend/src/store/app-store.ts`

**Observation:** After deleting a slide, elements that were spatially inside the slide's bounds remained in the document as orphans. They could reappear on other slides or cause unexpected behavior.

**Root cause:** `deleteSlide()` removed the slide entry and updated indices, but never filtered out elements whose centers fell within the deleted slide's bounding box — unlike `duplicateSlide()` which correctly identifies slide membership geometrically.

**Resolution:** Added spatial element cleanup in `deleteSlide()`: before removing the slide, identify all elements whose center `(x + width/2, y + height/2)` lies within the slide's `spatialPosition` and `dimensions`, then filter them out in the same batch update.

---

### 48. Undo/redo snapshots exclude slides, states, and document metadata

**Files modified:** `frontend/src/store/app-store.ts`

**Observation:** Undoing a slide operation (add, delete, reorder) restored elements and layers but not the slides array itself. Users could undo a slide deletion and end up with the original elements but a missing slide frame.

**Root cause:** `HistorySnapshot` only stored `elements` and `layers`, but `pushToHistory()` was called before slide and state operations. Undo/redo couldn't restore `slides`, `states`, `gridSettings`, `canvasBackgroundColor`, or `docType`.

**Resolution:** Expanded `HistorySnapshot` to include all document-level fields. Extracted `captureSnapshot()` and `restoreSnapshot()` helpers used by `pushToHistory()`, `undo()`, and `redo()`.

---

### 49. Autosave misses slide metadata and display state edits

**Files modified:** `frontend/src/store/app-store.ts`, `frontend/src/storage/auto-save.ts`

**Observation:** Changing slide transitions, slide backgrounds, or display states and then refreshing the page lost those edits. The autosave dirty detection didn't fire because these mutations don't change array lengths or push history.

**Root cause:** The autosave reactive watcher only tracked `undoStackLength`, `elements.length`, `slides.length`, `layers.length`, and `docType`. Mutations like `updateSlideTransition`, `updateSlideBackground`, `addDisplayState`, `updateDisplayState`, and `deleteDisplayState` were invisible.

**Resolution:** Added a `dirtyRevision` monotonic counter to the store. Silent mutators now call `bumpDirtyRevision()` after their `setStore` calls. The autosave watcher additionally tracks `states.length` and `dirtyRevision`.

---

### 50. Duplicating a layer does not remap internal bindings

**Files modified:** `frontend/src/store/app-store.ts`

**Observation:** After duplicating a layer containing connected elements (e.g. arrows bound to shapes), the duplicated connectors still referenced the original layer's element IDs. Moving or deleting original elements could corrupt the duplicated ones.

**Root cause:** `duplicateLayer()` gave elements new IDs via spread but copied `startBinding`, `endBinding`, `boundElements`, and `parentId` references verbatim. Unlike `duplicateSlide()` which builds an `idMap` for remapping.

**Resolution:** Applied the same ID-remapping pattern from `duplicateSlide()`: build an `idMap` from old→new IDs, then remap `startBinding.elementId`, `endBinding.elementId`, `boundElements[].id`, and `parentId` in each duplicated element. External references (to elements outside the layer) are dropped.

---

### 51. Undo/redo silently no-ops for in-place property edits (text, move, resize, recolor)

**Files modified:** `frontend/src/store/app-store.ts`

**Observation:** Double-click a shape, type/edit its text, commit — pressing undo (button enabled) did nothing; the text stayed put. Same for moving, resizing, or recoloring an existing element. Adding and deleting elements *did* undo correctly, which masked the bug.

**Root cause:** `captureSnapshot()` took a *shallow* `store.elements.slice()`, relying on a comment-documented assumption that Solid's `setStore` "replaces references on the modified path (the element object…)". That assumption is false: `setStore("elements", predicate, partialObject)` — the path used by `updateElement` (and `commitText`/`commitRichText`) — **merges in place**, preserving the element's object identity (verified: a reference grabbed before the edit reads the new value after, `sameRef === true`). So the snapshot held references to the very objects a later edit mutated, and `restoreSnapshot` wrote the already-mutated values back. Add/delete/reorder escaped the bug only because they replace the whole `elements` array (function updaters), leaving the pre-op snapshot's old array intact.

**Resolution:** `captureSnapshot()` now shallow-clones every item: `store.elements.map(e => ({ ...e }))` (and likewise for `layers`/`slides`/`states`, which share the same in-place-merge vulnerability). The spread decouples the snapshot's top-level props from later in-place merges. Nested arrays (e.g. a stroke's `points`) stay shared by reference — safe because every code path that changes a nested array assigns a brand-new array, never mutates in place. Cost stays O(elements × props) rather than the O(total points) of the old `JSON.parse(JSON.stringify(...))` deep clone that was removed for iPad drawing performance. Verified with Playwright: text/move/color edits now undo *and* redo; add/delete undo still works.

## Clicking inside a path hole (or a shape's transparent bbox corner) wrongly selected it (2026-06-24)

**Symptom:** With compound paths (holes), clicking *through* a hole selected the path instead of clicking through to whatever was behind it — even though the hole is visually empty. The same quirk affected any shape with transparent regions inside its bounding box (e.g. a triangle's empty corner).

**Root cause:** A pure click that misses narrow-phase hit-testing falls through to the rectangle marquee. `selectionOnUp` finalized even a **zero-area** marquee with an AABB-intersection test, so a click whose point merely fell inside an element's bounding box selected it. The new even-odd `hitTestPathElement` correctly reported the hole as "outside" — the bug was entirely in the marquee fallback, not the hit-test.

**Resolution:** Require a real drag before AABB marquee selection — `box.w > 3/scale || box.h > 3/scale` in `selectionOnUp`. A no-drag click now relies purely on hit-testing (so holes click through), while genuine drag-marquees keep selecting by bounding box. Verified via Playwright: filled-shape click selects, path ring selects, **hole click-through selects nothing**, and a drag-marquee still selects all enclosed shapes.

## Connector binding targeted the outer container instead of the inner child shape (2026-06-24)

**Symptom:** With a shape nested inside a larger container (e.g. a rect A inside a rounded-rect frame), dragging a connector to A bound to the *container*, not A — so you couldn't connect inner children of two containers.

**Root cause:** `checkBinding` iterated elements in z-order and bound to the **first** element hit within a generous 40px threshold, then `break`-ed. The container and the child both pass the threshold test, and whichever came first in the array won — usually the container.

**Resolution:** `checkBinding` now collects *all* candidates near the point and picks the most specific one: the point being actually *inside* a shape beats merely being near it, then smaller area (the inner/nested child) wins, then higher z-order as a tiebreak. Hovering a container's empty space still binds the container; hovering a child binds the child. Verified via Playwright: an arrow drawn from child rect A (inside frame L) to circle C (inside frame R) binds to A and C, not the frames.

## Resized (wrapped) toolbar clipped off the top of the viewport (2026-06-24)

**Symptom:** After dragging the toolbar resize grip to wrap icons into a grid, the toolbar collapsed too narrow (1 icon/row) and its top rows were clipped above the viewport — especially in vertical orientation (which centres on the Y axis), leaving it unusable.

**Root cause:** Wrap mode kept the orientation's centering transform. The vertical bar centres with `translateY(-50%)` + `top: 50%`, so a tall wrapped grid extended equally up and down and clipped off the top. The min wrap width (56px) also allowed a single-icon column.

**Resolution:** In wrap mode the toolbar is pinned to the top (`top: 12px`, no vertical centering) and grows downward with `max-height: calc(100vh - 24px)` + `overflow-y: auto` (slim scrollbar), so it can never exceed the viewport. A `.vertical.wrap` override forces top-left anchoring and row-wrap for the vertical bar. Minimum wrap width raised to 96px (≈2 icons/row). Verified via Playwright: horizontal and vertical wrapped toolbars both stay fully on-screen (top ≥ 0, bottom ≤ viewport height).

### 112. Lens Flare nearly invisible (opacity on wrong scale)

**Files:** `frontend/src/api.ts`

**Observation:** an inserted Lens Flare looked blank/“disappeared” when deselected — only the selection outline made it visible.

**Root cause:** `createFlare` set element `opacity` to `0.9 / 0.5 / 0.35 / 0.4`, but Yappy opacity is **0–100**, so the parts rendered at ~0.4–0.9 % opacity (essentially transparent).

**Resolution:** opacities moved to the 0–100 scale (22/40/95/70/50/45) with an amber palette visible on light + dark, plus a clearer structure (soft glow → bright core → rays → halo rings → ghost reflections). Verified deselected in both themes.

## Time-lapse player wedged by an accidental SolidJS effect dependency (2026-06-27)

**Observation:** opening the new time-lapse player rendered the modal shell but never loaded any frames — no loading state, no error, blank stage. Logs showed the open-effect firing repeatedly with `open=false` even though the player `<Show>` (same signal) was clearly true.

**Root cause:** the load/cleanup `createEffect` called `reset()`, which read `urls()` (iterating it to `revokeObjectURL`) and then `setUrls([])`. Reading `urls()` inside the effect made it a dependency; `setUrls([])` allocates a **new array each run**, so default `===` equality saw a change and re-fired the effect endlessly, starving the real `open` branch.

**Resolution:** wrapped the load/reset calls in `untrack(() => …)` so only `timelapsePlayerOpen()` is tracked, and read `urls()` untracked inside `reset()`. Player now loads frames correctly (verified e2e: record → stop → play → frame image renders; export → real `.webm` download).

## Pathfinder boolean ops inherited the wrong shape's colour (2026-06-27)

**Observation:** intersecting a back yellow rectangle with a front pink diamond produced a **yellow** result. Users expect the Illustrator convention where the result takes the **frontmost** object's appearance (i.e. pink).

**Root cause:** `applyPathfinder` (`frontend/src/store/app-store.ts`) always styled the result from `els[0]` — the **backmost** shape after the back→front sort — for every op (union/intersect/exclude/subtract).

**Resolution:** result now inherits the **frontmost** shape's appearance (`els[els.length - 1]`) for union/intersect/exclude, matching Illustrator's Pathfinder. `subtract` ("minus front") keeps `els[0]` because the backmost shape is the one that survives the operation. The region-pathfinder path (`applyPathfinderRegion`) already coloured by topmost shape, so the two paths are now consistent.

## Multi-piece path ops (Exclude/Divide/…) silently dropped all but one piece — duplicate ids (2026-06-27)

**Observation:** Pathfinder **Exclude** on a rectangle + diamond rendered only the diamond piece; the notched-rectangle piece was invisible. Verified in-app (Playwright + `window.Yappy`): both result elements existed in the store with correct geometry, but **both had id `path-1`**.

**Root cause:** `generateId('path')` assigns ids by scanning the store for the current max suffix and adding 1. `buildPathFromPoly` called it **without** the `batchIds` set. When an op builds several paths in one synchronous loop *before* any are committed to the store, every call sees the same store state and returns the **same id**. Two elements sharing an id collide downstream (only the first renders/updates/selects) — so every multi-output path op was affected: Exclude, Divide, Trim, Merge, Crop, Knife, Path Eraser, Blob Brush, Outline Stroke, Offset Path, Distort, Live Paint fills.

**Resolution:** threaded an optional `batchIds: Set<string>` through `buildPathFromPoly` → `generateId`, and every looped call site now allocates one `Set` per op and passes it, so each piece gets a unique id (`path-1`, `path-2`, …). Verified in-app: Exclude now renders both the notched rectangle and the truncated diamond, with the overlap correctly removed from both.

## deleteSlide silently failed to delete a non-active slide (2026-06-27)

**Observation:** `Yappy.deleteSlide(index)` (and the slide-navigator delete) left the
slide count unchanged when the deleted slide was *not* the active one and the active
slide sat at a higher index. `addSlide` worked with structurally identical code.

**Root cause:** `deleteSlide` calls `setActiveSlide(nextIndex)` *inside* its `batch()`
while `store.activeSlideIndex` is still the old value. `setActiveSlide` saves the
"leaving" slide via `setStore("slides", store.activeSlideIndex, { lastViewState })`;
after the delete that index is **out of range** of the now-shorter array, so the write
re-created the slot — restoring the deleted slide.

**Resolution:** bounds-check the save in `setActiveSlide` —
`store.activeSlideIndex >= 0 && < store.slides.length`. Verified by `tests/slides.spec.ts`
(13/13, incl. delete; switching/duplicate/reorder unaffected).

## 2026-06-30 — Elbow connectors corrupted when bound shapes move (e.g. grouped)

### Grouping connected shapes broke the connector

**File:** `frontend/src/utils/binding-logic.ts` (`refreshLinePoints`).

**Symptom:** connect two shapes with an **elbow** connector, group the shapes,
then drag the group — the connector stops rendering ("not working"). Also
reproduces on any move of an elbow-connected shape, not just grouping.

**Root cause:** connector `points` are stored as a FLAT `number[]`
(`connect()` writes `[0,0,w,h]`; the straight-line refresh branch writes
`[0,0,ex-sx,ey-sy]`). But the **elbow** branch of `refreshLinePoints` rebuilt
them as `{x,y}` objects (`rawPoints.map(p => ({x,y}))`). On the first
`refreshBoundLine` after a move, the elbow's points flipped from
`[0,0,200,0]` → `[{x:0,y:0},{x:200,y:0},…]`, a format the arrow/line renderer
can't draw, so the connector vanished. Grouping just moves both bound shapes
at once, which is why it surfaced there.

**Fix:** flatten the elbow branch to a `number[]`:
`rawPoints.flatMap(p => [p.x - sx, p.y - sy])`. Verified the elbow now stays a
flat array after single + grouped moves and renders as a proper L-shaped
orthogonal route with arrowhead.

**Learning:** connector geometry has ONE canonical storage format — flat
`number[]`. Any code path that recomputes `points` must emit that, never `{x,y}`
objects, even though `DrawingElement.points` is typed `Point[] | number[]`.

## 2026-06-30 (pm) — Connector un-clickable when its shapes are grouped

**File:** `frontend/src/utils/tool-handlers/selection-handler.ts`.

**Symptom:** connect two shapes, group the shapes, then try to click the
connector — it can't be selected (the click selects the group), and its hover
handles never appear. Reported as "I cannot click on the connector / no + icon".

**Root cause:** the selection hit-test ran a "STEP 1" that, before any
per-element test, selected a whole group if the click fell inside the group's
**bounding box** — and returned. A connector between two grouped shapes lives in
the empty gap *inside* that bbox, so every click there selected the group and
never reached the connector.

**Fix:** demoted the group-bbox hit from a pre-emptive short-circuit to a
**fallback** that runs only when the per-element hit-test finds nothing. Now:
clicking ON the connector selects the connector; clicking a member selects the
group; clicking the group's empty interior still selects the group.

**Learning:** group "click-anywhere-in-bbox" selection must never pre-empt the
real element hit-test, or anything occupying the gaps between members (connectors,
lower-z elements) becomes unreachable.

## 2026-06-30 (pm) — "Reparent Node?" prompt fired for ordinary shapes

**File:** `frontend/src/utils/tool-handlers/selection-handler.ts`.

**Symptom:** moving any shape so its centre overlapped another shape (e.g. a
`bpmnStartEvent` over a `rectangle`) popped the mindmap "Reparent Node?" dialog.

**Root cause:** the reparent drop detection set a drop target whenever a single
selected element's centre hit any other element — with no mindmap/hierarchy check.

**Fix:** gate it so BOTH the dragged element and the target must be hierarchy
nodes (have a `parentId`, or be some node's parent). Ordinary shapes no longer
trigger it; mindmap reparent still works.

## 2026-06-30 (pm) — Connection handles dead on grouped shapes

**File:** `frontend/src/utils/handle-detection.ts`.

**Symptom:** with a shape in a group selected, the green connection "+" circles
render but hovering/clicking them does nothing — you can't drag out a connector.

**Root cause:** the renderer draws connection handles for every selected element,
but `getHandleAtPosition` only hit-tested them for single selection
(`selection.length === 1`). A grouped shape is multi-selected, so the handles were
drawn-but-dead.

**Fix:** added a multi-selection pass that hit-tests each selected member's four
connection handles and returns `{ id: memberId, handle: 'connector-<pos>' }`, so
the rendered handles are draggable even inside a group. (The topmost member's
top-centre handle can overlap the group rotate handle — minor.)

**Learning:** any handle the selection renderer draws must have a matching branch
in `getHandleAtPosition`, or it becomes a visible-but-dead affordance.

## 2026-06-30 (eve) — Hatch fills only worked in sketch mode (render-style parity)

**File:** `frontend/src/shapes/base/render-pipeline.ts`.

**Symptom:** the sketchy fill styles — Hachure, Cross-Hatch, Zigzag, Dashed,
Zigzag Line — only rendered in **sketch** mode (RoughJS). In **architectural**
mode they collapsed to a flat solid fill, breaking render-style parity.

**Fix:** added `applyHatchFill` — in architectural mode it clips to the shape
outline and strokes clean parallel (or zig-zag / dashed) hatch lines in the fill
colour, density-aware via `fillDensity`. Cross-hatch makes a second pass at the
perpendicular angle. `buildRenderOptions` suppresses the architectural solid fill
for these styles so the hatch shows; sketch mode is untouched (still RoughJS).

**Learning:** the architectural fill path lives in `applyComplexFills` (runs
before the per-shape render, in a center-translated frame; `getShapeGeometry` is
center-relative). Any new "fill that RoughJS would do in sketch" needs a clean
architectural twin there + a `fill = undefined` in `buildRenderOptions`.

## 2026-06-30 (eve) — Letter spacing ignored by text auto-resize / wrapping

**File:** `frontend/src/utils/text-utils.ts` (+ 6 callers of `measureWrappedTextHeight`).

**Symptom:** adding letter spacing (tracking) spread the glyphs and the box stayed
the same — an auto-sizing shape's fitted box didn't grow, and word-wrap in a fixed
box wrapped a touch late. Diverged from Illustrator, where tracking widens the
point-type bounds and area-type wrapping accounts for it.

**Cause:** the measurement helpers (`measureContainerText`, `measureMaxLineWidth`,
`measureWrappedTextHeight`) set `ctx.font` and called `measureText()` but never set
`ctx.letterSpacing`, so they measured as if spacing were zero.

**Fix:** set `ctx.letterSpacing` (from `el.letterSpacing`) before measuring in each
helper; `measureWrappedTextHeight` gained a `letterSpacing` param (threaded from all
6 callers); shared-context helpers reset it to `0px` afterwards to avoid leaks;
vertical-type measurement forces `0px` (tracking is horizontal). Now `fitShapeToText`
grows the box with tracking and wrapping accounts for it — matching Illustrator.

## 2026-06-30 (eve) — Puppet Warp silently no-op'd on text/connectors

**File:** `frontend/src/components/puppet-warp-overlay.tsx`.

**Symptom:** Puppet Warp accepted any single selected element, so dropping pins on
a text element or a connector did nothing (the mesh only deforms a vector outline
or image pixels — text glyphs and connectors have nothing to bend).

**Fix:** gated the tool to warp-capable elements (everything except `text`,
`richtext`, `line`, `arrow`, `organicBranch`). For an ineligible selection the
full-screen capture overlay no longer shows (canvas stays interactive) and a
non-blocking hint appears: "Puppet Warp works on shapes, paths & images — not text
or connectors."

## 2026-06-30 (eve) — Touch Type glyph selection was inconsistent

**File:** `frontend/src/components/touch-type-overlay.tsx`.

**Symptom:** selecting a letter (plain / Shift / Ctrl-click) worked sometimes and
not others — clicking high or low on a tall letter, or just off its centre, often
selected nothing (silently fell through to an empty marquee).

**Cause:** `hitGlyph` used Euclidean distance from the glyph CENTRE
(`d < max(width, 14)`), so a click near a glyph's top/bottom exceeded the radius
even when horizontally dead-on.

**Fix:** span-based hit-test — a click inside a glyph's x-column and within the
text's vertical band (`fontSize * 0.75`) selects it, with a loose nearest-centre
fallback for clicks just past the ends. Selection is now reliable for plain,
Shift- and Ctrl/⌘-click. Also added `onContextMenu` preventDefault on the overlay
(on macOS Ctrl-click is the OS right-click — use ⌘-click there).

## 2026-06-30 (eve) — Touch Type: dragging a letter moved other letters

**File:** `frontend/src/components/touch-type-overlay.tsx`.

**Symptom:** after styling some letters earlier (which left a multi-glyph
selection active), clicking one letter and dragging moved OTHER letters too.

**Cause:** a plain click on a glyph that was part of a lingering multi-selection
kept the whole selection and dragged the group — standard group-move, but
surprising in a per-letter tool when the selection wasn't obvious.

**Fix:** a plain click+drag now resets the selection to just the clicked glyph and
moves only it — so dragging always moves exactly the letter you grabbed.
Multi-select (Shift / Ctrl-⌘ / marquee) still drives the style controls
(scale / rotate / colour / font).

## 2026-06-30 (eve) — Touch Type couldn't click letters after increasing letter spacing

**Files:** `frontend/src/components/touch-type-overlay.tsx`,
`frontend/src/shapes/base/render-pipeline.ts`.

**Symptom:** with letter spacing increased, the later letters render spread out but
clicking them in Touch Type did nothing — you could only grab the first letter or two.

**Cause:** the renderer advances glyphs by `measureText` with `letterSpacing` set, so
they spread out; but the overlay's `glyphBoxes()` measured WITHOUT letter spacing, so
its hit-boxes bunched on the left and clicks on the visually-spaced letters missed.

**Fix:** `glyphBoxes()` now sets `ctx.letterSpacing` from `el.letterSpacing` (and
resets the shared context). Also set `renderer.letterSpacing` inside the shared
`renderTouchTypeLine` so render and hit-test always agree.

## 2026-07-03 — Letter Spacing missing for shape & connector labels

**Files:** `frontend/src/config/properties.ts`,
`frontend/src/shapes/base/render-pipeline.ts`,
`frontend/src/shapes/renderers/connector-renderer.ts`,
`frontend/src/components/text-editing-overlay.tsx`.

**Symptom:** text elements have a Letter Spacing property, but selecting a shape
(or a line/arrow with a label) showed no such control — shape-label tracking
couldn't be adjusted at all.

**Cause:** three stacked gaps. (1) The `letterSpacing` property config was
`applicableTo: ['text', 'richtext']` only, so the panel hid it for shapes.
(2) `RenderPipeline.renderText` *measured* labels with `letterSpacing`
(`measureContainerText` sets it for wrapping) but never set
`renderer.letterSpacing` before drawing, so painted lines wouldn't have matched
the measured layout. (3) The in-place edit textarea never applied
`letter-spacing` CSS — this also affected standalone text elements (editing
looked tighter than the committed result).

**Fix:** property exposed for the full text-capable shape list (same as Font
Size, incl. line/arrow/organicBranch); `renderText` and the connector-label
renderer now set `renderer.letterSpacing` after `save()`; the edit textarea gets
`letter-spacing: (el.letterSpacing || 0) * scale`px. Verified end-to-end with
Playwright: painted label width grew exactly 10 gaps × 8px in BOTH sketch and
architectural styles; connector label pill sizes around the widened text; edit
overlay computed style matches. SVG export already emitted `letter-spacing`.
Rich-text labels (per-span layout) still ignore element-level tracking — same
pre-existing limitation as standalone richtext.

## 2026-07-04 — New design document opened with page off-view (v0.5.27-dev)

**Symptom:** Menu → New Design… → pick a size (e.g. Instagram Story 1080×1920)
showed an apparently empty white canvas — no page frame, no backdrop, "Page 1/1"
in the status bar but nothing visibly page-like.

**Cause:** `resetToNewDocument` forces 100% zoom centered on the first slide for
every new document (tuned for 1920×1080 presentations). A design page taller or
wider than the window overflowed the viewport on all sides, so only the white
middle of the page was visible and the frame/backdrop never entered view.

**Fix:** design documents now `zoomToFitSlide()` after creation (whole page
visible with margin, e.g. 29% for a story page in a laptop window); slides and
infinite documents keep the 100% default. Verified with a Playwright screenshot
at 1365×645. Bonus: the same reset path now also clears the IndexedDB autosave
copy (the inline localStorage-only clear predated the IDB migration).

## 2026-07-04 — Remove Background (AI) restyled the foreground subject

**Symptom:** background removal worked, but the subject sometimes came back
with added effects — repainted textures, glow, altered colors.

**Cause:** `gpt-image-1` edits are generative — the whole image is regenerated
from the prompt, not masked. Even with "keep the subject unchanged" in the
prompt, the model re-renders (and occasionally restyles) the foreground.

**Fix (3 layers):** (1) request `input_fidelity: high` (with a 400-retry
without the param for accounts that reject it) and a harder "pixel-identical,
no effects" prompt; (2) **alpha-mask compositing by default** — the original
image is drawn and the AI output is applied with `destination-in`, so only its
transparency is used and the subject keeps the original pixels exactly
(`removeBackground(id, {preserveOriginal: false})` opts out); (3) mask sanity
check (must contain both transparent and kept pixels, adaptive sampling) falls
back to the AI output when the mask is degenerate. Verified with a mocked-API
Playwright pixel test: red subject stays red even when the AI returns white.

## 2026-07-04 — Photo search failed (Openverse 401) → switched to Wikimedia Commons

**Symptom:** the Elements → Photos tab showed "Photo search failed" on real
use, though e2e (mocked) and curl both passed.

**Cause:** Openverse's anonymous tier is fragile for in-browser use — requests
from real/headless browsers were intermittently rejected with 401 (Cloudflare
bot scoring; curl with identical headers passed), and the anonymous quota is
only 200 requests/day. Not fixable client-side.

**Fix:** switched the provider to the **Wikimedia Commons** API — keyless,
officially supports anonymous CORS (`origin=*`), effectively unlimited, and
images are served from upload.wikimedia.org with open CORS. Insertion now
prefers the 1280px rendered thumbnail (Commons originals can exceed 50 MB).
Attribution (title, artist with HTML stripped, license) still lands on the
element. Verified live in a real browser: search + insert end-to-end.

## 2026-07-05 — Google Fonts picker closed on every selection (user-reported UX)

**Symptom:** selecting a Google Font closed the picker, so trying another font
meant reopening the dialog and scrolling the list again. Users couldn't
compare fonts on their actual design.

**Cause:** `pick()` in `google-fonts-dialog.tsx` called `props.onClose()` after
applying, and the dialog was a centered modal over a dimmed full-screen
backdrop — even without the close it would have hidden the canvas being
previewed.

**Fix:** picking a font now applies it and keeps the panel open (the row shows
"✓ applied"); the panel docks to the right edge with no backdrop so the canvas
stays visible and interactive, previewing each pick live on the selection.
Close via Done, Esc (window-level listener), or ✕.

## 2026-07-05 — Google Fonts picker: hover contrast + keyboard navigation (user-reported)

**Symptom:** the Done button's hover state had poor color contrast (both light
and dark themes), and the font list could only be browsed with the mouse —
no up/down arrow navigation.

**Cause:** Done's hover was `filter: brightness(1.08)` over the theme accent
variable (which can resolve too light for white text), and the list had no
keyboard focus model at all.

**Fix:** Done now uses fixed indigo (#6366f1 → #4f46e5 on hover) with white
text so contrast holds in every theme; hover/keyboard focus share one
accent-tinted row highlight. Added a focus index driven by ↑/↓ (works from
the search box), Enter applies the focused font (panel stays open), rows
scroll into view, and mouse hover syncs the focus. Verified with a UI-level
Playwright spec (canva-next.spec.ts).

## 2026-07-05 — Open Drawing dialog unreadable in dark mode

**Symptom:** the Open Drawing dialog rendered as a bright white panel with
dark text regardless of theme.

**Cause:** `file-open-dialog.css` predated the theme system and hard-coded
light colors (`background: white`, `#333` text, `#eee` borders).

**Fix:** rethemed with CSS variables (`--bg-panel`, `--text-primary`,
`--border-color`, `--accent-color`) with the old light values as fallbacks, so
it follows light/dark/focus like every other dialog.

## 2026-07-05 — Arcade: two balls / two paddles when playing (investigation)

**Report (user screenshot):** a running Pong showed two paddles, two balls, and
two overlapping "SCORE" texts.

**Cause (not a bug in the new visual builder):** the *code* starter templates in
`game/game-templates.ts` (Pong/Catch/Blank) create sprites with `game.spawn(...)`
UNCONDITIONALLY. If the canvas already holds game sprites — e.g. the user was
building visually (paddle + ball + a "SCORE" text as real sprites) — and then
runs the spawn-based code template, the template spawns a SECOND paddle/ball/HUD
on top → everything doubles.

**The visual builder path does NOT double:** generated block scripts reference
sprites by name (`game.find('Ball')`) and never spawn a paddle/ball, so a
block-built game has exactly the sprites on the canvas. Proven by
`tests/behaviors-builder.spec.ts` (after Play + Stop: exactly one Ball, one
Paddle, HUD cleaned up).

**Planned fix (follow-up, low-risk):** make the code templates idempotent —
`const paddle = game.find('Paddle') || game.spawn('rectangle', …)` and tag the
spawned sprite — so running a code template reuses existing sprites instead of
duplicating them. Deferred per "check later"; the recommended authoring path
(Game Builder) is already clean.

## 2026-07-07 — Slingshot: "one shot, then the ball stays on the ground"

**Report:** in the Slingshot sample you could fire once; after that the bird lay
on the ground and nothing happened — you couldn't shoot again.

**Cause (`game/game-templates.ts`):** the "next bird" only spawns once the fired
bird *settles*, but the settle test compared a **pre-clamp** velocity
(`speed = hypot(vx, vy)` computed before the ground bounce) against `STOP = 24`.
Every tick gravity adds `vy += GRAV·dt ≈ 26.7` *before* the ground branch clamps
it back to 0, so a bird resting on the grass always measured `speed ≈ 26.7 > 24`
→ `settled` never became true → `birdsLeft` never decremented → `loadBird()` never
ran, and the fired bird stayed `launched` on the ground (which also blocks
`onPointerDown`).

**Fix:** judge rest from the **post-clamp** state — track an `onGround` flag set
inside the ground branch and require `onGround && |vx|<STOP && |vy|<STOP`. A
resting bird (vy clamped to 0, vx decayed by friction) now settles and the next
bird respawns. Verified end-to-end in the real runtime with real mouse
(`tests/slingshot-repro.spec.ts`): fire → fly across → respawn → fire again.

## 2026-07-07 — Slingshot: not enough power to reach the pigs

**Report:** even a full pull couldn't reach the blocks/pigs.

**Cause:** max launch speed was `MAXPULL·POWER = 135·7.5 = 1012 px/s`, giving a
45° range of only `v²/g ≈ 640px`, but the pouch is at x≈150 and the targets sit
at x≈1010–1150 (860–1000px away) — physically unreachable.

**Fix:** `POWER 7.5→10.5`, `MAXPULL 135→145` (max speed 1522 px/s, range ~1450px).
A full pull now clears the gap with control margin; measured reach x≈1360 in
`tests/slingshot-repro.spec.ts`.

## 2026-07-07 — Platformer: "no gameplay, just jumping" + floaty/mid-air jump

**Report:** the Platformer sample had nothing to do (flat bar), and the jump felt
floaty and could be repeated in mid-air.

**Cause & fix:**
- *No ground gate (`game/behaviors-to-script.ts`).* The `jump` action applied its
  velocity on every press, mid-air included. Added a `_ground` set (`_land` marks
  it, the integrator clears it each frame); `jump` on a gravity sprite now only
  fires while grounded — non-gravity sprites keep the old unconditional behaviour.
- *Floaty tuning.* `GRAV 1500→2200`, `JUMP {560/780/1000}→{680/860/1040}` for a
  snappier ~0.78s arc.
- *No gameplay (`game/behavior-examples.ts`).* Rebuilt the Platformer example into
  a real level: three floating platforms, three coins (+100 each), and a goal flag
  (`win`), with fall-off = game over. Gaps/heights are tuned to the jump arc so
  every jump is makeable. Verified in the real runtime
  (`tests/platformer-repro.spec.ts`) and deterministically (land on platform,
  collect coin → score, reach flag → "YOU WIN!").

## 2026-07-07 — Game view switcher: Play (run) button clipped in the behaviors panel

**Report:** in the Simple builder header, the view switcher (Simple · Graph ·
Blueprint · Code) plus the ▶ Play button overflowed the 340px panel and the Play
button was cut off.

**Cause (`components/behaviors-panel.css` + `game-view-switcher.css`):** the four
labelled switcher buttons (~297px) + Play + Close exceeded the panel width, and the
panel's `overflow: hidden` clipped the right edge.

**Fix:** in the narrow behaviors panel, compact the switcher — show each tab's
label only when active, icon-only otherwise (tooltip still names it) — so it fits
on one row beside Play. Also made `.gvs` scroll instead of overflow, and let the
header `flex-wrap` (with `.bp-head-actions` shrink-protected) as a safety net. The
wide Graph/Blueprint/Code headers are unaffected (full labels). Verified the Play
button sits fully inside the panel in `tests/behaviors-header-fit.spec.ts`.

## Convert to Path shifts a line / freehand by half its bounding box (2026-07-08)

**Symptom:** Drawing a line / curved zig-zag / freehand stroke and choosing
**Convert to Path** moved the resulting path down-and-right — by exactly (w/2, h/2)
of its bounding box. Closed shapes (rect, circle, star…) converted in place; only
`points`-based elements shifted.

**Cause (`utils/shape-to-path.ts`):** `getShapeGeometry` returns most shapes'
geometry in **centre-relative** coords, and `shapeToPath` accordingly offsets every
point by `(+w/2, +h/2)` to reach element-origin coords. But line/connector/freehand
elements store `el.points` in **element-origin** coords already (`(0,0)` = top-left;
see `draw-handler.ts` `[0,0,w,h]`). Those points fall through the same centre-offset
path, so they were pushed an extra half-bbox.

**Fix:** in `shapeToPath`, handle `el.points` elements up front — normalise the
points (packed `number[]` or `{x,y}[]`) and emit them **directly** as anchors
(open path), with no centre offset. Closed shapes are unaffected. Verified: an
origin-relative zig-zag converts to anchors spanning `0..w × 0..h` (was
`w/2..1.5w × h/2..1.5h`), and packed 2-point lines round-trip exactly.

## Animated stick-figure neck draws a radius line inside the head (2026-07-09)

**Symptom:** Every animated stick figure (`stickRig`) — on the canvas, in the
clip-picker thumbnails, and when baked to SVG — drew the neck as a line that
continued past the head outline to the head **centre**, so a stub was visible
inside the circle, reading as a radius. Static library poses were unaffected
(they author the torso to start at the head's bottom edge).

**Cause (`library/stick-figures/anim/rig.ts`, `shapes/renderers/stick-rig-renderer.ts`):**
the neck bone was `shoulder → head`, where the `head` joint IS the head-circle
centre. FK places the head centre exactly `HEAD_RADIUS` beyond the outline, so the
last `HEAD_RADIUS` of the neck segment sat inside the head.

**Fix:** added `headAttach(pose)` in `rig.ts` — the point on the head outline along
the shoulder→centre direction (`centre + unit(shoulder − centre) · headR`). Both the
SVG builder (`rigPoseToSvg`, used by thumbnails + bake) and the live canvas renderer
(`StickRigRenderer.computePose`, `CHAINS[1]`) now end the neck at that edge point
instead of the centre. Verified: idle pose neck now runs shoulder (70,84) → (70,56)
= head bottom edge, instead of → (70,34) centre.

## Mermaid `classDiagram` imports: empty member boxes, dropped `o--` class, undifferentiated arrows (2026-07-09)

**Symptom:** Importing a Mermaid `classDiagram` produced (1) boxes containing only
the class name — attributes/methods compartments empty; (2) an aggregation line
`Subject o-- Observer` silently dropped the left-hand class (`Subject` never
rendered); (3) inheritance/composition/aggregation/dependency all drew the **same**
arrow, distinguished only by a text label.

**Causes (all in `dsl/adapters/mermaid/class-parser.ts` + `dsl/engine/dsl-engine.ts`):**
1. Field-name mismatch — parser sections were mapped onto `umlAttributes`/`umlMethods`
   in `dsl-engine`, but renderers/layout/export read `attributesText`/`methodsText`.
2. `RELATION_RE` listed the arrow as `" o--"` with a **leading space**; the preceding
   `\s+` consumes the separator, so `o--` never matched and the line fell through to the
   "unrecognized syntax" branch → no edge, and no node for a relation-only class.
3. `mapRelationship` returned a text label (`'composition'`, `'aggregation'`, …) instead
   of a UML arrowhead.

**Fix:**
1. `dsl-engine` writes `attributesText`/`methodsText` (the canonical fields).
2. Removed leading spaces from all arrow alternatives; added `o-->`/`*-->`, reversed
   `<--o`/`<--*`/`<--`, and optional quoted cardinality both sides.
3. `mapRelationship` now returns a `RelationSpec { decorated, glyph, dashed, nav }`; the
   edge is oriented so the glyph lands on the correct end — hollow `triangle` on the base
   (generalization/realization), `diamondFilled` on the whole (composition), hollow
   `diamond` on the aggregate (aggregation), open `arrow` on the target (association/
   dependency; `..>`/`<|..` dashed). Both `start`- and `endArrowhead` are set explicitly so
   the `createElement` default (`endArrowhead: 'arrow'`) can't leak a stray head. Old text
   labels dropped; user-supplied `: role` labels preserved. Verified via regex + edge-build
   simulation across all forward/reversed/nav/cardinality forms. See
   [docs/dsl-uml-gaps.md](../dsl-uml-gaps.md) (Gaps 1–3).

## Mermaid `classDiagram` members never parsed + missing from SVG export (2026-07-09)

**Symptom:** Even after the field-mapping fix above, importing a Mermaid `classDiagram`
still produced empty member compartments, and exported SVG showed only class-name
boxes with identical open-arrow relationships.

**Causes:**
1. **Parser (`class-parser.ts`):** `class Foo {` with the opening brace on the *same
   line* (Mermaid's canonical form) failed `CLASS_DEF_RE` (the inline-body group needs a
   closing `}`), so the line was "unrecognized", the body parsed as loose statements, and
   `+observers: List` became a bogus class `+observers` while the real class stayed empty.
2. **SVG export (`export.ts`):** `exportToSvg` is a separate `rough.svg` renderer with its
   own per-type branches — it never runs the on-canvas uml-class-renderer — so it emitted
   only the box + `containerText` (name), never the compartments. The arrow branch also
   drew only an open-V head, ignoring `endArrowhead` type.

**Fix:**
1. `CLASS_DEF_RE` captures an optional trailing `{` and opens the multi-line block from it
   (brace-on-next-line path retained); block-close also accepts a member with a trailing `}`.
2. Added `buildUmlClassNode` in `export.ts` (reuses `calculateUmlClassLayout` /
   `calculateUml2SectionLayout`) to emit header + attribute/method compartments + dividers,
   and `umlArrowheadGlyph` so `triangle`/`diamond`/`diamondFilled` export as proper polygons.
   Verified end-to-end with the new `render:dsl` CLI (rasterized the SVG and eyeballed a
   correct observer-pattern diagram: hollow triangle + hollow diamond, populated members).

## YSL member syntax + headless CLI (2026-07-09, features)

- Native text DSL node blocks now accept `attributes:` / `methods:` (`;`-separated) →
  `node.sections` (`text-parser.ts`, Gap 4).
- Added `scripts/render-dsl.mjs` (`npm run render:dsl`) — headless DSL→SVG via Playwright
  (Gap 6). Gap 5 (per-node `borderRadius` etc. + public `updateElement`) was already
  supported; confirmed and documented.

## UML class boxes too narrow — long `name: Type` members wrap/overflow on export (2026-07-09)

**Symptom:** In imported UML class diagrams, a member like `-strategy: Strategy` or
`-balance: number` wrapped to two lines and, in SVG export (compartments aren't
clipped there), the wrapped tail spilled past the compartment so the type after the
colon looked dropped. Shorter members (`-owner: string`) rendered intact — the
give-away that the box width, not the text, was the problem.

**Cause (`dsl-engine.ts`):** `applyAutoSizing` sized each node to fit its **label**
only. For `umlClass`/`umlInterface` that's just the class *name*, so the box stayed at
its 180px default regardless of member width → members wider than the compartment
wrapped (clipped on canvas, overflowing on export).

**Fix:** added `computeUmlFittedSize` — for `umlClass`/`umlInterface` with sections it
measures (with the same renderer/font the drawers use) the widest of the header name
and every member line, and sizes the box to fit that width plus a row per member. No
member wraps now; canvas and export both benefit (single-source fix). Verified: the
Account box renders `-balance: number` / `-owner: string` / `-strategy: Strategy` each
on one line.

## UML relations: arrowheads piled up on a shared base, and `{ }`-block arrowheads ignored (2026-07-09)

Two related UML-relation polish fixes.

**Fix A — native text-DSL edge `{ endArrowhead: … }` was ignored.** In the compact
text DSL, arrowhead keys inside an edge's `{ }` block were treated as *style* props
and dropped, so `sub -> base { endArrowhead: triangle }` never decorated the head.
`text-parser.ts` now hoists `startArrowhead`/`endArrowhead` out of the parsed style
into edge-level props (the engine reads `edge.startArrowhead`/`endArrowhead`);
`none`/`null` mean "no head" (e.g. a diamond-only end). Verified: the edge now carries
`endArrowhead: 'triangle'`.

**Fix B — inheritance-fan arrowheads overlapped on the base.** When many edges share
one class/interface endpoint (many subclasses → one base, an interface with many
implementers), the default center-line clip landed every arrowhead on nearly the same
border point, so the heads overlapped. Added `distributeClassEdgeAnchors` (dsl-engine)
which spreads each such group evenly (fractions 0.2–0.8, off the corners) along the
border facing its neighbours, and `connect()` (api.ts) gained optional
`startAnchor`/`endAnchor` fraction overrides (destructured out of the element options so
they don't leak onto the element). Scoped to edges with `umlClass`/`umlInterface` on
*both* ends — sequence/flowchart/ER diagrams are untouched; groups of one keep the
natural center clip. Verified: three `Shape <|-- X` edges land at `fy` 0.2 / 0.5 / 0.8
on Shape's border as three distinct triangles.

## Global colour palette — first swatches indistinguishable (transparent looked like white) (2026-07-09)

**Symptom:** In the global colour palette (the "PALETTE Default" panel), the first five
swatches all looked like the same white tile. The **Transparent** swatch in particular
was indistinguishable from **White**.

**Cause (`p3-color-picker.tsx`):** the swatch painted `transparent` as solid `white`
(`background: value === 'transparent' ? 'white' : value`) with no indicator, so it read
as a plain white square identical to the White swatch. The Default palette's first five
values are also all near-white (`transparent`, `#ffffff`, `#f8f9fa`, `#f1f3f5`,
`#fff5f5`), and the swatch border was a barely-visible `rgba(0,0,0,0.1)`, so the tiles
had no delineation.

**Fix:** render `transparent` as a **checkerboard** (the standard "no colour" convention)
so it's clearly ≠ White, and give every swatch a two-ring outline — a darker border
(`rgba(0,0,0,0.18)`, crisp edge for light tiles) plus a subtle outer light halo
(`0 0 0 1px rgba(255,255,255,0.10)`, separates dark tiles from the dark panel). Verified
via an old-vs-new render. (Palette *curation* — the run of near-white values — left as a
separate taste call; `property-panel.tsx` already indicates transparent with a diagonal
line, so only the global palette needed the fix.)

## Quick-toolbar font-size slider stepped by 2, not 1 (2026-07-09)

**Symptom:** In the shape/quick toolbar, focusing the Font Size mini-slider and pressing
ArrowLeft/ArrowRight changed the size by **2** at a time instead of 1.

**Cause (`config/quick-toolbar-config.ts`):** the quick toolbar has its *own* control
config (separate from `config/properties.ts`), and both `fontSize` mini-slider entries
were declared `step: 2`. A native `<input type="range">` moves by exactly its `step` on
arrow keys, so the arrows nudged by 2. (This is why a first pass that only checked
`config/properties.ts` — where fontSize is `step: 1` — missed it.)

**Fix:** set both quick-toolbar `fontSize` entries to `step: 1`. Arrow keys / the number
spinner now move by 1. Other deliberately-coarse steps (opacity/filters `5`, angle `5`)
are left as-is.

## Bezier/elbow connectors exported to SVG as straight chords (2026-07-09)

**Symptom:** Curved (bezier) and elbow connectors rendered as **straight lines** in
exported SVG — the on-canvas curve was lost. (Surfaced while building mind-maps, where
`mindmap-down-curved` looked identical to `-straight` in export.)

**Cause (`export.ts`):** the line/arrow export branch always drew `rc.line(el.x, el.y,
endX, endY)` — a straight chord — ignoring `el.curveType`.

**Fix:** added `connectorCurvePath(el)` (mirrors the connector-renderer's default control
points — cp offset along the dominant axis; honours explicit `controlPoints`; elbow → a
right-angle polyline) and `connectorPathEl` (a clean stroked `<path>`). The line branch
and the arrow's base line now emit the real curve when `curveType` is `bezier`/`elbow`.
Fixes it app-wide, not just mind-maps. Verified: `mindmap-down-curved` exports smooth
per-branch curves; straight/UML diagrams unaffected.

## Several dialogs couldn't be closed with Escape (2026-07-09)

**Symptom:** A number of modal dialogs didn't close on the Escape key. Some had an
`onKeyDown={… Escape …}` on their overlay `<div>`, but a `<div>` only receives keydown
when it (or a child) has focus — which it usually doesn't — so Escape did nothing.

**Fix:** added a shared `onEscapeKey(isOpen, handler)` hook (`utils/use-escape.ts`) that
installs a **window-level** keydown listener while the dialog is open (and tears it down
on close/unmount), and wired it into the 9 dialogs that lacked reliable Escape:
design-size, save, unsaved-changes, version-history, video-url, repeat, game-script,
my-games, new-game. The ~12 dialogs that already used a window listener are unchanged.

**Verified end-to-end** (drove the real menu → opened each dialog → pressed Escape →
asserted it closed): design-size, version-history, new-game, my-games, and game-script
all close on Escape, and a previously-working dialog (dsl-import) still does (no
regression). Covers all three close patterns — `props.onClose`, a signal setter, and a
`store` getter.

## Sitemap / Random Words menu items looked empty (2026-07-09)

**Symptom:** The new Sitemap / Random Words mind-map presets showed as bare "…" rows
in the menu — no icon and no readable label.

**Cause (`menu.tsx`):** the two items had no leading icon (unlike every other menu
item) and a decorative leading `…` in the label, so they read as empty dots.

**Fix:** gave them icons (Network / Sparkles) and clean labels ("Sitemap" /
"Random Words"), kept the `menu-sub` indent. Verified in the rendered menu.

## Palette + theme-toggle icons overlapped the Properties panel (2026-07-09)

**Symptom:** The fixed top-right **Color Palette** and **light/dark Theme** buttons
(z-index 10000) sat on top of the Properties panel's header when the panel was open —
the panel docks to the right edge (~280px) and the buttons live in that same corner.

**Fix (`menu.tsx`):** shift both controls (and the palette dropdown) left by the panel
width (`propPanelOffset()` = 290 when `showPropertyPanel && !isPropertyPanelMinimized`)
so they clear the panel; they slide back to the corner when it closes (0.15s ease).
Verified: with the panel open (left edge x=1020) the icons now end at x≈943/991 — left of
the panel, no overlap.

## createElement accepted invalid type names → invisible, non-functional elements (2026-07-10)

**Symptom:** `Yappy.createElement('ellipse', …)` created an element that neither rendered
nor participated in Pathfinder/boolean ops (empty result). `'ellipse'` is not a valid
`ElementType` — the toolbar "Ellipse (4)" tool actually creates `type: 'circle'` — but the
API stored the bad type verbatim, and `getShapeGeometry` returns `null` for unknown types,
so the element had no geometry (invisible, no hit-test, no boolean input). `'ellipse'` is the
single most natural name for a scripter to try (it's literally the toolbar label).

**Fix:** (1) `api.ts` — `normalizeElementType()` maps common synonyms (`ellipse`/`oval`→`circle`,
`rect`/`square`→`rectangle`, `tri`→`triangle`) and `console.warn`s on remap; called at the top
of `createElement`. (2) Defensive: `shape-geometry.ts` `getShapeGeometry` now shares the `circle`
case with `ellipse`/`oval` so any such element that already slipped in (old doc / API) still
renders and unions. Verified in-app: `createElement('ellipse')` now yields a circle that renders
and its union with a rectangle produces a merged path.

## Numeric property inputs snapped to min (e.g. font-size → 8) when cleared (2026-07-10)

**Symptom:** Clearing a numeric field in the Properties panel (font size, opacity,
sloppiness, effect sliders…) to type a new value made it jump to a number — font
size to **8**, others to 0 or their own min — so you couldn't delete-and-retype.

**Cause (`property-panel.tsx` `renderControl` slider `precise-number-input`):** the
`onInput` committed `Number(e.currentTarget.value)` on every keystroke. An empty field
is `Number('') === 0`, which was written to the store immediately; a clamped property
(font size, min 8) then snapped to its minimum mid-edit.

**Fix:** `onInput` now ignores empty / partial (`''`, `-`, `.`, `-.`) / non-finite input
so the field stays editable, committing only real numbers. Added `onBlur` to resync an
empty/invalid field back to the current value (no blank box). Verified: clear→stays empty,
type 64→stores 64, blur→shows 64.

## Export cropped artwork / dropped elements / missing effects (2026-07-10)

**Symptom:** Exporting (PNG/JPG/page) cropped the artwork, dropped shapes entirely, and
(for the new live effects) omitted them.

**Causes (`utils/export.ts`):**
1. **Crop** — the export crop box was the raw `x/y/w/h` union, ignoring **rotation, stroke
   width, shadow/glow/feather, 3D-extrude depth, and Transform-effect copies**, so all of those
   spilled past the canvas edge and were clipped.
2. **Dropped elements** — the paged (design/poster) export (`renderPagedDocToCanvas`,
   `exportPageToPng`) included an element only if its **centre** fell inside the page rect, so a
   shape overlapping the page but centred off it vanished from the output.
3. **Missing effects** — export called `renderElement` directly, which draws only the flat base
   shape; the 3D-extrude body and Transform-effect copies live in the canvas render *hook*, so
   they never reached the exported image.

**Fix:** added `elementAABB` (rotation + stroke + shadow/glow/feather + extrude aware) and
`elementsBounds` (unions Transform-effect copies) — used for the crop box in all raster exports.
Paged exports now use an **overlap** test (`overlapsRect`) instead of centre-inside. Added
`renderElWithEffects` (replays the extrude body + transform copies) and routed every raster
export render through it. Verified: rotated bar, transform fan, and extruded star all export
uncropped with their effects.

## Export added a 20px transparent border; quick-toolbar font size still snapped to 8 (2026-07-10)

**Symptoms (user-reported):** (1) exported PNG/JPG/SVG had a transparent margin around the
artwork; (2) the earlier font-size-snap fix (property panel) didn't help — font size still
jumped to 8 when cleared/retyped.

**Cause & fix:**
1. **Transparent border** — the freeform image/vector exports padded the crop box by a fixed
   **20px** (`export.ts`), which is transparent when the background is off. Reduced PNG / JPG /
   copy-PNG / SVG padding to **2px** (the visual bounds already include stroke/effects); PDF/PPTX
   keep a print margin. Verified: a 162px shape now exports 166px (2px each side, was 202px).
2. **Font size still snapping to 8** — the earlier fix only covered the **property-panel** input.
   The **quick-toolbar mini-slider** (`quick-toolbar.tsx`) had the same bug from a different cause:
   its `onInput` called `clamp(n)` on **every keystroke**, so typing "1" (for "16") was clamped to
   the min (8) and the controlled field snapped to "8", blocking further typing. Fixed to
   live-preview only complete, **in-range** values; a partial/below-min entry stays in the field,
   and the final value is clamped on blur/Enter. (Property-panel path re-verified: clear → type
   "1" stays "1" → "16" → stores 16.)

## Export worked once then silently did nothing (2026-07-10)

**Symptom (user-reported):** export worked the first time, then subsequent exports "not working
or irregular."

**Cause (`export-dialog.tsx`):** the dialog's `onlySelected` signal was set to `true` when opened
with a selection but **never reset** — the component persists across opens (shown/hidden via
`isOpen`), so it stuck at `true`. Re-opening later with nothing selected left "Only selected"
checked, and `exportToPng/Jpg/Svg(..., onlySelected=true)` **silently `return`ed** on an empty
selection → nothing happened.

**Fix:** (1) the dialog now resets `onlySelected` to match the *current* selection on each open
(untracking the selection read so it resets on the open-transition only). (2) The export functions
now show a toast ("Nothing selected — uncheck 'Only selected'…") instead of a silent return, so a
no-op is never invisible. Verified: selection-only export with nothing selected toasts; whole-
drawing export still downloads.

## Images not appearing in export (only the background) (2026-07-10)

**Symptom (user-reported):** "I have an image and on top I put another image — only the background
exported." The top (recently placed) image was missing from the exported PNG.

**Cause (`image-cache.ts` + `export.ts`):** exporters render **synchronously**, but images are
decoded **asynchronously** — `getImage(dataURL)` returns `null` on a cache miss and kicks off a
background load. So an image that hadn't been decoded yet (just placed, off-screen, or in a
freshly-loaded doc) drew nothing, while an already-cached image (the background) rendered fine.

**Fix:** added `preloadImages(urls)` (decode + cache all given dataURLs, awaitable) and
`ensureExportImages()` (gathers element image + slide-background dataURLs). Every async raster
export (PNG/JPG/PDF/PPTX/copy) now `await`s it first, and the export dialog awaits it before the
sync `exportPageToPng` too. Verified: an image placed on top of another now appears in the export.

## Text selection box stays tiny after enlarging the font (2026-07-14)

**Symptom (user-reported, with screenshot):** added a text element, cranked the font size up, and
the glyphs render huge but the **selection/hit box stays tiny** (e.g. `73.7 × 54.1`) in the corner —
"I have to select on the corner, otherwise it's difficult to select" and resize is broken.

**Cause (`store/app-store.ts updateElement`):** a text/richtext element's `width`/`height` were only
re-fitted to the glyphs when the *text was edited* (`commitText` in `text-editing-handler.ts`).
Changing `fontSize`/`fontFamily`/`letterSpacing` from the property panel or quick toolbar updated the
font but never re-measured the box, so the hit rect kept the *old* font's size while the text drew at
the new (much larger) size.

**Fix:** `updateElement` now re-fits the box whenever a font-metric key
(`fontSize`/`fontFamily`/`letterSpacing`/`fontWeight`/`fontStyle`) changes on a `text`/`richtext`
element — mirroring `commitText`'s logic (vertical → `measureVerticalText`; auto-resize → longest-line
width + line-count height; fixed-width → preserve width, re-flow height). Skipped when the caller
already supplies an explicit `width`/`height` in the same patch (e.g. `setElementTransform`), so
handle-resize is untouched. Verified live: a click-placed "Hello" at 40→400px grew from a sliver to
**896 × 480**, matching the rendered glyphs.

## Quick-toolbar flickers while dragging the Font Size slider (2026-07-14)

**Symptom (user-reported):** dragging the Font Size slider on the floating "shapes" toolbar makes the
toolbar flicker.

**Cause (`components/quick-toolbar.tsx`):** a regression from the box-refit fix above — the floating
toolbar anchors its screen position to the element's world `x`/`width`, and now that a font-size drag
live-resizes a text element every input frame, the anchor moved every frame → the toolbar jittered.

**Fix:** freeze the toolbar's **world-space** anchor (`x`/`y`/`width`) for the duration of a slider
drag (captured in `handlePropertyStart`, released on the next `pointerup`/`touchend`/`mouseup`).
Pan/zoom still track (we freeze world coords, not screen); the toolbar settles to its new position
once on release. Verified: across a simulated drag the toolbar `left` held at 155px every frame while
the element width grew to 438px, then moved once to 314px on release.

## Web/custom fonts render as fallback until the next redraw (2026-07-14)

**Symptom:** a just-selected Google/custom font (or a persisted one after reload) can keep showing the
fallback face until some *other* interaction forces a redraw — reads as "the font change didn't apply".

**Cause (`components/canvas.tsx`):** there was an image-load→redraw hook but no equivalent for fonts,
so a `FontFace` resolving after the initial paint left stale text on the canvas.

**Fix:** listen for `document.fonts` `loadingdone` and request a redraw (mirrors the existing image
callback). Text using a font that finishes loading now repaints immediately.

## Magenta spacing/alignment guides sometimes don't clear (even on click-outside) (2026-07-14)

**Symptom (user-reported):** after dragging an element, the magenta equal-spacing badges/guides
occasionally stay on the canvas and won't go away, even when you click on empty space.

**Cause (`utils/tool-handlers/selection-handler.ts selectionOnUp`):** the end-of-pointer cleanup
cleared `snappingGuides` and `pointSnap` but **not `spacingGuides`**. If a drag ended while the
spacing badges were showing (i.e. the drag settled on an equal-spacing match rather than an alignment
line), the spacing signal was never reset — so the badges lingered. Since every pointer-up (including a
click-outside deselect) runs this same cleanup and it never cleared spacing, subsequent clicks didn't
remove them either.

**Fix:** clear `setSpacingGuides([])` alongside `setSnappingGuides([])` in the `selectionOnUp` cleanup.
Verified (Playwright): dragged an element until the magenta guides appeared, released, clicked empty
space — all guides cleared.

## Elements vanish when dragged past the page edge (design/slide docs) (2026-07-14)

**Symptom (user-reported, with video — Instagram Post layout):** dragging an element/image/text toward
an edge (up/down/left/right) makes it **disappear entirely** once it passes a certain point, even
though it's still on screen and still overlapping the page.

**Cause (`utils/canvas-renderer.ts` renderLayersAndElements — "strict slide isolation"):** on paged
doc types (design/slides) an element was only drawn if its **centre point** fell inside the active
slide's rectangle (`cx >= sX && … && cy <= sY + sH`). As soon as the drag pushed the element's centre
past the page edge, the whole element was culled from the render — while its box (and the cursor) were
still over the page. Reproduced (Playwright, 1080×1080 design doc): a 300×200 rect vanished at `y=-120`
(centre at `-20`, just above the page top) while its bottom edge was at screen-y 94.

**Fix:** render an element on the active slide when its **AABB overlaps** the slide (not just its
centre), and **always** render a currently-**selected** element. So an element straddling the edge
stays visible while any part is on the page, and dragging one never makes it disappear mid-move; an
unselected element only hides once it's *fully* off the page (preserving per-page isolation for
adjacent slides). Per-slide **ownership** for save/export still uses the centre test
(`getElementsOnSlide`, `export.ts`) — this change only affects on-canvas visibility. Verified: post-fix
the rect stays visible until `y=-200` (box fully clears the page top); a selected element renders even
fully off-page; an unselected off-page element is correctly hidden.

## Arrow keys nudge the selected element while a property dropdown is focused (2026-07-14)

**Symptom (user-reported):** with the font dropdown open (or any property `<select>` focused) and an
element selected, pressing ↑/↓ moved the element up/down instead of moving through the dropdown's
options.

**Cause (`app.tsx` global keydown):** the "typing in a field" guard only exempted
`INPUT`/`TEXTAREA`/`isContentEditable`. A focused `<SELECT>` fell through to the arrow-nudge branch,
which `preventDefault`ed the event and moved the selection — hijacking the browser's native option
navigation.

**Fix:** added `SELECT` to the guard, so every property dropdown gets its arrow keys back. Verified
(Playwright): focusing a panel select and pressing ↑/↓ leaves the selected element's x/y untouched.

## Font dropdown list spills past the bottom of the screen (2026-07-14)

**Symptom (user-reported, with screenshot):** opening the Font dropdown in the Properties panel with
many user-added Google fonts shows a native option popup that runs off the bottom edge of the screen.

**Cause:** the font row used a native `<select>`, and a native popup is OS-rendered — its geometry
can't be styled or clamped, and the font list grows unbounded as the user adds Google/custom fonts.

**Fix:** new `components/font-picker.tsx` (+ `.css`) — a custom dropdown used only for `fontFamily`:
portal-mounted, viewport-clamped (flips upward when there's more room above; max-height 340px,
scrollable), searchable, ↑↓ + Enter keyboard navigation (events `stopPropagation`ed so canvas hotkeys
can't fire), per-row previews in each font's own family, and the "🔍 Google Fonts… / ＋ Add font…"
actions moved from fake `<option>` entries to real footer buttons. Other property selects stay native.
Verified (Playwright, `tests/font-picker-check.spec.ts`): popup bounding box stays inside the
viewport, arrows move the focus row without nudging the element, Enter applies (Caveat), search
filters, Escape closes without applying.

## Arrows STILL nudged the element after clicking a font row (capture-phase hole) (2026-07-14)

**Symptom (user-reported after the first fix):** arrows over the font list still moved the element.

**Cause:** the global hotkey listener is registered with **`capture: true`** — it runs before any
component handler, so the font picker's `stopPropagation()` could not shield it. The first fix's
tag-based guard (INPUT/TEXTAREA/SELECT) only helped while the search input had focus; after clicking
a font row (or after the popup closes and refocuses the trigger) focus sits on a **BUTTON**, which
fell through to the arrow-nudge branch.

**Fix:** the guard now also exempts focus anywhere inside `.fp-trigger, .fp-popup, .gf-modal,
[role="dialog"]` — any widget that owns its own keyboard interaction. Rule: with a capture-phase
global listener, exemptions must live IN the global guard; component-level stopPropagation is
useless against it. Verified (Playwright, `tests/font-picker-check.spec.ts` 6/6): arrows after
clicking a row, and inside the Google Fonts panel, no longer move the element.

## MP4 recordings unplayable in most players (VP9 in an .mp4) (2026-07-14)

**Symptom (user-reported):** MP4 animation exports "look weird" / don't play right outside the browser.

**Cause (`utils/video-recorder.ts`):** the recorder asked MediaRecorder for bare `'video/mp4'`, and
Chrome picks **VP9** as the codec — a VP9-in-.mp4 file won't decode in most consumers of mp4
(Windows Media Player, QuickTime/macOS preview, WhatsApp, editors). ffprobe confirmed
`codec_name=vp9` inside the mp4 container.

**Fix:** pin the codec — try `'video/mp4;codecs=avc1.42E01E'` (H.264 baseline) first, then
`avc1`, bare mp4, `webm;codecs=h264`. Also raised `videoBitsPerSecond` to 8 Mbps (default ~1-2.5
Mbps smears line art during motion). Verified: ffprobe now reports h264 / Constrained Baseline /
yuv420p.

## "Export MP4" recorded the screen instead of exporting the animated post (2026-07-14)

**Symptom (user-reported, with video):** exporting a post as MP4 started a live screen recording —
output showed the post off-centre with grey workspace and neighbouring content, ran until stopped,
and never matched the post's bounds.

**Cause:** the Export dialog's video path only had live canvas capture (`requestRecording` →
`canvas.captureStream`), which records the viewport — it was never a document export.

**Fix:** new `exportPageVideo()` (`utils/recording-manager.ts`) — an OFFLINE page-scoped export:
renders the active page to a hidden canvas at the page's own resolution (long side capped 1920)
for N seconds using the same animation clocks as the live canvas (`calculateAllAnimatedStates`
with shouldAnimate=true + composition overrides + the self-clocked stickRig renderer; a
`pageVideoExporting` signal keeps the engine ticker alive), then downloads
`yappy-animation-*.mp4`. Export dialog gains a Duration field and routes MP4/WebM to it on paged
docs (infinite canvas keeps live capture); API: `Yappy.exportVideo(seconds?, format?)`. Verified
(Playwright, `tests/page-video-export-check.spec.ts`): with the viewport deliberately zoomed to
35%, the download is h264 at exactly the page's 1600×1000 with animations mid-pose and no
workspace chrome.

## Exported HTML player: infinite-canvas content could open off-screen (2026-07-14)

**Symptom:** exporting an infinite-canvas document to standalone HTML opened the player at pan
(0,0), scale 1 — whatever the content's world position, it showed cropped or not at all (verified:
content drawn at x≈1400+ appeared half-cut in a 1280-wide window).

**Cause (`components/player-app.tsx`):** the player only positions the viewport for paged docs
(slide-0 pan); the exported document carries no viewState, so non-paged docs kept the default.

**Fix:** after load, non-paged docs now `zoomToFit()` — the player frames the actual content
bounds. Verified: inked-pixel coverage in the player went from 22k (corner-cropped) to 258k
(framed) for the same document.

## Exported HTML player: no keyboard navigation for presentations (2026-07-14)

**Symptom:** in an exported presentation HTML, arrow keys did nothing — only the on-screen
chevrons advanced slides.

**Cause:** presentation hotkeys live in `app.tsx`'s global handler, which the player never mounts
(it mounts only Canvas + PresentationControls).

**Fix:** `player-app.tsx` binds its own keys — →/↓/Space/PageDown advance (builds, then slide),
←/↑/PageUp retreat, Home/End jump to first/last slide (via `setActiveSlide`, which also pans).
Skipped while a game runs (the game runtime owns the keys) or while typing. REMEMBER: the player
is a prebuilt bundle — `node scripts/embed-player.js` after any player-app change, or exports keep
shipping the old behaviour. Verified via `tests/html-player-check.spec.ts` (both doc types,
file:// load, pixel + navigation asserts).

## v0.8.117 — "Walk this path" did nothing on a plain line

**Symptom.** Draw a Line, select it plus an animated figure, click **Walk this path** —
the button reported success (`attachFigureToPath` returned `true`, the panel switched to
"Stop following path") but the figure never moved. It kept animating in place at its own
`x`/`y`. Exactly the workflow the panel's own hint recommends.

**Cause.** `localPolyline` in `anim/path-follow.ts` built the route from `pathSubpaths`,
`pathAnchors` or `points`. A plain `line`/`arrow` element has **none of those** — it is
defined entirely by `x`/`y`/`width`/`height`. So the polyline came back empty,
`elementPathSample` returned `null`, and the renderer's path branch was skipped silently.
`isPathLike` meanwhile accepts `type === 'line'` outright, so the UI happily offered the
action. Curve/pencil routes (which do carry anchors) worked, which is why the demo
template test never caught it.

**Fix.** Fall back to the element's own box for `line`/`arrow`/`bezier`/`elbow` with no
sampled geometry: the route is corner-to-corner `(0,0) → (width, height)`, with any
`controlPoints` (absolute) folded in as intermediate points. Covered by
`tests/stick-animation-speed.spec.ts` — "a figure attached to a plain line actually
travels it".

**Related.** The path branch also ignored `stickRig.speed` entirely, so the new Speed
control would have appeared dead for a path-walker. It now scales traversal, with
`path.dur` defined as "seconds for one lap **at 1×**".

## v0.8.118 — Comic figures had faces but couldn't be restyled, and cues ignored the face

Three related defects, all from one cause: `buildFigureElements` in
`library/comic/index.ts` was a hand-copied clone of `insertStickFigure`'s body, made
deliberately (a generator must land as ONE undo step, so it can't call `pushToHistory`
per figure). When faces shipped in v0.8.116 the original gained two steps the copy never
got.

1. **Comic figures couldn't be restyled without losing their hair.** The copy never
   called `linkFaceParts`, so heads carried no `sfFace` and marks no `sfHeadId`
   (`getStickFace()` returned `null`). `restyleStickFace` then fell back to
   `{face:'none', hair:'none'}` — so selecting a comic figure and changing only its
   expression silently deleted its hair.
2. **The Face & hair preference was ignored.** The copy never called `applyFaceHair`, so
   comic figures always used the pose default no matter what the panel was set to.
3. **Monochrome comics kept coloured hair.** The copy stripped `accent` fills only, not
   the `hair` role the library path also strips.

**Fix.** Extracted the shared work into `prepareStickFigureElements(assetId, opts)` —
face/hair applied, roles tagged, stroke normalised, monochrome honoured, marks linked,
elements returned UNGROUPED and with no store writes. `insertStickFigure` and the comic
generator now both compose it, so neither can drift again. What stayed in the comic path
is only what is genuinely comic-specific: mirroring, the document render style, and the
panel group.

**Also fixed: an emotion cue set the pose but not the expression.** `Ann (angry):`
selects the `office-stressed` pose, which was authored with a *scared* face — so an angry
line rendered a scared character. `EMOTIONS` now carries a `face` alongside its `pose`
and `faceForEmotion()` feeds it through `planComicPanel` with the same precedence
(inline cue → panel picker → text rules). Poses chosen by the text rules keep their
authored expression, so "lol" still arrives grinning.

Covered by 3 Playwright tests in `tests/stick-face.spec.ts` and 3 unit tests in
`pose-rules.test.ts`.

## v0.8.122 — Crossed-arm sleeves merged into a bow over the chest

**Symptom.** A figure with folded arms (the `service-security` pose) wearing any sleeved
top rendered as a large filled bow across the whole torso instead of a jacket. The
jacket body was invisible underneath it.

**Cause.** Crossed arms are authored as two diagonals running shoulder-to-opposite-side
across the chest. `topPrims` emitted the torso body first and the sleeves after, so two
wide filled sleeve outlines were painted *over* the jacket body and over each other,
covering the chest entirely.

**Fix.** Emit sleeves BEFORE the torso body, so the body draws over them. Only the parts
of the sleeves outside the jacket then show — which is how folded arms actually read.
This is a general ordering fix rather than a per-pose exception, and it also removes the
seam line sleeves previously drew across the shoulder on ordinary poses. Guarded by a
z-order assertion in `garments.test.ts`.

## v0.8.123 — Fills escaped rounded corners on squares and diamonds

**Symptom.** Increasing "corner roundness" on a rectangle/square or diamond left the
outline correctly rounded, but gradient, pattern, image, mesh, dots and hachure fills
kept painting the sharp corners — the fill visibly spilled past the stroke.

**Cause.** Two independent geometry sources. The stroke comes from the shape renderers,
which compute the radius from `borderRadius`/`roundness`. Complex fills are clipped to
`getShapeGeometry()` in `utils/shape-geometry.ts`, which knew nothing about either:
- `rectangle` returned a hard-coded `r: el.roundness ? 10 : 0`, ignoring `borderRadius`
  entirely — so a `borderRadius` of 40 on a 200×200 rect meant an outline radius of 80
  against a clip radius of 0.
- `diamond` returned a 4-point sharp polygon with no rounded variant at all; a `points`
  geometry can't express curves.
- The WASM fast path made diamond structurally unfixable there: the bridge maps on
  element `type` only and never sees the radius.

**Fix.** A shared `cornerRadius(el, fallback)` in `shape-geometry.ts` mirroring the
renderers' `getRadius()`, used by the rect case; the diamond case now emits a
`type: 'path'` built from the same vertex math as `DiamondRenderer.getRoundedDiamondPath`
when the radius is non-zero, and rounded diamonds skip the WASM fast path so they reach
it. All the fill call sites in `render-pipeline.ts` already handled `path` geometry via
`clipPath`/`fillPath`, so no renderer changes were needed.

## v0.8.123 — Template browser showed colour swatches, not previews; Designs cards collapsed

**Symptom.** The "Choose a Template" browser never showed what a template contained.
Diagram cards showed a generic 3-pane icon, design cards a single flat colour/gradient
rectangle, presentation cards a strip of fake grey "text lines". On the Designs tab the
cards were also collapsed to ~11px slivers with the name and description clipped away.

**Cause (previews).** No built-in template sets `metadata.thumbnail`, and the only
store-independent renderer in the repo — `templatePreviewSvg` — was private to
`library/elements/search.ts`, used just by the Elements panel. The browser had three
separate hand-rolled fakes instead. Rendering properly isn't an option: `exportPageToPng`
and friends draw `store.elements` for a live page, so they can't render template JSON
without loading it first.

**Cause (collapsed cards).** `.template-grid` is `flex: 1`, which gives it a definite
height, and `.template-card` sets `overflow: hidden`, which drops each card's automatic
minimum size to 0. Once a category had more rows than fit, the auto rows shrank to fill
the box instead of overflowing into the scroll area. The dsl and presentation card
variants had each independently dodged this with `overflow: visible`/`height: auto`; the
design variant never did, and Designs is the only tab with enough rows to trigger it.

**Fix.** Extracted and extended the renderer into `templates/template-preview.ts`, now
handling all three data shapes (design `pages`, presentation `slides`, diagram
`data.elements` — bbox-framed, since diagrams have no page), plus lines/arrows,
diamonds, triangles, outline-only nodes and in-node label bars. The browser uses it for
diagram, design and presentation cards; `search.ts` now imports it instead of owning a
copy. Grid rows are pinned with `grid-auto-rows: min-content` so no card variant can
collapse again. DSL and user-template cards are unchanged (source text and a real
captured PNG respectively).

## v0.8.124 — My Templates saved from a drawing never got a thumbnail

**Symptom.** Templates saved via "Save Current as Template" showed the generic
placeholder icon in the browser rather than a preview — permanently, for the most
common case.

**Cause.** `saveCurrentAsTemplate` captures its thumbnail with `exportPageToPng`, which
needs a page, so the capture was gated behind `isPagedDocType(store.docType)` with no
`else`. The DEFAULT doc type isn't paged, so a template saved from an ordinary drawing
stored `thumbnail: undefined` and the card fell through to the placeholder.

**Fix.** Fall back to the simplified-marks preview (`templatePreviewDataUrl`, an SVG
data URL) when the real render isn't available, so every doc type gets a thumbnail.
`templatePreviewSvg` gained an optional pixel size for this — a percentage-sized SVG has
no intrinsic dimensions and won't scale as an `<img src>`. The browser also draws the
same preview from `doc.elements` at display time, so templates already saved without a
thumbnail get one too rather than needing a re-save.

## v0.8.162 — The colour-palette and theme buttons were invisible

**Symptom.** The palette picker and the theme toggle at the top-right of the screen could
not be seen or clicked. The logo/menu pill next to them was fine.

**Cause.** Making the header a real docked region gave `.shell-topbar` an opaque
background at `z-index: 10050`. The clusters that sit in that band were separate
`position: fixed` overlays at `z-index: 10000`, i.e. *below* it, so the bar painted over
them. The logo pill escaped only by accident — `.menu-container` happens to be 10060.

**Fix.** The clusters are real flex children of the bar now rather than overlays that
happen to land on it, which removes the class of bug entirely. Everything remaining in
that band is 10060, and `index.css` states that contract next to `.shell-topbar` so the
next control added there doesn't repeat it.

## v0.8.162 — Three onboarding-tour steps had stopped highlighting anything

**Symptom.** During the tour, the Properties, "Settings & Help" and final steps showed a
centred card with no spotlight on any part of the UI.

**Cause.** `onboarding-tour.tsx` resolves each step with
`document.querySelector(step.target)` and, on a miss, deliberately degrades to a centred
card. So a renamed or deleted element breaks a step **silently** — no throw, no warning,
and nothing a typecheck or build can catch. `.property-panel-container` disappeared when
Properties moved onto the dock; `.floating-tools-cluster` and `.help-btn` disappeared
when the corner buttons moved into the top bar.

**Fix.** Repointed all three at elements that exist (`.topbar-properties-btn`,
`.topbar-view-controls`, `.help-btn` on the new Help button), and the Properties step now
spotlights the *button* rather than the panel — a dock panel is only in the DOM while it
is open, so targeting the panel would no-op depending on what the user did earlier in the
tour. The classes are commented as load-bearing at the definition site, since they
otherwise look like ordinary styling hooks.

## v0.8.163 (tests) — Twenty specs were testing a different server than the one under test

**Symptom.** `productivity-features` layer-context-menu tests failed with a right-click that
resolved its target and then timed out; `comprehensive-features` could not find the Font
control. Both reproduced identically against older commits, so they looked like long-standing
breakage unrelated to any current work.

**Cause.** Twenty specs called `page.goto('http://localhost:5173')` **literally**, ignoring
`YAPPY_URL`. Anything already listening on 5173 — a stale dev server, another project — is what
they actually tested. Worse, `playwright.config.ts` pre-seeds the `yappy:tour:seen` flag via
`storageState`, and that seeding is scoped to the `YAPPY_URL` **origin**; navigating to a
different origin therefore skipped it, so the first-visit onboarding tour ran and its overlay
intercepted every click. Two independent failures from one hardcoded string.

**Fix.** All twenty now `page.goto(URL)` with the usual
`const URL = process.env.YAPPY_URL || 'http://localhost:5173'`, so they honour the env var and
share the config's origin (and therefore its tour seeding). Behaviour is identical when
`YAPPY_URL` is unset.

**Worth knowing.** Pointing them at the right server revealed six genuinely failing tests that
had been passing against the stale app — false green, the worst kind. One was a stale API name
(`alignSelectedElements('centerHorizontal')`; `AlignmentType` only has
`left|center|right|top|middle|bottom`, so `calculateAlignment` returned no updates and the test
compared two unchanged coordinates). The other five are tracked below.

## v0.8.163 (tests) — The Font control test could never have matched

**Symptom.** `comprehensive-features` → "should change font family for text" timed out waiting
for `.control-row:has-text("Font") select`.

**Cause.** Two things, either sufficient. The test never opened the Properties panel — it only
selected a text element, and the panel does not open on selection by design. And the Font
control stopped being a `<select>` when the searchable font picker
(`components/font-picker.tsx`, `.fp-trigger` / `.fp-popup` / `.fp-item`) shipped, so the
selector could not match even with the panel open.

**Fix.** Open the panel, then drive the real picker. Pick by label rather than by position:
filtering on "mono" matches JetBrains Mono (value `code`) before Source Code Pro (value
`monospace`), which is how the first attempt at this fix went green on the wrong font.

## OPEN — snapping/spacing drag specs assume screen coordinates are world coordinates

**Symptom.** Four tests in `snapping.spec.ts` and one in `spacing-guides.spec.ts` fail. They
were previously "passing" only because they ran against a stale server (see above).

**Diagnosis so far.** Two confirmed test-side defects: (1) they drag with
`page.mouse.move(350, 350)` treating screen space as world space, but the docked shell puts the
canvas origin at (46, 52), so every drag lands ~46/52px off; (2) they never activate the
Selection tool, and the default tool is Ink Brush, so the drag *draws a stroke* instead of
moving the element. Correcting both makes the element move (300 → 204) but it still does **not**
snap to the expected 200 despite being within the 5px threshold — so there may be a third,
genuine problem in object snapping. Not yet root-caused.

## FIXED — boot-resilience corrupt-preference spec went stale with the dock migration

**Symptom.** `boot-resilience.spec.ts` → "a corrupt preference key is discarded rather than
re-read every boot" failed on `feat/recursive-symbols`. Confirmed pre-existing by A/B (fails
identically with the branch's `index.html` change stashed).

**Cause.** Test-side only — the discard mechanism (`utils/safe-storage.ts` `readJson`, which
`removeItem`s a value that won't parse) still works. The spec created and selected a rectangle
and assumed that mounts the Properties panel, which was true before 0.8.162; Properties is now a
dock panel and selection does **not** open it, so `PropertyPanel`'s body — where
`readJsonArray('collapsed-prop-groups')` runs — never executed and the corrupt key was never
read, let alone dropped.

**Fix.** Call `Y.togglePropertyPanel(true)` in the spec, and replace the 800ms fixed wait with
`waitForSelector('.property-panel')` — the reader runs in the component body, so "mounted" is
precisely the condition the assertion depends on. Verified in-browser that the warning
(`[safe-storage] discarding corrupt value for "collapsed-prop-groups"`) fires and the key ends up
`null`.

**Watch out for.** These boot-sensitive specs fail as `waitForFunction(() => window.Yappy)`
timeouts for reasons that have nothing to do with the code under test:
- the **first load after editing `frontend/index.html`** (vite re-optimizes deps, blowing the 30s
  budget) — passes on a warm server;
- a **long-lived dev server**, especially with multiple workers. During one session
  `toolbar-dock` "docking top/bottom" and 5 `toolbar-grid-align` specs failed together, passed
  individually, then all 22 passed on a freshly restarted server with `--workers=1`.

So before investigating a boot timeout: restart vite, run the file alone, and only then suspect
the change. A/B-ing against a stash is also unreliable here unless both runs are equally warm —
a stashed run that passes may just be the warmer one.

## FIXED — the toolbar's orientation button did nothing

**Symptom.** The circular-arrow button at the top of the tool column flipped
`globalSettings.toolbarVertical` and produced no visible change.

**Cause.** `toolbarVertical` is only read while the bar is FLOATING — the `vertical` class and
the drag `transform` are both gated on `docked() === 'float'`. Since v0.8.162 `toolbarDock`
defaults to `'left'`, and *nothing in the UI or the public API could change it* (no Settings
entry, no command, no `updateGlobalSettings` on `window.Yappy`). So the click wrote a
localStorage key and stopped there. The tooltip also read "Vertical toolbar" while the toolbar
was already vertical. Verified in-browser: class and bounding box byte-identical before/after
the click (`toolbar-container docked dock-left`, `0,52 47×720`).

**Fix.** The button now cycles the dock edge — left → top → right → bottom → floating — which is
also the only UI that reaches `toolbarDock`. Its icon mirrors the current edge (`PanelLeft` /
`PanelTop` / `PanelRight` / `PanelBottom` / `Move`) so it reads as state, and the tooltip names
the next position. All four edges were already supported by `toolbar.css` and by
`dockInsets()`; verified each one reserves its edge and the button stays clickable where it lands.

**Also fixed on the way.** Making `float` reachable exposed that the floating bar anchors at
`top: 12px`, which predates `.shell-topbar` (52px tall, z-index 10050 vs the bar's 10002) — so it
was painted over by the header and the header's buttons ate its clicks. Now
`top: calc(12px + var(--dock-top, 0px))`, scoped to `:not(.docked)`; `--dock-top` rather than
`--topbar-h` because it is 0 in Zen/Presentation where there is no header to clear.

## FIXED — symmetry/fill buttons became invisible on hover

**Symptom.** Hovering an active symmetry mode button (or Fill) in the tool options bar made its
glyph disappear.

**Cause.** CSS specificity. `.tool-options-bar button:hover:not(:disabled)` is (0,3,1) and
outranks `.tool-options-bar button.is-on` at (0,2,1), so hover replaced the solid indigo fill
with the 10% hover tint — while `.is-on`'s `color: #fff` survived, because the hover rule set no
colour. Measured: white on `#eff0fe` = **1.13:1**. Three other states were also under AA:
inactive+hover 3.95, and both resting states 4.47 (a hair under 4.5).

**Fix.** An explicit `.is-on:hover` rule that keeps a solid (deeper) fill, a darkened label on
the inactive hover tint, indigo-600 instead of indigo-500 for the base, and dark-theme mirrors
of all of it. All 12 state×theme combinations now measure ≥ 4.5:1. Guarded by
`tests/tool-options-bar-contrast.spec.ts`, which composites translucent backgrounds down the
ancestor chain (reading `backgroundColor` alone reports a transparent colour and proves nothing)
and reports every offending state at once.

**Watch out for.** The dark-theme rule ties `button.is-on` on specificity and wins on source
order, so it needs `:not(.is-on)` — without it the same bug reappears from the other side
(indigo-300 label on the indigo fill, 2.24:1). Fixing one state here really does break another.

## FIXED — fill mode only appeared after you let go of the stroke

**Symptom.** With Fill mode on (especially noticeable with symmetry on), a freehand stroke drew
as a line and snapped to a filled silhouette on release — and every mirrored copy snapped at the
same instant, so the mark being composed was never the mark you got.

**Cause.** `fillSilhouette` was stamped on in `endDrawing`, after the gesture finished.

**Fix.** It is set when the stroke element is created in `startDrawing`. The live symmetry copies
inherit it for free, since `symmetryInstance` spreads the source element on every sync — which
finally makes good on `syncLiveSymmetry`'s promise that "what you see mid-stroke is exactly what
you get on release". The `endDrawing` block stays as a fallback for freehand elements created by
other paths and to re-derive the fill if the stroke colour changed mid-gesture.

## FIXED — the symmetry axis guide was drawn 46px/52px off the line strokes mirrored about

**Symptom.** "Symmetry is not happening as per the axis sometimes." Strokes mirrored about a
vertical line noticeably to the right of the dashed purple guide, and the error looked
inconsistent across marks (it isn't — it is a constant screen offset, which reads as variable
when you compare shapes at different distances from the axis).

**Cause.** `utils/viewport-transforms` returns **canvas-local** screen px — `clientX` minus the
canvas bounding-rect origin, as its header states. `symmetry-overlay.tsx` painted those
coordinates onto a `position: fixed; inset: 0` **window** layer using its own inlined copy of the
transform. Those two frames were identical until the shell docked the toolbar and the top bar;
since v0.8.162 the canvas starts at `(--dock-left, --dock-top)` = (46, 52) by default. So the
guide was drawn 46px left and 52px above the real axis. **The reflection was correct throughout**
— `reflectClone` works in world space against `store.symmetry.cx/cy`; only the guide lied.

Measured before the fix, at world (400,300), scale 1, pan 0: canvas rect origin (46,52), guide
expected at window x=446, drawn at x=400 → `dx=-46`. Identical `-46/-52` at every zoom and pan,
confirming a frame offset rather than a scale error.

**Second half of the same bug.** The centre-drag handler fed raw `e.clientX/clientY` into a
canvas-local inverse, so dragging the axis dropped it 46/52px away from the pointer. And the
handle itself was 2px off its own axis: `left: cx - 9` with `width: 18px` plus a 2px border and
no `box-sizing`, giving a 22px box whose centre is `cx + 2`.

**Fix.** The overlay now offsets by the live canvas rect and goes through the shared
`worldToScreen`/`screenToWorld` with the same viewport transform the canvas renders with — so it
is rotation-correct too, which the inlined math never was. Guide-vs-reflection error is now
0.00px across vertical/horizontal/quad/radial at 0.6×–1.75× and panned. Handle gets
`box-sizing: border-box`.

**Trap worth knowing.** The first version of the fix used `createMemo` for the canvas rect. The
overlay mounts before the canvas is laid out, so the memo cached the `{0,0}` fallback and — since
neither the symmetry state nor the viewport is one of its dependencies — never recomputed,
reproducing the original `-46/-52` *exactly*. An unchanged error after a fix is evidence the fix
isn't running, not that the diagnosis was wrong. It is now a plain function that reads
`layoutTick()`/`dockInsets()` for subscription and the rect live.

**Same bug was present in two more overlays** — both now fixed, see the next entry.

## FIXED — artboard frames and rulers/guides were offset from the canvas too

**Symptom.** Same family as the symmetry axis: artboard name chips, frames and resize handles,
plus ruler ticks, labels and guide lines, all drew 46px left and 52px above the geometry they
annotate. Measured before the fix: an artboard at world (500,300) drew its chip at window x=500
where the canvas mapping puts it at 546; `artboard chip off by -52px` vertically.

**Cause.** Identical to the symmetry overlay — `position: fixed; inset: 0` layers painting
CANVAS-LOCAL coordinates produced by their own inlined `world * scale + pan`. Three overlays had
each grown a private copy of that maths (artboard-overlay's comment even said "matching
SymmetryOverlay"), so one shell change broke all three at once. `ruler-overlay.tsx` had the stale
assumption written down in a comment: *"The drawing canvas fills the viewport (origin 0,0), so
screen px ≈ clientX/Y"* — true when written, false since v0.8.162.

**Fix.** New `utils/overlay-transform.ts` owns world↔window for fixed overlays: `canvasOrigin()`,
`canvasSize()`, `worldToWindow`/`windowToWorld` (rotation-aware) and axis-aligned variants for
overlays that deliberately ignore view rotation. All three overlays now use it, so there is one
implementation to keep right. Rulers additionally moved from window (0,0) to the canvas origin and
now span the canvas rather than the window — a ruler whose zero is under the toolbar is not
measuring the canvas. Verified 0px error for all four (symmetry axes, artboard chip, ruler strip,
guide line) in BOTH left- and right-docked layouts, which have different canvas origins ((46,52)
vs (0,52)) so a fix that hardcoded 46/52 fails the spec.

**Also fixed: the vertical ruler was shaped wrong (pre-existing).** `drawRuler` set
`style.width = lengthCss; style.height = RULER_SIZE` for *both* strips, so the left ruler was laid
out as a long horizontal bar — it painted its 22×N content into an N×22 bitmap and everything past
the first 22px was clipped. Measured: the "vertical" strip's rect was 720×22 at (0,0). The box is
now oriented along with the drawing.

**Trap, round two.** The shared helper reads the canvas rect live (no `createMemo` — see the
previous entry), but that was still not enough: overlays mount *before* the canvas exists, so the
first read returns the {0,0} fallback, and anything that positions itself in that pass (the ruler
strips and corner box) stays pinned to the window origin forever, because neither the resize tick
nor `dockInsets()` changes when the canvas merely *appears*. The symmetry axis hid this by
accident — its position accessors re-run whenever the symmetry state changes. The helper now
attaches a `ResizeObserver` to the canvas as soon as it can see one and bumps its tick on the next
frame (deferred, never synchronously — these readers run during render, and updating a signal they
depend on inside that render is a loop). Verified no loop: 61 rAF ticks/s and 0 ruler style
mutations per second after settling.

## parseJsonDSL dropped unknown top-level fields

`parseJsonDSL` builds the IR as an explicit object literal, so any field added to `DSLDiagram` after
it was written never reached the engine. TypeScript did not catch it because the new fields are
optional, so the hand-built object still satisfied the interface. Found while adding `palette`, which
appeared to do nothing at all.

Fixed by copying `palette` through. `sequence` is still not copied; that is currently harmless
because sequence timelines reach the IR through adapters rather than raw JSON, but it is the same
latent bug and will bite whoever first writes a sequence diagram as JSON.


## Shape Builder showed the wrong mode until you were already dragging

The overlay read `e.altKey` inside its `pointermove` handler, which early-returned unless a drag
was in progress. So holding <kbd>Alt</kbd> while deciding where to start the stroke changed
nothing on screen: the hint bar still said *merge*, and the mode only became visible after the
press, when it was too late to change your mind. There was also no cursor-adjacent indicator at
all — the only feedback was the colour of the region highlight, which appears once the stroke has
already touched something.

Fixed by tracking the pointer position and the modifier independently of the drag: `pointermove`
now updates both whenever the tool is active, and `keydown`/`keyup` listeners flip the mode with
the pointer standing still. A `+`/`−` badge follows the cursor, colour-matched to the highlight
and the drag stroke. `blur` resets the modifier, because Alt+drag is a window-manager gesture on
several Linux desktops and the `keyup` never reaches the page — without that reset the tool stays
stuck in delete mode after the WM swallows the release.

## A second segmented control broke the perspective-grid spec's selector

`tests/perspective-grid.spec.ts` asserted on `.pg-seg button.pg-on`, which was unique until the
hint bar grew a *Draw on* plane picker alongside the config popover's *Mode* picker. Playwright
then failed with a strict-mode violation naming both. Fixed in the markup rather than the test —
each segmented control now carries its own modifier class (`pg-seg-mode`, `pg-seg-plane`) — since
the alternative (`.first()`/`.nth()`) would have pinned the test to sibling order.

## Selected shape showed handles that grabbed nothing (Animation mode, mid-tween)

Reported as "the blue selection outline appears, confirming the shape is selected, but I can't
change its size — the resize handles don't respond". Inside a motion-tween span the two halves of
the interaction disagreed about where the shape was. The renderer draws the shape *and its
handles* from the tweened pose — `canvas-renderer` merges `evaluateTimelineAt`'s override map into
`renderedEl`, and `selection-renderer` reads the handle box straight off that. But every hit test
took the raw store: `getHandleAtPosition` has no idea the frame timeline exists, and
`selection-handler`'s element pick used `calculateAllAnimatedStates`, which is the *seconds*-based
composition spine and is gated on presentation/preview anyway. So on any frame strictly inside a
span, the handles were painted at the interpolated pose while their hit boxes stayed at the owning
keyframe's pose. On a keyframe the two coincide, which is why it read as intermittent.

Fixed by giving hit-testing the same geometry the renderer uses: `poseElementsAtFrame` bakes the
frame's overrides into the element list (returning the input array untouched when nothing is
overridden, so the non-animation path allocates nothing per pointer event), and `animPosedElements()`
is now what every `getHandleAtPosition` caller and the element pick receive.

That alone would have made the handles grabbable but not usable — the elements under the pointer
belong to the span's LEFT keyframe, so the drag would have edited that cel and the tween would have
re-interpolated the shape out from under the cursor. `splitTweenAtPlayhead` therefore runs on
pointer-down on a transform handle: it splits the span at the playhead and writes the on-screen pose
onto the new cel, so the drag is WYSIWYG and the span's original keyframes are untouched. Gated to
transform handles so a plain click-to-select never mutates the timeline, and to *motion* spans — a
shape tween's override is a morphed outline in centre-relative coords with no faithful cel form.

Same root cause as the second half of the report ("changing width and height, the changes are not
accurately visible"): on a tweened frame the properties panel showed the keyframe's width while the
canvas drew the lerp between two cels, so the number and the pixels genuinely disagreed.

## Resizing was a blind gesture — no size feedback until you let go

Nothing on the canvas reported dimensions while a bbox handle was being dragged; you had to finish
the drag and look at the Properties panel. Added `renderSizeReadout` — a live W × H chip that rides
the bottom edge of the box being dragged, honours the document's measurement unit, follows the
element's rotation, and sits clear (44px) of the quick-connect port at 32px.

## "Make the panels resizable" — they already were, invisibly

The dock zones (Layers, Properties, and every other registered panel) have been width-resizable and
persisted to localStorage since the dockable-panel work, and the animation timeline has been
height-resizable for as long. Both handles were fully transparent strips — 6px and 8px — with no
resting affordance, so the only way to discover either was to hover the exact pixel by accident.
Added a resting grip (a small rounded bar, brightening and lengthening on hover) to
`.dock-zone-resize` and `.atl-resize`. No behaviour change; the feature was never missing.

## Moving a shape mid-tween made it crawl after the cursor

Same family as the resize bug above, found while fixing it. A body drag inside a motion span
edited the span's LEFT keyframe, so the tween immediately re-interpolated and the shape moved by
only `delta × (1−p)` of the drag — it lagged the pointer by an amount that grew as the playhead
approached the span's start. `splitTweenAtPlayhead` now runs for move drags too, but deferred to
the existing 3px drag threshold rather than firing on pointer-down: a press on a shape body is
also just "select it", and that must never mutate the timeline. Past the threshold it is
unambiguously a drag, so the split is safe. The new cel holds the pose that was already on screen,
so re-snapshotting the move set against it while KEEPING the original press point gives exact 1:1
tracking with no jump and no dead zone.

## Clicking a tweened shape's body deselected it

Pre-existing, and the first version of the hit-test fix above did not cure it. `selectionOnDown`
composed two pose sources in the wrong order: it merged the frame-tween pose into the element and
then applied the seconds-based orbit/spin state on top. That spine
(`calculateAllAnimatedStates`) returns an entry for **every** element — reporting its STATIC store
x/y when nothing is actually orbiting or spinning — so the last write always reverted the shape to
its keyframe position, and the click landed on empty canvas. The renderer composes the other way
(`canvas.tsx` `Object.assign`s the frame overrides OVER the composition state); the hit test now
matches, layering orbit/spin first and the frame override last. This is why `animFrameOverrides()`
exists alongside `animPosedElements()` — a caller that composes with another pose source needs the
raw override, not a pre-merged element.

## Timeline caches went stale when the playhead did not move

`structuralEval` (frame visibility) and the pose memo keyed themselves on `store.animTimeline`'s
object identity. That is not a valid key: Solid's `setStore` MERGES an object into the existing
proxy rather than replacing it, so the reference survives a structural edit. The caches only ever
looked correct because the frame — the other half of the key — normally changes at the same time.
Splitting a tween span mid-drag is the first operation that edits the timeline while the playhead
stays put, and it exposed the bug: `canInteractWithElement` kept reporting the *previous* cel's
visibility, so the newly created keyframe's element was judged "not on this frame" and the drag
silently refused to move it. All 18 writes to `store.animTimeline` now go through
`setAnimTimeline()` in app-store, which bumps a revision counter the caches key on. Undo/redo and
scene switching were among the writes that had been bypassing invalidation.

## The Keyframes dope sheet's left column was visible but unclickable

Pre-existing, found while re-running the suite. `.keyframe-panel` was pinned to the window
with `left: 0; right: 0`, so with the toolbar docked left (the default) the property-name
gutter ran underneath it — the Position X stopwatch and its neighbours rendered fine and the
docked toolbar won every click. The animation timeline had already hit and fixed exactly this
(`.atl-panel` carries a comment describing the same symptom); the dope sheet was simply never
given the same treatment. Now offset by `--toolbar-left/right` and `--toolbar-bottom`, not
`--dock-left/right` — those include docked panel widths, and like the timeline this is
stage-width chrome that should still run beneath a docked Properties/Layers panel.

## Two E2E specs had no cold-boot headroom

`history-panel` and `alt-shift-center-resize` are short files whose first (or only) test pays
the cold vite dev-server transform. Both sat at ~24s against the default 30s budget, so they
passed alone and failed under two-worker contention — the kind of failure that costs a
diagnostic cycle every time because it looks like a real regression. Both now call
`test.setTimeout(90_000)`, the same headroom `animation-timeline.spec.ts` already used.
`history-panel` additionally waited on `.history-panel`, which has not existed in the DOM since
the panel moved into the dock system (the component renders `.history-panel-body`; the class
survives in CSS only).

## Help docs errored, and the "Reload" button genuinely did nothing

Reported as "sometimes help documents show a bug/error and ask to reload, but the reload does not
work — I have to go back completely and reopen the document". Both halves of that sentence were
literally true, and the second half was the diagnosis hiding in plain sight.

Help doc pages are `lazy()` chunks that `vite.config.ts` deliberately *excludes* from the
service-worker precache (the `-doc-` entry in `LAZY_HEAVY`), so each one is fetched the first time
it is opened. If the server has been redeployed since the tab loaded, that content-hashed URL is
gone and the import rejects.

The recovery was `location.reload()`, which cannot work here. Yappy registers a `prompt`-strategy
service worker: a newly deployed SW installs and then **waits**, and a waiting SW only activates
once every client is gone. A reload does not destroy the client — so the old worker kept serving
the old `index.html` and the old entry chunk, the missing chunk stayed missing, and the button
looked broken. Closing the tab *does* release the client, which is exactly why "go back completely
and reopen" was the only thing that worked.

Every reload path on an error screen now goes through `forceReloadLatest()` → `hardRefresh()`,
which unregisters the service workers, clears Cache Storage and navigates to a cache-busted URL.
That covers `recoverFromStaleBuild`'s automatic recovery, the route-level error screen, the
boot-failure screen, and the new per-doc one.

Two smaller faults fixed alongside:

* A failed doc took down the **whole Help page**, nav included, because the only boundary was the
  route-level one in `index.tsx`. There is now an `ErrorBoundary` around the content pane
  (`DocError`), keyed on the doc id — Solid's `ErrorBoundary` latches its error, so without the key
  one broken doc would keep showing its error screen for every doc clicked afterwards.
* The `yappy-lazy-chunks` runtime cache accepted `statuses: [0, 200]`. These are same-origin
  assets, so a legitimate response is always a real 200; a status-0 response stored in a
  **CacheFirst** cache with a 30-day life poisons that URL for a month. Tightened to `[200]`.

## The colour eyedropper returned the wrong colour on gradients

Reported as "the Colour Picker still does not capture the exact colour and often produces a
slightly dull/different shade". The v0.8.191 fix (read the authored colour instead of sampling the
composited screen) was correct and is intact — flat fills pick bit-exact, verified including the
sketch-hachure case where a naive pixel sample returns the white gap between hatch strokes.

Gradients were the gap. `elementPickColor` returned the *first stop* for the whole shape, so
clicking anywhere on a red→blue gradient handed back red. Measured before the fix: clicking at 10 /
50 / 90% across the shape returned `#ef4444` every time while the screen showed `#c25370`,
`#94639d`, `#6772ca`. Between two shades of one hue that is precisely "a slightly different, duller
shade".

A gradient has a different colour at every point, so the pixel under the cursor *is* the answer.
`elementPickColor` now takes an optional `renderedHex` and prefers it for gradient fills and
gradient strokes; the first stop remains the fallback for callers with no click point (the
scripting API's `getElementPickColor`). Covered by `tests/color-eyedropper.spec.ts`, which asserts
the pick equals the on-screen pixel at three points across a gradient *and* that flat fills still
report the authored colour rather than the drawn pixel.

Also fixed while in there: `commitRecent()` in `color-picker-pro.tsx` read the `h/s/v` signals
immediately after `onChange`, before the syncing `createEffect` had run — so the eyedroppers
recorded the *previously* selected colour in the recents strip. It now takes the picked hex
explicitly.

## A finished help document nobody could open

`shapes/bpmn-doc.tsx` — 577 lines covering all 15 BPMN 2.0 shapes, events, gateways, task
markers and pool lanes, and kept current through the two-audience docs pass — was never added to
the `shapeDocuments` registry in `help-page.tsx`. Nothing linked to it, no route reached it, and
it did not appear in the Help sidebar. It compiled, it passed tests, and it was maintained: the
only symptom was its absence.

It surfaced during the JSX → Markdown conversion, which walked the *directory* and found one more
document than the registry had entries. It is now document 31, listed under Diagrams and
published at `/help/bpmn/`.

The general shape of this: when a registry and a folder can disagree, one of them will eventually
hold something the other does not. The locale drift guard (`locale-registry.test.ts`) exists for
exactly this failure one level up.

## Five tables, three code blocks and eleven notes were rendering unstyled

The help documents had accumulated class-name variants that `help-page.css` has no rules for:
`doc-table` (5 uses), `doc-code` (3), `doc-content` (2), `doc-note` (11) and `doc-title` /
`doc-description`. A `<table class="doc-table">` is a bare browser table sitting next to
`api-table`s with header shading, padding and hover rows; `<p class="doc-note">` was a plain
paragraph where the author had asked for a note box.

Nobody noticed because each document was written and reviewed on its own, and a table that looks
plain looks *deliberate*. Converting every document to Markdown removed the possibility: the
renderer emits one skeleton, so every table is an `api-table`, every fence a `code-block` and
every `:::note` a note box.

## Two `<h1>`s on every help page, twelve on the learn article

The help page chrome rendered `<h1 class="help-title">Yappy Documentation</h1>` alongside each
document's own `<h1>`. Harmless while the page was behind a hash route that no crawler could
reach; a heading hierarchy problem the moment those pages became indexable URLs. The chrome title
is a `div` now — the document supplies the page's one `h1`.

`articles/learn-to-draw/learn-to-draw-diagrams.md` was worse: it used `#` for all twelve of its
section headings. They are `##` now, with the subtitle as a lead paragraph.

## Sketch corners did not meet — "is it supposed to be this way at the ends?"

Reported with a screen recording: a parallelogram in Sketch style, zoomed in, with a visible step
at every corner — one edge overshooting past the vertex, the next starting short of it, and a
square nib of background showing through on the outside of the turn.

Two causes, stacked.

**RoughJS jitters the endpoints of every segment.** `buildRenderOptions` set `roughness`, `seed`
and `disableMultiStroke`, but never `preserveVertices`, so adjacent edges stopped sharing a
vertex. Measured on the reported shape (130 × 102 parallelogram, seed 1), distance from the true
corner to the nearest point actually drawn:

| Sloppiness | corner error | with `preserveVertices` |
| --- | --- | --- |
| 0.5 | 0.43 px | 0.00 px |
| 1 | 0.85 px | 0.00 px |
| 2 | 1.71 px | 0.00 px |

Sub-pixel in world units, which is why it had never been reported before — but the sketch
geometry is generated in WORLD space and then scaled by the view transform, so at the ~5× zoom in
the recording it was ~4 px against a ~20 px stroke. `preserveVertices` pins both ends of every
edge to the real vertex while leaving the wobble in the middle, which is where the hand-drawn
character actually lives.

**Butt caps on independently stroked edges.** RoughJS strokes each edge as its own line, and the
canvas default is `lineCap: butt` with no join, so even with both ends in the same place two
thick edges meeting at an angle leave a wedge of background on the outside of the corner. The
sketch pass now draws with round caps and joins.

Fixed for every sketch shape at once, since all of them route through `buildRenderOptions` and the
`renderSketch` dispatch. `frontend/src/shapes/base/sketch-corners.test.ts` asserts the geometry
rather than the flag — it builds the real render options, generates the drawable, and measures the
distance from each declared vertex to the nearest drawn point. It fails at 0.43 px without the fix.

## Sloppiness started at 1 on a drawing style where it does nothing

The default `roughness` was 1 in three places while the default `renderStyle` was
`architectural`, where the value has no effect at all. So the panel showed a Sloppiness of 1 on
shapes that render perfectly clean — and the moment anyone chose the Sketch style, that 1 chose
for them. It is 0 now: picking Sketch gives you a clean line to start from, and the slider is
where the wobble comes from.

Existing drawings are untouched — every saved element carries its own `roughness`, and the
migration default for elements that predate the field stays at 1, so old art keeps the look it
was drawn with.

## Three shapes drew the wrong thing

Reported together, with screenshots.

**Cloud, dragged wide.** Every arc radius came from the width alone (`w * 0.2`, `w * 0.25`,
`w * 0.3`), so a cloud dragged into a short, wide box demanded arcs far larger than the height
could hold. SVG clamps a radius it cannot honour, and the outline collapsed into a spiked bowtie
— nothing like a cloud. The outline is now built from scallops whose radius comes from the CHORD
between neighbouring bumps, and the bumps sit on an ellipse derived from both axes, so the shape
follows whatever box is dragged. A test asserts every radius is at least half its own chord —
the condition whose violation caused the clamping — across six aspect ratios from 900 × 90 to
80 × 400.

**Checkmark rendered as a triangle.** The geometry is the right three points — left, elbow,
tip — but it was returned as a closed shape, so the renderer joined the tip back to the left end
and drew the third side. It is marked `isClosed: false` now, which both render paths already
understood (`renderGeometry` skips `closePath`, and the sketch path uses `rc.linearPath` rather
than `rc.polygon`). Worth noting: the WASM implementation had this right all along — its
`OPEN_SHAPES` set includes the checkmark — so the JS fallback, which is the default path, was the
only one drawing a triangle.

**Heart had a spike through the notch.** The path started 30% down the centre line, drew the left
lobe, and then drew the left lobe a SECOND time at the end. `Z` therefore closed from the notch
back down to that start point, drawing a vertical line through the top of the heart. It now
starts and ends at the notch, with each lobe drawn once, so `Z` closes on itself and draws
nothing.

## The Properties panel ignored the tool you had picked

Reported as "it took me a lot of time to find the polygon sides while making polygons", with the
suggestion that the panel should show only what relates to the selected tool.

The panel already filters by `applicableTo`, and already had a "defaults for the active tool"
target — but that branch sat BELOW the slide check in `propertyPanelTarget()`, and the default
document type is paged. So in the app as shipped, the branch was unreachable: picking the Polygon
tool showed slide Transition and Background, and *Polygon Sides* could not be found at all until
you had drawn a polygon and selected it.

The tool is now checked before the slide fallback. Picking Polygon shows polygon defaults with
*Polygon Sides* in them; Star shows *Star Points*; the eraser still shows only its width. Tools
that select rather than draw — Select, Pan, Lasso, Crop — fall through to the slide properties as
before, because they create nothing to set defaults for. An explicit *Canvas Settings* request
still wins over everything.

## Stick figures dropped from the panel landed off to the right

Reported as "when I click the stick figure animation, its shape is placed on the right edge of
the screen".

Both drop paths — `insertAnimatedFigure` (the Animated tab) and `svgToElements`, which every
static figure, illustration and SVG import goes through — defaulted to centring on the **active
page**, not on what the user can see. Those coincide only when the page happens to fill the
canvas. They stop coinciding in two ways at once:

- Pan or zoom anywhere else and the page centre is wherever it now is on screen, possibly
  off it entirely.
- Open a right dock and the canvas shrinks (`dockInsets()`), but the view transform does not
  move, so the page slides right relative to the drawing area *without the user doing anything*.
  Measured on a fresh document at fit-to-page with one panel open: the figure landed at
  canvas-local x = 659 of a 1020px-wide canvas, ~150px right of centre, and the page's own right
  edge was under the panel.

Both now drop at the centre of the visible drawing area, via a new `canvasCenterWorld()` in
`utils/dock-layout.ts`. Page centring survives only as the fallback for SSR/tests, where there is
no viewport to read. An explicit `x`/`y` still wins, so the comic-panel builder, the TeX
typesetter, drag-drop and `insertStickFigure(id, {x, y})` are all unaffected.

`tests/stick-figure-drop-position.spec.ts` asserts the dropped figure's centre equals the canvas
centre for both paths, at the default view and zoomed-in-and-panned-away; all four fail on the
old code.

## Reordering a layer moved it in the panel and nowhere else

**#331.** Dragging a layer up the stack rearranged the Layers panel and left the drawing
untouched. Reproduced with two overlapping rectangles on two layers: move the lower layer to
the top and the panel shows it on top while the canvas keeps drawing it underneath.

`reorderLayers` splices `store.layers` and then renumbers each layer's `order`. The
renumbering was `layer.order = idx` over entries taken from the store — solid-js/store
proxies, whose set trap is `set() { return true }`. Accepted and thrown away, in the
production build and the dev build alike (dev additionally logs `Cannot mutate a Store
directly`, which the console had been carrying once per layer per drag the whole time). So the
array moved and `order` did not, since `d84ce04d` (2026-01-11), the commit that introduced the layer system.

`order` is what stacks the document: `canvas-renderer.ts:819` sorts by it before painting, and
so do hit-testing (`selection-handler.ts`, `canvas-event-handlers.ts`), the animation timeline,
recording, timelapse and slide builds. The Layers panel was the only surface that looked
correct, and only by accident — `displayLayers()` reverses the array rather than reading
`order`. Every consumer that decides what is actually on top disagreed with the one surface
the user was looking at.

Fixed by extracting `reorderedLayers(layers, from, to)`: pure, returning fresh objects, so
nothing depends on the store accepting a mutation. Documents saved by an affected build can
carry an `order` that disagrees with their array; they are normalised on load the same way
slides already were, taking the array as the truth because the array is what the panel showed
the document's author.

Found by building a drop indicator precise enough to be caught lying. The old behaviour
highlighted the target row, which claims only "something happens here"; the insertion line
claims "it lands exactly here", and with Groups on — where the panel sorts by `order` instead
of by array position — the layer visibly refused to move. **A vague signal cannot be
falsified, and this one had been covering a real bug by never making a checkable claim.**

`frontend/src/store/layer-reorder.test.ts` pins it, in a shape forced by the environment —
see the matching entry in `docs/learnings.md`.

## The command palette could not be searched in the language it was displaying

**#332.** Found while testing the new French locale, and not French-specific.
`searchCommands` matched with `toLowerCase()` and nothing else, which leaves two
invisible characters between what a user types and what the label contains.

**Apostrophes.** French labels use the typographic apostrophe U+2019 — *Tranche
(zone d’exportation)* — which is correct French typography. An AZERTY keyboard
types the straight U+0027. The two never met, so every command containing *l’*
or *d’*, a large share of them, was unreachable by typing its own name.

**Accents.** `elements` did not find *Éléments*; `etoile` did not find *Étoile*.
The unaccented spelling is what people actually type.

`foldForSearch` now lower-cases, decomposes to NFD and drops combining marks, and
folds U+2018/U+2019/U+02BC/U+00B4/backtick to a straight apostrophe — applied to
both the query and the haystack. It strictly widens matching, so every search
that worked before still works; German and Spanish gain too (`losung` → *Lösung*,
`simbolo` → *Símbolo*). English command ids are still searched, so an English
tutorial can be followed in a translated interface.

Adjacent, and caught the same afternoon: the first draft of `fr.ts` carried **102
instances of U+02BC MODIFIER LETTER APOSTROPHE** instead of U+2019. It renders
identically in every font, and Unicode classifies it as a **letter** — so it
breaks word boundaries, sorting and search. It was found by counting characters
in the file, not by reading the UI, where it is invisible by construction.
`fr-search.test.ts` fails if one comes back.

## verify-deploy reported a good deploy for a release that had not deployed

**Tooling.** `scripts/verify-deploy.sh` passed all its checks twice in one
session while describing the PREVIOUS release: green on v0.8.222 during the
v0.8.223 verification, and green on v0.8.223 during v0.8.224's. Caught by hand,
by fetching the French chunk from production and getting a 404 seconds after the
script said "Deploy looks good."

Every check it ran asked whether the live site was **self-consistent** — same
bytes across eight fetches, every referenced asset resolves, cache headers
correct, prerendered pages present. All of that is equally true of a build from
three releases ago. Nothing compared what was live against what had just been
shipped, so the script could not tell "deployed correctly" from "has not
deployed yet" — and answered the second case with a green tick.

A release check now runs immediately after the consistency checks. Two details
made the obvious implementation wrong:

- **It compares the VERSION, not a chunk hash.** Hostinger builds from the
  cleaned client-only copy `publish-oss.sh` pushes, so its entry chunk is
  legitimately a different file from a local `dist/` build. The first attempt
  compared entry hashes and reported a mismatch on a perfectly good deploy.
  (Chunks whose sources the cleaning does not touch DO keep the same content
  hash — `fr-81hyuRp4.js` was byte-identical local and live. The entry chunk is
  not one of them.)
- **The bundle is streamed to a temp file, never held in a shell variable.** The
  entry chunk is ~2.6 MB and command substitution mangles it, which produced a
  false mismatch on a version that was demonstrably present in the file.

Failing right after publishing means "you ran it too early", and says so. That is
the point of the check: "not yet" is worth more than a tick describing the last
release.

## Two releases never deployed, because .ossignore stripped a directory the build reads

The live site served v0.8.235 for a day while v0.8.236 and v0.8.237 sat published in the
OSS repo. Hostinger reported a failed build **with no logs**, which is the signature bug
#344 taught us to read as OOM — and that is the wrong answer this time.

The right first move was the one that settled #344: clean `git clone` of the OSS mirror,
`npm ci`, `npm run build`. Three minutes, and it fails in a way nothing on the host said:

```
✓ built in 38.65s
 Error: ENOENT: no such file or directory, scandir '.../ossbuild/articles'
Exit status: 1
```

`vite build` succeeds. `npm run prerender` then dies, because `readArticles()` in
`prerender/render.ts` scans `articles/` to generate `/learn/`, and the previous day's
`fix(publish-oss): stop publishing articles/` (e57c6007) had added `articles` to
`.ossignore` under the comment *"authoring source, not consumed by the build"*. It is
consumed by the build. `git tag --contains e57c6007` returns exactly v0.8.236 and
v0.8.237 — both failures, and no others.

Two fixes, because either alone leaves the trap set:

- `.ossignore` excludes `articles/vibe-architecting-yappydraw` — the one article marked
  `internal: true` — instead of the parent. The directory the build needs now ships.
- `readArticles()` turns a missing `articles/` into an error naming `.ossignore` as the
  cause. It deliberately does **not** skip and carry on: that would produce a *successful*
  deploy with `/learn/` missing, 404ing an indexed section of the site while the editor
  looked perfectly fine.

**Guarded in v0.8.239.** `publish-oss.sh` now refuses to push a tree missing anything the
build reads, and the list is *derived* rather than hand-written: the prerenderer declares
its inputs as `path.join(REPO, '<path>')`, so grepping for that pattern finds them and an
input added the same way tomorrow is covered without anyone remembering. A `--verify` flag
additionally runs `npm ci` and `npm run build` inside the published tree, which is the only
check that tests what the host tests; the ship-it flow passes it. Re-introducing this exact
bug now fails the publish with an explanatory error instead of a green push.

Three things worth keeping:

- **"No logs" narrows the field, it does not name the culprit.** #344 established that an
  empty log means killed-not-failed. It does not follow that every silent host failure is
  the same kill. Here the build exited 1 with a real error the host simply never surfaced.
- **A comment asserting something is unused is a claim, and claims rot.** "not consumed by
  the build" was checkable in one grep at the time it was written.
- **The exact same failure had already happened at file scope**, and the comment recording
  it is eleven lines above the crash: a README landing in an article folder without front
  matter "took `npm run build` down for every release after it". That was fixed by
  filtering READMEs rather than by asking what else could make the scan fail.

## The default palette could paint a colour but never take one away

*"The palette displayed by default is P3 wide gamut, and there is no option to
remove stroke in this one like the palette with the name 'Default'."*

Exactly right, and the cause is one line of data. `transparent` was a swatch in
the `default` palette and in no other — so `architect`, `p3`, `pastel` and
`vibrant` were lists of colours with no way to express *none*. That matters more
than four missing swatches, because `defaultPaletteId()` returns `'p3'` on any
wide-gamut display: **the palette most people open is one of the four that could
not clear a fill or a stroke.** The only remaining route was scrolling the
Properties panel to find the control.

Every palette now leads with the transparent swatch, in the same first position,
so the gesture is identical whichever palette you are on.

The same report carried two more, both of the same shape — the capability existed
and could not be reached:

- **"Add an eyedropper we can select colours from references."** There already
  was one, and it already samples image pixels (`samplePixelHex` → the
  `elementPickColor` fallback, which is how a photo dropped on the canvas gives
  up its colours). It lived inside the Properties panel's colour picker, behind
  a shape selection and two panels. It is now a button in the palette popup and
  in the new Fill & Stroke panel, where someone matching a palette off a
  reference image is actually looking.
- **"Have a fill and stroke icon in the tools area like we have in Illustrator …
  better than having to scroll every time in the properties."** Added at the foot
  of the tool column: the two overlapping squares, showing the selection's paint
  or — with nothing selected — what the next shape will be drawn with. Click
  either for colour, *None*, the eyedropper, swap and reset. <kbd>X</kbd>
  switches channel; <kbd>Shift</kbd>+<kbd>X</kbd> swaps.

One real bug surfaced while wiring the shortcut: `Shift+X` was guarded by
`if (store.selection.length > 0)`, so on an empty canvas — precisely when you are
setting up the colours for the next shape — the key did nothing at all. It now
swaps the armed defaults, and `fill-stroke-paint.test.ts` pins that.
