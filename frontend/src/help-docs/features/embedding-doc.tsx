import type { Component } from 'solid-js';

const EmbeddingDoc: Component = () => {
    return (
        <div class="doc-content">
            <h1>Embedding Drawings</h1>
            <p>
                Embed Yappy drawings in external platforms (Confluence, Notion, wikis, etc.) using iframe embed URLs.
                The embedded view shows a read-only canvas with pan/zoom — no toolbars or editing UI.
            </p>

            <h2>How to (in the app)</h2>
            <p>You don't need to write any code to get an embeddable link — just save the drawing and reuse its name:</p>
            <ol>
                <li><strong>Save &amp; name your drawing.</strong> Open <strong>Menu → Export / Save...</strong>
                    (<code>Ctrl+Alt+S</code>) and save to your workspace with a memorable name. The name becomes
                    the drawing's id.</li>
                <li><strong>Read the id from the URL bar.</strong> While editing, the address shows
                    <code> #doc=my-drawing</code> — that <code>my-drawing</code> part is the id.</li>
                <li><strong>Build the embed link.</strong> Swap <code>#doc=</code> for <code>#/embed/</code>:
                    <code> https://your-host/#/embed/my-drawing</code>. Append options like
                    <code> ?theme=dark&amp;slide=2</code> if you want (see below).</li>
                <li><strong>Paste it where you need it</strong> — drop the link into a Notion <code>/embed</code>
                    block, or wrap it in the <code>&lt;iframe&gt;</code> snippet below for Confluence, a wiki, or
                    any web page.</li>
            </ol>
            <p class="tip-box">
                Prefer to generate the snippet automatically? Open the browser console and call
                <code> Yappy.getEmbedHtml('my-drawing')</code> (see <strong>Programmatic API</strong> below) — it
                returns a ready-to-paste iframe.
            </p>

            <h2>Embed URL</h2>
            <p>Use this URL pattern to embed any saved drawing:</p>
            <pre><code>{`<iframe
  src="https://your-host/#/embed/your-drawing-name"
  width="800"
  height="600"
  frameborder="0"
  allowfullscreen>
</iframe>`}</code></pre>
            <p>
                The document name is the filename without extension. Check the URL bar when editing — if it shows{' '}
                <code>#doc=my-drawing</code>, the embed URL is <code>#/embed/my-drawing</code>.
            </p>

            <h2>Query Parameters</h2>
            <table class="doc-table">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Values</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>theme</code></td>
                        <td><code>light</code>, <code>dark</code></td>
                        <td>Override the color theme</td>
                    </tr>
                    <tr>
                        <td><code>bg</code></td>
                        <td>CSS color (URL-encoded)</td>
                        <td>Override canvas background</td>
                    </tr>
                    <tr>
                        <td><code>slide</code></td>
                        <td>Integer (1-indexed)</td>
                        <td>Which slide to show initially</td>
                    </tr>
                    <tr>
                        <td><code>watermark</code></td>
                        <td><code>false</code></td>
                        <td>Hide the "Open in Yappy" link</td>
                    </tr>
                </tbody>
            </table>

            <h2>Examples</h2>
            <pre><code>{`# Dark theme
#/embed/architecture-diagram?theme=dark

# Specific slide with custom background
#/embed/quarterly-review?slide=3&bg=%23f0f0f0

# No watermark
#/embed/my-drawing?watermark=false

# Combined
#/embed/my-drawing?theme=dark&slide=2&watermark=false`}</code></pre>

            <h2>Programmatic API</h2>
            <p>Generate embed URLs and HTML from the browser console or scripts:</p>
            <pre><code>{`// Get embed URL
Yappy.getEmbedUrl('my-drawing', { theme: 'dark', slide: 2 })

// Get iframe HTML snippet
Yappy.getEmbedHtml('my-drawing', { width: 1024, height: 768 })`}</code></pre>

            <h2>Interactive control (drive the full editor)</h2>
            <p>
                The <code>#/embed/</code> route above is a <em>read-only</em> viewer. To embed the{' '}
                <strong>full, editable</strong> Yappy and script it from a host page, load the normal app URL
                (not <code>#/embed/</code>) in an iframe and call the API. How you reach the API depends on
                whether the host page and Yappy share an origin.
            </p>

            <h3>Same-origin — no setup</h3>
            <p>
                If your page and Yappy are served from the same origin, the whole API is already on the
                iframe's window. Nothing to configure:
            </p>
            <pre><code>{`const y = document.querySelector('#yappy').contentWindow.Yappy;
await y.fontsReady();                    // see "Wait for fonts" below
y.importDSL('graph TD; A-->B; B-->C');   // build a diagram from text
const svg = y.exportSVG();               // read it back`}</code></pre>

            <h3>Wait for fonts before creating text</h3>
            <p>
                Text-bearing shapes are <strong>auto-sized from the measured text at creation</strong>, and the
                measurement is written into the saved document. If the webfonts have not arrived yet, that
                measurement is taken against the fallback font and the wrong size is baked in permanently — it
                does not correct itself on the next render. Await <code>Yappy.fontsReady()</code> before the
                first call that creates text:
            </p>
            <pre><code>{`await y.fontsReady();        // resolves when the built-in fonts are measurable
y.importDSL(source);         // now every auto-sized box is sized correctly

y.fontsLoaded();             // → boolean, the same state without waiting`}</code></pre>
            <p class="tip-box">
                Do <strong>not</strong> substitute <code>document.fonts.ready</code>. It resolves — and{' '}
                <code>document.fonts.status</code> reads <code>"loaded"</code> — while a font that has never
                been rendered is still unavailable, because <code>ready</code> only settles the faces that were
                actually <em>requested</em>. <code>fontsReady()</code> requests them first, then waits.
            </p>

            <h3>Cross-origin — postMessage bridge</h3>
            <p>
                Browsers block <code>iframe.contentWindow.Yappy</code> across origins. Yappy ships a{' '}
                <strong>postMessage control bridge</strong> for this case. It is <strong>off by default</strong>{' '}
                and only answers pages the <em>operator</em> has allowlisted — a page that merely frames Yappy
                cannot drive it.
            </p>
            <p><strong>1. Operator: allowlist the parent origin(s).</strong> Choose one (build-time wins unless the
                runtime global is set):</p>
            <pre><code>{`# Build-time env (baked into the bundle)
VITE_EMBED_ALLOWED_ORIGINS="https://app.example.com,https://wiki.example.com"

# …or a runtime global in Yappy's OWN index.html
<script>window.YAPPY_EMBED_ALLOWED_ORIGINS = ['https://app.example.com'];</script>`}</code></pre>
            <p class="tip-box">
                Use a specific origin list, not <code>'*'</code>. The <code>'*'</code> wildcard disables the
                origin check (any page that frames Yappy can drive the API) and logs a warning — only for
                trusted internal deployments.
            </p>
            <p><strong>2. Host page: drive it with the client.</strong> Load the bundled helper (or copy{' '}
                <code>public/yappy-embed-client.js</code> into your project):</p>
            <pre><code>{`<iframe id="frame" src="https://your-yappy-host/" width="1000" height="700"></iframe>
<script src="https://your-yappy-host/yappy-embed-client.js"></script>
<script>
  const yappy = createYappyEmbed(document.querySelector('#frame'), {
    targetOrigin: 'https://your-yappy-host'   // Yappy's origin
  });

  await yappy.ready();                          // waits for the bridge
  await yappy.call('fontsReady');                // waits for the webfonts
  await yappy.call('importDSL', 'graph TD; A-->B; B-->C');
  const svg = await yappy.call('exportSVG');    // every Yappy.* method works
</script>`}</code></pre>
            <p>
                <code>call(method, ...args)</code> invokes any <code>window.Yappy</code> method and returns a
                Promise of its result. Results travel over <code>postMessage</code>, so they must be
                serializable (strings, plain objects, arrays) — element ids, SVG strings, and DSL results are
                all fine.
            </p>

            <h3>Restricting who can embed Yappy at all</h3>
            <p>
                The allowlist above controls <em>who can drive</em> the API — a separate concern from{' '}
                <em>who can put Yappy in an iframe</em> in the first place. By default any site can frame
                Yappy (the control bridge stays off, so that's harmless, but the read-only viewer is still
                embeddable anywhere). To restrict framing itself, set a response header on the server that
                serves Yappy — this is <strong>deploy-server config, not an app setting</strong>:
            </p>
            <pre><code>{`# Allow only these parents to frame Yappy (recommended)
Content-Security-Policy: frame-ancestors 'self' https://app.example.com https://wiki.example.com;

# Block ALL framing (disables embedding entirely)
Content-Security-Policy: frame-ancestors 'none';
X-Frame-Options: DENY`}</code></pre>
            <p class="tip-box">
                Prefer <code>frame-ancestors</code> (CSP) — it supports multiple origins and is the modern
                replacement for <code>X-Frame-Options</code> (which only understands <code>DENY</code> /{' '}
                <code>SAMEORIGIN</code>). Keep the framing allowlist and the control allowlist
                (<code>VITE_EMBED_ALLOWED_ORIGINS</code>) in sync so the pages you let embed Yappy are also the
                ones you let drive it.
            </p>

            <h2>Embed Behavior</h2>
            <ul>
                <li><strong>Pan/zoom</strong> via mouse wheel — enabled</li>
                <li><strong>Auto-fit</strong> — content fits the iframe on load and window resize</li>
                <li><strong>Read-only</strong> — all drawing and selection interactions are blocked</li>
                <li><strong>"Open in Yappy"</strong> — watermark link opens the full editor in a new tab</li>
                <li><strong>Full editor + API</strong> — load the normal app URL (not <code>#/embed/</code>) and
                    use the same-origin or cross-origin control paths above</li>
            </ul>

            <h2>Platform Integration</h2>
            <ul>
                <li><strong>Confluence</strong> — HTML macro, iframe macro, or Connect App</li>
                <li><strong>Notion</strong> — <code>/embed</code> block with the embed URL</li>
                <li><strong>SharePoint</strong> — Embed web part</li>
                <li><strong>WordPress</strong> — Custom HTML block</li>
                <li><strong>Any wiki/CMS</strong> — Paste the iframe HTML</li>
            </ul>
            <p>
                See <code>docs/integration.md</code> for detailed platform-specific instructions.
            </p>
        </div>
    );
};

export default EmbeddingDoc;
