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
                        (<em>when it starts, every moment, key pressed/held, when tapped, when it hits…, when it
                        leaves the screen, when a variable reaches…, every few seconds</em>) and one or more
                        actions (<em>move, glide, bounce, change score, set/change/show variable, jump to,
                        spawn, destroy, go to state, play effect, <strong>play sound</strong>,
                        <strong>background music</strong>, go to page, win, game over…</em>).</li>
                    <li><strong>Sound</strong> is built in — no files needed. <em>Play sound</em> offers arcade
                        SFX (coin, jump, hit, powerup, explosion, win, lose…); the ▶ button in the panel lets
                        you hear one. A Scene rule <em>on start → background music on</em> loops a gentle tune.
                        Sound works offline and in exported games.</li>
                    <li><strong>Physics for platformers:</strong> give a sprite <em>gravity</em> so it falls,
                        <em>jump</em> for an upward hop, and <em>while touching [Ground] → land</em> so it rests
                        on platforms instead of falling through. <em>Jump</em> only fires when the sprite is
                        standing on something (no mid-air double-jumps), so it reads like a real platformer hop.
                        The <strong>Platformer</strong> example is a full little level: run and jump across three
                        floating platforms, collect the coins for points, and reach the flag to win (fall off the
                        screen and it's game over).</li>
                    <li><strong>Variables</strong> (the <em>Vars</em> tab) hold numbers like lives, health, or
                        ammo. Declare them with a starting value in one place; rules change them with
                        <em>set/change variable</em>, react with <em>when a variable reaches…</em>, and gate
                        actions with <em>only if</em>. Names used in rules but not yet declared show up as
                        one-tap chips, and renaming a variable updates every rule that uses it. For example: a
                        Scene rule
                        <em>on start → set variable "lives" to 3</em>, a sprite rule
                        <em>when it hits Spike → change variable "lives" by −1</em>, and a Scene rule
                        <em>when "lives" is at most 0 → game over</em>. Use <em>show variable</em> to display
                        it on screen.</li>
                    <li><strong>Messages &amp; logic:</strong> a rule can <em>broadcast a message</em> and any sprite
                        can react with <em>when I receive [message]</em> — wire a button to a door, a death to a
                        "game over" everywhere. Add <strong>Only if…</strong> to a rule (the ? button) to gate it
                        on a variable — two rules with opposite conditions give you if/else
                        (<em>hit Spike, only if lives ≥ 2 → lose a life</em>; <em>hit Spike, only if lives ≤ 1 →
                        game over</em>).</li>
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
                <h2>Game Graph — the node view</h2>
                <p>
                    The game tools live under <strong>Menu → Game</strong>: <strong>New Game…</strong> (pick a
                    <strong>stage size</strong> — the page is your fixed play window — then Blank /
                    Pong / Catch / Platformer / <strong>Slingshot</strong> (an Angry-Birds-style code sample:
                    drag the bird back, release to fire, smash the blocks to pop the pigs — clear a level and
                        press <kbd>Space</kbd> for the next) / Code),
                    <strong>My Games…</strong> (a gallery of your saved games —
                    hover a card to Play, click to open, or start a new one), and the editors Build · Node Graph ·
                    Blueprint · Code · Play. The three visual editors — <strong>Simple</strong> (rule list),
                    <strong>Graph</strong> (node/wire view) and <strong>Blueprint</strong> (execution flow) —
                    are three views of the same game; a <strong>Simple · Graph · Blueprint</strong> switcher in
                    each header hops between them in a click.
                </p>
                <p>
                    <strong>Menu → Game → Node Graph</strong> opens a full-screen node view of your whole game.
                    Every rule is a <strong>node</strong> (its sprite, WHEN trigger, and DO actions); a
                    <em>broadcast</em> in one node draws a <strong>wire</strong> to every node that
                    <em>receives</em> that message, so you can see at a glance how the game's events connect.
                    Rules that <em>go to a state</em> or <em>go to a page</em> also draw a dashed
                    <strong>flow wire</strong> to a target pill (violet for states, sky-blue for pages), so
                    your scene / level flow is visible too — and you can <strong>drag a rule's flow-out port
                    onto another pill</strong> to re-target the jump.
                </p>
                <ul>
                    <li><strong>Edit rules right in the node</strong> — each card has the same editable
                        <strong>WHEN</strong> trigger picker, <strong>DO</strong> action rows (＋ action to add,
                        × to remove), and <strong>＋ only if</strong> guard as the Behaviors panel. Change a
                        dropdown or type a value and it writes straight to the game (no bouncing back to a panel).</li>
                    <li><strong>Scroll</strong> to zoom, <strong>drag empty space</strong> to pan,
                        <strong>drag a node's header</strong> to lay it out (positions are saved). <kbd>Esc</kbd> closes.</li>
                    <li><strong>Wire it up:</strong> drag from a node's <strong>output port</strong> (the dot on a
                        broadcasting rule) onto another node — it connects them by giving the target rule that
                        message (or, dropped on a plain sprite, adds a new "when I receive…" listener).</li>
                    <li><strong>＋ Add rule</strong> (pick Scene or a sprite) drops a new node; the trash removes it.</li>
                    <li>It's the same game — <strong>▶ Play</strong> runs it, and it's one model with the
                        Behaviors panel (edit in either, the graph and the panel share the exact same editors).</li>
                </ul>
            </section>

            <section class="doc-section">
                <h2>Blueprint — execution-flow nodes (advanced)</h2>
                <p>
                    <strong>Menu → Blueprint (exec-flow)</strong> opens a true node-graph where you
                    wire <em>execution</em> from an <strong>Event</strong> through <strong>Action</strong> and
                    <strong>Branch</strong> nodes — Unreal-Blueprint style. Where the Game Graph shows your
                    existing rules, the Blueprint lets you draw the <em>order</em> things happen in.
                </p>
                <ul>
                    <li><strong>Owner dropdown:</strong> each Blueprint belongs to an owner — the
                        <strong>Scene</strong> or a specific <strong>sprite</strong>. Pick a sprite and its
                        actions bind to it (move, jump, bounce, hit…); pick Scene for game-wide logic
                        (score, variables, spawn, go to state / page, win / game over).</li>
                    <li><strong>Event</strong> nodes are entry points. Scene events: on start, every moment,
                        key, tap, timer, when a variable reaches…, when a message is received. Sprite owners
                        also get <em>when it hits…</em>, <em>while touching…</em>, and <em>when it leaves the
                        screen</em>. Each event has one <strong>output pin</strong>.</li>
                    <li><strong>Action</strong> nodes do one thing, with an <strong>exec-in</strong> pin (left)
                        and an <strong>exec-out</strong> pin (right). Sprite owners unlock the full action set;
                        the Scene owner offers the scene-safe subset.</li>
                    <li><strong>Branch</strong> nodes route execution: <code>if [variable] [compares] [value]</code>
                        sends flow out the green <strong>T</strong> pin when true, the red <strong>F</strong> pin
                        when false.</li>
                    <li>Add nodes from the palette: <strong>Event</strong> and <strong>Action</strong> are direct
                        buttons; <strong>Flow ▾</strong> holds Branch / Sequence / Delay / For Loop / Gate, and
                        <strong>Data ▾</strong> holds the value nodes.</li>
                    <li><strong>Sequence</strong> nodes run their outputs <em>in order</em> (1, 2, 3…) — use
                        <strong>＋ / −</strong> to add or remove steps. <strong>Delay</strong> nodes wait a number
                        of seconds, then continue — great for "spawn, wait 2s, spawn again".</li>
                    <li><strong>For Loop</strong> repeats its <em>↻</em> output a set number of times (the count can
                        be wired), then continues out <em>✓ done</em>. Its <em>i</em> data output is the current
                        loop index — wire it into an action param or Math node.</li>
                    <li><strong>Gate</strong> is a stateful pass (Unreal-style): exec inputs <em>enter · open ·
                        close · toggle</em> and one <em>out</em>. Execution passing into <em>enter</em> continues
                        out only while the gate is open; wire other events into <em>open</em> / <em>close</em> /
                        <em>toggle</em> to control it (choose whether it starts open or closed).</li>
                    <li><strong>Data nodes</strong> carry a <em>value</em> (cyan square pins, dashed wires) instead
                        of execution: <strong>Get</strong> reads a variable, <strong>Value</strong> is a constant,
                        <strong>Compare</strong> tests <code>a ⟨op⟩ b → true/false</code>, and <strong>Math</strong>
                        computes <code>a ⟨+ − × ÷ %⟩ b → number</code>. Drag a Get/Value's output into a
                        Compare/Math's <em>a</em>/<em>b</em>, then the Compare's output into a <strong>Branch</strong>'s
                        condition (a wired condition overrides the branch's typed-in fallback), or a Math/Get output
                        into a numeric <strong>action param</strong> — e.g. wire <em>level × 10</em> into a
                        <em>change score</em> node so the amount is computed at runtime. <strong>Random</strong>
                        gives a number in a range, and <strong>Sprite</strong> reads a sprite's x / y / size —
                        feed them into Math/Compare or straight into an action param.</li>
                    <li><strong>Wire it up:</strong> drag from a node's right-edge pin onto another node to
                        connect execution. Drag a node's header to move it; scroll to zoom; <kbd>Esc</kbd> closes.</li>
                    <li><strong>▶ Play</strong> compiles every owner's graph to the same runtime as the blocks —
                        it runs alongside any behaviors you've built. API:
                        <code>Y.getBlueprint(owner)</code> / <code>Y.setBlueprintFor(owner, &#123;nodes, edges&#125;)</code>
                        (owner <code>''</code> = Scene), <code>Y.toggleBlueprint(true)</code>.</li>
                </ul>
            </section>

            <section class="doc-section">
                <h2>Code — the game's script</h2>
                <ol>
                    <li><strong>Menu → Game → Code</strong> (or the <strong>Code</strong> tab in any editor's
                        view switcher) shows the game's script. A game has <em>one</em> script — for a visual
                        game it is <strong>generated from your blocks and read-only</strong> (a learning bridge).</li>
                    <li>Press <strong>Eject to code</strong> to hand-write it: the script becomes the source of
                        truth (your blocks stay but stop compiling). Code-authored games can start from a
                        starter — <strong>Pong</strong>, <strong>Catch the Stars</strong>, or <strong>Blank</strong>
                        — or you write your own. This is a one-way switch (visual → code).</li>
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
