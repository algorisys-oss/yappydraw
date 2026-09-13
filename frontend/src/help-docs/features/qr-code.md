---
id: qr-code
name: QR Codes
icon: "🔳"
category: Design
description: An editable QR code element — change the link, colours, dot and corner shapes, add a centre logo, and get a warning when a code may not scan
seoTitle: "QR code generator — editable QR codes for posters, flyers and slides"
seoDescription: "Add a QR code to any design and keep it editable: change the URL and colours, pick rounded or dot modules and custom corner shapes, put your logo in the middle, and export it as crisp vectors."
keywords: qr qrcode qr-code barcode scan scanner phone camera url link website generator generate encode poster flyer slide menu business card error correction quiet zone margin contrast colour color inverted vector svg png style styled rounded dots dot circle corner corners eye eyes finder logo brand image centre center createQrCode getQrCodeData setQrCodeData setQrCodeLogo getQrCodeWarnings api
---

# 🔳 QR Codes

Put a scannable QR code on a poster, flyer, slide or business card — and keep it **editable**. The code is regenerated from its data every time you change something, so fixing a typo in a URL never means making the code again somewhere else.

:::cards
✏️ Always editable | Change the text or link in the Properties panel; the code updates instantly.
🎨 Your colours | The code uses the **Stroke** colour, and the area behind it uses **Background**.
🛡️ Error correction | Pick Low, Medium, Quartile or High — higher levels survive smudges and logos on top.
🔵 Styles | Square, rounded or dot modules, with square, rounded or circular corners in their own colour.
🖼️ Logo | Put your logo in the middle; the code clears a space for it.
⚠️ Scan warnings | Yappy tells you when the data is empty or too long, or when the colours will not scan.
📐 Stays square | Stretch the element however you like; the code stays square and centred.
🖨️ Crisp exports | SVG export writes real vector squares, so the code stays sharp at any print size.
:::

## Adding a QR Code

- **Elements panel** — open Elements (<kbd>Alt+E</kbd>) and click **QR Code** in the Shapes row, or search for *qr*.
- **Command palette** — press <kbd>Ctrl+K</kbd>, type *QR Code*, then drag on the canvas to draw one.

A new code encodes `https://yappydraw.com` in black on white so you can see it straight away. Replace that with your own data.

## Editing

Select the QR code and open **Properties**:

| Property | What it does |
| --- | --- |
| **QR Data** | The text or URL to encode. Anything works — links, plain text, Wi-Fi strings, contact cards. |
| **Error Correction** | How much of the code can be damaged or covered and still scan: Low 7%, Medium 15% (default), Quartile 25%, High 30%. Higher levels make the code denser. |
| **Quiet Zone** | The blank margin around the code, in modules (0–10, default 2). Scanners need some margin, so leave it above 0 unless the code already sits on a plain background. |
| **Stroke** | The colour of the code itself. |
| **Background** | The colour behind the code. Set it to transparent to let the design show through. |
| **Module Style** | The shape of the small squares: **Square**, **Rounded** (neighbours join into smooth shapes) or **Dots**. |
| **Corner Shape** | The three big corner eyes: **Square**, **Rounded** or **Circle**. |
| **Corner Color** | A separate colour for the corner eyes. Leave it unset to use the Stroke colour. |
| **Logo** | Upload an image or paste an image URL to place it in the centre. **Remove** takes it out again. |
| **Logo Size** | The logo's width as a share of the code, 10–35%. Shown once there is a logo. |

:::tip 💡 Tip
Adding a logo? Set **Error Correction** to **High** first — it lets you use the biggest logo. The modules behind the logo are removed, and the error correction is what lets a phone rebuild them.
:::

## Styles and logos

Styling changes how the code looks, not what it holds. A few things are kept on purpose so styled codes still scan:

- The small **alignment target** (the square-in-a-square near the bottom-right of larger codes) is always drawn as a solid ring in the module style, never broken into separate dots. Some scanners cannot find the grid without it.
- The space cleared for a logo never reaches the corner eyes. On a small code (a short link at a low error-correction level), the logo is capped smaller than the size you set.
- Longer data makes a larger code, and a larger code can hide a bigger logo. The warning takes both into account.

How big can the logo be? Yappy warns once the logo hides more than the chosen level can reliably rebuild. As a guide, for a short link of about 30 characters:

| Error Correction | Largest logo without a warning |
| --- | --- |
| Low | about 10% |
| Medium | about 15% |
| Quartile | about 20% |
| High | about 30% |

## When a code may not scan

Yappy shows a warning under the QR properties when:

- **There is no data** — the canvas shows *QR code — add data* instead of a code.
- **The data is too long** for the chosen error-correction level. Shorten it (a link shortener helps) or pick a lower level.
- **The colours are too close in contrast.** Most phone cameras need a contrast ratio of at least 3:1.
- **The code is lighter than its background.** Many scanners cannot read an inverted code. The Corner Color is checked too.
- **The logo is too big** for the error-correction level. Make it smaller or choose a higher level.

Always test a printed code with a phone before a print run.

:::warning ⚠️ Note
QR codes draw the same way in both **Sketch** and **Architectural** styles. A hand-drawn wobble would stop the code scanning, so the sketch effect is deliberately not applied. For the same reason, dark mode does not recolour them.
:::

## Scripting (API)

```
// Create a QR code (x, y, width, height, data, options)
const id = Yappy.createQrCode(100, 100, 240, 240, 'https://example.com/menu', {
    qrErrorCorrection: 'H',   // 'L' | 'M' | 'Q' | 'H'
    qrQuietZone: 4,           // blank margin in modules, 0-10
    strokeColor: '#1e3a8a',   // the code
    backgroundColor: '#ffffff' // behind the code
});

// Styled, with a logo
const styled = Yappy.createQrCode(400, 100, 240, 240, 'https://example.com', {
    qrModuleStyle: 'dots',        // 'square' | 'rounded' | 'dots'
    qrFinderStyle: 'circle',      // 'square' | 'rounded' | 'circle'
    qrFinderColor: '#7c3aed',     // corner eyes (default: strokeColor)
    qrErrorCorrection: 'H',
});
Yappy.setQrCodeLogo(styled, 'data:image/png;base64,...', 0.25); // size 0.1-0.35, undoable
Yappy.setQrCodeLogo(styled, null);                             // remove it

// Read and change what it encodes (undoable)
Yappy.getQrCodeData(id);                 // 'https://example.com/menu'
Yappy.setQrCodeData(id, 'https://example.com/specials');

// Reasons it may not scan — an empty array means it looks fine
Yappy.getQrCodeWarnings(id);

// Any other property goes through updateElement
Yappy.updateElement(id, { qrErrorCorrection: 'Q' });
```

## Known limitations

- The logo is always centred and square-fitted (a wide logo keeps its proportions inside that square). There is no option to place it elsewhere.
- The alignment target follows the module style, not the Corner Shape.
- The scan warnings are a guide, not a guarantee. They were calibrated against clean renders, and a printed code photographed by a phone has less margin — test before you print.