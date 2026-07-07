/**
 * New Game chooser — how to start a game, so its authoring mode is clear up front
 * rather than "make a doc, then find the script somewhere":
 *   Blank      → a fresh visual game (opens the Build editor)
 *   Starters   → Pong / Catch / Platformer example games (visual)
 *   Code       → a hand-written (code-authored) game (opens the Code view)
 *
 * A game IS a document; each option resets to a new doc and opens the right editor.
 */

import { type Component, For, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { X, Gamepad2, Code, Sparkles } from 'lucide-solid';
import { toggleBehaviorsPanel, toggleGameScript, setGameAuthoringMode } from '../store/app-store';
import { buildPongExample, buildCatchExample, buildPlatformerExample } from '../game/behavior-examples';
import { handleNew } from './menu';
import { showNewGame, setShowNewGame } from './new-game-signal';
import './new-game-dialog.css';

type Choice = { key: string; title: string; sub: string; icon: any; run: () => void };

/** Reset to a fresh game document, then open the given editor (after any unsaved prompt). */
const newGame = (after: () => void) => handleNew('infinite', undefined, after);

const CHOICES: Choice[] = [
    { key: 'blank', title: 'Blank Game', sub: 'Start from scratch with the visual builder', icon: Gamepad2, run: () => newGame(() => toggleBehaviorsPanel(true)) },
    { key: 'pong', title: 'Pong', sub: 'Classic paddle & ball starter', icon: Sparkles, run: () => newGame(() => { buildPongExample(); toggleBehaviorsPanel(true); }) },
    { key: 'catch', title: 'Catch the Stars', sub: 'Move to catch falling things', icon: Sparkles, run: () => newGame(() => { buildCatchExample(); toggleBehaviorsPanel(true); }) },
    { key: 'platformer', title: 'Platformer', sub: 'Jump & run with gravity', icon: Sparkles, run: () => newGame(() => { buildPlatformerExample(); toggleBehaviorsPanel(true); }) },
    { key: 'code', title: 'Code (Advanced)', sub: 'Hand-write the game script yourself', icon: Code, run: () => newGame(() => { setGameAuthoringMode('code'); toggleGameScript(true); }) },
];

const NewGameDialog: Component = () => {
    const pick = (c: Choice) => { setShowNewGame(false); c.run(); };
    return (
        <Show when={showNewGame()}>
            <Portal>
                <div class="ng-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNewGame(false); }}>
                    <div class="ng-modal" onClick={(e) => e.stopPropagation()}>
                        <div class="ng-header">
                            <h2>New Game</h2>
                            <button class="ng-close" onClick={() => setShowNewGame(false)}><X size={18} /></button>
                        </div>
                        <p class="ng-lead">Pick how you'd like to start. You can switch views (Simple · Graph · Blueprint · Code) any time.</p>
                        <div class="ng-grid">
                            <For each={CHOICES}>
                                {(c) => (
                                    <button class={`ng-card ng-${c.key}`} onClick={() => pick(c)}>
                                        <span class="ng-card-icon"><c.icon size={22} /></span>
                                        <span class="ng-card-title">{c.title}</span>
                                        <span class="ng-card-sub">{c.sub}</span>
                                    </button>
                                )}
                            </For>
                        </div>
                    </div>
                </div>
            </Portal>
        </Show>
    );
};

export default NewGameDialog;
