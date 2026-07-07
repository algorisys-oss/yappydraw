/**
 * New Game chooser — how to start a game, so its authoring mode is clear up front
 * rather than "make a doc, then find the script somewhere":
 *   Blank      → a fresh visual game (opens the Build editor)
 *   Starters   → Pong / Catch / Platformer example games (visual)
 *   Code       → a hand-written (code-authored) game (opens the Code view)
 *
 * A game IS a document; each option resets to a new doc and opens the right editor.
 */

import { type Component, For, Show, createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import { X, Gamepad2, Code, Sparkles, Target, Workflow } from 'lucide-solid';
import { toggleBehaviorsPanel, toggleGameScript, setGameAuthoringMode, setGameScript } from '../store/app-store';
import { buildPongExample, buildCatchExample, buildPlatformerExample } from '../game/behavior-examples';
import { buildBlueprintPlatformerExample, buildBlueprintBreakoutExample } from '../game/blueprint-examples';
import { GAME_TEMPLATES } from '../game/game-templates';
import { handleNew } from './menu';
import { showNewGame, setShowNewGame } from './new-game-signal';
import './new-game-dialog.css';

type Choice = { key: string; title: string; sub: string; icon: any; after: () => void; stage?: { w: number; h: number } };

const slingshotScript = () => GAME_TEMPLATES.find(t => t.id === 'slingshot')?.script ?? '';
const loadCodeGame = (script: string) => { setGameScript(script); setGameAuthoringMode('code'); toggleGameScript(true); };

/** Stage presets — the game's play window (its page). game.width/height bind to this. */
const STAGES: { key: string; label: string; w: number; h: number }[] = [
    { key: 'landscape', label: 'Landscape', w: 800, h: 600 },
    { key: 'wide', label: 'Wide 16:9', w: 1280, h: 720 },
    { key: 'portrait', label: 'Portrait', w: 540, h: 960 },
    { key: 'square', label: 'Square', w: 720, h: 720 },
];

const CHOICES: Choice[] = [
    { key: 'blank', title: 'Blank Game', sub: 'Start from scratch with the visual builder', icon: Gamepad2, after: () => toggleBehaviorsPanel(true) },
    { key: 'pong', title: 'Pong', sub: 'Classic paddle & ball starter', icon: Sparkles, after: () => { buildPongExample(); toggleBehaviorsPanel(true); } },
    { key: 'catch', title: 'Catch the Stars', sub: 'Move to catch falling things', icon: Sparkles, after: () => { buildCatchExample(); toggleBehaviorsPanel(true); } },
    { key: 'platformer', title: 'Platformer', sub: 'Jump & run with gravity', icon: Sparkles, after: () => { buildPlatformerExample(); toggleBehaviorsPanel(true); } },
    { key: 'slingshot', title: 'Slingshot', sub: 'Angry-Birds-style — drag & fire (code)', icon: Target, stage: { w: 1280, h: 720 }, after: () => loadCodeGame(slingshotScript()) },
    { key: 'bp-platformer', title: 'Platformer · Blueprint', sub: 'The platformer, wired in the Blueprint editor', icon: Workflow, after: () => buildBlueprintPlatformerExample() },
    { key: 'bp-breakout', title: 'Breakout · Blueprint', sub: 'Smash the bricks — Blueprint + variables', icon: Workflow, after: () => buildBlueprintBreakoutExample() },
    { key: 'code', title: 'Code (Advanced)', sub: 'Hand-write the game script yourself', icon: Code, after: () => { setGameAuthoringMode('code'); toggleGameScript(true); } },
];

const NewGameDialog: Component = () => {
    const [stage, setStage] = createSignal(STAGES[0]);
    const pick = (c: Choice) => {
        setShowNewGame(false);
        const s = c.stage ?? stage();
        // A game is a single-stage paged doc — the page is the fixed play window,
        // without the multi-page slide/present chrome (docType 'game').
        handleNew('game', { width: s.w, height: s.h }, c.after);
    };
    return (
        <Show when={showNewGame()}>
            <Portal>
                <div class="ng-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNewGame(false); }}>
                    <div class="ng-modal" onClick={(e) => e.stopPropagation()}>
                        <div class="ng-header">
                            <h2>New Game</h2>
                            <button class="ng-close" onClick={() => setShowNewGame(false)}><X size={18} /></button>
                        </div>
                        <p class="ng-lead">Pick a stage size and a starting point. You can switch views (Simple · Graph · Blueprint · Code) any time.</p>
                        <div class="ng-stage-row">
                            <span class="ng-stage-label">Stage</span>
                            <div class="ng-stage-chips">
                                <For each={STAGES}>
                                    {(s) => (
                                        <button class="ng-stage-chip" classList={{ active: stage().key === s.key }} onClick={() => setStage(s)}>
                                            {s.label} <span class="ng-stage-dim">{s.w}×{s.h}</span>
                                        </button>
                                    )}
                                </For>
                            </div>
                        </div>
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
