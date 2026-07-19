import { batch } from 'solid-js';
import type { DrawingElement } from '../../types';
import { store, setStore, pushToHistory, bumpDirtyRevision } from '../../store/app-store';
import { generateId } from '../../utils/id-generator';
import { svgToElements } from '../../utils/svg-import';
import { getStickAsset } from '../stick-figures/registry';
import { STICK_STROKE_PX, STICK_DEFAULT_WIDTH, roleFromFill } from '../stick-figures';
import { stickColorMode } from '../stick-figures/prefs';
import { getMeasurementRenderer, measureContainerText } from '../../utils/text-utils';
import { poseForLine, poseForEmotion } from './pose-rules';
import {
    parseScript, castSpeakers, inferPairs, orderCharacters, layoutPanel, splitIntoPanels,
    type Utterance, type PanelLayout,
} from './panel-layout';

/**
 * Comic panel generator — turns a short screenplay into a laid-out panel.
 *
 * The interesting part (pose selection, character ordering, balloon layout) lives in
 * `pose-rules.ts` and `panel-layout.ts` as pure functions; this file only turns that
 * layout into elements. See docs/microsoft-comic-chat-algorithm.md for the origin of
 * the algorithms.
 */

export interface ComicPanelOptions {
    /** Top-left of the panel. Defaults to the centre of the current viewport. */
    x?: number;
    y?: number;
    /**
     * How tall each figure should be, in px. Height (not width) is the useful knob:
     * stick-figure art is scaled to its CONTENT bounds, so the same target width gives
     * very different heights per pose. Default 210.
     */
    figureHeight?: number;
    /** Draw a panel border. Default true. */
    frame?: boolean;
    /** Outline-only figures (no accent fills). */
    monochrome?: boolean;
    /** Font size for balloon text. Default 16. */
    fontSize?: number;
    /**
     * Figure variant per speaker, e.g. `{ Alice: 'female', Sam: 'boy' }`. Speakers not
     * listed use the base figure. Assigning a variant automatically (say, by turn order)
     * would guess at people from their position in the script, so callers opt in.
     */
    variants?: Record<string, 'male' | 'female' | 'boy' | 'girl'>;
    /**
     * Emotion override per speaker, e.g. `{ Bob: 'angry' }` — see EMOTIONS in
     * pose-rules.ts. Overrides what the text rules would have chosen, which is the
     * point of Comic Chat's emotion wheel: the user knows the mood, the parser guesses.
     * Omit (or use 'auto') to keep the inferred pose.
     */
    emotions?: Record<string, string>;
}

export interface ComicStripOptions extends ComicPanelOptions {
    /** Panels per row before wrapping. Default min(panels, 3). */
    columns?: number;
    /** Gap between panels, px. Default 32. */
    panelGap?: number;
}

/** Default figure height — comfortable next to balloons at the default font size. */
const DEFAULT_FIGURE_HEIGHT = 210;


/**
 * Build (but do not commit) the elements for one stick figure at a box, mirrored when
 * `flip` is set. This mirrors `insertStickFigure` (library/stick-figures/index.ts:81)
 * minus its per-figure `pushToHistory` — a generator must be ONE undo step, so the
 * caller commits every element of the panel in a single batch.
 */
function buildFigureElements(
    assetId: string,
    box: { x: number; y: number; width: number },
    flip: boolean,
    monochrome: boolean,
    groupId: string,
): DrawingElement[] {
    const asset = getStickAsset(assetId);
    if (!asset) return [];

    const els = svgToElements(asset.svg, { x: box.x, y: box.y, targetWidth: box.width });
    if (els.length === 0) return [];

    const maxSW = Math.max(...els.map(e => e.strokeWidth || 0));
    const f = maxSW > 0 ? STICK_STROKE_PX / maxSW : 1;
    const mono = monochrome ?? (stickColorMode() === 'mono');

    // Mirror about the figure's own centre so it turns in place. flipX is honoured
    // generically by the render pipeline (shapes/base/render-pipeline.ts:188).
    const centre = box.x + box.width / 2;

    // svgToElements defaults imported paths to the clean 'architectural' style. Force the
    // document's current style so a panel doesn't mix rough balloons with clean figures.
    const renderStyle = store.defaultElementStyles.renderStyle ?? 'sketch';

    for (const e of els) {
        if (e.strokeWidth) e.strokeWidth = Math.max(0.4, Math.round(e.strokeWidth * f * 100) / 100);
        if (!e.sfRole) e.sfRole = roleFromFill(e.backgroundColor);
        if (mono && e.sfRole === 'accent') e.backgroundColor = 'transparent';
        e.renderStyle = renderStyle;
        if (flip) {
            // Mirror the part itself, then reflect its position across the figure's
            // centre so the assembled figure turns in place.
            e.flipX = !e.flipX;
            const partCentre = e.x + e.width / 2;
            e.x = centre - (partCentre - centre) - e.width / 2;
        }
        e.groupIds = [...(e.groupIds || []), groupId];
    }

    return els;
}

/** Measure the balloon a line of dialogue needs. */
function measureBubble(text: string, fontSize: number): { width: number; height: number } {
    const ctx = getMeasurementRenderer();
    // Aim for a readable line length, then let the measurer wrap and tell us the height.
    const targetTextWidth = Math.min(260, Math.max(120, text.length * fontSize * 0.34));
    const probe: Partial<DrawingElement> = { type: 'speechBubble', fontSize, width: targetTextWidth };
    const m = measureContainerText(ctx, probe, text, targetTextWidth);
    const width = Math.max(120, Math.min(300, m.textWidth + 40));
    // The speechBubble shape spends the bottom 20% on its tail, so pad the box height
    // enough that the text still sits inside the body.
    const height = Math.max(70, (m.textHeight + 34) / 0.8);
    return { width: Math.round(width), height: Math.round(height) };
}

/** Measured height of a built figure set. */
const heightOf = (els: DrawingElement[]): number =>
    els.length ? Math.max(...els.map(e => e.y + e.height)) - Math.min(...els.map(e => e.y)) : 0;

/**
 * Compute the full layout for a script without committing anything to the store.
 *
 * Figures are BUILT here (as detached elements) rather than assumed, because a stick
 * figure is scaled to a target width and its height then depends on the pose's own
 * content bounds — a waving figure and a sitting one are not the same height. Building
 * first lets the layout use real measurements.
 */
export function planComicPanel(
    script: string | Utterance[],
    opts: ComicPanelOptions = {},
): {
    layout: PanelLayout;
    utterances: Utterance[];
    poses: Record<string, string>;
    figures: Record<string, DrawingElement[]>;
    figureWidths: Record<string, number>;
} | null {
    const utterances = parseScript(script);
    if (utterances.length === 0) return null;

    const speakers = castSpeakers(utterances);
    // One pose per speaker per panel — matching Comic Chat's one-balloon-per-character
    // rule. We pose from a speaker's FIRST line, which sets their attitude for the panel.
    const poses: Record<string, string> = {};
    speakers.forEach(s => {
        const first = utterances.find(u => u.speaker === s)!;
        const variant = opts.variants?.[s];
        // Male keeps the base asset id; other variants suffix it (assets.ts:29).
        const suffix = variant && variant !== 'male' ? `-${variant}` : '';
        // An explicit emotion wins over whatever the text rules inferred.
        const base = poseForEmotion(opts.emotions?.[s]) ?? poseForLine(first.text);
        poses[s] = base + suffix;
    });

    const order = orderCharacters(speakers, inferPairs(utterances, speakers));
    const targetHeight = opts.figureHeight ?? DEFAULT_FIGURE_HEIGHT;
    const fontSize = opts.fontSize ?? 16;

    // Figures are scaled to fit a target WIDTH, but their height then depends on the
    // pose's content bounds. So build once at a reference width, measure, and derive the
    // width that actually yields `targetHeight` — otherwise a waving figure and a sitting
    // one come out wildly different sizes.
    const figures: Record<string, DrawingElement[]> = {};
    const figureHeights: Record<string, number> = {};
    const figureWidths: Record<string, number> = {};
    for (const s of speakers) {
        const probe = buildFigureElements(
            poses[s], { x: 0, y: 0, width: STICK_DEFAULT_WIDTH }, false, opts.monochrome ?? false, 'probe',
        );
        const probeH = heightOf(probe) || STICK_DEFAULT_WIDTH * 2;
        const width = Math.max(24, Math.round(STICK_DEFAULT_WIDTH * (targetHeight / probeH)));
        const built = buildFigureElements(
            poses[s], { x: 0, y: 0, width }, false, opts.monochrome ?? false, 'probe',
        );
        figures[s] = built;
        figureWidths[s] = width;
        figureHeights[s] = heightOf(built) || targetHeight;
    }
    // Lay out on the widest figure so spacing is even regardless of pose.
    const figureWidth = Math.max(...speakers.map(s => figureWidths[s]), 24);

    // Only the utterances whose speaker made it into the cast get a balloon.
    const shown = utterances.filter(u => speakers.includes(u.speaker));

    const layout = layoutPanel({
        utterances: shown,
        order,
        poses,
        bubbleSizes: shown.map(u => measureBubble(u.text, fontSize)),
        figureWidth,
        figureHeights,
        originX: opts.x ?? 0,
        originY: opts.y ?? 0,
    });

    return { layout, utterances: shown, poses, figures, figureWidths };
}

/**
 * Generate a comic panel from a screenplay-style script and add it to the canvas.
 *
 *   createComicPanel("Alice: Hi Bob!\nBob: I think we should ship it.")
 *
 * Returns the group id of the panel (every element shares it, so the panel moves as
 * one), or null when the script contains no usable dialogue.
 */
export function createComicPanel(
    script: string | Utterance[],
    opts: ComicPanelOptions = {},
): string | null {
    // Default to the active page, like the other insert helpers
    // (library/stick-figures/index.ts:200). Measure the panel first so it can be centred.
    let originX = opts.x, originY = opts.y;
    if (originX === undefined || originY === undefined) {
        const probe = planComicPanel(script, { ...opts, x: 0, y: 0 });
        const page = store.slides[store.activeSlideIndex];
        if (probe && page) {
            const { frame } = probe.layout;
            originX = originX ?? Math.round(page.spatialPosition.x + (page.dimensions.width - frame.width) / 2);
            originY = originY ?? Math.round(page.spatialPosition.y + (page.dimensions.height - frame.height) / 2);
        }
        originX = originX ?? 200;
        originY = originY ?? 200;
    }

    const planned = planComicPanel(script, { ...opts, x: originX, y: originY });
    if (!planned) return null;

    // generateId derives the next number by scanning the STORE, so ids generated before
    // the batch is committed would all collide. Thread a batch set through every call.
    const batchIds = new Set<string>();
    const newId = (type: string) => { const id = generateId(type, batchIds); batchIds.add(id); return id; };

    const { elements, groupId: panelGroupId } = buildPanelElements(planned, opts, newId);

    if (elements.length === 0) return null;

    // One history entry for the whole panel.
    pushToHistory();
    batch(() => {
        setStore('elements', prev => [...prev, ...elements]);
        setStore('selection', elements.map(e => e.id));
    });
    bumpDirtyRevision();

    return panelGroupId;
}

type IdFactory = (type: string) => string;

/**
 * Build (but do not commit) every element of one planned panel. Shared by the single
 * panel and the strip generators, so a whole strip is still ONE undo step.
 */
function buildPanelElements(
    planned: NonNullable<ReturnType<typeof planComicPanel>>,
    opts: ComicPanelOptions,
    newId: IdFactory,
): { elements: DrawingElement[]; groupId: string } {
    const { layout } = planned;
    const panelGroupId = newId('group');
    const fontSize = opts.fontSize ?? 16;
    const elements: DrawingElement[] = [];

    // Panel border first so it sits behind everything.
    if (opts.frame !== false) {
        elements.push({
            ...store.defaultElementStyles,
            id: newId('rectangle'),
            type: 'rectangle',
            x: layout.frame.x,
            y: layout.frame.y,
            width: layout.frame.width,
            height: layout.frame.height,
            backgroundColor: 'transparent',
            fillStyle: 'solid',
            strokeStyle: 'solid',
            seed: 1,
            layerId: store.activeLayerId,
            groupIds: [panelGroupId],
        } as DrawingElement);
    }

    // Figures, rebuilt at their final boxes (the planning pass built them at the origin
    // only to measure their true height).
    for (const c of layout.characters) {
        const figureGroupId = newId('group');
        // Each pose needs its own width to reach the shared target height; centre the
        // figure inside its (uniform) slot so spacing stays even.
        const w = planned.figureWidths[c.speaker] ?? c.box.width;
        const slotX = c.box.x + (c.box.width - w) / 2;
        const parts = buildFigureElements(
            c.pose, { x: slotX, y: c.box.y, width: w }, c.flip, opts.monochrome ?? false, figureGroupId,
        );
        for (const p of parts) {
            p.id = newId(p.type);
            // Nest the figure's own group inside the panel group so ungrouping the panel
            // still leaves each figure as a unit.
            p.groupIds = [figureGroupId, panelGroupId];
        }
        elements.push(...parts);
    }

    // Balloons — the comic vocabulary (Comic Chat §5.1): a solid speech balloon with a
    // tail, a thought cloud, or a whispered aside drawn with a dashed outline.
    for (const b of layout.bubbles) {
        const isThought = b.kind === 'thought';
        elements.push({
            ...store.defaultElementStyles,
            id: newId(isThought ? 'thoughtBubble' : 'speechBubble'),
            type: isThought ? 'thoughtBubble' : 'speechBubble',
            x: b.x,
            y: b.y,
            width: b.width,
            height: b.height,
            backgroundColor: '#ffffff',
            fillStyle: 'solid',
            strokeStyle: b.kind === 'whisper' ? 'dashed' : 'solid',
            containerText: b.text,
            fontSize,
            fontStyle: b.kind === 'whisper' ? 'italic' : undefined,
            textAlign: 'center',
            verticalAlign: 'middle',
            // The thought cloud has no tail, so the tail position is meaningless for it.
            ...(isThought ? {} : { tailPosition: Math.round(b.tailPosition) }),
            seed: 1,
            layerId: store.activeLayerId,
            groupIds: [panelGroupId],
        } as DrawingElement);
    }

    return { elements, groupId: panelGroupId };
}

/**
 * Generate a multi-panel comic strip from a longer script.
 *
 *   createComicStrip("Alice: Hi Bob!\nBob: Hey!\nAlice: Ship it?\nBob: YES")
 *
 * The script is split into panels using Comic Chat's §6.1 rules — chiefly "one
 * balloon per character per panel", so a speaker taking another turn starts the next
 * panel. Panels are laid out left-to-right and wrap into rows like a comic page.
 * Everything is committed in one batch, so the strip is a single undo step, and each
 * panel keeps its own group inside the strip group.
 *
 * Returns the strip's group id, or null when the script has no usable dialogue.
 */
export function createComicStrip(
    script: string | Utterance[],
    opts: ComicStripOptions = {},
): string | null {
    const utterances = parseScript(script);
    if (utterances.length === 0) return null;

    const panels = splitIntoPanels(utterances);
    if (panels.length === 0) return null;

    const gap = opts.panelGap ?? 32;
    const columns = Math.max(1, opts.columns ?? Math.min(panels.length, 3));

    // Plan every panel at the origin first so we know how big each one is before
    // deciding where it goes.
    const plans = panels.map(p => planComicPanel(p, { ...opts, x: 0, y: 0 })).filter(Boolean);
    if (plans.length === 0) return null;

    // Uniform cells keep the strip on a tidy grid regardless of per-panel size.
    const cellW = Math.max(...plans.map(p => p!.layout.frame.width));
    const cellH = Math.max(...plans.map(p => p!.layout.frame.height));
    const rows = Math.ceil(plans.length / columns);
    const stripW = columns * cellW + (columns - 1) * gap;
    const stripH = rows * cellH + (rows - 1) * gap;

    let originX = opts.x, originY = opts.y;
    if (originX === undefined || originY === undefined) {
        const page = store.slides[store.activeSlideIndex];
        if (page) {
            originX = originX ?? Math.round(page.spatialPosition.x + (page.dimensions.width - stripW) / 2);
            originY = originY ?? Math.round(page.spatialPosition.y + (page.dimensions.height - stripH) / 2);
        }
        originX = originX ?? 200;
        originY = originY ?? 200;
    }

    const batchIds = new Set<string>();
    const newId = (type: string) => { const id = generateId(type, batchIds); batchIds.add(id); return id; };
    const stripGroupId = newId('group');
    const elements: DrawingElement[] = [];

    panels.forEach((panel, i) => {
        const col = i % columns, row = Math.floor(i / columns);
        // planComicPanel places the frame at origin - padding, so offset by that same
        // delta to make the frames (not the content) land on the grid.
        const probe = plans[i];
        if (!probe) return;
        const padX = probe.layout.frame.x, padY = probe.layout.frame.y;
        const x = originX! + col * (cellW + gap) - padX;
        const y = originY! + row * (cellH + gap) - padY;

        const planned = planComicPanel(panel, { ...opts, x, y });
        if (!planned) return;
        const { elements: els } = buildPanelElements(planned, opts, newId);
        // Nest each panel's group inside the strip group.
        for (const e of els) e.groupIds = [...(e.groupIds || []), stripGroupId];
        elements.push(...els);
    });

    if (elements.length === 0) return null;

    pushToHistory();
    batch(() => {
        setStore('elements', prev => [...prev, ...elements]);
        setStore('selection', elements.map(e => e.id));
    });
    bumpDirtyRevision();

    return stripGroupId;
}
