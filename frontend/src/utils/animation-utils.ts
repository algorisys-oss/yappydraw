import type { DrawingElement } from '../types';


export interface AnimatedTransform {
    x: number;
    y: number;
    angle: number;
    opacity: number;
}

/**
 * Calculates the animated state of an element for a given time.
 * Handles nested dependencies (orbits) via recursion with cycle detection.
 * Respects Presentation Mode: returns static state if not in presentation mode.
 */
export const calculateAnimatedState = (
    el: DrawingElement,
    time: number,
    elementMap: Map<string, DrawingElement>,
    cache: Map<string, AnimatedTransform>,
    visited: Set<string> = new Set(),
    shouldAnimate: boolean = false
): AnimatedTransform => {
    // 0. Mode Check: REMOVED to allow static layout in Design Mode
    // We want orbits to calculate their position (spread out) even if time is stopped.
    // The "Animation Ticker" being stopped in Design Mode ensures they don't move.


    // 1. Check Cache
    if (cache.has(el.id)) {
        return cache.get(el.id)!;
    }

    // 2. Cycle Detection
    if (visited.has(el.id)) {
        // Break cycle: return static state
        return { x: el.x, y: el.y, angle: el.angle || 0, opacity: el.opacity || 100 };
    }
    visited.add(el.id);

    // 3. Start with static state
    let derivedX = el.x;
    let derivedY = el.y;
    let derivedAngle = el.angle || 0;

    // 4. Handle Orbit (Dependency)
    // Coerce values to numbers to prevent NaN propagation
    const orbitSpeed = el.orbitSpeed !== undefined ? Number(el.orbitSpeed) : 1;
    const orbitRadius = el.orbitRadius !== undefined ? Number(el.orbitRadius) : 150;

    if (el.orbitEnabled && el.orbitCenterId && !isNaN(orbitRadius) && !isNaN(orbitSpeed)) {
        const centerEl = elementMap.get(el.orbitCenterId);
        if (centerEl) {
            // Recursively get the center element's animated state
            const centerState = calculateAnimatedState(centerEl, time, elementMap, cache, visited, shouldAnimate);

            // Safety checks for center state
            const csX = Number(centerState.x) || 0;
            const csY = Number(centerState.y) || 0;
            const cW = Number(centerEl.width) || 0;
            const cH = Number(centerEl.height) || 0;

            const cx = csX + cW / 2;
            const cy = csY + cH / 2;

            // Only apply orbit offset if animating
            if (shouldAnimate) {
                // Speed factor: 1 speed = 1 radian per second
                const t = time * 0.001 * orbitSpeed;

                const orbX = cx + orbitRadius * Math.cos(t);
                const orbY = cy + orbitRadius * Math.sin(t);

                derivedX = orbX - (Number(el.width) || 0) / 2;
                derivedY = orbY - (Number(el.height) || 0) / 2;
            }
        }
    }

    // 5. Handle Spin (Independent)
    const spinSpeed = el.spinSpeed !== undefined ? Number(el.spinSpeed) : 5;
    if (el.spinEnabled && !isNaN(spinSpeed) && shouldAnimate) {
        // Match old speed: speed was in degrees per frame @ 60fps
        // (speed * 60) degrees per second = (speed * 60 * Math.PI / 180) radians per second
        // = (speed * Math.PI / 3) radians per second
        const t = time * 0.001;
        derivedAngle += t * (spinSpeed * Math.PI / 3);
    }

    // Final NaN guard
    if (isNaN(derivedX)) derivedX = el.x;
    if (isNaN(derivedY)) derivedY = el.y;
    if (isNaN(derivedAngle)) derivedAngle = el.angle || 0;

    const state = { x: derivedX, y: derivedY, angle: derivedAngle, opacity: el.opacity || 100 };

    // 6. Cache Result
    cache.set(el.id, state);
    visited.delete(el.id); // Valid recursion finished, remove from stack

    return state;
};

/**
 * Batch calculates animated states for all elements provided.
 */
export const calculateAllAnimatedStates = (
    elements: DrawingElement[],
    time: number,
    shouldAnimate: boolean = false
): Map<string, AnimatedTransform> => {
    const elementMap = new Map<string, DrawingElement>();
    elements.forEach(el => elementMap.set(el.id, el));

    const cache = new Map<string, AnimatedTransform>();
    const visited = new Set<string>();

    elements.forEach(el => {
        calculateAnimatedState(el, time, elementMap, cache, visited, shouldAnimate);
    });

    return cache;
};
