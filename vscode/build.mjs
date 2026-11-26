#!/usr/bin/env node
/**
 * Builds the VS Code extension from the web build.
 *
 *   node vscode/build.mjs              # bundle extension + copy the editor build
 *   node vscode/build.mjs --package    # …and produce dist-vscode/yappydraw-<version>.vsix
 *
 * Prerequisite: `npm run build` at the repo root (this script does not run it: the web build is
 * memory-bound and a release already runs it once — see CLAUDE.md "Ship it").
 *
 * The editor inside the extension is the website's own `dist/`, minus everything that is a
 * website rather than an editor: the prerendered help/learn pages, the service worker, the
 * policy pages, sitemap and social images. Help still works — the in-app Help renders from
 * the JS bundle, not from dist/help.
 */
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const DIST = join(REPO, 'dist');
const EDITOR = join(HERE, 'media', 'editor');
const wantPackage = process.argv.includes('--package');

/** Top-level entries of dist/ that are the website, not the editor. */
const WEBSITE_ONLY = new Set([
    'help', 'learn', 'founders',
    'sw.js', 'manifest.webmanifest', 'sitemap.xml', 'robots.txt',
    'og-image.png', 'pwa-192.png', 'pwa-512.png', 'vite.svg',
    'yappy-embed-client.js', 'oauth-callback.html', '404.html',
    '.htaccess', // Apache config for the website host
]);
const isWebsiteOnly = (name) =>
    WEBSITE_ONLY.has(name) || /^workbox-.*\.js$/.test(name) || (name.endsWith('.html') && name !== 'index.html');

function fail(msg) {
    console.error(`build-vscode: ${msg}`);
    process.exit(1);
}

// 1. Version: the extension ships the same build as the website, so it carries its version.
const rootPkg = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8'));
const extPkgPath = join(HERE, 'package.json');
const extPkg = JSON.parse(readFileSync(extPkgPath, 'utf8'));
if (extPkg.version !== rootPkg.version) {
    extPkg.version = rootPkg.version;
    writeFileSync(extPkgPath, JSON.stringify(extPkg, null, 2) + '\n');
    console.log(`build-vscode: version → ${rootPkg.version}`);
}

// 2. The editor build.
if (!existsSync(join(DIST, 'index.html'))) fail('dist/index.html not found — run `npm run build` first.');
const ageH = (Date.now() - statSync(join(DIST, 'index.html')).mtimeMs) / 3_600_000;
if (ageH > 24) console.warn(`build-vscode: WARNING dist/ is ${ageH.toFixed(0)} h old — is it the build you mean to ship?`);

rmSync(EDITOR, { recursive: true, force: true });
mkdirSync(EDITOR, { recursive: true });
for (const name of readdirSync(DIST)) {
    if (isWebsiteOnly(name)) continue;
    cpSync(join(DIST, name), join(EDITOR, name), { recursive: true });
}
console.log(`build-vscode: editor → ${relative(REPO, EDITOR)} (${sizeMB(EDITOR)} MB)`);

// 3. The extension host code. CommonJS: VS Code loads extensions with require().
await build({
    entryPoints: [join(HERE, 'src', 'extension.ts')],
    outfile: join(HERE, 'out', 'extension.js'),
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    external: ['vscode'],
    sourcemap: false,
    minify: true,
    logLevel: 'warning',
});
console.log('build-vscode: extension → vscode/out/extension.js');

// 4. Files the marketplace wants beside the manifest.
cpSync(join(REPO, 'LICENSE'), join(HERE, 'LICENSE'));
cpSync(join(REPO, 'frontend', 'public', 'pwa-512.png'), join(HERE, 'media', 'icon.png'));

// 5. Package.
if (wantPackage) {
    if (!existsSync(join(HERE, 'node_modules', '@vscode', 'vsce'))) {
        console.log('build-vscode: installing vsce in vscode/ …');
        execFileSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: HERE, stdio: 'inherit' });
    }
    const outDir = join(REPO, 'dist-vscode');
    mkdirSync(outDir, { recursive: true });
    const vsix = join(outDir, `yappydraw-${rootPkg.version}.vsix`);
    execFileSync(join(HERE, 'node_modules', '.bin', 'vsce'),
        ['package', '--no-dependencies', '--out', vsix],
        { cwd: HERE, stdio: 'inherit' });
    console.log(`build-vscode: ${relative(REPO, vsix)} (${(statSync(vsix).size / 1e6).toFixed(1)} MB)`);
}

function sizeMB(dir) {
    let total = 0;
    const walk = (d) => {
        for (const e of readdirSync(d, { withFileTypes: true })) {
            const p = join(d, e.name);
            if (e.isDirectory()) walk(p); else total += statSync(p).size;
        }
    };
    walk(dir);
    return (total / 1e6).toFixed(1);
}
