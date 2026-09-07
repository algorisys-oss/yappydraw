# Yappy Draw — Integration Guide

This document covers how to embed and integrate Yappy drawings into external platforms.

## Prerequisites

The embed viewer is a **client-side SPA route** that fetches drawing data from the Yappy backend API (`GET /api/drawings/{id}`). This means:

- **Requires the backend server** (`server.ts`) to be running and accessible from the embedding site
- **Does not work with static-only deployments** (e.g., GitHub Pages) — there is no API to serve drawings
- For static/serverless deployments, future options include: inline data via `window.__PRESENTATION_DATA__` (like the existing PlayerApp), static JSON file hosting, or cloud storage (S3, R2, etc.)

## Iframe Embed

Yappy provides a read-only embed viewer accessible via URL. The embedded view shows only the canvas — no toolbars, panels, or menus — with pan/zoom via mouse wheel.

### URL Format

```
https://<your-yappy-host>/#/embed/<document-id>
```

### Example

```html
<iframe
  src="https://yappydraw.com/#/embed/my-drawing"
  width="800"
  height="600"
  frameborder="0"
  allowfullscreen>
</iframe>
```

### Query Parameters

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `theme` | `light`, `dark` | Document's theme | Override the color theme |
| `bg` | CSS color (URL-encoded) | Document's background | Override canvas background color |
| `slide` | Integer (1-indexed) | `1` | Which slide to display initially (slide documents) |
| `watermark` | `false` | Shown | Hide the "Open in Yappy" attribution link |

### Examples with Parameters

```
# Dark theme
#/embed/architecture-diagram?theme=dark

# Specific slide with custom background
#/embed/quarterly-review?slide=3&bg=%23f0f0f0

# Clean embed without watermark
#/embed/my-drawing?watermark=false
```

### Programmatic API

The `window.Yappy` API provides helpers for generating embed URLs:

```javascript
// Generate embed URL
const url = Yappy.getEmbedUrl('my-drawing', { theme: 'dark', slide: 2 });

// Generate ready-to-copy iframe HTML
const html = Yappy.getEmbedHtml('my-drawing', { width: 1024, height: 768 });
```

---

## Atlassian Confluence

### Method 1: HTML Macro (Simplest)

If your Confluence instance has the **HTML macro** enabled:

1. Edit a Confluence page
2. Insert an **HTML macro** (`{html}`)
3. Paste the iframe embed code:
   ```html
   <iframe
     src="https://your-yappy-host/#/embed/your-drawing-id"
     width="100%"
     height="600"
     frameborder="0"
     style="border: 1px solid #e5e7eb; border-radius: 8px;">
   </iframe>
   ```
4. Save the page

> **Note:** Some Confluence Cloud instances disable the HTML macro for security. Check with your admin.

### Method 2: Iframe Macro (Confluence Cloud)

Confluence Cloud has a built-in **iframe** macro:

1. Edit a page → Insert → Other macros → search "iframe"
2. Enter the embed URL: `https://your-yappy-host/#/embed/your-drawing-id`
3. Set width/height as desired
4. Save

### Method 3: Connect App (Advanced)

For a native Confluence experience, Yappy can be packaged as a **Confluence Connect App**:

- **What it provides:** A custom macro that users insert into pages. The macro stores the drawing ID and renders the embed viewer inline. Clicking opens a full editor modal.
- **Architecture:**
  - `atlassian-connect.json` descriptor defines the macro
  - Macro renders via iframe pointing to Yappy's embed route
  - Edit mode uses `AP.dialog.create()` to open the full Yappy editor
  - Drawing data stored via Confluence Content Properties API (attached to the page) or on your own server
- **When to use:** When you need a first-class Confluence integration with macro insertion, inline editing, and Marketplace distribution.

### Method 4: Forge App (Confluence Cloud)

Atlassian Forge runs apps on Atlassian's own infrastructure:

- **Pros:** Easier Marketplace approval, no hosting required
- **Cons:** More constrained runtime, limited to Forge APIs
- **Use case:** If you plan to distribute via the Atlassian Marketplace

---

## Atlassian Jira

### Issue Descriptions

Jira supports limited HTML in issue descriptions (depending on configuration):

1. Use the **iframe** or **HTML** panel macro in Jira wiki markup
2. Or link to the embed URL — Jira will render a link preview

### Connect App Panel

A Jira Connect App can add a **web panel** to issues:

- Panel renders the Yappy embed viewer showing a drawing attached to the issue
- Uses Jira issue properties to store the drawing reference
- Defined in `atlassian-connect.json` with `jiraIssueGlances` or `webPanels` module

---

## Notion

Notion supports embedding external content:

1. Type `/embed` in a Notion page
2. Paste the embed URL: `https://your-yappy-host/#/embed/your-drawing-id`
3. Notion renders the iframe inline
4. Resize the embed block as needed

Notion also supports `/bookmark` for a rich link preview.

---

## SharePoint / Microsoft Teams

### SharePoint Embed Web Part

1. Edit a SharePoint page
2. Add a **Web Part** → select **Embed**
3. Paste the iframe HTML or the embed URL
4. SharePoint renders the drawing inline

### Teams Tab App

Yappy can be configured as a **Microsoft Teams Tab**:

- Create a Teams app manifest that points to the embed URL
- Users add the tab to a channel, selecting which drawing to display
- Uses the Microsoft Teams JavaScript SDK for context

---

## Google Workspace

### Google Docs / Slides

Google Docs and Slides do not support iframes directly. Alternatives:

- **Linked image:** Export the Yappy drawing as PNG, insert into Docs/Slides, and link the image to the full Yappy editor URL. Viewers click to see the live version.
- **Google Apps Script add-on:** Build a sidebar add-on that renders the Yappy embed in the Apps Script HTML service panel.

### Google Sites

Google Sites supports embedding:

1. Insert → Embed → By URL
2. Enter the embed URL
3. The drawing renders inline in the site

---

## Slack

### Link Unfurling (Future)

When Yappy registers as an **oEmbed provider**, pasting a Yappy drawing URL into Slack will automatically show a rich preview card with a thumbnail image and "Open in Yappy" button.

**oEmbed endpoint format:**
```
GET /oembed?url=https://yappydraw.com/#/embed/my-drawing&format=json
```

**Response:**
```json
{
  "type": "rich",
  "version": "1.0",
  "title": "My Drawing - Yappy",
  "thumbnail_url": "https://yappydraw.com/api/drawings/my-drawing/thumbnail.png",
  "html": "<iframe src=\"...\" width=\"800\" height=\"600\"></iframe>",
  "width": 800,
  "height": 600,
  "provider_name": "Yappy Draw"
}
```

### Slack App (Advanced)

A Slack app can use the **Events API** to listen for `link_shared` events containing Yappy URLs and respond with `chat.unfurl` to render a rich preview.

---

## Generic Wikis / CMS

Any platform that supports HTML or iframes can embed Yappy drawings:

```html
<iframe
  src="https://your-yappy-host/#/embed/your-drawing-id"
  width="100%"
  height="600"
  frameborder="0"
  allowfullscreen
  style="border: 1px solid #e5e7eb; border-radius: 8px;">
</iframe>
```

**Tested with:**
- WordPress (Custom HTML block)
- Docusaurus / MkDocs / VitePress (raw HTML in markdown)
- MediaWiki (with `$wgAllowExternalImagesFrom` or Extension:Widgets)
- Ghost CMS (HTML card)
- Drupal (filtered HTML or custom block)

---

## Security Considerations

- **CORS:** The Yappy server enables CORS by default, allowing cross-origin iframe embedding
- **X-Frame-Options:** Not set by default, allowing iframe embedding from any origin. To restrict, configure the server to send `Content-Security-Policy: frame-ancestors 'self' https://your-confluence.atlassian.net`
- **Read-only:** The embed viewer sets `readOnly: true` and blocks all pointer interactions except pan/zoom
- **No authentication:** The embed route serves drawings without authentication. For private drawings, implement authentication on the server and restrict the `/api/drawings` endpoint

---

## Roadmap

| Feature | Status | Description |
|---------|--------|-------------|
| Iframe embed viewer | Implemented | `#/embed/{docId}` route with query params |
| Programmatic API | Implemented | `Yappy.getEmbedUrl()` and `Yappy.getEmbedHtml()` |
| oEmbed provider | Planned | Auto-unfurl in Slack, Notion, Discord |
| Confluence Connect App | Planned | Native macro with inline editing |
| Export as embeddable SVG | Planned | SVG with embedded Yappy JSON metadata |
| Thumbnail API | Planned | `GET /api/drawings/{id}/thumbnail.png` for previews |
