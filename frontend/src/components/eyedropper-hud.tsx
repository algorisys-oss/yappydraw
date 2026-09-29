import { Show } from 'solid-js';
import { store } from '../store/app-store';
import { t } from '../i18n';
import './eyedropper-hud.css';

/**
 * Hover preview for the armed eyedropper: what a click at the cursor would pick, beside the
 * pointer. Colour mode shows the exact colour and its hex; style mode shows the fill and stroke it
 * would copy. The hint says how to put it down, since it now stays armed between picks.
 * Pointer-transparent, so it never blocks the click it is previewing.
 */
export const EyedropperHud = () => {
    const h = () => (store.eyedropper.active ? store.eyedropperHover : null);
    const isColor = () => store.eyedropper.mode === 'color';
    const pos = () => {
        const v = h()!;
        // Beside the cursor, flipped to the left/top near the window's right/bottom edge.
        const left = v.x + 190 > window.innerWidth ? v.x - 186 : v.x + 18;
        const top = v.y + 70 > window.innerHeight ? v.y - 64 : v.y + 18;
        return { left: `${left}px`, top: `${top}px` };
    };
    return (
        <Show when={h()}>
            <div class="edh" style={pos()} data-testid="eyedropper-hud">
                <div class="edh-row">
                    <Show when={h()!.fill || h()!.stroke} fallback={<span class="edh-none">{t('eyedropperHud.nothing')}</span>}>
                        <Show when={h()!.fill}>
                            <span class="edh-swatch" style={{ background: h()!.fill! }} title={t('eyedropperHud.fill')} />
                        </Show>
                        <Show when={!isColor() && h()!.stroke}>
                            <span class="edh-swatch edh-stroke" style={{ 'border-color': h()!.stroke! }} title={t('eyedropperHud.stroke')} />
                        </Show>
                        <span class="edh-hex" data-testid="eyedropper-hud-hex">{(h()!.fill ?? h()!.stroke ?? '').toUpperCase()}</span>
                    </Show>
                </div>
                <div class="edh-hint">{isColor() ? t('eyedropperHud.hintColor') : t('eyedropperHud.hintStyle')}</div>
            </div>
        </Show>
    );
};
