/**
 * A dock-native Comic Studio panel. Body-only (chrome comes from PanelChrome).
 *
 * Type a screenplay-style script and generate a comic panel or strip. All of the
 * thinking lives in `library/comic` as pure functions — this component only collects
 * options and shows a preview of how the script will be split, so nothing here
 * duplicates layout logic. See docs/microsoft-comic-chat-algorithm.md.
 */
import { type Component, createSignal, createMemo, For, Show } from "solid-js";
import { Clapperboard, Users } from "lucide-solid";
import { createComicPanel, createComicStrip } from "../../library/comic";
import { parseScript, castSpeakers, splitIntoPanels } from "../../library/comic/panel-layout";
import { poseForLine, poseForEmotion, EMOTIONS } from "../../library/comic/pose-rules";
import { showToast } from "../toast";

const SAMPLE = `Alice: Hi Bob!
Bob: I think we should ship it.
Alice: ARE YOU SURE?
Bob (thinks): lol maybe not`;

type Variant = 'male' | 'female' | 'boy' | 'girl';
const VARIANT_LABEL: Record<Variant, string> = { male: 'Man', female: 'Woman', boy: 'Boy', girl: 'Girl' };
const VARIANTS: Variant[] = ['male', 'female', 'boy', 'girl'];

/** Turn an asset id like "daily-waving-female" into a readable cue ("waving"). */
const poseLabel = (assetId: string): string => {
    const base = assetId.replace(/-(female|boy|girl)$/, '');
    const name = base.split('-').slice(1).join(' ');
    return name || base;
};

const DockComicPanel: Component = () => {
    const [script, setScript] = createSignal(SAMPLE);
    const [figureHeight, setFigureHeight] = createSignal(210);
    const [fontSize, setFontSize] = createSignal(16);
    const [columns, setColumns] = createSignal(3);
    const [frame, setFrame] = createSignal(true);
    const [mono, setMono] = createSignal(false);
    const [variants, setVariants] = createSignal<Record<string, Variant>>({});
    const [emotions, setEmotions] = createSignal<Record<string, string>>({});

    // Everything below is derived from the SAME pure functions the generator uses, so
    // the preview can never disagree with what gets drawn.
    const utterances = createMemo(() => parseScript(script()));
    const speakers = createMemo(() => castSpeakers(utterances()));
    const panels = createMemo(() => splitIntoPanels(utterances()));

    const label = {
        display: 'block', 'font-size': '11px', opacity: '0.75', 'margin-bottom': '3px',
    } as any;
    const field = {
        width: '100%', padding: '5px 6px', 'font-size': '12px',
        background: 'var(--bg-secondary)', color: 'var(--text-color, inherit)',
        border: '1px solid var(--border-color)', 'border-radius': '5px',
    } as any;
    const btn = (primary: boolean) => ({
        flex: '1', padding: '7px 8px', 'font-size': '12px', cursor: 'pointer',
        display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', gap: '5px',
        background: primary ? 'var(--accent-color, #3b82f6)' : 'var(--bg-secondary)',
        color: primary ? '#fff' : 'var(--text-color, inherit)',
        border: '1px solid var(--border-color)', 'border-radius': '5px',
    }) as any;

    const opts = () => ({
        figureHeight: figureHeight(),
        fontSize: fontSize(),
        frame: frame(),
        monochrome: mono(),
        variants: variants(),
        emotions: emotions(),
    });

    const generate = (asStrip: boolean) => {
        if (utterances().length === 0) {
            showToast('Add at least one line like "Alice: Hello"', 'error');
            return;
        }
        const id = asStrip
            ? createComicStrip(script(), { ...opts(), columns: columns() })
            : createComicPanel(script(), opts());
        if (!id) { showToast('Could not build a comic from that script', 'error'); return; }
        showToast(asStrip ? `Strip added (${panels().length} panels)` : 'Panel added', 'success');
    };

    /** 'auto' clears the override so the text rules decide again. */
    const setEmotion = (speaker: string, id: string) => {
        setEmotions(prev => {
            const next = { ...prev };
            if (id === 'auto') delete next[speaker]; else next[speaker] = id;
            return next;
        });
    };

    const setVariant = (speaker: string, v: Variant) => {
        setVariants(prev => {
            const next = { ...prev };
            if (next[speaker] === v) delete next[speaker]; else next[speaker] = v;
            return next;
        });
    };

    return (
        <div style={{ padding: '8px', display: 'flex', 'flex-direction': 'column', gap: '10px' }}>
            {/* Script */}
            <div>
                <label style={label}>Script — one line per balloon</label>
                <textarea
                    value={script()}
                    onInput={e => setScript(e.currentTarget.value)}
                    spellcheck={false}
                    placeholder={'Alice: Hi Bob!\nBob: I think we should ship it.'}
                    style={{ ...field, height: '116px', resize: 'vertical', 'font-family': 'var(--font-mono, monospace)', 'line-height': '1.5' }}
                />
                <div style={{ 'font-size': '10.5px', opacity: '0.6', 'margin-top': '3px' }}>
                    Write <code>Name: what they say</code>. The pose comes from the words —
                    a greeting waves, CAPS shouts, “:-(” is sad, “maybe” thinks.
                    Use <code>Name (thinks):</code> for a thought cloud,
                    <code> Name (whispers):</code> for a dashed aside, or start a line with
                    <code> *</code> for a caption box.
                </div>
            </div>

            {/* What the script will produce */}
            <Show when={speakers().length > 0} fallback={
                <div style={{ 'font-size': '11.5px', opacity: '0.6' }}>
                    No dialogue yet — add a line like <code>Alice: Hello</code>.
                </div>
            }>
                <div>
                    <label style={label}>
                        <Users size={11} style={{ display: 'inline', 'vertical-align': '-1px', 'margin-right': '3px' }} />
                        {speakers().length} {speakers().length === 1 ? 'speaker' : 'speakers'} · {panels().length} {panels().length === 1 ? 'panel' : 'panels'}
                    </label>
                    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '5px' }}>
                        <For each={speakers()}>{(s) => {
                            const first = () => utterances().find(u => u.speaker === s);
                            return (
                                <div style={{ border: '1px solid var(--border-color)', 'border-radius': '5px', padding: '5px 6px' }}>
                                    <div style={{ display: 'flex', 'align-items': 'baseline', gap: '6px' }}>
                                        <strong style={{ 'font-size': '12px' }}>{s}</strong>
                                        {/* Show the pose that will ACTUALLY be drawn — the manual
                                            emotion when set, otherwise what the words inferred. */}
                                        <span style={{ 'font-size': '10.5px', opacity: '0.65' }}>
                                            {poseLabel(poseForEmotion(emotions()[s]) ?? poseForLine(first()?.text ?? ''))}
                                            {emotions()[s] ? '' : ' (auto)'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '3px', 'margin-top': '4px' }}>
                                        <For each={VARIANTS}>{(v) => (
                                            <button
                                                title={`Draw ${s} as ${VARIANT_LABEL[v]}`}
                                                onClick={() => setVariant(s, v)}
                                                style={{
                                                    flex: '1', padding: '3px 0', 'font-size': '10.5px', cursor: 'pointer',
                                                    'border-radius': '4px', border: '1px solid var(--border-color)',
                                                    background: variants()[s] === v ? 'var(--accent-color, #3b82f6)' : 'transparent',
                                                    color: variants()[s] === v ? '#fff' : 'var(--text-color, inherit)',
                                                }}
                                            >{VARIANT_LABEL[v]}</button>
                                        )}</For>
                                    </div>
                                    {/* Emotion override — the panel's version of Comic Chat's
                                        emotion wheel: the writer knows the mood, the parser guesses. */}
                                    <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '3px', 'margin-top': '4px' }}>
                                        <For each={EMOTIONS}>{(em) => {
                                            const active = () => (emotions()[s] ?? 'auto') === em.id;
                                            return (
                                                <button
                                                    title={em.id === 'auto'
                                                        ? `Let the words decide (${poseLabel(poseForLine(first()?.text ?? ''))})`
                                                        : `Always draw ${s} ${em.label.toLowerCase()}`}
                                                    onClick={() => setEmotion(s, em.id)}
                                                    style={{
                                                        padding: '2px 6px', 'font-size': '10px', cursor: 'pointer',
                                                        'border-radius': '9px', border: '1px solid var(--border-color)',
                                                        background: active() ? 'var(--accent-color, #3b82f6)' : 'transparent',
                                                        color: active() ? '#fff' : 'var(--text-color, inherit)',
                                                        opacity: active() ? '1' : '0.8',
                                                    }}
                                                >{em.label}</button>
                                            );
                                        }}</For>
                                    </div>
                                </div>
                            );
                        }}</For>
                    </div>
                </div>
            </Show>

            {/* Options */}
            <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '6px' }}>
                <div>
                    <label style={label}>Figure height</label>
                    <input type="number" min="80" max="600" step="10" style={field}
                        value={figureHeight()} onInput={e => setFigureHeight(+e.currentTarget.value || 210)} />
                </div>
                <div>
                    <label style={label}>Text size</label>
                    <input type="number" min="8" max="40" step="1" style={field}
                        value={fontSize()} onInput={e => setFontSize(+e.currentTarget.value || 16)} />
                </div>
                <div>
                    <label style={label}>Panels per row</label>
                    <input type="number" min="1" max="6" step="1" style={field}
                        value={columns()} onInput={e => setColumns(Math.max(1, +e.currentTarget.value || 3))} />
                </div>
                <div style={{ display: 'flex', 'align-items': 'flex-end', gap: '10px', 'font-size': '11.5px' }}>
                    <label style={{ display: 'inline-flex', 'align-items': 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={frame()} onChange={e => setFrame(e.currentTarget.checked)} /> Border
                    </label>
                    <label style={{ display: 'inline-flex', 'align-items': 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={mono()} onChange={e => setMono(e.currentTarget.checked)} /> Mono
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '6px' }}>
                <button style={btn(true)} onClick={() => generate(panels().length > 1)}>
                    <Clapperboard size={13} />
                    {panels().length > 1 ? `Generate strip (${panels().length})` : 'Generate panel'}
                </button>
                <Show when={panels().length > 1}>
                    <button style={btn(false)} title="Put everything in a single panel instead"
                        onClick={() => generate(false)}>One panel</button>
                </Show>
            </div>
        </div>
    );
};

export default DockComicPanel;
