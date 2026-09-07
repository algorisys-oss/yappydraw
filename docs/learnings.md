# Learnings from Yappy Development

This document captures key lessons learned during the development of Yappy, particularly from implementing complex features like the mindmap action toolbar.

## Two code paths for "the same" thing will drift, and only a user will notice

Four of the ten defects in Anshika's Sep 2026 review were one shape: a rule implemented twice,
in two places, and only updated in one.

- The canvas draws layer-by-layer in `layer.order`; every exporter walked `store.elements` in
  array order. Identical output for a single-layer document, wrong for anything else.
- `prepareStickFigureElements` cleared `accent | hair | garment` for a mono figure;
  `toMonochromeSvg` cleared `accent | hair`. So the panel and the drop disagreed.
- `applyPathfinderRegion` coloured each face by the topmost shape covering it;
  `commitShapeBuilderFaces`, thirty lines away, used the backmost shape for every face.
- `deleteLayer` counted elements with `layerId === id`; the panel's tree and `isLayerVisible`
  both understood nesting. So a group read as "empty" to one and full to the others.

The tell in every case is a comment asserting the invariant instead of code enforcing it:
"Keep document order so the raster stacks the same way the canvas does", and "Thumbnail markup:
exactly what the figure will look like when dropped". Both were false when written or shortly
after. **When you catch yourself writing a comment that promises two code paths agree, that is
the moment to extract the function instead** — `elementsInRenderOrder()` is now the one answer
to "what order does this document draw in", and there is nowhere left for a second one to hide.

## A tolerance and a hit test that disagree by 4px is a bug, not a rough edge

The colour wheel's shade triangle had its vertices at exactly `R_IN`, and the hue ring grabbed
everything from `R_IN - 4` outwards. So the pure-black and pure-white corners — the two colours
people reach for most deliberately — sat *inside* the ring's grab band, and aiming for them span
the hue instead. It was reported as "a minor problem which can be avoided by the user side". It
was not avoidable, and it was not minor: it made an exact black unpickable by hand.

Two rules came out of it, both of which Krita and Illustrator already follow:

1. **Overlapping controls need dead space, not just an ordering.** Nudging the priority does not
   help when the target is physically inside the wrong control's region.
2. **Capture the sub-widget on press and hold it for the whole drag.** The handler re-decided
   ring-vs-triangle on every `pointermove`, so a single gesture could hop between two controls.
   Any widget with two regions under one pointer handler has this bug until it doesn't.

## `preventDefault()` on pointerdown does not stop a scroll — only `touch-action` does

Layer drag-reorder worked with a mouse and failed with a pen. The drag handle called
`e.preventDefault()` and listened on `window`, which is enough for a mouse; but for a pen or a
finger, a drag down a scrollable list is a *pan gesture*, and the browser claims it and fires
`pointercancel` mid-drag. Only `touch-action: none` on the element declares "this gesture is
mine". The canvas had it. The panel, written later, did not.

Worth remembering because of how it presents: "works fine with the touchpad" reads like a
hardware or sensitivity issue and sends you looking at pointer events, when the fix is one CSS
line. **Any element with a pointerdown-driven drag needs `touch-action: none`, and
`setPointerCapture` so the moves keep arriving if the element re-renders underneath.**

## Prove the geometry before you go looking for the bug in it

The same report said Pathfinder results "unite at a different position". Three separate
plausible causes were read through and none held up. Rather than keep theorising, nine tests
pinned the whole chain — element → world polygon → boolean → path element bbox — across
rectangles, ellipses, editable paths and far-from-origin shapes. Eight passed immediately and
the ninth failed only on a 0.23px polygon-flattening tolerance, i.e. it was the test that was
wrong. That settled it in one step: the pipeline is position-preserving, and the visible symptom
was the Shape Builder repainting untouched faces with the wrong fill and changing the silhouette.

**A test that pins the invariant is cheaper than a fourth hypothesis, and it leaves something
behind.** It also produces an honest answer for the reporter — "the geometry is provably correct,
here is what actually moved" — instead of a fix that might be aimed at the wrong thing.

## Reported feature requests are sometimes discoverability bugs

"The tool selected should stay selected until the user selects another." The per-tool
`toolLocked` flag already existed and worked. The only way to set it was to open a tool group's
flyout and **double-click the item inside it** — double-clicking the visible toolbar button did
something else entirely — and it appeared in no help doc and had no hotkey. So a shipped feature
was, in practice, absent.

Same story for the colour wheel: it was reachable, behind two unlabelled 26px icon buttons that
sat directly under a grid of swatches and read as two more swatches. And for layer multi-select,
which existed but was reachable only by *swiping a row sideways* — a touch gesture, on a desktop
panel.

**A capability nobody can find is not a capability.** The fix in all three cases was mostly not
code: a default, a segmented control, a modifier key everyone already expects, and a help doc
entry.

## The licence decides the business model, and it decides it early

Collaboration is planned, with a server behind it, and the intended founder benefit was
"free access to the source". Two things were wrong with that, and only one is obvious.

The obvious one: the client's source is already free to everyone under the AGPL, so the
sentence means nothing unless it means the *server's* source — and source shared with 1,000
people is not confidential in any useful sense.

The one that would have cost real money: **a server that reuses client code is a derivative
work of an AGPL program, and §13 then obliges you to offer its source to every user who
interacts with it over a network.** Not to founders — to everyone who connects. The exclusive
benefit would have deleted itself, and the deletion would have happened silently, at the
moment someone imported the editor's document model into the server "just for the types".

So the rule is written down before the first commit exists (`docs/collaboration-plan.md`):
nothing under `frontend/src/` is imported by the server, not even types; if the two must agree
on a shape, the protocol owns it and each side declares its own. That is a constraint on
architecture, chosen by the licence, decided before any code was written — which is the only
time it is free to decide.

The benefit became free *hosted* collaboration instead: the feature ships free for everyone in
the AGPL app and is self-hostable by anyone, and what money buys is the server we rent. That
framing is also what let `support.freeForever` — "nothing in YappyDraw is behind a payment, and
nothing ever will be", shipped in five languages — stay literally true rather than needing a
retraction in five languages.

## A promise you may have to withdraw is worth less than a smaller one you can keep

The founder offer nearly said "free hosted collaboration", full stop. Against a ₹2,499 one-off
payment that is an unbounded recurring cost: 1,000 people, every month, indefinitely. The
smaller promise — a year free from launch, then a founder discount — looks like the worse offer
right up until you ask what happens when the bigger one has to be walked back. It gets walked
back from the people who paid earliest and trusted most, and it costs more than it ever earned.

Two details that came out of writing it down rather than deciding it:

- **The year runs from launch, not from purchase.** Otherwise someone who joins today spends
  their free year waiting for the feature to exist.
- **The page says the service does not exist yet.** A benefit a reader cannot use today must
  not be listed as though they can — especially above a payment button.

## A true number can still be the wrong thing to publish

The founders page opened with a progress bar reading **"1,000 of 1,000 founding places
remaining"**. Every part of that is accurate — the cohort is 1,000, none are taken, and the
figure carries the date it was counted. Read by a visitor, it says one thing: nobody has
bought this.

The counter was built with real care about honesty (see the header of `data/founders.ts`: no
number that moves on its own, always stamped with `asOf`). None of that care was spent on
whether the number should be shown at all, because scarcity displays are copied from products
that already have customers, where the same widget reads as momentum.

It is now behind `FOUNDERS.showCount`, off by default, to be turned on when `claimed` is high
enough to be worth showing. Nothing else changed: the sold-out state and the date stamp are
untouched, so turning it on later is one boolean and no new decisions.

The general form is worth keeping: *"is this accurate?"* and *"does this say what I mean?"*
are two different reviews, and passing the first is not passing the second.

## A page with nothing to navigate between should not ship a navigator

The same page carried the help sidebar — Basic Shapes, Connectors, Flowchart, UML — beside a
payment decision, because `buildPage` took a `nav` and every caller had one to give. A reader
deciding whether to pay had twenty links away from that decision in their peripheral vision.

The fix was to let `nav: []` mean *no sidebar* rather than *an empty sidebar*, and to drop the
search box with it, since it only ever filtered the sidebar and would otherwise have been a
control that visibly does nothing. Two conditionals in the shell; the founders page passes an
empty array.

The lesson is about shared page shells. A shell makes every page consistent, which is what it
is for, and it also makes every page the same page — so a chrome element ends up somewhere it
actively works against, and nobody notices, because it is simply what the template does. Worth
asking of any standalone page: which parts of this shell are doing a job here?

## `&` in a sed replacement is not a literal, and HTML is full of them

Three compliance pages were generated with a shell helper that set the title via
`sed "s|<title>.*</title>|<title>$2 — YappyDraw</title>|"`. Two of the titles contained
`&amp;`. In a sed replacement `&` means *the entire matched text*, so those pages ended up
with the whole matched `<title>` tag spliced inside their own title:

```
<title>Refund <title>Privacy Policy — YappyDraw</title>amp; Cancellation Policy — YappyDraw</title>
```

The page still rendered, the build passed, and the damage showed up only in the browser tab,
which is where the user found it.

Two things worth keeping:

- **Generating HTML with `sed` means every `&` in the content is a landmine**, and HTML entities
  are made of them. The same helper's heredoc-substituted heading was fine, because that is
  shell expansion rather than regex replacement. Use a real string replace when the content can
  contain regex-significant characters; `python3` was already in the pipeline.
- **The check that would have caught it is trivial and was not run.** One `grep -o "<title>.*
  </title>"` across the generated files shows the corruption instantly. After generating files
  mechanically, read one back before moving on — the cost is seconds and the failure is silent.

## The origin serving a page and a browser receiving it are different claims

`verify:deploy` had been green on `/help/` and `/learn/` for months, and it was telling the
truth: fetch those URLs and the origin returns the right HTML with the right canonical. What it
never checked is whether a browser asks the origin at all.

It did not. `navigateFallback: 'index.html'` meant the service worker answered every navigation
from its own cache, so every visitor who had been to the site before got the editor's app shell
instead of the documentation. The pages were correct, served correctly, and unreachable.

The failure hid behind a partial recovery. `/help/` has a client-side route, so the shell loaded
and the SPA rendered its own help page — working, and therefore never reported. Only `/learn/`
and `/founders/`, which have no such route, showed the canvas and got noticed. **A bug with one
visible face and three invisible ones will be reported as a bug about the visible one**, and
fixing what was reported would have left the other three exactly as they were.

The general form, which this codebase keeps rediscovering: **name the layer your check actually
exercises.** curl tests the origin. Only a browser tests the browser, and only a browser with
the worker *controlling* the page tests the worker. Everything between those layers — caches,
workers, redirects — is invisible to a check that skips them, and stays invisible for as long
as the check keeps passing.

## An allowlist in the middle of a pipeline discards things silently

`internal: true` was added to a document's front matter to keep it out of the published site.
The parser read it correctly. The filter that consumes it was correct. The page published
anyway, and the flag looked simply broken.

`renderHelpDoc` rebuilds its returned `meta` from an explicit list of known keys. Anything not
on that list is dropped without a warning, so the value existed on one side of the function and
not the other. Nothing failed; a key just stopped existing halfway along.

Two things worth keeping:

- **A transformation that enumerates what it keeps is a place data disappears.** It is usually
  the right design, because it stops junk front matter reaching the renderer. The cost is that
  adding a field means editing two places, and forgetting the second produces no error at all.
  A comment now sits at that object saying so.
- **The symptom pointed at the wrong layer.** The obvious readings were "the flag is not
  parsed" and "the filter is wrong". Both were fine. Printing the value at each hop found it in
  one step, where reasoning about it would have kept circling the two ends.

## A default copied into seven places is seven places to forget a setting exists

`canvasBackgroundColor` has been a real setting for a long time. Every non-slide exporter
wrote `ctx.fillStyle = '#ffffff'` instead of reading it, so a user who set a black canvas and
white text downloaded a blank white rectangle: the drawing was in the file, and none of it
could be seen.

Nobody made a decision to ignore the setting. The literal was written once, correctly, when
white was the only background there was, and then copied into each new exporter as the export
surface grew. Six copies later the setting existed and nothing consulted it.

Two things worth carrying:

- **The failure is invisible to the person who introduces it.** Every exporter was tested on
  a default document, where a hardcoded white and a read-the-setting white produce byte
  identical output. Only a user who changed the setting could see it, and only by exporting.
- **A repeated literal is a missing function.** The fix is one `documentBackground()` helper
  and six call sites. Had that helper existed from the first exporter, the setting would have
  been picked up by every later one for free.

The general shape: when a value appears as a literal in more than two places, ask what it is
the default *of*. If the answer is "a setting", the literal is already a bug waiting for
someone to change that setting.

## A verification that supplies the missing input cannot fail

Every check of the new `/founders/` page had been run as `set -a && . ./.env && set +a && npx
tsx scripts/prerender.ts`, because that was the convenient way to get the URL into the process.
It passed every time. What it was actually proving is that the page renders correctly *when
handed the variable by hand*.

The pipeline did not hand it over. `vite build` loads `.env` on its own; the prerender step is
a separate process and does not. A plain `npm run build` — the thing the deploy actually runs —
produced a bundle that offered the Founding Supporter option and a prerendered page that said
the programme was closed. Same build, two answers.

It surfaced only because the release sequence runs `npm run build` with nothing prepared, and
that difference is the whole lesson. **When a check needs setup to pass, ask which half of the
setup the real pipeline performs.** The sourcing was doing the pipeline's job, and it was
invisible precisely because it was in the command every single time.

This is the same shape as the `verify:deploy` failure recorded earlier: a check whose
surrounding conditions are all satisfied by the checker itself is decoration. The fix there was
to assert identity rather than consistency; the fix here is to run the command the deploy runs,
with no arguments, and read what comes out.

## A build that fails for a reason nobody owns stays broken

`npm run build` had been failing at the prerender step since the commit that added the Medium
article. Not intermittently — every run, for every release. It was noticed only because a
different task needed a build, and the first instinct was the wrong one: the error named the
article, so the article looked like the cause.

It was not. `readArticles()` globs every `.md` in every folder under `articles/` and requires
help-doc front matter on each. The file that actually broke it was the `README.md` sitting
beside the article, written for the humans who maintain the figures and never intended to be a
web page. Fixing the article alone would have left the build broken and the diagnosis wrong.

Three things worth keeping:

- **A/B before blaming your change.** Stashing everything and re-running took thirty seconds
  and moved this from "what did I just break" to "this has been broken for a week".
- **The file named in an error is where the check fired, not necessarily what is wrong.** Two
  files matched the glob; the error reported whichever came first.
- **A glob that means "the articles" and a glob that means "every markdown file here" are
  different globs.** An article folder is allowed to carry notes for its maintainers, so the
  reader now skips `README`, `CONTRIBUTING`, `NOTES` and `_`-prefixed files rather than
  requiring every future author to know this.

## Relative image paths are three different promises, and only one of them was kept

The article references its figures as `images/00-….png`. That single form is what lets one
file render on GitHub, paste into Medium, and work on the web — which is exactly why it is
written that way.

Publishing it at `/learn/` kept the first two and quietly broke the third. Nothing copied the
files into `dist`, so the flagship article would have gone live with all six figures as broken
icons, on the page whose entire argument is that the figures were drawn in the tool.

The prerenderer now copies each article's `images/` folder next to its rendered page. Two
details that matter more than the fix:

- **The bug is invisible in every check that does not fetch the asset.** The build passed, the
  page was 200, the HTML was correct, and the `<img src>` values were exactly right. What was
  missing was the file at the other end. `curl` on one image found it in a second.
- **Only browser assets are copied.** The `.json` DSL sources sit beside the figures and are
  worth keeping in the repo, but shipping them would add weight to every deploy for files no
  page requests. "Copy the folder" would have been the easy version and the wrong one.

## An unset variable should mean absent, not broken

The Support and Founders links come only from build-time environment variables, with no URL
committed as a default. That was not the first design: the URL was hardcoded initially, and it
had to come out once the question "what does a fork building from the public mirror ship?" was
asked. The answer was: a Support button that pays us. Removing the default fixed that, but it
moved the failure somewhere quieter.

So the behaviour is defined rather than left to chance. **An unset variable hides the feature
entirely** — the header button, the menu item, the command, the API call and the buy button on
`/founders/` all disappear rather than render something that goes nowhere. A missing button is
recoverable; a dead payment link on a launch day is not.

The cost is a failure mode with no error message, so it is written down in three places
(`config/support.ts`, `.env.example`, the help doc) in the same words: *if the Support button
is missing from a live build, the host is not passing the variable through to `vite build`.
Check that before looking anywhere else.*

## Rendering something is not the same as rendering correctly, and screenshots cannot tell

A close button measured **1.625px** wide. In the screenshot it read as a slightly faint icon,
which is the kind of thing you scroll past. `getBoundingClientRect().width` said what it
actually was in one call.

This is the second time this exact crush has shipped — the Layers panel row actions had it in
v0.8.222 — and both times the element was present, coloured correctly and reported visible.
The lesson is not about flexbox. It is that **the checks which catch this class of bug are
measurements, not images**: ask the page for a number and compare it to the number you meant.
A verification that a human eye has to adjudicate will be adjudicated generously.

## A crash inside a reactive read is not a bug in one control, it is a bug in the app

`paintColorIsMixed` read `sel[0].strokeColor` off a list filtered by the selection. When the
selected elements had just been deleted, that list was empty, and the throw did not blank the
Fill & Stroke swatch — it took the **whole editor** down to the top-level ErrorBoundary,
because the read happened inside a `title` binding. That is the property worth internalising:
**inside a reactive graph, the blast radius of a throw is the nearest boundary, not the
component you were looking at.** A one-line missing guard and a whole-app teardown were the
same defect.

It got worse because of what the teardown took with it. The document and the undo stack live
in a module-level store and survived perfectly; the *UI* did not, and the UI was the only
route to Ctrl+Z. The user's summary — "things cannot be undone using undo after this happens"
— was exactly right, and exactly recoverable: an **Undo last change** button on the error
screen undoes the offending edit and remounts, and the work comes back. Any app with a global
error boundary over a persistent store should have that button. Ordering is the whole trick:
undo *before* remounting, or the state that threw simply throws again.

The window itself is the more general lesson. `store.selection` holds **ids**, and removing
the elements it names was two writes:

```
setStore('elements', els => els.filter(...))   // gone
setStore('selection', [])                      // ...and now gone from the selection too
```

Solid runs effects **between** them. One frame of "the selection names elements that do not
exist" is enough, and every operation that consumes a multi-selection had it: Delete, all four
Pathfinder booleans, compound shapes, Shape Builder, Scissors, Distort. The fix that lasts is
not a `batch()` at each call site but moving the selection update *into*
`replaceElementsPreservingOrder`, so the two writes cannot be separated by anyone who forgets
the rule. **Make an invariant structural and it stops being a convention.**

## Seventeen identical copies of a wrong assumption

Every tool-group flyout carried its own `{ top: rect.bottom + 4, left: rect.left }` —
byte-identical across seventeen files, and correct only while the toolbar is docked left or
top. On the other two edges the panels opened off-screen entirely.

Two things worth keeping:

- **Duplication hid the assumption rather than the code.** Nobody would write "assume the
  toolbar is on the left" seventeen times; it survived because each copy looked like local
  layout arithmetic. When a constant is repeated verbatim in more than a handful of places,
  the thing to extract is usually not the code but the *decision* it encodes.
- **A placement helper must measure, not guess.** The panels range from a three-icon strip to
  a titled four-column grid, and a guessed width is exactly what leaves a wide one hanging
  over the edge. Publishing the position twice — an estimate at first paint, the measured
  position on the next frame — costs nothing visible and removes the whole class.

And a judgement call: clamping a panel back inside the window is not the same as placing it.
On a right-docked bar the clamp puts the panel *on top of the toolbar*, hiding the buttons it
belongs to. "On screen" was the bug report; "beside the bar, not over it" was the fix.

## "It is fixed" can mean "I could not get hold of it"

The Layers panel was reported as immovable. It had been draggable by its title bar since the
dock system shipped. Three separate things made the feature untrue in practice, and none of
them was the drag code:

- No `touch-action: none` on the handle, so on a touch-capable machine the dock zone scrolled
  instead. (`preventDefault()` on `pointerdown` does not stop scrolling. Only the CSS does.)
- No affordance. `cursor: move` is invisible until you are already on the bar.
- No clamp on the persisted float position — so a panel dragged past an edge, or reopened in a
  smaller window, put its title bar off-screen or behind the opaque top bar. **The handle is
  the only way to move the panel, so an unreachable handle is an immovable panel.**

The lesson is about reading feedback, not about panels: "feature X is missing" from a user is
often "feature X is undiscoverable, or fails silently in my configuration". Three of the six
reports in this batch were that shape — the single-side stretch and the independent W/H fields
also already existed. Checking before building is what left time for the one thing that was
genuinely absent (moving a single corner).

## A guide must not be the artwork it is guiding you to draw

The Pen showed you what you were drawing by drawing it — the element's own stroke *was* the
feedback. With the stroke set to None, which is what you do when the goal is a filled shape
with no outline, that feedback is nothing at all.

Construction chrome has to be independent of the object's paint, and the properties that make
it read as chrome are worth naming: a **hairline divided by the zoom** (so it never thickens
into artwork), a **white casing under the colour** (so it survives dark artwork), a **hollow
marker for the uncommitted point** (so preview and committed state are distinguishable), and
**disappearing the instant the gesture ends**.

A testing note that cost a cycle: the first spec counted guide-blue pixels over the whole
canvas and **passed on the broken build**, because the Pen had always drawn a blue square at
each anchor — around 380 pixels of it. What was missing was the line *between* them. Probing
segment midpoints — the places where only the fix can put ink — is the assertion that
distinguishes them. A pixel test that does not fail on the old code is not a pixel test.

## The modifier you already have tells you what the missing gesture should be

Ctrl/Cmd on a *side* handle already meant shear. So the missing "move one corner on its own"
had exactly one plausible spelling: Ctrl/Cmd on a *corner* handle. No new UI, no mode, nothing
to discover beyond what the shear taught already — the modifier means "deform rather than
resize", and the handle says on what.

Implementing it as a **2×2 projective envelope cage** rather than as new geometry is what made
it small. `getShapeGeometry` already applies `el.warp` to whatever geometry a shape has, so
rendering in both draw styles, hit-testing, SVG export and undo all came for free, and the
element keeps its type — no silent conversion to a path, which the menu-driven envelope
command does have to do for node editing. *Projective* rather than the default bilinear map
because pulling one corner of a quad is a perspective change; bilinear bows the two adjacent
edges instead of keeping them straight.


## The cheapest 3D is a height field, and the artefact is always the medial axis

Inflate — a flat shape puffed into a lit, rounded body — needs no 3D engine and no geometry.
Rasterise the silhouette, distance-transform it, map distance to height through a dome, and
differentiate for a normal. One light shades it. The whole effect is one raster pass over the
element's own box, which is the same shape as the mesh and pattern rasterisers already in the
codebase — so it dropped into the slot those occupy and got render-style parity, page
clipping, PNG export and the SVG `<pattern>` path without any of them being touched.

The one thing that will bite anyone doing this: **a distance transform creases along the
shape's medial axis**, and differentiating a crease gives a hard ridge. The first working
version drew a starburst out of the middle of every blob. Blurring the height field before
differentiating removes it completely, and costs nothing that matters — the silhouette comes
from the mask, not the field, so the form can be smoothed as much as it likes without the
outline moving a pixel.

Two smaller ones from the same afternoon:

- **`Math.hypot` is roughly an order of magnitude slower than `Math.sqrt(a*a + b*b + c*c)` in
  V8.** In a once-per-pixel loop over a 384px buffer that difference was most of the cost of
  dragging a slider: 115 ms a frame became 84 ms by changing one line.
- **A full-strength Blinn-Phong highlight on a 2.5D fake reads as blown-out plastic.** The
  first render clipped to white and ate the object's colour. Holding the specular to just over
  half keeps the sheen and gives the albedo back. Physical correctness was never the goal;
  the goal was that a mango looks like a mango.

## Light that belongs to the object is light in the wrong place

The shading buffer is built in element-local space and drawn inside the element's own rotation,
which means the naive version rotates the highlight with the artwork. Turn a shape and its
lit side turns too — and a page of inflated objects stops reading as one scene, because every
object has its own private sun.

Subtracting `el.angle` from the light angle fixes it in one line, and it is the sort of thing
that is nearly invisible when right and unmistakable when wrong. Worth asking of any
appearance effect that lives in element space: *does this belong to the object, or to the page?*
Shadows, gradients-on-rotated-shapes and highlights all have to answer it, and the answer is
not always the same one.

## Two rules for the same question is one rule too many

"Which page is this element on?" had two answers in the codebase. Ownership — used by save,
export and animation builds — took the element's centre point. On-canvas visibility took an AABB
overlap with the active page. Both were defensible in isolation. Together they meant an element
hanging over a page edge was *owned* by one page and *drawn* on two, which is what a user saw as
"the same element is on both pages, and deleting it from one deletes it from both".

The bug is not in either rule. It is in there being two of them, in different files, neither
naming the other. The fix was to write the question down once — `ownerSlideIndex` — and make the
renderer, the three exporters, the thumbnail capture and the hit test all call it.

Worth noticing how it stayed hidden: each rule was individually *correct for its own caller*,
and the comment above the overlap test even explained why overlap was the right choice there
(so a drag doesn't make its subject vanish). Nothing was sloppy. The failure was that a
requirement — "don't hide the thing being dragged" — had been encoded by loosening a definition,
when it should have been an explicit exemption for the thing being dragged. Loosening the
definition is what leaked to everything else that used it.

## If the editor doesn't match its own exporter, one of them is a bug

`exportPageToPng` had clipped artwork to the page bounds since it was written. The canvas never
had. Nobody noticed for a long time because the two are only comparable if you export and
compare, and the difference only shows on artwork that overhangs a page edge.

That is a cheap invariant to check deliberately and a very hard one to notice by accident. When
a feature has a "render for the screen" path and a "render for the file" path, the screen one is
the draft and the file one is the specification — the file is what the user actually keeps.
Where they disagree, port the exporter's rule to the screen, not the other way around.

(It also gave the fix its shape for free: the exporter already knew the answer, so "clip to the
page" was not a design decision to be agonised over. It was catching up.)

## Translate a panel by the block a user can see, not by the file you happen to be editing

Shipping the Inflate effect added twelve hardcoded English labels and moved the i18n ratchet's
baseline to let them through. The obvious repayment was to translate Inflate. That would have
been worse than leaving it: Extrude and Turntable sit directly above and below it in the same
panel, so one German section between two English ones reads as a rendering bug rather than as
progress.

Translated as one block instead — sixty keys across all three effects — the ratchet went
1508 → 1476, which repays the twelve and clears twenty of the debt that was already there.

The unit of translation is what a user sees at once. A file is a unit of *editing*, and the
two rarely coincide.

## Terminology has a right answer, and it is in the localised product you are imitating

These effects mirror Illustrator's. Illustrator ships in German, Spanish and Japanese, and its
translators already settled every term: Bevel is `Abflachung` in German (from *Extrudieren und
abgeflachte Kante*), `Bisel` in Spanish, `ベベル` in Japanese; Expand is `アピアランスを分割` in
Japanese, which no dictionary or machine would produce from the word "Expand".

A user who knows the effect from Illustrator recognises `Abflachung` immediately and would
stumble over a literal-but-correct alternative. Machine translation optimises for faithfulness
to the English sentence; what a UI needs is faithfulness to the reader's existing vocabulary.
Where a term has a settled translation in the tool being imitated, that is the translation —
look it up rather than generate it.

## "It did not change" is not the same as "it does not work"

After wiring `t()` through the panel I set the locale at runtime and the titles stayed English,
which looked like the wiring had failed. It had not. Asking the module directly —
`t('effects3d.inflateTitle')` → `AUFBLÄHEN (3D)` — showed the dictionary was loading fine, and
that the already-mounted tree simply had not re-rendered for a locale set from outside the
app's own flow. A reload, which is what the language switch actually does, showed all three
sections in German.

The diagnostic that separated the two was cheap and I nearly skipped it: check whether
*something known to work* also failed. The status bar, translated three releases ago, was
still English too — which pointed at the locale switch rather than at my change, in one call.
When a change appears not to take effect, test a control you did not touch before you go
looking through what you did.

## An exemption is a deferred bug unless you fix what made it dangerous

Nine shapes were fitted to their bounding boxes. Two kinds could not be — a puzzle piece whose
tabs stopped at the box would not interlock, a 3D solid's depth is drawn beside its front face
— so they were exempted with reasons, which felt like the honest thing to do.

It was honest about the geometry and silent about the consequence. The reason the overflow
mattered in the first place was that the buffer-backed fills size themselves to the element's
box, and that was still true. The exemption did not remove the bug from those shapes; it
removed them from the test that would have caught it.

The fix was to attack the assumption instead of the shapes: `fillBufferRect` sizes a fill from
what the geometry actually occupies. Now overflow is *safe* rather than *documented*, and the
exemption list stops being a list of known-broken shapes.

Worth asking whenever an exemption gets written: **is this shape exempt from the rule, or
exempt from the fix?** The first is fine. The second is a bug with paperwork.

## Slack that protects against noise must not also eat signal

Sizing a fill buffer from a shape's real extent needed a tolerance, because path coordinates
are rounded to three decimals and a ten-thousandth of a pixel of overflow should not resize
anything. The first version subtracted half a pixel from every extent.

That also took half a pixel off *genuine* overflow — so the puzzle piece's buffer came out
just short of its own tabs. The bug being fixed, reproduced inside its own fix, at 1/90th the
scale.

The correct shape for this is a threshold, not an offset: ignore overflow below the tolerance
entirely, and where it is above, honour all of it. `if (overflow > SLACK) use extent else use
box` — never `extent - SLACK`. The same distinction applies to any epsilon that guards a
comparison: subtracting it from the value is not the same as excluding it from the decision.

## Do not read a fill off a screenshot when the background is transparent

I called this fix working, then broken, then broken again, entirely from looking at pictures
of a checkerboard-patterned puzzle piece whose tab appeared half empty. The checker pattern's
default background is transparent. A correctly filled tab and an unfilled one look identical.

One canvas read settled it — sample along the tab's centre line with an *opaque* pattern, and
every pixel from the box edge to the tip comes back as pattern. Thirty seconds of measurement
against several rounds of confident wrong conclusions, in a session where I had already
written down that a confidently wrong measurement is worse than none.

The rule that generalises: when checking whether something was *drawn*, the test has to make
"drawn" and "not drawn" different colours. Otherwise the screenshot is a Rorschach test.

## Fixing the instance leaves the class, and the class is usually bigger than you think

The cloud drew outside its own bounding box. That got fixed as a cloud problem, with a cloud
test. An audit afterwards found **eight more shapes with the same defect** — `lightbulb` and
`magnet` each about 15% outside — sitting there waiting to be reported one at a time as
separate mysteries, because the symptom (a pattern fill stopping in a flat line) does not
resemble the cause (a geometry function) at all.

None of them had been reported. That is the point: the class was invisible, not absent.

The tell that a bug has a class behind it: the fix was in a *shared assumption* rather than in
one piece of logic. "The shape fits its box" is something thirty other shapes also assume and
nothing was checking. When a fix looks like that, the next question is "what else believes
this", and the answer is worth measuring rather than guessing.

Two shapes turned out to be outside their box **on purpose** — a puzzle piece whose tabs
stopped at the box would not interlock — so the gate carries an exemption list where each entry
has to state its reason. An exemption with a reason is a decision; an exemption without one is
where the next bug hides.

## A measuring tool that is confidently wrong is worse than no tool

The first draft of that audit was a throwaway script, and it reported the `cylinder` as **562%**
oversized. The cylinder is fine. Its arcs carry a 90° x-axis-rotation, my sampler ignored that
parameter, so it measured a completely different ellipse. Two of the other numbers were wrong
by a factor as well.

I nearly handed that over as a list of regressions. What saved it was that 562% is not a
plausible number for a shape rebuilt to be inscribed in its box two releases earlier — the
result was too extreme to believe, so it got checked by hand against the shape's own emitted
path, and the tool was the thing that was broken.

Worth generalising: **an audit's own correctness has to be established before its output is
allowed to mean anything.** The version that shipped has eight tests of the sampler itself —
arc rotation, both arc flags, the F.6.6 radius correction, the reflected control point of a
smooth curve — and they run first. A result that only *looks* right is indistinguishable from
one that is right, until something forces the difference into the open.

The corollary is a nice one: after those tests passed, the audit's numbers for `lightbulb` (50px)
and `magnet` (45px) matched hand calculations from the raw path data exactly. That agreement is
what made the remaining seven believable without checking each one by hand.

## A shape that draws outside its own box breaks only the things that measure it

The cloud's scallops bulged past the element's declared bounds by up to 41% of the height, and
for a long time nothing noticed. Everything that *draws* the cloud draws the path, and the path
was right. What broke was every consumer that trusts `width` x `height` to be the truth: the
pattern, mesh and image fills, which rasterise a `w x h` buffer and then wonder why the shape
extends past it (the clip was correct; the buffer simply ran out, so the fill stopped in a dead
straight line at the top of the box while the outline kept going), and the selection handles,
which drew a rectangle through the middle of the shape.

Solid fill was the one style that looked fine, which is what made the report read as a fill bug.
It was the only style with no buffer. **When one variant of a feature works and the rest don't,
ask what the working one skips rather than what the broken ones do wrong.**

The check that would have caught it is not "are the path's points inside the box" — that test
already existed and passed. It is "is the *drawn shape* inside the box", and for arcs those are
different questions by a quarter of every chord.

## Write the verification a different way from the code, or it verifies nothing

Fitting the cloud to its box needed the true extent of a chain of SVG arcs. The production code
solves for it analytically: reconstruct each arc's centre, then add whichever of the four axis
extremes the arc sweeps through. The test *samples* 64 points along each arc instead.

That difference caught two bugs the analytic version had, both of which a shared helper would
have hidden:

- The radius rule carried an absolute floor, `Math.max(0.5, chord * 0.62)`. Harmless in pixels —
  no real chord is under 0.8px — but the fit solves in a normalised box where every chord is
  around 0.3, so the floor caught *every* arc and the solver quietly optimised a rounder cloud
  than the one being drawn. **A constant that is "obviously small" stops being small the moment
  something normalises the units around it.**
- The angle test normalised only in one direction (`while (t < 0) t += TAU`). `a - a0` ranges
  over -pi to 2.5pi, so a value past `2pi` was never brought back down, and the single widest
  bump on the shape went unmeasured.

Both produced a *plausible* answer — a cloud, correctly shaped, slightly the wrong size. Nothing
throws. Only an independent measurement disagrees.

## "The icon is too small" is often "the icon is being crushed"

A report that the layer tray's icons looked tiny inside big buttons turned out not to be a
size problem at all. The global `button { padding: 0.6em 1.2em }` left a 44px border-box
button with 5.6px of content, and an `<svg>` is a flex item with `flex-shrink: 1` — so a 20px
icon rendered at **5.6 x 20**, a sliver. Changing the icon's `size` prop would have done
nothing.

Two habits from it:

- **Measure the rendered box, not the declared one.** `getBoundingClientRect()` against the
  svg's own `width`/`height` attributes turns "looks wrong" into a ratio, and the ratio names
  the cause. Here it also made a whole-page sweep trivial: every icon rendering under 75% of
  its declared size — which found no others.
- **An icon-only button must opt out of text-button padding**, and belt-and-braces
  `flex-shrink: 0` on the icon so the next global rule cannot re-break it. A width without a
  matching padding override is the trap.

## A stale service worker will out-argue your dev server

Twice in one session, in two different repos: code changed, `vite dev` served the change
(confirmed by `curl`), and the browser kept rendering the old thing through hard reloads and
cache-busting query strings. Both times an earlier production build had left a service worker
registered on that `localhost` origin.

```js
(await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister());
for (const k of await caches.keys()) await caches.delete(k);
```

Worth reaching for **early**, not late, whenever the browser and the source disagree — the
failure mode looks exactly like a broken change, and the second time it cost me a round of
doubting a fix that was already correct.

## Shared state is what lets a distant component break yours

HTML5 drag-and-drop hands every listener on the propagation path a handle to the same
`DataTransfer`. That is the whole reason #323 was possible: a global image-drop handler in
`app.tsx`, which knows nothing about layers, could set `dropEffect = 'copy'` on a drag that had
declared `effectAllowed = 'move'`, and the browser answers that combination by refusing the
drop with no event at all. The panel's own code was correct throughout.

The first fix was an exemption — mark the panel, have the global handler skip it. That works
until the next global handler forgets, which is the same shape as the CSS-class contract that
caused the bug in the first place.

The second fix removed the shared state: reordering is a pointer drag now, with its own
listeners on the window and nothing handed to anyone else. Nothing can invalidate it from a
distance because there is nothing to reach.

Worth recognising the pattern. When a bug's cause is *"another component changed our state"*,
an exemption makes this instance work and leaves the mechanism in place. Ask whether the state
needs to be shared at all — often a platform API is shared because the platform is generic, not
because the feature is.

## Port the transport, keep the semantics — then a regression can only be one of them

Swapping drag-and-drop for pointer events could easily have become "and while I'm here, add
above/below drop indicators", which is a genuine improvement and what happypaint does. It would
also have meant that any misbehaviour afterwards had two candidate causes.

`applyDrop` is the old `handleDrop` body verbatim — grouping mode, the root drop zone, the
reversed-index arithmetic. Only how the two ids are gathered changed. If a reorder goes wrong
now, it is the transport, because nothing else moved. The drop-indicator improvement is still
available, as its own change, with its own before-and-after.

## A CSS class used as a behavioural hook is a contract nobody can see

Layer reordering was dead: dragging a layer's grip gave a no-entry cursor and no `drop` event.
The panel's own drag code was flawless. The culprit was `app.tsx`'s global image-drop handler,
which forces `dropEffect = 'copy'` on every drag — and `copy` against an `effectAllowed` of
`move` is an illegal pair, so the browser refuses the drop outright rather than failing visibly.

That handler *had* an escape hatch: `closest('.slide-navigator, .layer-panel')`. It had rotted.
The layer panel was re-homed inside the generic dock-panel wrapper and its `.layer-panel` div
went with it, so the selector matched nothing — and nothing anywhere says that deleting that div
disables layer reordering. Slide reordering kept working, because `.slide-navigator` survived,
which made the failure look layers-specific and hid the shared cause.

Two things worth keeping:

- **If a selector is load-bearing for behaviour, put it there on purpose.** `data-internal-drag`
  is set by the panel that needs the exemption, so it moves when the panel moves. A styling class
  is not a contract; an attribute named after the behaviour is.
- The obvious alternative — sniff the drag's own type instead of its location — does not work
  here: a layer drag and a colour-swatch drag both carry nothing but `text/plain`. Worth checking
  before reaching for "ask what it is, not where it is".

(happypaint's layer panel avoids the whole class of problem by doing pointer-based drag rather
than HTML5 DnD — no `DataTransfer`, so no global handler can contradict it. Worth considering if
this bites a third time.)

## A feature nobody can reach is indistinguishable from a missing one

"In Yappy you cannot leave paths open" was filed against a Pen that had supported open paths for
months — Enter, Escape and double-click all finish one. What it did not have was a way to do it
*with a stylus in your hand*. All three exits are keyboard-or-timing gestures, so from inside the
actual drawing posture the feature was invisible, and the user did the rational thing: drew the
curve with a liner brush instead. That choice then propagated — a brush stroke is not a path, and
it showed up as garbage the moment the drawing was fed to the Shape Builder.

The lesson is not "add more shortcuts". It is that **a capability is only as reachable as its
least-convenient input mode**, and the mode to check is the one the task is actually performed in.
A drawing tool needs a pointer gesture for every state transition, not just a keyboard one. The
same audit is worth running on any tool with a modal "I am building something" state.

Second-order: the new gesture *keeps the tool selected*, where the three old ones drop to
Selection. That difference is invisible in a single test case and dominates the real workflow —
drawing eight open curves in a row is one gesture instead of eight tool re-picks.

## `stopPropagation` does nothing between two listeners on the same element

Point-level undo needed Ctrl+Z, while the Pen is building, to mean "drop the last anchor" rather
than "undo the document". The obvious implementation — claim the key in the Pen's own window
keydown handler and stop propagation — passed review and failed in the browser, because *both*
handlers are capture-phase listeners on `window`. Propagation is about the capture/bubble journey
between *targets*; two listeners on the same target both fire regardless, and the only thing
separating them is registration order, i.e. component mount order.

`stopImmediatePropagation` does fix it, but it fixes it by winning a race that should not exist:
the behaviour still depends on which component mounted first, and it silently swallows every
other listener too. What actually holds up is inverting the dependency — a one-function registry
(`utils/point-undo.ts`) that the global shortcut **asks** before acting. There is one handler for
the key, it makes one decision, and "is a tool mid-construction" is a question with an answer
rather than a race.

## A "reasonable fallback" becomes the default path if nothing better runs first

`shapeToPath` sampled outlines at 96 points and simplified with Ramer–Douglas–Peucker. That is a
sound last resort for geometry you cannot introspect — and it was reached by *every* arc-based
shape in the app, because the exact cases above it only covered rect/ellipse/points. Curves came
back as polygons for years, and the fix required no new maths at all: `parsePath` had already been
taught to lower `A` to cubics for an unrelated bug, so an exact anchor+handle form was sitting
right there unused.

Worth asking of any fallback branch: *what fraction of real input reaches it?* A fallback that
handles 80% of traffic is not a fallback, it is the implementation, and it should be held to that
standard. Ours was documented in the file header as the thing that happens to "arbitrary" geometry
— which is how it stayed invisible.

## Geometry that only feeds the clip is still geometry someone will read

The `database` shape's fill outline had closed its top with the arc *under* the cap while the
renderer filled the whole cap. Nothing visibly broke, because the only consumer was the fill clip
and the error was in the direction that clips *less*. Then Convert to Path started reading the same
function and handed back a barrel with its lid sliced off — and re-reading it, gradient/pattern/
image/hachure fills and hit-testing had been wrong at the top of every database all along.

`getShapeGeometry` is a public description of what the shape *is*, not a private helper for
clipping. When a renderer and a geometry function both draw the same shape, the geometry is the
one that gets reused, and any place they disagree is a bug waiting for its second consumer.

The related trap: geometry that is deliberately *incomplete*. The database's cap is a real,
visible part of the shape that the fill outline correctly does not contain. Converters had no way
to know it existed, so it silently vanished. Decoration a renderer draws outside the fill outline
needs to be published somewhere (`shapeDecorationSubpaths`), or every consumer re-derives it or
loses it.

## Anything included in a bounding box is a framing decision, not just a content one

A hidden layer leaking into exports sounds like a content bug — "my hidden stuff shows up". The
report was about **framing**: "the image is exported as a small object in far left". The export
crop is the union bounding box of what gets exported, so one stray object parked far out on a
layer the user had switched off precisely so they would not have to look at it was enough to blow
the box up and push the drawing into a corner.

Two general shapes here. First, **every filter that decides "what is in this export" is also
deciding "how is it framed"**, and the framing symptom is louder and less obviously connected to
the cause. Second, the canvas renderer and the exporters had *different* visibility rules —
the canvas skipped hidden layers per bucket, `isExportable` only looked at the element flag. Any
time "what you see" and "what you get" are computed by two different predicates, they will drift,
and the drift shows up as something that looks nothing like a visibility bug.

## Give the shape the parameter before people simulate it with a converted path

The reason a `database` was being converted to a path and node-dragged at all was that nobody
could make a cylinder narrower at the top than at the bottom. The request arrived as "convert to
path should preserve X" — a request about the *workaround*, phrased entirely in terms of the tool
they had been forced into. Both halves were worth fixing, but only one of them removes the reason
for the detour: a `taper` on the cylinder, which stays live and editable where a converted path
does not.

When a report describes a laborious multi-step route, it is worth separately asking what the
one-step route would have been. The workaround is evidence of a missing parameter, and users
almost never file the missing parameter — they file friction in the workaround.

## A shape's bounding box is a promise about the whole solid

The cylinder's box sized its *cap ellipse* and left the barrel to a separate clamped `depth`.
Every individual line of that was defensible, and the result was a shape where dragging the
height handle made the cylinder flatter. Users don't read a shape as "an ellipse plus an
extrusion" — they read the box as the silhouette, and every resize gesture is a statement about
the silhouette. Any parametric shape whose box does not bound the finished thing will feel broken
under resize no matter how good the parameters are.

The corollary is where the parameters should live. Cap foreshortening had to be a ratio of the
*radius* (a property of how the circle is being viewed) rather than a fraction of the box height,
because only then does the cap stay put while the pillar grows. When a parameter is defined
against the wrong dimension, it survives every static test and fails the first drag.

## Two clean cases and a blend is not the same as solving the problem

Getting a cylinder right at 0° and 90° is easy; the tempting move is to interpolate the two
axis-aligned answers for the angles in between. That blend put the cap radii above what the box
could hold at 40°, the clamp ate the entire barrel, and a "tilted cylinder" rendered as a bare
ellipse — a case that only exists between the two endpoints anyone thinks to check.

What worked was writing down what the box actually constrains. A cap is the cross-section circle
turned by the axis angle, so its axis-aligned half-extents are `r·A` and `r·B`; requiring the two
caps plus the barrel to fill the box is then two linear equations in the radius and the barrel
length. Solve them, keep a fallback for the genuinely degenerate case (a diagonal axis in a square
box is under-determined — infinitely many tubes fit), and every angle is correct rather than
interpolated. The solved version was also *shorter* than the blend, and it deleted a tangent
calculation entirely: in the tube's own frame the barrel meets each cap at its ±r poles, no
tangent solving needed.

## Hidden-line removal is what makes an unfilled solid read as solid

The old cylinder drew both cap ellipses in full. With a fill you never notice; with a transparent
fill you see two crossed ovals, which is what the bug report's screenshot showed. Painter's
algorithm only hides things behind *opaque* faces, so a shape that is expected to work unfilled
has to decide which strokes exist, not just which order they paint in.

Two strokes had to go: the far cap's near half (behind the barrel) and the barrel quad's end
edges (chords through the cap centres, not edges of anything). That needed a `noFill` face flag
next to the existing `noStroke` — fill and stroke are separate decisions per face, and a geometry
system that only lets you suppress one of them forces you to draw lines that aren't there.

## A duplicate key in a config list is a silent scope reduction

`properties.ts` declares one entry per property, and `supportedSelection()` looked it up with
`.find()`. The moment a property needs two entries — same key, different label/range/default per
shape family — every shape covered only by the second entry stops receiving writes. No error, no
warning; the control renders and does nothing. `renderStyle` had been duplicated for a while and
had this latent. If a lookup over a config list uses `.find()` where the list permits duplicates,
it is not a lookup, it is a bug waiting for the second entry.

## A more specific menu should prepend itself, not replace the menu

Long-press on a path anchor opened a path-editing menu — convert / delete / insert point,
constrain handles. It was wired in as `anchorMenu ?? elementMenu`, and that `??` quietly removed
Ungroup, Pathfinder, Arrange and Copy from the app for as long as the press happened to land on a
path. On an outlined word the path *is* the press target, so the failure was the common case, and
on a tablet there is no `Ctrl+Shift+G` behind it (bug #306).

The tell is that it never looks broken. A menu that opens and shows four sensible items reads as
"this is the menu here", not as "something was taken away" — so the bug arrives as *"Ungroup is
not available in some cases"*, from the user, weeks later.

The rule that falls out: **context-sensitive items are additive.** The specific builder knows what
it wants to add; it cannot know what the user opened the menu for. Lead with the specific actions,
separator, then the full menu underneath. The only thing needing care is the seam — trim
separators on both sides of the join so a menu that already ends (or starts) with a rule doesn't
draw two.

Same shape as any override that replaces a default wholesale: a specialised handler that returns
instead of falling through is a decision made on behalf of a user whose intent it never saw.

## A lowercased key turns every bare-letter branch into a shortcut shadow

`const key = e.key.toLowerCase()` is the right call once, at the top of a keydown handler — and
it quietly makes `if (key === 's')` match **Shift+S, Ctrl+S and Alt+S as well**. In a long
`if / else if` chain, a bare-letter branch therefore shadows every modified variant of that letter
placed below it. The modified branch still compiles, still reads correctly, and never runs.
Shift+S sat unreachable behind the stroke-style cycle this way (bug #300).

What makes it expensive to find is that the symptom lands on the *wrong feature*. Stabilization
looked broken. The stabilizer was fine; the key never reached it. Nothing in the code near
`togglePenStabilization` is wrong, so that is the last place you look.

Two rules that would have caught it:

- **Order by specificity, not by theme.** More-modified branches go above less-modified ones for
  the same key. The chain already did this for `f` (`key === 'f' && e.shiftKey` sits above bare
  `key === 'f'`) — a convention applied in one place is not a convention.
- **A bare-letter branch in a lowercased chain needs an explicit `!e.shiftKey`**, even when no
  Shift variant exists yet. It costs nothing and it is the difference between the next Shift
  binding working and being silently dead on arrival.

The general form: **normalising an input widens every comparison made against it.** Anywhere a
value is canonicalised once and then matched many times — lowercased keys, trimmed paths,
case-folded ids — the match arms get more permissive than they look, and the first arm wins.

Worth noting how it surfaced: not from clicking around, but from driving the app externally and
**reading state back** (`getPenStabilization()` after each press). A human pressing Shift+S sees
the stroke style change and reads it as "wrong shortcut", not "unreachable branch". An assertion
on the value you expected to move names the bug immediately.

## Turning a constant into a setting is a search problem, not an edit

`fontSize * 1.2` was the line height, written out at eleven sites: renderer, three measurement
helpers, outlines, rich-text layout, typewriter animation, two editing overlays, two export
branches. Every one was correct while it was a constant. The moment it became a setting, each
missed site turned into a visible disagreement — the caret sitting between the lines it is
supposed to be on, or an export that doesn't match the screen.

So the first move on "make X configurable" is not to add the field, it is to **grep for every
literal of the current value and give them one owner**. The helper is the deliverable; the
setting is a consequence. Two traps this time, neither caught by the compiler:

- **A memoisation key.** The container-text measurer caches on text+font+width+type+tracking.
  Adding a new input to the computation without adding it to the key makes the new control look
  broken in exactly the confusing way — works on a fresh element, inert on an existing one.
- **Widening a type is not passing a value.** Rich text and SVG export build a `defaults` object
  and hand it to the layout function. Adding `lineHeight?` to that parameter's type compiled
  clean and changed nothing, because the four call sites still built the object without it. The
  end-to-end check found them; TypeScript could not, since the field is optional.

The general form: **an optional field threaded through a plain object is invisible to the type
checker at exactly the places that matter.** Either make it required at the boundary, or verify
by measuring output rather than by reading code.

## A bug that is exactly zero in the common case is a bug you will ship

Re-normalizing a path's bounding box moves the element's centre, and rotation happens about that
centre — so every untouched anchor drifted by `(I − R)·Δ`. At 0° rotation that term is *exactly*
zero, so every unrotated test, screenshot and manual check agreed the code was fine. It only
appeared once someone rotated the shape, and it grew with the angle.

The pattern to watch for: **a transform whose error term vanishes at the identity.** Rotation at
0°, scale at 1, opacity at 1, an empty selection, a single-element group. Those are precisely the
values everything is tested at. When code combines a transform with a change of reference frame
(a bbox, an origin, a pivot), test it at a *non-identity* value of that transform or you have
tested nothing about the interaction.

This was the third bug of the same family in one session — flip mirrored the shape but not the
anchors, and both bbox normalizers ignored rotation. The common shape is a **frame of reference
that some code paths know about and others don't**: renderer vs overlay, geometry vs centre. When
you find one, grep for the other places that convert between the same two frames.

And a testing note: the first version of the unit tests failed against *correct* code, because
the test modelled anchors as fixed world points when the app stores them relative to the origin.
A test that mirrors a wrong mental model will happily indict working code — when a fresh test
fails, suspect the test's model of the system before the system.

## Give the data to whoever already gets serialized

Naming a group had nowhere obvious to live, because a group is not an entity — just an id its
members share. The tidy-looking option was a `groupNames` map on the store; the cheap one was a
map on each member. Tidy would have meant registering the new slice in `captureSnapshot`,
`restoreSnapshot`, `buildSlideDocument`, `normalizeDocument` and the exporters — five independent
places, each of which silently degrades a different way when missed (a name that survives undo but
not save; survives save but not copy-paste).

**Prefer hanging derived-ish state off an entity that is already carried everywhere over adding a
new top-level slice**, unless the state is genuinely document-scoped. The redundancy (every member
storing the same string) is the price, and it is small next to five serializers staying in sync
by hand. It also gets the semantics right for free: copy a group into another drawing and its name
comes along, because the name is *in* the artwork.

The counterweight, which cost a bug: state attached to an id must be cleaned up when the id goes
away. `groupIds` come from a counter that **reuses ids**, so a leftover entry didn't stay inert —
it re-attached an old name to a brand-new group. When you key data by an id, ask who deletes it,
and whether that id can ever come back.

## Check the feature exists before building it — and check the panel, not just the menu

Asked for "a way to control how much an arc or wave bends", I searched the context menu and the
scripting API, found the bend only in the API, and reported it as missing UI. It wasn't: a full
WARP PRESET section — preset dropdown, −100…100% live Bend slider, Bake, Remove — had been
sitting in the Properties panel the whole time. The user couldn't find it either, which is the
actual problem, but my triage was wrong in a way that would have wasted a build.

Two habits from that:

- **Grep the surfaces a user can reach, not the one that fits your hypothesis.** Context menu,
  properties panel, toolbar, command palette, keyboard map. A feature living in a panel is
  invisible to a menu-only search, and the panel may be *closed by default* — which is exactly
  why it was invisible to the user too.
- **"It exists" and "it's discoverable" are different findings**, and only the second was really
  being reported. The fix was a toast that names the control on first use plus help-doc text
  saying where it lives — not a slider.

An undo bug fell out of writing that documentation: describing the slider's behaviour ("one undo
step per drag") meant checking it, and it wasn't true. **Documenting a feature carefully is a
test of it** — prose forces claims specific enough to be wrong, which is more than a passing test
suite was doing for that path.

## A flag that reaches the function is not a flag the function uses

The pen tool already had `e.shiftKey` plumbed all the way into its move handler. It just happened
to be read in only one of the two branches — so Shift shaped Bézier handles and did nothing to the
segment being drawn, and the sibling entry point (`penOnDown`, the one that actually commits the
anchor) never took the parameter at all. From outside it looked wired; from the user's side the
feature was missing.

The tell is a parameter consumed under a conditional: **if a modifier is read inside one branch,
ask what the other branch does with it, and whether every entry point that can act on the gesture
receives it.** The preview and the commit are two such entry points, and they must agree — a
rubber-band that shows an unconstrained line and then snaps on click is worse than no constraint.

Related: when one modifier legitimately means two things (here 15° for segments, 45° for handles),
check the gesture states are genuinely disjoint. These are — one is mid-drag, one is between
clicks — so there is no mode to switch and nothing to explain beyond "it depends whether the
button is down".

## A transform that only exists at render time is invisible to everything that isn't the renderer

`flipX`/`flipY` mirror an element by wrapping its draw in `scale(-1, 1)`. Cheap, correct on
screen — and completely unknown to the anchor overlay, the anchor hit-test, node editing,
pathfinder, offset path and SVG export, all of which read the stored geometry raw. Flip a pen
path and the outline mirrored while its anchors stayed on the un-mirrored ghost, because only
one of those consumers had been taught the trick.

The general shape: **state that lives in the render path is only true for the render path.**
The tell is a field consumed inside a draw call but not by the geometry the rest of the app
reasons about — and the symptom is always "it looks right but behaves as if it were somewhere
else". The same class already bit us with rotation, which is why the overlays carefully
un-rotate the pointer; flip was the sibling nobody added.

Two things that fell out of fixing it:

- **Prefer baking the transform into the data** when the data is the interface. `flipX` is right
  for a rectangle (there is nothing to bake) and wrong for a path (there is, and everyone reads
  it). Deciding this per-element in one shared helper is what keeps the two callers —
  Flip and Mirror Copy, which had drifted into duplicate logic — from diverging again.
- **A fix can heal existing documents.** Folding the stale flag into the geometry on the next
  flip (mirror the data only when the flag wasn't already set, then clear it) is visually a
  no-op, so old drawings quietly repair themselves instead of needing a migration.

And a testing note: to check "the handles are on the shape", assert against the **painted
pixels**, not against the model — the whole bug was two code paths disagreeing about the model.
Sampling the canvas around each anchor caught it, and re-creating the broken state proved the
probe could actually fail (it found no stroke within 12 px). A green test that cannot go red
verifies nothing.

## One sample is not a measurement when the thing you're measuring can differ per request

I checked the live site after a deploy, saw the expected result, and reported it verified. It was
verified — of the node that answered. Two releases later the same check returned a
three-release-old build, and eight consecutive fetches of one URL came back 7:1 in favour of the
stale one. The origin was serving two different builds, and every single-fetch check I had run was
a coin flip I happened to win.

The general shape: **anything served by more than one machine can answer differently per request,
so a check that fetches once tests luck, not deployment.** The tell is that the property being
checked is about the *system* ("the deploy landed"), while a single fetch only establishes
something about *one response*. The fix is sampling plus an assertion of agreement — which is
`scripts/verify-deploy.sh`, and which found a second bug (an `.htaccess` rule that had never
worked) within a minute of existing.

Worth pairing with a habit: when a fix appears to un-apply itself, suspect non-determinism in the
delivery path before re-reading the code. I re-read the config twice before sampling the URL.

## Adding an optional field is cheap; the danger is the code that enumerates fields

Adding `visible` and `name` to `DrawingElement` needed no document-version bump and no migration:
`loadDocument` passes v4 elements straight through, and save is `JSON.parse(JSON.stringify(...))`.
Old documents simply carry `undefined`. The compatibility work was two rules, not a migration:

1. **Absent must mean the safe default.** `visible !== false`, never `visible === true` — the
   second reading makes every object saved before this release vanish. (The layer panel had
   already reached this rule for `Layer.visible`; it just hadn't been written down.)
2. **Find the whitelists.** `normalizeElement` enumerates ~150 fields and silently drops anything
   not listed. It isn't on the main load path, so a new field would work everywhere *except* the
   paths that pass through it (templates, imports) — a bug that shows up weeks later in one
   feature. The grep that matters when adding a field is not "who reads elements" but "who
   *rebuilds* an element field by field".

The expensive half was never the schema: it was that `visible` has to be honoured by every walk
over elements — render, hit-test, marquee, minimap, and seven export paths. A single shared
`isExportable` predicate is what makes that auditable; seven inline `el.visible !== false` checks
would have been seven chances to miss one, and the miss only surfaces as "why is that in my PNG?".

## A graceful fallback that lies is worse than a crash

`idb-kv` fell back to an in-memory `Map` whenever IndexedDB wouldn't open, "so callers never have
to branch". Every individual decision in that design reads as defensive: don't throw, don't make
callers handle storage errors, keep working in private-browsing mode. Together they produced the
worst outcome available — the app told a user their drawings were gone (empty gallery, no
autosave, no version history, all at once) when the data was sitting on disk, and told them a
save had succeeded when it had gone into a map that dies with the tab. Then it deleted the
crash-recovery copy on the strength of that success.

The rule this suggests: **a fallback may degrade capability, but it must never fake the
capability it lost.** Reading and getting `undefined` from a memory map is fine; reporting that
as "you have no saved drawings" is not. Writing to memory is fine; returning `true` from
something named `set` is not.

Two smells worth recognising, both present here. A function that returns `true` on a path that
did nothing (`if (!db) { memory.set(k, v); return true }`) — the literal `true` is a claim, and
that one was false. And a cached failure: `dbPromise` held the null forever, so one transient
`onblocked` (another tab open — a completely ordinary situation) degraded the whole session with
no way back except reload. Cache successes; retry failures.

## The error next to the error is not the error

A bug report arrived as a screenshot: the "Something went wrong" screen, and in the console beside
it a red `ERR_BLOCKED_BY_CLIENT` on the analytics beacon. The obvious reading — the blocked
request broke the app — was wrong, and it is worth naming why the pairing was so convincing: the
red line was *right there*, it was the only error visible, and it recurred on exactly the visits
that failed (an ad blocker blocks every visit).

Two minutes of experiment beat any amount of reasoning about it: boot the production build with
the analytics host aborted and see whether the screen appears. It didn't. That turned "probably
unrelated" into "not the cause", and the search moved on to `curl -I` against the live site, which
found the real problem in the response headers — no `Cache-Control` on index.html at all.

Two habits worth keeping. **Reproduce the blame before acting on it**; a hypothesis you can test
in two minutes should never be argued about. And **an ad blocker's console error is background
noise on a large share of real traffic** — worth recognising on sight, because it will sit next to
every future report too. The experiment is now a spec, so the answer doesn't have to be
rediscovered.

## A precache is a download you charge to every visitor, on every release

Precaching feels free: it is "just" caching, and it happens in the background. It isn't. The
service worker precached 9.6MB across 220 entries, 5.1MB of which was code behind a lazy
`import()` — the exporter, MathJax, the help docs — that most visitors never open. And because
every filename is content-hashed, **every deploy invalidated every entry**, so each release made
returning visitors re-fetch the whole thing.

The interaction is the part worth remembering: precache size multiplies by release frequency. A
9.6MB precache on a project that ships monthly is a one-off cost most users never notice; the same
9.6MB on one that ships three times a day is 30MB a day of background traffic per active user.
Shipping more often made the app slower, which is not a connection anyone goes looking for.

The rule that falls out: precache the shell you need to *start*, and let everything reachable only
through a user action be fetched on demand and cached at runtime (hashed names make `CacheFirst`
safe). The repo had already reached this conclusion once, for the outline fonts — the lesson
hadn't been generalised to the 40 other chunks in the same position.

## "Missing feature" reports are usually one of three different things

Five items of user feedback about layers and alignment turned out to be three distinct classes,
and each wanted a different response:

- **Shipped but invisible.** Align-to-key already worked, exposed as an unlabelled crosshair
  button in one panel, with no on-canvas sign of *which* object was the key. Reported as missing.
  The fix is affordance work — mark the state, offer the gesture the user already knows
  (Illustrator sets the key by clicking a selected object) — not a new feature.
- **Shipped but half-scoped.** The layer panel does rename/lock/hide/drag-reorder/nesting… of
  *layers*, and never lists objects. In a complex document that reads as "no layer panel",
  because the thing users manage is objects.
- **A bug wearing a feature's clothes.** "Aligning inside a group shifts everything together"
  named a symptom whose cause was that you cannot select one child of a group at all — clicking
  any member selects the whole group and there's no direct-select mode. The align code had a
  second, unrelated defect too (it exploded groups). Neither is what the words asked for.

The lesson: before estimating a feature request, check whether the feature exists. The gap
between "we didn't build it" and "we built it where nobody looks" is the difference between two
days and two hours — and the second is invisible from the report itself.

## A selection-level operation is not a loop over the element-level one

`bringForward` for a multi-selection was `selection.forEach(id => moveElementZIndex(id, 'forward'))`.
Three bugs fall straight out of that shape, and they're worth recognising as a family:

1. **History granularity.** The per-element op pushes history, so N objects = N undo entries. The
   user made one gesture and expects one undo.
2. **Members colliding with each other.** Each element moves independently, so a selected element
   can step onto the slot of another selected element. Two adjacent objects swap and net out to
   nothing — the operation "worked" and the screen didn't change.
3. **The step is defined against the wrong sequence.** Paint order here is *layer order first,
   then array index*, but the splice worked on the flat array — so a step past an element on a
   different layer reordered data and moved nothing visibly.

The general form: an operation on a *set* needs its own definition (what does one step mean for a
block? what stays fixed relative to what?), and the single-element version is the special case —
not the other way round. `moveSelectionZIndex(ids, dir)` is now the primitive and
`moveElementZIndex(id, dir)` delegates to it. The same reasoning drove group-awareness in align:
a group is a set that must move as one, so the algorithm operates on *clusters* and treats a lone
element as a cluster of one.

## "Selection unit" is a concept the code needs to name

Grouping raised a question the codebase answered ad-hoc in four places: *when I click this
element, what gets selected?* The selection handler expanded to the outermost group inline;
alignment ignored groups entirely; z-order stepping moved raw array entries; the marquee selected
individual members. Four answers to one question, so grouping behaved differently depending on
which feature you used.

Naming it fixed more than it cost. `unitGroupId(el, isolationPath)` — "the group this element
belongs to *for selection purposes*" — is now the single answer, and group isolation became a
parameter of that function rather than a mode each feature has to remember. Alignment needed one
refinement on top: a group is a unit only when it is *entirely* selected, which is what makes a
partial marquee inside a group behave the way a user expects without any mode at all.

The tell for this kind of missing concept: several features that each re-derive the same
relationship from the same raw field (`groupIds` here), slightly differently.

## Adopt the industry keybinding, even when it means changing yours

`Ctrl+]` was Bring to **Front**. Illustrator, Figma and every neighbouring tool use `Ctrl+]` for
Bring **Forward** and a modifier for Front. The request was only "add a one-step shortcut", which
could have been satisfied by hanging forward/backward off `Ctrl+Shift`, keeping our existing
binding intact — and leaving us permanently inverted relative to every tool the user also has
open. Muscle memory is cross-application; a private convention costs more than the one-time
re-learning. Also, when binding a shifted punctuation key, match on `event.code`
(`'BracketRight'`), not just `event.key` — Shift+`]` emits `}` on a US layout, so a `key === ']'`
test silently fails to fire.

## Doc-comments in `api.ts` are not documentation

Eight node-editing methods shipped with careful `/** ... */` comments on every one — and none of
them appeared in the web docs, so the Node tool read as a UI-only mode when it was fully
scriptable. The comments felt like documenting, which is exactly why the gap survived: the work
had visibly been done, just not where a user would ever look.

The counter-measure that actually holds is a spec that runs the *published snippet* verbatim
(`tests/node-api-doc-accuracy.spec.ts`) and asserts the documented shapes and effects — that
`NodeRef` really is `{ id, sub, i }`, that `moveSelectedNodes(0, -20)` moves exactly −20. Prose
about an API rots silently; prose that is executed fails loudly. Worth doing for any doc section
that publishes a code block.

## A capture-phase handler owns every click it doesn't hand back

The Node tool captures `pointerdown` on `window` and `stopPropagation()`s so the canvas can't
steal an anchor drag. Correct — but "swallow everything" and "swallow what I handle" are different
policies, and the overlay shipped the first while intending the second. With no branch for "a
shape was clicked", switching the path you were editing became: exit the tool, select, re-enter.
The tool wasn't missing a feature; it was missing a *fall-through*.

The general shape: any handler that pre-empts a lower layer inherits responsibility for everything
that layer used to do at that spot. Enumerate what the layer below handled before you take its
events — here that was "click selects an object", and it silently vanished.

Inkscape's `NodeTool::select_point` is worth reading for what a mature answer looks like: it
selects the item under the cursor, Shift-toggles it into the set, and deselects empty space in
**two stages** — first click drops the nodes, second drops the object — so missing an anchor by a
few pixels doesn't cost you your place. `select_area` adds a second idea: the rubber band selects
*items* when there is nothing to node-edit and *nodes* when there is, so one gesture means the
useful thing in both states. Both were a few lines to port and neither would have been invented
from a bug report.

## A fixed overlay that computes its own coordinates will drift, and it drifts twice

0.8.163 fixed rulers, symmetry axes and artboard frames drawing 46/52px off, and created
`utils/overlay-transform` so there would be one world↔window mapping. The Node tool overlay,
written later, still reached for `viewport-transforms` directly — and reproduced the bug exactly.
Extracting the helper does not retire the mistake; only *using* it does. Worth grepping for
`worldToScreen`/`screenToWorld` inside anything `position: fixed` before assuming the class of bug
is closed.

The part that made it expensive: a display overlay that also **hit-tests** gets the offset twice.
`nodeAt()` compared `e.clientX/Y` (window) against `toScreen(...)` (canvas-local), so the anchors
were not merely drawn in the wrong place — they could not be grabbed where they appeared, and the
9px hit radius meant you never stumbled into the right spot. The visual symptom was "the handles
look wrong"; the felt symptom was "the tool is broken". One cause.

A third bug rode along in the same line: `store.viewState as any` satisfies the `Viewport` type
but leaves `centerX`/`centerY` undefined, so `?? 0` rotated about the canvas's top-left corner
instead of its centre. A cast that type-checks is not a value that is correct — `overlayViewport()`
exists to assemble the real thing.

## An inert overlay is worse than a missing one

The Node tool swallowed the pointer outright (a capture-phase handler that `stopPropagation()`s on
every branch), so the Select tool's resize/rotate handles were already unclickable while it was
on. They were still *drawn* — on the bounding box, which for a converted rectangle is exactly
where its corner anchors are. The result was two sets of identical blue squares, one live and one
dead, occupying the same pixels. Illustrator and Inkscape both drop the transform chrome in
Direct-Selection mode, and this is why: chrome that cannot act still competes for the click.

Suppressing it was one `ctx.restore(); return;` — the same early exit also killed the canvas's
duplicate copy of the anchors, which the SVG overlay was already drawing. Two symptoms, one line,
because both came from "draw everything the Select tool would".

## Area-select and click-select must share one gate

Click hit-testing consulted `canInteractWithElement`; the marquee and lasso swept `store.elements`
with no filter at all. The divergence was invisible for years because the two agreed whenever
every element was interactable — and then Animation mode introduced elements that exist in the
document but not on this frame, and onion skinning painted them right under the marquee. Any time
one selection path grows a rule, check whether the others sweep the same collection; "what may I
touch" belongs in one predicate, not per gesture.

## Bun shares a module registry across test files

`bun test` runs every file in one process, so the Solid store imported by two specs is the *same
object*. A new test that left `docType: 'animation'` set sent `app-store.test.ts`'s `selectAll()`
down the cel-visibility branch and failed two of its tests — with an error pointing at code that
had not changed. Store-level specs must restore what they mutate in `afterAll`, and a suite that
suddenly fails "somewhere else" is worth reading as state leakage before it is read as a bug.

## Match a shortcut to this app's keymap, not the reference app's

Illustrator's Direct Selection is `A`. Here, `A` has been the Arrow tool for a long time. Taking
it would have honoured one app's muscle memory by breaking a shape shortcut people use daily, so
the Node tool took Inkscape's `N` instead — free, and equally canonical. The same reasoning
resolved F6: Adobe Animate does not switch tools on Insert Keyframe, but Animate's default tool is
Selection and Yappy's is the Ink Brush, so copying the *rule* would have reproduced the opposite
*outcome*. Reference implementations are evidence about intent, not instructions about behaviour;
port the intent through your own defaults.

## Don't offer a control the code is going to ignore

Filling in the tool-options bar meant deciding, per control, whether it survives the trip
from `defaultElementStyles` to the element. `draw-handler` spreads the defaults wholesale,
so almost everything does — but not all of it:

- `curveType` is **overridden** for the bezier/elbow/organicBranch/polyline tools (those
  tools *are* a line type), so a "Line Type" picker there would silently discard the choice.
- `curvedText` and the image filters need an element that already exists; as a default they
  mean nothing.

Both exclusions live in one tested function (`getToolDefaultProperties`) rather than in the
component, because the rule is about what the *draw handler* does, and the test that pins it
reads like the rule ("bezier hides Line Type"). A knob that does nothing is worse than an
absent one: it teaches the user the wrong model of the tool.

The other half of the same job was resisting a second copy. The floating quick toolbar
already had the widget vocabulary and the per-family property definitions; the options bar
needed the same widgets against a different binding. Extracting `quick-controls.tsx` with a
value accessor + commit callback (the caller owns history — the selection side snapshots per
edit, the defaults side has nothing to undo) meant the new bar cost a `<For>` and no new
controls, and a newly added shape type now inherits its options for free via
`getElementFamily`'s "anything unrecognised is a shape" fallback.

## `overflow-x: auto` is not one-dimensional, and it clips popovers

The options bar sets `overflow-x: auto` to scroll long content, and its host slot
`.topbar-center` is `overflow: hidden`. Either one alone is enough to cut off an
absolutely-positioned popover: a box that scrolls in one axis is a scroll container in
**both** (`overflow-y: visible` computes to `auto`), so "it only scrolls sideways" is not a
reason to think a dropdown can escape downward.

The fix that keeps both hosts working is an opt-in `float` on the popover: measure the
trigger and re-anchor the same markup as `position: fixed` under a `<Portal>`. Opt-in, not
global — the floating quick toolbar has no overflow of its own and moves with the canvas, so
converting *its* popovers to fixed would have introduced a detach-on-pan bug to fix a
problem it doesn't have. Portalled popovers also leave their stacking context, so they need
a z-index that clears the top bar's band (10050/10060) rather than the 10002 that worked
inside it.

## A command that produces a selection must also produce the ability to use it

`Ctrl+A` with a brush armed used to select everything and leave the brush selected. Technically
correct — the selection *was* set — but useless: dragging, resizing, marquee, control points and
connector handles are all gated on the selection tool, so the user got a box they could look at
and not touch, and the next stroke made it stale without clearing it.

The general rule this codebase already followed everywhere else: when an interaction ends with
"you now have objects worth manipulating", hand over the selection tool. Finishing a pen path,
closing a polyline, placing an image, leaving text editing and exiting crop all do it. Select-all
was the one command with that exact intent that didn't, which is why it read as a bug rather than
a preference. When adding a command that *only* makes sense against existing objects, check what
mode the user is left in, not just what state you wrote.

Two implementation notes worth keeping: put the tool switch in the store action, not the keyboard
handler, or the context-menu entries diverge from the shortcut; and switch the tool *before*
writing the selection, because `setSelectedTool` clears the selection when moving to a drawing
tool and the reverse order quietly select-alls into nothing.

## `bun test` reports a file that fails to import as an "error", not a failure

`app-store.test.ts` had been dead for some time: it threw
`Cannot find module 'react/jsx-dev-runtime'` at import and `bun test` printed
`389 pass, 0 fail, 2 errors`. A green-looking run with a non-zero *errors* count means some file
contributed no tests at all — read that line, not just the pass/fail pair.

The cause is that Bun resolves JSX from the nearest `tsconfig.json` to the file being loaded. The
repo's root config is solution-style (`"files": []` plus `references`) and carries no
`compilerOptions`, so any `.tsx` reached transitively from a test compiled against the React
runtime instead of Solid's. Mirroring `jsx`/`jsxImportSource` into the root config fixes the test
runner and cannot affect `tsc -b`, which builds only the referenced projects.

## `document.fonts.ready` does not mean the fonts are ready

Chased as "`Yappy.clear()` leaks state": the first diagram rendered in a headless page came out
a few percent wider than the same diagram rendered again afterwards, and `clear()` happened to
be the call sitting between the two.

The real cause is that `document.fonts.ready` only settles the faces that have actually been
**requested**, and a family that reaches the page through a CSS `@import` or a `<link>` is not
requested until something first *renders* with it. So on a freshly-booted page all three of the
obvious guards agree that everything is fine while the font is still missing:

```
document.fonts.status            → "loaded"
await document.fonts.ready       → resolves immediately
document.fonts.check('28px Handlee') → false          ← the truth
ctx.measureText('AbstractFactory')   → 180.39px       (187.00px once real)
```

Measured on this codebase: 180.39 vs 187.00, a 3.7% error. The call that actually forces the
request is `document.fonts.load(...)`, which is what `utils/font-loading.ts` now fires for every
built-in family at boot.

Two things make this worse than a transient flash of the wrong font:

- **It is written down, not just displayed.** Text-bearing shapes are auto-sized from
  `measureText` *at creation* and the result is stored in `el.width`/`el.height` and saved. A
  measurement taken 200 ms too early is a permanent property of the document.
- **It does not self-heal.** Re-importing the same source after the fonts arrive reproduced the
  cold geometry exactly (verified: measurement had demonstrably recovered, 180.39 → 187.00, yet
  the re-imported boxes were byte-identical to the cold ones). Whatever the mechanism, "render
  it again once the fonts land" is not a recovery strategy — see the open item in
  `docs/bugs/bug-fixes.md`.

The general lesson: for any resource that a browser fetches **lazily on first use**, a readiness
API tells you about the requests that were made, not about the resource you care about. If
correctness depends on the resource, request it explicitly and wait on *that*. And when
measurement output is persisted rather than merely drawn, treat the measurement as needing the
same up-front rigour as any other write.

## Fixing the faithful renderer is what exposes the wrong geometry

v0.8.165 made arrowheads follow their curve's true tangent. Within a day three separate reports
arrived of heads lying flat against a box edge. Nothing had regressed — the heads were now
*correctly* tracking curves that had always left in the wrong direction. The old bug had been
masking the new one: a head rotated to the chord happened to look plausible next to a curve that
also left along the chord.

Two wrongs composing into something that looks acceptable is a specific hazard of rendering
pipelines, where every stage is judged by eye on the final image. It has a practical
consequence for sequencing: after fixing a stage that others feed into, **re-audit the inputs,
don't just verify the stage**. The corpus audit that proved the arrowhead fix (0.000° across
1360 connectors) said nothing about whether the curves themselves were sane, because it compared
each head to its own curve. It took a *different* invariant — departure direction versus the
anchored edge's normal — to see the second bug, and that invariant only became worth measuring
once the first was fixed.

## "Property of the relationship" is not "property of the endpoint"

Connector control points were derived from `Math.abs(width) > Math.abs(height)` — the chord's
dominant axis. That is a fact about *where the two boxes sit relative to each other*. What the
departure direction actually depends on is *which edge of its own box each endpoint is attached
to* — a fact local to that endpoint. The rules agreed often enough (a tree-down layout anchors
top/bottom and is vertically dominant) that the substitution survived a long time, and diverged
exactly on the wide cross-hierarchy edges where `|dx| > |dy|` but the anchor is still horizontal.

The tell is available without any rendering: the old signature took `(start, end, width,
height)` — four numbers describing a *chord*, with nothing that could distinguish a bottom-edge
anchor from a right-edge one. When a function cannot express the distinction its output depends
on, it will get that output wrong somewhere, and the only question is how often. Read the
parameter list before the body.

Also worth keeping: the two endpoints needed *independent* answers. A shared "dominant axis" for
the whole connector quietly assumes both ends leave along the same axis, which is not true the
moment one end is on a top edge and the other on a left edge.

## Fix the direction, keep the magnitude — that is what makes a fix reviewable

The change could have recomputed the control-point offsets from scratch. Instead it kept the
existing half-dominant-axis magnitude and changed only the direction vector. That turned an
"all connectors re-render" diff into "only the 15% that were wrong move", which is
independently assertable — a unit test compares `cp1`, `cp2` and the emitted path for the
already-correct case and demands they be *identical*.

The subtlety worth remembering: this only works with `|w|`/`|h|`. Taking the direction from the
edge normal while keeping a *signed* half-axis would have flipped exactly the cases the fix was
meant to repair, and — because the other 85% would still have looked right — the mistake would
have shipped looking like a success.

## `atan2(0, 0)` is 0, and that is how a 90° bug hides for months

The architectural renderer aimed every curved connector's start arrowhead due east. The line
that did it looks defensive, even careful:

```js
const cp1 = el.controlPoints?.[0] || { x: start.x, y: start.y };
```

Guard the undefined case, fall back to something sane. But the fallback makes the control
point *equal to the point it is measured from*, and `Math.atan2(0, 0)` returns `0` — a
perfectly ordinary number, not `NaN`, not a throw. So the failure renders as "the arrow points
right", which reads like a styling quirk rather than arithmetic that never happened.

The generalisation: a fallback whose value is degenerate for the calculation that consumes it
is worse than no fallback, because it converts a loud failure into a plausible-looking wrong
answer. When the guarded value feeds a direction, a normalisation or a division, the fallback
has to be a *valid input for that operation* — here, walking along the control polygon to the
next genuinely distinct point. Reach for the neighbouring datum, not for the origin.

## Six copies, five correct — the majority is not the specification

The endpoint-and-control-point derivation for connectors existed in six places: `definePath`,
`renderBezier`, `renderElbow`, `renderStraight`, `renderArchitectural`, `renderFlow`, plus
`connectorCurvePath` in the exporter. Five agreed. That near-consensus is exactly what made
the bug survive — every time someone read one of the correct copies, the code confirmed the
convention, and nobody diffed all six.

Duplication is usually described as a maintenance cost, paid later. The sharper cost is
epistemic: with N copies you can no longer answer "what does this system do?" by reading, only
by reading *all of them*, and the cost of that grows exactly when you are least inclined to pay
it. The fix was not "write the correct maths a seventh time" — it was to make there be one
place, so canvas/export parity is structural rather than a convention six call sites have to
independently honour. The tell that the refactor was the real fix, not gold-plating: the
architectural bug and the export bug were *the same bug*, and no one had connected them.

## A spec's "do not fix" list is the part to check first

`docs/arrowhead-orientation-spec.md` was unusually good: exact line numbers, a reproducible
evidence table, a considered recommendation on the open question. Its §4 was headed **"What is
already correct (do not 'fix')"** — and that section was where the second, larger bug was
hiding, asserted as settled.

This is structural, not a lapse by the author. The rest of a spec is written in investigation
mode; the "already correct" list is written in *summary* mode, from what was checked earlier,
and it is the one part a reader is invited to skip. Here it said "canvas rendering is correct"
on the strength of the sketch renderer, and the architectural renderer — a different method in
the same file — was never opened.

So when reviewing a spec, spend the effort inversely to the author's confidence. The claims
under "here is the bug" have already been tested by the act of finding it; the claims under
"this part is fine" have not. Same for the aggregate numbers: "70 files" turned out to be 70
*glyphs* across 22 files — a headline figure nobody re-derives because it is not load-bearing
for the diagnosis, only for the priority.

## Write the acceptance criterion against the truth, not against agreement

The spec's criterion 3 read: *"canvas and export produce the same angles for the same
element."* It is the natural way to phrase a parity fix, and it is satisfiable by making both
sides equally wrong — which was a live risk here, since the obvious implementation of "make
export match canvas" would have copied the architectural renderer's broken angles.

An agreement criterion only constrains the *difference*. If the shared value can itself be
wrong, at least one criterion has to be anchored to something external — here, the tangent of
the drawn path, asserted numerically at 0.5°. Then agreement follows for free, and is worth
asserting only as a cheap secondary check. Two implementations agreeing is evidence of a
shared source, not of a correct one.

## A media query is not a specificity boost, and the mobile layout is where you find out

Four separate mobile bugs shipped at once, and three were the same mistake: a rule inside
`@media (max-width: 600px)` that was simply outranked. `@media` changes *when* a rule is
considered, never *how strongly* it competes. So

```css
.toolbar-container:not(.docked) { top: calc(12px + var(--dock-top)); }   /* 0-2-0 */
@media (max-width: 600px) { .toolbar-container { top: auto; } }          /* 0-1-0 — loses */
```

leaves the phone bar with `top` *and* `bottom` pinned, and an auto-height element pinned at
both edges stretches to fill the gap. A one-row toolbar became a full-screen opaque panel.
The same block's `.toolbar-btn { width: 40px }` lost to the base `.toolbar-btn` on *source
order* instead — equal specificity, declared earlier in the file. One block, two different
losing mechanisms.

Two habits fall out of this. When you add a rule that narrows an existing selector
(`.x` → `.x:not(.y)`), grep for every other place that sets the same property on `.x` and
raise those to match — you have just silently demoted all of them. And when a media-query
override "doesn't take", check the rank before checking anything else; it is far more often
specificity than a wrong breakpoint.

## Symptoms invert when the thing that broke is invisible

The failing element was `background: var(--bg-panel)` — white — stretched over a white
canvas. The report was "the toolbar is broken on mobile", but the *screen* showed icons
floating in the middle of an empty page and a canvas that ignored every tap. Nothing looked
like a toolbar problem; it looked like the app had failed to boot.

What made it findable in one pass was reading geometry rather than pixels: a headless probe
that dumped `getBoundingClientRect()` plus the computed `top`/`bottom`/`width` and the
`--dock-*` vars at three viewport widths. `{x:0, y:12, w:414, h:796}` on a 390×844 phone
names both bugs immediately — 796 tall says "pinned at both edges", 414 on a 390 viewport
says "content-box padding overflow". A screenshot of a white rectangle on white says
nothing. For layout bugs, dump the box model first and look at the render second.

## One concept, one constant — or the gap between two numbers becomes a bug

The phone breakpoint was written three times: `PHONE_MAX_WIDTH = 600` in `toolbar.tsx`, a
`@media (max-width: 600px)` in `toolbar.css`, and `innerWidth < 700` in `dock-layout.ts`.
Two agreed, so it looked consistent. The third created a 99px-wide band where the toolbar
docked to an edge and the canvas insets still called the viewport "narrow" and reserved
nothing — a tool column sitting on top of the drawing, visible only if you happened to size
a window to 640px.

The tell was already in the comments: `toolbar.css` said "must match PHONE_MAX_WIDTH in
toolbar.tsx" and `dock-layout.ts` said nothing at all. A comment asserting that two numbers
must agree is a request to export one of them. The dead band existed for as long as the two
files independently believed they knew where phones ended.

## Chrome that paints must also reserve

`dockInsets()` skipped the header's 52px on narrow viewports — but `app.tsx` mounts the
header whenever the app isn't in Zen or Presentation mode, phones very much included. So on
a phone an opaque, full-width, z-10050 bar was drawn over the top of the drawing area and
reserved nothing for itself: the top 52px of "canvas" was permanently covered and every tap
there hit the header.

The rule the inset model needs is that the condition for *reserving* space must be the same
expression as the condition for *rendering* — not a related-looking one. Here that meant
deleting the width test entirely and keeping only `chromeless`, which is exactly what the
`<Show>` guards check. The same reasoning then applied to the phone toolbar strip: it is
described in the code as "floating", but a full-width opaque bar pinned above the status bar
is chrome no matter what the variable is called, and it needed reserving too.

## "It exists in the code" is not the same as "it ships"

The Inkscape comparison produced a parity table full of ticks: drag a node, bend a
segment, corner/smooth, insert, delete — all implemented, all working. Then the person
who *built the app* asked "I am not sure how to try this?" about segment-drag-to-curve.

Every one of those operations was bound to a bare modifier — Alt-click, Ctrl-click — on a
selected path, with no mode, no visible anchors and no affordance saying a segment was a
live target. The capability was complete and the feature did not exist.

The fix wasn't geometry. `node-editing.ts` adds set operations; the overlay adds
*visibility*. Not one line of curve maths was written. When a parity audit says "we have
this", the follow-up question is "show me how a user finds it" — and if the answer is a
keyboard modifier nobody documented, the tick is wrong.

## Ship the mode and the multi-select together, or the mode looks broken

Scoping these as two tasks was tempting: the Node tool is small (the Vector Tools panel
already provides mode semantics, exclusive activation and an overlay convention) while
multi-node selection is genuinely new state and real work.

But a Node tool that shows twelve anchors and only ever lets you touch one reads as
half-finished — worse than no mode at all, because now the limitation is *visible*. The
sequencing question was never "which is smaller", it was "which subset is a coherent
product". Neither is, alone.

## Find the existing convention before inventing a surface

Three separate instincts said "build a contextual toolbar for this". The codebase already
had `vector-tools-panel.tsx`: grouped modal tools, exclusive activation via
`exitAllToolModes()`, per-tool active state, and a `*-tool-overlay.tsx` component pattern
with Esc-to-exit. Adding **Nodes** to its Path group inherited all of it.

The check that mattered was reading what `toggleReshapeTool` and `toggleCurveTool`
actually *do* — Curvature is a creation tool, Reshape is a soft deformation that
deliberately hides individual nodes. Neither was a node tool, but both showed exactly how
a node tool should be built here.

## Measure the layout before believing the obvious cause

The wrapped toolbar's icons were ragged and the visible explanation was right there: some
tools are groups and carry a submenu chevron, so *obviously* those buttons are wider.
Measuring said otherwise — every button, group or not, is exactly 28x28. The chevron
already fits inside the box.

The real cause was the drag grip, a 40x12 element sitting inline in the flex-wrap flow
and eating one cell of the first row. Nothing about it looks like a grid item, which is
why it wasn't the suspect.

Dumping every child's `getBoundingClientRect()` took one script and turned "it looks
uneven" into "five distinct left edges: 17, 49, 61, 81, 93" — which names the broken row
and the exact offset. For layout bugs the measurement is usually faster than the theory,
and it doubles as the assertion for the regression test.

## One static import can pin a megabyte to the critical path

Cold load was carrying ~1.8 MB gzip of code the first paint never touches. The single
worst offender was one line: `components/menu.tsx` statically imported
`exportSceneAsHtml`, whose module graph ends at a generated file holding the *entire
player bundle as a 2.4 MB string literal*. `api.ts` already loaded the same module with
`await import()` — but a dynamic import somewhere else buys nothing while one static
import remains, because the bundler still has to put it in the eager graph.

The diagnosis took minutes and needed no tooling: `du -sh` over `frontend/src` showed one
2.4 MB file, and `grep` for its importers gave the whole chain. Reach for the treemap
plugin when the weight is diffuse; when one file is half the source tree, `du` finds it
first.

## `manualChunks` overrides tree-shaking, and dynamic imports don't undo it

Moving `jspdf`/`pptxgenjs` into `await import()` inside the two functions that use them
changed nothing: the eager set still contained the 744 kB `vendor-export` chunk. A
`manualChunks` entry *forces* its modules into a named chunk that stays reachable from
the entry, regardless of how they're imported. Both halves were needed — dynamic imports
AND deleting the entry.

The same config had `lucide-solid` in `vendor-rendering`, which forces the **whole** icon
package in and defeats tree-shaking of the ~40 icons actually used. Removing it took that
chunk from 660 kB to 28 kB — the icons that are used moved into the main chunk, and ~630
kB of unused ones were dropped entirely.

`manualChunks` is a tool for grouping things that are *already* eager. Listing a
dependency there is a statement that it belongs on the critical path.

## A size budget is the only bundle test that keeps working

Tests that assert "module X is lazy" rot: chunk names change, and content fingerprints
match the wrong thing. The first version of this guard searched the eager chunks for
`jspdf`, and failed — because Vite writes a *manifest of lazy chunk filenames* into the
eager chunk, which legitimately contains the string `pptxgen.es-….js`.

What survives is a gzip budget over whatever `dist/index.html` actually references, plus
a filename-level check that specific chunks exist and are not in that eager set. A/B'd by
reverting one change: cold load goes to 925 kB and the budget fails. That is the whole
value — a number that moves when someone adds a static import, without needing to know
which import they added.

## The status bar was documenting a feature that didn't exist

Shift while drawing a rectangle did nothing — but `getContextHints` had been rendering
`Shift · Constrain` under every shape tool for as long as the hint existed. The angle
constraint was implemented for `line`/`arrow`/`bezier` only, and for shape tools the flag
was read and then dropped on the floor.

Nobody had filed it because the UI *said* it worked. Hints, tooltips and help docs are
claims; when one is easier to write than the behaviour it describes, it can outlive its
implementation indefinitely.

## A passing test that reads the store is not a test of what the user sees

The mid-stroke symmetry test asserted `Yappy.state.elements.length === 6` and passed. The
feature was still visibly broken for pen tools: the copies existed in the document and
were culled by the renderer before they reached the canvas. State was right, pixels were
wrong, and the test only ever looked at state.

For anything whose whole point is visual, assert pixels. The replacement samples ink in
the column on the far side of the axis and requires it to *grow* across the drag — which
fails loudly on the old code (0 ink) and would have caught this the first time.

The corollary bit too: "shapes work, pen tools don't" was the single most useful sentence
in the whole exchange, and it came from the user, not the suite. A green suite made me
stop looking.

## Culls need an escape hatch for objects whose extent isn't in their bounding box

The renderer skips elements smaller than a screen pixel — sensible, and it had a special
case for the stroke currently being drawn, because an uncommitted freehand stroke keeps
its extent in `points` while `width`/`height` stay 0 until commit.

That special case was written as "the element being drawn is exempt" rather than "an
element with no computed extent is exempt". The first phrasing describes the one instance
that existed at the time; the second describes the actual property. The moment something
else had the same property — a mirrored copy of that stroke — it got silently dropped.

When you add an exemption to a filter, write the condition as the property, not as the
instance you happened to be looking at.

## Don't infer intent from a property that's already set for other reasons

Fill mode decided to fill when `backgroundColor` was present. Freehand elements inherit a
background from `defaultElementStyles`, so that was every stroke ever drawn — the toggle
appeared to do nothing because the answer was already "yes".

An explicit `fillSilhouette` flag costs one field and says what was meant. Reusing an
existing property as a proxy for a new intent only works while nothing else sets it, and
in a codebase with inherited default styles, something else always does.

## Seeding a store from a shared defaults object makes "the defaults" mutable

`store.symmetry` was seeded from `initialState.symmetry` by reference, so every
`setSymmetryCenter` quietly rewrote the module-level defaults. Nothing noticed until a
reset path read those "defaults" and got the last thing the user drew with.

Defaults that anything resets to should be a factory returning a fresh object, never a
shared literal. This one surfaced through a test for legacy-document loading — a case
worth writing precisely because it exercises the reset path that normal use never does.

## "Live" has to mean during the gesture, not on release

Live symmetry was hooked at the commit path, which made every test pass and still felt
wrong to use: you drew a whole stroke watching one lonely half, and the mirror appeared
when you let go. Correctness at the endpoints isn't the feature — the feature is what you
see mid-gesture.

The fix was to make the copies real elements from the first move and re-derive them from
the source on every pointer move, rather than render an overlay preview. Real elements
mean what you see mid-stroke is literally what you get on release, with no swap at the
end — the same "don't animate a stand-in" lesson as the drawIn reveal, arrived at from a
different direction.

Two things fell out of doing it that way:

- **Freehand and the geometric tools take different pointer-move paths** (`penOnMove` vs
  `drawOnMove`), so hooking the handlers missed freehand entirely — the tool that most
  wants live symmetry. The dispatch point in `canvas.tsx` covers both in one call.
- **A discarded stroke has to take its copies with it.** The commit path already rejected
  stray clicks and ghost strokes; once copies exist from the first move, every one of
  those early returns needs a cancel or the canvas fills with mirrored debris.

Keep the source's seed for the copies, too — a fresh random seed per instance re-rolls the
sketch wobble on every move, which reads as the mirror shimmering while you draw.

## Test the property, not the implementation detail you happened to observe

The mid-stroke test first asserted every copy had the same point count as the source. It
failed at 18 vs 20: freehand throttles its point flush, so copies trail by a frame during
the drag and are exact only after the final sync. The lag is invisible and correct.

The assertion had encoded a stricter invariant than the feature actually has. The real
properties are "copies exist and are growing mid-drag" and "copies are exact on release" —
so assert loosely during, strictly after. A test that fails on correct behaviour costs
more than one that doesn't exist.

Same shape of error in the same session: asserting mid-stroke `width > 60` on a freehand
element, which carries its geometry in `points` and has no width until commit.

## Fixed settle timeouts are a flake generator

Two pixel-sampling tests passed alone and failed in the combined run — a 250ms settle
that's fine on an idle dev server and isn't when 26 tests share it. Replacing the guess
with "sample until two consecutive reads agree" made the whole suite green in one pass.
Cheaper than a retry policy, and it documents what you were actually waiting for.

## Port an interface by reading the implementation, not by guessing at it

The ask was "symmetry drawing like HappyPaint, keep the interface same". HappyPaint
turned out to be a sibling project on the same machine, so the interface wasn't a
judgement call at all — `engine/brush/symmetry.ts` and `state/guides-store.ts` gave the
exact mode set, field names, clamps and function names to mirror. Ten minutes of reading
replaced a design discussion and a round of rework.

The one place the port *couldn't* be literal is worth naming: HappyPaint stores the
symmetry centre as fractions of a fixed document; Yappy is an infinite canvas, so the
centre is world coordinates. Everything else carries over unchanged. When you deviate
from a reference on purpose, say so at the deviation — `utils/symmetry.ts` documents it
in the header rather than leaving the next reader to wonder whether it was an oversight.

## The primitives for a "new" feature were already in the codebase

Live symmetry looked like new geometry work. It wasn't: `cloneSelection` already cloned
elements with fresh ids and remapped groups, `reflectClone` already handled axis-aligned
reflection including flip flags and negated rotation, and `placeRotated` already did rigid
rotation about a point for radial repeat. Radial symmetry is `placeRotated` per spoke.

Even the tilted mirror composed: a reflection across a line at angle φ is the
horizontal-axis mirror followed by a rotation of 2φ about the centre, so
`placeRotated(reflectClone(...), ...)` gets tilted axes for free — and gets local point
reflection and flip-flag handling correct for free too, which a fresh matrix
implementation would have had to rediscover one shape type at a time.

Worth a grep for the verbs of a feature (reflect, rotate, clone) before writing its maths.

## One commit choke point covered every drawing tool

"Symmetry for every drawing tool" sounded like N integrations. `drawOnUp` in the draw
handler is where freehand, shapes, lines and connectors all commit, *after* the discard
and normalization branches — so one call there covers nearly everything, and inherits the
stray-click and ghost-stroke rejection for free (a click that produces no shape can't
produce mirrored copies of nothing). Only pen-path and polyline needed their own hook,
because they finalize separately.

Finding the choke point first turned a broad change into three lines.

## Animate the thing you actually render, not a stand-in for it

`drawIn` traced a shape's geometric outline with a clean canvas stroke while the finished
sketch-style shape is drawn by RoughJS. Two different pictures: the reveal ended, then the
shape changed. Nobody had called it a bug because each half was individually correct — the
seam only exists in the transition between them.

The fix was not to make the stand-in look more sketchy. It was to stop having a stand-in:
re-run the renderer's own `renderSketch()` against a capture proxy that generates RoughJS
Drawables without painting them, then reveal *those*. It works for every shape renderer
with no per-shape code, and it cannot drift from the final frame, because it is the final
frame. Whenever an animation and its end state are produced by different code paths, the
pop is not a tuning problem — it's the design.

## Real geometry told us two things no mock would have

Synthetic opsets built to look like RoughJS output passed every unit test. Running the
same code against the actual generator immediately contradicted two assumptions:

1. RoughJS emits **only** `move` and `bcurveTo`. Never `lineTo`. Mocks written by hand
   naturally use `lineTo`, so the bezier sampling path was untested by everything that
   "passed".
2. It traces each segment **twice**, so a rectangle is 8 subpaths, not 4. Revealing them
   proportionally draws all four edges at once from their corners — nothing like a hand
   drawing a box. Correct behaviour is sequential across edges, lockstep within a pair.

And pairing those passes by matching endpoints — the obvious rule — is wrong for closed
shapes: RoughJS deliberately over-closes one pass to get the sketchy overshoot, so at
roughness 3 an ellipse's two passes end ~90px apart while tracing the same oval. Bounding
box overlap plus similar length is the property that actually holds for both open edges
and closed loops.

The lesson isn't "mocks are bad". It's that a mock encodes what you already believe, so it
can only ever confirm it. For anything generated by a third-party library, one test
against the real generator is worth a dozen against your idea of it.

## A cache key that is too specific and one that is too general fail differently

`computeElementHash` folded the exact `drawProgress` value in, guaranteeing a miss on
every frame of a reveal. Removing it entirely looked right and was worse: a mid-reveal
render issues no RoughJS calls at all, so it cached an *empty* drawable list under the
same key the finished shape would later look up. Too specific costs performance; too
general is a correctness bug that only shows up in the sequence reveal-then-finish.

Hashing it as a **flag** rather than a value — one key for all reveal frames, a different
key for the finished shape — gets both. When a property changes continuously but only
selects between a few rendering *modes*, hash the mode.

## Verify a visual fix by breaking it again

The "no pop" test passed. That says nothing on its own — it might pass on any code. Forcing
the old code path back on and re-running turned the numbers into evidence: sketch rectangle
0.73, ellipse 0.83, both below the 0.85 threshold, while the architectural cases stayed
green because they were genuinely untouched. Roughly a minute of work, and it's the
difference between "the tests pass" and "the tests would have caught this".


## Ask for the user's file before inventing test data

A user reported that shapes stopped responding to clicks and refused to combine after
any path operation. Four plausible causes were proposed, implemented, and each one
disproved by a negative control: the polygon flattener, hit-test sampling resolution,
region-op output, stroke tolerance. All four were reverted. Every synthetic reproduction
— unions, subtracts, excludes, multi-subpath donuts, 200-anchor blobs, chained ops —
worked perfectly.

The actual cause was `parsePath`'s tokeniser having no exponent support, so a coordinate
of `7.105427357601002e-15` parsed as a number, then `e` as a *command*, then `-15`, and
everything after it became NaN. One NaN explained both symptoms at once: hit-testing
compared against NaN so no click landed, and the flattened polygon was invalid so
Pathfinder reported "empty result".

No shape I invented could ever have triggered it. That coordinate only appears when two
values nearly cancel — which is exactly what boolean output produces and what
hand-written test data never does. Asking for the exported document found it in minutes:
load their JSON, print the flattened ring, see NaN, walk backwards.

The signal to watch for is a report shaped like **"it only happens to things that have
been through X"**. That phrasing means the input carries history you cannot guess at, and
the cheapest next step is their file — not another hypothesis. Four reverted commits is
what guessing costs.

## When every value is right and the screen is wrong, stop asserting values

`texTransform` looked broken: the final frame showed the source equation instead of
the target. Every numeric check said otherwise — `evaluateComposition(1.6)` reported
the source at opacity 0 and the target at 100, positions interpolated correctly, the
track data was exact. Two rounds of reasoning about the evaluator found nothing,
because nothing was there to find.

The bug was that the canvas never repainted. Its render effect has an explicit
dependency list which tracked the animation clock but not `store.storyTime`, so
seeking while paused changed the model and left the pixels alone. The evaluator and
the renderer were both correct and simply disagreed about *when* to run.

Two things worth keeping:

**A value assertion cannot catch a render-trigger bug.** Every test in the suite
passed throughout, including ones written specifically for composition playback. The
regression that catches it compares canvas *pixels* across two seeks — the only
instrument that could.

**"Works sometimes" is the signature.** Position overrides appeared to work while
opacity never did, which sent the investigation toward opacity handling. The real
difference was that some interactions incidentally triggered a repaint and others
didn't. When a feature is intermittent along an axis that makes no mechanical sense,
suspect *what schedules the work*, not the work itself.

This is the third bug in the same family (`bug-fixes.md` #215, #216, #218): the
composition spine has been right every time, and every failure has been in what
triggers something from it. Worth checking the remaining triggers directly rather
than waiting to trip over the fourth.

## An audit that checks for names goes stale silently; one that checks behaviour can't

`tests/manim-parity.spec.ts` was written to answer "what can't YappyDraw do yet?" and
did it by probing for method names — `f('createTex') || f('createMath')`. Those names
were guesses at what an implementation *might* be called. When LaTeX actually shipped
as `Yappy.tex`, the probe kept returning false, so the report confidently listed LaTeX,
vector fields and updaters as MISSING for a whole release after they existed.

The failure mode is the dangerous kind: the audit still passed, still printed a
well-formatted report, and was still the artifact we'd have reached for to decide what
to build next. Nothing announced that it had stopped describing the codebase.

Rewritten so every probe *exercises* the capability and classifies from the result —
typeset an integral and count the glyph paths, plot `1/x` and check it splits at the
pole, run `scene.play/wait` and assert it holds through the wait. A behavioural probe
cannot drift out of date, because the only way to make it report PASS is to make the
feature work. It also documents itself: the report now cites real numbers ("24
normalised arrows", "splits into 2 subpaths") rather than a bare verdict.

Rule of thumb for any "what's missing?" checklist: if a probe could still pass or fail
identically after the feature ships under a different name, it is measuring your
guesses, not the code.

## A dependency's Node-only trick can break a browser build in a way `optimizeDeps` won't fix

Adding MathJax for `Yappy.tex` failed with `require is not defined`, which reads like a
plain CommonJS-interop problem. Adding the deep entry points to
`optimizeDeps.include` — the usual fix, and one this repo already used for
`lucide-solid` — changed nothing.

The actual cause was in `mathjax-full/js/components/version.js`:

```js
exports.VERSION = (typeof PACKAGE_VERSION === 'undefined' ?
    (function () { var load = eval('require'); … })() : PACKAGE_VERSION);
```

It reads its own version out of `package.json` at module load, through `eval('require')`.
Bundlers cannot see through `eval`, so no amount of pre-bundling rewrites it — the call
survives into the browser and throws.

The fix is the branch the library already provides: define `PACKAGE_VERSION` at build
time and the `eval` path is never taken. It must be set in **two** places —
`define` for the Rollup production build and `optimizeDeps.esbuildOptions.define` for
the dev-server pre-bundle — because those are separate pipelines and fixing only one
gives a dev server that works and a build that doesn't (or vice versa).

Generalisable: when a bundler error names a construct the library uses *dynamically*
(`eval`, computed `require`, `new Function`), stop trying to configure the bundler and
go read the offending module. The escape hatch is usually already there.

## The missing feature was vocabulary, not machinery

Auditing the API against manim (`tests/manim-parity.spec.ts`) to see what a
maths/ML explainer would need, the expectation was that the animation engine
would fall short. It didn't. Absolute-time composition tracks, shape morphing,
stagger, camera keys and video export were all already there and correct —
`x(0)=100 → x(0.5)=225 → x(1)=350 → x(2)=600` with easing, first try.

What was missing sat one level up. Two gaps, both cheap:

- **No playhead.** The engine takes keyframes at absolute seconds, so authors did
  the time arithmetic by hand. manim sequences by *statement order*. That turned
  out to be ~120 lines holding a single `cursor` number (`scene-script.ts`) — no
  engine change at all. It was prototyped entirely in userland first, inside a
  spec, which is what proved no engine work was needed before any was committed.
- **No coordinate mapper.** `createPath` could always draw a curve, but nothing
  owned unit→pixel, so `sin(x)` cost ~25 lines and 19 elements. An `AxesSpec` is
  just eight numbers; holding it as **plain data with no closures** is what lets
  it cross the embed bridge and be saved in a document.

The lesson for the next "can we do X?" question: audit empirically before
designing. Reaching for a big architectural answer when the substrate is already
sound produces the wrong roadmap. The two highest-leverage items here were both
thin facades, and finding that out cost one afternoon of probing.

## A feature gated on the wrong precondition fails silently, twice

Two separate bugs, one root cause (`bug-fixes.md` #215, #216). The Scene Timeline
grew up around animated stick-figure clips, so both its **duration**
(`max(4, ...clipDurations)`) and its **clock** (`canvas.tsx`'s ticker condition)
asked "are there figures?". An API-authored scene has none, so it was pinned to a
4s ceiling and its playhead never advanced — it rendered perfectly and simply
didn't move.

Neither surfaced as an error. Worse, the duration bug's comment read *"Auto scene
duration = longest track"*, which is exactly what you'd want it to say — the
composition keys **are** tracks, they just weren't in the list being maxed. A
correct-sounding comment over an incomplete list is harder to spot than no
comment.

What actually caught it: scripting a real scene end-to-end
(`examples/manim-gradient-descent.js`) rather than unit-testing the pieces. And
the playback bug survived even that, because every check *scrubbed* with
`seekScene(t)` — which bypasses the clock entirely. A user screenshot found it.
**If a feature has a "play" path and a "seek" path, testing seek proves nothing
about play.**

## `getEasing` falls back to linear, so a typo flattens your motion

`getEasing(name)` returns `easings[name] ?? easings.linear`. There is no
`easeInOut` — the plausible-looking name most people reach for first — so
`{ easing: 'easeInOut' }` silently yields linear motion. This shipped in the
first draft of the gradient-descent demo and went unnoticed, because linear
easing on a 0.35s tween looks fine.

`scene.play` now validates the name and warns once per bad value, listing the
valid ones. The general shape: a lookup with a sensible-looking fallback is a
silent-failure generator whenever the key is author-supplied. Either validate at
the authoring boundary or make the fallback loud — the hot path (`getEasing`
itself, called per frame) is the wrong place for either.

## Accept both string shapes, because users will write both

`plot.graph(ax, 'Math.sin(x)')` compiles the string as an *expression body*. The first
time a polar curve was written as `'t => (1 + Math.cos(t)) * Math.cos(t)'` — an arrow
function, the equally natural spelling — every sample came back as a *function object*
rather than a number, so the whole curve was silently dropped and `graph()` returned
`null`.

Rather than document the distinction and let people trip on it, `toFn` now calls
through once more when the result is itself a function. Two lines, and both spellings
work. The general point: when an API takes code-as-string, there is usually more than
one obvious way to write it, and detecting which one you got is cheaper than teaching
everyone the rule.

Related, in the same family: `Yappy.tex` keys symbols by the character they *render as*
after NFKD normalisation. MathJax emits Mathematical Alphanumeric Symbols — `𝑒` is
U+1D452, not `e` — so a naive `texPart(id, 'e')` would match nothing. NFKD folds those
back onto their base characters (`𝑒`→`e`, `𝜋`→`π`), which is what makes the lookup
behave the way anyone would expect it to.

## Dense polylines beat fitted beziers for function graphs

`plot.graph` samples 240 points and emits corner anchors. Fitting beziers would
be "nicer" but costs solve time, is harder to node-edit, and at 240 samples the
polyline is visually indistinguishable from a smooth curve — including under
rough.js, where the segments are short enough that sketch-mode jitter is
imperceptible (which is why a plotted curve looks the same in both render
styles, and should).

The one thing worth doing carefully is **splitting on non-finite samples**. `1/x`
plotted naively draws a near-vertical line from +∞ to −∞ straight through the
pole. Emitting a separate subpath per finite run turns that into the gap it
should be, and costs three lines.

## Fix a dependency chain at the level where it actually breaks

Eight "high" advisories, one root: `brace-expansion`, reached through
`vite-plugin-pwa → workbox-build → @trickfilm400/... → ejs → jake → filelist → minimatch`.
Everything above it was flagged purely for depending on it.

The two obvious moves both failed. `npm audit fix --force` proposed "upgrading"
`vite-plugin-pwa` to 1.2.0 — a *downgrade* from the 1.3.0 already installed. And
overriding `brace-expansion` to its only patched version (5.0.8) breaks the build,
because 5.x's CommonJS entry exports an object where 2.x exported the function, and
`filelist`'s bundled `minimatch@5` does `require('brace-expansion')` and calls the result.
I only know that because I checked the export shape and ran it — `typeof require()` came
back `'object'`, and calling it threw. An override that "resolves" an advisory by breaking
a consumer is worse than the advisory.

The fix was one level up the chain: **`ejs@6` dropped `jake`** (it has zero dependencies
now), so pinning `ejs` deletes `jake → filelist → minimatch → brace-expansion` outright.
Nothing forced onto an incompatible consumer, three packages fewer.

Generalisable: when a transitive advisory has no compatible patch, **walk UP the chain
looking for a link you can cut**, rather than forcing a version down onto packages written
against a different API. And always verify the fix against the thing that consumes it —
here, that the production build still ran and the service worker still generated its 202
precache entries, not just that `npm audit` went quiet.

## An audit with a blind spot is worse than no audit

The contrast sweep had been reporting the Beta badge as "white on white, 1:1" — a
physically impossible reading, repeated across every surface. It was dismissed as a quirk
of the probe. It was: the walk read only `backgroundColor`, and a gradient-painted element
computes that as transparent, so the probe skipped the badge's real backdrop and compared
against the white header behind it.

But the badge *was* failing AA — 3.53:1 at its lightest stop against 8px white text. The
bogus failure had been standing in front of a real one the whole time, and because the
number was obviously wrong, nobody looked past it to ask whether the element was fine.

Two lessons. **(1) A checker that cannot see a construct must say so, not silently produce
a number.** Skipping with a warning would have been honest; guessing was not. **(2) When a
tool reports something impossible, the bug is in the tool AND possibly in the thing it is
pointed at** — fix the tool first, then re-read what it says, because the fix often
changes the verdict rather than clearing it.

Fixing it properly (score against the worst gradient stop) made the audit *stricter* and
it still passed everywhere else — which is the evidence that nothing else was hiding in
the same blind spot. A fix that only silences the message would have proven nothing.

## Verify each stale assertion separately — "same refactor" is not "same fix"

Seven specs were failing after the dockable-panel refactor and it was tempting to sweep
them all into `isPanelOpen(...)`. Probing the live app first showed five different truths:
the Layers flag is dead but the **Property panel flag is still live**, the minimap moved to
`minimapVisible`, canvas background is `canvasBackgroundColor`, the theme cycle lost a
step, and zen mode never touched the flags at all — it gates rendering, so its test needed
to assert on the DOM instead.

A blanket fix would have left four tests passing for the wrong reason, which is worse than
failing. **When several tests break from one change, confirm the mechanism per test** — a
shared cause does not imply a shared remedy. The cheap way is a throwaway probe spec that
calls each API and dumps the resulting state; five minutes of that replaced all the
guessing.

## What goes in a list INDEX has to be bounded

The asset library copied `drawings-store`'s index/body split — metadata in one key so
listing never loads bodies — but then put an unbounded thumbnail in the metadata. The
capture helper renders at the artwork's natural size, supersampled 2×, so one big
selection would write a multi-megabyte PNG into the very structure that exists to stay
small. `doc-thumbnails` already capped its previews; copying the *architecture* without
copying that detail quietly defeated the architecture.

Rule: **if a field rides along in a listing, it needs a hard size cap at the write site**,
not a hope that inputs stay small. The test that pins it asserts on the decoded
thumbnail's pixel dimensions and the data-URL length, because "it looked fine" only holds
until someone saves a poster.

## A "detached snapshot" has to actually be detached

Assets insert as plain elements with fresh ids — that was the design. But saving a
selection that contained a *symbol instance* stored the instance verbatim, and a
`symbolId` only resolves in the document that defines it. Inserted anywhere else it would
render as a grey placeholder: precisely the failure mode of bug #206, arrived at from a
different direction.

The generalisation: **when a value crosses a boundary its references don't cross, resolve
them at the boundary.** Same class as remapping ids on paste, or clearing `clipMaskId`
when the mask partner isn't in the selection (which this code already did — the symbol
case was simply missed). Worth enumerating *every* referencing field on a type before
declaring a snapshot self-contained.

Bonus from the fix: the expansion logic already existed inside `detachInstance`. Extracting
it instead of writing a second copy means the scaling rules for points/anchors/subpaths
can't drift between the two callers.

## Seamless tiles need the tile size to be a multiple of the cell size

The procedural grain tile picked its side from a target pixel size and its grain cell
independently. Whenever the side wasn't an exact multiple of the cell, the partial cell at
the right/bottom edge met a full cell at the start of the next repeat — a faint grid of
seams, visible even at 14% opacity, which is exactly where texture is supposed to be
invisible. Snapping `side = cells * cell` fixes it and, as a bonus, makes the fBm lattice
period exact so the grunge octaves wrap too.

Worth remembering for anything tiled: **seamlessness is an arithmetic property of the
dimensions, not something the noise function can fix.**

## Teardown of a loading state must live in `finally`, not on the next line

The boot splash was removed on the statement *after* `render()`. That is correct exactly
as long as render never throws — and the one thing a loading screen exists to cover is
the case where startup goes wrong. One boot-time exception and the mascot bounced
forever, which users reported as "sometimes loading gets stuck".

The rule: **anything that dismisses a "we are busy" indicator belongs in `finally`.** If
the indicator is torn down by the success path, then by construction it is permanent on
the failure path. Same shape as the `setLoading(false)` in a `finally` that the drawings
gallery already got right — the splash was just far enough from normal component code
that nobody applied the pattern to it.

Corollary: layer the recovery by *what can still run*. A `finally` in the entry module
covers a throwing render; an `ErrorBoundary` covers a throw or a rejected lazy chunk
below it; but neither runs if the entry module itself fails to load. That last case needs
a timeout in the HTML, outside the module graph. Three layers because each one covers a
strictly smaller failure than the one below it.

## `JSON.parse(x || fallback)` guards the wrong failure

`JSON.parse(localStorage.getItem(k) || '[]')` handles a MISSING key and nothing else. The
value being *present but corrupt* — truncated by a quota-limited write, left by an older
build, hand-edited in devtools — throws. Two component initializers had this, so a single
bad preference took down the entire first render.

Two things worth generalising. **(1) Persisted data is untrusted input**, even when your
own code wrote it; the write may have been interrupted or made by a different version.
**(2) A crash is never the right response to a broken UI preference** — read it
defensively, fall back to the default, and *delete the bad key* so it stops re-breaking
every boot. The repo already had the correct pattern in two places; the fix was mostly
noticing the inconsistency and giving it a name (`utils/safe-storage`) so the next person
reaches for it.

And it explains the intermittency, which is the part that made it hard to report: nothing
was random at all — it reproduced 100% on the profiles that had the corrupt value and 0%
everywhere else.

## A parser that skips what it doesn't understand fails silently *upward* (arc support)

`PathUtils.parsePath` had no `A` case. The consequence wasn't a visible glitch — it was
nine shapes quietly losing "Convert to Path", Simplify, Smooth, Offset and text-on-path,
because an empty command list looks exactly like "this shape has no outline", which every
caller correctly interprets as "don't offer the operation". Nobody filed it because the
menu item simply wasn't there to be broken.

Two rules. **(1) In a token-driven parser, an unhandled command must still consume its
arguments** — otherwise its operands are re-interpreted as commands and the damage spreads
past the one segment. **(2) Prefer lowering to an existing primitive over adding a new
one**: flattening arcs into cubic `C` segments meant length, point-at-t, tangent, outline
sampling and every downstream consumer worked immediately, with zero new code paths to keep
in sync. A new `A` command type would have needed all of them updated, and would have
missed at least one.

The bug surfaced only because a new feature (Simplify auto-converting non-paths) was tested
against a *cloud* rather than a rectangle. **Test the awkward member of a family, not the
representative one** — the representative one is representative precisely because it works.

## Dead state fields are worse than missing ones

Three `showXPanel` booleans survived the dockable-panel refactor as initialized-but-never-
written fields. They didn't crash anything; they answered `false` forever, which is a
*plausible* answer. A spec asserting on one had been failing for however long, and reading
the field was the obvious thing for any API consumer to do.

When state moves house, the old field must either move with it or be deleted — leaving it
behind creates something that type-checks, reads naturally, and lies. Where deleting is
risky, at minimum annotate it at the initializer (this repo already did that for
`showVectorToolsPanel`, which is how the pattern was recognisable) **and ship the
replacement accessor at the same time**, so there is somewhere correct to point people.

## "Auto-convert first" needs to be one history entry, not two

Simplify now converts a pencil stroke to a path before simplifying it. The naive
implementation calls `convertToPath()` then does the simplify — and each pushes its own
undo step, so one user action costs two Ctrl+Z. The fix is an internal `{ silent: true }`
that suppresses the inner op's history push, selection change and toast, leaving the outer
op as the single owner of all three.

Generalisable: **when composing an existing user-facing operation into a larger one, the
inner op's side effects (history, selection, notifications) are the caller's to own.** An
e2e that performs the compound action and asserts a *single* undo restores the original
state is the cheap way to keep that honest — it caught the two-step version immediately.

## Per-document vs cross-document is a data-model decision, not a storage one

Symbols are document-scoped for a real reason: an instance is a live link to its master, so
the two must travel in the same file. That makes symbols the wrong tool for "a shelf of
trees I reuse across projects" — not because of where they're stored, but because the link
is meaningless once it leaves the document.

The asset library is therefore deliberately NOT symbols-with-different-storage: assets are
detached snapshots that insert as ordinary elements with fresh ids and no back-reference.
Once that was clear, the implementation fell out — reuse the existing paste path
(`pasteYappyElements`) for id remapping and centring, and mirror `drawings-store`'s
index/body split in IndexedDB so listing never loads bodies.

One concrete trap: the new library cards initially reused `.sp-card`/`.sp-thumb`, the
classes the symbols specs count. **A new UI section sharing an existing section's CSS
classes silently changes what every selector counting those classes means.** Give the new
section its own classes even when the styling is identical.

## Deterministic procedural texture, or it shimmers

Noise/grunge tiles are generated from a hash seeded by a stored `seed`, never
`Math.random()` at render time. A tile regenerated per redraw would flicker during
animation and — worse — differ between the canvas and the SVG export, so exports wouldn't
match what was on screen. Seeding once at creation and persisting it makes the texture a
property of the artwork rather than of the render.

## The setStore-merge family struck twice more: Records don't delete, reconcile keeps identity (v0.8.144 scenes)

The scenes feature hit the same Solid-store trap in two new costumes on one day. (1) A
Record-valued store field written with plain `setStore('animScenes', scenes)` MERGES keys —
a key deleted from `scenes` survives in the store; deletions require `reconcile()`. (2)
`reconcile()` diffs IN PLACE, so the store proxy's identity never changes — an
identity-keyed cache (`cache.map !== store.animScenes`) never invalidates and silently
serves stale data. And again: a stash holding the live proxy aliased every scene to one
raw node the moment the active timeline was merged over.

The rule that covers all of it: **treat Solid store nodes as append-only views. Snapshots
are clones, deletions go through reconcile, and cache keys must be content-derived, not
reference-derived.** Every one of these was caught by an e2e asserting round-trip equality
— data-shape tests (save → load → compare) find aliasing bugs that unit tests structurally
cannot, because the alias IS the same object passing its own equality check.

## Solid's setStore MERGES objects — a "stashed" store proxy is not a snapshot (Animation Studio)

The movie-clip edit-in-place session stashes the document's frame timeline, swaps in the clip's
own, and restores the stash on exit. The restore silently did nothing: the stash held
`store.animTimeline` — the live proxy — and `setStore('animTimeline', lifted)` doesn't replace
the underlying object, it **shallow-merges keys into the existing raw node**. So the "stashed"
timeline tracked every subsequent edit, and restoring it was a self-merge no-op. Symptom: a
keyframe added inside the clip session also appeared (blank) on the document timeline after exit.

Rules worth keeping: (1) anything you intend as a snapshot of store state must be a **clone**,
never a proxy reference — `captureSnapshot` already knew this, the new code path didn't; (2) when
a value survives an operation that should have replaced it, suspect merge-not-replace semantics
before suspecting your logic. The step-by-step instrumented dump (state after every op) found in
minutes what re-reading the code did not.

## Two subsystems sharing one flat element list need ONE reconciler, not N hooks (Animation Studio)

The cel model (keyframes own element ids) has to stay consistent with `store.elements`, but
elements are created by dozens of code paths (draw tools, paste, duplicate, AI, API, symbol ops).
Hooking each creation path would have been a whack-a-mole. One reconciler effect — "any element
referenced by no keyframe joins the active cel; refs to deleted elements are pruned" — runs after
every mutation and covers all paths, including future ones, with no per-path code. The general
lesson: when an invariant spans two stores, enforce it in one idempotent reconciler driven by a
coarse dirty signal rather than patching every producer.

## Check the unit before trusting the measurement (v0.8.141)

Testing rotated crop, I set `angle: 45` meaning degrees. This codebase stores angles in RADIANS —
`api.ts` says so explicitly — so the element was rotated ~2578 degrees while my expected value was
computed for 45. The drift came out at 76.5px and I nearly reported it on that basis. Re-running
with `Math.PI / 4` produced *the same* 76.5px, so the bug was real; but the agreement was a
coincidence of the arithmetic, not confirmation.

Two things worth keeping. A measurement whose expectation is derived from a convention you
assumed is only as good as the assumption — grep for the unit before computing, especially for
angles, where degrees-vs-radians is silent and both are "valid". And when a wrong setup and a
right setup produce the same number, that is luck; treat matching results from different inputs as
a reason to look harder, not as corroboration.

## A fix that changes an invariant breaks the code that assumed it (v0.8.139)

0.8.136 made crop shrink the element's frame to the cropped region — correct, and it broke
re-cropping. `renderCropOverlay` draws the full image into the frame, an assumption that held
only while the frame stayed full-size. So the second crop of an image squeezed the whole picture
into the small frame and the crop could only ever cut further in. The first crop looked perfect,
which is why it shipped twice.

When a fix changes what a value MEANS — here "the frame is the whole image" became "the frame is
the kept region" — grep for the other readers of that value before shipping. The bug is never in
the code you changed.

Also worth its own line: `el` is a live store proxy, not a snapshot. `enterCropMode` called
`updateElement(id, { crop: null })` and then read `el.crop.x` — null by then, throwing. Reactive
proxies make "read after write" a different operation from what the code looks like; snapshot the
values you need before mutating.

And the accessibility angle I only reached because the user asked how crop works on a tablet:
apply was Enter-or-click-outside and cancel was Escape ONLY. Keyboard-only escape hatches are
invisible in a feature audit — everything works when you test with a keyboard. Ask "what does this
look like with only a finger?" for any mode that has to be exited.

## Audit the token vocabulary, not just the token values (v0.8.138)

After fixing `--text-color` (undefined, 6 files) in 0.8.136 I treated it as a one-off. It wasn't:
**24 CSS custom properties were referenced and never defined**, `--accent-color` in 29 files
alone. One of them, `--bg-primary`, is why every floating panel rendered WHITE in dark mode —
`var(--bg-primary, #fff)` had been quietly returning `#fff` since it was written.

The check is four lines: collect every `--x:` definition, collect every `var(--x`, diff. I should
have run it the moment I found the first instance. When a bug's mechanism is "a name that resolves
to nothing", the right follow-up is never "fix that name" — it is "enumerate every name and see
which others don't resolve". Same shape as the help-doc API sweep, and I had already written that
one this session.

Two smaller lessons from the same fix. Defining a missing token **changes rendering wherever it
was used** — `.toolbar-btn.active` gained the tint it always specified — so pick light values that
match the old fallbacks exactly and the light theme is unchanged *by construction* rather than by
inspection. And an audit's surface list is its coverage: mine visited 9 surfaces and reported the
app clean while panels elsewhere were literally white. It now visits 27 and **asserts how many it
visited**, so a renamed control degrades into a failure instead of a quiet pass.

## Test the path the user takes, not the one you just built (v0.8.137)

I fixed crop distortion in `exitCropMode`, added a `Yappy.exitCropMode()` API so it could be
tested, tested it, watched it pass, and shipped. The editor never calls that function with
`apply = true` — both UI apply paths (Enter, click-outside) did the conversion inline and called
`exitCropMode(false)`. The bug was untouched and the release note claimed it was verified.

The failure has a specific shape worth naming: **I added an API in order to test, then tested the
API.** That's circular — the new surface was the only caller of the fixed code. Whenever testing
requires new plumbing, ask what the *existing* callers do; if they don't go through the code under
test, the test proves nothing about the product.

The deeper cause is one this session keeps repeating: an operation implemented more than once.
Two presentation toolbars, two save paths, two theme cycles, and now three crop-apply paths. The
fix is always the same — collapse to one path — and the tell is always the same: a change that
demonstrably works but doesn't reach the user.

## A CSS variable that doesn't exist fails silently, forever (v0.8.136)

The Layers panel title sat at 1.30:1 in dark mode because of
`color: var(--text-color, #0f172a)`. There is no `--text-color` in this codebase — the token was
never defined — so every use quietly took its fallback and pinned a near-black literal in all
three themes. Six files referenced it. In light mode the fallback happened to look right, which
is exactly why it survived.

`var()` has no failure mode: a typo'd token is indistinguishable from a deliberate default. Worth
grepping for `var(--x` names against the set actually defined, the same way I checked the help
docs' API names against `api.ts` — both are "references that fail silently when wrong".

The other half of this one: my 0.8.134 sweep reported the whole app clean, but it visits nine
named surfaces and the Layers panel isn't among them. **An audit proves the surfaces it opens,
not the app.** The clean result was true and much narrower than it sounded.

## Two coordinate systems, one field name, no conversion (v0.8.136)

Crop was authored in element-local coordinates and read back as source pixels. `enterCropMode`
did the conversion one way; `exitCropMode` wrote the raw rect. The field is called `crop` in both
places, so nothing looked wrong — the bug only shows when the element's displayed size differs
from the image's natural size, which is most of the time, and it presents as "the crop is off"
rather than "the units are wrong".

When one value has two coordinate spaces, put the space in the name or convert at a single
boundary. And the second fault was hiding behind the first: even with correct units, the frame
was never resized, so the crop was stretched back over the old aspect ratio. Two bugs with one
symptom — fixing either alone would have looked like a partial fix and invited the conclusion
that the remaining error was something else.

## Two things looking the same is a claim to measure, not to eyeball (v0.8.135)

"Focus appears the same as dark?" turned out to be exactly right — 152 of 921,600 pixels, a
16x14 region that was the theme button's own icon. But my first attempt to check it produced
23,000-31,000 differing pixels on paged documents, which would have said the opposite. That
difference was a TOAST: present in one screenshot, faded by the next. A transient overlay
dominated a whole-screen diff and nearly reversed the conclusion.

When diffing UI states, suppress anything time-dependent before capturing — toasts, spinners,
caret blink, hover states — or the measurement reports timing rather than the thing you asked
about. And the direction of the error matters: a diff that is too LARGE is the dangerous one,
because it confirms "there is a difference" and stops the investigation.

The underlying bug was ordinary: a theme documented as "dark UI chrome AND dark canvas" had lost
the canvas half, and a comment claiming `setTheme` handled it had gone stale years before. The
tell was there in prose the whole time — the code and its own description disagreed, and nobody
had measured which was true.

## An empty result and a clean result look identical (v0.8.134)

The whole-app contrast sweep reported 0 failures in all three themes. It was measuring a blank
page: Vite's cold start had not finished, `goto` alone was taking 24s, and an audit that finds
nothing because nothing rendered is byte-identical to one that finds nothing because everything
passes. I only caught it because a screenshot taken moments later came back white.

Any check whose success condition is "found no problems" needs a positive control — assert the
thing you searched was actually there. The sweep now requires >200 DOM elements before it will
report. The same trap sits under grep-based verification ("no matches, therefore clean") and
under test filters that silently match zero tests.

A second, cheaper lesson from the same run: before believing 6 unfamiliar test failures were
mine, I stashed the work and re-ran them on the committed baseline. Identical failures. That
30-second check is the difference between "I broke five specs" and "these were already broken",
and it should be reflexive whenever unfamiliar tests fail.

## `opacity` is not a hover state — it fades toward the backdrop (v0.8.133)

`opacity: 0.9` on a filled button composites the *whole* element toward whatever is behind it.
On a white panel the blue fill lightened while the white label stayed white, so hovering
LOWERED contrast from 3.68 to 3.21. Every instinct says a hover tweak is cosmetic; this one
made an already-failing button worse, and looked completely fine to the eye.

The rule: a hover state should change a *colour*, not a *transparency*. Fading works only when
the element and its backdrop are far apart in luminance, which is exactly what you can't
guarantee across themes. Same failure mode as [[a-transient-overlay-must-not-intercept-clicks]]
— opacity silently couples an element's appearance to whatever happens to sit under it.

Second lesson, bigger: the report was "hover contrast on the Done button." Measuring found the
button failed at REST too, in both themes, and that 18 other buttons shared the identical
`--primary-color` fill + white text. One visible symptom, a systemic cause. When a user reports
a contrast problem, measure every state and grep for the pattern before fixing the instance —
the reported case is a sample, not the population.

The root cause was a token doing two jobs: `--primary-color` is right for borders, icons and
active states (where lighter reads better) and wrong as a fill under white text (3.7:1). Splitting
it into `--btn-primary-*` cost three lines per theme and made both roles correct. A single token
serving two contrast contexts cannot satisfy both.

## Never truncate a file to write what you're still reading from it (v0.8.132)

`open(p,'w').write(open(p).read().replace(a, b))` silently emptied `package.json`. Python
evaluates the call target before the argument, so the file is truncated by `open(p,'w')` and
the subsequent `open(p).read()` returns `''`. It writes nothing over nothing and exits 0 — the
only symptom was a later `grep` finding no `"version"`.

Two habits that would have caught it: read into a variable first (`s = open(p).read()`; then
open for write), which is what the neighbouring edit in the very same script did correctly; and
treat "a command that should have printed something printed nothing" as a finding rather than
noise. Recovery was free only because the file was tracked and unmodified — the same one-liner
against an uncommitted file destroys it outright. Prefer the editing tools over shell rewrites
for tracked files, and never batch a risky in-place rewrite with unrelated edits.

## A transient overlay must not intercept clicks (v0.8.132)

The toast sits `position: fixed`, bottom-centre, z-index 10010, 300px wide — directly over the
presentation toolbars at bottom-centre, z-index 10000. 59px of overlap, so a press aimed at a
tool button hit the toast instead and did nothing. Then the toast faded, removing the evidence.

The general rule: anything that appears unbidden, covers other UI, and leaves on a timer should
be `pointer-events: none`, with only its own controls opting back in. Position fixes alone
aren't enough — they solve today's collision while leaving the next one to eat clicks. It's
worth noting the tests found this before a user did, in a sense: several specs needed toasts
deleted before they could click, and I treated that as test friction rather than the product
telling me something. Related: [[verify-a-regression-test-by-reintroducing-the-bug]].

## Verify a regression test by reintroducing the bug (v0.8.131)

Eight new capture tests passed on the first run. Seven deserved to; one didn't. Temporarily
putting each bug back showed the #188 test — "both presentation toolbars carry the capture
buttons" — passing happily with the buttons stripped out of the infinite-canvas toolbar.

The cause was environmental, not logical: the test set up a slides document, then reloaded to
check the infinite canvas, and **the reload restored the last auto-saved document**. So the
second half re-inspected the paged toolbar and found the buttons exactly where it left them.
The assertion was right, the setup silently lied, and nothing in a green run would ever have
said so.

Two things to carry: a test that reaches its subject through app state you didn't set
explicitly isn't testing what its name claims — pin the state, then assert you're looking at
the right thing (here, the slide counter identifies which toolbar rendered) before asserting
about it. And the only cheap proof a regression test works is watching it fail against the
defect; "it passes" is not evidence when the bug is absent. Related:
[[this-codebase-forks-its-toolbars-by-doc-type-check-for-the-twin]].

## A busy-flag not cleared on the throwing path is a permanent outage (v0.8.130)

The live GIF capture ran in a `requestAnimationFrame` loop with no try/catch. A throw
killed it silently — but the damage was the *flag*: `gifCapturing()` stayed true, the
buttons are `disabled` while it is, so one transient failure turned into "the feature does
nothing, forever, no matter what I click." The user reported it as "nothing happens on any
option", which is precisely what a stuck busy-flag looks like from outside and nothing like
what the underlying error was.

Two rules worth keeping. Any flag that gates a control must be cleared on **every** exit
path, the throwing one included — a `finally`, or an explicit handler that owns the reset.
And an async loop driven by rAF or timers swallows exceptions by default: nothing awaits it,
so there's no rejection to surface and no stack in the console unless you put one there.
Silent-by-construction code needs its error path written deliberately.

The diagnostic upgrade mattered as much as the fix: a `SecurityError` from `getImageData`
on a canvas tainted by a cross-origin image now says so by name. "GIF capture failed" would
have sent the user hunting through animation settings instead of at the image they pasted.

## Argue from the artifact, then check the workflow that produces it (v0.8.130)

I pushed hard for fixed-duration GIF capture over start/stop, on two grounds: a chosen
duration matches an animation's cycle for a clean loop seam, and length costs bytes. The
user asked one question — animations here fire on clicks and conditions, so how would you
know the duration? — and both arguments collapsed.

The seam argument actually **reversed**: for triggered animation a human can stop the
instant motion returns to its start pose, which a blind timer cannot. And I had asserted an
open-ended capture would "accumulate raw frames until the tab dies" — untrue of the
implementation I then built, which encodes and appends each frame and never retains raw
ones, so memory is bounded by output size (~40KB/s). I had reasoned about the *artifact*
(GIFs loop, GIFs are big) and never checked those claims against the *workflow* or the
code I'd written.

Worth remembering: a confident architectural argument built on properties of the output
format is exactly the kind that survives unchallenged, because it sounds like domain
knowledge. Ask what the user has to *do* to produce the thing, and verify any resource claim
against the implementation rather than the mental model of it.

## This codebase forks its toolbars by doc type — check for the twin (v0.8.129)

Second time in two releases. In v0.8.128 the compact "brainstorm" toolbar turned out to be
a separate component from the full toolbar's pen group. Here, the presentation HUD is
`presentation-controls.tsx` for paged docs (slide arrows + counter) and
`canvas-toolbar.tsx` for the infinite canvas (tools only) — same visual language, same
bottom-centre pill, no shared code. I added the record button to one, verified it on a
slides document, and shipped a half-fix that the user caught immediately by showing a
screenshot of the toolbar I hadn't touched.

The generalisable rule: before adding a control to a toolbar/HUD/panel here, grep for
components sharing its icon imports (`grep -l Zap | xargs grep -l Highlighter` found all
three in seconds). And when a feature is doc-type-sensitive, verify on the OTHER doc type —
the one you didn't develop against. My verification was real but ran on the wrong document,
which is worse than no verification because it produced false confidence.

Worth noting which half needed it more: the infinite canvas has no page bounds, so the
offline page export cannot run there at all, making live recording the only route to a
video. The variant I skipped was the one where the feature was load-bearing.

## Setting state on a component a `<Show>` has unmounted is a delayed ambush (v0.8.129)

Ctrl+Shift+E during a presentation "did nothing" — then the Export dialog appeared when the
user pressed Esc. `<ExportDialog>` lives inside `<Menu>`, gated on
`appMode !== 'presentation'`, so the shortcut set `showExportDialog = true` against nothing.
Leaving the presentation remounted `<Menu>` and the stale flag rendered.

Two lessons. First, a boolean "is this dialog open" flag outlives the component that reads
it, so unmount is not close — anything that gates rendering on mode needs the corresponding
state cleared on mode entry. Second, a shortcut that quietly no-ops is worse than one that
refuses out loud: the silence taught the user the key was broken, while the real behaviour
was "armed, fires later". Declining with an explanation converts an invisible state change
into an answer. Related: [[the-default-you-change-is-a-probe-into-everything-that-hard-coded-it]].

## A dangling pointer to "the thing I'm editing" needs one owner, not N resets (v0.8.128)

`activeDrawingId` says which My Drawings entry the live document belongs to. Saving
honours it — correct when re-saving the open drawing, catastrophic after File → New,
which never cleared it: the next save overwrote and renamed the previous entry, so the
library only ever held the most recent drawing. The tempting fix is `setActiveDrawingId(null)`
in `handleNew`. But five call sites replace the live document (New, disk, JSON, cloud,
template restore) and all five had the same hole.

The fix that holds is an invariant with one enforcement point: **loading a document
detaches; only `openDrawing` re-attaches.** Clearing it inside `loadDocument` covers every
present and future path for free, and `openDrawing` already set the id immediately after
loading, so it needed no change. When a pointer must be invalidated by an event, put the
invalidation where the event is, not where each caller is.

Enforcing it meant `app-store` needed to write a value owned by `drawings-store`, which
imports `app-store`. Rather than a dynamic import or an event bus, the value moved to a
leaf module (`storage/active-drawing.ts`) that imports nothing but solid-js, re-exported
for compatibility. A cycle is usually a sign that a piece of shared state is filed under
one of its users instead of underneath both.

The neighbouring bug had the same shape: `clearAutoSave()` (which resets `isDirty`) was
called on the workspace save path only, so a My Drawings save left the document "unsaved"
and File → New prompted about work just saved. Two save paths, one of them remembering to
mark the document clean. Related: [[before-deleting-a-line-ask-what-else-it-was-holding-up]].

## The default you change is a probe into everything that hard-coded it (v0.8.128)

Making Ink Brush the startup tool surfaced a bug nobody had hit: the compact "brainstorm"
toolbar the app opens in is a *different component* from the full toolbar's pen group, and
its pen button was pinned to `type: 'fineliner'`. Its active check was
`selectedTool === tool.type`, so with any other pen in hand nothing highlighted — and
clicking it silently demoted the user's chosen pen. That had been true forever; a default
of Fineliner just meant the common case accidentally matched.

Two things worth carrying forward. First, changing a default is a cheap way to find every
place that quietly assumed it — the change is one line, but the fallout maps the assumption.
Second, the same control existing twice in two layouts is the actual defect; the pinned
type was a symptom of the compact toolbar re-implementing rather than reusing the pen group.

The verification lesson: the DOM told me `selectedTool === 'inkbrush'` while the screenshot
showed nothing lit. Both were true, and only looking at the rendered toolbar caught it —
asserting on state alone would have passed a visibly broken UI.

## "It works sometimes" names the metric your tests should assert (v0.8.127)

Smart shapes were reported as unreliable, not broken — and that phrasing is the whole
diagnosis. A spot-check test proves a shape *can* be recognised, which was never in
doubt; what regressed was the rate across attempts. So the tests generate 100 seeded
attempts per shape with a deterministic LCG and assert a floor on the recognition rate.
A single happy-path test would have passed against the broken code on a lucky seed.

The bug underneath had the same shape. The classifier measured fit well (a rectangle
scored 2.44 against the ellipse's 7.99 — a landslide) but rejected it anyway, because it
read the corner count off RDP and bailed above 4. RDP leaves redundant points on straight
edges, so a *perfect* rectangle reported 5 corners. The lesson: when a pipeline has a
robust scoring stage and a brittle discretising stage, the brittle one decides the
outcome, and its failures look like noise rather than a bug. Don't trust a count you
didn't measure a confidence for — here, over-supply corners and reduce greedily until
the count falls out of the fit metric you already trust.

Two smaller ones worth keeping. Discriminating a triangle from a rectangle by comparing
fit errors can't work: a quad fits a wobbly triangle nearly as well because it spends its
spare corner shaving jitter (ratio 0.99–1.34 for genuine triangles — no threshold splits
that). The geometric question "does the stroke actually turn at that corner?" separates
them cleanly. And an accuracy fix can be a performance regression: greedy reduction is
O(corners³·points), so a 2000-sample stroke cost 22ms from the dwell timer with the pen
still down. Every metric was a mean, so a 240-point subsample gave the same answers at
5.4ms — check the cost of a fit that runs mid-gesture. Related:
[[before-deleting-a-line-ask-what-else-it-was-holding-up]].

## Before deleting a line, ask what else it was holding up (v0.8.126)

Removing `setSelectedTool('selection')` from the smart-shape snap was the whole
user-visible fix — one line. But that line was load-bearing twice over: the
heal-on-move path re-opens a pen stroke when a stylus is in contact, gated on
`isPenDrawingTool()`, and it was the tool switch flipping that predicate to false that
kept a still-touching Surface/Wacom pen from drawing a stray mark right after the snap.
The explicit guard for this, `smartShapeSuppress`, only covered the iPad TouchEvent path,
because on the pointer path the tool switch made it redundant. Delete the implicit guard
and the bug returns on exactly the hardware that's hardest to test.

The tell was there in the code: `if (touchDrivingPenStroke) smartShapeSuppress = true;`
A guard that fires for only one of two equivalent input paths is usually a guard whose
other half is being done implicitly somewhere else. Chase the asymmetry before you touch
the thing it depends on. Related: [[dont-open-panels-the-user-didnt-ask-for]].

## A creation default that disagrees with the render fallback is a latent bug (v0.8.125)

Shape labels rendered left-aligned even though every renderer wrote `el.textAlign || 'center'` —
because creation spread `defaultElementStyles.textAlign: 'left'` onto the element, so the fallback
never fired. Two places encoded "the default", they disagreed, and the one that ran first won.
Fixing it was one word, but finding it meant noticing that the `?? 'left'` in `api.ts` and the
`|| 'center'` in `render-pipeline.ts` were describing the same decision. When a property has a
default in both the constructor and the consumer, they must agree — otherwise the consumer's
fallback is dead code that reads like live intent.

The migration question answered itself: `textAlign` isn't in `SETTINGS_KEYS`, the allowlist of keys
persisted to `localStorage`, so no stored blob could carry the old value. Checking what's actually
persisted before writing a migration is cheaper than writing the migration. Related:
[[dont-open-panels-the-user-didnt-ask-for]].

## Don't open panels the user didn't ask for (v0.8.125)

`setSelectedTool` force-opened the Properties panel for any non-selection tool. Reasonable in
isolation — you picked a tool, here are its defaults — but during a brainstorming session, where
tool switches happen constantly and the canvas is the whole point, it read as the panel fighting
for space. The right model is: a panel opens on an explicit request (button, shortcut, right-click
on a tool group) and then *stays* — persistence, not prediction. Note the auto-open was the only
implicit trigger; all eighteen tool-group call sites were already behind `handleRightClick`, so the
fix was deleting the one that guessed. Related: [[a-creation-default-that-disagrees-with-the-render-fallback-is-a-latent-bug]].

## Put the knob where the content is, and match cues all-or-nothing (v0.8.115)

Per-panel emotions could have been an index-keyed API (`emotions[panelIndex][speaker]`), but panel
indices are derived from the script — edit a line and every index shifts. Putting the cue inline
("Ann (angry): ...") means it travels with the line it describes and needs no separate mapping;
because each panel is planned from its own utterances, per-line is per-panel for free. Generalising
the existing `(thinks)` bracket to comma-separated tokens let the two compose without new syntax.

The subtle part is the failure mode: the bracket is matched **all-or-nothing**. Recognising
`angry` in `(angry, CEO)` and ignoring `CEO` would silently discard half of what the user wrote —
worse than not matching at all, because it looks like it worked. When parsing optional user syntax,
prefer "understand everything or nothing" over partial credit. Related: [[comic-studio-overrule-the-inference]].

## A filter written for one case silently drops the next one (v0.8.114)

Narration captions rendered as nothing at all: `planComicPanel` narrowed utterances with
`filter(u => speakers.includes(u.speaker))` — written when every line had a speaker. A caption has
none, so each one was dropped without a warning; balloons appeared, captions didn't. The layout
tests passed because they call `layoutPanel` directly and never go through that filter. The tell is
a predicate that encodes an assumption ("everything has a speaker") which a later feature quietly
breaks. Worth grepping for filters near any new data shape — and worth running the real thing,
which is how all three of this session's silent-drop bugs surfaced.
Related: [[comic-studio-overrule-the-inference]].

## Keep the public API type in step with the options object (v0.8.113)

Added thought/whisper balloons, and caught a gap while shipping: `emotions` had been added to
`ComicPanelOptions` in the library but never to the **inline option type on `api.ts`**. It worked at
runtime and every test passed — only a TypeScript caller would have hit it. When an API method
re-declares its options inline rather than importing the library's type, the two silently drift.
Either import the real type, or check both whenever an option is added. Cheap lesson; would have
been an annoying bug report. Related: [[comic-studio-overrule-the-inference]].

## Comic Studio: let the user overrule the inference (v0.8.112)

Added strips, a panel UI and emotion overrides. Three things worth keeping:

**1. Derive the preview from the same functions that do the work.** The panel reports "2 speakers
· 2 panels, Alice waves" — all of it computed by calling `parseScript`/`castSpeakers`/
`splitIntoPanels`/`poseForLine` directly, the very functions the generator calls. No layout logic
lives in the component, so the preview physically cannot drift from the drawing. Keeping the
engine pure is what makes that possible; it's the main payoff of having done so.

**2. Don't infer things about people from incidental data.** v1 alternated male/female figures by
turn order, so the second speaker was always drawn female — inferring a person from where their
line happened to fall. Replaced with an explicit per-speaker map. The characters were already
distinguished by pose and by facing each other, so the default needed no gendering at all.

**3. Give the human the final say — that was Comic Chat's actual insight.** The emotion wheel
existed because no parser can reliably tell how someone feels; the rule table is a good *default*,
not an authority. Our emotion palette is the same bargain, and it's kept short on purpose: every
entry maps to a pose we have art for, because an option that can't be drawn is worse than no
option. Related: [[comic-panels-measure-the-art]].

## Comic panels: measure the art, don't assume it (v0.8.111)

Second feature mined from the Comic Chat study ([docs/microsoft-comic-chat-algorithm.md](microsoft-comic-chat-algorithm.md)):
`api.createComicPanel(script)` → posed figures + balloons. Four things worth keeping:

**1. `generateId` scans the STORE, so batch generators must pass `batchIds`.** It derives the
next number from existing elements, so generating 20 ids *before* committing any of them
produced 20 identical ids — every balloon rendered the same text. `generateId(type, batchIds)`
exists for exactly this; thread one Set through the whole generator. Any future "create N
elements at once" API has this trap.

**2. Imported SVG paths default to `architectural`.** `svgToElements` sets that regardless of
the document style, so a generated panel came out half rough (balloons) and half clean
(figures). Anything composing imported art with native shapes must force
`store.defaultElementStyles.renderStyle` on the imported parts.

**3. Measure the art instead of deriving from the viewBox.** Stick figures have a 140×260
viewBox, so I predicted height = width × 1.857. Wrong: `svgToElements` scales to the
**content** bounds, and content extent differs per pose — the real ratio was ~3.86 and varies.
Fix: build the figure detached, measure it, then scale to a target *height*. Corollary: give
the caller a height knob, not a width knob, when height is what they actually care about.

**4. Layout slots must fit the widest thing in them.** Sizing each character's slot to the
figure alone made balloons overlap horizontally, so the reading-order rule stacked them into a
tall narrow column. Sizing the slot to `max(figure, that speaker's widest balloon)` turned it
into a proper wide panel. Also: Comic Chat's §5.2 rule is pairwise, not sequential — a balloon
must be no higher than the *bottom* of any balloon to its **left** and no higher than the *top*
of any to its **right**; my first version only checked x-overlapping predecessors and let a
left-hand balloon float up where it would be read too early.

**Process note (again):** all four were invisible to 34 passing unit tests and were found by
driving the real app and reading the numbers back. And a verification that can silently no-op
is worse than none — my first render-style parity check called a non-existent
`setDrawingStyle`, so both screenshots were identical and "proved" parity that didn't exist.
Related: [[routing-channels-group-invalidation]].

## Routing channels: group layout needs group invalidation (v0.8.110)

Ported Comic Chat's **routing-channel** idea (reserve disjoint intervals so competing elements
never overlap — [docs/microsoft-comic-chat-algorithm.md](microsoft-comic-chat-algorithm.md)) to
connectors: endpoints sharing a node side fan into evenly spaced ports, and elbow routes avoid
running along each other. Four lessons, three of them learned the hard way:

**1. A group-scoped layout function needs group-scoped invalidation.** A port depends on *how many
other endpoints share that side and how they sort*. The existing refresh only touched connectors
bound to the **moved** element, which was correct for the pair-local sibling-spread it replaced —
so peers kept ports computed for a stale group size and two connectors could land on the **same
point**, the exact artefact the feature removes. Whenever layout is a function of a set, every
member must be recomputed when the set changes.

**2. Derive state from what's live, not from what was stored.** v1 decided which side an endpoint
sat on from the persisted `anchorFractionX/Y`, which is written once at connect time. After moving
a shape it was stale, and it *overrode* the existing dynamic re-facing — endpoints stayed on the
far side. Deriving the side from **which neighbour the endpoint faces** (centre→opposite vector) is
inherently move-aware. Caught only by a user screenshot; no unit test would have.

**3. Order the pass instead of widening it.** Routes drifted after unrelated edits because the
refresh effect visited nodes in arbitrary order, so a connector could route against a peer's
previous-frame geometry. Expanding the refresh to whole port groups inside the reactive effect
*seemed* right and caused a **re-entrant refresh storm**. The actual fix was smaller: de-duplicate
and process in **ascending id order**. Since avoidance only consults lower ids, each pass becomes a
fixpoint of the current shape positions — history-independence for free. Group expansion belongs at
interaction boundaries (drag end, connector create), not in the reactive effect.

**4. Filter obstacles at the right granularity.** Clipping connector obstacles per **segment** to
the route's own start→end box disabled avoidance entirely (a 475px overlap in-app): a detour *by
definition* leaves that box, so segment-level clipping drops exactly the segments that matter.
Filter per connector, never per segment. Also bound the obstacle count — each segment injects grid
lines, and an unbounded set inflates the A* grid until it exhausts its 800-iteration budget and
silently falls back to a naive elbow, i.e. **worse than no feature at all**.

**Process note:** unit tests (112, all green) missed every one of these. They were found by an
adversarial code review plus a Playwright harness that drove the real app and asserted
`stable-at-rest`, `identical-after-move-and-return`, and pairwise collinear overlap. For geometry
features, assert *invariants against the running app* — and beware a harness that silently no-ops
(my first version called a non-existent `getElements()` and compared empty arrays, reporting three
false greens). Related: [[reference-study-comic-chat]].

## Reference study: how Microsoft Comic Chat laid out comics with no NLP/LLM

Deep-dive on the SIGGRAPH '96 *Comic Chat* algorithms (paper + Microsoft's now-open-sourced C++)
written up in [docs/microsoft-comic-chat-algorithm.md](microsoft-comic-chat-algorithm.md). Directly
relevant to our auto-layout/connector code: (1) **routing channels** — reserve disjoint horizontal
intervals so deferred balloon *tails* can always be routed without overlap; the same idea maps onto
connector/edge routing (`utils/routing.ts`). (2) **greedy bodies, deferred tails** — do the fast
greedy pass where packing quality doesn't matter, defer the quality-sensitive part with reserved space.
(3) **placement as a weighted evaluation function** minimized greedily (Facing/Neighbors penalties,
40≫4≫1) — a lightweight alternative to a full constraint solver for auto-layout. Meta-lesson: push the
intractable subproblem (emotion inference) into the UI (the emotion wheel) instead of guessing.

## API default arrowheads: match the tool, not the element family (v0.8.107)

`api.createElement` defaulted `endArrowhead` to `'arrow'` for **every** type, so scriptable
`createLine`/`createRectGrid`/`createBezier` sprouted arrowheads the *interactive* line tool never
adds (`polyline-handler.ts` / `draw-handler.ts` create plain lines; only the **arrow** tool/type
carries a head). The tell was five logo specs manually passing `startArrowhead:null, endArrowhead:null`
to `createLine` — a standing workaround for a wrong default. Lesson: when a scripting API mirrors an
interactive tool, its defaults must mirror **that tool's** output, not a blanket per-family fallback.
Here `line` and `arrow` are distinct tools, so the head belongs to `type === 'arrow'` only. Fix was one
line — `?? (type === 'arrow' ? 'arrow' : null)` — plus a regression spec; the old workarounds still win
because an explicit option overrides the default. Also a reminder that `createRectGrid` is reachable
from the UI (Vector Tools panel / context menu), so an "API-only" quirk was actually user-visible.

## Excalidraw interop + the open format spec (v0.8.106)

Yappy and Excalidraw share the same coordinate convention (world-space px, radians, points relative
to element origin), so the interop is a pure field-mapping layer — no geometry conversion. Built
`utils/excalidraw-io.ts` as a **dependency-light pure module** (`toExcalidraw`/`fromExcalidraw` take
and return plain data, never touch the store) so it's unit-testable and reusable. Two design calls:
(1) the ~300 Yappy-only shapes Excalidraw lacks are **downgraded to closed `line` polygons** via
`shapeToPath` (outline + fill survive) rather than dropped, and the downgrade count is surfaced to the
user; (2) on import, ids are regenerated and every cross-reference (bindings, boundElements, groupIds,
containerId) rewritten through an `excalId→yappyId` map — do this in two passes (assign all ids, then
build) so references resolve. The store integration lives only in the thin API wrappers
(`api.exportExcalidraw`/`importExcalidraw`); import appends in ONE `setStore` batch with a single
`pushToHistory` (calling `addElement` in a loop would create N undo steps). Also wrote
`docs/yappy-format-spec.md` — the document format (`SlideDocument` v4) is now publicly documented so
other tools can read/write `.yappy`. Gotcha captured there: `docType` lives at `metadata.docType`
(not top-level), background colour is per-slide (no top-level `canvasBackgroundColor`), element
`opacity` is 0–100 but layer `opacity` is 0–1, and freehand `points` must be flat-encoded.

## Game engine: a `tether` action = a general connector without new physics (v0.8.106)

The Slingshot needed elastic bands that stretch and swing as you pull the bird back. The action set
couldn't express it — `rotate` is a *relative* delta and `scale` a *factor*, so nothing could set an
element's absolute angle/length per frame. Rather than special-case "sling bands", added one general
action: **`tether { ax, ay, target }`** — each tick it rewrites the owner sprite's geometry
(`x,y,width,height,angle`) so it spans as a thin bar from a fixed anchor to the target's centre
(`_tether` helper: `len = hypot(dx,dy)`, `angle = atan2(dy,dx)`, centre at the midpoint). That single
primitive covers bands, ropes, laser beams, and links. Key wiring lessons: (1) `emitAction` in
`behaviors-to-script.ts` is shared by BOTH the behaviors and blueprint compilers, so one case covers
both authoring models; (2) the runtime `Sprite.set({...})` already accepts absolute geometry (the
`scale` action uses it); (3) `ActionParams`/blueprint nodes render params via per-kind `<Show>`, so
an unknown kind degrades to "no params" rather than crashing — but add the kind to `behavior-ui.ts`
ACTIONS + `defaultAction` and an `ActionParams` case to make it a complete, editable action. The
sample gates band visibility on a `launched` var (0 = in the sling → tether+show; 1 = fired → hide),
toggled in the bird's release and leave-screen chains — cleaner than reusing `aiming`, which is only
true during the drag.

## Two copies of one condition drift apart — hoist to a single source of truth (v0.8.106)

Three bugs this cycle were the same shape: a predicate duplicated in two places, then one copy
edited and the other left behind. (1) The Properties panel rendered on `showPropertyPanel && (target
|| minimized)`, but `menu.tsx`'s `propPanelOffset` shifted the top-right controls off
`showPropertyPanel` *alone* — so Alt+Enter with an empty selection moved two icons and showed no
panel. Fix: hoist the panel's `activeTarget` into the store as `propertyPanelTarget()` and derive
`isPropertyPanelVisible()`; both call sites now share it. (2) Text re-fit was gated by
`FONT_METRIC_KEYS.some(...)` in **both** `updateElement` (as a cheap pre-check) and inside
`autoSizeTextUpdates` — so a first attempt that only patched the inner copy was dead code. Fix:
one `needsTextRefit(updates)` predicate used by both. (3) `addChildNode`/`addSiblingNode` each
hand-listed which props to inherit and both omitted fonts. Fix: both spread the canonical
`getStyleSnapshot()`. **Lesson:** when a "should this show / should this fire / what carries over"
rule appears in more than one place, make it one exported function — the second copy will eventually
be edited without the first, and the symptom (a control that half-works) is hard to trace back.

## `applicableTo` config gates whether a control renders at all — text lacked its own props (v0.8.106)

The Properties panel is config-driven: each property's `applicableTo` array lists element types, and
a type absent from the array simply never sees that control. Two properties were missing `'text'`:
`autoResize` (so text had no auto-width/fixed-width toggle) — the sizing mode was frozen at creation.
Fixing visibility alone isn't enough: `autoResize` also had to be **cleared on side-handle resize**
(Figma's auto-width→fixed-width conversion) or the width wouldn't stick — the renderer keeps refusing
to wrap and `commitText` re-hugs the box on the next edit. When adding a shape/attribute, audit
`applicableTo` for every property that should apply to it (this is now the *third* such omission after
the `autoResize`/shapes gap). Separately: fill controls (`backgroundColor`, `fillStyle`) live in the
collapsible `background` group, and group-collapse is **global + persisted** in localStorage
(`collapsed-prop-groups`) — one accidental header click hides fill for *every* shape until re-expanded,
which reads as "fill is broken."

## Shift+drag axis-constrained move — beware the modifier-toggle conflict (v0.8.97)

Added Shift+drag = axis-constrained element move (reuses `constrainToAngle(0,0,dx,dy,45)` on the move
delta, in `handleMove` after snap/grid). **The trap:** Shift is also the multi-select toggle, and
Shift+pointer-**down** on an already-selected element deselected it immediately → the move set was
empty, nothing moved. Fix = **defer the toggle**: keep it selected on down, record
`pState.pendingShiftDeselect`, and on pointer-up toggle it out *only if the pointer didn't drag past
slop* (a click) — otherwise it was a drag (move). This is the general pattern for any
"modifier-click toggles / modifier-drag acts" gesture. Also: closed-path interior hit-testing shouldn't
gate on fill — unfilled boolean results were only outline-clickable until `hitTestPathElement` dropped
the `fillable` requirement for closed subpaths (matches rect/circle behaviour; narrow-phase JS, no WASM).

## Dimension export inclusion (v0.8.96): opt-in, one canvas replay + a parallel SVG emitter

Baking dimension annotations into exports. Patterns:

- **Raster is a free replay.** The export ctx is already in world space (translated by −minX, scaled),
  so `renderDimensions(ctx, …, scale)` — the same overlay pass the live canvas uses — drops straight in
  after the element loop via a `paintDimensions(ctx, elements, scale)` helper, gated on the opt-in flag.
  Pass the *exported* `elements` subset so dimensions on non-exported elements are skipped (the renderer
  already no-ops orphans). Wired into every raster path (PNG/JPG/PDF/copy).
- **SVG needs a parallel emitter, but shares the geometry.** `dimension-svg.ts` mirrors
  `dimension-renderer.ts` node-for-node but emits `<line>/<polygon>/<path>/<text>` — both consume the
  same pure `dimensionGeometry`, so vector and raster stay identical. Arc → SVG path `A`; arrowhead →
  `<polygon>`; label → `<rect>`+`<text>` (dominant-baseline central).
- **Opt-in by default.** Measurement chrome shouldn't leak into every export, so
  `globalSettings.exportIncludeDimensions` defaults false (Settings toggle + `Yappy.setExportIncludeDimensions`).
- **e2e without files:** `Yappy.exportSVG()` *returns* the serialized string (as well as downloading), so
  assert the dimension accent `#6366f1` + label text are present only when opted in — no download plumbing.

## Precision & Measurement polish (v0.8.95): units, angular/radial dims, rotation-aware, true outlines

Four follow-ups completing the plan. Patterns worth keeping:

- **One `units.ts` formatter for every readout.** `pxToUnit` + `formatLength`/`formatArea`/`formatValue`
  (96px = 1in, 25.4mm = 1in) threaded through the HUD, Measure overlay, gap render, and dimension
  labels — so switching `globalSettings.measurementUnit` changes them all consistently. **Gotcha:** the
  Measure tool is a *precision* readout — standard `formatLength` rounds px to whole and dropped its
  historical 1-decimal ("200.0 px" → "200 px"), breaking specs. Keep a `≥1 decimal` variant for the
  measuring line only; the W/H/area card can use whole px. Also the units formatter has no thousands
  separator, so area went "9,600" → "9600" (update the spec, not the formatter — locale commas are flaky).
- **Rotation-aware dimensions via rotate-the-key-points, renderer unchanged.** `dimensionGeometry` now
  rotates e1/e2 and offsets along the edge's *outward normal* (sign-picked by dot with centre→edge). The
  renderer stayed point-based, so it needed no change for linear rotation — only new branches for the new
  `kind: 'radial' | 'angular'` (a straight spoke, or an arc + two radius spokes).
- **New measures piggyback on the discriminated geometry.** Extending `DimensionMeasure` with
  radius/diameter/angle meant one `dimensionGeometry` switch + one renderer switch on `g.kind` — the
  label formatter branches too (`angular` → degrees, else `formatLength`).
- **True outlines by dependency injection.** `getIntersectionPoints(elements, outlineOf?)` keeps the util
  pure/testable; the caller passes a `shapeToPath`-backed supplier (mapping origin-relative anchors →
  world, then applying the element's rotation) so concave/rotated shapes cross on real edges. Circles keep
  the built-in N-gon; lines/paths their own segments.
- **e2e tip:** `setElementTransform({ angle })` takes **radians**, not degrees — pass `Math.PI/4` for 45°.

## Path-intersection snapping (Phase 4c): extra snap targets, computed once per drag

Completes the smart-guide plan: snap the dragged anchor onto where two *static* outlines cross.

- **Reuses the Phase 4b machinery instead of a new snap path.** `getIntersectionPoints`
  (`path-intersection.ts`) turns pairwise segment crossings into a list of points; those are passed
  to `getPointSnap` as `extraTargets`. No second snap loop, no renderer change (the same diamond
  marker) — a crossing is just another target the existing both-axis point snap can lock onto.
- **Compute once per gesture.** Static (non-active) outlines don't move during a drag, so the O(N²·seg²)
  intersection scan runs on the first snapping frame and caches on `pState.intersectionSnapPoints`
  (cleared on pointer-up). A bbox broad-phase skips non-overlapping pairs. Still throttled + JS-only —
  a new module, so (again) no `object-snapping.ts`/WASM change.
- **Outlines are approximated as segments:** bbox edges for most shapes, an N-gon for circles/ellipses,
  the single segment for lines, the anchor polyline (closed) for paths. Good for lines/rects/paths;
  concave shape outlines are bbox-approximate in v1 (documented limitation).
- **e2e design:** choose a crossing that is NOT any element's bbox anchor (two overlapping rects cross
  at (560,400), which is on an edge but not a corner/mid/centre) — otherwise anchor snapping, not
  intersection snapping, could satisfy the assertion.

## Anchor-point snapping (Phase 4b): new module dodges WASM parity; drag double-count gotcha

"Snap to point" — dragging locks bbox corners/mids/centre + path anchors onto another element's
anchors when within threshold on **both** axes. Notes:

- **New module `point-snapping.ts`, NOT `object-snapping.ts`.** The WASM-parity rule (CLAUDE.md) is
  about a JS function and its AssemblyScript twin not diverging. A *new* function has no twin, so
  adding point-snapping as its own JS module is clean and honest — no WASM burden. (A port can come
  later if it profiles hot; the plan's own perf note says snapping is cheap.) Keeping it separate also
  left the WASM-mirrored bbox-axis snap untouched.
- **Drag double-count gotcha (important):** `updateElement` mutates `store.elements` *every* frame, and
  `dx` in `handleMove` is cumulative from pointer-down (`startX` is never re-based mid-drag). So passing
  the **live** store to a snap function computes `moved-position + full dx` = ~2× displacement — it only
  snaps on the first frame and is non-deterministic after. Fix: build the active elements from
  `pState.initialPositions` (original pre-drag x/y) before calling `getPointSnap`; targets are static so
  the live store is fine for them. (The pre-existing axis snap shares this latent structure — left as-is
  to avoid changing established behaviour, but worth knowing.)
- **Playwright:** a single decisive `mouse.move` from down snaps (store still original that frame); to
  test the *real* multi-frame case, do stepped moves with `waitForTimeout` spacing (>16ms throttle) and
  assert the final committed position. Both pass now thanks to the initial-positions fix.

## Fixed-angle constraint (Phase 4a): one pure util, three call sites; Playwright canvas-mount gotcha

Shift → 15° increment snapping for line/arrow **drawing**, element **rotation**, and the **Measure**
drag, all routed through one `utils/angle-constrain.ts` (`constrainToAngle` preserves drag length +
returns the locked display angle; `snapAngleRad` for rotation). Notes:

- **Threading the modifier:** `drawOnMove` didn't receive the event, so drawing had *no* Shift
  behaviour at all. Added an optional `constrainAngle` param and pass `e.shiftKey` from `canvas.tsx`.
  Angle-lock must take **precedence over grid snap** (grid snap would re-break the clean angle) — guard
  the grid-snap block with `!angleConstrained`. Binding-to-a-port still wins (deliberate).
- **Deliberately did NOT touch `object-snapping.ts`** → no WASM-parity burden. The anchor/intersection
  half of Phase 4 (which *does* extend object-snapping) is split out as 4b for a dedicated WASM pass.
- **Playwright canvas-mount gotcha:** after `Yappy.clear()` the blank-doc canvas mounts a frame later,
  so `document.elementFromPoint(x,y)` is `HTML` (not `CANVAS`) briefly and a mouse-draw lands on nothing
  (zero elements created). Fix: `waitForFunction(() => elementFromPoint(x,y)?.tagName === 'CANVAS')`
  before drawing — a fixed `waitForTimeout` is flaky under parallel workers sharing the dev server. Also
  the left region (x≲350) can be covered by a panel — start canvas drags around (400,350)+. And split a
  heavy draw+measure spec into two tests so neither approaches the 30s per-test budget under load.

## Richer Measure readout (Phase 3): pure metrics util + −0 gotcha; ellipse type is `circle`

Extended the Measure tool with Δx/Δy/diagonal/angle (right-triangle overlay) + a single-selection
W/H/area/perimeter card. Notes:

- **`Math.atan2(-0, +x)` returns `-0`**, and Jest/`bun:test` `toBe(0)` uses `Object.is`, so `-0 !== 0`.
  Normalise negative zero at the API boundary (`Object.is(a, -0) ? 0 : a`) — cleaner for consumers than
  making every caller `Math.abs` it.
- **Yappy's ellipse element type is `'circle'`, not `'ellipse'`** (see the `ElementType` union). Shape-aware
  metrics branch on `'circle'` for πab area + Ramanujan circumference; `'line'`/`'arrow'` → zero area,
  segment length; everything else → bbox. Pure `utils/measure-readout.ts`, `bun test`-covered.
- The Measure overlay is a full-screen `pointer-events:auto` DOM/SVG layer, so you **can't click-select
  while it's active** — the single-selection metrics card reads whatever was selected *before* toggling
  Measure on. That's the intended flow (select → Measure → read + drag).

## Measure-to-neighbor (Alt-hover): overlay = pure geometry + a transient render-params signal

Precision & Measurement Phase 2 (measure the gap to an Alt-hovered object). Two reusable
patterns confirmed:

- **Transient canvas overlays ride the render-params path, not the store.** Like
  `snappingGuides`/`spacingGuides`, the measure lines live as a local `createSignal` in
  `canvas.tsx`, are tracked in the redraw `createEffect`, and are passed into
  `renderSelectionOverlays` params — never into the document store. No history, no
  serialization, no undo surface. New overlays should follow this, not add store fields.
- **Idle-hover vs drag is `e.buttons === 0`.** Alt-hover measuring must not fight Alt+drag
  (clone/duplicate). Gating the hover branch on `e.buttons === 0 && e.altKey` in
  `handlePointerMove` cleanly separates read-only inspection from any dragging gesture.
- **Give a new overlay its own colour grammar.** Snapping/spacing guides are magenta
  (`#ff00ff`); measure lines are red (`#ff3b30`) so "inspecting distances" reads differently
  from "snapping is happening", even though `renderMeasureGaps` mirrors `renderSpacingGuides`.
- `getSpacingGuides` looked reusable but computes *equal-distribution* snapping (3-box gap
  equalization), not a direct two-box gap — Phase 2 needed its own `measure-gap.ts` geometry.
- Gotcha: `DrawingElement` has `locked` but **no `visible`** field (visibility is layer-level) —
  filter hover candidates on `locked` only. `bun test` for the pure util; a Playwright spec drives
  the real Alt-hover + asserts canvas frames change/clear.

## Native `<input type="color">` needs a stable DOM node — use `<Index>`, not `<For>` (v0.8.92)

A browser's native colour popup lives *inside* the `<input type="color">` element's
DOM node. If a live `onInput` drag triggers a re-render that **recreates** that node,
the popup is torn down mid-drag and the drag silently dies. In the Appearance stack
editor, `editFill`/`editStroke` rebuild every fill/stroke object on each tick, so the
reference-keyed `<For>` disposed and recreated each row (and its colour input) every
tick — "can't drag the colour picker." Same root cause as the earlier Recolor fix (#114).

**Rule:** for any list row that hosts a native picker / uncontrolled input whose *value*
changes on every drag tick, render with `<Index>` (keys by position → reuses the DOM
node) rather than `<For>` (keys by reference → recreates on new object identity).
`<Index>` flips the callback shape: item becomes an accessor `f()`, index becomes a
plain number `i` (not `i()`).

## Two bug-fix-branch changes: hatch-fill clip + text autosize/fixed-width (v0.8.91)

Two things on the `bug-fixes` branch:

**1. Sketch hatch/zig-zag fill bled outside the shape.** Root cause found by the *intermittency*:
architectural hatch fills were clipped (`applyHatchFill`), but sketch mode left the fill to RoughJS,
whose unclipped, `roughness`-jittered hachure endpoints overshoot the outline — and the overshoot is
seed-dependent, so it looked fine or bled per shape. Fix: route hatch fills through the clipped
`applyHatchFill` in **both** modes (drop the `architectural`-only guard in `buildRenderOptions` and
`applyComplexFills`); RoughJS still strokes the sketchy outline. Lesson: **"sometimes right, sometimes
wrong" on a seeded/random renderer almost always means an unclipped draw whose jitter crosses a
boundary** — look for the missing clip, not a data bug. One fix covered all five HATCH_FILL_STYLES.

**2. Text element: click = autosize, drag = fixed-width box (Excalidraw/tldraw parity).** The whole
text system was fixed-width + auto-grow-height (always wrapped). Added an autosize mode gated on the
existing `autoResize` flag: click-placed text sets `autoResize: true` and grows BOTH width (longest
line via `measureMaxLineWidth`) and height (line count), no wrap; drag-placed keeps `autoResize:false`
(wrap). Touched four coordinated spots that must agree or the editor and canvas drift: creation
(`minor-handlers.ts` `textOnUp`), renderer (`text-renderer.ts` — no-wrap branch), live editor overlay
(`text-editing-overlay.tsx` — grow width + `wrap="off"`/`white-space:pre`), and commit
(`text-editing-handler.ts`). Lesson: **gating the new path entirely on `autoResize` made it safe** —
every pre-existing text (autoResize falsy) renders byte-identically, so the only behavioural delta is
"clicking the text tool now autosizes." Scoped the change to the plain `text` tool; left the rich-text
tool on the old fixed-width default.

## Unified element search Phase 4 — templates in the feed + greeting-card pack (v0.8.90)

Closed the last gap vs Canva: search now spans **elements *and* templates** in one feed.
Lessons:
- **The provider interface paid off exactly as designed.** Adding templates was additive — a
  new `'template'` `AssetKind`, a provider wrapping the existing `searchTemplates(q)`, and a
  Templates filter chip — with no changes to the panel's core loop. When you design a fan-out
  around a uniform `AssetHit` contract, later kinds cost ~one provider each.
- **Render a cheap thumbnail from your own data, don't rasterise.** `templatePreviewSvg` draws a
  template's first page as a tiny SVG (rects/ellipses/text-as-bars) straight from the template's
  element data + palette — no offscreen canvas, no image decode — so template hits are as cheap
  to preview as an icon.
- **A feature can be "done" but under-documented.** The Phase-4 code (search, api, help, test)
  landed complete and tested, but the plan-doc status and learnings weren't updated — worth a
  ship-time sweep so `Status:` lines don't lie. Reuse-don't-rebuild held: the card pack uses the
  same `makeDesign(...)` builder as the existing designs, tagged by occasion so it surfaces in
  both the unified feed and the standalone template browser.

## Main menu: collapse every top-level cluster into named groups (v0.8.89)

The hamburger dropdown had grown long and flat — ~55 items, with only **Game** collapsed. The
**Panels** section alone was ~17 items behind a plain `menu-header` text label. Reorganised the whole
menu into collapsible groups mirroring the existing Game-group pattern: a header
`<button class="menu-item menu-group" classList={{ expanded: sig() }}>` with a
`ChevronDown.menu-group-chevron`, a `[sig, setSig]` signal, and the section body wrapped in a
`<Show when={sig()}>`. New groups: **New** (create/templates/import, default open), **File**
(load/save/export/history/time-lapse, default open), **AI** (the four AI operations), and the three
former `menu-header` sections **Panels / Toolbars / Settings** (default collapsed). Order was fixed so
document I/O sits at the top: **New → File → AI → Game → Panels → Toolbars → Settings**.

Lessons:
- **Convert existing `menu-header` labels straight into `menu-group` headers** — the section
  boundaries (header → next separator) were already there, so it's a mechanical header-swap +
  `<Show>` wrap. Zero new CSS (all classes existed for the Game group).
- **Grouping surfaces drift.** Consolidating exposed that **AI Image…** had wandered *below* the Game
  group, orphaned from the other AI actions — a bug you only see once you try to gather the family.
- **Prove nothing was dropped after a big JSX move**: `diff` the **sorted** list of
  `<span class="label">` texts between `HEAD` and the working copy. Only-additions (the new group
  headers), zero removals ⇒ every original item survived. A positional diff is useless here because
  moves read as delete+add; sorting cancels the moves.
- Kept **AI Settings** in the Settings group (config), not the AI group (operations). Verified with a
  clean `npm run build` (JSX balance is easy to break across 6 `<Show>` insertions).

## Unified element search Phases 2–3 — bundled illustrations, alias map, scriptable API (v0.8.88)

Phase 1 gave the fan-out; Phases 2–3 filled it out. Lessons:

- **A curated open-asset subset beats "bundle everything".** OpenMoji ships ~4,000 SVGs; a
  hand-picked **85-emoji `TABLE`** (`scripts/build-illustrations.mjs`, keyed by hex codepoint →
  name + tags) covers the everyday concepts users actually search (heart/rocket/target/trophy/
  chart/money/tools/weather/food/travel) at **229 KB**, generated + whitespace-minified offline.
  The generator lives in `scripts/` (not scratchpad) so the bundle is reproducible.
- **Bundle weight is a chunking question, not a size question.** 229 KB of inlined SVG sounds
  heavy, but `elements-panel` is a `lazy(() => import(...))` route, so `assets.ts` lands in the
  panel's own chunk and only downloads when the user opens Elements — never in the main bundle.
  Verify with the Vite build output (a distinct `elements-panel-*.js` chunk), not by eyeballing.
- **The alias map is the single highest-leverage relevance win** and it's just data. Icon/illus
  search is substring-over-name/tags; natural words ("money", "idea", "secure") miss assets named
  differently ("DollarSign", "Lightbulb", "lock"). A ~180-entry `Record<string,string[]>`
  (`aliases.ts`) expanding query → concept tokens, searched as `[nq, ...aliasesFor(nq)]`, fixes it
  with **zero ML**. Rank **direct-query matches before alias matches** (two-pass in `iconHits`) so
  aliases augment rather than pollute the ordering.
- **Illustrations = icons for parity.** Inserting OpenMoji through the *same* `importSvgToCanvas`
  path as Lucide icons means editable coloured vector paths and sketch/architectural render parity
  for free — no new insert/render code. (Confirmed: a Heart inserts as 2 editable `path-*` els.)
- **Scriptable API: return the `insert()` closure, don't re-serialize.** `Yappy.searchElements(q,
  {kinds?,includePhotos?})` returns the same `AssetHit[]` the panel uses; `insertElement(hit,at?)`
  just calls `hit.insert(at)`. In-page JS on `window.Yappy` can hold closures fine — no need for an
  id-registry round-trip. Photo-provider errors **degrade to `[]`** so a script always gets offline
  results.
- **Hotkeys are bound in `app.tsx`, not derived from `command-registry`** — the registry's
  `shortcut` field is palette-display metadata only. Adding `Alt+E` meant editing *both* (the
  keydown block in `app.tsx` **and** the palette entry + `help-dialog.tsx` list). Also: a naive
  `grep "Alt+E"` false-positives on `Alt+Enter` — the key was actually free.
- **Multi-part inserts stress-test selection/overlay code.** Dropping an icon/illustration = a
  group of many `path` parts immediately surfaced two latent per-element-overlay bugs (connector
  quick-connect ports and the Group/Ungroup context item) that only bite on multi-selections —
  same class as the earlier path-anchor-on-multiselection fix. New "insert a group" features are a
  good moment to audit every `renderElementOverlays` block for a missing `selectionLength === 1`
  guard.

## Unified element search — one provider contract lets one box search everything (v0.8.87)

Canva's headline "type a word → get graphics/icons/photos" is, structurally, just a **fan-out over
providers that already exist**. The Elements panel had three isolated tab-searches (Lucide icons,
static shapes, Wikimedia photos). Phase 1 unified them by introducing one `AssetHit` contract
(`{kind, id, label, thumbSvg?|thumbUrl?, insert()}`) in `library/elements/search.ts` and wrapping
each existing capability as a provider — **zero new insert logic**: shapes still go through
`YappyAPI.createElement`, icons through `importSvgToCanvas`, photos through `insertStockPhoto`. So
render-style parity (sketch/architectural) came for free — the change is pure discovery/routing, not
rendering. Lessons: (1) When you already have N working insert paths, a **uniform result type +
`insert()` closure** turns "N separate searches" into "one blended search" without touching any
renderer. (2) Offline providers (icons/shapes) resolve synchronously and render instantly; the async
one (photos) is **debounced 400ms + sequence-guarded** (`++photoSeq`, compare on resolve) so a fast
typist doesn't paint stale results — reuse the existing loading/empty states, don't invent new ones.
(3) A tiny hand-written **alias map** (`love→heart`, `chat→speech`) is the cheapest 80% of "semantic"
search; substring matching also over-matches amusingly (`love` hits Lucide **`Clover`** — c-*love*-r),
which is acceptable, not a bug. (4) Keep the empty-query **browse view** (shapes/frames/featured
icons/font pairs) so removing the tabs loses no feature.

## A `prepare` script in a git-dependency can break every consumer's `npm install` (2026-07-13)

Updating the `repograph` devDependency to its latest commit silently broke the **static-deploy
`npm install`** (and my own local install, which I'd papered over with `--ignore-scripts`). Cause:
repograph's `package.json` had `"prepare": "git config core.hooksPath .githooks"`. The `prepare`
lifecycle runs **when a package is installed as a git dependency** — npm clones it into a cache dir
and runs `prepare` to build it — but that cache dir is not a git work tree, so the command exited
`fatal: not in a git directory` and failed the *consumer's entire install*. Lessons: (1) never put
an unconditional `git config`/hook-setup in `prepare` of a publishable package — guard it to no-op
outside its own checkout and never exit non-zero (fixed repograph via `bin/setup-hooks.js` checking
`git rev-parse --is-inside-work-tree` + `.githooks` presence, wrapped so it can't throw). (2) A git
dep is pinned by **commit hash in the lockfile** — fixing the dep's HEAD isn't enough; you must
repin the lockfile to the fixed commit for CI/deploy to pick it up. (3) `--ignore-scripts` masking a
failing install locally is a smell that a real install elsewhere (CI, static deploy) will break.

## Custom stroke dashes: the renderer already spoke it — the model was the bottleneck (v0.8.82)

Adding arbitrary dash patterns turned out to be a model problem, not a rendering one: `IRenderer.
setLineDash(number[])`, the canvas ctx, and `SvgRenderer` (→ `stroke-dasharray`) already accept any
array — the only thing missing was a place to *store* one. The stroke model held just a preset enum
('solid'/'dashed'/'dotted') that each render site expanded to a fixed array inline. Fix = add
`strokeDashArray?: number[]` (+ `PaintStroke.dashArray`) and a shared `resolveDash(style, array,
dashedPreset, dottedPreset)` that returns the custom array when present, else the caller's preset.

The trap: **there are two independent dash expansions.** The live canvas path (`render-pipeline.ts`,
3 sites) uses `[8,8]`/`[2,4]`; the **SVG export path (`export.ts`)** has its *own* copies at 6 sites
using `[10,10]`/`[2,8]`/`[5,10]` — export does not go through RenderPipeline. Miss those and dashes
look right on canvas but vanish (or fall back to preset) in exported SVG. The shared resolver takes
the preset values as arguments precisely so each site keeps its historical pixel values while all of
them gain the custom-array override. Always grep the *whole* repo for a style enum before assuming
one render path covers it — canvas and SVG export are separate pipelines here.

## The roadmap doc lied — most "quick wins" were already shipped; verify before building (v0.8.81)

Picking up the vector-illustration "quick-win" list, four of five items (distribute-by-spacing,
align-to-key-object, eyedropper, dash *presets*) were **already in `api.ts`** and the UI — the
roadmap doc's "nothing in Tier 1+ started" status line is ~40 versions stale. The codebase routinely
runs ahead of its own planning docs. Lesson: before implementing anything off a roadmap, grep
`api.ts` + the relevant panel for the feature name; treat roadmap status as a hint, not truth. The
one genuine gap was the **numeric Transform panel** (X/Y/W/H + rotation) — and even there the store
action (`setElementTransform`) and API already existed; only the property-panel UI was missing.

Two gotchas wiring it: (1) `el.angle` is stored in **radians**, not degrees — the rotate handler
does `Math.cos(newAngle - el.angle)` directly, so the panel shows `angle*180/π` and writes back
`deg*π/180`. (2) For live-updating numeric fields that the user also types into, bind `value={get()}`
but commit on **`onChange`** (fires on Enter/blur), not `onInput` — so on-canvas drags refresh the
field while mid-typing keystrokes aren't clobbered by the reactive value.

## An effect that "owns the front" must own EVERY front, images included (v0.8.80)

The 3D Extrude effect skips the element's normal render when it draws the front face itself
(`extrudeOwnsFront` = tilt or bevel). That contract silently assumed the front is a flat *fill* —
`drawFront`/`drawBevelFront` just filled the outline with the shape's base colour. Correct for
rects/text/paths; wrong for an **image**, whose "fill" is a bitmap — tilting or beveling it erased
the picture. Lesson: whenever an effect takes over rendering a face that the base pipeline would
otherwise draw, it inherits responsibility for *all* the ways that face can be painted — solid,
gradient, and **bitmap**. The tell is `el.type === 'image'` (and, later, pattern/gradient fills):
if the takeover path only sets `fillStyle`, image elements lose their content.

The reusable trick for painting a bitmap onto a foreshortened face: the tilt in `extrude.ts` is a
pure **scale-about-centre in world axes** (`fx = cos(rotY)`, `fy = cos(rotX)`) composed *after* the
element's rotation. So the face's world transform is `translate(cx,cy) · scale(fx,fy) ·
rotate(angle)`, and you can `drawImage` the element's local rect straight into it (clipping to the
outline) — no per-corner quad mapping needed, because a scale∘rotate is affine. Baking (`expand`)
must mirror the live render: emit a real image element for the front, not a solid path, or Expand
disagrees with what the user saw.

## Persistence has more than one home — wiring a store collection to auto-save isn't "persisted" (v0.8.70)

Making `compositionTracks` persist revealed that `dimensionAnnotations` (shipped in 0.8.66) was only half-
persisted: I'd wired it into `storage/auto-save.ts buildCurrentDocument` but NOT `utils/document-io.ts
buildSlideDocument` — the on-disk `.yappy`/export format. So dimensions survived a reload (auto-save →
IndexedDB) but would have been dropped on Save-to-file / Open-file. Yappy has (at least) two document
serializers plus the history snapshot; a new persisted collection needs all of them. Grep the field name
across `buildCurrentDocument`, `buildSlideDocument`, `captureSnapshot`, and the load path when adding one,
and prove it with a `getDocument()` → `clear()` → `loadDocument()` round-trip test (added
`Yappy.getDocument()` for exactly this). Also: the adjustment-layer export is the same self-canvas snapshot
trick as the on-canvas render — since the export loop draws elements in z-order, the composite beneath is
already painted by the time `renderElWithEffects` reaches the adjustment element, so the identical
snapshot→clip→filter→draw-back works in `export.ts` unchanged.

## Batch of three (v0.8.69): dotted-path overrides, self-canvas adjustment layers, and a sibling app squatting on port 5173

Three lessons from finishing the effects/compound trio. (1) **Nested keyframing = one resolver, not a new
model.** Rather than teaching `PropertyTrack` about nested objects, keep the evaluator writing flat keys
and add `resolveNestedOverrides` at the override stage: a dotted key like `"extrude.depth"` is turned into
a COMPLETE `{ extrude: { ...el.extrude, depth } }` object (clone base + set sub-field, merge keys sharing a
root) so the existing shallow render spread applies it. The whole feature is ~20 lines + panel rows with a
`getPath()` accessor. (2) **Adjustment layers via self-canvas snapshot.** A region that filters everything
beneath it is just: snapshot the composite-so-far into a scratch canvas, `ctx.clip()` to the region,
`ctx.filter = buildFilterString(el)`, reset the transform to device space, and `drawImage` the snapshot
back. No compositing framework — the z-ordered render already drew everything below by the time the loop
reaches the adjustment element. (3) **The 3-hour-if-you-miss-it gotcha: a sibling Vite app on 5173.**
Playwright's `webServer` uses `reuseExistingServer:true` on 5173; a different project (`tinyfly`) had
grabbed 5173, so every spec silently loaded the WRONG app and `window.Yappy` was `undefined` — with *no*
error (it's a valid page, just not ours). Yappy's own vite had fallen back to **5175**. Fix: `curl` the
`<title>` on 5173–5177 to find yappy, then `YAPPY_URL=http://localhost:5175 npx playwright test …`. When
`window.Yappy` is undefined but the page loads clean, suspect the port before the code. [[yappy-e2e-testing]]

## AE keyframable effects: a good override seam makes a whole feature "free" (v0.8.68)

Making live-effect params (glow/shadow/feather/blur) keyframable turned out to need **zero** engine
code — only UI. Why: the composition evaluator already writes any track's `property` key generically
into the override map; the renderer already spreads `{ ...el, ...animState }` before reading effect
fields off the element (`render-pipeline.ts` reads `el.glowBlur`/`el.featherRadius`/… directly); and a
keyframed element already bypasses the element cache (`shouldCache = !animState`), so an overridden
effect field renders live. The Phase-0 decision to make the override a *generic property spread* (not a
fixed `{x,y,angle}` copy) is what paid off three phases later — a reminder that a clean, generic seam
turns future features into config, not code. The only real UX fix: numeric effect params are `undefined`
when off, which blocked keyframing from the default state — default them to **0** in both the value
readout and the stopwatch so a "reveal from off" is authorable. Caveat that bounds the freebie: it only
works for **flat** fields; nested effects (`extrude.depth`, `warp.bend`) need a dotted-path model
(track property → deep-set → nested-merge in the spread) before they can ride the same seam.

## Non-destructive compound shapes: reuse the `path` element, and a "differs vs empty" test beats "A differs vs B" (v0.8.67)

Two lessons from compound shapes. (1) **Reuse beat inventing.** A subagent mapped the "right"
architecture (a first-class `type:'compound'` element evaluated live in `getShapeGeometry`, symbol-style
with enter-to-edit). But modelling a compound as a plain **`path` element that retains its operands +
op** (rendering the evaluated boolean into its own `pathAnchors`/`pathSubpaths`) delivered the entire
non-destructive value — change-op-live, release, expand — with *zero* new element type, renderer, or
hit-test, because it IS a path. Storing operands inline means serialization is automatic too. The
first-class type is a genuinely better long-term home (in-place editing, live re-eval), but the
path-based model shipped the value at a fraction of the surface. (2) **A weak canvas test hid a real
render bug for hours.** The e2e asserted "union frame ≠ exclude frame" — which passes even if union
renders *blank*, because blank ≠ non-blank. A single-ring compound (Unite) was in fact drawing nothing
(it needed `pathAnchors`, not a lone `pathSubpaths` entry, to fill), yet every assertion was green. Only
a *screenshot* revealed it. Fix the test, not just the bug: assert the result **differs from an empty
canvas** (proves pixels were drawn), not merely that two states differ. (3) **Dev-server aside:** a Vite
`504 (Outdated Optimize Dep)` from churning/killing dev servers blanks the whole app while `window.Yappy`
still answers and the production build passes — if screenshots go blank app-wide (no UI chrome) but
`evaluate()` works, clear `node_modules/.vite` and restart, don't chase it as a code bug.

## Dimension annotations: a new store collection needs both a non-colliding name AND a slot in generateId's scan (v0.8.66)

Adding persistent dimension annotations surfaced two collection-plumbing traps worth
remembering. (1) **Name collision:** `store.dimensions` already existed as the page size
(`{ width, height }`). Declaring a second `dimensions: DimensionAnnotation[]` didn't just
type-error — the initializer `dimensions: []` would have silently *replaced the page size at
runtime* (last literal key wins). Renamed to `dimensionAnnotations`. Before adding a store
field, grep the field name across the store first. (2) **Id uniqueness:** `generateId` derives
"max suffix + 1" by scanning a fixed list of collections (elements/layers/slides/…). A brand-new
collection is invisible to it, so every id came back `dime-1` — the second dimension re-used the
first's id and `getDimensionValue`/remove hit the wrong record. Any new id-bearing collection must
be added to `generateId`'s scan list. Both bugs were caught by tests (build type-error + an e2e
where a height dimension reported the width's value) — a reminder that "add to the save file" isn't
the whole job for a new collection: name, id-scan, history snapshot, load, and delete-cleanup are
all part of wiring one in.

## After-Effects Phase 3 parenting: don't overload an existing `parentId`, and a live-preview clock silently gated the whole feature (unreleased)

Two lessons from AE transform parenting. (1) `DrawingElement.parentId` already existed — but an Explore
pass showed it's the **mind-map tree** (drives collapse, focus-mode dimming, and translation-only,
Alt-gated child-drag), never a composed transform. Reusing it for AE parenting would have silently
collided with all three. The fix was a dedicated `transformParentId` field and composing the parent chain
as pure affine matrices in the evaluator/override stage only (`resolveParentedPoses`: `ownDelta = T(Cₐ)·
R(Δθ)·S·T(-C_b)`, `worldDelta = parentWorldDelta ∘ ownDelta`, decomposed back to x/y/w/h/angle) — the
render pipeline's per-element `applyTransformations` never needed to change. Rule: before reusing a field
name that "sounds right", grep every reader and classify it; a hierarchy field can mean four different
things. (2) A latent bug hid for three phases: the canvas composition clock was
`showSceneTimeline ? storyTime : freeClock`, but the Keyframes dope sheet sets `showSceneTimeline=false`,
so scrubbing its playhead updated the evaluator/DOM but **not the canvas pixels**. Every earlier e2e
asserted `evaluateComposition(...)` or DOM diamonds — never a canvas screenshot — so it passed while the
live preview was actually dead for panel-driven scrubbing. Only a *visual* screenshot review caught it.
Lesson: when a feature's whole point is live on-canvas preview, at least one test must diff actual canvas
pixels across a scrub; evaluator/DOM assertions can't see a render-clock gating bug.

## After-Effects Phase 2 graph editor: keep the easing frame-of-reference consistent, and map handle drags via the client rect (unreleased)

The Phase 0 evaluator already decided "the segment's easing belongs to the RIGHT keyframe" (easing INTO
b). When adding the bezier graph editor + hold keyframes in Phase 2, the temptation was to attach "hold"
to the LEFT key (it reads as "hold FROM this key"). Resisting that kept one rule for the whole feature:
`ease`, `easing`, and the new `hold` all describe the **incoming** segment and live on the later key — so
the UI ("Easing — segment into this key"), the evaluator (`if (b.hold) return a.value`), and the presets
all line up with no special cases. Two implementation notes worth keeping: (1) map graph-handle drags
through `getBoundingClientRect()` fractions, not the SVG viewBox units — `nx = (clientX-rect.left)/rect.width`
then un-pad — so the mapping is immune to CSS scaling / devicePixelRatio; allow y outside [0,1] (clamp
~[-0.4,1.4]) so overshoot/anticipation curves are authorable. (2) Presets and handle edits must clear the
conflicting field (`ease` clears `hold`/`easing`; `hold` clears `ease`) or a stale field silently wins in
the evaluator's precedence order (bezier > named, hold > everything).

## After-Effects Phase 1 dope sheet: the stopwatch must record the STORED value, not the evaluated one (unreleased)

Building the keyframe dope sheet, the "add keyframe" (stopwatch) button first recorded
`evaluateCompositionAt(playhead)` — the value the *existing* track produces at that time. That felt
right (record what's on screen) but is a trap: once a track exists it *holds* at its last key outside the
keyed range, so the second keyframe just cloned the first key's value and no interpolation ever
appeared. The e2e caught it (midpoint X came back `100`, not `200`). Fix: the stopwatch snapshots the
element's **stored** property (`el[prop]`) — i.e. the value the user just set via the Property panel —
which is exactly AE's model (change the value at the playhead, then key it). Corollary for later: to make
the on-screen animated value editable directly (AE's "stopwatch armed" auto-key mode), the Property panel
must first surface the *evaluated* value at the playhead and write edits back to the keyframe — a bigger
integration deferred to Phase 2. Second gotcha in the same panel: dragging a diamond re-sorts the keys
array, so the dragged key's index changes mid-gesture — track it by matching the snapped time after each
`moveKey`, not by the stale index, or the drag "jumps" to a neighbour.

## After-Effects Phase 0: reuse the existing render-override channel, don't invent one (unreleased)

Building the AE-class keyframe evaluator, the instinct was to add a fresh "render-time
override layer". It already existed: `calculateAllAnimatedStates()` precomputes a
`Map<id,{x,y,angle,opacity}>` each frame (for orbit/spin) that the renderer spreads over a
shallow element clone at `canvas-renderer.ts` — the canonical "for animated ids, render
overridden props instead of stored props, without mutating the store" pattern. The pure
`evaluateCompositionAt(t)` just merges into that same map (`applyCompositionOverrides`), so the
scrubber, hit-test map, and video export (which captures the live `canvasRef` stream — same
`draw()` path) all inherit it for free. Two gotchas the merge exposed: (1) the render spread was
a *fixed* `{x, y, angle}` copy — a composition-only entry like `{opacity: 50}` would have written
`x: undefined`; switching to a generic `{ ...el, ...animState }` fixes it and lets overrides carry
opacity/size/color/text. (2) That newly-applied opacity revealed a latent `el.opacity || 100` in
`animation-utils.ts` that would flip a genuine opacity of 0 to 100 — changed to `?? 100`. Lesson:
before adding a parallel system, grep for the property-override plumbing the app already renders
through; extending one channel keeps every consumer (preview, hit-test, export) in WYSIWYG sync,
where a second channel silently diverges from export.

## Drag-to-dock: edge detection must widen over a populated zone (v0.8.57)

The drag-to-dock drop target was first computed from screen-edge proximity alone
(`clientX ≤ EDGE_THRESHOLD`). That works to dock a *floating* panel to a bare edge,
but it silently broke **reorder within a zone**: a right-docked panel's title bar
sits at the zone's *inner* edge — hundreds of px from the screen edge — so
reordering it read as "no zone" and the panel floated away. Fix: when a zone is
already populated, extend its catch region to the full zone width
(`max(EDGE_THRESHOLD, zoneWidth)`), so dragging *anywhere over the zone* targets it.
Lesson: a drop-zone hit region isn't the screen edge — it's the zone's actual
occupied rectangle; derive it from the live layout, not a fixed threshold.

## Ghost elements: a click without a drag must not commit (v0.8.57)

A single click/tap with the line/arrow/pen tools created a 0×0 element that renders
nothing yet persists — an invisible "ghost" that inflates the element count and
survives reload. The degenerate-discard existed but *exempted* exactly these tools
(to protect short/multi-point strokes). Lesson: "exempt from the size check" isn't
the same as "always keep" — the exempt tools still need their own zero-extent guard
(bbox < 3px in both axes, minus bound connectors). Test the stray-click path
explicitly; it's easy to miss because the ghost is, by definition, invisible.

## Responsive gotcha: a bottom-docked toolbar silently eats taps (v0.8.56)

The phone tool toolbar force-docks to the bottom band at `z-index:10002`. Three
floating utility buttons (Settings / Properties / Help) sat at `bottom:34px`
*underneath* it — visible but untappable, because the toolbar intercepted their
pointer events. Lessons:
- **On a small screen, "visible" ≠ "reachable".** A higher-z sibling that overlaps
  an interactive element steals its taps even when nothing looks wrong. Test
  reachability, not just layout — Playwright's `click()` surfaces this as
  `<other-el> intercepts pointer events`, a fast way to catch occlusion.
- **Inline styles beat CSS media queries**, so responsive repositioning of an
  inline-styled element needs `!important` — or, cleaner, refactor the inline
  styles into a class first (here: three buttons → one `.floating-tools-cluster`),
  then the phone rule is a plain, override-free media query.
- **Breakpoints that bundle tablet+phone hide position divergence.** The property
  panel's `≤768px` bottom-sheet was fine on tablets (toolbar at top) but broken on
  phones (toolbar at bottom). When one breakpoint spans devices whose *other*
  chrome differs, add a narrower phone-only rule *after* it to win the cascade.
- **`left:260px`-style "clear the left rail" offsets go off-screen on phones.**
  Any panel positioned by a fixed desktop offset needs a phone fallback — the
  reliable one is a full-width bottom sheet lifted clear of the docked toolbar.

## Paged-doc export must be page-aware, not element-bounds-aware (v0.7.2)

When Design/Slides share the "spatial pages" substrate, every export path has to
know about pages — not just PDF/PPTX. `exportToPng`/`exportToJpg`/`exportToSvg`
computed bounds from the element bounding box and painted one flat white
background, so a Canva design exported cropped, with no page background. Lesson:
whenever a format handles `isSlides` per-page, the raster/vector siblings need the
same branch. The clip-and-background recipe already existed in `exportPageToPng`
(clip to page rect → `renderSlideBackground` → render elements whose centre is on
the page); the fix was extracting it into `renderPagedDocToCanvas` and stacking
pages vertically. Reuse the proven single-page path — don't invent a second one.

## Vector pattern fills (v0.5.10)

Added `fillStyle: 'pattern'` + `el.patternFill` (5 seamless motifs: stripes/grid/dots/checker/
crosshatch). Key learnings:
- **Reuse the mesh/image fill strategy, not a new render path.** Rasterize a seamless tile →
  repeat into an element-sized buffer (`utils/pattern-fill.ts` `rasterizePatternBuffer`) →
  `renderer.drawImage(buf, …)` clipped to the shape outline in `RenderPipeline.applyPatternFill`.
  Because image/mesh fills already do exactly this, **render-style parity (sketch + architectural)
  and canvas+SVG-renderer parity come for free** — both styles call `applyComplexFills`, and the
  fill is just a `drawImage`, which every `IRenderer` supports.
- **Add the new fill to the `isComplexFill` allowlist** in `buildRenderOptions` (render-pipeline.ts)
  so rough.js's own fill is suppressed and only our buffer paints.
- **`normalizeElement` (migration.ts) is an explicit allowlist** — it silently DROPS any field not
  spread through. New element fields (`patternFill`) must be added there or they vanish on legacy
  (v2) import. (Modern v4 slide docs bypass normalize, which is why `meshGradient` survived without
  ever being listed — a latent gap.)
- **SVG export has TWO fill paths:** live canvas uses `applyComplexFills`; vector export uses
  `svgFillPaint` (svg-paint.ts) for architectural `<path>` fills. Pattern emits a true-vector
  `<pattern>` (rasterized tile + `patternTransform="rotate(angle)"`). Sketch SVG export still
  routes fills through rough.js, which ignores unknown `fillStyle` → no fill in sketch SVG (matches
  the existing limitation for other complex fills; the on-canvas sketch render is unaffected).
- **Crispness:** supersample the tile (ss = min(2, 2048/maxdim)) so downscaling at draw time keeps
  lines sharp; huge shapes (>2048px) gracefully downscale instead of blowing up memory.
- **Angle without per-renderer pattern transforms:** bake rotation into the buffer (rotate the
  offscreen ctx, fill an oversized square covering the diagonal) — avoids needing `CanvasPattern.
  setTransform`/SVG `patternTransform` parity in the live render path.

### Pattern-from-selection (v0.5.11)

`createPatternFromSelection` captures selected artwork into a raster tile and spawns a preview
rectangle filled with a `type: 'custom'` pattern. Learnings:
- **Avoid the import cycle.** The capture helper uses `renderElement` (→ render-pipeline →
  pattern-fill), so it CANNOT live in `pattern-fill.ts` (which would close the cycle). Put it in a
  separate `utils/pattern-capture.ts` that imports `render-element`; `pattern-fill.ts` only imports
  the leaf `image-cache` to decode the custom tile. Direction of imports is the whole trick.
- **Reuse the export fallback's offscreen-render recipe:** `rough.canvas(cv)` + `ctx.scale(SS,SS)` +
  `ctx.translate(-minX,-minY)` + `renderElement` per element → `toDataURL`. Supersample 2× for crisp
  capture.
- **Custom tile decodes through the same async `image-cache`** as image fills, so `makePatternTile`
  returns null until the image is ready and the cache's on-load redraw paints it next frame — no new
  async plumbing.
- **Sketch SVG still can't vector-export complex fills** (rough.js ignores unknown `fillStyle`), so a
  default-sketch preview rect exports without its `<pattern>`; architectural exports fine. Shared
  limitation with built-in pattern/mesh/image fills, not custom-specific.

### Reusable pattern-swatch library (v0.5.12)

A document-level `store.patterns: PatternSwatch[]` (named `PatternFill`s), modelled exactly on the
existing `graphicStyles`/`swatches` libraries. Learnings:
- **A doc-level collection has ~9 touch points — grep the analog first.** Adding `patterns` meant
  mirroring every place `graphicStyles` appears: `AppState` field, `initialState`, `HistorySnapshot`
  interface + `captureSnapshot` + `restoreSnapshot` (undo), the document **load** (`setStore` from
  `doc.patterns`), the document **save** (`storage/auto-save.ts`), the `SlideDocument` type
  (`types/slide-types.ts`), and `id-generator`'s `scanMax` (so reloaded ids don't collide). Miss one
  and you get silent data loss or duplicate ids. The fastest safe path is `grep -n graphicStyles
  app-store.ts` and replicate 1:1.
- **Panel thumbnails: `<img>` for custom, canvas for built-in.** A custom swatch already has a tile
  data URL, so render it with `<img>` and skip the async image-cache redraw dance; built-in motifs
  render synchronously through `renderElement` on a sample rect (same trick as `graphic-styles-panel`).
- **Two capture entry points, one library:** the panel's `＋` captures the *selection's artwork* as a
  custom tile (`addPatternSwatchFromSelection`), while the PATTERN editor's *Save to Library* saves the
  *current shape's `patternFill`* (`savePatternSwatchFromElement`) — so both built-in and custom
  patterns reach the library.

### Live-link swatches + pattern fills in the appearance stack (v0.5.13)

- **Live-link mirrors the colour-swatch model exactly.** Added `el.patternSwatchId` (cf. `fillSwatchId`):
  `applyPatternSwatch` sets it; redefining the swatch (`updatePatternSwatch`) pushes the new fill to
  every element with that `patternSwatchId`; deleting a swatch nulls dangling refs (keeps the fill).
  **The crucial half is breaking the link** — every *direct* pattern edit (`setPatternFill`,
  `applyPatternFill`, `clearPatternFill`) must clear `patternSwatchId`, or a later redefine would stomp
  the user's manual tweak. (Colour swatches do the same in the central `updateElement` guard, but the
  pattern actions bypass `updateElement` and use `setStore` directly, so each clears it itself.)
- **The appearance stack already gave multiple fills/strokes — the real gap was pattern *stack* fills.**
  `PaintFill` was solid-colour-only. Adding `PaintFill.pattern?: PatternFill` + one branch in
  `renderAppearance` (rasterize → clip to geo → drawImage, same as the base pattern fill) makes any
  stacked fill a pattern, in both render styles, for free. Don't rebuild what `el.appearance` already does.
- **Keep UI-only state out of the data model.** First pass stashed a `__swatchId` on the pattern object
  to drive the picker's `<select>` value; removed it — derive the select value from `pattern.type`
  instead (motif → `motif:<type>`, captured tile → a display-only "Custom tile" option). Saved data
  stays clean.
- **SVG export of appearance pattern fills (0.5.14):** thread `<defs>` into `buildAppearanceSvgGroup` and
  reuse a shared `svgPatternDef(pf, defs, uid)` (extracted from `svg-paint.ts`) so architectural appearance
  pattern fills emit a real tiling `<pattern>`, same as base pattern fills. Sketch keeps the foreground-colour
  approximation (rough.js `rc.path` can't reference an SVG pattern). Lesson: when a render path has an
  "approximation" TODO, the fix is usually extracting the already-correct helper and threading its one
  dependency (here `defs`) — not reinventing it.

## Procreate-style layer swipe gestures: port the UX, not the raster engine (2026-06-28)

happypaint's layer panel is iPad-lovely — swipe-left reveals a Lock/Duplicate/Delete tray, swipe-right
multi-selects rows for Group/Delete. Reviewing it for yappy, the key call was that ~all the *capability*
(blend modes, masks, adjustment layers, alpha-lock, pixel-select) is raster and doesn't map to a vector
diagramming tool — but the *gesture UX* is pure UI and ports cleanly onto yappy's existing layer ops
(duplicateLayer/deleteLayer/createLayerGroup). Implementation notes:
- **Native HTML5 drag hijacks mouse swipes** — the original gating swipe to touch-only "worked" but
  felt broken on a laptop (no mouse swipe). Root cause: the whole row was `draggable`, so the browser
  starts a native drag on any mouse drag *before* the pointer handler sees it. Fix: confine `draggable`
  to the grip handle (`⋮⋮`) and leave the row body non-draggable — then a horizontal mouse drag on the
  body reaches `startSwipe`, while the grip still does native reorder. Now swipes work for mouse + touch.
- **Axis disambiguation matters** — lock horizontal vs vertical after 10px; if vertical, *release the
  gesture* so the layer list scrolls normally. Without this the swipe fights the scroll.
- **Don't suppress the post-swipe click with a sticky boolean** — a horizontal touch swipe often emits
  *no* trailing click, so a `justSwiped=true` flag gets stranded and swallows the *next* genuine tap.
  Use a timestamp (`Date.now() - lastSwipeEndAt < 400`) instead.
- **Tray occlusion** is just z-index + a solid row background: tray absolute-pinned right at z0, the
  `.layer-item` at z1 with an opaque `--bg-panel` bg slides over it via `translateX`. Disable the
  transform transition while actively swiping (`.swiping`) so it tracks the finger 1:1.

## Porting a feature means porting its intent, not its mechanism (2026-06-28)

happypaint's status-bar version tap forces a *service-worker update check* (it ships a
`vite-plugin-pwa` autoUpdate SW). yappy has no service worker, so copying that call would have been a
no-op. The *intent* — "give iPad/iOS Safari the hard-refresh it doesn't offer" — ports to a genuine
cache-busting reload instead: unregister any SW (defensive), clear all Cache Storage entries, then
reload with a fresh `?_hr=<ts>` query param. The param matters: iOS Safari serves the cached
`index.html` on a plain `location.reload()`, so a never-seen URL is what forces it to refetch the app
shell (which then points at the current content-hashed assets). Lesson: before porting, check whether
the source's mechanism even exists in the target; match the user-visible behavior, not the code.

## A "make it draggable on tablet" toolbar ask is really three separate fixes (2026-06-28)

The drawing toolbar already supported move (drag-handle), vertical orientation (rotate toggle), and
resize (grid-wrap grip) — but only usably on desktop. Making it work "like happypaint" on a tablet
needed three independent changes, none of them the obvious one (it wasn't broken, it was un-touchable):
(1) **Pointer events, not mouse events** — the drag/resize used `onMouseDown` + window `mousemove`/
`mouseup`; synthesized mouse events are unreliable for touch drags, so switch to `pointerdown`/
`pointermove`/`pointerup` (+`pointercancel`). (2) **Coarse-pointer affordances** — the grips were
`:hover`-revealed (opacity 0→), invisible and tiny on touch; a `@media (pointer: coarse)` block makes
them always-visible, larger, and `touch-action: none` so dragging a grip doesn't scroll the page.
(3) **Breakpoint** — the toolbar force-docked to the bottom and hid its controls below 768px, which
catches iPad portrait (768 CSS px); lowering the phone breakpoint to 600px (kept in sync between
`PHONE_MAX_WIDTH` in toolbar.tsx and the `@media (max-width)` in toolbar.css) lets tablets keep the
floating movable toolbar while phones stay docked. Lesson: "can't use X on tablet" usually decomposes
into input-model (pointer vs mouse), discoverability (hover vs coarse), and layout-gate (width
breakpoint) — fix all three, and keep the JS/CSS breakpoints named and in sync.

## "Hard to use" drag interactions are usually missing feedback, not broken logic (2026-06-28)

A report that table column-reorder was "difficult to drag rearrange" turned out not to be a logic bug
— the reorder worked — but a **feedback** bug: the only cue during the drag was the cursor turning to
`grabbing`, so you couldn't see which column you were over or where it would land. The fix is a live
drop indicator (fade the grabbed column, highlight the target, draw an insertion line on the side the
column will land), plumbed through the same `*DropTarget` signal pattern the pool-lane and reparent
highlights already use. Lesson: when a direct-manipulation gesture "feels finicky", audit what the
user *sees* mid-drag before touching the drop math — and match the indicator's insertion side to the
actual reorder semantics (here, splice → right-of-target when moving right, left when moving left) so
the preview never lies.

Touch parity for keyboard-only actions: "select all" was `Ctrl/Cmd+A`-only. The empty-canvas context
menu already had a "Select all" — it just wasn't *reachable* on a keyboard-less tablet until the
long-press menu (Phase 1) existed, and it was absent once something was selected. Two cheap moves made
it tablet-complete: a shared `selectAll()` store action (DRY across the shortcut + menu), and adding
the item to the selection branch too. When auditing tablet gaps, check whether the capability already
exists behind a keyboard shortcut and only needs a touch-reachable surface.

## Tablet select+delete: overlay handles ride the existing handle pipeline (2026-06-28)

Porting Procreate-/happypaint-style tablet ergonomics into yappy, Phase 1 added a keyboard-free
quick-delete plus a long-press menu. Three takeaways:

1. **A new selection affordance only needs three touch-points if you reuse the handle pipeline.**
   The floating ✕ delete button is a single shared world-space position fn
   (`getDeleteHandlePosition`, in `handle-detection.ts`) consumed by *both* the hit-tester
   (`getHandleAtPosition`) and the two overlay renderers (`selection-renderer.ts` for single
   selection, `canvas-renderer.ts` for multi). One source of truth keeps the drawn button and its
   tap target from drifting apart — the classic failure mode for canvas-drawn controls.
2. **Gate a synthetic handle behind an opt-in param.** `getHandleAtPosition` has four callers; only
   the primary `selectionOnDown` path passes `includeDeleteHandle=true`, so the `delete-action`
   pseudo-handle can never leak into the hover-cursor / text-edit / presentation consumers and start
   a phantom drag. Cheaper and safer than a new return-type or a separate function.
3. **Overlays are render-style agnostic.** Selection overlays draw on top of both `sketch` and
   `architectural` output, so the delete button gets style parity for free — the CLAUDE.md
   "both styles must work" rule bites on shape geometry (fill+stroke), not on the overlay layer.

Long-press menu: iPad/Android don't reliably fire a `contextmenu` event on a touch/pen hold (and we
suppress the OS callout anyway), so detect the hold yourself with a timer armed on pointerdown and
cancelled the instant the finger crosses a slop threshold. Critically, the existing `ContextMenu`
closed only on `mousedown` — which isn't synthesized from touch — so it was un-dismissable on a
keyboard-less tablet; adding a `pointerdown` outside-close listener fixes that.

Gesture cooldown self-heal: the 2-finger gesture cooldown only cleared when *all* fingers lifted, so
a dropped `touchend` (common on iPadOS Safari) could strand it `true` and kill single-finger
select/marquee forever. A stale-timeout (`isTouchBlockedByGesture`) lets it self-heal on the next
touch without weakening the intended resting-finger guard during an active gesture.

Phase 2 (gesture vocab): two additions, both deliberately retargeted for a *vector* app rather than
copied verbatim from the raster source. (1) **3-finger horizontal scrub → delete selection** — the
Procreate "scrub to erase" motion, but pointed at the vector selection so it's undoable and a no-op
when nothing's selected (counts SCRUB_FLIPS=2 horizontal centroid reversals). (2) **Secondary-contact
constrain** — happypaint's "second finger" modifier only makes sense in yappy when the *pen* owns the
drag (2 fingers are sacred for pan/zoom); so a single finger landing during a stylus-driven resize
sets `pState.secondaryContact`, which the resize handler ORs into its Shift/proportional check. The
"hold" gesture from the source maps onto Phase 1's long-press → context menu, so it wasn't
re-implemented (a second hold→eyedropper binding would just fight the menu).

Phase 3 (input refactor) — scope it by risk, not by ambition. happypaint factors input into a clean
`input/` module (pointer-router + gesture-recognizer + palm-rejection); yappy's equivalent is ~400
lines inlined in `canvas.tsx` across ~15 closures sharing ~30 mutable variables, *and* carries a lot
of hard-won iPadOS edge-case handling (dropped-touchstart healing, palm-rejection recency windows,
pointer-capture races). A behavior-preserving extraction is purely structural — no user-facing gain —
so the move is to extract only the genuinely **stateless, self-contained** pieces and leave the
stateful FSM inline. Done: `utils/input/palm-rejection.ts` (`isPalmTouch`/`isPencilSizedTouch`,
deduping three near-identical inline checks) and `utils/input/touch-geometry.ts` (`allFingerTouches`/
`pickFingerTouches`/`twoFingerMetrics`, pure). Deliberately NOT extracted: the gesture FSM
(`gestureActive`/`gestureCooldown`/`gStarts`/`updateGesture` viewport math) — it's entangled with the
store, viewport, and pointer handlers, and can't be regression-tested without a real tablet, so the
churn-vs-risk trade-off didn't favor moving it. `tsc` passing ≠ touch behavior preserved; respect
that gap for input code.

## A control that "looks black/unstyled" is usually class-name drift (2026-06-26)

The Layers panel's Duplicate/Delete buttons showed as black boxes on light theme. The cause wasn't a
colour bug — it was that the markup used `class="icon-button"` while the CSS styled
`.layer-duplicate-btn` / `.layer-delete-btn`. No selector matched, so the browser painted its default
button chrome plus the raw glyph. Two takeaways: (1) when a widget looks unstyled rather than
mis-coloured, suspect a class name that doesn't match any rule before chasing theme variables; (2)
prefer real icon components (lucide) over decorative Unicode glyphs — `⎘`/`×` inherit no sizing and
render as heavy black shapes, whereas `<Copy>`/`<Trash2>` size and colour via `currentColor` and stay
consistent across themes.

## Smooth filled outlines need Bézier anchors, not more polygon points (2026-06-26)

The Blob Brush "smooth" the first time round still scalloped because the union-of-disks outline was
emitted as **corner** anchors — a polygon. Chaikin just multiplies straight segments; it never stops
being faceted. The real fix is to change the *anchor kind*: RDP-simplify the union ring to drop noise,
then fit a closed Catmull-Rom spline (`catmullRomAnchors`, already used by the Curvature tool) so each
vertex becomes a **smooth** anchor with Bézier handles — a genuinely curved edge with far fewer anchors.
Gate it: `buildPathFromPoly(poly, style, smoothEps?)` smooths only when asked, so Pathfinder/outline/
distort stay polygonal (they must). When something "looks faceted no matter how much you smooth," check
whether you're adding points to a polygon vs. emitting curves.

## Two tools that look/feel alike will be confused — disambiguate hard (2026-06-26)

Yappy has a freehand brush ("Pen", nib icon, P/7) and the real vector pen ("Pen / Vector Path", nib
icon, no key). Same name, near-identical icon, and the brush hogged `P` — so users kept landing on the
brush and concluded the vector pen "just draws." Fix wasn't subtle: give the vector pen the mnemonic key
(`P`, Illustrator parity), strip `p` from the brush (keep its number), badge the pen, and change the
brush icon (`Pen`→`PenLine`) so they're visibly different. When two tools are adjacent, similar, and one
is "the famous one," make the famous one win the name/key/icon outright.

## Touch tools must not depend on a keyboard (2026-06-26)

Touch Type was built on pointer events (so move-by-drag worked on tablets) but scale/rotate were
bound to `[ ] , .` keys — unreachable without a keyboard, i.e. half-broken on the device the tool is
named for. Lesson: any tool meant for touch needs an on-canvas path for *every* operation. Fix added
floating per-glyph buttons (A−/A+/↺/↻) **and** two-finger pinch-scale + twist-rotate (track active
pointers in a `Map<pointerId,pt>`, start a gesture at `size===2`, derive scale from distance ratio and
rotation from angle delta, one history snapshot per gesture). Keep the keyboard shortcuts too — refactor
both paths through shared `bumpScale`/`bumpRot` helpers so they can't drift.

## Per-glyph styling rides the existing per-glyph slot (2026-06-26)

Adding per-character colour to Touch Type was a 3-line data change because `charTransforms[i]` already
existed and `setCharTransform` merges an arbitrary `patch` (`{...base[idx], ...patch}`). Extending the
type with `color?` made the store action carry it for free; the renderer just sets `fillStyle` per glyph
(`t.color || baseColor`) inside its existing per-char loop. When a per-element feature needs to become
per-glyph, look for an existing per-index array to extend before adding a parallel one.

## Draggable floating UI needs a viewport clamp on restore (2026-06-26)

Persisting a dragged panel/toolbar position is only half the feature — on restore you must clamp
it back into the viewport, or a panel parked near an edge (or reopened in a smaller window)
renders fully off-screen. Worst when the element has **no close/reopen control** (the main
toolbar), making it unrecoverable. Pattern: keep a ref, after layout (`requestAnimationFrame`)
measure `getBoundingClientRect()` and nudge the stored offset so ≥~32px stays on every edge; re-run
on `resize`. This both prevents the bug and auto-heals already-stranded state on next load.

## A close button that blends in reads as "no close button" (2026-06-26)

The Vector Tools panel *had* an X, but it was `--text-secondary` on a `--bg-secondary` header with
a hover bg equal to the header — users reported it "doesn't have a close button." For dismiss
controls, don't rely on a bare low-contrast glyph: give it a visible border, primary-colour glyph,
`flex:0 0 auto` (so `overflow:hidden` panels never clip it), and a distinct (red) hover. Affordance
beats minimalism for destructive/close actions.

## Human-readable ids that live off the `.id` field collide (2026-06-26)

`generateId` uses a "scan existing ids, take max + 1" strategy instead of a counter — clean,
no persistent state, **but it only sees ids stored as `element.id`**. Any id that lives in a
side field (`groupIds[]`, `livePaintGroupId`, `clipMaskId`) is invisible to the scan, so the
max stays 0 and every new one re-uses `xxxx-1`. Two groups then share an id and select/move
as one. The fix is always the same: feed those side-field ids into the same `scanMax`. If you
add a new kind of id that isn't an element's `.id`, you must teach `generateId` to scan it too.
Symptom to watch for: "two separate Xs behave as one."

## Lens-flare rays: taper + layer, don't stroke (2026-06-26)

A radial line from centre→tip reads as a CAD construction line, never as light. Light streaks
are **brightest at the base and fade to a point**, and they emerge from *outside* the core, not
its dead centre. Cheap convincing recipe with plain vector primitives: each ray = a thin closed
`path` triangle (fill-only, transparent stroke) starting at ~`0.16·r` out and narrowing to the
tip, drawn as two stacked spikes — a wide faint colour halo behind a narrow warm-white hot core.
Works on light **and** dark because the coloured edge carries on white while the white core glows
on black. Filled-path geometry here is fill-only by design, so architectural-mode stroke-drop
(the usual path-parity gotcha) doesn't bite.

## Artboards (#14) — named export regions on the infinite canvas (2026-06-25)

Rather than re-skin the presentation-heavy slides system, artboards shipped as a light, self-contained layer: `store.artboards: Artboard[]` ({id,name,x,y,w,h,background}). They render as labelled frames **behind** all content (a pass at the top of `renderLayersAndElements`, gated to `docType !== 'slides'`), with `ARTBOARD_PRESETS` (Square 1080, A4, Instagram Story, Web, 16:9) or `addArtboard('selection')` to fit the selection. **Region export** (`exportArtboard`) renders to an off-screen canvas sized to the board, clipped to its rect, drawing only elements that intersect it — so each board exports to its own PNG independent of the rest. Right-click canvas → Artboards (add presets + "Export <name>"); right-click selection → Artboard from Selection. Persisted + undoable via the same checklist as symbols. **Deferred:** draggable/resizable artboard handles on canvas and a per-board background/bleed UI.

## Symbols / instances (#6) — reusable masters with live instances (2026-06-25)

A `SymbolDef` ({id, name, width, height, elements}) is a normalized (origin-0) snapshot of elements held in `store.symbols`. A `symbolInstance` element references it via `symbolId` and carries its own x/y/w/h/angle. `createSymbol` snapshots the selection (stripping group/mask refs), stores the def, and **replaces the selection with one instance**; `placeInstance` adds more; `redefineSymbol` rewrites the def → **every instance updates live**; `detachInstance` (break link) expands an instance back into editable, grouped copies.

**Live nested rendering with one renderer.** `SymbolInstanceRenderer` (registered for `'symbolInstance'`) reads the def at draw time and, for each child, builds a transformed copy (scaled by `inst.w/sym.w`, translated to the instance origin, points/anchors via the shared `geometry-scale` helpers) and calls **`renderElement` recursively** on it, wrapped in a `ctx` rotate for the instance angle. Because it renders from the def each frame, redefining the symbol repaints all instances for free. The `render-element → shape-registry → register-shapes → symbol-instance-renderer → render-element` import cycle is fine in ESM since `renderElement` is only *called* at render time, not at module-eval.

**Don't forget the three places new store state must register:** (1) `getShapeGeometry` (a bbox `rect` so selection/handles/export work) + `hitTestGeometry` (bbox return-true) so instances are selectable; (2) the **history snapshot** (`HistorySnapshot` + capture/restore) so undo/redo covers `store.symbols` — verified undo removes a just-created symbol and redo restores it; (3) **document persistence** — `loadDocument` reads `doc.symbols`, and *all four* save serializers (`auto-save.ts`, `menu.tsx` ×2, `api.ts`, `cloud-storage-dialog.tsx`) plus the `SlideDocument` type needed `symbols`, or instances would render as gray placeholders after reload. New top-level store collections have a long checklist; grep every `store.states` serializer when adding one.

**Deferred:** a visual "edit symbol in place" mode and a Symbols panel/library UI (today you redefine via API or detach-edit-recreate).

## Image trace (#13) — raster → vector via marching squares (2026-06-25)

`traceImage` vectorizes a selected bitmap into an editable `path` element. Pipeline ([image-trace.ts](../frontend/src/utils/image-trace.ts)): draw the image to an off-screen canvas (downscaled to ≤256px for perf) → `getImageData` → **binary mask** (luminance < threshold, or, for transparent PNGs, the opaque region) → **marching squares** extracts iso-contours → **stitch** edge segments into closed loops by shared endpoints → **RDP simplify** → drop tiny specks by polygon area → normalize to [0,1]² and place into a `path` (anchors scaled to the image bounds, even-odd fill). The new black path overlays the image; delete the image to keep just the vector.

**Why marching squares over pixel boundary-tracing:** it emits sub-pixel midpoint contours (smoother than blocky Moore-neighbour steps) and every region boundary — outer *and* holes — comes out as its own loop, so a donut/letter-O's hole falls out for free under even-odd (verified: a black ring → a path with 2 subpaths, hole visible). Pad the mask by 1px so shapes touching the image edge still close into loops.

**Gotchas:** (1) the e2e must wait ~600ms for the data-URL image to load before tracing (`getImage` is async) — 350ms intermittently traced an empty mask. (2) `Yappy.deleteElements` isn't an API method (it's a store fn); use `updateElement`/selection in tests. (3) `PathCommand` (and here, the marching-squares adjacency) needs care with the `adj.get(k) || adj.set(k,[]).get(k)` idiom — `Map.set` returns the map, so the trailing `.get(k)` retrieves the freshly-inserted array.

Right-click an image → Image Trace → B&W / colour variants; API `Yappy.traceImage({threshold?, simplify?, colors?})`.

**Colour trace (0.27.82):** k-means quantize the pixels into N colours, then trace each colour's mask as its own filled path (reusing the marching-squares pipeline), stacked background-first (largest area) and grouped. **Two things that mattered:** (1) k-means seeding — evenly-spaced/in-order init collapsed every centroid onto the dominant background (a mostly-white image traced to all-white layers). Switched to deterministic **farthest-point (k-means++-style) seeding** so centroids spread across distinct colours — red/green/blue now captured. (2) **A latent id-collision bug:** `generateId('path')` derives the next suffix by scanning `store.elements` for the max — but a batch of paths built *before* being added to the store all saw the same max and got the **same id** (`path-1`×4). They rendered fine (the loop draws all of them) but `getElement(id)` returned only the first, breaking selection/edit of traced layers. Fix: thread a `batchIds: Set` through `makePathFromWorldSubs` → `generateId(prefix, batchIds)` (which already supports same-batch uniqueness), adding each new id to the set. This also fixed multi-image mono traces. **Centre-line trace (0.27.83):** Zhang–Suen thinning erodes the binary mask to a 1px skeleton, then a degree-aware walk (endpoints/junctions = nodes, follow degree-2 chains) extracts OPEN polylines → a stroked path (line art → single-stroke vectors).

## Appearance stack (#11) — extra fills/strokes over the base shape (2026-06-25)

The roadmap's "second foundation" (multiple fills/strokes) shipped as a **low-risk additive post-pass** rather than re-architecting every shape's core fill/stroke. `el.appearance = { fills?: PaintFill[]; strokes?: PaintStroke[] }`; absent = unchanged (fully back-compatible). After a shape renders normally, `renderElementCore` calls `RenderPipeline.renderAppearance(rc, renderer, el, layerOpacity)` which re-applies the element transform, converts the (centred) geometry to `d` strings ([geometry-to-ds.ts](../frontend/src/utils/geometry-to-ds.ts)), and draws each extra fill then stroke **over** the base, bottom-to-top.

**Both-style parity for free via the `d` strings.** Architectural draws the extras with `renderer.fillPath(d)/strokePath(d)` (clean); sketch draws them with `rc.path(d, {fill/stroke,…})` (rough.js), so stacked strokes look sketchy in sketch mode and crisp in architectural — verified (neon double-stroke on a dark rect; red-dashed + green fill over a rough circle). Reusing `d` strings means one code path covers rect/ellipse/points/path/multi.

**Why additive (over-base) instead of a true fills[]/strokes[] that replaces the base:** replacing the base would touch the fill/stroke of *every* shape renderer in both styles (high blast radius). The post-pass leaves the base render untouched and stacks on top — the 80% use (outline/neon/overlay effects) with near-zero regression risk. Trade-off: the base fill/stroke is implicitly the bottom item (you can't reorder *under* it yet).

API: `Yappy.addAppearanceFill/addAppearanceStroke/setAppearance/clearAppearance`; right-click → Appearance → Add Fill / Add Stroke / Clear. **Appearance panel UI (0.27.81):** a bespoke `<AppearanceEditor>` section in `property-panel.tsx` (single-element), modelled on `GradientEditor` — lists each fill/stroke with a colour swatch, opacity/width, dash select, visibility toggle (👁), reorder (↑↓ swap), remove (×), and + Fill / + Stroke. Every edit rebuilds the `{fills,strokes}` object and calls `setAppearance(ids, next)`; rows use `flex-wrap` so the 7 controls never clip in the narrow panel. **SVG export (0.27.79):** extras export as real `<path>`s — a centred `<g>` of the extras is wrapped with the base node so the finalizer's rotate/flip applies to both (`buildAppearanceSvgGroup` in export.ts); canvas-fallback shapes skip it (already in their raster).

## Clipping masks (#3) — clip an element by a vector shape (2026-06-25)

`makeClippingMask` (right-click → Make Clipping Mask, Ctrl+7): the **top** selected object becomes a hidden clip shape; the others reference it via `clipMaskId`; all are grouped (shared `groupId`) so they move together. The mask carries `isClipMask` and `isElementHiddenByHierarchy` returns true for it, so it's neither rendered nor hittable on its own. `releaseClippingMask` reverses it (un-hide, clear refs, drop the clip group).

**Render = one hook in the per-element loop** ([canvas-renderer.ts](../frontend/src/utils/canvas-renderer.ts)): skip `isClipMask` elements in the visibility filter; for an element with `clipMaskId`, `ctx.save()` → `ctx.clip(buildClipPath2D(mask), maskFillRule(mask))` → render → `ctx.restore()`. `buildClipPath2D` ([clip-mask.ts](../frontend/src/utils/clip-mask.ts)) lifts the mask's centred geometry to a **world-space `Path2D`** via a `DOMMatrix` (centre + rotate/flip), so `addPath(centred, matrix)` places it correctly; the loop runs in world coords so the clip lands right. Masked elements skip the element-render cache so the clip tracks a moving mask live. Even-odd fill is honoured for compound-path masks (holes).

**Gotcha — group-bounds click bypasses per-element hit-testing.** I added a clip-aware check in `hitTestElement` (a clipped element is only "there" where the mask covers it). It's correct for *ungrouped* clips, but since `makeClippingMask` **groups** the mask + content, clicking inside the group's bbox selects the whole group *before* `hitTestElement` runs (`isPointInGroupBounds` in the selection handler) — so the corner-outside-the-clip click still selects the clip group. That matches Illustrator (a clip group selects as a unit), so it's fine; the clip-aware hit-test still helps the ungrouped path. Debugging this ate time because an unconditional `console.log` in the clip branch never fired → the branch wasn't reached → the group path won, not the per-element path.

**Luminance opacity masks (0.27.80):** the mask's brightness becomes the content's alpha (white=opaque, black=transparent, gradient=fade). Render path ([canvas-renderer.ts](../frontend/src/utils/canvas-renderer.ts) `renderOpacityMasked`): render the content to off-screen canvas A and the mask shape (visible, with its colours) to off-screen B — both with the **same viewport CTM** (`ctx.getTransform()` copied) so they line up — then fold the mask's luminance into the content's alpha via `A.globalCompositeOperation='destination-in'` + `A.filter='url(#yappy-lum)'` where `#yappy-lum` is an injected SVG `<feColorMatrix type="luminanceToAlpha"/>` filter, and blit A onto the main canvas in device space. Scratch canvases + their rough canvases are reused across frames (rare feature, so full-canvas size is fine). `makeOpacityMask` = `makeClippingMask('opacity')` (sets `maskType:'opacity'`); right-click → Make Opacity Mask. The `luminanceToAlpha` SVG filter avoids a per-pixel JS loop. Verified visually: a blue rect under a white→black gradient mask fades solid→clear.

## Free Transform — Phase 1a: rotation-aware resize (2026-06-25)

Resizing a **rotated** element was janky: `handleResize` ([selection-handler.ts](../frontend/src/utils/tool-handlers/selection-handler.ts)) computed handle deltas in *world* space (`dx = x - startX`) and pinned the top-left in world coords, so dragging a corner scaled the shape along world axes (not its own) while the rotation centre drifted. The handle *hit-test* already un-rotated the pointer to grab the visually-correct handle ([handle-detection.ts](../frontend/src/utils/handle-detection.ts) `unrotatePoint`) — only the resize math lagged.

**Fix (single rotated element only; multi-selection stays world-axis-aligned, like Illustrator):**
1. Project the world drag delta into the element's local frame via `Rot(-angle)`: `dxL = dx·c + dy·s`, `dyL = -dx·s + dy·c`. Feed those into the existing per-handle width/height math unchanged.
2. After computing `newWidth/newHeight` (post aspect-constraint), recompute `newX/newY` from a **pinned anchor** — the corner/edge opposite the dragged handle. `anchorWorld` is the anchor at the OLD half-extents (`centre + Rot(angle)·(ax·hw0, ay·hh0)`, signs from `RESIZE_ANCHOR_SIGNS`); the new centre places the anchor at the NEW half-extents back onto that same world point: `C1 = anchorWorld − Rot(angle)·(ax·hw1, ay·hh1)`, then `newX = C1x − hw1`.

**Why it's safe:** for `angle === 0` the delta projection is identity and `RESIZE_ANCHOR_SIGNS` lookup is gated behind `resizeAngle` truthiness, so the unrotated path is byte-for-byte unchanged — zero regression risk for the 99% case. The anchor formula provably reduces to the old `newX += dx` behaviour at `angle 0` (verified algebraically for `tl`/`br`). `applyResize` needs no change: it scales points/path-anchors by `newWidth/initialWidth` in the element's own local frame, which is already rotation-independent.

**Verified** end-to-end (`tests/free-transform-rotated-resize.spec.ts`): real pointer drag on the `br` handle of a 90°- and a 45°-rotated rect keeps the opposite corner pinned to <3px and grows the correct local axis. The 45° case matters because 90° has `cos=0`, which would mask a sign error.

## Mesh warp — generalize the envelope to an R×C control-point grid (2026-06-25)

The 4-corner envelope was just the 2×2 case, so mesh warp is the *same feature with more cells*. `el.warp` is now normalized to a grid `{rows, cols, points}` (row-major control points, centred-local) via `getWarpGrid`, which also reads the **legacy `{corners}` shape as a 2×2 grid** — so files saved at 0.27.69 keep working untouched. Every consumer (geometry/render/export, hit-testing, handle-detection, selection-renderer, the drag handler) was switched from "the 4 corners" to "iterate `grid.points`", which is strictly more general and collapses the special-case.

**Forward = per-cell bilinear.** A geometry point's normalized `(u,v)` picks a cell `(rr,cc)` and bilerps the cell's 4 control points; for a 2×2 grid this is exactly the old single bilinear, so the envelope is byte-for-byte unchanged. **Inverse (hit-testing) = cell search + per-cell inverse bilinear:** test the click against each *warped* cell quad (`pointInQuad`, winding-sign so it tolerates non-convex cells), then solve that cell's bilinear (a quadratic) for the local coords and combine with the cell index to recover the global un-warped point. Outside all cells → a coarse inverse over the outer corners so true misses still map outside the bbox.

**Why this matters beyond corners:** interior control points produce deformations a 4-corner quad cannot — verified by a 3×3 test that drags the *centre* point (index 4) to bulge the middle, and the hit-test still follows the bulged outline. The selection overlay draws the full lattice (row + column lines) plus a dot per control point. Commands: *Envelope Distort* = 2×2, *Mesh Warp →* 2/3/4/5× submenu (`applyMeshWarp(rows,cols)`); both write the grid model, non-path shapes convert to a path first. New API: `Yappy.applyMeshWarp(rows,cols)`.

**Bicubic smoothing (0.27.71):** the C0 crease was fixed by a one-trick generalization — `getEffectiveGrid` **subdivides the control grid with a tensor-product Catmull-Rom spline** (`subdivideGrid`, SUB=6) into a fine grid, and render + hit-test both run the *same* piecewise-bilinear forward/inverse over that fine grid. So smoothing needs **no analytic bicubic inverse** (the hard part): forward and inverse stay consistent because they share the subdivided grid. Handles/drag still use the raw control grid (`getWarpGrid`). A 2×2 grid smooths to the same straight cage (Catmull-Rom of 2 clamped points = linear), so the flag is harmless there and only bends 3×3+. `warp.smooth` toggled via right-click → Path → *Mesh: Smooth/Sharp* (`toggleMeshSmooth`, API `Yappy.toggleMeshSmooth()`). Verified: same control points render sharp creases vs flowing curves, and the smoothed shape stays hit-testable.

**Image warp (0.27.72):** raster warping via **per-triangle texture mapping**. The image renderer draws in world coords under the active CTM; when `el.warp` is set it tessellates the unit square into a fine triangle grid (N=24), warps each vertex (`meshWarpPoint` → world dest), and for each triangle computes the affine matrix mapping the *source-image* triangle → *destination* triangle (3×3 solve, `affineFromTriangles`), then `clip` to the dest triangle + `ctx.transform` + `drawImage`. Hairline seams between triangles are hidden by inflating each dest triangle ~0.5px around its centroid. Images are **not** converted to a path by the warp command (the `applyWarpGrid` skip for `type==='image'`) — they keep their bitmap and texture-map. Hit-testing already works because the inverse-mesh unwarp runs before the image's AABB narrow phase. Verified: a checkerboard+circle bitmap warps smoothly through a 3×3 bicubic mesh (no seams), and a click in the lifted bulge (above the original bbox) selects.

**The debugging gotcha that cost time:** the image-warp *test* mutated a Solid **store proxy** in place (`getElement(id).warp.points[1] = …`) instead of cloning, so the write never reached the store and hit-testing saw the default grid — looking exactly like a broken inverse. Cloning the warp (`JSON.parse(JSON.stringify(...))`) before mutating fixed it. Lesson: in e2e/console code, never mutate `getElement(...)` substructure directly — it's a read-only reactive proxy; build a fresh object and pass it to `updateElement`.

**Warped-image SVG export + Bake/Apply (0.27.73).** Two follow-ons that shared one extraction: the triangle texture-map moved out of the image renderer into [utils/image-warp.ts](../frontend/src/utils/image-warp.ts) (`drawWarpedImage(ctx, img, el, grid, offX, offY)` + `rasterizeWarpedImage` + `warpedImageBounds`), so renderer, export, and bake all use it.
- **SVG export of a warped image:** SVG can't express a non-affine image warp, so `rasterizeWarpedImage` bakes the mesh into an off-screen canvas and the export embeds *that* bitmap as an `<image>` at the warped bbox (the bbox grows when corners are pulled out). The outer `<g>` finalizer still applies rotate/flip around the element centre, composing correctly (warp is pre-CTM).
- **Bake / Apply Warp** (`bakeWarp`, the destructive counterpart to Remove's revert — Illustrator "Expand"): paths resample their warped outline (`getShapeGeometry` already returns the warped `d`) into corner anchors via `normalizeWorldSubs`; images rasterize to a new bitmap placed at the warped bbox (crop folded in), then clear `warp`. Right-click → Path → *Apply / Bake Warp*; API `Yappy.bakeWarp()`.
- **Two gotchas:** (1) `PathCommand` has no `.x/.y` — coords live in `.points[]` (use `points[points.length-1]` for the segment endpoint). (2) e2e for image warp/export/bake must **wait for the data-URL image to load** (`getImage` is async); calling export/bake synchronously after `createImage` rasterizes nothing.

**Deferred still:** CTM-composed warp handles when an element is simultaneously warped *and* rotated/sheared (warp handles ignore that composition — an edge case).

## Envelope warp — 4-corner bilinear free-distort (2026-06-25)

A **non-affine** transform, so unlike rotate/flip/shear it can't ride the canvas matrix — the geometry itself must be deformed. `el.warp.corners` = 4 points [TL,TR,BR,BL] in the centred-local frame; the bilinear map `P(u,v)=(1-u)(1-v)TL+u(1-v)TR+uvBR+(1-u)vBL` (with `u=(x+w/2)/w`) deforms the sampled outline **before** the affine CTM, so it composes cleanly on top of the rest of Free Transform. Default quad = the bbox → identity (no change until a corner is dragged). All math in [utils/envelope-warp.ts](../frontend/src/utils/envelope-warp.ts).

**One injection covers render (both styles) AND export.** `getShapeGeometry` is the universal source feeding the architectural pipeline, the sketch (rough.js) renderer, **and** SVG export (`geometryToDs`). Wrapping it (`getShapeGeometry` → `getBaseShapeGeometry` + a warp step) means: if `el.warp`, sample the base geometry to a polyline, bilinear-map every point, and return a `{type:'path'}` with a fresh sampled `d`. rc.path / fillPath / export all consume that `d` unchanged — even-odd preserves holes when there are multiple subpaths. **Gotcha discovered the hard way:** basic `rectangle`/`circle` have a *direct* draw fast-path that bypasses `getShapeGeometry`, so the warp didn't show on a rect (only on `path`). Resolution + scope: the **Envelope Distort command converts non-path shapes to a `path` first** (like the rest of the path toolkit), and warp is a path-element feature. Verified: a square path warps to a perspective quad in both Sketch and Architectural, fill + stroke.

**Hit-testing = inverse bilinear (a quadratic).** `unwarpCenteredPoint` solves `P(u,v)=Q` for `(u,v)` (k2v²+k1v+k0=0 via cross products, pick the root in [0,1]) and maps back to the un-warped point, so the existing narrow phase tests the *stored* (un-warped) anchors. One line in `hitTestGeometry` after un-shear. Warped elements are forced onto the JS hit path (`&& !el.warp` on the WASM gate) so the inverse applies — no WASM change needed. Verified by click test: a click in the bulged-out warped region (outside the original bbox) selects; a click where the shape pulled *away* misses.

**Handle priority is the subtle UX bug.** The default warp quad sits *exactly* on the bbox resize corners — and for a `path`, also on the editable path-anchor handles. Both are checked before the new warp handles, so the first drag grabbed a resize/anchor handle and the quad never moved. Fix: hit-test the 4 warp corners with **highest priority** (before path anchors and bbox corners) whenever `el.warp` is active. Dragging maps the pointer into the centred-local frame (un-rotate, minus centre) and writes that corner. Drawn as an orange quad + 4 orange dots (distinct from the blue bbox handles).

**Deferred:** NxM mesh warp and raster/image warping (need the mesh infra from roadmap #10). This slice is 4-corner free-distort on vector outlines.

## Free Transform — Shear (decomposed `shearX`/`shearY`) with full WASM/export parity (2026-06-25)

The final Free-Transform piece: per-element shear, added as **decomposed fields** `shearX`/`shearY` (matrix `[[1,shearX],[shearY,1]]` about the centre) — **not** a general affine matrix, which would have rippled through the entire geometry/WASM/export stack. Distinct from the pre-existing `skewX`/`skewY` (those warp only the `perspectiveBlock` 3D back face).

**The forward transform lives in exactly one place — the render context.** Shape geometry is computed in a centred, unrotated frame and `RenderPipeline.applyTransformations` brackets it with `translate(±c)` + rotate + flip. So shear is one inserted step: `renderer.transform(1, shearY, shearX, 1, 0, 0)` after flip. That required adding a generic `transform(a,b,c,d,e,f)` to `IRenderer`/`CanvasRenderer` (only `translate/rotate/scale` existed). Because there's a single forward site and a single `IRenderer` impl, **both Sketch (rough.js) and Architectural render shear for free** — verified visually (rect + diamond, shearX + shearY, both styles, fill *and* stroke).

**Hit-testing is the parity-critical part — and the win was to invert in the bridge, not the WASM.** Hit-testing applies the *inverse* transform by hand (`unrotatePoint` etc.). I added an `unshearPoint` (inverse `[[1,shearX],[shearY,1]]`, `det = 1 − shearX·shearY`) right after the un-rotate in `hitTestGeometry` and `isPointInEraseHole`. The key discovery: the WASM path (`wasmHitTestElement`) receives an **already-inverse-transformed point from the JS bridge** and `hitTestSingle` just tests an axis-aligned shape — so applying `unshearPoint` *in the bridge* (before the WASM call) keeps JS≡WASM **without recompiling the `.wasm` or changing its 6-float element buffer layout**. The batch path is viewport culling only, where a slightly-loose AABB is harmless, so it was left untouched. Verified by a click test: clicking inside the sheared parallelogram but *outside* the axis-aligned bbox selects; clicking inside the bbox but outside the parallelogram does not (35px discriminating band at shearX=1 to clear the hit threshold).

**Export uses `matrix()`, not `skewX()`+`skewY()`.** Two SVG skews don't compose to `[[1,shearX],[shearY,1]]` when both are non-zero (`skewX·skewY` leaves a cross term). `translate(c) matrix(1, shearY, shearX, 1, 0, 0) translate(-c)` is byte-identical to the canvas transform. `exportToSvg` now also returns the serialized string (exposed as `Yappy.exportSVG()`) so export is testable.

**Interactive gesture (the "Free Transform" feel):** Ctrl/Cmd + drag a **side** handle shears (Illustrator parity) instead of resizing — captured as `pState.shearing` at pointer-down on a tm/bm/lm/rm handle. The drag delta is projected into the element's local frame (reusing the Phase-1a rotation-aware unrotate) and converted to a factor: an edge at local distance `±h/2` moved by `d` ⇒ `shearX = 2·d/h`. Plus numeric **Shear X / Shear Y** panel fields. Verified e2e: Ctrl+drag top handle +40px ⇒ `shearX = −0.8`, width/height untouched.

## Free Transform — Phase 2: numeric X/Y/W/H panel + reflect-across-pivot (2026-06-25)

**Numeric transform fields.** Added `x`/`y`/`width`/`height` as `number` properties in [properties.ts](../frontend/src/config/properties.ts) (group `dimensions`, joining the pre-existing `angle`). They render through the panel's generic `number` control, but the **write is intercepted** in `property-panel.tsx` `handleChange` and routed to a new `setElementTransform(id, patch)` action — a raw `updateElement({width})` would resize the *bbox* while leaving the element's relative geometry (pen points, vector path anchors/handles, erase strokes) behind. `setElementTransform` sets x/y directly (geometry is origin-relative, so moving the origin moves everything) and, for w/h, multiplies that relative geometry by the per-axis scale.

**The reuse win — `utils/geometry-scale.ts`.** The interactive resize (`selection-handler.ts`) already had local `scalePathAnchors`/`scalePathSubpaths`/`scaleEraseStrokes` helpers. Rather than duplicate or risk-refactor the *verified* resize path, I extracted the same logic (plus a `scalePoints` that detects flat-`[x,y]` vs object-`[{x,y,p}]` encoding by runtime type, since `pointsEncoding` goes stale after `normalizePencil`) into a standalone, import-cycle-free module and wired only `app-store` to it. So the panel scales geometry *exactly* like a handle drag without touching the drag code. History is captured once on input `focus` (the number control already does `pushToHistory` onFocus), so `setElementTransform` itself doesn't push — typing doesn't spam the undo stack.

**Reflect across the pivot — extend, don't fork.** `flipSelected` already reflected in place about the selection's bbox centre (Shift+H/V). Gave it an optional `axisValue?: number`: when present it reflects across that **world coordinate** and repositions even a single element (previously single-select only toggled `flipX` in place). The Phase-1b custom pivot composes straight in — right-click → *Reflect Across Point →/↓* calls `flipSelected('horizontal', pivot.x)`. One new param, no parallel reflect path.

**Gotcha — `getElement` returns a live store reference, not a snapshot.** An e2e test read `before.width` into the returned object *after* mutating, and saw the post-mutation value (the same object). Snapshot primitives (`const w = el.width`) before mutating. Verified: numeric W/H doubles a path's last anchor x from 100→200 and halves y 100→50; X/Y moves; reflect across pivot mirrors centre 350→150 about pivot 250 (`tests/free-transform-numeric.spec.ts`). New API: `setElementTransform`, `flipSelection`.

## Free Transform — Phase 1b: movable rotation pivot (2026-06-25)

A draggable rotation pivot (the reference point rotation orbits about). The crux was the **placement gesture**, not the math — and it had to work on mouse *and* tablet/pen.

**Gesture decision — right-click / long-press → "Set Rotation Point Here".** The two tempting alternatives both lose:
- *Grab a crosshair drawn at the centre* — hijacks click-body-to-**move** (the centre is exactly where you click to drag a shape), and is touch-hostile (fat finger can't avoid/hit the exact centre).
- *Alt-click to place* — `Alt` is already overloaded in `selection-handler.ts` (3D view-angle drag at line ~1206, anchor ops ~177, hierarchy-skip ~2089).

The context action wins on **both** platforms: Yappy already maps long-press → the same context menu, so placement needs **zero precision** (no fat-finger fight), and it collides with nothing. Once placed, the pivot is a draggable crosshair with a **generous hit radius** (`handleSize`, ~24px box, vs the 12px resize handles) so it's grabbable by finger/pen too. **Generalizable:** for a feature that must work on touch, prefer a precision-free placement gesture (menu/long-press) over "grab a small on-canvas target"; reserve dragging for *refinement* once the target already exists.

**State model — keyed by selection signature, no lifecycle hooks.** Pivot lives in its own module ([transform-pivot.ts](../frontend/src/utils/transform-pivot.ts)) as `{x, y, key}` where `key = selection.join(',')`. `getCustomPivot(selection)` only returns it when the key still matches, so the pivot **auto-resets when the selection changes** — no need to clear it at the (many) `setStore('selection', …)` call sites. The module is import-cycle-free so hit-detection, the handler, the renderer, the context-menu builder and `api.ts` can all share it. It's ephemeral UI (not in the document/undo), so dragging it skips `pushToHistory`; the renderer (which is store-free) gets `selection` threaded through `ElementOverlayOptions` and only draws the crosshair for a single selection.

**Off-centre rotation orbits the centre.** Rotating about a custom pivot also moves the element: each pointer-move computes the angle delta `d = newAngle − el.angle` and rotates the element centre around the pivot by `d` (`ncx = pivot.x + rx·cos d − ry·sin d`, …). Verified end-to-end (`tests/free-transform-pivot.spec.ts`): a real rotate-handle drag preserves centre→pivot distance (orbit) and leaves the pivot itself fixed; a second test confirms the selection-key auto-reset. No default-centre grab means **zero regression** to click-body-to-move — the pivot is only hit-tested when one has been explicitly placed.

## Pathfinder booleans (keystone Phase 5): flatten → `polygon-clipping` → editable path (2026-06-24)

Boolean ops (union/subtract/intersect/exclude) landed by adding the MIT `polygon-clipping`
dep and a thin geometry bridge ([path-boolean.ts](../frontend/src/utils/path-boolean.ts)):
each element → world-space polygon rings via `getShapeGeometry` (rect/ellipse/points/path/
multi, curves sampled — note `PathUtils.parsePath` lacks `A` arcs, fine for pen/path
output), run the op, result outer-rings → corner-anchor `path` elements. `subtract` is
backmost-minus-front (z-order). Two traps worth recording: (1) **holes** — a result
polygon is `[outerRing, ...holes]`; our single-subpath `path` can't render holes, so we
drop them (fully-contained subtract loses its hole; edge-overlap subtract is a single
concave ring and is fine). (2) **verification harness bug, not app bug** — a Playwright
`page.evaluate((op)=>…, op)` with the *same name* for the closure param and the for-loop
variable silently passed `op` as `undefined`, so every op ran as the `else` branch
(difference) and looked identical. The app was correct the whole time (a *literal*
`'union'` produced the right L-shape); always test a new dispatch with a literal before
trusting a parameterized harness. **Takeaway:** for boolean geometry, lean on a vetted
clipping lib and keep the bridge thin (flatten in, rings out); the hard part is the
data-model gaps (holes/multi-subpath) and the test harness, not the math.

## Pen tool (keystone Phase 2): model on the polyline handler, add drag-for-curve, normalize on every write (2026-06-24)

The vector Pen tool ([pen-path-handler.ts](../frontend/src/utils/tool-handlers/pen-path-handler.ts))
was built by copying the multi-click structure of `polyline-handler.ts` and wiring the
same five `canvas.tsx` dispatch sites (down/move/up/dblclick/keydown) — plus one extra
behaviour polyline doesn't have: **down-drag-up per anchor** (a plain click = corner
anchor; dragging before release = smooth anchor whose out-handle follows the cursor and
in-handle mirrors). Two things that bit: (1) **name collision** — there's already a
freehand `pen-handler.ts` exporting `penOnMove`/`penOnDown`, so the new file is
`pen-path-handler.ts` and canvas imports it under `penPath*` aliases. (2) **stable
geometry while building** — internal `penAnchors` stay relative to the first anchor
(`startX/startY`) and may go negative; every write re-normalizes into the element's
bbox (`x/y/width/height` + origin-relative `pathAnchors`), and because world.x of anchor
i = `startX + penAnchors[i].x` regardless of the bbox shift, the path never jitters as
the box grows. Also: the default toolbar is **brainstorm mode**, so a new tool button
must be added to *both* `brainstormTools` and the full toolbar to be discoverable. The
tool id is the existing `'path'` ElementType (no new `ToolType` needed); the dispatch
intercepts before `drawOnDown`, exactly like polyline. **Takeaway:** for a new
multi-click canvas tool, clone the nearest staged-creation handler, keep build-time
coords in a fixed local frame and normalize to the element on each write, and remember
the brainstorm/full toolbar split.

## Editable vector `path` element (keystone Phase 1): reuse the `path`-geometry pipeline, not a new renderer (2026-06-24)

The first slice of the Illustrator-class vector path tool ([docs/vector-path-tool-spec.md](vector-path-tool-spec.md))
landed by *reusing* existing machinery rather than writing a new renderer. Key moves:
(1) Store editable **anchors** (`pathAnchors: {x,y,in?,out?,kind}[]` + `pathClosed`),
origin-relative like `points`, and *derive* the SVG `d` on demand
(`anchorsToPathData` in `utils/math/path-utils.ts`) — `getShapeGeometry` already has a
`{type:'path', path}` kind that `SpecialtyShapeRenderer` renders, so fill/stroke/
gradient/sketch came for free by registering `'path'` with the specialty renderer and
adding one `case 'path'` (offset anchors by `-w/2,-h/2` into the centred geometry frame).
(2) **Hit-test gotcha:** the WASM hit-test fast-path intercepts *all* types except a
hardcoded few — a new type must be added to that exclusion or it silently won't select;
then a JS narrow phase samples the path via `PathUtils.getPointOnPath` and tests
`isPointOnPolyline` (stroke) + `isPointInPolygon` (filled closed). (3) `...options`
spread in `api.createElement` passes new fields through, but `ElementOptions` is a
*curated* interface — new fields must be added there to type-check. **Takeaway / gap:**
move/rotate/select/style/persist all worked immediately because they operate on the
bbox; **resize does not** — it changes `width`/`height` without scaling `pathAnchors`,
so the geometry stays put. Point-based shapes scale their `points` in the resize
handler; the path element needs the equivalent anchor-scaling (deferred to a later phase).

## Mindmap auto-reflow (P0): animate via a cancelable rAF tween, and sequence it around editing (2026-06-24)

Closing the "feel gap" — trees auto-reflow into a tidy layout on every mutation, animated — came down to a few non-obvious sequencing calls. (1) **Split compute from apply.** `computeMindmapLayout(root, dir, skipCollapsed)` runs the engine and returns a `Map<id,{x,y}>` of *targets* without touching the store; `relayoutMindmap` then either applies them instantly or tweens current→target over ~180ms (`ease-out`, `1-(1-t)^3`) via a single module-level `requestAnimationFrame` handle that a new mutation cancels and retargets. One shared rAF channel means you can only animate one tree at a time — so multi-select collapse / cross-tree reparent animate just one tree and snap the rest (`animate:false`). (2) **Animation fights inline editing.** The keyboard `Tab`/`Enter` flow creates a node *and opens the text overlay on it*; if the node then animates to its slot, the overlay is stranded. Fix: the add+edit path passes `animate:false` (instant reflow → overlay lands correctly), while collapse/delete/reparent (no editing) animate. (3) **Collapsed = leaf for layout.** `buildTree(..., skipCollapsed)` stops recursing at a collapsed node so its hidden subtree reserves no space and siblings pack tight; hidden descendants keep their coords until expand re-lays-them-out. (4) **Per-tree direction, remembered.** A new `balanced` engine layout (top-level branches split left/right of root) is the default; `reorderMindmap` writes the chosen direction to the root's `mindmapDir` so auto-reflow stays consistent, and **paste lays out with the *resolved* direction** (not a hardcoded one) so the first post-paste edit doesn't jump the whole tree to a different layout. **Takeaway:** for animated auto-layout, separate target-computation from application, drive it through one cancelable tween, and explicitly choose instant-vs-animated per call site based on what else is happening (editing, multi-tree, bulk paste) — the bugs live in those seams, not the math.

## Mindmap polish: reuse the handle/render/hit-test triad instead of new interaction systems (2026-06-24)

Shipping the Whimsical-parity P1/P2 batch (mindmap tool shortcut, smart-paste outline → subtree, collapse child-count badge, add-child "＋" handle, drag-reparent preview, depth font taper) confirmed two patterns worth repeating. (1) **New on-canvas affordances are a triad, not a feature:** render it in `selection-renderer.ts`, detect it in `handle-detection.ts` (return a new `handle` string), act on it in `selection-handler.ts` (plus a cursor case). The existing `mindmap-toggle` was the template; the add-child handle dropped in by copying it. The sharp edge is **hit-area collision** — the add-child "＋" first overlapped the right-middle (`rm`) resize handle, which sits ~8px past the node edge; placing the new handle at +28px with a 14px radius (and detecting it *before* element selection but accounting for `rm`'s reach) is what kept resize working. Always map the pixel spans of neighbouring handles before adding one. (2) **Build-once-then-layout beats per-node placement:** smart-paste creates every node via a no-history `addChildNode(parentId, {recordHistory:false, select:false})` variant, then calls a single extracted `layoutMindmapTree(rootId, dir)` (the engine core split out of `reorderMindmap`, sans history/toast) — one undo step, one tidy pass. Scope that layout to the *paste target*, not the true root, so it doesn't silently override a layout direction the user chose elsewhere. **Takeaway:** extend the established triad and factor the no-side-effect core out of user-facing actions so batch/programmatic paths can reuse it. Smart-paste intent gate: only treat a paste as a subtree when the text has real indentation hierarchy OR the target is already a mindmap node — otherwise a flat multi-line paste onto any shape would surprise-spawn children.

## Global keyboard handlers reach canvas-local editing via a `window` bridge, not props (2026-06-24)

Making mindmap nodes labellable by keyboard meant `F2` (and auto-edit after `Tab`/`Enter`) in the top-level `app.tsx` keydown handler had to start text editing — but the editing signals (`editingId`/`editingProperty`/`editText`/`richTextSpans`) and the textarea ref live inside `canvas.tsx`'s component scope, unreachable from `app.tsx`. The codebase's established answer is a **`window` bridge**: `canvas.tsx` already exposes `window.__tableCellNav` for exactly this cross-boundary keyboard case. I followed it with `window.__nodeTextEdit.startEditing(id, opts)`, registered in `onMount` and `delete`d in `onCleanup`. Key correctness points: (1) reuse the *same* signal-setting sequence as `handleDoubleClick` (`batch()` then set `editingId` last — it triggers the `<Show>` overlay render); (2) the bridge inherits `setEditingId`'s rotation guard for free, so check `editingId() === id` *after* setting before focusing the textarea (a blocked edit leaves it unchanged); (3) no double-fire because the overlay is a real `<textarea>` and the global handler bails on `isInputFocused`. **Takeaway:** when a global shortcut must drive component-local state, look for an existing `window.__*` bridge and extend that pattern rather than threading callbacks/props through the tree — and let shared guards (rotation, input-focus) do their job by replicating the canonical mutation order exactly.

## Dark mode is a canvas CSS filter — on-canvas DOM editors must replicate it (2026-06-22)

Yappy's dark/focus theme doesn't mutate stored colors. It renders WYSIWYG canonical (light-mode) colors to the `<canvas>` and applies a single CSS `filter: invert(93%) hue-rotate(180deg)` on the host canvas element (`canvas.tsx`) to flip them for presentation (black→white). Stored values stay canonical — that's why the `theme-canonical-v1` migration rewrites old white defaults back to black, and why `adjustColor()` is a no-op.

The gotcha: any editing UI layered *over* the canvas as separate DOM (the plain-text `<textarea>`, the rich-text contenteditable) is **not** inside that filter, so it shows the raw stored color while the committed canvas shows the inverted color. Symptom: text looked black while editing in dark mode, then snapped to white on commit. Fix: replicate the exact same `invert(93%) hue-rotate(180deg)` filter on the text-bearing editing element (not its container — that would invert backgrounds/toolbar chrome) whenever `resolvedTheme` is `dark` or `focus`. Rule of thumb: if you add a DOM overlay that visually sits on the canvas and carries user content colors, it must mirror the canvas dark-mode filter to stay WYSIWYG. See bug #101.

## Linux drops the system cursor for tablet pens — draw your own dot (2026-06-21)

On Linux, Chromium often stops painting the system cursor for a tablet pen (Huion etc.) while it hovers a page that acts as a drawing surface — hover and `pointermove` still fire, but no cursor (CSS `cursor` values included) is rendered, so the pen "disappears". The portable fix (from happypaint): a window-level **capture-phase** `pointermove`/`pointerdown` listener that, for `pointerType === 'pen'`, renders a small fixed-position dot at the pen's client coords (white fill + dark ring, `pointer-events: none`, high `z-index`); mouse/touch null it out so the normal cursor shows. Capture phase matters — it keeps firing even while the canvas holds `setPointerCapture` mid-stroke. Hide on `pointerout` with no `relatedTarget` (pen left the window) and on window `blur`. This is an app-wide overlay in `app.tsx` (not the per-element canvas cursor), because the cursor is invisible over panels too, not just the canvas. See bug #100.

## A cross-app port can fail on the same fault class but different hardware behaviour (2026-06-21, REVERTED)

Ported happypaint's Huion tip-chatter de-split into yappydraw and had to revert it — a useful lesson about porting input heuristics across hardware. The fault class is the same (a budget pen's tip switch chatters across its pressure threshold under light pressure, firing a spurious `pointerup`→`pointerdown` mid-stroke, splitting one drawn line into gappy fragments). happypaint's fix defers the pen-end, buffers the dip's hover moves, and replays them into the same stroke on a nearby re-contact, with a **sliding** proximity anchor so a slow chatter-trace that wanders can still reconnect.

Why it broke here: that whole scheme rests on one behavioural assumption — **"a genuine inter-stroke lift stops the hover stream, so the short timer commits before the next stroke starts; only a chatter dip keeps the hover alive."** On this Huion + yappydraw the pen emits a *continuous* hover stream **between deliberate strokes** as well. The sliding anchor then chained across that inter-stroke hover path, merged adjacent intentional strokes (hatching, dense sketching, close handwriting) into one element, and replayed the hover path between them as an unwanted **connecting line** — the user saw "extra strokes". The buffer-and-replay machinery was correct; the *discriminator* (hover continuity) simply doesn't separate dip-from-lift on this device.

Lessons:
- **An input heuristic is only as good as its discriminator on the actual hardware.** Buffer/replay is sound, but if you can't reliably tell "tip-chatter dip" from "deliberate lift", any merge will fuse strokes that shouldn't fuse. Hover-stream continuity was that discriminator and it failed.
- **Don't ship hardware-specific input heuristics you can't test on the hardware.** This was implemented and reverted blind; the false-merge artifact is worse than the original gaps. The honest fix is at the source (Huion driver: tip-activation force / pressure curve). If retried in software, gate it behind a user toggle defaulted **off**, or key the merge on an explicit hover-gap timeout that commits aggressively rather than on hover continuity.

See bug #99 (reverted). The unrelated pen-cursor fix (#100, Linux drops the system pen cursor) is kept.

## Canvas (view) rotation: centralize the transform first, then it's a two-line core (2026-06-20)

Adding Procreate-style canvas rotation looked daunting because `world*scale+pan` math was duplicated across ~20 sites. The unlock was doing the boring refactor **first**: a single `utils/viewport-transforms.ts` (`worldToScreen`/`screenToWorld`) with an optional `rotation`/`centerX`/`centerY` that *reduces to the old math when rotation is falsy*. That made the centralization migration a verifiable behavioural no-op (built and shipped before any rotation existed), and turned the actual feature into a tiny core: one inverse-rotate in the input chokepoint (`getWorldCoordinates`) and one `ctx.rotate` (applied **outermost**, before `translate(pan)·scale`) in the render block. Crucially, everything in world space — hit-testing, snapping, routing, marquee, and **all WASM** — needed zero changes, because they only ever see world coords. The render CTM and the helper's inverse must agree on the exact model (`Rot(θ,C)·(world·scale+pan)`, pivot = viewport centre); canvas being full-window means screen px = CSS px 1:1, so the pivot is just `canvasRef.width/2, height/2`.

The real cost was never the core — it was the **DOM overlays** that compute their own `world*scale+pan`. The pragmatic scoped-mode answer: don't make all of them rotation-perfect on day one. Block the genuinely hard ones at their single state chokepoint (text editing via the `editingId` setter wrapper — one guard covers double-click, text-tool placement, UML/table cells, and the rich-text overlay; path editing via `setPathEditing`), hide the toolbar whose layout assumes an axis-aligned bbox, and thread a `currentViewport()` (viewState + window-centre pivot) into the simple HUDs that hang off a true world point (ds-ops, video). Two-finger twist reused the existing pinch/pan gesture by adding `angle` to the metrics and solving pan from the inverse render transform so the world point under the centroid stays pinned; a 5° deadzone keeps pure pinch/pan from drifting into rotation. **Location:** `frontend/src/utils/viewport-transforms.ts`, `frontend/src/components/canvas.tsx`, `frontend/src/store/app-store.ts` (`rotateView`/`resetRotation`/`currentViewport`). Full notes in `docs/canvas-rotation-research.md`.

## Make a frequently-toggled setting reachable everywhere, not just in Settings (2026-06-18)

Stroke stabilization first shipped with only a Settings → Pen & Input slider. That's wrong for something an inker flips on/off constantly (heavy for a long curve, off for quick marks) — and useless on tablet where there's no keyboard. Surfaced it four ways, matching the Smart Shapes (`Shift+Q`) precedent: keyboard `Shift+S`, a toolbar button that **only renders while a brush tool is active** (`<Show when={BRUSH_TOOLS.includes(store.selectedTool)}>` — the tablet-friendly always-visible surface), a 0–100% slider in the brush properties panel, and a Command Palette entry. The Settings slider stays for setting exact strength.

Two reusable patterns worth remembering:
- **Toggle that remembers strength.** `togglePenStabilization()` in `app-store.ts` flips between 0 and a module-scoped `lastStabilizationStrength` (seeded from the persisted value, default 0.5), so off→on restores where you were instead of jumping to a fixed value. Right model for any "0..1 strength with an on/off" control.
- **Surfacing a *global* setting in the per-element property panel.** The panel reads/writes element + `defaultElementStyles`; a global like `penStabilization` doesn't live there. Special-case it exactly like `eraserWidth` does: filter by `applicableTo` (brush tools) so it shows for the active tool's "defaults" target, then add a read branch (`store.globalSettings.penStabilization * 100`) and a write branch (`updateGlobalSettings({ penStabilization: value/100 })`) keyed on the prop name. The slider works in 0–100 while the stored value stays 0–1 — scale at the panel boundary, not in storage.

Lesson: the *discoverability/ergonomics* of a setting is a feature in its own right. A setting that's awkward to reach won't get used; match the access surfaces to how often and where (desktop vs tablet) it's actually toggled.

## More happypaint/Procreate parity: multi-finger gestures, ColorDrop, lazy-brush stabilizer (2026-06-18)

Three touch/mobile features adapted from happypaint (the reference Procreate-like app), each chosen because it ports cleanly into yappy's *vector* model rather than fighting it. Canvas rotation was explicitly **deferred** — yappy's view model is `{ scale, panX, panY }` and ~219 world↔screen sites (plus every HTML overlay: text edit, path editor, video, minimap) assume an axis-aligned view, so pinch-rotate is a multi-day architectural change, not a gesture add.

1. **Multi-finger gesture vocabulary** (`canvas.tsx`). Layered onto the existing 2-finger pan/zoom in the raw `TouchEvent` handlers (yappy uses TouchEvents for touch, not the PointerEvent recognizer happypaint assumes — so the recognizer was *reimplemented inline* against the existing `handleTouchStart/Move/EndGesture`, not copied). Two-finger tap = undo (hold-still = repeat every 150 ms), three-finger tap = redo, three-finger swipe-down = copy, four-finger tap = zen mode, quick pinch-in flick = zoom-to-fit. **Key decision:** defer the pan/zoom commit until a finger crosses a 14 px slop — below that the contact stays eligible to resolve as a discrete tap, so a quick 2-finger tap no longer nudges the canvas. And **2 fingers navigate, 3+ are commands** (Procreate's split): 3+ fingers never pan, so swipe/tap don't fight navigation. Gesture stays "active" until *all* contacts lift so taps that release finger-by-finger still resolve and a leftover finger can't start a stray stroke; `touchcancel` aborts without firing; stylus excluded throughout via `allFingerTouches` (consistent with palm rejection).

2. **ColorDrop** (`utils/color-drop.ts`, `color-drop-hud.tsx`, `p3-color-picker.tsx`). Drag a palette swatch onto a shape to set its fill. HTML5 drag-and-drop already existed but **never fires on touch**, so the touch/pen path uses pointer capture on the swatch (iOS-reliable). **Reuse over duplication:** the desktop drop handler's hit-test-and-fill core was extracted into `applyAssetAtClientPoint(clientX, clientY, data, ctx)` in `canvas-event-handlers.ts` and is now shared by both the `DragEvent` drop and the touch commit; the canvas registers the commit callback (it owns client→world + the element ctx) via a tiny signal module. Engaged for **touch/pen only** (`pointerType === 'mouse'` bails), so desktop DnD + click-to-set-stroke are untouched; a sub-8 px press stays a tap. `touch-action: none` on the swatch so the browser doesn't steal the drag as a scroll.

3. **Lazy-brush stabilizer** (`utils/stroke-stabilizer.ts`). Opt-in pulled-string stabilizer for clean freehand inking, ported near-verbatim from happypaint (pure geometry). **Off by default (0%)** — `globalSettings.penStabilization` 0..1, slider in Settings → Pen & Input. Integration seams: armed in `drawOnDown` (shared by pointer + touch begin), both point-push sites (`pen-handler.ts` + the canvas touch path) route through `pushStabilizedSample`, and `finishStabilizer` draws the string out in `drawOnUp` *before* the final flush. **Pressure alignment** is the subtlety: the stabilizer emits 0-or-1 points per raw sample, and each emitted point pushes exactly one pressure value, so `penPressureBuffer` keeps its 1:1 mapping with points through `flushPenPoints`. When off, the stabilizer is `null` and the push helper falls back to the identical original `push()` — zero behaviour change. The ephemeral `ink` tool is **excluded** (it has its own `inkOnDown` path and `drawOnDown` doesn't init its `points`), keeping it untouched.

Lesson: "adapt from the reference app" is a *filtering* exercise, not a port — for a vector/diagram tool, gestures and ColorDrop map naturally, the stabilizer ports as-is, and canvas rotation doesn't (it's an architecture change masquerading as a gesture). And each new way to start/stop interaction (taps, swatch-drag, stabilized strokes) needs an explicit guard (slop-before-commit, mouse-bail, `null`-stabilizer fallback, ink exclusion) so it can't fire or regress an existing path.

## Text on path: one arc-length engine for every path type (2026-06-16)

"Curved Text" previously existed only on `organicBranch` and was hard-wired to a single cubic bezier inside `PathRenderer.drawCurvedText` (private, bezier-only). Generalized it so text can follow **any** path — connectors (line/arrow/bezier/elbow/polyline), freehand pen strokes, and closed-shape outlines.

Key decision: **one engine over a polyline of points**, not per-type math. New `frontend/src/utils/text-on-path.ts` exposes `drawTextAlongPath(renderer, text, points, fontSize, opts)` (arc-length table → binary-search locate → per-glyph translate+rotate) plus `getElementTextPath(el)` and `getOutlinePath(el)`. Every caller converts its geometry to an absolute-coordinate `{x,y}[]` and hands it over; beziers are pre-sampled into points (64 steps) and closed shapes into an outline polyline (ellipse 72-pt, rect/diamond/triangle corners, regular-polygon inscribed, ellipse fallback for unsupported). `PathRenderer.drawCurvedText` was reduced to "sample my bezier → call the engine," removing the duplicate implementation.

Hooks are one branch each: `connector-renderer.ts renderConnectorText` (open paths), `render-pipeline.ts renderText` (closed-shape outline — one branch covers every shape since all shape renderers route text through this static method), and `freehand-renderer.ts renderCommon` (text along the smoothed stroke). UX reuses the existing `containerText` + `curvedText` toggle: extended the double-click text-edit allow-list to include `fineliner`/`inkbrush`/`marker`, and `quick-toolbar-config.ts` `curvedText.applicableTo` to the new types. Open paths center the run and flip whole-text for right-to-left readability (preserved original behaviour); closed loops start at `textPathOffset` and flip glyphs per-char to stay upright (so bottom-of-circle text isn't upside-down).

Lesson: when several element types need "the same thing along their geometry," normalize them all to one representation (here: an absolute polyline) at the boundary, and keep a single algorithm. Render-side only — no WASM parity needed (`text-on-path.ts` isn't one of the WASM-mirrored files and runs once per element per frame, not on the hit-test path).

## Pen-input parity with happypaint: palm rejection, pointer heal, pressure, smart shapes (2026-06-16)

Brought four happypaint behaviours into yappy after reviewing happypaint's `pointer-router.ts` / `quick-shape.ts` (the reference iOS pen app). All four are in `frontend/src/components/canvas.tsx` plus a new recognizer util and the freehand renderer.

1. **Time-window palm rejection.** Previously yappy only blocked palm-sized touch *while a pen was physically down* (`activePenPointerId !== null`). A resting palm between fast strokes slipped through. Added a `PEN_RECENT_MS = 500` recency window (`now - lastPenInputAt < 500`) to the touch branches of `handlePointerDown/Move/Up` — but **gated by `!isPencilSizedTouch`** so a misclassified Pencil-tip touch still draws. This is the key: a blanket recency window was *removed* earlier because it dropped legit Pencil-downs that iPad ships as small-area `touch` pointers; the pencil-size exemption brings the window back without that regression. Also: a finger/palm `touchstart` arriving mid-stylus-stroke (no `touchType==='stylus'` in `changedTouches`) is now *ignored* instead of running the self-heal `finalizeTouchStroke()`, which used to cut the stroke short when you rested your hand.

2. **Heal-on-move for the pointer path.** The existing dropped-`touchstart` heal only covered TouchEvents (iPad). Added the symmetric heal in `handlePointerMove` for genuine pointer-driven pens (Surface/Wacom/Chromebook): a `pen` move with the tip engaged (`buttons&1 || pressure>0`) and no open stroke opens one. Safe because `touchDrivingPenStroke` short-circuits the whole pointer handler on iPad, so the two heals can't race / double-begin.

3. **Pressure → width.** `Point.p` already existed but was never captured. Capture `e.pressure` (pointer) / `touch.force` (TouchEvents) into a parallel `pState.penPressureBuffer`, flushed into a new `element.pressures: number[]` aligned 1:1 with points (pad pre-existing points with neutral `0.5`). The inkbrush renderer uses pressure for width **only when the stroke shows real variation** (`max-min > 0.05`) — mouse/finger record a constant `0.5`, which we treat as "no pressure" and fall back to the existing velocity-based width. Capture is gated by `globalSettings.penPressure`; the renderer just keys off `element.pressures`, so toggling never couples the renderer to settings. `normalizePencil` preserves point count, so `pressures` stays aligned through finish.

4. **Smart shapes (hold-to-correct).** New JS-only recognizer `frontend/src/utils/shape-recognition.ts` (ported from happypaint `quick-shape.ts`: RDP corner-finding + ellipse-fit error + line/closed tests). A dwell controller in canvas arms a 600 ms timer on stroke begin, restarts it on movement beyond a 4 px jitter dead-zone, and on fire converts the freehand element **in place** via `updateElement` into a real `line`/`rectangle`/`circle`/`triangle`/`diamond`, then selects it and switches to the selection tool. Ambiguous strokes return `null` → the ink is kept, so holding still never forces a wrong shape. A `smartShapeSuppress` flag blocks both heal paths from re-opening a stroke from the trailing contact after a snap (cleared on lift). Recognition is JS-only and runs once per dwell (never on the per-point path), so it needs no WASM counterpart.

Lesson: each fix is a *guarded* relaxation. Palm rejection, the pointer heal, and the smart-shape snap all create new ways to start/stop a stroke, and every one needs an explicit guard (pencil-size exemption, `touchDrivingPenStroke` short-circuit, `smartShapeSuppress`) so the new path can't fire when it shouldn't. **Toggles**: `Settings → Pen & Input`, command palette, and `Shift+Q` (smart shapes); persisted in `globalSettings` + `localStorage`.

## iPad Safari dropped strokes: heal a missed touchstart on the first touchmove (2026-06-14)

iPadOS Safari intermittently drops `touchstart` (and `pointerdown`) on **fast Apple Pencil taps/recontacts** — the classic "alternate strokes go missing" symptom. Yappy already routed pen-drawing tools (`fineliner`/`inkbrush`/`marker`/`ink`) through TouchEvents (reliable on iPad) with a stale-stroke commit on the *next* `touchstart`. But that only recovers a stuck-open stroke; if the `touchstart` never fires, the whole stroke was lost because `handleTouchMove` bailed at `if (!touchDrivingPenStroke) return;`.

Fix (mirrors the `happypaint` project's `pointer-router.ts` heal-on-move): when a touchmove arrives with no open stroke, **begin the stroke from the stylus's current position** instead of discarding it. Extracted `beginTouchPenStroke(t)` so `handleTouchStart` and the heal path set up identically. Critical guards so the heal never starts a *phantom* stroke:
- skip if a gesture is active or cooling down (`gestureActive`/`gestureCooldown`),
- require a pen-drawing tool and `< 2` finger contacts,
- require a **real stylus** touch (`touchType === 'stylus'`) — deliberately NOT `pickStylusTouch`'s finger fallback, so a resting finger jiggling after a legitimate `touchend` can't re-open a stroke (the lifted Pencil sends no further moves; only non-stylus contacts could, and they're excluded).

Lesson: on iPad, treat the *down* event as best-effort. The reliable signal that a stroke exists is "a stylus is moving with the tip engaged" — so the first move must be able to open a stroke, not just extend one. Only the touch path needs this; adding a parallel pointer-path heal would race the touch heal (double-begin) since TouchEvents win for these tools. **Location**: `frontend/src/components/canvas.tsx` (`beginTouchPenStroke`, `handleTouchStart`, `handleTouchMove`).

## Format auto-detection: strict adapters first, heuristics last (2026-05-22)

`parseDSL` originally checked JSON → YSL → Mermaid → Text. `isYSLScript` was a heuristic — it scanned for any trimmed line starting with `let|const|fn|for|if|else|end|...`. That tripped on real Mermaid sequence diagrams which legitimately contain `end` (closing a `loop`/`alt`/`opt`). YSL then took ownership of the input and its lexer crashed on the first character it didn't recognise (e.g. a Unicode `→` inside an edge label), surfacing a confusing `[YSL lexer error]` for what is actually a valid Mermaid input.

Lesson: when dispatching by auto-detection, run **strict, header-anchored detectors before loose keyword heuristics**. The Mermaid adapter's `canParse` requires `sequenceDiagram`/`flowchart`/`classDiagram`/etc. as the first non-comment line, so it's both more reliable (no false positives on YSL) and more specific than a free-text keyword scan.

Related corollary: when a parser is consulted only because of detection, its error messages cannot be trusted as authoritative about the user's intent. If the detector is wrong, the lexer error is reporting on the wrong language. Always make sure the detector that picks the parser is the most discriminating one available.

## Two-Finger Pan + Pinch-Zoom on iPad Without Breaking Pen Drawing (2026-05-20)

Adding two-finger canvas pan/pinch on touch devices, on top of a codebase that already had carefully-tuned Apple Pencil palm rejection. The naïve implementation — just listen for `touches.length >= 2` — breaks two things on iPad: it pre-empts Pencil strokes when a palm rests, and it leaves a draft shape on the canvas if the first finger's synthetic `pointerdown` already started a draw before the second finger landed.

Design that worked, layered on top of the existing handlers:

- **Filter contacts by `touchType`, not raw count.** Apple Pencil contacts arrive as `touches[i]` with `touchType: 'stylus'`; finger contacts are `'direct'`. Counting `touches.length` mixes them and misfires the gesture when the user palm-rests while drawing. A `pickFingerTouches(e)` helper strips stylus contacts before deciding whether 2 fingers are on the canvas.
- **Touch listeners register BEFORE the pen-drawing touch listeners**, so the gesture handler observes 2-finger touchstarts first and can `preventDefault()` before the pen path starts a stroke. Order of `addEventListener` calls matters — the pen handler has an early-return on `pickFingerTouches(e).length >= 2`, but it still relies on the gesture handler being first to set `gestureActive`.
- **`gestureCooldown` flag for the "one finger still down" gap.** When the user ends a pinch by lifting one finger but leaves the other resting, that remaining finger's `touchend` (or its synthetic `pointermove`/`pointerup`) would otherwise be interpreted as a stroke. Cooldown blocks all single-touch interaction until `e.touches.length === 0`.
- **Hard-cancel in-flight pointer state, but only delete drafts from draws (not drags).** When the second finger lands ~50ms after the first, finger 1's synthetic `pointerdown` has already run `drawOnDown` and created a draft element via `addElement`. The gesture's `cancelInflightForGesture` removes that draft directly via `setStore("elements", arr => arr.filter(...))` — no `pushToHistory`, because the user never intended to draw. For `isDragging` (moving a pre-existing element), don't touch the element — just clear the flags, leaving the element wherever the brief drag took it.
- **Pinch math: anchor the previous centroid, not the current one.** Per frame: compute scale ratio from `currDist / prevDist`, apply zoom anchored on the *previous* centroid (so the world point under the centroid stays under it through the zoom step), then translate by `currCentroid - prevCentroid`. Anchoring on the current centroid produces drift because the centroid moves while the scale changes.
- **Block touch-derived pointer events during gestures, but let mouse/pen through.** `if ((gestureActive || gestureCooldown) && e.pointerType === 'touch') return;` at the top of pointer handlers. A user with a stylus + trackpad can still operate the canvas while a second person's fingers are on the screen — not common, but cheap correctness.

**Generalizable rule:** when adding a new input modality on top of an existing one, the new path needs (a) ownership semantics — who wins when both fire, (b) cancellation semantics — how to bail out of work the loser already started, and (c) a cooldown gap — what happens during the transition when neither modality is cleanly "in charge." Skipping any of those produces sporadic, hard-to-repro bugs.

## AI Drawing: Adding a Style Mode Without Forking the Prompt Tree (2026-05-13)

Wanted to add a "3D concept-diagram" style toggle to the AI drawing dialog. Three flows had to keep working: text → quick (single LLM call), text → deep (research agent → composer), and sketch → quick/deep (vision). The bad design would be a separate `build3DDeep…`, `build3DSketch…`, `build3DRocket…` for each combination, which fans out as more styles get added.

What worked: treat style as a **preamble** that prepends to whichever base prompt the flow already uses.

- `system-prompt.ts` exports a single `THREE_D_PREAMBLE` constant and a `build3DStyleSystemPrompt()` that returns `THREE_D_PREAMBLE + buildSystemPrompt()`. The preamble is self-contained: shape vocabulary override, pastel palette, color-by-role semantics, layout guidance, "required for 3D mode" checklist.
- Other prompt builders (`buildDeepDiagramSystemPrompt`, `buildVisionSystemPrompt`) take an opt-in `{ style3D: boolean }` and pick `build3DStyleSystemPrompt()` instead of `buildSystemPrompt()` as their base. The composer/vision preambles still stack on top.
- The "Available Shapes" block in `buildSystemPrompt()` itself was missing the 3D shapes (`isometricCube`, `solidBlock`, `perspectiveBlock`, `openBox`). Even without the style mode the LLM couldn't have emitted them. Added a `3D:` row with a one-liner per shape and the tunable `properties` keys (`depth`, `viewAngle`, `sideRatio`, `taper`, `openAmount`). This is a baseline improvement independent of the style mode.

**Generalizable rule:** if a feature needs to layer on top of *all* existing prompt variants (style modes, persona modes, domain modes), implement it as a string preamble + a boolean option on the existing builder functions — never as a parallel prompt tree. Adding the next style ("flat infographic", "hand-drawn") then costs one preamble constant and one extra branch in each builder, not N×M new functions.

**Trade-off the LLM still pays:** the preamble lives at the *top* of the system prompt where it has the most attention, but for compositional flows like deep mode the composer's "you are a composer" preamble ends up between the style and the DSL spec. In practice models follow the outer style instruction fine, but if a future style needs surgical instructions about specific shapes, those should be in the base DSL spec (Available Shapes block), not in the preamble.

**UI side:** the "3D Style" checkbox sits next to "Deep Mode" in the dialog. Rocket mode and 3D mode are mutually exclusive (Rocket has its own backend-export semantics that override styling), so the 3D checkbox is disabled and forced-false when Rocket is on. Disabled-and-falsified is better than just disabled — if the user toggles Rocket off later, they don't get a surprise 3D render they forgot was selected.

## Variable-Width Stroke Rendering: Single Polygon vs Per-Segment Quads (2026-05-07)

The ink brush built one closed polygon per stroke — left edge forward, right edge reversed, arcs at the caps — and filled it in one shot. With smoothed edges and `quadraticCurveTo` on both sides, that polygon could self-intersect on curvy or back-tracking strokes. The canvas default `nonzero` fill rule treats self-intersection regions with even winding count as "outside" — they don't fill. Result: small holes inside the new stroke at the crossing region. Where a hole landed over an earlier stroke, the canvas background bled through and the earlier stroke read as "erased / lightened" at the overlap.

Fineliner uses `stroke()` with `lineCap: 'round'` and is immune. Strokes are inherently a swept tube — there's no concept of "inside" to leave unfilled.

**Fix that worked: per-segment trapezoids + per-point joint circles, batched into one path with one fill.**
- Each trapezoid uses its own per-segment perpendicular (no cross-segment blending), so the four corners are always convex.
- Joint circles at every point are start/end caps and also fill the wedge gap whenever two adjacent trapezoids use different perpendiculars (i.e. at every turn).
- All subpaths wound the same way (CW). Under `nonzero`, multiple overlapping CW subpaths *sum* windings — every covered pixel stays opaque no matter how many strokes overlap it. No holes possible.
- Single `beginPath()` + many subpaths + single `fill()` keeps the per-frame fill count at 1 per stroke (not 1 per segment).

**Generalizable rule:** for variable-width swept paths on canvas 2D, prefer compositing convex subpaths via `fill()` over building one big closed polygon. The single-polygon approach is fragile in two ways — self-intersection holes from curvy strokes, and `arc()` cap directionality bugs when start/end angles are nearly equal — and both are eliminated by the per-segment + joint-circle approach.

**Sub-learning (v0.27.16 first pass): don't batch mixed primitives into one nonzero fill if their windings differ.** I tried to be clever: build all trapezoids and all joint circles as subpaths in a single `beginPath()`, then one `fill()`. It rendered as a beaded chain — discrete pearls with gaps between. Reason: the trapezoid corner ordering I used (`A-left → B-left → B-right → A-right`) is visually CCW on screen, but `arc(x, y, r, 0, 2π, false)` is visually CW (canvas default). Under nonzero, opposite-winding subpaths *cancel* where they overlap — so each joint circle erased the trapezoid stretch beneath it. The fix is either (a) match windings by passing `counterclockwise=true` to the arc, or (b) just use independent `beginPath() + fill()` per primitive and let `source-over` compose them. Option (b) is the more robust default — winding analysis is easy to get wrong, and the per-fill overhead is small for typical stroke sizes. Option (a) is a single-character change but only works as long as nothing else in the path adds a subpath with yet another winding.

## iPad / Apple Pencil Drawing on the Web: The Whole Saga (2026-05-06, v0.27.1 → v0.27.14)

Fourteen iterations to get pen-tool drawing right on iPad with Apple Pencil. Worth recording in one place because each mistake teaches something different about web events on iOS.

### Final architecture (what works)

For pen-drawing tools (fineliner / inkbrush / marker / ink) on iPad:

1. **TouchEvents drive the stroke**, not PointerEvents. `touchstart` / `touchmove` / `touchend` listeners attached on the canvas with `passive: false`. Apple's Pencil Safari API surfaces all pen data (`force`, `touchType: 'stylus'`, `altitudeAngle`, `azimuthAngle`) through TouchEvents — they're the first-class API. iPad Safari's PointerEvent delivery has quirks for Apple Pencil that TouchEvents don't have.
2. **Sync flush + sync draw** inside `touchmove`. No RAF chain. The compositor takes the canvas state at next vsync — same latency profile as a plain `<canvas>` demo.
3. **Pick the stylus** from `changedTouches` by `touchType === 'stylus'`. Track the identifier across the stroke so palm moves and palm lifts don't interfere.
4. **Self-heal on touchstart**. If a previous stroke is somehow stuck (a touchend that didn't carry our identifier, a thrown handler, anything), force-finalize before starting the new stroke. Don't trust state to be clean.
5. **PointerEvents continue to handle everything else** — selection, pan, shapes, text — and desktop mouse. Two event families coexist via a `touchDrivingPenStroke` flag that lets pointer handlers skip when touch is in flight.
6. **Coarse reactive cascade**. The canvas redraw effect tracks one signal (`store.dirtyRevision`) bumped by `updateElement` etc., not 80+ properties × N elements. O(1) instead of O(n × props) per mutation.
7. **`-webkit-touch-callout: none` and `-webkit-user-select: none` on `html, body`** to suppress iOS's native text-selection callout that fast Pencil writes can trigger.
8. **Suppress canvas contextmenu on touch/pen long-press** (`e.button === 2` filter) so palm rest doesn't pop the canvas context menu.

### Things I tried that didn't work, and why

| Attempt                                                                 | Why it failed                                                                                                                                                       |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Time-window palm rejection (700 ms)                                     | Blocked legitimate Apple Pencil pointerdowns iPad Safari occasionally ships as misclassified `touch` events.                                                          |
| Width-heuristic palm rejection (`width ≤ 5`)                            | Pencil events sometimes arrive with `width: 0` or no width info — heuristic missed them. The whole palm-rejection-via-pointertype layer turned out to be unnecessary because iPadOS's system-level palm rejection handles it when a Pencil is paired. |
| Replacing `JSON.parse(JSON.stringify(...))` history snapshot with shallow copy | Real performance win, but the alternate-stroke bug had multiple causes — fixing one didn't fix the symptom.                                                  |
| `try/catch` around `setPointerCapture`                                  | Real safety improvement (it can throw `InvalidStateError` on rapid lift+contact), but again only one piece.                                                          |
| Synthesizing `drawOnDown` from a pointermove with no active stroke      | Worked for the case where pointerdown was missed but pointermove still fired. Then started misfiring on Apple Pencil hover (`pressure: 0` events) — removed.        |
| `touch-action: none` on `html, body`                                    | Broke scrolling inside property panels and other scrollable UI. Keep it on the canvas only.                                                                          |
| Bailing out on `e.touches.length !== 1` in touchstart                   | Bailed when palm + pen were both on the screen — the exact case we needed to handle. Pick the stylus from the multi-touch list instead.                              |
| `findTouchById` gate on touchend                                        | iPad sometimes fires `touchend` whose `changedTouches` doesn't carry the tracked identifier. The gate silently dropped legitimate ends, leaving state stuck.         |

### Lessons

**TouchEvents > PointerEvents for Apple Pencil on iPad.** PointerEvents are the modern unified API and the right choice on desktop, but Apple's pen support is delivered through TouchEvents and they're more reliable for pen-specific interactions. The reference demo at https://github.com/shuding/apple-pencil-safari-api-test makes this obvious — it works perfectly on the same iPad where our PointerEvent path was failing.

**Don't over-defend.** Several of the bugs were caused by over-engineered defensive checks (palm rejection windows, identifier-matching gates, contact-area heuristics) that blocked legitimate input. iPadOS already does system-level palm rejection when a Pencil is paired. Trust it; only filter when you have evidence palm input is reaching you.

**Reactive stores need coarse change signals for high-frequency input.** Solid's per-property tracking is great for normal app state but expensive when an input source updates a property at 120 Hz. A single `dirtyRevision` counter that all mutations bump gives you the same redraw triggering at O(1) instead of O(n × props) per mutation.

**Sync over RAF for low-latency drawing.** The reference demo's secret is that it calls `drawOnCanvas` synchronously inside `touchmove`. RAF chains are great for batching, but each layer of `requestAnimationFrame` adds a frame of latency. For a pen tool where the user expects ink to appear under the tip, sync draw inside the event handler is the right pattern — provided the work fits inside a frame.

**Strict alternation is a state-stuck signature.** When 1, 3, 5 work and 2, 4 don't, it's not flaky input — it's a flag that gets set on every odd stroke and isn't reset before the next one. Look for the gate that's blocking the second touchstart, and add a self-heal so a stuck flag from any cause resolves itself instead of cascading.

**Hover events exist now.** Apple Pencil 2 / Pro fire `pointermove` with `pointerType: 'pen'` and `pressure: 0` when hovering near the screen. Anything that synthesizes drawing from "any pen pointermove" needs a `pressure > 0` guard or it will paint on hover.

---

## High-Frequency Input + Reactive Stores: Cap Mutations at the Display Refresh (2026-05-06, hotfix)

### What Went Wrong
A "smoothness fix" for Apple Pencil removed the throttle on store writes during a stroke and called `updateElement` on every `pointermove`. Apple Pencil's ~120 Hz event rate meant 120 Solid `setStore` calls per second, each cascading through every reactive subscriber on the canvas. The iPad's JS main thread saturated and started dropping `pointerdown` events between strokes — the user could write one letter, the next would silently fail, and the third would work again. Inkbrush rendered incomplete frames that looked like the stroke was being erased to white.

Desktop mouse was fine — mouse fires at ~60 Hz, so the store wasn't overwhelmed there.

### The Right Pattern
For high-frequency input feeding into a reactive store, **the store mutation rate should be capped at the display refresh rate, not the input rate**:

```js
// On every pointermove: just append to a plain JS buffer (cheap).
buffer.push(...coalescedPoints);

// Schedule at most one store flush per animation frame.
if (!flushPending) {
    flushPending = true;
    requestAnimationFrame(() => {
        flushPending = false;
        store.update({ points: existing.concat(buffer) });
        buffer.length = 0;
    });
}
```

Two important properties of this shape:
- **No input resolution is lost.** `getCoalescedEvents()` still surfaces every Pencil sample between frames; they all go into the buffer.
- **No extra latency.** The flush hits the *next* vsync; there's no wall-clock branch that can leave a sample waiting an extra frame for a 16 ms window to elapse.

### Don't Pair RAF with a Wall-Clock Throttle
The pre-regression code had `if (elapsed >= 16ms) flushSync(); else if (!pending) RAF(flush);`. The wall-clock branch was the worse of two worlds: it caused sample latency to depend on the timing relationship between input arrival and the last sync flush, and it didn't reduce mutation rate beyond what RAF alone gives you. RAF alone is enough.

### General Rule
Whenever you find yourself writing to a reactive store from an event handler that can fire faster than the display refresh — pointer, scroll, resize, mouse-wheel-deltas — coalesce in a plain buffer and flush from `requestAnimationFrame`. If the store has a fine-grained reconcile (Solid, MobX), the wasted cycles are still real because subscribers re-run.

---

## iPad / Apple Pencil: Palm Rejection and Smoothness (2026-05-06)

### The Problem
On iPad with Apple Pencil, two distinct issues showed up: a resting palm popped open the canvas context menu or a tool's property panel, and Apple Pencil strokes felt visibly laggy and jittery despite the codebase already collecting coalesced events.

### Three Things to Get Right
1. **Filter `contextmenu` to `e.button === 2`.** iOS Safari synthesizes a `contextmenu` MouseEvent on every long-press — palm rest, finger long-hold, or stylus long-hold. The synthesized event has `button === 0`; only a real desktop right-click reports `button === 2`. Without that one check, every long contact opens menus you never wanted to open. This applies to both the canvas surface and every toolbar button that uses right-click as a shortcut to open the property panel.
2. **Track `pointerType` and ignore `'touch'` events while a `'pen'` is in flight.** Browsers expose `e.pointerType` on every pointer event. The canonical palm-rejection trick is: record `lastPenInputAt` on every pen event, and reject touch events while a pen is active or was used in the last ~700ms. Apple Pencil's palm contact arrives as `pointerType: 'touch'`; the pencil tip arrives as `pointerType: 'pen'`. Filtering on this single attribute eliminates almost all palm interference without any device sniffing.
3. **Coalesced events + no extra throttle.** `getCoalescedEvents()` already surfaces every Apple Pencil sample (~120Hz) captured between RAF frames, so you keep full input resolution by buffering them. But adding a wall-clock throttle on top of a RAF-scheduled draw can leave a sample sitting one full frame longer than necessary — exactly the kind of "feels off" lag users notice with a stylus. Let RAF be the only batcher; flush the buffer to the store on every pointermove.

### Key Insight
The right primitive for input differentiation is `e.pointerType`, not user-agent sniffing or feature flags. Once you commit to it, palm rejection becomes a 700ms window check in three handlers, and the rest of the app stays oblivious to whether the user has a Pencil, a finger, or a mouse. Also: any handler that opens UI on `contextmenu` must filter `e.button === 2`, otherwise iOS will fire it from every long-press and quietly trash the experience.

### CSS that Helps
On the drawing surface, set `touch-action: none` (which the canvas already had), `user-select: none`, plus the WebKit-prefixed `-webkit-user-select: none` and `-webkit-touch-callout: none`. The last one suppresses iOS's own copy/look-up callout that otherwise interrupts long strokes.

---

## Theme Should Invert at Render Time, Not Mutate Stored Colors (2026-05-03)

### The Problem
The previous `dark` theme only re-skinned UI chrome; the canvas stayed white. A real dark drawing surface only existed in `focus` mode, and even there a light-mode drawing's black strokes were invisible on the dark canvas. The "fix" had been to flip the *default* stroke color to white when entering focus mode — which made new shapes visible but left existing shapes broken, and polluted persisted defaults so users would unexpectedly draw white-on-white if they later switched themes.

### The Solution
Adopt Excalidraw's model: treat stored colors as **theme-canonical** (light-mode), and apply a CSS `invert(93%) hue-rotate(180deg)` filter on the host `<canvas>` element when the resolved theme is `dark` or `focus`. Black strokes render near-white; colored shapes hue-rotate to perceptual dark equivalents; user-chosen backgrounds invert too — all without mutating a single stored value. A scene round-tripped through a theme switch is byte-identical.

Also separated the user's *choice* (`store.theme`: `light | dark | focus | system`) from the *resolved* theme that drives rendering (`store.resolvedTheme`: `light | dark | focus`). A `matchMedia('(prefers-color-scheme: dark)')` listener at app boot re-resolves live whenever the OS flips and the user's choice is `system`.

### Key Insight
Once you accept "stored data is canonical, presentation is a transform," the implementation collapses dramatically. The earlier code had: a stroke-flip in `setTheme`, a per-tool stroke-cache flush, a focus-mode canvas-bg swap with reverse logic, and a per-render dark-canvas branch — all gone, replaced by one CSS filter line plus a small resolver. The catch is that the inversion is global to the canvas, so embedded raster images get inverted too; either pre-invert them on draw (cancels the host filter) or document the limitation. Don't try to "fix" inversion bugs by mutating defaults — that always loses information.

## Per-Slide Settings Must Live on the Slide, Not the Store (2026-04-11)

### The Problem
`canvasTexture` lived only as a global field on the `AppState` store. A "Canvas Texture" dropdown appeared in the canvas property panel, implying it was per-canvas, but the value was never written to the active slide, never restored on slide switch, and never serialized into the v4 document. Reloading the file — or even just flipping slides — silently reset it to `'none'`, making the setting appear broken.

### The Solution
Mirror the `backgroundColor` flow: add `canvasTexture?` to the `Slide` interface, then teach the store to treat it as a live projection of the active slide:
1. `setCanvasTexture` writes to both `store.canvasTexture` and `store.slides[active].canvasTexture` (plus `bumpDirtyRevision`).
2. `saveActiveSlide` includes `canvasTexture` in the snapshot.
3. `setActiveSlide` hydrates `store.canvasTexture` from the incoming slide (falling back to `'none'`).
4. `loadDocument` applies `slides[0].canvasTexture` after migration.

Also added a new `'notebook'` texture (faint blue ruled horizontal lines), rendered in `renderCanvasTexture` alongside `dots`/`grid`/`graph` so it benefits from the same pan/zoom math. No vertical margin rule — in infinite-canvas mode there's no natural anchor for it, and a fixed screen-space vertical line would drift arbitrarily with the pan.

### Key Insight
"Per-canvas" in the UI has to mean "per-slide on disk". A store field that is only mutated from a property panel but never round-tripped through save/load/switch will feel broken the first time the user reloads — and the bug is invisible in a single-slide session. When adding a setting that's scoped to a slide, audit **all four** touchpoints: setter, `saveActiveSlide`, `setActiveSlide`, and `loadDocument`. If any one is missing, the setting is effectively transient.

## containerText and verticalAlign Must Be Treated Separately from Text Elements (2026-03-25)

### The Problem
`containerText` (labels inside shapes) shared the `verticalAlign` property with standalone text elements, but the rendering path in `render-pipeline.ts` never read it — it hardcoded vertical centering. Meanwhile `text-renderer.ts` fully implemented `verticalAlign` for standalone text. This created a confusing inconsistency where the property existed but did nothing for shape labels.

### The Solution
Added the same top/middle/bottom vertical alignment logic to both `renderText()` and `renderRichText()` in the render pipeline. This also unblocked the new `arrowAnchorAlign` property — shapes can now position text at the top while arrows connect at a different vertical position.

### Key Insight
When the same property (`verticalAlign`) is defined on a type but rendered through multiple code paths, each path must handle it. Properties that silently do nothing are worse than missing properties — they mislead users into thinking the feature is broken rather than unimplemented.

## Path Traversal: Always Append a Separator to Directory Prefixes (2026-03-18)

### The Problem
Validating file paths with `filePath.startsWith(DATA_DIR)` is insufficient when `DATA_DIR` doesn't end with a path separator. A path like `/app/data2/secrets` passes a check against `/app/data` because the string prefix matches, even though the file is in a sibling directory.

### The Solution
Always compare against `DATA_DIR + path.sep` (e.g. `/app/data/`). This ensures the path must traverse *into* the target directory, not merely share a common prefix.

### Key Insight
This is a common security pitfall in Node.js file-serving code. `path.join()` normalizes `..` components, but the resulting path can still escape the intended directory if the prefix check doesn't account for directory boundaries. The fix is trivially simple but easy to overlook.

## History Snapshots Must Match the Scope of Undoable Operations (2026-03-18)

### The Problem
Undo/redo snapshots only included `elements` and `layers`, but `pushToHistory()` was called before slide operations (add, delete, reorder) and state operations. Undoing these operations restored elements but not the slides array, leaving the document in an inconsistent state.

### The Solution
Expand the snapshot to include every field that any undoable operation can mutate: `slides`, `states`, `gridSettings`, `canvasBackgroundColor`, `docType`. Extract `captureSnapshot()` and `restoreSnapshot()` helpers to avoid code duplication across `pushToHistory`, `undo`, and `redo`.

### Key Insight
When adding new undoable state to an application, always audit the snapshot scope. If a `pushToHistory()` call precedes a mutation, the snapshot must capture whatever that mutation will change. A mismatch means undo "works" but produces a Frankenstein state that's worse than no undo at all.

## Autosave Dirty Detection Must Cover All Mutation Paths (2026-03-18)

### The Problem
Autosave watched reactive signals (`elements.length`, `slides.length`, etc.) to detect changes. But mutations like `updateSlideTransition` or `addDisplayState` modify properties in-place or change arrays not in the watch list, so they were invisible to autosave.

### The Solution
Added a `dirtyRevision` monotonic counter to the store. Mutations that don't otherwise trigger the watched signals call `bumpDirtyRevision()`. The autosave watcher includes `dirtyRevision` in its signal list.

### Key Insight
In SolidJS, reactive watchers only fire when tracked signals change. Array-length tracking misses in-place property mutations. A revision counter is a lightweight escape hatch: it's cheap to increment, cheap to compare, and works with any reactive framework's change detection.

## Pre-layout Auto-Sizing: Measure Text Before Positioning (2026-03-17)

### The Problem
AI-generated diagrams had nodes with fixed default sizes (e.g., 150x80) regardless of label length. Long labels overflowed their containers, and the layout engine spaced nodes based on these undersized defaults, causing overlaps.

### The Solution
Add a **pre-layout pass** (`applyAutoSizing`) that runs before `computeLayout()`:
1. Walk the DSLNode tree (including children for mindmaps)
2. For nodes without explicit width/height, use `fitShapeToText()` with `getMeasurementRenderer()` (offscreen canvas singleton) to compute text-fitted dimensions
3. Stamp the computed sizes directly on the DSLNode objects
4. Layout engine then uses these correct sizes for spacing

### Key Insight
The sizing must happen **before** the layout engine, not after rendering. If you resize nodes after layout, they'll overlap because the layout already allocated space based on default sizes. By mutating `node.width`/`node.height` on the DSLNode IR before layout runs, all downstream consumers (layout strategies, pool layout, renderNode) automatically use correct dimensions.

### Architectural Note
`fitShapeToText()` and `getMeasurementRenderer()` already existed in `text-utils.ts` for interactive auto-resize on text editing. Reusing them for DSL rendering avoided duplicating text measurement logic. The offscreen canvas singleton avoids DOM overhead.

## Extending an Agentic Pipeline: Vision as a New Stage 1 (2026-03-17)

### The Pattern
When a 2-stage agentic pipeline already exists for text input (Research → Composer), extending it to image input requires only a **new Stage 1** — Stage 2 can be reused unchanged, because both stages communicate through the same intermediate JSON schema.

### How It Worked
- Text Deep Mode: `DRAWING_RESEARCH_PROMPT` (text analysis) → research JSON → `buildDeepDiagramSystemPrompt()` (composer)
- Image Deep Mode: `VISION_RESEARCH_PROMPT` (image analysis) → **same** research JSON → **same** composer

### Key Design Decision
The vision research prompt focuses on image-specific tasks (OCR, color extraction, spatial analysis, shape recognition) but outputs the identical JSON schema as the text research prompt. This means the diagram composer doesn't know or care whether the research came from text analysis or image analysis — it just maps components to shapes.

### Practical Benefit
Adding image deep mode required: 1 new system prompt, 1 new user prompt builder, 1 new pipeline function, and a UI toggle change. Zero changes to the composer, DSL parser, layout engine, or renderer.

## Agentic 2-Stage Pipeline for Richer AI Output (2026-03-06)

### The Pattern
When a single LLM call produces shallow output (e.g., a diagram with only 5-15 generic nodes), splitting into a 2-stage agentic pipeline dramatically improves quality:
- **Stage 1 (Research/Content Agent):** Focused purely on understanding the topic — outputs structured JSON with deep component breakdowns, data flows, and annotations. Higher temperature (0.5) for creative exploration.
- **Stage 2 (Visual/Composer Agent):** Focused purely on mapping research to visual output — outputs valid DSL/JSON. Lower temperature (0.3) for precision.

### Key Design Decisions
- Each stage gets its own dedicated system prompt file for maintainability.
- Research output is validated as parseable JSON before passing to Stage 2.
- Token usage is accumulated across both stages for accurate reporting.
- The `onProgress` callback provides real-time stage feedback to the UI.
- Both modes (quick/deep) share the same post-LLM pipeline (`processLLMResponse`) — only the pre-pipeline differs.
- This pattern mirrors the existing AI Presentation deep mode (`slide-generator.ts`) which uses Content Agent → Visual Agent.

## Presentation Mode Hit-Testing and Locked Elements (2026-03-05)

### The Problem
Clicking on slide content in presentation mode selected elements instead of advancing the slide.

### Key Insight
The `presentationOnDown` handler has a hit-test loop that checks if the click landed on an element. For special types (openBox, DS elements), it handles the click directly. For all others, it returns `false` to let `selectionOnDown` handle select/move. But in presentation mode, locked elements (which are the majority of slide content) should be transparent to clicks — the user intent is to advance the slide, not interact with a locked shape.

### Fix Pattern
Check `el.locked` after special-type handling but before the `return false` fallthrough. Use `break` (not `continue`) to exit the loop entirely, allowing the code to reach the `advancePresentation()` call. This preserves interactivity for unlocked elements (annotations drawn during presentation) while making locked content click-through.

## JavaScript Negative Modulo in Animation (2026-03-02)

### The Problem
Flow animation reverse direction rendered as a solid dark line instead of animated dashes moving backwards.

### Key Insight
JavaScript's `%` operator preserves the sign of the dividend: `(-5) % 100 === -5`, not `95`. When computing animated dash positions with a negative offset (reversed direction), the modulo check `(d + offset) % gap < threshold` becomes `negative < positive_threshold`, which is always true — drawing every single pulse and producing a solid line.

### Fix Pattern
Use the double-modulo idiom for positive results: `((x % n) + n) % n`. This is a common pitfall in any animation, wrapping, or periodic calculation where the input can go negative.

## SolidJS Reactivity and CPU — Animation Engine Signals (2026-03-02)

### The Problem
Idle canvas consumed high CPU despite no user interaction, no flow animations, and no presentation mode.

### Key Insight
The animation engine's rAF loop had `this.animations.size > 0` in its continuation condition, so paused or idle animations that hadn't been explicitly `stop()`-ed kept the loop alive. Every tick unconditionally wrote to SolidJS signals (`setGlobalTime`, `setEffectiveTime`), which triggered the main canvas `createEffect` (tracking `effectiveTime()`) to schedule a full-scene redraw at 60fps — even with nothing visually changing.

### Lessons
1. **SolidJS signal writes are never free** — even if the value doesn't change conceptually, calling a setter like `setEffectiveTime(t => t + delta)` always triggers subscribers.
2. **Guard signal updates** behind a `shouldUpdate` check: only write when there are running animations or the forceTicker is on.
3. **rAF loop conditions** should distinguish between "animations exist" and "animations are running" — paused/idle entries in a Map shouldn't keep the loop alive.
4. **Always-on intervals** (like a 500ms `setInterval` for ink cleanup) should be demand-based: start when needed, stop when work is done.
5. **Store write coalescing** — high-frequency store writes (cursor position at 60+/sec) should be batched via `requestAnimationFrame` to limit downstream reactive effects to once per frame.

## Slide Viewport — Fullscreen Exit Race Condition (2026-03-01)

### The Problem
Exiting presentation mode left slides invisible because `appMode` switches to `'design'` synchronously inside `togglePresentationMode()`, but `document.exitFullscreen()` fires asynchronously. By the time the `fullscreenchange` event triggers `handleResize`, the app is already in design mode — and the resize handler only called `zoomToFitSlide()` for presentation mode.

### Key Insight
Viewport re-fitting after fullscreen exit should be based on the **document type** (`store.docType === 'slides'`), not the **app mode** (`store.appMode === 'presentation'`). Slides need to be re-centered regardless of whether the user is presenting or designing.

### Secondary Issue
`setActiveSlide()` had an early-return guard (`index === store.activeSlideIndex`) that prevented re-centering when clicking the already-active slide. Adding a `zoomToFitSlide()` call before the return gives users a way to snap back to a drifted slide.

### Key Files
- `frontend/src/components/canvas.tsx` — `handleResize` now zooms for all slide docs
- `frontend/src/store/app-store.ts` — `setActiveSlide` re-centers on same-slide click

## Branding Refresh — SVG Logo Pipeline (2026-03-01)

### Clean Logo Design
Replaced complex multi-element logos (pencil, canvas, shapes, sparkles, lettermark) with a minimal "YD" monogram on a blue-to-indigo linear gradient rounded rect. Same design across favicon (32px), logo.svg (512px), and logo.png (512px rasterized).

### SVG-to-PNG Conversion
ImageMagick `convert` doesn't render SVG gradients or text correctly (produces black backgrounds, missing glyphs). Inkscape CLI (`--export-type=png`) works but requires careful flag selection depending on version. Headless Chrome (`google-chrome --headless --hide-scrollbars --screenshot`) produces the most accurate renders but needs an HTML wrapper to avoid scrollbar artifacts. Best approach: wrap SVG in a minimal HTML page with `overflow:hidden`, then screenshot at target dimensions.

### Key Files
- `frontend/public/favicon.svg` — 32x32 browser tab icon
- `frontend/public/logo.svg` — 512x512 vector logo
- `frontend/public/logo.png` — 512x512 rasterized logo

## Video Element — Two-Layer Canvas Approach (2026-02-28)

### Canvas Can't Play Video Natively
HTML5 Canvas has no built-in video playback capability. We solved this with a two-layer approach:
1. **Design mode**: Render poster/thumbnail as an image on the canvas with a play button overlay (via `VideoRenderer`). The poster is fetched from YouTube thumbnails (`img.youtube.com/vi/{ID}/hqdefault.jpg`), Vimeo oEmbed API, or captured from direct video's first frame.
2. **Playback mode**: Overlay a positioned HTML `<video>` or `<iframe>` element on top of the canvas at the element's screen coordinates. YouTube/Vimeo use iframes; direct MP4/WebM use the `<video>` tag with native controls.

### Provider Detection Pattern
URL parsing with regex (`YOUTUBE_REGEX`, `VIMEO_REGEX`, `DIRECT_VIDEO_REGEX`) to auto-detect provider. The `videoProvider` field on `DrawingElement` branches rendering logic: direct → `<video>`, youtube/vimeo → `<iframe>` with embed URLs.

### Image Cache Reuse
The existing `getImage()` from `image-cache.ts` works perfectly for caching poster thumbnails. Calling `getImage(posterURL)` triggers async loading and caches the result, with automatic redraw on load via the existing `onImageLoadCallback`.

### Key Files
- `utils/video-utils.ts` — URL parsing, provider detection, poster fetching
- `shapes/renderers/video-renderer.ts` — Canvas rendering (poster + play button)
- `components/video-overlay.tsx` — HTML overlay for playback
- `components/video-url-dialog.tsx` — URL input modal

## Agentic Slide Generation, Token Usage & UX Polish (2026-02-28)

### 2-Stage Agentic Pipeline (Deep Mode)
Splitting AI slide generation into two LLM calls — Content Agent (temperature 0.7, high token budget) and Visual Agent (temperature 0.3, lower budget) — produces significantly richer content. The Content Agent focuses purely on research, narrative arc, and substantive data. The Visual Agent maps `intent` fields (stats, comparison, roadmap) to `slideType` values. A heuristic fallback (`heuristicVisualMapping()`) catches Stage 2 failures without losing Stage 1 content.

### Token Usage Propagation Pattern
`LLMResponse.usage` was already collected by all 3 providers but stripped before reaching the UI. To surface it: add `usage?: TokenUsage` to the result types (`GeneratePresResult`, `GenerateResult`), pass `llmResponse.usage` through the processing pipeline, and accumulate across multiple LLM calls in deep mode (`totalUsage.promptTokens += response.usage?.promptTokens || 0`).

### Element Factory strokeWidth Must Match strokeColor
Setting `strokeColor` without a corresponding `strokeWidth > 0` produces invisible strokes. The fix: element factory helpers should derive `strokeWidth` from whether a non-transparent `strokeColor` was provided (`stroke !== 'transparent' ? 1 : 0`).

### Module-Level Signals for Cross-Component Dialog Control
The unsaved changes dialog needed to be triggered from exported functions (`handleNew`, `handleTemplateSelect`) that run outside the component's render scope. Solution: declare `createSignal` at module level (`isUnsavedDialogOpen`) with a `pendingUnsavedAction` callback variable. The exported function sets the pending action and opens the dialog; the dialog's handlers execute/discard the pending action.

### Global CSS Specificity Overrides Component Styles
A global `button:hover { background-color: var(--btn-hover) }` in `index.css` overrode component-specific button hover styles (e.g., the blue save button turned white on hover). Fix: explicitly re-declare `background` on component-specific `:hover` and `:active` pseudo-classes.

## AI Presentation Generator, Template Library & Markdown Import (2026-02-28)

### Slide Element Factory Pattern
Created a shared `slide-element-factory.ts` that all three features (templates, AI generator, markdown import) use for consistent element positioning within 1920×1080 slides. Functions like `createTitleSlideElements()`, `createContentSlideElements()`, etc. return `Partial<DrawingElement>[]` with coordinates relative to slide origin (0,0). The `offsetElements()` helper then shifts them to absolute spatial positions (slides spaced 2000px apart). This avoids duplicating layout logic across features.

### PresentationTemplate vs Template Type
`PresentationTemplate` extends the template system with a `slides[]` array of `PresentationSlideTemplate` objects, each containing `elements: Partial<DrawingElement>[]`. To register these in the existing `TemplateRegistry` (which expects `Template`), we cast via `as unknown as Template`. The `isPresentationTemplate()` guard (`t.slides?.length > 0`) detects them at runtime for special handling in the template browser and menu.

### loadPresentationTemplate → loadDocument Pipeline
Rather than building a parallel loading path, `loadPresentationTemplate()` constructs a v4 `SlideDocument` (via `createSlideDocument()`) and delegates to the existing `loadDocument()`. This ensures all document initialization logic (view state, slide navigator, theme application) runs consistently.

### AI Slide Generation JSON Parsing
LLMs sometimes wrap JSON in markdown code fences. The slide generator strips ```` ```json ``` ```` before `JSON.parse()`. The system prompt explicitly says "Return ONLY a JSON object (no markdown fences)" but a fallback strip is still necessary for reliability.

### Markdown → Slides Detection
`isMarkdownSlideContent()` checks for `^#{1,3}\s+` headings or `^---+\s*$` horizontal rules. When detected in the DSL import dialog, it bypasses DSL parsing entirely and routes to `parseMarkdownToSlides()`. The format badge changes to "Markdown → Slides" and the import button changes to "Import Slides".

## SolidJS `untrack()` for Non-Reactive Signal Reads Inside Effects (2026-02-24)

- **Signal reads inside `createEffect` are automatically tracked as dependencies**: If a cleanup/reset function reads a signal (e.g., `sketchPreview()` to revoke an object URL), calling that function inside `createEffect` makes the signal a dependency. Any future update to that signal re-triggers the effect.
- **Symptom**: Uploading a sketch image immediately cleared it. `clearSketch()` read `sketchPreview()` to revoke the old URL. When called inside the effect's "reset on open" block, SolidJS tracked `sketchPreview` as a dependency. When the user uploaded an image and `setSketchPreview(url)` fired, the effect re-ran and called `clearSketch()` again, nuking the just-uploaded image.
- **Fix**: Wrap the call in `untrack(() => clearSketch())`. `untrack()` executes its callback without tracking any signal reads, preventing unintended reactive subscriptions.
- **Rule of thumb**: Any signal read inside `createEffect` that's purely for side-effect cleanup (not for driving reactivity) should be wrapped in `untrack()`.

**Location**: `src/components/ai-prompt-dialog.tsx`

## Vision API Multi-Part Content Is Provider-Specific (2026-02-24)

All three LLM providers (OpenAI, Gemini, Anthropic) support vision/image input, but the request format differs significantly:
- **OpenAI**: User content becomes an array of `{ type: 'image_url', image_url: { url: 'data:...;base64,...' } }` and `{ type: 'text', text: '...' }` parts
- **Gemini**: Parts array with `{ inlineData: { mimeType, data } }` objects alongside `{ text: '...' }` parts
- **Anthropic**: Content array with `{ type: 'image', source: { type: 'base64', media_type, data } }` and `{ type: 'text', text: '...' }` parts

Making the `images` field optional on `LLMRequest` keeps full backward compatibility — existing text-only callers need zero changes.

**Location**: `src/ai/ai-providers.ts`

### Image Preprocessing for Vision APIs

Vision APIs benefit from images around 2048px max dimension. Larger images increase token cost without much accuracy gain. JPEG at 0.85 quality balances detail vs. payload size. Use offscreen canvas + `toDataURL()` for resize/compress. If the result exceeds 4MB (Anthropic's limit), retry at 1024px.

**Location**: `src/ai/image-utils.ts`

## Auto-Save Skip Logic Must Account for Document Type (2026-02-24)

- **Element count alone is not sufficient to determine if a document is "empty"**: A slides-mode document can have zero drawn elements but still have meaningful slide structure (backgrounds, transitions, ordering). The auto-save skip check `if (elementCount === 0) return false` prevented valid slide documents from being restored, leaving the app in its initial `docType: 'infinite'` state.
- **Store metadata for quick pre-filter decisions**: Adding `docType` and `slideCount` to the auto-save metadata allows the restore function to make informed skip/load decisions without parsing the full document JSON. Always include enough context in meta to support correct filtering.
- **Normalize slide order on load**: The `order` property on slides can drift from array indices across saves if any code path doesn't re-index after mutation. Normalizing `slide.order = i` during `loadDocument` prevents order drift.

## Canvas-Level Scale for Text Zoom Animations (2026-02-24)

- **Width/height animations don't visually scale text elements**: Unlike shapes whose geometry is defined by width/height, text elements render at a fixed `fontSize` and wrap within the bounding box. Animating width/height on text just changes the wrapping area, not the visual size of the text. Zoom animations need a different approach for text.
- **Use canvas `ctx.scale()` for true visual scaling**: Adding a `renderScale` property that applies `ctx.scale(rs, rs)` in the render pipeline (alongside rotation and flip transforms) creates a proper visual zoom that scales everything — text, strokes, fills — uniformly around the element center. This is the correct primitive for zoom effects on any element type where width/height don't control visual scale.
- **Ensure animatable properties have defined start values**: The `animateElement` function treats `undefined` start values as "immediate apply" rather than animating them. When introducing a new animatable property (like `renderScale`), ensure it has a numeric value before starting the animation — set it explicitly with `updateElement` if the element doesn't have it yet.

## Text Animations vs Rich Text Rendering — Dual Property Conflict (2026-02-23)

- **Renderers that check multiple text properties create hidden conflicts for animations**: When a text renderer checks `richText` first (array of formatted spans) and falls back to `text` (plain string), any code that only updates `text` will be invisible if `richText` exists. This created a category of bugs where text animations appeared to do nothing — they were updating `text` every frame, but the renderer always used the stale `richText`.
- **Guard clauses in store update functions must cover all affected element types**: The `updateElement` guard that auto-cleared `richText` when updating `text` only applied to `type === 'richtext'` elements, but `type === 'text'` elements also accumulated `richText` spans from editing. When adding guards, audit all element types that could have the property — not just the obvious one.
- **Animation functions that modify text should temporarily suppress rich text**: The clean pattern is: save original rich text at animation start, clear `richText` (forcing the renderer to use the plain `text` path), and restore rich text on `onComplete`. This preserves formatting while allowing character-level animation.

## SolidJS Reactive Dependencies — Canvas Redraw Must Track All Rendering Inputs (2026-02-23)

- **Every store property used in `draw()` must appear in the `createEffect` dependency list**: SolidJS reactive effects only re-run when tracked signals/properties change. If `draw()` uses `store.activeSlideIndex` for element filtering, but the `createEffect` doesn't access it, slide switches won't trigger redraws. Audit the dependency list whenever adding new store properties to the rendering pipeline.
- **Deep-copied objects carry stale viewport state**: When duplicating slides with `JSON.parse(JSON.stringify(source))`, properties like `lastViewState` (containing `panX`/`panY`/`scale`) point to the source's spatial position, not the duplicate's. Always clear position-dependent cached state when creating copies at new locations.

## Vite envDir Must Match .env File Location (2026-02-23)

- **Vite's `root` option changes where `.env` files are loaded from**: When `root: 'frontend'` is set in `vite.config.ts`, Vite looks for `.env*` files inside `frontend/`, not the project root. If `.env.local` lives at the project root (common in monorepos), add `envDir: '..'` to point Vite back to the correct directory. Symptoms: all `import.meta.env.VITE_*` values are `undefined` at runtime.

## SolidJS Modal Overlay — Event Delegation vs stopPropagation (2026-02-23)

- **SolidJS event delegation breaks `stopPropagation` for overlay dismiss**: SolidJS delegates `onClick` handlers to the `document` root, not the actual DOM elements. While the framework simulates bubbling by walking the DOM tree and checking `cancelBubble`, this can behave unreliably — especially during text selection interactions in textareas. Never rely solely on `e.stopPropagation()` on a child element to prevent a parent's delegated handler from firing.
- **Always use `e.target === e.currentTarget` on overlay click handlers**: The standard pattern for "click outside to close" modals is to check `e.target === e.currentTarget` on the overlay div. This ensures the handler only fires when the user clicks directly on the backdrop, not from bubbled child events. This works regardless of event delegation strategy.
- **Text selection drag can bypass modal boundaries**: When a user clicks inside a textarea and drags to select text, if the mouse exits the modal boundary, the resulting `click` event fires on the nearest common ancestor of the `mousedown`/`mouseup` targets — which is the overlay. This completely bypasses any `stopPropagation` on the modal div because the click never bubbles through the modal.
- **`e.target === e.currentTarget` alone is insufficient on Windows/Chrome**: On Windows/Chrome, when drag-selecting text and the mouse drifts slightly outside the dialog content onto the overlay, the `mouseup` fires on the overlay and the resulting `click` event has `e.target` set to the overlay itself — so the target guard passes and the dialog closes. This does not happen on Linux/Edge due to different pointer event handling. The robust fix is to also check `!window.getSelection()?.toString()` — if any text is selected, the overlay click is a text selection drag, not an intentional close.
- **Apply defensive patterns to ALL modal dialogs, not just the reported ones**: When a bug pattern exists in one dialog, audit all dialogs for the same pattern. In this case, all 11 modal dialogs in the app shared the same vulnerable overlay dismiss code. On the second pass, 4 additional dialogs were found to be missing the fix entirely (text-editor-modal, rocket-settings-dialog, command-palette, menu backdrop).

## Rocket Backend Integration — AI + Export + Deploy Pipeline (2026-02-22)

- **Separate system prompt addendums for domain modes**: Rather than one bloated system prompt, compose prompts from a base `buildSystemPrompt()` plus mode-specific addendums (e.g., `ROCKET_ADDENDUM`). This keeps the default prompt small (~2-3K tokens) while allowing specialized modes to add domain-specific DSL syntax, entity field conventions, state diagram patterns, and BPMN containerText conventions.
- **Increase maxTokens for domain-specific generation**: Rocket mode generates entities + state diagrams + BPMN workflows in a single response, which needs significantly more output tokens (8192 vs 4096 default). Match maxTokens to the expected output complexity of the mode.
- **Shape aliases bridge AI naming to internal types**: LLMs naturally generate kebab-case names like `state-start`, but the renderer expects `stateStart`. A simple alias map in `shape-aliases.ts` transparently bridges this gap without modifying the parser or renderer.
- **Feature flags must gate ALL UI surfaces**: When adding a feature behind an env flag, audit every component that references the feature — not just the primary dialog. The Rocket checkbox in the AI dialog and the settings dialog in menu.tsx were initially missed because they were added in a separate feature from the export dialog.
- **Base64 obfuscation pattern for credentials**: Reuse the same `btoa()`/`atob()` localStorage pattern for any credentials (API keys, passwords). It's not encryption but prevents casual exposure in devtools. The pattern from `ai-settings.ts` was directly reusable for `rocket-settings.ts`.
- **Login → ensure app → import schema**: The 3-step Rocket deploy flow (authenticate, create app if missing, push schema) maps cleanly to separate API client functions. Each step can fail independently with a clear error message, making the deploy flow debuggable.

## Monorepo Reorganization — Frontend/Backend Split (2026-02-22)

- **Move frontend into subdirectory without breaking imports**: When reorganizing from flat to `frontend/` + `backend/` structure, all relative imports within the frontend continue to work because they're relative to each other. Only build config (`vite.config.ts`, `tsconfig.json`) and CI paths need updating.

## Z-Index Management in Complex UIs (2026-02-22)

- **Document the z-index stack**: With multiple overlapping layers (canvas, toolbars, quick-toolbar, presentation controls, toasts, modals), z-index conflicts are inevitable. Maintain a mental or documented hierarchy: canvas (0-1000) < status bar (100) < toolbars (10000-10002) < toasts (10010) < modals (2000+). When adding new layers, check the stack.
- **Toasts must be above ALL interactive UI**: Toast messages are transient notifications that users need to see immediately. If they render behind toolbars or controls, users miss critical feedback (like "layer locked"). Always place toasts at the top of the z-index stack, above toolbars and presentation controls.

## UML Compartmented Shapes — Scrollable Sections with Draggable Dividers (2026-02-22)

- **Sections as first-class data**: UML class/enum/interface shapes store `sections[]` with typed entries (attributes, methods). This makes export to structured formats (Rocket entities, JSON schema) straightforward — no text parsing needed.
- **Draggable dividers require hit-test integration**: Section dividers are interactive elements within a shape. They need their own hit-test logic and cursor feedback, separate from the shape's bounding-box selection.
- **Scrollable overflow within fixed shapes**: When section content exceeds the allocated height, add per-section scroll offset and clip rendering to the section bounds. This prevents content from bleeding into adjacent sections.

## Text Editing Overlay — Top-Left Anchoring for Container Shapes (2026-02-17)

- **`translate(-50%, -50%)` is content-size-dependent**: When using CSS `translate(-50%, -50%)` to center an overlay, the position depends on the rendered content size. If the overlay content (textarea) renders differently than the canvas text, the overlay visually jumps. Switch to top-left anchoring with computed padding for pixel-perfect alignment.
- **Match the canvas renderer's formula exactly**: The canvas renders containerText at `startY = cy - textHeight/2 + lineHeight/2 + startYOffset`. The editing overlay must replicate this formula using `measureContainerText()` to compute `textHeight`, then set `paddingTop = (elH/2 - textHeight/2 + startYOffset) * scale`. Any approximation causes visible mismatch.
- **Shape-specific Y offsets live in multiple places**: The render pipeline has hardcoded offsets for doubleBanner, starPerson, lightbulb, signpost. UI shapes (browserWindow, mobilePhone, card) use `getUIShapeDef().textYOffset()`. The overlay must check both sources.
- **Disable auto-resize for container shapes**: Container shapes have fixed dimensions — the text should wrap and scroll within the shape, not expand the textarea beyond shape boundaries.

## Elbow Line Drawing — Simplicity Over Flexibility (2026-02-17)

- **Low BEND_THRESHOLD causes mouse wobble artifacts**: A 15px threshold for committing bend points during interactive drawing is too sensitive — normal mouse movement easily exceeds it. Increase thresholds or simplify the algorithm.
- **L-shape is good enough for interactive drawing**: Users expect clean orthogonal paths. A simple 3-point L-shape (detect initial direction, then one bend) produces cleaner results than complex multi-bend algorithms. The A* smart routing handles obstacle avoidance for bound connectors separately.
- **Initial direction detection needs a dead zone**: Use a 20px threshold before committing to horizontal or vertical direction. Below this threshold, show a straight diagonal line. This prevents direction oscillation from small movements.

## SolidJS Reactive Tracking — Explicit Property Access (2026-02-17)

- **Every tracked property must be explicitly accessed**: SolidJS only tracks properties that are read within a `createEffect`. If you add `controlPoints` to an element but never access `e.controlPoints` in the draw effect, changes won't trigger redraws. This is easy to miss when adding new properties.
- **Selection handlers may not trigger the general draw path**: In yappy, `selectionOnMove` returns early before the general canvas draw check. Control point drag, segment drag, and other selection-specific operations need their own `requestAnimationFrame(helpers.draw)` call.

## AI Drawing Engine — LLM-to-Canvas Pipeline (2026-02-17)

- **Leverage existing DSL pipeline**: Instead of having the LLM generate raw JS code or direct API calls, have it generate the validated JSON DSL format. This gives you free validation via `parseDSL()`, free layout via `computeLayout()`, and free rendering via `renderDiagram()`. The LLM only needs to learn one schema.
- **System prompt size matters for token cost**: The system prompt is sent with every request. Keep it condensed (~2-3K tokens). Group shape aliases by category, use one-line descriptions for layout strategies, and provide 3-4 complete examples covering different diagram types.
- **Domain-specific shape guidance is essential**: Without explicit instructions, LLMs default to generic `rect`/`oval` for everything. Add an "IMPORTANT" section listing BPMN shapes for business processes, UML shapes for OOP, infra shapes for architecture. Include property syntax (`bpmnTaskType`, `sections` for UML classes).
- **3-tier JSON extraction handles LLM quirks**: LLMs don't always return clean JSON — they may add markdown fences, leading text, or trailing explanation. Use a 3-tier extraction: (1) direct parse if starts with `{`, (2) regex for ```json fences, (3) find first `{` to last `}` substring.
- **Code-split AI modules**: AI code (providers, system prompt, settings) is only needed when the user first opens the AI dialog. Use dynamic `import()` in the API method to avoid loading ~12KB of AI code on app startup.
- **Anthropic browser CORS requires special header**: Anthropic's API requires `anthropic-dangerous-direct-browser-access: true` header for direct browser calls. Without it, CORS preflight fails silently.
- **Base64 key obfuscation, not encryption**: Storing API keys in localStorage with `btoa()`/`atob()` is obfuscation, not security. It prevents casual shoulder-surfing but not determined access. This is acceptable for user-owned keys stored in their own browser.

## Shape Intersection — Default Fallback for All Types (2026-02-17)

- **Every new shape type breaks intersection if not listed**: `intersectElementWithLine()` had explicit type checks with no default fallback, returning `null` for any unrecognized type. Every new shape added to the app (BPMN, UML, DS, charts, UI components) silently broke binding resolution. Always add a default bbox fallback so new types work automatically.
- **Circular shapes need ellipse intersection, not bbox**: BPMN events (start, end, intermediate) and UML use-cases are visually circular. Bbox intersection puts arrow endpoints at rectangle corners, not on the circle boundary. Add these types to the ellipse branch alongside `circle`.
- **Gateway shapes are diamonds geometrically**: BPMN gateways (exclusive, parallel, inclusive, event) render as rotated squares. They need diamond intersection math, not bbox approximation.

## Architectural Rendering — Normalize Negative Dimensions (2026-02-17)

- **Canvas `arc()` silently rejects negative radius**: Unlike SVG path `A` commands which can handle some negative values, the Canvas 2D `arc(x, y, radius, ...)` API silently does nothing when `radius < 0`. This makes shapes invisible without any error.
- **Normalize at method entry, not per-shape**: When `el.width`/`el.height` can be negative (from drag-to-left/up), normalize once at the top of the render method: `w = Math.abs(el.width)`, `x = el.width < 0 ? el.x + el.width : el.x`. This fixes all shapes in the renderer, not just the reported one.
- **Sketch renderers are more forgiving**: RoughJS path rendering handles some negative dimension scenarios better than direct Canvas 2D API calls. This is why sketch mode "works" while architectural mode breaks — don't assume both modes have the same failure patterns.

## Document Load — State Reset Order Matters (2026-02-16)

- **Always reset transient state in `loadDocument`**: Store properties like `canvasBackgroundColor` are transient mirrors of document data (synced from `slide.backgroundColor`). If `loadDocument` doesn't explicitly reset them, values from the previous document bleed into the new one. Every transient state property must be reset to its default during load.
- **Theme → slide override ordering**: When loading a document, apply settings in dependency order: (1) reset to defaults, (2) apply theme (which may adjust defaults like focus dark bg), (3) apply document-specific overrides. Reversing steps 2 and 3 causes theme adjustments to be clobbered; skipping step 1 causes bleed from previous state.

## HTML Export & Standalone Player (2026-02-16)

- **Standalone HTML must replicate all external resources**: The HTML export template is a self-contained file. Any external resources loaded via `<link>` in the main `index.html` (e.g., Google Fonts) must be explicitly duplicated in the export template. The embedded player CSS/JS are injected, but external CDN links are not — they must be added manually to the template's `<head>`.
- **Player animation init requires Canvas mount**: In the standalone player, `setIsReady(true)` triggers SolidJS conditional rendering (`<Show>`) which schedules Canvas mount. `requestAnimationFrame` fires too early — before Canvas's `onMount` completes. Use `setTimeout(300ms)` to allow the full `Show → Canvas → onMount` chain to complete before calling `slideBuildManager.init()`.
- **Player bypasses app-store lifecycle functions**: The player sets store values directly (`setStore("appMode", "presentation")`) instead of calling `togglePresentationMode()`. This means any side effects in those functions (like animation init, zoom-to-fit, hide reveal elements) must be explicitly replicated in the player's `onMount`.

## Layer Panel UX — Lock Toggle (2026-02-16)

- **Quick-access vs context menu**: Features used frequently (like lock/unlock) should have inline toggle buttons, not just context menu entries. The visibility toggle was already inline; the lock toggle was context-menu-only, making it hard to discover and slow to use.
- **Visual state indicators on active rows**: When a layer row is selected (active, blue background), icon colors need to be adjusted for contrast. Use white/light colors for active rows and standard theme colors for inactive rows. For "danger" states like locked, use a lighter variant (e.g., `#fca5a5` on blue vs `#ef4444` on neutral).

## Connector Anchor System — Fraction-Based Positioning (2026-02-16)

- **Dynamic anchor switching is fragile**: Auto-switching anchor positions on every `refreshBoundLine` call causes connectors to converge when multiple connectors share the same edge. Users expect connectors to stay where they placed them. Remove auto-switching in favor of stable stored positions.
- **Edge-type bindings drift**: Bindings with `position: 'edge'` compute intersection points dynamically from the other endpoint's current position. On each refresh, the intersection point shifts slightly, causing cumulative drift. Replace edge bindings with precise stored coordinates at creation time.
- **Anchor fractions for sub-anchor precision**: Named anchors ('left', 'right', 'top-right') are too coarse for multiple connectors on the same edge. Store `anchorFractionX`/`anchorFractionY` (0-1 relative to shape bbox) for pixel-precise positioning. Resolution priority: fractions > named anchor > edge intersection fallback.
- **Raw mouse position vs snapped position**: `checkBinding` snaps endpoints to the nearest anchor center. If you compute fractions from snapped coordinates, all connectors to the same anchor get identical fractions. Track the raw mouse position separately (`lastRawEndX`/`lastRawEndY` in PointerState) and use that for fraction computation.
- **Smart flip causes more harm than good**: Auto-flipping anchor positions when shapes cross to opposite sides sounds useful, but it triggers on every reactive refresh, can't distinguish intentional from accidental placement, and causes all connectors to converge to the same flipped position. Removed in favor of manual anchor control with stable fractions.
- **Sibling spread for identical anchors**: When multiple connectors share the exact same start and end anchor positions, apply perpendicular offset (spread) based on sibling index. Compare both position strings — connectors with different end positions don't need spreading since they naturally diverge.
- **Default strokeWidth consistency**: When changing a default value (like strokeWidth from 1 to 4), search ALL fallback patterns across the codebase: `?? 1`, `|| 1`, `?? 2`, `|| 2`. Common locations: api.ts, migration.ts, settings dialog, shape renderers. Missing even one creates inconsistent rendering.

## Image Pixel Effects — Canvas ImageData API (2026-02-15)

- **ImageData API for pixel manipulation**: The Canvas `getImageData()` and `putImageData()` APIs allow direct pixel-level manipulation, enabling effects that go beyond CSS filters. Each pixel is represented as RGBA values (4 bytes per pixel) in a flat Uint8ClampedArray.
- **Temporary canvas for processing**: When applying pixel effects, create a temporary canvas to process the image independently. Draw the image to the temp canvas, extract ImageData, apply transformations, then draw the result back. This prevents contaminating the main canvas during processing.
- **Mask-based composition**: Separate the pixel selection logic (mask generation) from the image composition. Generate a mask ImageData where the alpha channel determines pixel visibility (0-255), then compose it with the source image. This separation makes effects reusable and easier to debug.
- **Seeded randomness for consistent animations**: For effects like "random-pixels" or "dissolve", use seeded random functions (e.g., `Math.sin(seed) * 10000`) instead of `Math.random()`. This ensures the same pixels appear in the same order each time, creating smooth, deterministic animations that can be scrubbed or looped.
- **Performance considerations**: `getImageData()` and `putImageData()` are CPU-intensive. For large images (>1000x1000px), these operations can cause frame drops. During animation, the effect runs every frame, so optimize the mask generation algorithms and consider downsampling very large images.
- **Integration with existing animation system**: Pixel effects integrate cleanly with the existing animation engine by animating a `pixelEffectProgress` property (0-1). The renderer checks this property each frame and applies the corresponding pixel mask. When animation completes, the property can be removed to resume normal rendering.
- **Canvas-only limitation**: Pixel effects require `CanvasRenderingContext2D` and won't work with alternative renderers (like the Rust Raylib renderer). Add fallback logic to detect the renderer type and skip pixel effects when not using canvas.
- **Effect parameters**: Different effects need different parameters (scan line height, block size, glitch intensity, wave count). Store these in a flexible `pixelEffectParams` object on the element, allowing each effect to access its specific configuration.
- **Preset functions for UX**: While the low-level `animatePixelEffect()` provides full control, preset functions (like `pixelEffectPresets.glitch()`) improve developer experience by providing sensible defaults for common use cases. Each preset is just a wrapper that calls the core function with pre-tuned parameters.
- **Reversible effects**: All effects support a `reverse` flag to animate from visible→hidden instead of hidden→visible. This is implemented by inverting the progress value (1 - progress) rather than duplicating effect logic.
- **Algorithmic effect patterns**:
  - Sequential effects use simple threshold comparisons (`x < threshold`)
  - Wave effects use distance calculations and trigonometric functions for ripples
  - Random effects use position-based seeds for deterministic randomness
  - Glitch effects combine horizontal slicing with offset displacement
  - Spiral effects combine polar coordinates (distance + angle) for spiral patterns

## Store Mutation Guards & Rich Text Pipeline (2026-02-15)

- **Store mutation guards can silently destroy data**: The `updateElement()` function had a guard to clear `richText` when `text` was updated from the property panel. But `commitRichText()` sent both `text` and `richText` in the same update, triggering the guard and wiping formatting. Always scope guards with negative checks: `if ('text' in updates && !('richText' in updates))`.
- **Tool-lock must be checked at all reset points**: When implementing double-click-to-lock for a tool, every `setSelectedTool('selection')` call in blur handlers, Escape handlers, and commit callbacks must check `!store.toolLocked`. Missing even one reset point breaks the entire feature.
- **New tool types need CONTINUOUS_TOOLS registration**: When adding a new tool type like `'richtext'`, it must be added to `CONTINUOUS_TOOLS` (prevents auto-switch to selection after drawing) and `CLICK_EXEMPT` (prevents deletion of small elements created by click). Forgetting these arrays causes the tool to behave incorrectly.
- **Rich text has a 4-step pipeline, each can lose data**: DOM (contenteditable) → `htmlToSpans()` → Store (`updateElement`) → Canvas renderer. When formatting "works while editing but breaks on canvas", trace the pipeline step by step. The bug is usually in the store mutation step, not the rendering step.
- **Raylib Rust renderer must mirror JS renderer features**: When adding rich text support to the TypeScript renderer, the Rust Raylib renderer needs matching updates: new struct definitions, dispatcher entries, and rendering logic. Use the same layout algorithm approach (tokenize spans → word-wrap → position segments → render per-segment).

## Linux Drag-and-Drop & SolidJS Event Handling (2026-02-13)

- **Canvas is a weak drop target on Linux**: The `<canvas>` element is less reliable as a drop target than `<div>` on Linux, especially under Wayland. Always wrap canvas in a div and attach drag handlers to the wrapper div, not the canvas directly.
- **Wayland DnD is fundamentally unreliable**: On Ubuntu Wayland sessions, the OS compositor sometimes delivers an empty `DataTransfer` to the browser during drop events. `types`, `files`, `items`, and `getData()` all return empty. This is an OS-level bug — no JavaScript workaround can recover the lost data. Provide fallback UI (file picker prompt) when this happens.
- **Nautilus exports `text/uri-list` not always `Files`**: Ubuntu's file manager (Nautilus) may send `text/uri-list` with `file:///path/to/image.png` instead of populating the `Files` type. Always check both `e.dataTransfer.files` and `e.dataTransfer.getData('text/uri-list')` as fallbacks.
- **Never use async drop handlers**: Declare drop event handlers as non-async functions. Extract ALL DataTransfer data (`files`, `items`, `getData()`) synchronously before any async operations. Some browsers aggressively clear the DataTransfer after the synchronous event handler returns — `async` handlers may lose data. Pattern: `extractDropData()` (sync) → `processExtractedDrop()` (async with already-captured data).
- **`e.dataTransfer.items` as fallback for `files`**: The `DataTransferItemList` API (`items`) with `getAsFile()` can succeed when the `FileList` API (`files`) is empty on certain Linux setups. Always try both.
- **SolidJS event delegation vs native handlers**: SolidJS delegates common events (`onClick`, `onKeyDown`, etc.) to the `document` element, not to the target. This means SolidJS `onKeyDown` fires in the document bubbling phase, AFTER window capture-phase handlers and AFTER native `addEventListener` handlers on the element. For keyboard handling that must take priority (like Enter in a textarea), use native `el.addEventListener('keydown', ...)` in the `ref` callback with `e.stopImmediatePropagation()` to prevent interference from global hotkeys.
- **Always manually handle Enter in text editors**: Don't rely on the browser's default Enter behavior in textareas or contenteditables when there are capture-phase keyboard handlers in the app. Call `e.preventDefault()`, `e.stopImmediatePropagation()`, and manually insert `\n` or `document.execCommand('insertLineBreak')`. This is the only reliable approach when multiple event handlers compete for keyboard events.

## YSL Scripting Language — Compiler Architecture (2026-02-13)

- **Reuse existing IR, don't reinvent rendering**: The YSL interpreter produces the same `DSLDiagram` IR (nodes, edges, groups, pools) that the existing text parser produces. This means all 11 layout strategies, 88+ shape aliases, and the full style system work for free — the scripting language is purely a front-end that evaluates to the same data structure.
- **Lexer → Parser → Interpreter is the right split**: A regex-based parser (like the existing text-parser.ts) works for declarative grammars but can't handle nested scopes, expressions, or control flow. A proper tokenizer + recursive descent parser + tree-walking interpreter is necessary once you add variables, loops, and functions.
- **Auto-detection ordering matters**: The `parseDSL()` router checks JSON → YSL → Mermaid → Text DSL. YSL must come before Text DSL because valid YSL is also valid-looking text DSL (it has node/edge declarations). The `isYSLScript()` function detects scripting constructs (`let`, `const`, `for`, `if`, `fn`, `template`) to distinguish from plain declarative input.
- **Lexical scoping with Environment parent chain**: Each scope (function body, loop body, block) creates a child `Environment` that delegates to its parent for lookups. Constants are tracked separately to prevent reassignment. This is simpler and more correct than a single flat symbol table.
- **Dynamic node IDs via `{variable}` syntax**: YSL allows `server_{i}` in node declarations where `{i}` is interpolated at runtime. This is distinct from string interpolation (`"${i}"`) — it happens at the identifier/ID level during interpretation, not during string evaluation.

## Rich Text Contenteditable DOM Parsing (2026-02-13)

- **Browsers create varied DOM structures in contenteditable**: `insertLineBreak` creates `<br>` elements, but browsers may also use `<div>` wrapping for line separation. Chrome can produce `text<div>next line</div>` — the first line stays as a bare text node while subsequent lines get wrapped in `<div>` blocks. A DOM parser must handle both `<br>` newlines and block-element-implied newlines.
- **Block elements imply line breaks on BOTH sides**: When parsing contenteditable DOM to extract text, add `\n` before a `<div>`/`<p>` if its previous sibling is a non-block element (text, span, etc.), AND after it if it has a next sibling. Skip the leading `\n` if the previous sibling is another block (handled by that block's trailing `\n`) or a `<br>` (which already emits its own `\n`).
- **`document.execCommand` is deprecated but necessary**: `insertLineBreak` is the only reliable cross-browser way to insert `<br>` in contenteditable without triggering `<div>` wrapping. However, browsers may still restructure the DOM independently, so the parser must be resilient to any valid DOM structure.

## Mermaid 6 New Diagram Types — Architecture Patterns (2026-02-13)

- **Data-driven single element vs individual elements**: Two rendering strategies for diagram parsers. Data-driven (like pieChart) stores all data in `node.properties`, creates one canvas element, and a custom renderer draws everything inside it — best for charts (Gantt, Journey, Quadrant, XY). Individual elements (like flowchart) create separate `DSLNode`/`DSLEdge` objects that become independent canvas elements — best for structural diagrams (Block, Git Graph) where users may want to select/move individual nodes.
- **Property propagation pipeline**: `node.properties` in the DSL IR → DSL engine `renderNode()` copies to `elementOpts` → `createElement()` spreads `...options` → properties land on `DrawingElement` → renderer reads via `(el as any).propertyName`. The "spread" step means any custom property automatically reaches the renderer without modifying `createElement`.
- **DataMetricsRenderer dual-mode pattern**: Each data-driven chart type needs cases in both `renderArchitectural` (native Canvas2D) and `renderSketch` (rough-js). Architectural uses `ctx.fillRect`, `ctx.arc`, `ctx.strokeRect` for crisp rendering. Sketch uses `rc.rectangle`, `rc.circle`, `rc.line` for hand-drawn feel. Text always uses native `ctx` in both modes for readability.
- **Grid cursor for block diagrams**: Track `row`/`col` position, advance cursor by colspan on each block. When `col >= columns`, wrap to next row. This gives explicit `x, y, width, height` for each block without needing a layout strategy — use `layout: 'manual'` instead.
- **Git graph state machine**: Track `currentBranch`, a `branches` Map with color/commits/parentBranch, and a global commit order. Each `commit` command appends to the current branch's commit list. `branch` creates a child with a parent reference. `merge` finds the latest commit on the source branch and creates a merge edge. Layout: assign each branch a y-track, commits progress along x-axis.
- **Score-to-color gradient for journey diagrams**: Map satisfaction scores (1-5) to a red→orange→yellow→green gradient using a simple if-chain. This provides immediate visual feedback — low scores (red) draw attention, high scores (green) indicate satisfaction.
- **Relative sizing for resizable charts**: All coordinates computed as ratios of `el.width`/`el.height` (e.g., `pad.top = 28`, `dotR = Math.max(4, Math.min(7, pw * 0.014))`). This means charts scale proportionally when resized. Font sizes use `Math.max(min, Math.min(max, dimension * factor))` to stay readable at any size.

## SVG Export — Canvas Fallback Strategy (2026-02-13)

- **Dual rendering paths diverge over time**: The SVG export had a hand-coded rendering path that only covered basic shapes (rectangle, circle, line, arrow, text, freehand, image). The canvas pipeline used a shape registry with 80+ shape types. As new shapes were added to the registry, the SVG export silently fell further behind. Lesson: when two codepaths render the same content, either unify them or add a fallback bridge.
- **Canvas-to-SVG fallback**: For shapes without native SVG handlers, render to an offscreen canvas at 2x via `renderElement()` and embed as `<image>` in the SVG. This provides 100% shape coverage — rasterized rather than vector, but vastly better than missing shapes. The key insight: `renderElement()` already handles all shape types, opacity, rotation, flip, shadow, container text, etc., so the fallback automatically inherits all features.
- **Avoiding double-transform in canvas fallback**: Canvas `renderElement()` bakes in opacity, rotation, flip, and shadow via `RenderPipeline.applyTransformations()`. The SVG export then normally applies these as SVG attributes. For canvas fallback nodes, skip SVG-level attributes — otherwise properties are applied twice (rotated twice, double opacity reduction, etc.).
- **Canvas padding for rotated elements**: A rotated element's rendered output extends beyond its original bounding box. The maximum extent is `sqrt(w² + h²)/2` from center. Add extra padding = `ceil((sqrt(w² + h²) - min(w, h)) / 2)` for rotated elements to prevent clipping.
- **Font embedding in SVG**: SVG text relies on fonts being available on the viewer's machine. Adding `@import url(...)` in a `<defs><style>` block lets standalone SVGs load fonts from Google Fonts CDN. This makes text render correctly when opening the SVG in any modern browser, design tool, or image viewer.
- **Image crop handling**: Native SVG `<image>` can't do source-rect cropping. Let cropped images fall through to the canvas fallback, which handles crop via `ctx.drawImage(img, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH)`.

## DSL Template Browser Integration & Mermaid Parser Fixes (2026-02-13)

- **CSS specificity wars with global button styles**: Global `button { }` rules in `index.css` (background, border, box-shadow, border-radius) override component-scoped selectors at equal specificity. Fixed by increasing specificity with `.template-browser-dialog button.template-category-tab` — the parent class + element + class selector beats a bare element selector. Also needed explicit `box-shadow: none` to override `var(--shadow-sm)`.
- **Regex anchors and trimmed strings**: The ER parser's `ATTR_RE = /^\s+.../` required leading whitespace, but lines were `.trim()`-ed before matching. Always check whether input is pre-processed before writing regex anchors. Changed `^\s+` to `^\s*`.
- **Canvas state corruption from renderer throws**: If a shape renderer throws between `ctx.save()` and `ctx.restore()`, the canvas state stack is permanently corrupted (wrong transforms, wrong clipping). Fixed with try-finally wrapping in ShapeRenderer to guarantee `restoreTransformations()` runs.
- **SolidJS ternary in JSX**: In SolidJS, ternary expressions in JSX (`{condition ? <A/> : <B/>}`) work correctly as render expressions. Used this for DSL vs non-DSL placeholder icons in template cards.
- **Template architecture for DSL content**: Added `dslContent?: string` to the `Template` interface. DSL templates store text content instead of pre-built element arrays. When selected, the text is passed to the Import Dialog (via `initialText` prop) rather than rendered directly — this lets users see, learn from, and modify the DSL before importing.
- **Layer state reset for DSL imports**: `renderDiagram()` with `clearCanvas: true` only deletes elements but doesn't reset layers. This left stale layer state (hidden, locked) causing "Can't draw hidden layer" errors. Fix: call `loadTemplate()` with fresh default layer before running the DSL engine.
- **organicBranch connector limitation**: The `organicBranch` path renderer requires `el.controlPoints` (bezier control points array) — if missing or < 2 entries, `renderCommon()` returns early at line 53 and nothing draws. `YappyAPI.connect()` doesn't compute control points, so `type: 'line'` with `curveType: 'bezier'` is the correct approach for programmatic connections.

## Image Editing & Crop Tool (2026-02-12)

- **Canvas `ctx.filter` for image effects**: CSS filter functions (`brightness()`, `contrast()`, `saturate()`, `blur()`, `hue-rotate()`, `invert()`, `sepia()`) can be applied to canvas rendering via `ctx.filter`. The filter is part of canvas state managed by `ctx.save()`/`ctx.restore()`, so it's properly scoped per element. Applied in `applyTransformations()` for image elements only.
- **SolidJS reactive tracking for new properties**: `createEffect` in SolidJS requires explicit property reads to establish reactive dependencies. When adding new properties (e.g., `filterBrightness`, `crop`), they MUST be read inside the reactive tracking block in `canvas.tsx` — otherwise slider/property changes won't trigger canvas re-renders. This is a common pitfall with SolidJS fine-grained reactivity.
- **Filter preset pattern**: Filter presets (like gradient presets) map a preset ID to a set of property values. When selecting a preset, all filter values update atomically. When any individual slider changes, the preset auto-switches to "Custom". This provides both quick presets and fine-grained control.
- **Crop coordinate system**: Image crop uses element-local coordinates (0,0 = element top-left, el.width/el.height = bottom-right) for the interactive overlay, then converts to source image pixel coordinates for storage. The ratio `img.naturalWidth / el.width` maps between the two. This avoids issues when images are resized on canvas.
- **Crop overlay rendering**: The crop overlay draws: (1) full image at 30% opacity, (2) dark dim rectangles around the crop area, (3) cropped portion at full opacity, (4) rule-of-thirds grid, (5) 8 resize handles. Drawing the overlay after the normal render in the draw loop means it stacks correctly.
- **Desktop file drag/drop**: Browser `dataTransfer.files` provides `File` objects for desktop drops. Check `file.type.startsWith('image/')` to filter, then use `FileReader.readAsDataURL()` → compress via offscreen canvas → create element. This is separate from `dataTransfer.getData('text/plain')` which handles URL/color drops.
- **Tool types vs element types**: `ToolType = ElementType | 'lasso' | 'crop'` — tools that don't create elements need to be added to the `TOOL_TYPES` array in quick-toolbar-config.ts so `getElementFamily()` returns null for them (preventing them from being treated as shape/connector families).

## Cloud Storage Provider System (2026-02-12)

- **PKCE OAuth for static sites**: Google Drive supports OAuth 2.0 with PKCE (Proof Key for Code Exchange), which runs entirely client-side with no server or client secret. Generate `code_verifier` (random bytes, base64url), SHA-256 hash it to `code_challenge`, and send both through the flow. The token exchange uses `code_verifier` instead of a client secret.
- **Popup vs redirect for OAuth**: Using a popup window preserves the user's unsaved drawing state. The popup opens Google's consent page, redirects to a static `oauth-callback.html` that posts the auth code back via `window.opener.postMessage()`, then closes automatically.
- **Provider interface pattern**: Defining a `CloudStorageProvider` interface that all providers implement (Google Drive, Dropbox, etc.) decouples the UI from any specific cloud API. The UI codes against the interface; adding a new provider means implementing the interface and registering it — zero UI changes.
- **Token expiry with PKCE**: Google's PKCE public client flow does NOT return refresh tokens. Access tokens expire in 1 hour. Handle this gracefully with expiry checking (5-minute buffer) and a "session expired" toast prompting re-auth.
- **Google Drive multipart upload**: Creating a file with metadata uses `uploadType=multipart` with a `FormData` containing a JSON metadata blob and the file blob. Updating uses `uploadType=media` with `PATCH`. Both support `supportsAllDrives=true` for Shared Drives.
- **Feature flags for progressive rollout**: Gating cloud features behind `VITE_ENABLE_CLOUD_STORAGE` and `VITE_ENABLE_GOOGLE_DRIVE` flags allows disabling cloud features entirely for specific deployments (e.g., air-gapped environments, OSS builds) without code changes.
- **SaaS-ready design**: The `CloudStorageProvider` interface can later front a backend API (`BackendStorageProvider`) without changing any UI components. Auth migrates from client-side PKCE to server-side OAuth, but the `AuthState` interface stays identical.

## BPMN Shape Library Implementation (2026-02-11)

- **Dedicated renderer for domain shapes**: Created `BpmnRenderer` extending `ShapeRenderer` — this is the cleanest pattern for domain-specific shape sets (12 shapes) rather than the data-driven approach used for UI/UX shapes. The switch-based rendering in a dedicated class keeps all BPMN logic centralized.
- **BPMN-specific properties on DrawingElement**: Added `bpmnEventType`, `bpmnTaskType`, `bpmnLoopType` as optional properties. These are rendered as overlay icons/markers by the renderer, not as separate shapes. This keeps the element model simple while allowing rich customization.
- **Thick border pattern**: For `bpmnEndEvent` (3× stroke) and `bpmnCallActivity` (2.5× stroke), multiplied `el.strokeWidth` in the renderer rather than modifying the element's stored value. This preserves user control while maintaining BPMN visual semantics.
- **Pool label rotation**: Used `ctx.save/translate/rotate/restore` to render the pool's label text vertically rotated -90°. The pool skips `RenderPipeline.renderText()` and handles its own label in the left panel area.
- **Shape checklist is essential**: Following docs/creating-shapes.md checklist prevented missing any integration points: types.ts → shape-geometry.ts → renderer → register-shapes.ts → hit-testing.ts → anchor-points.ts → text-editing-handler.ts → properties.ts → app-store.ts → toolbar → api.ts.

## Floating Quick Toolbar — Collapsed Icon Pattern (2026-02-10)

- **Two-state toolbar**: Instead of showing the full toolbar immediately on element selection, show a small circular icon that expands to the full toolbar on click. Reduces visual clutter.
- **Collapse on selection change**: Use a `createEffect` tracking `store.selection[0]` to auto-collapse when the user selects a different element.
- **Click-outside dismiss**: Register a `pointerdown` listener on document when expanded, remove on collapse. Use `setTimeout(0)` to avoid catching the same click that opened it.
- **Positioning split**: Collapsed icon uses a small fixed width (32px) centered above the element. Expanded toolbar uses the full container width with collision avoidance against the property panel.
- **CSS transition**: The collapsed icon uses `border-radius: 50%` with hover scale effect. The expanded toolbar keeps the existing rectangular styling.

## Live CRUD Operations on DS Shapes (2026-02-10)

### Presentation-Mode Interactive Panels
To add interactive controls during presentation mode, intercept clicks in `presentationOnDown` (minor-handlers.ts) with `return true` to consume the event and prevent slide advancement. Use a store signal (`activeDsOpsElementId`) for coordination between the handler and the floating panel component. Dismiss on empty space click and presentation exit.

### Two-Phase Animation for CRUD
Insert animations set new text immediately then fade in (`dsOpInsert` alpha = progress). Remove animations keep old text during fade out (`dsOpRemove` alpha = 1-progress) then commit new text on complete. This prevents visual flicker — the item is always present in the data during its animation.

### Context-Aware Highlight Colors in Renderer
The `getColors()` helper reads `el.dsAnimStyle` to return red highlights for remove operations and blue for insert/update. This keeps color logic centralized rather than scattered across each render method.

## Data Structure Shapes: Multi-Type Shared Renderer (2026-02-10)

### Shared Renderer Pattern for Related Types
When multiple shape types share similar rendering logic (e.g., dsArray, dsStack, dsQueue, dsLinkedList, dsBinaryTree, dsHashTable), a single renderer class with type-based dispatch is cleaner than 6 separate renderers. Use `switch(el.type)` in `renderCommon()` to delegate to private methods. This follows the pattern of SketchnoteRenderer (19 types), CloudInfraRenderer (8 types), etc.

### Comma-Separated Text as Structured Data
Using `el.text` with comma-separated values as the data source for structured shapes lets you reuse all existing text editing infrastructure (double-click, text-editing-handler, property panel textarea). The renderer parses the text into values. Trade-off: less structured than a dedicated array property, but much simpler to implement and the user experience is intuitive.

### Animation Progress Pattern for Multi-Item Shapes
For shapes with multiple items (cells, nodes, buckets), use a `<prefix>AnimProgress` (0-100) + `<prefix>AnimStyle` pattern. The animation engine animates the numeric progress; the renderer interprets progress + style to determine per-item visibility/highlighting. This keeps animation logic in the renderer (where it has access to layout) and animation timing in the engine.

## Per-Type Option Filtering & Paste JSON Load (2026-02-10)

### Per-Option `excludeFrom` vs Property-Level `applicableTo`
Property dropdown filtering has two levels: property-level `applicableTo` controls whether the entire property row appears; option-level `excludeFrom` controls which options within a visible property are shown. For DS shapes that support solid/gradient fills but not RoughJS patterns, `excludeFrom` on individual options (hachure, zigzag, etc.) is more practical than `applicableTo` on each option — most types support most options, so the exclusion list is shorter.

### SolidJS `autofocus` with Conditional `<Show>`
The HTML `autofocus` attribute does not work reliably when elements are rendered inside SolidJS `<Show>` blocks, because the element isn't in the DOM until the condition becomes true. Use `ref={(el) => setTimeout(() => el.focus(), 0)}` instead — the ref fires when the element mounts, and the `setTimeout(0)` ensures focus happens after the render cycle completes.

### Catch Block Scope in Multi-Step Handlers
When a dialog handler validates input then calls a callback, never put both in the same try/catch. If the callback throws (e.g., from SolidJS reactive updates triggered by `loadDocument()`), the catch shows the wrong error message (e.g., "Invalid JSON" when JSON was valid but the load failed). Pattern: validate in try/catch with early return, then call callback outside the try block.

## Sort/Search Algorithm Animations on DS Shapes (2026-02-10)

### Dual-Highlight State Machine for Algorithm Visualization
Sort algorithms need two items highlighted simultaneously (compare pair). Replaced boolean `isHighlighted()` with `getHighlightState(index, el)` returning `'none' | 'primary' | 'secondary' | 'sorted'`. A `getCellStyle()` helper maps state to {bg, stroke, text, sw} colors. This minimizes changes at each cell rendering site — just replace the old `highlighted ? X : Y` ternary with `cs.property`.

### Color Tokens for Semantic Algorithm Highlights
Instead of hardcoded hex colors, use string tokens (`'comparing'`, `'swapping'`, `'sorted'`, `'searching'`, `'found'`, `'notfound'`) stored in `dsHighlightColor`. A static `DS_HIGHLIGHT_COLORS` map resolves tokens to hex colors in `getColors()`. This lets the renderer pick visually distinct colors (amber for compare, green for swap, blue for search) without the algorithm code knowing about colors.

### AbortController Pattern for Long-Running Canvas Animations
Sort algorithms can run hundreds of steps. Use `AbortController` + `signal.aborted` checks between each step. The step function (`animateDsStep`) uses `setTimeout` for the pause duration, and `signal.addEventListener('abort', ...)` to cancel the timer immediately. On abort, clear all highlights. The dispatcher (`executeDsSortSearch`) creates the controller and cleans up in `finally`.

### Canvas Reactive Property Tracking
SolidJS canvas components use `createEffect` to trigger re-renders when element properties change. New properties must be explicitly accessed in the effect (e.g., `e.dsItemColor;`) to establish reactive tracking. Without this, `updateElement()` changes the store but the canvas never redraws — the property appears "stuck" in the property panel even though the store is correct.

### Fill Background Helper for Custom Renderers
Custom renderers (like DataStructureRenderer) that draw their own backgrounds bypass the base ShapeRenderer's fill system. To support gradients, create a `fillBackground()` helper that checks `el.fillStyle` and applies `ctx.createLinearGradient/createRadialGradient/createConicGradient` or falls back to solid fill. Hachure/cross-hatch fills require RoughJS geometry which custom renderers don't use.

## Code Block Shape: End-to-End Shape Implementation (2026-02-10)

### Complete Shape Creation Pipeline
Adding a new shape type requires coordinated changes across 12+ files. The full pipeline: ElementType union (types.ts) → Renderer class (shapes/renderers/) → Registry (register-shapes.ts) → Toolbar (technical-tool-group.tsx) → Store type (app-store.ts) → Draw handler defaults (draw-handler.ts) → Property panel (properties.ts) → API (api.ts) → Hit testing (hit-testing.ts) → Text editing (text-editing-handler.ts) → Migration (migration.ts). Missing any one file causes subtle failures (e.g., missing hit-testing entry means the element can't be clicked at all).

### Hit-Testing is the Silent Killer
The most critical and easy-to-miss step is adding the new type to the bounding-box hit-test list in `hit-testing.ts`. Without this, `hitTestElement()` returns false for the shape, making it unselectable, uneditable, and effectively invisible to user interaction — even though it renders correctly on canvas. Always add new shape types to the hit-test check.

### Animation params vs Element Properties
For animation-specific configuration (e.g., highlight speed per line), store settings in the animation's `params` object rather than on the element itself. This keeps animation config with the animation (in the animation panel UI) and avoids polluting the element type with transient values. Pattern: `config.params?.msPerLine` in the preset function, with default params set in `addPreset()`.

### Auto-Scrolling for Large Content in Fixed-Size Elements
When animating content that exceeds the element's visible area (e.g., highlighting line 50 of code in a 10-line-tall block), use a scroll offset property (`codeScrollOffset`) that the renderer applies to shift content vertically. The clip region (from `ctx.clip()`) naturally hides overflow. Calculate visible line count from element height and line height, then update scroll offset when the active line would be off-screen.

**Location**: `src/shapes/renderers/code-block-renderer.ts`, `src/utils/animation/element-animator.ts`, `src/utils/hit-testing.ts`

## Start Hidden for Animation Build Steps (2026-02-10)

### Use smart defaults with explicit override for presentation behaviors
The `startHidden` field on animations uses `undefined` to mean "use default" — on-click defaults to hidden, on-load defaults to visible. The `??` operator resolves this at both the UI level (`checked={anim.startHidden ?? (trigger === 'on-click')}`) and the runtime level (`applyStartHidden`). This keeps saved documents lean while providing sensible behavior for trainers. Only when the user explicitly toggles the checkbox does a concrete `true`/`false` get persisted.

### Restore opacity before animation plays, not after
When an element starts hidden (opacity 0) and its step fires, opacity must be restored *before* `sequenceAnimator.playAnimation()`. For fadeIn presets, this is safe because fadeIn immediately calls `updateElement(id, { opacity: 0 })` in the same JS frame — no visible flicker. For non-opacity presets (bounce, shake), the element becomes visible and then the animation plays normally.

## Click-to-Advance in Infinite Canvas (2026-02-10)

### SlideBuildManager already handles on-click triggers — just needs proper initialization
The `SlideBuildManager` and `advancePresentation()` pipeline was designed for slides but works generically. For infinite canvas, `getElementsOnSlide()` returns `[]` because there are no slide spatial regions. Fix: check `store.docType === 'infinite'` and use all elements instead.

### Distinguish click from drag for dual-purpose pointer handlers
In infinite canvas presentation mode, clicking should advance animations while dragging should pan. Use pointer distance threshold (< 5px = click, >= 5px = drag) checked in the pointer-up handler. This preserves both behaviors without additional state flags.

## Canvas 2D fillStyle with Path2D (2026-02-10)

### Always set ctx.fillStyle before ctx.fill(Path2D)
When using `ctx.fill(new Path2D(svgPath))`, the canvas uses the *current* `fillStyle` — it does not inherit from any previous path operations. If `fillStyle` is not explicitly set before the call, the shape renders with whatever color was last set on the context (potentially from a different shape). Prefer using direct path commands (`moveTo`/`lineTo`/`quadraticCurveTo`) + `ctx.fill()` over `Path2D` for consistency, as the stroke path already avoids `Path2D` for similar reasons.

### Multi-select property filtering should check actual selection types
When filtering which properties to show for multi-selection, don't just exclude slide/canvas-exclusive properties — positively check that at least one selected element's type is in the property's `applicableTo` array. Otherwise, shape-specific properties (table columns, speech bubble tail, etc.) leak into the panel when unrelated shapes are selected.

## localStorage Auto-Save Architecture (2026-02-09)

### Silent restore is better UX than recovery prompts
Excalidraw and tldraw silently load the last auto-saved state on startup — no confirm dialog. Users expect their work to just be there. A recovery prompt adds friction, especially when it triggers for empty documents (0 elements). If the auto-save data is empty or pristine, skip it entirely.

### Guard against auto-saving pristine state
Reactive watchers (`createEffect`) can fire during app initialization even with `defer: true` if store properties change during setup (e.g., `loadDocument` bumps `undoStackLength`). Use an `isDirty` flag that only becomes true on actual user changes, and check it before writing to localStorage. This prevents empty documents from being persisted.

### Use `_isSaving` re-entrancy guard with `saveActiveSlide()`
`saveActiveSlide()` mutates the store (`setStore("slides", ...)`), which can re-trigger the reactive watcher that initiated the save. A boolean `_isSaving` flag prevents infinite loops.

### Avoid circular imports with store ↔ feature modules
`auto-save.ts` imports from `app-store.ts`, so `app-store.ts` cannot import from `auto-save.ts`. For `resetToNewDocument()`, inline the localStorage cleanup (`localStorage.removeItem(...)`) instead of calling `clearAutoSave()`.

## SolidJS Batch for Atomic Multi-Element Updates (2026-02-09)

### Non-delegated pointer events don't auto-batch
SolidJS pointer events (`onPointerMove`) are non-delegated and don't automatically batch store mutations. When updating multiple elements in a loop, each `updateElement()` call triggers reactive effects immediately. Wrap multi-element update loops in `batch()` from `solid-js` to defer all reactive effects until the entire batch completes.

### Two-pass pattern for bound element updates
When moving a group of elements that includes shapes and their connected arrows, use two passes: (1) update all positions, (2) refresh bound lines. This prevents `refreshBoundLine` from seeing stale positions on elements that haven't been moved yet. Additionally, skip `refreshBoundLine` for arrows that are themselves in the selection — they translate by the same delta and their binding geometry is preserved.

## Absolute vs Relative Coordinates in Copy-Paste (2026-02-09)

### Always offset absolute-coordinate properties during paste
When an element stores properties in absolute canvas coordinates (e.g., `controlPoints` for organic branches), those properties must be shifted by the same `dx`/`dy` applied to `x`/`y` during paste. Relative properties (like `points`, which are relative to element origin) don't need adjustment. A useful check: if the move handler offsets a property, the paste function must too.

### Clear stale bindings to elements outside the pasted set
When pasting connectors, any `startBinding`/`endBinding` referencing elements not in the copied selection should be cleared to `null`, not silently preserved. Preserving stale bindings causes the connector to snap back to the original element on move. Follow the same pattern already used by `boundElements` (which drops references to external elements).

## Deferred Click Pattern for Dual-Purpose Interactions (2026-02-08)

### Click vs Drag Disambiguation
When the same surface area serves both "click to select" and "drag to move" purposes, deferring the click action to mouseUp avoids conflicts. Record the intent on mouseDown (`pendingCellClick`), let the normal drag flow proceed, and on mouseUp check drag distance: < 3px = click (apply selection), >= 3px = drag (move completed). This mirrors how many design tools handle click vs drag on the same element.

### Dedicated Handle for Complex Elements
Elements with rich internal interaction (like tables with cell selection) benefit from a dedicated move handle rendered outside the element body. This gives users an explicit, discoverable way to reposition the element without triggering internal interactions. The handle should be rendered in selection-renderer.ts, hit-tested in handle-detection.ts, and handled as a special case in selection-handler.ts (enter move mode, not resize).

## Table Cell Selection & Interaction Design (2026-02-08)

### Plain Click Should Set Selection, Not Clear It
When building interactive table cells, the intuitive UX is that clicking a cell highlights it (single-cell selection) rather than clearing any selection. This mirrors spreadsheet behavior. The key change: replace "clear on plain click" with "set single-cell selection on plain click" and add `return` to prevent fall-through to element move logic.

### Right-Click Must Be Excluded from Drag/Sort Paths
When a table header click initiates a potential column drag or sort, right-clicks (button === 2) must be explicitly excluded. Otherwise, right-clicking to open a context menu will enter the drag state, and on mouseUp the handler will overwrite the existing cell selection. Always check `e.button !== 2` in drag initiation paths.

### Full Column Selection via Header Clicks
Implementing column selection requires handling three interaction points:
1. **onDown** (Shift+header click): Extend existing selection to span full rows for the column range
2. **onUp** (non-sort-icon header click): Set full column selection (all rows for that column)
3. The sort icon click area (right side of header) must remain reserved for sorting

### localStorage Persistence for Settings
When persisting user-configurable defaults, only save the specific keys the user can change (not the entire defaults object). This prevents overriding programmatic or theme-dependent values on reload. Use a whitelist pattern:
```typescript
const SETTINGS_KEYS = ['fontFamily', 'fontSize', 'strokeColor', ...] as const;
```

## SolidJS Reactivity Patterns

### Critical: Early Returns Break Reactivity

**Problem**: Using early returns (`if condition return null`) in SolidJS components breaks reactivity.

```typescript
// ❌ WRONG - Breaks reactivity
export const Component = () => {
    if (!condition()) return null;
    // Rest of component
};
```

**Solution**: Always use the `Show` component for conditional rendering:

```typescript
// ✅ CORRECT - Maintains reactivity
export const Component = () => {
    return (
        <Show when={condition()}>
            {() => {
                // Component content
            }}
        </Show>
    );
};
```

**Why**: SolidJS's reactive system needs to track dependencies. Early returns prevent the reactive graph from being built correctly, causing the component to not update when dependencies change.

### Use createMemo for Derived State

When you have computed values that depend on reactive sources, wrap them in `createMemo`:

```typescript
const isMindmapNode = createMemo(() => {
    const el = selectedElement();
    if (!el) return false;
    return !!el.parentId || hasChildren() || startTypes.includes(el.type);
});
```

This ensures the computation is cached and only re-runs when dependencies change.

### Critical: Destructuring Breaks Reactivity

**Problem**: Destructuring reactive values captures them at that moment, breaking reactivity.

```typescript
// ❌ WRONG - Captures stale values
const { scale, panX, panY } = store.viewState;
const x = elementX * scale + panX;  // Won't update when viewState changes
```

**Solution**: Access reactive values directly when you need them:

```typescript
// ✅ CORRECT - Stays reactive
const x = () => elementX * store.viewState.scale + store.viewState.panX;
// Then use: x() to get current value
```

**Why**: Destructuring creates local constants with the values at that moment. SolidJS can't track these as dependencies.

### TypeScript vs SolidJS Show Component

**Problem**: TypeScript doesn't like Show component callbacks in strict mode.

```typescript
// ❌ TypeScript error TS2769
<Show when={condition()}>
    {() => <Component />}
</Show>
```

**Solutions** (in order of preference):

1. **Split into separate component** (Best for complex logic):
```typescript
<Show when={condition()}>
    <ChildComponent />
</Show>
```

2. **Use Show with accessor callback** (For reactive element access):
```typescript
<Show when={element()}>
    {(el) => {
        // el() gives you the reactive element
        return <div>{el().name}</div>;
    }}
</Show>
```

3. **Avoid early returns** - they break reactivity anyway

### The Complete Reactivity Solution Pattern

For a component that needs to:
1. Conditionally render based on store state  
2. Track a specific element
3. Calculate position reactively

```typescript
export const FloatingComponent = () => {
    // Use createMemo for condition check
    const shouldShow = createMemo(() => {
        const el = getElement();
        return el && meetsCondition(el);
    });

    return (
        <Show when={shouldShow()}>
            <ContentComponent />
        </Show>
    );
};

const ContentComponent = () => {
    // Track element reactively
    const element = createMemo(() => getElement());
    
    return (
        <Show when={element()}>
            {(el) => {
                // Calculate position reactively - don't destructure!
                const x = () => el().x * store.viewState.scale + store.viewState.panX;
                const y = () => el().y * store.viewState.scale + store.viewState.panY;
                
                return (
                    <div style={{
                        left: `${x()}px`,
                        top: `${y()}px`
                    }}>
                        {/* Content */}
                    </div>
                );
            }}
        </Show>
    );
};
```

**Key Points**:
- `createMemo` for derived/computed state
- `Show` component for conditional rendering 
- Separate component to avoid TypeScript issues
- Accessor callback `{(el) => ...}` to get reactive value
- Function calls `x()` and direct property access `store.viewState.scale` for reactivity


## Floating UI Positioning

### The `fixed` Position Challenge  

When positioning floating UI elements over a zoomable/pannable canvas:

1. **Use `position: fixed`** for the floating element
2. **Calculate viewport coordinates** from canvas coordinates:
   ```typescript
   const x = (el.x + el.width / 2) * scale + panX;
   const y = (el.y - 60) * scale + panY;
   ```
3. **Avoid `transform: translate(-50%, -100%)`** initially - it can cause visibility issues. Get basic positioning working first, then add transforms if needed.

### Debugging Visibility Issues

When a component isn't visible:

1. **Start simple**: Use a fixed position (e.g., `top: 100px, left: 100px`) to verify the component renders at all
2. **High contrast styling**: Use bright borders (`border: 2px solid #3b82f6`) for debugging
3. **Console logging**: Add logs to verify reactive values are updating
4. **Check z-index**: Ensure the element is above canvas content (z-index: 10000)

## Component Integration Patterns

### Rendering Location Matters

**Root-level rendering** (`App.tsx`) is more reliable than canvas-level for floating UI:

```typescript
// In App.tsx
return (
    <div>
        <Canvas />
        <MindmapActionToolbar />  {/* Rendered at root */}
        <Toast />
    </div>
);
```

**Why**: Avoids issues with canvas transformations, clipping, and ensures consistent z-index stacking.

## Mobile vs Desktop UX Decisions

### Bottom Sheet vs Floating Toolbar

**Bottom Sheet Approach**:
- ✅ Native mobile pattern
- ✅ Large touch targets
- ❌ Detection issues (`window.innerWidth`)
- ❌ More complex state management
- ❌ Visibility problems

**Floating Toolbar Approach** (Chosen):
- ✅ Works on desktop AND mobile
- ✅ Simpler implementation
- ✅ Always visible when needed
- ✅ Consistent cross-platform
- ⚠️ Requires careful positioning

**Lesson**: Simpler, universal solutions often work better than platform-specific ones.

## Iterative Development Process

### The Toolbar Implementation Journey

**The Goal**: Create a floating toolbar that appears above selected mindmap nodes, providing quick access to actions.

**Iteration 1: Bottom Sheet** ❌
- Tried mobile-only bottom sheet with screen width detection
- **Failure**: Visibility issues, not appearing at all
- **Learning**: Mobile-specific detection (`window.innerWidth < 1024`) is unreliable

**Iteration 2: Floating Toolbar in Canvas.tsx** ❌  
- Added toolbar as child of Canvas component
- **Failure**: Z-index conflicts, positioning issues with canvas transforms
- **Learning**: Floating UI should NOT be child of transformed containers

**Iteration 3: App.tsx with Transform** ❌
- Moved to App.tsx root level
- Used `transform: translate(-50%, -100%)` to center/position
- **Failure**: Toolbar completely disappeared
- **Learning**: Transforms can cause unexpected visibility issues - debug without them first

**Iteration 4: Simple Fixed Position** ✅ (Partially)
- Removed transform, used simple `position: fixed`
- Initially positioned at `100px, 100px` for debugging
- **Success**: Toolbar finally visible!
- **Problem**: Didn't move with selected element

**Iteration 5: Calculated Position with Early Return** ❌
- Added position calculation: `(el.x + el.width/2) * scale + panX`  
- Used early return: `if (!condition) return null`
- **Failure**: Toolbar stopped appearing completely
- **Learning**: Early returns break SolidJS reactivity

**Iteration 6: Show Component with Callback** ❌
- Replaced early return with `<Show when={...}>{() => {...}}</Show>`
- **Failure**: TypeScript error TS2769 on build
- **Learning**: TypeScript doesn't like Show component callback syntax in strict mode

**Iteration 7: Separate Component** ✅ (Partially)
- Split into `MindmapActionToolbar` and `ToolbarContent`
- `<Show>` renders `<ToolbarContent />` as child component
- **Success**: Builds and appears!
- **Problem**: Operations worked on selected element, but toolbar stayed at first selected position

**Iteration 8: createMemo for Element** ✅ (Partially)
- Used `createMemo(() => getElement())` to track selection
- **Success**: Operations now update to current selection
- **Problem**: Position still didn't move

**Iteration 9: Reactive Position Calculation** ✅ **SUCCESS!**
- **Key Insight**: Destructuring `store.viewState` captured stale values
- Changed from:
  ```typescript
  const { scale, panX } = store.viewState;  // ❌ Stale
  const x = el.x * scale + panX;
  ```
- To:
  ```typescript
  const x = () => el().x * store.viewState.scale + store.viewState.panX;  // ✅ Reactive
  ```
- **Success**: Everything works! Toolbar:
  - Appears when selecting mindmap node
  - Moves to currently selected element
  - Operations apply to correct element  
  - Updates on every selection change

**Total Time**: ~3 hours of debugging and iterations

**Key Insight**: Sometimes you need to try multiple approaches to find what works. Don't be afraid to pivot when something isn't working.

### Critical Lessons from Toolbar Struggle

1. **Debug visibility first, features second**
   - Get something showing with fixed position before making it smart
   - Use bright colors and borders for debugging

2. **Never destructure reactive state**
   - Always access store properties directly: `store.viewState.scale`
   - Not: `const { scale } = store.viewState`

3. **Avoid early returns in SolidJS**
   - Use `Show` component instead
   - For complex conditions, use `createMemo` + `Show`

4. **TypeScript strict mode requires component splitting**
   - Don't fight TypeScript with Show callbacks
   - Split into parent (condition check) + child (rendering) components

5. **Root-level rendering for floating UI**
   - Render at App.tsx level, not inside transformed containers
   - Prevents z-index and transform issues

6. **Test incrementally**
   - Each change should be testable
   - Don't combine multiple fixes at once


### Debugging Strategy

1. **Isolate the problem**: Is it positioning? Visibility? Reactivity?
2. **Simplify**: Remove complexity until it works, then add back incrementally
3. **Add logging**: Console logs help verify assumptions
4. **Test frequently**: Make small changes and test immediately

## Store Integration Best Practices

### Reusing Existing Actions

When building new UI for existing features:

```typescript
// ✅ Reuse store actions
onClick={() => addChildNode(el.id)}

// ❌ Don't duplicate logic
onClick={() => {
    // Reimplementing addChildNode logic here
}}
```

**Benefits**:
- Consistency across UI
- Single source of truth
- Easier maintenance
- Undo/redo works automatically

## CSS Architecture

### Keep Styles Simple Initially

Start with minimal, high-contrast styles:

```css
.toolbar {
    position: fixed;
    background: white;
    border: 2px solid #3b82f6;  /* Bright, visible border */
    z-index: 10000;
}
```

Add fancy effects (glassmorphism, animations, transforms) AFTER basic functionality works.

### Responsive Touch Targets

```css
.btn {
    width: 36px;
    height: 36px;
}

@media (max-width: 768px) {
    .btn {
        width: 44px;  /* Larger for touch */
        height: 44px;
    }
}
```

Minimum touch target size should be 44px × 44px for mobile.

## Type Safety in SolidJS

### The `!` Non-null Assertion

Use cautiously after proper checks:

```typescript
// ✅ Safe - checked in Show condition
<Show when={isMindmapNode()}>
    {() => {
        const el = selectedElement()!;  // Safe here
        // ...
    }}
</Show>
```

The `Show` component's callback guarantees `selectedElement()` exists because `isMindmapNode()` already verified it.

## Performance Considerations

### Memo vs Signal

- **`createSignal`**: For values that change frequently and trigger updates
- **`createMemo`**: For derived values that should be cached

```typescript
// Signal for user input
const [isOpen, setIsOpen] = createSignal(false);

// Memo for computed state
const isMindmapNode = createMemo(() => /* ... */);
```

## Lessons on User Feedback

### Iterate Based on Real Usage

1. Bottom sheet wasn't visible → User feedback
2. Switched to floating toolbar → User confirmed visibility
3. Positioned to right → User requested above
4. Above with early returns → User reported it disappeared
5. Final solution with Show → ✅ Working

**Insight**: User testing is essential. What seems logical in code might not work in practice.

## Common Pitfalls

### ❌ Things That Didn't Work

1. **Complex transforms on first try**: Start simple, add complexity later
2. **Platform-specific detection**: `window.innerWidth < 1024` caused issues  
3. **Early returns in SolidJS**: Breaks reactivity - ALWAYS use Show component
4. **Destructuring reactive state**: `const { x } = store.state` captures stale values
5. **Show component callbacks**: TypeScript strict mode errors - use separate components
6. **Calculating position before element exists**: Always check existence first
7. **Canvas-level rendering for floating UI**: Root-level is more reliable
8. **Assuming position will update automatically**: Must access store properties directly for reactivity

### ✅ Things That Worked Well

1. **High-contrast debugging styles**: Made issues immediately visible
2. **Console logging during development**: Verified assumptions quickly 
3. **Incremental testing**: Small changes, frequent verification
4. **Using Show component**: Proper reactive conditional rendering
5. **Reusing store actions**: Consistency and maintainability

## Architecture Decisions

### Why App.tsx for Floating UI?

Rendering floating UI at the application root provides:
- Predictable z-index stacking
- No interference from canvas transforms
- Consistent positioning calculations
- Easier to reason about

### Why Icon-Only Toolbar?

- **Compact**: Doesn't obscure content
- **Language-agnostic**: No localization needed
- **Fast to scan**: Visual recognition is quick
- **Scalable**: Works on mobile and desktop

## Future Considerations

### Potential Improvements

1. **Dynamic toolbar width calculation**: Currently hardcoded offset (90px)
2. **Smart positioning**: Reposition if toolbar goes off-screen
3. **Accessibility**: Keyboard navigation, ARIA labels
4. **Animations**: Smooth entrance/exit transitions
5. **Customization**: User preference for toolbar position

### Scaling Lessons

As features grow:
- Keep components focused and single-purpose
- Document gotchas and solutions (like this file!)
- Test on actual devices, not just emulators
- Get user feedback early and often

---

## Quick Reference

### SolidJS Conditional Rendering
```typescript
<Show when={condition()}>
    {() => <Component />}
</Show>
```

### Fixed Position Calculation
```typescript
// ❌ WRONG - Destructuring breaks reactivity
const { scale, panX } = store.viewState;
const x = elementX * scale + panX;

// ✅ CORRECT - Access directly for reactivity  
const x = () => elementX * store.viewState.scale + store.viewState.panX;
const y = () => elementY * store.viewState.scale + store.viewState.panY;

// Use with: <div style={{left: `${x()}px`, top: `${y()}px`}} />
```

### Reactive Computed Values
```typescript
const value = createMemo(() => computeFromStore());
```

### Reactive Element Tracking
```typescript
const element = createMemo(() => {
    if (store.selection.length !== 1) return null;
    return store.elements.find(e => e.id === store.selection[0]);
});

// Use in Show with accessor
<Show when={element()}>
    {(el) => <div>{el().name}</div>}
</Show>
```

### Debug First, Optimize Later
```css
/* Start with this */
border: 2px solid red;
background: white;

/* Add this after it works */
backdrop-filter: blur(8px);
box-shadow: 0 4px 12px rgba(0,0,0,0.1);
```

---

## Performance Optimization: RoughJS Instance Management

### Critical: Reuse RoughJS Canvas Instances

**Problem**: Creating a new `rough.canvas()` instance for every layer on every render frame causes severe garbage collection pressure and memory leaks.

```typescript
// ❌ WRONG - Creates 300 instances/second with 5 layers at 60 FPS
sortedLayers.forEach(layer => {
    const rc = rough.canvas(canvasRef);  // NEW INSTANCE EVERY ITERATION!
    layerElements.forEach(el => {
        renderElement(rc, ctx, el, isDarkMode, layerOpacity);
    });
});
```

**Solution**: Create the RoughJS instance once per render frame and reuse it across all layers:

```typescript
// ✅ CORRECT - Creates 60 instances/second at 60 FPS
const rc = rough.canvas(canvasRef);  // ONCE per render frame

sortedLayers.forEach(layer => {
    layerElements.forEach(el => {
        renderElement(rc, ctx, el, isDarkMode, layerOpacity);
    });
});
```

**Impact**:
- **Before**: 5 layers × 60 FPS = 300 new instances/second
- **After**: 1 × 60 FPS = 60 new instances/second
- **Reduction**: 80% fewer object allocations, significantly reduced GC pressure

**Why**: RoughJS canvas instances are expensive to create. Creating them in tight loops causes unnecessary memory allocation and forces frequent garbage collection, leading to frame drops and stuttering. Reusing a single instance per frame eliminates this overhead while maintaining the same visual output.

**Location**: [canvas.tsx:322-323](src/components/canvas.tsx#L322-L323)

---

## SVG Icon Rendering Issues

### Critical: Explicit SVG Styling for Icon Visibility

**Problem**: SVG icons from libraries like lucide-solid may not render properly in certain contexts (dropdowns, overlays, absolute positioned elements) without explicit styling.

```css
/* ❌ WRONG - Icons may not appear */
.button {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #374151;
}
/* No explicit SVG styling */
```

**Solution**: Always add explicit SVG styling to ensure icons inherit proper display and color properties:

```css
/* ✅ CORRECT - Ensures icons are visible */
.button {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #374151;
}

.button svg {
    display: block;          /* Prevent inline spacing issues */
    stroke: currentColor;    /* Inherit parent color */
    fill: none;             /* For stroke-based icons */
    pointer-events: none;   /* Prevent SVG from blocking clicks */
}
```

**Why This Happens**:
- SVG elements have default `display: inline` which can cause alignment issues
- `currentColor` may not inherit properly without explicit `stroke` declaration
- Pointer events on SVG can interfere with button click handlers
- Absolutely positioned containers may not inherit styles correctly

**Common Symptoms**:
- Icons visible in main UI but invisible in dropdowns
- Icons show in light mode but not dark mode (or vice versa)
- Icon hitbox blocking button clicks
- Inconsistent icon sizes across similar components

**Best Practice**: Add SVG styling to all button/icon container classes:
```css
.toolbar-btn svg,
.layout-btn svg,
.menu-item svg {
    display: block;
    stroke: currentColor;
    fill: none;
    pointer-events: none;
}
```

**Location**: [mindmap-action-toolbar.css:63-68, 130-137](src/components/mindmap-action-toolbar.css)

---

## TypeScript Type Constraints in Store State

### Critical: Union Types Must Include All Valid Values

**Problem**: When adding new element types to a tool group, forgetting to update the corresponding union type in the store breaks tool selection.

```typescript
// ❌ WRONG - Missing new types causes runtime failures
type AppState = {
    selectedTechnicalType: 'dfdProcess' | 'dfdDataStore' | 'isometricCube' | 'cylinder';
    // Added 5 new shapes but forgot to update this type!
}

// Component tries to set 'stateStart' but TypeScript prevents it
setSelectedTechnicalType('stateStart');  // Type error or silent failure
```

**Solution**: Always update union types when adding new variants:

```typescript
// ✅ CORRECT - All valid values included
type AppState = {
    selectedTechnicalType: 
        | 'dfdProcess' 
        | 'dfdDataStore' 
        | 'isometricCube' 
        | 'cylinder'
        | 'stateStart'      // New
        | 'stateEnd'        // New
        | 'stateSync'       // New
        | 'activationBar'   // New
        | 'externalEntity'; // New
}
```

**Why This Breaks**: TypeScript's type checking prevents assignment of values not in the union. If the store action has a type constraint, setting an unlisted value will either:
1. Fail at compile time (if strict)
2. Silently fail at runtime (if type is cast with `as any`)
3. Cause the UI component to malfunction

**Debugging Tip**: If a tool group dropdown stops working after adding new tools, check the store's type definition for the selection state.

**Location**: This issue occurred in `src/store/app-store.ts` when implementing technical shapes.

---

## SVG Path Coordinate Systems

### Critical: Understand Centered vs Absolute Coordinates

**Problem**: SVG path definitions must use the correct coordinate system. Mixing centered (0,0 at shape center) with absolute coordinates causes shapes to render incorrectly or not at all.

```typescript
// ❌ WRONG - Inconsistent coordinate usage
case 'heart':
    // Uses 0 for center but mh (a variable) for bottom
    return { type: 'path', path: `M 0 ${y + h * 0.3} ... ${mh} ...` };

case 'ribbon':
    // References undefined variable mh instead of calculating y + h/2
    return { type: 'path', path: `... L ${x + w} ${mh} ...` };
```

**Solution**: Understand your coordinate system and use it consistently:

```typescript
// ✅ CORRECT - Consistent centered coordinate system
// In shape-geometry.ts, all shapes use:
const x = -mw;  // mw = width / 2
const y = -mh;  // mh = height / 2
// So (0, 0) is the center of the shape

case 'heart':
    // Bottom point should be y + h (not mh which is y + h/2)
    return { type: 'path', path: `M ${0} ${y + h * 0.3} ... ${0} ${y + h} ...` };

case 'ribbon':
    // Middle point should be calculated as y + h/2
    return { type: 'path', path: `... L ${x + w} ${y + h / 2} ...` };
```

**Key Insight**: 
- `mh` and `mw` are **half** the dimensions, used to center the coordinate system
- `x = -mw` and `y = -mh` set the top-left corner
- Center point is `(0, 0)`
- Bottom-right is `(x + w, y + h)` which equals `(mw, mh)`

**Common Mistakes**:
1. Using `mh` when you mean `y + h` (full height vs half height)
2. Mixing absolute screen coordinates with shape-relative coordinates
3. Forgetting that `x` and `y` are negative offsets from center

**Debugging**: If a shape doesn't appear:
1. Check if path coordinates are using the right reference point
2. Verify all variables (like `mh`) are defined and used correctly
3. Test with simple absolute values first, then convert to relative

---

## Summary: The Most Important Lessons

1. **Never use early returns in SolidJS** - Use `Show` component
2. **Never destructure reactive state** - Access properties directly
3. **Use createMemo for derived state** - Cache computed values
4. **Debug with fixed positioning first** - Get it visible before making it smart
5. **Split components for TypeScript** - Avoid Show callback errors
6. **Render floating UI at app root** - Avoid transform/z-index issues
7. **Test incrementally** - Small changes, frequent testing
8. **User feedback is invaluable** - What works in code may not work in practice
9. **Update union types when adding variants** - TypeScript constraints must match runtime values
10. **Understand coordinate systems** - SVG paths need consistent reference points

---

## Document Type Persistence Bug Fix

### Problem: docType Not Saved/Loaded Correctly

**Symptom**: When loading a saved document, the canvas type (infinite vs slides) would always default to 'infinite', ignoring the saved value.

**Root Cause**: Multiple issues in the document versioning system:

1. **Version detection bug**: `isSlideDocument()` only checked for `version === 3`, missing v4 documents
2. **Default fallback bug**: `loadDocument()` defaulted to `'infinite'` for all documents with missing `docType`
3. **Version-unaware defaults**: v3 documents (which are inherently slide-based) were defaulting to 'infinite'

**The Fix**:

```typescript
// ❌ WRONG - Only checks v3
export const isSlideDocument = (data: any): data is SlideDocument => {
    return data && data.version === 3 && Array.isArray(data.slides);
};

// ❌ WRONG - Defaults to 'infinite' for all missing docType
const loadedDocType = doc.metadata?.docType || 'infinite';
```

```typescript
// ✅ CORRECT - Checks v3 and v4
export const isSlideDocument = (data: any): data is SlideDocument => {
    return data && (data.version === 3 || data.version === 4) && Array.isArray(data.slides);
};

// ✅ CORRECT - Version-aware defaults
const loadedDocType = doc.metadata?.docType || (doc.version >= 3 ? 'slides' : 'infinite');
```

**Key Insight**: When adding new document versions, ensure:
1. All version checks include the new version
2. Default values are appropriate for each version's context
3. v3+ documents are slide-based by design, so default to 'slides'
4. v1/v2 legacy documents predate slides, so default to 'infinite'

**Files Modified**:
- `src/utils/migration.ts` - Fixed `isSlideDocument()` to recognize v4
- `src/store/app-store.ts` - Fixed `loadDocument()` defaults

---

## Performance: Laser Pointer Optimization

### Problem: Laggy, Stuttering Laser Trail

**Symptoms**:
- Laser pointer trail would stutter and lag behind cursor
- Frame drops during drawing
- High memory usage during long drawing sessions

**Root Causes**:

1. **Reactive signal overhead**: Using `createSignal` for high-frequency updates
2. **Array spread on every mouse move**: `[...prev, newPoint]` creates new arrays constantly
3. **RAF stacking**: Multiple `requestAnimationFrame(draw)` calls accumulating
4. **Per-segment shadow blur**: Expensive canvas operations on each segment
5. **Decay logic triggering redraws**: Filtering inside `draw()` triggered reactive updates

**The Fix**:

```typescript
// ❌ WRONG - Reactive signal + array spread + RAF stacking
const [laserTrail, setLaserTrail] = createSignal<Point[]>([]);

// In mousemove:
setLaserTrail(prev => [...prev.slice(-50), { x, y, timestamp: Date.now() }]);
requestAnimationFrame(draw);  // Can stack up!

// In draw():
const filtered = laserTrail().filter(p => now - p.timestamp < DECAY);
if (filtered.length !== laserTrail().length) {
    setLaserTrail(filtered);  // Triggers another redraw!
}
```

```typescript
// ✅ CORRECT - Mutable array + throttling + RAF deduplication
let laserTrailData: Point[] = [];
let laserRafPending = false;
let lastLaserUpdateTime = 0;
const LASER_THROTTLE_MS = 8;  // ~120fps

// In mousemove:
const now = Date.now();
if (now - lastLaserUpdateTime >= LASER_THROTTLE_MS) {
    lastLaserUpdateTime = now;
    if (laserTrailData.length >= MAX_POINTS) laserTrailData.shift();
    laserTrailData.push({ x, y, timestamp: now });

    if (!laserRafPending) {
        laserRafPending = true;
        requestAnimationFrame(() => {
            laserRafPending = false;
            draw();
        });
    }
}

// In draw() - filter in place:
let writeIdx = 0;
for (let i = 0; i < laserTrailData.length; i++) {
    if (now - laserTrailData[i].timestamp < DECAY) {
        laserTrailData[writeIdx++] = laserTrailData[i];
    }
}
laserTrailData.length = writeIdx;
```

**Rendering Optimization**:
```typescript
// ❌ WRONG - Per-segment shadow + individual strokes
for (let i = 0; i < trail.length - 1; i++) {
    ctx.beginPath();
    ctx.shadowBlur = 10 * opacity;  // Expensive!
    ctx.stroke();  // Many draw calls
}

// ✅ CORRECT - Single shadow + batched strokes by opacity band
ctx.shadowBlur = 8;  // Once
const band = Math.ceil(opacity * 5);
if (band !== currentBand) {
    ctx.stroke();  // Finish previous batch
    ctx.beginPath();
    currentBand = band;
}
ctx.lineTo(p2.x, p2.y);  // Accumulate
```

**Performance Gains**:
- 80%+ reduction in object allocations
- No RAF stacking (single pending request)
- 5x fewer `stroke()` calls via batching
- Eliminated reactive feedback loop

**Files Modified**: `src/components/canvas.tsx`

---

## Performance: Pen/Ink Tool Optimization

### Problem: Laggy Drawing for All Pen Tools

**Symptoms**:
- Fineliner, inkbrush, marker, and ink overlay tools would lag
- Visible delay between cursor and stroke
- High CPU usage during drawing

**Root Causes**:

1. **Element lookup on every mouse move**: `store.elements.find(e => e.id === currentId)`
2. **Array spread on every point**: `[...el.points, px, py]`
3. **Store update on every mouse event**: Reactive overhead at 100+ events/second

**The Fix**:

```typescript
// ❌ WRONG - Find + spread + update on every mouse move
if (store.selectedTool === 'fineliner') {
    const el = store.elements.find(e => e.id === currentId);  // O(n) lookup
    const newPoints = [...(el.points as number[]), px, py];   // New array
    updateElement(currentId, { points: newPoints }, false);   // Store update
}
```

```typescript
// ✅ CORRECT - Local buffer + throttled flush
let penPointsBuffer: number[] = [];
let lastPenUpdateTime = 0;
const PEN_UPDATE_THROTTLE_MS = 16;  // ~60fps

const flushPenPoints = () => {
    if (!currentId || penPointsBuffer.length === 0) return;
    const el = store.elements.find(e => e.id === currentId);
    if (el && el.points) {
        const newPoints = [...el.points, ...penPointsBuffer];
        updateElement(currentId, { points: newPoints }, false);
        penPointsBuffer = [];
    }
};

// In mousemove:
if (isPenTool(store.selectedTool)) {
    penPointsBuffer.push(px, py);  // Local accumulation

    const now = Date.now();
    if (now - lastPenUpdateTime >= PEN_UPDATE_THROTTLE_MS) {
        lastPenUpdateTime = now;
        flushPenPoints();
    } else if (!penUpdatePending) {
        penUpdatePending = true;
        requestAnimationFrame(() => {
            penUpdatePending = false;
            flushPenPoints();
        });
    }
}

// On pointerup - flush remaining points:
flushPenPoints();
```

**Key Points**:
1. Buffer points locally (mutable array, no allocations)
2. Throttle store updates to ~60fps
3. Always flush on pointer up before normalization
4. Clear buffer when starting a new stroke

**Performance Gains**:
- Reduced store updates from 100+/s to ~60/s
- Eliminated per-move array allocations
- Smoother visual feedback with RAF scheduling

**Files Modified**: `src/components/canvas.tsx`

---

## Summary: High-Frequency Input Optimization Pattern

When handling high-frequency input (mouse/touch events at 100+ Hz):

### 1. Avoid Reactive State for Transient Data
```typescript
// ❌ Signal for every update
const [trail, setTrail] = createSignal([]);

// ✅ Mutable array for transient data
let trailData: Point[] = [];
```

### 2. Throttle Updates
```typescript
const THROTTLE_MS = 16;  // ~60fps
let lastUpdate = 0;

if (Date.now() - lastUpdate >= THROTTLE_MS) {
    lastUpdate = Date.now();
    // Perform update
}
```

### 3. Prevent RAF Stacking
```typescript
let rafPending = false;

if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => {
        rafPending = false;
        // Render
    });
}
```

### 4. Buffer and Batch
```typescript
let buffer: number[] = [];

// Accumulate locally
buffer.push(x, y);

// Flush periodically or on completion
const flush = () => {
    if (buffer.length === 0) return;
    commitToStore(buffer);
    buffer = [];
};
```

### 5. Filter In-Place
```typescript
// ❌ Creates new array
const filtered = arr.filter(condition);

// ✅ Filter in place
let writeIdx = 0;
for (let i = 0; i < arr.length; i++) {
    if (condition(arr[i])) arr[writeIdx++] = arr[i];
}
arr.length = writeIdx;
```

### 6. Batch Canvas Operations
```typescript
// ❌ Many draw calls
for (const segment of segments) {
    ctx.beginPath();
    ctx.stroke();
}

// ✅ Batch by similar state
ctx.beginPath();
for (const segment of segments) {
    ctx.lineTo(segment.x, segment.y);
}
ctx.stroke();
```

---

## Pen Rendering & Smoothing

### High-Fidelity Freehand Strokes

**Problem**: Raw pointer points often contain jitter and "aliasing" artifacts, especially on lower-end devices or when drawing quickly.

**Solution**: Implement a moving-average filter and dynamic tapering logic in the `FreehandRenderer`.

```typescript
// Smoothing helper
private smoothPoints(pts: any[], intensity: number): any[] {
    if (pts.length < 3) return pts;
    const smoothed = [pts[0]];
    const windowSize = Math.floor(intensity / 2) || 1;
    
    for (let i = 1; i < pts.length - 1; i++) {
        let sumX = 0, sumY = 0, count = 0;
        for (let j = Math.max(0, i - windowSize); j <= Math.min(pts.length - 1, i + windowSize); j++) {
            sumX += pts[j].x;
            sumY += pts[j].y;
            count++;
        }
        smoothed.push({ x: sumX / count, y: sumY / count });
    }
    smoothed.push(pts[pts.length - 1]);
    return smoothed;
}
```

**Key Insights**:
1. **Adaptive Smoothing**: Allowing users to control the window size for the moving average via a `smoothing` property (0-20) provides a balance between responsiveness and neatness.
2. **Velocity Normalization**: In `renderInkbrush`, calculating velocity per segment and normalizing by the `maxVelocity` of the entire stroke ensures that the thickness variation is consistent within a single draw action.
3. **Proportional Tapering**: Scaling the taper length (`taperLength`) as a percentage of the total number of points in the stroke (using a configurable `taperAmount`) results in more natural-looking ends for both short flicks and long lines.
4. **Speed Sensitivity**: The `velocitySensitivity` property allows for a wide range of artistic styles—from uniform technical lines to highly dynamic calligraphy.

**Impact**: Significant improvement in the professional feel of the pen tools, correcting for hardware jitter and providing an expressive, hand-drawn aesthetic.

**Location**: `src/shapes/renderers/freehand-renderer.ts`

---

### Canvas globalAlpha vs layerOpacity for Element Dimming

**Problem**: Setting `ctx.globalAlpha` before rendering an element has no effect because `RenderPipeline.applyTransformations()` calls `ctx.save()` and then overwrites `globalAlpha` with `(el.opacity / 100) * layerOpacity`. Any value set externally is discarded.

**Solution**: Pass the dimming factor through the `layerOpacity` parameter instead. For focus mode dimming:
```typescript
const isFocusDimmed = focusBranchIds && focusBranchIds.size > 0 && !focusBranchIds.has(el.id);
const layerOpacity = (layer?.opacity ?? 1) * (isFocusDimmed ? 0.12 : 1);
```

**Key Insight**: In canvas rendering pipelines that use `ctx.save()`/`ctx.restore()`, any state set outside the save/restore pair will be overwritten. Always pass opacity multipliers through the pipeline's own parameters.

**Also**: When dimming elements, skip the rough.js drawable cache (`shouldCache = false`) since cached renders won't reflect the opacity change.

**Location**: `src/utils/canvas-renderer.ts`, `src/shapes/base/render-pipeline.ts`

## Table-Specific Animation Presets (2026-02-08)

### Animation Progress Pattern for Complex Renderers
When a shape has its own complex renderer (like tables with 3 phases: backgrounds, grid, text), the generic `drawProgress` approach from ShapeRenderer doesn't apply. Instead, add shape-specific properties (`tableAnimProgress`, `tableAnimStyle`) and handle them in the shape's renderer. This follows the same `0→100` progress pattern but with custom per-cell alpha logic.

### Per-Cell Alpha for Partial Reveals
For reveal animations (row-by-row, column-by-column, cell-by-cell), compute a per-cell alpha value (0-1) based on progress and apply it via `ctx.globalAlpha` in each render phase. Grid lines between cells should use `max(adjacentCellAlphas)` to appear as soon as either neighbor is visible.

### Deterministic Pseudo-Random for Consistent Animations
For randomized animations like heatmap fade-in, use deterministic pseudo-random based on the element's seed + cell position: `Math.sin(seed * 127.1 + row * 311.7 + col * 74.7)`. This ensures the same pattern on every re-render during animation.

### Separate Render Methods for Complex Animation Styles
For animations that need fundamentally different rendering order (gridDraw: border→lines→bg→text, headerSlam: header bounce + body fade), create dedicated private render methods rather than trying to parameterize the single render path. This keeps each animation self-contained and readable.

### Per-Cell Transform Animations (Cells Assemble)
For animations where individual cells fly/move independently, use `ctx.save()` + `ctx.translate()` + `ctx.rotate()` per cell with deterministic random start positions. Stagger delays (0-35% of duration) create a natural wave effect. Draw individual cell borders during flight so cells are visible as standalone units, then fade in the full grid at the end (75%+).

### Canvas Clip Paths for Split Effects (Lightning Split)
Use `ctx.clip()` with irregular paths (zigzag/lightning bolt) to render the same table content twice — once for each half. Phase the halves approaching from opposite sides, add a lightning bolt rendered as dual-layer glow (blue + white core with `shadowBlur`), and a brief screen flash overlay for dramatic impact.

**Location**: `src/shapes/renderers/table-renderer.ts`, `src/utils/animation/element-animator.ts`

## SolidJS Reactivity: Avoid Repeated Memo Calls in Show Conditions (2026-02-08)

### Problem: Repeated `createMemo()` calls across `<Show>` blocks
When a `createMemo` value (e.g., `activeTarget()`) is called in many independent `<Show when={...}>` conditions, store updates between evaluations can cause different Show blocks to see inconsistent states. This results in intermittent UI elements not rendering — fixed by page refresh (which recomputes all memos fresh).

### Solution: Derived memos for frequently checked values
Create stable derived memos (`targetType`, `isElement`, `targetElementId`) that each call the parent memo once, then use these in Show conditions. This ensures all Show blocks react to the same consistent snapshot. Also, plain functions like `() => store.elements.find(...)` should be `createMemo()` for proper SolidJS dependency tracking.

**Location**: `src/components/property-panel.tsx`

## Table Keyboard Navigation Architecture (2026-02-08)

### Bridging Canvas Signals to Global Key Handler
Canvas-local signals (`tableCellSelectionSignal`, `tableEditingCell`, `editingId`) live inside `canvas.tsx` with no export path, but `app.tsx`'s global `handleKeyDown` needs to read/write them. Solution: register a `(window as any).__tableCellNav` interface object in `onMount()` following the existing `triggerImageUpload` pattern. This exposes `getCellSelection`, `setCellSelection`, `startEditingCell`, and `isEditingTableCell` functions.

### Context-Aware Key Interception
Table cell navigation keys (Arrow, Tab, Enter, Delete, printable chars) must be intercepted BEFORE existing handlers in `app.tsx` (which would nudge elements, switch tools, or delete the table). The interception block checks: (1) `__tableCellNav` exists, (2) not currently editing a cell, (3) table has an active cell selection, (4) selected element is a table. Only then does it handle the key and return early.

### Two Key Handling Domains
During cell editing, the textarea is focused so `isInputFocused` returns early in `app.tsx` — only the overlay's own `onKeyDown` fires (handles Tab→next cell, Enter→move down). When NOT editing, the global handler in `app.tsx` handles the same keys differently (Arrow→move selection, Enter→start editing, Delete→clear content).

**Location**: `src/app.tsx`, `src/components/canvas.tsx`, `src/components/text-editing-overlay.tsx`, `src/utils/table-utils.ts`

## BPMN 2.0 Shape Library Architecture (2026-02-11)

### Shape Registration Pipeline for New Shape Categories
Adding a new shape category (like BPMN) requires touching ~12 files in a specific order:
1. `types.ts` — add types to `ElementType` union + new optional properties to `DrawingElement`
2. `shape-geometry.ts` — add geometry cases (local coords centered at 0,0, NOT using cx/cy)
3. New renderer file (e.g., `bpmn-renderer.ts`) — extends `ShapeRenderer` with `renderArchitectural()`, `renderSketch()`, `definePath()`
4. `register-shapes.ts` — register all types with the renderer
5. `hit-testing.ts` — add types to bounding-box fallback block
6. `anchor-points.ts` — add types to cardinal-anchor block
7. `text-editing-handler.ts` — add types to `shapeTypes` array
8. `properties.ts` — add to existing `applicableTo` arrays + new property configs
9. `app-store.ts` — add selectedType state + setter
10. New toolbar component (e.g., `bpmn-tool-group.tsx`) — SVG icons + dropdown
11. `toolbar.tsx` — integrate the new tool group
12. `api.ts` — add convenience create method + option types
13. `draw-handler.ts` — add to `SOLID_STROKE_SHAPES` and `NORMALIZABLE_SHAPES`
14. `canvas.tsx` — add new properties to reactive tracking loop in `createEffect`
15. `rough-cache.ts` — add new properties to `computeElementHash`

### RoughJS Cache Hash Must Include All Visual Properties
The `computeElementHash` function in `rough-cache.ts` determines whether cached RoughJS drawables are reused. If a property affects visual rendering but isn't in the hash, changing that property won't invalidate the cache, causing stale renders. Always add new visual properties to the hash.

## Raylib Renderer in Rust — Cross-Language Rendering (2026-02-14)

### Rust Lifetime Separation for Raylib Draw Handles
**Problem**: `RaylibRenderer<'d>` with `d: &'d mut RaylibDrawHandle<'d>` (same lifetime) causes the borrow to extend to struct drop, preventing any further use of the draw handle.
**Solution**: Use three separate lifetimes: `RaylibRenderer<'d, 'h, 'r>` where `d: &'d mut RaylibDrawHandle<'h>` separates the reference lifetime from the handle's inner lifetime. This lets the renderer be dropped and the draw handle reused (e.g., for HUD overlay drawing).

### raylib-rs API Differs from C Raylib
- `draw_rectangle_rounded_lines` in raylib-rs v5.x takes 4 args (no separate line width), not 5 like C Raylib. Use manual path-based stroke for rounded rect outlines.
- `measure_text_ex` is not a free function — it's `font.measure_text(text, font_size, spacing)` via the `RaylibFont` trait.
- `rl.get_font_default()` returns `WeakFont`, not `Font`. All function signatures must use `&WeakFont`.

### Bindgen stdarg.h Fix for Clang on Linux
Clang's bundled include directory may not have `stdarg.h`, causing `raylib-sys` bindgen to fail. Fix: create `.cargo/config.toml` with `BINDGEN_EXTRA_CLANG_ARGS = "-I/usr/lib/gcc/x86_64-linux-gnu/13/include"` to point bindgen at GCC's headers. This makes the fix permanent across sessions.

### Manual Transform Stack for Stateless Renderers
Raylib has no `save()`/`restore()` state stack. Implement manually with `Vec<Transform2D>` where `Transform2D` is a 2D affine matrix (a, b, c, d, tx, ty). Each point is transformed via `transform_point()` before drawing. Push/pop the stack on save/restore. This approach works for any stateless rendering backend.

### Bezier Curve Flattening via De Casteljau
Raylib has no native filled bezier paths. Flatten cubic beziers to line segments using recursive De Casteljau subdivision: split the curve at the midpoint, check if the control points are close enough to the line between endpoints (flatness threshold), recurse if not flat enough. Typically produces 20-50 line segments per curve with a flatness of 0.5.

### .yappy File Format is Gzipped JSON
The `.yappy` format is gzip-compressed JSON (v4). Use `flate2::read::GzDecoder` in Rust. Fall back to plain JSON parsing if gzip decompression fails — older files or debug exports may be uncompressed.

### serde flatten for Forward Compatibility
Use `#[serde(flatten)] pub extra: HashMap<String, serde_json::Value>` on Rust structs to capture unknown JSON fields without failing deserialization. This lets the Rust renderer load .yappy files with newer properties it doesn't yet support, rather than erroring on unknown fields.

### Folder Structure for Multi-Language Renderers
Structure as `renderers/<backend>/<language>/` (e.g., `renderers/raylib/rust/`) to support future implementations in Zig, C#, etc. under the same backend folder. Each language subfolder is an independent project with its own build system.

### Shape Geometry Uses Local Coordinates (Center = 0,0)
All geometry in `getShapeGeometry()` uses local coordinates where the center is at (0,0). Use `mw = w/2`, `mh = h/2`, `x = -mw`, `y = -mh`. Never reference `cx`/`cy` — those don't exist in this scope.

### PropertyConfig Type Must Use 'toggle' Not 'boolean'
The `PropertyConfig` interface only accepts specific `type` values: `'color' | 'slider' | 'select' | 'toggle' | 'input' | 'number' | 'textarea'`. Boolean properties must use `type: 'toggle'`, not `type: 'boolean'`.

### SolidJS Reactive Tracking for Custom Properties
Canvas `createEffect` in `canvas.tsx` must explicitly access element properties (e.g., `e.bpmnEventType; e.bpmnTaskType;`) for SolidJS to track them as reactive dependencies. Without explicit access, property changes won't trigger canvas redraws.

### Dual Render Mode Pattern for Markers/Icons
BPMN marker methods (`renderEventIcon`, `renderGatewayMarker`, `renderTaskMarker`, `renderLoopMarker`) use raw Canvas 2D API with `ctx.save()`/`ctx.restore()`, making them work identically in both `renderArchitectural()` and `renderSketch()` modes. This avoids duplicating icon rendering logic for RoughJS.

**Location**: `src/shapes/renderers/bpmn-renderer.ts`, `src/utils/rough-cache.ts`, `src/utils/shape-geometry.ts`, `src/config/properties.ts`

### Animation State Capture for Presentation Mode
Presentation animations directly mutate element store properties (x, y, angle, opacity, etc.) via `updateElement()`. The `slideBuildManager.restoreAll()` only restores `startHidden` element opacities — it does NOT restore other animated properties or stop running animations. To cleanly exit presentation mode: (1) capture all animatable properties before entering, (2) call `slideBuildManager.reset()` on exit to stop all animations, (3) restore the captured snapshot.

**Location**: `src/store/app-store.ts`, `src/utils/animation/slide-build-manager.ts`

### Slide Operations Must Save Active Slide State
All slide operations that modify the slide array must call `saveActiveSlide()` before mutating, to persist the current slide's background, dimensions, and thumbnail. They should also call `pushToHistory()` for undo support. When deleting the active slide, `setActiveSlide(nextIndex)` returns early if `nextIndex === store.activeSlideIndex`, so the active index must be temporarily invalidated (set to -1) first.

**Location**: `src/store/app-store.ts`

### Color Palette Resolution in ColorControl (2026-05-12)
`ColorControl` in `src/components/property-panel.tsx` resolves swatches in this order: per-control local override signal (transient UI state) → `store.globalSettings.colorPalette` → `'default'`. Palettes are pure UI affordances — they only swap which swatches are *displayed*. The stored value on a shape is still the hex/CSS color string the user clicks, so palette switching never retro-colors existing elements. Color properties that define their own `prop.options` (e.g., specialized color presets) keep using those instead of the palette. The active palette ID is persisted via `localStorage('colorPalette')` inside `updateGlobalSettings`, plus carried in the saved doc through `globalSettings`.

**Location**: `src/config/color-palettes.ts`, `src/components/property-panel.tsx`, `src/store/app-store.ts`

### Global Palette Modifier-Based Stroke/Fill (2026-05-27)
The global palette popover (`ColorPalettePicker`) interprets swatch clicks via a Shift modifier: **plain click = stroke**, **Shift+click = fill**. Drag-and-drop is unchanged. Each click both (a) updates the corresponding key in `store.defaultElementStyles` via `updateDefaultStyles()` — which persists `strokeColor`/`backgroundColor` to `localStorage('defaultElementStyles')` — and (b) applies the color to the current selection (or the slide background for fill mode in slides docs). Images bypass the modifier and always behave as fill (no stroke equivalent). The palette button in `menu.tsx` shows a small color dot indicating the currently armed stroke color, sourced reactively from `store.defaultElementStyles.strokeColor`. Why modifier-based instead of selection-based: keeps the gesture's meaning stable regardless of whether anything is selected, so users can pre-arm a color without first deselecting.

**Location**: `src/components/p3-color-picker.tsx`, `src/components/menu.tsx`, `src/store/app-store.ts` (`updateDefaultStyles`)

### Pinnable Color Palette Popover (2026-05-27)
The palette popover can be pinned via a Pin/PinOff toggle next to the PALETTE dropdown. Pin state lives in a module-level signal in `p3-color-picker.tsx` (`isPalettePinned`, `setPalettePinned`) and persists to `localStorage('palettePinned')`. Why module-level instead of `store.globalSettings`: pin is a UI/workspace preference, not part of the saved doc — `globalSettings.colorPalette` is per-doc and gets serialized with the file, but pin should follow the user across docs. `menu.tsx` reads `isPalettePinned()` in two places: (a) initializes `isPalettePickerOpen` from it so the popover auto-opens on app load when pinned, and (b) gates the `clickOutside` binding on `!isPalettePinned()` so outside clicks are ignored while pinned. A global `keydown` listener closes the popover on `Esc` regardless of pin state (without flipping the pin) — first `Esc` closes the popover, the user reopens via the palette button when needed; this keeps pinning a persistent preference rather than a single-session toggle.

**Location**: `src/components/p3-color-picker.tsx`, `src/components/menu.tsx`

### Repo Map Auto-Refresh via Git Hook (2026-06-04)
The `.repograph/` map (`index.txt` terse index, `map.md` human-readable, `graph.json` cache) is kept in sync by a tracked `.githooks/pre-commit` hook that runs `scripts/repograph-refresh.sh` and `git add`s `.repograph/` before each commit. The map generator is the `repograph` CLI, pulled in as a devDependency from `github:algorisys-oss/repograph` (the tool is a zero-dep Python single-file script wrapped in a tiny npm bin shim, `bin/repograph.js`, that spawns `python3`). So it works for anyone after `npm install` — no machine-specific path. The refresh script resolves `node_modules/.bin/repograph` by default (override with `REPOGRAPH=/path/to/executable`) and no-ops (exit 0) when the CLI isn't installed, so the hook never blocks a commit on a fresh clone. The hook is opt-in per clone: `.githooks/pre-commit` is committed, but `git config core.hooksPath .githooks` is local to each clone's `.git/config` and must be re-run after cloning. Manual refresh: `npm run repograph`. Map include-scope is `frontend/ backend/ renderers/ tests/ scripts/ examples/` (recursive). CLAUDE.md points Claude sessions to read the map before grepping. Note: the dep is pinned to a commit SHA; bump it (or switch to a `#vX.Y.Z` tag) to take repograph updates.

**Location**: `.githooks/pre-commit`, `scripts/repograph-refresh.sh`, `package.json`, `CLAUDE.md`

### Image Fill for Shapes — Clip-to-Outline (2026-06-11)
Any fillable shape (circle, rectangle, polygon, star, etc.) can now be filled with an image that is clipped to the shape outline via `fillStyle: 'image'` plus `backgroundImage` (URL or data URL), `backgroundImageFit` (`'cover'` default | `'contain'` | `'fill'`/stretch | `'tile'`), and `backgroundOpacity`. Previously the `'image'` fill option existed in the dropdown but was a dead end — it only worked for *slide* backgrounds (`canvas-renderer.ts`), the URL input was slide-only, and `RenderPipeline.applyComplexFills` handled only gradients/dots. Implementation seam: `applyComplexFills` runs in a coordinate space already translated to the shape center, so the new `applyImageFill` clips to `getShapeGeometry(el)` (centered at origin) then `drawImage` with cover/contain math (mirroring the slide cover-fit). Key gotcha: `renderGeometry` for `type: 'path'` calls `fillPath` which *immediately fills* (can't be used to build a clip region), so a new `clipPath(svgPath)` was added to `IRenderer`/`CanvasRenderer` (`ctx.clip(new Path2D(...))`) and `applyImageFill` branches on geometry type. `buildRenderOptions` adds `'image'` to its complex-fill list so RoughJS doesn't paint `backgroundColor` over the image (stroke still renders on top, since `applyComplexFills` runs before the architectural/sketch pass). Loading is async via the shared `image-cache.getImage` — it returns null and triggers a redraw on load, so `applyImageFill` no-ops gracefully until the image is ready. UI: a new `'image-upload'` PropertyConfig control (file picker + URL paste + preview, in `property-panel.tsx`) drives `backgroundImage`; the giant shape list shared by `fillStyle` and the image controls was extracted to `FILLABLE_TARGETS` in `properties.ts` to keep them in sync. Drag-dropping an image onto a shape now fills it (`updateElement(id, { fillStyle: 'image', backgroundImage })`) instead of replacing the shape with a standalone image element — except when the drop target is already an `image` element (swaps its `dataURL`) or a 3D shape (falls back to replace-with-image, since image fill can't render there). 3D shapes (`solidBlock`, `cylinder`, `isometricCube`, `perspectiveBlock`, `openBox`) are skipped by `applyComplexFills` (they paint gradients per-face and have no per-face image path), so the **Image** fill option and its controls are hidden for them via `IMAGE_FILL_EXCLUDED` / `IMAGE_FILL_TARGETS` in `properties.ts` — keep that list in sync with the `is3D` array in `shape-renderer.ts`. (Gradients still show for 3D shapes because they *are* handled per-face.)

**Location**: `src/types.ts`, `src/shapes/base/render-pipeline.ts` (`applyImageFill`), `src/shapes/base/shape-renderer.ts`, `src/rendering/IRenderer.ts` + `CanvasRenderer.ts` (`clipPath`), `src/config/properties.ts` (`FILLABLE_TARGETS`), `src/components/property-panel.tsx` (`image-upload`), `src/utils/tool-handlers/canvas-event-handlers.ts`, `src/api.ts`

### Partial Erase for Any Shape — Non-Destructive Erase Mask (2026-06-12)
The eraser can now partially erase *any* shape (rectangle, circle, polygon, image, text, table…), not just freehand strokes. The key design decision: **don't convert the shape to points** (which would destroy its type/identity). Instead, each shape carries an optional `eraseStrokes: { points: number[]; radius: number }[]` field (`types.ts`) — points are element-local (relative to `x/y`, in the unrotated/unscaled frame, flat-encoded), radius in world units. The shape stays a rectangle: still resizable, recolorable, fully editable; erasing is reversible (undo, or clearing the mask). Freehand types keep the old destructive `splitFreehandStroke` behavior; connectors (line/arrow/bezier/organicBranch) still whole-delete; everything else accumulates a mask stroke.

**Why an offscreen layer + `destination-out`, not a clip:** to erase fill *and* stroke at once ("smart" erase) you composite `globalCompositeOperation='destination-out'` over the rendered pixels. But that removes whatever alpha is already on the target — run directly on the main canvas it would erase the grid and elements behind the shape. So `erase-mask.ts` renders the single element into a pooled, element-sized **offscreen** canvas (with its own `rough.canvas` for sketch shapes), punches holes there, then blits the masked result back. Overlapping eraser dabs compose correctly this way (an even-odd clip trick would XOR-cancel overlaps and leave un-erased lenses). The offscreen transform is derived from `mainCtx.getTransform()` so DPR/zoom/pan/rotation all map correctly; the mask pass re-applies the element's own center rotate/scale/flip (mirroring `RenderPipeline.applyTransformations`) so local mask points land on the rotated shape.

**Seam:** `renderElement` branches to `renderWithEraseMask` when `el.eraseStrokes?.length`, passing the extracted `renderElementCore` as a callback (avoids an import cycle). Because *all* raster export paths (PNG/PDF) go through `renderElement`, they get masking for free. **SVG export does NOT** (it builds vector `rough.svg` nodes, bypassing canvas compositing) — masked elements would export unmasked to SVG; a follow-up could force the canvas-fallback path for them. Unmasked elements take the exact original fast path (zero overhead) — the offscreen cost is paid only by elements that actually have a mask. The RoughJS geometry cache (`rough-cache.ts`) is keyed on shape geometry, which the mask doesn't change, so no hash term was needed (the mask is re-applied on every paint after the offscreen element render).

**Eraser flow:** `eraserOnDown` opens a module-level `eraseSession` (one undo entry + one continuous stroke per element per drag); `appendEraseStroke` decimates points (min 1.5px local step) and lazily `pushToHistory()` on first mutation; `eraserOnUp` (newly wired in `canvas.tsx`) clears the session. **Known v1 limitations:** hit-testing ignores holes (you can still click/select through an erased hole — visual-only), and elements with a CSS `blendMode` may composite oddly when masked (drawn onto a transparent offscreen). Migration passes `eraseStrokes` through; `api.ts` exposes it on `ElementOptions`.

**Location**: `src/types.ts`, `src/shapes/base/erase-mask.ts` (new), `src/utils/render-element.ts` (`renderElementCore` split), `src/utils/tool-handlers/minor-handlers.ts` (`appendEraseStroke`, `eraseSession`, `eraserOnUp`), `src/components/canvas.tsx` (pointer-up wiring), `src/utils/migration.ts`, `src/api.ts`

### Partial Erase — Follow-ups: Hole-Aware Hit-Testing, Resize Tracking, Eraser Width (2026-06-12)
Three follow-ups to the erase-mask feature above:

1. **Hole-aware hit-testing**: `hitTestElement` (`hit-testing.ts`) now wraps the geometry test in `hitTestGeometry` and rejects a hit that lands inside an erase hole via `isPointInEraseHole` — a JS post-filter applied *after* the (WASM or JS) geometry result. Since all picking flows through `hitTestElement` and the only WASM entry (`wasmHitTestElement`) is called *inside* `hitTestGeometry`, no WASM/AssemblyScript parity work was needed. `isPointInEraseHole` maps the world point back through the element's rotation/flip/renderScale into the local frame the mask is stored in (mirroring the render-time transform), then tests point-to-polyline distance per stroke.

2. **Resize must scale mask points — and the GOTCHA**: erase points are element-local in absolute units, so **move** works for free (relative to x/y) but **resize** must scale them or holes drift out of position (symptom: a resized erased circle's gaps no longer line up — "shape not maintained"). Fix: `scaleEraseStrokes(strokes, scaleX, scaleY)` in `selection-handler.ts` (points by scaleX/scaleY, radius by geometric mean) applied in both single + group `applyResize` branches. **Critical gotcha that cost a debugging round**: resize does NOT use the `captureInitialPositions` helper — it has its own *inline* `pState.initialPositions.set(...)` snapshots (one for single-element resize, one for multi/box resize). Editing only the helper had no effect; the inline snapshots (which omitted `eraseStrokes`, so `init.eraseStrokes` was undefined and scaling silently skipped) had to be patched too. Lesson: there are 3+ initial-position capture sites in `selection-handler.ts` — when adding a field that must survive resize, grep for every `initialPositions.set`/`points: el.points ?` and patch all of them, not just the named helper.

3. **Eraser width control**: the eraser size is no longer a fixed `10/scale`. New top-level store field `eraserWidth?: number` (world units, `undefined` = follow stroke width) with `setEraserWidth` + its own `localStorage('eraserWidth')` persistence — kept OUT of `defaultElementStyles` so it doesn't get spread onto every new shape via `createElement`. `getEraserRadius()` in `minor-handlers.ts` resolves `store.eraserWidth ?? defaultElementStyles.strokeWidth ?? 4` (÷2 for radius); the hit-detection `threshold` is decoupled as `max(10/scale, eraseRadius)` so a big brush reaches shapes it overlaps. UI: a new `'eraser'` `activeTarget` type in `property-panel.tsx` (the eraser tool previously returned `null` → empty panel) shows ONLY props with `applicableTo: ['eraser']` — currently the `eraserWidth` slider (`properties.ts`). `getPropertyValue` returns `eraserWidth ?? strokeWidth` so the slider opens at the stroke width; `handleChange` routes to `setEraserWidth`.

**Location**: `src/utils/hit-testing.ts` (`hitTestGeometry`, `isPointInEraseHole`), `src/utils/tool-handlers/selection-handler.ts` (`scaleEraseStrokes` + inline capture sites), `src/store/app-store.ts` (`eraserWidth`, `setEraserWidth`), `src/utils/tool-handlers/minor-handlers.ts` (`getEraserRadius`), `src/config/properties.ts` (`eraserWidth`), `src/components/property-panel.tsx` (`'eraser'` target)

### Welcome Screen Persistence — Dismiss on First Draw (2026-06-17)
The landing/welcome screen visibility (`welcome-screen.tsx` `isVisible()`) was gated on `store.elements.length === 0`, so drawing only hid it transiently — emptying the canvas (delete-all/undo) brought it back. Fix: a `createEffect` sets `welcomeDismissed = true` once `store.elements.length > 0`. Doing it as a reactive effect on the element count (rather than at each add site) covers every drawing path in one place and composes with the pre-existing explicit dismiss calls (image import, drag-drop, example load, `resetToNewDocument`). `welcomeDismissed` is session state, so the welcome screen still shows on a fresh load with an empty canvas.

**Location**: `frontend/src/components/welcome-screen.tsx`

### Undo/Redo Snapshots Must Clone Per-Element — Solid `setStore` Merges In Place (2026-06-20)
History `captureSnapshot()` previously did a shallow `store.elements.slice()` on the premise that Solid's `setStore` swaps object references on the modified path. **It does not.** `setStore("elements", predicate, partialObject)` — the path `updateElement`/`commitText` use — MERGES the partial into the existing element object *in place*; the object keeps its identity (proven: `ref === store.elements[i]` and `ref.x` reflects the post-edit value). A sliced array therefore captured live references that the next edit mutated, so undo restored already-mutated values. Add/delete/reorder appeared to work only because they replace the whole array via function updaters. Fix: shallow-clone each item in the snapshot (`elements.map(e => ({...e}))`, same for layers/slides/states). Spread is enough because nested arrays are always *replaced* (new `[...]`), never mutated in place — so cost stays O(elements×props), avoiding the O(total points) deep-clone stall that motivated the original (broken) shallow approach. **Takeaway:** "structural sharing" for snapshots is only valid if every mutation path replaces references; with Solid stores, partial-object merges break that invariant — clone the level you mutate.

**Location**: `frontend/src/store/app-store.ts` (`captureSnapshot`)

### Outline-Stroke (Minkowski) & Offset-Path Orientation — Sign by Signed Area (2026-06-24)
Two new vector ops in `utils/path-offset.ts`. **Outline stroke** is the Minkowski sum of the sampled centerline with a disk of radius `strokeWidth/2`: union (via `polygon-clipping`) of one rectangle per segment (offset ±r along the segment normal) plus one 16-gon disk per vertex for round joins/caps. Holes are dropped (`poly[0]` outer ring only) — a single-subpath `path` can't render them, same limit as the booleans. **Offset path** displaces each vertex along its miter bisector with a bevel clamp (`cosHalf ≥ 0.25`) to kill spikes at sharp corners, then cleans self-intersections with a `polygon-clipping` union. **The gotcha:** the left-normal `(-eY, eX)` points *inward or outward depending on winding*, so a naive `+d` shrinks some polygons and grows others. Fix: compute the shoelace signed area once and flip `d` when `area > 0`, so `+` reliably grows the outline outward regardless of how the path was drawn (verified: 120² square → +20 gives 160², −20 gives 80²). Both ops flatten curves to a polyline first (corner anchors out), consistent with the pathfinder booleans.

**Location**: `frontend/src/utils/path-offset.ts`, `app-store.ts` (`outlineStroke`/`offsetPath`)

### Multi-Subpath Paths (Holes / Compound Paths) — Even-Odd Everywhere + the Marquee Click-Through Gotcha (2026-06-24)
A `path` element can now hold multiple subpaths via `pathSubpaths?: { anchors, closed }[]` (supersedes the legacy single `pathAnchors`/`pathClosed`). The key insight that kept this small: a path's geometry is already a single SVG `d` string, and a multi-`M` `d` already renders through `Path2D` — so the work was the *fill rule*, not new rendering. Central helper `getPathSubpaths(el)` normalizes (subpaths ?? wrap pathAnchors); `subpathsToPathData()` concatenates per-subpath `d`. Geometry sets `evenOdd: subs.length > 1`; the renderer's `fillPath(d, 'evenodd')` (Canvas `ctx.fill(path2d, 'evenodd')`) punches holes — and rough.js solid fill respects even-odd too, so **both** sketch and architectural styles show the hole with no extra code. Booleans (`runBooleanOp` now returns `Poly[]` = outer ring + holes, via `polyToPathSubpaths`) and outline-stroke/offset (`computeOutlineStroke`/`computeOffsetPath` now return `Poly[]`) stopped dropping inner rings, so Subtract and closed-loop Outline keep their holes. Hit-testing does even-odd across subpaths (XOR of point-in-polygon over each closed subpath). **The subtle bug:** clicking *inside a hole* still selected the path — and it wasn't the hit-test (which correctly returned false). A pure click that misses narrow-phase falls through to the rectangle **marquee**, and a *zero-area* marquee selected every element whose bbox merely contained the point (so the hole — and historically a triangle's empty corner — wrongly selected). Fix in `selectionOnUp`: require a real drag (`box.w > 3/scale || box.h > 3/scale`) before AABB marquee selection; a no-drag click now relies purely on hit-testing. This makes holes click-through AND fixes the long-standing transparent-bbox-corner quirk for all shapes, while real drag-marquees are unchanged.

**Location**: `frontend/src/types.ts` (PathSubpath), `utils/math/path-utils.ts` (getPathSubpaths/subpathsToPathData), `utils/shape-geometry.ts`, `rendering/CanvasRenderer.ts` + `shapes/renderers/specialty-shape-renderer.ts` (even-odd fill), `utils/hit-testing.ts`, `utils/path-boolean.ts` (polyToPathSubpaths), `utils/path-offset.ts`, `store/app-store.ts` (buildPathFromPoly), `utils/tool-handlers/selection-handler.ts` (scalePathSubpaths + marquee min-drag), `api.ts` (createMultiPath)

### Compound-Path Node Editing, Connector Inner-Child Binding, Text Commit-and-Stay, Resizable Toolbar (2026-06-24)
A batch of editor-UX work shipped together:

- **Per-node editing of compound paths.** The node-edit functions were keyed on a single `pathAnchors[i]`; compound paths (with holes) couldn't be node-edited. Generalized to address anchors by **(subpath, index)** — handle ids became `path-{kind}-{sub}-{i}`. A shared read/write layer (`editableSubpaths(el)` deep-copies the subpaths via `getPathSubpaths`; `writeEditableSubpaths` re-normalizes ALL subpaths to a combined bbox and collapses back to legacy `pathAnchors` when only one ring remains) backs drag/convert/delete/insert. `findClosestPathSegment` now scans every subpath, so Alt-click-insert works on any ring. `selection-renderer` and `handle-detection` iterate `getPathSubpaths`, so every subpath's nodes draw and hit. Verified: dragging/converting an inner (hole) subpath node reshapes the hole.
- **Connector binding targeted the outer container, not the inner child.** `checkBinding` took the first element hit within a 40px threshold (z-order) and broke. Now it collects all candidates and prefers the most specific: point-inside beats merely-near, then smaller area (the nested child), then higher z. (See [[bug-fixes]].)
- **Ctrl/Cmd+Enter commits text and keeps the shape selected.** Added to both `text-editing-overlay` and `rich-text-editing-overlay` keydown. `commitText` already leaves `store.selection` intact, so the shape stays selected — no newline, no new mindmap node (the Tab/Enter mindmap shortcuts were the only commit-ish keys before).
- **Resizable toolbar.** New `toolbarWrap` global setting (persisted px). A corner resize grip drags the toolbar width; `flex-flow: row wrap` (overriding the column direction of vertical mode too) flows the icons into a compact grid of that width — e.g. drag narrow for 2-per-row. Double-click the grip resets.
- **Modern slim scrollbars** app-wide via `*` `scrollbar-width: thin` + `::-webkit-scrollbar` (8px, rounded, transparent track, low-contrast thumb that darkens on hover), themeable through `--scrollbar-thumb`.

**Gotcha that ate time:** the Playwright select tool id is `'selection'`, not `'select'` — node editing (and resize-handle rendering) gate on `selectedTool === 'selection'`, so testing with `'select'` silently disabled them. Also: dev-server HMR went selectively stale again; restart vite (or use a production preview) when render/handler behavior disagrees with the source.

**Location**: `utils/tool-handlers/selection-handler.ts` (editableSubpaths/writeEditableSubpaths + node fns), `utils/handle-detection.ts`, `utils/selection-renderer.ts`, `utils/binding-logic.ts`, `components/text-editing-overlay.tsx` + `rich-text-editing-overlay.tsx`, `components/toolbar.tsx` + `toolbar.css`, `index.css` (scrollbars), `types/slide-types.ts` + `store/app-store.ts` (toolbarWrap)

### Path Ops (Simplify / Make-Release Compound) + True Vector SVG Export (2026-06-24)
Two roadmap items, done autonomously and verified end-to-end.

- **Path ops** (`app-store.ts`): `simplifyPath` (Ramer–Douglas–Peucker per subpath, eps ≈ 1.2% of bbox diagonal — useful after booleans/outline produce dense corners; verified 9→4 anchors), `makeCompoundPath` (combine selected shapes/paths into one even-odd path so overlaps become holes — the Illustrator "Make Compound Path"; verified 2 rects → 1 path / 2 subpaths), `releaseCompoundPath` (split a compound path into separate single-subpath paths). Built on the `(subpath, anchor)` model: `elementToWorldSubs` lifts each element's subpaths into world coords (paths via `getPathSubpaths`, others via `shapeToPath`), `normalizeWorldSubs` re-normalizes a set to a shared bbox, `makePathFromWorldSubs` builds the element (single ring → node-editable `pathAnchors`, multiple → `pathSubpaths`). API + right-click **Path** submenu wired.

- **True vector SVG export** (`utils/export.ts`): the SVG exporter handled rect/circle/diamond/line/arrow/text natively (rough.js) and **rastered everything else** — `path` elements and ~150 specialty shapes embedded as PNG `<image>`s (the roadmap's "raster fallback = quality gap"). Added a vector branch *before* the raster fallback: `geometryToDs(getShapeGeometry(el))` serializes the centred geometry (rect/ellipse/points/path/multi) to SVG `d` strings; sketch style → `rc.path(d)` (still vector, sketchy), architectural → a clean `<path>` with `fill`/`stroke`/`fill-rule="evenodd"` (compound holes) /dash. **Frame gotcha:** geometry is in the element-centred frame, but the downstream finalizer *overwrites* the node's `transform` with its own rotate/flip — so the placement translate must live on an **inner** `<g translate(cx,cy)>` while the **outer** `<g>` is the `node` the finalizer transforms; the two compose correctly (rotate/flip happen around the same centre). Verified by exporting a path + compound donut + star and re-rendering the standalone SVG in a fresh browser: crisp vectors, donut hole visible, 0 `<image>` raster.

**Verification note:** the export's real surface is the downloaded file — captured it by hooking `URL.createObjectURL` (read `blob.text()`) and stubbing `HTMLAnchorElement.click`, then driving the real Export dialog (Ctrl+Shift+E → SVG → Export).

**Location**: `frontend/src/store/app-store.ts` (path ops), `frontend/src/utils/export.ts` (geometryToDs + vector branch), `api.ts`, `utils/context-menu-builder.ts`, `help-docs/shapes/vector-paths-doc.tsx`

### Path Join (2026-06-24)
`joinPaths(ids)` connects selected OPEN paths into one by greedily chaining nearest endpoints (reversing a path — and swapping its in/out handles — when its far end is closer). Coincident seam anchors are merged (drop the duplicate, keep the outgoing handle) so two paths sharing an endpoint give N-1 anchors, not N; if the two free ends meet, the result auto-closes. Closed paths are ignored. Right-click **Path → Join Paths** (shown when ≥2 selected paths have an open subpath) + `api.joinPaths`. Verified: two open segments → 3 anchors open; three segments forming a triangle → 3 anchors closed.

### Architectural native shapes export as clean SVG vectors (2026-06-24)
The SVG exporter always drew rect/circle/diamond via rough.js (sketchy), even when `renderStyle === 'architectural'` — so architectural shapes exported sketchy, contradicting the on-canvas clean look (and the CLAUDE.md "both styles everywhere" rule). Fix: when architectural, skip the rough native case (leave `node` null) so the shape falls through to the geometry→clean-`<path>` branch. Sketch shapes are unchanged (still rough vector). Verified: architectural rect+circle export as 2 clean `<path>`s (0 raster); sketch rect still exports rough vector.

**Location**: `frontend/src/utils/export.ts` (`archClean` guard on the rect/circle/diamond native cases)

### Rulers & guides overlay (2026-06-24)
New Photoshop/Figma-style **rulers** (top + left edge strips) and draggable **guide lines**. Store: `showRulers` (persisted to `localStorage['showRulers']`) + `guides: Guide[]` (`{id, axis:'h'|'v', pos}`), actions `toggleRulers`/`addGuide`/`updateGuide`/`removeGuide`/`clearGuides`. UI is a pure overlay component (`components/ruler-overlay.tsx`) — it never touches element geometry. Wiring mirrors the minimap: **Alt+R** hotkey, View menu item, command-palette entries (`view-rulers`, `view-clear-guides`), `api.toggleRulers/addGuide/…`. Top ruler pulls down horizontal guides; left ruler pulls out vertical guides.

Implementation notes:
- Rulers are two `<canvas>` strips (`RULER_SIZE=22`px) drawn with `devicePixelRatio` scaling for crisp ticks; a "nice" 1/2/5×10ⁿ major step is chosen so labels land ~80px apart at the current zoom. Tick positions use the same `world*scale+pan` mapping as the drawing canvas (rotation ignored — rulers read the un-rotated axis grid). The drawing canvas fills the viewport at origin (0,0), so canvas-local px ≈ clientX/Y.
- Toolbars/menus float at `z-index ≥ 10000`, so the ruler strips (z 38–40) render *behind* them — only the top/left 22px of bare canvas is occluded (the standard ruler tradeoff), and toolbar clicks still hit the toolbar.
- **Solid reactivity gotcha:** guide divs position via `style={{ top: `${screen()}px` }}` where `screen()` *calls* a function that reads `store.viewState`. Calling the function inside the JSX style is what makes Solid wrap it in a tracked computation — so guides reposition live on pan/zoom. A precomputed `const screenY = …` (as in `path-editor-overlay.tsx`) is captured once and is **not** reactive. Drag is handled by window-level `pointermove`/`up` listeners (not pointer-capture on the div), so the `<For>` recreating a guide div on each `updateGuide` doesn't break the in-progress drag. Drag a guide back onto its ruler (or double-click) to delete.

**Location**: `frontend/src/components/ruler-overlay.tsx`, `store/app-store.ts` (state + actions), `types.ts` (`Guide`), `app.tsx`, `utils/command-registry.ts`, `components/menu.tsx`, `components/help-dialog.tsx`, `api.ts`

### Logo toolkit — Phase A: Repeat & Symmetry (2026-06-25)
Logo-design construction tools (inspired by pro logo timelapses): **radial repeat**, **grid repeat**, **mirror copy**, **transform again**. All build on one primitive, `cloneSelection(ids, mutate)` in `app-store.ts` — a group-aware deep clone (mirrors the Ctrl+D handler's id/group remapping) that applies a per-clone transform. Key geometry insight: element rotation is stored as `angle` (radians) about the element centre, so a **rigid rotation about an arbitrary pivot** = rotate the element *centre* about the pivot then add the same delta to `angle` (`placeRotated`). Works uniformly for every element type without touching local geometry.
- `radialRepeat(count, {radius, faceCenter})` — ring around the selection centre; radius 0 = rotate-in-place (count 2 → 180° rotational mark); faceCenter adds θ to each copy's angle.
- `gridRepeat(rows, cols, {gapX, gapY})` — tile; spacing defaults to bbox + gap.
- `mirrorCopy(axis)` — reflect a clone across the bbox's far edge so it sits adjacent (symmetric pair). Shapes toggle `flipX/flipY`; point elements reflect points; `angle` negated.
- `transformAgain()` (**Ctrl+Shift+D**) — replays `lastTransform`, recorded by `moveSelectedElements` (nudge) and the Ctrl+D duplicate handler (`recordTransform`).

**Gotcha:** `moveSelectedElements` historically forgot `bumpDirtyRevision()` — the render effect tracks only that coarse counter (perf), so writes silently didn't repaint until the next event. Added it there + in all repeat/symmetry actions.

UI: right-click **Repeat & Mirror** submenu, Command Palette entries, `repeat-dialog.tsx` (radial/grid params, own `openRepeatDialog()` signal). `api.radialRepeat/gridRepeat/mirrorCopy/transformAgain`.

**Location**: `frontend/src/store/app-store.ts`, `components/repeat-dialog.tsx`, `app.tsx`, `utils/command-registry.ts`, `utils/context-menu-builder.ts`, `api.ts`, `help-docs/features/logo-toolkit-doc.tsx`, `help-docs/help-page.tsx`

### Logo toolkit — Phase B: Text → Outlines (2026-06-25)
"Create Outlines" (**Ctrl+Shift+O**) — convert a text element to an editable vector `path` of its glyph shapes (the foundation of wordmark/monogram design). `convertTextToOutlines(ids)` (async) in `app-store.ts` → `utils/text-to-outlines.ts`.
- **Fonts**: opentype.js needs the real font binary (browsers don't expose system fonts), so curated OFL TTFs are **bundled** under `public/fonts/outline/` (regular + bold for the 8 picker families; italic outlines upright for now). Downloaded from Google Fonts forcing TTF via an old `Mozilla/5.0`-style UA (css2 serves woff2 to modern UAs — opentype.js can't parse woff2). Fonts load lazily, cached as `Promise<Font>` keyed by file.
- **Glyph → path**: `font.getPath(line, x, y, size).commands` (M/L/C/Q/Z) → `PathSubpath[]`. Each contour = one closed subpath; cubic handles map to PathAnchor `inX/inY/outX/outY` (relative); quadratics lifted to cubics; a `Z` that duplicates the start anchor is merged (carry its incoming handle to the first). Counters (holes in o/a/e/g) are separate subpaths → even-odd fill punches them out (multi-subpath path).
- **Layout** mirrors `text-renderer.ts`: fontSize default 20, lineHeight 1.2×, padding 4, vertical/text align, `textBaseline 'hanging'` ≈ glyph-top so baseline = top + ascentPx. Hard line breaks only (no soft-wrap). bbox includes handle tips; anchors normalized to a local origin; element placed at `el.x/y + bbox.min`.
- The path inherits the text colour as a **solid fill** (`backgroundColor`=text colour, `strokeColor 'transparent'`, `strokeWidth 0`). Renders in both Sketch and Architectural (verified: "Yoz"/Poppins + "Design"/Merriweather, counters as holes).

**Verified the fill-style question:** `fillStyle` IS applied to `path` elements — all styles render in Sketch (solid/hachure/cross-hatch/gradient/dots); Architectural shows solid/gradient/dots and collapses hachure/cross-hatch to solid. That collapse is **global** Architectural behaviour (the clean pipeline has no sketchy hachure) — identical for a plain rectangle and a path, not a path-specific bug.

**Location**: `frontend/src/utils/text-to-outlines.ts`, `store/app-store.ts` (`convertTextToOutlines`), `public/fonts/outline/*.ttf`, `app.tsx`, `utils/context-menu-builder.ts`, `utils/command-registry.ts`, `api.ts`, `help-docs/features/logo-toolkit-doc.tsx`, `components/help-dialog.tsx`; dep `opentype.js`

### Logo toolkit — Phase C: Symmetry Guide (2026-06-25)
A persistent reflection axis (**Alt+Y**) for building symmetric marks: a draggable dashed line (vertical = left↔right, horizontal = up↕down), with **Mirror Across Symmetry Guide** to reflect the selection across it. `store.symmetry { enabled, axis, pos }` (pos = world coord); actions `toggleSymmetryGuide(on?, pos?)` / `setSymmetryAxis` / `setSymmetryPos` / `mirrorAcrossSymmetry`. `mirrorCopy` was refactored to share a `reflectClone(clone, src, axis, value)` helper (reflect element centre across a world axis line; shapes toggle flipX/flipY, point elements reflect local points, angle negated). `SymmetryOverlay` draws the axis (own DOM overlay, world→screen, draggable) — same Solid reactivity pattern as the ruler guides (`pos`/axis read inside the JSX style so it tracks).

**Key design decision — NO draw-time auto-mirror.** A live "mirror as you draw" mode would need a finalize hook in *every* tool's pointer-up path (the drawing pipeline has many tool-specific early returns), which is high-risk for drawing stability ([[huion-tablet-work]] — the user is sensitive to stroke regressions). Even gated behind an off-by-default flag, the per-tool surface area is large. So the guide is an on-demand construction aid (draw half → Mirror Across Guide), not an auto-mirror. Auto-mirror remains a deferred opt-in.

When enabling via hotkey/palette, the axis is dropped at the viewport centre in world coords (`(innerW/2 - panX)/scale`).

**Location**: `frontend/src/components/symmetry-overlay.tsx`, `store/app-store.ts` (symmetry state + `reflectClone`/`mirrorAcrossSymmetry`), `app.tsx`, `utils/command-registry.ts`, `utils/context-menu-builder.ts`, `api.ts`, `help-docs/features/logo-toolkit-doc.tsx`, `components/help-dialog.tsx`

### Symbols panel UI (2026-06-25)
A browsable **Symbols** panel (Alt+B, View menu, or `Yappy.toggleSymbolsPanel()`) — closes the loop on the symbols/instances feature, which until now was console-only (`Yappy.listSymbols()`). `frontend/src/components/symbols-panel.tsx` (+ `.css`), lazy-loaded in `app.tsx` next to `LayerPanel`, gated on `store.showSymbolsPanel` (new persisted-as-UI flag + `toggleSymbolsPanel`).
- **Live thumbnails**: each card draws the symbol's child elements onto a 56px `<canvas>` via the *same* `renderElement(rc, ctx, el, isDark, opacity)` utility the minimap uses — `rough.canvas(canvas)` for `rc`, scale-to-fit (min of w/h ratios) + centre offset, DPR-aware (`setTransform(dpr,…)`). A `createEffect` touching `sym.elements/width/height` + `store.theme` re-renders the thumb when a symbol is redefined or the theme flips. Wrapped in try/catch so a malformed child can't blank the panel.
- New store commands `renameSymbol(id,name)` and `deleteSymbol(id, detachInstances=true)`. Delete defaults to **detaching** instances into editable copies first (reuses `detachInstance`, which pushes its own history) then drops the orphaned def — so deleting a symbol never silently removes art from the canvas. Pass `false` to hard-delete instances too.
- The instance **count badge** is `store.elements.filter(type==='symbolInstance' && symbolId===s.id).length` — recomputed reactively, so it tracks place/detach live. `listSymbols()` now includes this `instances` count.
- **Gotcha**: lucide's `Component` icon collides with Solid's `Component` *type* in files that import both (menu.tsx) — alias it (`Component as ComponentIcon`). In symbols-panel.tsx there's no Solid `Component` value import clash because we only use the `Component` type annotation… actually we import the type too, so the icon is aliased there as well.
- Placement from the panel drops the new instance centred in the current viewport (`screenToWorld(innerW/2, innerH/2, viewState)` minus half the symbol size).
- **UX fix (same day):** the thumbnail was originally *single*-click-to-place — so clicking it repeatedly to "select" a symbol kept spawning instances and the count badge climbed. Changed to **single-click = select all instances of that symbol** (`selectInstancesOf(symbolId)` → `setStore('selection', ids)`), **double-click (or the card's + button) = place**. The count badge correctly reads 0 when a symbol's instances have all been deleted from the canvas — the *definition* persists in the library by design (that's the point of a symbol master), so 0-count is expected, not a bug.

**Location**: `frontend/src/components/symbols-panel.tsx` + `.css`, `store/app-store.ts` (`showSymbolsPanel`, `toggleSymbolsPanel`, `renameSymbol`, `deleteSymbol`), `app.tsx`, `components/menu.tsx`, `components/help-dialog.tsx`, `api.ts`

### Symbols panel — icon/layout/contrast fixes (2026-06-25)
Three bugs surfaced after the panel shipped, all in the card action row (place/redefine/delete):
1. **Zero-width lucide icons (root cause).** lucide-solid renders `<svg width="13" height="13" class="lucide …">` — width/height as *attributes*, not CSS. As flex items inside a centred fixed-size button (`display:inline-flex; align-items/justify-content:center`), Chromium collapsed the svg's *main-size* to **0px** (height stayed 13) → invisible icons. The asymmetry (h ok, w=0) is the tell. Fix: pin the box in CSS — `.sp-act svg { flex: 0 0 auto; width: 13px; height: 13px }` (and `.sp-icon-btn svg` 15px). Lesson: never rely on lucide's attribute sizing for an icon that lives as a flex item in a centred button — give it explicit CSS width/height + `flex: 0 0 auto`.
2. **Panel overlapped the bottom-left floating controls.** The app has three `position:fixed` floating buttons (Settings/Properties/Help) at `bottom:34px; left:12–136px; z-index:1000`. The panel sat at `bottom:28px; z-index:50`, so its action row was *covered* by them (confirmed via `document.elementFromPoint(centre)` → `BUTTON.floating-settings-btn`, not the panel button). Because the zero-width icons were *also* invisible, the floating buttons bled through and looked like the panel's own icons (gear/sliders/?). Fix: dock the panel at `bottom:80px` to clear the cluster (its top is ~bottom 70px). Lesson: when adding a left-docked panel, remember the bottom-left corner is owned by those fixed z-1000 controls — hit-test with `elementFromPoint` to catch overlap that screenshots alone misattribute.
3. **Delete icon not theme-aware.** Hover used hardcoded `#ef4444`; switched to `var(--danger-color)` (adapts #ef4444 light / #f87171 dark) with a permanent danger tint at rest (`opacity:.85`) so the destructive action reads clearly in both themes. Also swapped the non-existent `var(--accent-color, …)` fallbacks to `var(--primary-color)`.

**Debugging note:** Playwright element screenshots clipped to a `boundingBox()` can *include* higher-z fixed overlays that aren't part of the element — so "the icon is missing" looked like "wrong icon rendered." `getBoundingClientRect().width===0` on the `<svg>` + `elementFromPoint` for occlusion are the reliable signals.

**Location**: `frontend/src/components/symbols-panel.css`

### Gradient mesh fill (#12, scoped core) (2026-06-25)
The last vector-illustration-roadmap item — a smooth multi-colour mesh fill. Scoped the XL spec (which calls for a WASM rasterizer + draggable Coons patches) down to a tractable, shippable core:
- **Model**: `meshGradient?: { rows, cols, colors[] }` on DrawingElement + `'mesh'` added to `FillStyle`. Node positions are *derived* (even grid over the bbox), so only colours are stored — auto-serializes with the element (no persistence-checklist changes; confirmed via a `loadDocument(v4)` round-trip e2e). Interface lives in `types.ts`; `utils/mesh-gradient.ts` imports it (avoids a circular dep — types.ts has no runtime deps).
- **Rasterizer** (`utils/mesh-gradient.ts`): pure bilinear colour interpolation per cell → `rasterizeMesh()` paints an ImageData buffer (capped ≤256²; canvas smoothing upscales it cleanly). Plus `defaultMesh` (seeds a diagonal light→dark sheen from a base colour), `resizeMesh` (bilinear-resamples the old grid so colours survive a row/col change), `sampleMesh`, `parseHex`/`rgbToHex`.
- **Render parity for free**: `applyMeshFill` in `render-pipeline.ts` mirrors `applyImageFill` — clip to `getShapeGeometry` (path → `clipPath`, else `renderGeometry`+`clip`), then `drawImage(buffer, -w/2,-h/2,w,h)`. Because it's a clipped raster (like image fills), it renders *identically* in Sketch and Architectural, so render-style parity is automatic; the rough.js outline/stroke still draws per-mode. Added `'mesh'` to `buildRenderOptions`' `isComplexFill` list so rough.js ignores the fill, and to the `useMesh` branch in `applyComplexFills`.
- **Editor**: `MeshEditor` in `property-panel.tsx` — a `grid-template-columns: repeat(cols,1fr)` of `<input type=color>` swatches + Rows/Cols steppers (`setMeshSize`) + Remove. Rendered next to `AppearanceEditor` and self-gates on `el.meshGradient` (independent of property *group* visibility — simpler than threading it through the gradient group's fillStyle Show). Selecting `'mesh'` in the Fill dropdown is intercepted in `handleChange` to seed a default grid via `applyMeshGradient`.
- Store cmds `applyMeshGradient/setMeshSize/setMeshNodeColor/clearMeshGradient` (+ api, + right-click Appearance → Gradient Mesh Fill/Remove). **Gotcha**: SolidJS `setStore` updater literals need `fillStyle: 'mesh' as const` (else `string` ≠ `FillStyle`).

**Future** (deferred, noted for parity with Illustrator): draggable node positions + per-node handles (on-canvas mesh overlay), and Coons/bicubic (C1) patches instead of per-cell bilinear (C0 — soft creases at cell borders on high-contrast meshes).

**Location**: `frontend/src/utils/mesh-gradient.ts`, `types.ts`, `shapes/base/render-pipeline.ts`, `store/app-store.ts`, `components/property-panel.tsx`, `config/properties.ts`, `utils/context-menu-builder.ts`, `api.ts`, `help-docs/features/masks-appearance-trace-doc.tsx`

### Gradient mesh — on-canvas node editor (2026-06-25)
Follow-up to the mesh fill: a direct on-canvas editor so node colours aren't only editable via the disconnected property-panel swatch grid. `components/mesh-overlay.tsx` (+ `.css`), mounted in `app.tsx` next to `SymmetryOverlay`, gated on a transient `store.meshEditActive` flag (`toggleMeshEdit`) + a single selected element with a `meshGradient`. Toggle via the **Edit on canvas** button in the mesh editor (or `Yappy.toggleMeshEdit()`).
- **Each node IS a `<input type=color>`** styled as a circular swatch (`-webkit-appearance:none` + `::-webkit-color-swatch{border-radius:50%}`), positioned absolutely at the node's screen coords. Clicking the dot opens the native picker; `onInput` → `setMeshNodeColor`. No separate selection state / popup needed — elegant and reliable.
- **Node screen positions** must match the rendered shape exactly. Nodes are an even grid in element-local space; transform each by the SAME order the render pipeline applies *to a point* — scale(renderScale) → shear → flip → rotate(angle) about the centre — then `worldToScreen(vp)`. Verified the corner dots land on the shape corners with **0px** error (e2e). Getting the transform order wrong (e.g. rotate before flip) misplaces dots on rotated/flipped shapes.
- Grid lines = SVG `<polyline>` per row and per column through the node centres (6 for a 3×3). Overlay is `position:fixed; inset:0; pointer-events:none` with only the dots `pointer-events:auto`, so it never blocks canvas interaction; double-click the backdrop exits.
- `meshEditActive` is ephemeral (a mode, like a tool) — NOT added to history/serializers.

**Location**: `frontend/src/components/mesh-overlay.tsx` + `.css`, `store/app-store.ts` (`meshEditActive`, `toggleMeshEdit`), `app.tsx`, `components/property-panel.tsx` (Edit-on-canvas button), `api.ts`, `help-docs/features/masks-appearance-trace-doc.tsx`

### Artboards — on-canvas move + resize (2026-06-25)
Artboards could only be added/removed/exported from menus; now they're directly editable on the canvas. `components/artboard-overlay.tsx` (+ `.css`), mounted in `app.tsx` with the other overlays, gated on `docType !== 'slides'` && `artboards.length > 0`.
- **Each artboard = a draggable name chip** (shows `name W×H`) at its top-left; drag to move, click to select. The selected artboard gets the blue frame + **8 resize handles** (4 corners, 4 edge-midpoints). Resize math: left/top edges move x/y *and* shrink w/h (`newW=max(MIN,w-dxw); newX=x+(w-newW)`), right/bottom edges only grow w/h — gives natural clamping at MIN size with the opposite edge pinned.
- **Replaced the canvas-drawn artboard label** (`fillText` in `canvas-renderer.ts`) with the interactive chip — avoids a duplicated name. The frame *rectangle* is still drawn on the canvas; the chip carries the name + live dimensions.
- **Interior stays drawable**: the `.ab-frame` is `pointer-events:none` (visual only); only the chip and handles take pointer events. Move is via the chip (not a full-area drag target), so you can still draw *inside* a selected artboard.
- **Lazy history**: `pushToHistory()` fires on the first real pointer-move, not on pointer-down — so click-to-select doesn't spam the undo stack. The gesture uses a new no-history `updateArtboardLive(id, patch)` (vs `updateArtboard` which pushes), giving one undo entry per drag.
- Uses the simple pan/scale transform (like `SymmetryOverlay`); canvas rotation isn't accounted for (artboards stay axis-aligned). Verified move (+120,+80) and SE-resize (+100,+60) with exact world-pixel deltas via e2e (`tests/artboard-overlay.spec.ts`).

**Location**: `frontend/src/components/artboard-overlay.tsx` + `.css`, `store/app-store.ts` (`updateArtboardLive`), `app.tsx`, `utils/canvas-renderer.ts` (removed static label)

### Artboard delete + a latent duplicate-id bug (2026-06-25)
Follow-up to on-canvas artboard editing: a selected artboard can now be **deleted** — a red **×** button on the active artboard (top-right of the frame) and the **Delete/Backspace** key.
- Moved the overlay's "active artboard" from a local signal into `store.activeArtboardId` (transient, not persisted) so the **global** keydown handler in `app.tsx` can coordinate: `Delete` removes the active artboard *first*, else falls back to deleting selected elements (artboard takes priority; a selected element is left untouched). `deleteArtboard` clears `activeArtboardId` if it was the deleted one.
- **Latent bug found + fixed**: `generateId(type)` (`utils/id-generator.ts`) scanned `elements/layers/slides/states` for the max suffix but **not** `store.artboards` or `store.symbols` — so adding multiple artboards (or symbols) produced **duplicate ids** (`ab__-1`, `ab__-1`, …). The overlay exposed it: two artboards with the same id both matched `activeArtboardId`, rendering two × buttons. Fixed by also scanning `store.artboards` and `store.symbols`. (Any new top-level id-bearing collection must be added to `generateId`'s scan list — easy to miss.)
- **Playwright gotcha**: clicking a small DOM button overlaid on the full-size `<canvas>` fails actionability ("canvas intercepts pointer events") even though `document.elementsFromPoint(cx,cy)[0]` is the button (real users hit it fine). Verify hittability with `elementsFromPoint` and dispatch the click via `el.click()` in `page.evaluate` rather than fighting the heuristic.

**Location**: `frontend/src/components/artboard-overlay.tsx` + `.css`, `store/app-store.ts` (`activeArtboardId`, `setActiveArtboard`, `deleteArtboard` clears it), `app.tsx` (Delete handler), `utils/id-generator.ts` (scan artboards + symbols)

### Artboard delete/deselect — overlay-button-over-canvas pitfalls (2026-06-25)
The artboard × delete button "didn't work and flickered", and a selected artboard stayed selected when clicking elsewhere. Root causes + fixes:
- **`click` over the canvas is unreliable.** Instrumentation showed the button received `pointerdown` (and was topmost per `elementsFromPoint`), but the `click` event never fired — a canvas redraw between pointerdown and pointerup recreates the overlay's DOM node, so down and up land on different nodes and no click synthesizes (hence "flicker" + "not working"). Fix: trigger the delete on **`onPointerDown`** (with `preventDefault`+`stopPropagation`), not `onClick`. Lesson: for overlay buttons sitting over a frequently-redrawing canvas, act on pointerdown, never rely on the synthesized click.
- **Deselect-on-outside-click was missing.** Added a **capture-phase** `window` `pointerdown` listener in the overlay: if the target isn't inside `.artboard-overlay`, clear `activeArtboardId`. Capture-phase so it runs before the canvas's own handler; the `closest('.artboard-overlay')` guard keeps chip/handle/delete interactions from self-deselecting.
- Nudged the × button up (`top-26`) so it doesn't overlap the NE resize handle.
- **Test gotcha that hid the bug**: the original e2e dispatched `el.click()` in `page.evaluate`, which fires a synthetic click directly and bypasses the real pointer flow — so it passed while real usage failed. Always exercise overlay buttons with `page.mouse.click(x,y)` (real pointer events), not `el.click()`.

**Location**: `frontend/src/components/artboard-overlay.tsx` (pointerdown delete + outside-click capture listener)

### Artboard delete — the real cause was handle overlap (2026-06-25)
The first delete fix (pointerdown instead of click) wasn't enough: clicking the × still "shook and did nothing". Real cause: the floating × button at the frame's top-right **overlapped the NE resize handle**, which renders later in the DOM (higher paint order) at the same z-index — so the pointerdown grabbed the *handle*, and the click's tiny jitter triggered a 1–2px resize ("shake"), while the delete never fired. Fix: move the × **into the name chip** (a flex row: draggable name span + inline × button). The chip sits *above* the frame in a handle-free zone, so the × can never be intercepted by a handle. Kept the pointerdown trigger + outside-click deselect from before. Lesson: floating action buttons placed at a selection's corners collide with resize handles — anchor them in a dedicated chrome element (toolbar/chip), not loose at the corner.

**Location**: `frontend/src/components/artboard-overlay.tsx` + `.css` (chip now `.ab-chip-name` + `.ab-chip-del`)

### Gradient mesh — draggable nodes (warped mesh) (2026-06-25)
Upgraded the gradient mesh from a fixed even grid to a true warpable mesh (the headline gradient-mesh capability).
- **Model**: optional `points?: {x,y}[]` (normalized 0..1, row-major) on `MeshGradient`. Absent → even grid (fast path, backward-compatible). `meshNodePos`/`meshPoints` resolve either form.
- **Rasterizer** (`utils/mesh-gradient.ts`): when `points` are set, each cell is an arbitrary quad rasterized via **inverse bilinear interpolation** — for each pixel in the cell's bbox, solve the quad's (s,t) (quadratic via cross-products: k2·t²+k1·t+k0=0, pick the root in [0,1], then s from the linear relation), then bilerp the 4 corner colours at (s,t). The even-grid path stays the fast per-row lerp.
- **No-gap guarantee**: `constrainNodePos` pins corners, slides edge nodes along their edge, and keeps interior nodes in (pad, 1−pad). Because cells share nodes, the boundary stays the unit square and the cells always tile it — the fill never leaves a hole.
- **Editor**: mesh-overlay nodes became draggable `<div>` dots (were `<input type=color>`). Drag → `setMeshNodePosition` (history pushed lazily on first move, no-history per move); a click with <3px movement opens a hidden `<input type=color>` to recolour. Screen→normalized uses the **inverse** of the render transform: compose M = R·F·Sh·(rs·I) from basis vectors, invert the 2×2, then `screenToWorld → (world−centre)·M⁻¹ → local/size + 0.5`. Verified the forward/inverse round-trips by dragging a node and checking the resulting normalized coords.
- Store: `setMeshNodePosition(ids,r,c,x,y,history?)`, `resetMeshNodes(ids)` (drops `points`); api + a **Reset nodes** button (shown only when warped). `setMeshSize` already drops `points` (resize → even grid).

**Location**: `frontend/src/utils/mesh-gradient.ts`, `types.ts`, `store/app-store.ts`, `components/mesh-overlay.tsx` + `.css`, `components/property-panel.tsx`, `api.ts`, `help-docs/features/masks-appearance-trace-doc.tsx`

### Gradient mesh — bicubic smoothing + rasterize cache (2026-06-25)
Added optional **C1 smoothing** to the mesh fill (the "Coons/smoother patches" ask, done pragmatically without per-node tangent handles).
- `MeshGradient.smooth?: boolean` (default **true** for new meshes). On the even-grid path, when smooth, colours are interpolated with **bicubic Catmull-Rom** in both directions (16-tap, edge-clamped) instead of per-cell bilinear — removes the faceted/diamond creases at cell borders, giving a soft round falloff. Toggle: **Smooth (bicubic)** checkbox in the mesh editor + `Yappy.setMeshSmooth(bool)`. Warped meshes (custom `points`) keep inverse-bilinear quads (bicubic over arbitrary quads is the genuinely-XL Coons-patch case, deferred).
- **Rasterize cache** (`utils/mesh-gradient.ts`): `applyMeshFill` rasterizes on *every* canvas frame, and bicubic is ~16× bilinear, so added a small LRU `Map` keyed by `WxH|rowsxcols|smooth|colors|points` (cap 40). Identical meshes return the cached `<canvas>` instantly; the key's `points.toFixed(4)` means each drag position is a fresh entry (capped). Big win for static meshes redrawn under unrelated canvas activity.

**Location**: `frontend/src/utils/mesh-gradient.ts` (catmullRom, cache), `types.ts`, `store/app-store.ts` (`setMeshSmooth`), `components/property-panel.tsx` (toggle), `api.ts`, `help-docs/features/masks-appearance-trace-doc.tsx`

### Symbols — edit-in-place (2026-06-25)
Double-click a symbol instance (or right-click → **Edit Symbol (in place)**, or `Yappy.enterSymbolEdit()`) to edit the symbol's master; **Done** (Enter) redefines the symbol so every instance updates, **Cancel** (Esc) discards. A breadcrumb banner (`components/symbol-edit-banner.tsx`) shows the session.
- **Mechanism**: enter = expand the instance into editable child copies (grouped under a fresh `groupId`, scaled to the instance, like `detachInstance`) and remove the instance; record `store.symbolEdit = {symbolId, groupId, name, x, y}` (transient). Exit(save) = gather elements carrying that `groupId` → `redefineSymbol` (normalizes + updates all instances) → delete them → `placeInstance` back at (x,y). Exit(cancel) skips the redefine. So it reuses the existing detach/redefine/place primitives rather than a separate isolation renderer.
- **Cold double-click**: relying on `store.selection` (set by the dblclick's first click) is racy — a *cold* first-ever double-click can fire `onDblClick` before selection commits. Fixed by **hit-testing the dblclick point** (`hitTestElement`, top-most `symbolInstance`) instead of reading selection, so it works without a prior click. (`hitTestElement` already treats `symbolInstance` as a box hit.)
- **Test gotcha**: a *truly* cold synthetic `mouse.dblclick` (no prior pointer event at all) still won't enter in Playwright — the canvas needs one prior pointer event. Prime with a `mouse.click` on empty space first; real browsers always have prior pointer activity. Asserting via the API path (`enterSymbolEdit`) is the reliable CI signal.
- Session state (`symbolEdit`) is ephemeral — not persisted/serialized.

**Location**: `frontend/src/store/app-store.ts` (`symbolEdit`, `enterSymbolEdit`/`exitSymbolEdit`), `components/symbol-edit-banner.tsx` + `.css`, `components/canvas.tsx` (dblclick hit-test), `app.tsx`, `utils/context-menu-builder.ts`, `api.ts`

### Smart (quick) toolbar — Font Size for shapes (2026-06-25)
The quick toolbar showed Font / Text-Align / Vertical-Align for every shape but **Font Size** only for codeBlock + data-structure types (its `applicableTo` in `config/quick-toolbar-config.ts` was restrictive). Since any shape can hold container text (size lives in `el.fontSize`), removed the `applicableTo` so Font Size shows for all shapes — consistent with the other text controls. Range widened to 8–200 (match the text family). Binds via the `fontSize` key like text elements; verified the control appears + tracks the value for a plain rectangle.

**Location**: `frontend/src/config/quick-toolbar-config.ts` (shapeProperties fontSize)

### Align-to-key-object + distribute-by-spacing (2026-06-25)
Two alignment quick-wins on `utils/alignment.ts` + the property-panel ALIGNMENT group.
- **Align to key**: `calculateAlignment(ids, els, type, keyId?)` — when a key is given, the alignment frame is the key object's box (not the selection bbox) and the key never moves. Toggle (`store.alignToKeyObject`, crosshair button); the key = the **last-selected** element (`selection[selection.length-1]`, the most-recently shift-clicked).
- **Distribute by spacing**: `calculateSpacingDistribution(ids, els, axis, gap?)` equalizes **edge-to-edge** gaps (vs the existing distribute-centres), keeping the first/last fixed; with an explicit `gap` it packs from the first object with that exact gap. UI: two space-around buttons + a `gap` number input (blank = equalize). `distributeSpacing(type, gap?)` store cmd + api.

**Location**: `frontend/src/utils/alignment.ts`, `store/app-store.ts` (`alignToKeyObject`, `toggleAlignToKey`, `alignSelectedElements(type,keyId?)`, `distributeSpacing`), `components/property-panel.tsx` (AlignmentControls), `api.ts`

### Undo-history panel (2026-06-25)
A scrubbing **History** panel (Alt+H / View menu / `Yappy.toggleHistoryPanel()`) over the existing `undoStack`/`redoStack`. `getHistoryEntries()` flattens the timeline — past snapshots (oldest→newest) + current + reversed redo stack — each tagged with its element count; `jumpToHistory(index)` undo/redo-s the delta to land on any state. The panel (`components/history-panel.tsx`) renders newest-first, highlights **Current**, dims future (redo) rows, and reacts to `store.undoStackLength`/`redoStackLength`. No labels were threaded through the ~80 `pushToHistory()` call sites — entries are "State N · K obj" (element count gives cheap differentiation); a future pass could pass action labels into `pushToHistory`.

**Location**: `frontend/src/components/history-panel.tsx` + `.css`, `store/app-store.ts` (`showHistoryPanel`, `toggleHistoryPanel`, `getHistoryEntries`, `jumpToHistory`), `app.tsx` (Alt+H + mount), `components/menu.tsx`, `components/help-dialog.tsx`, `api.ts`

### Eyedropper — pick style from any object (2026-06-25)
Right-click a selection → **Eyedropper — pick style from…** arms a mode (`store.eyedropper {active, targets}`); the next canvas click copies the clicked object's full style onto the targets, then disarms (Esc cancels; cursor → crosshair). Refactored copy-style's field list into `getStyleSnapshot(el)` (now also carries `meshGradient` + `appearance`), shared by `copyStyle` and the eyedropper. Canvas integration: a branch at the top of `handlePointerDown` hit-tests the click (`hitTestElement`) and calls `applyEyedropperFrom` (excludes the source + missing targets, one history entry). `startEyedropper/applyEyedropperFrom/cancelEyedropper` + api.
- **Circular import is fine**: `app-store` imports `getStyleSnapshot` from `object-context-actions` which imports `app-store` — safe because both bindings are only used at call-time, never module-init. Build + runtime e2e confirm.
- **Shortcut note**: Illustrator's eyedropper is `I`, but `i` here is the image tool — so the eyedropper is context-menu-only (no key) to avoid the clash.
- Same cold-first-interaction caveat as symbol dblclick: a *truly* first synthetic click won't reach `handlePointerDown` in tests — prime with a click; real browsers are fine.

**Location**: `frontend/src/utils/object-context-actions.ts` (`getStyleSnapshot`), `store/app-store.ts` (eyedropper state + cmds), `components/canvas.tsx` (pointerdown branch + crosshair cursor), `app.tsx` (Esc), `utils/context-menu-builder.ts`, `api.ts`

### Vector SVG export — gradient & mesh fills (2026-06-25)
The roadmap listed SVG export as a "raster fallback", but `exportToSvg` was already **~70% true vector**: rough.svg() for sketch, `getShapeGeometry`→`geometryToDs`→real `<path>` for ~150 specialty + architectural shapes, real `<text>`/`<image>`, and `buildAppearanceSvgGroup` for the appearance stack. The actual gap was **gradient and mesh fills** — the clean-path branch always emitted a *solid* `backgroundColor`, so a gradient-filled architectural shape exported solid (or rasterized).
- New `utils/svg-paint.ts` `svgFillPaint(el, defs, uid)` returns the SVG `fill`: a solid colour, or a `url(#id)` referencing a `<linearGradient>`/`<radialGradient>` (conic≈radial — SVG has no conic) / `<pattern>` appended to `<defs>`. Wired into the clean-path branch in `export.ts` (replaces the solid-fill line). Now architectural gradient/mesh shapes export as **true vectors**.
- **Gradient orientation**: `gradientUnits="objectBoundingBox"` (0–1 over the path's bbox) so it's centre-agnostic; linear x1/y1→x2/y2 from `gradientDirection` (cos/sin). rgba/#rrggbbaa alpha split into `stop-opacity` (stop-color doesn't take alpha reliably).
- **Mesh** → rasterize (`rasterizeMesh`, capped 256) → `<pattern patternUnits=userSpaceOnUse patternContentUnits=userSpaceOnUse>` with the image. **Gotcha**: with userSpaceOnUse the pattern *content* coordinate origin is the tile's (x,y), so the image sits at **(0,0)..(w,h)**, NOT (-w/2..w/2) — placing it at -w/2 fills only one quadrant. The path is centred, so the tile is at (-w/2,-h/2) but the image inside is at (0,0).
- Sketch-style + gradient stays rough's solid/hachure (rough has no gradients) — architectural is the clean-vector mode where gradients matter.

**Location**: `frontend/src/utils/svg-paint.ts` (new), `utils/export.ts` (clean-path fill)

### Graphic styles — named reusable appearances (2026-06-25)
Save an object's whole look (`getStyleSnapshot`: fill/stroke/gradient/mesh/appearance/shadow/opacity/renderStyle) as a named **graphic style** and apply it to others in one click — builds on the appearance stack + the eyedropper's `getStyleSnapshot`.
- **Model**: `GraphicStyle { id, name, style: Partial<DrawingElement> }`; `store.graphicStyles[]` is **document-level** (persisted), so it went through the full 7-point checklist: AppState + initialState + HistorySnapshot + capture/restore + loadDocument + the 5 save serializers (auto-save, menu ×2, api, cloud-storage) + `SlideDocument` type. Panel visibility (`showGraphicStylesPanel`) is transient (not persisted).
- Store cmds `createGraphicStyle/applyGraphicStyle/updateGraphicStyle(redefine)/renameGraphicStyle/deleteGraphicStyle` + `toggleGraphicStylesPanel`.
- **Panel** (`graphic-styles-panel.tsx`, Alt+G): thumbnails render a sample rounded rect with the style applied through the real `renderElement` pipeline (same trick as the Symbols panel), so gradient/mesh/appearance styles preview accurately. Click = apply to selection; +/↻/🗑 = save/redefine/delete.
- **Distinction from eyedropper**: eyedropper = one-shot copy from a clicked object; graphic style = reusable, named, saved-in-doc look.

**Location**: `frontend/src/types.ts` (GraphicStyle), `store/app-store.ts` (graphicStyles + cmds + persistence), `components/graphic-styles-panel.tsx` + `.css`, `app.tsx` (Alt+G + mount), `menu.tsx`, `help-dialog.tsx`, `api.ts`, `utils/context-menu-builder.ts`, 5 save serializers, `types/slide-types.ts`, `help-docs/features/masks-appearance-trace-doc.tsx`

### Vector SVG export — SvgRenderer for fallback shapes (2026-06-25)
Extended true-vector SVG export to the shapes that previously rasterized (data-structures, BPMN, tables) — they all carry internal text/sub-shapes, so outline-only geometry would lose content; the fix is a real **`SvgRenderer`** (`rendering/SvgRenderer.ts`) implementing `IRenderer` that records the clean render pipeline's draw calls as SVG `<path>/<rect>/<text>/<image>`.
- **Transform model**: keeps a 2×3 CTM with a save/restore stack; each emitted node carries `transform="matrix(CTM)"` and path/text coords stay in local user space — exactly matching canvas (path coords pre-transform, stroke-width scales with the CTM). `clip()` creates a `<clipPath>` def + a wrapping `<g clip-path>` that the next `restore()` exits (canvas clip-until-restore semantics).
- **Safe by construction**: anything it can't faithfully emit (patterns, conic gradients, missing image) sets `failed=true`; the exporter then **discards** the SVG and uses the existing raster fallback — output is never worse than before. Only tried for `renderStyle==='architectural'` (sketch uses rough.js via `rc`, which bypasses the renderer).
- Wired into `export.ts` *before* the raster fallback: `renderElement(rough.canvas(throwaway), throwaway-ctx, el, …, svgRenderer)` → if `!failed && root has children`, use `svgRenderer.root` and set `isCanvasFallback=true` (transform/opacity are baked into the matrix attrs, so the export finalizer must NOT re-apply them).
- Verified: an architectural `dsArray` exports `<text>7</text>`… + boxes with **zero `<image>`**, and renders correctly (values + indices crisp).

**Location**: `frontend/src/rendering/SvgRenderer.ts` (new), `utils/export.ts` (vector fallback branch)

### Global swatches — document colours with live links (2026-06-25)
A document-level colour palette where objects **link** to a swatch and follow its colour. Denormalized model: the colour stays on the element (`backgroundColor`/`strokeColor`) so **rendering is unchanged** — plus `fillSwatchId`/`strokeSwatchId` track the link.
- `Swatch { id, name, color }`; `store.swatches[]` is document-level → full 7-point persistence checklist (mirrored `graphicStyles`).
- `applySwatch(id, 'fill'|'stroke')` sets colour + swatchId together; `updateSwatchColor` recolours the swatch AND every element whose `fillSwatchId`/`strokeSwatchId` matches. `deleteSwatch` drops the links.
- **Auto-unlink**: `updateElement` clears `fillSwatchId` when a patch sets `backgroundColor` without also setting `fillSwatchId` (same for stroke) — so editing a colour directly breaks the link, but `applySwatch` (which sets both in one patch) keeps it. Clean, no per-call flags.
- Panel (`swatches-panel.tsx`, Alt+W): chip grid; click = fill selection; corner `<input type=color>` recolours the swatch (propagates); S = apply stroke; 🗑 = delete.

**Location**: `frontend/src/types.ts` (Swatch + fill/strokeSwatchId), `store/app-store.ts` (swatches + cmds + persistence + updateElement unlink), `components/swatches-panel.tsx` + `.css`, `app.tsx` (Alt+W), `menu.tsx`, `help-dialog.tsx`, `api.ts`, 5 serializers, `slide-types.ts`, `help-docs/features/masks-appearance-trace-doc.tsx`

### Blend tool — graduated steps between two objects (2026-06-25)
Right-click two objects → **Blend** → step count (2–16). `blendShapes(ids, steps)` creates N intermediate clones at `t = k/(steps+1)`, interpolating x/y/width/height/angle/opacity/strokeWidth and lerping fill/stroke colour (reuses mesh-gradient `parseHex`/`rgbToHex`; treats `transparent` as "use the other colour"). Clones use the **first** object's shape (graduated copies, not shape-morphing — true path morphing between arbitrary shapes is XL). Intermediates are spliced into z-order right after the first object and the whole chain is selected; links/groupIds are dropped on the clones. `Yappy.blend(steps)`.

**Location**: `frontend/src/store/app-store.ts` (`blendShapes`), `utils/context-menu-builder.ts` (Blend submenu), `api.ts`, `help-docs/features/workspace-doc.tsx`

### Panel fixes — visible header icons + draggable panels (2026-06-25)
Two issues on the new floating panels:
- **Invisible + / × header icons** (Swatches, Graphic Styles): the recurring lucide-SVG-in-flex-button collapse — a lucide `<svg>` inside a centred flex button computes to **0 width** in Chromium. Pin it: `.sw-icon-btn svg / .gs-icon-btn svg { flex: 0 0 auto; width: 15px; height: 15px }`. (Symbols panel already had this on `.sp-icon-btn svg`.) **Rule of thumb**: every lucide icon that lives as a flex item in a fixed-size button needs explicit `width/height + flex:0 0 auto`.
- **Panels not movable**: added `utils/draggable-panel.ts` — `makeDraggable(panel, handle)` + a `draggablePanel(handleSelector)` Solid `ref` helper. Drag the header to reposition; on first drag it switches the panel from edge-anchored (bottom/right) to free top/left and follows the pointer (clamped on-screen). No leaks: the `pointerdown` listener is on the handle element (GC'd with the panel on unmount) and `pointermove`/`up` are added only during a drag and removed on release. Applied to Swatches/Graphic-Styles/Symbols/History via `ref={draggablePanel('.<header>')}`. Also fixes the left-edge panel overlap (drag them apart).

**Location**: `frontend/src/utils/draggable-panel.ts` (new), the 4 panel `.tsx` (ref) + 2 `.css` (icon pin)

### Swatches — duplicate-id bug + click sets brush colour (2026-06-25)
- **All swatches recoloured together**: `createSwatch`/`createGraphicStyle` used `generateId('swatch'/'gstyle')`, but `generateId` still didn't scan `store.swatches`/`store.graphicStyles` → every swatch got the **same id** → `updateSwatchColor`'s `s.id===swatchId` matched them all. Fixed by adding both collections to `generateId`'s scan list (alongside the earlier artboards/symbols fix). *Any new top-level id-bearing collection must be added to generateId — third time this bit us.*
- **Clicking a swatch now sets the active/brush colour**: `applySwatch` also calls `updateDefaultStyles({backgroundColor|strokeColor})`, and no longer early-returns when nothing is selected — so a swatch click sets the default fill/stroke for the next shape even with an empty selection (still recolours + links the selection when there is one).

**Location**: `frontend/src/utils/id-generator.ts` (scan swatches+graphicStyles), `store/app-store.ts` (applySwatch → updateDefaultStyles)

### Swatches — self-heal existing duplicate ids (2026-06-25)
The generateId fix only prevents *new* duplicate ids; swatches/styles already created on the broken build keep their shared ids in the document, so per-item edits stay broken until repaired. Added `repairLibraryIds()` — reassigns fresh unique ids to any later duplicates in `swatches`/`graphicStyles` (first occurrence keeps the id; element links to that id then resolve to it). Called on `loadDocument` (autosave reload heals it) and when opening the Swatches / Graphic Styles panels. So a refresh (→ autosave reload) or reopening the panel self-heals a previously-broken document.

**Location**: `frontend/src/store/app-store.ts` (`repairLibraryIds`, called in loadDocument + the two panel toggles)

### Swatches — clicking a swatch updates the brush colour (2026-06-25)
The toolbar's visible "current colour" dot reads `defaultElementStyles.strokeColor` (menu.tsx) — i.e. the STROKE default is the "brush colour". A swatch chip click only set the fill default (`backgroundColor`), so the indicator never moved ("doesn't change the brush colour"). Fixed: a fill-swatch click now also sets `strokeColor` (and `fillStyle:'solid'`) on the defaults, so the brush/stroke indicator updates and pen tools draw in the swatch colour. The selected object still gets only its fill changed (chip = fill); a stroke swatch (S) sets the stroke default only.

**Location**: `frontend/src/store/app-store.ts` (`applySwatch` → updateDefaultStyles sets stroke too on fill)

### Draggable panels — extended to Properties + Layers (2026-06-26)
Finished the "all windows movable" request: applied `draggablePanel` to the built-in Properties (`.property-panel-container`, handle `.panel-header`) and Layers (`.layer-panel`, handle `.layer-panel-header`) panels — all six floating panels now drag by their header.
- **Made the drag helper delegation-based** (`makeDraggable(panel, handleSelector)` listens on the panel and checks `target.closest(handleSelector)` on pointerdown) so it survives header re-renders (the Property panel swaps its header between empty/full states).
- **Two gotchas**: (1) `e.target.closest('button')` guard means the test must press a *button-free* part of the header — the Properties/Layers headers have buttons at the edges, so press the centre. (2) A CSS `transition: all` on a panel (Layers had one) **animates `left`/`top`**, lagging the drag — `makeDraggable` now sets `panel.style.transition='none'` at drag start. Cursor affordance is set via CSS (`.panel-header`/`.layer-panel-header { cursor: move }`) rather than the ref's querySelectorAll (which races the header's render).

**Location**: `frontend/src/utils/draggable-panel.ts` (delegation + transition:none), `components/property-panel.tsx`/`.css`, `components/layer-panel.tsx`/`.css`

### Recolor artwork (2026-06-26)
Right-click selection → **Recolor Artwork…**: a panel showing the selection's actual colour palette (distinct fill/stroke/gradient-stop colours with usage counts). Click a swatch → `recolorSelectionColor(from,to)` remaps that colour across every selected object (also clears swatch links). The "Adjust all" controls → `adjustSelectionColors({hue,lightness,saturation})` transform the whole palette in HSL at once. Colour maths in `utils/color-adjust.ts` (hex⇄HSL + hue/lightness/saturation shifts, built on mesh-gradient's parseHex/rgbToHex). Palette memo re-runs on `store.dirtyRevision`. Panel is draggable via the shared helper. **Gotcha**: use the colour input's `onChange` (fires once on close) not `onInput` for the remap, so `from` stays the original row colour instead of shifting mid-drag.

**Location**: `frontend/src/utils/color-adjust.ts` (new), `store/app-store.ts` (getSelectionColors/recolorSelectionColor/adjustSelectionColors + showRecolorPanel), `components/recolor-panel.tsx` + `.css`, `app.tsx`, `utils/context-menu-builder.ts`, `api.ts`, `help-docs/features/masks-appearance-trace-doc.tsx`

### Measure tool (2026-06-26)
☰ → View → **Measure Tool** (`store.measureActive` / `Yappy.toggleMeasure()`) → a full-screen overlay (`measure-overlay.tsx`, pointer-events auto, crosshair) captures a drag and renders an SVG line + endpoint ticks + a label with the length (world units = canvas px) and angle (`atan2(-dy,dx)` → CCW-positive from horizontal). Endpoints stored in world coords so the line tracks pan/zoom; the line persists until the next drag; Esc exits. Pure overlay — no canvas-pipeline changes.

**Location**: `frontend/src/components/measure-overlay.tsx` + `.css`, `store/app-store.ts` (`measureActive`, `toggleMeasure`), `app.tsx`, `menu.tsx` (View entry), `api.ts`, `help-docs/features/workspace-doc.tsx`

### Quality & polish pass (2026-06-26)
- **Suite audit**: ran the full session e2e batch. 8 "failures" under parallel workers were just **load flakes** — a single Vite dev server can't serve ~16 concurrent page loads fast enough, so tighter `waitForSelector`s time out; all passed at `--workers=1`. The one real failure was a **stale test**: `mesh-overlay.spec.ts` recoloured by dispatching `input` on `.mesh-node`, but those became draggable `<div>`s (with a hidden `.mesh-color-input`) when draggable nodes shipped — updated it to click the node then drive the hidden input. Lesson: when a component's DOM shape changes (input→div), grep tests for the old selector.
- **De-cluttered the left-edge panel stack**: Symbols / Graphic Styles / Swatches / Recolor all defaulted to `left:0; bottom:80px` (full overlap). Cascaded their defaults diagonally (0/80, 28/120, 56/160, 84/200) so opening several shows each header; all four remain draggable to separate further.
- **Redraw/cache**: the new overlays (measure/mesh/artboard/symmetry) and panels are all `<Show>`-gated → zero cost when inactive; mesh rasterization is LRU-cached; the recolor palette memo keys off `dirtyRevision`. No regressions found.

**Location**: `tests/mesh-overlay.spec.ts`, `components/{graphic-styles,swatches,recolor}-panel.css` (cascade)

### Shape Builder (2026-06-26)
The marquee "quick logo" gesture: select ≥2 overlapping shapes → right-click **Shape Builder** (`Yappy.toggleShapeBuilder()`) → drag a stroke across shapes to **merge** them (boolean union via the existing `applyPathfinder(ids,'union')`), Alt-drag to **delete** the crossed shapes. `shape-builder-overlay.tsx` is a full-screen overlay (active when `shapeBuilderActive && selection≥2`): tracks the drag in world coords, computes "touched" = selected shapes any stroke point falls inside (`hitTestElement`), highlights them live (bbox tint, red when Alt) + draws the stroke, and runs union/delete on release. Esc exits.
- **Scope**: this is **shape-level** (merges whole shapes the stroke crosses), not Illustrator's face-level sub-region builder (which needs a planar arrangement of all faces — `(∩ inside) − (∪ outside)` per subset, 2^N booleans). Shape-level covers the common "fuse these primitives" demo; face-level carving is a future enhancement. The two-shape Pathfinder (union/subtract/intersect/exclude) remains for precise ops.

**Location**: `frontend/src/components/shape-builder-overlay.tsx` + `.css`, `store/app-store.ts` (`shapeBuilderActive`, `toggleShapeBuilder`), `app.tsx`, `utils/context-menu-builder.ts`, `api.ts`, `help-docs/features/logo-toolkit-doc.tsx`

### Shape Builder → face-level (2026-06-26)
Upgraded Shape Builder from shape-level to true Illustrator-style **face-level**. `computeShapeFaces(elements)` in `utils/path-boolean.ts` decomposes a selection into atomic faces: for every non-empty subset S of the shapes, `face(S) = (∩ shapes in S) − (∪ shapes not in S)` via polygon-clipping `intersection`/`difference`. Two overlapping circles → 3 faces (two crescents + the lens). Bounded to ≤8 shapes (2^N subsets) — beyond that the overlay falls back to whole-shape union/delete. `commitShapeBuilderFaces(ids, touchedKeys, mode)` replaces the originals with the face decomposition: merge → union of touched faces as one path + every untouched face kept as its own path; delete → drop touched faces, keep the rest (carve a notch / punch the lens). Overlay hit-tests faces with `pointInMultiPoly` (even-odd ray cast honouring holes) and highlights them with an evenodd SVG path. e2e proves the carve (Alt-drag the lens of 2 circles → 2 crescent paths).
- **Gotcha**: regions are world-space already (geometryToRings offsets by element centre), so no transform needed for hit-test; only world→screen for the highlight.
- **Substrate for Live Paint**: the same face decomposition is what a future Live Paint Bucket would fill per-region.

### Magic Wand + Distort & Transform (2026-06-26)
**Magic Wand** (`selectSimilar(refId?, 'fill'|'stroke'|'both')`, app-store) selects all unlocked/visible elements matching the reference's colour. **Distort & Transform** (`applyDistort(ids, kind, amount)` + `utils/path-distort.ts`) replaces each selected shape with a distorted `path`: Pucker/Bloat push edge midpoints in/out radially (originals fixed); Twirl rotates points by an angle that falls off with radius; Zig-Zag/Crystallize/Roughen densify the outline then displace radially (alternating, spiky-outward, seeded-random respectively). All operate on `elementToMultiPolygon` world rings → `buildPathFromPoly`, so they work for any shape and keep holes. Deterministic (index-hash pseudo-random, no Math.random) → reproducible in tests. Covers Illustrator's Effect→Distort&Transform family and the Liquify intent as one-shot filters. Context-menu: "Select Similar" + "Distort & Transform" submenu. API: `Yappy.selectSimilar()`, `Yappy.distort(kind, amount)`.

### Knife + Scissors (2026-06-26)
One **cut tool** (`cutToolActive`, `cut-overlay.tsx`) hosts both: drag a line → **Knife**, short click on a path → **Scissors**. **Knife** (`knifeCut(p0,p1,ids?)`) slices each crossed shape via `splitMultiPolyByLine` (path-boolean) — builds two giant half-plane quads on either side of the infinite line and intersects the shape with each (`polygonClipping.intersection`); a shape is only replaced when both sides are non-empty (line genuinely divided it). **Scissors** (`splitPathAt(id, point)`) snaps to the nearest path anchor: a closed path is rotated to start there and opened (one open path); an open path splits into two. Non-path shapes are converted via `shapeToPath` first. Overlay distinguishes click vs drag by screen-distance threshold (6px). API: `Yappy.toggleCutTool()`, `Yappy.knife()`, `Yappy.splitPath()`.

### Generative shapes — Spiral / Arc / Rectangular & Polar Grid (2026-06-26)
Added as path/element generators in `api.ts`: `createSpiral(cx,cy,r,turns,decay)` and `createArc(cx,cy,r,startDeg,endDeg)` build open `path` elements (anchors need `kind:'smooth'|'corner'` — required field, easy to miss). `createRectGrid`/`createPolarGrid` build a set of `line` elements (grids = the actual lines; polar = concentric full-circle arcs + radial spokes) then `setSelected`+`groupSelected` so each grid moves as one group — more robust than open multi-subpath paths. Wired into the canvas (no-selection) context menu under **Insert**, placed at the right-click world coords (`worldX/worldY`). Importing `YappyAPI` into context-menu-builder did not introduce a problematic circular import.

### Vertical Type (2026-06-26)
Added `verticalText?: boolean` to text elements. The `TextRenderer` gets an early vertical branch: characters of each line stack top→bottom (`textBaseline:'hanging'`, centred), and each `\n`-paragraph becomes a left→right column (`colWidth = fontSize*1.4`). Style-agnostic — text uses `IRenderer.fillText` in both sketch and architectural modes, so no rough.js parity work needed. Element-level field → serialized with the element automatically (no document-collection persistence checklist). API `Yappy.setTextVertical(id, on?)` + context-menu toggle for text/richtext selections.

### Symbol Sprayer (2026-06-26)
`symbol-sprayer-overlay.tsx` + store `sprayerActive`/`sprayerSymbolId`. Arm a symbol via the Spray button in the Symbols panel (`toggleSymbolSprayer(symbolId)`), then drag on canvas — the overlay samples points spaced by the brush radius (26 world-units; denser when you drag slow) and on release `spraySymbolInstances(symbolId, pts, {scaleJitter})` batch-creates instances with size jitter as one history step. Live brush-radius cursor + sprayed-dot preview. Gotcha for tests: `createSymbol(name, [el])` consumes the source selection into one instance (Illustrator behaviour), so total instances = 1 + sprayed. API `Yappy.toggleSymbolSprayer()`, `Yappy.spraySymbols()`.

### Live Paint (2026-06-26)
True Live Paint built on the Shape Builder face engine (`computeShapeFaces`). `makeLivePaint(ids)` tags ≥2 source outlines with `livePaintGroupId`; `livePaintFillAt(point, color)` finds the atomic face under the point and inserts a **locked region-fill path** (`livePaintFillFor`+`livePaintFaceKey`, fill colour, no stroke) **beneath** the outlines in z-order. Fills stay **live** via `regenerateAllLivePaint()`, run from a guarded `createEffect` in `live-paint-overlay.tsx` that subscribes to `dirtyRevision`/`elements.length`: per-group member-geometry **signature guard** skips no-op recomputes and prevents the effect's own `bumpDirtyRevision` from looping; on a real change it rebuilds each fill's geometry from the current face of its stored colour-map key (dropping fills whose region vanished). Key gotchas:
- **Group resolution must be face-based, not `hitTestElement`** — Live Paint shapes are usually unfilled outlines whose interior doesn't register a hit; resolve the group/face via `pointInMultiPoly` over `computeShapeFaces`.
- **Fills are inert**: `hitTestElement` early-returns `false` for `livePaintFillFor` elements + they're `locked`, so clicks always reach the source outlines.
- **No new persistence**: everything rides on element fields (auto-serialized); the sig map is module-local and self-heals on load (first dirty tick recomputes identical geometry).
- The fill insert sets the sig to current geometry so the engine doesn't immediately redo it.

### Width tool — variable-width strokes (2026-06-26)
Open paths carry a `widthProfile: {t, width}[]`. `utils/variable-width.ts` samples the centreline (`anchorsToPathData`→`PathUtils.parsePath`→`getPointOnPath`, tangent via finite-diff → normal), interpolates width at each t, and builds a closed **ribbon** polygon (left offsets + reversed right offsets). Rendered by a hook in `renderElementCore` (before the registry dispatch): `if type==='path' && widthProfile && !pathClosed` → fill the ribbon (works in both draw styles since it's a fill; a hairline same-colour edge keeps thin segments crisp). The **Width tool overlay** finds the nearest path + parameter t to the press point (`nearestTOnPath`), and on release sets a width point = 2× the perpendicular drag distance (`setWidthPoint(id,t,width)` merges points within 0.04 t). `clearWidthProfile` resets. Gotchas: closed paths keep uniform stroke (annulus offset is harder — deferred); `widthProfile` is an element field so it auto-serialises (no document-collection persistence). **Test gotcha**: `getElement()` returns a live store proxy — snapshot (`JSON.parse(JSON.stringify(...))`) before a later mutation or the earlier read reflects the mutation.

### Discoverability — Illustrator tools in the Command Palette (2026-06-26)
The new tools (Live Paint, Shape Builder, Magic Wand, Knife/Scissors, Width, Symbol Sprayer, Distort, Vertical Type) were only on the right-click menu, which is gated on `selectionCount` AND on the right-click landing on a shape — but Live Paint's whole use-case is **unfilled outlines**, whose transparent interior doesn't register a hit, so right-clicking the middle of two selected outline circles opened nothing. Fix: registered them all in `utils/command-registry.ts` `getCommands()` so they're searchable in the **Command Palette (Ctrl/Cmd+K)** — the reliable entry point regardless of fill. Lesson: any tool that operates on unfilled/transparent shapes needs a non-hit-test entry point (palette/menu), not just right-click-on-canvas.

### Tool-mode overlays — make exit obvious (2026-06-26)
The Knife/Scissors (and Shape Builder, Live Paint, Width, Sprayer) overlays are full-screen `position:fixed; inset:0; pointer-events:auto` divs at z-index 39. The toolbar (z 10002) sits above so it's still clickable, BUT picking another tool didn't clear the mode flag, so the overlay kept intercepting the canvas → users felt "stuck" in the Knife tool. Fixes: (1) `setSelectedTool` now clears all transient overlay modes (cut/shapeBuilder/livePaint/width/sprayer/measure) — picking any tool exits; (2) added a clickable **Done ✕** button to the cut hint (the hint is `pointer-events:none`, so the button itself needs `pointer-events:auto`); (3) Esc already exited. Lesson: any modal full-screen overlay needs a visible exit affordance AND must deactivate when the user switches tools — Esc alone isn't discoverable.

### Review + tablet hardening of the Illustrator-class tools (2026-06-26)
A deep review of the 9 new features (Shape Builder, Magic Wand, Distort, Knife/Scissors, generative shapes, Vertical Type, Sprayer, Live Paint, Width) surfaced real bugs, now fixed:
- **C1 (rotation dropped)** — `geometryToRings`/`elementToMultiPolygon` ignored `el.angle`, so EVERY polygon op (Pathfinder, Shape Builder, Knife, Distort, Live Paint) was wrong for rotated shapes. Fixed by rotating each ring point about the element centre by `el.angle` (radians — it's fed straight to `ctx.rotate`). This also fixes a long-standing Pathfinder bug.
- **C2 (Live Paint orphans)** — when a group dropped below 2 members the fills were left behind forever. `regenerateAllLivePaint` now collects group ids from fills too and strips orphan fills.
- **H5 (id collision)** — `generateId` didn't scan `livePaintGroupId` tags (not an `.id` field), so a new group after reload reused the same id and cross-wired groups. Now scanned.
- **H1 (phantom history)** — `setWidthPoint` pushed history / converted type before validating closedness. Now validates first, single guaranteed mutation.
- **H3 (z-order)** — all replace ops (`replaceElementsPreservingOrder`) now splice results at the first consumed element's z-position instead of promoting to the top (Illustrator preserves stacking).
- **H2 (sketch parity)** — the Width ribbon now renders via rough.js in sketch mode (was identical clean fill in both styles).
- **M3/M4/M7/M8/M9** — 8-shape cap surfaces a toast (Shape Builder + Live Paint) instead of silent fallback; Scissors clears `widthProfile`/live-paint tags on pieces; Vertical Type advances columns right→left (CJK/Illustrator); spiral grows from centre with a corrected decay exponent; polar-grid rings are closed (no seam, via `createArc` full-circle → `pathClosed`).

**Tablet/touch**: the canvas context menu is deliberately suppressed for touch (iPad palm-rest), and the Command Palette had no on-screen trigger → every new tool was unreachable on a keyboard-less tablet. Added a **⌘ Command Palette button** to the toolbar (the touch gateway to all tools). Added `pointercancel` abort handlers to the 4 drag overlays (stuck-drag on touch interruption). Added an on-screen **Merge/Delete toggle + Done** to Shape Builder (no Alt key on tablets). All overlays already had `touch-action:none` and pointer-event handlers, and `setSelectedTool` exits tool modes. **Lesson**: any feature gated behind right-click or a keyboard shortcut is invisible on tablet — provide an on-screen/palette entry, and any modifier-key interaction (Alt-drag) needs a touch toggle.

### Vertical Type — proper implementation (2026-06-26)
Upgraded Vertical Type from a fixed-grid approximation to a real implementation:
- **`measureVerticalText(el)`** (text-utils) lays out glyphs into columns (one per `\n`), uniform column width = widest glyph + gap, vertical advance = `fontSize*1.15`, columns right→left (CJK/Illustrator). Returns the geometry AND the exact element size.
- **`setTextVertical(id, on?)`** (store, replaces the api's inline `updateElement`) toggles `verticalText` AND resizes the box: on → measured vertical size; off → re-flow to a horizontal box (`measureMaxLineWidth` + `measureWrappedTextHeight`). So selection bounds + hit-testing (text is bbox-based) match the rendered columns.
- **Renderer** centres each glyph (`textBaseline:'middle'`, `textAlign:'center'`), right→left columns, honours `verticalAlign` (top/middle/bottom).
- **Edit-commit** (text-editing-handler) re-flows + resizes a vertical text when its content changes.
- Glyph runs use `[...str]` (surrogate-safe). Verified with mixed Latin+CJK ("YAPPY" / "縦書き") — correct stacking, ordering, and a snug selection box.
**Test gotcha (again)**: `getElement()` returns a live store proxy — snapshot primitive width/height before a later toggle, or the earlier read reflects the toggle.

### Full Illustrator-class tool coverage — 12 tools in one batch (2026-06-26)
Implemented the remaining deferred toolset to Illustrator quality, each as a transient-flag + full-screen overlay (the proven pattern) with API + Command Palette + e2e:
- **Curvature** (`utils/curve-fit.ts` Catmull-Rom→Bézier), **Reshape** (cosine-falloff anchor drag, endpoints pinned, `normalizePathElement` re-fits bbox on release).
- **Blob Brush** / **Path Eraser** — both build a disk-swath along the drag (`diskRing`+`unionPolys`, densified so disks overlap); Blob unions same-colour overlaps, Path Eraser `subtractPolys` (boolean difference) carves shapes.
- **Puppet Warp** — pins drive the existing `el.warp` grid via **Shepard (inverse-distance²) interpolation** over the rest grid, so the normal warp render path draws it; pins hide the raw grid handles (gate `el.puppetPins`).
- **Perspective Grid** — non-blocking 2-point grid overlay (`pointer-events:none` except handles), `projectToPlane` maps a bbox to a foreshortened 4-corner envelope toward the VPs.
- **Lens Flare** (api generator), **Touch Type** (`charTransforms[]` per-glyph, renderer draws each glyph transformed), **Slice** (`exportRegion` generalised from `exportArtboard`), **Graph tools** (barChart now reads `barValues`; `setChartData`), **Symbolism brush** (Sizer/Spinner/Shifter/Screener/Stainer/Styler over instances with falloff), **Live Paint Selection** (`livePaintFaceAt` hover-highlight + Alt-click clear).

**Recolor live fix**: native `<input type=color>` only fires `change` on commit — use `onInput` for live, freeze the swatch list with `<Index>` during a drag, map current→new each tick (`recolorSelectionColor(record=false)`), snapshot history once.

**Toolbar/menu persistence + z-order**: localStorage UI prefs must be re-applied AFTER `loadDocument` sets `globalSettings` (else a doc restore reverts them); persist the dragged toolbar `position` to localStorage; and a z-index on a dropdown is **trapped in its ancestor's stacking context** — to put the menu above the floating toolbar (z 10002) you must raise the menu's fixed *wrapper* (z 10060), not just the dropdown.

### Vector Tools palette — exclusivity, Type-on-Path, blob fix, resizable (2026-06-26)
Verified every palette tool works by clicking the actual `.vt-row` buttons in an e2e and fixing what broke:
- **Symbol Sprayer was dead from the palette**: `toggleSymbolSprayer()` with no arg means "turn OFF" (the `undefined` sentinel), so the panel could never activate it. Panel now passes `store.symbols[0]?.id`.
- **Overlays could stack**: panel toggles didn't exit other modes, so two full-screen tool overlays could be active at once. Added `exitAllToolModes()` (extracted from `setSelectedTool`) and a `modeRun()` helper that exits all modes then toggles the clicked one → exclusive activation (Illustrator-like).
- **Type on Path (guided)**: new `typeOnPathActive` overlay — hover-highlights line/curve/freehand elements (the types `getElementTextPath` + the connector/freehand renderers support `curvedText`) and click → prompt → `attachTextToPath` (sets `curvedText`+`containerText`). Generic pen `path` isn't supported (SpecialtyShapeRenderer doesn't draw curvedText) — scoped to line/arrow/bezier/freehand/organicBranch.
- **Blob Brush over-merge** (user report "draw again selects everything"): the merge used a **bbox** prefilter, so a new stroke swept in + re-selected every same-colour blob whose bounding box merely overlapped. Added `polysIntersect` (real geometric test) so only genuinely-touching blobs merge.
- **Resizable palette**: native CSS `resize: both` on `.vt-panel` (with min/max) + a `ResizeObserver` persisting `{w,h}` to localStorage and restoring on open; rows get `min-width:0`+`title` for clean truncation. The earlier "centered/wrapping" look the user saw was a stale build; the list layout renders left-aligned single-line.

## Time-lapse (Procreate-style process recording)
- **New feature** (`utils/timelapse-manager.ts`, `storage/timelapse-store.ts`, `components/timelapse-overlay.tsx`, `components/timelapse-player.tsx`): captures one downscaled WebP frame per committed edit, persisted to **IndexedDB** (the app's first IndexedDB store — localStorage's ~5MB cap is unfit for many frames). Capture is driven by a single debounced `createEffect` on `undoStackLength`/`elements.length`/`dirtyRevision`, so **no draw/selection handler changed**. `pushToHistory` fires on pointer-DOWN, so the 250ms trailing-edge debounce coalesces down+up into one frame showing the *finished* stroke. Replay player + WebM export (reuses `VideoRecorder` on an offscreen canvas, export path A). Hotkey **Ctrl+Shift+T**.
- **SolidJS gotcha — accidental effect dependency caused an infinite loop**: the player's load/cleanup `createEffect` called `reset()`, which read `urls()` (via `revokeObjectURL` over the array) and then `setUrls([])`. Reading `urls()` inside the effect made it a *dependency*; `setUrls([])` creates a **new array reference each run** (default `===` equality sees a change) → effect re-fires forever. Symptom was bizarre: the player `<Show>` rendered (signal true) yet the sibling effect logged the open flag as `false` repeatedly. Fix: wrap the load/reset calls in `untrack(() => …)` so **only** the intended signal (`timelapsePlayerOpen()`) is tracked. Lesson: any signal *read* inside a `createEffect` becomes a dependency — including incidental reads buried in helper functions; pair `setX([])` resets with `untrack` or a value-equality guard.

## Pathfinder boolean-op result colour follows Illustrator (2026-06-27)
`applyPathfinder` used to style every boolean result from `els[0]` (the **backmost** shape after the back→front sort), so an intersect of a back yellow rect + front pink diamond came out yellow. Illustrator's Pathfinder takes the **frontmost** object's appearance for **union/intersect/exclude**, and keeps the **backmost** appearance only for **subtract** ("minus front", where the back shape is what survives). Fix: `const base = op === 'subtract' ? els[0] : els[els.length - 1]`. This also brings the boolean path in line with the region path (`applyPathfinderRegion`), which already coloured each face by the topmost covering shape. Gotcha when verifying: results produced before an HMR/reload can still show the old backmost colour — confirm against a freshly reloaded bundle.

## Multi-output path ops need a shared `batchIds` set (duplicate-id render bug) (2026-06-27)
`generateId(type)` assigns ids "max-of-store + 1" by scanning the store — it has **no persistent counter**. So when one operation builds several elements in a synchronous loop **before** committing them, each `generateId` call sees the same store and returns the **same id**. `buildPathFromPoly` was calling `generateId('path')` with no `batchIds`, so Pathfinder **Exclude** (and Divide/Trim/Merge/Crop, Knife, Path Eraser, Blob Brush, Outline Stroke, Offset Path, Distort, Live Paint fills) produced multiple elements all sharing `path-1`; only the first rendered/selected, the rest silently vanished. The symptom *looked* like a geometry bug (Exclude "lost the rectangle"); it was actually an id-collision render bug — the `polygon-clipping` geometry was correct all along. Fix: thread an optional `batchIds: Set<string>` through `buildPathFromPoly`→`generateId`; allocate one `Set` per op and pass it at every looped call site. (`generateId` already supported `batchIds` for paste/duplicate — the path builders just weren't using it.) Lesson: any code creating >1 element per tick before `setStore` MUST share a batch set. Verified by driving the real app via `window.Yappy` + Playwright, recolouring each result piece distinctly to prove both actually render.

## Illustrator-parity gap-fills — batches 1–4 (2026-06-27)
Closed most gaps from `docs/30-yappydraw-tips.md`, each in a verified commit:
- **Math in numeric fields**: `utils/eval-expr.ts` is a tiny recursive-descent evaluator (NO `eval`/`Function`) supporting `+ - * / ( )` and `%` (percent of the field's current value, so `200-50%`→100). `MathNumberInput` switches the property-panel number field from `<input type=number>` (which can't even accept `*`/`%`) to a text input that commits on Enter/Tab/blur and keeps arrow-key stepping.
- **Keybinding archaeology matters**: the canvas keydown handler splits into mutually-exclusive blocks — `if (isCtrlOrMeta) {…}`, an `if (e.altKey && !ctrl && !meta)` block, and a `!alt && !ctrl && !meta` block. A naive `(ctrl||meta)?0.1` inside the no-modifier nudge branch was DEAD CODE; Ctrl+Arrow fine-nudge had to go in the Ctrl/Meta block. Likewise most Alt-letters are already bound (Alt+Y=symmetry, Alt+O/L/M/R/Z…), so new view toggles (Outline) went palette-only rather than fight for a chord.
- **Spacebar pan without losing mindmap-collapse**: space-keydown switches to the existing `pan` tool (reusing all pan/cursor logic) and restores the previous tool on keyup; a <220ms tap with a selection still fires collapse. Two-finger pan + pinch-zoom already existed in `canvas.tsx` (gesture engine ~L892).
- **Stroke gradients**: added `el.strokeGradient`; `RenderPipeline.applyStrokeStyle` builds the gradient in **world** coords (arch shape renderers stroke at absolute `el.x+…`, NOT a centred space like `applyGradient` for fills — easy trap). Widened `IRenderer.strokeStyle` to `FillStyle`. SVG export of *simple* shapes uses a native `<rect>/<path>` serializer that bypasses the pipeline → still solid-stroke (documented limit); the pipeline-SVG fallback path does emit gradient defs.
- **Outline view** is applied in `renderLayersAndElements` (canvas only, so exports are unaffected) by cloning each element to a fill-stripped ~1px architectural stroke, and it must **bypass the rough-cache** (the cache hash doesn't encode the mode).
- New APIs: `select`, `getSelectedTool`, `getViewState`, `setHistoryDepth`/`getHistoryDepth`, `setStrokeGradient`/`clearStrokeGradient`, `rearrangeArtboards`, `toggleOutlineView`/`isOutlineView`.
- Verified e2e per batch against a real dev server (4 spec files), driving `window.Yappy` + canvas pixel scans (transform-independent: compare colour centroids / fill-pixel counts rather than guessing exact pixel coords).

## Version reset to 0.5.0 + test-suite collectability (2026-06-27)
- Versioning reset to **0.5.0** (continuing from here per request).
- **The full suite was uncollectable**: `tests/api.spec.ts` and `tests/solid-block.spec.ts` imported `../src/...` (real path `../frontend/src/...`). A single bad import is a *collection* error that aborts `npx playwright test` for ALL specs — so a green subset can hide a red whole-suite. Fixed both paths.
- Added `playwright.config.ts`: a `webServer` that auto-starts `vite --port 5173` (`reuseExistingServer:true`) and defaults `process.env.YAPPY_URL` so workers inherit it — the suite now self-hosts (`npx playwright test` just works). ~108 specs hardcode a port vs ~83 honour YAPPY_URL; standardising on YAPPY_URL is the remaining infra cleanup.
- Sweep found ~13 **pre-existing** failures (stale assertions/renamed selectors across DSL/BPMN/slides/flare/layer-background/export/productivity/hotkeys) — none from the effects/render work; cataloged in `docs/bugs/known-test-failures.md` for a judgment-call triage (stale-test vs intentional app change). `_mesh.spec.ts` fixed (waitForSelector('canvas')).

## DSL strictness + UI-test refresh + release-notes process (2026-06-27)
- **DSL parser routing**: only `{` was treated as JSON, so `[1,2,3]` skipped JSON validation and fell through to the lenient text parser (accepting garbage). Route `[` to the JSON parser too (it already rejects non-objects with a clear "JSON object" error). `importDSL` now returns `null` when 0 nodes parse — garbage no longer yields an empty result.
- **UI e2e robustness**: prefer the public API for *outcomes* (`getSelectedTool`, `toggleLayerPanel`) over brittle toolbar/flyout selectors; a tool button may live in a collapsed flyout and not be in the DOM. `text=Foo` is a substring match and can hit multiple elements (the Export menu had two "Export" items → disambiguate by the unique shortcut text).
- **Release notes**: every "ship it" now writes `release-notes/<version>.md` (CLAUDE.md step 3). Backfilled 0.5.0/0.5.1/0.5.2.

## Tier-1 effects + test-infra fixes (2026-06-27)
- **Effects**: Convert to Shape (mutate type, drop path geom), Split Into Grid (clone source rect into cells, shared batchIds), Convert to Guides (edges → guides, delete shapes), Feather (`ctx.filter = blur()` in the pipeline, resets via the per-element save/restore), Outer Glow (shadow slot, 0 offset — shadow wins if both set), Scribble (bbox back-and-forth path in the fill colour), per-object Crop Marks (overlay after the layer loop), Create Swatch Info (chips+labels). All in `applyTransformations`/`renderLayersAndElements` or the API.
- **Render-test gotchas (reconfirmed)**: a 1px stroke antialiases to grey — detect "inked" pixels (channel-sum < 600), not pure dark. The long-running dev server's HMR can go stale for widely-imported modules (canvas-renderer) — validate render changes against a fresh `vite preview` build, not the session's dev server. Crop marks/bleed/artboards only render in `infinite` docType — call `Yappy.setDocType('infinite')` in those specs.
- **The "6 failing" specs were not app bugs**: `alignment`/`comprehensive` clicked stale button titles ("Distribute Horizontal" → real "Distribute Horizontal Centers"; "Toggle Theme") and hardcoded `localhost:5173`; `default-style`/`clipping-mask` default to port 5180. Fix: drive via the public API (`distributeSelectedElements`, `toggleTheme`) and honour `YAPPY_URL`. Broader: ~108 specs hardcode a port / ~83 honour YAPPY_URL — a `playwright.config.ts` webServer is the durable fix (not done yet).

## Canvas redraw deps + Smooth path (2026-06-27)
- **Redraw reactivity bug**: the canvas draw `createEffect` (canvas.tsx ~L415) explicitly tracked slides & layers props and a `dirtyRevision` counter, but NOT `store.artboards`, `store.docType`, `outlineView`, `trimView` or `globalSettings.bleed`. Those relied on every setter calling `bumpDirtyRevision()` — and `setDocType` doesn't, so switching slides↔infinite left a stale canvas. Fix: track those deps in the effect (matching the slides/layers pattern). Investigation note: artboards DO render on add/update (proven with a coloured-bg artboard = 178k px); my earlier "frame didn't render" was a false alarm from trying to detect a faint #bbb 1px frame on a white-on-white artboard.
- **smoothPath**: Laplacian smoothing — each interior anchor moves `strength` toward its neighbours' midpoint over `iterations` passes; open-path endpoints pinned, bezier handles carried with the anchor. Distinct from `simplifyPath` (RDP point reduction). Mirrors simplifyPath's subpath plumbing (`getPathSubpaths` → write `pathAnchors`/`pathSubpaths`).

## Swatch groups + print bleed/crop marks (2026-06-27)
- Swatch model gained an optional `group`; `listSwatchGroups` buckets by name (ungrouped under ''), `createSwatchGroupFromSelection` adds the selection's distinct colours (skipping dupes) to a named group.
- Bleed is a `globalSettings.bleed` px value (persisted); `drawBleedAndCropMarks` in canvas-renderer draws a dashed green bleed boundary + L-shaped crop marks at each artboard's trim corners, screen-constant via `/scale`. Gated on `docType !== 'slides'` (artboards only exist in `infinite`/board docs).
- **Test gotchas**: (1) the running dev session often auto-restores a `slides` doc, so artboard/bleed/trim e2e must call `Yappy.setDocType('infinite')` first. (2) An at-origin artboard is mostly off-screen at 1:1 — place it in view for pixel scans. (3) Antialiased green crop lines blend toward white (high B), so a `G>B+30` predicate misses them — loosen to `G>B`. (4) Observed: an artboard frame may not repaint until the next redraw trigger (pre-existing RAF/reactivity quirk), so toggling bleed both proves the feature and forces the repaint.

## Colour Guide — tints, harmonies, palette-from-image (2026-06-27)
- New `utils/color-harmony.ts` builds on the existing `color-adjust.ts` HSL helpers: `generateTints` (light→dark ramp via lightness interpolation), `generateHarmony` (hue offsets per rule), and `extractImagePalette` (downscale to 64px, quantise RGB to 16 levels/channel, rank buckets by frequency, return each bucket's average). `mesh-gradient.rgbToHex` takes positional `(r,g,b)`, not an object.
- `applyPaletteToSelection` / `applyHarmonyToSelection` / `recolorFromImage` reuse the atomic-remap pattern (map distinct selection colours → palette, one `setStore` pass keyed on originals). `extractImagePalette` is async (Image load) so the api wrappers are async; the api also resolves an element id → its `backgroundImage`.

## Select-Same / artboard duplicate-fit / recolor shuffle (2026-06-27)
- **selectSimilar** generalised from fill/stroke/both to a predicate map keyed by match mode (fontFamily/fontSize/opacity/strokeWidth/type) — `Select > Same`. Each mode is just an equality on the ref element's attribute.
- **duplicateArtboard / fitArtboardToArtwork**: "on" an artboard = element *centre* inside the artboard rect (cheap + predictable). Duplicate clones contained elements with a shared `batchIds` set (unique-id trap again); fit recomputes the bbox + padding.
- **shuffleSelectionColors**: derangement via random rotation k∈[1,n-1] over the *distinct* selection colours, then one atomic `setStore` remap keyed on original values (never identity → always visibly changes). Gotcha when testing: default shapes carry a black **stroke**, so `getSelectionColors` saw 3 colours not 2 — set strokeColor:'transparent' to isolate fills.

## Illustrator "Ultimate Tips" quick wins (2026-06-27)
Five low-risk, high-value gaps from the 2nd video, all pure-data ops + one render hook:
- **Trim View**: clips the element-render loop in `renderLayersAndElements` to the union of
  artboard rects (`ctx.beginPath()` + a `ctx.rect()` per artboard + `ctx.clip()`), restored
  after the loop. Gated on `store.trimView && artboards.length && docType!=='slides'`; the
  toggle refuses when there are no artboards. Overlays/handles render after the restore.
- **Clean Up** (`cleanUpElements`) deletes empty text frames, zero-size/short-path strays, and
  *unpainted* objects (no fill AND no stroke AND no image AND no text); skips locked elements.
- **Paste on All Artboards**: finds the artboard under the selection centroid (the "home"),
  then clones the selection to every other artboard at the same offset — using a shared
  `batchIds` Set so each clone gets a unique id (same duplicate-id trap as the path ops).
- **Swap fill/stroke** (Shift+X) and **Delete Unused Swatches** (diff `fillSwatchId`/
  `strokeSwatchId` against `store.swatches`) are trivial.
- Reminder: `'freehand'` is NOT an ElementType (pencil tools are `fineliner`/`inkbrush`/
  `marker`); tsc catches it. New view toggles go in the command registry (display-only
  shortcut field) since the keymap is crowded.

## Time-lapse capture is viewport-independent — top-cut regression guard (2026-06-27)
`renderFrame` (`utils/timelapse-manager.ts`) builds each frame on an **offscreen** canvas sized to the *full slide* (`canvas.height = targetW * sH / sW`) and translates by `-spatialX/-spatialY`, so the capture always covers the whole slide regardless of how the editor viewport is panned/zoomed — mirroring the known-good `recording-manager.captureThumbnail`. The player renders the frame with `object-fit: contain` and the displayed image sits flush to the stage top/bottom, so content drawn at the very top of the slide (e.g. shapes at y≈40 of a 1920×1080 slide) is **not** clipped. Added an assertion-based e2e (`tests/timelapse-top-cut.spec.ts`) that records top-hugging triangles and asserts the player image's top/bottom stay within the stage bounds, locking in the behaviour. **e2e gotcha:** port 5173 was being squatted by an unrelated Dockerised app (`propeak-cuckoo-frontend-1`; `docker stop` to free it) — when 5173 is taken, start yappy's vite on another port and pass `YAPPY_URL=http://localhost:<port>` to the spec (the spec already honours `YAPPY_URL`).

## Vector Pen: Clock-Method constrain + keyboard-free anchor editing (2026-06-29)
Brought the vector **Pen** (`path` tool, hotkey **P**) closer to Illustrator and made its
advanced editing reachable on a keyboard-less tablet.
- **Clock Method (Shift-constrain):** `constrainHandleVec(dx,dy)` in
  `utils/tool-handlers/pen-path-handler.ts` snaps a Bézier handle vector to the nearest 45°
  (preserving length). Applied during creation (`penOnMove`) and editing
  (`handlePathNodeDrag` in `selection-handler.ts`). The constrain flag is
  `e.shiftKey || pState.secondaryContact || store.penConstrain` — so it fires from the Shift
  key, the existing Procreate "second-finger" contact, **or** a persistent on-screen toggle.
- **Two pens, one name:** `PenToolGroup` (hotkey 7) is the freehand brushes (fineliner/
  inkbrush/marker); the Illustrator-style Bézier pen is the **`path`** tool. Don't conflate them.
- **Second-finger during creation:** the constrain detection in `handleTouchStartGesture`
  gated on `isDragging || isSelecting`; added `|| isPenBuilding` so the second-finger constrain
  also works while *drawing* a path, not just while editing.
- **Tablet anchor editing** (previously 100% modifier-key-gated → unreachable on tablet):
  - **Tap** an anchor (touch/pen) toggles smooth↔corner. Implemented with a *deferred-history*
    arm (`pState.penTapAnchor`): on anchor pointerdown we set up the drag but skip
    `pushToHistory`; `handlePathNodeDrag` ignores sub-slop (4px/scale) jitter and only commits
    history once a real drag starts; `selectionOnUp` fires `convertPathAnchor` if still armed.
    Result: a tap is one clean undo step (convert), a drag is one undo step (move) — never both.
    Cleared in `cancelInflightForGesture` so a 2-finger gesture can't leave a stale toggle.
  - **Long-press** an anchor → context menu (Make Smooth/Corner, Delete Anchor); long-press the
    outline → Insert Point Here. `buildAnchorMenu` in `canvas.tsx` reuses the existing
    `ContextMenu` via a new `anchorMenuItems` signal (falls back to the generic menu when null).
    Added `canInsertPathAnchor` (non-mutating `findClosestPathSegment` probe) so the Insert item
    only shows when the press is actually on the path.
- **UI:** `pen-options-bar.tsx` — a compact floating 90°/45° toggle, visible while the Pen tool
  is active or a single path is selected (so it's reachable during creation, before anything is
  selected). State lives in `store.penConstrain` (`setPenConstrain`).
- **Gotcha:** tap-to-toggle only arms for the `path-anchor-*` handle, NOT `path-in`/`path-out`,
  so dragging the Bézier handles themselves stays a pure drag on touch.

## 2026-06-30 — Industry-grade sequence diagrams (DSL timeline)

Reworked sequence diagrams from "flat cascading arrows" into a proper ordered
**timeline** so they match Mermaid/PlantUML/Lucidchart on the features that matter.

- **IR:** added `DSLDiagram.sequence?: DSLSequenceMeta` (`types.ts`) — an ordered
  `events[]` of `message | note | fragment-start | fragment-section | fragment-end |
  activate | deactivate`, plus an `autonumber` flag. Bare-message diagrams (the
  legacy text path) synthesise one `message` event per edge via `getSequenceEvents`,
  so the engine always walks a single timeline.
- **Geometry is shared:** `computeSequenceTimeline()` in `sequence-layout.ts` is a
  pure walk that assigns each event a Y offset and computes fragment extents +
  activation spans. BOTH the layout (lifeline height) and the engine (element
  placement) call it, so heights and placements can't drift. Notes get a text-length
  height estimate (no renderer available in layout).
- **Engine:** `renderSequenceTimeline()` (`dsl-engine.ts`) draws actor dashed
  lifelines, `umlFragment` boxes (operator tab + guard label + dashed `else`/`and`
  dividers), `activationBar`s (staggered by nesting depth), `umlNote`s, and messages
  with auto-numbering. Fragment X-extent comes from the participants its inner
  messages touch (tracked during the timeline walk).
- **Arrow semantics:** Mermaid `->>`=filled sync, `-->>`=dashed reply, `-)`=async,
  `-x`=lost; `+`/`-` on the target activates target / deactivates source. Native YSL
  gained `->>`/`-->>`/`-->` operators, `note`/`loop`/`alt`/`else`/`opt`/`par`/`and`/
  `activate`/`deactivate`/`autonumber`, and trims indentation for messages nested in
  fragments.
- **Gotcha (bit me twice):** `YappyAPI.createElement('line'|'arrow', …)` defaults
  `endArrowhead` to `'arrow'`. Decorative `line` elements (actor lifelines, fragment
  `else` dividers) MUST pass `endArrowhead: null` (and `startArrowhead: null`) or they
  sprout a stray arrowhead at the far end. Also normalise message arrows to a positive
  bounding box (`x = min(srcX,tgtX)`, points relative) so right-to-left replies don't
  get a negative width.

## 2026-06-30 (pm) — UX review pass: realtime props, video dialog, Architecture group

- **Realtime numeric properties.** `MathNumberInput` (every numeric field in the
  property panel) was commit-on-blur to support math expressions (`200-50%`). Added
  a live-commit: while the typed text is a *complete plain number* (`/^[+-]?(\d+\.?\d*|\.\d+)$/`)
  it commits on every keystroke; genuine expressions still defer to Enter/Tab/blur.
  History is checkpointed once on focus (`onEditStart`), so live commits don't flood
  undo. All other controls (color/select/text/textarea/sliders) were already live.
- **Video dialog clipped.** The "Insert Video" modal is mounted inside the toolbar,
  which centres itself with a CSS `transform` — that makes any `position: fixed`
  descendant resolve against (and get clipped by) the toolbar. Fixed by rendering the
  dialog through a Solid `<Portal>` (mounts at `<body>`). General rule: modals mounted
  inside a transformed/`filter`/`contain` ancestor must use a Portal.
- **Unified Architecture tool group.** Merged the Infrastructure, Cloud-Native and
  Technical (DFD/3D/state) tool-group dropdowns into one `architecture-tool-group.tsx`
  with labelled sub-sections (Infrastructure / Cloud-Native / Blocks & 3D / Data Flow /
  State). Cloud SVG icons are now exported from `cloud-infra-tool-group.tsx` for reuse.
  Note: tool groups only render in the **Full Toolbar** mode (the default compact bar
  shows primary tools only).
- **Verified — vector anchor drag is already realtime.** Traced node-edit drag:
  `handlePathNodeDrag → writeEditableSubpaths → updateElement(…, false)` and
  `updateElement` always calls `bumpDirtyRevision()` regardless of history. Confirmed
  with a pixel-diff e2e that the canvas repaints mid-drag (before pointerup) in BOTH
  sketch and architectural styles. No fix needed for native filled paths.

## 2026-06-30 (pm) — Custom fonts + per-glyph fonts (Touch Type)

- **Custom/external fonts** (`utils/custom-fonts.ts`): upload `.ttf/.otf/.woff2`,
  load via the `FontFace` API, register into the shared `fontFamilyMap` through a
  new `registerFontFamily(key, css)` in `text-utils.ts` (avoids a circular dep —
  custom-fonts → text-utils only), and persist to localStorage. A custom font's
  stable `key` (e.g. `custom-1`) is what's stored on elements; its `family`
  (`YappyFont_1`) is the CSS name given to `FontFace`. Auto-inits on import.
- **Per-glyph fonts** in Touch Type: added `font?: string` to `charTransforms[i]`
  and `setCharTransform`. The text renderer sets `renderer.font` per glyph BEFORE
  measuring (so advance matches the drawn width) and restores the base font after.
  The overlay's `glyphBoxes()` mirrors this for hit-testing.
- **Pickers**: the property-panel `fontFamily` select and the Touch Type font
  dropdown both append `customFontOptions()` and a `＋ Add font…` entry that opens a
  file picker.
- **Type:** widened `FontFamily` to `… | (string & {})` so arbitrary custom-font
  keys are assignable while built-in literals keep autocomplete.
- **Gotcha:** when a renderer measures with a per-element font set once, any
  per-glyph font override must set `renderer.font` before `measureText` too, or the
  advance and the drawn glyph disagree and letters overlap.

## 2026-06-30 (pm) — UX sweep: search, toolbar clamp, fill adjacency, letter-spacing, group fixes

- **Property-panel search** — filter `groupedProperties()` by `label/key/group`;
  during an active search all groups force-open and empty groups are hidden.
- **Toolbar always in view** — `clampIntoView` now fully contains the toolbar
  (pull in right/bottom overflow, then guarantee top-left), and runs after every
  drag (not just on mount) plus on resize. Persisted off-screen positions self-heal.
- **Fill adjacency** — the Appearance stack editor renders inside the `background`
  group (right under the basic Fill) instead of after every group; a fallback keeps
  it for elements that have no background group.
- **Letter spacing** — added `IRenderer.letterSpacing` (Canvas delegates to
  `ctx.letterSpacing`, guarded for old engines; SVG sets the `letter-spacing`
  attr + accounts for it in `measureText`). Set once in the text renderer so it
  flows through measure → wrap → draw. Auto-resize width doesn't yet account for it
  (follow-up).
- **Reparent gating** — the mindmap "Reparent Node?" drop detection now requires
  BOTH dragged + target to be hierarchy nodes (`parentId` set, or is some node's
  parent), so ordinary shapes don't trigger it.
- **Group handle parity** — every handle the selection renderer draws needs a
  matching branch in `getHandleAtPosition`; connection handles drawn on grouped
  members were dead until hit-testing was added for `selection.length > 1`.
- **Group hit-test ordering** — the group-bbox "click anywhere to select the group"
  must be a FALLBACK after the per-element hit-test, never a pre-empt, or elements
  in the gaps between members (connectors) become unclickable.

## 2026-06-30 (eve) — Google Fonts + UML in Architecture group

- **Google Fonts** (curated list + load-by-name): `addGoogleFont(family)` injects
  the Google CSS `<link>` (no API key), registers the family, persists. A
  `GoogleFontsDialog` previews each row in its own font (lazy-loaded links). Stored
  `CustomFont.kind` distinguishes `file` (FontFace) vs `google` (link) so reload
  re-activates the right way.
- **Module-duplication hazard (important):** `registerFontFamily` wrote to a
  module-local `fontFamilyMap` but the renderer's `resolveFontFamily` could read a
  *different* instance of `text-utils` (dev server / bundler edge cases), so custom
  fonts silently fell back to Handlee. Fixed by backing the custom map with
  `globalThis.__yappyCustomFontMap` so registration is visible to every instance.
  Lesson: any cross-module mutable registry that MUST be shared should live on
  globalThis, not a module-private const.
- **UML clubbed into Architecture** group as *UML Structure* + *UML Behavior*
  sections (standalone UML toolbar group removed). See
  `docs/uml-completeness-review.md` for the coverage matrix + prioritized gaps
  (Deployment Node/Artifact, Object instance, Port, History pseudostate).

## 2026-06-30 (eve) — UML Deployment Node + Artifact shapes

- Added `umlNode` (3-D deployment box: front + top + right faces, label on the
  front face) and `umlArtifact` (rect + folded-corner document icon), rendered in
  BOTH sketch (rough.js) and architectural (clean canvas) styles via
  `uml-general-renderer.ts`.
- **A new shape touches ~12 places** — checklist for next time: `types.ts`
  (ElementType), the renderer (both styles + `definePath`), `shape-geometry.ts`,
  `register-shapes.ts` (umlTypes), `dsl/shape-defaults.ts`, `dsl/shape-aliases.ts`,
  `architecture-tool-group.tsx`, `draw-handler.ts` (draw list),
  `hit-testing.ts`, `element-transforms.ts` (uml list + icon map),
  `text-editing-handler.ts` (label list), `command-registry.ts`, and the
  `config/properties.ts` `applicableTo` lists (mirror an existing UML shape with a
  global `sed` since they're all inclusion lists).

## 2026-06-30 (eve) — UML Object / Port / History / Activity Action

- Added `umlObject` (rect + underlined `name:Class` instance label — underline
  computed from `measureText` + `getFontString`), `umlPort` (small filled marker
  square, no label), `umlHistory` (circle + bold "H" glyph), and `umlAction`
  (rounded "stadium" rect via `roundRect` / an arc path in sketch). Both styles.
- With Deployment Node/Artifact (v0.5.17) this closes every prioritized gap from
  `docs/uml-completeness-review.md`; only niche diagrams remain (Timing, Profile,
  Composite-structure parts, stereotype edge decorations).
- Reused the v0.5.17 "new shape touches ~12 places" checklist — went smoothly;
  the `config/properties.ts` `applicableTo` mirror via global `sed` on
  `'umlComponent'` is the fast way to grant fill/stroke/text props to new UML shapes.

## 2026-06-30 (eve) — Touch Type: multi-glyph select + shape labels

- **Multi-select:** the overlay's `sel: number` became a `Set<number>` with a range
  `anchor`. Shift-click extends a range; dragging a marquee over glyphs selects many
  (Ctrl/Cmd+A = all). Every control (scale/rotate/colour/font, keys, pinch/twist)
  applies to all selected. Move + scale + rotate need PER-GLYPH bases, so
  `setCharTransforms(id, indices, patch)` accepts a `(index, current) => patch`
  function (uniform object patch for colour/font); a marquee/gesture captures each
  glyph's base on pointer-down for one clean history step.
- **Shape labels:** Touch Type now works on a shape's `containerText`, not just
  text/richtext. `touchTypeText(el)` picks `text` vs `containerText`;
  `setCharTransform(s)` key the array length off it. The per-glyph DRAW was factored
  into a shared `RenderPipeline.renderTouchTypeLine` (left-anchored for text
  elements, centre-anchored for shape labels) and called from both `text-renderer`
  and `RenderPipeline.renderText` — so labels and text elements stay consistent.
- **Gotcha:** `new Set()` infers `Set<unknown>`; write `new Set<number>()` when
  assigning to a `Set<number>` signal.
- **Selection refinements:** Shift-click = contiguous range; Ctrl/⌘-click = toggle an
  individual glyph (discontiguous); marquee with Shift/Ctrl/⌘ adds to the set. A plain
  click on empty canvas exits Touch Type when it's OUTSIDE the element's bbox, else
  just deselects glyphs (a drag is always a marquee).

## 2026-06-30 (eve) — Visible spinner arrows on numeric property fields

- `MathNumberInput` (every property-panel numeric field — Letter Spacing, Angle,
  Shear, etc.) gained visible ▴/▾ spinner buttons in addition to the existing
  Arrow-key stepping. Factored `step(dir,e)` into `bump(dir, big, fine)`; the
  buttons and the keys share it (Shift = ×10, Alt/Ctrl = ×0.1). `pointerDown` +
  `preventDefault` keeps focus on the input so clicking an arrow doesn't blur-commit.
- It's a text input (for math like `200-50%`), so it has no native number spinners —
  these are custom buttons overlaid on the right edge, revealed on hover/focus.
- Component is only used in the property panel, so the wrapper/CSS change is scoped.

## 2026-07-03 — Letter spacing for shape & connector labels

- **Measure/draw symmetry is the invariant:** `measureContainerText` sets
  `ctx.letterSpacing` for wrapping, so anything that *draws* those lines must set
  `renderer.letterSpacing` too (it's canvas state, reset by `restore()`). A
  property that's measured-but-not-drawn (or vice versa) silently misaligns
  wrapping, highlight pills and the edit overlay.
- **Panel exposure is config, not code:** shape properties live in
  `config/properties.ts` `applicableTo` lists — a feature can be fully wired in
  the pipeline yet invisible because its property entry only lists
  `text`/`richtext`. When adding a text attribute, copy the Font Size list.
- **Edit-overlay WYSIWYG:** the textarea in `text-editing-overlay.tsx` needs each
  text CSS property mirrored (`letter-spacing` scaled by zoom); it had font,
  line-height, align — but not tracking, so editing looked different from the
  committed render even for plain text elements.
- **`Yappy.updateDefaultStyles({renderStyle})` + create** is a handy e2e trick to
  place sketch and architectural variants side-by-side in one canvas for
  pixel-width parity checks (labels: scan a row band for dark pixels).

## 2026-07-04 — Canva-style Design Studio (phases 1–7)

- **Slides were already the page substrate.** `docType: 'design'` reuses the
  entire slide machinery via `isPagedDocType()` — ~30 call sites changed from
  `=== 'slides'` to an intent-revealing helper instead of adding a third code
  path. Terminology (Page vs Slide) is a single `pageNoun()` function.
- **Stale `store.dimensions` clobbered loaded page sizes**: `saveActiveSlide`
  writes `store.dimensions` back into the active slide, but `loadDocument`
  never synced it from the incoming doc — the first slide action after loading
  a non-1920×1080 document silently resized page 1. Fixed at the root in
  `loadDocument`. Lesson: any store field that round-trips into persisted data
  must be hydrated on load.
- **Solid memos don't see localStorage.** The brand panel's kit list memo was
  created at app boot, so kits added later via the API never appeared. Memos
  over non-reactive sources need an explicit reactive trigger (we key on the
  panel-visible flag + a version signal). Same class of bug: `<select value=…>`
  renders before its `<option>` children — use `selected` on the options.
- **SVG import = parse to cubics + flatten affine transforms into anchors.**
  Béziers are closed under affine maps, so applying the node's composed matrix
  to anchors *and* handle points is exact — no sampling. Arcs convert via the
  spec's endpoint→center parameterization into ≤90° cubic segments. Icon
  libraries (Lucide) then come free: render the component off-DOM, take
  `outerHTML`, feed the importer.
- **Panel placement is part of correctness**: panels defaulting to `left:56px`
  sit under the pages navigator (z-index 1000) and silently swallow clicks —
  Playwright's "element intercepts pointer events" caught it.
- **e2e AI tests must mock the provider.** `page.route('https://api.openai.com/…')`
  exercises the full pipeline (key lookup, request shape, response parsing,
  element mutation) deterministically and free.
- **IndexedDB migration pattern**: hydrated in-memory cache + async IDB writes
  keeps every existing synchronous call site working; autosave keeps a <3MB
  synchronous localStorage copy purely for beforeunload crash safety, and meta
  stays in localStorage so cross-tab `storage` events still fire.
- **Canva-course gap round (2026-07-05)**: evaluated two beginner Canva courses
  against the Design Studio; the only true *workflow* gap was template
  discovery — search + "fits your page" sorting + auto-opening the browser
  after New Design closed it. Feature checkboxes (JPG export, frame shapes,
  glitch, crop ratios) were each ≤50-line diffs because the substrate
  (presets → property options, shapes-as-frames, effect presets driving the
  renderer) was already generic.
- **Preview panels must not obscure what they preview.** The Google Fonts
  dialog applied fonts live but sat centered over a dimmed backdrop — the fix
  was as much layout (dock right, no backdrop, canvas interactive) as behavior
  (don't close on pick). "Keep it open" requests usually imply "let me see."
- **Ratio-locked crop = drive one dimension, anchor the opposite corner/edge,
  scale to fit.** Constraining after the freeform drag (`applyCropDrag` →
  `constrainCropToAspect`) kept the existing drag math untouched and the lock
  composable (Free just skips the constraint).
- **Drag payloads: use a custom MIME plus text/plain fallback.** Stock-photo
  drags carry `application/x-yappy-stock-photo` (JSON) so the canvas drop
  handler can distinguish "insert at point on miss" from the generic URL-drop
  behavior (set page background), while text/plain keeps external drops working.
- **Magic Resize v1 = three rules, not a layout engine.** Backgrounds (≥85%
  page coverage) stretch; everything else scales by min(sx, sy) and keeps its
  normalized center; fonts and point arrays scale by the same factor. Covers
  the post→story→poster workflow without content reflow. Reusing the New
  Design size dialog (one `title` prop) gave the whole UI for free.
- **The padded outpaint canvas doubles as its own mask.** For gpt-image-1
  edits, drawing the original onto a larger transparent canvas and sending
  that same PNG as both `image` and `mask` marks exactly the new margins as
  editable — no separate mask rendering.
- **PWA in a Vite app is config, not code.** vite-plugin-pwa with autoUpdate +
  a raised `maximumFileSizeToCacheInBytes` (the main bundle is ~3 MB) made the
  whole app offline-cold-loadable; the only real decisions were the precache
  glob (include .wasm/.ttf) and runtime-caching Google Fonts. Verify against
  `vite preview` — the dev server never registers a SW.
- **Snapshot version history piggybacks on autosave.** The autosave JSON is
  already built every second; a 3-minute throttle + per-version IDB keys (index
  separate from bodies) adds history for the cost of one function call. Don't
  store bodies in the index — listing must never load 15 full documents.
- **AI design generation: deterministic layout, LLM copy.** Asking the model
  only for strict-JSON content + palette (not coordinates) makes output usable
  every time and provider-agnostic; the layout is plain math over page W×H,
  which also means Magic Resize composes with it.
- **Check before building: bullet lists already existed** in the rich-text
  overlay toolbar — the audit gap was discoverability, fixed with docs +
  search keywords instead of code.
- **Template packs are cheap once builders are shared.** Extracting t/r/grad/
  circle/makeDesign into helpers.ts made 21 templates ~1 file of declarative
  data. Watch ESM cycles: pack.ts importing helpers from index.ts while
  index re-exports pack hits TDZ on const helpers (imports hoist) — a separate
  helpers module, not re-export from index, is the fix.
- **`controllerchange` is the one PWA signal you need** with skipWaiting+
  clientsClaim: no controller before → first install (offline ready); had one
  → background update took over (tell the user to reload before lazy chunks
  mismatch the new precache).
- **Edge anchoring beats normalized-center for margins.** Magic Resize keeps
  elements pinned when their edge margin < 8% of the page dimension (margin
  scales by the uniform factor); everything else still maps by center. Two
  thresholds per axis, no layout engine.
- **Arcade (2026-07-05, feat/arcade): a game runtime is snapshot + rAF + API
  facade.** Flash-style games needed no new engine — sprites are ordinary
  store elements patched via setStore (never pushToHistory; the pre-play
  JSON snapshot is the sole restore point, so runaway scripts can't corrupt
  the doc). The exported HTML player reuses the full app Canvas + store, so
  the same runtime module shipped there for free (`node scripts/embed-player.js`
  regenerates the embedded bundle — required after touching player-reachable code).
- **Input capture by overlay, not by mode.** A fixed full-viewport layer during
  play isolates the editor (no accidental edits), owns pointer→world mapping,
  and hosts the Stop button + touch gamepad; per-button setPointerCapture keeps
  multi-touch (move + jump) working on tablets.
- **Arcade clean stage = reuse presentation mode.** Play flips appMode to
  'presentation' (all editor chrome + page frame already gated on it) and
  zoomToFitSlide; the pre-play snapshot restores appMode too. The game overlay
  sits at z-index 6000 (above every toolbar) with the Stop pill top-center so
  it can't hide behind corner UI. Runtime→UI state (pad visibility, game-over)
  rides a tiny pub-sub bump, not the solid store, since it's transient.
- **embed-player.js wrote to a dead path.** It output the regenerated player
  bundle to `../src/assets` (repo root, nonexistent) while the exporter imports
  `frontend/src/assets/player-assets.ts` — so every HTML export shipped a STALE
  player and no one noticed until arcade needed new player code. Fixed the path.
  Lesson: a generated artifact consumed by an import must be diffed after
  regen, not assumed written.
- **file:// blocks `<script type=module>` in headless Chromium** (opaque origin
  → CORS fail), so an exported single-file player can't be booted from file://
  in Playwright. Test the export ARTIFACT (data injected + runtime bundled),
  prove the runtime via in-app specs; serve over http for a true boot test.
- **Visual game builder = blocks compile to the existing runtime, not a second
  engine.** The Behaviors builder (feat/arcade) stores WHEN→DO rules on
  `element.behaviors` + `store.sceneBehaviors`; `behaviors-to-script.ts`
  compiles them to a `game.*` script the existing runtime + exported player
  already run. Wins: "See the code" shows exactly what runs (WYSIWYG teaching),
  HTML export needed ZERO player changes (save writes the generated script into
  the doc's `gameScript` via `effectiveGameScript`), and there's one execution
  path. Per-element `behaviors[]` persists for free (elements are deep-cloned
  on save). Velocity/bounce/score live in a small generated preamble; sprites
  are referenced by `tag` (named in the panel).
- **e2e store-toggle gotcha:** `page.evaluate(() => import('/src/store/app-store.ts'))`
  gets a FRESH module instance, not the running app's store — toggling it does
  nothing visible. Drive UI state through `window.Yappy` (added
  `toggleGameBuilder`) instead.
- **Node-graph as a VIEW, not a new model.** Phase C renders the existing
  behaviors as nodes (one rule = one node) and derives wires from message
  broadcast/receive; editing the graph edits the same behavior data and compiles
  through the unchanged pipeline. Zero new game model, zero export changes. Node
  positions ride on `Behavior.graphPos` (persists free). The bezier wire string
  was liftable from `connector-renderer.ts` (Blueprint S-curve); viewport math
  reused; the pan/zoom DOM surface + node drag were small hand-rolls (no reusable
  DOM pan/zoom container exists).
- **Full-screen editor z-index:** the game-overlay dodges chrome by unmounting it
  (presentation mode); a full-screen editor that stays in EDIT mode must beat the
  top menu's z-index (10060) or the toolbar intercepts clicks. Set graph to 10065.
- **Inline node editing = one shared, prop-driven editor for two views.** The
  panel's `TriggerParams`/`ActionParams` were closure-bound (they reached
  `patchTrigger`/`namedSprites()` in the panel's scope), so they couldn't be
  reused. Extracting them to `game/behavior-editors.tsx` as pure prop-driven
  components — `{ trigger, sprites, onPatch }` / `{ action, sprites, states,
  onPatch }` emitting the same partial-patch — let BOTH the Behaviors panel and
  the Game Graph nodes render fully editable rules from one source. Neutral
  `be-*` classes (behavior-editors.css) so both views look identical.
- **SolidJS `<For>` keys by item reference — key by the raw behavior, not a
  freshly-built wrapper.** `buildGraphNodes()` returns NEW node objects every
  run, so `<For each={nodes()}>` recreated every card on any edit (focus loss
  while typing, wasted DOM). Fix: iterate the stable store behavior refs
  (`allBehaviors()` = scene + per-sprite behaviors, raw objects) and look up
  position/owner via `nodes().find(...)` inside each row. Now editing one rule
  makes only that behavior a new ref → only that card recreates; the rest of the
  graph stays mounted. Same reason the panel's `<For>` only rebuilds the edited row.
- **Phase C.3 — flow wires reuse the derive-don't-store pattern.** goToState /
  goToPage jumps became wires by DERIVING targets from the existing actions
  (`flowTargetsOf`/`deriveFlowTargets`/`deriveFlowWires` in graph-layout.ts),
  exactly like message wires derive from broadcast/receive — no new model field,
  no persistence. States/pages aren't behaviors, so they render as lightweight
  read-only **target pills** in an auto-placed column (`maxRight + gap`) that
  tracks the graph as nodes move; a second output port (`.gg-out-flow`, below the
  broadcast port) and a distinct dashed stroke + colour (violet=state, sky=page)
  keep flow visually separate from message wires. Kept it read-only for v1 —
  drag-to-rewire deferred — because the value is *seeing* scene/level flow, which
  needs zero interaction.
- **Phase C.4 — true Blueprint by REUSING the compiler primitive, not forking it.**
  The exec-flow graph (event→action→branch, wired by execution edges) is a genuinely
  new authoring model, but it emits into the SAME generated script: the trick was
  exporting `emitAction()` from behaviors-to-script and having `blueprint-to-script`
  return *fragments* (start / recv / press / tap / tick) that `generateGameScript`
  merges into its existing event sections. So the Blueprint shares the whole preamble
  (`_vars`, `_setVar`, `_emit`, `_tmr`, `_hit`, `game.*`) and coexists with behaviors —
  one runtime, two models, zero runtime changes. **Scene-level scoping was the key
  simplification**: restricting action nodes to `SCENE_ACTION_KINDS` means `me`/`other`
  are `null`, sidestepping per-sprite `this` binding entirely for Phase 1. Branch =
  `if (cond) { <true chain> } else { <false chain> }` by recursively emitting each
  pin's exec chain (cycle-cut via a visited set — no loop nodes yet). Persistence
  mirrored the `gameVars` pattern exactly (SlideDocument field → store default → load
  → autosave), and the editor reused game-graph's pan/zoom/drag + `TriggerParams`/
  `ActionParams`, so the whole vertical slice landed small.
- **Phase C.5 — per-sprite Blueprints via an owner-keyed MAP, not per-element storage.**
  Going from scene-only to per-sprite meant every graph needs a `me`. The cheap way
  to add ownership without touching `DrawingElement`/`normalizeElement`/migration was
  to key graphs by owner in a document-level `blueprints: Record<string, Blueprint>`
  (`'' = scene`, `tag = sprite`) — one field, same persistence path as before, plus a
  legacy `blueprint → blueprints['']` migration on load. The compiler became
  owner-aware (`compileBlueprintFragments(g, els, ownerTag)`): sprite owners bind
  `me = S("tag")`, wrap each event body in `{ const _me = …; if (_me) { … } }`, and
  reuse the behaviors compiler's exact sprite-event emission (hit enter-detection via
  `_hit`, touching, leaveScreen via `_off`, keyHold/tap hit-test). Because the chain
  emitter already takes `me`/`other` params, the SAME `emitChain` serves scene and
  sprite — only the wrapper differs. **Gotcha (not a code bug): a second stale `vite`
  on :5173 made Playwright hit old code** — every test failed at `waitForFunction(Yappy)`.
  When a whole e2e suite dies at bootstrap, suspect the dev server / port before the diff.
- **Phase C.6 — flow nodes: Sequence is pure emission, Delay needs a scheduler.**
  Sequence fell straight out of the existing `emitChain` (concat each ordered output's
  chain) with zero runtime change — the only real work was generalizing pins from a
  fixed `'out'|'true'|'false'` to a dynamic `pinsOf(node)` list so outputs stack and
  wires anchor at a per-pin y. Delay is different: the exec model emits *synchronous*
  inlined statements, so "wait then continue" can't be inlined — it needs the rest-of-
  chain captured as a closure and run later. Added a tiny one-shot scheduler to the
  shared preamble (`_pending` array + `_after(secs, fn)`) drained at the top of
  `onTick`; the delay node emits `_after(secs, () => { <rest chain> })`. Because the
  preamble is shared, the two lines are inert for behavior-only games (verified: arcade
  suite green). The closure captures `_me`/`_other` locals — fine, though a sprite
  destroyed during the wait is a known soft edge (actions on a dead handle no-op).
- **Phase C.7 — data pins: a second wire type, distinguished by `edge.toPin`.** Exec
  and data wires share one `BPEdge`; the discriminator is `toPin` — absent = exec (lands
  on the node's exec-in), present = data (lands on a named input port 'a'/'b'/'cond').
  `follow()` (exec) now filters `toPin === undefined` so data edges never masquerade as
  exec. Data nodes compile as EXPRESSIONS not statements: `evalDataNode` returns a JS
  value string (`getVar → (_vars[n]||0)`, `literal → num`, `compare → (a op b)`),
  recursing through `evalInput(to, toPin)`; a Branch prefers its wired `cond` expression
  and falls back to the inline condition when unwired. **UX shortcut that paid off:**
  instead of per-pin drop hit-testing, data wiring drops on the target *node* and
  auto-picks the first free data input — trivial to implement, and for 1–2 input nodes
  it's indistinguishable from precise targeting. Also: a fall-through kind label (data
  nodes rendered as "DO") is the classic cost of an `else` branch in a growing switch —
  add the new kinds to EVERY kind-keyed render site, not just the compiler.
- **Phase C.8 — computed action params via an override map, not a forked emitter.**
  To let a data wire drive a numeric action param (e.g. `set score = level*10`) without
  duplicating `emitAction`, I added an optional `ov?: Record<string,string>` override map:
  `score`/`setVar`/`changeVar` now read `ov?.delta ?? num(a.delta)`. Behaviors call
  `emitAction` with no `ov` (→ literal, unchanged); the Blueprint action emitter fills
  `ov` from the node's wired data inputs (`actionDataPorts` names which params are
  drivable, keyed to the same string the override map uses). One function serves both
  models; the discriminator is just "was this param wired?". The Math node was a trivial
  clone of Compare (two data inputs → a JS binary expr) — the data-flow substrate from
  C.7 meant new pure nodes cost almost nothing. `dataInputs(actionNode)` returning the
  param ports means action nodes became valid data-wire targets and got input pins with
  zero editor changes (the generic pin renderer + auto-pick-first-free wiring just work).
- **Phase C.9 — new data getters are near-free; the cost was the palette, not the nodes.**
  Random and spriteProp are pure source nodes (one `evalDataNode` case each, no data
  inputs) — the C.7 substrate absorbed them with a body editor + accent and nothing else.
  The actual bug was UX: each phase added palette buttons to a fixed-width, non-wrapping
  header, and by 12 buttons the **Play button clipped off the right edge** — Playwright
  can't scroll a clipped flex row, so the `.bp-play` *click* (not a later assertion)
  failed. `flex-wrap: wrap` on the actions row fixed it. Lesson: a growing toolbar needs a
  wrap or an overflow menu before ~8 items; and an e2e that *interacts* (clicks the real
  button) catches layout regressions a compile-only test never would.
- **Phase C.10 — Gate: pick the design that fits your model, not the textbook one.**
  Unreal's Gate has four exec INPUTS (Enter/Open/Close/Toggle) — implementing that means
  multiple exec-input ports, per-port exec wiring, and entry-port-aware compilation: a core
  refactor. A stateful `once`/`toggle` gate (single exec-in/out + a `_gate[id]` flag in the
  preamble) delivers the *essence* of a gate — persistent state that blocks/passes — with
  zero model change. ForLoop was likewise trivial (`for` wrapping the `loop` chain, then the
  `done` chain), the one gotcha being a **node-scoped loop var** (`_l<sanitized id>`) so
  nested loops and the tick-drain's own `_i` never collide. Also: **restructuring the
  palette into dropdowns broke 4 e2e that clicked `getByRole('button',{name})`** — moving a
  button into a menu changes how you reach it; grep the specs for every moved label when you
  reorganize a toolbar (the 4 failures were all test-reachability, not product bugs).
- **Phase C.11 — multi-exec-input was the real unlock; the rest fell out.** The full
  Unreal Gate needed nodes with several exec INPUTS (enter/open/close/toggle), which forced
  three coordinated changes: (1) exec edges carry a target port in `toPin` — so the
  data/exec discriminator had to move from "`toPin` present" to "`pin === 'val'`" (data
  outputs are always 'val'); (2) `follow()` returns `{ to, port }` and `emitChain` takes
  that entry, so a gate can branch on *which* input fired; (3) the cycle guard keys by
  `node:port` not just node — without that, the Enter→…→Close "do once" idiom would be cut
  as a self-cycle. Once exec-input ports existed, the editor just iterated `execInputs(kind)`
  for pins and hit-tested `[data-execin]` on drop. **ForLoop index** was a one-liner
  (`evalDataNode(forLoop) → loopVar`) plus hoisting the `let` out of the `for` so the index
  survives into the `done` chain. **Game-Graph rewire** reused the existing wire-drag
  pattern verbatim — a second `flowWiring` signal + a `resolveFlowWire` that reads
  `data-target-*` off the pill under the cursor. Lesson: when one feature forces a core
  generalization (entry-as-{to,port}), sibling features you'd scoped as "later" often become
  trivial on top of it.

## 2026-07-07 — Arcade Hub: a game is a document; reuse, don't reinvent

- **My Games is not a new store — it's a filtered view of saved documents.** A game IS
  a document, so the library reuses `storage.listDrawings()` + the `doc-thumbnails` map
  rather than a parallel "games" store. The only new bit: tag each save with `isGame`
  (computed from the store at `setDocThumbnail` time) so the gallery filters without
  loading every doc. Thumbnails are keyed by the SAME id `listDrawings()` returns
  (extension included) — mismatching that (e.g. a bare name) silently drops the card.
- **The manual Save paths had drifted from `buildCurrentDocument`.** Autosave included
  `blueprints`; the two Save-dialog paths in menu.tsx hand-built their own `SlideDocument`
  and never added `blueprints` or `gameAuthoringMode`, and weren't mode-aware — so a
  saved-to-disk game lost its Blueprint and a code game would be re-generated from blocks.
  Lesson: when you add a document field, grep for EVERY place that builds a
  `SlideDocument` (autosave, manual save ×2, version-history), not just the autosave one.
- **`gameAuthoringMode` makes "eject to code" real.** Without a mode flag,
  `effectiveGameScript` always prefers generated-from-blocks when blocks exist, so a
  hand-edited script could never win. The one-line fix (`if (mode === 'code') return the
  authored script`) plus threading the mode through every run/compile call site is what
  lets visual↔code be a clean one-way switch instead of an unwinnable two-way sync.

## 2026-07-07 — Game Stage was already built; only New Game had to change

- **The "defined play window" already existed — as the page.** `pageRect()` staged
  `game.*` on the active slide and Play already fit it; the arcade e2e even play games on
  `newDesign()` docs. So "give games their own window" wasn't a new system — it was one
  change: make **New Game create a paged (design) doc with a stage size** instead of an
  infinite one. Lesson: before building a stage/frame subsystem, check whether the runtime
  already keys off an existing frame (a page/artboard) — reframing the *creation* path is
  usually cheaper than adding a parallel concept.
- **Absolute-in-absolute needs `width`, not `max-width`.** An absolutely-positioned box
  inside a zero-width absolute parent (`.bp-surface`) resolves `max-width` against a 0-width
  containing block → collapses to min-content (one word per line). Set an explicit `width`.
- **Landing pages: the canvas is the invitation.** The old welcome drew hand-drawn arrows
  pointing at each UI control — clever but noisy. One bold CTA ("Click anywhere to sketch
  your first idea") over a quiet, muted feature list reads better and dropped a whole
  rough.js canvas layer + four positioned callout labels.

## 2026-07-06 — Quick toolbar font colour = write both strokeColor + textColor

- **`textColor || strokeColor` means a color control that only sets `strokeColor`
  is a no-op once `textColor` is baked in.** Text/rich-text elements resolve their
  font colour as `el.textColor || el.strokeColor`, and defaults bake in
  `textColor: '#000000'` (`app-store.ts`). So the quick toolbar's "Text Color"
  swatch (which is really the `strokeColor` control) changed nothing visible — the
  baked default always won. The main color picker already knew this and writes
  BOTH keys for text/richtext (`p3-color-picker.tsx`), but the quick toolbar's
  `handlePropertyChange` didn't. Fix: same guard — when `strokeColor` is applied to
  a `text`/`richtext` element, patch `{ strokeColor, textColor }` together. Lesson:
  any new surface that edits a "text colour" must set `textColor`, not just
  `strokeColor`, or a stale baked default silently swallows the change.

## 2026-07-07 — Game physics & testing the arcade runtime

- **Settle/rest checks must use post-collision velocity, not the mid-integration
  value.** In a semi-implicit Euler loop, `vy += GRAV·dt` runs *before* the ground
  clamp zeroes it, so any "is it at rest?" test that reads velocity before the
  clamp sees a permanent `≈ GRAV·dt` floor. Slingshot's `STOP=24` sat *below* the
  per-frame gravity impulse (`1600·0.0167 ≈ 26.7`), so a bird on the ground never
  counted as settled. Judge rest from the clamped state (an `onGround` flag + the
  post-clamp `vx`/`vy`).

- **Range before power: a projectile can be *physically* unable to reach a target.**
  Max 45° range is `v²/g`. Always sanity-check `MAXPULL·POWER` against the actual
  distance to the level's targets before assuming a "feel" problem — Slingshot's
  1012 px/s gave 640px of range for targets 900px away.

- **Gate `jump` on a grounded flag for real platformer feel.** Applying jump
  velocity on every keypress yields floaty mid-air multi-jumps. Track grounded in
  the land handler, clear it each integration step, and only jump when set — but
  scope the gate to gravity sprites so non-gravity `jump` uses stay unconditional.

- **`hit`/`touching` resolve ONE sprite per tag (`S(tag)` = `game.find`).** To land
  on several platforms or collect several coins from blocks, give each its own tag
  and one rule per tag. Same-tag duplicates are invisible to hit-detection.

- **Dynamic `import()` of an app module inside `page.evaluate` can be a SEPARATE
  instance from the running app** (different module graph than the app bundle), so
  calling its exported setters/handlers is a no-op on the live app. Two concrete
  bites: `import('game-runtime').gamePointerDown()` didn't reach the running game
  (drive real mouse on `.game-overlay` instead), and `import('app-store')
  .toggleBehaviorsPanel()` didn't open the panel (use the app-exposed
  `window.Yappy.toggleGameBuilder()` / `Y.startGame()` which are the app's own
  instances). When a headless mock and the real app disagree, suspect this first.

- **A deterministic headless mock of the runtime is great for physics, useless for
  input wiring.** The Node mock (real script + faithful `Sprite`/`game` API, stepped
  tick loop) matched the real runtime for slingshot *physics* — the only mismatch
  was how *I* drove the pointer. Use the mock to prove trajectories/settle/scoring;
  use Playwright + real mouse/keyboard to prove input.

## 2026-07-07 — Blueprint-authored sample games + a canvas view switcher

- **Blueprints compile through the SAME preamble/pipeline as behaviors.**
  `generateGameScript(elements, sceneBehaviors, gameVars, blueprints)` emits one
  shared preamble (`_grav`/`_ground`/`GRAV`/`JUMP`/`_land`/`_vel`…) and merges the
  blueprint fragments into it, so a blueprint game gets identical physics — the
  grounded-jump gate and land logic "just work" for Blueprint Platformer too.
  Verified: the Blueprint Platformer produces byte-identical gameplay to the block
  Platformer (same land/jump/coin/win outcomes).

- **A Blueprint is just data: author it like `behavior-examples` authors rules.**
  `store.blueprints` is an owner-keyed map (`'' = scene`, tag = sprite);
  `setBlueprint(owner, {nodes, edges})` installs it. A WHEN→DO rule maps to an
  `event` node wired through a left-to-right chain of `action` nodes (exec
  `out`→`in`). `blueprint-examples.ts` builds Platformer + Breakout this way.

- **The blueprint COMPILER supports collision events the palette doesn't list.**
  `compileBlueprintFragments` handles `hit`/`touching`/`leaveScreen` for sprite
  owners, but `BP_EVENT_KINDS` (the palette) omits them. Authoring them in a
  sample is valid and compiles fine; the gap is only that a user can't add those
  event nodes from the palette yet — a real DX follow-up.

- **A true drag-aim Blueprint Slingshot needs new nodes.** The node set has no
  pointer-drag input and no clean projectile-respawn, so a faithful Slingshot
  isn't expressible today. The unlock is a small pointer node group (pointer-down
  event + pointerX/pointerY/pressed data) — a general win for any aim/drag game.

- **Same module-instance trap, second surface.** `import('/src/store/app-store')`
  inside `page.evaluate` is a different instance than the running app, so
  `setDocType`/`toggleBehaviorsPanel` there are no-ops. Drive through the app's own
  `window.Yappy.setDocType(...)` / `toggleGameBuilder(...)`. (Also bit the
  behaviors-panel and game-mode-bar specs.)

- **Floating canvas controls must dodge the fixed toolbar.** The main tool palette
  is `position: fixed; top: 12px; left: 50%` (top-center); a new top-center bar
  collides and steals its clicks. The game-mode bar lives at bottom-center instead.

## 2026-07-07 — Pointer + vector nodes: a drag-aim Slingshot in Blueprint

- **What a real drag-aim game needs, and how few primitives unlock it.** The
  Blueprint node set couldn't express a slingshot because it had (a) no way to read
  the pointer and (b) no way to set an arbitrary velocity or position. Three small
  additions fixed both: a `pointer` DATA node (x / y / down→1|0) and two actions
  `setVelocity {vx,vy}` + `moveToXY {x,y}` whose params are data-wireable (added to
  `actionDataPorts`). Everything else (aim math, launch, gravity, respawn) is
  existing nodes. Launch velocity = `(anchor − pointer) × POWER` via two Math nodes
  per axis feeding `setVelocity`.

- **`_setV` + `gravity on` = a projectile; toggle both to hold/reset it.** A sprite
  only integrates while it has a `_vel` entry AND is in `_grav`. So the bird sits
  still at the sling (no velocity, no gravity), launches on release (setVelocity +
  gravity on), and resets on leaveScreen (setVelocity 0,0 + gravity off + moveToXY
  back to the anchor). This is how you get multi-shot without custom code.

- **The Blueprint editor renders nodes by a per-kind `<Show>` chain, but PINS are
  generic.** Data input/output pins come from `dataInputs`/`dataOutputs`, so a new
  action's data ports (vx/vy) draw automatically once `actionDataPorts` returns
  them — you only hand-write the node's title + body control and (for data nodes)
  add it to `DATA_KINDS` and the palette list. Sprite-owned blueprints already
  offer hit/touching/leaveScreen in the palette (`isSprite ? TRIGGERS : filtered`),
  so no palette change was needed for collisions.

- **Verify aim/drag in two layers.** Deterministic harness (self-contained graph +
  real `generateGameScript`) proves the *logic* — launch vector, pig-pop, win,
  respawn. Playwright with real mouse over `.game-overlay` proves the *input path*
  (drag world→screen, sample the flight). The editor render is a third check: switch
  the owner dropdown to the sprite and assert the new node kinds paint without error.

## 2026-07-08 — One-click game export (discoverability + a shared helper)

- **Export already worked; it was just undiscoverable.** `exportToHtml` bundles the
  player runtime and bakes in `effectiveGameScript` (which compiles behaviors AND
  Blueprints), so visual/blueprint games have always exported like code games. The
  win was surfacing it: an Export button on the game-mode bar next to Play, so you
  don't have to dig into Menu → Save. Lesson — before building an "export" feature,
  check whether one exists and only the entry point is missing.
- **Extracted `utils/export-game.ts#exportSceneAsHtml(name)`** so the menu and the
  game bar share one build path (menu's `handleExportHtml` now just wraps it with
  toasts). Prevents the two from drifting.

## 2026-07-08 — Stick-figure library (assembly over new engines)

- **The whole feature is reuse.** A drawify-style, searchable panel of editable
  stick figures needed *no* new rendering/geometry: `svgToElements()`
  (`utils/svg-import.ts`) already turns any SVG into normal Yappy `path` elements
  with `backgroundColor`/`strokeColor`, so a dropped figure is recolourable/editable
  for free. Inserting = `importSvgToCanvas()` (which selects the new elements) then
  `groupSelected()` → one editable group. New code was: an inline data module
  (`library/stick-figures/`, mirroring `templates/registry.ts`), a panel copied from
  `elements-panel.tsx`, a store toggle, a menu entry, a drop-MIME branch, and API
  methods. No WASM parity triggered.

- **Author figures from primitives with a shared builder, not raw SVG each.**
  `assets.ts` wraps every figure in one `doc()` (viewBox 0 0 140 260, stroke #1f2937
  width 7, `fill="none"`) and composes a `<circle>` head + ONE multi-subpath
  `<path>` skeleton (torso/arms/legs as `M…L…` subpaths) + coloured prop elements.
  One `<path>` = one Yappy element with `pathSubpaths`, so a figure is ~2–5 editable
  parts (body, head, props) rather than a dozen. Keeps the family consistent and the
  element count sane for grouping.

- **`fill="none"` → `normColor` returns `transparent`**, which the importer maps to
  `strokeWidth: 0`… no — fill transparent just means hollow; stroke is preserved
  separately. Hollow heads/limbs "just work" because the root `fill="none"` inherits
  down and each prop overrides its own `fill`. `text`/`use`/`image` are in the
  importer's `SKIP_TAGS`, so no labels inside the SVGs.

- **Render-style parity was free here** and worth re-confirming why: `svgToElements`
  produces *point-based* `pathAnchors`/`pathSubpaths`, NOT a self-contained `Path2D`
  `d`. So figures go through the `beginPath()+renderGeometry()+fill()/stroke()` path
  that handles fill AND stroke in both styles — unlike SVG-`path`-geometry shapes
  (the CLAUDE.md gotcha). Verified in-app: dropped figures render correctly in
  architectural, and converting `renderStyle:'sketch'` gives the rough.js look with
  fill+stroke intact.

- **Verify the real pipeline, not just the SVG art.** Rendering the 24 SVG strings
  to a PNG gallery (esbuild/tsx + Playwright `setContent`) catches bad coordinates
  cheaply, but only driving `window.Yappy.insertStickFigure(...)` on the running app
  + `zoomToFit` proves the import→group→canvas path. Gotcha: a stale dev server
  returns `504 Outdated Optimize Dep` (deps re-optimizing) and never sets
  `window.Yappy` — start a fresh `vite --port <n>` instead of fighting the running one.

### Semantic part tagging + per-limb editing (follow-up)

- **A new `DrawingElement` field is silently dropped on load unless whitelisted.**
  `utils/migration.ts#normalizeElement` rebuilds every element field-by-field with an
  explicit optional-passthrough list. Added `sfRole?: string` to `types.ts` AND
  `...(el.sfRole !== undefined && { sfRole: el.sfRole })` to the passthrough — without
  the second edit, roles survive in memory but vanish after save→reload.

- **Carry semantic roles through the SVG importer via `data-sf-role`.** `collectDrawables`
  now reads `data-sf-role` (inheriting down the tree like style) and stamps it on the
  element as `sfRole`. Authoring: head/body come from tagged helpers; props are left
  untagged and classified at insert by `roleFromFill()` (transparent→body, low-sat/near-
  white→prop, vivid→accent). This cleanly separates a laptop *screen* (accent, recolours)
  from its neutral *base* (prop, stays grey) with zero per-prop authoring.

- **`tag` is taken — don't reuse it.** The game engine uses `DrawingElement.tag` as the
  user-facing sprite name (`nameSprite`, sprite lookups in `game-runtime.ts`), so a
  dedicated `sfRole` field avoids colliding with sprites.

- **One combined `<path>` = one element = no per-limb editing.** Authoring the skeleton
  as a single multi-`M` `d` string imports as ONE element (subpaths), so ungroup can't
  separate arms/legs. Fix without rewriting 24 figures: `bones(d)` splits on `d.split(/(?=M)/)`
  and emits one `<path>` per subpath — authoring stays a single `d` string, but torso/each
  arm/each leg become independent elements. "Standing" went 2→6 elements; each limb is now
  selectable/stylable after ungroup, with identical rendering (no gaps).

- **Normalise stroke deterministically at insert, not in authoring.** Absolute px stroke
  can't be baked into the SVG (the importer scales stroke by `targetWidth`). `insertStickFigure`
  now scales every part's `strokeWidth` so the heaviest (main outline) = `STICK_STROKE_PX`
  (4), keeping props proportional — exact 4px at any drop size. Doing insert via
  `svgToElements` + manual `setStore` (instead of `importSvgToCanvas` + `groupSelected`)
  folds stroke-normalise + role-tag + group into ONE history entry (single-step undo).

- **"SVG vs native Yappy shapes" is a false dichotomy.** SVG is only the authoring format —
  `svgToElements` converts every shape into a native `path` element whose `PathAnchor`s carry
  `inX/inY/outX/outY` bezier handles (same data model the Pen tool produces). So dropped limbs
  are already fully node-editable/curvable; nothing is lost by authoring in SVG. Round caps are
  also already handled — `render-pipeline.ts` `applyStrokeStyle` forces `lineCap='round'` for all
  path strokes, so no per-element cap field is needed.

- **Curve limbs at build time so they arrive WITH grabbable handles.** A straight `L` segment
  imports as two corner anchors with no handles — editable, but you'd have to add curvature. The
  `bones()` helper now smooths each subpath: a 2-point limb gets a subtle perpendicular bow (0.05 ×
  length) via a `Q`, a jointed limb is smoothed through its points with a Catmull-Rom → cubic
  spline. Authoring still uses one straight `d` string; output limbs are gentle beziers (more
  organic, drawify-style) whose anchors already have `in/out` handles. Verified: imported limb
  anchors report `hasHandles: true`.

## 2026-07-08 — Stick-figure full catalog (Phase 2): generate the variant matrix, don't author it

- **"Every pose × 4 variants" is only sane if you GENERATE variants, not author them.** Refactored
  figures from pre-baked SVG strings into structured `Pose` objects (`poses.ts`: head `[cx,cy,r]`,
  hip `[x,y]`, straight `bones` d-string, optional props). `buildFigure(pose, variant)`
  (`builder.ts`) derives male/female/boy/girl from ONE source: feminine = add hair (fringe + two
  side locks) + a skirt trapezoid hung from the hip; child = enlarge the head (×1.28) and wrap the
  body in a vertical squash `<g transform>` about the neck so the head-to-body ratio reads young.
  40 base poses → 163 catalog assets. Add a pose once, get up to 4 figures free.

- **The skirt must live INSIDE the child squash group, the hair OUTSIDE it.** For a girl (feminine
  + child) the skirt is placed with the body (so it squashes with the legs and stays aligned to the
  shrunken hip), while hair is drawn with the enlarged head. Getting the z-order right — body+skirt
  first, then head+hair on top — keeps the skirt covering the thighs and the hair over the head.

- **Composites reuse the same builder at scene coordinates.** `scenes.ts` authors multi-figure
  bundles (handshake/team/family/celebration) by calling `head()`/`bones()` at absolute scene
  positions in a wider viewBox; `figureInner(pose, variant)` (buildFigure minus the `<svg>` wrapper)
  lets a scene embed a full variant figure. Every limb stays an editable part.

- **Props/scenes have their own aspect ratio — the drag-drop centring must read it per asset.**
  The MVP hardcoded `TARGET_H = TARGET_W * 260/140` (figure ratio); a landscape prop dropped
  off-centre. Fixed by looking up `getStickAsset(id)` in the drop handler and using `asset.h/asset.w`.
  `StickCategory` gained `props`/`scenes`; `filterStickAssets({category, variant})` skips the variant
  filter for assets with no `variant` (props/scenes always show).

- **"Add to Symbols" is just `createSymbol(selection, name)`.** The dropped figure is already a
  grouped set of path elements, so registering it as a reusable linked Symbol is a one-liner + a
  panel button (then `toggleSymbolsPanel(true)` to reveal it). No new symbol machinery needed.

- **A dev server launched from the wrong cwd roots vite there.** After a `cd frontend/src` earlier
  in the shell, `npx vite` served with root=frontend/src → `/` 404, `window.Yappy` never set.
  Persisted shell cwd bites again — always `cd` to the repo root before launching vite.

- **A gender/variant filter must decide what to do with genderless items.** Props and scenes have no
  `variant`, so the first cut let them pass every variant filter — picking "Boy" still showed a pile
  of laptops/handshakes and read as "not filtering." Fix: when a specific variant is active, hide
  no-variant assets from mixed (`category:'all'`) views, but keep them when their own category chip
  is selected or the variant filter is off. "Boy" now shows only Boy figures; Props/Scenes stay one
  chip away.

- **Playwright filter-count checks need real settle time.** Clicking variant chips 250 ms apart read
  a mid-render DOM and reported bogus counts (Man=0, Boy showing base names) — a test artefact, not a
  bug. At 500 ms the counts were correct. When asserting on reactive UI after a click, wait for the
  re-render (or poll the active-chip state) before reading the grid.

## 2026-07-08 — Stick-figure browsing ergonomics (Phase 3): prefs as module-level Solid signals

- **Persist small library prefs as module-level Solid signals over localStorage.** `prefs.ts` holds
  favourites, recents and colour mode as `createSignal`s seeded from localStorage; setters update the
  signal AND persist. The panel imports the signal getters directly and reacts with no store plumbing.
  Module-level signals are fine in Solid and keep the state out of the global app store.

- **Monochrome tier is a one-line transform on the semantic roles.** Because parts are already tagged
  `accent`, "drop in mono" = set `backgroundColor:'transparent'` on accent parts at insert time. No
  separate monochrome art needed — the same generated SVGs serve both tiers. `insertStickFigure`
  reads the panel's colour mode by default (overridable via `opts.monochrome`).

- **A favourite star inside a clickable cell can't be a `<button>` in a `<button>`.** Nested buttons
  are invalid HTML and swallow events oddly. Made the cell a `<div role="button" tabindex="0">` (with
  an Enter/Space keydown to insert) so the star `<button>` nests legally; `e.stopPropagation()` on the
  star keeps a favourite-toggle from also dropping the figure. This also set up arrow-key roving focus
  across the grid (compute column stride = 3, move focus on Arrow keys).

## 2026-07-08 — Stick-figure art depth + monochrome thumbnail parity

- **Monochrome PREVIEW must classify fills the same way the INSERT does.** The insert strips accent
  fills by role, where role = explicit `data-sf-role` **or** `roleFromFill(bg)` for untagged props.
  The first `toMonochromeSvg` only stripped `[data-sf-role="accent"]`, so props that set a bare
  `fill="#3b82f6"` (laptop screen, briefcase, phone — classified at insert, not tagged in the SVG)
  stayed colourful in the thumbnail while dropping monochrome. Fix: in the preview, strip any `[fill]`
  whose role is `accent` OR (untagged) whose fill `roleFromFill`s to `accent`. Keep the preview and the
  drop reading from the SAME classifier or they drift. (Colour *strokes* — a red chart line, hair — are
  deliberately left; mono only strips fills, in both preview and drop.)

- **Adding a pose is cheap; the variant matrix multiplies it.** +18 base poses took the catalog from
  163 → 225 assets because ~most are variantable (×4). Author once in `poses.ts` with head/hip/bones/
  props; the generator does the rest. Gallery-render just the new slice (`POSES.slice(-18)`) to eyeball
  only what changed instead of all 225.

## 2026-07-08 — Stick-figure animation Phase A spike (rig + FK + foot IK) validated

- **A tiny FK rig + a procedural walk with foot IK is enough for a believable stick walk.**
  `library/stick-figures/anim/rig.ts`: 11-joint hierarchy (pelvis root → spine → head; shoulder→
  elbow→hand ×2; hip→knee→foot ×2) with bone lengths + absolute rest angles; `evaluateRig` walks the
  tree (world angle = parent world angle + localRest + clip offset) and, for any foot with a world
  target, replaces the leg with a 2-bone analytic IK solve. Rest angles are authored as absolute and
  converted to local (`absRest[j] − absRest[parent]`) so hierarchy "just works" (rotating a shoulder
  swings the forearm).

- **Foot planting is easier as a foot TARGET + IK than as hand-keyed knee angles.** The walk clip emits
  a pelvis-relative foot target per phase (stance = slides front→back on the ground at constant rate =
  treadmill, so the planted foot doesn't skate; swing = arcs back→front, lifting via `sin`); IK solves
  the knee. Arms are plain angle-offset FK (counter-swing the legs). Verified with an 8-frame filmstrip
  rendered offline (tsx importing the rig + Playwright `setContent`) — high signal, no app needed.

- **Bake-to-vectors is free via the existing SVG importer.** `rigPoseToSvg` emits the same role-tagged
  (`data-sf-role`) bone paths + head circle the library uses, so `Yappy.importSvg(svg)` turns a rig
  frame into 7 editable `path` elements with bezier handles — no new bake pipeline. Confirmed in-app
  (3 walk frames → 21 grouped editable paths, rendering identically to dropped figures).

- **The IK knee-bend solution flips with facing.** `solveTwoBone(hip, foot, l1, l2, bend)` has two
  solutions; pick `bend = facing===1 ? -1 : 1` so knees bend forward (shin can swing back) whichever
  way the figure faces.

## 2026-07-08 — Stick-figure animation Phase B (stickRig element, clock-driven, in-app)

- **A procedurally-animated element repaints via the forced ticker, not a new loop.** The canvas draw
  effect (`canvas.tsx:452`) subscribes to `effectiveTime()` and self-reschedules `requestAnimationFrame`;
  the engine only advances `effectiveTime` when `hasRunningAnimations || forceTicker`. So to make a
  `stickRig` animate continuously, extend the force-ticker predicate (`canvas.tsx:156`) to include
  `el.type === 'stickRig' && el.stickRig?.playing !== false`. The renderer then reads `effectiveTime()`
  each repaint and computes its pose — no changes to `calculateAllAnimatedStates`. `effectiveTime()` is
  pause-aware (freezes on global pause) — use it, not `globalTime()`, so global play/pause works for free.
  Verified by screenshotting two frames 400 ms apart and asserting the PNGs differ.

- **A new element type is ~7 small touch-points, all discoverable from one example.** `ElementType`
  union + a `stickRig?` field (`types.ts`); a `ShapeRenderer` subclass (copy `people-renderer.ts`:
  `renderArchitectural` draws with the IRenderer in ABSOLUTE coords — rotation is handled by the
  transform wrapper — and `renderSketch` uses `rc` RoughJS); one `shapeRegistry.register('stickRig', …)`
  line; add the type to the hit-testing bbox-fallback list (`hit-testing.ts:303`) for selection; one
  migration passthrough line. Creation is generic (driven by `selectedTool`), so no factory code.

- **Reuse the element's own stroke for the figure — recolour & sketch come free.** The renderer calls
  `RenderPipeline.applyStrokeStyle(renderer, el, …)` (reads `el.strokeColor`/`strokeWidth`) and maps the
  canonical 140×260 rig pose into the element bbox (`sx=w/140, sy=h/260`). Result: changing the element's
  stroke recolours the figure, and `renderStyle:'sketch'` animates in RoughJS with zero extra code.

- **Bake = evaluate current pose → `rigPoseToSvg` → the existing importer, swapping the element.** The
  Bake action reads `window.yappyGlobalTime` for the live phase, builds the role-tagged SVG, runs
  `svgToElements`, then `setStore('elements', prev => [...prev.filter(!== rigId), ...bakedPaths])` in one
  history step. Freezes a moving figure into an ordinary editable grouped figure.

## 2026-07-08 — Stick-figure animation Phase C (walk-along-a-path)

- **Path-follow is render-time, not element mutation — and stride-sync is what sells it.** Store just
  `stickRig.path = { pathId, dur, loop, autoFace }`. The renderer samples the referenced path element
  into a world polyline with cumulative arc length (`anim/path-follow.ts`), reads `effectiveTime()`,
  computes `prog = (t/dur) % 1`, and positions the figure so its FEET (rig y≈226) sit on
  `sampleAt(path, prog)`. Facing = sign of the path tangent x. The no-skate trick: set the walk phase
  to `prog * (pathLen / strideWorld)` where `strideWorld = WALK_STRIDE * (width/RIG_W)` — i.e. one walk
  cycle per stride of ground covered, so the planted foot matches ground speed. Like orbit/spin, the
  bbox (selection) stays where authored; only the drawing moves (consistent with existing behaviour).

- **Sample any path element, not just `path`.** `elementPathSample` handles `pathSubpaths` (longest
  subpath), `pathAnchors` (flatten cubics via in/out handles), and raw `points` — so a Line, Pen/Curve,
  Pencil or imported path all work as routes. Points are element-local (add `el.x/el.y`).

- **The "attach" UX = two-selection intent.** `pathFollowCandidate(selection)` returns a (figure,path)
  pair only when the selection is exactly one `stickRig` + one path-like element, driving a single
  "Walk this path" button. `selectedFigurePath` drives the "Stop following" state. No modal path-picking.

- **Timed action sequences = a cumulative-duration lookup, no timeline engine.** `stickRig.sequence`
  is a `{clip,dur}[]`; the renderer computes `tt = (t*speed) % totalDur`, walks the steps subtracting
  durations to find the active step + its local time, and sets `phase = local/clipDuration`. Overridden
  by path-follow (which runs first). Deterministic to test: set `playing:false` + `previewPhase` so
  `base = previewPhase*total` samples an exact point in the sequence (0.25 → step 0, 0.75 → step 1),
  screenshot each, and confirm the right clip's pose renders — no need to race the free-running clock.

- **Blend at the POSE level, not the clip-parameter level.** Clips are heterogeneous (walk uses foot-IK
  `footTargets`; wave/talk use angle offsets) so you can't lerp their parameters. Instead evaluate BOTH
  clips to `RigPose` (world joint positions) at the transition and `lerpRigPose(a, b, f)` the joint
  coordinates over a short window (SEQ_BLEND 0.18s at each step start, factor `local/BLEND`). Cheap,
  clip-agnostic, and looks smooth. The previous step's "final" pose is `poseAt(prev.clip, prev.dur/
  prevClipDuration, facing)`; wrap the index for the loop seam (step 0 ← last step).

- **Timeline block-reorder = live splice-move, not a floating ghost.** On block-body drag, each move
  removes the dragged step from the sequence, finds the insert slot by comparing the pointer time to the
  remaining blocks' centres, re-inserts, and `setFigureSequence`s — the row re-renders in the new order.
  Track the dragged index across moves (it changes as you reorder). A 5px threshold before the first
  reorder keeps a plain click from shuffling. Resize grip lives inside the block with `stopPropagation`,
  so grabbing the edge resizes and grabbing the body reorders.

- **Slide-synced trigger = `createEffect(on(activeSlideIndex, …, {defer:true}))`.** `defer:true` skips the
  initial run so it only fires on real slide changes; guard on `showSceneTimeline && storySyncSlides` and
  reset `{storyTime:0, storyPlaying:true}`. Gate the toggle button on `isPagedDocType(store.docType)`
  (paged = `slides`/`design`/`game`, NOT the string "presentation" — that bit me in a test). Verified:
  `setActiveSlide` flipped the playhead 3.0 → ~0.

- **Timeline block-resize: capture px-per-second at drag start, snap the result.** Blocks are laid out
  as `% of storyDuration`, but dragging is easiest in pixels: on pointerdown grab `pps = rowRect.width /
  storyDuration` and the step's start duration, then `newDur = startDur + (dx / pps)` snapped to 0.5s,
  writing back via `setFigureSequence`. The scene auto-duration effect reflows the other blocks as one
  grows — expected. `pointer-events:none` on the block label so the resize grip (right-edge overlay)
  gets the drag.

- **The exported HTML player already renders everything the app does — it's just a stale bundle.**
  The player entry (`player.tsx` → `components/player-app.tsx`) mounts the SAME `Canvas` component and calls
  `registerShapes` from the same registry, so once `StickRigRenderer` + the force-ticker predicate exist,
  exported HTML animates stick figures with ZERO player-specific code. The catch: `assets/player-assets.ts`
  is a committed, prebuilt 2.2 MB bundle (`scripts/embed-player.js` → `vite.player.config.ts`), so it must be
  **regenerated** (`node scripts/embed-player.js`) after any change that should reach exports — otherwise the
  export ships stale code. Verified: exported a walk figure to a self-contained `.html`, opened it via
  `file://`, and two frames 600 ms apart differed (it animates standalone). Remember to rebuild the player on
  release when the render/animation path changed.

- **A scrubbable "scene clock" is just one store signal the renderer reads instead of the wall clock.**
  The Scene Timeline sets `store.storyTime` (seconds); the stickRig renderer uses
  `t = store.showSceneTimeline ? store.storyTime : effectiveTime()/1000`. A single controller effect
  (subscribed to `effectiveTime()`, so it fires each forced-ticker frame) advances `storyTime` by the
  per-frame delta while `storyPlaying`, wrapping at `storyDuration`. Scrubbing = set `storyTime` directly
  + pause. No per-element mutation, no second animation engine — figures (incl. path-follow, whose
  `prog=t/dur` now tracks the playhead) all become scrubbable for free. Verified: `seekScene(4)` posed a
  Walk→Wave figure into Wave and an Idle→Jump→Point figure into Point simultaneously.

- **Timeline blocks + playhead: align the % coordinate systems.** Track blocks live in a `.st-row`
  (flex:1 after an 82px label), positioned `left/width` as `% of duration`. The playhead is absolute in
  the timeline body, so its left must re-add the label offset: `calc(88px + (100% - 88px) * frac)`. Keep
  the ruler `margin-left` matched to the label width so ticks line up with blocks.

- **Animated export was already 90% built — reuse `requestRecording`.** `recording-manager.ts` wraps
  `VideoRecorder` (MediaRecorder over `canvas.captureStream(60)`), driven by a `requestRecording` signal
  and tracked by `store.isRecording`; the Export dialog already triggered it. Because it records the LIVE
  canvas, procedurally-animated `stickRig` figures are captured with zero export-specific code — a 2.5s
  walk recorded to a ~304 KB webm. Only change needed: let the signal carry a STOP (`{start:false}` →
  `handleStopRecording`) so the panel button / `Yappy.recordAnimation(seconds?)` can start AND stop. The
  exported HTML player still renders a single baked frame (no rig runtime) — video is the motion path.

- **A rig bone that ends at a joint which is a shape's *centre* draws inside that shape.**
  The animated stick figure's neck bone was `shoulder → head`, where the `head` joint is the
  head-*circle's centre*. FK puts that centre `HEAD_RADIUS` beyond the outline, so the neck's last
  ~22px sat inside the head and read as a radius line. Static library poses never showed this: they
  author the torso to *start* at the head's bottom edge (head `[70,34,22]` → `M70 56`). Fix: a shared
  `headAttach(pose)` helper returns the outline point along the shoulder→centre direction
  (`centre + unit(shoulder − centre)·headR`), used by BOTH render paths — `rigPoseToSvg` (thumbnails +
  bake) and `StickRigRenderer.computePose` (live canvas). Lesson: when a bone visually terminates at a
  circle/blob, end it at the *outline*, not the centre joint.

- **Quick-toolbar mini-sliders now accept typed input — one shared component fix.** The floating
  quick-properties toolbar rendered every mini-slider (Font Size, Opacity, …) via `MiniSliderControl`
  in `components/quick-toolbar.tsx`, whose value was a read-only `<span>` — draggable but not typeable.
  The full Properties panel already paired its `slider` property type with a `type="number"` input
  (`property-panel.tsx`, `case 'slider'`), so the gap was only in the ad-hoc mini-sliders. Fix: the
  value `<span>` becomes an inline `<input type="number">` on click/tap (auto-focus + select, live
  `onChange`, clamp to min/max, commit on Enter/blur, Esc cancels). Take the history snapshot ONCE when
  editing begins (`onStart()` in a `beginEdit` handler) — mirroring the track's `onMouseDown → onStart` —
  not per keystroke, so a typed edit is a single undo step. Lesson: when a component is the shared
  renderer for a control kind, fixing an ergonomics gap there fixes every instance for free; check
  whether the "full" panel already solved it and port the pattern rather than reinventing.

- **Mermaid `classDiagram` UML relations: three bugs, all in the parser — the render layer was ready.**
  Generating UML class diagrams from the DSL produced name-only boxes with identical arrows. Three
  distinct causes, none in the renderer:
  1. *Members invisible (field-name mismatch).* The class parser emitted `node.sections.{attributes,
     methods}` and `dsl-engine` mapped them onto `umlAttributes`/`umlMethods`, but the UML renderers +
     `uml-layout-utils` + SVG export read `attributesText`/`methodsText`. Writing to the wrong field is
     a silent no-op. Fix: map onto the canonical `attributesText`/`methodsText`.
  2. *`o--` dropped the source class.* `RELATION_RE` listed the arrow alternative as `" o--"` with a
     **leading space**; since the pattern is `^(\S+)\s+(<arrow>)…`, the `\s+` already consumes the
     separator, so ` o--` can never match — the line fell through to the "unrecognized syntax" branch and
     no edge (and, when the class was relation-only, no node) was created. Lesson: never bake a separator
     space into an alternation that a preceding `\s+` already ate. Also added missing `o-->`/`*-->`,
     reversed `<--o`/`<--*`, and optional quoted cardinality (`"1" o-- "0..*"`).
  3. *All relations drew the same arrow, differentiated only by a text label.* The fix was purely in the
     parser: the `ArrowHead` vocabulary (`triangle` hollow, `diamond` hollow, `diamondFilled` filled) and
     `renderEdge`'s `start/endArrowhead` passthrough already existed. `mapRelationship` now returns a
     `RelationSpec { decorated, glyph, dashed, nav }` and the edge is *oriented* so the glyph lands on the
     decorated end (generalization/composition/aggregation → base/whole/left; association/dependency →
     target/right; reversed forms flip). Set BOTH `start`- and `endArrowhead` explicitly — `createElement`
     defaults `endArrowhead` to `'arrow'`, so leaving it undefined leaks a stray head onto plain/decorated
     relations. Lesson: when the output looks wrong, check whether the capability already exists downstream
     (it usually does) before adding rendering code — the fix is often just wiring the right value through.

- **The "obvious" root cause in a bug report can be a red herring — verify end-to-end before trusting it.**
  The `dsl-uml-gaps.md` report pinned empty `classDiagram` members on a field-name mismatch
  (`umlAttributes` vs `attributesText`). That fix was real but **insufficient**: driving the actual
  repro headlessly (via the new `render:dsl` CLI + a `window.Yappy.state` probe) showed the members
  never even parsed. Two deeper causes only a real run surfaced:
  1. **Parser:** `class Foo {` with the opening brace on the *same line* (Mermaid's canonical form)
     didn't match `CLASS_DEF_RE` (its optional body group needs a closing `}`), so the class def line
     was "unrecognized", the body was parsed as loose statements, and `+observers: List` became a bogus
     class named `+observers` while `Subject` stayed empty. Fix: capture an optional trailing `{` and
     open the multi-line block from it (keep the brace-on-next-line path too).
  2. **SVG export is a separate renderer.** `exportToSvg` uses `rough.svg` with its own per-type
     branches — NOT the shape renderers — so the on-canvas uml-class-renderer (which draws the member
     compartments via a clipped path) never runs on export. The box + `containerText` (name) were the
     only things emitted. Fix: a `buildUmlClassNode` branch in `export.ts` reusing
     `calculateUmlClassLayout` / `calculateUml2SectionLayout` to emit header + compartments + dividers
     as vector `<text>`/`<line>`; and `umlArrowheadGlyph` so `endArrowhead: triangle|diamond|diamondFilled`
     export as real polygons (the arrow branch had only ever drawn an open-V). Lesson: when a feature
     "works on canvas but not in export," suspect a **parallel export renderer** with its own type
     switch, and always confirm the pipeline with a real headless render, not just the unit-level fix.

- **A same-line vs next-line delimiter is an easy regex blind spot.** `class Foo {` vs `class Foo\n{`
  looked interchangeable but the parser only handled the latter. When a grammar allows a brace/keyword
  either trailing the current line or leading the next, test BOTH — they take different regex branches.

- **A capability can be fully implemented in the renderer yet hidden by a property's `applicableTo`.**
  Standalone curvy `bezier` lines couldn't get begin/end arrowheads from the panel — but the
  `ConnectorRenderer` already draws heads for `curveType === 'bezier'` (it derives the tangent angle
  from the control points). The only gap was that `bezier` was absent from the arrowhead properties'
  `applicableTo` (`['arrow','line','organicBranch']`) in `config/properties.ts`, so the controls never
  showed. Adding `'bezier'` was the whole fix (verified: a bezier with `startArrowhead:'diamond'` +
  `endArrowhead:'triangle'` renders both). Lesson: when "the feature exists but the UI won't let me set
  it," check the property registry's `applicableTo`/`dependsOn` before touching renderer code — and note
  that `path`-type (freeform) is rendered by a different renderer that would need real head-drawing work.

- **Auto-fit-to-label misses multi-compartment shapes — fit to the widest *content* line.** DSL
  `applyAutoSizing` sized every node to its label; for a UML class that's only the class name, so the
  box ignored its attribute/method lines and stayed at the 180px default — `-strategy: Strategy` then
  wrapped (clipped on canvas, overflowing on unclipped export, so the type looked "dropped"). The tell
  was that *same-length* lines behaved differently: it's a width threshold, not a font glitch. Fix:
  `computeUmlFittedSize` measures the widest of the header name + every member line (with the SAME
  renderer/font the drawer uses, so sizing and wrap decisions agree) and adds a row per member. Lesson:
  when a shape has compartments/sub-text beyond its title, the auto-sizer must consider ALL of it, and
  size using the identical measurement path the renderer wraps with — otherwise the box and the text
  disagree about what fits.

- **Fan-in connectors need endpoint distribution, not just per-edge routing.** When N edges terminate on
  one shape (inheritance fan, an interface's implementers), each edge independently clips to the shape's
  center line, so all N arrowheads land on ~the same border point and overlap. The fix is a *group* pass:
  `distributeClassEdgeAnchors` collects edges sharing an endpoint, picks the border facing the group's
  average neighbour, and spreads them across fractions 0.2–0.8 (off the corners); `connect()` takes
  `startAnchor`/`endAnchor` fraction overrides to honor it. Lesson: overlap at a shared endpoint is a
  layout-level (all-edges-at-once) concern — a single edge can't know it needs to move aside. Keep the
  override optional and destructure it out of the element options so anchor metadata never leaks onto the
  created element.

- **In a DSL `{ }` block, separate *element/edge* props from *style* props explicitly.** Arrowheads are
  edge-level fields the engine reads directly (`edge.startArrowhead`), not style keys — so a parser that
  funnels the whole `{ }` block into `edge.style` silently drops them. Hoist the known non-style keys out
  before assigning the rest to style (and treat `none`/`null` as an explicit "no head").

- **Mind-map styles = layout strategy + a styling pass, both driven off `layout: mindmap-*` (one source of truth).** Implemented three layouts on top of the existing tree engine: `mindmap-radial` (dual-side — split the root's children in document order, lay the first half rightward and the second leftward from the centre via the existing `assignHorizontalPositions('right'|'left')`, sharing the centre as anchor), plus `mindmap-down-curved`/`-straight` (reuse tree-down; differ only by connector curve). A separate `applyMindmapStyling(diagram)` pass (run before auto-sizing) gives the Miro look without hand-styling: per-branch colour (each top-level branch seeds a colour its whole subtree + connecting links inherit), pill nodes, emphasised centre, and curved-vs-straight/no-arrowhead links. Because it mutates the IR, the visual follows from the layout string alone — so a future live "style switcher" just sets that string.
- **rough.js draws EVERYTHING as sketchy paths — don't use `grep 'C'` to detect real bezier curves.** When verifying the curved-connector export, counting cubic (`C`) path commands was misleading: rough.js renders even straight lines as wobbly paths full of `C` segments. The connectors' actual `curveType` (probed off `window.Yappy.state`) was the reliable signal; visual raster was the tiebreaker.

- **Grep the codebase for an existing subsystem BEFORE building a "new" feature — it may be 90% there.** Mind-map "Phase 2" (UI: create + live style switcher) turned out to already exist as a mature canvas-native engine: `reorderMindmap(root, direction)` (non-destructive layout switch, stored as `mindmapDir` on the root), `applyMindmapStyling(root)` (per-branch colour), organic-branch connectors, reflow on edit, and a full MINDMAP ACTIONS + AUTO LAYOUT panel in the property panel — none of which surfaced until I grepped `mindmap`/`LayoutDirection`. The genuine gap was tiny: no discoverable way to *create* a map. So Phase 2 shrank from "build a layout engine + switcher" to "add `createMindMap()` (seed via `addChildNode` + `reorderMindmap` + `applyMindmapStyling`) and one menu item." Lesson: a broad grep for the domain noun up front would have saved building the parallel DSL layout path first. (The DSL `layout: mindmap-*` path still has value for text/LLM authoring, so it's not wasted — but the canvas engine was the right home for the interactive UX.)

- **HSV colour picker: use CSS gradients for the square, a barycentric triangle for the Krita ring.** The SV square needs no canvas — three stacked layers do it: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(H,100%,50%)`, with the handle at `(s·w, (1−v)·h)`. The Krita-style triangle DOES need a canvas: place three vertices (pure-hue at the ring angle, white, black), and for each pixel compute barycentric weights `(wHue, wWhite, wBlack)`; colour = `wHue·hueRGB + wWhite·255` (black contributes 0). Inverse (click → HSV): `v = 1 − wBlack`, `s = wHue / (wHue + wWhite)`. Keep the last hue when the colour goes achromatic (grey/black) so dragging into a corner doesn't lose it. Eyedropper: feature-detect `window.EyeDropper`. Take the history snapshot once on drag-start (`onStart`), not per pointermove, so a pick is a single undo.

- **Background themes: derive the grid ink from the CANVAS background luminance, not the UI theme.** The canvas texture (dots/grid/graph) used a fixed subtle-black ink flipped by the *UI* dark mode — so a custom dark/blueprint canvas got invisible dark lines on a dark bg. Fix: compute `isColorDark(canvasBackgroundColor)` and pick white-ink vs black-ink from that. Now a "theme" is just a `(background, texture)` pair (both already persisted) — the ink follows automatically, so Blueprint (dark blue) and Dark render light grid lines with zero new persisted state. Lesson: when a decoration must read against a user-set surface, key its contrast off that surface's luminance, not a global theme flag.

- **A new drag-handle feature = 4 coordinated touch points; the shape's local frame is the pivot.** Draggable in-shape text needed: (1) a stored offset (`textOffsetX/Y`), (2) the shared container-text renderer adding it, (3) `handle-detection.getHandleAtPosition` returning a `'text-move'` hit (placed LAST so any real resize/rotate handle wins), (4) `selection-renderer` drawing the grab dot, (5) `selection-handler` down-setup (record start offset in `pointer-state`) + move-processing. The one subtlety: the drag delta is in world space but the offset lives in the element's UNROTATED local frame — rotate the delta by `-angle` before applying, or a rotated shape's label drifts sideways. Keep eligibility identical in detection AND rendering (a shared exclusion set) so the dot only appears where dragging actually works.

- **A scripting API is a public surface — validate/alias plausible-but-wrong inputs, don't store them verbatim.** `createElement(type)` trusted its `ElementType` arg, but a headless caller has no compiler checking it, so `'ellipse'` (the toolbar's own label; the real type is `'circle'`) sailed through and produced an element with no geometry case → invisible, un-hit-testable, and silently dropped by Pathfinder (`getShapeGeometry` returns `null` for unknown types → `elementToMultiPolygon` returns `[]` → empty boolean). The lesson: at an automation boundary, normalize known synonyms with a warning (`ellipse/oval→circle`, `rect/square→rectangle`) AND make the geometry switch defensive (share the `circle` case with `ellipse`) so a bad value degrades gracefully instead of vanishing. A silent no-op is the worst failure mode for a scriptable API — a `console.warn` turns a 20-minute mystery into a one-line "oh, it's called circle."

- **A live "render N transformed copies" effect is cleanest as element-clone + re-render, NOT a ctx matrix.** For the Illustrator-style Transform effect (`el.transformEffect`, `utils/transform-effect.ts`), the instinct is to push a canvas matrix per copy. But the codebase already applies each element's transform from its own fields (`RenderPipeline.applyTransformations` reads `x/y/angle/renderScale/flipX/flipY/shearX/shearY`). So the right move is to generate plain element CLONES with those fields mutated (reusing the `placeRotated` rotate-about-pivot math) and re-enter `renderElement` on each — every copy then gets its stroke, fill, appearance stack, shadow, AND both render styles (sketch/architectural) for FREE, because it goes through the exact same per-element path. The one function (`transformCopy`) serves both the live renderer (transient, at `canvas-renderer.ts` before the mask branch, cache bypassed since one id → N copies collides) and Expand (`cloneSelection` + strip the `transformEffect` field, mirroring `bakeWarp`). Uniform scale maps to `renderScale` (scales about the element's own centre — which is correct once you've already moved the centre along the pivot ray). Non-uniform scale + rotation produces shear that element fields can't hold cleanly, so bake decomposition (`decomposeAffine`) is the follow-up. Contrast with `el.warp`/appearance, which hook BELOW the style split at the geometry/paint layer and so are style-agnostic differently — but they only modify one element's outline, whereas an effect that replicates the whole rendered element (stroke included) must live at the render-loop level.

- **A "3D extrude" effect is cheap as a render-time body behind the shape — reuse the boolean world-polygon helper, don't build a mesh.** For `el.extrude` (`utils/extrude.ts`), the tractable win is to draw a shaded **back face** (outline shifted by the depth vector) + **side walls** (one quad per outline edge) straight to the canvas in world space, BEHIND the shape, then let the shape's normal render draw the front face on top. Reuse `elementToMultiPolygon(el)` (from path-boolean) for the world outline — it already applies rotation+position, so the body lines up. Draw all wall quads in ONE `ctx.beginPath()` path and `fill()` with **nonzero** winding so overlapping quads on concave outlines still fill solid (even-odd would punch holes). Both render styles come free because the body is a plain shaded solid and only the front face goes through the sketch/architectural split. Hook it in `canvas-renderer.ts` before the element render, and set `shouldCache=false` for extruded elements (the body isn't in the element cache). **Gotcha:** a text element's "outline" from `getShapeGeometry` is its bounding BOX, not its glyphs — so text extrudes as a slab; Convert-to-Outlines first for real 3D letters. Live effect > baking hundreds of wall elements: re-editable depth slider, no element explosion.

- **A live on-canvas readout (transform HUD) is a purely store-derived overlay — no listeners, no transform hooks.** The instinct for a "show W×H while dragging" badge is to hook the resize/rotate handlers (pointer-state / selection-handler). Don't — in a reactive store (SolidJS) the selected element's `x/y/width/height/angle` already update on every pointer move, so a component that just *reads* them re-renders live for free. `transform-hud.tsx` derives everything from `store.selection`/`store.elements`/`store.viewState`, computes the world bbox via `getSelectionBoundingBox` (`handle-detection.ts`), projects corners with `worldToScreen` (so it survives pan/zoom/viewport-rotation), and renders a `pointer-events:none` badge — mirroring the `measure-overlay.tsx` pattern. Gotchas: (1) element `angle` is DEGREES (`canvas-renderer.ts` does `angle*Math.PI/180`), display directly; (2) the overlay LAYER must be `pointer-events:none` or it silently eats canvas clicks; (3) `getSelectionBoundingBox` ignores element rotation (uses raw x/y/w/h), so for a rotated single element the badge anchors under the un-rotated frame — fine for v1, note it; (4) show the element's intrinsic W/H for a single selection but the union-box W/H for multi. Verified by driving the live dev server via Playwright (`window.Yappy.createElement` + `setSelected`, assert `.transform-hud` text) rather than trusting typecheck — a visual overlay needs a visual check.

- **Not every panel should become a dockable panel — a CONTEXTUAL auto-managed inspector fights the user-parked dock model; leave it.** The Property panel was Phase D's planned finale but was deliberately NOT migrated (decision 2026-07-10). The tell: its visibility isn't user-controlled, it's *contextual* — ~20 call sites (every `*-tool-group.tsx` + `setSelectedTool`) write `setStore("showPropertyPanel", true)` to auto-open it on tool/selection, and its render gate `showPropertyPanel && (activeTarget() || isPropertyPanelMinimized)` auto-HIDES it when nothing is selected. Dock panels are the opposite: you open them and they stay parked. Migrating would (a) touch ~20 writer files to redirect to `setPanelOpen('property', …)`, (b) lose the auto-hide-on-deselect UX (a parked empty inspector instead), and (c) break layout math that assumes a fixed 290px right-edge panel (`menu.propPanelOffset()`, `quick-toolbar` positioning) — the dock reserves canvas space via `layoutInsets()` but those separate menu/toolbar offsets don't know about it. Net: forcing it in makes a good contextual inspector worse. Lesson: before migrating "the last panel" on a list, check whether its visibility is USER-driven (park it → dock candidate) or CONTEXT-driven (auto-open/hide on selection/tool → leave it). The `grep` signal is a pile of external `setStore("showXxxPanel", true)` writes from unrelated components — that's a context-managed panel, not a parked one.

- **Dock-migrating a panel that has its OWN collapse/minimize: delete it, don't keep it — the dock chrome already collapses.** The Layers panel shipped a whole bespoke minimize subsystem (`isLayerPanelMinimized` store flag + `minimizeLayerPanel` action, a dblclick-header handler, minimize/expand buttons, a `.layer-panel.minimized` CSS class, and `<Show when={!store.isLayerPanelMinimized}>` guards wrapping the entire body). Keeping it alongside the dock's collapse button would give two overlapping collapse UIs. The clean move: rip the whole subsystem out (buttons, guards, class) and let the dock's `toggleCollapse` own it; the body then renders unconditionally. Safe because `isLayerPanelMinimized` was read only inside that file (grep first) — leave the now-dead store flag + action per convention. Also, when a panel's `\`-style hotkey toggles TWO panels together (Property **and** Layers via one `store.showPropertyPanel || store.showLayerPanel` check), rewire only the migrated half to `isPanelOpen(id)` and leave the not-yet-migrated half on its flag. And a subtle persistence trap for viewer/embed contexts: a `setStore("showLayerPanel", false)` that force-hides a panel in a read-only viewer must NOT become `setPanelOpen('layers', false)` — the dock layout is persisted to shared localStorage, so writing it from the viewer would hide the panel in the user's editor too; leave the inert flag write (the viewer doesn't render the dock anyway).

- **Before dock-migrating from a "remaining panels" list, verify each is actually a STANDALONE dockable panel — a `*-panel.tsx` file name lies.** The dockable-panel plan's remaining list named `animation`, `ds-ops`, `scene-timeline` as if they were migration candidates; none were. `animation-panel.tsx` has no `showXxxPanel` flag / toggle / `app.tsx` mount — it's rendered *inside* `property-panel.tsx` as a sub-section, so it migrates WITH property, not separately. `ds-ops-panel.tsx` is gated on `store.appMode === 'presentation' && element()` — a context overlay that auto-shows in presentation mode (where the dock is hidden anyway), not user-toggleable. `scene-timeline` is `position:fixed; left:0; right:0; bottom:0; height:190px` — a full-width horizontal transport bar that a 200–560px vertical left/right dock zone would destroy. The cheap up-front check that distinguishes a real candidate: does it have all three of (a) a `showXxxPanel` store flag, (b) a `toggleXxxPanel` action, (c) a top-level `<XxxPanel/>` mount in `app.tsx` wrapped in `<Show when={store.showXxxPanel}>`? Vector Tools had all three (plus a bonus bespoke `setupPanel` doing its own drag + `ResizeObserver`→localStorage sizing, both made redundant by the dock). Grep `toggleXxxPanel|showXxxPanel|<XxxPanel` before committing to a panel; a `*-panel` filename alone means nothing.

- **Dock-migrating a panel: grep for EXTERNAL reads of the show-flag, not just the panel's own — and watch for panels with a bespoke drag / generic-scoped CSS.** Extends the internal-reads lesson below. Once `toggleXxxPanel` stops writing `store.showXxxPanel`, that flag is frozen `false` everywhere — so ANY component that reads it silently breaks, and those live *outside* the panel file. State/Behaviors/Stick batch: the toolbar's stick-figure button (`active` highlight) read `store.showStickFigurePanel`, and the on-canvas game-mode-bar's visibility + current-view switcher read `store.showBehaviorsPanel` — both needed `isPanelOpen(id)`. `grep -rn 'store\.showXxxPanel' frontend/src` (the WHOLE tree, not just the panel) before declaring done; the leftover decl+init in app-store are the only acceptable survivors. Two other traps this batch: (1) a panel with its OWN drag (State used a bespoke `onMouseDown`/position-signal/window-listener setup, not the shared `draggablePanel` util) — rip all of it out, not just a `ref`. (2) CSS scoped under the wrapper with GENERIC child class names (`.state-panel .panel-actions`, `.input-group`, `.add-btn`) — de-scoping to bare `.panel-actions` risks collisions across the app, so instead KEEP the wrapper class on the body root and only neutralize its floating bits (`position:fixed`, fixed width/max-height). Contrast a component-private class (`.behaviors-panel .gvs-btn`, where `.gvs-btn` belongs to a SHARED GameViewSwitcher used elsewhere) — there you must re-scope to the new container (`.bp-toolbar .gvs-btn`), never bare.

- **Dock-migrating a panel: the real risk isn't the markup, it's the panel's OWN internal reads of `store.showXxxPanel`.** The recipe (strip wrapper/header → body-only; register; bridge `toggleXxxPanel` → `setPanelOpen`; menu checkmark → `isPanelOpen`; drop the `app.tsx` mount) is mechanical for the *chrome*, but once `toggleXxxPanel` stops writing `store.showXxxPanel`, that flag is frozen `false` forever — so any code INSIDE the panel that reads it silently stops firing. Recolor/Brand-Kit/Elements batch: Brand Kit's `createMemo(() => { store.showBrandKitPanel; return listBrandKits(); })` (re-reads localStorage on open) and Elements' `createResource(() => store.showElementsPanel, …)` (lazy-loads the heavy lucide module on open) both had to be rewired to `isPanelOpen('brandKit'|'elements')` (imported from `store/dock-layout`, NOT re-exported by app-store) — miss the Elements one and the whole icon grid never loads. Lesson: before migrating, `grep 'showXxxPanel'` for the panel and rewire every *read*, not just the toggle. Also: a panel with no single `-body` div (Elements has a tabs bar + 3 tab-body divs directly under the wrapper) becomes a fragment (`<>…</>`) return, relying on `.dock-panel-body` for scroll instead of the wrapper's `flex-direction:column`. Header actions with >0 buttons (Brand Kit's From-doc/Blank) move into an in-body `.bk-toolbar` (`width:auto` override on the icon-btn); a Close-only header just disappears.

- **Migrating a floating panel onto the dock: deleting the wrapper `<div>` silently orphans any CSS scoped under its class.** The dock-migration recipe (strip outer container/header/drag → body-only; move header actions into an in-body toolbar; register in `PANEL_REGISTRY`; bridge `toggleXxxPanel` → `setPanelOpen`; update menu checkmark to `isPanelOpen`; drop the `<XxxPanel/>` mount from `app.tsx`) is mechanical, but step 1 has a trap: once the outer `.symbols-panel` / `.gstyles-panel` wrapper is gone, every selector written as `.symbols-panel .sp-act svg` stops matching and the styling vanishes with no error. Fix is to de-scope those rules (`.sp-act svg`). It bit the SVG-sizing rules specifically (lucide `<svg>` collapsing to 0 in flex needs the explicit `width/height` pin) — the icons went invisible until de-scoped. Also harmless-but-worth-knowing: the old wrapper's `position:absolute` block and the `showXxxPanel` store flags become dead code; the established convention here is to LEAVE them (matches Phase D) rather than churn, since nothing references them and panel state now lives in the persisted dock layout. Verify body-scoped classes (`.gs-grid`, `.gs-card`, the new `.gs-toolbar`) were defined at top level, not nested under the removed wrapper, or the body loses its layout too.

- **Export must mirror BOTH the canvas's visual bounds AND its render hook — `renderElement` alone is not enough.** Three export bugs had one root theme: the export path diverged from the live canvas. (1) The crop box used raw `x/y/w/h`, but the *visual* bounds include rotation (rotate the 4 corners about centre), stroke half-width, shadow/glow/feather spread, 3D-extrude depth (expand by the depth vector), and Transform-effect copies (union each copy's AABB) — miss any and it crops. (2) Paged/poster export culled elements by whether their CENTRE sat in the page rect, silently dropping anything overlapping-but-off-centre; use an AABB-overlap test and let the page clip do the cropping. (3) Live effects (extrude body, transform copies) are drawn in the *canvas render hook* (`canvas-renderer.ts`), NOT in `renderElement`, so an exporter calling `renderElement` directly loses them — it must replay the hook (`renderExtrudeBody` + `transformEffectRenderCopies`). Lesson: when you add a render-time effect, grep every place that renders elements to a surface (export PNG/JPG/PDF/PPTX/paged) and thread the effect through, or extract one shared "render element with effects" function both the canvas and exporters call.

- **`registerType: 'autoUpdate'` in vite-plugin-pwa is the classic "blank on first load, fine on refresh" footgun.** autoUpdate emits `skipWaiting()`+`clientsClaim()`, so a newly-deployed SW activates and evicts the *old* precache while the currently-loading page is still fetching its old content-hashed chunks — those 404 (gone from cache and server), the ESM graph dies, and because the inline splash-fade in `index.tsx` runs unconditionally you're left with an empty `#root` (blank), not a stuck splash. A refresh loads the now-consistent new build, which is why "refresh fixes it". Fix = `registerType: 'prompt'` (`injectRegister:false` + `registerSW()` from `virtual:pwa-register`): the new SW installs and *waits* (no clientsClaim; skipWaiting only on an explicit `SKIP_WAITING` message), so the running page keeps its consistent precache for its whole life. Verify the fix straight from the build: `grep -c clientsClaim dist/sw.js` must be 0 and `skipWaiting` must be message-gated. The existing version-tap `hardRefresh` (unregister SW + clear caches + cache-bust reload) doubles as the "apply the waiting update" button.

- **`color-scheme: light dark` on a form control makes its native popup follow the OS, not your app theme.** When the app forces its own theme via `data-theme` (independent of `prefers-color-scheme`), a hardcoded `color-scheme: light dark` on a `<select>` means the OS-native `<option>` popup renders in the *OS* scheme: a dark app on a light-mode OS gets a white system popup, but the `option` text is still `var(--text-primary)` (light) → invisible. Fix = bind `color-scheme` to the applied theme once at the root (`[data-theme="dark"]{color-scheme:dark}` etc.) and let controls `color-scheme: inherit` (it's an inherited property, but an explicit value on the element overrides inheritance — so you must remove/replace the hardcoded one, not just set the root). Native option-popup background/color is only partially styleable via CSS across browsers, so getting `color-scheme` right is the reliable lever.

- **A "preset doesn't work on X" report is usually one of three unrelated failures — check the RENDER path, the SELECTION model, and the panel HANDLER separately.** "Animation presets (drawIn/shakeX) don't work on paths & groups" turned out to be three independent bugs: (1) `FreehandRenderer.render()` overrode the base and never checked `drawProgress`, so `drawIn` (which sets `opacity:0` and animates `drawProgress`) rendered the stroke fully-but-invisibly then popped it in — the fix is one branch, but the tell was that the renderer *already had* `definePath`/`estimatePathLength` (reveal wiring present, just unused). (2) SVG `path` geometry is a self-contained `Path2D`; the base `renderDrawProgress` traced the reveal stroke with `beginPath()+definePath()+stroke()`, which does NOT trace a Path2D (same gotcha as fill: must `strokePath(d)`), so extract an overridable `traceDrawStroke()` and stroke the `d` via `geometryToDs()` with the active `lineDash`. (3) The "group" case wasn't a render bug at all — a group is a **multi-selection** (shared `groupIds`, no container element), and the Animation panel's `addPreset` keyed off the single-selection `element()` memo (null for multi) and silently `return`ed. The add-menu was even *shown* for groups, so it looked applied but wasn't. Fix: fan every add-menu action out across `store.selection`, and render the list from a representative member with edits propagating by index. Lesson: don't assume one root cause behind "feature broken on several element types" — paths, freehand, and groups each failed for a different reason in a different layer.

- **`lazy()` panels sharing ONE ancestor `<Suspense fallback={null}>` blank the whole subtree on any first-open — give each its own boundary.** "First Alt+L flashes/refreshes the whole screen, later toggles are clean" = a code-split panel's first dynamic `import()`. The dock panel bodies are all `lazy()`, but `dock-container` had no `Suspense`, so a panel's first-open suspension bubbled up to app.tsx's single `<Suspense fallback={null}>` wrapping the toolbar + dock + property panel + status bar — Solid renders the fallback for the ENTIRE boundary while the chunk loads, so all of them unmount for a frame. Fix: wrap each lazy body in its own `<Suspense fallback={<small placeholder/>}>` so one panel's load is isolated. General rule: a Suspense boundary's fallback replaces everything inside it — put the boundary as close to each independently-lazy child as possible, never one big boundary around many lazy siblings. (Preloading the chunk on idle also works, but per-boundary Suspense is the robust structural fix.)

- **Duplicating a container (layer/slide) must remap EVERY shared identifier, not just element ids + bindings — `groupIds`/`clipMaskId` are the ones people forget.** `duplicateLayer` deep-cloned elements and remapped `id`, `layerId`, `startBinding`/`endBinding`, `boundElements`, `parentId` — but not `groupIds`/`clipMaskId`. Because grouping here is "every element sharing the outermost groupId is selected together" (no group object), the copies kept the originals' group id, so clicking either selected both → "move one, the other moves". Fix: build a `Map<oldGroupId,newGroupId>` and remap consistently across all duplicated members (one fresh id per distinct original group). Lesson: for any clone that copies a set of elements, audit the element type for *every* field that is a shared/opaque id linking elements to each other (bindings, parent, group, clip-mask, symbol/instance ids) and remap them all through one id-map pass; a field that links two elements but isn't remapped silently fuses the copy to the source.

- **Leftover Vite `index.css` boilerplate (`button{background:#1a1a1a}` + `@media(prefers-color-scheme)`) is a recurring theme-contrast landmine.** The scaffold ships three stacked `button {}` rules; the last sets `#1a1a1a` and is only overridden by `@media (prefers-color-scheme: light)`. So any button WITHOUT a more specific background goes near-black whenever the OS isn't light — regardless of the app's own `data-theme`. It bit `.icon-button` (which had no CSS rule at all). Two-part fix: give the offending buttons a real themed rule, AND neutralize the boilerplate default (`#1a1a1a` → `var(--btn-bg)`, drop the `@media` button override) so the app theme, not the OS, governs bare buttons. This is the same failure family as the earlier `color-scheme: light dark` dropdown bug — when the app forces its theme via `data-theme`, hunt down every style still keyed to `prefers-color-scheme`.

- **Turntable (rotate 2D vector in pseudo-3D) is a live transform, not a new element type — and modelling it as one buys render-parity for free.** Phase 1 of the Adobe-Project-Turntable feature (`docs/turntable-plan.md`) rotates a `path`'s anchors about a vertical/horizontal axis and reprojects to 2D. The key design win: the rotated result is *just another `PathAnchor[]`*, so wiring it in at `getBaseShapeGeometry`'s `case 'path'` (`const subs = applyTurntable(el) ?? getPathSubpaths(el)`) means BOTH sketch (rough.js) and architectural render styles, plus SVG export, pick it up unchanged — no per-renderer work, no fill/stroke-parity trap. Model + actions mirror the live-Extrude pattern exactly (`setTurntable/clearTurntable/bakeTurntable` ≈ `setExtrude/clearExtrude/expandExtrude`; `setTurntable(ids, patch, history=false)` for live-drag vs. committed), and the property-panel `TurntableEditor` is a near-copy of `ExtrudeEditor` (yaw/pitch/depth/persp `Row` sliders + a depth-model `<select>` + Bake/Remove). Three gotchas worth recording: (1) rotate the bézier HANDLES too, not just anchor positions — transform each handle's absolute point through the same pipeline and re-derive the relative offset, or curves shear. (2) The `symmetry` depth model that "reads as 3D" is a parabolic cylinder bulge `z = scale·(1 − (dx/maxHalfWidth)²)` about the mirror axis (peak on-axis, 0 at the silhouette's horizontal extremes) — `flat` (z=0, pure foreshorten) is the always-correct honest floor. (3) `migration.ts` here is a hand-written field-by-field passthrough with NO catch-all spread, so a new `turntable` field is silently DROPPED on document normalize until you add its `...(el.turntable !== undefined && { turntable: el.turntable })` line — and while there I found `pathSubpaths` had the same latent bug (never listed → multi-subpath paths lost on round-trip), now fixed. No WASM changes needed: the math lives in an isolated `utils/turntable.ts` and Bake produces a plain path, so hit-testing/snapping stay turntable-unaware.

- **Turntable Phase 2: a group "3D spin" fits the per-element geometry hook if each member carries the shared rig centre in ITS OWN local frame — no canvas-renderer changes.** The blocker looked structural: `shape-geometry.ts`'s `case 'path'` transform sees one element in its own centred frame, so it can't know about sibling elements or move an element's origin — yet rotating a *group* about a common axis must translate off-axis members (they orbit), not just reshape them in place. The unlock: uniformly offsetting all of an element's anchors visually MOVES the rendered shape (geometry is drawn at `el.x` + the centred anchors), even though `el.x` is unchanged. So store the shared world rig-centre as `cx/cy` expressed in each member's local coords (`cx = worldCentreX − el.x`, set once at apply-time in `setTurntable`), and rotate every anchor about that local centre. A member entirely to one side of the axis has all-positive `dx`, so `x' = dx·cosθ + z·sinθ` collapses/moves the whole member toward the axis — exactly an orbit. Verified: two squares at x=0 and x=200 with a shared world centre 150 both collapse to world x=150 at yaw=90°. Consequence for Bake: the baked anchors carry the orbit translation, so the element's `x/y/width/height` are now stale — `bakeTurntable` must re-tighten bounds (min/max the baked anchors, shift them to origin, push the offset onto `x/y`), or the selection box floats off the shape. Two more Phase-2 notes: (1) a symmetry *back-face reveal* is just the same silhouette transformed a second time with `z` negated, then z-sorted with the front — deterministic "show the far side", no new geometry model. (2) Gate the effect's property-panel section on capability (`canTurntable = type==='path' || shapeToPath(el)`) and make the editor SELECTION-driven (read `store.selection`, self-`<Show>`) rather than bound to the single-selection `targetData()` memo — that's what lets one component serve both the single-shape and multi-select group cases AND stay hidden for text/connectors/tables.

- **Turntable Phase 4 (keyframable spin) cost two lines because the composition evaluator's dotted-key merge is generic.** Making `turntable.yaw`/`pitch` animatable needed only a `TURNTABLE_PROPS` PropDef list in `keyframe-panel.tsx` + one `if (el.turntable) props.push(...)` — no evaluator, exporter, or render change. Why it's free: `resolveNestedOverrides` (composition-evaluator) splits ANY dotted track key on the first dot, clones the element's current nested object (`{ ...el[root] }`) and sets the sub-field, so `turntable.yaw` arrives at render as `{ turntable: { ...el.turntable, yaw } }` — preserving depthModel/depthScale/cx — and the shallow render spread `{ ...el, ...animState }` picks it up; `getShapeGeometry`→`applyTurntable` then reads the animated yaw per frame. Because scrub, playback, and video/HTML export all go through that one evaluator+render path, a keyframed effect param is animatable AND exportable the moment it's registered. General rule for this codebase: to make a live-effect scalar (extrude.*, transformEffect.*, warp.bend, turntable.*) keyframable, register the dotted key in `keyframe-panel.tsx`'s effect-props list gated on the effect's presence — do NOT add per-property plumbing in the evaluator. Verify with a tiny `applyCompositionOverrides(new Map(), [el], t, tracks)` call across a few t values (watch the PropertyTrack shape: `keys:[{t,value}]`, not `keyframes:[{time,value}]`).

- **Turntable Phase 3a (AI "reconstruct at a new angle") was mostly wiring because Yappy's AI is browser-direct BYO-key with a full vision→SVG substrate already in place.** The original plan said "server-side, keyed, premium-gated" — an audit found that has NO substrate: every AI feature (`ai/canva-ai.ts`, `ai/drawing-engine.ts`) calls the provider directly from the browser via one transport `callLLM({provider,model,apiKey,systemPrompt,userPrompt,images,…})`, keyed from localStorage (`ai-settings.ts getApiKey`/`loadAIConfig`), with NO premium/subscription/metering anywhere. So the right build follows the house pattern, not a new backend. The new feature (`ai/turntable-ai.ts reconstructTurntableAI`) is a near-copy of `generateDiagramFromSketchQuick`'s scaffold (load config → bail if no key → `callLLM` with `images:[{base64,mediaType}]`) with two swaps: (a) a new SVG-out system prompt instead of the JSON-DSL vision prompt (`build3DVisionSystemPrompt` asks for YappyDSL JSON, which carries no bézier geometry — wrong for this), and (b) parse with `svgToElements(svgText,{x,y,targetWidth})` (utils/svg-import.ts, pure, returns ready `type:'path'` DrawingElement[]) instead of `parseDSL`/`renderDiagram`. Reuse specifics worth remembering: rasterize a selection with `exportRegion(x,y,w,h,name,scale,download=false)` → returns a PNG dataURL (pass download=false!), then `parseDataURL(dataURL)` → `{base64,mediaType}` straight into `callLLM` (no need for `processImageForVision` unless you have a File/Blob). Insert-with-one-undo idiom (no `addElements` helper exists): `pushToHistory(); batch(()=>{ setStore('elements',p=>[...p,...els]); setStore('selection',ids) }); bumpDirtyRevision()` — copied from `importSvgToCanvas`. Keep the AI module out of the main bundle by lazy-importing it at the call site (`onClick={async()=>{ const m=await import('../ai/turntable-ai'); m.reconstructTurntableAI(...) }}`) — the store/panel must NOT statically import it (that's why canva-ai is only ever reached via `api.ts`'s `await import('./ai/...')`). The Vite "dynamically imported by X but also statically imported by …" warnings are benign here — every AI module trips them because they statically import `toast`/`app-store`; the module still gets its own chunk. Only the pure `extractSvg` regex (handles ```svg / ```xml fences, prose-wrapped, raw) is unit-testable outside a browser; `svgToElements` (DOMParser) and `exportRegion` (canvas) are browser-only, so live verification needs a real API key in-app.

- **Turntable Phase 3b (AI image-reimagine → auto-trace) split cleanly along the ai-layer / store boundary: AI fetch in `ai/`, trace+insert in the store where `makePathFromWorldSubs` lives.** The image tier needed two things that live in different layers: an OpenAI `images/edits` call (browser-direct, belongs in `ai/turntable-ai.ts`) and raster→vector tracing that builds path elements (needs `makePathFromWorldSubs`, which is module-PRIVATE in app-store). Rather than export the private builder or duplicate it, I added a store action `traceRasterAsPaths(sourceId, rasterDataURL, {colors})` that owns the whole trace+insert (loads the raster into a 256px canvas → `traceImageDataColor` [the exact primitive the shipped Trace feature uses] → `makePathFromWorldSubs` beside the source → single-undo insert), and the ai module calls it after the fetch. Dependency direction stays correct (ai → store; the store never imports ai). Reuse specifics: `traceImageDataColor(data, tw, th, {colors,simplify})` returns colour layers whose subpath points are NORMALIZED 0..1 (not pixels) — map them to world with `ox + p.x*src.width` (mirror `traceImage`'s `toWorldSubs`), NOT by pixel dimensions. `postImageEdit` is ~12 lines (`fetch` multipart to `api.openai.com/v1/images/edits`, read `data.data[0].b64_json`); inlining it in the ai module beats importing canva-ai's private copy — keeps the two ai features decoupled. For the UI, two sibling buttons (✨ AI Redraw = 3a vision→SVG any-provider; ✨ AI Reimagine = 3b OpenAI image→trace) both lazy-import the ai module at the click site so it stays a separate chunk; the api unifies them under one method with `mode:'vector'|'image'`. Verifiability reality for any browser-direct AI feature: only pure helpers (regex extractors, coordinate math) are node-testable; the fetch + canvas (`exportRegion`) + DOMParser (`svgToElements`) + `getImageData` trace path are all browser-only, so end-to-end needs a real key in-app — reuse tested primitives and verify the seams (typecheck, build, coordinate mapping vs the existing Trace feature) instead.

- **A cross-origin embed-control bridge is a postMessage attack surface — the origin allowlist MUST come from the operator, never from the framing page.** To let a parent page drive the full `window.Yappy` API when embedded on a different origin, the browser forces a `postMessage` bridge (`embed-bridge.ts`, called from `initAPI()`) — direct `iframe.contentWindow.Yappy` is cross-origin-blocked. The security trap: any config the *framing* page can influence (a URL query param on the iframe `src`, a value in the message itself) provides ZERO protection, because an attacker who frames you controls exactly those. The only real boundary is config the *Yappy deployment* owns: a build-time env (`VITE_EMBED_ALLOWED_ORIGINS`) or a runtime global set from Yappy's OWN `index.html` (`window.YAPPY_EMBED_ALLOWED_ORIGINS`) — a page framing Yappy cannot reach into Yappy's document to set that global. Default is deny (no allowlist ⇒ cross-origin control off); same-origin (`event.origin === location.origin`) is always allowed since the parent already has direct access. Other hardening that matters on a shared `message` channel (OAuth popups etc. also post here): require a private marker on requests (`data.__yappy === true`) so you don't process unrelated traffic; ignore your own echoed responses (`'ok' in data`) so a same-window bridge doesn't treat replies as requests; invoke only `Object.prototype.hasOwnProperty`-own, `typeof === 'function'` members of the API object (blocks `constructor`/`__proto__`/getters); reply only to the verified `event.origin` (never `'*'`); and wrap the reply `postMessage` in try/catch to convert a non-structured-cloneable result into an error instead of a throw. Re-read the allowlist per message (not once at init) so a runtime override applied after load still takes effect. The host-side client (`public/yappy-embed-client.js`) correlates responses by a per-call id with a timeout, and a `__ping`/`pong` op lets it poll readiness before the app has mounted. Serving the client from `public/` means it ships to `dist/` automatically and external projects can `<script src>` it directly.

- **"Handles appear but can't be grabbed" is almost always a draw-gate / hit-gate mismatch — the overlay renderer and the hit-tester disagree on WHEN a handle is live.** Baked/dropped stick figures showed path-anchor squares all over the shape that couldn't be dragged to reshape. Root cause: `selection-renderer.ts` drew the editable-path anchor squares for every selected `path` (`el.type === 'path' && selectedTool === 'selection'`) with no count check, but node hit-testing/dragging in `handle-detection.ts` is gated on `selection.length === 1`. A dropped/baked figure is a GROUP of many path parts, and clicking a grouped element always selects the whole outermost group (selection-handler's group-expand) — so `selection.length` is never 1 while grouped, and every part rendered squares that no click could hit. Fix = add the SAME `selectionLength === 1` gate to the draw path so squares appear iff they're editable. General rule: any time you draw an interactive handle, its render condition must be identical to (or stricter than) the hit-test condition for the same handle — grep the hit-tester for the gate (`selection.length === 1`, `!el.locked`, tool mode, appMode) and mirror every clause in the renderer, or you get dead affordances. This is the same family as the earlier "add-menu shown for groups but the handler keyed off the single-selection `element()` memo" animation-preset bug: group == multi-selection, and single-target tools silently no-op on it — so decide deliberately whether a feature works on a group (fan out over `store.selection`) or requires ungroup/one part, and make the UI reflect that choice. Also worth noting for sizing library drops: match the on-canvas default to comparable inserts — a figure whose SVG viewBox is 140×260 at width 130 is 130×241, nearly 2× taller than a 120×120 icon insert, so it reads as "huge"; picking the width so the HEIGHT lands near the icon footprint (≈110 → 204) is the right calibration, not matching widths.

- **A long-running async op must use a zero-duration ("loading") toast, not the default `info` toast — a fixed-duration indicator lies about work that outlasts it.** All the AI image ops (`removeBackground`/`replaceBackground`/`magicEditImage`/`expandImage`/`generateImage`) showed their "…" progress line via `showToast(msg, 'info')`, which auto-hides after 3000ms — but every one waits on a multi-second OpenAI `fetch`, so the indicator vanished mid-flight and the canvas looked idle until the result appeared. The toast system already distinguished `type: 'loading'` (in `toast.tsx`: `finalDuration = type === 'loading' ? 0 : duration` ⇒ no auto-hide, plus a spinning `Loader2`); the fix was just to pass `'loading'` for the in-progress message and let the terminal success/error toast replace it. The catch: a never-auto-hiding toast turns any *silent* early-return into a stuck spinner, so switching to `loading` forces you to audit EVERY exit path for a terminal toast — I had to add `hideToast()` to `magicWrite`'s no-op branch (all targets returned empty text with no error) and an error toast to `expandImage`'s `!ctx` return. Rule of thumb: `info`/`success`/`error` are fire-and-forget (auto-hide); `loading` is a scope you must always close (success, error, or `hideToast`) on every branch — treat it like a resource that needs releasing. When adding a new async feature, reach for the existing `loading` toast rather than inventing a bespoke spinner, and grep the function for every `return` after the `showToast(..., 'loading')` to confirm each one ends in a terminal toast.

- **A text element's box is only re-fit to its glyphs on TEXT edit, not on font-property change — so bumping font size from the panel left the hit/selection rect at the old size (tiny box, huge text).** The fix belongs in the store chokepoint, not the panel: `updateElement` now detects font-metric keys (`fontSize`/`fontFamily`/`letterSpacing`/`fontWeight`/`fontStyle`) on a `text`/`richtext` element and re-measures width/height using the SAME branches as `commitText` (vertical/`measureVerticalText`, autoResize/`measureMaxLineWidth`, fixed-width/`measureWrappedTextHeight`). Centralising here (vs. the property panel) means the quick toolbar, property panel, and `window.Yappy.updateElement` API all get it for free. Two guards keep it safe: skip when the patch already carries an explicit `width`/`height` (so `setElementTransform`/handle-resize win), and only run when a font key is actually present (measurement uses the shared offscreen `getMeasurementContext`, so no canvas ref needed — cheap, but still gated). **Watch for the second-order regression:** any UI that anchors to an element's live geometry will now jitter when font size is dragged, because the box resizes every input frame. The floating quick-toolbar did exactly this — fix was to freeze its WORLD-space anchor (x/y/width) for the drag duration (set on the slider's onStart/mousedown, cleared on global pointerup/touchend/mouseup) and read the frozen values in the position accessors; freezing world coords (not screen) keeps pan/zoom live and lets it settle once on release. General rule: when you make a property live-resize an element, audit every overlay that positions off that element's width/height for per-frame jitter, and freeze-during-interaction rather than debounce. Also: there was no font-load→redraw hook (only image-load), so a FontFace resolving after first paint left stale fallback text — add a `document.fonts` `loadingdone` listener that requests a redraw, mirroring `setImageLoadCallback`.

- **A transient on-canvas overlay must be cleared in EVERY teardown path, and the drag-end cleanup is the one that gets forgotten.** The magenta equal-spacing guides stuck on the canvas because `selectionOnUp` (the sole fall-through cleanup reached by every selection pointer-up) reset `snappingGuides` + `pointSnap` but not `spacingGuides` — the one sibling signal added later. So a drag that ended on a spacing match left the badges up, and since the same cleanup runs on a click-outside deselect too, nothing ever cleared them. Rule: when a drag sets N sibling overlay signals together (here snapping/spacing/pointSnap, all set in the same `selectionOnMove` block), clear the SAME N together at drag-end — grep the move handler for every `set*Guides`/`set*Snap` and mirror the full set in the up handler. Verifying canvas-drawn overlays (not DOM) needs a real drag + screenshot (Playwright `mouse.down`/`move`/`up`), since the guides are pixels, not queryable nodes; and note the API `create*` shape helpers are positional `(x,y,w,h,options)` — passing an options object as the first arg silently places the element at a garbage coordinate (nothing visible), which will make a visual test look like a no-op.

- **A first-visit product tour is a standalone overlay + module-signal store — no coupling to the global app store beyond reading `appMode`.** Built `components/onboarding-tour.tsx` (spotlight SVG mask cut around a landmark `getBoundingClientRect`, positioned tooltip, module-level `active`/`stepIndex` signals, `startTour()`/`endTour()`/`maybeAutoStartTour()` exports, localStorage `yappy:tour:seen`) mirroring the tinyfly editor pattern, but two adaptations mattered. (1) THEME-AWARE contrast: reusing the app CSS vars is right for panels, but for the primary CTA button white text on `--primary-color` FAILS AA in dark mode (dark theme primary is a lighter blue #60a5fa → ~2.2:1). Fix: give the CTA a FIXED accessible blue (#2563eb, white 5.17:1; hover #1d4ed8 6.7:1) independent of the theme var, and make the secondary hover shift the fill toward `--text-primary` via `color-mix` (darkens in light, lightens in dark) instead of `filter: brightness()` (which lightens in BOTH, wrong for light theme). Verified every text/button ≥4.5:1 in both themes by measuring rendered getComputedStyle colors + a WCAG-ratio calc in Playwright, not by eye. (2) TARGET SELECTORS must be stable global classes — yappy uses plain `class="..."` everywhere (no CSS modules), so `.toolbar-container`/`.canvas-drop-zone`/`.property-panel-container`/`.floating-tools-cluster`/`.help-btn`/`.text-logo` are safe; a step whose target is missing falls back to a centered card (do this, or a hidden panel makes the tour point at nothing). Gotcha when verifying: `Yappy.setTheme()` applies `data-theme` via a Solid effect, so reading contrast in the SAME `page.evaluate` as the setTheme call returns STALE (previous-theme) computed styles — split it: setTheme, `waitForTimeout`, then measure in a separate evaluate. Discoverability: wire `startTour()` into the Help dialog + `window.Yappy.startTour()` (api.ts), auto-run once from an App `onMount` via `maybeAutoStartTour()` (guarded on `appMode !== presentation` + the seen flag).

- **On paged docs, "which slide owns an element" and "should this element be drawn right now" are DIFFERENT questions — conflating them makes elements vanish mid-drag.** The renderer culled any element on a design/slide page whose CENTRE left the active slide rect ("strict slide isolation"), so dragging something past the page edge deleted it from view the instant its midpoint crossed — even with half the box still on the page and the cursor still over it. The clean split: OWNERSHIP (which slide saves/exports the element — `getElementsOnSlide`, `export.ts`) can stay centre-based and stable; RENDER VISIBILITY must be AABB-overlap (draw if the box touches the active slide) PLUS an always-draw-if-selected escape hatch so an actively-dragged element never disappears. Overlap (not centre) also matches how deliberate overhangs already behaved (a portrait extending below the page rendered because its centre was on-page); the bug was only the edge case where the centre itself crossed out. Isolation for adjacent slides is preserved because slides are laid out with spatial gaps, so a fully-off-page element (owned by a neighbour) has no overlap with the active rect. Repro/verify pattern for canvas-render bugs where nothing is queryable in the DOM: drive the real app (Playwright), move the element in steps via `Yappy.updateElement`, and SAMPLE THE CANVAS PIXEL at the element's projected screen centre (`getImageData(1,1)`) while also computing whether that point is on-screen — the bug is "pixel not element-colour while the point is demonstrably on-screen". Isolate the layer first: the same walk showed NO vanish on infinite canvas (AABB viewport cull is correct) but DID vanish on a `newDesign()` doc — which localized it to the paged-only isolation block, not the shared viewport cull.

- **A "What's new" popup should read from a HAND-MAINTAINED user-facing list, not auto-parsed release notes — and its freshness needs a process hook or it silently rots.** Built `data/whats-new.ts` (a `{version,date,items[]}[]` array, newest first, benefit-first copy) + `whats-new-dialog.tsx` (module-signal open state like the tour, so status-bar AND `window.Yappy.showWhatsNew()` can trigger it). Deliberately did NOT scrape `release-notes/*.md`: those headers are still half commit-speak, and build-time JSON generation adds a pipeline for little gain — a curated array keeps the copy honest. The rot risk is real, so the durable fix was a PROCESS change: added "update whats-new.ts" to the CLAUDE.md "ship it" step, not just a code comment. The "new since last seen" badge uses `yappy:whatsnew:seen` (colon-namespaced, matching the dominant convention) and, crucially, on a null record (brand-new client) it SILENTLY initializes to the current version and returns false — otherwise every first-time user gets a "new!" dot for features they never had an "old" state to compare against (and it would double-nudge with the first-visit tour). Repurposed the version button: it used to hard-refresh on click (an iPad affordance) — moved that into the popup as a "Reload latest" button so nothing was lost while the click now opens the popup. Contrast: same fixed-#2563eb-badge / color-mix-hover approach as the tour, re-verified ≥4.5:1 both themes by measuring rendered getComputedStyle in Playwright. Verified the full matrix headlessly: returning-user dot shows / clears on open, fresh-user no dot, open via click + API, close via Esc + overlay-click, all 20 entries render newest-first.

- **Any auto-appearing modal (first-visit tour, what's-new nudge) must be neutralized suite-wide in the e2e harness, or every click-driven spec written before it starts failing with "element intercepts pointer events".** The v0.8.100 onboarding tour auto-starts on a fresh profile — which is exactly what every Playwright context is — and its `.tour-overlay` (role=dialog, aria-modal) sits over the whole page, so `element-search-illustrations.spec.ts`'s chip clicks timed out (the two keyboard/API-driven tests in the same file kept passing, a useful tell that the feature itself was fine). The right fix is one line in the harness, not N specs: pre-seed the gate flag via `use.storageState` in `playwright.config.ts` (`origins[].localStorage: [{name:'yappy:tour:seen', value:'1'}]`, origin derived from `YAPPY_URL` so the override still works). Rule: when shipping any "auto-show once" UX, add its seen-flag to the shared Playwright storageState in the same commit — and when an old spec suddenly times out on a click that used to work, check for a NEW overlay before suspecting the feature under test.

- **Global hotkey guards must exempt `<SELECT>` too, and any unbounded option list can't stay a native `<select>`.** Two font-picker bugs, one root pattern each. (1) The app-wide keydown handler's "user is typing" check covered INPUT/TEXTAREA/contentEditable but not SELECT, so with a property dropdown focused, ↑/↓ fell through to the arrow-nudge branch and moved the selected element (preventDefault also killed the browser's own option navigation). One-line fix; rule: the editable-target guard is a list, and every focusable form control belongs on it. (2) The Font dropdown's option count grows with user-added Google fonts, and a native select popup is OS-rendered — it can spill past the screen edge and cannot be styled, clamped, or scrolled by CSS. Once a select's list is user-extendable, replace it with a custom popup: portal + `position:fixed` from the trigger's rect, flip up when space below < space above, max-height + overflow scroll, search box, ↑↓/Enter with `stopPropagation` so canvas hotkeys can't fire, and real buttons for actions that used to be fake sentinel `<option>`s (`__google_fonts__`/`__add_font__`) — sentinel options in a select are a smell that it wants to be a widget. Kept every other property select native (they're short, and native = free a11y).

- **"Export video" and "record the canvas" are different products, and the codec must be pinned.** A user exporting an animated post as MP4 got a live screen capture (viewport framing, grey workspace, runs-until-stopped) because the only video path was `canvas.captureStream` on the LIVE canvas. The fix mirrors the thumbnail pattern scaled up: render the active page each RAF to a hidden canvas at page resolution (translate by the page's spatialPosition, same layer/master/animated-override pipeline as the live renderer with `shouldAnimate=true`), and record THAT canvas for a fixed duration — output is then framed to the document, independent of zoom/pan, with no UI. Two clock gotchas: (1) the stickRig renderer self-clocks from `effectiveTime()`, which only advances while the engine ticker is forced — export must keep it alive (a `pageVideoExporting` signal folded into the canvas force-ticker predicate), and (2) drive orbit/spin/keyframe states from a LOCAL monotonic time (`tAnim0 + elapsed`) so a stalled reactive clock can't freeze the export. Separately: never ask MediaRecorder for bare `'video/mp4'` — Chrome silently picks VP9, and VP9-in-.mp4 doesn't play in most mp4 consumers; pin `avc1.42E01E` (H.264 baseline) and bump `videoBitsPerSecond` (~8 Mbps) or line art smears. Verify with ffprobe (codec/container/dimensions), not by "the file downloaded".

- **GIF export rides the same page-frame renderer as video export, but the clock forces real-time capture.** Added Export → Animated GIF via `gifenc` (happypaint's proven pattern: per-frame `quantize(data, 256)` + `applyPalette`, fixed `delay = 1000/fps`, `repeat: 0` on the FIRST frame writes the NETSCAPE loop block → loops forever). Two design points: (1) refactor first — extracting `makePageFrameRenderer(maxSide)` from `exportPageVideo` meant the GIF path was ~40 lines and cannot drift from the video path's rendering semantics; (2) although GIF encoding doesn't need MediaRecorder's real-time constraint, the stickRig renderer poses from the LIVE engine clock (`effectiveTime()`), so frames must still be sampled as wall time passes (RAF loop, capture when `elapsed >= nextT`) — encode-as-fast-as-possible with virtual timestamps would freeze self-clocked elements. Practical caps differ per format: video 1920 long-side, GIF 960 (a 2s/10fps/960px GIF ≈ 0.5 MB; it grows brutally with size). `gifenc` ships no types — declare a minimal `declare module 'gifenc'` d.ts. Verify GIFs with ffprobe (`-count_frames`) + a NETSCAPE-block grep for the loop flag, and eyeball one frame for quantization banding.

- **The exported-HTML player is a second app shell — every global affordance the main app provides must be re-provided (or consciously excluded) there.** Two gaps found by actually opening exported files: (1) keyboard slide navigation lives in app.tsx's global keydown, which the player never mounts — so exported presentations only navigated by clicking chevrons; (2) non-paged (infinite-canvas) docs export no viewState and the player only positions the viewport for paged docs, so content opened cropped or off-screen at pan(0,0). Fixes: bind →/←/Space/PageUp/Down/Home/End in player-app.tsx to the SAME store actions the on-screen controls use (advancePresentation/retreatPresentation/setActiveSlide — never a parallel implementation), guarded against gameActive (the game runtime owns keys) and typing; and zoomToFit() after load for non-paged docs. Verification pattern that caught both: export for real in Playwright, save the download, open it via file://, then assert on CANVAS PIXELS (inked-pixel count vs background) and on behaviour (toDataURL before/after a keypress) — "the file downloads" proves nothing about what it shows. And again: the player is a committed prebuilt bundle — rebuild via `node scripts/embed-player.js` or fixes silently don't ship.

- **A local "saved drawings" library is a FOURTH persistence tier — keep it strictly separate from the three that already exist, or they corrupt each other's contract.** Yappy already had auto-save (a single `yappy:autosave` slot = crash recovery for the LIVE doc), version-history (a throttled ring of snapshots OF the live doc), and the account-based backend workspace. "My Drawings" is none of those: it's an explicit, user-curated, offline-first multi-document gallery. The design that makes it cheap is stolen wholesale from version-history: store the **index** (`yappy:drawings:index` → `DrawingMeta[]`: id/name/thumb/counts/updatedAt) separately from each **body** (`yappy:drawing:<id>` → one full SlideDocument JSON), so `listDrawings()` never deserializes a single document — critical once a user has dozens. `activeDrawingId` (localStorage) tracks which gallery entry is "open" so Ctrl+S upserts in place instead of spawning duplicates; "New drawing" first snapshots live work into the gallery THEN clears the active id, so the next save is a fresh entry and nothing is lost. Signals-in-the-store file (`activeDrawingId` exported from drawings-store.ts) rather than a component let the welcome screen, menu, and dialog all read it without a shared parent.
- **IndexedDB is "best-effort" storage — for a user's LIBRARY that's a data-loss bug, so request persistence, but do it feature-detected and non-blocking.** Browsers may evict IDB under pressure, and Safari/iOS ITP wipes script-writable storage after 7 days of no visits — fine for a crash-recovery cache, unacceptable for drawings the user deliberately kept. Fix: call `navigator.storage.persist()` on first save (`persistent-storage.ts`). Three rules that kept it safe: (1) every StorageManager call is feature-detected and swallows errors — on browsers without the API it resolves a benign `{supported:false}` instead of throwing, matching the graceful-degradation contract of the surrounding idb-kv layer; (2) it's idempotent — check `persisted()` before `persist()` so already-durable origins don't re-prompt; (3) fire it as `void requestPersistentStorage()` (not awaited) from the save path so the actual save never blocks on a permission decision. Installed PWAs are usually granted automatically, which is the real nudge to surface ("install the app to keep your work safe"). Also expose usage via `estimate()` so the UI can honestly say "N MB used" and whether storage is durable — users trust an offline library more when it shows its own state.
- **A standalone open-state signal file is the fix for "opening a dialog shouldn't eager-load its payload."** The gallery dialog pulls in the whole storage layer (drawings-store + idb + thumbnails). If the menu/welcome-screen imported the dialog just to flip its open state, all of that would load on first paint. Splitting a 3-line `drawings-gallery-signal.ts` (`createSignal(false)`) out, and `lazy(() => import('./drawings-gallery-dialog'))` for the component, means the trigger sites import only the signal; the dialog and its IndexedDB code load the first time it's actually opened. Same pattern already used for new-game/my-games signals — worth making the default for any lazy dialog with a heavy import graph.

- **A SPA `navigateFallback` will silently hijack any real static page that takes a query string — OAuth callbacks are the classic casualty.** The Google Drive sign-in popup returns to `/oauth-callback.html?state=…&code=…&iss=…`; the page rendered the *app shell* instead of the callback, so its script never posted the code back and the flow hung on "Connecting…". Root cause is workbox precache + `navigateFallback` interaction: precache keys are query-less (`/oauth-callback.html`) and default `ignoreURLParametersMatching` strips only `utm_*`/`fbclid`, so a navigation request WITH an OAuth query misses the precache and falls through to the `index.html` fallback. Fix is one line — `navigateFallbackDenylist: [/oauth-callback\.html/]` (denylist is matched against `url.pathname`, so it ignores the query entirely). The general rule: every non-SPA HTML entry point that can be navigated to with a query string (OAuth/redirect callbacks, payment returns, share links) MUST be in the navigateFallback denylist, or the SW serves the app shell over it. Debugging tell: the URL bar shows the right path but the wrong content renders — that's the SW fallback, not a redirect bug. And because of `registerType: 'prompt'`, shipping the fix doesn't rescue already-loaded clients until their SW updates on the next hard refresh.

- **When a feature must exist in two different rendering systems, put the GEOMETRY in one pure module and give it two dumb emitters — don't let each system grow its own copy.** Stick-figure faces/hair had to work for the static SVG library (`buildFigure` → `svgToElements` → path elements) *and* the procedural `stickRig` element (redrawn every frame on canvas, in both sketch and architectural styles). The shape that scaled: `library/stick-figures/face.ts` is pure (no DOM, no store, no Solid) and exports `faceGeometry`/`hairGeometry` returning absolute-coordinate primitives (`dot`/`ring`/`oval`/`arc`/`poly`/`path`), plus `faceHairSvg` which serialises those same primitives to role-tagged markup. The canvas renderer consumes the primitives directly; the library/bake path consumes the SVG. One geometry pass, zero drift — and adding a style is one entry in a recipe table, not two implementations. Corollary: keep primitives in ABSOLUTE coords (pass in the head's canvas-space centre/radius) so the renderer never has to transform an SVG `d` string; the only concession is that a non-uniformly-scaled element uses the mean radius.
- **Restyling a flattened import in place needs a re-derivable anchor, not stored source geometry.** A dropped figure is just a bag of `path` elements — the pose identity is gone. Rather than persisting a figure descriptor, the whole face is derived from the HEAD CIRCLE alone (`cx,cy,r` = the head part's current bbox), so `restyleStickFace` still works after move/scale/rotate/ungroup: delete the old `face`/`hair` parts, regenerate from the head's live bbox. Only two bits of state are stored — `sfFace` (the styles worn) on the head part, and `sfHeadId` on each mark so multi-figure scenes replace the right marks (with a nearest-head-centre fallback for figures dropped before the field existed). Two traps when re-importing generated markup: (1) `svgToElements` normalises everything to the CONTENT bbox, so you can't predict output coords — ship a throwaway head circle in the markup as a *registration mark*, derive scale+offset by matching it to the real head, then discard it; (2) the new parts must inherit `renderStyle`/`roughness`/`strokeStyle` from the head or a sketch figure silently grows a clean-line face, and a rotated figure needs the rotation baked into the SVG (`<g transform="rotate(deg cx cy)">`) rather than set as each part's `angle`, which would spin every mark about its own centre.
- **A quadratic "cap" over a circle needs its control point far higher than intuition says — and the fix is an elliptical arc, not a bigger control point.** Hair crops over a head kept rendering INSIDE the skull and vanishing under the head's own stroke. The arithmetic: a Q curve's apex sits halfway between the midpoint of its endpoints and the control point, and the cap's endpoints are down at *ear* level (angle ≈ 1.04π, so y ≈ cy − 0.13r), not at the crown — so clearing the skull top (cy − r) needs `lift > 1.6r`, and by then the curve reads as a *peak*, not a dome. Correct construction: make the outer edge a circular arc through the same two side points with the apex at `r·(1+rise)`, solving for the arc centre (`m = (h² − xc² − yc²) / (2(−yc − h))`, `R = h + m`) and drawing it as the large arc (`A R R 0 1 1`), then close back along the skull with `A r r 0 0 0`. General lesson: for "shape hugging a circle" geometry, solve for the arc through known points instead of hand-tuning bezier control points — and when a filled path renders as nothing, dump the `d` and render it standalone with a red stroke before assuming a winding/flag bug.

- **A capability check that's broader than the code that implements it produces a button which reports success and does nothing.** `isPathLike` accepted `type === 'line'` by name, so the Stick Figures panel offered "Walk this path" and `attachFigureToPath` returned `true` — but `localPolyline` only knew how to sample `pathSubpaths`/`pathAnchors`/`points`, and a plain line/arrow has NONE of those (it's just `x`/`y`/`width`/`height`). Empty polyline → `elementPathSample` null → the renderer's path branch skipped silently, figure animated in place. Curve/pencil routes carry anchors so they worked, which is exactly why the demo-template e2e test never caught it. Two rules: (1) when a predicate answers "can we do X to this?", it must be derived from the SAME function that does X — or at minimum every type it admits needs a case in that function, so audit them as a pair; (2) a "success" return from an attach/enable call should mean the effect is achievable, not merely that both ids resolved. Verification note: this class of bug is invisible to state assertions (the payload looked perfect — `path.pathId` set, `playing:true`) and only shows up by measuring the RENDERED position over time; scan a canvas region that excludes the route itself (the top half, when the route is drawn low) or the line's own pixels swamp the figure's.
- **When one "speed" knob exists, every time-driven branch must honour it, or the control reads as broken in whichever branch forgot.** `stickRig.speed` was applied by the in-place clip branch and the sequence branch but not the path-follow branch, which computed progress straight from wall time and `path.dur`. Adding a Speed slider would therefore have done visibly nothing for a path-walking figure — the most common use of the feature. Fix was to fold `speed` into the traversal (`t * speed / dur`) and redefine `dur` in the UI as "seconds for one lap **at 1×**", so the two controls compose instead of competing. General rule: grep for every read of the clock in a renderer before adding a rate control, and make the units of any pre-existing duration explicit in the label the moment a multiplier joins it.
- **On a 2-bone limb, "hand to face" is nearly a degenerate IK case — author it from the geometry, not by nudging angles.** Several daily-action clips (think, drink) needed the hand at the chin/mouth. Shoulder→mouth is ~25 units while both arm bones are 26 each, so the elbow has to fold almost shut; intuitive angle offsets (upper arm slightly forward, forearm well bent) put the hand out at shoulder height instead, and the pose read as a tangle. Working method: pick the TARGET point, then solve the two angles on paper from the joint positions the rig actually produces (`elbow = shoulder + 26·dir(θ₁)`, `hand = elbow + 26·dir(θ₁+θ₂)`) and write those numbers down with a comment explaining the constraint — the next person editing the clip needs to know the elbow is folded deliberately. Also worth stating once in the file: for this side-profile rig a NEGATIVE limb offset swings forward/up, and `footTargets` are PELVIS-relative, so any clip that drops the pelvis by D must raise its foot targets by D (`GROUND_Y - D`) or the feet sink through the floor. A squat additionally needs the hips to travel BACK (`root.x`), or the knees have nowhere to go and the legs fold into a zigzag. Fastest verification loop by far: render every clip at 5-6 phases into one HTML contact sheet via the pure `poseAt`/`rigPoseToSvg` functions and screenshot it — no app, no clock, and bad poses are obvious at a glance.

- **A deliberate copy of a function is a silent subscriber to every future change to the original — extract the shared part the moment the copy exists, not after it rots.** `buildFigureElements` in the comic generator was a hand-copied `insertStickFigure` body, and the copy was justified: a generator must land as ONE undo step, so it can't call `pushToHistory` per figure. The comment even pointed at the original with a line number. That wasn't enough — when faces shipped, the original gained `applyFaceHair` and `linkFaceParts` and the copy got neither, so comic figures rendered faces (those are baked into the asset SVG) while being unrestyleable, ignoring the user's face preference, and keeping coloured hair in mono. The failure mode is nasty because the copy still *works*, just subtly less than the original — no crash, no type error, and the visible part (faces appear) looks like success. The fix generalises: when you need "the same thing but without the side effects", extract a store-pure `prepare*` that returns ready-to-commit elements and let both callers compose it; the side-effecting wrapper keeps history/selection/telemetry. A "see X:81" comment documents the duplication but does not prevent the drift — only shared code does. Detection tip: assert on the INVARIANTS the shared step establishes (every face part has `sfHeadId`, every head has `sfFace`) rather than on the visible output, because the visible output was fine the whole time.
- **When a feature gains a new dimension, audit every existing selector that used to fully determine the old one.** Comic emotion cues mapped an emotion to a POSE, which was complete when a figure was only a body. Once figures had faces, "Angry" still selected the `office-stressed` pose — whose authored expression happens to be *scared* — so the single most explicit thing a user can say about mood produced the wrong face. The mapping table needed a second column, not a cleverer inference. Two design points worth reusing: (1) keep the SAME precedence chain for the new dimension as the old one (inline cue → explicit picker → inferred), or the two can disagree and users can't predict which wins; (2) only set the new dimension when the user was EXPLICIT — poses picked by the text rules keep their authored expression, so "lol" still grins without the emotion table having to enumerate every rule. A fallback of "leave it as authored" is almost always better than a fallback of "neutral".

- **"Stable across panels" is a statement about the KEY, not about caching — pick an identity that doesn't move.** Giving each comic character their own hair is easy; making it the same hair in every panel is the actual problem, because `createComicStrip` plans each panel independently. Assigning from a panel's own cast (the obvious place — `castSpeakers` is right there) means a character's slot shifts the moment a colleague is absent from a panel, so Ann changes hair halfway through the strip. The fix is to key on position in the FULL script's cast (order of first appearance) and compute it once at the strip level, passing it down as an explicit per-speaker override that the per-panel logic already honours. Two details that made it clean: (1) the per-panel path still assigns for itself, so a single `createComicPanel` and a directly-called `planComicPanel` behave sensibly — the strip just wins by passing overrides; (2) don't reuse `castSpeakers` for the global list, because it caps at the number of characters one PANEL can hold, which is the wrong bound for "who is in this comic" — a subtle way to reintroduce the same drift. Also worth encoding in the palette itself: order slots so ADJACENT entries differ in silhouette, not just colour, since a monochrome or printed strip discards colour entirely.
- **An SVG arc flag that works for every case you tested can still be wrong in general — derive it, don't hardcode it.** `capPath` closed its filled crescent along the skull with `A r r 0 0 0`, and that was correct for every hair style that existed (all spanned under 180°). Adding an afro — a halo wrapping past the ears, ~216° — made the closing arc take the *minor* path, i.e. under the chin, so the fill covered the whole face instead of hugging the crown. The large-arc flag isn't a constant of the shape, it's a function of the span: `a1 - a0 > π ? 1 : 0`. General rule for path helpers: any flag derived from the arguments must be computed from the arguments, even when today's callers all land on the same value — the first caller outside that range fails visually, not loudly. Same debugging move as before: dump the `d`, render it standalone with a contrasting stroke, and the boundary tells you immediately which way it went.

- **When a decoration derives from geometry the figure already has, it follows every pose for free — pick the right source polyline and the hard part disappears.** Faces derive from the head circle; trousers and shoes derive from the LEG polylines, inflated into a closed outline by offsetting each point along its normal with a per-style width profile. That one idea covers straight/baggy/skinny/shorts/joggers as width-and-length parameters, and it means a seated figure's trousers bend at the knee, a cyclist's follow the pedalling leg, and a walking figure's stride — without anyone authoring a seated or walking variant. Three implementation details earned their keep: (1) build a CLOSED OUTLINE, not a fat stroke — a filled polygon fills *and* strokes correctly in both render pipelines, whereas a wide rough.js stroke reads as scratchy noise; (2) RESAMPLE the polyline before offsetting (a raw hip→knee→ankle chain has two segments, so a tapering width kinks at the knee instead of flowing); (3) size garments from a pose-INDEPENDENT unit (rest-length hip→ankle) rather than the limb's own length — a foreshortened cycling leg is 55 units against a standing 84, so length-relative widths would make the same trousers 30% thinner on one pose than another.
- **Extract the shared primitive type BEFORE the second consumer, and the second consumer's renderer is free.** Faces already expressed themselves as a small union of drawing primitives (dot/ring/oval/arc/poly/path) with two emitters — canvas prims for the renderer, SVG for the library. Pulling that union into `prims.ts` before writing `garments.ts` meant trousers and shoes returned the SAME type, so the rig renderer's existing `drawPrimsArchitectural`/`drawPrimsSketch` drew them with zero new render code — and render-style parity became structural rather than something to remember. The generalisable rule: when a second feature is about to produce "things to draw", make it produce the FIRST feature's representation, not its own.
- **Z-order is a property of the feature, not of the insert helper — check it explicitly when adding a second kind of generated part.** Faces and hair sit ON TOP of a figure, so the restyle path appended new elements to the store. Garments sit UNDERNEATH the bones, so appending would have painted trousers over the very legs they were derived from. The fix is a splice ahead of the first `body` element, but the lesson is the audit: any code path that adds generated geometry needs an explicit answer to "above or below what's already there", and a test that asserts the index ordering (`lastGarment < firstBody`) rather than trusting a screenshot — the wrong order is only obvious when the fill happens to be opaque.
- **A structural rule mined from real data beats one reasoned from a couple of examples.** Identifying which subpaths are legs looked obvious — "the ones starting at the hip" — and that scored 56/58 poses. The two failures were the informative ones: seated poses author a leg as thigh + shin in SEPARATE subpaths (so the shin starts at the knee and gets missed), and some poses draw only one visible leg. Following any subpath that continues from the chain's end gets 58/58. Worth doing this as a scripted sweep over the whole corpus before designing around the rule, not after — and then freezing it as a unit test over every pose, because a future pose that breaks the rule loses its trousers silently rather than throwing.

- **"Everything that isn't X" beats a positive rule when the positive rule has to describe drawings people made freehand.** Identifying arms for sleeves looked like it wanted a spatial rule — "subpaths starting on the torso" — and that scored 55/58 poses. The failures were the interesting ones: a security guard's CROSSED arms touch neither shoulder (they start out at the hands), and some poses put the shoulder a few units off the torso line. Since the `bones` string only ever holds torso + arms + legs (props live in a separate field), subtraction is exact and needs no tolerance at all: arms = parts − legs − torso. Related, in the same sweep: the torso is the non-leg subpath passing CLOSEST TO the hip, not the one ending there — a figure standing behind a podium runs its torso past the hip. Two general lessons: prefer set-subtraction over geometric matching when the universe is closed and you can enumerate it; and when a rule needs a distance tolerance, that tolerance is a smell worth one more look at the corpus before you tune it.

- **When overlapping generated parts look wrong, try reordering them before adding a special case.** Sleeved crossed arms rendered as a filled bow across the whole chest, and the tempting fix was to detect the crossing and shorten or skip those sleeves — a per-pose exception that would need maintaining as poses are added. The actual fix was one line of ordering: emit sleeves BEFORE the torso body so the body draws over them. The crossing then happens behind the jacket and only the outer stubs show, which is how folded arms genuinely look. It also silently fixed something I hadn't flagged — the seam line sleeves drew across the shoulder on every ordinary pose. Generalisable: layered generated geometry has a correct paint order that usually mirrors the real-world stacking (garment over limb, body over sleeve), and getting that order right removes whole classes of overlap artefact that individually look like they need bespoke geometry. Assert the order in a test, since the symptom is only visible when a fill happens to be opaque.

- **When stroke and fill are drawn from two different geometry functions, every shape parameter has to be taught to both — and the one that's only used for clipping will be the one that rots.** Corner roundness was implemented in `rectangle-renderer.ts` / `diamond-renderer.ts`, which draw the outline, but complex fills clip to `utils/shape-geometry.ts`, which had a hard-coded `r: roundness ? 10 : 0` for rects and no rounded diamond at all. Nothing broke loudly: simple solid fills go through the renderer's own path and looked perfect, so only the *complex* fills (gradient, pattern, image, mesh, hachure) leaked past the corners — which is why it survived. Two rules worth generalising: (1) if a value drives BOTH an outline and a clip, compute it in one exported helper and have both call it, because a duplicated formula that only shows up under a non-default fill style has no fast feedback loop; (2) a `points` geometry silently can't represent a curve — when a shape gains rounding, its clip geometry usually has to change *type* (to `path`), not just gain a parameter, so grep for consumers that assume the old type. Third trap specific to accelerated paths: the WASM shape bridge dispatches on element `type` alone, so it can never express a new per-element parameter — a shape that gains one needs an explicit bail-out to the JS branch, or the fast path silently reverts the fix whenever the flag is on.

- **A thumbnail that fakes its content will be faked three different ways within one dialog — the tell is that nobody could point at the function that draws it.** The template browser had a placeholder icon for diagrams, a flat colour swatch for designs, and a strip of grey pretend-text-lines for presentations, while a real (if simplified) preview renderer already existed one directory away, private to the Elements panel. Each fake was individually defensible at the time and collectively meant the browser never showed what any template contained. Two things made the fix cheap once the duplication was seen: the existing renderer was already PURE (template JSON in, SVG string out — no canvas, no store, no async), so it could be called straight from a Solid render path; and extending it to a third data shape (diagrams have `data.elements` and no page, so they need bbox framing rather than a fixed `pageSize`) was a dozen lines. Worth stating the constraint that forces this design: the real render pipeline reads `store.elements` for a live page index, so it structurally CANNOT draw arbitrary template JSON without loading it first — which is why "just render it properly" isn't available and simplified marks are the right answer, not a shortcut. One trap when inlining generated SVG into a list: gradient `id`s resolve per-DOCUMENT, not per-`<svg>`, so a shared id paints every card with the first card's gradient — a module-level counter is enough.

- **`overflow: hidden` on a grid item silently zeroes its minimum size, so a definite-height grid will shrink rows instead of scrolling.** The Designs tab rendered every card as an ~11px sliver with its name and description clipped. The chain: `.template-grid` is `flex: 1` (definite height) with `overflow-y: auto`, and `.template-card` sets `overflow: hidden`, which changes the item's automatic minimum size from min-content to 0 — so once a category had more rows than fit, the auto rows compressed to fill the box rather than overflowing into the scroll area. Categories with few rows looked fine, which is why it shipped. The diagnostic worth reusing: rather than reasoning about track sizing, inject a `<style>` at runtime and re-measure the element under a handful of candidate overrides (`grid-auto-rows: min-content`, `align-items: start`, `overflow-y: visible`, `flex: none`) — the ones that fix it identify the mechanism in one pass. Also a smell worth heeding: two of the four card variants had *independently* added `height: auto; overflow: visible` to escape this, which is the shape of a bug being worked around one caller at a time instead of fixed at the container.

- **A capability gated on a document shape needs an `else`, or the majority case silently gets nothing.** User-template thumbnails were captured with `exportPageToPng`, which needs a page, so the call sat behind `if (isPagedDocType(...))` — correct as far as it went, but the DEFAULT doc type isn't paged, so the single most common way to save a template stored no thumbnail at all and the card showed a placeholder forever. Nothing errored; the feature just quietly didn't apply to most of its users. The general rule: when a feature is fenced by a precondition, check what fraction of real usage falls OUTSIDE the fence before accepting "optional" as the fallback — and if the answer is "most of it", the fence needs a second-best path rather than a skip. Related gotcha when the fallback is an SVG: a `<svg width="100%" height="100%">` has no intrinsic size, so it renders as nothing inside an `<img src>` even though it's perfect when inlined in the DOM — a standalone SVG thumbnail needs real pixel dimensions on the root element. And prefer a display-time fallback over a save-time one when data already exists in the wild, since only the former repairs records that were written before the fix.

- **A badge that must stay legible on a gradient is the case where theme tokens are the wrong tool.** Almost every colour in this app routes through a per-theme CSS variable, so the reflex for the Beta pill was `--beta-bg` / `--beta-fg` defined three times in `index.css`. But the pill's background is a gradient the badge owns, not the surrounding panel — its contrast is a property of the badge alone and is identical in light, dark and focus mode. Tokenising it would have created three definitions that must be kept in sync to stay the same, which is the inverse of what tokens are for. The rule worth carrying: theme a colour when it must RESPOND to the surface behind it; hardcode it when the element supplies its own surface. Second detail, easy to get backwards — a decorative sheen under `prefers-reduced-motion` should be `display: none`, not `animation: none`: leaving the pseudo-element in place with the animation cancelled parks a bright translucent band permanently over one edge of the pill.

- **A panel that predates the panel system will be carrying a private copy of everything that system now does — and the copy is where the bugs live.** Properties was the last panel not registered with the dock: it brought its own 280px container, its own title bar and close button, its own "minimized to a 48px square" state, its own mobile bottom-sheet, and its own hard-coded 280px entry in `dockInsets()`. Every one of those had an equivalent in `components/dock/`, so the migration was mostly deletion — but the interesting part is what the duplication had cost. `showPropertyPanel` + `isPropertyPanelMinimized` were being written *in pairs* by eighteen tool-group components (`setStore("showPropertyPanel", true); setStore("isPropertyPanelMinimized", false);`), which is the shape of a missing verb: they all wanted `showPropertiesPanel()`. And because the 280px inset was a constant rather than a measurement, the quick-toolbar's collision avoidance and the menu's top-right offset each hardcoded their own 280/290 — all three silently wrong the moment a user resized the zone, docked the panel left, or floated it. Reading the live `--dock-right` fixes all of them at once. The migration rule that made this safe: DELETE the duplicated state fields rather than leaving them as dead flags (there was precedent for dead flags in the same file), because the compiler then walks you to all eighteen writers instead of letting them keep poking a value nothing reads. One reactivity trap on the way out: `dockLayout.panels` is a Solid store, and nested writes (`panels[id].mode`) never touch the `panels` key itself — an effect that "tracks" it by naming the property never re-runs. Track it by CALLING the function that walks the panels (`dockInsets()`), which subscribes to exactly the fields that matter.

- **An opaque bar and its own contents are one z-index decision, and it is not obvious which way it goes.** Making the header a real docked region gave `.shell-topbar` a background and `z-index: 10050` — at which point the palette picker and theme toggle vanished, because they were `position: fixed` overlays at 10000 and the bar now painted over them. The logo pill survived only by accident: `.menu-container` happens to be 10060. The reflex fix (raise the strays) is right for five minutes; the real fix is that a bar with a background shouldn't have "contents" that aren't its children. Once the three clusters became real flex slots inside the bar, four separate hand-tuned offsets went away with them — `top: 5px/12px`, `right: 108px/60px/12px`, the `calc(… + var(--dock-right))` arithmetic each needed to dodge the Properties panel, the drag rig that let the user push them somewhere else, and `.tool-options-bar`'s `left: 296px; right: 130px` gutters, which were a manual re-creation of the layout flexbox does for free. The one cluster that legitimately stayed a fixed overlay is the mobile undo/redo, because it is anchored to the *bottom* of the screen and was never part of the header. Two things worth stating for the next region that becomes real: nesting the whole component inside the bar is a trap — the dialogs it also renders would be trapped in the bar's stacking context, so the bar must wrap only the header markup and leave its siblings outside; and once a header lays out its own contents it should stop being `pointer-events: none`, since a real header swallows its clicks rather than passing them to the canvas underneath.

- **When a dialog's contents are markup, search it by walking the rendered rows — the alternative is a second copy of every label.** Settings had seven sections in one scroll and ~35 controls whose names exist only as `<label>` text. Adding search the "clean" way means a searchable table of `{id, label, keywords, category}` alongside the JSX — a duplicate of every string in the dialog, and the copy is what goes stale the first time someone renames a toggle. Filtering the DOM instead (walk `.settings-row`, match `textContent`, set `display`) means a control is findable by the exact words the user is reading, and renaming a label updates the search for free. Two things make it safe rather than hacky: give each section a `data-cat` attribute so the same pass handles category switching and search with one rule, and remember the effect must track the dialog's OPEN signal — the body only exists while mounted, so an effect that bails on `!bodyRef` settles on the closed state and never runs again, silently showing every section at once (which is the scroll you were replacing). Where the data already exists as data — the Help dialog's `SHORTCUT_DATA` — do the opposite and filter with a plain `createMemo`; matching on both label and keys makes it bidirectional, so "duplicate" and "ctrl+d" find the same row. And hide the category rail while a search is active: search spans every category, so highlighting one of them is a lie about what's on screen.

- **A tour that spotlights by CSS selector is a set of untyped references into the DOM, and it fails SILENTLY.** `onboarding-tour.tsx` resolves each step with `document.querySelector(step.target)` and, when that misses, quietly degrades to a centred card with no highlight — so a renamed or deleted element doesn't throw, doesn't warn, and doesn't show up in a build or a typecheck. Three of six steps were dangling by the time the shell work settled: `.property-panel-container` died when Properties moved onto the dock, and `.floating-tools-cluster` / `.help-btn` died when the corner buttons moved into the top bar. Two habits worth keeping: when a step points at a PANEL, point it at the control that opens the panel instead — a dock panel's element only exists while it happens to be open, so the spotlight silently no-ops depending on what the user did five steps earlier; and treat the classes a tour targets as load-bearing API, commented as such at the definition site, because they look like ordinary styling hooks and nothing else in the codebase references them. Cheapest possible regression test, worth running after any chrome move: `steps.map(s => !!document.querySelector(s.target))` in the live page and assert none are false.

- **A test that hardcodes its target URL isn't testing your build — and it fails in ways that look like product bugs.** Twenty specs called `page.goto('http://localhost:5173')` literally instead of `page.goto(URL)`, so whatever happened to be listening on 5173 is what they exercised. The failure signature was thoroughly misleading: a right-click that *resolved its target* and then timed out, which reads as pointer interception in the app. It was — just in a different app. The second-order effect is nastier: `playwright.config.ts` pre-seeds the onboarding-tour "seen" flag through `storageState`, and `storageState` is scoped to an **origin**, so navigating to a different origin silently skipped the seeding and let the tour's modal overlay eat every click. One hardcoded string produced two unrelated-looking failures. Two lessons. First, the A/B-against-an-older-commit technique that normally clears "is this mine?" *confirms the wrong conclusion* here — the tests failed identically at the old commit because both runs pointed at the same third server, not because the code was equally broken. Add "are we even testing the right build?" to the checklist before concluding "pre-existing". Second, and the real payoff: pointing them at the correct server turned six green tests red. They had been passing against a stale app for long enough that one was asserting on an API name that no longer exists (`alignSelectedElements('centerHorizontal')` — `AlignmentType` has only `left|center|right|top|middle|bottom`, so the call was a no-op and the test compared two unchanged coordinates to each other). A test that cannot fail is worse than no test; grep for hardcoded ports and origins in a suite the way you'd grep for secrets.

- **When a UI control changes kind, every selector that named its old element becomes unmatchable — and the test that "waits" for it looks like a hang, not a rename.** The Font control moved from a `<select>` to a searchable picker, so `.control-row:has-text("Font") select` could never match again; the spec sat there until the 30s timeout. Same class of silent coupling as CSS-selector spotlights in the onboarding tour, and it wants the same discipline: when you replace a control's implementation, grep the suite for its old tag/class before you delete it. Two traps when driving the replacement: the panel it lives in has to be *open* (selecting an element does not open the Properties panel here, by design), and picking a list item by position after typing a filter is a coin flip — "mono" matches JetBrains Mono (value `code`) ahead of Source Code Pro (value `monospace`), so the fix went green on the wrong font before it went green on the right one. Filter by label, assert the value.

- **A recursion budget keyed to the wrong identity is not a budget.** Recursive symbols (a `SymbolDef` containing an instance of itself) need bounding, and the three limits chosen each cover a case the others miss: a sub-pixel cutoff is the honest terminator for a *contracting* transform — it stops exactly when the result stops being visible, with nothing to tune; a depth cap covers the non-contracting case (`scale >= 1`), which never reaches sub-pixel; and a total-draws budget covers *branching*, because a definition holding TWO copies of itself costs O(2^depth) and a depth cap is therefore not a bound on work at all. The bug was in the fourth thing — when to reset the counter. Resetting it when *this symbol's* depth hits 0 looks equivalent to "we're at the top of the tree", and is not: a second recursive symbol reached mid-descent (A contains B contains A) has depth 0 for **B**, so it zeroes A's counter on every single level, the budget never binds, and the only surviving limit is the depth cap — precisely the limit that doesn't bound branching. The reset has to key on the render *stack* being empty (`symbolDepth.size === 0`), not on any one symbol's depth. Generalisable: whenever a resource limit is reset by a "we must be at the root" test, write that test against the shared stack, not against the current item's own counter — the two agree for a single recursive type and diverge silently the moment two of them interleave. Second, smaller lesson from the same change: the accumulated scale needed no bookkeeping at all, because children are drawn into `inst.width/height`, so a nested instance's box already *is* the accumulated size in world units. Worth checking for before threading a transform stack through a renderer.

- **A guard that made the old behaviour safe will make the new feature unreachable, and the UI won't tell you — the API still works.** `placeInstance` refused to place a symbol inside its own edit-in-place session ("A symbol cannot be placed inside itself"), which was exactly right while the renderer had no bound. With recursion supported, that guard left the feature reachable only through a workaround (place an instance on canvas, then `redefineSymbol` the symbol *from* that instance) — which the scripting API can do, so every API-level test passed while the only authoring route a user would actually try was still blocked. When you make a formerly-impossible thing possible, grep for the guards that enforced the impossibility *and* ask which of them sits on the human path. Relaxing it exposed a second trap worth stating on its own: `exitSymbolEdit` collects the session by `groupIds.includes(session.groupId)`, so an element created during a session that doesn't join that group is silently dropped on Done — the nested instance has to be tagged with the session's group id at creation (`anim-ops` already does this for clip-session elements). Failure mode is the worst kind: the artwork looks right until you press the button that saves it. Finally, on defaults: the flag is opt-in (`recursive?: boolean`, absent = old placeholder) so no existing document changes how it draws, but a *deliberate* self-nest during an edit session turns it on automatically — refusing to infer intent from an unambiguous action just ships a grey box that reads as broken.

- **Three tests that assert "it didn't hang" will all pass if the feature does nothing.** The termination tests for recursive symbols (shrinking chain, non-shrinking chain, branching fractal) are the ones that matter, and every one of them is green when the recursive flag is ignored entirely — nothing recursed, so nothing hung. They need a companion that pins down that the flag *changes the picture*: screenshot the canvas with recursion off (grey cyclic placeholder), turn it on, and compare buffers; then set Depth to 1 and compare again, which also proves the depth cap is wired to the renderer rather than merely stored. General rule for any safety-limit feature: a test that the limit holds is only half of it, because the trivially-broken implementation satisfies it — pair every "it terminates" with an "it did something".

- **A test whose setup says "and this mounts the component" is a dependency on UI structure, and moving a panel breaks it silently.** The boot-resilience spec for discarding a corrupt `localStorage` preference created a rectangle, selected it, and waited 800ms — because selecting used to open the Properties panel, and the panel's body is where the guarded read happens. After Properties became a dock panel (0.8.162), selection no longer opens it, so the code under test never ran; the assertion failed and pointed at `safe-storage`, which was working perfectly. Two habits: assert the *precondition* the test actually depends on (`waitForSelector('.property-panel')`, not a timeout — "mounted" is the real condition, and a fixed delay both flakes and hides the diagnosis), and when a test fails on a branch that couldn't have caused it, A/B with the suspect change stashed before spending any time on it. Also worth knowing for this repo: the first page load after editing `frontend/index.html` makes vite re-optimize deps, which can blow a 30s `waitForFunction` on `window.Yappy` — two unrelated specs in the same file go red on a cold server and green on a warm one, which reads exactly like a boot regression.

- **A control whose effect is gated on a mode nothing can select is dead UI, and it looks alive.** The toolbar's circular-arrow button flipped `toolbarVertical`, which is only read while the bar FLOATS — and once docking landed, `toolbarDock` defaulted to `'left'` with no Settings entry, no command and no API method able to change it. So the button wrote a localStorage key and produced no pixel change, while still rendering as a normal enabled button with a (wrong) tooltip. Nothing errored, no test failed, and reading the click handler alone tells you nothing: the handler is correct, it is the *consumer* three hundred lines away that is gated. The diagnostic that settles it in one pass is to snapshot `className` + `getBoundingClientRect()` before and after a real click — identical output is proof of a no-op, and it costs less than arguing from the code. Generalisable rule for feature-flag-shaped settings: grep for every *reader* of the flag and check the conditions guarding them, not just that something writes it. Second lesson from the same fix: making a previously-unreachable mode reachable is a bug-finding operation. `float` had been unreachable for so long that its `top: 12px` anchor still predated the shell header — 52px tall at a higher z-index — so the newly-reachable floating bar was painted over and had its clicks eaten. Code that nothing can reach stops being maintained, so expect the first thing you find there to be broken.

- **Two CSS rules for the same element in different states will fight on specificity, and the loser keeps half its properties.** `.tool-options-bar button:hover:not(:disabled)` is (0,3,1) and outranks `.tool-options-bar button.is-on` at (0,2,1). The hover rule set only `background`, so hovering an active button took the hover tint AND kept `.is-on`'s `color: #fff` — white on near-white, 1.13:1, the glyph vanishing exactly when you point at it. This is worse than a plain override because neither rule is wrong in isolation and the broken state is a *combination* that no single declaration describes. Three habits: when a component has an on/off state, write the `state:hover` rule explicitly rather than trusting cascade order; set colour and background together in every state rule, since a partial override inherits the other half from a rule written for a different background; and remember `:not()` contributes its argument's specificity, which is how a `:hover:not(:disabled)` selector quietly outranks a state class. The trap is symmetric — the dark-theme rule I added to fix it ties `.is-on` and wins on source order, reintroducing the same bug from the other side until it got `:not(.is-on)`. Measure, don't eyeball: compute contrast from `getComputedStyle` while compositing translucent ancestors down the chain, because reading `backgroundColor` on a tinted element returns `rgba(...)` over nothing and proves precisely nothing.

- **"Applied on commit" and "shown live" are different features, and the comment promising the second can sit above code doing the first.** Fill mode set `fillSilhouette` in `endDrawing`, so a freehand stroke drew as a line for the whole gesture and became a filled silhouette on release. With symmetry on, every mirrored copy snapped at that same instant — and `syncLiveSymmetry`'s own doc comment claims "what you see mid-stroke is exactly what you get on release", which had been false for fill mode the entire time. Moving the attribute to element *creation* fixed both at once, and the live copies needed no work at all because `symmetryInstance` spreads the source element on every sync: derived state inherits new source attributes for free, which is a good reason to prefer deriving copies over building them field by field. The testing lesson is the sharper one — the existing spec asserted the fill *after* `mouse.up()`, so it passed identically before and after. An interactive behaviour needs an assertion taken while the interaction is still open: move, press, move, then read the store and sample the canvas WITHOUT releasing. Sampling the loop's interior alpha mid-stroke is what distinguishes "the flag is set" from "the fill is actually painted".

- **A helper that returns coordinates in one frame will eventually be painted into another, and the only clue is a comment.** `utils/viewport-transforms` documents that it returns CANVAS-LOCAL px (`clientX` minus the canvas rect), and `symmetry-overlay.tsx` painted its results onto a `position: fixed; inset: 0` window layer via its own inlined copy of `world * scale + pan`. Both were right when the canvas filled the window; the shell's docked toolbar and top bar moved the canvas origin to (46, 52) and the guide silently drifted off the axis it was advertising. Nothing about the overlay changed, so nothing pointed at it. Two durable lessons. First, a coordinate frame is part of a function's type and cannot be enforced by TypeScript — `number` says nothing about the origin — so the *only* protection is that every consumer uses the shared helper AND positions its container in the frame that helper speaks. An inlined copy of the transform is not just duplication, it is a second frame with no name. Second, the shape of the error tells you which kind of bug it is before you read any code: a CONSTANT screen offset at every zoom and pan is a frame/origin mismatch, while an error proportional to distance from a reference point is a scale or pivot mistake. Measuring at two zoom levels distinguishes them in about a minute and stops you from hunting the reflection maths, which in this case was correct the whole time. Corollary worth stating: "sometimes" in a bug report often means "constant in a way that looks variable" — a fixed offset compared across marks at different distances from the axis reads as inconsistent to the eye.

- **When the error after your fix is EXACTLY the error before it, the fix isn't running.** I moved the symmetry overlay onto the canvas rect and re-measured: still `-46/-52`, byte-identical. The tempting reading is that the diagnosis was wrong; the real cause was that I had wrapped the rect lookup in `createMemo`. The overlay mounts before the canvas is laid out, so the memo computed its `{0,0}` fallback once and never recomputed, because its dependencies (a resize tick and `dockInsets()`) are not what changes when you move the axis — so the fixed code reproduced the original bug perfectly. Generalisable: `createMemo` over a DOM measurement is a trap whenever the measured node may not exist at first read, since the cached miss is indistinguishable from the pre-fix behaviour. Prefer a plain function that reads the live rect and calls the reactive sources purely for subscription; two `getBoundingClientRect` calls per render of a handful of SVG lines cost nothing next to a silently wrong overlay. And treat "identical numbers before and after" as its own diagnostic signal — check that the new code path executes before you re-open the investigation.

- **The same inlined formula in three files is one bug with three addresses.** World→screen for fixed-position overlays had been hand-written separately in the symmetry, artboard and ruler overlays. Each copy was correct when written, and one shell change — docking the toolbar and top bar, which moved the canvas origin off (0,0) — broke all three simultaneously, in a way that looked like three unrelated cosmetic complaints. The tell was in the comments: artboard-overlay said "uses the simple pan/scale transform (matching SymmetryOverlay)", and ruler-overlay had written down the very assumption that had expired ("the drawing canvas fills the viewport (origin 0,0), so screen px ≈ clientX/Y"). A comment that states an environmental assumption is a tripwire with no test behind it — worth grepping for when the environment changes, because the code around it will not fail loudly. Fixing it as a shared `utils/overlay-transform` (canvasOrigin/canvasSize/worldToWindow + axis-aligned variants) means the fourth overlay inherits the fix instead of repeating the bug. Verify such a fix in TWO layouts whose offsets differ — left-docked (46,52) and right-docked (0,52) — because a single-layout test passes just as happily against a hardcoded 46/52.

- **A DOM measurement in a reactive read has two failure modes, and fixing the first exposes the second.** First: caching it in `createMemo` freezes the pre-layout {0,0} fallback forever. Fixing that (read the rect live, call the reactive sources only to subscribe) still left the ruler strips pinned to the window origin, because overlays mount BEFORE the canvas exists and nothing in the subscription set changes when the canvas merely *appears* — a resize tick and `dockInsets()` both stay put. The symmetry axis masked this by luck: its accessors re-run whenever symmetry state changes, so by the time anyone looked at it the canvas was there. So the rule is not "don't memoize" but "subscribe to the thing you are actually waiting for": attach a `ResizeObserver` to the element as soon as one can be found, and bump the tick on the NEXT frame rather than synchronously, since these readers run during render and touching a signal they depend on mid-render is a loop. Then prove the absence of that loop rather than assuming it — count rAF ticks per second (61 = healthy, a stalled main thread shows up immediately) and attribute-mutation counts on the affected nodes (0/s = no churn). Measuring rAF right after boot gave 25/s and briefly looked like a loop; the number only means something after the app has settled.

- **A parser that builds an explicit object silently discards every field you add to the type later.** `parseJsonDSL` constructs `{ version, meta, layout, nodes, edges, groups, pools, defaults }` by hand, so adding `palette` to `DSLDiagram` and threading it through the engine changed nothing at all: the field was dropped between `JSON.parse` and the IR, and TypeScript was perfectly happy because the constructed object still satisfied the interface (every new field was optional). The symptom pointed somewhere else entirely — swatches never appeared, so the obvious suspects were `ensureSwatch` and the store, not a parser two layers upstream that had *already succeeded*. Two generalisations. First, an allowlist parser needs its own test the moment the type grows, because the type system cannot tell "absent because the user omitted it" from "absent because I never copied it"; optional fields make the two indistinguishable. Second, when a feature produces *nothing* rather than something wrong, suspect plumbing before logic — a wrong colour is a bug in the resolver, no colour at all is a value that never arrived. Worth grepping for the sibling case: `sequence` is dropped the same way, which is invisible only because sequence timelines currently reach the IR through adapters rather than raw JSON.

- **Adding a parameter to a function is half the change; the public wrapper is the other half, and it fails silently.** `exportToSvg` grew a `themeOpts` argument and typechecked clean, but `Yappy.exportSVG(false, { theme: 'variables' })` ignored it, because the API wrapper still read `exportSVG(onlySelected = false)` and forwarded one argument. JavaScript discards extra arguments without complaint, and TypeScript never saw the call because it happens inside `page.evaluate` as untyped browser code. The diagnostic that saved time was the *shape* of the failure: the exported SVG still had `style="background-color: rgb(255,255,255)"`, which is set only on the non-themed path, so the feature was entirely off rather than half-applied. "Entirely absent" is a plumbing signature; "present but wrong" is a logic signature, and knowing which one you are looking at picks the file to open. Anything reached from `window.Yappy` has two signatures to keep in step, and only the inner one is typechecked.

- **Check the baseline before you debug a regression you did not cause.** A swatch spec failed after this branch's changes, on a `waitForSelector('.swatches-panel .sw-card')` timeout, right after work that touched the `Swatch` type and the store's swatch actions — about as incriminating as circumstantial evidence gets. It fails identically on clean `origin/dev`. The cheap way to establish that is `git worktree add /tmp/base origin/dev` with `node_modules` symlinked in, which costs about a minute and needs no stashing, so the in-progress tree is never at risk. The trap worth naming: `playwright.config.ts` hardcodes its `webServer` on port 5173 with `reuseExistingServer: true`, so overriding `YAPPY_URL` to a different port points the baseline run at a URL nothing is serving, while leaving it at the default risks measuring the *feature branch's* dev server if one is already up. Kill the port first, then run the baseline with the default config, or the experiment quietly tests the wrong code.

- **"The element exists" and "you can see it" are different assertions, and only one of them was in the test.** The byte-grid specs passed while the span labels were invisible on the page: I built them as borderless boxes with `backgroundColor: 'transparent'` AND `strokeColor: 'transparent'`, not knowing that container text is painted in the element's *stroke* colour, so hiding the border hid the words. Every structural assertion — element count, tag, position, cell values — was green, because all of those are true of an invisible element. The same blind spot then hid a second bug: the whole grid was unreadable on a dark background, since the coloured cells themed correctly (they are swatch-linked) while every border, label and offset stayed near-black literals. Two rules fall out. A spec for anything visual must assert a colour, not just existence, and ideally assert the *relationship* (linked to a swatch) rather than a hex, so it survives a palette change. And screenshot it: three separate layout defects — labels overlapping each other, the gutter running into the first cell, and row two landing on row one's label band — were all invisible in the assertions and obvious in one PNG. Rendering to an image and looking at it took about a minute and found more than the test suite did.

- **A `prefers-color-scheme` override cannot be verified by putting the SVG on a dark background.** The dark screenshot looked broken after the fix, which nearly sent me back to change code that was already correct: Playwright's default `colorScheme` is light, so `@media (prefers-color-scheme: dark)` never matched and the variables stayed at their light values. Setting a dark `background` on the body proves nothing about a media query — the two are unrelated. `newPage({ colorScheme: 'dark' })` is the switch, and the same file then rendered correctly on both. Generalisable: when testing a media-query-driven feature, emulate the *condition*, not something that merely looks like it, or a passing implementation reads as a failure and you "fix" working code.

- **Adding a field to a type does not add it to the API that returns that type.** `Swatch` gained `darkColor`, the store persisted it, the SVG export read it — and `Yappy.listSwatches()` still returned `{ id, name, color, group }`, so every consumer outside the module saw `undefined`. The mapping function is a second allowlist, the same shape of bug as the JSON parser dropping unknown fields, and it surfaced only because a spec asserted on the value rather than on the field's presence. Worth a habit: after adding a field, grep for hand-written projections of that type (`.map(s => ({`) before assuming it flows.

- **A width budget that takes the largest column count that fits will destroy the alignment the diagram existed to show.** Reflowing a 32-bit grid into 375px leaves room for 10 cells, and 10 is the wrong answer: a 32-bit word wrapped at 10 columns splits mid-byte, and the same field lands in a different column on every row, so the reader loses the vertical alignment that is the entire reason to draw a byte grid instead of a sentence. Halving the authored count (32 → 16 → 8) fits worse in pixels and better in meaning. The generalisation is that "how many fit" is a rendering question and "which counts are legitimate" is a domain question, and a layout that only answers the first produces geometry nobody can read — so a reflow needs a snap rule supplied by whoever knows what the columns mean (`halve` for byte grids, `free` for a catalogue of unrelated boxes). Related: never solve a width budget by scaling. A 32-column grid scaled into 375px puts each cell at 9px with 4px text, which fits perfectly and communicates nothing; leaving it wide and letting the page scroll it is the honest failure, and it is why `fitColumns` returns 1 rather than shrinking when even one item is too wide.

- **This codebase has at least three independent allowlists between a config field and the thing that uses it, and each drops the field in silence.** `layout.targetWidth` had to be added to the type, and the type is the only one of the four that TypeScript checks: `parseJsonDSL` copies `layout` wholesale so JSON worked immediately, while the text parser's frontmatter `switch` warns "Unknown frontmatter key" and moves on, and `splitInlineProps` routes any inline key it does not recognise into `style` — where `bits: 8` becomes a style property and a byte-grid span quietly stops being a span. Two of those are why byte-grid is JSON-only, which is now written down rather than discovered again. The habit: when adding a config field, grep for every parser and projection that *enumerates* fields (`case '`, `.map(x => ({`, hand-built object literals) instead of testing one entry point and assuming the rest.

- **A "wide" target width is not a viewport width, and the first render at 900px looked like a bug.** A 32-column grid of 28px cells with an 88px gutter needs 984px, so a 900px target correctly reflowed to 16 columns and two rows — which read as a broken wide breakpoint until the arithmetic was done. Worth saying out loud in any width-aware layout: the budget is the space the *diagram* gets, not the space the page has, and a diagram that has never fit its declared column count at the widths anyone actually uses is a signal to shrink the authored `cellSize`, not to widen the target. Screenshotting both breakpoints answered this in a minute; the assertions could not, because they only knew what the layout did, not whether the number was the one the author wanted.

- **A layout that generates its own elements has to give the author a name for them, or half the diagrams it can draw are useless.** `byte-grid` expands one node per span into one element per cell, and the cell ids (`exp__cell3`) do not exist when the author writes the file. Every figure came out as a correct grid with nothing pointing at anything, because the one thing a byte diagram is usually *for* — an arrow reading "this is the bit that matters" — had nothing to attach to, and `schema-validator` rejected the edge before expansion could have helped. `span#n` costs a regex, a rewrite after expansion, and a validation rule, and it is the difference between a layout strategy and a usable one. The general lesson for generated geometry: ship the addressing scheme in the same change as the generator, and validate references where the source-level sizes are still visible, so `f#9` on an 8-bit span is an error rather than an arrow that silently goes nowhere.

- **Width-aware layout only moves what the layout places.** A callout is a passthrough node with explicit coordinates, so `targetWidth` reflowed the 8 cells neatly and left the note box sitting at x=530, which pushed the exported bounding box to 680px wide inside a 375px budget. The budget was honoured for everything the strategy owned and quietly broken by the one element it did not, and no assertion could see it because the grid itself was correct. Two takeaways: a width budget on a layout with a manual-placement escape hatch is a partial guarantee and should be documented as one; and the failure is invisible except in a picture, which is the third time on this branch that rendering to a PNG and looking at it found something a passing spec did not.

- **A themed SVG declares its variables on `:root`, and inlining it makes that the page's `:root`.** Two consequences arrive together, and both look like someone else's bug. The export's own `@media (prefers-color-scheme: dark)` block cannot see a manual theme toggle, so a reader forcing dark on a light OS gets a light diagram on a dark page; and every diagram on a page declares its palette on the same `:root`, so the last one wins and recolours the others. The consuming side fixed it by rewriting the selector at build time to a per-diagram class plus the three-way pattern (`:root` default, `@media` with `:not([data-theme="light"])`, `:root[data-theme="dark"]`), which is worth knowing on this side too: a themed export that scoped its variables to the `svg` element instead of `:root` would need none of that. Consider it when the export format next changes.

- **A bezier control offset scaled by the chord's dominant axis balloons whenever the two axes disagree.** `defaultControlPoints` took half the dominant axis as its magnitude and applied it along the anchor edge's normal, which are different axes whenever a connector runs mostly sideways but attaches to a horizontal edge. A callout 200px to the side of a cell 40px below it got a 100px vertical bulge to cross a 40px gap: the curve ballooned, and on a short hop it looped back *through* the shape it was pointing at, so the arrowhead arrived from inside the target. The fix is one line and reads as obvious in hindsight: measure the magnitude along the axis the control point actually moves in, floor it so a touching pair still curves, and cap it at the old value so nothing can get larger than before. The general lesson is that a magnitude and a direction computed from different sources will agree in the common case and diverge exactly where the layout is unusual, which is where anyone is already looking hardest.

- **An arrowhead clipped to a shape's border reads as pointing at whatever is on the other side of that border.** In a byte grid the cells touch, so an arrow approaching a cell from the side lands on the boundary it shares with its neighbour, and every reader sees it pointing at the neighbour. No amount of curve tuning fixes that: the tip is geometrically correct and visually wrong. The authoring rule that follows is to place a callout on the axis it points along, directly above or below a target in a horizontal run, so the arrowhead meets an edge the target does not share. Three separate diagrams in the consuming project had this and all three read correctly after the callout moved rather than after any renderer change.

- **"X and Y are swapped" was true of the icons and false of the code, and only one of those is worth debugging.** A user reported that horizontal alignment aligned vertically. `calculateAlignment` was correct, and so was the dock Align panel; the Properties panel had picked its icons by name rather than by picture. Lucide names an align icon after the axis of its *guide line*, so `align-start-vertical` (a vertical rule at the left, boxes to its right) means **align left**, and `align-center-horizontal` means **align middle** — exactly the opposite of the reading that makes "vertical = the top/middle/bottom row" feel obvious. Reading the icon's path data out of `node_modules` (`M2 2v20` vs `M2 12h20`) settled it in a minute, where staring at the alignment math would have found nothing. Generalisable: when a report says a control does the *other* thing, check whether the control is mislabelled before you check whether the operation is wrong — a mislabelled button and an inverted operation produce the same sentence from a user, and the same file has both a correct implementation and a wrong picture of it. Also worth noting that the same app had two align UIs, one right and one wrong; a shared icon map would have made the divergence impossible.

- **A contenteditable's `<ul>` is not the tree you'd write by hand, and a parser that assumes it is loses data silently.** Chrome's `execCommand('indent')` emits a nested list as a **sibling** of the `<li>` it belongs to (`<ul><li>A</li><ul><li>Sub</li></ul></ul>`), not inside it; paste produces the inside form; both are legal. Our walker collected only `li` children, so half the DOM shapes lost every nested item — the editor showed four bullets and the canvas three, with no error anywhere. The reproduction technique is the reusable part: bundle the two pure functions with esbuild, load them into a real Chromium page next to a real contenteditable, and drive it with actual keystrokes and `execCommand`. That takes about two minutes and answers "what does the browser really produce" definitively, which no amount of reading the parser can. Do it before hypothesising, and keep the harness — it also caught the round-trip drift below.

- **Round-tripping through HTML has to be a fixed point, or the document grows every time it is opened.** Rich text goes spans → HTML → editor → spans on every edit, so any asymmetry compounds: a trailing `\n` span next to a `</ul>` re-emitted as `<br>` added one blank line per edit cycle, invisible in a single before/after comparison. The assertion that catches this class of bug is not "the output looks right" but `f(f(x)) === f(x)` — parse, serialise, parse again, compare. Block boundaries are exactly where it goes wrong, because a `</ul>` already breaks the line and a `<br>` next to it breaks it a second time.

- **A per-line flag is not a per-item flag, and word wrap is where they diverge.** Both canvas renderers drew a list marker for "the first list segment on this line", which is right until an item wraps — then the continuation line, whose first segment is still a list span, gets its own bullet. The layout engine is the only place that knows where an item *starts* (it is the code that broke the line), so it now tags that segment and the renderers just obey. Rule of thumb: when two renderers each re-derive a fact the layout already computed, they will each re-derive it slightly wrong; compute it once, upstream, and pass it down.

- **Three renderers consume the same layout, and the third one is where the feature is missing.** `layoutRichText` computes `listMarker` once; `text-renderer.ts` and `render-pipeline.ts` both honoured it, and `export.ts` — which calls the same layout function, walks the same segments, and emits a `<tspan>` for each — never looked at it. So bullets were correct in every place anyone had recently *tested* and absent in SVG export. Two things make this hard to notice. The exporter's segment loop is a near-verbatim copy of the canvas loop minus one branch, so a diff of the two files reads as "same thing, different output API" rather than "one is missing a feature". And the failure was not blank: the export kept the 20px gutter the layout reserves for the marker, so a bulletless list looked *misindented*, which points at layout code rather than at a missing emit. The habit worth keeping: when a layout function returns a flag, grep for the flag rather than the function — `layoutRichText` had three call sites and `seg.listMarker` had two, and that one-line difference is the whole bug.

- **Re-verify a "still broken" report against the shipped build before touching code.** A user re-reported both bugs fixed in the previous release. Driving the actual UI — clicking all six align buttons on three rects of different sizes and reading back the geometry — showed alignment was completely correct, which reframed the report from "my fix was wrong" to "they are running the old bundle" (they were; a reload fixed it). That took about five minutes and saved a speculative rewrite of correct code. It also left the second half of the report standing on its own, where the same hands-on pass through the real editor found the one genuine defect — in SVG export, which neither the user nor I had named at the start. Generalisable: a re-report is evidence about the *user's build*, not necessarily about the code, and the cheapest way to tell the two apart is to reproduce on a build you control. With a `prompt`-strategy service worker in front of the app, "did you reload?" is a legitimate first diagnostic question, not a brush-off.

- **The same gesture had three implementations, and each drew a slightly different curve.** Dragging a Bézier handle is reachable from the Pen mid-draw, from the Selection tool's direct-select handles, and from the Node tool overlay. All three "mirrored the opposite handle", and all three disagreed: the Node tool preserved the far handle's own length, the Selection tool forced both to equal length (`inX = -hx`), and the Pen had no way to break the pair at all. That last one is what a user reported — but the interesting part is that the reported gap and two silent behaviour bugs were the same missing abstraction. Collapsing them onto one pure `setAnchorHandle` made the divergence impossible and made the rule testable without a store, a canvas, or a pointer. Worth checking whenever a UI affordance exists in more than one tool: they are usually copies that have drifted, not a shared implementation.

- **Equal-length mirroring is right while drawing and wrong while editing, which is why "mirror the handle" is not one rule.** Pulling handles out of a brand-new anchor with the Pen is a single symmetric motion — both sides grow together, and freezing the far side at some earlier length looks broken. Adjusting one side of an anchor that already exists is the opposite case: the far handle belongs to the neighbouring segment you already shaped, and resizing it to match retensions that curve behind your back. The two callers want different answers from the same function, so `symmetric` is an explicit option rather than something each site re-derives. Generalisable: when two call sites of a "shared" helper want different behaviour, the difference is usually a real distinction in the domain worth naming, not a sign the helper should be split back apart.

- **A modifier that only holds for the duration of a drag isn't a mode change, and users read it as one.** The Node tool already honoured Alt to break a handle pair, but left the anchor `kind: 'smooth'` — so the very next drag without Alt re-mirrored and silently undid the cusp. The break existed and could not be kept, which is arguably worse than not having it. Demoting the anchor to `corner` on break is one line and is what makes the gesture mean what it looks like it means (it is also what Illustrator's Convert Anchor Point does). The tell for this class of bug: a modifier that changes *geometry* but not *state* will always be undone by the next unmodified interaction.

- **A guard that protects an object from interaction also protects it from the command that undoes the guard.** Locking sets `locked: true`, hit testing skips locked elements, so a locked element can never enter `store.selection` — and Lock/Unlock, like every other object command, reads the selection. The feature was a one-way door, and the only escape (Select All *does* include locked elements, then Ctrl+Shift+L) is not something anyone finds. The general shape: any state that removes an object from the mechanism used to *target* commands needs its own way in, addressed by something other than the selection. Right-click is the natural one because it works from a world point rather than from what's selected, so it can reach an object nothing can select. Worth auditing anywhere else a flag makes an object untargetable — visibility, layer lock, mode-scoped filtering.

- **Verifying against the real app needs the app's own coordinate mapping, not the one you assume.** Driving the right-click menu from Playwright, `clientX = canvasRect.left + worldX` looked obviously correct and was wrong: `getWorldCoordinates` runs the offset through `viewportTransform()`, which carries a ~60px y offset the canvas element's bounding rect knows nothing about. The failure was quiet and plausible — a large shape still hit, a small one didn't, which reads exactly like a bug in the hit-testing code being tested. What settled it in one shot was calibrating instead of reasoning: put a single small locked target at a known world position, scan a grid of screen offsets, and see where the hits actually cluster (dx≈0, dy≈−60). Cheaper than reading the transform chain, and it produces a number the test can then use.

- **"Snap to the nearest existing anchor" quietly caps a tool's resolution at however many anchors the artist happened to draw.** The Scissors found the closest *anchor* to the click, so a circle drawn as the usual four-anchor Bézier could only be cut in four places, and clicking the 45° point cut 76 units away at the nearest quadrant. The fix isn't more anchors — it's projecting the click onto the curve itself and subdividing there with de Casteljau, which is exact: the two halves reproduce the original curve, so the shape does not shift when it is cut. That exactness is the assertion worth writing (sample the curve before the split, re-derive the same points from the halves afterwards, compare to 8 decimal places); "the cut point is near the click" would pass for a merely-plausible implementation.

- **A coarse scan without a refinement step is a quantiser, and its error is invisible in the code.** Finding the closest point on a Bézier by sampling 24 t-values quantises the answer to 1/24th of a segment — on a 400-unit segment that is a 17-unit error, from code that reads as if it computes the nearest point. Adding a few golden-section iterations around the best sample costs microseconds and takes it to floating-point. The existing `findClosestPathSegment` (used for Alt-click anchor insertion) had exactly this, and nobody had noticed because inserting an anchor "somewhere near where I clicked" is forgiving in a way that cutting a shape in half is not.

- **`t` on a Bézier is not distance along it, and a degenerate cubic makes that obvious in the worst way.** A corner-to-corner segment is stored as a cubic whose control points sit on the endpoints, so x(t) = 100(3t² − 2t³) — the midpoint of the *edge* is at t ≈ 0.5 only by coincidence of symmetry, and t = 0.37 is at x ≈ 31, not 37. A test asserting `t ≈ 0.37` for a click at x = 37 failed while the implementation was correct. Anything that needs a position must go through the curve evaluator rather than treating t as a fraction of length.

- **Flattening a curve with a fixed sample count is a budget; flattening with a tolerance is a guarantee.** The Pathfinder/Knife flattener took 96 samples across a path's *total* arc length, so a detailed path got a handful of points per curve and came back visibly faceted, while a simple one wasted points on straight runs. Adaptive subdivision on a flatness test puts segments where the curvature is and bounds the error instead of the count — a circle costs ~40 points instead of 64 and is more accurate. The same reasoning applied to the ellipse case, where a flat 64-gon is 0.12 units off a 100-unit circle and 1.2 units off a 1000-unit one: deriving N from the tolerance (`r(1−cos(π/N)) ≤ tol`) makes big and small shapes equally round, which is what stops a cut piece from visibly failing to line up with the shape it came from.

- **`M` emits no command, so a flat command list has no record that a contour ended.** `parsePath` dropped move-tos entirely, and everything downstream treated the result as one continuous run — so a multi-contour path (a donut, an 'O', outlined text) was flattened into a single ring that jumped between contours. The failure is silent and total: knifing outlined text produced geometric nonsense, with nothing in the code reading as wrong. Stamping a `subpath` index onto each command is additive (existing consumers ignore it) and is the only place that information can live once `M` itself is discarded. Worth checking any parser that "doesn't need" a token: not needing it for one consumer is not the same as it carrying no information.

- **`rings.map(r => [r])` looks like a type adaptation and is actually a semantic decision.** `elementToMultiPolygon` turned every ring into its own solid polygon, which is exactly right for disjoint contours and exactly wrong for a hole — so any shape with a counter lost it the moment it went through a boolean, Knife, or Live Paint. Nesting by containment depth (odd = hole, even = solid, matching the even-odd rule the renderer already fills with) is about twenty lines. The tell is that the line converts between two representations where one carries structure the other doesn't; that is where the structure gets dropped.

- **"Max existing id + 1" generates duplicates whenever more than one element is minted before either is stored.** `generateId` scans the store, so two `mk()` calls in a row — pieces of a split, results of a boolean — both see the same maximum and both return `path-2`. The codebase already knew this (that is what the `batchIds` parameter is for) and the Scissors simply didn't pass one, so its two-piece split had been producing colliding ids all along. It surfaced only because the rewrite can now emit more than two pieces. Rule: any code path that builds N elements before a single `setStore` needs the batch set, and "it only ever makes two" is not an exemption.

- **A silent fallback in a conversion feature is worse than an error, because the output looks like a success.** `Create Outlines` resolved the font with `FONT_FILES[key] ?? FONT_FILES['sans-serif']`, so outlining a logo set in a custom or Google font produced the right letters in the wrong typeface — correct-looking vector paths that were simply not the design. Nothing failed, nothing logged, and the only way to notice is to already know what the font should look like. The `??` reads as defensive coding and is actually a decision to fabricate output. Rule of thumb: a fallback is appropriate where the substitute is *equivalent* (a cached value, a retry), and never where it silently changes what the user gets.

- **The proof that a font conversion used the right font is a metric, not a screenshot.** Outlining the same string through an uploaded copy of Poppins Bold and through the built-in Poppins Bold gave identical path widths (336.46) while the old sans-serif fallback gave 311.45. That one comparison distinguishes "it worked" from "it produced plausible letters", which eyeballing the canvas cannot — the wrong-font output is perfectly legible and looks fine on its own.

- **Knowing a font renders is not the same as having its bytes.** A Google font added by name is a `@font-face` stylesheet reference: the browser draws it, but there is no buffer to parse glyph outlines from, and fetching the URL yields WOFF2 — Brotli-compressed, which opentype.js can't read and `DecompressionStream` can't help with (it does gzip and deflate only). There is no clever client-side way around it, so the honest shape of the feature is: fonts added *from a file* outline, fonts added *by name* tell you to download the file. Detecting the `wOF2` signature explicitly turns an inscrutable parser exception into a sentence naming the one action that fixes it.

- **A boolean field can only ever express two of the values a designer needs, and widening it is the small half of the job.** `fontWeight?: boolean` had no room for Light, Medium, SemiBold or Black, which is why the font picker had grown one top-level entry per *file* — `Montserrat-Light`, `-Bold`, `-ExtraBold` reading as three unrelated typefaces was a symptom of the type, not of the picker. Moving to the 100–900 axis was one line; the work was the ten places that each re-derived a font string with their own truthiness test. `el.fontWeight ? 'bold ' : ''` is correct for a boolean and silently wrong for a number, because **400 is truthy** — every Regular would have rendered Bold. Widening a field means grepping every read, not just every write.

- **Three renderers were already emitting an invalid CSS font string, and it looked like the feature simply didn't exist.** `${el.fontWeight || 'normal'} ${size}px ${family}` produces `"true 16px Inter"` from a boolean — not parseable, so the canvas ignores the *entire* assignment and keeps whatever font was set before. Bold connector labels and bold BPMN text had therefore never once been bold, and nobody had filed it, because "the bold checkbox does nothing" reads as unimplemented rather than broken. Centralising into a `fontShorthand` that emits spec-order `style weight size family` fixed three bugs that were never reported alongside the one that was.

- **Two sources of truth for the same fact need a rule about which one wins, and the answer differed per family.** After the split, an element's style is implied twice: by its font *key* (`custom-13` = the Montserrat-Bold file) and by its `fontWeight`/`fontStyle` fields. For a family made of real files the key wins — one file *is* one style, and an element assigned that font by key (API, template, older document) typically has no `fontWeight` at all, so trusting the fields displayed a Bold file as "Regular". For a built-in the key is shared by all four synthesised styles, so there the fields are the only discriminator. `resolveActiveVariant` is that rule in one place; without it the Style dropdown was confidently wrong exactly for the users who had installed real font families.

- **Font file names are parseable because the style vocabulary is small and always trailing.** `Montserrat-SemiBoldItalic`, `Roboto_Light`, `Inter-700`, `Open Sans Bold` all yield family + weight + slant from: normalise separators, split camelCase, then consume known style words *from the end only*. Stopping at the first non-style token is what keeps a family genuinely called "Bold Script" intact — greedily stripping style words anywhere would eat its name. Worth stating as a general shape: when a naming convention puts the variable part at a fixed end, parse from that end and stop at the first surprise, rather than filtering tokens globally.

- **A dev-server dynamic import is a different module instance, and it silently forks your signals.** Verifying the font grouping in the browser, `await import('/src/utils/custom-fonts.ts')` and calling `addCustomFontFromFile` appeared to work — and the app never saw the fonts, because Vite resolved that specifier to a second copy of the module with its own `createSignal`. The fonts went into a parallel store. It presented as "the grouping code isn't running", and cost a detour into HMR and service workers before the picker's own contents (built-ins grouped correctly, my four files absent) gave it away. For state that lives in a module-level signal, drive the app through its real entry points — the UI, the exposed API, or persisted storage plus a reload — never a fresh import.

- **A row that renders from `prop.options` is invisible to any data that lives on a *different* property.** The new Font Style row built its family list from its own config entry's `options`, which is empty — so it worked for user-installed families (which come from a signal) and silently vanished whenever a built-in font was selected, because the built-ins are options on the `fontFamily` property. The bug only appears for half the inputs, which is exactly the kind that a single happy-path check misses; testing a built-in, a multi-style file family, and a single-style family caught it in one pass.

- **"We can't do X because we don't have the binary" was a sourcing problem, not a technical one.** Italic outlines were left undone on the grounds that no italic font files were bundled. They are freely available: google/fonts serves real TTFs, and where a family has moved to a variable font (Inter, Merriweather, JetBrains Mono, Source Code Pro all have), fontsource ships static per-weight instances. The catch worth writing down is the *format*: opentype.js 1.x reads TTF, OTF and **WOFF** but not WOFF2 — and Merriweather's italic is 4.6 MB as a variable TTF versus 72 KB as a WOFF static instance with full glyph coverage. Checking which formats the parser accepts before choosing a source turned a "too big to bundle" into a non-issue.

- **A synthetic fallback is honest when it reproduces what the user is already looking at.** Shearing an upright face to fake an italic would be a poor substitute for a real italic *design* — in a serif the `a` changes shape entirely — which is why the resolution order is slant-first, like CSS's own font matching. But for a family that has no italic at all, the canvas is *already* showing a sheared upright, so outlining with the same shear (0.2, Chrome's synthetic oblique) makes the vector match the text it replaced. The distinction that matters: a fallback that silently substitutes a *different* thing is a bug (see the sans-serif substitution above); one that reproduces the current rendering is correct behaviour.

- **Douglas–Peucker is the wrong simplifier when a curve, not a chord, will replace the dropped points.** Refitting a flattened ring, DP measures how far the discarded vertices sit from the straight line between survivors — but the survivors get joined by a Bézier that bulges out to follow the arc. On a 48-point circle of radius 100 the sagitta across even two segments is 0.86 units, so at any sane tolerance DP kept all 48 points and the "simplification" did nothing. Spending anchors per unit of *curvature* is both the correct measure and a better-behaved one: the anchor count depends on the shape rather than on how densely it happened to be sampled (48-point and 240-point circles both give 8).

- **Greedy "emit when the running total passes the budget" always leaves a stub at the seam.** Thinning a closed ring by accumulated turn emitted every 7th vertex (52.5° at a 45° budget, because 6 steps of `acos` sum to 44.9999) and then had one vertex left before wrapping — a 7.5° arc against 52.5° neighbours. The handle fitted to that stub was ~6× too short and put 5.9 units of error on the two segments either side, while every other segment was within 0.5. Dividing the total into equal parts up front has no remainder and no seam. The tell for this class: an error that is small everywhere except near index 0.

- **chord/3 is the small-angle limit, and the error it leaves is systematic rather than random.** Catmull-Rom style handles at a third of the chord are 4% short for a 45° arc, which put a refitted circle 0.29 units inside a 100-unit radius — every segment biased the *same* way, so a cut piece sat visibly inside the shape it came from rather than jittering about it. The exact factor for a circular arc is (4/3)·tan(θ/4) of the radius; expressed as a fraction of the chord and applied per segment (θ is a property of the span between two anchors, not of either one) it takes the same circle to 0.000. Worth reaching for whenever a "close enough" constant is applied uniformly — uniform error is bias, and bias is visible.

- **`Math.ceil` on a value that should land exactly on an integer is a coin flip.** Total turn round a closed ring accumulates from `Math.acos`, so it comes to 359.9999 or 360.0001 depending on how many vertices were summed — and `ceil(total/45)` therefore returned 8 anchors for one sampling of a circle and 9 for another. A test asserting the count is sampling-independent caught it; the fix is one epsilon. Any threshold crossed by a floating-point sum of many small terms needs one.

- **An overlay's `top/left` is only canvas-local if something in its ancestry says so, and `position: relative` on a sibling doesn't say it.** The text-editing textarea positioned itself with `worldToScreen` — canvas-local px — but rendered as a *sibling* of `.canvas-drop-zone`, so its containing block was `<body>`. Those two frames are identical right up until the shell insets the canvas by the docked chrome, at which point every editor opened 46px left and 52px above the text it was editing. This is the fifth overlay in this codebase to have it (rulers, symmetry axes, artboard frames, node tool), which is the real lesson: `worldToScreen` is not a general-purpose "where on screen is this" — it answers a question about the canvas, and any DOM overlay that isn't *inside* the canvas's positioned box must go through `worldToWindow` instead. The bug is invisible in the layout the developer happens to be running, which is why it keeps recurring.

- **When an editor is meant to be invisible, "close enough" positioning is the whole feature.** Nobody reports "the label moved 3px on double-click" as a bug; they report that editing feels wrong. Reproducing the renderer's text box means reproducing *all* of it — the wrap width, the vertical alignment, the font-specific baseline nudge, the draggable-label offset — because each omission is a jump. The overlay had faithfully copied the middle-aligned formula and silently dropped the other four, so top-aligned labels leapt to centre and every circle re-flowed.

- **A magic-number table duplicated in three files will disagree in the fourth place that needs it.** The inscribed-width factors (0.707 for a circle, 0.65 for a banner) existed in `measureContainerText` and again in `fitShapeToText`; the editing overlay, written later, simply didn't know about them and wrapped at full width. Extracting `inscribedTextFactor` didn't fix a bug by itself — it made the fix *possible to state*, because "wrap where the canvas wraps" became one call rather than a re-derivation the next caller would also skip.

- **"Show the intersection" is the wrong default for a multi-selection panel; "show the union, apply to the subset" is what people mean.** The Properties panel only offered a property when *every* selected element supported it, which sounds safe and makes Ctrl+A useless: one freehand stroke removed Font, Font Size and every other text control from a selection of forty labels, so the most common bulk edit there is had no way to be expressed. The any-of rule needs three changes, not one — the filter, the write (narrow to the supporting ids) and the *read* (compare values across the supporting ids only, or the unsupported element's `undefined` reports "Mixed" forever). The read is the one that's easy to forget, and it fails quietly: the control appears, looks broken, and nobody can say why.

- **A widened field re-breaks every truthiness test, and the second wave arrives long after the first.** `fontWeight: boolean → 100-900` was fixed across the renderers in 0.8.175 and written up in this file ("400 is truthy"), and the Properties panel's Bold checkbox still rendered `checked={!!value}` — so Bold *and* Italic showed ticked on plain Regular text, because `400` and `'normal'` are both truthy. The quick toolbar's equivalent control had been updated; the panel's had not. Grepping for the field name finds the writes and the obvious reads; what it misses is the generic control that never mentions the field at all and just does `!!value` on whatever it was handed. When a type widens, the place to look is the *generic* renderers keyed by property name, not only the code that names the property.

- **The opening tool is a safety default, not a taste default.** Yappy opened on the Ink Brush, so the first click after a reload *drew* — on a diagram you had come back to in order to move a box. The cost of the wrong default is asymmetric: opening in Select and wanting to draw costs one keystroke, opening in a pen and not wanting to draw costs a stray stroke plus noticing it plus an undo. Anything that starts an app in a state where an ordinary click mutates the document should be opt-in. The same reasoning applies to `resetToNewDocument`, which inherited whatever tool the previous drawing ended in — a new document should start the way a fresh load does, or "New sketch" quietly hands you the last session's brush.

- **A HUD that is always on is a decision nobody made.** The selection's `W × H` badge shipped with no setting, so it sat on top of the artwork and the quick-connect handle on every selection, forever. It earns its place *during* a resize and is clutter the rest of the time — which is the signature of something that should be opt-in with a visible way back on, not a permanent fixture. The reason it went unquestioned is that it looks like part of the selection UI rather than a feature with a switch.

- **The same frame mismatch showed up a third time in one day.** `TransformHud` positioned itself with `worldToScreen` on a `position: fixed; inset: 0` layer — 46px left and 52px above the object it was labelling — exactly like the text editor and the rulers before it. At this point the rule is mechanical: if a DOM overlay is `fixed` or lives outside `.canvas-drop-zone`, it must use `worldToWindow`, and `worldToScreen` is only for code that already has the canvas rect subtracted. Worth a lint rule rather than another bug report.

- **"Persist it with the document" and "persist it as a preference" are different questions, and the fallback argument is where they get confused.** The dimension toggle's first version read `lsBool('showDimensions', gs.showDimensions ?? false)` — localStorage first, *the document's own value* as the fallback. That reads as belt-and-braces and is actually a bug: a drawing autosaved while the badge was on carried `true`, so on the next load the default never applied and the setting could not be returned to off by clearing anything the user could see. App-level preferences (which tool opens, which cursor, which HUD) need their own reader that consults localStorage and nothing else — the pattern `readDefaultTool` was already using two lines above.

- **A toolbar is a claim about what a thing is.** Command palette, Vector Tools and Shape Builder sat in the left column with the pens and shapes: two of them open UI and one enters a mode, so none of them is a thing you draw with. Grouping by "where does the click take me" rather than "what does this do" is how a tool column turns into a junk drawer. Moving them up also cost a mirror in the phone menu — the top cluster is desktop-only, so anything that lands there needs a second home or it disappears on a phone.

- **A breakpoint that equals a real device's width will land on the wrong side of it for someone.** `isMobile = innerWidth <= 768` is *exactly* an iPad portrait, so a tablet got the desktop tool column and the phone top bar simultaneously. It had been survivable while the top bar held only optional extras; the moment controls moved up there it became "this device can't reach them". Two rules fell out: breakpoints belong *between* common device widths, never on one, and a shell should change shape all at once rather than in stages, or you ship a layout nobody designed.

- **Measure what fits before picking the number.** The obvious fix was to reuse `PHONE_MAX_WIDTH` (600), and it would have shipped a clipped top bar: the row is `nowrap` with `overflow: visible`, needs 628px, and at 601 the theme toggle hung 14px past the right edge with no scrollbar to recover it. One measurement turned a plausible constant into the right one. When a container can't scroll, "does it fit" is a number you can read, not a judgement call.

- **A green e2e test proves nothing if you never checked that the gesture landed.** Three specs here asserted `expect(x).toBe(250)` after a drag that missed the element entirely — the element hadn't moved, so the "unchanged" value was also the expected one. The tell is an assertion that would hold if the whole interaction were deleted. When a spec drives real input, assert something that can only be true if the input arrived (the element moved, the mode changed, the selection is non-empty) before asserting the interesting property.

- **`boundingBox()` answers "where is it", not "can I click it".** Playwright happily reports the box of an element sitting under the status bar, so the press goes to the status bar and the drag silently does nothing. Anything that positions a target relative to the viewport needs to keep it clear of fixed chrome — or check `document.elementFromPoint` at the press point, which is the one line that turns "the resize is broken" into "the handle is covered".

- **Fixing a UI leaves its tests describing a place that no longer exists.** `uml-tool-group.tsx` hasn't been rendered for who knows how long, the Swatches panel moved onto the dock, and the toolbar now opens in a minimal mode with no groups — three specs were waiting on selectors that could never match, and one had a comment explaining it had already been through this once. A red suite that stays red stops being read; each of these was a real signal (dead component, stale selector) that had gone quiet because nobody expected the file to pass.

- **A drawing aid that nothing consults is a picture, not a tool.** The Perspective Grid drew a horizon and two fans, and no drawing code had ever read `store.perspectiveGrid` — every line over it was aimed by eye. The tell was in the render code rather than the feature list: the rays ran from the vanishing points to *fixed points on the window edge*, so the "same" guide line moved every time you panned. Nothing that expected to be aligned to could have been drawn that way. Defining each line by two world points and clipping the infinite line in screen space costs about fifteen lines and is the difference between decoration and a grid.

- **Snap strength wants to be one number that spans "bias" and "lock".** The obvious formula, `pull = strength × smoothstep(closeness)`, can never actually reach the ray, so a straight wall edge is always a fraction of a degree off — and the obvious fix, hard-snapping inside the cone, destroys the feature for curves and pen handles. `pull = smoothstep(closeness) ^ (4·(1−strength))` covers both: the exponent goes to 0 at full strength (a true lock) and to 4 at zero (a whisper), with everything in between continuous. Worth reaching for whenever a slider has to interpolate between two behaviours people describe with different words.

- **Adding global state to a shared store retro-fires into every test file that touches it.** Turning the perspective grid on in one bun test file left it on for the next, and three assertions in `pen-angle-constrain.test.ts` — written months earlier, correct at the time — started failing because their anchors were now being soft-snapped. Bun shares the module graph across files in a run, so store state is process-wide. Two habits fix it: clean up in `afterAll` in the file that turned the thing on, and reset the new flag in the `beforeEach` of any suite whose result now depends on it. A test that passes alone and fails in the suite is almost always this.

- **A choke point in the code is worth more than a feature flag.** Live Corners on pen paths sounded like a week: rounding has to survive rendering in two draw styles, filling, hit-testing, boolean ops and SVG export. But every one of those paths already went through `anchorsToPathData`, and node editing deliberately does not — it reads the raw anchors. So the fillet went in at serialization, and render/hit-test could not disagree about the outline even in principle, while the anchor the user drags stays the original sharp corner. The feature is non-destructive not because anything was written to keep it that way, but because that is the only thing the shape of the code allowed.

- **Two rounding features that look identical should NOT share a unit.** A rectangle's `borderRadius` is a percent of the shorter side, which is exactly what keeps a rounded rect in proportion when it is resized. An open path has no shorter side, so path corners are px. Reusing `corner-radius.ts` would have forced a fake denominator on every open path; the two resolvers stay separate on purpose.

- **The trim distance comes from the angle, not the radius.** `t = r / tan(θ/2)`: an obtuse elbow gets cut back LESS than its radius and an acute spike more. Stepping back by `r` on both sides — the obvious first guess — makes a 135° corner look barely rounded next to a 90° one at the same setting, which reads as a bug in the slider rather than as geometry.

- **Clamping in path order is not clamping.** The first version walked the segments and rescaled whichever pair of corners it met first, so four equal radii on a square came out four different sizes: corner 1 gave way to corner 0, then corner 2 gave way to the already-shrunk corner 1. Capping each corner at half of its shorter neighbour is both symmetric and sufficient — if every corner takes at most half a segment, two fillets on one segment can never cross, with no iteration at all.

- **A cubic is not a circle, and a test that says it is will fail at the fourth decimal.** The 4/3·tan(Δ/4) arm is the standard arc approximation every renderer uses for rounded rectangles; its worst radial error over a quarter turn is ~0.027%. `toBeCloseTo(20, 3)` fails on that by design. Assert the approximation is the good one (bounded relative error), not that the curve is exact.

- **A modifier read only from pointer events is a modifier that lies.** The Shape Builder tracked Alt inside `onMove`, which early-returned unless a drag was already in progress — so holding Alt while deciding where to begin showed merge, and the mode only became visible once it was too late to change your mind. Modifiers that change what a gesture will do have to be watched on the keyboard, and resynced on window blur, because Alt+drag is a window-manager gesture on some desktops and the keyup never arrives.

- **Adding a second control of the same kind breaks the first one's test.** A bare `.pg-seg` selector was unique until the perspective hint bar grew a plane picker next to the config's mode picker; the spec then died on a strict-mode violation naming both. The fix belongs in the markup — give each segmented control its own modifier class — not in the test, which would otherwise be pinned to sibling order.

- **When you tell a user "we only bind Alt", check what the reference actually binds Shift to.** The designer wrote "Alt/Shift", which read like a mistake — ours only had Alt. Illustrator binds both, just to different things: Alt subtracts, Shift rubber-bands a box over several regions at once. The feedback was not confused; it was describing a real second gesture we were missing. Worth pausing before correcting someone about a tool they use every day.

- **Two hit tests, because either one alone is wrong.** A marquee that asks "is any vertex of this region inside the box" catches everything the box crosses and silently misses a region *larger* than the box — which is precisely the case where you rubber-band a small detail sitting inside a big background shape. Probing the box's own corners and centre against each region covers that, and costs five point-in-polygon tests. Neither test subsumes the other; shipping only the cheap one would have looked correct in every demo built from small overlapping circles.

- **Latch a modal modifier at press time, not per frame.** Whether a Shape Builder drag is a box or a stroke is decided by Shift on pointer-down and stays decided. Reading `e.shiftKey` on every move instead would turn a rubber-band into a freehand stroke the instant a finger slipped off the key mid-drag — losing the gesture at the exact moment it is least recoverable. The opposite rule applies to Alt, which only picks merge-vs-delete and should stay live right up to release.

- **A render call inside a `createEffect` subscribes the effect to the entire document.** `canvas.tsx` re-lays-out on toolbar dock / zen / appMode changes, and the last thing that layout does is `draw()` — which reads `store.viewState`. Solid does not care that the read is four frames deep in a render function: it is a dependency. So every zoom and pan re-ran the layout, and in a paged document the layout re-fits the slide, which silently undid the zoom. Five unrelated input paths (keyboard, wheel, buttons, Pan tool, Space+drag) all looked broken at once, which is the signature of a fault *downstream* of the state write rather than in any handler. The rule: an effect should read its dependencies as named expressions and call anything imperative through `untrack`, so the deps are the lines you can see, not whatever the callee happens to touch.

- **"Every method is broken" narrows the search more than a single broken method would.** When Ctrl+scroll, the zoom buttons, the hotkeys and two pan gestures fail together, the one thing they share is the state they write and what observes it. Debugging any *one* of them — reading its handler, checking its guards — is time spent in the only place the bug cannot be.

- **A re-fit that fights the user is invisible when it is fast.** `zoomToFitSlide()` ran synchronously in the effect *and* again on a 50ms timer, so the store never showed an intermediate value: a test reading the view straight after a zoom click could see the right number and still be looking at a broken app. The regression spec asserts the scale again 300ms later for exactly that reason.

- **If the renderer poses an element, every hit test has to pose it too — or the handles lie.** Animation mode drew shapes from `evaluateTimelineAt`'s tween overrides but hit-tested `store.elements`, so mid-span the visible handles and their hit boxes sat at different places. The asymmetry survived because it is invisible exactly where you test it: on a keyframe the posed and raw geometry coincide, so every manual check passes. The durable fix is not "add the override to the hit test" but "make one function produce the geometry both consume" — `poseElementsAtFrame` is now the single answer to *where is this shape right now*.

- **Two animation spines in one app will each be mistaken for the other.** `calculateAllAnimatedStates` (seconds-based composition, gated on presentation/preview) and `evaluateTimelineAt` (frame timeline, always live while authoring) both write into the same `animatedStates` map at render time, which reads like one system. The selection hit test called the first and looked correct — it *was* animation-aware, just for the wrong spine and in the wrong mode. When a codebase has two mechanisms with the same shape, "this code already handles animation" is not evidence.

- **Fixing where a handle is caught only exposes what the drag then edits.** Making the handles grabbable mid-tween was three lines; the real question was where the resize should land, since the element under the pointer belongs to the span's left keyframe and editing it makes the shape slide away from the cursor. That is an authoring-model decision (split the span vs. snap the playhead vs. refuse), not a bug fix, and it was worth stopping to ask rather than picking one and calling the bug closed.

- **Solid's `setStore` merges — including through `null`, through the function form, and skipping `undefined`.** A test setup that wrote a fresh timeline object still inherited the previous test's `tween: 'motion'`, because a bare object merges key-by-key, `setStore(key, () => obj)` merges the returned object too, and setting a key to `undefined` is skipped rather than deleting it. Nulling the key first did not help either. The reliable fix in a test is to avoid the ambiguity entirely — write a concrete value for the field you mean to vary (`'none'` is a real `TweenKind`) instead of relying on an omitted key.

- **A test that cannot fail is worse than no test, and "asserts nothing changed" is the classic shape.** The companion test to the tween-split fix asserted that the frame-0 cel was untouched — which is trivially true when the drag lands on empty space and does nothing at all. It passed identically with and without the fix. Every "X was left alone" assertion needs a paired assertion that the operation actually ran.

- **`page.locator('canvas').first()` is a coin flip once a second canvas exists.** The animation timeline draws its grid into its own `<canvas>`, so the E2E drag was being aimed at a 290×68 strip at the bottom of the window rather than the drawing surface. Related: a new animation document fit-to-views itself *after* creation, so pinning `setView` up front does not stick — read the live `viewState` and map world→client from that instead of assuming the view you asked for.

- **A feature nobody can see is indistinguishable from a feature nobody built.** "Add an option to change the size of individual panels" arrived as a feature request; the panels had been resizable and persisted for months. Both drag handles were transparent strips 6–8px wide with styling that only appeared on hover — so the affordance existed only for someone who already knew it was there. The fix was ~20 lines of CSS. Worth checking whether a requested feature is actually missing before costing the build.

- **Extract the pure geometry when a modifier needs a new mode.** Alt+Shift centre-scaling touched maths buried in a pointer handler behind a `PointerEvent` and a live store, where the only available test was a slow E2E drag. Lifting it into `computeResizeBox` made all three modes unit-testable in milliseconds, and the extraction was verifiable on its own terms — the pre-existing rotated-resize E2E specs passed unchanged, which is what licensed the refactor. Order matters inside it: the centre-scaling delta must double *before* the aspect lock, since doubling width and height deltas independently does not preserve their ratio.

- **A cache keyed on a Solid store value's object identity is keyed on nothing.** `setStore('animTimeline', next)` MERGES into the existing proxy rather than replacing it, so the reference is stable across a structural edit and a `cache.tl !== tl` guard never fires. Two per-frame memos had been written that way and looked correct for months, because their *other* key — the frame — happened to change on every operation that had ever edited the timeline. The first feature that edits it while the playhead stands still turned them into silent stale reads. The fix that sticks is a write choke point (`setAnimTimeline`) bumping a revision counter, not a smarter comparison; the same merge semantics had already bitten the test setup for this feature, which is the tell that it is a property of the framework rather than a one-off.

- **The bug a stale cache causes never looks like a cache.** Visibility came back for the previous cel, so `canInteractWithElement` judged a brand-new element "not on this frame" and the drag refused to move it — presenting as "the split works and then nothing happens". Three plausible wrong suspects (selection remap, capture set, drag delta) each took a round to clear, and all three were correct the whole time. Logging the *inputs* at the point of refusal (`can: false`) rather than reasoning forward from the mutation found it in one step.

- **Two pose sources compose in exactly one order, and the wrong one silently wins.** The element hit test merged the frame-tween pose and then applied the seconds-based orbit/spin state on top. That spine returns an entry for EVERY element — reporting static store x/y when nothing orbits — so the last write always reverted the shape to its keyframe and clicking a tweened shape's body selected nothing. The renderer had it right (frame overrides go on last); the hit test had to match. Where a pipeline has a documented layering order, a consumer must take the raw override and re-layer it, not accept a pre-merged result — which is why `animFrameOverrides()` exists next to `animPosedElements()`.

- **Deferring a side effect to an existing threshold is cheaper than inventing a flag.** Splitting a tween on a body drag must not fire on pointer-down (that gesture is also just "select"), so the split hooks the 3px drag threshold that was already there. Making the split idempotent — cheap structural check before the O(elements) evaluation — meant it could be called on every pointermove with no per-gesture bookkeeping to set, clear, or leak.

- **`--reporter=line` eats your console.log.** It redraws with cursor-up escapes, so every diagnostic after the first was overwritten and appeared never to have run — which reads exactly like an exception swallowing the rest of the test. `--reporter=list` for anything with instrumentation in it.

- **"All three failures are the same flake" is a hypothesis, not a finding.** Three specs failed at exactly 30.1s, which looked like one uniform timeout story. It was three different stories: a genuine cold-boot timeout, a stale selector pointing at a class that had not existed since the panel moved into the dock, and a real UI regression where the docked toolbar covered the dope sheet's controls so a user could see the buttons and not click them. Reading each call log — *what* was being waited on, not just *that* it timed out — separated them in minutes; the uniform duration was just the shared budget they all ran out of.

- **A/B against the unmodified tree before spending a minute on a suspected regression.** Two of the three failures were in specs added specifically because they exercised a shared write path I had changed, which is exactly the shape of a real regression. Stashing `frontend/src` and re-running showed both failing identically on baseline — five minutes to exonerate the change and redirect the effort at the actual causes.

- **Fixing the layout in one place does not fix the class of bug.** `.atl-panel` already carried a comment describing the docked-toolbar overlap and the `--toolbar-left/right` fix for it. `.keyframe-panel` had the identical `left: 0; right: 0` and never got it. Bottom-anchored full-width chrome is a small enough family to grep for whenever the shell's edge insets change.

- **Stroke alignment is a clip, not a geometry problem.** Inside/Outside look like they need offset outlines — re-derived per shape, breaking on self-intersections, and duplicated across ~150 renderers. Drawing the stroke at *double* width and clipping away the half on the wrong side gets the same result from one interception point, and gets it in both draw styles at once: the clip is set on the ctx around the renderer's own draw call, so rough.js obeys it as readily as the clean canvas path. `buildClipPath2D` already existed for clipping masks and needed no changes. The inverse clip for Outside is the standard huge-rect-plus-outline with `evenodd`.

- **A two-pass render has to be decided before the first pass draws.** The Outside path draws fill+text unclipped, then the stroke inverse-clipped. Resolving the outline *inside* the clip helper meant discovering "this shape can't be aligned" only after the fill had already gone down — leaving a filled shape with no stroke on exactly the shapes the fallback was meant to protect. Resolving it up front (`strokeAlignOutline` returning `Path2D | null`) makes the fallback a single branch taken before anything is committed.

- **Suppressing one property can silently suppress another that defaults to it.** `strokeColor: 'transparent'` on the fill pass also blanked container text, because text colour falls back to `textColor || strokeColor`. Any "render this element but without X" clone needs checking against everything that *derives* from X, not just what draws it.

- **Padding calculations encode an assumption about the feature that didn't exist yet.** `strokeWidth / 2` in the export bounds was exactly right until stroke alignment made the spread 0, w/2 or w. Adding a rendering mode means grepping for the constants that describe how far the old mode reached.

- **Duplicate ids hide until something needs to address one member.** Guides had all shared `guid-1` for as long as they'd existed, and nothing was visibly broken: you drag a guide by grabbing it, and `updateGuide` moving all four looked like "the one I'm holding moved". Only a *selection* — which must name one of several — made it surface. When adding multi-select to anything, verify id uniqueness first; the collision predates the feature and will otherwise read as a bug in the new code.

- **Extending an existing property beats adding a parallel one.** `strokeLineJoin` already existed, rendered, exported, and had a Properties row — it was simply restricted to ~28 closed shapes via `applicableTo`, so a Pen path could never reach it. The user-visible "add corner options for paths" was a list edit plus a matching `strokeLineCap`. Check whether the requested control exists and is merely unreachable before designing it.

- **`applicableTo` lists are typed against `ElementType` and will reject plausible-sounding names.** `'freehand'`, `'draw'` and `'connector'` are all things this app clearly has, and none of them are element types — the freehand family is `fineliner`/`inkbrush`/`marker`/`ink`/`bezier`, and connectors are a flag on other types. tsc catches it, but only after the list reads as finished.

- **A colour that is "slightly off" by a fixed amount is an encoding, not a rounding error.** `#FF0000` sampled as `#EA3323` looks like sloppy maths until you notice that (234, 51, 35) is exactly sRGB red expressed in Display-P3 primaries. Colour bugs of the form "close but not equal" are almost always a space mismatch, and the pair of values identifies which one — worth computing the conversion before reaching for the debugger.

- **The browser's EyeDropper API samples the screen, and the screen is not your document.** It returns the composited framebuffer value in a field called `sRGBHex`, which is a lie on any wide-gamut display. You cannot correct it after the fact either, because whether it needs correcting depends on the user's monitor. The fix is to stop asking the screen: an app that owns the document already knows what colour the shape is, exactly, and reading it from the model is both accurate and portable to browsers that never shipped the API.

- **A fallback chain terminating in a default value will mask the case it was meant to catch.** `backgroundColor ?? strokeColor` is right for shapes and silently wrong for images, which carry a default black stroke nobody set — so "pick a colour from this photo" returned `#000000` and never reached the pixel sampler that existed for exactly that case. Returning null explicitly for the types that have no answer is what makes the fallback reachable.

- **"The feature doesn't work" and "the feature has no control" are indistinguishable from the outside.** Fill mode's colour had always been editable in the renderer; the Properties panel just never listed freehand types under `backgroundColor`, so nothing drew the control. The user reported it as the fill being unchangeable — and reasonably so, since the panel *did* offer Stroke, which recoloured the thin outline on top and left the mass alone. When a report says a value can't be changed, check whether a control exists before checking whether writes take effect.

- **A type list is the wrong place to express a state condition, and `visibleWhen` is cheap.** Freehand strokes only have a fill when `fillSilhouette` is set, which `applicableTo` (a list of element types) cannot say. The predicate hook added a release earlier for Stroke Align covered this second case at a one-line cost — a sign it was the right seam rather than a one-off.

## A `prompt`-strategy service worker makes `location.reload()` a no-op for stale builds

This is the non-obvious one, and it silently invalidates the reflex fix for a whole class of bug.
With `registerType: 'prompt'` (which we chose deliberately — `autoUpdate` caused the "blank on
first load" chunk-eviction race), a newly deployed service worker installs and then *waits*. The
waiting worker activates only when there are **no remaining clients**, and a page reload does not
count as losing a client: the client survives it. So every "just reload to pick up the new build"
path — the ErrorBoundary button, the automatic stale-chunk recovery — put the user back on the
exact same broken build.

The tell in a user report is oddly specific: *"reloading doesn't help, but closing it and opening
it again does"*. Closing the tab is what releases the last client and lets the waiting worker take
over. If you hear that sentence, look at the service worker before you look at caches or the host.

Anything that needs a genuinely different build must go through `hardRefresh()` — unregister the
workers, clear Cache Storage, navigate to a cache-busted URL. `forceReloadLatest()` in
`utils/stale-build.ts` is that entry point for error screens.

## Solid's `ErrorBoundary` latches, and `lazy()` caches its rejection

Two related traps when a lazy route/panel fails:

* `ErrorBoundary` keeps showing the fallback for the *lifetime of that boundary*. If the boundary
  wraps a switchable region (one content pane, many docs), a single failure poisons every
  subsequent selection. Fix: rebuild the boundary per selection — `<Show when={x} keyed>` around it
  is enough, since `keyed` re-creates the subtree when the value's identity changes.
* `lazy(fn)` stores the promise from the first `fn()` call and never calls it again, rejection
  included. So the boundary's `reset` cannot re-attempt the import, and neither can a re-render.
  (Nor would a retry help much for a genuinely missing chunk: the browser's module map caches the
  *failed* fetch too, so re-`import()`ing the same specifier fails without touching the network.)
  A real recovery has to reload the document, not retry the import.

## CacheFirst + `statuses: [0, 200]` is a month-long footgun for same-origin assets

Workbox's boilerplate `cacheableResponse: { statuses: [0, 200] }` exists to allow *opaque*
cross-origin responses. On same-origin assets a status-0 response is never legitimate — and stored
in a CacheFirst cache with a 30-day expiry it means that URL serves an unparseable body until the
entry expires, with no network fetch to correct it. Use `[200]` for your own assets and keep `0`
for third-party CDN rules.

## "The picker gives a duller shade" was a gradient reporting a single stop

Worth remembering as a diagnostic shape: a colour-accuracy complaint that survives a colour-management
fix is probably not about colour management any more. The v0.8.191 fix (read the authored colour, do
not sample the composited screen) was correct; the residual complaint came from `elementPickColor`
answering "what colour is this shape?" with the first gradient stop, when the user had asked "what
colour is this *point*?". Flat paint has one authored colour and a gradient does not, so the two
questions only diverge on gradients — which is why it read as an intermittent slight shift rather
than an obvious wrong answer.

The measurement is what settled it: pick at 10/50/90% across a red→blue gradient and compare against
`getImageData` at the same points. Three identical picks against three different on-screen colours is
unambiguous in a way that staring at the eyedropper code was not.

## Resuming a pen path is an anchor-order problem, not a mode problem

Adding "pause the Pen and continue later" needed no new mode or persisted draft state: finishing a
path already leaves a normal open `path` element on the canvas, so "pause" is free. Resuming is just
rehydrating `pState` from that element — with one wrinkle. `penAnchors` are stored relative to
`startX/startY` (the world position of anchor 0), and that same origin is what the *close* test
measures against. Set it to the world position of anchor 0 and closing-by-clicking-the-far-end works
for free.

Clicking the *start* anchor to continue backwards is handled by reversing the anchor list and
swapping each anchor's `in`/`out` handles — the curve is unchanged, and new anchors still append at
the tail, so no direction flag has to be threaded through the rest of the handler.

Refused deliberately: rotated paths (anchors live in unrotated local space, so a world-space click
would land in the wrong place) and compound paths (several ends, no single "the" end). Both are
still editable with the Node tool.

## A mandala needs a dihedral group, not more rotations

Radial symmetry already existed and still didn't produce mandalas. Rotating a wedge N times gives
you a pinwheel; what makes traditional mandala work read as a mandala is that each wedge is also
bilaterally symmetric. That is the difference between the cyclic group C_n and the dihedral group
D_n, and it costs one extra set of ops: the n reflections that keep the set closed.

The non-obvious part is where the mirror lines go. Composing `rot(θ)` with `refl(φ)` yields
`refl(φ + θ/2)`, so with rotations every 2π/n the mirror lines land **π/n** apart, not 2π/n. Space
them at 2π/n and the set is not closed — some wedges get drawn twice and others stay empty, which
looks like a rendering bug rather than a maths error.

Closure is the property worth testing, and it is cheap: multiply every pair of the 2n transforms
and assert the product is back in the set. That one test would have caught the π/n-vs-2π/n mistake
immediately, and it is far more informative than asserting instance counts.

`buildSymmetryTransforms` and `buildSymmetryOps` are two expressions of the same group (one maps raw
points, one clones vector elements), so a differential test that pushes one point through both and
compares orbits is the right oracle. Note they deliberately still disagree for `radial`, where the
transform list folds `angle` into every rotation for HappyPaint parity while the ops list does not —
only the new mode is held to agreement.

## Guide density is a feature constraint, not a cosmetic one

Raising the spoke cap from 24 to 36 was a one-line change that quietly broke the overlay: a 36-sector
kaleidoscope draws 2n = 72 rays, and at the mirror-axis line weight that is a solid purple starburst
you cannot draw inside. Two small things fixed it — ramp opacity down past 8 rays (`max(0.3, 8/n)`),
and start the rays ~16px out so the hub stays clear, which is exactly where the finest detail goes.

Ring guides had to outlive symmetry itself. You switch symmetry off to finish detail work by hand,
and the scaffold you spaced the rings against must not vanish with it — so the overlay's visibility
condition is `mode !== 'off' || rings > 0`, not just the mode.

Testing overlay SVG needs a scoped selector. `document.querySelectorAll('svg circle')` matched every
rounded toolbar icon in the app (radii 2.2–3.4px) and the ring test failed against 25 "rings"; the
overlay `<svg>` now carries a class so tests can address it.

## "Zero travel" is the wrong default for a destructive panel

The Pathfinder strip was built on Figma's contextual-toolbar model: put the operation where the
eye already is, appearing automatically on a 2+ selection. That reasoning was right about *reach*
and wrong about *frequency*. A two-object selection is the most routine state in the app — you get
there to move, align, group or recolour, or because a rubber-band grabbed one extra — while
combining shapes is rare and destructive. So the app spent most of its time covering the artwork
to offer to weld it together.

The useful distinction is not "how far is the control" but "how often is the trigger state
incidental". A contextual panel earns auto-appearance when reaching the state means you intend the
operation (a text cursor implies text formatting). Pathfinder's trigger state implies nothing of
the kind, so it belongs behind a pin.

Sticky, not modal. Pathfinder acts on a selection you already have, so making it a tool you enter
and leave would add an enter/exit step to every single operation. A pinned panel that survives
selection changes is the right model, and it's a workspace preference (localStorage) rather than
document state.

One thing that survived unchanged: the `Ctrl+Alt+U/D/I/X` shortcuts ignore the toggle entirely.
That is what made the default flip safe — the fast path for people who know the operation was
never the panel.

Also worth noting the investigation that did *not* pan out: I assumed the strip could sit over the
selected shapes and cause a mis-click on Subtract. It can't — placement prefers above the selection
and flips below when there's no room. The obstruction is of *other* artwork, which is a clutter
complaint rather than a safety one, and worth being accurate about before citing it as a reason.

## A bulk generator needs one undo, and `addElement` cannot give it

The mandala generator emits up to 122 paths. `addElement` snapshots history before every
single element — correct for one drawn shape, catastrophic in a loop. Undoing a generated
mandala needed 123 presses, and because the stack is 50 deep the design became
*un-undoable*: the entries that could have removed it were shifted off the front, taking
every earlier state with them. The first browser check said `afterUndo: 26` where 26 paths
had just been added, which is what exposed it.

The fix is a suspend counter, not a flag: `withoutHistory(fn)` increments, runs, and
decrements in a `finally`. A boolean breaks under nesting (the inner call re-enables history
for the remainder of the outer one) and a missing `finally` would leave history off for the
rest of the session. Callers push exactly one snapshot themselves, then wrap the bulk.

The same root cause killed the first design of the dialog's preview, which created real
elements and regenerated them on every slider tick — a hundred snapshots per frame of a
drag. It became an SVG overlay driven by the same `buildMandala`, which writes nothing to
the store. The cost is honest and worth stating in the UI: the overlay draws clean outlines,
so in sketch style the committed result has rough.js wobble the preview didn't show.

## Build a repeated motif in a canonical frame, then rotate it

Every mandala motif is generated centred on the **+x axis** spanning its radial band, as
`(radius, ±angle)` pairs with the positive half mirrored, and only then rotated into place.
That makes per-motif bilateral symmetry structural rather than something each new motif has
to remember — and it is one property to test across the whole vocabulary, which caught more
than a per-shape test would.

Worth knowing: `count` is meaningless for a motif that is one shape for the whole band (a
plain ring divider). Honouring it stacks N identical circles on the same coordinates, which
looks like nothing is wrong but silently multiplies the element count.

## `window.innerWidth / 2` is not the middle of the canvas

The generator dropped its mandala 127px right of where it looked like it belonged, with the
edge under the Properties panel, because "viewport centre" was computed from the window and
then fed into a formula expecting canvas-local px — two frames, one variable. The docked
toolbar and panels take real space. `windowToWorld(canvasOrigin + canvasSize/2)` keeps a
single conversion path. LOOP.md XXXIX names this exact trap; the pre-existing `center()` in
`vector-tools-panel.tsx` still has it, which is why Spiral and Polar Grid insert slightly
off-centre too (left alone here — different feature, reported instead).

The test that guards it asserts the design lands on the canvas centre AND that the canvas
centre differs from the window centre by more than 20px — otherwise the assertion would
pass on a layout where the two coincide and prove nothing.

## Tool state in a module, document state in the store — undo splits them apart

The Pen kept `isPenBuilding` / `currentId` / `penAnchors` in a module-level `pState` while the
element it was writing to lived in the store. Those are two independent lifetimes, and undo only
rewinds one of them: a global Ctrl+Z mid-path restored a snapshot from before the path existed,
leaving the Pen convinced it was still building something that no longer existed. Every later
click took the "continue the current path" branch and wrote to a dead id, so the tool looked
broken — and Escape "fixed" it only because finalizing resets `pState` as a side effect.

The fix worth generalising is *where* the guard went. Hooking it to undo would have covered the
reported repro and missed redo, element deletion, a script, and a cleared layer. Validating at
every entry point instead ("is the thing I'm editing still there?") makes the tool self-healing
against any source of removal. Any tool holding a reference to a store element across gestures
has this shape of bug latent in it.

## One geometric assumption, two unrelated-looking bugs

`knifeCut` assumed every target was an area and ran it through `elementToMultiPolygon`. That
single assumption produced two symptoms that read as different bugs: a 2-point line was silently
skipped (its ring fell under the 4-point minimum and got filtered), while a multi-anchor open path
came back as *filled closed shapes* (its anchors were closed into a ring). The user reported only
the second. Probing the first — comparing a line, an open path, a closed rect and a long open path
side by side in one run — is what showed they were the same root cause.

The same probe found a third instance: the Scissors was equally broken on a plain line, because a
line created from a bounding box has no `points` and `getShapeGeometry` has no `line` case, so
`shapeToPath` returned null. Fixing `shapeToPath` repaired both tools from one place — worth more
than patching each call site, and the reason to keep asking "what is the shared precondition?"
rather than fixing the reported symptom.

Where the fix reuses existing machinery, check what that machinery does on its own account:
`splitPathAt` took its own history snapshot and showed its own toast, which is right when a human
drives it once and wrong when the Knife drives it per crossing. Adding `{ history, toast }`
options was cheaper and safer than duplicating forty lines of exact-cut code.

## Four of eight "missing features" already existed

A feedback round listed eight items. Checking each against the code first — before planning any of
it — showed **four were already implemented and simply unreachable or undiscoverable**: compound
shapes (the requested reusable Boolean result), layer reordering (drag, plus Alt+[ / Alt+]),
`envelopeWithTopObject` (the requested Illustrator "Make with Top Object"), and the width tool
underneath the requested stroke profiles. Two of the remaining four were bugs, not features.

That ratio is the lesson. The instinct on a feature request is to plan the feature; the cheaper
first move is `grep` for it. Two of the four needed nothing but a menu entry and a default change.

Worth being honest about a self-inflicted case: `moveElementsToLayer` had existed in the store and
the public API with **no UI anywhere**, so moving a shape between layers genuinely required
scripting it — a capability shipped without a way to reach it is indistinguishable from a missing
feature. And shipping the Pathfinder strip off-by-default the week before had made the compound
"keep editable" toggle *less* discoverable, which is part of why that request arrived at all.

## Non-destructive should have been the default from the start

The ❖ toggle defaulted to off, so Subtract flattened shapes and discarded the sources. The reported
consequence was exactly the predictable one: "if I keep the subtracting object aside and want to
reuse it later, I have to break/separate the object first". Making the reversible operation the
default and leaving the irreversible one one click away is the right way round; it was backwards.

The request is genuinely ambiguous, and it is worth recording which reading was implemented: the
*result* now stays editable and the sources are recoverable via Release. If what was actually
wanted is the cutter left on the canvas as a separate object alongside the result, that is a
different option ("keep originals") and is still open.

## Read the component before choreographing its test

Three test attempts failed on the Move-to-Layer submenu — hovering the label span, then the button,
then the wrapper — before reading `context-menu.tsx`, which says plainly: "Submenus only open on
click, not on hover". The gesture was simply wrong, and each failed attempt looked like a selector
problem, which is why guessing at selectors kept nearly working. Ten seconds in the component would
have replaced twenty minutes of hover choreography.

## A slanted grid is a lattice, not two rounded axes

The square grid snaps by rounding x and y independently. That decomposition is the *only* reason
it looks simple, and it does not survive rotating the grid: on a 45° or 30° grid the drawable
points are the intersections of two families of slanted lines, and rounding each axis puts points
squarely between the lines — worse than no snapping.

The formulation that keeps it simple: a family at angle θ with spacing g is the lines whose signed
distance along the family's NORMAL is a multiple of g. Snapping is then round-to-nearest-multiple
for each of the two families, then solve the 2×2 system for the point. Exact, anchored at the
origin, idempotent, and about ten lines.

Two things worth knowing for anyone extending it. Isometric draws a **third** (vertical) family
because that is what makes it read as boxes rather than argyle — but snapping uses only the first
two, because three families of parallel lines have no common intersection lattice in general, so
"snap to all three" isn't a well-defined request. And the renderer and the snapper must read the
family angles from **one** place; two copies of `30 * DEG` is a bug that shows up as points sitting
just off the lines.

## Visual thinning must not change the snap
Three families a few pixels apart stop being a grid: at 5% zoom they covered ~83% of the canvas and
cost ~1600 strokes a frame. Doubling the drawn spacing below a legible gap fixes both — and
doubling specifically, so every line drawn was already there and the grid never appears to shift as
you zoom.

The trap is applying that thinning to snapping as well. It would silently coarsen the lattice as
you zoomed out, so a point placed at 5% would sit off-grid at 100% — an error that only appears
later, at a different zoom, which is the hardest kind to trace back. Worth an explicit test rather
than an explicit comment.

## Presets on top of an absolute-valued field

`widthProfile` stores ABSOLUTE widths — `{ t, width }` in px — and documents are already saved that
way. The tidier model for presets is multipliers of the stroke weight, but switching the field's
meaning would silently rescale every existing drawing, so presets materialize into absolute widths
against each element's current weight instead.

Two consequences worth designing around rather than hiding. A profile does not follow a later
change to `strokeWidth` (re-pick the preset to re-fit), which the help doc says outright. And on a
mixed selection each element must be materialized against **its own** weight — using one shared base
would flatten a thin and a thick stroke to the same thickness, which is a subtle wrong-looking
result rather than an obvious bug, so it has its own test.

Keeping multipliers ≤ 1 is what makes the presets swappable: the widest point of every profile is
the weight you already set, so flipping between them shapes the stroke without changing how heavy
the artwork reads.

## A picker for a visual property should show the thing, not its name

"Chisel" and "waist" mean nothing until you have seen them. The profile picker draws each preset's
own multiplier curve as a small ribbon, so the swatch and the applied result come from one
function and cannot disagree. It also has to be able to say **Custom** — showing the last preset
picked after the user has dragged width points by hand would be a lie about the document's state,
so detection compares against every preset as a fraction of the weight, with a tolerance loose
enough to survive a round trip through a saved file and tight enough that a real edit shows up.

## Two test bugs that looked like product bugs
`setWidthProfile()` with no ids operates on the selection — and the test never selected anything, so
it returned 0 and the failure surfaced as a *history* assertion. Asserting the call's return value
first turns that into an obvious "you changed nothing" instead. Separately, a Properties-panel group
is absent from the DOM entirely when the panel is closed, so `toHaveCount(0)` "passes" for the wrong
reason; the negative test now opens the panel first, so absence means "not offered" rather than "not
rendered".

## An omitted key is not a deletion (and a counter is not a dependency)

Both bugs from the Callipeg pick-up work are the same mistake wearing two hats: `setStore` on
`animTimeline` **merges**, so the object you hand it is a patch, not a replacement.

As a patch, `{ ...tl, markIn: undefined }` deletes and `const { markIn, ...rest } = tl` does
nothing — the second has no `markIn` key for the merge to walk, so the old value survives. As a
reference, `store.animTimeline` is therefore *stable across every structural edit*, which means
`tl()` inside a `createEffect` is not a dependency on the timeline's contents. The timeline panel
had been getting away with it for a year because edits normally move the playhead or the selection
too, and those it did track. Change only the frame count and the canvas never redrew.

The lesson that generalises: when a store merges, write the shape of the *change*, and get your
reactivity from something that actually changes. `animTimelineRev` was already the intended answer
and was already documented as such — it just wasn't a signal, so it could serve caches (which
compare it) and not effects (which need to track it). Making it `createSignal` fixed the second bug
and cost nothing on the first.

## Test setup has to fight the same merge

Four store-level test files seed `setStore('animTimeline', {...})` in `beforeEach`. Optional keys
the new object omits — `markers`, `markIn`, `newCelFrames` — leaked from the previous test, so the
suite passed or failed on file order. `setStore('animTimeline', null)` first, then the object.
Worth doing everywhere this store is seeded; a green suite that depends on test order is a slower
version of no suite.

## Out of pegs works because nothing else can see it

Callipeg's best idea ports cleanly precisely because it is *display-only*: `AnimKeyframe.peg` is
read in exactly one file (`utils/onion-skin.ts`) and nowhere else. Playback, export, hit-testing
and the HTML player need no changes and cannot be wrong about it. The test that matters isn't
"does the ghost move" — it's "snapshot every element, drag the ghost, and diff": if a single
coordinate changed, the feature is an edit tool by accident.

The one honest compromise: ghosts are rendered per pegged layer in separate passes, so a pegged
layer's stacking against un-pegged ones is approximate. That is fine for a reference image whose
entire purpose is being out of place.

## Callipeg's timing vocabulary is the part worth copying

Reviewing a raster app for a vector app, the temptation is to port the drawing features. The
transferable half was all *timing*: exposure (set a cel's duration), split-on-N ("shoot this on
twos"), a default new-cel length, in-betweens, and flipping cel-to-cel rather than frame-to-frame.
None of it cares whether a cel holds pixels or vectors. What did NOT port — alpha lock, rasterise,
transform quality, PSD/TGA export — is exactly the raster-specific half, and skipping it up front
kept the work to five features instead of fifteen.

# v0.8.202 — a conversion that changes what you see isn't a conversion

## Two render routes, one document style, and a feature caught in between

Text is drawn by the font renderer; paths are drawn by rough.js when the document is in sketch
style. Every "convert X to a path" feature therefore has to answer a question the code never
asked out loud: *does this shape's appearance survive the conversion?* For every other shape it
does — a rectangle already rendered sketchy, so its path does too. For **text** it does not,
because sketch never touched glyphs in the first place. `convertTextToOutlines` inherited
`renderStyle` along with everything else via `...el` and produced a word that looked mangled the
instant it was converted, with no edit having been made.

The generalisable rule: an in-place conversion must preserve *appearance*, not *properties*.
Copying the property bag is the easy read of "same shape, new representation" and it is wrong
whenever the two representations don't honour the same properties. Worth auditing anywhere else
a type change crosses renderers.

## Invisible hit targets are worse than visible clutter

The Selection tool used to paint every path anchor **and** hit-test them ahead of the resize
grips. Those are two decisions, and they were only defensible together. Removing the drawing
alone would have left invisible traps sitting on the bounding-box corners; removing the
hit-testing alone would have left squares that do nothing. When a feature is a
draw+hit-test pair, they move together or not at all — and the ordering comment ("checked BEFORE
the bbox handles so an extreme anchor wins") is exactly the line that turns into a bug the moment
the drawing goes away.

## The tool split was already there; only the chrome hadn't noticed

The complaint was "can we have a selection tool and a node tool like every other app". Yappy has
had a Node tool since 0.8.16x — `N`, its own overlay, its own options bar. What made it read as
*not* having one was the Selection tool doing half the Node tool's job. Feature parity with the
reference apps was never the gap; role separation was. Before building the thing a user asks for,
check whether it exists and is being undermined by something else.

Double-click as the way in matters more than it looks: `N` is unguessable, and the gesture is
already "open what this object contains" everywhere else in the app (groups, symbols, compound
shapes). A path contains nodes.

# feat/i18n-seo — the second and third locales (German, Japanese)

## "677/677 keys" is a type-system fact, not a translation fact

A locale file declared `const de: Dictionary` (not `Partial<Dictionary>`) cannot compile with a
key missing, so completeness is free and permanent. What the compiler cannot see is a key whose
*value* is still English — that type-checks perfectly. The check that actually finds work left
undone is a value-identity diff against `en`, and it has to tolerate legitimate matches: German
keeps Text, Server, Router, Browser, Container, Marker, Dropdown, Lasso, Wireframe. German came
out at 31 identical values and every one was correct; Japanese at 3, all standards (Kubernetes,
CDN, UML). A locale whose identical-count is *zero* is the suspicious one — it means someone
translated a product name.

## Japanese has one plural form, and the unused branch still has to be right

`Intl.PluralRules('ja').select(n)` answers `"other"` for every number, so `statusBarCount.one`
is never selected in Japanese — it is dead code the day it is written. Leaving the English
singular there is invisible in the app and invisible in tests that only assert the rendered
string. It stops being invisible the moment a locale's rules change or the forms get reused, so
both forms are written out identically (`{{count}} 個の要素`) and a test pins `plural(1, …)` as
well as `plural(3, …)`. The reverse also holds: German is the locale where the singular/plural
split is a *noun declension* (Element/Elemente), which is why the pair exists at all.

## A modifier name translated inside prose splits the UI against itself

The rule is that key combinations are not translated — they name physical keys. But seven German
tooltips embed the combination inside the sentence ("Rückgängig (Strg+Z)"), and translating the
sentence translated the modifier with it. The result is a German UI that says **Strg+Z** in the
toolbar tooltip and **Ctrl+Z** in the command palette on the same screen, because the palette
renders its key column from the registry, which is deliberately not translated. No test catches
this: both surfaces are individually correct. It only shows in a screenshot with both visible.
Strg is the right German word — the palette is the surface that is lagging — but it is concrete
evidence for the open D4 decision (`docs/i18n-seo-plan.md` §6): modifier names and the prose that
lives in the `keys` field ("Double-click a path", "Toolbar button", "or") need tokenising before
a locale can be internally consistent.

## Phase 1b — 14,696 lines of JSX prose became 31 Markdown documents

The conversion itself was mechanical; everything that mattered was in refusing to
trust it. Three rules did the work:

**A converter that silently drops a paragraph looks exactly like one that worked.** So
nothing was eyeballed. `scripts/help-doc-verify.mjs` renders each `.md` through the real
renderer, reduces both sides to a normalized word stream, and diffs them — then compares
structural counts (tables, rows, cells, code blocks, key caps, tips, list items,
headings, `<strong>`). Text equality alone is not enough: a table flattened into prose
has identical words. That second check is what caught nine list items in `animation-doc`
turning into two code fences, because a nested list indented past four spaces is an
indented code block in Markdown.

**Make the converter throw, not guess.** Every unknown tag, class or attribute aborted
that document with a filename and a snippet. The failures were the work list: `<p
class="tip-box">` (24 files authored admonitions as paragraphs, not divs), `<div
class="code-block">` wrapping a `<pre>`, bare `<kbd>`, a `colSpan`, a header holding a
second paragraph. Each one would have been a silently missing box or lost sentence.

**Two parser bugs worth remembering, both from treating JSX as text.** Counting
parentheses from `return (` breaks on the first `(a straight line)` in the prose — the
tag parser has to decide where the root element ends. And `{/* WHAT'S NEW */}` contains
an apostrophe: skipping quoted strings inside a `{…}` expression without handling
comments first swallows the rest of the document.

## Chunk names are load-bearing, and renaming a file can undo a precache fix

`vite.config.ts` excludes lazy, heavy chunks from the workbox precache by matching their
filenames — `-doc-` covered all 31 help documents while they were `*-doc.tsx`. Markdown
renamed every chunk to `<slug>-<hash>.js`, the pattern stopped matching, and the precache
grew from 4,842 KiB to 5,428 KiB: 586 KiB added to every visitor's background download,
for content most of them never open. This is the documented precache incident repeating
through a rename that had nothing to do with caching.

The build still succeeded and the app still worked, which is exactly why it needs a rule:
**a filter that identifies code by filename must not depend on a name chosen for another
reason.** Help-doc chunks now get an explicit `helpdoc-` prefix from `chunkFileNames`, so
the exclusion survives any future renaming. Worth checking the precache size on any change
that renames chunks — it is one line of build output and it moved by half a megabyte.

## An unreachable document is invisible in every way except a directory listing

`bpmn-doc.tsx` — 577 lines, kept current through the two-audience docs pass — was never
added to the `shapeDocuments` registry, so nothing linked to it and nobody could open it.
It surfaced only because the conversion walked the *directory* and found one more file
than the registry had entries. Nothing else would have found it: it compiled, it passed
tests, and it was maintained. When a registry and a folder can disagree, something will
eventually be in one and not the other — the same failure the locale drift guard exists
to catch, one level up.

# Phase 2 — the site stops being one URL

## A hash router does not have URLs, it has one URL with a bookmark in it

`/#/help/uml` is, to a server and to a crawler, a request for `/`. Everything
after the `#` never leaves the browser. So the entire documentation site — 31
documents, 14,000 lines of prose — was a single indexable page whose canonical
said `https://yappydraw.com/`. No amount of writing would have changed that, and
no keyword meta tag was ever going to.

Three things had to land together for any of it to mean something: real paths (a
URL to index), prerendering (HTML that contains the prose without running 3 MB of
JavaScript), and a per-page `<head>` (a canonical that does not claim every page
is the home page). Each is useless alone. That is why they are one phase.

## The prerendered page must not load the app, and only a test says so

The point of a static doc page is that it costs ~26 KB and paints immediately.
Nothing on screen distinguishes that page from one that also pulls the editor
bundle — the page looks identical, it just costs a hundred times more and blocks
LCP. So the assertion is explicit: the built page contains no `assets/index-`
reference and no `type="module"` script. It is the one property the whole
exercise buys, and it is invisible in a browser.

## Soft 404s are worse than 404s, so the fallback rule has to be narrow

The reflex when moving an SPA to real paths is a catch-all rewrite to
`index.html`. That answers 200 for `/help/anything-at-all` and renders the app,
and Google indexes each one as a duplicate of the home page. Since `/help/…` and
`/learn/…` are prerendered in full, the only path that needs the SPA is
`/examples/<id>/` — so that is the only rewrite, and everything else reaches a
real `ErrorDocument 404`. The narrow rule is also the honest one: if a document
is missing, the deploy is broken and the 404 says so.

## Two hostnames serving the same site with no redirect

`yappydraw.com` and `www.yappydraw.com` both answered 200 with identical content
and no redirect between them, while the pages' canonical named the apex. Every
inbound link to a `www` URL was pointing ranking signal at a hostname the site
itself disclaims. A 301 in `.htaccess` costs one rule; the reason it went unnoticed
for so long is that it is invisible from a browser — both hostnames just work.

## Prerendering is what makes the Markdown conversion pay

Phase 1b looked like tidying: 14,696 lines of JSX became Markdown and the app
behaved exactly as before. What it actually bought is that a Node script can now
render those documents to HTML without a browser, a component framework or a DOM.
`renderHelpDoc` is a pure function over a string; the prerenderer imports the same
one the Vite plugin uses, so the indexable page and the in-app page cannot drift.
Had the docs still been Solid components, the prerenderer would have needed SSR,
hydration and a second rendering path to keep in sync — which is where "the static
page says something different from the app" comes from.

## A sub-pixel error is not small if the thing is drawn in world space

The sketch corners were off by 0.85 px at the default sloppiness — the kind of number that reads
as a rounding artifact and gets waved through. But RoughJS geometry is generated in world units
and then scaled by the view transform, so the error is multiplied by the zoom: at 5× it is 4 px,
next to a stroke that is itself only 20 px wide, and it looks like a broken shape rather than a
hand-drawn one. Anything generated in world space has to be judged at the zoom a user will
actually inspect it at, not at 100%.

The corollary caught the second half of the same bug. `preserveVertices` put both ends of every
edge in the same place, and the corner still showed a nib — because RoughJS strokes each edge as
its own line and the canvas default is a butt cap with no join. Two fixes, one symptom; measuring
the geometry (0.85 → 0.00) proved the first one worked while the screenshot still looked wrong,
which is how the second one got found instead of being declared fixed.

## The default that only applies somewhere else

`roughness` defaulted to 1 while `renderStyle` defaulted to `architectural` — a style that ignores
roughness entirely. So the default was invisible in the product's default state and only appeared
once the user changed something else, at which point it looked like the app had decided for them.
Defaults that are inert under the shipped configuration do not get exercised, so nobody notices
they are wrong; worth checking any setting whose effect is gated on another setting's value.

## A shape parameterised on one axis is a shape that breaks on the other

The cloud computed every arc radius from the width — `w * 0.2`, `w * 0.25`, `w * 0.3`. That is
fine while the box is roughly square, which is how anyone testing a new shape draws it. Drag it
wide and short and the radii are suddenly larger than the height can hold; SVG clamps them, and
the outline collapses into something that is not a cloud at all. The rule that came out of it:
if a shape's geometry mentions `w` without a matching `h`, it has a hidden aspect-ratio
assumption, and the failure only shows up in the drag that nobody tried.

The fix generalises better than a second magic number would: derive each arc from the CHORD it
has to span, so the radius is a property of the two points rather than of the box. It cannot
over-inflate, and it follows any aspect ratio for free.

## The fallback was wrong and the fast path was right

The checkmark drew as a triangle because the JS geometry returned it as a closed shape. The WASM
implementation of the same shape had it right — its `OPEN_SHAPES` set has always included the
checkmark. WASM is the *optional* path here, off by default, so the code that shipped to everyone
was the one with the bug, and the one nobody runs was correct. Parity checks tend to be written as
"does WASM match JS"; this is the case for reading them the other way round too.

## A branch below an unconditional return is dead code that still compiles

`propertyPanelTarget()` had a perfectly good "show the defaults for the active drawing tool"
branch, sitting underneath a slide check that returns for every paged document — which is the
default document type. So the feature existed, was reachable in no real session, and its absence
showed up as a usability complaint ("it took me a long time to find Polygon Sides") rather than as
a bug report. Ordering in a chain of early returns is behaviour, not style: the branch that can
never be reached looks exactly like the branch that works.

## Selected is not the same as editable

Pasting set `store.selection` correctly and the object still could not be touched. Two other
things gate editability and neither is the selection: `selection-renderer` draws handles only
under the selection tool, and the canvas only routes a drag to move/resize for `selection` and
`lasso`. So "is it selected?" is the wrong question to verify a paste with — the state was right
and the feature was broken. The check that would have caught it is behavioural: *can the user
now grab this?*

The generalisation is a rule about endings. Any command that **produces an object to place**
rather than a stroke to draw — paste, drop, import, select-all, finishing a pen path — has to
leave the user able to act on what it produced, which means arming the selection tool. The
codebase already knew this: select-all, pen-finish and image-placement each did it. Paste was
simply never brought into the convention, and each of those call sites had solved it privately
instead of there being one place to route through. When the same three lines appear in three
features and a fourth is missing them, that is a missing shared exit, not three coincidences.

## The order of "switch tool" and "set selection" is not arbitrary

`setSelectedTool` clears the selection on its way into most tools, and `exitAllToolModes` can
drop it as well. Select-then-switch therefore silently discards the very thing you just pasted,
and it fails *invisibly* — the paste works, the elements exist, only the selection is gone, which
reads as "paste doesn't select" rather than as an ordering bug. Switch first, select second. Any
helper that does both needs a comment saying why, because the wrong order looks equally correct.

## A helper that selects should be asked what it selects *for*

`importSvgToCanvas` selects the shapes it just imported — reasonable in isolation, wrong when the
caller drops four SVGs in one gesture, because each call overwrites the previous file's selection
and only the last survives. A per-item helper that owns a document-wide piece of state cannot get
multi-item callers right; the caller has to collect and select once at the end. Worth checking
whenever a loop calls something that sets selection, focus, active layer, or any other singleton.

## Hiding the button is not switching the feature off

Teaching mode's first draft hid the Vector Tools, Shape Builder and Pathfinder buttons and
called it done. Every one of those tools is also bound to a keyboard shortcut, reachable from
the command palette, and callable from `Yappy.*` — so the mode looked clean and was porous.
Worse than porous: a trainee who fat-fingers <kbd>P</kbd> lands in the vector Pen, and the mode
has just hidden the only visible way back out. The guard has to sit at the choke point every
route funnels through (`setSelectedTool`, `toggleShapeBuilder`, `toggleVectorToolsPanel`), not
at the buttons. A rule for any "simplified mode": list the ways in, not the ways it shows.

## Whitelist when the type is open-ended

`ToolType` is `ElementType | 'lasso' | 'crop'`, and `ElementType` is several hundred entries —
every UML, BPMN, wireframe and cloud shape — with more added most releases. A blacklist of
"tools Teaching mode hides" would spring a leak every time a shape was added, silently and in
the mode whose entire promise is that the surface is small. The whitelist inverts the failure:
a new tool is off in Teaching mode until someone puts it on the list deliberately. Whenever the
set you're gating grows on its own, the safe default is the one that fails closed.

## Where a mode intervenes is a function of how many read sites there are

Teaching mode has to make `showDimensions` and `showPathfinderBar` inert. The obvious way is to
read around them — "…and not teaching mode" — but those two are consulted at eleven sites across
four files, so that is eleven chances to miss one, and each miss is clutter in the mode built to
remove it. Forcing the settings off instead means every existing check keeps working untouched.

The price of forcing is that the mode must not eat the user's preferences, so leaving it has to
give them back — which means snapshotting them, and snapshotting to `localStorage` rather than a
signal, because the mode survives a reload and a trainer who refreshes mid-session would
otherwise lose the settings they had before it. The snapshot then needs one more thing that is
easy to miss: entering the mode twice must not re-snapshot the already-forced values, or the
second entry overwrites the record with `false` and the restore silently returns nothing. That
is the case the test suite earns its keep on.

## Label-matching filters need a test that the labels still exist

Removing the professional entries from the context menu is done by matching label text once on
the way out, rather than guarding twenty `push` sites across several builders. The weakness is
obvious: rename an entry in the builder and the filter stops matching, with no failing test
anywhere and a Pathfinder quietly back in Teaching mode. The fix is cheap — read the builder's
source in the test and assert every label the filter names still appears in it. The module could
not be imported (it pulls in Solid components that the runner cannot load), but it could be read,
and reading was enough. When a test can't reach the runtime, the source text is still evidence.

## A check that always fails is a check nobody reads

`verify:deploy` defaulted to a hostname the host had quietly broken, so it returned seven
failures on a healthy deploy — and the fix was not to lower the bar but to move it: default to
the apex host (the one the canonical tags name, so the one that has to be right), and add a
single targeted check for the actual defect. One precise red line survives; six misleading ones
are gone. Silencing the alarm and aiming it properly look similar in the diff and are opposites
in effect.

The cost of the old state was not theoretical. This script already had a documented standing
failure — "expect `sw.js is cacheable`, wave it through" — and that habit is exactly why nobody
noticed the host had **fixed** it. Real news arrived on a channel we had trained ourselves to
skim. Any "known failure" in a check needs an expiry date, or at least a re-read: the thing it
excuses may have changed.

## Same build, different hash — comparing artefacts across build trees proves nothing

Checking whether a release had landed, the live `index-*.js` hash was compared against the local
`dist/`. They differed, so the deploy looked stale. It was not: the host builds from the *cleaned
OSS copy*, a different source tree, which legitimately produces different chunk hashes for
identical behaviour. (The tell was there — the CSS hash matched, and the release touched only
TS/TSX.) What actually settled it was reading the deployed bundle for the feature's own strings.
A content hash only identifies a build within the tree that produced it; across trees it is
noise, and treating it as an identity check invents problems that are not there.

## "Not in this file" is a claim about the whole file

The www hostname was a dead link for two releases because the first investigation read the
first 60 lines of a 115-line `.htaccess`, found no www rule, and concluded the cause had to be
a setting on the host. The rule was at line 100. That conclusion then hardened: it went into
`CLAUDE.md` as an expected failure, into the bug log, and into a release note — three documents
all confidently recording a diagnosis that one more `grep` would have overturned. A negative
claim about a file needs the whole file; a partial read supports "I did not find it here yet",
which is a different sentence.

## Apache's `%N` points at the last matched condition, not the one with the group

```apache
RewriteCond %{HTTP_HOST} ^www\.(.+)$ [NC]
RewriteCond %{HTTPS} on
RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L]
```

`%1` here is empty, because backreferences resolve against the **last** `RewriteCond` that
matched — `%{HTTPS} on`, which captures nothing. The redirect therefore emitted `https://` plus
the path and no host at all. Conditions are ANDed, so the fix is free: put the capturing one
last. The general shape is worth remembering because it reads as correct — the group is right
there on screen, three lines above the thing that uses it, and nothing warns you.

## A bug the browser hides is a bug you need a machine to see

Typing `www.example.com` into an address bar usually autocompletes to an apex URL already in
history, so the www hostname can be completely broken while every human who checks it reports
that the site works — which is precisely what happened here, and the honest report ("I am typing
www and it's working?") is what reopened it. `curl` on the full URL refused outright:
`Could not resolve host: help`. When a user's experience and a protocol-level check disagree,
they may both be accurate about different requests; find which request each one is actually
making before deciding who is wrong.

## `min`/`max` on a number input is a spinner constraint, not a validation rule

The undo-depth field declared `min="10" max="500"` and its handler clamped to `Math.max(1, …)`.
Both were visible on screen at once and they disagreed, because the HTML attributes only bind
the spinner arrows — a typed value walks straight past them, and `valueAsNumber` hands it to you
unchallenged. The attributes are the *advertisement*; the handler is the *enforcement*, and if
they differ it is always the handler that wins. Anywhere a numeric bound matters, the attribute
and the clamp should come from the same constant, which is what they do now.

## Clamp on the way in, or memory and disk will disagree

The obvious place to add the missing clamp was the persistence branch — it is the line that
writes the value out. But `updateGlobalSettings` sets the store *first* and persists *second*,
so clamping there would have stored 10 in localStorage while the live setting held 3 until the
next reload: the original bug, plus a new inconsistency, dressed as a fix. Normalising at the
top of the function is the only spot that covers every caller and keeps the two copies equal.
When a function both mutates state and mirrors it somewhere, input validation belongs before
the first of those, never between them.

## "Has a CVE" and "is exploitable here" are different questions

Two HIGH advisories sat on the OSS repo for weeks, surfacing on every push. Both were genuine
and correctly reported, and both were completely inert in this project: `image-size` reaches us
only through `pptxgenjs`, which excludes it from browser builds in its own manifest
(`"browser": { "image-size": false }`), and the app is client-only. Acting on the severity label
alone would have meant downgrading the PowerPoint exporter three major versions — npm's only
proposed remedy — in exchange for nothing at all.

The check that settles it is cheap and should precede any dependency change made "because of a
security alert": read the parent package's `browser`/`exports` field to see whether the code is
even included, then grep the built output for a fingerprint of it. Here that was six string
patterns across 160 bundles, all zero. Trusting the manifest alone would have been an argument;
the grep made it a fact.

The corollary is about the alert channel rather than the alert: a warning that recurs and is
never actioned trains everyone to scroll past it — the same failure that let a fixed `sw.js`
header and a broken www redirect hide behind "expected failure" earlier in this same session.
Dismissing with a documented reason is not sweeping it under the rug; it is the only way the
next real alert stands out.

## A guard nothing invokes is not a guard

The i18n ratchet was built in Phase 1a for exactly one purpose: fail when new hardcoded English
enters `components/`. It did its job perfectly and reported to nobody. There is no CI in this
repo, no hook called it, and `npm run i18n:lint` is not a command anyone types unprompted — so
Teaching Mode's three untranslated strings sailed through four releases with the ratchet red the
whole time. The plan had even recorded the gap when the tool was written ("needs a workflow, or
a pre-commit hook, when one is set up"), which is the part worth sitting with: the weakness was
known, written down, and that was mistaken for handling it.

This is the third instance of one shape in a single session — a fixed `sw.js` header nobody
noticed, a `verify:deploy` default pointed at a broken hostname, and now this. In each case a
signal existed and nothing was listening, and the silence read as good news. **When you build a
check, the same change has to answer "what runs this, and what happens when it fails?"** An
unwired check is worse than none, because it buys the feeling of coverage at full price.

## Translate properly or do not add the key

Extracting the Teaching Mode strings meant writing them in four languages, and the tempting
shortcut was English placeholders in `de`/`es`/`ja` to be "translated later". That would have
been worse than leaving them hardcoded: hardcoded English is visibly untranslated, whereas an
English string sitting in `ja.ts` claims to be Japanese and passes every structural check —
including the parity test that only compares key sets. The type system enforces that keys exist,
never that the values mean anything. Placeholders are the one failure this architecture cannot
catch, so they are the one thing not to add.

## Port the idea, not the regex

`parts()` came from yappykit, where a token is `{name}`. This codebase uses `{{ name }}` —
that is what `resolveTemplate` and `plural()` consume. Copying the function verbatim would have
compiled, passed any obvious test, and produced a `parts()` that disagreed with `t()` about what
a token even is: the same template interpolating one way and splitting another, with nothing on
screen to explain why. A borrowed function inherits its original codebase's conventions, and the
conventions are the part that does not travel. The test that pins this asserts the *negative* —
that `{token}` is deliberately not recognised — because that is the behaviour a future copy-paste
would quietly restore.

## Resumability is a requirement the moment the job outgrows one run

The translation script processes ~681 keys per locale in batches against a paid, fallible API.
Written as a straight loop it would have been correct and unusable: any failure at key 400 —
rate limit, refusal, dropped connection — throws away 400 keys of spend and starts again. Saving
the table after every batch, and treating "already in the table" as "already done", turns the
failure mode from catastrophic to boring. The rule generalises past this script: when a job is
long, external, and costs money per unit, the checkpoint is not an optimisation to add later, it
is what makes the first version worth running.

## The parser that silently agrees is the dangerous one

Two scripts now read `en.ts`: the linter's baseline walk and the translator's. They must agree on
what a key is, because the translator emits a table the scaffold consumes — a disagreement would
show up as a translation gap, not as a tooling error, and would be debugged in the wrong place.
The first version dropped exactly one key (`statusBar.whatsNew`, double-quoted because it
contains an apostrophe) and reported 680 where the file has 681. Nothing failed. The count in the
output was the only evidence, and only because it was printed at all. Any hand-rolled parser
should announce what it *could not* read, not just return what it could.

## A placeholder is not a free intermediate step when a coverage gate exists

Extracting 63 Settings strings meant either translating them into three languages or scaffolding
them as English with `// TRANSLATE` markers. The markers are the project's own convention and
look like the cheap first step — but `SUPPORTED_LOCALES` gates the language picker at 95%
coverage, and 63 untranslated keys takes `de`/`es`/`ja` from 100% to roughly 92%. The "cheap"
option would have silently pulled three shipped languages out of the picker, turning a
translation task into a visible product regression.

Worth generalising: a partial-work marker is only free while nothing downstream measures
completeness. Once a gate, a badge, or a progress number reads the same data, "I'll fill it in
later" has a cost that lands immediately and somewhere else.

## The convention you are following may already exist — go and look before you invent one

Translating a tooltip that mentioned `Ctrl+Shift+T`, I wrote `Ctrl` in German. The codebase had
already settled that question six times over: `statusBar` and the help dialog all say `Strg`,
while `Shift` and `Alt` stay untranslated. My string made `de.ts` the only locale carrying two
conventions, and it shipped. Nothing catches this — the type system checks that keys exist, the
parity test checks that key *sets* match, and neither has any opinion about whether the values
are internally consistent.

The cheap habit that would have caught it: before writing a translation containing a term that
recurs — a modifier key, a tool name, a menu word — grep the target locale for that term first.
Precedent in the file beats reasoning from scratch, and where there is no precedent, that absence
is itself the finding.

## Stopping at the decision boundary is part of doing the work

Two thirds of the way through `menu.tsx` the remaining strings turned out to embed key names —
`Delete (Del)`, `Alt+Enter` — where no locale has an established form. Finishing the file would
have meant inventing one, and the invention would have propagated: the `hotkeys` namespace alone
is 189 strings that would then be "consistent with" a choice nobody made deliberately. Extracting
the 68 labels and leaving the 19 tooltips is a worse-looking result and a better one — the work
that was unambiguous is done, and the ambiguity is now a concrete question with two named options
instead of a paragraph in a planning doc.

## "The middle of the screen" is three different numbers, and only one of them is right

A figure dropped from the Stick Figures panel landed near the right edge. The cause was not a
placement bug in the panel — it was that the drop point was defined against the wrong rectangle.
There are three plausible centres in this app and they are all in use:

- the **window** centre (`innerWidth / 2`) — what `utils/image-actions.ts` and
  `components/symbols-panel.tsx` still use;
- the **client** centre of the drawing area (`canvasCenterClient()`), which is the window minus
  the docked chrome, in page coordinates;
- the **canvas-local** centre — the same rectangle, but in the coordinates the view transform is
  actually defined in.

The last one is the only one that can be un-projected to a world point. The canvas element is
*positioned* by the dock insets (`marginLeft/Top`), and `getWorldCoordinates` subtracts its
bounding rect before applying pan/scale — so the world point under the centre of the drawing area
is `(width / 2 - panX) / scale`, not `(insetLeft + width / 2 - panX) / scale`. Three call sites
that place the symmetry axis "where the user is looking" (`app.tsx`, `command-registry.ts`,
`app-store.centerSymmetryOnView`) do un-project the client centre, and are off by the left inset
for it. `status-bar.tsx` uses the client centre too but is *self-consistent* — it projects and
un-projects with the same point, so its zoom anchors correctly on a point that merely isn't quite
the centre.

The general shape: when a value is right in one coordinate space and wrong in another, a helper
that returns the raw rectangle invites every caller to do the conversion, and some will do it
differently. `canvasCenterWorld()` returns the finished world point instead, so there is nothing
left to get wrong at the call site.

Second thing worth keeping. The bug reproduces **without the user doing anything**: opening a
right dock shrinks the canvas but does not move the view, so the page silently slides off-centre
inside the drawing area. Any "centre on the page" default is really "centre on the page, assuming
the page fills the screen" — an assumption that a dockable-panel layout invalidates the first time
a panel opens. Prefer "centre of what is visible" for anything inserted from a panel; the user is
looking at the viewport, not at the page.

## The test environment resolved a different build than the browser, and it was the forgiving one

`bun test` runs with no `browser` export condition, so `solid-js/store` resolves through its
`node` condition to `dist/server.js` — the SSR build, where a store is a plain object with no
proxy at all. In the browser it resolves to `dist/store.js` (or `dev.js`), where the proxy
answers a direct property write with `set() { return true }`: accepted and discarded.

So `layer.order = idx` on a store entry **works in the tests and does nothing in the app**.
That is how bug #331 lived in `reorderLayers` for its whole existence with a green suite: the
one environment that could have caught it is the one place it does not reproduce.

The first regression test I wrote for it drove the real store and asserted the resulting
`order` — 7 tests, all passing, against code that was broken in every browser. Passing was the
bug. What saved it was the habit of checking that a new test **fails against the old code**;
it didn't, which is what exposed the resolution difference rather than confirming the fix.

Two things worth carrying:

- **A regression test that has not been seen to fail is not yet a regression test.** Run it
  against the broken code before believing it. This is the second time that check has caught
  something in this repo (the first: an audit tool whose own sampler was wrong, which would
  have reported nine false regressions).
- **When a test and the app disagree, suspect the environment before the assertion.** Module
  resolution, export conditions and dev/prod builds can hand the two different code. The fix
  here was not to reconfigure the runner — that would change resolution for 1151 tests to pin
  one function — but to remove the dependency on the difference: `reorderedLayers` is pure and
  returns fresh objects, and the tests assert it leaves its input alone, which is true under
  both builds and false under both for the old code.

## A signal too vague to be wrong is also too vague to be checked

The Layers panel highlighted the row you were dropping onto. That claims roughly "something
happens here" — a claim weak enough that it is never visibly false. Replacing it with an
insertion line between two rows makes a precise claim: *this* is where the layer lands.

The line was in its first minutes of existence when it caught #331 — a bug that had been in
`reorderLayers` since the function was written, through every release, unreported. Nothing
about the reorder changed; what changed is that the UI started making a statement specific
enough to be contradicted.

Worth remembering when weighing a "nice-to-have" precision improvement against the work it
costs: **precision is not only kinder to the user, it is a test.** Vague feedback hides bugs by
being unfalsifiable, and it hides them from the people best placed to notice — the ones using
the feature.

## Shipping a translation is not finished when the strings are translated

The French dictionary compiled, every key was present, the type system proved it,
and the UI read correctly in a screenshot. It was still broken: the command
palette matched with `toLowerCase()` alone, so a French keyboard could not type
the names of the commands it was displaying. The typographic apostrophe French
labels use (U+2019) and the straight one AZERTY produces (U+0027) never met.

**Translating the strings is the visible half. The other half is every place the
app COMPARES a string** — search, sort, filter, dedupe, URL slugs. Those were all
written against English, where lower-casing is very nearly enough, and they fail
quietly in any language where it is not. Nothing errors; results are simply
missing, which looks like "there is no such command" rather than like a bug.

Worth doing before declaring a locale done: type a few of its own labels into
every search box in the app, using the keyboard a native user would have.

## Two characters that look identical, and only one is right

`fr.ts` shipped its first draft with 102 instances of **U+02BC MODIFIER LETTER
APOSTROPHE** where French wants **U+2019 RIGHT SINGLE QUOTATION MARK**. They are
indistinguishable in every font. Unicode classifies U+02BC as a *letter*, so it
silently breaks word boundaries, collation and search.

It was found by counting characters in the file — `collections.Counter` over the
source — not by reading the UI, where seeing it is impossible by construction.
The same afternoon, a `*/` inside a block comment (`*fond*/*contour*` as markdown
emphasis) truncated that file's header and made Vite refuse to serve it, while
`tsc --noEmit` reported success.

The generalisation: **for a class of defect that is invisible on screen, looking
harder at the screen is not a strategy.** Both were caught by treating the source
as data and measuring it. When a file is generated or heavily hand-edited in a
language you are not reading natively, spend a moment enumerating what is
actually in it — character classes, placeholder counts, comment terminators —
rather than trusting that wrong things will look wrong.

## A verification that cannot fail for the reason you care about is decoration

`verify-deploy.sh` exists because the host once served two builds from one URL,
and it checks that thoroughly: eight samples, asset resolution, cache headers,
prerendered pages. It passed on two consecutive releases while looking at the
PREVIOUS one, because every check it ran was about the live site's internal
consistency and none was about its identity. A three-release-old build is
perfectly self-consistent.

This was caught only because the French chunk was fetched from production by hand
and returned 404 moments after the script said "Deploy looks good."

**When writing a check, ask what it would look like in the failure you are
actually afraid of.** Here the fear was "the deploy did not land", and every
assertion in the script was equally true whether it had landed or not. Coverage of
the surrounding conditions is not coverage of the condition.

A second lesson inside the fix. The obvious implementation — compare the live
entry chunk hash with the local `dist/` one — is wrong for this pipeline, because
the host builds from the cleaned copy `publish-oss.sh` publishes and legitimately
produces a different entry chunk. It would have failed on every good deploy, which
is the failure mode that teaches people to ignore a script (the same one the www
default caused on 2026-08-21, recorded in the script's own header). **The identity
signal has to be something both builds agree on** — the version string, not the
byte layout.

## A feature nobody can find is indistinguishable from one that does not exist

Three pieces of user feedback on colour arrived together, and two of them asked
for things the app already did.

The eyedropper is the sharper case. Yappy has a good one — better than the
browser's `EyeDropper` API on purpose, because that samples the composited screen
and hands back a P3 colour labelled sRGB (bug #296). It reads the authored colour
out of the document, falls back to the rendered pixel for gradients and images,
and is therefore exactly the tool for "take the blue off this reference photo I
pasted in". The report was *"add an eyedropper we can select colours from
references"*. It was two panels deep inside the Properties colour picker, which
is not where anyone matching a palette is looking.

The other was the reverse: a real gap, one line of data wide. `transparent` was a
swatch in one palette out of five, and the one people get by default (`p3`, on any
wide-gamut display) was not it — so the common experience was a palette that could
paint a colour and never remove one.

Two things worth carrying forward:

- **Discoverability failures arrive disguised as feature requests.** The useful
  response to "please add X" is to check whether X exists first; if it does, the
  bug is placement, and building a second X would have been the wrong fix twice
  over.
- **A default that differs from what you tested with hides the gap.** The
  transparent swatch was verified in `default` and the branch worked; nobody
  looked at the other four, and the default palette is chosen at runtime by
  display capability, so the developer's palette and the user's need not agree.
  When a default is computed rather than written down, test the computed one.

And a small structural lesson from the fix. The new control writes through one
store function (`setPaintColor`) that does the three things the old inline code
did in four places — apply to the selection, keep `fillStyle` coherent, and set
`textColor` alongside `strokeColor` for text, whose visible colour is
`textColor || strokeColor`. Every call site that skipped the third had the same
bug: setting a text element's colour appeared to do nothing, because a baked-in
default `textColor` outranked the `strokeColor` that had just been set.

## A half-built feature costs you nothing to keep, and something to show

The Arcade game builder has been in the menu since it was first sketched. It works, but it is
not finished, and every user who opened the menu paid a small price for that — a group of seven
entries that most of them will never use, sitting between the AI tools and the panels.

**Dev Mode** is the fix, and the interesting part is not the toggle. It is where the value lives.

`devMode` is a `GlobalSettings` field, so the obvious implementation is to read
`store.globalSettings.devMode` at each gate. That is the wrong shape twice over. It is not
greppable — three different sites reading the same field look like three unrelated conditions —
and it invites `?? true`-style defaults to drift apart between them. So the gate is a named
function:

```ts
export const isDevMode = (): boolean => store.globalSettings.devMode === true;
```

One place decides what "on" means, every WIP surface reads the same answer, and
`grep isDevMode` lists the entire hidden surface of the app in one command. That last property
is what makes the switch usable a year from now, when the features behind it are not the ones
that put it there.

Three things the implementation had to get right, none of which is the toggle:

- **A document must not be able to turn it on.** `loadDocument` spreads the document's
  `globalSettings` over the store, so a `.yappy` file saved by a developer carries
  `devMode: true` inside it — and opening a file someone sent you would unlock unfinished
  UI on your machine. The override (`gs.devMode = readDevMode()`) is one line next to the
  identical lines for `teachingMode`, `showDimensions` and `defaultTool`. It is the line the
  test suite actually protects: commenting it out is the only change to this feature that
  fails a test.

- **Hiding the entry point is not switching the feature off — and here that is deliberate.**
  Teaching mode does the opposite: it guards `setSelectedTool` so the shortcuts and the API
  hit the same wall as the buttons, because a mode that only hid buttons would strand someone
  in a tool with no way back. Dev Mode has no such hazard, so the game APIs, existing game
  documents and HTML export all keep working with it off. The rule is not "always guard at the
  choke point"; it is *ask what breaks if someone gets there another way*, and the answers
  differ.

- **Hide the separator with the group.** The `<Show>` wraps the `<div class="menu-separator">`
  as well as the group, because two rules with nothing between them is a visible seam that
  says "something used to be here".

The documentation had a related quiet bug. `arcade.md` said **Menu → Game Builder**; the menu
has said **Menu → Game → Build** since the group was collapsed, and nobody noticed because
nobody reads a help page for a feature they already know how to open. Gating a feature is a
good moment to re-read its doc — you are already asking "how does someone find this?", which is
the only question a help page exists to answer.


## A build that dies with no output is evidence, not an absence of it

The v0.8.234 deploy failed, and the host's own analysis opened with "the current logs are
null, making it impossible to diagnose the exact issue" — then diagnosed it anyway, blaming
missing `tsx`, missing `typescript`, missing `vite` and a bad tsconfig. Four confident
suggestions, all wrong, produced by a tool that had just said it could not see the error.

A fresh clone with `npm ci` built cleanly, which ruled out all four in about three minutes.
The actual cause was `vite build` peaking at ~2.2 GB and being OOM-killed. **The empty log was
the diagnosis**: a process that exits with an error writes one, and a process that is SIGKILLed
cannot. "No logs" narrows the field to things that kill rather than fail — OOM, timeout,
cancellation — and that is a much smaller field than "something went wrong".

Two things generalise.

**Measure both sides before blaming the diff.** The obvious story was that the release which
failed contained the change that broke it. Measured on clean clones, the previous release
peaked at 1.88–2.14 GB and the failing one at 2.17–2.24 GB — two ranges that overlap inside the
run-to-run variance of a single version. The predecessor had not been passing because it was
under the limit; it passed because it happened to draw 1.88 GB that run. Comparing one
measurement of each would have shown a 240 MB "regression" caused by ~35 lines of Markdown and
five locale strings, which is exactly the kind of number that is too large to be true and gets
believed anyway. **A single sample of a noisy quantity is a story, not a measurement.**

**A resource with no headroom and no measurement fails as a surprise, at the worst moment.**
Nothing in the pipeline had ever recorded how much memory the build took, so its slow climb
across releases was invisible until a production deploy died of it. The fix caps V8's heap
(`--max-old-space-size=1536`) for the one step that needs it — V8 grows lazily toward whatever
the machine offers, so 2.2 GB on a 64 GB box is laziness rather than need, and forcing
collection brings the peak to 1.65 GB. Two details made it safe to ship:

- **The floor was measured, not guessed.** 1024 MB and 768 MB both still OOM, so ~1.3 GB is the
  real requirement and 1536 is headroom rather than a lucky number. A cap chosen without
  finding the floor is the same cliff moved sideways.
- **The output was proved identical.** Every chunk in `dist/assets` was fingerprinted from a
  capped and an uncapped build; same hash. A change to how the build runs has to be shown not
  to change what it ships, or it is a bundle change wearing an infrastructure change's clothes.

The thing this did not fix is the reason the number keeps climbing: a 2.7 MB `index` chunk and
a 2.0 MB `export-game` chunk. The cap buys headroom; it does not buy a smaller app.

