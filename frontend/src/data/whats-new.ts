/**
 * "What's new" changelog shown when the user clicks the version number.
 *
 * Hand-maintained so the copy stays user-facing (what it does FOR them), not
 * commit-speak. Newest first. When you ship a release, add an entry here with the
 * headline change(s) — see CLAUDE.md "ship it".
 */

export interface WhatsNewEntry {
    version: string;
    date: string;      // YYYY-MM-DD
    items: string[];   // benefit-first, end-user language
}

export const WHATS_NEW: WhatsNewEntry[] = [
    { version: '0.8.104', date: '2026-07-14', items: [
        'Export your animated page as a looping GIF — Export → Animated GIF. Same page-perfect framing as the MP4 export, plays anywhere, loops forever.',
    ] },
    { version: '0.8.103', date: '2026-07-14', items: [
        'Export your animated page as a real MP4 — Export → MP4 Video renders the page itself (exact bounds, animations playing) for the duration you pick. Plays everywhere.',
        'The Font dropdown is now searchable, keyboard-friendly (↑↓ + Enter) and always stays on screen — and arrow keys no longer move your element while picking a font.',
        'Try the new “Stick-Figure Animation Demo” template — search “animation” in Templates or Elements.',
    ] },
    { version: '0.8.102', date: '2026-07-14', items: [
        "Click the version number (bottom-right) to see “What's new” — a running list of recent updates.",
    ] },
    { version: '0.8.101', date: '2026-07-14', items: [
        'Elements no longer disappear when you drag them to the edge of a page — they stay visible as long as any part is still on the page.',
    ] },
    { version: '0.8.100', date: '2026-07-14', items: [
        'New here? A quick guided tour highlights the essentials on your first visit — replay it anytime from Help (?).',
    ] },
    { version: '0.8.99', date: '2026-07-14', items: [
        'Alignment & spacing guides always clear once you finish dragging (no more stuck guides).',
    ] },
    { version: '0.8.98', date: '2026-07-14', items: [
        'Make text much bigger — font size now goes all the way to 800.',
        'A text box grows to fit when you increase its font size, so big text is still easy to select.',
        'Smoother font-size dragging from the floating toolbar (no flicker).',
    ] },
    { version: '0.8.97', date: '2026-07-14', items: [
        'Hold Shift while dragging to move in a straight line — horizontal, vertical, or 45°.',
        'Click inside an unfilled combined/boolean shape to select it.',
    ] },
    { version: '0.8.96', date: '2026-07-14', items: [
        'Include dimension annotations in your exports — PNG, JPG, PDF and true-vector SVG.',
    ] },
    { version: '0.8.95', date: '2026-07-13', items: [
        'Measure in px, mm or inches, with angle, radius and diameter dimensions — and it follows rotated shapes.',
    ] },
    { version: '0.8.94', date: '2026-07-13', items: [
        'Snap precisely to points where two outlines cross.',
    ] },
    { version: '0.8.93', date: '2026-07-13', items: [
        'Precision boost: measure the gap to a neighbour (Alt-hover), a richer measure readout, and snap-to-point while dragging.',
    ] },
    { version: '0.8.92', date: '2026-07-13', items: [
        'The native colour picker drags smoothly again in the Appearance fill/stroke rows.',
    ] },
    { version: '0.8.91', date: '2026-07-13', items: [
        'Two ways to place text: click to auto-size as you type, or drag a box for fixed-width wrapping.',
    ] },
    { version: '0.8.90', date: '2026-07-13', items: [
        'Templates and greeting cards now show up right in the unified element search.',
    ] },
    { version: '0.8.89', date: '2026-07-13', items: [
        'Tidier main menu with collapsible groups.',
    ] },
    { version: '0.8.88', date: '2026-07-13', items: [
        'Search icons, illustrations and photos together in one box — press Alt+E.',
    ] },
    { version: '0.8.87', date: '2026-07-13', items: [
        'Unified element search: one “Search elements” box across icons, shapes and photos.',
    ] },
    { version: '0.8.86', date: '2026-07-13', items: [
        'Replace an image background in one click with AI.',
    ] },
    { version: '0.8.85', date: '2026-07-13', items: [
        'Stick figures drop in at a friendlier default size, and baked figures are fully reshapeable.',
    ] },
    { version: '0.8.84', date: '2026-07-13', items: [
        'Control which sites are allowed to embed Yappy.',
    ] },
    { version: '0.8.83', date: '2026-07-13', items: [
        'Embed and drive the full editor from another project via a cross-origin API bridge.',
    ] },
    { version: '0.8.82', date: '2026-07-13', items: [
        'Custom stroke dash patterns.',
    ] },
];
