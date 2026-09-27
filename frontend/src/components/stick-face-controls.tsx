/**
 * Face & hair picker for stick figures — shared by the Stick Figures panel and
 * the Properties panel so both stay in sync by construction.
 *
 * It edits three things at once, which is what makes it feel direct:
 *   • the drop-time preference (what the NEXT figure you add will wear)
 *   • any dropped figures in the selection — their face/hair parts are removed
 *     and regenerated from the head's current bounding box
 *   • any animated (`stickRig`) figures in the selection — a payload patch; the
 *     renderer draws the new face on the next frame
 *
 * Style buttons preview the real geometry: each thumbnail is the same
 * `faceHairSvg` the canvas uses, drawn on a bare head.
 */
import { type Component, For, Show, createMemo, createSignal } from 'solid-js';
import { store } from '../store/app-store';
import { t } from '../i18n';
import {
    FACE_STYLES, HAIR_STYLES, faceHairSvg, DEFAULT_HAIR_COLOR,
    EYE_STYLES, BROW_STYLES, MOUTH_STYLES, ACCENT_STYLES, type FaceOpts, type FaceParts,
    TROUSER_STYLES, SHOE_STYLES, TOP_STYLES, NECK_STYLES, garmentGeometry, primToSvg,
    DEFAULT_TROUSER_COLOR, DEFAULT_SHOE_COLOR, DEFAULT_TOP_COLOR,
    type TrouserStyle, type ShoeStyle, type TopStyle, type NeckStyle,
    stickFacePref, setStickFacePref,
    restyleStickFace, stickFaceStateOf, selectionHasStickFigure,
    setAnimatedFigureFace, animatedFigureFaceState, selectionHasAnimatedFigure,
    addFigureFaceKey, setFigureBlink, setFigureTalk, type TalkMode,
    type FaceHairChoice, type FaceStyle, type HairStyle,
} from '../library/stick-figures';
import './stick-face-controls.css';

/** Hair colours that read well against the default dark outline. */
const HAIR_SWATCHES = ['#8b5e3c', '#2b2118', '#e0b040', '#c2410c', '#9ca3af', '#7c3aed'];
/** Trouser colours — denim, charcoal, khaki, olive, rust, plum. */
const TROUSER_SWATCHES = ['#3b5b8c', '#374151', '#a8977a', '#4d5f3c', '#b45309', '#6d28d9'];
/** Top colours — rust, teal, forest, plum, mustard, slate. */
const TOP_SWATCHES = ['#c2410c', '#0f766e', '#166534', '#7e22ce', '#ca8a04', '#334155'];

/** A head-only thumbnail wearing one face/hair combination. */
const thumb = (face: FaceStyle, hair: HairStyle, hairColor: string): string =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor"`
    + ` stroke-width="5" stroke-linecap="round" stroke-linejoin="round">`
    + `<circle cx="50" cy="54" r="30"/>${faceHairSvg(50, 54, 30, { face, hair, hairColor })}</svg>`;

/**
 * A head wearing ONE face part and nothing else, so each button shows exactly the
 * shape it sets. Brows and accents get plain dot eyes, or they float without context.
 */
const partThumb = (part: keyof FaceParts, id: string): string => {
    const o: FaceOpts = { face: 'none', [part]: id };
    if (part === 'brows' || part === 'accent') o.eyes = 'dot';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor"`
        + ` stroke-width="5" stroke-linecap="round" stroke-linejoin="round">`
        + `<circle cx="50" cy="54" r="30"/>${faceHairSvg(50, 54, 30, o)}</svg>`;
};

const FACE_PARTS: { key: keyof FaceParts; label: () => string; list: { id: string; name: string }[] }[] = [
    { key: 'eyes', label: () => t('stickFace.eyes'), list: EYE_STYLES },
    { key: 'brows', label: () => t('stickFace.brows'), list: BROW_STYLES },
    { key: 'mouth', label: () => t('stickFace.mouth'), list: MOUTH_STYLES },
    { key: 'accent', label: () => t('stickFace.extras'), list: ACCENT_STYLES },
];

/**
 * A legs-only thumbnail wearing one trouser/shoe combination. Garments derive from a
 * limb polyline, so the preview draws the same standing pair of legs the geometry would
 * see — no head needed, which keeps the button readable at 28px.
 */
const legThumb = (trousers: TrouserStyle, shoes: ShoeStyle, tColor: string): string => {
    const legs: Array<Array<[number, number]>> = [[[50, 18], [32, 92]], [[50, 18], [68, 92]]];
    const prims = garmentGeometry(legs, [50, 18], { trousers, shoes, trouserColor: tColor, unit: 84, facing: 1 });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 112" fill="none" stroke="currentColor"`
        + ` stroke-width="6" stroke-linecap="round" stroke-linejoin="round">`
        + prims.map(primToSvg).join('')
        + `<path d="M50 18L32 92"/><path d="M50 18L68 92"/><path d="M50 0L50 18"/></svg>`;
};

/** A torso-and-arms thumbnail wearing one top / neckwear combination. */
const topThumb = (top: TopStyle, neck: NeckStyle, color: string): string => {
    const upper = {
        torso: [[50, 8], [50, 30], [50, 78]] as Array<[number, number]>,
        arms: [
            [[50, 30], [26, 62]] as Array<[number, number]>,
            [[50, 30], [74, 62]] as Array<[number, number]>,
        ],
    };
    const prims = garmentGeometry([], [50, 78], { top, neck, topColor: color, upper, unit: 84 });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor"`
        + ` stroke-width="6" stroke-linecap="round" stroke-linejoin="round">`
        + prims.map(primToSvg).join('')
        + `<path d="M50 8L50 78"/><path d="M50 30L26 62"/><path d="M50 30L74 62"/></svg>`;
};

const StickFaceControls: Component = () => {
    const pref = () => stickFacePref();

    /** Whether the selection contains something we can restyle live. */
    const hasStatic = createMemo(() => selectionHasStickFigure(store.selection));
    const hasRig = createMemo(() => selectionHasAnimatedFigure(store.selection));
    const hasTarget = createMemo(() => hasStatic() || hasRig());

    /**
     * What the swatches highlight: the selected figure's actual state when there
     * is one, otherwise the drop preference.
     */
    const current = createMemo(() => {
        const sel = stickFaceStateOf(store.selection) || animatedFigureFaceState(store.selection);
        if (sel) return sel;
        const p = pref();
        return {
            face: p.face === 'auto' ? null : p.face,
            hair: p.hair === 'auto' ? null : p.hair,
            hairColor: p.hairColor,
            headFill: p.headFill,
            trousers: p.trousers === 'auto' ? null : p.trousers,
            trouserColor: p.trouserColor,
            shoes: p.shoes === 'auto' ? null : p.shoes,
            shoeColor: p.shoeColor,
            top: p.top === 'auto' ? null : p.top,
            topColor: p.topColor,
            neck: p.neck === 'auto' ? null : p.neck,
            neckColor: p.neckColor,
            eyes: p.eyes, brows: p.brows, mouth: p.mouth, accent: p.accent,
        };
    });

    /** The first selected animated figure's payload (blink / talk switches). */
    const rig = createMemo(() => store.elements.find(e => store.selection.includes(e.id) && e.type === 'stickRig')?.stickRig);
    const rigIds = () => store.selection.filter(id => store.elements.some(e => e.id === id && e.type === 'stickRig'));

    /**
     * "Set at playhead": with the Scene Timeline open, an expression or face-part click
     * adds a KEY at the playhead to the selected animated figures instead of changing
     * the face they wear throughout. Hair and clothing still apply as usual.
     */
    const [keyMode, setKeyMode] = createSignal(false);
    const keying = () => keyMode() && hasRig() && store.showSceneTimeline;

    /** Apply a change to the preference AND to whatever is selected. */
    const apply = (choice: FaceHairChoice) => {
        const { face, eyes, brows, mouth, accent, ...rest } = choice;
        const faceChoice = Object.fromEntries(Object.entries({ face, eyes, brows, mouth, accent }).filter(([, v]) => v !== undefined));
        if (keying() && Object.keys(faceChoice).length) {
            for (const id of rigIds()) addFigureFaceKey(id, store.storyTime, faceChoice as any);
            if (Object.keys(rest).length === 0) return;
            choice = rest;
        }
        setStickFacePref(choice as any);
        if (hasStatic()) restyleStickFace(store.selection, choice);
        if (hasRig()) setAnimatedFigureFace(store.selection, choice);
    };

    return (
        <div class="sf-face">
            <div class="sf-face-head">
                <span>Appearance</span>
                <span class="sf-face-scope">
                    {hasTarget() ? 'editing selection' : 'applies to new figures'}
                </span>
            </div>

            <Show when={hasRig()}>
                <div class="sf-face-row sf-face-live">
                    <label class="sf-face-check" title={t('stickFace.blinkHint')}>
                        <input type="checkbox" checked={!!rig()?.blink}
                            onChange={(e) => setFigureBlink(rigIds(), e.currentTarget.checked)} />
                        {t('stickFace.blink')}
                    </label>
                    <label class="sf-face-color" title={t('stickFace.talkingHint')}>
                        {t('stickFace.talking')}
                        <select value={rig()?.talk ?? 'auto'}
                            onChange={(e) => setFigureTalk(rigIds(), e.currentTarget.value as TalkMode)}>
                            <option value="auto">{t('stickFace.talkAuto')}</option>
                            <option value="on">{t('stickFace.talkOn')}</option>
                            <option value="off">{t('stickFace.talkOff')}</option>
                        </select>
                    </label>
                </div>
                <Show when={store.showSceneTimeline}>
                    <label class="sf-face-check" title={t('stickFace.atPlayheadHint')}>
                        <input type="checkbox" checked={keyMode()} onChange={(e) => setKeyMode(e.currentTarget.checked)} />
                        {t('stickFace.atPlayhead', { time: store.storyTime.toFixed(1) })}
                    </label>
                </Show>
            </Show>

            <div class="sf-face-label">Expression</div>
            <div class="sf-face-grid">
                <For each={FACE_STYLES}>
                    {(f) => (
                        <button class={`sf-face-btn ${current().face === f.id ? 'active' : ''}`}
                            title={f.name} onClick={() => apply({ face: f.id })}>
                            {/* Our own generated markup — no user input reaches this. */}
                            <span class="sf-face-thumb" innerHTML={thumb(f.id, 'none', current().hairColor)} />
                        </button>
                    )}
                </For>
            </div>

            {/* Per-part overrides on top of the expression. Collapsed: most people only
                ever pick an expression, and four more grids would bury Hair. */}
            <details class="sf-face-parts">
                <summary>{t('stickFace.fineTune')}</summary>
                <For each={FACE_PARTS}>
                    {(part) => (
                        <>
                            <div class="sf-face-label">{part.label()}</div>
                            <div class="sf-face-grid">
                                <button class={`sf-face-btn sf-face-auto ${current()[part.key] === 'auto' ? 'active' : ''}`}
                                    title={t('stickFace.partAutoHint')} onClick={() => apply({ [part.key]: 'auto' })}>
                                    {t('stickFace.partAuto')}
                                </button>
                                <For each={part.list}>
                                    {(it) => (
                                        <button class={`sf-face-btn ${current()[part.key] === it.id ? 'active' : ''}`}
                                            title={it.name} onClick={() => apply({ [part.key]: it.id })}>
                                            <span class="sf-face-thumb" innerHTML={partThumb(part.key, it.id)} />
                                        </button>
                                    )}
                                </For>
                            </div>
                        </>
                    )}
                </For>
            </details>

            <div class="sf-face-label">Hair</div>
            <div class="sf-face-grid">
                <For each={HAIR_STYLES}>
                    {(h) => (
                        <button class={`sf-face-btn ${current().hair === h.id ? 'active' : ''}`}
                            title={h.name} onClick={() => apply({ hair: h.id })}>
                            <span class="sf-face-thumb" innerHTML={thumb('none', h.id, current().hairColor)} />
                        </button>
                    )}
                </For>
            </div>

            <div class="sf-face-row">
                <label class="sf-face-color" title="Hair colour (solid styles only)">
                    Hair colour
                    <input type="color" value={current().hairColor || DEFAULT_HAIR_COLOR}
                        onInput={(e) => apply({ hairColor: e.currentTarget.value })} />
                </label>
                <div class="sf-face-swatches">
                    <For each={HAIR_SWATCHES}>
                        {(c) => <button class="sf-face-sw" style={{ background: c }} title={c}
                            onClick={() => apply({ hairColor: c })} />}
                    </For>
                </div>
            </div>

            <div class="sf-face-label">Top</div>
            <div class="sf-face-grid">
                <For each={TOP_STYLES}>
                    {(t) => (
                        <button class={`sf-face-btn ${current().top === t.id ? 'active' : ''}`}
                            title={t.name} onClick={() => apply({ top: t.id })}>
                            <span class="sf-face-thumb" innerHTML={topThumb(t.id, 'none', current().topColor)} />
                        </button>
                    )}
                </For>
            </div>

            <div class="sf-face-label">Neckwear</div>
            <div class="sf-face-grid">
                <For each={NECK_STYLES}>
                    {(n) => (
                        <button class={`sf-face-btn ${current().neck === n.id ? 'active' : ''}`}
                            title={n.name} onClick={() => apply({ neck: n.id })}>
                            <span class="sf-face-thumb" innerHTML={topThumb('vest', n.id, current().topColor)} />
                        </button>
                    )}
                </For>
            </div>

            <div class="sf-face-row">
                <label class="sf-face-color" title="Top colour">
                    Top
                    <input type="color" value={current().topColor || DEFAULT_TOP_COLOR}
                        onInput={(e) => apply({ topColor: e.currentTarget.value })} />
                </label>
                <div class="sf-face-swatches">
                    <For each={TOP_SWATCHES}>
                        {(c) => <button class="sf-face-sw" style={{ background: c }} title={c}
                            onClick={() => apply({ topColor: c })} />}
                    </For>
                </div>
            </div>

            <div class="sf-face-label">Trousers</div>
            <div class="sf-face-grid">
                <For each={TROUSER_STYLES}>
                    {(t) => (
                        <button class={`sf-face-btn ${current().trousers === t.id ? 'active' : ''}`}
                            title={t.name} onClick={() => apply({ trousers: t.id })}>
                            <span class="sf-face-thumb" innerHTML={legThumb(t.id, 'none', current().trouserColor)} />
                        </button>
                    )}
                </For>
            </div>

            <div class="sf-face-label">Shoes</div>
            <div class="sf-face-grid">
                <For each={SHOE_STYLES}>
                    {(sh) => (
                        <button class={`sf-face-btn ${current().shoes === sh.id ? 'active' : ''}`}
                            title={sh.name} onClick={() => apply({ shoes: sh.id })}>
                            <span class="sf-face-thumb" innerHTML={legThumb('none', sh.id, current().trouserColor)} />
                        </button>
                    )}
                </For>
            </div>

            <div class="sf-face-row">
                <label class="sf-face-color" title="Trouser colour">
                    Trousers
                    <input type="color" value={current().trouserColor || DEFAULT_TROUSER_COLOR}
                        onInput={(e) => apply({ trouserColor: e.currentTarget.value })} />
                </label>
                <div class="sf-face-swatches">
                    <For each={TROUSER_SWATCHES}>
                        {(c) => <button class="sf-face-sw" style={{ background: c }} title={c}
                            onClick={() => apply({ trouserColor: c })} />}
                    </For>
                </div>
                <label class="sf-face-color" title="Shoe colour">
                    Shoes
                    <input type="color" value={current().shoeColor || DEFAULT_SHOE_COLOR}
                        onInput={(e) => apply({ shoeColor: e.currentTarget.value })} />
                </label>
            </div>

            <label class="sf-face-check" title="Fill the head white so the face reads over busy artwork">
                <input type="checkbox" checked={!!current().headFill}
                    onChange={(e) => apply({ headFill: e.currentTarget.checked })} />
                Solid head
            </label>

            <Show when={!hasTarget()}>
                <div class="sf-face-hint">
                    Select a figure on the canvas to restyle it — otherwise this sets what the next
                    figure you add will wear.
                </div>
            </Show>
        </div>
    );
};

export default StickFaceControls;
