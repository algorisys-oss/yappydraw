---
id: arcade
name: Arcade (Games)
icon: "🎮"
category: Features
description: "Flash-style game mode: a visual no-code Game Builder (WHEN→DO behaviors) OR a JavaScript game script drives the live canvas — Play/Stop, sprites, collisions, touch gamepad, HTML export"
keywords: game games arcade flash actionscript scratch blueprint no-code visual builder behaviors behavior WHEN DO rule trigger action script play stop tick loop sprite spawn hit collision bounce glide velocity gravity physics jump land platform platformer variable lives health score condition only if branch if else broadcast receive message event wiring node graph nodes wires blueprint flow visual node editor pan zoom sound sfx music audio hud pong catch maze gamepad dpad joystick touch controls keyboard onkey pointer tap game.find game.spawn game.onTick goToState playAnim goToPage end game over win export html player interactive kid learn to code
---

# Arcade — build games on the canvas

A Flash-style game mode. Build games two ways: the **visual Game Builder** (no code — give your sprites WHEN→DO behaviors from a panel), or write a small **game script** in JavaScript. Press **Play** and it drives the live canvas at 60 fps; **Stop** (or Esc) restores the document exactly. Games run in the editor and the exported HTML player, with keyboard *and* an on-screen touch gamepad, so they're playable on tablets.

:::note
**Arcade is still being built, so it lives behind Dev Mode.** Turn on **Settings ▸ General ▸
Dev Mode** and the whole **Game** group appears in the menu; leave it off and the game tools stay
out of the way of everyday drawing. Nothing else changes — a document that already holds a game
keeps its behaviors, script and export either way. See *Dev Mode* in the Workspace doc.
:::

## Game Builder — no code (start here)

**Menu → Game → Build** (or right-click a sprite → **Edit Behaviors (Game)…**) opens the Behaviors panel. Brand new? Tap **Load example: Pong** and press ▶ Play. To build your own:

1. Draw shapes for your sprites. Select one and give it a **Name** (e.g. "Ball") in the panel — that's how rules refer to it.
2. Add rules as **WHEN → DO**: pick a trigger (*when it starts, every moment, key pressed/held, when tapped, when it hits…, when it leaves the screen, when a variable reaches…, every few seconds*) and one or more actions (*move, glide, bounce, change score, set/change/show variable, jump to, spawn, destroy, go to state, play effect, **play sound**, **background music**, go to page, win, game over…*).
3. **Sound** is built in — no files needed. *Play sound* offers arcade SFX (coin, jump, hit, powerup, explosion, win, lose…); the ▶ button in the panel lets you hear one. A Scene rule *on start → background music on* loops a gentle tune. Sound works offline and in exported games.
4. **Physics for platformers:** give a sprite *gravity* so it falls, *jump* for an upward hop, and *while touching [Ground] → land* so it rests on platforms instead of falling through. *Jump* only fires when the sprite is standing on something (no mid-air double-jumps), so it reads like a real platformer hop. The **Platformer** example is a full little level: run and jump across three floating platforms, collect the coins for points, and reach the flag to win (fall off the screen and it's game over).
5. **Pointer & velocity (Blueprint):** the Blueprint editor has a *Pointer* data node (read the pointer's x / y / is-down) plus *set velocity (vx, vy)* and *move to point (x, y)* actions whose numbers you can wire from data (drag a Math result into vx). Together they make aim/drag games possible — the **Slingshot · Blueprint** sample uses them to follow the pointer while you drag and launch the bird on release.
6. **Tether (connectors):** the *tether (bar to target)* action draws a sprite as a thin bar from a fixed point to another sprite's centre, re-fitting every moment — good for elastic bands, ropes, laser beams, or links. The **Slingshot · Blueprint** sample uses two tethered bands from the fork tips to the bird (they stretch as you pull back and hide once it launches), and it now guards the pigs with a little wall of smashable blocks.
7. **Variables** (the *Vars* tab) hold numbers like lives, health, or ammo. Declare them with a starting value in one place; rules change them with *set/change variable*, react with *when a variable reaches…*, and gate actions with *only if*. Names used in rules but not yet declared show up as one-tap chips, and renaming a variable updates every rule that uses it. For example: a Scene rule *on start → set variable "lives" to 3*, a sprite rule *when it hits Spike → change variable "lives" by −1*, and a Scene rule *when "lives" is at most 0 → game over*. Use *show variable* to display it on screen.
8. **Messages & logic:** a rule can *broadcast a message* and any sprite can react with *when I receive [message]* — wire a button to a door, a death to a "game over" everywhere. Add **Only if…** to a rule (the ? button) to gate it on a variable — two rules with opposite conditions give you if/else (*hit Spike, only if lives ≥ 2 → lose a life*; *hit Spike, only if lives ≤ 1 → game over*).
9. The **Scene** tab holds whole-game rules (set the score at start, win/lose). The **Code** tab shows the `game.*` code your blocks generate — a read-only peek that's a nice bridge to real coding.
10. Press **▶ Play** in the panel. Everything saves with the document and exports to a playable HTML file.

:::tip
Blocks are the real thing — they compile to the same `game.*` script the code editor uses, so a builder game and a hand-written game play identically and both export.
:::

## Game Graph — the node view

The game tools live under **Menu → Game**: **New Game…** (pick a **stage size** — the page is your fixed play window — then Blank / Pong / Catch / Platformer / **Slingshot** (an Angry-Birds-style code sample: drag the bird back, release to fire, smash the blocks to pop the pigs — clear a level and press <kbd>Space</kbd> for the next) / **Flappy** (a one-button flyer — tap or <kbd>Space</kbd> to flap through the pipes) / Code / and three **Blueprint** samples (**Platformer · Blueprint**, **Breakout · Blueprint** and a drag-aim **Slingshot · Blueprint**) that open ready-made in the Blueprint editor so you can see a whole game wired as nodes), **My Games…** (a gallery of your saved games — hover a card to Play, click to open, or start a new one), and the editors Build · Node Graph · Blueprint · Code · Play. The three visual editors — **Simple** (rule list), **Graph** (node/wire view) and **Blueprint** (execution flow) — are three views of the same game; a **Simple · Graph · Blueprint · Code** switcher in each header hops between them in a click, and the same switcher (plus ▶ Play) floats at the bottom of the game canvas so you can jump views without opening a panel.

**Menu → Game → Node Graph** opens a full-screen node view of your whole game. Every rule is a **node** (its sprite, WHEN trigger, and DO actions); a *broadcast* in one node draws a **wire** to every node that *receives* that message, so you can see at a glance how the game's events connect. Rules that *go to a state* or *go to a page* also draw a dashed **flow wire** to a target pill (violet for states, sky-blue for pages), so your scene / level flow is visible too — and you can **drag a rule's flow-out port onto another pill** to re-target the jump.

- **Edit rules right in the node** — each card has the same editable **WHEN** trigger picker, **DO** action rows (＋ action to add, × to remove), and **＋ only if** guard as the Behaviors panel. Change a dropdown or type a value and it writes straight to the game (no bouncing back to a panel).
- **Scroll** to zoom, **drag empty space** to pan, **drag a node's header** to lay it out (positions are saved). <kbd>Esc</kbd> closes.
- **Wire it up:** drag from a node's **output port** (the dot on a broadcasting rule) onto another node — it connects them by giving the target rule that message (or, dropped on a plain sprite, adds a new "when I receive…" listener).
- **＋ Add rule** (pick Scene or a sprite) drops a new node; the trash removes it.
- It's the same game — **▶ Play** runs it, and it's one model with the Behaviors panel (edit in either, the graph and the panel share the exact same editors).

## Blueprint — execution-flow nodes (advanced)

**Menu → Blueprint (exec-flow)** opens a true node-graph where you wire *execution* from an **Event** through **Action** and **Branch** nodes — Unreal-Blueprint style. Where the Game Graph shows your existing rules, the Blueprint lets you draw the *order* things happen in.

- **Owner dropdown:** each Blueprint belongs to an owner — the **Scene** or a specific **sprite**. Pick a sprite and its actions bind to it (move, jump, bounce, hit…); pick Scene for game-wide logic (score, variables, spawn, go to state / page, win / game over).
- **Event** nodes are entry points. Scene events: on start, every moment, key, tap, timer, when a variable reaches…, when a message is received. Sprite owners also get *when it hits…*, *while touching…*, and *when it leaves the screen*. Each event has one **output pin**.
- **Action** nodes do one thing, with an **exec-in** pin (left) and an **exec-out** pin (right). Sprite owners unlock the full action set; the Scene owner offers the scene-safe subset.
- **Branch** nodes route execution: `if [variable] [compares] [value]` sends flow out the green **T** pin when true, the red **F** pin when false.
- Add nodes from the palette: **Event** and **Action** are direct buttons; **Flow ▾** holds Branch / Sequence / Delay / For Loop / Gate, and **Data ▾** holds the value nodes.
- **Sequence** nodes run their outputs *in order* (1, 2, 3…) — use **＋ / −** to add or remove steps. **Delay** nodes wait a number of seconds, then continue — great for "spawn, wait 2s, spawn again".
- **For Loop** repeats its *↻* output a set number of times (the count can be wired), then continues out *✓ done*. Its *i* data output is the current loop index — wire it into an action param or Math node.
- **Gate** is a stateful pass (Unreal-style): exec inputs *enter · open · close · toggle* and one *out*. Execution passing into *enter* continues out only while the gate is open; wire other events into *open* / *close* / *toggle* to control it (choose whether it starts open or closed).
- **Data nodes** carry a *value* (cyan square pins, dashed wires) instead of execution: **Get** reads a variable, **Value** is a constant, **Compare** tests `a ⟨op⟩ b → true/false`, and **Math** computes `a ⟨+ − × ÷ %⟩ b → number`. Drag a Get/Value's output into a Compare/Math's *a*/*b*, then the Compare's output into a **Branch**'s condition (a wired condition overrides the branch's typed-in fallback), or a Math/Get output into a numeric **action param** — e.g. wire *level × 10* into a *change score* node so the amount is computed at runtime. **Random** gives a number in a range, and **Sprite** reads a sprite's x / y / size — feed them into Math/Compare or straight into an action param.
- **Wire it up:** drag from a node's right-edge pin onto another node to connect execution. Drag a node's header to move it; scroll to zoom; <kbd>Esc</kbd> closes.
- **▶ Play** compiles every owner's graph to the same runtime as the blocks — it runs alongside any behaviors you've built. API: `Y.getBlueprint(owner)` / `Y.setBlueprintFor(owner, {nodes, edges})` (owner `''` = Scene), `Y.toggleBlueprint(true)`.

## Code — the game's script

1. **Menu → Game → Code** (or the **Code** tab in any editor's view switcher) shows the game's script. A game has *one* script — for a visual game it is **generated from your blocks and read-only** (a learning bridge).
2. Press **Eject to code** to hand-write it: the script becomes the source of truth (your blocks stay but stop compiling). Code-authored games can start from a starter — **Pong**, **Catch the Stars**, or **Blank** — or you write your own. This is a one-way switch (visual → code).
3. Press **▶ Play**. The document is snapshotted; your script runs once (setup), then `game.onTick` fires every frame.
4. Play mode is a **clean stage** — every editor toolbar, panel, and the page frame disappear, and the page fills the screen. Play with <kbd>←→↑↓</kbd>/<kbd>WASD</kbd>, <kbd>Space</kbd>/<kbd>Z</kbd> (A) and <kbd>X</kbd>/<kbd>Shift</kbd> (B) — or the on-screen D-pad + A/B buttons on touch devices. Dragging/tapping the canvas reaches the game as pointer input.
5. After `game.end()`, a **Play again** / **Exit** panel appears. **Stop** (top-center) or <kbd>Esc</kbd> ends the game and restores the editor exactly — nothing a game does is ever saved.

:::tip
Hand-drawn sprites: draw a shape, then find it from the script with ` game.find('…')` — it matches an element's id, its `tag`, or its text. The script saves with the document (and autosave).
:::

**Many games:** each document holds one game (its art + its script). To keep a library, save each with **Save / Export** as a `.yappy` file, or use **Templates → Save Current as Template** — the game travels with the template, so **My Templates** becomes your game shelf.

## The game API

```
game.width / height / x / y        // the page = your stage
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
game.random(min, max) · game.clamp(v, min, max)
```

## Scripting (Yappy API)

The `game.*` calls above are the *in-game* runtime — they run while a game is playing. To **author and control** games from the outside (the browser console, a script, or automation), use the global `window.Yappy` object. It sets the script, drives the visual builder / Blueprint model, and starts/stops play.

```
const Y = window.Yappy;

// Hand-written game: set the script and play it
Y.setGameScript('game.onTick(() => {})');
Y.startGame();                 // Y.startGame(src) also accepts a one-off script
Y.isGameRunning();             // true while playing
Y.stopGame();                  // restore the editor exactly

// Visual (no-code) game: rules + variables
Y.setSceneBehaviors([{ when: { kind: 'start' }, actions: [] }]);
Y.setGameVars([{ name: 'lives', initial: 3 }]);
Y.toggleGameBuilder(true);     // open the Behaviors panel
Y.toggleGameGraph(true);       // open the node-graph view

// Blueprint (exec-flow) per owner ('' = Scene)
Y.setBlueprintFor('', { nodes: [], edges: [] });
const bp = Y.getBlueprint('');
Y.toggleBlueprint(true);
```

:::tip
A game has one script: for a visual/Blueprint game the script is compiled from your blocks. `Y.setSceneBehaviors` / `Y.setBlueprintFor` author the model; ` Y.startGame()` compiles and plays whichever authoring you used.
:::

## Sharing your game

Hit **⬇ Export** on the game bar (or **Menu → Save… → Export HTML**) to download a single self-contained file: anyone opening it sees your game with a big **▶ Play Game** button — no install, works offline, touch controls included. Visual and Blueprint games export just like code games (the graph is compiled into the file). The script also travels with `.yappy`/JSON saves and My Templates.

```
const Y = window.Yappy;      // scripting from the console works too
Y.setGameScript(src);        // save a script
Y.startGame();               // play (Y.stopGame() to end)
Y.isGameRunning();
```

:::tip
Ticks never touch undo history or autosave — the pre-play snapshot is the only restore point, so even a runaway script can't damage your document.
:::
