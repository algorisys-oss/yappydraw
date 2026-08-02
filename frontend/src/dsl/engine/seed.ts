/**
 * Deterministic seed derivation for DSL renders.
 *
 * Sketch rendering feeds `element.seed` into rough.js, so an unseeded render
 * produces different geometry every time. That is fine when a human is drawing
 * and fatal for a batch pipeline: the same source has to yield the same SVG or
 * nothing downstream can cache it, diff it, or review it.
 *
 * Setting `meta.seed` on a diagram makes every element's seed a pure function of
 * (diagram seed, element key), so a render is reproducible without hand-writing a
 * seed on each node.
 */

/** rough.js seeds are read as positive 31-bit integers. */
const SEED_MAX = 2 ** 31;

/**
 * FNV-1a over the key, mixed with the diagram seed.
 *
 * Keyed by the element's DSL id rather than its index so that adding a node, or
 * reordering the source, does not reshuffle every other element's geometry.
 */
export function deriveSeed(diagramSeed: number, key: string): number {
    let h = (2166136261 ^ (diagramSeed >>> 0)) >>> 0;
    for (let i = 0; i < key.length; i++) {
        h = (h ^ key.charCodeAt(i)) >>> 0;
        h = Math.imul(h, 16777619) >>> 0;
    }
    // Avoid 0: rough.js treats a falsy seed as "unseeded" and randomises.
    return (h % (SEED_MAX - 1)) + 1;
}

/**
 * Resolve the seed for one element.
 *
 * Precedence: an explicit `style.seed` always wins, then a seed derived from
 * `meta.seed`, then `undefined` to let the API assign a random one.
 */
export function resolveSeed(
    diagramSeed: number | undefined,
    key: string,
    explicitSeed?: number
): number | undefined {
    if (typeof explicitSeed === 'number') return explicitSeed;
    if (typeof diagramSeed !== 'number') return undefined;
    return deriveSeed(diagramSeed, key);
}
