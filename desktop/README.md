# Yappy Desktop (Tauri v2)

A native desktop wrapper (Windows / macOS / Linux) around the Yappy web frontend,
built with **Tauri v2** + a tiny Rust core. The whole app lives in `frontend/`; Tauri
loads the built client in the system webview. It runs **fully client-side and offline**
(no backend), mirroring the OSS/PWA build.

> Full roadmap (native file open/save, menus, auto-update, stylus): `../docs/tauri-desktop-plan.md`.

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
