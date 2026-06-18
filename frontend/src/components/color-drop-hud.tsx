import { type Component, Show } from 'solid-js';
import { colorDropState } from '../utils/color-drop';

/**
 * Floating chip that follows the finger during a touch/pen ColorDrop drag,
 * so you can see which colour you're about to drop and where.
 */
export const ColorDropHud: Component = () => {
    return (
        <Show when={colorDropState().active}>
            <div
                style={{
                    position: 'fixed',
                    left: `${colorDropState().x}px`,
                    top: `${colorDropState().y}px`,
                    width: '34px',
                    height: '34px',
                    transform: 'translate(-50%, -50%)',
                    background: colorDropState().color === 'transparent' ? 'white' : colorDropState().color,
                    'border-radius': '8px',
                    border: '2px solid white',
                    'box-shadow': '0 2px 8px rgba(0,0,0,0.35)',
                    'pointer-events': 'none',
                    'z-index': 100000,
                }}
            />
        </Show>
    );
};
