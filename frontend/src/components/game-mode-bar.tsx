/**
 * GameModeBar — a small always-visible control strip on the game canvas.
 *
 * The Simple·Graph·Blueprint·Code switcher otherwise only lives inside each
 * editor's header, so on the bare game stage (all panels closed) there was no
 * quick way to hop to Blueprint/Code without the hamburger menu. This surfaces
 * the same switcher (plus ▶ Play) right on the canvas whenever you're editing a
 * game document and not currently playing. It hides itself once an editor panel
 * is open (that panel already carries the switcher) or while the game runs.
 */

import { type Component, Show } from 'solid-js';
import { Play } from 'lucide-solid';
import { store } from '../store/app-store';
import { showToast } from './toast';
import { GameViewSwitcher, type GameView } from './game-view-switcher';
import './game-mode-bar.css';

const anyEditorOpen = () =>
    store.showBehaviorsPanel || store.showGameGraph || store.showBlueprint || store.showGameScript;

/** Which view (if any) is currently open — highlights the matching switcher tab. */
const currentView = (): GameView | undefined =>
    store.showBlueprint ? 'blueprint'
        : store.showGameScript ? 'code'
            : store.showGameGraph ? 'graph'
                : store.showBehaviorsPanel ? 'simple'
                    : undefined;

const play = () => {
    Promise.all([import('../game/behaviors-to-script'), import('../game/game-runtime')]).then(([g, r]) => {
        const script = g.effectiveGameScript(store.elements, store.sceneBehaviors ?? [], store.gameScript, store.gameVars ?? [], store.blueprints, store.gameAuthoringMode);
        if (script && r.startGame(script)) showToast('Playing — Esc or Stop to end', 'info');
        else if (!script) showToast('Nothing to play yet — build some rules first', 'info');
    });
};

export const GameModeBar: Component = () => (
    <Show when={store.docType === 'game' && !store.gameActive && !anyEditorOpen()}>
        <div class="game-mode-bar" role="toolbar" aria-label="Game views">
            <GameViewSwitcher current={currentView()} />
            <button class="gmb-play" title="Play the game" onClick={play}><Play size={14} /> Play</button>
        </div>
    </Show>
);

export default GameModeBar;
