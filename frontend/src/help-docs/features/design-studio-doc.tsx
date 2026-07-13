/**
 * Design Studio — help doc for the Canva-style feature set:
 * design documents (fixed-size pages), design templates, brand kits,
 * the elements library / SVG import, text effects, and AI assists.
 */

import type { Component } from 'solid-js';

const DesignStudioDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Design Studio</h1>
                <p class="doc-intro">
                    Yappy's Canva-style mode: create <strong>fixed-size, multi-page design documents</strong> —
                    social posts, posters, cards, resumes — with size presets, templates, a brand kit,
                    an elements library, one-click text effects, and AI assists.
                </p>
            </header>

            <section class="doc-section">
                <h2>Design documents & pages</h2>
                <p>
                    <strong>Menu → New Design…</strong> opens the size picker: Instagram post/story, YouTube
                    thumbnail, Facebook cover, presentation, A4/US Letter, business card, poster, flyer, or a
                    custom width × height. A design document is paged — the <strong>Pages panel</strong> (left rail)
                    adds, duplicates, reorders, and deletes pages; <kbd>Ctrl+M</kbd> adds a page. New pages inherit
                    the document's page size.
                </p>
                <p>
                    With nothing selected, the property panel shows the active page — background, and under
                    <strong> Page Size</strong> a preset dropdown plus width/height fields (resizing re-lays-out
                    all pages so they never overlap). Every page in the panel shows a <strong>live thumbnail</strong>
                    that refreshes as you edit (about a second after each change).
                </p>
                <pre><code>{`const Y = window.Yappy;
Y.newDesign('instagram-post');          // preset id …
Y.newDesign({ width: 800, height: 600 }); // … or explicit size
Y.getPageSizePresets();                  // list all presets
Y.addSlide();                            // add a page
Y.setPageSize(1280, 720);                // resize all pages
Y.exportPageToPng(0, 2);                 // export page 1 at 2x`}</code></pre>
                <p class="tip-box">
                    Export dialog → <strong>PNG and JPG</strong> show a <strong>Current Page Only</strong> option in
                    paged documents — exact page bounds, page background included (JPG always exports on white).
                    Leave it unchecked to export the <strong>whole design</strong>: every page is rendered at its
                    full page bounds with its own background, stacked vertically (multi-page designs). PDF and PPTX
                    export emit one file page per document page. SVG export includes the full page area and each
                    page's background.
                </p>
                <p>
                    <strong>Page backgrounds:</strong> drop an image onto empty canvas to set it as the active
                    page's background. Right-click a selected image → <strong>Set as Page Background</strong> does
                    the same; right-click empty canvas → <strong>Detach Image from Background</strong> turns the
                    background back into a regular image element you can move, crop, and filter.
                    <code>Y.detachBackgroundImage()</code>
                </p>
            </section>

            <section class="doc-section">
                <h2>Design templates & My Templates</h2>
                <p>
                    <strong>Menu → Templates → Designs</strong> holds 30+ ready-made designs — Instagram posts
                    (product, quote, tips, testimonial, hiring, podcast, sale), stories (event, countdown,
                    quote), YouTube thumbnails, deck title/section slides, webinar banners, posters, flyers
                    (sale, café menu, open house), business cards, price lists, certificates, vouchers, and
                    invitations — each opens as a design document at its native page size.
                    A <strong>search box</strong> at the top matches names, descriptions, and tags across every
                    category. In a design document, templates that <strong>fit your page</strong> (same size or
                    aspect ratio) float to the top with a green <em>✓ fits</em> badge — and picking a size in
                    <strong> New Design…</strong> opens the template browser automatically so you can start from
                    a matching layout (or just close it for a blank page).
                    <strong> Save Current as Template</strong> (in the template browser header) snapshots the whole
                    document into <strong>My Templates</strong>; delete via the × on a card.
                </p>
                <pre><code>{`Y.getTemplates('designs');          // list design templates
Y.searchTemplates('poster');         // search by name/tag/description
Y.applyTemplate('design-poster-event');
Y.saveAsTemplate('My layout');       // → My Templates
Y.deleteUserTemplate(id);`}</code></pre>
            </section>

            <section class="doc-section">
                <h2>Cropping images</h2>
                <p>
                    Select an image → property panel → <strong>Crop Image</strong> (Enter applies, Escape cancels).
                    While cropping, <strong>aspect-ratio presets</strong> appear: Free, 1:1, 4:5, 3:4, 16:9, 9:16.
                    Picking one snaps the crop to the largest centered rect of that ratio and <strong>locks the
                    ratio while you drag</strong> the handles — Free unlocks. <strong>Reset Crop</strong> restores
                    the full image.
                </p>
            </section>

            <section class="doc-section">
                <h2>Brand Kit</h2>
                <p>
                    <strong>Menu → Brand Kit</strong> opens the panel. A kit bundles five brand colors
                    (primary/secondary/accent/background/text), a heading + body font pair, and a logo.
                    The wand button extracts colors from the current document. <strong>Apply Brand to
                    Document</strong> recolors everything (each color maps to the closest-luminance brand color,
                    so light/dark structure is preserved) and swaps fonts — text at 40px+ or bold gets the heading
                    font, the rest gets the body font.
                </p>
                <pre><code>{`const kit = Y.createBrandKit({ name: 'Acme', fromDocument: true });
Y.applyBrandKit(kit.id);            // recolor + refont
Y.applyBrandKit(kit.id, { fonts: false }); // colors only`}</code></pre>
            </section>

            <section class="doc-section">
                <h2>Elements library & SVG import</h2>
                <p>
                    <strong>Menu → Elements</strong> opens a three-tab panel:
                </p>
                <ul>
                    <li><strong>Elements</strong> — quick shapes, <strong>frames</strong> in six shapes
                        (rectangle, circle, triangle, star, heart, hexagon — dashed placeholders; drop a photo
                        onto one to fill it, cover-fit), and a searchable <strong>icon library</strong>
                        (Lucide). Icons insert as fully editable vector paths.</li>
                    <li><strong>Fonts</strong> — curated heading/body <strong>font pairings</strong> (Modern,
                        Editorial, Bold Statement…), previewed in their own faces. Clicking a pair refonts every
                        text element (40px+/bold → heading font, rest → body) and sets the body font as the
                        default for new text. Google fonts load automatically.
                        <code>Y.applyFontPairing('editorial')</code></li>
                    <li><strong>Photos</strong> — search openly-licensed <strong>stock photos</strong> (Wikimedia
                        Commons, no API key), with <strong>All / Landscape / Portrait / Square</strong> orientation
                        filters. Click a result to insert it on the active page, or <strong>drag it onto the
                        canvas</strong> — onto a frame or shape to fill it, onto an image to replace it, or onto
                        empty space to place it at the drop point. The source link and attribution are kept on
                        the element.
                        <code>Y.searchStockPhotos('mountain')</code> → <code>Y.insertStockPhoto(photo)</code></li>
                </ul>
                <p>
                    Dropping an <strong>.svg file</strong> onto the canvas imports it as editable vector paths
                    (not a raster image): full path grammar, groups, transforms, and basic shapes are supported;
                    gradients/text/embedded images inside the SVG are skipped.
                </p>
                <pre><code>{`Y.toggleElementsPanel(true);
Y.importSvg('<svg …>…</svg>', { targetWidth: 300 });`}</code></pre>
            </section>

            <section class="doc-section">
                <h2>Text effects</h2>
                <p>
                    Select a text element → property panel → <strong>Text Effect</strong>: Shadow, Lift, Hollow,
                    Splice, Outline, Echo, Neon, <strong>Glitch</strong> (cyan/magenta chromatic-aberration copies),
                    Background — or None to reset. Effects compose shadow, glow, glyph outline, and highlight
                    attributes, so you can fine-tune afterwards.
                </p>
                <pre><code>{`Y.getTextEffectPresets();
Y.applyTextEffect('neon');          // applies to selection`}</code></pre>
            </section>

            <section class="doc-section">
                <h2>AI assists</h2>
                <p>
                    Configure an API key in <strong>AI Settings</strong> first (OpenAI needed for images; Magic
                    Write works with OpenAI, Gemini, or Anthropic). The OpenAI section also has an
                    <strong> Image Model</strong> selector — GPT Image 1 (best quality, requires a verified
                    OpenAI organization) or DALL·E 3.
                </p>
                <ul>
                    <li><strong>Magic Write</strong> — right-click a text element → Magic Write (AI): rewrite,
                        shorten, expand, fix grammar, or a custom instruction.</li>
                    <li><strong>AI Image</strong> — Menu → AI Image…: describe an image, it's generated and
                        inserted on the active page.</li>
                    <li><strong>AI Design</strong> — Menu → AI Design…: describe the design ("sale poster for a
                        coffee shop, warm tones") and a ready-to-edit design document is generated — headline,
                        subhead, bullets, CTA pill, and a matching palette, laid out for the chosen size. Works
                        with any configured text provider. <code>Y.generateDesign(brief, 'instagram-post')</code></li>
                    <li><strong>Remove Background</strong> — right-click an image → Remove Background (AI):
                        replaces it with a transparent-background version. Your original pixels are preserved —
                        the AI result is used only as a transparency mask, so the subject is never restyled
                        (pass <code>{'{preserveOriginal: false}'}</code> via the API to take the AI's
                        regenerated image instead).</li>
                    <li><strong>Magic Edit</strong> — right-click an image → Magic Edit (AI)…: describe a change
                        ("remove the person on the left") and only that region is repainted.
                        <code>Y.magicEditImage('remove the car')</code></li>
                    <li><strong>Replace Background</strong> — right-click an image → Replace Background (AI)…:
                        describe a new backdrop ("a sunny beach", "a solid teal studio") and the background
                        behind the subject is swapped while the foreground stays pixel-identical.
                        <code>Y.replaceBackground('a sunny beach at sunset')</code></li>
                    <li><strong>Magic Expand</strong> — right-click an image → Magic Expand (AI): outpaint the
                        photo beyond its borders (all sides +25%, wider, taller, or custom guidance). The element
                        grows by the same margins so the subject stays put.
                        <code>{'Y.expandImage({ left: 0.5, right: 0.5 })'}</code></li>
                </ul>
                <pre><code>{`await Y.magicWrite('shorten');
await Y.generateImage('isometric rocket illustration');
await Y.generateDesign('launch poster for a coffee brand');
await Y.removeBackground();          // selected image
await Y.magicEditImage('make the sky sunset orange');
await Y.expandImage();               // +25% all sides`}</code></pre>
                <p class="tip-box">
                    Documents, saved templates, and brand kits are stored in <strong>IndexedDB</strong> (works in
                    all modern browsers, including iOS Safari), so large designs with photos and logos are not
                    limited by the old ~5&nbsp;MB localStorage quota.
                </p>
            </section>

            <section class="doc-section">
                <h2>Magic Resize</h2>
                <p>
                    <strong>Menu → Magic Resize…</strong> repurposes the whole document to another format in one
                    step — design an Instagram post, resize to a story, poster, or banner. Page backgrounds
                    stretch to fill the new size; every other element scales <em>uniformly</em> (nothing distorts,
                    font sizes included) and keeps its relative position on the page. All pages resize together,
                    and it's one undo step.
                </p>
                <pre><code>{`Y.magicResize('instagram-story');       // preset id …
Y.magicResize({ width: 1200, height: 628 }); // … or explicit size`}</code></pre>
            </section>

            <section class="doc-section">
                <h2>Version history & recents</h2>
                <p>
                    <strong>Menu → Version History…</strong> lists automatic snapshots of your document (about
                    every 3 minutes while editing; newest 15 kept, stored locally in IndexedDB), each with a
                    small page preview. Click one to restore it, or use <strong>Snapshot now</strong> before a
                    risky change. The <strong>Open Drawing</strong> dialog shows saved documents as a thumbnail
                    grid, most recently saved first.
                </p>
                <pre><code>{`await Y.snapshotVersion('before rebrand');
await Y.listVersions();
await Y.restoreVersion(id);`}</code></pre>
            </section>

            <section class="doc-section">
                <h2>Lists & rich text</h2>
                <p>
                    Rich-text elements (the <strong>Rich Text</strong> tool) get a mini toolbar while editing:
                    bold/italic/underline/strikethrough, text color, font, and <strong>bullet / numbered
                    lists</strong> — Enter adds the next item, Tab indents nested levels. Pasting a bulleted
                    outline from another app converts to list formatting automatically.
                </p>
            </section>

            <section class="doc-section">
                <h2>Install & offline (PWA)</h2>
                <p>
                    Yappy is an installable web app: use your browser's <strong>Install</strong> action to add it
                    to the desktop / home screen. After the first visit everything needed to run is cached, so
                    Yappy <strong>cold-loads and works fully offline</strong> — drawing, design documents,
                    templates, autosave, version history, and export. Online-only features (AI, stock photos,
                    Google Fonts not yet used, Google Drive) resume when you're back on the network; display
                    fonts you've already used are cached for offline reuse.
                </p>
            </section>

            <section class="doc-section">
                <h2>Scripting (API) — quick reference</h2>
                <p>
                    Everything above is scriptable from the global <code>window.Yappy</code> object. The snippets in
                    each section run as-is in the browser console; this table collects the Design Studio methods in
                    one place (all verified against <code>api.ts</code>).
                </p>
                <pre><code>{`const Y = window.Yappy;
Y.newDesign('instagram-post');           // new fixed-size doc
Y.addSlide();                            // add a page
Y.setPageSize(1280, 720);                // resize all pages
Y.magicResize('instagram-story');        // repurpose the whole doc
await Y.exportPageToPng(0, 2);           // export page 1 at 2×`}</code></pre>
                <table class="api-table">
                    <thead>
                        <tr><th>Area</th><th>Methods</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Documents &amp; pages</td><td><code>newDesign(size?)</code>, <code>getPageSizePresets()</code>, <code>addSlide()</code>, <code>setPageSize(w,h)</code>, <code>magicResize(size)</code>, <code>exportPageToPng(i?, scale?)</code>, <code>detachBackgroundImage(i?)</code></td></tr>
                        <tr><td>Templates</td><td><code>getTemplates(cat?)</code>, <code>searchTemplates(q)</code>, <code>applyTemplate(id)</code>, <code>saveAsTemplate(name, desc?)</code>, <code>deleteUserTemplate(id)</code></td></tr>
                        <tr><td>Brand kit &amp; fonts</td><td><code>createBrandKit(opts?)</code>, <code>applyBrandKit(id, opts?)</code>, <code>applyFontPairing(id)</code></td></tr>
                        <tr><td>Elements &amp; photos</td><td><code>toggleElementsPanel(show?)</code>, <code>importSvg(text, opts?)</code>, <code>searchStockPhotos(q)</code>, <code>insertStockPhoto(photo)</code></td></tr>
                        <tr><td>Text effects</td><td><code>getTextEffectPresets()</code>, <code>applyTextEffect(id, ids?)</code></td></tr>
                        <tr><td>AI assists</td><td><code>magicWrite(mode?)</code>, <code>generateImage(prompt)</code>, <code>generateDesign(brief, size?)</code>, <code>removeBackground(id?)</code>, <code>magicEditImage(instr)</code>, <code>expandImage(opts?)</code></td></tr>
                        <tr><td>Version history</td><td><code>snapshotVersion(label?)</code>, <code>listVersions()</code>, <code>restoreVersion(id)</code></td></tr>
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default DesignStudioDoc;
