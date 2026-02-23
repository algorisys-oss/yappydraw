import type { DrawingElement } from "../types";

export interface SpacingGuide {
    type: 'gap';
    orientation: 'horizontal' | 'vertical'; // Horizontal = Gap is along X axis (Vertical bars)
    gap: number;
    start: number; // Start coordinate of the gap set (e.g., left edge of first el)
    variableCoordinate: number; // The coordinate perp to orientation (e.g., Y center) to draw the arrows
    elements: string[]; // IDs of elements involved (usually 3: Left, Mid, Right)
    segments: { from: number, to: number }[]; // For drawing the arrows: [Start->Mid], [Mid->End]
}

export interface SpacingResult {
    dx: number;
    dy: number;
    guides: SpacingGuide[];
}

export const getSpacingGuides = (
    activeIds: string[],
    allElements: DrawingElement[],
    dx: number,
    dy: number,
    threshold: number
): SpacingResult => {
    // Basic setup similar to objectSnapping
    const activeElements = allElements.filter(el => activeIds.includes(el.id));
    if (activeElements.length === 0) return { dx, dy, guides: [] };

    // Bounding Box of moving group
    let activeBounds = {
        minX: Math.min(...activeElements.map(el => el.x)) + dx,
        maxX: Math.max(...activeElements.map(el => el.x + el.width)) + dx,
        minY: Math.min(...activeElements.map(el => el.y)) + dy,
        maxY: Math.max(...activeElements.map(el => el.y + el.height)) + dy,
        centerX: 0,
        centerY: 0
    };
    activeBounds.centerX = (activeBounds.minX + activeBounds.maxX) / 2;
    activeBounds.centerY = (activeBounds.minY + activeBounds.maxY) / 2;

    const others = allElements.filter(el =>
        !activeIds.includes(el.id) &&
        el.layerId === activeElements[0].layerId
    ).map(el => ({
        ...el,
        minX: el.x,
        maxX: el.x + el.width,
        minY: el.y,
        maxY: el.y + el.height,
        centerX: el.x + el.width / 2,
        centerY: el.y + el.height / 2
    }));

    if (others.length < 2) return { dx, dy, guides: [] };

    let bestDx = 0;
    let bestDy = 0;
    let minDistX = threshold + 1;
    let minDistY = threshold + 1;
    const foundGuides: SpacingGuide[] = [];

    // --- Horizontal Spacing (Gaps along X axis) ---
    // We look for logic:
    // 1. Moving element is MIDDLE:  Gap(Left, Moving) == Gap(Moving, Right)
    // 2. Moving element is RIGHT:   Gap(Left, Mid)    == Gap(Mid, Moving)
    // 3. Moving element is LEFT:    Gap(Moving, Mid)  == Gap(Mid, Right)

    // Helper to check horizontal overlap (so we don't snap elements that are far apart vertically)
    const isVerticallyOverlapping = (el1: any, el2: any) => {
        return Math.max(0, Math.min(el1.maxY, el2.maxY) - Math.max(el1.minY, el2.minY)) > 0;
    };

    // Sort others by X to simplify? Not necessarily, as Y matters.
    // Iterating pairs of others is O(N^2). If N is small (<100), it's fine.
    // Optimization: Filter by vertical overlap first.

    // Let's refine the search.
    // We treat the Active Bounds as one block "A".
    // We look for "B" and "C" in others.

    for (let i = 0; i < others.length; i++) {
        const B = others[i];
        if (!isVerticallyOverlapping(activeBounds, B)) continue;

        for (let j = i + 1; j < others.length; j++) {
            const C = others[j];
            if (!isVerticallyOverlapping(activeBounds, C)) continue;
            // Also B and C should overlap vertically? Ideally gaps are for aligned items.
            if (!isVerticallyOverlapping(B, C)) continue;

            // Sort A, B, C by X position
            // But A is moving, so A's X uses the proposed `dx`.
            // We verify geometric order: Left < Mid < Right.

            const pool = [
                { id: 'active', ...activeBounds },
                B,
                C
            ];
            pool.sort((p1, p2) => p1.minX - p2.minX);

            const [Left, Mid, Right] = pool;

            // Calculate gaps
            const gap1 = Mid.minX - Left.maxX;
            const gap2 = Right.minX - Mid.maxX;

            // We want gap1 == gap2
            // The error is abs(gap1 - gap2).
            // But we need to correct 'active'.
            // If active is Left:  gap1 needs adjustment.
            // If active is Mid:   gap1 and gap2 change.
            // If active is Right: gap2 needs adjustment.

            // Simplify: Target Gap = average or match other?
            // "Equal Spacing" implies we snap to make them equal.
            // Delta = gap2 - gap1.
            // We want Delta = 0.
            // Snap correction depends on who is 'active'.

            // correction: how much to move 'active' to make diff 0?

            let correction = 0;

            if (Left.id === 'active') {
                // Gap1 = Mid.minX - (active.maxX).
                // Gap2 is fixed (Right.minX - Mid.maxX).
                // We want Gap1 = Gap2.
                // active.maxX = Mid.minX - Gap2.
                // current active.maxX is known.
                // Move Active by: (Mid.minX - Gap2) - active.maxX
                correction = (Mid.minX - gap2) - Left.maxX;
            } else if (Mid.id === 'active') {
                // Gap1 = (active.minX) - Left.maxX
                // Gap2 = Right.minX - (active.maxX)
                // We want Gap1 = Gap2 -> active.minX - Left.maxX = Right.minX - active.maxX
                // active.minX + active.maxX = Left.maxX + Right.minX
                // 2 * active.centerX = Left.maxX + Right.minX
                // active.centerX = (Left.maxX + Right.minX) / 2
                // Correction = TargetCenterX - CurrentCenterX
                const targetCx = (Left.maxX + Right.minX) / 2;
                correction = targetCx - Mid.centerX;
            } else if (Right.id === 'active') {
                // Gap1 is fixed.
                // Gap2 = (active.minX) - Mid.maxX.
                // We want Gap2 = Gap1.
                // active.minX = Mid.maxX + Gap1.
                correction = (Mid.maxX + gap1) - Right.minX;
            }

            // Check threshold
            if (Math.abs(correction) < minDistX) {
                minDistX = Math.abs(correction);
                bestDx = correction;
            }

            // Store candidate guides to filter later by bestDx
            foundGuides.push({
                type: 'gap',
                orientation: 'horizontal',
                gap: (gap1 + gap2) / 2,
                start: Left.maxX,
                variableCoordinate: (Left.centerY + Mid.centerY + Right.centerY) / 3,
                elements: [Left.id, Mid.id, Right.id],
                segments: [
                    { from: Left.maxX, to: Mid.minX },
                    { from: Mid.maxX, to: Right.minX }
                ],
                // @ts-ignore
                _correction: correction
            });
        }
    }

    // --- Vertical Spacing (Gaps along Y axis) ---
    const isHorizontallyOverlapping = (el1: any, el2: any) => {
        return Math.max(0, Math.min(el1.maxX, el2.maxX) - Math.max(el1.minX, el2.minX)) > 0;
    };

    for (let i = 0; i < others.length; i++) {
        const B = others[i];
        if (!isHorizontallyOverlapping(activeBounds, B)) continue;

        for (let j = i + 1; j < others.length; j++) {
            const C = others[j];
            if (!isHorizontallyOverlapping(activeBounds, C)) continue;
            if (!isHorizontallyOverlapping(B, C)) continue;

            const pool = [
                { id: 'active', ...activeBounds },
                B,
                C
            ];
            pool.sort((p1, p2) => p1.minY - p2.minY); // Sort by Y

            const [Top, Mid, Bottom] = pool;

            const gap1 = Mid.minY - Top.maxY;
            const gap2 = Bottom.minY - Mid.maxY;

            let correction = 0;

            if (Top.id === 'active') {
                correction = (Mid.minY - gap2) - Top.maxY;
            } else if (Mid.id === 'active') {
                const targetCy = (Top.maxY + Bottom.minY) / 2;
                correction = targetCy - Mid.centerY;
            } else if (Bottom.id === 'active') {
                correction = (Mid.maxY + gap1) - Bottom.minY;
            }

            if (Math.abs(correction) < minDistY) {
                minDistY = Math.abs(correction);
                bestDy = correction;
            }

            foundGuides.push({
                type: 'gap',
                orientation: 'vertical',
                gap: (gap1 + gap2) / 2,
                start: Top.maxY,
                variableCoordinate: (Top.centerX + Mid.centerX + Bottom.centerX) / 3,
                elements: [Top.id, Mid.id, Bottom.id],
                segments: [
                    { from: Top.maxY, to: Mid.minY },
                    { from: Mid.maxY, to: Bottom.minY }
                ],
                // @ts-ignore
                _correction: correction
            });
        }
    }

    // Filter guides that match the FINAL bestDx/bestDy within threshold
    const finalDx = minDistX <= threshold ? bestDx : 0;
    const finalDy = minDistY <= threshold ? bestDy : 0;

    const validGuides = foundGuides.filter((g: any) => {
        if (g.orientation === 'horizontal') {
            return finalDx !== 0 && Math.abs(g._correction - finalDx) < 0.1;
        } else {
            return finalDy !== 0 && Math.abs(g._correction - finalDy) < 0.1;
        }
    });

    // Clean up temporary fields
    validGuides.forEach((g: any) => delete g._correction);

    return {
        dx: dx + finalDx,
        dy: dy + finalDy,
        guides: validGuides
    };
};
