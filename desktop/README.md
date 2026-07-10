# Yappy Desktop (Tauri v2)

A native desktop wrapper (Windows / macOS / Linux) around the Yappy web frontend,
built with **Tauri v2** + a tiny Rust core. The whole app lives in `frontend/`; Tauri
loads the built client in the system webview. It runs **fully client-side and offline**
(no backend), mirroring the OSS/PWA build.

> Full roadmap (auto-update, file associations, stylus): `../docs/tauri-desktop-plan.md`.

## Native features (Phase 2)

- **Menu bar** — File (New / Open… / **Open Recent** / Save / Save As… / Export PNG / Export SVG /
  Quit), Edit (Undo / Redo), View (Reset View / Toggle Properties Panel), Help (Check for Updates…).
  File actions carry accelerators (⌘/Ctrl+N/O/S/⇧S/E).
- **Native Open/Save** — reads/writes `.yappy` (GZIP-compressed JSON) and `.json` through a native
  file picker. Interchangeable with the web app's files.
- **Recent files** — last 10 opened/saved docs in File ▸ Open Recent (persisted in `localStorage`,
  rebuilt into the native menu).
- **File associations** — double-clicking a `.yappy` opens it in Yappy (opens in the running
  instance via single-instance; the app is focused rather than duplicated).
- **Auto-update** — Help ▸ Check for Updates… checks the release endpoint, and (on confirm)
  downloads + installs + relaunches.
- Implemented as: Rust commands (`open_file`/`save_file`/`read_file`/`get_launch_file`/
  `set_recent_files`/`check_update`/`install_update`) + single-instance + updater plugins in
  `src-tauri/src/lib.rs`; the frontend `src/desktop/desktop-bridge.ts` (de)serializes
  (`utils/document-io.ts`) and maps menu/`open-path` events to store actions. All behind
  `isTauri()`, so the web build is unaffected (`withGlobalTauri: true` exposes `window.__TAURI__`).

## Publishing an update (auto-update release flow)

The updater is configured in `tauri.conf.json` (`plugins.updater`): it polls
`https://github.com/algorisys-oss/yappydraw/releases/latest/download/latest.json` and verifies
signatures against the embedded public key. To ship an update:

1. **Bump the version** in `tauri.conf.json`, `Cargo.toml`, and the repo-root `package.json`.
2. **Build signed bundles** — the private key is in `src-tauri/yappy-updater.key` (gitignored; keep
   it secret). Provide it at build time:
   ```bash
   export TAURI_SIGNING_PRIVATE_KEY="$(cat desktop/src-tauri/yappy-updater.key)"
   export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""   # this key has no password
   npm run desktop:bundle
   ```
   With `bundle.createUpdaterArtifacts: true`, this emits an updater artifact per target plus a
   `.sig` file next to each (e.g. `Yappy_<ver>_amd64.AppImage` + `.AppImage.sig`).
3. **Write `latest.json`** and upload it + the signed artifacts to the GitHub release:
   ```json
   {
     "version": "0.8.50",
     "notes": "See release notes.",
     "pub_date": "2026-07-10T00:00:00Z",
     "platforms": {
       "linux-x86_64":   { "signature": "<contents of .AppImage.sig>", "url": "https://…/Yappy_0.8.50_amd64.AppImage" },
       "windows-x86_64": { "signature": "<contents of .msi.sig>",      "url": "https://…/Yappy_0.8.50_x64_en-US.msi" },
       "darwin-x86_64":  { "signature": "<contents of .app.tar.gz.sig>","url": "https://…/Yappy_0.8.50_x64.app.tar.gz" }
     }
   }
   ```
   > Losing the private key means clients can't verify future updates — back it up. To rotate,
   > regenerate with `cargo tauri signer generate` and update the `pubkey` in `tauri.conf.json`.

## Prerequisites

- **Rust** (stable) + Cargo — <https://rustup.rs>
- **Tauri CLI v2**: `cargo install tauri-cli --version '^2'` (or use `cargo tauri` if already installed)
- **Linux only** — system webview + build deps:
  `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`
- Node deps installed at the repo root (`npm install`).

## Develop

From the repo root:

```bash
npm run desktop          # = cargo tauri dev (starts vite on :1420, opens the native window)
```

or, if launching from a **snap-confined shell** (e.g. the VS Code snap terminal) and the app
crashes on a GLIBC/`core20` symbol error:

```bash
cd desktop/src-tauri && ./dev.sh
```

Hot-reload works — edits to `frontend/` refresh the webview.

## Build a release (installers)

From the repo root:

```bash
npm run desktop:bundle          # = cd desktop/src-tauri && cargo tauri build
```

This runs the whole release pipeline: builds the frontend (`npm run build` → `dist/`),
compiles an optimized Rust binary, and produces native installers. Artifacts land in
`desktop/src-tauri/target/release/`:

| Platform | Output (under `target/release/`) |
|----------|----------------------------------|
| **Linux** | `bundle/deb/Yappy_<ver>_amd64.deb`, `bundle/rpm/Yappy-<ver>-1.x86_64.rpm`, `bundle/appimage/Yappy_<ver>_amd64.AppImage` |
| **Windows** | `bundle/msi/Yappy_<ver>_x64_en-US.msi`, `bundle/nsis/Yappy_<ver>_x64-setup.exe` |
| **macOS** | `bundle/macos/Yappy.app`, `bundle/dmg/Yappy_<ver>_x64.dmg` (or `aarch64`) |

The bundle **version** comes from `desktop/src-tauri/tauri.conf.json` (`"version"`). Keep it in
step with the app version in the repo-root `package.json` when you cut a release.

Build only specific targets:

```bash
cd desktop/src-tauri
cargo tauri build --bundles deb            # Linux: just the .deb
cargo tauri build --bundles appimage       # Linux: just the AppImage
cargo tauri build --bundles msi            # Windows: just the .msi
cargo tauri build --bundles dmg            # macOS: just the .dmg
cargo tauri build --debug                  # unoptimized, faster, for testing the pipeline
```

> **Cross-platform:** each OS's installers must be built **on that OS** (or its CI runner) —
> Tauri does not cross-compile the native webview. Wire a GitHub Actions matrix
> (`windows-latest` / `macos-latest` / `ubuntu-latest`) running `cargo tauri build` to produce
> all three from one tag; attach the artifacts to a GitHub Release.

### Code signing (follow-up, optional)

Unsigned builds run fine for internal/dev use, but end users hit Gatekeeper (macOS) /
SmartScreen (Windows) warnings. When ready:
- **macOS** — set `APPLE_CERTIFICATE`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD` and
  add `bundle.macOS.signingIdentity` + notarization.
- **Windows** — set `bundle.windows.certificateThumbprint` (or `signCommand`) with your code-signing cert.
- **Auto-update** — add `tauri-plugin-updater`, a signing keypair (`tauri signer generate`), and a
  `latest.json` on the OSS host; see `../docs/tauri-desktop-plan.md`.

## Layout

```
desktop/src-tauri/
  tauri.conf.json     # window + build wiring (devUrl :1420, frontendDist ../../dist)
  Cargo.toml          # tauri v2 + serde
  src/main.rs         # thin shim → lib::run()
  src/lib.rs          # tauri::Builder (minimal; add commands here later)
  capabilities/       # v2 permission ACLs
  icons/              # generated from frontend/public/pwa-512.png (cargo tauri icon)
  dev.sh              # snap-safe dev launcher
```

## Regenerate icons

```bash
cd desktop/src-tauri && cargo tauri icon ../../frontend/public/pwa-512.png
```
