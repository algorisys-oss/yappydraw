/**
 * The built-in fonts' Google Fonts stylesheet — ONE definition, used by the editor
 * (`frontend/index.html`, kept identical by builtin-fonts.test.ts), SVG export, HTML export and
 * the SDK.
 *
 * Every family is requested at its FULL weight range (and italics where they exist). It used to
 * be 400 and 700 only, so the Style menu could never offer Thin, Light or Black, and asking for
 * them clamped to Regular or Bold (Anshika's review, Phase 4). Browsers download a face only
 * when text actually uses it, so the wider request costs nothing until a weight is picked.
 * Ranges (`100..900`) are for the variable families; Poppins is static, so its weights are
 * listed. Every URL here was checked to return 200 — a range wider than a family's axis is a
 * hard 400 for the whole request.
 */

/** Weights each built-in font key can render, lightest first. Italic availability is in
 *  `fontCapabilities` (config/properties.ts). */
export const BUILTIN_FONT_WEIGHTS: Record<string, number[]> = {
    'hand-drawn': [400],                                          // Handlee
    'marker': [400],                                              // Permanent Marker
    'caveat': [400, 500, 600, 700],                               // Caveat 400..700
    'sans-serif': [100, 200, 300, 400, 500, 600, 700, 800, 900],  // Inter 100..900
    'poppins': [100, 200, 300, 400, 500, 600, 700, 800, 900],     // Poppins (static)
    'serif': [300, 400, 500, 600, 700, 800, 900],                 // Merriweather 300..900
    'monospace': [100, 200, 300, 400, 500, 600, 700, 800],        // JetBrains Mono 100..800
    'code': [200, 300, 400, 500, 600, 700, 800, 900],             // Source Code Pro 200..900
};

const POPPINS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

export const BUILTIN_FONTS_CSS_URL = 'https://fonts.googleapis.com/css2'
    + '?family=Caveat:wght@400..700'
    + '&family=Handlee'
    + '&family=Inter:ital,wght@0,100..900;1,100..900'
    + '&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800'
    + '&family=Merriweather:ital,wght@0,300..900;1,300..900'
    + '&family=Permanent+Marker'
    + `&family=Poppins:ital,wght@${[...POPPINS.map(w => `0,${w}`), ...POPPINS.map(w => `1,${w}`)].join(';')}`
    + '&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900'
    + '&display=swap';
