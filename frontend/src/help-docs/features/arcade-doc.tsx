/**
 * Arcade — help doc for the Flash-style game mode: the game script, the
 * game.* API, Play/Stop, the touch gamepad, and HTML export.
 */

import type { Component } from 'solid-js';

const ArcadeDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Arcade — build games on the canvas</h1>
                <p class="doc-intro">
                    A Flash-style game mode. Build games two ways: the <strong>visual Game Builder</strong>
                    (no code — give your sprites WHEN→DO behaviors from a panel), or write a small
                    <strong> game script</strong> in JavaScript. Press <strong>Play</strong> and it drives the
                    live canvas at 60&nbsp;fps; <strong>Stop</strong> (or Esc) restores the document exactly.
                    Games run in the editor and the exported HTML player, with keyboard <em>and</em> an
                    on-screen touch gamepad, so they're playable on tablets.
                </p>
            </header>

            <section class="doc-section">
                <h2>Game Builder — no code (start here)</h2>
                <p>
                    <strong>Menu → Game Builder</strong> (or right-click a sprite → <strong>Edit Behaviors</strong>)
                    opens the Behaviors panel. Brand new? Tap <strong>Load example: Pong</strong> and press
                    ▶ Play. To build your own:
                </p>
                <ol>
                    <li>Draw shapes for your sprites. Select one and give it a <strong>Name</strong>
                        (e.g. "Ball") in the panel — that's how rules refer to it.</li>
                    <li>Add rules as <strong>WHEN → DO</strong>: pick a trigger
                        (<em>when it starts, while key held, when it hits…, when tapped, when it leaves the
                        screen</em>) and one or more actions (<em>move, glide, bounce, change score, spawn,
                        destroy, go to state, play effect, win, game over…</em>).</li>
                    <li>The <strong>Scene</strong> tab holds whole-game rules (set the score at start, win/lose).
                        The <strong>Code</strong> tab shows the <code>game.*</code> code your blocks generate —
                        a read-only peek that's a nice bridge to real coding.</li>
                    <li>Press <strong>▶ Play</strong> in the panel. Everything saves with the document and
                        exports to a playable HTML file.</li>
                </ol>
                <p class="tip-box">
                    Blocks are the real thing — they compile to the same <code>game.*</code> script the code
                    editor uses, so a builder game and a hand-written game play identically and both export.
                </p>
            </section>

            <section class="doc-section">
                <h2>Game Script — write code (advanced)</h2>
                <ol>
                    <li><strong>Menu → Game Script (advanced)…</strong> opens the code editor. Pick a starter —
                        <strong> Pong</strong>, <strong>Catch the Stars</strong>, or <strong>Blank</strong> —
                        or write your own.</li>
                    <li>Press <strong>▶ Play</strong>. The document is snapshotted; your script runs once
                        (setup), then <code>game.onTick</code> fires every frame.</li>
                    <li>Play mode is a <strong>clean stage</strong> — every editor toolbar, panel, and the
                        page frame disappear, and the page fills the screen. Play with
                        <kbd>←→↑↓</kbd>/<kbd>WASD</kbd>, <kbd>Space</kbd>/<kbd>Z</kbd> (A) and
                        <kbd>X</kbd>/<kbd>Shift</kbd> (B) — or the on-screen D-pad + A/B buttons on touch
                        devices. Dragging/tapping the canvas reaches the game as pointer input.</li>
                    <li>After <code>game.end()</code>, a <strong>Play again</strong> / <strong>Exit</strong>
                        panel appears. <strong>Stop</strong> (top-center) or <kbd>Esc</kbd> ends the game and
                        restores the editor exactly — nothing a game does is ever saved.</li>
                </ol>
                <p class="tip-box">
                    Hand-drawn sprites: draw a shape, then find it from the script with
                    <code> game.find('…')</code> — it matches an element's id, its <code>tag</code>, or its
                    text. The script saves with the document (and autosave).
                </p>
                <p>
                    <strong>Many games:</strong> each document holds one game (its art + its script). To keep a
                    library, save each with <strong>Save / Export</strong> as a <code>.yappy</code> file, or use
                    <strong> Templates → Save Current as Template</strong> — the game travels with the template,
                    so <strong>My Templates</strong> becomes your game shelf.
                </p>
            </section>

            <section class="doc-section">
                <h2>The game API</h2>
                <pre><code>{`game.width / height / x / y        // the page = your stage
game.onTick((dt, t) => …)          // every frame; dt = seconds since last
game.onKey('a', () => …)           // once per press: left right up down a b
game.key('left')                   // is a button held right now?
game.pointer()                     // {x, y, down} in stage coordinates
game.onPointerDown((x, y) => …)    // taps / clicks

game.spawn('circle', x, y, w, h, {backgroundColor: '#f00'})
game.spawnText('Hello', x, y, 32)
game.find('paddle')                // by id, tag, or text
sprite.moveBy(dx, dy)  .moveTo(x, y)  .centerAt(cx, cy)
sprite.x .y .width .height .cx .cy
sprite.color('#0f0')  .setText('9')  .rotateBy(90)
sprite.hide() .show() .destroy()

game.hit(a, b)                     // do two sprites overlap?
game.hud('SCORE 3')                // big top text
game.end('GAME OVER')              // freeze with a message
game.pad(true)                     // force the touch gamepad on/off
game.random(min, max) · game.clamp(v, min, max)`}</code></pre>
            </section>

            <section class="doc-section">
                <h2>Sharing your game</h2>
                <p>
                    <strong>Menu → Export / Save… → HTML</strong> produces a single self-contained file:
                    anyone opening it sees your design with a big <strong>▶ Play Game</strong> button — no
                    install, works offline, touch controls included. The script also travels with
                    <code> .yappy</code>/JSON saves and My Templates.
                </p>
                <pre><code>{`const Y = window.Yappy;      // scripting from the console works too
Y.setGameScript(src);        // save a script
Y.startGame();               // play (Y.stopGame() to end)
Y.isGameRunning();`}</code></pre>
                <p class="tip-box">
                    Ticks never touch undo history or autosave — the pre-play snapshot is the only
                    restore point, so even a runaway script can't damage your document.
                </p>
            </section>
        </div>
    );
};

export default ArcadeDoc;
