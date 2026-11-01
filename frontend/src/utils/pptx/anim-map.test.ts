import { describe, it, expect } from "bun:test";
import { toDeckAnim, fromDeckAnim, startOf, effectOf, sideOf } from "./anim-map";

const preset = (name: string, extra: any = {}) => ({ id: 'a', type: 'preset', name, trigger: 'on-click', duration: 700, delay: 100, easing: 'easeOutQuad', ...extra }) as any;

describe("toDeckAnim", () => {
    it("maps entrances, exits and emphasis to PowerPoint presets with the right side", () => {
        expect(toDeckAnim(preset('fadeIn'), 5, 'click')).toEqual(expect.objectContaining({ cls: 'entr', effect: 'fade', presetId: 10, target: 5, durationMs: 700, delayMs: 100 }));
        expect(toDeckAnim(preset('slideInLeft'), 5, 'click')).toEqual(expect.objectContaining({ cls: 'entr', effect: 'fly', dir: 'l', presetId: 2, subtype: 8 }));
        expect(toDeckAnim(preset('slideInUp'), 5, 'click')).toEqual(expect.objectContaining({ effect: 'fly', dir: 'b', subtype: 4 }));
        expect(toDeckAnim(preset('slideOutRight'), 5, 'click')).toEqual(expect.objectContaining({ cls: 'exit', effect: 'fly', dir: 'r', subtype: 2 }));
        expect(toDeckAnim(preset('bounceIn'), 5, 'click')).toEqual(expect.objectContaining({ cls: 'entr', effect: 'bounce', presetId: 26 }));
        expect(toDeckAnim(preset('zoomOut'), 5, 'click')).toEqual(expect.objectContaining({ cls: 'exit', effect: 'zoom', presetId: 53 }));
        expect(toDeckAnim(preset('flipInX'), 5, 'click')).toEqual(expect.objectContaining({ effect: 'swivel', presetId: 45 }));
        expect(toDeckAnim(preset('pulse'), 5, 'click')).toEqual(expect.objectContaining({ cls: 'emph', effect: 'pulse', presetId: 26 }));
        expect(toDeckAnim(preset('shakeX'), 5, 'click')).toEqual(expect.objectContaining({ cls: 'emph', effect: 'teeter', presetId: 32 }));
        expect(toDeckAnim(preset('typewriter'), 5, 'click')).toEqual(expect.objectContaining({ cls: 'entr', effect: 'wipe', dir: 'l' }));
        expect(toDeckAnim(preset('fadeIn', { repeat: 2 }), 5, 'click')!.repeat).toBe(3);
    });
    it("spins, and leaves out what PowerPoint can't show", () => {
        expect(toDeckAnim({ id: 'r', type: 'rotate', toAngle: 90, trigger: 'on-click', duration: 500, delay: 0, easing: 'linear' } as any, 3, 'click'))
            .toEqual(expect.objectContaining({ cls: 'emph', effect: 'spin', presetId: 8, degrees: 90 }));
        expect(toDeckAnim({ id: 's', type: 'autoSpin', direction: 'counterclockwise', iterations: 'infinite', trigger: 'on-load', duration: 1000, delay: 0, easing: 'linear' } as any, 3, 'with'))
            .toEqual(expect.objectContaining({ effect: 'spin', degrees: -360, repeat: -1 }));
        expect(toDeckAnim({ id: 'p', type: 'path', trigger: 'on-click', duration: 1, delay: 0, easing: 'linear' } as any, 3, 'click')).toBeNull();
        expect(toDeckAnim({ id: 'k', type: 'keyframe', property: 'x', keyframes: [], trigger: 'on-click', duration: 1, delay: 0, easing: 'linear' } as any, 3, 'click')).toBeNull();
        expect(startOf('on-hover')).toBeNull();
        expect(startOf('on-load')).toBe('with');
    });
});

describe("fromDeckAnim", () => {
    it("reads PowerPoint effects back as Yappy presets, hiding entrances until they play", () => {
        const fly = fromDeckAnim({ target: 1, cls: 'entr', effect: 'fly', dir: 'l', presetId: 2, subtype: 8, start: 'click', durationMs: 500, delayMs: 0 }, 'x', false) as any;
        expect([fly.type, fly.name, fly.trigger, fly.startHidden]).toEqual(['preset', 'slideInLeft', 'on-click', true]);
        const out = fromDeckAnim({ target: 1, cls: 'exit', effect: 'fly', dir: 'r', presetId: 2, subtype: 2, start: 'after', durationMs: 500, delayMs: 0 }, 'y', false) as any;
        expect([out.name, out.trigger, out.startHidden]).toEqual(['slideOutRight', 'after-prev', undefined]);
        const spin = fromDeckAnim({ target: 1, cls: 'emph', effect: 'spin', presetId: 8, subtype: 0, start: 'with', durationMs: 2000, delayMs: 0, degrees: 180 }, 'z', true) as any;
        expect([spin.type, spin.toAngle, spin.trigger]).toEqual(['rotate', 180, 'on-load']);
        expect(effectOf('entr', 2)).toEqual({ effect: 'fly', known: true });
        expect(effectOf('entr', 999)).toEqual({ effect: 'fade', known: false });
        expect(sideOf(4)).toBe('b');
    });
    it("round-trips the common entrance and exit presets", () => {
        for (const name of ['fadeIn', 'slideInLeft', 'slideInRight', 'slideInUp', 'slideInDown', 'bounceIn', 'zoomIn', 'rotateIn', 'flipInY', 'drawIn',
            'fadeOut', 'slideOutLeft', 'slideOutRight', 'slideOutUp', 'slideOutDown', 'bounceOut', 'zoomOut', 'rotateOut', 'flipOutY', 'drawOut', 'pulse', 'shakeX', 'rubberBand']) {
            const d = toDeckAnim(preset(name), 1, 'click')!;
            expect((fromDeckAnim(d, 'id', false) as any).name).toBe(name);
        }
    });
});
