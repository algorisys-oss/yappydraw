/**
 * LaTeX typesetting → Yappy vector paths.
 *
 * The gap this closes: equations previously had to be written as flat Unicode text
 * (`L = x²`), with no fraction bars, integrals with limits, matrices or aligned
 * derivations. This renders real TeX and imports the result as ordinary path elements,
 * so an equation scales, restyles, animates and exports like any other artwork.
 *
 * Two decisions worth knowing about:
 *
 * 1. **MathJax with `fontCache: 'none'`.** MathJax's default SVG output builds every
 *    glyph as a `<path>` inside `<defs>` referenced by `<use>`. `fontCache: 'none'`
 *    inlines each glyph as a standalone `<path>` instead, which is what the SVG importer
 *    consumes directly. (The importer now resolves `<use>` too, but not needing it keeps
 *    this path simple and the output flat.)
 *
 * 2. **Per-symbol addressing via `data-tex-part`.** MathJax tags each glyph with
 *    `data-c`, the Unicode codepoint. Those are Mathematical Alphanumeric Symbols
 *    (`𝑒` is U+1D452, not `e`), so a plain lookup by "e" would miss. NFKD normalisation
 *    maps them back to their base character — `𝑒`→`e`, `𝜋`→`π` — which is what makes
 *    `Yappy.texPart(id, 'π')` behave the way you'd expect.
 *
 * MathJax is ~1 MB, so it is imported lazily and cached; it never touches the startup
 * bundle. The first `Yappy.tex()` call pays the load, later ones don't.
 */

/** One addressable glyph of a typeset equation. */
export interface TexPart {
    /** Position in the equation, left to right, 0-based. */
    index: number;
    /** The rendered character, NFKD-normalised (`𝜋` → `π`). Empty for unnamed marks. */
    char: string;
    /** MathML node kind MathJax assigned: 'mi' (identifier), 'mo' (operator), 'mn' (number)… */
    node: string;
    /** Id of the path element drawn for it. */
    elementId: string;
}

export interface TexRenderOptions {
    /** Render as a centred display equation rather than inline. Default true. */
    display?: boolean;
}

type MathJaxBits = {
    convert: (latex: string, display: boolean) => string;
};

let cached: Promise<MathJaxBits> | null = null;

/**
 * Load MathJax once and return a `convert` closure.
 *
 * Uses the *lite* adaptor rather than the browser one: it is DOM-free, so output is
 * deterministic and unaffected by page styles, and it works identically under test.
 */
function loadMathJax(): Promise<MathJaxBits> {
    if (cached) return cached;
    cached = (async () => {
        const [{ mathjax }, { TeX }, { SVG }, { liteAdaptor }, { RegisterHTMLHandler }, { AllPackages }] =
            await Promise.all([
                import('mathjax-full/js/mathjax.js'),
                import('mathjax-full/js/input/tex.js'),
                import('mathjax-full/js/output/svg.js'),
                import('mathjax-full/js/adaptors/liteAdaptor.js'),
                import('mathjax-full/js/handlers/html.js'),
                import('mathjax-full/js/input/tex/AllPackages.js'),
            ]);
        const adaptor = liteAdaptor();
        RegisterHTMLHandler(adaptor);
        const doc = mathjax.document('', {
            InputJax: new TeX({ packages: AllPackages }),
            OutputJax: new SVG({ fontCache: 'none' }),
        });
        return {
            convert(latex: string, display: boolean) {
                const node = doc.convert(latex, { display });
                return adaptor.outerHTML(node);
            },
        };
    })().catch(err => {
        cached = null;            // let a later call retry rather than wedging forever
        throw err;
    });
    return cached;
}

/** MathML token kinds that correspond to a symbol a user might want to address. */
const TOKEN_NODES = new Set(['mi', 'mo', 'mn', 'mtext', 'ms']);

/**
 * Turn a `data-c` hex codepoint into the character someone would actually type.
 * NFKD folds Mathematical Alphanumeric Symbols onto their base letters.
 */
export function charOf(dataC: string | null): string {
    if (!dataC) return '';
    const cp = parseInt(dataC, 16);
    if (!Number.isFinite(cp) || cp <= 0) return '';
    try {
        return String.fromCodePoint(cp).normalize('NFKD');
    } catch {
        return '';
    }
}

/**
 * Stamp `data-tex-part` on every glyph so the SVG importer can carry symbol identity
 * onto the resulting elements. Returns the annotated SVG plus the parts in draw order.
 *
 * Order matters and is *document* order, which for MathJax SVG is left-to-right reading
 * order — the importer preserves it, so `parts[i]` lines up with the i-th imported path.
 */
export function annotate(svgHtml: string): { svg: string; parts: Omit<TexPart, 'elementId'>[] } {
    const doc = new DOMParser().parseFromString(svgHtml, 'text/html');
    const svg = doc.querySelector('svg');
    if (!svg) return { svg: svgHtml, parts: [] };

    const parts: Omit<TexPart, 'elementId'>[] = [];
    let index = 0;
    for (const path of Array.from(svg.querySelectorAll('path[data-c]'))) {
        const char = charOf(path.getAttribute('data-c'));
        // Nearest ancestor that says what kind of token this glyph belongs to.
        const owner = path.closest('[data-mml-node]');
        const node = owner?.getAttribute('data-mml-node') ?? '';
        // Key by character when we have one, else fall back to the index, so every glyph
        // is addressable even if its codepoint is missing or unmapped.
        path.setAttribute('data-tex-part', char || `#${index}`);
        parts.push({ index, char, node: TOKEN_NODES.has(node) ? node : node });
        index++;
    }
    return { svg: svg.outerHTML, parts };
}

/**
 * Typeset `latex` and return the annotated SVG plus its parts (without element ids —
 * the caller imports the SVG and pairs the ids back up in order).
 *
 * Throws if the TeX is invalid; MathJax reports the error in its own message format.
 */
export async function renderTex(
    latex: string,
    options: TexRenderOptions = {},
): Promise<{ svg: string; parts: Omit<TexPart, 'elementId'>[] }> {
    const mj = await loadMathJax();
    const html = mj.convert(latex, options.display ?? true);
    if (/data-mjx-error|merror/.test(html)) {
        const msg = /data-mjx-error="([^"]*)"/.exec(html)?.[1] ?? 'invalid TeX';
        throw new Error(`[Yappy.tex] ${msg}`);
    }
    return annotate(html);
}
