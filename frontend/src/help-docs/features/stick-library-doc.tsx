/**
 * Stick-Figure Library — help doc.
 * A drawify-style catalog of reusable, editable stick figures you drag onto the
 * canvas. Covers the panel, drop-as-editable-group behaviour, recolouring, and API.
 */

import type { Component } from 'solid-js';

const StickLibraryDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Stick-Figure Library</h1>
                <p class="doc-intro">
                    A searchable, categorized panel of reusable <strong>stick-figure illustrations</strong> —
                    drawify-style people you drag onto the canvas to bring scenes, slides and diagrams to life.
                    Every figure drops in as an <strong>editable, recolourable vector group</strong>, not a
                    flat image, so you can restyle it to match your design.
                </p>
            </header>

            {/* ─── WHAT & WHY ─────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>What it’s for</h2>
                <p>
                    Illustrated people make explainers, workshops and presentations far more relatable — but drawing
                    them from scratch is slow. The library ships <strong>24 hand-authored figures</strong> across six
                    everyday categories (Daily &amp; Emotions, Office &amp; Work, Meetings &amp; Talks, Street &amp;
                    Travel, Social &amp; Family, and Services) so you can drop the right pose in a click.
                </p>
                <p class="tip-box">
                    Figures import as normal Yappy <strong>path</strong> shapes grouped into one object. That means you
                    can move/scale them as a unit, or <em>ungroup</em> to edit an individual limb, prop or the head.
                </p>
            </section>

            {/* ─── PANEL ──────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>The Stick Figures panel</h2>
                <p>
                    Open it from the toolbar (walking-person button) or the menu → <strong>Stick Figures</strong>.
                    The panel has:
                </p>
                <ul>
                    <li>A <strong>search box</strong> — type “wave”, “laptop”, “bike”, “box”… to match names and tags.</li>
                    <li><strong>Category chips</strong> — six figure themes (Daily &amp; Emotions, Office &amp; Work,
                        Meetings &amp; Talks, Street &amp; Travel, Social &amp; Family, Services) plus <strong>Props</strong>
                        (standalone objects — laptop, phone, chart, box, bulb, speech bubble…) and <strong>Scenes</strong>
                        (multi-figure bundles — handshake, team, family, celebration).</li>
                    <li><strong>Character variant</strong> chips — <strong>Man / Woman / Boy / Girl</strong> (or All).
                        Every figure pose comes in all four; women get hair and a skirt, children a bigger head and
                        shorter body.</li>
                    <li>A <strong>thumbnail grid</strong> — each cell previews the figure.</li>
                </ul>
            </section>

            {/* ─── ADD TO CANVAS ──────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Add a figure</h2>
                <ul>
                    <li><strong>Click</strong> a thumbnail — the figure is added centered on the active page.</li>
                    <li><strong>Drag</strong> a thumbnail onto the canvas — the figure drops centered on the cursor,
                        exactly where you release.</li>
                </ul>
                <p>
                    Either way it arrives selected and grouped as one editable object.
                </p>
            </section>

            {/* ─── RECOLOUR / EDIT ────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Recolour by part (one click)</h2>
                <p>
                    Every part of a figure is tagged with a semantic <strong>role</strong> — <em>body</em> and
                    <em> head</em> (the outline), <em>accent</em> (colourful props like a laptop screen, briefcase or
                    delivery box) and <em>prop</em> (neutral structure like a podium or whiteboard). Select a figure
                    and the panel shows a <strong>Recolour selected figure</strong> section:
                </p>
                <ul>
                    <li><strong>Outline</strong> — recolours the whole figure's stroke in one click (pick a swatch or
                        the colour well).</li>
                    <li><strong>Accent</strong> — recolours just the colourful props, leaving the outline and neutral
                        parts untouched.</li>
                </ul>
                <p>
                    For finer control, because figures are real vectors you can also <strong>ungroup</strong>
                    (right-click → Ungroup) and give any single part — a limb, the head, or one prop — its own
                    fill/stroke. Scale, rotate and reposition freely; the outline stays crisp at any size, and drops in
                    at a clean <strong>4&nbsp;px</strong> weight by default.
                </p>
                <p class="tip-box">
                    Figures render in the clean <strong>architectural</strong> style by default. Convert a selected
                    figure to the hand-drawn <strong>sketch</strong> look from the Properties panel if you want it to
                    match a sketchy document.
                </p>
            </section>

            {/* ─── BROWSE FASTER ──────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Browse faster</h2>
                <ul>
                    <li><strong>Colour / Mono</strong> toggle (next to search) — drop figures with their flat colour
                        accents, or in pure monochrome (outline only). Your choice is remembered.</li>
                    <li><strong>★ Favourites</strong> — tap the star on any figure to save it; the Favourites chip
                        gathers them.</li>
                    <li><strong>Recent</strong> — figures you add are listed under the Recent chip so you can re-drop
                        them fast.</li>
                    <li><strong>Keyboard</strong> — Tab into the grid, move with the arrow keys, and press
                        <strong> Enter</strong> to add the focused figure.</li>
                </ul>
            </section>

            {/* ─── REUSE AS SYMBOL ────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Reuse as a Symbol</h2>
                <p>
                    Using the same figure many times? Select it and click <strong>Add to Symbols</strong> in the panel.
                    It becomes a linked <strong>Symbol</strong> — place as many instances as you like and edit the
                    master once to update them all. See the <em>Symbols &amp; Instances</em> help topic for the full
                    workflow.
                </p>
            </section>

            {/* ─── API ────────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Automate it (API)</h2>
                <pre><code>{`const Y = window.Yappy;
Y.listStickFigureCategories();          // [{id:'daily', name:'Daily & Emotions'}, …]
Y.listStickFigures('office');           // figures in a category
const ids = Y.insertStickFigure('daily-waving');   // add centered; returns each part's id
Y.insertStickFigure('service-delivery', { x: 400, y: 200, targetWidth: 160 });
Y.recolorStickFigure({ outline: '#7c3aed', accent: '#ec4899' }, ids); // recolour by role
Y.toggleStickFigurePanel(true);         // open the panel`}</code></pre>
                <p class="tip-box">
                    API: <code>insertStickFigure(id, opts?)</code>, <code>recolorStickFigure(colors, ids?)</code>,
                    <code> listStickFigures(category?)</code>, <code>listStickFigureCategories()</code>,
                    <code> toggleStickFigurePanel(visible?)</code>.
                </p>
            </section>
        </div>
    );
};

export default StickLibraryDoc;
