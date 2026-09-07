# Deployment Guide

## Prerequisites

- Node.js 18+
- npm or Bun

Install dependencies:

```bash
npm install
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_ENABLE_WORKSPACE_PERSISTENCE` | `true` | Save/load drawings from browser IndexedDB. Set to `false` for static demos. |
| `VITE_ENABLE_CLOUD_STORAGE` | `true` | Master toggle for all cloud storage features. |
| `VITE_ENABLE_GOOGLE_DRIVE` | `true` | Enable Google Drive as a cloud storage provider. |
| `VITE_GOOGLE_CLIENT_ID` | (none) | Google OAuth 2.0 Client ID. Required for Google Drive. See [Cloud Storage setup](cloud-storage.md#14-google-cloud-console-setup). |

Variables are compile-time only (Vite `import.meta.env`). Set them before `npm run build`.

## Development

```bash
npm run dev
```

Starts two processes concurrently:
- **Vite dev server** — serves the SolidJS client with HMR
- **Express API server** — runs on port 3000, proxied via `/api` from Vite

The Express server provides:
- `GET /api/drawings` — list saved drawings
- `GET /api/drawings/:id` — load a drawing (`.json` or compressed `.yappy`)
- `POST /api/drawings/:id` — save a drawing
- `DELETE /api/drawings/:id` — delete a drawing

Data is stored in the `data/` directory.

## Building for Production

```bash
npm run build
```

Runs `tsc -b` (TypeScript check) then `vite build`. Output goes to `dist/`.

Preview the build locally:

```bash
npm run preview
```

### Build Output Structure

```
dist/
├── index.html
├── vite.svg
└── assets/
    ├── index-*.js           # Main app bundle
    ├── vendor-rendering-*.js # roughjs, lucide-solid
    ├── vendor-export-*.js    # jspdf, pptxgenjs
    ├── solid-framework-*.js  # solid-js
    ├── [lazy chunks]         # Dialogs, panels, templates
    └── index-*.css           # Styles
```

Vendor chunks are split for cache stability — updating app code won't invalidate vendor caches.

## Deploy to GitHub Pages

```bash
npm run deploy
```

This runs:

```
VITE_ENABLE_WORKSPACE_PERSISTENCE=false npm run build && gh-pages -d dist
```

- Disables IndexedDB persistence (not useful for public demos)
- Builds production bundle
- Pushes `dist/` to the `gh-pages` branch

The site is served from `https://<user>.github.io/yappy/` — the `base: './'` in `vite.config.ts` ensures relative asset paths work correctly.

### First-Time Setup

Ensure the repo has GitHub Pages enabled:
1. Go to repo **Settings → Pages**
2. Set source to **Deploy from a branch**
3. Select the `gh-pages` branch, root `/`

## Deploy to Any Static Host

The built `dist/` folder is a fully static site — no server required. Drop it on any static host:

### Nginx

```nginx
server {
    listen 80;
    server_name yappy.example.com;
    root /var/www/yappy/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache vendor chunks aggressively (content-hashed filenames)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/html application/javascript text/css application/json image/svg+xml;
}
```

### Vercel / Netlify / Cloudflare Pages

No config needed — connect the repo and set:
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables:** `VITE_ENABLE_WORKSPACE_PERSISTENCE=false` (optional)

## Publishing to the OSS Repo

The open-source version lives at [github.com/algorisys-oss/yappydraw](https://github.com/algorisys-oss/yappydraw). It contains only the client-side code, stripped of internal docs, server, tests, and data.

### Dry Run (Preview)

```bash
./scripts/publish-oss.sh
```

Shows exactly what the OSS repo will contain — no changes are pushed.

### Push to OSS Remote

```bash
OSS_REMOTE=https://github.com/algorisys-oss/yappydraw.git ./scripts/publish-oss.sh --push
```

The script:
1. Exports a clean snapshot of HEAD via `git archive`
2. Removes paths listed in `.ossignore` (server, docs, data, tests, scripts, internal config)
3. Patches `package.json` — removes `express`, `cors`, server-related deps and scripts
4. Patches `vite.config.ts` — removes the dev server proxy
5. Clones the existing OSS repo and commits on top (preserving history)
6. Skips the push if nothing changed

### What Gets Published

| Included (OSS) | Excluded (Enterprise only) |
|---|---|
| `src/` | `server.ts` |
| `public/` | `docs/` |
| `index.html` | `data/` |
| `package.json` (client deps only) | `tests/`, `test-results/` |
| `vite.config.ts` (no proxy) | `scripts/` |
| `tsconfig*.json` | `.claude/` |
| `README.md` | `context.md`, `man-days.md`, `todo.md`, `AGENTS.md` |
| `.gitignore` | `bun.lock`, `package-lock.json` |

### Configuration

Edit `.ossignore` at the repo root to add or remove paths from the exclusion list.

Custom commit message:

```bash
OSS_MESSAGE="feat: drawing toolbar position, filename moved to status bar and on new welcome page is not shown" OSS_REMOTE=https://github.com/algorisys-oss/yappydraw.git ./scripts/publish-oss.sh --push
```

If `OSS_MESSAGE` is not set, defaults to `chore: sync from upstream YYYY-MM-DD`. The source commit SHA is always appended.

Override the target branch:

```bash
OSS_BRANCH=main OSS_REMOTE=https://github.com/algorisys-oss/yappydraw.git ./scripts/publish-oss.sh --push
```

## Enterprise Server Deployment

For deployments that need the Express API server (drawing persistence):

```bash
npm run build
node --import tsx server.ts
```

The server serves the API on port 3000. Place a reverse proxy (Nginx, Caddy) in front to serve both the static `dist/` files and proxy `/api` to the Express server.

### Docker (Example)

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY dist/ dist/
COPY server.ts ./
COPY data/ data/
EXPOSE 3000
CMD ["npx", "tsx", "server.ts"]
```

Then serve `dist/` from Nginx and proxy `/api` to the container.

## Production Checklist

- [ ] TypeScript compiles without errors (`tsc -b`)
- [ ] Build completes (`vite build`)
- [ ] No console errors when loading the app
- [ ] Set `VITE_ENABLE_WORKSPACE_PERSISTENCE` appropriately
- [ ] Gzip/Brotli compression enabled on the host (80-90% size reduction)
- [ ] Cache headers set for `/assets/` (content-hashed, immutable)
- [ ] OSS publish dry-run reviewed before pushing
