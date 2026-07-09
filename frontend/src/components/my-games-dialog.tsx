/**
 * My Games — a launcher gallery of every saved game. A game IS a document, so
 * this reuses the existing saved-drawings store (`storage` + `doc-thumbnails`)
 * and just filters to docs tagged `isGame` at save time. Each card can Play (load
 * + run, no editor chrome), Open (load into the editor), or Delete; a ＋ tile
 * opens the New Game chooser.
 */

import { type Component, For, Show, createSignal, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import { X, Play, Trash2, Plus, Gamepad2, Code } from 'lucide-solid';
import { storage } from '../storage/file-system-storage';
import { getDocThumbnails, removeDocThumbnail } from '../storage/doc-thumbnails';
import { isSlideDocument, migrateToSlideFormat } from '../utils/migration';
import { store, loadDocument, toggleBehaviorsPanel, toggleGameScript } from '../store/app-store';
import { effectiveGameScript } from '../game/behaviors-to-script';
import { startGame } from '../game/game-runtime';
import { setDrawingId } from './menu';
import { showMyGames, setShowMyGames } from './my-games-signal';
import { setShowNewGame } from './new-game-signal';
import { showToast } from './toast';
import { onEscapeKey } from '../utils/use-escape';
import './my-games-dialog.css';

type GameCard = { id: string; name: string; thumb?: string; updatedAt?: string; mode?: 'visual' | 'code' };

const MyGamesDialog: Component = () => {
    onEscapeKey(showMyGames, () => setShowMyGames(false));
    const [games, setGames] = createSignal<GameCard[]>([]);
    const [loading, setLoading] = createSignal(false);

    const fetchGames = async () => {
        setLoading(true);
        try {
            const [list, thumbs] = await Promise.all([storage.listDrawings(), getDocThumbnails()]);
            const cards = list
                .map(id => ({ id, name: id, ...(thumbs[id] || {}) as any }))
                .filter(g => g.isGame)
                .sort((a: GameCard, b: GameCard) => (b.updatedAt || '').localeCompare(a.updatedAt || '') || a.name.localeCompare(b.name));
            setGames(cards);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    createEffect(() => { if (showMyGames()) fetchGames(); });

    /** Load a saved game document into the store (shared by Play + Open). */
    const load = async (id: string): Promise<boolean> => {
        const data = await storage.loadDrawing(id);
        if (!data) { showToast('Game not found', 'error'); return false; }
        const doc = isSlideDocument(data) ? data : migrateToSlideFormat(data as any);
        loadDocument(doc);
        setDrawingId(doc.metadata?.name || id);
        return true;
    };

    const play = async (id: string, e: Event) => {
        e.stopPropagation();
        if (!(await load(id))) return;
        setShowMyGames(false);
        const script = effectiveGameScript(store.elements, store.sceneBehaviors ?? [], store.gameScript, store.gameVars ?? [], store.blueprints, store.gameAuthoringMode);
        if (script && startGame(script)) showToast('Playing — Esc or Stop to end', 'info');
        else showToast('This game has no runnable script yet', 'info');
    };

    const open = async (card: GameCard) => {
        if (!(await load(card.id))) return;
        setShowMyGames(false);
        if (card.mode === 'code') toggleGameScript(true); else toggleBehaviorsPanel(true);
        showToast(`Opened "${card.name}"`, 'success');
    };

    const del = async (id: string, e: Event) => {
        e.stopPropagation();
        if (!confirm(`Delete "${id}"? This can't be undone.`)) return;
        try {
            await storage.deleteDrawing(id);
            void removeDocThumbnail(id);
            fetchGames();
            showToast(`Deleted "${id}"`, 'success');
        } catch { showToast('Failed to delete', 'error'); }
    };

    return (
        <Show when={showMyGames()}>
            <Portal>
                <div class="mg-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowMyGames(false); }}>
                    <div class="mg-modal" onClick={(e) => e.stopPropagation()}>
                        <div class="mg-header">
                            <div class="mg-title"><Gamepad2 size={18} /><h2>My Games</h2></div>
                            <button class="mg-close" onClick={() => setShowMyGames(false)}><X size={18} /></button>
                        </div>

                        <div class="mg-body">
                            <Show when={loading()}><div class="mg-loading">Loading…</div></Show>
                            <div class="mg-grid">
                                {/* New Game tile */}
                                <button class="mg-card mg-new" onClick={() => { setShowMyGames(false); setShowNewGame(true); }}>
                                    <span class="mg-new-plus"><Plus size={26} /></span>
                                    <span class="mg-new-label">New Game</span>
                                </button>

                                <For each={games()}>
                                    {(g) => (
                                        <div class="mg-card" onClick={() => open(g)}>
                                            <div class="mg-preview">
                                                <Show when={g.thumb} fallback={<Gamepad2 size={30} />}>
                                                    <img src={g.thumb} alt={g.name} loading="lazy" />
                                                </Show>
                                                <button class="mg-play" title="Play" onClick={(e) => play(g.id, e)}><Play size={20} /></button>
                                                <Show when={g.mode === 'code'}><span class="mg-badge" title="Code-authored"><Code size={11} /> code</span></Show>
                                            </div>
                                            <div class="mg-row">
                                                <span class="mg-name" title={g.name}>{g.name}</span>
                                                <button class="mg-del" title="Delete" onClick={(e) => del(g.id, e)}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>
                            <Show when={!loading() && games().length === 0}>
                                <div class="mg-empty">No saved games yet. Make one with <strong>New Game</strong>, then <strong>Save</strong> it — it'll show up here.</div>
                            </Show>
                        </div>
                    </div>
                </div>
            </Portal>
        </Show>
    );
};

export default MyGamesDialog;
