---
id: qr-code
name: QR Codes
icon: "🔳"
category: Design
description: An editable QR code element — change the link, colours, error correction and margin at any time, with warnings when a code may not scan
seoTitle: "QR code generator — editable QR codes for posters, flyers and slides"
seoDescription: "Add a QR code to any design and keep it editable: change the URL, colours, error-correction level and quiet zone later, get a warning if it may not scan, and export it as crisp vectors."
keywords: qr qrcode qr-code barcode scan scanner phone camera url link website generator generate encode poster flyer slide menu business card error correction quiet zone margin contrast colour color inverted vector svg png createQrCode getQrCodeData setQrCodeData getQrCodeWarnings api
---

# 🔳 QR Codes

Put a scannable QR code on a poster, flyer, slide or business card — and keep it **editable**. The code is regenerated from its data every time you change something, so fixing a typo in a URL never means making the code again somewhere else.

:::cards
✏️ Always editable | Change the text or link in the Properties panel; the code updates instantly.
🎨 Your colours | The code uses the **Stroke** colour, and the area behind it uses **Background**.
🛡️ Error correction | Pick Low, Medium, Quartile or High — higher levels survive smudges and logos on top.
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

:::tip 💡 Tip
To put a logo in the middle of a code, set **Error Correction** to **High** and keep the logo small — under about a fifth of the code's width.
:::

## When a code may not scan

Yappy shows a warning under the QR properties when:

- **There is no data** — the canvas shows *QR code — add data* instead of a code.
- **The data is too long** for the chosen error-correction level. Shorten it (a link shortener helps) or pick a lower level.
- **The colours are too close in contrast.** Most phone cameras need a contrast ratio of at least 3:1.
- **The code is lighter than its background.** Many scanners cannot read an inverted code.

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

// Read and change what it encodes (undoable)
Yappy.getQrCodeData(id);                 // 'https://example.com/menu'
Yappy.setQrCodeData(id, 'https://example.com/specials');

// Reasons it may not scan — an empty array means it looks fine
Yappy.getQrCodeWarnings(id);

// Any other property goes through updateElement
Yappy.updateElement(id, { qrErrorCorrection: 'Q' });
```

## Known limitations

- The codes use standard square modules. Rounded dots, custom corner shapes and a built-in logo slot are not available yet.