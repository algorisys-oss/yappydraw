# Yappy Desktop (Rust + Tauri v2) — Plan

> **Goal:** ship Yappy as a native desktop app (Windows `.msi`/`.exe`, macOS `.dmg`,
> Linux `.AppImage`/`.deb`) using **Tauri v2**, mirroring the proven **happypaint**
> setup (`/home/rajesh/work/algo/happypaint/desktop/src-tauri`). Wraps the existing
> SolidJS frontend in a native WRY webview with a small Rust core — no rewrite.
> **Date:** 2026-07-10. **Status:** planned (not started); build after the current
> Illustrator-parity task.

## 1. Why Tauri (and what we already have)

- Yappy is already a **PWA** (`vite-plugin-pwa`, `display: standalone`, offline cache) — installable
  today, but no native file system, native menus, file associations, or auto-update.
- Tauri v2 gives all of that at ~3–10 MB (system webview, not bundled Chromium like Electron), with a
  Rust core we can extend later (native file I/O, stylus, export pipelines).
- **We already did this for happypaint** (`com.happypaint.desktop`, Tauri v2, `desktop/src-tauri/`) —
  copy its structure and conventions rather than start blank.

## 2. Mirror the happypaint layout

Create **`desktop/src-tauri/`** at the Yappy repo root (same as happypaint):

```
desktop/
  README.md
  src-tauri/
    Cargo.toml            # tauri v2 + serde (name = "yappy-desktop")
    build.rs
    tauri.conf.json
    dev.sh                # convenience launcher
    capabilities/         # v2 permission ACLs (default.json)
    icons/                # 32/128/128@2x/icon.icns/.ico  (tauri icon <png>)
    src/
      main.rs             # thin: yappy_desktop_lib::run()
      lib.rs              # builder, plugins, commands
    gen/                  # auto-generated (gitignore)
```

### `tauri.conf.json` (Yappy-specific values)
```jsonc
{
  "productName": "Yappy",
  "identifier": "com.algorisys.yappy",   // or com.yappy.desktop
  "build": {
    // Yappy uses npm + vite (happypaint used bun). Frontend-only dev server on 1420:
    "beforeDevCommand": "npm run desktop:dev",     // = vite --port 1420 --strictPort (NO backend)
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run desktop:build",  // = client-only vite build
    "frontendDist": "../../dist"                    // vite outputs to repo-root dist/
  },
  "app": {
    "windows": [{ "title": "Yappy", "width": 1400, "height": 900, "minWidth": 900, "minHeight": 600 }],
    "security": { "csp": null }
  },
  "bundle": { "active": true, "targets": "all", "icon": ["icons/32x32.png", "icons/icon.icns", "icons/icon.ico"] }
}
```

## 3. The one real decision: no backend in the desktop build

Yappy's web app has an Express/tsx backend (`backend/server/index.ts`) for storage + shareable links.
**The desktop app must be client-only** — the same shape as the **OSS build** (`scripts/publish-oss.sh`
already produces a cleaned client-only copy, and workspace persistence works without the server).

- Add root `package.json` scripts:
  - `"desktop:dev": "vite --port 1420 --strictPort"` (frontend only — no `concurrently`, no server)
  - `"desktop:build": "VITE_ENABLE_WORKSPACE_PERSISTENCE=true tsc -b && vite build"`
- Persistence: reuse the PWA/localStorage path today; **Phase 2** swaps document save/load to the Tauri
  **fs + dialog** plugins so files are real `.yappy` files on disk (see §5).
- Any `/api` calls must degrade gracefully when offline/native (they already do in the OSS build — verify).

## 4. Phase 1 — "it runs" (a few hours)

1. `cd desktop && npm create tauri-app` is overkill — instead **copy happypaint's `desktop/src-tauri/`**,
   rename crate → `yappy-desktop`, set `productName`/`identifier`, fix the `beforeDev/Build` + `frontendDist`.
2. Generate icons from the Yappy logo: `npx @tauri-apps/cli icon path/to/yappy-logo.png`.
3. Add root scripts `desktop:dev` / `desktop:build`, plus `"tauri": "tauri"` and a `desktop/dev.sh`.
4. `cd desktop/src-tauri && cargo tauri dev` → the Yappy canvas in a native window.
5. `cargo tauri build` → installers in `target/release/bundle/`.
- **Verify:** launch, draw a shape, apply a warp preset / transform effect, export PNG — all work offline.

## 5. Phase 2 — native integration (the payoff)

> **Phase 2 STATUS (2026-07-10): file Open/Save + menu SHIPPED.** Native menu bar (File/Edit/View)
> emits `menu-action` events; Rust `open_file`/`save_file` commands (dialog + disk I/O); frontend
> `desktop-bridge.ts` + `document-io.ts` (de)serialize `.yappy` (GZIP) / `.json`, all behind `isTauri()`.
> Verified: doc round-trips (serialize→gzip→decode→load); Rust compiles; web build inert. **Also now shipped:** recent files (Open Recent), `.yappy` file associations,
> single-instance (double-click opens in the running app), and **auto-update** (Help ▸ Check for
> Updates → download + install + relaunch; signed via an embedded pubkey). **Remaining Phase 3:**
> stylus/pressure verification on the tablet, macOS/Windows signing + notarization, CI matrix.

- **Native file open/save** (`tauri-plugin-dialog` + `tauri-plugin-fs`): a real `.yappy` document format
  (the existing JSON doc), `Cmd/Ctrl+S` / `Cmd/Ctrl+O`, recent-files, "Open with Yappy" **file
  association** (`bundle.fileAssociations` for `.yappy`, `.svg` import).
- **Native menu bar** (`tauri::menu`): File/Edit/View/Help mapped to existing store actions
  (new/open/save/export, undo/redo, zoom, help) via emitted events → `window.Yappy`.
- **Auto-update** (`tauri-plugin-updater` + a static `latest.json` on the OSS host / GitHub Releases).
- **Deep-link / single-instance** (`tauri-plugin-single-instance`) so double-clicking a file focuses the app.
- **Export to disk** without the browser download dance (PNG/SVG/PDF straight to a chosen path).

## 6. Phase 3 — stylus / tablet (ties into existing Huion work)

- The Huion pen-cursor fix already shipped in the web app (see the huion-tablet-work notes). In a native
  webview, pointer/pressure events come through the OS — **verify pressure + tilt** reach the canvas
  (Windows Ink / libinput). If the webview drops pressure, add a small Rust input bridge (as a fallback)
  emitting pointer events, mirroring what we learned in happypaint.
- Test on the actual Huion tablet (that's the whole point of a desktop build for drawing).

## 7. CI / release

- GitHub Actions matrix (windows/macos/ubuntu) running `tauri build`; attach installers to a Release.
- macOS signing + notarization and Windows code-signing are follow-ups (unsigned builds work for
  internal/dev use; warn users about Gatekeeper/SmartScreen until signed).
- Keep the desktop version in lockstep with the web `package.json` version, or give it its own bump.

## 8. Risks / notes

- **Backend coupling:** confirm every feature works in the client-only build (the OSS build is the proof;
  run its smoke path). AI features that call a server/proxy need a configurable endpoint or graceful "add
  your key" fallback in desktop.
- **CSP:** the app sets `csp: null` for the local build (like happypaint); tighten later if we load remote
  content.
- **Bundle size / webview parity:** Linux uses WebKitGTK — test the canvas/rough.js there specifically
  (WebKit lags Chromium on some Canvas2D features); this is the most likely surprise.
- **Reference to copy from:** `/home/rajesh/work/algo/happypaint/desktop/src-tauri` (config, capabilities,
  dev.sh) and `/home/rajesh/lab/ai-tools/autodev/src-tauri` (a second working Tauri v2 example).

## 9. Effort estimate

- Phase 1 (runs natively): **~0.5 day** (mostly copy + rewire scripts + icons).
- Phase 2 (native file/menu/update): **~2–3 days.**
- Phase 3 (stylus verification + fixes): **~1–2 days**, depends on webview pressure support.
- CI/signing: **~1–2 days** (signing certs are the long pole).
