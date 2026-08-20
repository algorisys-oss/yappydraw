---
id: stick-library
name: Stick-Figure Library
icon: "🚶"
category: Design
description: "Drawify-style editable stick figures: the panel, search & categories, drag/click to add, drop-as-editable-group, recolour & ungroup, and the API"
keywords: stick figure people person drawify illustration character pose variant man woman boy girl male female child kid hair skirt wave walk run jump sit dance think point sad office laptop desk present chart briefcase coffee idea lightbulb handshake meeting podium mic speaker raise hand clipboard applaud notes travel bike bicycle bag phone luggage suitcase umbrella celebrate love heart selfie gift toast delivery box support headset doctor guide waiter chef cleaner broom props laptop phone microphone bar chart briefcase package coffee cup speech bubble arrow trophy scenes handshake team family celebration category search drag drop editable group recolour recolor part role outline accent body head prop semantic stroke width 4px ungroup bezier limb symbol add to symbols colour mono monochrome favourites favorites star recent recents keyboard arrow keys vector svg insertStickFigure recolorStickFigure listStickFigures
---

# Stick-Figure Library

A searchable, categorized panel of reusable **stick-figure illustrations** — drawify-style people you drag onto the canvas to bring scenes, slides and diagrams to life. Every figure drops in as an **editable, recolourable vector group**, not a flat image, so you can restyle it to match your design.

## What it’s for

Illustrated people make explainers, workshops and presentations far more relatable — but drawing them from scratch is slow. The library ships a large set of hand-authored figures across six everyday categories (Daily & Emotions, Office & Work, Meetings & Talks, Street & Travel, Social & Family, and Services) — each in four character variants — plus standalone props and ready-made multi-figure scenes, so you can drop the right pose in a click.

:::tip
Figures import as normal Yappy **path** shapes grouped into one object. That means you can move/scale them as a unit, or *ungroup* to edit an individual limb, prop or the head.
:::

## The Stick Figures panel

Open it from the toolbar (walking-person button) or the menu → **Stick Figures**. The panel has:

- A **search box** — type “wave”, “laptop”, “bike”, “box”… to match names and tags.
- **Category chips** — six figure themes (Daily & Emotions, Office & Work, Meetings & Talks, Street & Travel, Social & Family, Services) plus **Props** (standalone objects — laptop, phone, chart, box, bulb, speech bubble…) and **Scenes** (multi-figure bundles — handshake, team, family, celebration).
- **Character variant** chips — **Man / Woman / Boy / Girl** (or All). Every figure pose comes in all four; women get hair and a skirt, children a bigger head and shorter body.
- A **thumbnail grid** — each cell previews the figure.

## Add a figure

- **Click** a thumbnail — the figure is added centered on the active page.
- **Drag** a thumbnail onto the canvas — the figure drops centered on the cursor, exactly where you release.

Either way it arrives selected and grouped as one editable object.

## Appearance — face, hair, trousers & shoes

Every figure wears an **expression** and a **hair style**. The **Face & hair** section sits at the bottom of the Stick Figures panel — and also appears in the **Properties** panel whenever a figure is selected, so you never have to go looking for it.

- **Expression** — 12 styles: Neutral, Happy, Sad, Angry, Surprised, Tired, Excited, Proud, Confused, Scared, Wink, and None (a blank head).
- **Hair** — 18 styles: Short, Curly, Spiky, Fringe, Long, Bun, Ponytail, Pigtails, Side swept, Swoosh, Mohawk, Afro, Bob, Braids, Top knot, Balding, Cap, and None.
- **Hair colour** — applies to the solid styles (Short, Curly, Bun, Pigtails, Side swept, Swoosh, Mohawk, Afro, Bob, Braids, Top knot, Cap). The outline styles (Fringe, Long, Spiky, Balding) follow the figure's stroke colour instead.
- **Solid head** — fills the head white so eyes and mouth stay readable over busy artwork or a coloured background. Off by default, which keeps heads see-through.

With **nothing selected** the picker sets what the *next* figure you add will wear (and the thumbnails update to match). With a figure **selected** it restyles that figure immediately — including animated figures, which change expression mid-animation.

The face is generated from the head circle alone, so a restyle still works after you have moved, scaled, rotated or even **ungrouped** a figure. Changing the expression leaves the hair alone, and vice versa.

Each pose ships with a sensible default — *Sad* wears a sad face, *Jumping for joy* an excited one, *Thinking* a confused one — and the character variants pick their own hair (Man → Short, Woman → Fringe, Boy → Spiky, Girl → Pigtails). Pick a style explicitly and it wins everywhere.

### Clothing

- **Tops** — 6 styles: T-shirt, Long sleeve, Vest, Jacket, Hoodie, and None. Sleeves follow the arms, so a waving figure's sleeve waves with it.
- **Neckwear** — Tie, Bow tie, Scarf, and None. A tie hangs from the collar along the torso, so it leans when the figure leans.

### Trousers & shoes

- **Trousers** — 8 styles: Straight, Baggy, Skinny, Shorts, Joggers, Skirt, Long skirt, and None.
- **Shoes** — 6 styles: Shoes, Boots, Sneakers, Heels, Front-facing, and None. Most are drawn in profile; **Front-facing** suits the library's head-on poses, where a side-view shoe reads as a foot turned sideways.
- **Colours** — trousers and shoes each have their own.

Clothing is generated from the figure's own **limbs** — trousers and shoes from the legs, tops and neckwear from the torso and arms — so it follows whatever pose the figure is in — a seated figure's trousers bend at the knee, a cyclist's follow the pedalling leg, and a walking figure's stride with it. Nobody has to author a seated variant.

Figures arrive dressed exactly as they always have: the Woman and Girl variants wear a skirt, everyone else is bare-legged. Trousers are opt-in, so nothing you already made has changed.

:::tip
**Known limitations.** Faces are drawn front-on, so a strongly side-on pose still shows two eyes (animated figures nudge the face toward the direction they face). Expressions are picked from the list — there is no free-hand face editor — but because every mark is a real vector path you can ungroup a figure and nudge an eyebrow by hand. Trousers on a pose that draws only one visible leg (Cycling) clothe that leg only, which is usually what you want.
:::

## Recolour by part (one click)

Every part of a figure is tagged with a semantic **role** — *body* and *head* (the outline), *face* (eyes, brows, mouth), *hair*, *accent* (colourful props like a laptop screen, briefcase or delivery box) and *prop* (neutral structure like a podium or whiteboard). Select a figure and the panel shows a **Recolour selected figure** section:

- **Outline** — recolours the whole figure's stroke in one click (pick a swatch or the colour well). Eyes and mouth follow the outline, so the face never goes out of step.
- **Accent** — recolours just the colourful props, leaving the outline and neutral parts untouched.
- **Hair** — recolours the solid hair styles only.

For finer control, because figures are real vectors you can also **ungroup** (right-click → Ungroup) and give any single part — a limb, the head, or one prop — its own fill/stroke. Scale, rotate and reposition freely; the outline stays crisp at any size, and drops in at a clean **4 px** weight by default.

:::tip
Figures render in the clean **architectural** style by default. Convert a selected figure to the hand-drawn **sketch** look from the Properties panel if you want it to match a sketchy document.
:::

## Browse faster

- **Colour / Mono** toggle (next to search) — drop figures with their flat colour accents, or in pure monochrome (outline only — solid hair loses its fill too). Your choice is remembered.
- **★ Favourites** — tap the star on any figure to save it; the Favourites chip gathers them.
- **Recent** — figures you add are listed under the Recent chip so you can re-drop them fast.
- **Keyboard** — Tab into the grid, move with the arrow keys, and press **Enter** to add the focused figure.

## Reuse as a Symbol

Using the same figure many times? Select it and click **Add to Symbols** in the panel. It becomes a linked **Symbol** — place as many instances as you like and edit the master once to update them all. See the *Symbols & Instances* help topic for the full workflow.

## Automate it (API)

```
const Y = window.Yappy;
Y.listStickFigureCategories();          // [{id:'daily', name:'Daily & Emotions'}, …]
Y.listStickFigures('office');           // figures in a category
const ids = Y.insertStickFigure('daily-waving');   // add centered; returns each part's id
Y.insertStickFigure('service-delivery', { x: 400, y: 200, targetWidth: 160 });
Y.recolorStickFigure({ outline: '#7c3aed', accent: '#ec4899', hair: '#2b2118' }, ids);

// Faces & hair
Y.listStickFaces();                     // [{id:'happy', name:'Happy'}, …] — 12 expressions
Y.listStickHairStyles();                // [{id:'bun', name:'Bun'}, …] — 10 styles
Y.setStickFace({ face: 'happy', hair: 'bun', hairColor: '#2b2118' }, ids);
Y.listStickTrousers();                  // 8 trouser styles
Y.listStickShoes();                     // 6 shoe styles
Y.setStickFace({ trousers: 'baggy', shoes: 'sneakers', trouserColor: '#374151' }, ids);
Y.listStickTops();                      // 6 tops
Y.listStickNeckwear();                  // tie / bowtie / scarf
Y.setStickFace({ top: 'jacket', neck: 'tie', topColor: '#0f766e' }, ids);
Y.setStickFace({ face: 'angry' });      // omitted fields are left alone; defaults to the selection
Y.getStickFace(ids);                    // {face, hair, hairColor, headFill}
// …or set it at drop time:
Y.insertStickFigure('daily-waving', { face: 'wink', hair: 'ponytail', headFill: true });

Y.toggleStickFigurePanel(true);         // open the panel
```

:::tip
API: `insertStickFigure(id, opts?)`, `recolorStickFigure(colors, ids?)`, ` setStickFace(opts, ids?)`, `getStickFace(ids?)`, ` listStickFaces()`, `listStickHairStyles()`, ` listStickTrousers()`, `listStickShoes()`, ` listStickTops()`, `listStickNeckwear()`, ` listStickFigures(category?)`, `listStickFigureCategories()`, ` toggleStickFigurePanel(visible?)`.
:::

:::tip
`setStickFace` works on dropped figures *and* animated ones, so you can drive a whole cast's expressions from a script.
:::

## Turn a script into a comic panel

Write a few lines of dialogue and YappyDraw draws the panel for you — figures posed from what they say, arranged so they face each other, with speech balloons above them in the right reading order.

:::tip
Open **Comic Studio** from the Window/Panels menu (or the command palette) to do all of this without touching code: type your script and the panel shows who it found, the pose each will strike and how many panels it will make. Pick a figure (Man/Woman/Boy/Girl) and an **emotion** per speaker to override what the words suggested, then hit Generate.
:::

```
const Y = window.Yappy;
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
});
```

### Thoughts and whispers

Add a cue in brackets after the name to change the balloon:

```
Ann: Did we ship it?
Ben (thinks): I have no idea
Ann (whispers): me neither
```

`(thinks)` draws a thought cloud, `(whispers)` a dashed aside in italics; anything else is a normal speech balloon. An unrecognised bracket stays part of the name, so `Ann (CEO):` still works.

### Narration captions

Start a line with `*` or wrap it in `[ ]` for a caption box — the “MEANWHILE…” panel comics use to set the scene:

```
* Friday, 5pm
Ann: Did we ship it?
[MEANWHILE...]
Ben: ON IT
```

A caption belongs to the panel rather than to a person: it puts nobody in the scene, doesn’t start a new panel on its own, and sits at the panel’s top-left where it reads first.

### Setting the mood yourself

The words only suggest a pose. When you know better, set an emotion for a speaker — Neutral, Happy, Laughing, Sad, Angry, Shouting, Thinking, Unsure, Waving, Pointing, Idea, Presenting, Love or Asking — in Comic Studio, or via the API:

```
Y.createComicPanel(script, { emotions: { Bob: 'angry', Ann: 'laughing' } });
```

“Auto” hands the choice back to the words.

For a mood that changes as the story goes, put the emotion in the script instead — it applies to that line only, so a character can be cheerful in one panel and furious in the next:

```
Ann (happy): the build is green
Ben: nice
Ann (angry): the build is green
Ben: oh
```

Cues combine, so `Ann (angry, whispers):` works. An inline cue beats the panel’s emotion picker, which beats what the words suggested. If any part of the bracket isn’t recognised the whole thing stays part of the name, so ` Ann (CEO):` is safe.

An emotion sets the **face as well as the body** — `(angry)` gives an angry expression, not just tense body language. Poses chosen by the words keep the expression they were drawn with, so “lol” still arrives grinning. Comic figures are ordinary stick figures, so you can select one afterwards and change its expression or hair from **Face & hair** in the Properties panel like any other.

### Telling characters apart

Every character in a comic gets their **own hair style and colour**, so readers can tell them apart before they read a word — and it stays **the same in every panel**, even in panels where some of the cast doesn't appear. Hair is assigned by order of first appearance in the script, and neighbouring characters differ in *shape* as well as colour, so a monochrome or printed strip still reads.

Override it per character, or turn it off entirely:

```
Y.createComicStrip(script, {
  hair:       { Ann: 'bun', Ben: 'mohawk' },   // style per speaker
  hairColors: { Ann: '#2b2118' },              // colour per speaker
});
Y.createComicStrip(script, { distinctHair: false });  // everyone the same
```

Each `Name: line` row becomes one balloon. The pose comes from the words themselves: a greeting waves, ALL CAPS or `!!!` shouts, ` :-(` looks sad, `lol` laughs, “maybe” thinks, “you” points, a bare “?” shrugs — anything else stands neutral. When two cues compete the stronger one wins, so “HI THERE!!!” shouts rather than waves.

:::tip
Up to 4 speakers per panel, one pose each. The whole panel is grouped, so it moves — and undoes — as a single unit. Spacing is worked out when the panel is created; nothing is locked, so you can drag any figure or balloon afterwards.
:::

### Longer scripts become a strip

Give a longer conversation to `createComicStrip` and it breaks into multiple panels laid out left-to-right, wrapping into rows:

```
Y.createComicStrip(\`Ann: Hi Ben!
Ben: Hey! Did you ship it?
Ann: I think so
Ben: ARE YOU SURE?\`, { columns: 3, panelGap: 32 });
```

A speaker only gets one balloon per panel, so when someone takes another turn the strip moves to the next panel — an alternating back-and-forth naturally becomes a row of two-person panels. The strip is one group (each panel a group inside it), so you can move the whole thing or pull a single panel out.
