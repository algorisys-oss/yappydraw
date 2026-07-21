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
    { version: '0.8.125', date: '2026-07-21', items: [
        'Text you type into a shape is now centred by default, so boxes look right without reaching for the alignment buttons. Your existing drawings are unchanged, and you can still set left or right per shape.',
        'The Properties panel no longer slides open every time you pick a tool. Open it when you want it (Alt+Enter, the sliders button, or right-click a tool group) and it stays where you put it — handy during a long brainstorming session.',
    ] },
    { version: '0.8.124', date: '2026-07-20', items: [
        'Templates you save yourself now show a preview instead of a blank icon — including ones you saved before this update.',
    ] },
    { version: '0.8.123', date: '2026-07-20', items: [
        'Template cards now show what\'s actually inside them. Diagrams show the diagram, designs show the page, and a presentation shows its first few slides — so you can pick by looking instead of by reading the name.',
        'Fixed: rounding the corners of a square or diamond left its fill spilling outside the outline. Gradients, patterns and hatch fills now stay inside the rounded shape.',
        'Fixed: cards on the Designs tab were squashed into thin strips with their names cut off.',
    ] },
    { version: '0.8.122', date: '2026-07-20', items: [
        'Fixed: a stick figure with folded arms wearing a jacket looked like it had a giant bow across its chest. Sleeves now tuck under the top, so folded arms read properly — and every top looks a little cleaner at the shoulder.',
    ] },
    { version: '0.8.121', date: '2026-07-20', items: [
        'Stick figures can wear tops and ties — T-shirt, long sleeve, vest, jacket or hoodie, plus a tie, bow tie or scarf.',
        'Sleeves follow the arms and the tie follows the torso, so clothing moves with the pose just like trousers do.',
        'Front-facing shoes redrawn so they read as shoes head-on, and joggers lost the stray cuff line.',
    ] },
    { version: '0.8.120', date: '2026-07-20', items: [
        'Stick figures can wear trousers and shoes — 8 trouser styles and 6 shoe styles, each with its own colour.',
        'The clothing follows the pose: a seated figure\'s trousers bend at the knee, a cyclist\'s follow the pedalling leg, and animated figures keep theirs through a walk cycle.',
        'Find it under Appearance in the Properties panel, alongside expression and hair.',
        'Existing figures are unchanged — trousers are opt-in, and the Woman and Girl variants keep their skirt.',
    ] },
    { version: '0.8.119', date: '2026-07-20', items: [
        'Comic characters now each have their own hair, so you can tell them apart at a glance — and it stays the same in every panel.',
        'Eight new hair styles for every figure: Swoosh, Mohawk, Afro, Bob, Braids, Top knot, Balding and Cap (18 in all).',
    ] },
    { version: '0.8.118', date: '2026-07-20', items: [
        'Comic emotions now show on the face — write "Ann (angry): ..." and Ann actually looks angry, not just tense.',
        'Comic characters are normal stick figures: select one and change its expression or hair from the Properties panel.',
        'Fixed: changing a comic figure\'s expression used to wipe its hair, and monochrome comics kept coloured hair.',
    ] },
    { version: '0.8.117', date: '2026-07-20', items: [
        'Animated figures have a Speed slider — speed them up or slow them down, including while they walk a path.',
        'Walking a route? "Lap time" sets how long one trip takes, so you can pace a scene exactly.',
        'Ten new motions for everyday scenes: Sit, Type, Squat, Lift weights, Stretch, Kick, Cook, Sweep, Drink and Think — twenty in all.',
        'Fixed: "Walk this path" did nothing when your route was a plain line — the figure now sets off properly.',
    ] },
    { version: '0.8.116', date: '2026-07-20', items: [
        'Stick figures have faces — pick from 12 expressions (happy, sad, angry, surprised, tired, excited, confused, wink…) and 10 hair styles, with a hair colour of your choice.',
        'Change a figure\'s mood any time: select it and use Face & hair in the Properties panel. It still works after you\'ve moved, scaled or ungrouped the figure.',
        'Animated figures get faces too, and keep them when you bake a frame to editable paths.',
        'Turn on "Solid head" to fill the head white so eyes and mouth stay readable over busy artwork.',
    ] },
    { version: '0.8.115', date: '2026-07-19', items: [
        'Set a mood per line in comics — write "Ann (angry): ..." and that line only is angry, so a character can be cheerful in one panel and furious in the next.',
        'Cues combine: "Ann (angry, whispers): ..." gives an angry whisper.',
    ] },
    { version: '0.8.114', date: '2026-07-19', items: [
        'Comic captions — start a line with * (or wrap it in brackets) for a "MEANWHILE..." box that sets the scene without putting anyone in the panel.',
    ] },
    { version: '0.8.113', date: '2026-07-19', items: [
        'Comics can think and whisper — write "Ben (thinks): ..." for a thought cloud, or "Ann (whispers): ..." for a dashed aside.',
    ] },
    { version: '0.8.112', date: '2026-07-19', items: [
        'New Comic Studio panel — write a few lines of dialogue and draw a comic without touching code. Open it from the Window/Panels menu or the command palette.',
        'As you type, it tells you who it found, the pose each character will strike and how many panels your script becomes.',
        'Longer conversations turn into a multi-panel strip automatically, laid out left-to-right.',
        'Set the mood yourself — pick an emotion (happy, angry, shouting, thinking…) or a figure for any character to override what the words suggested.',
    ] },
    { version: '0.8.111', date: '2026-07-19', items: [
        'Turn a script into a comic panel — type a few lines of dialogue and YappyDraw draws it: stick figures posed from what they say, facing each other, with speech balloons above them in the right reading order.',
        'The pose comes from the words: a greeting waves, ALL CAPS shouts, ":-(" looks sad, "lol" laughs, "maybe" thinks, "you" points.',
        'Everything stays editable — the panel is one group you can move, and you can drag any figure or balloon afterwards.',
    ] },
    { version: '0.8.110', date: '2026-07-19', items: [
        'Connectors space themselves out — when several arrows meet the same side of a shape they now fan into evenly spaced points instead of piling onto one spot, arranged so the lines don\'t cross.',
        'Two arrows between the same pair of shapes (or one each way) get their own lanes, so both arrowheads stay visible.',
        'Elbow connectors steer around each other instead of running along the top of another connector — lines still cross where your diagram needs them to.',
        'Endpoints follow your shapes: move a shape to the other side and the arrow hops to the edge facing it, landing on the real outline of circles and diamonds.',
    ] },
    { version: '0.8.109', date: '2026-07-18', items: [
        'Fixed Google Drive sign-in — after signing in, the popup no longer gets stuck on "Connecting…"; it now finishes and connects your Drive.',
        'Tidied the Load/Save panel — the old "Workspace" options are gone; use "My Drawings" (or Ctrl/Cmd+S) to keep and reopen drawings in your browser.',
    ] },
    { version: '0.8.108', date: '2026-07-17', items: [
        'New "My Drawings" gallery — save drawings right in your browser and reopen, rename, duplicate or delete them anytime, no account needed. Open it from the menu, the command palette, or "Jump back in" on the welcome screen.',
        'Press Ctrl/Cmd+S to save the current canvas straight to My Drawings (the full Export/Save dialog is still on Ctrl+Alt+S).',
        'Your saved drawings are kept durably on your device, so they survive browser cleanups — install the app or export a .yappy file for extra-safe backups.',
    ] },
    { version: '0.8.107', date: '2026-07-16', items: [
        'Cleaner construction guides: inserting a Rectangular Grid (or scripting plain lines) no longer adds stray arrowheads — lines are plain, the arrow tool is what adds a head.',
    ] },
    { version: '0.8.106', date: '2026-07-16', items: [
        'Import & export Excalidraw — open a .excalidraw file to bring its shapes in, or Save/Export → Export to Excalidraw to open your work there.',
        'Text boxes: the Auto Resize toggle now shows for text — hug the text (auto width) or drag a side handle to lock the width and let it wrap.',
        'Mind maps: press Tab or Enter and the new node inherits the parent’s font, size, colour and fill — no more re-styling every node.',
        'The Slingshot game got a real slingshot: a Y-fork with stretchy elastic bands, a wall of smashable blocks, and an easier-to-grab bird.',
        'Fixed: on Linux, an accidental middle-click no longer pastes random highlighted text into your labels.',
    ] },
    { version: '0.8.105', date: '2026-07-14', items: [
        'Exported HTML presentations now respond to the keyboard — → / Space to advance, ← to go back, Home/End to jump.',
        'Infinite-canvas HTML exports open perfectly framed to your content (no more hunting for your drawing).',
    ] },
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
