---
id: draw-api
name: Canvas-style Drawing
icon: "🖊️"
category: Features
description: Draw with moveTo / lineTo / arc / fill from a script — Canvas 2D and Cairo code runs almost unchanged, and every mark stays editable
keywords: draw ctx context canvas 2d cairo pycairo immediate mode pen moveto lineto beziercurveto curveto quadraticcurveto arc arcnegative ellipse rect rectangle closepath fill stroke fillpreserve strokepreserve fillrect strokerect save restore translate rotate scale transform settransform matrix fillstyle strokestyle linewidth linecap linejoin globalalpha setlinedash setsourcergb setsourcergba rel_line_to relative generative art procedural programmatic script port
---

# Canvas-style Drawing

`Yappy.draw` lets you draw the way you would on an HTML `<canvas>` or with **Cairo**: move a pen, add lines, curves and arcs, then `fill()` or `stroke()`. Code written for those libraries ports over almost line for line.

The difference is what you get at the end. A canvas gives you pixels. Here, **each `fill()` or `stroke()` becomes an ordinary path element** that you can select, node-edit, restyle, animate and export to SVG, PNG or PDF like anything else you drew by hand.

## A first drawing

Open the browser console on a YappyDraw tab (or use a script block) and run:

```
Yappy.draw(ctx => {
  ctx.arc(300, 250, 90, 0, Math.PI * 2);
  ctx.fillStyle = '#fde68a';
  ctx.fill();
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 6;
  ctx.stroke();          // same path as the fill → the SAME element gets the outline
});
```

`draw` returns the ids of the elements it made, and the whole call is **one undo step**, however many shapes it draws.

## What the context understands

| Group | Methods & properties |
|---|---|
| Path | `beginPath`, `moveTo`, `lineTo`, `bezierCurveTo`, `quadraticCurveTo`, `arc(x, y, r, start, end, anticlockwise?)`, `ellipse(x, y, rx, ry, rotation, start, end, anticlockwise?)`, `rect`, `closePath` |
| Transform | `save`, `restore`, `translate`, `rotate`, `scale`, `transform(a, b, c, d, e, f)`, `setTransform(…)`, `resetTransform`, `currentPoint()` |
| Paint | `fillStyle`, `strokeStyle`, `lineWidth`, `lineCap`, `lineJoin`, `globalAlpha`, `setLineDash([…])` |
| Draw | `fill()`, `stroke()`, `fillRect`, `strokeRect` |
| Cairo names | `newPath`, `curveTo`, `rectangle`, `arcNegative`, `relMoveTo`, `relLineTo`, `relCurveTo`, `setSourceRgb(r, g, b)`, `setSourceRgba(r, g, b, a)` (0–1 values), `setLineWidth`, `setLineCap`, `setLineJoin`, `fillPreserve`, `strokePreserve` |

Angles are in radians and, as on a canvas, `arc` goes **clockwise on screen** (y points down) unless you ask for anticlockwise. `save`/`restore` keep the transform and the paint state together.

## Porting Cairo code

Cairo and Canvas disagree on one thing: in Cairo, `fill()` and `stroke()` **use up** the path, and `fill_preserve()` keeps it. On a canvas the path stays until `beginPath()`. Pass `mode: 'cairo'` to get Cairo’s behaviour:

```
// pycairo:                                   YappyDraw:
// for i in range(12):                        Yappy.draw(cr => {
//   cr.save()                                  for (let i = 0; i < 12; i++) {
//   cr.translate(300, 300)                       cr.save();
//   cr.rotate(i * math.pi / 6)                   cr.translate(300, 300);
//   cr.set_source_rgb(i/12, 0.3, 1 - i/12)       cr.rotate(i * Math.PI / 6);
//   cr.rectangle(80, -10, 60, 20)                cr.setSourceRgb(i / 12, 0.3, 1 - i / 12);
//   cr.fill()                                    cr.rectangle(80, -10, 60, 20);
//   cr.restore()                                 cr.fill();
//                                                cr.restore();
//                                              }
//                                            }, { mode: 'cairo' });
```

Without `mode: 'cairo'` that loop would keep adding rectangles to one growing path and fill it again each time.

## Options

The second argument sets how every element from this call looks and behaves. It takes any element option (for example `roughness`) plus:

| Option | Meaning |
|---|---|
| `mode` | `'canvas'` (default) or `'cairo'`, as above |
| `renderStyle` | `'architectural'` for crisp output or `'sketch'` for hand-drawn. Defaults to the canvas’s current drawing style |

`roughness` defaults to 0, so sketch style also starts out clean. Raise it for the hand-drawn look:

```
Yappy.draw(ctx => { ctx.rect(100, 100, 200, 120); ctx.fillStyle = '#93c5fd'; ctx.fill(); ctx.stroke(); },
           { renderStyle: 'sketch', roughness: 1.5 });
```

## From an embedding page

A function can’t be sent over the embed bridge, so `draw` also takes the same calls as plain data: `[name, ...args]` calls a method, and `[property, value]` sets paint state.

```
Yappy.draw([
  ['moveTo', 10, 10], ['lineTo', 110, 10], ['lineTo', 60, 90], ['closePath'],
  ['fillStyle', '#fecaca'], ['fill'],
  ['strokeStyle', '#dc2626'], ['lineWidth', 3], ['stroke'],
]);
```

Only the methods and properties in the table above are accepted. Anything else is rejected with an `unknown op` error.

## Known limitations

- **Colours are CSS strings only.** Gradient and pattern objects (`createLinearGradient`, Cairo sources) are not supported. Apply a gradient to the element afterwards instead.
- **Holes use the even-odd rule.** When one path has several shapes, overlapping ones punch holes. Canvas and Cairo default to non-zero, where two overlapping shapes drawn in the same direction fill solid.
- **No text, images or clipping** inside `draw`. Use `Yappy.createText`, images and masks for those.
- **Every mark is a real element.** Hundreds of shapes are fine. A generative piece with tens of thousands of strokes is better merged into fewer paths (keep drawing into one path and call `stroke()` once).
- Dashes become the element’s dashed style. The exact dash lengths are not kept.
