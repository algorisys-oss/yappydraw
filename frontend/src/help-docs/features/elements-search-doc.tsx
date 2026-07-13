/**
 * Unified Element Search — help doc.
 * One search box in the Elements panel that fans a single query across icons,
 * illustrations, shapes and photos and returns a blended grid (Canva-style).
 * Covers the panel, the type chips, the keyword-alias relevance, attribution,
 * the Alt+E hotkey and the scripting API.
 */

import type { Component } from 'solid-js';

const ElementsSearchDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Element Search</h1>
                <p class="doc-intro">
                    Type one word and get <strong>everything</strong> — icons, illustrations, shapes, photos
                    and whole <strong>templates</strong> — in a single blended grid. Yappy's Elements panel
                    searches across every asset library at once and understands natural words (search
                    <em> “money”</em> and you get the dollar icon and the money-bag illustration, not just
                    filename matches).
                </p>
            </header>

            {/* ─── OPEN ───────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Open the panel</h2>
                <ul>
                    <li>Press <kbd>Alt</kbd>+<kbd>E</kbd>, or</li>
                    <li>Menu → <strong>Elements</strong>, or</li>
                    <li>Command palette → <em>“Toggle Elements Panel”</em>.</li>
                </ul>
            </section>

            {/* ─── SEARCH ─────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Searching</h2>
                <p>
                    Type in the search box and results stream into one grid. Offline assets (icons, illustrations,
                    shapes) appear instantly; photos are fetched from Wikimedia Commons a moment later. Use the
                    <strong> type chips</strong> — <strong>All · Icons · Illustrations · Shapes · Photos ·
                    Templates</strong> — to narrow the feed to one kind. When Photos is active, extra orientation chips
                    (Landscape / Portrait / Square) appear.
                </p>
                <p class="tip-box">
                    <strong>Semantic keywords.</strong> A hand-curated alias map expands your query into related
                    concepts, so everyday words find the right asset even when it's named differently — e.g.
                    <em> love → heart</em>, <em>money → dollar / coin / wallet</em>, <em>idea → lightbulb / brain</em>,
                    <em> chat → speech bubble</em>, <em>secure → lock / shield</em>, <em>goal → target / trophy</em>.
                </p>
            </section>

            {/* ─── ASSET KINDS ────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>What you can find</h2>
                <ul>
                    <li><strong>Icons</strong> — the full Lucide line-icon set, inserted as editable vector paths.</li>
                    <li><strong>Illustrations</strong> — a curated, colourful <strong>OpenMoji</strong> set
                        (hearts, rockets, charts, trophies, tools, weather, food, travel…). Each drops in as a
                        fully <strong>editable, recolourable vector</strong> — a genuine edge over flat graphics.</li>
                    <li><strong>Shapes</strong> — rectangle, circle, triangle, star, heart, hexagon, speech bubble,
                        arrow… (also aliased: <em>box → rectangle</em>, <em>bubble → speech</em>).</li>
                    <li><strong>Photos</strong> — openly licensed images from Wikimedia Commons. Click to insert or
                        drag onto the canvas (drop onto a frame to fill it).</li>
                    <li><strong>Templates</strong> — whole ready-made designs (posters, cards, social posts,
                        resumes…), including a greeting-card family (birthday, thank-you, congrats, party
                        invite, anniversary, new baby). Each result shows a mini page preview. Clicking a
                        template <strong>loads it as the document</strong> — since that replaces the current
                        design, you're asked to confirm first if you have unsaved changes.</li>
                </ul>
                <p>
                    With no query, the panel shows a <strong>browse view</strong> instead: quick shapes, photo
                    frames, a featured-icon set and font pairings.
                </p>
            </section>

            {/* ─── ATTRIBUTION ────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Licensing &amp; attribution</h2>
                <p>
                    Illustrations come from <strong>OpenMoji</strong> (<a href="https://openmoji.org" target="_blank" rel="noreferrer">openmoji.org</a>),
                    licensed <strong>CC&nbsp;BY-SA&nbsp;4.0</strong>; the panel keeps that credit visible under the
                    results. Photos are openly licensed via Wikimedia Commons with the source link retained on each
                    inserted image.
                </p>
            </section>

            {/* ─── API ────────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Scripting API</h2>
                <p>Everything the panel does is scriptable through <code>window.Yappy</code>:</p>
                <pre class="doc-code"><code>{`// Open the panel
Yappy.toggleElementsPanel(true);

// Search every provider (icons + illustrations + shapes + photos)
const hits = await Yappy.searchElements('rocket');
// each hit: { kind, id, label, thumbSvg | thumbUrl, insert() }

// Restrict the scope (skip the async photo fetch)
const vectors = await Yappy.searchElements('money', { kinds: ['icon', 'illustration'] });

// Insert one onto the canvas (centre of the active page)
Yappy.insertElement(vectors[0]);
// …or at a specific world point
Yappy.insertElement(vectors[0], { x: 400, y: 300 });

// hit.insert() works directly too
hits[0].insert();`}</code></pre>
                <p class="tip-box">
                    <code>searchElements</code> returns a Promise — icons/illustrations/shapes resolve immediately,
                    photos are appended when the network call finishes (pass <code>includePhotos: false</code> or omit
                    <code>'photo'</code> from <code>kinds</code> to stay fully offline).
                </p>
            </section>
        </div>
    );
};

export default ElementsSearchDoc;
