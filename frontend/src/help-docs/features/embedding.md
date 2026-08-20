---
id: embedding
name: Embedding
icon: "🔗"
category: Features
description: Embed drawings in Confluence, Notion, wikis — and drive the full editor from a host page via the API / cross-origin postMessage bridge
keywords: embed iframe embedding read-only viewer interactive control programmatic api window.Yappy cross-origin same-origin postMessage bridge createYappyEmbed yappy-embed-client allowlist VITE_EMBED_ALLOWED_ORIGINS importDSL exportSVG confluence notion wiki sharepoint wordpress integrate another project host page frame-ancestors X-Frame-Options CSP content-security-policy restrict framing clickjacking
seoTitle: "Embed a diagram in Confluence, Notion or a wiki — iframe embeds"
seoDescription: "Embed a read-only YappyDraw canvas with pan and zoom in any page that accepts an iframe. Parameters, sizing and the embed client script."
---

# Embedding Drawings

Embed Yappy drawings in external platforms (Confluence, Notion, wikis, etc.) using iframe embed URLs. The embedded view shows a read-only canvas with pan/zoom — no toolbars or editing UI.

## How to (in the app)

You don't need to write any code to get an embeddable link — just save the drawing and reuse its name:

1. **Save & name your drawing.** Open **Menu → Export / Save...** (`Ctrl+Alt+S`) and save to your workspace with a memorable name. The name becomes the drawing's id.
2. **Read the id from the URL bar.** While editing, the address shows ` #doc=my-drawing` — that `my-drawing` part is the id.
3. **Build the embed link.** Swap `#doc=` for `#/embed/`: ` https://your-host/#/embed/my-drawing`. Append options like ` ?theme=dark&slide=2` if you want (see below).
4. **Paste it where you need it** — drop the link into a Notion `/embed` block, or wrap it in the `<iframe>` snippet below for Confluence, a wiki, or any web page.

:::tip
Prefer to generate the snippet automatically? Open the browser console and call ` Yappy.getEmbedHtml('my-drawing')` (see **Programmatic API** below) — it returns a ready-to-paste iframe.
:::

## Embed URL

Use this URL pattern to embed any saved drawing:

```
<iframe
  src="https://your-host/#/embed/your-drawing-name"
  width="800"
  height="600"
  frameborder="0"
  allowfullscreen>
</iframe>
```

The document name is the filename without extension. Check the URL bar when editing — if it shows `#doc=my-drawing`, the embed URL is `#/embed/my-drawing`.

## Query Parameters

| Parameter | Values | Description |
| --- | --- | --- |
| `theme` | `light`, `dark` | Override the color theme |
| `bg` | CSS color (URL-encoded) | Override canvas background |
| `slide` | Integer (1-indexed) | Which slide to show initially |
| `watermark` | `false` | Hide the "Open in Yappy" link |

## Examples

```
# Dark theme
#/embed/architecture-diagram?theme=dark

# Specific slide with custom background
#/embed/quarterly-review?slide=3&bg=%23f0f0f0

# No watermark
#/embed/my-drawing?watermark=false

# Combined
#/embed/my-drawing?theme=dark&slide=2&watermark=false
```

## Programmatic API

Generate embed URLs and HTML from the browser console or scripts:

```
// Get embed URL
Yappy.getEmbedUrl('my-drawing', { theme: 'dark', slide: 2 })

// Get iframe HTML snippet
Yappy.getEmbedHtml('my-drawing', { width: 1024, height: 768 })
```

## Interactive control (drive the full editor)

The `#/embed/` route above is a *read-only* viewer. To embed the **full, editable** Yappy and script it from a host page, load the normal app URL (not `#/embed/`) in an iframe and call the API. How you reach the API depends on whether the host page and Yappy share an origin.

### Same-origin — no setup

If your page and Yappy are served from the same origin, the whole API is already on the iframe's window. Nothing to configure:

```
const y = document.querySelector('#yappy').contentWindow.Yappy;
await y.fontsReady();                    // see "Wait for fonts" below
y.importDSL('graph TD; A-->B; B-->C');   // build a diagram from text
const svg = y.exportSVG();               // read it back
```

### Wait for fonts before creating text

Text-bearing shapes are **auto-sized from the measured text at creation**, and the measurement is written into the saved document. If the webfonts have not arrived yet, that measurement is taken against the fallback font and the wrong size is baked in permanently — it does not correct itself on the next render. Await `Yappy.fontsReady()` before the first call that creates text:

```
await y.fontsReady();        // resolves when the built-in fonts are measurable
y.importDSL(source);         // now every auto-sized box is sized correctly

y.fontsLoaded();             // → boolean, the same state without waiting
```

:::tip
Do **not** substitute `document.fonts.ready`. It resolves — and `document.fonts.status` reads `"loaded"` — while a font that has never been rendered is still unavailable, because `ready` only settles the faces that were actually *requested*. `fontsReady()` requests them first, then waits.
:::

### Cross-origin — postMessage bridge

Browsers block `iframe.contentWindow.Yappy` across origins. Yappy ships a **postMessage control bridge** for this case. It is **off by default** and only answers pages the *operator* has allowlisted — a page that merely frames Yappy cannot drive it.

**1. Operator: allowlist the parent origin(s).** Choose one (build-time wins unless the runtime global is set):

```
# Build-time env (baked into the bundle)
VITE_EMBED_ALLOWED_ORIGINS="https://app.example.com,https://wiki.example.com"

# …or a runtime global in Yappy's OWN index.html
<script>window.YAPPY_EMBED_ALLOWED_ORIGINS = ['https://app.example.com'];</script>
```

:::tip
Use a specific origin list, not `'*'`. The `'*'` wildcard disables the origin check (any page that frames Yappy can drive the API) and logs a warning — only for trusted internal deployments.
:::

**2. Host page: drive it with the client.** Load the bundled helper (or copy `public/yappy-embed-client.js` into your project):

```
<iframe id="frame" src="https://your-yappy-host/" width="1000" height="700"></iframe>
<script src="https://your-yappy-host/yappy-embed-client.js"></script>
<script>
  const yappy = createYappyEmbed(document.querySelector('#frame'), {
    targetOrigin: 'https://your-yappy-host'   // Yappy's origin
  });

  await yappy.ready();                          // waits for the bridge
  await yappy.call('fontsReady');                // waits for the webfonts
  await yappy.call('importDSL', 'graph TD; A-->B; B-->C');
  const svg = await yappy.call('exportSVG');    // every Yappy.* method works
</script>
```

`call(method, ...args)` invokes any `window.Yappy` method and returns a Promise of its result. Results travel over `postMessage`, so they must be serializable (strings, plain objects, arrays) — element ids, SVG strings, and DSL results are all fine.

### Restricting who can embed Yappy at all

The allowlist above controls *who can drive* the API — a separate concern from *who can put Yappy in an iframe* in the first place. By default any site can frame Yappy (the control bridge stays off, so that's harmless, but the read-only viewer is still embeddable anywhere). To restrict framing itself, set a response header on the server that serves Yappy — this is **deploy-server config, not an app setting**:

```
# Allow only these parents to frame Yappy (recommended)
Content-Security-Policy: frame-ancestors 'self' https://app.example.com https://wiki.example.com;

# Block ALL framing (disables embedding entirely)
Content-Security-Policy: frame-ancestors 'none';
X-Frame-Options: DENY
```

:::tip
Prefer `frame-ancestors` (CSP) — it supports multiple origins and is the modern replacement for `X-Frame-Options` (which only understands `DENY` / `SAMEORIGIN`). Keep the framing allowlist and the control allowlist (`VITE_EMBED_ALLOWED_ORIGINS`) in sync so the pages you let embed Yappy are also the ones you let drive it.
:::

## Embed Behavior

- **Pan/zoom** via mouse wheel — enabled
- **Auto-fit** — content fits the iframe on load and window resize
- **Read-only** — all drawing and selection interactions are blocked
- **"Open in Yappy"** — watermark link opens the full editor in a new tab
- **Full editor + API** — load the normal app URL (not `#/embed/`) and use the same-origin or cross-origin control paths above

## Platform Integration

- **Confluence** — HTML macro, iframe macro, or Connect App
- **Notion** — `/embed` block with the embed URL
- **SharePoint** — Embed web part
- **WordPress** — Custom HTML block
- **Any wiki/CMS** — Paste the iframe HTML

See `docs/integration.md` for detailed platform-specific instructions.
