/**
 * Turns the built editor's `index.html` into the HTML of a VS Code webview.
 *
 * The build is the same one yappydraw.com serves (`base: './'`), so every asset URL in it is
 * relative. A webview's page lives at `vscode-webview://<id>/index.html`, where those URLs
 * would resolve to nothing; a `<base href>` on the bundled folder's webview URI makes them
 * resolve to the files the extension ships. Dynamic `import()` of chunks resolves against the
 * importing module's URL, so it follows along without help.
 *
 * Pure (no `vscode` import) so it can be unit-tested.
 */

export interface WebviewHtmlOptions {
    /** `webview.asWebviewUri(<editor folder>)`, as a string. A trailing slash is added. */
    baseUri: string;
    /** `webview.cspSource`. */
    cspSource: string;
    /** Random per-load nonce for the inline scripts the page keeps. */
    nonce: string;
}

/** Content-Security-Policy for the editor webview. */
export function editorCsp({ cspSource, nonce }: Pick<WebviewHtmlOptions, 'cspSource' | 'nonce'>): string {
    return [
        "default-src 'none'",
        // 'unsafe-eval': user-written code is compiled with `new Function` — plot formulas
        // (utils/plot.ts), animation expressions (composition-evaluator.ts) and game scripts
        // (game-runtime.ts). 'wasm-unsafe-eval': the geometry/routing and colour WASM modules.
        `script-src ${cspSource} 'nonce-${nonce}' 'unsafe-eval' 'wasm-unsafe-eval'`,
        `style-src ${cspSource} 'unsafe-inline' https://fonts.googleapis.com`,
        `font-src ${cspSource} data: https://fonts.gstatic.com`,
        // https: image search / icon libraries / pasted image URLs; data:/blob: exported
        // and pasted bitmaps.
        `img-src ${cspSource} data: blob: https:`,
        `media-src ${cspSource} data: blob:`,
        // The editor fetches its own bundled files (examples, stroke fonts, ICC profiles) and,
        // when the user turns them on, online services (AI providers, image search).
        `connect-src ${cspSource} data: blob: https:`,
        `worker-src ${cspSource} blob:`,
        `frame-src ${cspSource} blob: data:`,
    ].join('; ');
}

/** Rewrite the editor's `index.html` for the webview. */
export function buildEditorHtml(indexHtml: string, opts: WebviewHtmlOptions): string {
    const base = opts.baseUri.endsWith('/') ? opts.baseUri : opts.baseUri + '/';
    let html = indexHtml;

    // Analytics are for the website. An editor tab inside someone's IDE does not phone home.
    html = html.replace(/<!--\s*GoatCounter[\s\S]*?-->\s*/i, '');
    html = html.replace(/<script[^>]*goatcounter[^>]*>[\s\S]*?<\/script>\s*/gi, '');
    // The PWA manifest and the site's SEO/social tags mean nothing inside an editor tab.
    html = html.replace(/<link[^>]+rel=["']manifest["'][^>]*>\s*/gi, '');
    html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, '');

    // Every remaining <script> gets the nonce: external module scripts are covered by
    // cspSource anyway, the inline boot failsafe needs it, and JSON-LD is inert either way.
    html = html.replace(/<script(?![^>]*\bnonce=)/gi, `<script nonce="${opts.nonce}"`);

    const head =
        `<base href="${escapeAttr(base)}">\n` +
        `  <meta http-equiv="Content-Security-Policy" content="${escapeAttr(editorCsp(opts))}">\n`;
    // Directly after <head>: <base> must precede every relative URL in the document.
    if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => `${m}\n  ${head}`);
    else html = head + html;
    return html;
}

function escapeAttr(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** 32 alphanumeric characters for a CSP nonce. */
export function makeNonce(random: () => number = Math.random): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < 32; i++) out += chars.charAt(Math.floor(random() * chars.length));
    return out;
}
