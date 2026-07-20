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
                    them from scratch is slow. The library ships a large set of hand-authored figures across six
                    everyday categories (Daily &amp; Emotions, Office &amp; Work, Meetings &amp; Talks, Street &amp;
                    Travel, Social &amp; Family, and Services) — each in four character variants — plus standalone
                    props and ready-made multi-figure scenes, so you can drop the right pose in a click.
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

            {/* ─── FACES & HAIR ───────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Faces &amp; hair</h2>
                <p>
                    Every figure wears an <strong>expression</strong> and a <strong>hair style</strong>. The
                    <strong> Face &amp; hair</strong> section sits at the bottom of the Stick Figures panel — and also
                    appears in the <strong>Properties</strong> panel whenever a figure is selected, so you never have to
                    go looking for it.
                </p>
                <ul>
                    <li><strong>Expression</strong> — 12 styles: Neutral, Happy, Sad, Angry, Surprised, Tired, Excited,
                        Proud, Confused, Scared, Wink, and None (a blank head).</li>
                    <li><strong>Hair</strong> — 10 styles: Short, Curly, Spiky, Fringe, Long, Bun, Ponytail, Pigtails,
                        Side swept, and None.</li>
                    <li><strong>Hair colour</strong> — applies to the solid styles (Short, Curly, Bun, Pigtails, Side
                        swept). The outline styles follow the figure's stroke colour instead.</li>
                    <li><strong>Solid head</strong> — fills the head white so eyes and mouth stay readable over busy
                        artwork or a coloured background. Off by default, which keeps heads see-through.</li>
                </ul>
                <p>
                    With <strong>nothing selected</strong> the picker sets what the <em>next</em> figure you add will
                    wear (and the thumbnails update to match). With a figure <strong>selected</strong> it restyles that
                    figure immediately — including animated figures, which change expression mid-animation.
                </p>
                <p>
                    The face is generated from the head circle alone, so a restyle still works after you have moved,
                    scaled, rotated or even <strong>ungrouped</strong> a figure. Changing the expression leaves the hair
                    alone, and vice versa.
                </p>
                <p>
                    Each pose ships with a sensible default — <em>Sad</em> wears a sad face, <em>Jumping for joy</em> an
                    excited one, <em>Thinking</em> a confused one — and the character variants pick their own hair
                    (Man → Short, Woman → Fringe, Boy → Spiky, Girl → Pigtails). Pick a style explicitly and it wins
                    everywhere.
                </p>
                <p class="tip-box">
                    <strong>Known limitations.</strong> Faces are drawn front-on, so a strongly side-on pose still shows
                    two eyes (animated figures nudge the face toward the direction they face). Expressions are picked
                    from the list — there is no free-hand face editor — but because every mark is a real vector path you
                    can ungroup a figure and nudge an eyebrow by hand.
                </p>
            </section>

            {/* ─── RECOLOUR / EDIT ────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Recolour by part (one click)</h2>
                <p>
                    Every part of a figure is tagged with a semantic <strong>role</strong> — <em>body</em> and
                    <em> head</em> (the outline), <em>face</em> (eyes, brows, mouth), <em>hair</em>,
                    <em> accent</em> (colourful props like a laptop screen, briefcase or delivery box) and
                    <em> prop</em> (neutral structure like a podium or whiteboard). Select a figure
                    and the panel shows a <strong>Recolour selected figure</strong> section:
                </p>
                <ul>
                    <li><strong>Outline</strong> — recolours the whole figure's stroke in one click (pick a swatch or
                        the colour well). Eyes and mouth follow the outline, so the face never goes out of step.</li>
                    <li><strong>Accent</strong> — recolours just the colourful props, leaving the outline and neutral
                        parts untouched.</li>
                    <li><strong>Hair</strong> — recolours the solid hair styles only.</li>
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
                        accents, or in pure monochrome (outline only — solid hair loses its fill too). Your choice is
                        remembered.</li>
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
Y.recolorStickFigure({ outline: '#7c3aed', accent: '#ec4899', hair: '#2b2118' }, ids);

// Faces & hair
Y.listStickFaces();                     // [{id:'happy', name:'Happy'}, …] — 12 expressions
Y.listStickHairStyles();                // [{id:'bun', name:'Bun'}, …] — 10 styles
Y.setStickFace({ face: 'happy', hair: 'bun', hairColor: '#2b2118' }, ids);
Y.setStickFace({ face: 'angry' });      // omitted fields are left alone; defaults to the selection
Y.getStickFace(ids);                    // {face, hair, hairColor, headFill}
// …or set it at drop time:
Y.insertStickFigure('daily-waving', { face: 'wink', hair: 'ponytail', headFill: true });

Y.toggleStickFigurePanel(true);         // open the panel`}</code></pre>
                <p class="tip-box">
                    API: <code>insertStickFigure(id, opts?)</code>, <code>recolorStickFigure(colors, ids?)</code>,
                    <code> setStickFace(opts, ids?)</code>, <code>getStickFace(ids?)</code>,
                    <code> listStickFaces()</code>, <code>listStickHairStyles()</code>,
                    <code> listStickFigures(category?)</code>, <code>listStickFigureCategories()</code>,
                    <code> toggleStickFigurePanel(visible?)</code>.
                </p>
                <p class="tip-box">
                    <code>setStickFace</code> works on dropped figures <em>and</em> animated ones, so you can drive a
                    whole cast's expressions from a script.
                </p>
            </section>

            {/* ─── Comic panels ───────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Turn a script into a comic panel</h2>
                <p>
                    Write a few lines of dialogue and YappyDraw draws the panel for you —
                    figures posed from what they say, arranged so they face each other, with
                    speech balloons above them in the right reading order.
                </p>
                <p class="tip-box">
                    Open <strong>Comic Studio</strong> from the Window/Panels menu (or the command
                    palette) to do all of this without touching code: type your script and the panel
                    shows who it found, the pose each will strike and how many panels it will make.
                    Pick a figure (Man/Woman/Boy/Girl) and an <strong>emotion</strong> per speaker to
                    override what the words suggested, then hit Generate.
                </p>
                <pre><code>{`const Y = window.Yappy;
Y.createComicPanel(\`Alice: Hi Bob!
Bob: I think we should ship it.
Alice: ARE YOU SURE?\`);

// options
Y.createComicPanel(script, {
  x: 100, y: 100,        // omit to centre on the page
  figureHeight: 260,     // how tall the figures are (default 210)
  frame: false,          // no panel border
  monochrome: true,      // outline-only figures
  fontSize: 20,          // balloon text size
  variants: { Alice: 'female', Sam: 'boy' },   // pick a figure per speaker
});`}</code></pre>
                <h3>Thoughts and whispers</h3>
                <p>
                    Add a cue in brackets after the name to change the balloon:
                </p>
                <pre><code>{`Ann: Did we ship it?
Ben (thinks): I have no idea
Ann (whispers): me neither`}</code></pre>
                <p>
                    <code>(thinks)</code> draws a thought cloud, <code>(whispers)</code> a dashed
                    aside in italics; anything else is a normal speech balloon. An unrecognised
                    bracket stays part of the name, so <code>Ann (CEO):</code> still works.
                </p>

                <h3>Narration captions</h3>
                <p>
                    Start a line with <code>*</code> or wrap it in <code>[ ]</code> for a caption
                    box — the “MEANWHILE…” panel comics use to set the scene:
                </p>
                <pre><code>{`* Friday, 5pm
Ann: Did we ship it?
[MEANWHILE...]
Ben: ON IT`}</code></pre>
                <p>
                    A caption belongs to the panel rather than to a person: it puts nobody in the
                    scene, doesn’t start a new panel on its own, and sits at the panel’s top-left
                    where it reads first.
                </p>

                <h3>Setting the mood yourself</h3>
                <p>
                    The words only suggest a pose. When you know better, set an emotion for a
                    speaker — Neutral, Happy, Laughing, Sad, Angry, Shouting, Thinking, Unsure,
                    Waving, Pointing, Idea, Presenting, Love or Asking — in Comic Studio, or via
                    the API:
                </p>
                <pre><code>{`Y.createComicPanel(script, { emotions: { Bob: 'angry', Ann: 'laughing' } });`}</code></pre>
                <p>
                    “Auto” hands the choice back to the words.
                </p>
                <p>
                    For a mood that changes as the story goes, put the emotion in the script
                    instead — it applies to that line only, so a character can be cheerful in one
                    panel and furious in the next:
                </p>
                <pre><code>{`Ann (happy): the build is green
Ben: nice
Ann (angry): the build is green
Ben: oh`}</code></pre>
                <p>
                    Cues combine, so <code>Ann (angry, whispers):</code> works. An inline cue beats
                    the panel’s emotion picker, which beats what the words suggested. If any part of
                    the bracket isn’t recognised the whole thing stays part of the name, so
                    <code> Ann (CEO):</code> is safe.
                </p>

                <p>
                    Each <code>Name: line</code> row becomes one balloon. The pose comes from the
                    words themselves: a greeting waves, ALL CAPS or <code>!!!</code> shouts,
                    <code> :-(</code> looks sad, <code>lol</code> laughs, “maybe” thinks,
                    “you” points, a bare “?” shrugs — anything else stands neutral. When two cues
                    compete the stronger one wins, so “HI THERE!!!” shouts rather than waves.
                </p>
                <p class="tip-box">
                    Up to 4 speakers per panel, one pose each. The whole panel is grouped, so it
                    moves — and undoes — as a single unit. Spacing is worked out when the panel is
                    created; nothing is locked, so you can drag any figure or balloon afterwards.
                </p>

                <h3>Longer scripts become a strip</h3>
                <p>
                    Give a longer conversation to <code>createComicStrip</code> and it breaks into
                    multiple panels laid out left-to-right, wrapping into rows:
                </p>
                <pre><code>{`Y.createComicStrip(\`Ann: Hi Ben!
Ben: Hey! Did you ship it?
Ann: I think so
Ben: ARE YOU SURE?\`, { columns: 3, panelGap: 32 });`}</code></pre>
                <p>
                    A speaker only gets one balloon per panel, so when someone takes another turn
                    the strip moves to the next panel — an alternating back-and-forth naturally
                    becomes a row of two-person panels. The strip is one group (each panel a group
                    inside it), so you can move the whole thing or pull a single panel out.
                </p>
            </section>
        </div>
    );
};

export default StickLibraryDoc;
