#!/usr/bin/env node
/**
 * render — headless animation renderer: a `.yappy` document or a scene script → PNG,
 * PNG sequence, GIF, MP4 or WebM.
 *
 * Boots the app in a headless Chromium (via Playwright), loads the input, and asks
 * `window.Yappy.renderFrame(t)` for every frame at an exact time. Nothing is recorded
 * in real time, so a slow machine (or CI) produces the same file as a fast one, frame
 * for frame. GIF is encoded in the page (`Yappy.renderGif`); MP4/WebM pipe the PNG
 * frames through ffmpeg, which must be on PATH.
 *
 * Inputs:
 *   .yappy / .json   A saved document, loaded with `Yappy.loadDocument`.
 *   .js              A script run in the page with `window.Yappy` in scope, e.g. the
 *                    manim-style examples in examples/. Awaited if it returns a promise.
 *                    Anything it starts playing is stopped: frames come from the clock
 *                    the renderer sets, not the live one.
 *
 * Usage:
 *   node scripts/render.mjs <input> -o out.mp4 [options]
 *   npm run render -- examples/manim-gradient-descent.js -o gd.gif
 *   npm run render -- doc.yappy -o frame.png --at 1.5 --scale 2
 *   npm run render -- doc.yappy -o frames/ --fps 24      (a directory → PNG sequence)
 *
 * Options:
 *   -o, --out <path>      Output. The extension picks the format: .png (one frame),
 *                         .gif, .mp4, .webm; a path ending in / (or an existing
 *                         directory) gets frame-00000.png, frame-00001.png, …
 *   --seconds <s>         Length to render. Default: the document's animation length
 *                         (`Yappy.getAnimationDuration`), else 5.
 *   --fps <n>             Frames per second (default 30; GIF default 15, max 50).
 *   --at <s>              Time of the frame for .png output (default 0).
 *   --scale <k>           Pixels per canvas unit (default 1; GIF default fits 960 px).
 *   --padding <px>        Margin around the content when there is no page (default 20).
 *   --background <css>    Background colour, or 'transparent' (PNG only).
 *   --eval <expr>         JS expression evaluated (and awaited) after the input loads,
 *                         e.g. "GD.build()". Repeatable; runs in order.
 *   --url <url>           Render against an already-running instance instead of
 *                         spawning Vite (e.g. http://localhost:5173). Also honoured
 *                         via the YAPPY_URL env var.
 *   --port <n>            Port for the spawned Vite server (default: 5198).
 *   --timeout <ms>        Max wait for server + Yappy readiness (default: 120000).
 *   -h, --help            Show this help.
 *
 * Exit codes: 0 ok · 1 usage/IO error · 2 render error.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { extname, resolve, join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { gunzipSync } from 'node:zlib';
import { setTimeout as sleep } from 'node:timers/promises';

// ─── Arg parsing ─────────────────────────────────────────
function parseArgs(argv) {
    const opts = {
        input: null, out: null, seconds: null, fps: null, at: 0, scale: null, padding: 20,
        background: null, evals: [],
        url: process.env.YAPPY_URL || null, port: 5198, timeout: 120_000,
    };
    const num = (flag, v, { min = -Infinity, int = false } = {}) => {
        const n = int ? parseInt(v, 10) : parseFloat(v);
        if (!Number.isFinite(n) || n < min) fail(`${flag} needs a number${min > -Infinity ? ` ≥ ${min}` : ''} (got '${v}').`);
        return n;
    };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        switch (a) {
            case '-h': case '--help': opts.help = true; break;
            case '-o': case '--out': opts.out = argv[++i]; break;
            case '--seconds': opts.seconds = num(a, argv[++i], { min: 0 }); break;
            case '--fps': opts.fps = num(a, argv[++i], { min: 1 }); break;
            case '--at': opts.at = num(a, argv[++i], { min: 0 }); break;
            case '--scale': opts.scale = num(a, argv[++i], { min: 0.01 }); break;
            case '--padding': opts.padding = num(a, argv[++i], { min: 0 }); break;
            case '--background': opts.background = argv[++i]; break;
            case '--eval': opts.evals.push(argv[++i]); break;
            case '--url': opts.url = argv[++i]; break;
            case '--port': opts.port = num(a, argv[++i], { min: 1, int: true }); break;
            case '--timeout': opts.timeout = num(a, argv[++i], { min: 1, int: true }); break;
            default:
                if (a.startsWith('-')) fail(`Unknown option: ${a}`);
                else if (opts.input) fail(`One input at a time (got '${opts.input}' and '${a}').`);
                else opts.input = a;
        }
    }
    return opts;
}

function fail(msg, code = 1) {
    process.stderr.write(`render: ${msg}\n`);
    process.exit(code);
}

const log = (msg) => process.stderr.write(`render: ${msg}\n`);

const HELP = `render — headless animation renderer (.yappy / scene script → PNG, GIF, MP4, WebM)

Usage:
  node scripts/render.mjs <input> -o out.mp4 [options]
  npm run render -- examples/manim-gradient-descent.js -o gd.gif

Input:  .yappy / .json document, or a .js script run against window.Yappy
Output: .png (one frame) · .gif · .mp4 · .webm (ffmpeg) · dir/ (PNG sequence)

Options:
  -o, --out <path>      Output file or directory (extension picks the format)
  --seconds <s>         Length (default: the document's animation length, else 5)
  --fps <n>             Frames per second (default 30; GIF 15, max 50)
  --at <s>              Frame time for .png output (default 0)
  --scale <k>           Pixels per canvas unit (default 1; GIF fits 960 px)
  --padding <px>        Margin around content when there is no page (default 20)
  --background <css>    Background colour, or 'transparent' (PNG only)
  --eval <expr>         Expression to run (and await) after loading; repeatable
  --url <url>           Render against a running instance (or set YAPPY_URL)
  --port <n>            Port for the spawned Vite server (default 5198)
  --timeout <ms>        Readiness timeout (default 120000)
  -h, --help            Show this help

Frames are rendered at exact times, never recorded, so output is machine-independent.
`;

/** What `-o` asks for: 'png' | 'gif' | 'mp4' | 'webm' | 'frames'. */
function outputKind(out) {
    if (out.endsWith('/') || out.endsWith('\\') || (existsSync(out) && statSync(out).isDirectory())) return 'frames';
    const ext = extname(out).toLowerCase();
    if (ext === '.png') return 'png';
    if (ext === '.gif') return 'gif';
    if (ext === '.mp4') return 'mp4';
    if (ext === '.webm') return 'webm';
    fail(`Can't tell the format from '${out}': use .png, .gif, .mp4, .webm, or a directory ending in /.`);
}

/** The input as something the page can load: a document object, or script source. */
function readInput(input) {
    const ext = extname(input).toLowerCase();
    let bytes;
    try { bytes = readFileSync(resolve(input)); }
    catch (e) { fail(`Cannot read input: ${e.message}`); }
    if (ext === '.js' || ext === '.mjs') return { kind: 'script', source: bytes.toString('utf8') };
    // .yappy is gzipped JSON; tolerate a plain-JSON .yappy the way the Open menu does.
    let text;
    try { text = bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes).toString('utf8') : bytes.toString('utf8'); }
    catch (e) { fail(`Cannot decompress ${input}: ${e.message}`); }
    try { return { kind: 'document', doc: JSON.parse(text) }; }
    catch (e) { fail(`${input} is not a Yappy document (${e.message}).`); }
}

// ─── Server helpers ──────────────────────────────────────
async function isUp(url) {
    try {
        const res = await fetch(url, { method: 'GET' });
        return res.ok || res.status === 304;
    } catch { return false; }
}

async function waitUntilUp(url, timeout) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        if (await isUp(url)) return true;
        await sleep(300);
    }
    return false;
}

function hasFfmpeg() {
    const r = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return r.status === 0;
}

/** Pipe PNG frames into ffmpeg. Returns { write(buf), done() }. */
function startFfmpeg(out, kind, fps) {
    const codec = kind === 'mp4'
        // yuv420p needs even dimensions; pad by at most one pixel rather than fail.
        ? ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart']
        : ['-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-crf', '32', '-b:v', '0'];
    const args = [
        '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
        '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', ...codec, resolve(out),
    ];
    const proc = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
    const exited = new Promise((res) => proc.on('close', res));
    let broken = null;
    proc.stdin.on('error', (e) => { broken = e; });
    return {
        async write(buf) {
            if (broken) throw new Error(`ffmpeg stopped reading: ${broken.message}`);
            if (!proc.stdin.write(buf)) await new Promise((r) => proc.stdin.once('drain', r));
        },
        async done() {
            proc.stdin.end();
            const code = await exited;
            if (code !== 0) throw new Error(`ffmpeg exited with code ${code}.`);
        },
        kill() { proc.kill('SIGKILL'); },
    };
}

const dataUrlBytes = (url) => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');

async function main() {
    const opts = parseArgs(process.argv.slice(2));
    if (opts.help) { process.stdout.write(HELP); return; }
    if (!opts.input) fail('No input file. Try --help.');
    if (!opts.out) fail('No output: pass -o <file.png|.gif|.mp4|.webm|dir/>.');

    const kind = outputKind(opts.out);
    if (opts.background === 'transparent' && kind !== 'png' && kind !== 'frames') {
        fail(`--background transparent needs PNG output (${kind} has no alpha here).`);
    }
    if ((kind === 'mp4' || kind === 'webm') && !hasFfmpeg()) fail(`${kind} output needs ffmpeg on PATH.`);
    const input = readInput(opts.input);   // before the browser boot, so a typo fails fast
    if (kind === 'frames') {
        try { mkdirSync(resolve(opts.out), { recursive: true }); }
        catch (e) { fail(`Cannot create ${opts.out}: ${e.message}`); }
    }

    // Resolve the target URL: reuse a reachable instance, else spawn Vite.
    let url = opts.url;
    let vite = null;
    if (url) {
        if (!(await isUp(url))) fail(`--url ${url} is not reachable.`);
    } else {
        url = `http://localhost:${opts.port}`;
        if (!(await isUp(url))) {
            log(`starting Vite on ${url} …`);
            vite = spawn('npx', ['vite', '--port', String(opts.port), '--strictPort'], {
                cwd: resolve(new URL('..', import.meta.url).pathname),
                stdio: 'ignore',
                detached: false,
            });
            vite.on('error', (e) => fail(`Failed to start Vite: ${e.message}`));
            if (!(await waitUntilUp(url, opts.timeout))) {
                if (vite) vite.kill('SIGTERM');
                fail(`Vite did not become ready within ${opts.timeout}ms.`);
            }
        }
    }

    let chromium;
    try { ({ chromium } = await import('playwright')); }
    catch { if (vite) vite.kill('SIGTERM'); fail("Playwright not installed. Run 'npm i' (playwright is a devDependency)."); }

    const browser = await chromium.launch({ headless: true });
    let exitCode = 0;
    let encoder = null;
    try {
        const page = await browser.newPage();
        page.on('pageerror', (e) => log(`page error: ${e.message}`));
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: opts.timeout });
        await page.waitForFunction(() => typeof window.Yappy !== 'undefined', null, { timeout: opts.timeout });
        // Text is measured when it is created, so the webfonts must be real first.
        await page.evaluate(async () => { if (typeof window.Yappy.fontsReady === 'function') await window.Yappy.fontsReady(); });

        if (input.kind === 'document') {
            await page.evaluate((doc) => window.Yappy.loadDocument(doc), input.doc);
        } else {
            // Indirect eval: the script runs at global scope, like a pasted console snippet.
            await page.evaluate(async (src) => { await (0, eval)(src); }, input.source);
        }
        for (const expr of opts.evals) {
            await page.evaluate(async (src) => { await (0, eval)(src); }, expr);
        }
        // Scripts usually end by pressing play; frames come from the render clock, not the live one.
        await page.evaluate(() => { try { window.Yappy.playScene(false); } catch { /* not every doc has a scene */ } });

        const seconds = opts.seconds ?? await page.evaluate(() => window.Yappy.getAnimationDuration()) ?? 0;
        const length = seconds > 0 ? seconds : 5;
        const background = opts.background ?? undefined;
        // One region for every frame: the union over the whole run, so moving content stays in frame.
        const region = await page.evaluate(
            (o) => window.Yappy.getFrameRegion(o),
            { seconds: kind === 'png' ? 0 : length, padding: opts.padding, background },
        );
        if (!region) throw new Error('Nothing to render: the document is empty.');

        if (kind === 'gif') {
            const fps = Math.min(50, opts.fps ?? 15);
            const b64 = await page.evaluate(async ({ length, region, scale, fps, background }) => {
                const bytes = await window.Yappy.renderGif(length, { region, scale: scale ?? undefined, fps, background });
                if (!bytes) return null;
                let s = '';
                for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
                return btoa(s);
            }, { length, region, scale: opts.scale, fps, background });
            if (!b64) throw new Error('renderGif returned nothing.');
            writeFileSync(resolve(opts.out), Buffer.from(b64, 'base64'));
            log(`wrote ${opts.out} (${+length.toFixed(3)}s at ${fps} fps, ${Math.round(region.width)}×${Math.round(region.height)} units)`);
        } else {
            const fps = opts.fps ?? 30;
            const times = kind === 'png' ? [opts.at] : Array.from({ length: Math.max(1, Math.round(length * fps)) }, (_, i) => i / fps);
            if (kind === 'mp4' || kind === 'webm') encoder = startFfmpeg(opts.out, kind, fps);
            const renderOne = (t) => page.evaluate(
                ({ t, region, scale, background }) => window.Yappy.renderFrame(t, { region, scale: scale ?? undefined, background }),
                { t, region, scale: opts.scale, background },
            );
            for (let i = 0; i < times.length; i++) {
                const url = await renderOne(times[i]);
                if (!url) throw new Error(`renderFrame(${times[i]}) returned nothing.`);
                const png = dataUrlBytes(url);
                if (kind === 'png') writeFileSync(resolve(opts.out), png);
                else if (kind === 'frames') writeFileSync(join(resolve(opts.out), `frame-${String(i).padStart(5, '0')}.png`), png);
                else await encoder.write(png);
                if (times.length > 1 && (i + 1) % 30 === 0) log(`${i + 1}/${times.length} frames`);
            }
            if (encoder) { await encoder.done(); encoder = null; }
            const what = kind === 'png' ? `frame at ${opts.at}s` : `${times.length} frames, ${+length.toFixed(3)}s at ${fps} fps`;
            log(`wrote ${opts.out} (${what})`);
        }
    } catch (e) {
        log(e.message);
        exitCode = 2;
        if (encoder) encoder.kill();
    } finally {
        await browser.close();
        if (vite) vite.kill('SIGTERM');
    }
    process.exit(exitCode);
}

main();
