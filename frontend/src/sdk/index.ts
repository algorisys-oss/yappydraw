/**
 * YappyDraw SDK — the drawing API without the editor, for pages that load it from
 * the CDN:
 *
 *     import { Yappy, mount, fontsReady } from 'https://cdn.jsdelivr.net/gh/algorisys-oss/yappydraw@v<version>/cdn/yappy.js'
 *
 *     await fontsReady()                                // before creating any text
 *     const sun = Yappy.createCircle(40, 40, 120, 120, { backgroundColor: '#ffd166', fillStyle: 'hachure' })
 *     mount('#stage')                                   // inline SVG, each shape a <g data-yappy-id>
 *     tinyfly.live.to(`[data-yappy-id="${sun}"]`, { rotate: 360, duration: 4, repeat: -1 })
 *
 * `Yappy` is the same object the editor exposes as `window.Yappy`, so every `create*`,
 * `importDSL`, `loadDocument` call documented in the in-app Help works unchanged. What
 * the SDK adds is output without the editor: `toSVG()` returns markup and never
 * downloads a file, and `mount()` puts it in the page.
 *
 * One page holds one drawing: the store is a module singleton, as in the editor.
 * Call `clear()` before building the next one.
 *
 * ES module only. The core is one file; MathJax, the exporters and similar heavy
 * features are separate chunks fetched from the same folder the first time they are
 * used, which a single IIFE script could not do.
 */
import { YappyAPI } from '../api';
import { renderSvgString, type SvgExportOptions } from '../utils/export';
import { version as pkgVersion } from '../../../package.json';

export const Yappy = YappyAPI;
export const version: string = pkgVersion;

export interface ToSvgOptions extends SvgExportOptions {
    /** Only the selected elements. Default false. */
    onlySelected?: boolean;
}

/**
 * The drawing as SVG markup. `elementIds` defaults to TRUE here (it is opt-in on
 * `Yappy.exportSVG`), because a page loading the SDK is almost always going to
 * animate or script the result. Returns '' for an empty drawing.
 */
export function toSVG(options: ToSvgOptions = {}): string {
    const { onlySelected = false, ...svgOpts } = options;
    return renderSvgString(onlySelected, { elementIds: true, ...svgOpts }) ?? '';
}

/**
 * Render the drawing into `target` as inline SVG, replacing its contents, and return
 * the `<svg>` element. Inline rather than `<img>` so CSS and animation libraries can
 * reach the shapes. Throws if the selector matches nothing, since an animation
 * pointed at a missing stage otherwise fails silently.
 */
export function mount(target: string | Element, options: ToSvgOptions = {}): SVGSVGElement {
    const host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) throw new Error(`Yappy.mount: no element matches ${String(target)}`);
    const markup = toSVG(options);
    host.replaceChildren();
    if (!markup) throw new Error('Yappy.mount: the drawing is empty — create something first');
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
    const svg = document.importNode(parsed, true) as unknown as SVGSVGElement;
    host.appendChild(svg);
    return svg;
}

// The same stylesheet frontend/index.html links. The editor gets its webfonts from
// that link; a page using the SDK has no such link, so without it `document.fonts.load`
// finds no @font-face to load and every text box is sized from fallback metrics.
const FONTS_CSS = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Handlee&family=Inter:ital,wght@0,400;0,700;1,400;1,700&family=JetBrains+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&family=Permanent+Marker&family=Poppins:ital,wght@0,400;0,700;1,400;1,700&family=Source+Code+Pro:ital,wght@0,400;0,700;1,400;1,700&display=swap';

/**
 * Load YappyDraw's built-in fonts, then resolve once they can be measured. Await it
 * before the first call that creates text: text boxes are sized from the measured text
 * at creation, so a measurement taken against a fallback font stays wrong. Adds the
 * font stylesheet to the page once. Never rejects — offline, text falls back.
 */
export async function fontsReady(): Promise<void> {
    if (!document.querySelector(`link[href="${FONTS_CSS}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = FONTS_CSS;
        const loaded = new Promise<void>(resolve => { link.onload = link.onerror = () => resolve(); });
        document.head.appendChild(link);
        await loaded; // the @font-face rules must exist before fonts.load() can request them
    }
    await YappyAPI.fontsReady();
}

/**
 * Start a fresh drawing: a blank infinite canvas with default layers and no swatches,
 * symbols or pages. Stronger than `Yappy.clear()`, which removes elements but keeps
 * the document — so after `importMarkdownSlides` the pages would still export.
 * Not `resetToNewDocument`, which also wipes the editor's autosave and sets UI state.
 */
export function clear(): void {
    YappyAPI.loadDocument({ elements: [] });
}
