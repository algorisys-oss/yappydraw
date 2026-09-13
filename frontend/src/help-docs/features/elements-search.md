---
id: elements-search
name: Element Search
icon: "🔍"
category: Design
description: Unified Canva-style search across icons, illustrations, shapes and photos — one blended grid, semantic keyword aliases, type chips, Alt+E, and the searchElements / insertElement API
keywords: element elements search unified panel icon icons lucide illustration illustrations fluent emoji microsoft shape shapes photo photos wikimedia template templates design designs card cards greeting birthday thank you congratulations congrats party invitation invite anniversary baby poster resume social blended grid chip chips all icons illustrations shapes photos templates alias aliases keyword semantic love heart money dollar coin wallet idea lightbulb bulb brain chat speech bubble secure lock shield goal target trophy find insert load apply editable vector recolour recolor mit licence license attribution free commercial use orientation landscape portrait square browse frames font pairing Alt+E hotkey shortcut command palette searchElements insertElement applyTemplate toggleElementsPanel api scriptable window Yappy
---

# Element Search

Type one word and get **everything** — icons, illustrations, shapes, photos and whole **templates** — in a single blended grid. Yappy's Elements panel searches across every asset library at once and understands natural words (search *“money”* and you get the dollar icon and the money-bag illustration, not just filename matches).

## Open the panel

- Press <kbd>Alt</kbd>+<kbd>E</kbd>, or
- Menu → **Elements**, or
- Command palette → *“Toggle Elements Panel”*.

## Searching

Type in the search box and results stream into one grid. Icons, shapes and illustration matches appear instantly (each illustration's picture loads the first time it is shown, then works offline); photos are fetched from Wikimedia Commons a moment later. Use the **type chips** — **All · Icons · Illustrations · Shapes · Photos · Templates** — to narrow the feed to one kind. When Photos is active, extra orientation chips (Landscape / Portrait / Square) appear.

:::tip
**Semantic keywords.** A hand-curated alias map expands your query into related concepts, so everyday words find the right asset even when it's named differently — e.g. *love → heart*, *money → dollar / coin / wallet*, *idea → lightbulb / brain*, *chat → speech bubble*, *secure → lock / shield*, *goal → target / trophy*.
:::

## What you can find

- **Icons** — the full Lucide line-icon set, inserted as editable vector paths.
- **Illustrations** — about **1,600** colourful flat illustrations from **Microsoft Fluent Emoji**: people and jobs, faces, animals, food, travel, objects, symbols, flags and more. Search by name or by keyword (*developer* finds the technologist, *celebrate* the party popper). Each drops in as a fully **editable, recolourable vector** — a genuine edge over flat graphics. The best matches are listed first, up to 60 per search; type a more specific word to narrow it.
- **Shapes** — rectangle, circle, triangle, star, heart, hexagon, speech bubble, arrow… (also aliased: *box → rectangle*, *bubble → speech*).
- **Photos** — openly licensed images from Wikimedia Commons. Click to insert or drag onto the canvas (drop onto a frame to fill it).
- **Templates** — whole ready-made designs (posters, cards, social posts, resumes…), including a greeting-card family (birthday, thank-you, congrats, party invite, anniversary, new baby). Each result shows a mini page preview. Clicking a template **loads it as the document** — since that replaces the current design, you're asked to confirm first if you have unsaved changes.

With no query, the panel shows a **browse view** instead: quick shapes, photo frames, a featured-icon set and font pairings.

## Licensing & attribution

Illustrations come from **Microsoft Fluent Emoji** (<a href="https://github.com/microsoft/fluentui-emoji" target="_blank" rel="noreferrer">github.com/microsoft/fluentui-emoji</a>), licensed **MIT** — you can use them in anything you make, including commercial designs, with no credit needed in the design itself. Photos are openly licensed via Wikimedia Commons with the source link retained on each inserted image.

:::note
About a dozen Fluent illustrations use gradients or clipping that the vector importer can't reproduce, so they are left out rather than inserted looking wrong. Inserting an illustration for the first time needs a connection; after that it works offline.
:::

## Scripting API

Everything the panel does is scriptable through `window.Yappy`:

```
// Open the panel
Yappy.toggleElementsPanel(true);

// Search every provider (icons + illustrations + shapes + photos)
const hits = await Yappy.searchElements('rocket');
// each hit: { kind, id, label, thumbSvg | thumbUrl, insert() }

// Restrict the scope (skip the async photo fetch)
const vectors = await Yappy.searchElements('money', { kinds: ['icon', 'illustration'] });

// Insert one onto the canvas (centre of the active page).
// Illustrations load their SVG first, so await it before reading the result.
await Yappy.insertElement(vectors[0]);
// …or at a specific world point
Yappy.insertElement(vectors[0], { x: 400, y: 300 });

// hit.insert() works directly too
hits[0].insert();
```

:::tip
`searchElements` returns a Promise — icons/illustrations/shapes resolve immediately, photos are appended when the network call finishes (pass `includePhotos: false` or omit `'photo'` from `kinds` to stay fully offline).
:::
