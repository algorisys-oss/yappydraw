/**
 * GameViewSwitcher — a segmented control shared by the game editors. They are all
 * views of ONE game model (behaviors + blueprints + gameVars → a script):
 *   Simple    — the Behaviors panel (rule list)
 *   Graph     — the Game Graph (rules + message/flow wires)
 *   Blueprint — the Blueprint (execution flow)
 *   Code      — the game script (generated & read-only for visual games; the
 *               authored source once you "eject to code")
 * Each button opens its view and closes the others, so switching is instant.
 */

import { type Component } from 'solid-js';
import { Gamepad2, Grid2x2, Workflow, Code } from 'lucide-solid';
import { toggleBehaviorsPanel, toggleGameGraph, toggleBlueprint, toggleGameScript } from '../store/app-store';
import './game-view-switcher.css';

export type GameView = 'simple' | 'graph' | 'blueprint' | 'code';

const show = (v: GameView) => {
    toggleBehaviorsPanel(v === 'simple');
    toggleGameGraph(v === 'graph');
    toggleBlueprint(v === 'blueprint');
    toggleGameScript(v === 'code');
};

export const GameViewSwitcher: Component<{ current: GameView }> = (p) => (
    <div class="gvs" role="tablist" aria-label="Game editor view">
        <button class="gvs-btn" classList={{ active: p.current === 'simple' }} title="Simple builder (rule list)"
            onClick={() => show('simple')}><Gamepad2 size={13} /> Simple</button>
        <button class="gvs-btn" classList={{ active: p.current === 'graph' }} title="Node graph (rules + message/flow wires)"
            onClick={() => show('graph')}><Grid2x2 size={13} /> Graph</button>
        <button class="gvs-btn" classList={{ active: p.current === 'blueprint' }} title="Blueprint (execution flow)"
            onClick={() => show('blueprint')}><Workflow size={13} /> Blueprint</button>
        <button class="gvs-btn" classList={{ active: p.current === 'code' }} title="Code (the game script)"
            onClick={() => show('code')}><Code size={13} /> Code</button>
    </div>
);

export default GameViewSwitcher;
