/**
 * Symbols & Instances — help doc.
 * Reusable masters, linked instances, the Symbols panel, redefine / detach,
 * and edit-in-place.
 */

import type { Component } from 'solid-js';

const SymbolsDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Symbols &amp; Instances</h1>
                <p class="doc-intro">
                    A <strong>symbol</strong> is a reusable master made from a selection. Each copy you place is a
                    linked <strong>instance</strong> — change the master once and <em>every</em> instance updates.
                    Perfect for repeated UI elements, map pins, icons, logos and anything you use many times.
                </p>
            </header>

            {/* ─── WHAT & WHY ─────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>What it’s for</h2>
                <p>
                    Without symbols, ten copies of a button are ten independent objects — restyling means editing all
                    ten. With a symbol there is <strong>one source of truth</strong>: the master. Instances stay in
                    sync automatically, so a design change ripples everywhere in one step. Instances are also
                    lightweight — the document stores the master once plus a small reference (id + position + size)
                    per instance.
                </p>
                <p class="tip-box">
                    <strong>Symbol</strong> = the master definition (lives in the document’s symbol library).
                    &nbsp;<strong>Instance</strong> = a placed, linked copy on the canvas. Editing an instance’s
                    <em> contents</em> means editing the symbol; moving/resizing an instance affects only that copy.
                </p>
            </section>

            {/* ─── CREATE ─────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Create a symbol</h2>
                <p>
                    Select one or more objects, then right-click → <strong>Create Symbol</strong> (or the
                    <strong> +</strong> in the Symbols panel). Your selection becomes the master and is replaced by a
                    single linked instance. From then on you can place more instances that all share that master.
                </p>
                <pre><code>{`const Y = window.Yappy; Y.clear();
const circ = Y.createCircle(100, 100, 90, 90, { backgroundColor:'#2563eb', fillStyle:'solid' });
const star = Y.createStar(118, 118, 54, 54, 5, { backgroundColor:'#facc15', fillStyle:'solid' });
const symId = Y.createSymbol('Badge', [circ, star]);   // → 1 instance + a master
Y.placeInstance(symId, 260, 100);                      // drop another instance
Y.placeInstance(symId, 420, 100);`}</code></pre>
            </section>

            {/* ─── PANEL ──────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>The Symbols panel</h2>
                <p>
                    Open it with <strong>Alt+B</strong> (or View → <strong>Symbols Panel</strong>). It lists every
                    symbol with a live thumbnail and an <strong>instance count</strong> badge. From a card you can:
                </p>
                <ul>
                    <li><strong>Place</strong> a new instance (the <strong>+</strong> button, or double-click the thumbnail).</li>
                    <li><strong>Select</strong> all instances of a symbol on the canvas (single-click the thumbnail).</li>
                    <li><strong>Rename</strong> (double-click the name) and <strong>delete</strong> (🗑 — its instances are detached into editable copies first, so artwork is never lost).</li>
                    <li><strong>Redefine</strong> the master from the current selection (↻).</li>
                </ul>
            </section>

            {/* ─── EDIT IN PLACE ──────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Edit in place</h2>
                <p>
                    <strong>Double-click an instance</strong> (or right-click → <strong>Edit Symbol (in place)</strong>)
                    to open the master for editing right where the instance sits. The instance temporarily expands into
                    its editable parts and a breadcrumb appears at the top:
                </p>
                <ul>
                    <li><strong>Done</strong> (Enter) — apply your edits to the symbol; every instance updates.</li>
                    <li><strong>Cancel</strong> (Esc) — discard the edits; the instance is restored unchanged.</li>
                </ul>
                <p class="tip-box">
                    Edit-in-place is the usual way to change a symbol: tweak the artwork once, press <em>Done</em>, and
                    the change flows to all instances. Use <strong>Redefine</strong> instead when you’ve drawn a brand-new
                    version separately and want to replace the master with it.
                </p>
            </section>

            {/* ─── DETACH ─────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Detach (break the link)</h2>
                <p>
                    Right-click an instance → <strong>Detach Instance</strong> to turn it into ordinary, independently
                    editable shapes that no longer follow the master. Use this when one copy needs to diverge from the
                    rest.
                </p>
                <p class="tip-box">
                    API: <code>createSymbol(name, ids)</code>, <code>placeInstance(symbolId, x, y)</code>,
                    <code> redefineSymbol(symbolId, fromIds)</code>, <code>detachInstance(ids)</code>,
                    <code> enterSymbolEdit(instanceId)</code> / <code>exitSymbolEdit(save)</code>,
                    <code> renameSymbol</code>, <code>deleteSymbol</code>, <code>listSymbols()</code>,
                    <code> toggleSymbolsPanel()</code>.
                </p>
            </section>

            {/* ─── SCRIPTING (API) ────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Scripting (API)</h2>
                <p>
                    Symbols are fully scriptable from the global <code>window.Yappy</code> object — build a master
                    from ids, scatter instances, redefine the master, and break the link.
                </p>
                <pre><code>{`const Y = window.Yappy; Y.clear();

// build a master from two shapes, then place more instances
const a = Y.createCircle(100, 100, 90, 90, { backgroundColor: '#2563eb' });
const b = Y.createStar(118, 118, 54, 54, 5, { backgroundColor: '#facc15' });
const sym = Y.createSymbol('Badge', [a, b]);   // returns the symbol id
Y.placeInstance(sym, 260, 100);
Y.placeInstance(sym, 420, 100);

Y.listSymbols();                 // [{ id, name, width, height, instances }, …]`}</code></pre>
                <pre><code>{`// redefine the master from a redrawn version, or detach a copy
Y.redefineSymbol(sym, [newId1, newId2]);   // every instance updates
Y.detachInstance();                        // detach the selected instance(s)`}</code></pre>
                <table class="api-table">
                    <thead>
                        <tr><th>Method</th><th>What it does</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>createSymbol(name?, ids?)</code></td><td>Make a master from ids (default: selection); returns its id.</td></tr>
                        <tr><td><code>placeInstance(symbolId, x?, y?)</code></td><td>Drop a linked instance on the canvas.</td></tr>
                        <tr><td><code>redefineSymbol(symbolId, fromIds)</code></td><td>Replace the master; all instances update.</td></tr>
                        <tr><td><code>detachInstance(ids?)</code></td><td>Break the link into editable shapes (default: selection).</td></tr>
                        <tr><td><code>enterSymbolEdit(instanceId)</code> / <code>exitSymbolEdit(save)</code></td><td>Edit-in-place, then apply or cancel.</td></tr>
                        <tr><td><code>renameSymbol</code> / <code>deleteSymbol</code> / <code>listSymbols()</code></td><td>Manage the symbol library.</td></tr>
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default SymbolsDoc;
