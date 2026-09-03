# Release notes

One Markdown file per shipped version: `release-notes/<version>.md` (e.g.
`0.5.2.md`). Created as part of the **"ship it"** workflow (see `CLAUDE.md`) —
never skipped. Newest at the top of the index below.

## Template

```markdown
# <version> — <short title> (<YYYY-MM-DD>)

## Highlights
- One-line, user-facing summary of the headline change(s).

## Features
- New capabilities (with the `window.Yappy` API where relevant).

## Fixes
- Bugs fixed (link the symptom → cause briefly).

## Internal / tests / docs
- Infra, test, refactor, doc changes.

## Breaking changes / migration
- Anything users/integrations must adjust (or "None").
```

## Index

- [0.8.233](0.8.233.md) — Settling what a founding place promises before collaboration exists, rather than after people have paid for one. Every feature in the app stays free for everyone, collaboration included and self-hostable by anyone; what costs money is the server we run, free to founders for a year from launch and discounted after. The decision that shaped it is a licence one: a server reusing AGPL client code is a derivative work, and §13 then forces its source out to everyone who connects — so "founders get the source" would have deleted itself the moment someone imported the document model "just for the types"
- [0.8.232](0.8.232.md) — The founders page stops arguing with itself: a progress bar reading "1,000 of 1,000 founding places remaining" — accurate, dated, carefully built to never overstate — that tells a visitor nobody has bought this, and the help sidebar's twenty links away from a payment decision. Both gone, the counter behind a flag rather than deleted. Plus #342: `/founders/` and `/learn/` had never been viewable under `vite dev` at all, because they are prerendered-only pages with no client route, so the SPA fallback served the editor at their URLs — a broken page that looked like a working one
- [0.8.226](0.8.226.md) — "Something went wrong" on Delete and on Pathfinder was one bug: `store.selection` holds ids, and removing the elements it names was two store writes with Solid running effects between them, so for one frame the selection named elements that no longer existed — and `paintColorIsMixed` read `sel[0].strokeColor` off the empty result. That read sits inside a reactive `title` binding, so it did not break one control; it reached the top-level ErrorBoundary and replaced the whole editor, taking the only route to Ctrl+Z with it while the document and undo stack sat intact in the store. Fixed at the read, at the write (the selection update moved *inside* the batch, so the invariant is structural), and at the blast radius — the error screen now offers "Undo last change". Plus tool flyouts that open off-screen from a right- or bottom-docked bar (seventeen byte-identical copies of an assumption that the toolbar is on the left), a Pen that drew nothing at all with the stroke set to None, a P3 palette that moved the swatch but not the colour picker, a Layers panel that was draggable in code and unreachable in practice, and Ctrl+corner free distort — the one thing in a six-item report that genuinely did not exist
- [0.8.225](0.8.225.md) — Fill & Stroke moves into the tool column: the Illustrator swatch pair, with *None*, the eyedropper, swap and reset a click away rather than a scroll through the Properties panel. Behind it, a one-line gap in the palette data — `transparent` was a swatch in `default` alone, and `defaultPaletteId()` hands every wide-gamut display `p3`, so the palette most people open could paint a colour and never remove one. The eyedropper had the opposite problem: it existed, read the exact colour out of the document rather than the screen, sampled image pixels — and lived two panels deep inside the Properties colour picker, which is not where anyone matching a palette off a reference photo is looking. Plus <kbd>Shift</kbd>+<kbd>X</kbd>, which was guarded by a selection check and so did nothing on the empty canvas where it is most useful
- [0.8.224](0.8.224.md) — Français, the fifth interface language: 543 strings on Illustrator/Photoshop FR terminology, shipping as its own lazy chunk. Writing it exposed an older bug — `searchCommands` compared with `toLowerCase()` alone, so the typographic apostrophe French labels use (U+2019) never met the straight one an AZERTY keyboard types, and every command containing *l’* or *d’* was unreachable by typing its own name; accents failed the same way. Also 102 instances of U+02BC in the first draft, a LETTER that renders identically to U+2019, found by counting characters rather than by looking
- [0.8.223](0.8.223.md) — Reordering a layer had never changed what draws on top: `reorderLayers` renumbered `order` with a direct write to a solid-js/store proxy, which both store builds accept and discard, so the array moved and `order` — what `canvas-renderer`, hit-testing, the timeline, recording and slide builds all sort by — stayed put. The panel looked right only because it reverses the array instead of reading `order`. Found by shipping a drop indicator precise enough to be caught lying, after the ghost and the insertion line replaced a highlighted row that had never made a checkable claim
- [0.8.222](0.8.222.md) — The Layers swipe-tray icons were rendering as a 6px sliver inside a 44px coloured block. Not an icon-size bug: the global `button { padding: 0.6em 1.2em }` left a border-box button with 5.6px of content, and an `<svg>` is a flex item that shrinks into whatever it is given. Fixed at the button, with `flex-shrink: 0` on the icon so a future global rule cannot re-break it — and a page-wide sweep confirming no other icon is squeezed
- [0.8.221](0.8.221.md) — Closing the classes rather than the instances. Fills now cover what a shape *draws* rather than what it declares, so the shapes that reach outside their box on purpose — a puzzle piece's interlocking tabs, a 3D solid's depth — stop losing that part of a pattern or image fill; the exemption written in 0.8.220 had removed those shapes from the test, not from the bug. Layer reordering moves off HTML5 drag-and-drop entirely, removing the shared `DataTransfer` that let a global handler invalidate the panel's drag from a distance in #323, rather than exempting the panel from it — and the drag now works across the whole panel instead of only over a row. Plus Extrude, Inflate and Turntable translated into de/es/ja as one block, ratchet 1508 → 1476
- [0.8.220](0.8.220.md) — The other eight clouds. Fixing the cloud in 0.8.219 fixed one shape; "draws outside its own bounding box" turned out to be a class, and an audit across every shape at four aspect ratios found eight more — `gauge` 30% out, `lightbulb` 16.7%, `magnet` 15%, `scroll` 11.3% — none of them reported, because the symptom (a pattern fill stopping in a flat line) looks nothing like the cause (a geometry function). All nine fixed, `getRoundedRectPath`'s unclamped radius fixed at source, and a gate added that reads the element-type union so a shape added next month is covered automatically. The audit's own sampler carries eight tests, after its first draft ignored the arc's x-axis-rotation parameter and confidently reported the cylinder as 562% oversized
- [0.8.219](0.8.219.md) — Inflate 3D: puff any flat shape into a lit, rounded body, with an image fill acting as the surface material — a height field taken from the shape's own silhouette, so it needs no 3D engine and follows whatever outline you drew. Plus three things that quietly disagreed with each other: the cloud drew outside its own bounding box, so every buffer-backed fill (pattern, mesh, image) stopped in a flat line partway up it while solid fill hid the problem; the layer panel's drag exemption named a CSS class that had moved house, so the global image-drop handler forced `copy` onto a `move` drag and the browser refused every reorder; and a paged design had two different rules for which page an object belongs to, so one object drew on two pages and deleting it "from one page" deleted it outright
- [0.8.218](0.8.218.md) — Eight fixes from one user's pillar drawing, none of them about pillars: Convert to Path sampled every curve into a polygon (a database came back as thirty flat chords) and dropped the cap the renderer draws separately; the polygon flattener behind Pathfinder, Shape Builder, the Knife and the 3D extrude ignored corner radii, so all of them squared a rounded rectangle off; 3D blocks published faces and no outline, so they could not be converted to a path at all; the Pen could only finish an open path from the keyboard, and Ctrl+Z mid-path discarded every anchor at once; and hidden layers were drawn into every export AND stretched the crop box they size themselves from. Plus a Taper on the cylinder, so a column or a plant pot no longer needs a converted database
- [0.8.217](0.8.217.md) — Making a cylinder taller made it flatter: the element box sized the shape's cap rather than the whole solid, and the barrel was clamped to half the short side, so a 100×400 cylinder was a 100×400 ellipse with a 50px stub. Rebuilt as a tube inscribed in its box, with one Cap Perspective control that moves BOTH end circles, a genuine tilted-tube axis angle, and hidden-line removal so an unfilled cylinder stops reading as two crossed ovals
- [0.8.216](0.8.216.md) — Stick figures, illustrations and imported SVGs land where you are looking rather than in the middle of the page — three call sites un-projected the client centre of the drawing area without accounting for the dock inset the canvas is positioned by
- [0.8.215](0.8.215.md) — All 68 menu labels translated (ratchet 1565 → 1496), plus a German inconsistency introduced one release earlier: `Ctrl` → `Strg` is the shipped convention and my v0.8.214 string had used `Ctrl`. The 19 menu tooltips are deliberately left, because `Delete (Del)` and `Alt+Enter` have no precedent in any locale and choosing one silently answers decision D4
- [0.8.214](0.8.214.md) — The Settings dialog is translated: 63 strings across all four locales, the ratchet down 1628 → 1565 and that file 76 → 13. Done as real translations rather than English placeholders, because ~63 untranslated keys would have dropped de/es/ja under the 95% coverage gate and pulled three shipped languages out of the picker
- [0.8.213](0.8.213.md) — i18n Phase 3's two missing prerequisites: `parts()`, so a sentence with an inline link stays one translatable string instead of three fragments in frozen English word order, and `scripts/i18n-translate.mjs`, the batch translation step the plan specified and nobody had built. Resumable across ~681 keys per locale, with a cached glossary and a dry-run that costs nothing
- [0.8.212](0.8.212.md) — Teaching Mode had shipped three hardcoded English strings past the i18n ratchet built to catch them, because nothing ran it: the guard sat green in the package scripts across four releases while the count climbed. Strings extracted and genuinely translated into all four locales, and the ratchet now blocks on commit
- [0.8.211](0.8.211.md) — The two HIGH Dependabot alerts that had appeared on every push turned out to be unreachable: `image-size` is a Node-only path that pptxgenjs already excludes from browser builds, absent from all 160 shipped bundles, with no upstream patch and a three-major downgrade as npm's only remedy. Dismissed with the evidence, and recorded in a new dependency-audit doc so it is not re-investigated
- [0.8.210](0.8.210.md) — Undo History Depth advertised a 10–500 range and enforced neither end: `min`/`max` on a number input only binds the spinner arrows, so a typed `3` walked straight past into storage. One clamp now covers the dialog, the API and a hand-edited localStorage value — applied at the entry point, because clamping at the persistence step would have left memory and disk disagreeing. Plus the setting is documented at last
- [0.8.209](0.8.209.md) — `www.yappydraw.com` was a dead link: the canonical-host redirect emitted a `Location` with no hostname (`/help/` → `https://help/`), because Apache resolves `%1` against the LAST matched RewriteCond and the capturing one had been written first. Two releases had recorded this as an un-fixable host setting, ruled out by reading the top of a 115-line file; it was line 100
- [0.8.208](0.8.208.md) — The deploy verifier was reporting seven failures on a perfectly healthy deploy: it defaulted to the www hostname, which the host answers with a 301 whose Location has lost the domain (`/help/` → `https://help/`). Now checks the canonical apex host and reports the www breakage as one targeted line — plus the discovery that bug #280's cacheable `sw.js` is genuinely fixed, which a documented "expect this failure" habit had hidden
- [0.8.207](0.8.207.md) — Teaching mode: one checkbox strips the app back to the tools people actually draw with, for running a session in front of a room — the vector surface (Vector Tools, Shape Builder, Pathfinder, the Pen, dimension badges) leaves the top bar, the menu and the right-click menu, and its keyboard shortcuts go inert rather than dropping you into a hidden tool. Plus paste finally arms the Select tool, so a pasted object is one you can grab instead of one you can only look at
- [0.8.206](0.8.206.md) — A cloud dragged wide collapsed into a spiked bowtie (every radius was derived from the width alone), the checkmark drew as a triangle, and the heart had a spike through its notch. Plus the Properties panel now follows the tool you picked, so Polygon Sides is findable before you draw a polygon
- [0.8.205](0.8.205.md) — Sketch corners meet: RoughJS was jittering the ENDS of every edge (0.85px at the default sloppiness, multiplied by the zoom because the geometry is generated in world space), and butt caps left a wedge at thick corners. Sloppiness also stops defaulting to 1 on a drawing style that ignores it
- [0.8.204](0.8.204.md) — Ungroup was missing from the right-click menu whenever you pressed on the artwork itself. The path-editing menu added in 0.8.202 replaced the element menu instead of joining it, so Make Smooth / Delete Anchor / Insert Point Here came at the cost of Group, Ungroup, Pathfinder, Arrange and Copy — with no keyboard fallback on a tablet. Both menus now show, path actions first
- [0.8.203](0.8.203.md) — Yappy speaks four languages (Español, Deutsch, 日本語), and every public page is a real URL with real HTML behind it instead of a fragment after a `#` that no search engine could read. 35 static pages, a 38-URL sitemap, and a BPMN document that had been written, maintained and never registered, so nobody could open it
- [0.8.192](0.8.192.md) — The Reload button on an error screen genuinely did nothing: a `prompt`-strategy service worker only swaps in the new build once every client is gone, and a reload keeps the client alive — which is exactly why "close it and come back" was the only workaround. Plus a failed help doc no longer takes the whole Help page down, the Pen tool can be paused and resumed from either end of an open path, and the eyedropper stops reporting a gradient's first stop for every point on it
- [0.8.191](0.8.191.md) — The eyedropper picks the exact colour of the shape you click instead of measuring the pixel on your screen, which on a wide-gamut display was handing back the same colour re-encoded and slightly duller (#FF0000 came back #EA3323). And a Fill-mode stroke can finally be recoloured after you draw it — the Properties panel had never offered a Background control for freehand marks, so the fill was stuck on the colour it was drawn in
- [0.8.190](0.8.190.md) — Strokes can sit inside, on, or outside a shape's outline, so a thick border stops eating into the shape it frames. Corner and end-cap styles now work on Pen paths, lines and freehand strokes, not just closed shapes. Guides can be selected several at a time and moved, nudged or deleted as one group — which turned up a long-standing bug where every guide shared one id, so dragging one moved all of them
- [0.8.189](0.8.189.md) — Editing a shape in the middle of a tween works at last: the handles you can see are the handles you can grab, clicking a tweened shape selects it, and dragging it follows your cursor instead of crawling behind it — all one disagreement about where the shape actually is. Editing mid-tween splits the span for you, Animate-style. Plus Alt+Shift resize from the centre, a live W × H chip while dragging, and visible grips on the panel resize edges that were there all along
- [0.8.188](0.8.188.md) — Loading a presentation or design template disabled zoom and pan entirely (every route at once: hotkeys, Ctrl+scroll, the status-bar buttons, the Pan tool and Space+drag). The canvas' dock/zen layout effect tracked the view state through its own redraw, so each zoom re-ran the layout, which re-fits the slide
- [0.8.187](0.8.187.md) — Shape Builder gets its box: Shift+drag rubber-bands over several regions at once (Illustrator's binding, and the half we were missing), Shift+Alt to delete them
- [0.8.186](0.8.186.md) — The Perspective Grid stops being a picture and starts snapping drawing to its vanishing rays, with one strength slider spanning "gentle bias" to "hard lock", plus draw-on-a-plane; and Live Corners for every editable path, non-destructively
- [0.8.185](0.8.185.md) — Designer review round two: flip that takes the anchor points with it, Shift for straight pen lines, moving an anchor on a rotated shape no longer dragging the whole shape, line spacing, different font sizes inside one text box, independent corner radii, group renaming and a Shift+I eyedropper
- [0.8.184](0.8.184.md) — The origin was serving two different builds from the same URL (7 of 8 fetches returned a three-release-old `sw.js`), which is why the precache trim kept un-shipping and is a strong candidate for the real cause of the error screen. New `npm run verify:deploy` samples and asserts; plus an `.htaccess` sw.js rule that had never taken effect
- [0.8.183](0.8.183.md) — The object tree: every object on a layer listed in the Layers panel, with per-object select (incl. inside a group), hide, lock, rename and drag-to-restack. New optional `visible`/`name` element fields, absent-means-visible, honoured across render, hit-test, marquee, minimap and all seven export paths
- [0.8.182](0.8.182.md) — "All my saved drawings are gone": a failed IndexedDB open made the gallery, autosave and version history all look deleted at once, cached the failure for the session, reported memory-only writes as saved, and then cleared the crash-recovery slot on that false success. Plus marquee selection now takes whole groups (Illustrator/Figma)
- [0.8.181](0.8.181.md) — The "Something went wrong" screen traced to the host sending no `Cache-Control` on index.html (stale HTML → 404 on content-hashed chunks), fixed with a `.htaccess` policy plus a one-shot self-healing reload; and the service-worker precache cut 9.6MB → 4.6MB, which every release had been re-downloading in full
- [0.8.180](0.8.180.md) — Group isolation: double-click into a group and select/move/align its members individually (the actual reason "aligning inside a group moved everything"); align/distribute stopped exploding groups; Bring Forward/Send Backward as a block on Illustrator's Ctrl+] / Ctrl+[; Rasterize; and align-to-key made visible
- [0.8.176](0.8.176.md) — Closes 0.8.175's two known gaps: Create Outlines now uses real italic faces (slant-first matching, browser-matching shear where a family has none), and Knife pieces are re-fitted to curves with corners and the cut edge kept sharp — 5 anchors per half-circle instead of ~20. Glyph binaries dropped from the PWA precache
- [0.8.175](0.8.175.md) — Designer review: Font Family/Style split on a real 100–900 weight axis, Alt-drag to break a Bézier handle pair, Scissors that cuts where you click (it snapped to the nearest anchor, 76 units off), Unlock All for locked objects that could never be selected, and Create Outlines using the font you chose rather than substituting sans-serif; plus bold that had never worked on connector/BPMN labels
- [0.8.170](0.8.170.md) — Bullet lists survive the editor: nested items were dropped outright (browsers nest a `<ul>` as a *sibling* of its `<li>`), items after a nested list merged into the previous bullet, and wrapped items grew a second marker; plus the Properties panel's align icons, which named the wrong axis
- [0.8.169](0.8.169.md) — Tool options in the top bar for shapes, connectors and text (previously Node tool + brushes only), sharing the quick toolbar's widgets via a new `quick-controls.tsx`; controls the draw handler would discard are deliberately withheld
- [0.8.168](0.8.168.md) — Ctrl+A left the drawing tool armed, so select-all produced an inert selection that couldn't be dragged, resized or handled — and went stale as you kept painting; also unbroke `app-store.test.ts`, which had been failing to import (389 → 393 tests)
- [0.8.167](0.8.167.md) — The first diagram imported into a fresh page was measured against the fallback font and baked a 3.7% size error into the saved document; `document.fonts.ready` resolves while the font is still missing. New `Yappy.fontsReady()` / `fontsLoaded()`
- [0.8.166](0.8.166.md) — Connectors leave a box perpendicular to the edge they're anchored to, not along the chord's dominant axis (97 of 653 edge-anchored endpoints left parallel to their own edge); connector labels stop wrapping to a zero-width bounding box
- [0.8.165](0.8.165.md) — Arrowheads follow the curve they're on: exported heads were rotated to the bounding-box chord (up to 45° off) and architectural canvas heads pointed due east; one shared connector-geometry helper replaces six hand-copied derivations
- [0.8.164](0.8.164.md) — The mobile shell works again: the phone toolbar had become a full-screen invisible panel that ate every tap; plus overflow, 28px touch targets, chrome painted over the canvas, and a dead 601–699px band
- [0.8.163](0.8.163.md) — Recursive symbols (Droste/spiral/fractal); symmetry axes, artboard frames and rulers were all drawn 46/52px off the geometry they annotate; Fill mode previews while you draw
- [0.8.162](0.8.162.md) — Properties becomes a dock panel, the top bar becomes a real header, Settings/Help get navigation + search; fixes the invisible palette/theme buttons
- [0.8.155](0.8.155.md) — Combine toolbar now recognises every shape type with area, not a hardcoded list of 19
- [0.8.154](0.8.154.md) — One-click boolean ops (contextual toolbar + Ctrl+Alt shortcuts, Shape Builder promoted); fixes the exponent-parsing NaN that made edited shapes unselectable and uncombinable
- [0.8.153](0.8.153.md) — `texTransform` morphs one equation into another (manim TransformMatchingTex); scrubbing while paused finally repaints the canvas
- [0.8.152](0.8.152.md) — Logarithmic axes (log-log and semi-log); manim-parity audit rewritten to probe behaviour rather than method names
- [0.8.151](0.8.151.md) — `Yappy.tex` typesets real LaTeX as vectors with per-symbol addressing; expression tracks (`setExpression`), vector fields, polar grids; SVG importer now resolves `<use>`/`<defs>`
- [0.8.150](0.8.150.md) — `Yappy.scene` (manim-style `play`/`wait` sequencing) and `Yappy.plot` (axes, function graphs, parametric curves); API-authored scenes no longer capped at 4s or frozen on Play
- [0.8.149](0.8.149.md) — Dependency audit clean: 8 vulnerabilities (1 critical) → 0, via an `ejs@6` override that removes the whole vulnerable chain
- [0.8.148](0.8.148.md) — Beta badge was failing WCAG AA (3.53:1); fixed, plus the contrast audit that was blind to gradients
- [0.8.147](0.8.147.md) — The intermittent "stuck loading" screen is fixed: four layers of boot recovery, so a startup failure always ends in a Reload button
- [0.8.146](0.8.146.md) — Noise/grunge texture overlays, Ctrl+L Simplify that auto-converts strokes, cross-document asset library; SVG arcs finally parsed (9 shapes regain Convert to Path)
- [0.8.145](0.8.145.md) — Animation Studio finale: frame actions (stop/goto/next-scene), self-contained HTML player, keyframed camera — roadmap complete
- [0.8.144](0.8.144.md) — Animation Studio: shape morphs, ease-curve editor, motion guides, stick-figure pose keyframes, audio row muxed into video, scenes
- [0.8.143](0.8.143.md) — Animation Studio: Animate-class frame timeline (keyframes, tweens, onion skin, movie clips, GIF export) + 3 sample templates
- [0.8.142](0.8.142.md) — Beta badge on the wordmark; footer credit points to Algorisys Technologies
- [0.8.141](0.8.141.md) — Cropping a rotated image no longer makes it jump (76px at 45°); undo/redo for crop confirmed
- [0.8.140](0.8.140.md) — Finishing a crop leaves the Crop tool, so clicking the image no longer looks like it undid the crop
- [0.8.139](0.8.139.md) — Re-cropping works (widen a crop, un-crop); on-screen Apply/Cancel so crop is usable on a tablet
- [0.8.138](0.8.138.md) — Floating panels were WHITE in dark mode: 24 CSS tokens were referenced but never defined; contrast sweep widened from 9 to 27 surfaces
- [0.8.137](0.8.137.md) — Crop fix now reaches the actual UI (0.8.136 fixed an API path the editor never used)
- [0.8.136](0.8.136.md) — Crop no longer distorts images; saved swatches visible & removable in the palette; image insert returns to Select; Layers panel contrast
- [0.8.135](0.8.135.md) — Focus theme finally differs from Dark (darkens the page itself, paged docs only); OKLCH picker can save a swatch
- [0.8.134](0.8.134.md) — Whole-app WCAG AA contrast audit: 635 findings across 11 selectors fixed in light, dark and focus; permanent audit test
- [0.8.133](0.8.133.md) — WCAG AA contrast for every filled primary button in both themes (19 were failing); P3 wide-gamut is now the default palette
- [0.8.132](0.8.132.md) — Toasts no longer cover or block the presentation toolbar; help-doc API references audited
- [0.8.131](0.8.131.md) — Committed regression suite for video/GIF capture (asserts the downloaded bytes; verified to fail against the bugs it guards)
- [0.8.130](0.8.130.md) — Looping GIF capture (start/stop) from the presentation toolbar; GIF frame-rate control; failed captures no longer disable the feature
- [0.8.129](0.8.129.md) — Record button in both presentation toolbars (MP4 of a whole run); Ctrl+Shift+E no longer ambushes you on Esc; Animation recording docs corrected
- [0.8.128](0.8.128.md) — Default Tool + Canvas Pointer settings; Ctrl+S asks for a name; My Drawings keeps every drawing (was overwriting after File → New)
- [0.8.127](0.8.127.md) — Smart shapes recognise your stroke reliably, mouse included (corner counting rewritten); open strokes stay as ink unless they're a line
- [0.8.126](0.8.126.md) — Smart shapes (hold to correct) keep your pen tool active instead of switching to Select
- [0.8.125](0.8.125.md) — Shape text is centred by default; the Properties panel no longer opens by itself when you pick a tool
- [0.8.106](0.8.106.md) — Excalidraw import/export (+ open Yappy format spec); text auto-size reachable & sticky; mindmap Tab/Enter inherit the parent's fonts/style; Slingshot overhaul (Y-fork + elastic bands via new `tether` action, destructible blocks, per-sprite gravity, grab margin); fix random middle-click paste on Linux; Alt+Enter opens Canvas properties; Behaviors panel no longer buried under the slide-navigator
- [0.8.102](0.8.102.md) — "What's new" popup: click the version number for a plain-language list of recent updates (+ "new" dot, Reload-latest button, `Yappy.showWhatsNew()`)
- [0.8.101](0.8.101.md) — Fix: elements/images/text no longer vanish when dragged past the page edge on design/slide docs (AABB-overlap visibility + always-render-selected instead of centre-point culling)
- [0.8.100](0.8.100.md) — First-visit guided onboarding tour (spotlight walkthrough; replay from Help or `Yappy.startTour()`); AA-contrast in light & dark
- [0.8.99](0.8.99.md) — Magenta equal-spacing guides always clear on pointer-up (no longer stuck on canvas after a drag / click-outside)
- [0.8.98](0.8.98.md) — Text box re-fits to the glyphs when the font grows (selection box no longer tiny); no quick-toolbar flicker while dragging Font Size; font size range up to 800; font-load repaint
- [0.8.97](0.8.97.md) — Shift+drag axis-constrained move (H/V/45°); unfilled boolean/compound results are click-selectable in their interior
- [0.8.96](0.8.96.md) — Bake dimension annotations into exports (opt-in): PNG/JPG/PDF raster + real vector SVG
- [0.8.95](0.8.95.md) — Measurement polish: px/mm/in units, angular/radial (radius/diameter/angle) dimensions, rotation-aware bounds, and true-outline intersection snapping
- [0.8.94](0.8.94.md) — Snap to path intersections (drop a corner where two outlines cross); completes the Precision & Measurement plan
- [0.8.93](0.8.93.md) — Precision & measurement: measure-to-neighbour (Alt-hover), richer Measure readout (Δx/Δy triangle + W/H/area/perimeter), fixed-angle constraint (Shift→15°), and snap-to-point while dragging
- [0.8.92](0.8.92.md) — Fix native colour picker not dragging in the Appearance fill/stroke rows (`<For>`→`<Index>` so the popup's DOM survives a live drag)
- [0.8.88](0.8.88.md) — Element search Phases 2–3: bundled OpenMoji illustrations + semantic keyword aliases + scriptable searchElements/insertElement API + Alt+E; connector-swarm & group/ungroup context-menu fixes
- [0.8.87](0.8.87.md) — Unified element search Phase 1: one "Search elements" box across icons/shapes/photos in a blended grid (+ alias map)
- [0.8.86](0.8.86.md) — One-click Replace Background (AI) + persistent in-progress spinner
- [0.8.85](0.8.85.md) — Stick figures: smaller default drop size (130→110) + baked figures no longer show un-draggable anchor squares
- [0.8.84](0.8.84.md) — Embedding doc: restrict who can frame Yappy (frame-ancestors / X-Frame-Options)
- [0.8.83](0.8.83.md) — Embed & drive the full editor from another project via a secure cross-origin postMessage bridge (+ host-side client)
- [0.8.82](0.8.82.md) — Custom stroke dash patterns (any on/off pixel array) + setStrokeDash API
- [0.8.81](0.8.81.md) — Numeric Transform panel (X/Y/W/H/rotation fields) + setElementTransform angle
- [0.8.80](0.8.80.md) — 3D Extrude keeps image pixels when tilted / beveled / expanded (was flattening to a solid colour)
- [0.8.58](0.8.58.md) — Dockable panels Phase D: History & Swatches migrated onto the dock (edge-dock / float / persist), via a setPanelOpen bridge
- [0.8.57](0.8.57.md) — Dockable panels: drag-to-dock + tear-out + reorder (Align/Arrange panels); fix invisible "ghost" line/arrow/pen elements from stray clicks
- [0.8.56](0.8.56.md) — Brand mascot (paint-brush bicycle) splash + welcome; full mobile/tablet responsive pass (untappable phone buttons, off-screen panels)
- [0.8.55](0.8.55.md) — Image placeholder + replace-in-place flow; tunable Glow & Feather panel sliders
- [0.8.54](0.8.54.md) — 3D Bevel & Revolve (lathe); consolidated Effects menu (+ Feather/Glow/Scribble now in UI); export image + "works once" fixes
- [0.8.53](0.8.53.md) — Fix export transparent border (20px→2px) + quick-toolbar font-size snap-to-8; OSS ships a clean lockfile
- [0.8.52](0.8.52.md) — Two-audience help docs (UI + verified Scripting API in every doc) + grouped context menu (Create/Select/Arrange/Export)
- [0.8.51](0.8.51.md) — Smooth Morph blend (true shape morph) + Envelope Make-with-Top-Object (warp into a silhouette)
- [0.8.50](0.8.50.md) — Desktop Phase 2: native Open/Save (.yappy), Open Recent, file associations, single-instance & auto-update
- [0.8.49](0.8.49.md) — Native desktop app (Tauri v2, builds `.deb`/`.rpm`/`.AppImage`); export crop/dropped-element/missing-effect fix
- [0.8.48](0.8.48.md) — Live 3D Extrude (+ tilt & Expand-to-faces), Blend-along-spine, Warp-preset panel editor; numeric-input clear fix
- [0.8.47](0.8.47.md) — Live Transform effect (accumulating copies) + named Warp presets (Arc/Flag/Wave…); createElement type-alias fix
- [0.8.46](0.8.46.md) — Palette + theme icons clear the Properties panel (no overlap)
- [0.8.45](0.8.45.md) — Draggable in-shape text labels + movable colour palette panel
- [0.8.44](0.8.44.md) — Tidy Canvas Theme + Texture (Texture moved under the Theme picker, no duplication)
- [0.8.43](0.8.43.md) — Canvas background themes (dot/line/graph/notebook/paper/blueprint/dark…)
- [0.8.42](0.8.42.md) — Fix empty-looking Sitemap / Random Words menu items
- [0.8.41](0.8.41.md) — Mind-map presets: Sitemap (top-down) & Random Words (radial)
- [0.8.40](0.8.40.md) — Advanced colour picker: square (SV + hue) & triangle (Krita-style hue ring) modes
- [0.8.39](0.8.39.md) — New Mind Map menu action + createMindMap API (seeds a ready-to-edit map)
- [0.8.38](0.8.38.md) — Escape closes every dialog (9 dialogs fixed via a shared hook)
- [0.8.37](0.8.37.md) — Mind-map layouts (dual-side + top-down) from the DSL, per-branch colour + curved links; curved connectors export as real curves
- [0.8.36](0.8.36.md) — Quick-toolbar font-size slider steps by 1 (was 2)
- [0.8.35](0.8.35.md) — Global colour palette: transparent swatch reads as transparent (checkerboard)
- [0.8.34](0.8.34.md) — UML relations: spread fan-in arrowheads + edge arrowheads in the text DSL
- [0.8.33](0.8.33.md) — UML class boxes auto-size to their members (no more wrapped/dropped types)
- [0.8.32](0.8.32.md) — Begin/end arrowheads on curvy bezier lines
- [0.8.31](0.8.31.md) — Real UML class diagrams in exported SVG + YSL class members + headless render CLI
- [0.8.30](0.8.30.md) — Mermaid UML class diagrams: real members & distinct UML arrowheads
- [0.8.29](0.8.29.md) — Tap/click to type an exact value on quick-toolbar sliders
- [0.8.28](0.8.28.md) — Stick-figure neck stops at the head outline, not the centre
- [0.8.27](0.8.27.md) — Timeline block reorder (drag-move) + slide-synced animation
- [0.8.26](0.8.26.md) — More stick-figure motions (Run/Clap/Dance/Cheer) + timeline block resize
- [0.8.25](0.8.25.md) — Exported HTML now plays stick-figure animations
- [0.8.24](0.8.24.md) — Scene Timeline: play & scrub all stick figures together
- [0.8.23](0.8.23.md) — Record stick-figure animations to video (webm)
- [0.8.22](0.8.22.md) — Stick-figure action sequences (chain motions over time) + smooth transitions
- [0.8.21](0.8.21.md) — Animated stick figures (walk/wave/talk/point/jump, walk-along-a-path) + Convert-to-Path fix
- [0.8.20](0.8.20.md) — More stick-figure poses (225 assets) + monochrome preview fix
- [0.8.19](0.8.19.md) — Stick-figure browsing ergonomics (colour/mono, favourites, recents, keyboard)
- [0.8.18](0.8.18.md) — Stick-figure variant filter fix (props/scenes no longer bleed into gender views)
- [0.8.17](0.8.17.md) — Stick-figure full catalog: variants, props & scenes
- [0.8.16](0.8.16.md) — Stick-figure library (drawify-style editable people)
- [0.8.15](0.8.15.md) — Flappy sample game (one-button flyer)
- [0.8.14](0.8.14.md) — One-click game Export on the canvas game bar
- [0.8.13](0.8.13.md) — Pointer & velocity nodes → a drag-aim Blueprint Slingshot
- [0.8.12](0.8.12.md) — Blueprint sample games (Platformer/Breakout) + a canvas view switcher
- [0.8.11](0.8.11.md) — Slingshot & Platformer play right; Play button no longer clipped
- [0.8.10](0.8.10.md) — Slingshot: an Angry-Birds sample game
- [0.7.1](0.7.1.md) — Quick toolbar font colour fix (text / rich-text)
- [0.7.0](0.7.0.md) — Game Engine: variables, sound, physics & the node graph
- [0.6.0](0.6.0.md) — Arcade: build games on the canvas (visual Game Builder + runtime)
- [0.5.33](0.5.33.md) — Template pack + polish round
- [0.5.32](0.5.32.md) — Magic Resize, offline PWA, version history & AI studio round 2
- [0.5.31](0.5.31.md) — Design workflow gaps closed + Google Fonts live preview
- [0.5.30](0.5.30.md) — Page thumbnails, font pairings & stock photos
- [0.5.29](0.5.29.md) — Faithful background removal + image model setting
- [0.5.28](0.5.28.md) — Design Studio: Canva-style design documents, templates, brand kit, elements, text effects, AI
- [0.5.27](0.5.27.md) — Letter Spacing for shape & connector labels
- [0.5.26](0.5.26.md) — Touch Type works with letter spacing
- [0.5.25](0.5.25.md) — Touch Type: dragging a letter moves only that letter
- [0.5.24](0.5.24.md) — Reliable Touch Type letter selection
- [0.5.23](0.5.23.md) — Spinner arrows on numeric property fields
- [0.5.22](0.5.22.md) — Puppet Warp gated to warp-capable elements
- [0.5.21](0.5.21.md) — Touch Type: multi-letter select & shape labels
- [0.5.20](0.5.20.md) — Letter spacing now drives text auto-resize & wrapping (Illustrator parity)
- [0.5.19](0.5.19.md) — Hatch fills (hachure/cross-hatch/zigzag/dashed) in architectural mode
- [0.5.18](0.5.18.md) — UML Object, Port, History & Activity Action shapes
- [0.5.17](0.5.17.md) — UML Deployment Node & Artifact shapes
- [0.5.16](0.5.16.md) — Google Fonts, custom-font hardening & UML in the Architecture group
- [0.5.15](0.5.15.md) — Industry-grade sequence diagrams, unified Architecture group, custom/per-char fonts & a UX sweep
- [0.5.14](0.5.14.md) — Appearance pattern fills export as true SVG `<pattern>`
- [0.5.13](0.5.13.md) — Live-link pattern swatches + pattern stack-fills
- [0.5.12](0.5.12.md) — Reusable pattern-swatch library
- [0.5.11](0.5.11.md) — Make Pattern from Selection
- [0.5.10](0.5.10.md) — Vector pattern fills
- [0.5.9](0.5.9.md) — Pen options bar placement hotfix
- [0.5.8](0.5.8.md) — Clock-Method constrain + keyboard-free anchor editing
- [0.5.7](0.5.7.md) — Procreate-style layer swipe gestures
- [0.5.6](0.5.6.md) — Tap-version hard refresh (iOS Safari)
- [0.5.5](0.5.5.md) — Movable toolbar on tablets
- [0.5.4](0.5.4.md) — Table reorder feedback & touch select-all
- [0.5.3](0.5.3.md) — Tablet select+delete & richer touch gestures
- [0.5.2](0.5.2.md) — DSL parser strictness + full test-suite cleanup
- [0.5.1](0.5.1.md) — deleteSlide fix
- [0.5.0](0.5.0.md) — Illustrator-parity baseline + version reset

> Versioning reset to **0.5.0** on 2026-06-27 (continuing from there). Prior
> internal `0.27.x` history rolled into the 0.5.0 baseline note.
