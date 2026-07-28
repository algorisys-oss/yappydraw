import { type Component, For, Show, createSignal, onMount, createEffect } from 'solid-js';
import {
    store, placeInstance, renameSymbol, deleteSymbol,
    redefineSymbol, createSymbol, selectInstancesOf, toggleSymbolSprayer,
    saveSelectionToAssetLibrary,
} from '../store/app-store';
import { renderElement } from '../utils/render-element';
import { screenToWorld } from '../utils/viewport-transforms';
import { pasteYappyElements } from '../utils/object-context-actions';
import { listAssets, getAssetElements, renameAsset, deleteAsset, type AssetMeta } from '../storage/asset-library';
import { showToast } from './toast';
import rough from 'roughjs';
import type { SymbolDef } from '../types';
import { Plus, Trash2, RefreshCw, SprayCan, Film, Library, Download } from 'lucide-solid';
import './symbols-panel.css';

const THUMB = 56; // px

/** Count live instances of a symbol on the canvas. */
const instanceCount = (symbolId: string) =>
    store.elements.filter(e => e.type === 'symbolInstance' && e.symbolId === symbolId).length;

/** A small canvas that renders a symbol's elements scaled to fit. */
const SymbolThumb: Component<{ sym: SymbolDef }> = (props) => {
    let canvasRef: HTMLCanvasElement | undefined;

    const draw = () => {
        if (!canvasRef) return;
        const dpr = window.devicePixelRatio || 1;
        canvasRef.width = THUMB * dpr;
        canvasRef.height = THUMB * dpr;
        const ctx = canvasRef.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, THUMB, THUMB);

        const sym = props.sym;
        const pad = 4;
        const avail = THUMB - pad * 2;
        const scale = Math.min(avail / Math.max(1, sym.width), avail / Math.max(1, sym.height));
        const offX = pad + (avail - sym.width * scale) / 2;
        const offY = pad + (avail - sym.height * scale) / 2;

        ctx.save();
        ctx.translate(offX, offY);
        ctx.scale(scale, scale);
        try {
            const rc = rough.canvas(canvasRef);
            for (const el of sym.elements) {
                renderElement(rc, ctx, el as any, store.theme !== 'light', 1);
            }
        } catch { /* defensive: a malformed child shouldn't blank the panel */ }
        ctx.restore();
    };

    onMount(draw);
    // Re-render when the symbol definition or theme changes (redefine updates thumbnail).
    createEffect(() => { props.sym.elements; props.sym.width; props.sym.height; store.theme; draw(); });

    return <canvas ref={canvasRef} style={{ width: `${THUMB}px`, height: `${THUMB}px` }} />;
};

/**
 * Asset Library section — reusable artwork kept outside the document (IndexedDB), so a
 * tree drawn in one project is one click away in the next. Distinct from the symbols
 * above it: assets insert as plain editable elements with no link back to the library.
 */
const AssetLibrarySection: Component = () => {
    const [assets, setAssets] = createSignal<AssetMeta[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [editingId, setEditingId] = createSignal<string | null>(null);
    const [editingName, setEditingName] = createSignal('');

    const refresh = async () => {
        try { setAssets(await listAssets()); }
        catch (e) { console.error('[asset-library] list failed:', e); setAssets([]); }
        finally { setLoading(false); }
    };
    onMount(refresh);

    const saveSelection = async () => {
        if (store.selection.length === 0) return;
        const suggested = `Asset ${assets().length + 1}`;
        const name = window.prompt('Save selection to the asset library as:', suggested);
        if (name === null) return;                       // cancelled
        const meta = await saveSelectionToAssetLibrary([...store.selection], name);
        if (meta) await refresh();
    };

    const insert = async (a: AssetMeta) => {
        const els = await getAssetElements(a.id);
        if (!els || els.length === 0) { showToast(`"${a.name}" could not be loaded`, 'error'); return; }
        // Reuse the paste path: fresh ids, remapped bindings/groups, centred in view.
        pasteYappyElements({ elements: els });
    };

    const startRename = (a: AssetMeta) => { setEditingId(a.id); setEditingName(a.name); };
    const commitRename = async (id: string) => {
        const name = editingName();
        setEditingId(null); setEditingName('');
        await renameAsset(id, name);
        await refresh();
    };

    const remove = async (a: AssetMeta) => {
        if (!window.confirm(`Remove "${a.name}" from the asset library? This can't be undone.`)) return;
        await deleteAsset(a.id);
        await refresh();
    };

    return (
        <div class="sp-section">
            <div class="sp-section-head">
                <span class="sp-section-title"><Library size={13} /> Asset library</span>
                <button
                    class="sp-icon-btn"
                    title="Save the selection to the asset library — available in every document"
                    disabled={store.selection.length === 0}
                    onClick={() => { void saveSelection(); }}
                >
                    <Download size={14} /> Save
                </button>
            </div>
            <Show
                when={!loading() && assets().length > 0}
                fallback={
                    <div class="sp-empty">
                        <Show when={!loading()} fallback={<>Loading…</>}>
                            Nothing saved yet.<br />
                            Select artwork and click Save to reuse it in any document.
                        </Show>
                    </div>
                }
            >
                {/* Distinct card/thumb classes: `.sp-card` / `.sp-thumb` are how callers
                    (and specs) count SYMBOLS, and library cards must not inflate that. */}
                <div class="sp-grid">
                    <For each={assets()}>
                        {(a) => (
                            <div class="sp-lib-card">
                                <div
                                    class="sp-lib-thumb"
                                    title={`${a.name} — click to insert`}
                                    onClick={() => { void insert(a); }}
                                >
                                    <Show when={a.thumb} fallback={<span class="sp-noprev">{a.elementCount}</span>}>
                                        <img class="sp-thumb-img" src={a.thumb} alt={a.name} />
                                    </Show>
                                </div>
                                <Show
                                    when={editingId() === a.id}
                                    fallback={
                                        <div class="sp-name" title={a.name} onDblClick={() => startRename(a)}>
                                            {a.name}
                                        </div>
                                    }
                                >
                                    <input
                                        class="sp-name-input"
                                        value={editingName()}
                                        autofocus
                                        onInput={(e) => setEditingName(e.currentTarget.value)}
                                        onBlur={() => { void commitRename(a.id); }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') { void commitRename(a.id); }
                                            else if (e.key === 'Escape') { setEditingId(null); setEditingName(''); }
                                        }}
                                    />
                                </Show>
                                <div class="sp-actions">
                                    <button class="sp-act" title="Insert into this document" onClick={() => { void insert(a); }}>
                                        <Plus size={13} />
                                    </button>
                                    <button class="sp-act sp-danger" title="Remove from library" onClick={() => { void remove(a); }}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
};

const SymbolsPanel: Component = () => {
    const [editingId, setEditingId] = createSignal<string | null>(null);
    const [editingName, setEditingName] = createSignal('');

    const place = (symbolId: string) => {
        // Drop the new instance near the centre of the current viewport.
        const c = screenToWorld(window.innerWidth / 2, window.innerHeight / 2, store.viewState as any);
        const sym = store.symbols.find(s => s.id === symbolId);
        placeInstance(symbolId, c.x - (sym ? sym.width / 2 : 0), c.y - (sym ? sym.height / 2 : 0));
    };

    const startRename = (sym: SymbolDef) => { setEditingId(sym.id); setEditingName(sym.name); };
    const commitRename = (id: string) => {
        renameSymbol(id, editingName());
        setEditingId(null); setEditingName('');
    };

    const redefine = (symbolId: string) => {
        if (store.selection.length === 0) return;
        redefineSymbol(symbolId, [...store.selection]);
    };

    const remove = (sym: SymbolDef) => {
        const n = instanceCount(sym.id);
        const msg = n > 0
            ? `Delete "${sym.name}"? Its ${n} instance${n > 1 ? 's' : ''} will be detached into editable copies.`
            : `Delete "${sym.name}"?`;
        if (window.confirm(msg)) deleteSymbol(sym.id, true);
    };

    return (
                <div class="symbols-panel-body">
                    <div class="sp-toolbar">
                        <button
                            class="sp-icon-btn"
                            title="Create symbol from selection"
                            disabled={store.selection.length === 0}
                            onClick={() => createSymbol([...store.selection])}
                        >
                            <Plus size={15} /> Create symbol
                        </button>
                        <Show when={store.docType === 'animation'}>
                            <button
                                class="sp-icon-btn"
                                title="Create a movie clip from selection — a symbol with its own frame timeline (F8). Double-click an instance to edit its timeline."
                                disabled={store.selection.length === 0}
                                onClick={() => createSymbol([...store.selection], undefined, 'movieclip')}
                            >
                                <Film size={15} /> Movie clip
                            </button>
                        </Show>
                    </div>
                    <Show
                        when={store.symbols.length > 0}
                        fallback={
                            <div class="sp-empty">
                                No symbols yet.<br />
                                Select objects and click <Plus size={12} /> to create one.
                            </div>
                        }
                    >
                        <div class="sp-grid">
                            <For each={store.symbols}>
                                {(sym) => (
                                    <div class="sp-card">
                                        <div
                                            class="sp-thumb"
                                            title="Click to select instances · double-click to place"
                                            onClick={() => selectInstancesOf(sym.id)}
                                            onDblClick={() => place(sym.id)}
                                        >
                                            <SymbolThumb sym={sym} />
                                            <span class="sp-count">{instanceCount(sym.id)}</span>
                                            <Show when={sym.kind === 'movieclip'}>
                                                <span class="sp-kind" title="Movie clip — has its own frame timeline"><Film size={11} /></span>
                                            </Show>
                                        </div>
                                        <Show
                                            when={editingId() === sym.id}
                                            fallback={
                                                <div class="sp-name" title={sym.name} onDblClick={() => startRename(sym)}>
                                                    {sym.name}
                                                </div>
                                            }
                                        >
                                            <input
                                                class="sp-name-input"
                                                value={editingName()}
                                                autofocus
                                                onInput={(e) => setEditingName(e.currentTarget.value)}
                                                onBlur={() => commitRename(sym.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') commitRename(sym.id);
                                                    else if (e.key === 'Escape') { setEditingId(null); setEditingName(''); }
                                                }}
                                            />
                                        </Show>
                                        <div class="sp-actions">
                                            <button class="sp-act" title="Place instance" onClick={() => place(sym.id)}>
                                                <Plus size={13} />
                                            </button>
                                            <button class="sp-act" title="Spray instances (drag on canvas)" onClick={() => toggleSymbolSprayer(sym.id)}>
                                                <SprayCan size={13} />
                                            </button>
                                            <button
                                                class="sp-act"
                                                title="Redefine from selection"
                                                disabled={store.selection.length === 0}
                                                onClick={() => redefine(sym.id)}
                                            >
                                                <RefreshCw size={13} />
                                            </button>
                                            <button class="sp-act sp-danger" title="Delete symbol" onClick={() => remove(sym)}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Show>
                    <AssetLibrarySection />
                </div>
    );
};

export default SymbolsPanel;
