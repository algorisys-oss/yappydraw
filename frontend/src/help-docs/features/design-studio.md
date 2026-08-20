---
id: design-studio
name: Design Studio
icon: "🎨"
category: Design
description: "Canva-style design documents: pages & size presets, templates, Magic Resize, brand kit, unified elements search (icons/shapes/photos), text effects, AI assists, version history, offline PWA"
keywords: "canva design document page size preset instagram post story poster flyer business card template search fits badge my templates brand kit font pairing elements panel unified element search blended search icons shapes photos one box type a word alias love heart chat speech box rectangle frames photo frame heart star hexagon stock photos wikimedia orientation landscape portrait square drag drop crop aspect ratio 1:1 4:5 16:9 9:16 lock text effect shadow lift hollow splice outline echo neon glitch background highlight curved set as page background detach image background jpg jpeg png export current page only magic write ai image generate remove background replace background swap backdrop thumbnail indexeddb magic resize repurpose format magic edit inpaint magic expand outpaint extend photo ai design generate brief version history snapshot restore recents grid open drawing bullet numbered list rich text pwa install offline service worker app"
---

# Design Studio

Yappy's Canva-style mode: create **fixed-size, multi-page design documents** — social posts, posters, cards, resumes — with size presets, templates, a brand kit, an elements library, one-click text effects, and AI assists.

## Design documents & pages

**Menu → New Design…** opens the size picker: Instagram post/story, YouTube thumbnail, Facebook cover, presentation, A4/US Letter, business card, poster, flyer, or a custom width × height. A design document is paged — the **Pages panel** (left rail) adds, duplicates, reorders, and deletes pages; <kbd>Ctrl+M</kbd> adds a page. New pages inherit the document's page size.

With nothing selected, the property panel shows the active page — background, and under **Page Size** a preset dropdown plus width/height fields (resizing re-lays-out all pages so they never overlap). Every page in the panel shows a **live thumbnail** that refreshes as you edit (about a second after each change).

```
const Y = window.Yappy;
Y.newDesign('instagram-post');          // preset id …
Y.newDesign({ width: 800, height: 600 }); // … or explicit size
Y.getPageSizePresets();                  // list all presets
Y.addSlide();                            // add a page
Y.setPageSize(1280, 720);                // resize all pages
Y.exportPageToPng(0, 2);                 // export page 1 at 2x
```

:::tip
Export dialog → **PNG and JPG** show a **Current Page Only** option in paged documents — exact page bounds, page background included (JPG always exports on white). Leave it unchecked to export the **whole design**: every page is rendered at its full page bounds with its own background, stacked vertically (multi-page designs). PDF and PPTX export emit one file page per document page. SVG export includes the full page area and each page's background.
:::

**Page backgrounds:** drop an image onto empty canvas to set it as the active page's background. Right-click a selected image → **Set as Page Background** does the same; right-click empty canvas → **Detach Image from Background** turns the background back into a regular image element you can move, crop, and filter. `Y.detachBackgroundImage()`

## Design templates & My Templates

**Menu → Templates → Designs** holds 30+ ready-made designs — Instagram posts (product, quote, tips, testimonial, hiring, podcast, sale), stories (event, countdown, quote), YouTube thumbnails, deck title/section slides, webinar banners, posters, flyers (sale, café menu, open house), business cards, price lists, certificates, vouchers, and invitations — each opens as a design document at its native page size. A **search box** at the top matches names, descriptions, and tags across every category. In a design document, templates that **fit your page** (same size or aspect ratio) float to the top with a green *✓ fits* badge — and picking a size in **New Design…** opens the template browser automatically so you can start from a matching layout (or just close it for a blank page). **Save Current as Template** (in the template browser header) snapshots the whole document into **My Templates**; delete via the × on a card.

Every card shows a **real preview of the template's content**, drawn from the template's own elements — diagram cards show the diagram, design cards show the first page at its true aspect ratio, and a presentation card's strip previews each of its first four slides (with *+N* for the rest). Previews are simplified marks rather than a full render, so text appears as bars and sketch styling isn't applied — enough to tell layouts apart at thumbnail size. **Text Diagram** templates are YSL/Mermaid source, so they show a language badge instead of a preview, and **My Templates** cards use the real thumbnail captured when you saved them.

```
Y.getTemplates('designs');          // list design templates
Y.searchTemplates('poster');         // search by name/tag/description
Y.applyTemplate('design-poster-event');
Y.saveAsTemplate('My layout');       // → My Templates
Y.deleteUserTemplate(id);
```

## Cropping images

Select an image → property panel → **Crop Image** (Enter applies, Escape cancels). While cropping, **aspect-ratio presets** appear: Free, 1:1, 4:5, 3:4, 16:9, 9:16. Picking one snaps the crop to the largest centered rect of that ratio and **locks the ratio while you drag** the handles — Free unlocks. **Reset Crop** restores the full image.

## Brand Kit

**Menu → Brand Kit** opens the panel. A kit bundles five brand colors (primary/secondary/accent/background/text), a heading + body font pair, and a logo. The wand button extracts colors from the current document. **Apply Brand to Document** recolors everything (each color maps to the closest-luminance brand color, so light/dark structure is preserved) and swaps fonts — text at 40px+ or bold gets the heading font, the rest gets the body font.

```
const kit = Y.createBrandKit({ name: 'Acme', fromDocument: true });
Y.applyBrandKit(kit.id);            // recolor + refont
Y.applyBrandKit(kit.id, { fonts: false }); // colors only
```

## Elements library & SVG import

**Menu → Elements** opens the panel. A single **search box** at the top fans one query across every asset type at once — **type a word and get icons, shapes, and photos together** in one blended grid, filterable with the **All / Icons / Shapes / Photos** chips. Search understands aliases, so ` love` finds the heart, `chat` the speech bubble, and `box` the rectangle — you don't have to know the exact asset name.

- **Icons** — the full **Lucide** library, matched by name. Icons insert as fully editable vector paths (not a font glyph).
- **Shapes** — quick primitives (rectangle, circle, triangle, star, heart, hexagon, diamond, speech bubble, arrow), each searchable by name or alias.
- **Photos** — openly-licensed **stock photos** (Wikimedia Commons, no API key), streamed in as you type, with **All / Landscape / Portrait / Square** orientation filters when the Photos chip is active. Click a result to insert it on the active page, or **drag it onto the canvas** — onto a frame or shape to fill it, onto an image to replace it, or onto empty space to place it at the drop point. The source link and attribution are kept on the element. `Y.searchStockPhotos('mountain')` → `Y.insertStockPhoto(photo)`

When the search box is empty the panel shows a **browse view**: quick shapes, six-shape **frames** (dashed placeholders — drop a photo onto one to fill it, cover-fit), featured icons, and curated heading/body **font pairings** (Modern, Editorial, Bold Statement…, previewed in their own faces). Clicking a pair refonts every text element (40px+/bold → heading font, rest → body) and sets the body font as the default for new text. `Y.applyFontPairing('editorial')`

Dropping an **.svg file** onto the canvas imports it as editable vector paths (not a raster image): full path grammar, groups, transforms, and basic shapes are supported; gradients/text/embedded images inside the SVG are skipped.

```
Y.toggleElementsPanel(true);
Y.importSvg('<svg …>…</svg>', { targetWidth: 300 });
```

## Text effects

Select a text element → property panel → **Text Effect**: Shadow, Lift, Hollow, Splice, Outline, Echo, Neon, **Glitch** (cyan/magenta chromatic-aberration copies), Background — or None to reset. Effects compose shadow, glow, glyph outline, and highlight attributes, so you can fine-tune afterwards.

```
Y.getTextEffectPresets();
Y.applyTextEffect('neon');          // applies to selection
```

## AI assists

Configure an API key in **AI Settings** first (OpenAI needed for images; Magic Write works with OpenAI, Gemini, or Anthropic). The OpenAI section also has an **Image Model** selector — GPT Image 1 (best quality, requires a verified OpenAI organization) or DALL·E 3.

- **Magic Write** — right-click a text element → Magic Write (AI): rewrite, shorten, expand, fix grammar, or a custom instruction.
- **AI Image** — Menu → AI Image…: describe an image, it's generated and inserted on the active page.
- **AI Design** — Menu → AI Design…: describe the design ("sale poster for a coffee shop, warm tones") and a ready-to-edit design document is generated — headline, subhead, bullets, CTA pill, and a matching palette, laid out for the chosen size. Works with any configured text provider. `Y.generateDesign(brief, 'instagram-post')`
- **Remove Background** — right-click an image → Remove Background (AI): replaces it with a transparent-background version. Your original pixels are preserved — the AI result is used only as a transparency mask, so the subject is never restyled (pass `{preserveOriginal: false}` via the API to take the AI's regenerated image instead).
- **Magic Edit** — right-click an image → Magic Edit (AI)…: describe a change ("remove the person on the left") and only that region is repainted. `Y.magicEditImage('remove the car')`
- **Replace Background** — right-click an image → Replace Background (AI)…: describe a new backdrop ("a sunny beach", "a solid teal studio") and the background behind the subject is swapped while the foreground stays pixel-identical. `Y.replaceBackground('a sunny beach at sunset')`
- **Magic Expand** — right-click an image → Magic Expand (AI): outpaint the photo beyond its borders (all sides +25%, wider, taller, or custom guidance). The element grows by the same margins so the subject stays put. `Y.expandImage({ left: 0.5, right: 0.5 })`

```
await Y.magicWrite('shorten');
await Y.generateImage('isometric rocket illustration');
await Y.generateDesign('launch poster for a coffee brand');
await Y.removeBackground();          // selected image
await Y.magicEditImage('make the sky sunset orange');
await Y.expandImage();               // +25% all sides
```

:::tip
Documents, saved templates, and brand kits are stored in **IndexedDB** (works in all modern browsers, including iOS Safari), so large designs with photos and logos are not limited by the old ~5 MB localStorage quota.
:::

## Magic Resize

**Menu → Magic Resize…** repurposes the whole document to another format in one step — design an Instagram post, resize to a story, poster, or banner. Page backgrounds stretch to fill the new size; every other element scales *uniformly* (nothing distorts, font sizes included) and keeps its relative position on the page. All pages resize together, and it's one undo step.

```
Y.magicResize('instagram-story');       // preset id …
Y.magicResize({ width: 1200, height: 628 }); // … or explicit size
```

## Version history & recents

**Menu → Version History…** lists automatic snapshots of your document (about every 3 minutes while editing; newest 15 kept, stored locally in IndexedDB), each with a small page preview. Click one to restore it, or use **Snapshot now** before a risky change. The **Open Drawing** dialog shows saved documents as a thumbnail grid, most recently saved first.

```
await Y.snapshotVersion('before rebrand');
await Y.listVersions();
await Y.restoreVersion(id);
```

## Lists & rich text

Rich-text elements (the **Rich Text** tool) get a mini toolbar while editing: bold/italic/underline/strikethrough, text color, font, **font size**, and **bullet / numbered lists** — Enter adds the next item. Pasting a bulleted outline from another app converts to list formatting automatically, **including indented sub-levels**: each level is drawn one indent deeper with its own marker, and the canvas matches the editor line for line.

### Different sizes in the same text box

Select the words you want and pick a size from the **A<sub>A</sub>** button — one word of a headline can be 72 while the rest stay 32, in a single text object. It is a per-run setting, so bold, colour and font can differ across the same line too. Sizes are absolute px, matching the element's own *Font Size*.

**Default** (top of the size list) puts the selection back to the element's own size. Note that this writes that size onto the run explicitly rather than clearing it, so a run reset this way will not follow a later change to the element's base Font Size — reset it again, or retype it, if you change the base afterwards.

Lists survive export: PNG/JPG/PDF render through the canvas, and **SVG** now writes the bullet or number into the item's gutter with the same indent per level, so an exported list reads exactly like the one on canvas.

**Known limitations.** There is no indent shortcut inside the editor — Tab leaves the text box and commits, so nested levels come from pasted content. Lists are available on rich-text elements only; text typed inside a shape is plain.

## Install & offline (PWA)

Yappy is an installable web app: use your browser's **Install** action to add it to the desktop / home screen. After the first visit everything needed to run is cached, so Yappy **cold-loads and works fully offline** — drawing, design documents, templates, autosave, version history, and export. Online-only features (AI, stock photos, Google Fonts not yet used, Google Drive) resume when you're back on the network; display fonts you've already used are cached for offline reuse.

## Scripting (API) — quick reference

Everything above is scriptable from the global `window.Yappy` object. The snippets in each section run as-is in the browser console; this table collects the Design Studio methods in one place (all verified against `api.ts`).

```
const Y = window.Yappy;
Y.newDesign('instagram-post');           // new fixed-size doc
Y.addSlide();                            // add a page
Y.setPageSize(1280, 720);                // resize all pages
Y.magicResize('instagram-story');        // repurpose the whole doc
await Y.exportPageToPng(0, 2);           // export page 1 at 2×
```

| Area | Methods |
| --- | --- |
| Documents & pages | `newDesign(size?)`, `getPageSizePresets()`, `addSlide()`, `setPageSize(w,h)`, `magicResize(size)`, `exportPageToPng(i?, scale?)`, `detachBackgroundImage(i?)` |
| Templates | `getTemplates(cat?)`, `searchTemplates(q)`, `applyTemplate(id)`, `saveAsTemplate(name, desc?)`, `deleteUserTemplate(id)` |
| Brand kit & fonts | `createBrandKit(opts?)`, `applyBrandKit(id, opts?)`, `applyFontPairing(id)` |
| Elements & photos | `toggleElementsPanel(show?)`, `importSvg(text, opts?)`, `searchStockPhotos(q)`, `insertStockPhoto(photo)` |
| Text effects | `getTextEffectPresets()`, `applyTextEffect(id, ids?)` |
| AI assists | `magicWrite(mode?)`, `generateImage(prompt)`, `generateDesign(brief, size?)`, `removeBackground(id?)`, `magicEditImage(instr)`, `expandImage(opts?)` |
| Version history | `snapshotVersion(label?)`, `listVersions()`, `restoreVersion(id)` |
