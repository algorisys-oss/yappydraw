import { store } from "../../store/app-store";
import { animateElement, fadeIn } from "./element-animator";
import type { DisplayState } from "../../types/motion-types";

/**
 * MorphAnimator
 * Calculates differences between current canvas and a target DisplayState
 * and triggers smooth animations to transition between them.
 */
export class MorphAnimator {
    /**
     * Morph the current canvas to match the target DisplayState
     */
    static morphTo(target: DisplayState, duration: number = 800) {
        const currentElements = store.elements;
        const targetOverrides = target.overrides;

        // Element IDs from target state
        const targetIds = Object.keys(targetOverrides);

        // 1. Identify segments
        const sharedIds = currentElements.filter(el => targetIds.includes(el.id)).map(el => el.id);
        const enteringIds = targetIds.filter(id => !currentElements.some(el => el.id === id));

        // 2. Animate Shared Elements (The "Magic Move")
        sharedIds.forEach(id => {
            const targetProps = targetOverrides[id];
            if (!targetProps) return;

            animateElement(id, targetProps as any, {
                duration,
                easing: 'easeInOutQuad'
            });
        });

        // 3. Animate Entering Elements (Fade in)
        enteringIds.forEach(id => {
            const targetProps = targetOverrides[id];
            if (!targetProps) return;

            // Ensure opacity starts at 0 if it's "entering"
            fadeIn(id, duration);
            animateElement(id, targetProps as any, {
                duration,
                easing: 'easeInOutQuad'
            });
        });
    }
}
