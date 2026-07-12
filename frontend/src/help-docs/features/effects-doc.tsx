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
                <p>
                    <strong>UI:</strong> select a rectangle → Command Palette (<kbd>Ctrl/⌘ + K</kbd>) →
                    <em> Split Into Grid (4×4)</em>; then with the cells selected run
                    <em> Convert Shapes to Guides</em>.
                </p>
                <pre><code>{`const id = Y.createRectangle(0, 0, 400, 400, { backgroundColor: 'transparent', strokeColor: '#000' });
Y.splitIntoGrid(4, 4, 0, id);         // 16 cells (rows, cols, gap, id)
Y.select(Y.getSelection());           // …select the cells, then:
Y.convertToGuides();                  // drop guides at every cell edge`}</code></pre>
            </section>

            {/* ─── EDGE EFFECTS ───────────────────────────────────────── */}
            <section class="doc-section">
                <h2>3D Extrude</h2>
                <p>
                    Give any shape or text depth — Illustrator's <em>Effect ▸ 3D ▸ Extrude &amp; Bevel</em>,
                    the classic "3D text" look. A <strong>non-destructive</strong> shaded back face + side
                    walls draw behind the shape (their colour derives from the fill), and the flat front stays
                    fully editable. Renders in both <strong>Sketch</strong> and <strong>Architectural</strong>
                    styles.
                </p>
                <p>
                    <strong>Property panel → 3D EXTRUDE</strong>: <em>+ Add 3D Extrude</em>, then drag
                    <strong> Depth</strong> (length), <strong>Angle</strong> (direction), <strong>Tilt X/Y</strong>
                    (rotate the shape in 3D), <strong>Bevel</strong> (a lit chamfer on the front edge), and
                    <strong> Shade</strong> (wall darkness). <strong>Expand</strong>
                    bakes the result into editable face elements (front / side / back) — which also makes it
                    SVG-exportable. Or right-click → <strong>Repeat &amp; Mirror ▸ 3D Extrude</strong>.
                </p>
                <pre><code>{`Yappy.setExtrude({ depth: 40, angle: 135, rotX: 25, rotY: -20, shade: 0.4 });
Yappy.expandExtrude();   // bake to editable front/side/back face paths
Yappy.clearExtrude();`}</code></pre>
                <p class="tip-box">
                    <strong>3D text:</strong> extrude works on a shape's <em>outline</em>, and a text element's
                    outline is its bounding box — so for extruded <em>letters</em>, right-click →
                    <strong> Convert to Outlines</strong> first, then apply 3D. (Real shapes — stars, circles,
                    paths — extrude directly.)
                </p>
            </section>

            <section class="doc-section">
                <h2>Turntable (rotate in 3D)</h2>
                <p>
                    Spin a flat vector shape around as if it were a 3D object — Adobe's
                    <em> Project Turntable</em> idea. Unlike 3D Extrude (which adds depth <em>behind</em> the
                    shape), Turntable rotates the artwork <em>itself</em> about a vertical or horizontal axis,
                    and at every angle the result stays a <strong>clean, editable path</strong>. It's
                    <strong> non-destructive</strong> and renders in both <strong>Sketch</strong> and
                    <strong> Architectural</strong> styles.
                </p>
                <p>
                    <strong>Property panel → TURNTABLE (3D SPIN)</strong> (shown only for shapes that can become
                    a path): <em>+ Add Turntable</em> (a non-path shape is converted to a path first), then drag
                    <strong> Yaw</strong> (spin about the vertical axis), <strong>Pitch</strong> (tilt), and
                    <strong> Persp</strong>. The <strong>Volume</strong> model chooses how depth is faked:
                    <em> Flat</em> just foreshortens the sheet (always correct); <em>Symmetry</em> gives it a
                    rounded, cylinder-like bulge — the mirror axis is <strong>auto-detected</strong> — so a
                    turned figure or logo reads as solid. With Symmetry you also get a <strong>Depth</strong>
                    slider and a <strong>Reveal back face</strong> toggle that draws the mirrored far side, so a
                    strong turn shows the occluded back (a closed 3D volume). <strong>Bake</strong> commits the
                    current angle into a real editable path (single undo); <strong>Remove</strong> restores the
                    flat shape.
                </p>
                <p>
                    <strong>Group turntable:</strong> select <em>two or more</em> shapes and the panel switches to
                    <strong> TURNTABLE — GROUP</strong>. The whole selection spins as one rig about a shared axis
                    (the selection centre), so members <em>orbit</em> together (position + shape) rather than each
                    spinning in place. Bake tightens each member's bounds to its new position.
                </p>
                <pre><code>{`Yappy.turntable({ yaw: 35, pitch: 10, depthModel: 'symmetry', depthScale: 0.6, reveal: true });
Yappy.turntable({ yaw: 40 }, [id1, id2, id3]);   // group rig: spin several together
Yappy.bakeTurntable();   // freeze this viewpoint as editable path(s)
Yappy.clearTurntable();`}</code></pre>
                <p>
                    <strong>Animate the spin:</strong> once a shape has a turntable, <strong>Turntable Yaw</strong>
                    (and <strong>Pitch</strong>) become keyframable channels in the animation / dope-sheet panel.
                    Keyframe Yaw from 0° → 360° for a full rotating-turntable loop — it scrubs, plays, and
                    exports to video/HTML like any other keyframed property.
                </p>
                <p class="tip-box">
                    <strong>Best on symmetric art:</strong> the rounded look and back-face reveal are inferred
                    from a vertical mirror axis, so characters, bottles, and logos turn most convincingly. The
                    reveal is a deterministic mirror of what's already there — truly <em>re-imagining</em> hidden
                    detail from a new viewpoint is a later, AI-assisted phase.
                </p>
            </section>

            <section class="doc-section">
                <h2>Transform Effect (live copies)</h2>
                <p>
                    A <strong>non-destructive</strong> effect that draws many accumulating copies of an object —
                    Illustrator’s <em>Effect ▸ Distort &amp; Transform ▸ Transform</em>. Each copy applies the same
                    per-step <strong>move / rotate / scale / reflect</strong> one more time, so a small rotation builds a
                    radial fan or rosette, and rotate-plus-shrink-plus-move builds a spiral. The original stays a single
                    editable object — change the base and every copy updates. Renders in both <strong>Sketch</strong> and
                    <strong>Architectural</strong> styles.
                </p>
                <p>
                    Right-click a selection → <strong>Repeat &amp; Mirror ▸ Transform Effect (live)</strong> for presets
                    (Radial Fan, Rosette, Spiral, Echo), then <strong>Expand to Elements</strong> to bake the copies into
                    real, editable objects, or <strong>Remove Effect</strong> to clear it.
                </p>
                <pre><code>{`Y.setTransformEffect({ copies: 11, rotate: 30, originX: 0, originY: 0.5 }); // radial fan
Y.setTransformEffect({ copies: 14, rotate: 22, scaleX: 0.86, scaleY: 0.86, moveX: 8, moveY: -6 }); // spiral
Y.expandTransformEffect();  // bake copies 1..N into real elements
Y.clearTransformEffect();   // remove the effect`}</code></pre>
                <p class="tip-box">
                    <strong>Pivot:</strong> <code>originX/originY</code> are bbox fractions (0–1, default centre 0.5).
                    Set <code>originX:0</code> to rotate about the left edge for a fan that opens outward.
                    <strong>Known limits (first cut):</strong> scale is uniform, and <em>Expand</em> bakes cleanly for
                    move + rotate + uniform-scale + reflect (non-uniform-scale-with-rotation baking is a follow-up).
                </p>
            </section>

            <section class="doc-section">
                <h2>Feather &amp; Outer Glow</h2>
                <p>
                    <strong>Feather</strong> softly blurs an object’s edges to transparent — great for soft shadows,
                    vignettes or a dreamy halo. <strong>Outer Glow</strong> adds a coloured halo around the object (a
                    shadow with zero offset). Both are non-destructive element properties; set the radius to
                    <code>0</code> / pass <code>enabled:false</code> to remove.
                </p>
                <p>
                    <strong>How to reach it:</strong> the property panel has a <strong>GLOW &amp; FEATHER</strong>
                    section with live sliders — <strong>Feather</strong> radius, and an <strong>Outer Glow</strong>
                    toggle with <strong>colour</strong> + <strong>radius</strong>. They’re also in the right-click
                    <strong> Effects ✨</strong> menu (presets) and the command palette (⌘/Ctrl-K). Scribble is in
                    the Effects menu / palette too. Or script them:
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
                    <strong> UI:</strong> open the <strong>Swatches</strong> panel (<kbd>Alt + W</kbd>, or View →
                    Swatches) to add, group and apply swatches; the info sheet drops onto the canvas.
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
