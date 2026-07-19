/**
 * Comic panel layout — pure geometry, no store access.
 *
 * Ports two algorithms from Microsoft Comic Chat (SIGGRAPH '96, see
 * docs/microsoft-comic-chat-algorithm.md):
 *
 * - §4.3 character placement: order characters left→right by minimising a weighted
 *   penalty function (conversational pairs should face each other and stand near
 *   each other). The magnitudes ARE the editorial policy: 40 ≫ 4 ≫ 1.
 * - §5.2 balloon layout: balloons sit above the characters, are read top-down then
 *   left-to-right, and each must float over its speaker so its tail can reach.
 *
 * Everything here is deterministic (no Date.now/Math.random, total-ordered sorts),
 * so the same script always produces the same panel.
 */

/**
 * One line of dialogue. `kind` selects the balloon from the comic vocabulary
 * (Comic Chat §5.1): normal speech, a thought cloud, or a whispered aside.
 * The paper's fourth type — the jagged shout balloon — was unimplemented there too;
 * ALL CAPS already poses the speaker with a megaphone, which reads clearly enough.
 */
export type BalloonKind = 'speech' | 'thought' | 'whisper';

export interface Utterance { speaker: string; text: string; kind?: BalloonKind; }

export interface Box { x: number; y: number; width: number; height: number; }

export interface CharacterPlacement {
    speaker: string;
    /** Stick-figure asset id. */
    pose: string;
    box: Box;
    /** true → figure is mirrored so it looks left (figures are drawn facing right). */
    flip: boolean;
}

export interface BubblePlacement extends Box {
    speaker: string;
    text: string;
    kind: BalloonKind;
    /** Percent along the bubble's bottom edge where the tail tip sits (10-90). */
    tailPosition: number;
}

export interface PanelLayout {
    characters: CharacterPlacement[];
    bubbles: BubblePlacement[];
    /** Bounding box of the whole panel (figures + balloons + padding). */
    frame: Box;
}

/** Max characters in one panel. Comic Chat used five; beyond that faces stop reading. */
export const MAX_CHARACTERS = 4;

const GAP_BETWEEN_FIGURES = 40;
const BALLOON_GAP = 12;          // vertical gap between stacked balloons
const BALLOON_TO_HEAD = 24;      // gap between the lowest balloon and the tallest head
const PANEL_PADDING = 28;
/** Bubble tail must stay inside this band of the bubble width (matches the shape geometry). */
const TAIL_MIN = 10, TAIL_MAX = 90;

// ─── Script parsing ──────────────────────────────────────────────────────

/**
 * Parse a screenplay-style script into utterances.
 *
 *   Alice: Hi Bob!
 *   Bob: I think we should ship it.
 *
 * Only the FIRST colon separates speaker from dialogue, so colons inside the line
 * survive ("Bob: the rule is: always test"). Rows without a colon, and rows whose
 * speaker name is empty or implausibly long (likely prose, not a cue), are skipped.
 * An already-structured array is passed through untouched.
 */
export function parseScript(input: string | Utterance[]): Utterance[] {
    if (Array.isArray(input)) {
        return input
            .filter(u => u && typeof u.speaker === 'string' && typeof u.text === 'string')
            .map(u => ({ speaker: u.speaker.trim(), text: u.text.trim(), ...(u.kind ? { kind: u.kind } : {}) }))
            .filter(u => u.speaker && u.text);
    }
    const out: Utterance[] = [];
    for (const raw of String(input).split(/\r?\n/)) {
        const line = raw.trim();
        if (!line) continue;
        const i = line.indexOf(':');
        if (i <= 0) continue;
        let speaker = line.slice(0, i).trim();
        const text = line.slice(i + 1).trim();

        // "Ann (thinks): ..." / "Ann (whispers): ..." selects the balloon type.
        let kind: BalloonKind = 'speech';
        const paren = speaker.match(/^(.*?)\s*\((.+)\)$/);
        if (paren) {
            const mode = paren[2].trim().toLowerCase();
            if (/^think(s|ing)?$|^thought$/.test(mode)) { kind = 'thought'; speaker = paren[1].trim(); }
            else if (/^whisper(s|ing)?$/.test(mode)) { kind = 'whisper'; speaker = paren[1].trim(); }
        }
        // A "speaker" with spaces-and-then-some is almost certainly prose with a colon.
        if (!speaker || !text || speaker.length > 24) continue;
        out.push(kind === 'speech' ? { speaker, text } : { speaker, text, kind });
    }
    return out;
}

/**
 * Split a script into panels (Comic Chat §6.1 panel breaks).
 *
 * The rule that does most of the work is "at most one balloon per character per
 * panel" — a speaker taking a second turn is exactly what starts a new panel, which
 * is why an alternating dialogue naturally becomes a strip of two-person panels.
 * We also break before a panel would hold more than `maxCharacters` speakers.
 *
 * The paper additionally breaks on a 15% random chance for pacing variety; we omit
 * that deliberately — a drawing tool should regenerate the same strip from the same
 * script, and every other layout function here is deterministic.
 */
export function splitIntoPanels(
    utterances: Utterance[],
    maxCharacters: number = MAX_CHARACTERS,
): Utterance[][] {
    const panels: Utterance[][] = [];
    let current: Utterance[] = [];
    let speakersHere: string[] = [];

    for (const u of utterances) {
        const alreadySpoke = speakersHere.includes(u.speaker);
        const wouldExceedCast = !alreadySpoke && speakersHere.length >= maxCharacters;
        if (current.length > 0 && (alreadySpoke || wouldExceedCast)) {
            panels.push(current);
            current = [];
            speakersHere = [];
        }
        current.push(u);
        if (!speakersHere.includes(u.speaker)) speakersHere.push(u.speaker);
    }
    if (current.length) panels.push(current);
    return panels;
}

/** Distinct speakers in first-appearance order, capped at MAX_CHARACTERS. */
export function castSpeakers(utterances: Utterance[]): string[] {
    const seen: string[] = [];
    for (const u of utterances) {
        if (!seen.includes(u.speaker)) seen.push(u.speaker);
        if (seen.length >= MAX_CHARACTERS) break;
    }
    return seen;
}

// ─── Character ordering (Comic Chat §4.3) ────────────────────────────────

/**
 * Who talks to whom. Without addressee markup we use the paper's fallback: an
 * utterance is aimed at the previous speaker (conversation is mostly turn-taking),
 * and we also honour a name mentioned in the line, which is how Comic Chat inferred
 * addressees from chat text.
 */
export function inferPairs(utterances: Utterance[], speakers: string[]): Array<[string, string]> {
    const pairs: Array<[string, string]> = [];
    let previous: string | null = null;
    for (const u of utterances) {
        const lower = u.text.toLowerCase();
        const named = speakers.find(s => s !== u.speaker && lower.includes(s.toLowerCase()));
        const addressee = named ?? (previous && previous !== u.speaker ? previous : null);
        if (addressee) pairs.push([u.speaker, addressee]);
        previous = u.speaker;
    }
    return pairs;
}

/**
 * Cost of one left→right ordering. Lower is better. Mirrors the paper's weights:
 * a speaker not facing the person they addressed is catastrophic (40); the reverse
 * is mild (4); distance between a conversational pair costs 4 per character between.
 * Characters face inward toward the panel centre, so "facing" is decided by which
 * side of the speaker the addressee sits on.
 */
export function orderingCost(order: string[], pairs: Array<[string, string]>): number {
    const index = new Map(order.map((s, i) => [s, i]));
    let cost = 0;
    for (const [from, to] of pairs) {
        const a = index.get(from), b = index.get(to);
        if (a === undefined || b === undefined) continue;
        const between = Math.abs(a - b) - 1;
        if (between > 0) cost += 4 * between;
        // Facing: a character looks toward the panel centre. It faces its addressee
        // when the addressee lies on that same side.
        const mid = (order.length - 1) / 2;
        const aLooksRight = a < mid;
        const addresseeIsRight = b > a;
        if (aLooksRight !== addresseeIsRight) cost += 40;   // speaker turned away
        const bLooksRight = b < mid;
        const speakerIsRight = a > b;
        if (bLooksRight !== speakerIsRight) cost += 4;      // addressee turned away
    }
    return cost;
}

const permutations = <T,>(items: T[]): T[][] => {
    if (items.length <= 1) return [items];
    const out: T[][] = [];
    for (let i = 0; i < items.length; i++) {
        const rest = [...items.slice(0, i), ...items.slice(i + 1)];
        for (const p of permutations(rest)) out.push([items[i], ...p]);
    }
    return out;
};

/**
 * Best left→right ordering. With at most MAX_CHARACTERS speakers there are ≤24
 * permutations, so we search exhaustively — optimal, and still far cheaper than the
 * greedy incremental placement the paper needed in 1996. Ties break on the original
 * (first-appearance) order so the result is stable.
 */
export function orderCharacters(speakers: string[], pairs: Array<[string, string]>): string[] {
    if (speakers.length <= 1) return [...speakers];
    let best = speakers, bestCost = Infinity;
    for (const candidate of permutations(speakers)) {
        const cost = orderingCost(candidate, pairs);
        if (cost < bestCost) { best = candidate; bestCost = cost; }
    }
    return best;
}

// ─── Panel layout ────────────────────────────────────────────────────────

export interface LayoutInput {
    utterances: Utterance[];
    /** Left→right speaker order. */
    order: string[];
    /** speaker → stick-figure asset id. */
    poses: Record<string, string>;
    /** Measured bubble sizes, parallel to `utterances`. */
    bubbleSizes: Array<{ width: number; height: number }>;
    figureWidth: number;
    /**
     * Real rendered height per speaker. Stick-figure art is scaled to fit a target
     * WIDTH and its height depends on the pose's content bounds (a waving figure is
     * not the same height as a sitting one), so callers measure the built figure
     * rather than assuming a fixed aspect ratio.
     */
    figureHeights: Record<string, number>;
    originX: number;
    originY: number;
}

/**
 * Place figures on a baseline and stack the balloons above them.
 *
 * Balloon rules (§5.2): read top-down then left-to-right; a balloon must span its
 * speaker's centre so the (downward) tail can point at them; balloons never overlap.
 * We place utterances in script order, each as high as the already-placed balloons
 * allow, which yields the correct reading order by construction.
 */
export function layoutPanel(input: LayoutInput): PanelLayout {
    const { utterances, order, poses, bubbleSizes, figureWidth, figureHeights, originX, originY } = input;

    // Each character gets a slot at least as wide as their widest balloon, so balloons
    // for different speakers sit SIDE BY SIDE instead of colliding and stacking into a
    // tall narrow column. Figures are centred in their slot.
    const widestBubble = new Map<string, number>();
    utterances.forEach((u, i) => {
        const w = bubbleSizes[i]?.width ?? 0;
        widestBubble.set(u.speaker, Math.max(widestBubble.get(u.speaker) ?? 0, w));
    });

    const centreX = new Map<string, number>();
    let cursor = originX;
    const characters: CharacterPlacement[] = order.map((speaker, i) => {
        const slotWidth = Math.max(figureWidth, widestBubble.get(speaker) ?? figureWidth);
        const x = cursor + (slotWidth - figureWidth) / 2;
        centreX.set(speaker, cursor + slotWidth / 2);
        cursor += slotWidth + GAP_BETWEEN_FIGURES;
        const mid = (order.length - 1) / 2;
        return {
            speaker,
            pose: poses[speaker],
            box: { x, y: 0, width: figureWidth, height: figureHeights[speaker] ?? figureWidth * 2 },
            // Figures are drawn facing right; mirror the ones on the right half so
            // conversational partners turn toward each other.
            flip: order.length > 1 && i > mid,
        };
    });

    const panelWidth = Math.max(0, cursor - GAP_BETWEEN_FIGURES - originX);
    const minX = originX;
    const maxX = originX + panelWidth;

    // Stack balloons upward. `placed` accumulates so each new balloon can respect
    // reading order and avoid overlapping.
    const placed: BubblePlacement[] = [];
    for (let i = 0; i < utterances.length; i++) {
        const u = utterances[i];
        const size = bubbleSizes[i] ?? { width: 160, height: 80 };
        const speakerCx = centreX.get(u.speaker) ?? (minX + panelWidth / 2);

        // Horizontal: centre over the speaker, then clamp into the panel so the tail
        // stays within the bubble's usable band.
        let bx = speakerCx - size.width / 2;
        bx = Math.max(minX - size.width * 0.25, Math.min(bx, maxX - size.width * 0.75));
        // Guarantee the speaker's centre falls inside the tail band.
        const minBx = speakerCx - (TAIL_MAX / 100) * size.width;
        const maxBx = speakerCx - (TAIL_MIN / 100) * size.width;
        bx = Math.max(minBx, Math.min(bx, maxBx));

        // Vertical placement enforces comic reading order (§5.2): balloons read
        // top-down, and left-to-right among balloons at the same height. So relative to
        // every EARLIER balloon this one must be:
        //   - to its right  → no higher than that balloon's TOP  (same row is fine)
        //   - to its left   → no higher than its BOTTOM (else it would be read first)
        //   - overlapping   → strictly below it
        // Placed as high as those constraints allow.
        let by = 0;
        for (const p of placed) {
            const toTheRight = bx >= p.x + p.width;
            const toTheLeft = bx + size.width <= p.x;
            if (toTheRight) by = Math.max(by, p.y);
            else if (toTheLeft) by = Math.max(by, p.y + p.height + BALLOON_GAP);
            else by = Math.max(by, p.y + p.height + BALLOON_GAP);
        }

        const tail = ((speakerCx - bx) / size.width) * 100;
        placed.push({
            speaker: u.speaker,
            text: u.text,
            kind: u.kind ?? 'speech',
            x: bx,
            y: by,
            width: size.width,
            height: size.height,
            tailPosition: Math.max(TAIL_MIN, Math.min(TAIL_MAX, tail)),
        });
    }

    // The balloon block was laid out from y=0 downward; drop the figures below it so
    // every balloon clears the tallest head, and start the whole panel at originY.
    const blockBottom = placed.length ? Math.max(...placed.map(b => b.y + b.height)) : 0;
    const tallest = characters.length ? Math.max(...characters.map(c => c.box.height)) : 0;
    const figureTop = originY + blockBottom + BALLOON_TO_HEAD;
    // Stand everyone on a shared ground line so figures of different heights line up
    // at the feet rather than at the top of their bounding boxes.
    const groundY = figureTop + tallest;

    for (const c of characters) c.box.y = groundY - c.box.height;
    const bubbles = placed.map(b => ({ ...b, y: b.y + originY }));

    // Frame around it all.
    let fx1 = minX, fx2 = maxX, fy1 = figureTop, fy2 = groundY;
    for (const b of bubbles) {
        fx1 = Math.min(fx1, b.x); fx2 = Math.max(fx2, b.x + b.width);
        fy1 = Math.min(fy1, b.y); fy2 = Math.max(fy2, b.y + b.height);
    }
    const frame: Box = {
        x: fx1 - PANEL_PADDING,
        y: fy1 - PANEL_PADDING,
        width: (fx2 - fx1) + PANEL_PADDING * 2,
        height: (fy2 - fy1) + PANEL_PADDING * 2,
    };

    return { characters, bubbles, frame };
}
