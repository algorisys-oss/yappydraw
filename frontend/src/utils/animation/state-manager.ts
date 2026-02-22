import { store } from '../../store/app-store';
import type { DrawingElement } from '../../types';

type ElementState = Partial<DrawingElement>;
type SlideState = Map<string, ElementState>;

export class AnimationStateManager {

    /**
     * Capture the current state of all elements on the canvas
     */
    captureCurrentState(): SlideState {
        const state = new Map<string, ElementState>();
        store.elements.forEach(el => {
            state.set(el.id, { ...el });
        });
        return state;
    }

    /**
     * Placeholder for future transition logic
     */
    async transitionTo(): Promise<void> {
        // Implementation pending spatial canvas logic
    }
}

export const stateManager = new AnimationStateManager();
