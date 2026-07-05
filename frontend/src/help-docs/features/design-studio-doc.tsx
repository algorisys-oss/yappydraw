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
                    PDF export emits one page per document page.
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
                    <strong>Menu → Templates → Designs</strong> holds ready-made social posts, posters, cards,
                    a resume, certificate, and more — each opens as a design document at its native page size.
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
                    <li><strong>Remove Background</strong> — right-click an image → Remove Background (AI):
                        replaces it with a transparent-background version. Your original pixels are preserved —
                        the AI result is used only as a transparency mask, so the subject is never restyled
                        (pass <code>{'{preserveOriginal: false}'}</code> via the API to take the AI's
                        regenerated image instead).</li>
                </ul>
                <pre><code>{`await Y.magicWrite('shorten');
await Y.generateImage('isometric rocket illustration');
await Y.removeBackground();          // selected image`}</code></pre>
                <p class="tip-box">
                    Documents, saved templates, and brand kits are stored in <strong>IndexedDB</strong> (works in
                    all modern browsers, including iOS Safari), so large designs with photos and logos are not
                    limited by the old ~5&nbsp;MB localStorage quota.
                </p>
            </section>
        </div>
    );
};

export default DesignStudioDoc;
