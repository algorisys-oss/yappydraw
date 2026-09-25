/**
 * Read store data without the Solid proxy.
 *
 * Every property read through a store proxy goes through its `get` trap (and tracking),
 * which measured ~30x slower than a plain object read. That's invisible for a rectangle and
 * dominant for a path with thousands of anchors: walking a page-sized doodle through
 * proxies cost ~160 ms per frame (#400). `proxy[$RAW]` returns the underlying object in
 * O(1), and a store keeps its nested values raw, so everything below it is plain too.
 *
 * Use it only for READS that don't need to be reactive, such as rendering, hashing and
 * serialising. Never write through the result: a write that bypasses the proxy notifies
 * nobody.
 */
import { $RAW } from 'solid-js/store';

export function rawOf<T>(v: T): T {
    if (v !== null && typeof v === 'object') {
        const raw = (v as unknown as Record<symbol, unknown>)[$RAW];
        if (raw) return raw as T;
    }
    return v;
}
