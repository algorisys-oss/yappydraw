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
        b({ kind: 'hit', target: 'edge', edge: 'any' }, [{ kind: 'bounce' }, { kind: 'playSound', sound: 'blip' }]),
        b({ kind: 'hit', target: 'Paddle' }, [{ kind: 'bounce' }, { kind: 'score', delta: 1 }, { kind: 'playSound', sound: 'coin' }]),
        b({ kind: 'leaveScreen' }, [{ kind: 'playSound', sound: 'lose' }, { kind: 'gameOver', message: 'GAME OVER' }]),
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

/** Build a Platformer with actual gameplay: run & jump across floating platforms,
 *  collect the 3 coins, and reach the flag to win. Fall off the screen and it's
 *  game over. Platform gaps/heights are tuned to the jump arc (GRAV/JUMP) so every
 *  jump is makeable. */
export function buildPlatformerExample(): void {
    const page = store.slides[store.activeSlideIndex] || store.slides[0];
    const X = page ? page.spatialPosition.x : 0;
    const Y = page ? page.spatialPosition.y : 0;
    const W = page ? page.dimensions.width : 800;
    const H = page ? page.dimensions.height : 600;
    const G = Y + H - 40;                          // ground top

    // Platforms the hero must traverse (each a distinct tag so it can be landed on).
    const ground = mk('rectangle', X, G, W, 40, 'Ground', '#334155', []);
    const p1 = mk('rectangle', X + 170, Y + 430, 120, 20, 'P1', '#64748b', []);
    const p2 = mk('rectangle', X + 350, Y + 320, 120, 20, 'P2', '#64748b', []);
    const p3 = mk('rectangle', X + 560, Y + 380, 190, 20, 'P3', '#64748b', []);

    // Collectibles + goal flag (unique tags — hit-detection resolves one per tag).
    const coin1 = mk('circle', X + 216, Y + 372, 26, 26, 'Coin1', '#fbbf24', []);
    const coin2 = mk('circle', X + 396, Y + 262, 26, 26, 'Coin2', '#fbbf24', []);
    const coin3 = mk('circle', X + 612, Y + 322, 26, 26, 'Coin3', '#fbbf24', []);
    const flag = mk('triangle', X + 700, Y + 336, 34, 44, 'Goal', '#ef4444', []);

    const grab = (coin: string) => b({ kind: 'hit', target: coin }, [
        { kind: 'score', delta: 100 }, { kind: 'destroy', target: coin }, { kind: 'playSound', sound: 'coin' },
    ]);

    const hero = mk('rectangle', X + 40, Y + 80, 40, 44, 'Hero', '#22c55e', [
        b({ kind: 'start' }, [{ kind: 'gravity', on: true }]),
        b({ kind: 'keyHold', button: 'left' }, [{ kind: 'moveDir', dir: 'left', speed: 'medium' }]),
        b({ kind: 'keyHold', button: 'right' }, [{ kind: 'moveDir', dir: 'right', speed: 'medium' }]),
        b({ kind: 'keyPress', button: 'a' }, [{ kind: 'jump', strength: 'medium' }, { kind: 'playSound', sound: 'jump' }]),
        // land on the ground and every platform
        b({ kind: 'touching', target: 'Ground' }, [{ kind: 'land' }]),
        b({ kind: 'touching', target: 'P1' }, [{ kind: 'land' }]),
        b({ kind: 'touching', target: 'P2' }, [{ kind: 'land' }]),
        b({ kind: 'touching', target: 'P3' }, [{ kind: 'land' }]),
        // collect coins, reach the flag to win, fall off to lose
        grab('Coin1'), grab('Coin2'), grab('Coin3'),
        b({ kind: 'hit', target: 'Goal' }, [{ kind: 'playSound', sound: 'win' }, { kind: 'win', message: 'YOU WIN!' }]),
        b({ kind: 'leaveScreen' }, [{ kind: 'playSound', sound: 'lose' }, { kind: 'gameOver', message: 'FELL OFF!' }]),
    ]);

    pushToHistory();
    setStore('elements', prev => [...prev, ground, p1, p2, p3, coin1, coin2, coin3, flag, hero]);
    setStore('selection', [hero.id]);
    setSceneBehaviors([]);
    bumpDirtyRevision();
}
