---
id: design-studio
name: Design Studio
icon: "🎨"
category: Design
description: "Canva-style design documents: pages & size presets, slides & presentations (slide master, slide numbers, transitions, presenting), templates, Magic Resize, brand kit, unified elements search (icons/shapes/photos), text effects, AI assists, version history, offline PWA"
keywords: "slides presentation new presentation slide deck slides panel add slide insert slide above below duplicate slide reorder slides slide transition fade zoom easing duration slide master use as slide master crown master layer logo footer watermark every slide slide number page number slideNumber totalSlides date field ${date} footer formula new slide layout layouts title and content two columns section header comparison key numbers timeline cards closing insertSlideWithLayout getSlideLayouts equals present F5 Shift+F5 present from current slide presentation mode laser pointer ink highlighter ink brush eraser exit presentation importMarkdownSlides markdown slides addSlide updateSlideTransition updateSlideBackground togglePresentationMode speaker notes notes pane presenter notes setSlideNotes getSlideNotes toggleSpeakerNotes markdown notes presenter view link hyperlink jump to slide button menu agenda quiz interactive presentation non-linear setLink getLink end show alt+f5 openPresenterView presenter window timer next slide second screen projector dual monitor canva design document page size preset instagram post story poster flyer business card template search fits badge blank page empty page start blank pasteboard off page objects outside page spare artwork overhang faded trimmed part my templates brand kit font pairing elements panel unified element search blended search icons shapes photos one box type a word alias love heart chat speech box rectangle frames photo frame heart star hexagon stock photos wikimedia orientation landscape portrait square drag drop crop aspect ratio 1:1 4:5 16:9 9:16 lock text effect shadow lift hollow splice outline echo neon glitch background highlight curved set as page background detach image background jpg jpeg png export current page only ready for social one click download for instagram story linkedin facebook cover x twitter youtube thumbnail exact size upload limit 2 mb exportForPlatform getSocialTargets magic write ai image generate remove background replace background swap backdrop thumbnail indexeddb magic resize repurpose format magic edit inpaint magic expand outpaint extend photo ai design generate brief version history snapshot restore recents grid open drawing bullet numbered list rich text pwa install offline service worker app"
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
Export dialog → **PNG and JPG** show a **Current Page Only** option in paged documents — exact page bounds, page background included (JPG has no transparency, so any uncovered area takes the document's background colour). Leave it unchecked to export the **whole design**: every page is rendered at its full page bounds with its own background, stacked vertically (multi-page designs). PDF and PPTX export emit one file page per document page (PPTX as editable PowerPoint shapes by default — see Workspace ▸ Export ▸ PowerPoint; a page of another size is scaled to fit the first page's slide size). SVG export includes the full page area and each page's background.
:::

### Ready for social — one-click export

For a design headed to a social platform, the top of the Export dialog lists **Ready for social**: one button for every platform whose shape matches the current page. Click one and the page is saved straight away — no format or scale to choose:

- **Exact size.** The page is rendered at the platform's own pixel size, whatever size you designed at. A 1080 × 1080 page gives both an **Instagram Post** (1080 × 1080) and a **LinkedIn Post** (1200 × 1200); a 16:9 page gives a **YouTube Thumbnail**, an **X / Twitter Post** and a **Facebook Cover**.
- **JPG, sharp.** The page is drawn at the target size rather than resized from another export, so text stays crisp. Every one of these platforms re-encodes uploads as JPG anyway.
- **Under the upload limit.** YouTube rejects thumbnails over 2 MB and X rejects images over 5 MB. If a file would be larger, Yappy lowers the JPG quality until it fits, and tells you if it still cannot.
- **Named for you.** The file is named after the document and platform, e.g. `autumn-sale-instagram-story.jpg`.

Only platforms with the page's shape are offered, because anything else would crop or stretch the design. If none match — an A4 flyer, say — the dialog points you to **Menu → Magic Resize…** to make a version in a social size first.

:::note
It exports the **current page**. For an Instagram carousel, export each page in turn.
:::

```
const Y = window.Yappy;
Y.getSocialTargets();                              // platforms the current page fits
await Y.exportForPlatform('instagram-story');      // save it
const r = await Y.exportForPlatform('youtube-thumbnail', { download: false, pageIndex: 0 });
// r → { ok: true, width: 1280, height: 720, bytes, quality, overBudget, fileName, blob }
//   or { ok: false, reason: 'shape-mismatch' | 'not-paged' | 'no-page' | 'unknown-platform' | 'encode-failed' }
```

### The page edge is a real edge

Every page owns its own artwork, and artwork **stops at the paper**. Draw or drag past the edge and the overhang is simply cut off — the same neat trim you get in a paint app, and the same result the exporters produce, so what you see is what the PNG/PDF gets. Nothing spills onto the next page.

Which page an object belongs to is decided by where its **centre** sits: move an object more than halfway onto the next page and it moves house, taking its clipping with it. An object dropped in the gap between two pages goes to whichever page it overlaps most.

While an object is **selected or being dragged**, it draws in full — nothing gets cut off mid-move, so you can always see what you are positioning. Release it and it clips to its page again. An overhang that's currently trimmed away is still clickable where it lies on the pasteboard, which is how you grab an object to pull it back onto the page.

Objects parked **beside** the pages sit on the **pasteboard**, as in Illustrator: they belong to no page, but stay visible and clickable, so you can keep spare artwork, colour tests or alternate versions next to the design. Pasteboard objects are never exported, never appear in page thumbnails, and are hidden when presenting. Drag one more than halfway onto a page to use it there. (An object that only *overhangs* a page edge still belongs to that page and is trimmed at the edge. The trimmed-off part is shown **faded** on the pasteboard while you work, so you can see where the rest of it is; it's never drawn over a neighbouring page, and exports stay trimmed.)

:::note
Pages are frames on one shared canvas, not separate files. An object lives on exactly one page, so deleting it deletes the object — there is no per-page copy to remove. To repeat something on every page, mark its layer as a **Slide Master** (Layers panel → right-click → *Use as Slide Master*).
:::

**Page backgrounds:** drop an image onto empty canvas to set it as the active page's background. Right-click a selected image → **Set as Page Background** does the same; right-click empty canvas → **Detach Image from Background** turns the background back into a regular image element you can move, crop, and filter. `Y.detachBackgroundImage()`

## Slides & presentations

A presentation is a paged document like a design, with slides instead of pages. Start one with **Menu → New → New Presentation**, from a presentation template, with **Menu → AI → AI Presentation**, or by opening a PowerPoint file (see Workspace ▸ Opening PowerPoint files).

**Slides panel.** The left rail lists every slide with a live thumbnail.

- **+ Add Slide** (<kbd>Ctrl+M</kbd>) adds a blank slide at the end. The **layouts** button beside it adds a slide after the current one from a layout — **Blank**, **Title**, **Title and content**, **Two columns**, **Section header**, **Comparison**, **Quote**, **Key numbers**, **Timeline**, **Cards**, **Picture and text** or **Closing** — with placeholder text to type over. The new slide takes the current slide's background, and the layout's colours are picked to read on it (light text on a dark slide). Layout artwork is ordinary objects: there are no placeholders that stay linked to the layout. Right-click a thumbnail → **Insert Slide Above** / **Insert Slide Below** puts one exactly where you want it.
- Hover a thumbnail for its buttons: **✕** deletes the slide (after a confirm), the copy icon duplicates it, and **⚡** opens its transition.
- Drag thumbnails to reorder. <kbd>Alt+→</kbd> / <kbd>Alt+←</kbd> move to the next or previous slide while you edit.

**Transitions.** The **⚡ Slide Transition** picker sets how a slide arrives: **Type** (None, Fade, Slide Left / Right / Up / Down, Zoom In, Zoom Out), **Duration (ms)** (500 by default), and **Easing** (Quad InOut by default). **Preview Transition** plays it on the canvas.

**Slide Master: artwork on every slide.** Put a logo, footer or watermark on its own layer, then Layers panel → right-click the layer → **Use as Slide Master**. A crown 👑 marks it, and everything on it shows in the same place on every slide. Edit it like any layer (it must be active and unlocked); **Disable Slide Master** turns it back into an ordinary layer. There is one master for the whole deck, and a slide can't opt out of it. Exports put the master's artwork on every page, just as the canvas shows it.

**Slide numbers and the date.** A text box that **starts with `=`** fills in fields: `${slideNumber}` (the slide it's on, from 1), `${totalSlides}`, and `${date}` (today's date, written the way your browser writes dates, e.g. "1 November 2026"). Type `=Page ${slideNumber} of ${totalSlides}` on the master layer and every slide shows its own "Page 2 of 10". Without the leading `=` the text shows as typed; start with `==` to show a literal `=`. Fields are filled in on the canvas, in slide thumbnails, in recordings and in every export (PNG, PDF, SVG, PowerPoint); PowerPoint gets the numbers as plain text, so they don't renumber if you reorder slides there.

**Speaker notes.** Each slide has its own notes: what you want to say, for you and not the audience. Click the **notes** button (the notebook with a pen) in the slide toolbar at the bottom of the canvas, or run **Show / hide speaker notes** from the command palette (<kbd>Ctrl+K</kbd>). A **Speaker notes · Slide N** pane opens along the bottom of the canvas, and the slide shrinks to fit above it. Type into it; the notes follow the slide you have selected. Close it with **✕** or the same button.

- Notes are plain text, one paragraph per line. They never draw on the slide, and the audience never sees them: while presenting they show only in the **presenter view** (below). They are left out of PNG, SVG and PDF exports.
- The whole time you spend typing in the pane counts as one step for <kbd>Ctrl+Z</kbd>.
- Notes are saved with the document. **PowerPoint export** (editable or pictures) writes them as PowerPoint's own speaker notes, and **opening a .pptx** brings its notes in. A document that has notes opens with the pane showing.
- **Markdown import** takes notes too: a line starting `Note:` (or `Notes:`) begins the slide's notes, which run to the next slide break; an HTML comment `<!-- … -->` is also a note.
- Formatting inside PowerPoint notes (bold, bullets, indent levels) comes in as plain text.

**Presenting.**

| Key | Does |
|---|---|
| <kbd>F5</kbd> | Present from the first slide |
| <kbd>Shift+F5</kbd> | Present from the current slide |
| <kbd>Alt+F5</kbd> | Present from the current slide with the **presenter view** |
| <kbd>→</kbd>, <kbd>Space</kbd>, <kbd>Enter</kbd>, <kbd>Page Down</kbd>, or a click | Next build step, then the next slide |
| <kbd>←</kbd>, <kbd>Page Up</kbd>, <kbd>Backspace</kbd> | Previous slide, shown fully built |
| <kbd>Esc</kbd> | End the presentation |

Move the mouse to show the toolbar at the bottom of the screen (it hides again after 3 seconds): **Pointer (Advance Slides)**, **💡 Spotlight**, **Laser Pointer** (<kbd>Shift+P</kbd>), **Ink Highlighter**, **Ink Brush**, **Eraser**, plus **Record** (MP4) and the film button (GIF), **Full screen** (when the slides aren't full screen), **Presenter view**, and **Exit Presentation**. Build steps, Spotlight and recording are covered in Animation ▸ Click-to-Advance and Animation ▸ Recording & Export.

**Presenter view.** Press <kbd>Alt+F5</kbd> (or **Present with presenter view** in the command palette, or the **Presenter view** button in the presentation toolbar) to present from the current slide with a second window just for you. It shows:

- the **current slide**, large, and the **next slide** (or *End of presentation* on the last one);
- the slide's **speaker notes**, with **A−** / **A+** to change their size (remembered for next time);
- a **timer** with **Pause** / **Resume** and **Reset**, the time of day, and *Slide N of M*;
- **Previous**, **Next** and **End show** buttons. The show's keys (<kbd>→</kbd> <kbd>Space</kbd> <kbd>Page Down</kbd> to advance, <kbd>←</kbd> <kbd>Page Up</kbd> to go back, <kbd>Esc</kbd> to end) work in this window too, so you never have to click back into the slides.

With a projector or second screen: put the YappyDraw window on the audience's screen, press <kbd>Alt+F5</kbd>, drag the presenter window to your own screen, then click **Full screen** in the slides' toolbar. (A browser can't open a window and go full screen on the same click, so the slides start out in a normal window.) Ending the show closes the presenter view; closing the presenter view leaves the show running. If nothing opens, your browser blocked the pop-up: allow pop-ups for the site and try again.

The current-slide picture shows the whole slide, not how far its build steps have got.

**Links: buttons that jump.** Any object can be a link — a "Back to agenda" button, a menu of topics, a quiz answer. Right-click it (or select several, such as an icon and its label) → **🔗 Link**:

- **To slide ▸** — pick a slide from the list. The link follows that slide, so it still works after you reorder or insert slides.
- **Show action ▸** — **Next slide**, **Previous slide**, **First slide**, **Last slide** or **End show**.
- **Web address…** — a page to open in a new tab (`https://…`, `mailto:…` and `tel:` work; a bare `www.example.com` gets `https://` added). Anything else, such as `javascript:`, is refused, and never opened even if a file contains one.
- **Open link** tries it; **Remove link** takes it off.

While presenting, the pointer turns into a hand over a linked object, and clicking it follows the link instead of moving to the next build step or slide. A link to a slide that has since been deleted does nothing and says so. The **Link** field under Properties ▸ Advanced holds the same thing as text. PowerPoint export and import keep links, including jumps to slides and the show actions.

:::note
Not available yet: hiding a slide, slide sections, and auto-advance timings. Links on single words inside a text box (rather than the whole object) are not supported.
:::

```
const Y = window.Yappy;
Y.addSlide();                              // add a slide
Y.duplicateSlide(0); Y.deleteSlide(2);
Y.reorderSlides(3, 0);                     // move slide 4 to the front
Y.setActiveSlide(1);
Y.updateSlideTransition(1, { type: 'fade', duration: 400 });
Y.updateSlideBackground(1, '#0f172a');     // colour, or { fillStyle, gradientStops, … }
await Y.importMarkdownSlides('# Title\n- point\n---\n# Next'); // headings → titles, bullets → content, --- → new slide
Y.setSlideNotes(0, 'Open with the story.\nThen the numbers.');  // blank text removes them
Y.getSlideNotes(0);                        // → 'Open with the story.\nThen the numbers.' ('' when none)
Y.toggleSpeakerNotes(true);                // show the notes pane
Y.openPresenterView();                     // present with the presenter view — call from a click/key handler
Y.isPresenterViewOpen(); Y.closePresenterView();
Y.insertSlideWithLayout('two-column');     // after the current slide; Y.getSlideLayouts() lists the ids
Y.setLink(buttonId, { slide: 4 });         // click → slide 5 (also 'next' | 'previous' | 'first' | 'last' | 'end', or a URL)
Y.setLink([iconId, labelId], 'https://yappydraw.com');
Y.getLink(buttonId);                       // → '#slide:<id>', '#end', 'https://…' or ''
Y.togglePresentationMode(true);            // present
```

## Design templates & My Templates

**Menu → Templates → Designs** holds 30+ ready-made designs — Instagram posts (product, quote, tips, testimonial, hiring, podcast, sale), stories (event, countdown, quote), YouTube thumbnails, deck title/section slides, webinar banners, posters, flyers (sale, café menu, open house), business cards, price lists, certificates, vouchers, and invitations — each opens as a design document at its native page size. A **search box** at the top matches names, descriptions, and tags across every category. In a design document, templates that **fit your page** (same size or aspect ratio) float to the top with a green *✓ fits* badge — and picking a size in **New Design…** opens the template browser automatically so you can start from a matching layout — or click the first card, **Blank page**, to start from an empty page at the size you just picked. **Save Current as Template** (in the template browser header) snapshots the whole document into **My Templates**; delete via the × on a card.

Every card shows a **real preview of the template's content**, drawn from the template's own elements — diagram cards show the diagram, design cards show the first page at its true aspect ratio, and a presentation card's strip previews each of its first four slides (with *+N* for the rest). Previews are simplified marks rather than a full render, so text appears as bars and sketch styling isn't applied — enough to tell layouts apart at thumbnail size. **Text Diagram** templates are YSL/Mermaid source, so they show a language badge instead of a preview (that category is currently behind **Settings → Dev Mode** while text-diagram import is reworked), and **My Templates** cards use the real thumbnail captured when you saved them.

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

Lists survive export: PNG/JPG/PDF render through the canvas, and **SVG** now writes the bullet or number into the item's gutter with the same indent per level, so an exported list reads exactly like the one on canvas. **PowerPoint** export writes real bullets and numbering.

Lists opened from a PowerPoint file keep that deck's look — its bullet characters (▪ ➢ ✔ …), bullet colour and size, numbering style (a) · (iv) · A.), start number, indents and paragraph spacing — and new items you add with Enter continue in the same style. Lists you make in Yappy use the default • and 1. markers.

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
| Documents & pages | `newDesign(size?)`, `getPageSizePresets()`, `addSlide()`, `setPageSize(w,h)`, `magicResize(size)`, `exportPageToPng(i?, scale?)`, `getSocialTargets(i?)`, `listSocialTargets()`, `exportForPlatform(presetId, opts?)`, `detachBackgroundImage(i?)` |
| Templates | `getTemplates(cat?)`, `searchTemplates(q)`, `applyTemplate(id)`, `saveAsTemplate(name, desc?)`, `deleteUserTemplate(id)` |
| Brand kit & fonts | `createBrandKit(opts?)`, `applyBrandKit(id, opts?)`, `applyFontPairing(id)` |
| Elements & photos | `toggleElementsPanel(show?)`, `importSvg(text, opts?)`, `searchStockPhotos(q)`, `insertStockPhoto(photo)` |
| Text effects | `getTextEffectPresets()`, `applyTextEffect(id, ids?)` |
| AI assists | `magicWrite(mode?)`, `generateImage(prompt)`, `generateDesign(brief, size?)`, `removeBackground(id?)`, `magicEditImage(instr)`, `expandImage(opts?)` |
| Version history | `snapshotVersion(label?)`, `listVersions()`, `restoreVersion(id)` |
