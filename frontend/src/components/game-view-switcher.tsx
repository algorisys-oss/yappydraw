/**
 * GameViewSwitcher — a segmented control shared by the three game editors
 * (Behaviors panel = "Simple", Game Graph = "Graph", Blueprint = "Blueprint").
 *
 * They are three views of ONE model (behaviors + blueprints + gameVars), so this
 * lets you hop between them in a click and makes them read as one tool. Each
 * button opens its view and closes the others.
 */

import { type Component } from 'solid-js';
import { Gamepad2, Grid2x2, Workflow } from 'lucide-solid';
import { toggleBehaviorsPanel, toggleGameGraph, toggleBlueprint } from '../store/app-store';
import './game-view-switcher.css';

export type GameView = 'simple' | 'graph' | 'blueprint';

const show = (v: GameView) => {
    toggleBehaviorsPanel(v === 'simple');
    toggleGameGraph(v === 'graph');
    toggleBlueprint(v === 'blueprint');
};

export const GameViewSwitcher: Component<{ current: GameView }> = (p) => (
    <div class="gvs" role="tablist" aria-label="Game editor view">
        <button class="gvs-btn" classList={{ active: p.current === 'simple' }} title="Simple builder (rule list)"
            onClick={() => show('simple')}><Gamepad2 size={13} /> Simple</button>
        <button class="gvs-btn" classList={{ active: p.current === 'graph' }} title="Node graph (rules + message/flow wires)"
            onClick={() => show('graph')}><Grid2x2 size={13} /> Graph</button>
        <button class="gvs-btn" classList={{ active: p.current === 'blueprint' }} title="Blueprint (execution flow)"
            onClick={() => show('blueprint')}><Workflow size={13} /> Blueprint</button>
    </div>
);

export default GameViewSwitcher;
