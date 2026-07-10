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

            <h2>Embed Behavior</h2>
            <ul>
                <li><strong>Pan/zoom</strong> via mouse wheel — enabled</li>
                <li><strong>Auto-fit</strong> — content fits the iframe on load and window resize</li>
                <li><strong>Read-only</strong> — all drawing and selection interactions are blocked</li>
                <li><strong>"Open in Yappy"</strong> — watermark link opens the full editor in a new tab</li>
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
