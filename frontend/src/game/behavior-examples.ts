/**
 * One-tap example games built entirely from blocks (no code) — the onboarding
 * for the visual builder. Each creates named sprites with behaviors on the
 * current page so the user can immediately Play, then tweak.
 */

import { store, setStore, setSceneBehaviors, pushToHistory, bumpDirtyRevision } from '../store/app-store';
import { newBehaviorId, type Behavior } from './behavior-types';
import type { DrawingElement } from '../types';

let _c = 0;
const mk = (type: string, x: number, y: number, w: number, h: number, tag: string, bg: string, behaviors: Behavior[]): DrawingElement => ({
    id: `game-ex-${Date.now()}-${++_c}`,
    type, x, y, width: w, height: h, tag,
    backgroundColor: bg, fillStyle: 'solid',
    strokeColor: 'transparent', strokeWidth: 0, strokeStyle: 'solid',
    opacity: 100, angle: 0, roughness: 0, renderStyle: 'architectural',
    locked: false, layerId: store.activeLayerId || 'default-layer',
    seed: 1, roundness: null, behaviors,
} as DrawingElement);

const b = (trigger: Behavior['trigger'], actions: Behavior['actions']): Behavior => ({ id: newBehaviorId(), trigger, actions });

/** Build a playable Pong from blocks on the active page. Returns the sprite ids. */
export function buildPongExample(): void {
    const page = store.slides[store.activeSlideIndex] || store.slides[0];
    const X = page ? page.spatialPosition.x : 0;
    const Y = page ? page.spatialPosition.y : 0;
    const W = page ? page.dimensions.width : 800;
    const H = page ? page.dimensions.height : 600;

    const paddle = mk('rectangle', X + W / 2 - 90, Y + H - 60, 180, 24, 'Paddle', '#111827', [
        b({ kind: 'keyHold', button: 'left' }, [{ kind: 'moveDir', dir: 'left', speed: 'fast' }]),
        b({ kind: 'keyHold', button: 'right' }, [{ kind: 'moveDir', dir: 'right', speed: 'fast' }]),
    ]);
    const ball = mk('circle', X + W / 2 - 16, Y + H / 2, 32, 32, 'Ball', '#dc2626', [
        b({ kind: 'start' }, [{ kind: 'glide', dir: 'upRight', speed: 'medium' }]),
        b({ kind: 'hit', target: 'edge', edge: 'any' }, [{ kind: 'bounce' }]),
        b({ kind: 'hit', target: 'Paddle' }, [{ kind: 'bounce' }, { kind: 'score', delta: 1 }]),
        b({ kind: 'leaveScreen' }, [{ kind: 'gameOver', message: 'GAME OVER' }]),
    ]);

    pushToHistory();
    // Append (non-destructive). Block games reference sprites by NAME (game.find)
    // and never spawn a paddle/ball, so there's no doubling — unlike the
    // spawn-based code templates.
    setStore('elements', prev => [...prev, paddle, ball]);
    setStore('selection', [ball.id]);
    setSceneBehaviors([b({ kind: 'start' }, [{ kind: 'score', delta: 0 }])]);
    bumpDirtyRevision();
}

/** Build a "Catch the star" game: a basket you steer, a star that respawns up top. */
export function buildCatchExample(): void {
    const page = store.slides[store.activeSlideIndex] || store.slides[0];
    const X = page ? page.spatialPosition.x : 0;
    const Y = page ? page.spatialPosition.y : 0;
    const W = page ? page.dimensions.width : 800;
    const H = page ? page.dimensions.height : 600;

    const basket = mk('rectangle', X + W / 2 - 70, Y + H - 70, 140, 34, 'Basket', '#92400e', [
        b({ kind: 'keyHold', button: 'left' }, [{ kind: 'moveDir', dir: 'left', speed: 'fast' }]),
        b({ kind: 'keyHold', button: 'right' }, [{ kind: 'moveDir', dir: 'right', speed: 'fast' }]),
    ]);
    const star = mk('star', X + W / 2 - 22, Y + 20, 44, 44, 'Star', '#f59e0b', [
        b({ kind: 'start' }, [{ kind: 'glide', dir: 'down', speed: 'medium' }]),
        // caught → +1 and jump back to a random spot up top (keeps falling)
        b({ kind: 'hit', target: 'Basket' }, [{ kind: 'score', delta: 1 }, { kind: 'moveTo', at: 'randomTop' }]),
        // missed → game over
        b({ kind: 'leaveScreen' }, [{ kind: 'gameOver', message: 'MISSED!' }]),
    ]);

    pushToHistory();
    setStore('elements', prev => [...prev, basket, star]);
    setStore('selection', [star.id]);
    setSceneBehaviors([b({ kind: 'start' }, [{ kind: 'score', delta: 0 }])]);
    bumpDirtyRevision();
}
