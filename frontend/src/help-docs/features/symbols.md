---
id: symbols
name: Symbols & Instances
icon: "◈"
category: Design
description: "Reusable masters + linked instances: the Symbols panel, edit-in-place, redefine and detach"
---

# Symbols & Instances

A **symbol** is a reusable master made from a selection. Each copy you place is a linked **instance** — change the master once and *every* instance updates. Perfect for repeated UI elements, map pins, icons, logos and anything you use many times.

## What it’s for

Without symbols, ten copies of a button are ten independent objects — restyling means editing all ten. With a symbol there is **one source of truth**: the master. Instances stay in sync automatically, so a design change ripples everywhere in one step. Instances are also lightweight — the document stores the master once plus a small reference (id + position + size) per instance.

:::tip
**Symbol** = the master definition (lives in the document’s symbol library).  **Instance** = a placed, linked copy on the canvas. Editing an instance’s *contents* means editing the symbol; moving/resizing an instance affects only that copy.
:::

## Create a symbol

Select one or more objects, then right-click → **Create Symbol** (or the **+** in the Symbols panel). Your selection becomes the master and is replaced by a single linked instance. From then on you can place more instances that all share that master.

```
const Y = window.Yappy; Y.clear();
const circ = Y.createCircle(100, 100, 90, 90, { backgroundColor:'#2563eb', fillStyle:'solid' });
const star = Y.createStar(118, 118, 54, 54, 5, { backgroundColor:'#facc15', fillStyle:'solid' });
const symId = Y.createSymbol('Badge', [circ, star]);   // → 1 instance + a master
Y.placeInstance(symId, 260, 100);                      // drop another instance
Y.placeInstance(symId, 420, 100);
```

## The Symbols panel

Open it with **Alt+B** (or View → **Symbols Panel**). It lists every symbol with a live thumbnail and an **instance count** badge. From a card you can:

- **Place** a new instance (the **+** button, or double-click the thumbnail).
- **Select** all instances of a symbol on the canvas (single-click the thumbnail).
- **Rename** (double-click the name) and **delete** (🗑 — its instances are detached into editable copies first, so artwork is never lost).
- **Redefine** the master from the current selection (↻).

## Edit in place

**Double-click an instance** (or right-click → **Edit Symbol (in place)**) to open the master for editing right where the instance sits. The instance temporarily expands into its editable parts and a breadcrumb appears at the top:

- **Done** (Enter) — apply your edits to the symbol; every instance updates.
- **Cancel** (Esc) — discard the edits; the instance is restored unchanged.

:::tip
Edit-in-place is the usual way to change a symbol: tweak the artwork once, press *Done*, and the change flows to all instances. Use **Redefine** instead when you’ve drawn a brand-new version separately and want to replace the master with it.
:::

## Detach (break the link)

Right-click an instance → **Detach Instance** to turn it into ordinary, independently editable shapes that no longer follow the master. Use this when one copy needs to diverge from the rest.

:::tip
API: `createSymbol(name, ids)`, `placeInstance(symbolId, x, y)`, ` redefineSymbol(symbolId, fromIds)`, `detachInstance(ids)`, ` enterSymbolEdit(instanceId)` / `exitSymbolEdit(save)`, ` renameSymbol`, `deleteSymbol`, `listSymbols()`, ` toggleSymbolsPanel()`.
:::

## Recursive symbols (Droste & spirals)

A symbol may contain an instance of *itself*. Because every instance is drawn from the master, that one nested copy repeats — a picture inside the picture inside the picture. The transform you give the nested instance is what you see repeated: nudge it and you get a receding corridor; shrink and rotate it and you get a logarithmic spiral; place two and you get a branching fractal tree.

Build one by **editing the symbol in place** (double-click an instance), then placing another instance of the same symbol inside — position, scale and rotate it, and press *Done*. Recursive drawing switches on automatically, and the card in the **Symbols** panel gets a **⟳** badge with a **Depth** field.

Recursion is **off by default**. Without it, a symbol reached inside itself draws the grey “cyclic” placeholder — the safe behaviour every older document was authored against. Use the **⟳** button on the symbol card to turn it on or off; the button only appears on symbols that actually contain themselves.

:::tip
**Where it stops.** Three limits, whichever comes first: **Depth** (levels of nesting, default 64), a level that has become **smaller than a pixel** on screen, and an internal cap on total nested draws per object. The sub-pixel rule is the one that usually ends a shrinking spiral, and it is scale-aware — zoom in and more levels appear on their own. A symbol that contains *two* copies of itself doubles the work at every level, so it will hit the draw cap and stop drawing its smallest twigs; keep the nested copy small if you want depth.
:::

:::tip
**Known limitations.** *Detach* (and saving to the asset library, which has to flatten) expands nesting only 8 levels deep — a detached spiral will be shorter than the one you see on canvas. Keep the symbol linked if the full depth matters. *Export to HTML* uses a separately-built player, which draws the nested level as the grey placeholder until that player is rebuilt. PNG export (and the canvas itself) shows the full nesting.
:::

```
const Y = window.Yappy; Y.clear();

// a box, made into a symbol
const box = Y.createRectangle(100, 100, 200, 200, { backgroundColor: '#2563eb', fillStyle: 'solid' });
const sym = Y.createSymbol('Droste', [box]);

// a smaller, rotated instance of the SAME symbol + a frame become the new master
const inner = Y.placeInstance(sym, 130, 130);
Y.updateElement(inner, { width: 150, height: 150, angle: 0.12 });
const frame = Y.createRectangle(100, 100, 200, 200, { backgroundColor: 'transparent' });
Y.redefineSymbol(sym, [inner, frame]);

Y.symbolSelfReferences(sym);        // true
Y.setSymbolRecursive(sym, true, 40); // draw the nesting, at most 40 levels
Y.setSymbolRecursive(sym);           // omit the flag to toggle it back off
```

## Asset library (reuse across documents)

Symbols live *inside* one document — an instance is a link to its master, so the two have to travel together in the same file. The **Asset library** is the other half of that story: a personal shelf of artwork that persists across every document you open in this browser. Draw a good tree, a rock, a cloud or a prop once, save it, and it is one click away in your next project.

Find it at the bottom of the **Symbols** panel. Select some artwork and press **Save**, give it a name, and it appears as a thumbnail. Click a thumbnail (or its **+**) to insert it into the current document, centred in your viewport. Double-click a name to rename; 🗑 removes it from the shelf.

:::tip
**Assets are snapshots, not instances.** Inserted artwork arrives as ordinary, fully editable shapes with fresh ids and *no* link back to the library — so recolouring or reshaping one copy never disturbs the saved original or any other copy. That is exactly what you want for scenery you intend to vary; use a **symbol** when you instead want every copy to update together.
:::

The library is stored in this browser profile (IndexedDB), alongside your saved drawings. Like the drawings gallery it is convenience storage rather than a backup — export a `.yappy` file for anything you can’t afford to lose, and note that a different browser or machine starts with an empty shelf.

```
const Y = window.Yappy;

// save the current selection to the shelf
const meta = await Y.saveToAssetLibrary('Pine tree');   // { id, name, width, height, … }

// later, in ANY document:
const assets = await Y.listAssets();                    // newest first
await Y.insertAsset(assets[0].id);                      // → plain editable elements

await Y.renameAsset(meta.id, 'Pine tree (tall)');
await Y.deleteAsset(meta.id);
```

| Method | What it does |
| --- | --- |
| `saveToAssetLibrary(name?, ids?)` | Save artwork to the cross-document shelf (default: selection). Async. |
| `listAssets()` | Saved assets, newest first (metadata only). Async. |
| `insertAsset(assetId)` | Insert as plain editable elements, centred in view. Async; false if missing. |
| `renameAsset(id, name)` / `deleteAsset(id)` | Manage the shelf. Deleting never touches artwork already inserted. |

## Scripting (API)

Symbols are fully scriptable from the global `window.Yappy` object — build a master from ids, scatter instances, redefine the master, and break the link.

```
const Y = window.Yappy; Y.clear();

// build a master from two shapes, then place more instances
const a = Y.createCircle(100, 100, 90, 90, { backgroundColor: '#2563eb' });
const b = Y.createStar(118, 118, 54, 54, 5, { backgroundColor: '#facc15' });
const sym = Y.createSymbol('Badge', [a, b]);   // returns the symbol id
Y.placeInstance(sym, 260, 100);
Y.placeInstance(sym, 420, 100);

Y.listSymbols();                 // [{ id, name, width, height, instances }, …]
```

```
// redefine the master from a redrawn version, or detach a copy
Y.redefineSymbol(sym, [newId1, newId2]);   // every instance updates
Y.detachInstance();                        // detach the selected instance(s)
```

| Method | What it does |
| --- | --- |
| `createSymbol(name?, ids?)` | Make a master from ids (default: selection); returns its id. |
| `placeInstance(symbolId, x?, y?)` | Drop a linked instance on the canvas. |
| `redefineSymbol(symbolId, fromIds)` | Replace the master; all instances update. |
| `detachInstance(ids?)` | Break the link into editable shapes (default: selection). |
| `enterSymbolEdit(instanceId)` / `exitSymbolEdit(save)` | Edit-in-place, then apply or cancel. |
| `renameSymbol` / `deleteSymbol` / `listSymbols()` | Manage the symbol library. |
