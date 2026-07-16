/**
 * Shared, prop-driven param editors for a rule's WHEN trigger and DO actions.
 *
 * Extracted from behaviors-panel.tsx so BOTH the Behaviors panel (simple mode)
 * and the Game Graph nodes (Blueprint view) render fully editable rules from one
 * source. They are pure: given a value + the option lists (sprites/states) and an
 * `onPatch` callback, they emit the same partial-patch the panel always used.
 * Styling lives in behavior-editors.css (neutral `be-*` classes).
 */

import { type Component, For, Show } from 'solid-js';
import { ANIM_PRESETS, SOUND_NAMES, type Trigger, type Action } from './behavior-types';
import { COMPARE, BUTTONS, SPEEDS, DIR4, DIR8, EDGES, SPAWN_AT } from './behavior-ui';
import './behavior-editors.css';

/** Editable params for a trigger (everything after the WHEN kind picker). */
export const TriggerParams: Component<{ trigger: Trigger; sprites: string[]; onPatch: (patch: any) => void }> = (p) => {
    const t = () => p.trigger as any;
    const set = (patch: any) => p.onPatch(patch);
    return (
        <>
            <Show when={t().kind === 'keyPress' || t().kind === 'keyHold'}>
                <select class="be-sel" value={t().button} onChange={e => set({ button: e.currentTarget.value })}>
                    <For each={BUTTONS}>{b => <option value={b.v}>{b.label}</option>}</For>
                </select>
            </Show>
            <Show when={t().kind === 'hit'}>
                <select class="be-sel" value={t().target}
                    onChange={e => set(e.currentTarget.value === 'edge' ? { target: 'edge', edge: 'any' } : { target: e.currentTarget.value, edge: undefined })}>
                    <option value="edge">a wall</option>
                    <For each={p.sprites}>{n => <option value={n}>{n}</option>}</For>
                </select>
                <Show when={t().target === 'edge'}>
                    <select class="be-sel" value={t().edge} onChange={e => set({ edge: e.currentTarget.value })}>
                        <For each={EDGES}>{ed => <option value={ed}>{ed}</option>}</For>
                    </select>
                </Show>
            </Show>
            <Show when={t().kind === 'varReaches'}>
                <input class="be-text" type="text" style={{ 'min-width': '70px' }} value={t().name} onInput={e => set({ name: e.currentTarget.value })} />
                <select class="be-sel" value={t().compare} onChange={e => set({ compare: e.currentTarget.value })}>
                    <For each={COMPARE}>{c => <option value={c.v}>{c.label}</option>}</For>
                </select>
                <input class="be-num" type="number" value={t().value} onInput={e => set({ value: Number(e.currentTarget.value) })} />
            </Show>
            <Show when={t().kind === 'timer'}>
                <input class="be-num" type="number" step="0.5" value={t().seconds} onInput={e => set({ seconds: Number(e.currentTarget.value) })} /><span class="be-unit">s</span>
            </Show>
            <Show when={t().kind === 'touching'}>
                <select class="be-sel" value={t().target} onChange={e => set({ target: e.currentTarget.value })}>
                    <option value="">(pick sprite)</option><For each={p.sprites}>{n => <option value={n}>{n}</option>}</For>
                </select>
            </Show>
            <Show when={t().kind === 'receive'}>
                <input class="be-text" type="text" placeholder="message" value={t().message} onInput={e => set({ message: e.currentTarget.value })} />
            </Show>
        </>
    );
};

/** Editable params for a single action (everything after the DO kind picker). */
export const ActionParams: Component<{ action: Action; sprites: string[]; states: string[]; onPatch: (patch: any) => void }> = (p) => {
    const a = () => p.action as any;
    const set = (patch: any) => p.onPatch(patch);
    return (
        <Show when={a().kind !== 'bounce' && a().kind !== 'show' && a().kind !== 'hide' && a().kind !== 'land'}>
            <Show when={a().kind === 'gravity'}>
                <select class="be-sel" value={a().on ? 'on' : 'off'} onChange={e => set({ on: e.currentTarget.value === 'on' })}><option value="on">on</option><option value="off">off</option></select>
            </Show>
            <Show when={a().kind === 'jump'}>
                <select class="be-sel" value={a().strength} onChange={e => set({ strength: e.currentTarget.value })}><option value="slow">low</option><option value="medium">medium</option><option value="fast">high</option></select>
            </Show>
            <Show when={a().kind === 'moveDir'}>
                <select class="be-sel" value={a().dir} onChange={e => set({ dir: e.currentTarget.value })}><For each={DIR4}>{d => <option>{d}</option>}</For></select>
                <select class="be-sel" value={a().speed} onChange={e => set({ speed: e.currentTarget.value })}><For each={SPEEDS}>{s => <option>{s}</option>}</For></select>
            </Show>
            <Show when={a().kind === 'glide'}>
                <select class="be-sel" value={a().dir} onChange={e => set({ dir: e.currentTarget.value })}><For each={DIR8}>{d => <option>{d}</option>}</For></select>
                <select class="be-sel" value={a().speed} onChange={e => set({ speed: e.currentTarget.value })}><For each={SPEEDS}>{s => <option>{s}</option>}</For></select>
            </Show>
            <Show when={a().kind === 'rotate'}><input class="be-num" type="number" value={a().deg} onInput={e => set({ deg: Number(e.currentTarget.value) })} /><span class="be-unit">°</span></Show>
            <Show when={a().kind === 'color'}><input class="be-color" type="color" value={a().color} onInput={e => set({ color: e.currentTarget.value })} /></Show>
            <Show when={a().kind === 'scale'}><input class="be-num" type="number" step="0.1" value={a().factor} onInput={e => set({ factor: Number(e.currentTarget.value) })} />×</Show>
            <Show when={a().kind === 'setText'}><input class="be-text" type="text" value={a().text} onInput={e => set({ text: e.currentTarget.value })} /></Show>
            <Show when={a().kind === 'moveTo'}>
                <select class="be-sel" value={a().at} onChange={e => set({ at: e.currentTarget.value })}><For each={SPAWN_AT}>{s => <option value={s.v}>{s.label}</option>}</For></select>
            </Show>
            <Show when={a().kind === 'setVelocity'}>
                <span class="be-unit">vx</span><input class="be-num" type="number" value={a().vx} onInput={e => set({ vx: Number(e.currentTarget.value) })} />
                <span class="be-unit">vy</span><input class="be-num" type="number" value={a().vy} onInput={e => set({ vy: Number(e.currentTarget.value) })} />
            </Show>
            <Show when={a().kind === 'moveToXY'}>
                <span class="be-unit">x</span><input class="be-num" type="number" value={a().x} onInput={e => set({ x: Number(e.currentTarget.value) })} />
                <span class="be-unit">y</span><input class="be-num" type="number" value={a().y} onInput={e => set({ y: Number(e.currentTarget.value) })} />
            </Show>
            <Show when={a().kind === 'tether'}>
                <span class="be-unit">x</span><input class="be-num" type="number" value={a().ax} onInput={e => set({ ax: Number(e.currentTarget.value) })} />
                <span class="be-unit">y</span><input class="be-num" type="number" value={a().ay} onInput={e => set({ ay: Number(e.currentTarget.value) })} />
                <select class="be-sel" value={a().target} onChange={e => set({ target: e.currentTarget.value })}><option value="">(pick target)</option><For each={p.sprites}>{n => <option value={n}>{n}</option>}</For></select>
            </Show>
            <Show when={a().kind === 'spawn'}>
                <select class="be-sel" value={a().sprite} onChange={e => set({ sprite: e.currentTarget.value })}><option value="">(pick sprite)</option><For each={p.sprites}>{n => <option value={n}>{n}</option>}</For></select>
                <select class="be-sel" value={a().at} onChange={e => set({ at: e.currentTarget.value })}><For each={SPAWN_AT}>{s => <option value={s.v}>{s.label}</option>}</For></select>
            </Show>
            <Show when={a().kind === 'destroy'}>
                <select class="be-sel" value={a().target} onChange={e => set({ target: e.currentTarget.value })}><option value="this">this</option><For each={p.sprites}>{n => <option value={n}>{n}</option>}</For></select>
            </Show>
            <Show when={a().kind === 'score'}><input class="be-num" type="number" value={a().delta} onInput={e => set({ delta: Number(e.currentTarget.value) })} /></Show>
            <Show when={a().kind === 'setVar'}>
                <input class="be-text" type="text" style={{ 'min-width': '70px' }} value={a().name} onInput={e => set({ name: e.currentTarget.value })} /><span class="be-unit">=</span>
                <input class="be-num" type="number" value={a().value} onInput={e => set({ value: Number(e.currentTarget.value) })} />
            </Show>
            <Show when={a().kind === 'changeVar'}>
                <input class="be-text" type="text" style={{ 'min-width': '70px' }} value={a().name} onInput={e => set({ name: e.currentTarget.value })} /><span class="be-unit">by</span>
                <input class="be-num" type="number" value={a().delta} onInput={e => set({ delta: Number(e.currentTarget.value) })} />
            </Show>
            <Show when={a().kind === 'showVar'}>
                <input class="be-text" type="text" style={{ 'min-width': '70px' }} value={a().name} onInput={e => set({ name: e.currentTarget.value })} />
            </Show>
            <Show when={a().kind === 'goToState'}>
                <select class="be-sel" value={a().state} onChange={e => set({ state: e.currentTarget.value })}><option value="">(pick state)</option><For each={p.states}>{n => <option value={n}>{n}</option>}</For></select>
            </Show>
            <Show when={a().kind === 'playAnim'}>
                <select class="be-sel" value={a().preset} onChange={e => set({ preset: e.currentTarget.value })}><For each={ANIM_PRESETS}>{pr => <option>{pr}</option>}</For></select>
            </Show>
            <Show when={a().kind === 'playSound'}>
                <select class="be-sel" value={a().sound} onChange={e => set({ sound: e.currentTarget.value })}><For each={SOUND_NAMES}>{sn => <option>{sn}</option>}</For></select>
                <button class="be-hear" title="Hear it" onClick={() => import('./sound-engine').then(m => m.playSfx(a().sound))}>▶</button>
            </Show>
            <Show when={a().kind === 'music'}>
                <select class="be-sel" value={a().on ? 'on' : 'off'} onChange={e => set({ on: e.currentTarget.value === 'on' })}><option value="on">on</option><option value="off">off</option></select>
            </Show>
            <Show when={a().kind === 'goToPage'}><input class="be-num" type="number" value={a().index} onInput={e => set({ index: Number(e.currentTarget.value) })} /></Show>
            <Show when={a().kind === 'broadcast'}><input class="be-text" type="text" placeholder="message" value={a().message} onInput={e => set({ message: e.currentTarget.value })} /></Show>
            <Show when={a().kind === 'win' || a().kind === 'gameOver'}><input class="be-text" type="text" value={a().message} onInput={e => set({ message: e.currentTarget.value })} /></Show>
        </Show>
    );
};
