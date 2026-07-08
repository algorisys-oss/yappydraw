/**
 * Hand-authored stick-figure SVGs (MVP set, ~24 across 6 categories).
 *
 * Authoring conventions (keep consistent so figures look like one family):
 *   • viewBox 0 0 140 260, figure centred near x = 70.
 *   • Bold uniform outline: stroke #1f2937, width 7, round caps/joins.
 *   • Hollow parts: root `fill="none"`; props set their own `fill`.
 *   • The body skeleton is ONE `<path>` (torso + arms + legs as subpaths) so it
 *     imports as a single editable element; the head is a `<circle>`; each prop
 *     is its own element. On drop all parts are grouped into one object.
 *
 * Colours are intentionally light "drawify-style" accents on props only; the
 * figures themselves stay monochrome and recolour cleanly.
 */
import type { StickAsset } from './types';

const W = 140, H = 260;
const STROKE = '#1f2937';

/** Wrap skeleton/prop markup in a consistent SVG document. */
function doc(inner: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none" stroke="${STROKE}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

/** Head circle at (cx,cy) radius r. Tagged `head` for per-part recolour. */
const head = (cx = 70, cy = 34, r = 22) => `<circle cx="${cx}" cy="${cy}" r="${r}" data-sf-role="head"/>`;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Parse an `M…L…L…` subpath (only M/L commands) into a list of [x,y] points. */
function subToPoints(sub: string): number[][] {
    return sub.replace(/^M/, '').split('L')
        .map(s => s.trim().split(/[ ,]+/).map(Number))
        .filter(p => p.length === 2 && p.every(Number.isFinite));
}

/**
 * Turn a straight/polyline limb into a smooth bezier path so that a selected limb
 * already carries editable curve handles (and reads a touch more organic, drawify-
 * style). A two-point limb gets a subtle perpendicular bow; a jointed limb (arm/leg
 * with a bend) is smoothed through its points with a Catmull-Rom spline.
 */
function curveLimb(points: number[][], bow = 0.05): string {
    if (points.length < 2) return '';
    if (points.length === 2) {
        const [a, b] = points;
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const len = Math.hypot(dx, dy) || 1;
        const off = len * bow;                       // perpendicular offset (px)
        const cx = (a[0] + b[0]) / 2 - (dy / len) * off;
        const cy = (a[1] + b[1]) / 2 + (dx / len) * off;
        return `M${a[0]} ${a[1]}Q${r1(cx)} ${r1(cy)} ${b[0]} ${b[1]}`;
    }
    // Catmull-Rom → cubic beziers through all points (rounds the joint naturally).
    let d = `M${points[0][0]} ${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;
        const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += `C${r1(c1x)} ${r1(c1y)} ${r1(c2x)} ${r1(c2y)} ${p2[0]} ${p2[1]}`;
    }
    return d;
}

/**
 * Skeleton from a straight `d` string. Each `M…` subpath (torso, each arm, each leg)
 * becomes its OWN smooth-curved `<path>` element, so that after ungrouping a dropped
 * figure every limb is independently selectable, stylable, AND already a bezier curve
 * with grabbable handles. All are tagged `body` for role recolour.
 */
const bones = (d: string) =>
    d.split(/(?=M)/).map(seg => seg.trim()).filter(Boolean)
        .map(seg => curveLimb(subToPoints(seg)))
        .filter(Boolean)
        .map(seg => `<path d="${seg}" data-sf-role="body"/>`).join('');

// ─── Category 1 · Daily Actions & Emotions ──────────────────────────────────

const standing = doc(head() + bones(
    'M70 56L70 150M70 84L46 122M70 84L94 122M70 150L52 226M70 150L88 226'));

const waving = doc(head(72, 32) + bones(
    'M72 54L70 150M70 84L44 120M70 82L100 42M70 150L52 226M70 150L88 226'));

const walking = doc(head(74, 34) + bones(
    'M74 56L66 148M66 82L44 112M66 82L92 60M66 148L46 224M66 148L96 214'));

const jumping = doc(head(70, 30) + bones(
    'M70 50L70 144M70 76L42 40M70 76L98 40M70 144L44 202M70 144L96 202'));

// ─── Category 2 · Office & Workplace ────────────────────────────────────────

const working = doc(
    head(58, 36, 20) +
    bones('M58 56L58 128M58 128L100 128M100 128L100 186M58 82L90 116') +
    // laptop
    `<path d="M82 120 L118 120 L122 128 L78 128 Z" fill="#cbd5e1" stroke-width="4"/>` +
    `<rect x="88" y="98" width="26" height="22" rx="2" fill="#3b82f6" stroke-width="4"/>`);

const presenting = doc(
    // whiteboard with a rising line
    `<rect x="94" y="30" width="44" height="62" rx="3" fill="#f8fafc" stroke-width="5"/>` +
    `<path d="M100 80 L110 62 L120 70 L132 44" stroke="#ef4444" stroke-width="4"/>` +
    head(42, 40, 20) +
    bones('M42 60L42 150M42 86L26 120M42 84L88 58M42 150L28 224M42 150L58 224'));

const briefcase = doc(
    head() +
    bones('M70 56L70 150M70 84L48 120M70 84L92 138M70 150L54 226M70 150L86 226') +
    `<rect x="80" y="138" width="30" height="22" rx="2" fill="#f59e0b" stroke-width="4"/>` +
    `<path d="M89 138 q6 -8 12 0" stroke-width="3"/>`);

const thumbsUp = doc(
    head() +
    bones('M70 56L70 150M70 84L48 120M70 86L96 96L94 68M70 150L54 226M70 150L86 226') +
    `<circle cx="94" cy="66" r="5" fill="${STROKE}" stroke-width="0"/>`);

// ─── Category 3 · Meetings / Conferences / Workshops ────────────────────────

const speaker = doc(
    head() +
    bones('M70 56L70 168M70 84L50 118M70 84L96 98M70 150L56 214M70 150L84 214') +
    // mic
    `<line x1="96" y1="98" x2="108" y2="80" stroke-width="6"/>` +
    `<circle cx="111" cy="74" r="7" fill="#334155" stroke-width="3"/>` +
    // podium (drawn last so it overlaps the legs)
    `<path d="M50 170 L90 170 L96 244 L44 244 Z" fill="#e2e8f0" stroke-width="5"/>`);

const raisingHand = doc(
    head() +
    bones('M70 56L70 150M70 84L48 120M70 82L88 40M70 150L54 226M70 150L86 226'));

const chart = doc(
    // bar chart board
    `<rect x="88" y="38" width="48" height="60" rx="3" fill="#f8fafc" stroke-width="5"/>` +
    `<rect x="96" y="72" width="9" height="18" fill="#3b82f6" stroke-width="0"/>` +
    `<rect x="109" y="60" width="9" height="30" fill="#22c55e" stroke-width="0"/>` +
    `<rect x="122" y="66" width="9" height="24" fill="#f59e0b" stroke-width="0"/>` +
    head(42, 40, 20) +
    bones('M42 60L42 150M42 86L26 120M42 84L86 58M42 150L28 224M42 150L58 224'));

const clipboard = doc(
    head() +
    bones('M70 56L70 150M70 84L80 112M70 84L80 126M70 150L54 226M70 150L86 226') +
    `<rect x="78" y="94" width="32" height="42" rx="3" fill="#f8fafc" stroke-width="5"/>` +
    `<rect x="88" y="90" width="12" height="7" rx="2" fill="#94a3b8" stroke-width="2"/>` +
    `<path d="M84 108H104M84 118H104M84 128H100" stroke="#cbd5e1" stroke-width="3"/>`);

// ─── Category 4 · Street / Travel / Public ──────────────────────────────────

const running = doc(
    head(78, 34, 20) +
    bones('M78 54L62 144M64 80L94 68M64 82L40 96M62 144L94 186M62 144L36 198'));

const cycling = doc(
    // wheels + frame
    `<circle cx="40" cy="204" r="28" stroke-width="5"/>` +
    `<circle cx="112" cy="204" r="28" stroke-width="5"/>` +
    `<path d="M40 204 L74 204 L96 156 M74 204 L62 158 L96 156 M112 204 L96 156" stroke="#0ea5e9" stroke-width="5"/>` +
    head(66, 66, 18) +
    bones('M66 84L62 150M62 150L74 204M66 100L96 156'));

const traveling = doc(
    head(74, 34) +
    bones('M74 56L66 148M66 82L44 112M66 82L88 116M66 148L46 224M66 148L96 214') +
    // shoulder bag
    `<path d="M84 96 L106 96 L110 142 L88 142 Z" fill="#8b5cf6" stroke-width="4"/>` +
    `<path d="M68 72 L98 96" stroke-width="4"/>`);

const waiting = doc(
    head() +
    bones('M70 56L70 150M70 84L50 120M70 86L86 96L84 74M70 150L54 226M70 150L86 226') +
    `<rect x="76" y="58" width="15" height="24" rx="2" fill="#0ea5e9" stroke-width="3"/>`);

// ─── Category 5 · Gatherings / Social / Family ──────────────────────────────

const celebrating = doc(
    head(70, 30) +
    bones('M70 50L70 150M70 76L44 42M70 76L96 42M70 150L50 226M70 150L90 226') +
    `<circle cx="34" cy="30" r="3" fill="#f59e0b" stroke-width="0"/>` +
    `<circle cx="108" cy="24" r="3" fill="#ef4444" stroke-width="0"/>` +
    `<circle cx="120" cy="52" r="3" fill="#22c55e" stroke-width="0"/>`);

const dancing = doc(
    head(66, 32) +
    bones('M66 54L74 148M72 82L98 46M72 84L44 104M74 148L46 224M74 148L104 202'));

const inLove = doc(
    head() +
    bones('M70 56L70 150M70 84L48 120M70 84L88 108M70 150L54 226M70 150L86 226') +
    `<path d="M100 40 C100 32 112 32 112 42 C112 32 124 32 124 42 C124 54 112 62 112 62 C112 62 100 54 100 40 Z" fill="#ef4444" stroke-width="3"/>`);

const sitting = doc(
    head(70, 40, 20) +
    bones('M70 62L70 128M70 128L112 128M112 128L112 172M70 88L44 112M70 88L96 112M70 128L34 132'));

// ─── Category 6 · Special Situations & Services ─────────────────────────────

const delivery = doc(
    head(60, 34, 20) +
    bones('M60 54L60 150M60 82L82 114M60 88L82 132M60 150L46 226M60 150L74 226') +
    `<rect x="80" y="106" width="46" height="42" rx="2" fill="#f59e0b" stroke-width="5"/>` +
    `<path d="M103 106V148M80 127H126" stroke="#b45309" stroke-width="3"/>`);

const support = doc(
    head() +
    // headset
    `<path d="M50 30 A20 20 0 0 1 90 30" stroke-width="4"/>` +
    `<rect x="46" y="30" width="9" height="14" rx="3" fill="#3b82f6" stroke-width="2"/>` +
    `<path d="M50 42 Q44 56 60 58" stroke-width="3"/>` +
    bones('M70 56L70 150M70 84L48 118M70 84L94 66M70 150L54 226M70 150L86 226'));

const guiding = doc(
    head() +
    bones('M70 56L70 150M70 84L48 120M70 84L120 84M70 150L54 226M70 150L86 226') +
    `<path d="M112 76 L124 84 L112 92" stroke-width="5"/>`);

const doctor = doc(
    head() +
    bones('M70 56L70 150M70 84L48 120M70 84L92 120M70 150L54 226M70 150L86 226') +
    // white coat panel + red cross
    `<path d="M52 60 L88 60 L84 146 L56 146 Z" fill="#f8fafc" stroke-width="4"/>` +
    `<path d="M62 96 H78 M70 88 V104" stroke="#ef4444" stroke-width="6"/>`);

/** The MVP catalog. */
export const STICK_ASSETS: StickAsset[] = [
    // Daily Actions & Emotions
    { id: 'daily-standing', name: 'Standing', category: 'daily', tags: ['idle', 'neutral', 'person', 'stand'], svg: standing, w: W, h: H },
    { id: 'daily-waving', name: 'Waving', category: 'daily', tags: ['hello', 'hi', 'greet', 'wave'], svg: waving, w: W, h: H },
    { id: 'daily-walking', name: 'Walking', category: 'daily', tags: ['walk', 'move', 'stride'], svg: walking, w: W, h: H },
    { id: 'daily-jumping', name: 'Jumping for joy', category: 'daily', tags: ['jump', 'happy', 'excited', 'celebrate'], svg: jumping, w: W, h: H },

    // Office & Workplace
    { id: 'office-working', name: 'Working at laptop', category: 'office', tags: ['laptop', 'desk', 'type', 'work', 'sit', 'computer'], svg: working, w: W, h: H },
    { id: 'office-presenting', name: 'Presenting', category: 'office', tags: ['present', 'whiteboard', 'chart', 'point', 'pitch'], svg: presenting, w: W, h: H },
    { id: 'office-briefcase', name: 'Carrying briefcase', category: 'office', tags: ['briefcase', 'business', 'commute', 'bag'], svg: briefcase, w: W, h: H },
    { id: 'office-thumbsup', name: 'Thumbs up', category: 'office', tags: ['thumbs', 'approve', 'ok', 'like', 'yes'], svg: thumbsUp, w: W, h: H },

    // Meetings / Conferences / Workshops
    { id: 'meeting-speaker', name: 'Speaker at podium', category: 'meetings', tags: ['speaker', 'podium', 'mic', 'talk', 'conference', 'keynote'], svg: speaker, w: W, h: H },
    { id: 'meeting-raise-hand', name: 'Raising hand', category: 'meetings', tags: ['hand', 'question', 'ask', 'volunteer', 'raise'], svg: raisingHand, w: W, h: H },
    { id: 'meeting-chart', name: 'Pointing at chart', category: 'meetings', tags: ['chart', 'bars', 'data', 'point', 'analytics', 'report'], svg: chart, w: W, h: H },
    { id: 'meeting-clipboard', name: 'Holding clipboard', category: 'meetings', tags: ['clipboard', 'notes', 'survey', 'checklist'], svg: clipboard, w: W, h: H },

    // Street / Travel / Public
    { id: 'travel-running', name: 'Running', category: 'travel', tags: ['run', 'jog', 'exercise', 'fast', 'hurry'], svg: running, w: W, h: H },
    { id: 'travel-cycling', name: 'Cycling', category: 'travel', tags: ['bike', 'bicycle', 'cycle', 'commute', 'ride'], svg: cycling, w: W, h: H },
    { id: 'travel-bag', name: 'Walking with bag', category: 'travel', tags: ['bag', 'shopping', 'travel', 'walk', 'commute'], svg: traveling, w: W, h: H },
    { id: 'travel-phone', name: 'Waiting on phone', category: 'travel', tags: ['phone', 'wait', 'text', 'mobile', 'scroll'], svg: waiting, w: W, h: H },

    // Gatherings / Social / Family
    { id: 'social-celebrating', name: 'Celebrating', category: 'social', tags: ['celebrate', 'cheer', 'party', 'confetti', 'win'], svg: celebrating, w: W, h: H },
    { id: 'social-dancing', name: 'Dancing', category: 'social', tags: ['dance', 'party', 'music', 'fun'], svg: dancing, w: W, h: H },
    { id: 'social-love', name: 'In love', category: 'social', tags: ['love', 'heart', 'like', 'romance', 'valentine'], svg: inLove, w: W, h: H },
    { id: 'social-sitting', name: 'Sitting relaxed', category: 'social', tags: ['sit', 'relax', 'rest', 'ground', 'chill'], svg: sitting, w: W, h: H },

    // Special Situations & Services
    { id: 'service-delivery', name: 'Delivery', category: 'services', tags: ['delivery', 'box', 'parcel', 'courier', 'shipping', 'carry'], svg: delivery, w: W, h: H },
    { id: 'service-support', name: 'Customer support', category: 'services', tags: ['support', 'headset', 'call', 'help', 'agent', 'service'], svg: support, w: W, h: H },
    { id: 'service-guiding', name: 'Guiding the way', category: 'services', tags: ['guide', 'point', 'direction', 'usher', 'show', 'this way'], svg: guiding, w: W, h: H },
    { id: 'service-doctor', name: 'Doctor', category: 'services', tags: ['doctor', 'medical', 'health', 'nurse', 'cross', 'care'], svg: doctor, w: W, h: H },
];
