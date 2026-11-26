import { describe, expect, test } from 'bun:test';
import { buildEditorHtml, editorCsp, makeNonce } from './webview-html';

const SAMPLE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
  <link rel="canonical" href="https://yappydraw.com/" />
  <link rel="manifest" href="./manifest.webmanifest">
  <script type="application/ld+json">{"@type":"WebApplication"}</script>
  <script type="module" crossorigin src="./assets/index-abc.js"></script>
</head>
<body>
  <div id="root"></div>
  <script>
    window.__yappyBootFailsafe = setTimeout(function () {}, 15000);
  </script>
  <!-- GoatCounter Analytics - privacy-friendly, no cookies -->
  <script data-goatcounter="https://yappydraw.goatcounter.com/count"
          async src="//gc.zgo.at/count.js"></script>
</body>
</html>`;

const OPTS = { baseUri: 'https://file+.vscode-resource.vscode-cdn.net/ext/media/editor', cspSource: 'https://*.vscode-cdn.net', nonce: 'N0NCE' };

describe('buildEditorHtml', () => {
    const html = buildEditorHtml(SAMPLE, OPTS);

    test('injects <base> with a trailing slash right after <head>, before any relative URL', () => {
        expect(html).toContain('<base href="https://file+.vscode-resource.vscode-cdn.net/ext/media/editor/">');
        expect(html.indexOf('<base ')).toBeLessThan(html.indexOf('./favicon.svg'));
        expect(html.indexOf('<base ')).toBeGreaterThan(html.indexOf('<head>'));
    });

    test('adds a CSP meta carrying the nonce', () => {
        expect(html).toContain('http-equiv="Content-Security-Policy"');
        expect(html).toContain("'nonce-N0NCE'");
    });

    test('every remaining script carries the nonce', () => {
        const scripts = html.match(/<script\b[^>]*>/g) ?? [];
        expect(scripts.length).toBe(3);
        for (const s of scripts) expect(s).toContain('nonce="N0NCE"');
    });

    test('drops analytics, manifest and canonical', () => {
        expect(html).not.toContain('goatcounter');
        expect(html).not.toContain('GoatCounter');
        expect(html).not.toContain('rel="manifest"');
        expect(html).not.toContain('rel="canonical"');
    });

    test('keeps the app entry and root', () => {
        expect(html).toContain('src="./assets/index-abc.js"');
        expect(html).toContain('<div id="root"></div>');
    });

    test('does not double an existing trailing slash', () => {
        const h = buildEditorHtml(SAMPLE, { ...OPTS, baseUri: 'https://x/y/' });
        expect(h).toContain('<base href="https://x/y/">');
    });

    test('a page without <head> still gets the base first', () => {
        const h = buildEditorHtml('<div id="root"></div>', OPTS);
        expect(h.startsWith('<base ')).toBe(true);
    });
});

describe('editorCsp', () => {
    test('locks script sources to the extension and the nonce; allows eval for user formulas and WASM', () => {
        const csp = editorCsp({ cspSource: 'SRC', nonce: 'n' });
        expect(csp).toContain("default-src 'none'");
        expect(csp).toContain("script-src SRC 'nonce-n' 'unsafe-eval' 'wasm-unsafe-eval'");
        expect(csp).not.toMatch(/script-src[^;]*https:/);
    });
});

describe('makeNonce', () => {
    test('32 alphanumerics', () => {
        expect(makeNonce()).toMatch(/^[A-Za-z0-9]{32}$/);
    });
});
