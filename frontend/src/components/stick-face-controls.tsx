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
import { type Component, For, Show, createMemo } from 'solid-js';
import { store } from '../store/app-store';
import {
    FACE_STYLES, HAIR_STYLES, faceHairSvg, DEFAULT_HAIR_COLOR,
    stickFacePref, setStickFacePref,
    restyleStickFace, stickFaceStateOf, selectionHasStickFigure,
    setAnimatedFigureFace, animatedFigureFaceState, selectionHasAnimatedFigure,
    type FaceHairChoice, type FaceStyle, type HairStyle,
} from '../library/stick-figures';
import './stick-face-controls.css';

/** Hair colours that read well against the default dark outline. */
const HAIR_SWATCHES = ['#8b5e3c', '#2b2118', '#e0b040', '#c2410c', '#9ca3af', '#7c3aed'];

/** A head-only thumbnail wearing one face/hair combination. */
const thumb = (face: FaceStyle, hair: HairStyle, hairColor: string): string =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor"`
    + ` stroke-width="5" stroke-linecap="round" stroke-linejoin="round">`
    + `<circle cx="50" cy="54" r="30"/>${faceHairSvg(50, 54, 30, { face, hair, hairColor })}</svg>`;

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
        };
    });

    /** Apply a change to the preference AND to whatever is selected. */
    const apply = (choice: FaceHairChoice) => {
        setStickFacePref(choice as any);
        if (hasStatic()) restyleStickFace(store.selection, choice);
        if (hasRig()) setAnimatedFigureFace(store.selection, choice);
    };

    return (
        <div class="sf-face">
            <div class="sf-face-head">
                <span>Face &amp; hair</span>
                <span class="sf-face-scope">
                    {hasTarget() ? 'editing selection' : 'applies to new figures'}
                </span>
            </div>

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
