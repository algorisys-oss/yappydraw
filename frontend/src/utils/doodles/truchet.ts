/**
 * Truchet — a grid of square tiles, each carrying arcs (or chords) around two opposite
 * corners, rotated at random. Neighbouring tiles' lines meet on the shared edge, so the
 * whole field reads as a few long woven lines rather than a grid of stamps.
 *
 * With several lines per tile the radii are spread symmetrically about s/2. That is the
 * condition for continuity: a tile's top edge is crossed at r (arcs about the top-left
 * corner) or at s − r (about the top-right one), and the tile above crosses it at the
 * mirror of whichever it chose. Only a radius set equal to its own mirror {s − r} lines
 * up for every combination. The spread is capped at ±0.19 s so the largest arcs about
 * two opposite corners (together < s√2) never cross each other.
 */
import type { PathAnchor } from '../../types';
import type { DoodleLayer, DoodleParams, DoodleRegion } from './index';
import { quarterArc } from './curves';
import { chainSegments } from './curves';
import type { Rng } from './rng';

const HALF_PI = Math.PI / 2;

export function buildTruchet(region: DoodleRegion, p: DoodleParams, rng: Rng): DoodleLayer[] {
    const s = p.tileSize as number;
    const n = p.lines as number;
    const style = p.style as 'arcs' | 'diagonal' | 'mixed';
    const shade = p.shade as boolean;

    const cols = Math.floor(region.width / s), rows = Math.floor(region.height / s);
    if (cols < 1 || rows < 1) return [];
    // Whole tiles only, centred — a clipped tile would leave loose line ends on the edge.
    const ox = region.x + (region.width - cols * s) / 2;
    const oy = region.y + (region.height - rows * s) / 2;

    const radii = n === 1
        ? [s / 2]
        : Array.from({ length: n }, (_, j) => s / 2 + (j - (n - 1) / 2) * (0.38 * s / (n - 1)));
    const rMin = radii[0];

    const ink: PathAnchor[][] = [];
    const fills: [PathAnchor[][], PathAnchor[][]] = [[], []];

    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            const tx = ox + i * s, ty = oy + j * s;
            const flip = rng() < 0.5;
            const curved = style === 'arcs' || (style === 'mixed' && rng() < 0.5);
            // Two opposite corners, each with the angle its arcs sweep from (y points down).
            const corners: { cx: number; cy: number; a0: number; lat: number }[] = flip
                ? [{ cx: tx + s, cy: ty, a0: HALF_PI, lat: i + 1 + j }, { cx: tx, cy: ty + s, a0: 3 * HALF_PI, lat: i + j + 1 }]
                : [{ cx: tx, cy: ty, a0: 0, lat: i + j }, { cx: tx + s, cy: ty + s, a0: Math.PI, lat: i + j + 2 }];

            for (const c of corners) {
                const a1 = c.a0 + HALF_PI;
                for (const r of radii) {
                    if (curved) {
                        ink.push(quarterArc(c.cx, c.cy, r, c.a0, a1));
                    } else {
                        ink.push([
                            { x: c.cx + r * Math.cos(c.a0), y: c.cy + r * Math.sin(c.a0), kind: 'corner' },
                            { x: c.cx + r * Math.cos(a1), y: c.cy + r * Math.sin(a1), kind: 'corner' },
                        ]);
                    }
                }
                if (shade) {
                    // Colour by lattice-point parity, so the four quarters that meet at a
                    // tile corner always agree and read as one dot.
                    const centre: PathAnchor = { x: c.cx, y: c.cy, kind: 'corner' };
                    const edge = curved
                        ? quarterArc(c.cx, c.cy, rMin, c.a0, a1)
                        : [
                            { x: c.cx + rMin * Math.cos(c.a0), y: c.cy + rMin * Math.sin(c.a0), kind: 'corner' as const },
                            { x: c.cx + rMin * Math.cos(a1), y: c.cy + rMin * Math.sin(a1), kind: 'corner' as const },
                        ];
                    fills[c.lat & 1].push([centre, ...edge]);
                }
            }
        }
    }

    const layers: DoodleLayer[] = [];
    if (shade) {
        layers.push({ role: 'fill1', subpaths: fills[0].map(anchors => ({ anchors, closed: true })) });
        layers.push({ role: 'fill2', subpaths: fills[1].map(anchors => ({ anchors, closed: true })) });
    }
    layers.push({ role: 'ink', subpaths: chainSegments(ink) });
    return layers;
}
