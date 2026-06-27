/**
 * Artboards — help doc.
 * Named export-region frames: add (presets), move/resize/delete on canvas, and
 * export each region to PNG.
 */

import type { Component } from 'solid-js';

const ArtboardsDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Artboards</h1>
                <p class="doc-intro">
                    An <strong>artboard</strong> is a named frame on the infinite canvas that marks a fixed-size
                    export region — like a page or a screen. Lay out several side by side (a poster, an A4 sheet, a set
                    of social posts) and export each one to its exact pixel dimensions.
                </p>
            </header>

            {/* ─── WHAT & WHY ─────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>What it’s for</h2>
                <p>
                    The canvas itself is infinite and unitless. Artboards add <strong>bounded, named regions</strong>
                    with real dimensions so you can compose multiple deliverables in one document and export each at a
                    precise size — without cropping by hand. They’re drawn as light frames <em>behind</em> your artwork
                    and never appear in the exported image (only the content inside the region is exported).
                </p>
                <p class="tip-box">
                    Artboards are a layout/export aid, not containers — objects aren’t “inside” an artboard, they just
                    overlap its region. Anything within the frame’s bounds is what that artboard exports.
                </p>
            </section>

            {/* ─── ADD ────────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Add an artboard</h2>
                <p>
                    Right-click empty canvas → <strong>Artboards</strong> → pick a preset (Square 1080, A4 Portrait /
                    Landscape, Instagram Story, Web 1280, Slide 16:9), or <strong>Artboard from Selection</strong> to
                    fit a frame around what you’ve selected. New artboards are placed to the right of any existing ones.
                </p>
                <pre><code>{`const Y = window.Yappy;
Y.addArtboard('Square 1080');      // 1080×1080 preset
Y.addArtboard('A4 Portrait', 1200, 0);
Y.addArtboard('selection');        // fit around the current selection`}</code></pre>
            </section>

            {/* ─── EDIT ON CANVAS ─────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Move, resize &amp; delete</h2>
                <p>
                    Each artboard shows a small <strong>name chip</strong> (with its live width × height) at its
                    top-left corner:
                </p>
                <ul>
                    <li><strong>Move</strong> — drag the name chip.</li>
                    <li><strong>Select</strong> — click the chip; the frame gains 8 <strong>resize handles</strong> (corners + edge midpoints). Drag a handle to resize.</li>
                    <li><strong>Delete</strong> — the red <strong>×</strong> on the chip, or press <strong>Delete / Backspace</strong> while it’s selected.</li>
                    <li><strong>Deselect</strong> — click anywhere off the artboard, or press <strong>Esc</strong>.</li>
                </ul>
                <p class="tip-box">
                    The frame is visual only — you can still draw <em>inside</em> a selected artboard; only the chip and
                    handles respond to the pointer.
                </p>
            </section>

            {/* ─── EXPORT ─────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Export a region</h2>
                <p>
                    Right-click empty canvas → <strong>Artboards</strong> → an artboard’s submenu → <strong>Export PNG
                    (2× / 1×)</strong> to render just that region at the chosen scale. 2× gives a crisp,
                    retina-resolution image.
                </p>
                <pre><code>{`const Y = window.Yappy;
const id = Y.addArtboard('Web 1280');
Y.exportArtboard(id, 2);   // download a 2× PNG of that frame`}</code></pre>
                <p class="tip-box">
                    API: <code>addArtboard(preset?, x?, y?)</code>, <code>renameArtboard(id, name)</code>,
                    <code> updateArtboard(id, patch)</code>, <code>deleteArtboard(id)</code>,
                    <code> listArtboards()</code>, <code>exportArtboard(id, scale)</code>.
                </p>
            </section>

            {/* ─── REARRANGE / DUPLICATE / FIT ────────────────────────── */}
            <section class="doc-section">
                <h2>Rearrange, duplicate &amp; fit</h2>
                <p>
                    <strong>Rearrange All</strong> lays every artboard out in a tidy grid (auto columns, or pass a
                    count + gap). <strong>Duplicate</strong> copies a frame <em>and the artwork on it</em> to the right.
                    <strong> Fit to Artwork</strong> shrink-wraps a frame to the content sitting on it — perfect for a
                    logo lock-up with even clear space. <strong>Paste on All Artboards</strong> drops the selection onto
                    every other artboard at the same relative position (great for a watermark or logo).
                </p>
                <pre><code>{`Y.rearrangeArtboards(3, 40);   // 3 columns, 40px gap (omit args = auto grid)
Y.duplicateArtboard(id);       // frame + its artwork, placed to the right
Y.fitArtboardToArtwork(id, 20);// resize to content + 20px padding
Y.pasteOnAllArtboards();       // copy the selection onto every artboard`}</code></pre>
                <p class="tip-box">
                    Print: set a <strong>bleed</strong> in Settings → Print Bleed (<code>Y.setBleed(20)</code>) to draw
                    a bleed boundary + crop marks around each artboard.
                </p>
            </section>
        </div>
    );
};

export default ArtboardsDoc;
