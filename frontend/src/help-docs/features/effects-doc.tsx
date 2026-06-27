/**
 * Effects & Colour Tools — help doc.
 * Illustrator-parity effects (Convert to Shape, Split Into Grid, Convert to
 * Guides, Feather, Outer Glow, Scribble, Crop Marks, Smooth) plus the Colour
 * Guide (tints / harmonies / palette-from-image) and print bleed.
 */

import type { Component } from 'solid-js';

const EffectsDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Effects &amp; Colour Tools</h1>
                <p class="doc-intro">
                    A toolbox of Illustrator-style <strong>effects</strong> and <strong>colour helpers</strong>:
                    reshape objects, soften or glow their edges, scribble a fill, drop printer crop marks, build
                    tint/harmony palettes, pull colours from an image, and add print bleed. Most are one click in the
                    Command Palette (<kbd>Ctrl/⌘ + K</kbd>) or the right-click menu, and every one has a
                    <code>window.Yappy</code> API.
                </p>
            </header>

            {/* ─── SHAPE EFFECTS ──────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Convert to Shape</h2>
                <p>
                    Replace any selected object with a <strong>rectangle</strong>, <strong>rounded rectangle</strong> or
                    <strong>ellipse</strong> sized to its bounding box — handy to box a label or normalise a messy
                    import. Command Palette → <em>Convert to Shape: …</em>
                </p>
                <pre><code>{`const Y = window.Yappy;
Y.convertToShape('ellipse');          // selection → ellipse
Y.convertToShape('rounded', 24);      // rounded rect, 24px corner radius`}</code></pre>
            </section>

            <section class="doc-section">
                <h2>Split Into Grid &amp; Convert to Guides</h2>
                <p>
                    <strong>Split Into Grid</strong> turns a rectangle into a tidy <em>rows × cols</em> grid of cells —
                    the fast way to start a grid-based logo or layout. <strong>Convert to Guides</strong> then turns
                    selected shapes into ruler guides at their edges (Illustrator’s <kbd>⌘5</kbd>) and removes the
                    shapes, leaving a clean guide scaffold.
                </p>
                <pre><code>{`const id = Y.createRectangle(0, 0, 400, 400, { backgroundColor: 'transparent', strokeColor: '#000' });
Y.splitIntoGrid(4, 4, 0, id);         // 16 cells (rows, cols, gap, id)
Y.select(Y.getSelection());           // …select the cells, then:
Y.convertToGuides();                  // drop guides at every cell edge`}</code></pre>
            </section>

            {/* ─── EDGE EFFECTS ───────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Feather &amp; Outer Glow</h2>
                <p>
                    <strong>Feather</strong> softly blurs an object’s edges to transparent — great for soft shadows,
                    vignettes or a dreamy halo. <strong>Outer Glow</strong> adds a coloured halo around the object (a
                    shadow with zero offset). Both are non-destructive element properties; set the radius to
                    <code>0</code> / pass <code>enabled:false</code> to remove.
                </p>
                <pre><code>{`Y.setFeather(8);                          // 8px soft edge on the selection
Y.setGlow({ color: '#00e5ff', blur: 18 }); // cyan outer glow
Y.setGlow({ enabled: false });            // remove the glow`}</code></pre>
                <p class="tip-box">
                    A canvas has a single shadow slot, so an object shows <em>either</em> a drop shadow <em>or</em> an
                    outer glow — the drop shadow wins if both are set.
                </p>
            </section>

            <section class="doc-section">
                <h2>Scribble</h2>
                <p>
                    Turn a fill into a hand-drawn <strong>scribble</strong> of back-and-forth strokes in the fill
                    colour — instant sketch energy. Control the line <em>spacing</em>, <em>angle</em> and stroke width.
                </p>
                <pre><code>{`Y.scribble({ spacing: 8, angle: 0, strokeWidth: 2 });`}</code></pre>
                <p>Right-click a path → <strong>Smooth</strong> also relaxes janky curves (Laplacian smoothing,
                    keeping the anchor count) — the counterpart to <strong>Simplify</strong>, which reduces points.</p>
                <pre><code>{`Y.smoothPath(undefined, 0.5, 2);   // strength 0..1, iterations`}</code></pre>
            </section>

            {/* ─── PRINT ──────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Crop marks &amp; print bleed</h2>
                <p>
                    Toggle <strong>crop marks</strong> on an object to draw printer registration marks at its corners.
                    For documents, set a <strong>bleed</strong> margin (Settings → Print Bleed) — a dashed bleed
                    boundary plus crop marks are drawn around every artboard so artwork can run off the trim edge.
                </p>
                <pre><code>{`Y.toggleObjectCropMarks(true);   // crop marks on the selection
Y.setBleed(20);                  // 20px bleed + artboard crop marks`}</code></pre>
            </section>

            {/* ─── COLOUR GUIDE ───────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Colour Guide — tints, harmonies &amp; palette-from-image</h2>
                <p>
                    Build palettes the way a designer does. <strong>Tints</strong> gives a light→dark ramp around a base
                    colour; <strong>harmonies</strong> derive complementary / analogous / triadic / split-complementary
                    / tetradic / monochromatic sets. The <strong>colour theme picker</strong> extracts the dominant
                    colours from any image, and you can recolour the selection onto any palette.
                </p>
                <pre><code>{`Y.generateTints('#3366cc');                       // [light … #3366cc … dark]
Y.generateHarmony('#ff0000', 'triadic');          // 3 evenly-spaced hues
Y.applyHarmonyToSelection('#ff0000', 'complementary');
const pal = await Y.extractImagePalette(imageId, 6); // dominant colours
Y.applyPaletteToSelection(pal);                   // recolour onto them
Y.shuffleSelectionColors();                       // randomise the order`}</code></pre>
            </section>

            {/* ─── SWATCHES ───────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Swatch groups &amp; swatch info sheet</h2>
                <p>
                    Organise global swatches into named <strong>groups</strong>, and generate a labelled
                    <strong> swatch info sheet</strong> (colour chip + name + hex + RGB) for brand guidelines.
                </p>
                <pre><code>{`Y.createSwatch('#112233', 'navy', 'Brand');   // colour, name, group
Y.createSwatchGroupFromSelection('Palette');  // selection colours → group
Y.createSwatchInfoSheet({ columns: 4 });      // labelled chips on the canvas`}</code></pre>
            </section>

            <section class="doc-section">
                <h2>See also</h2>
                <p>
                    Stroke gradients, the Appearance editor, Recolor Artwork and tracing live under
                    <strong> Masks, Appearance &amp; Trace</strong>. Pucker/Bloat, Twirl, Roughen, ZigZag and the other
                    distort effects live under <strong>Illustrator-class Tools</strong>.
                </p>
            </section>
        </div>
    );
};

export default EffectsDoc;
