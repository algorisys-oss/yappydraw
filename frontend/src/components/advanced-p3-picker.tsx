import { type Component, createSignal, createEffect } from 'solid-js';
import { oklchToP3, formatOKLCH, isInP3Gamut, type OKLCH } from '../utils/color-utils';

interface Props {
    initialColor?: string;
    onSelect: (color: string) => void;
}

export const AdvancedP3Picker: Component<Props> = (props) => {
    const [oklch, setOklch] = createSignal<OKLCH>({ l: 0.8, c: 0.15, h: 200 });
    let canvasRef: HTMLCanvasElement | undefined;
    let hueSliderRef: HTMLDivElement | undefined;

    // Redraw the gamut triangle when Hue changes
    createEffect(() => {
        const h = oklch().h;
        if (!canvasRef) return;

        const ctx = canvasRef.getContext('2d', { colorSpace: 'display-p3' });
        if (!ctx) return;

        const width = canvasRef.width;
        const height = canvasRef.height;

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        // Draw a grid of Lightness (Y) and Chroma (X)
        // Lightness: 0 (bottom) to 1 (top)
        // Chroma: 0 (left) to 0.4 (right)
        for (let y = 0; y < height; y++) {
            const l = 1 - y / height;
            for (let x = 0; x < width; x++) {
                const c = (x / width) * 0.4;

                const rgb = oklchToP3({ l, c, h });
                const inGamut = isInP3Gamut(rgb);

                const idx = (y * width + x) * 4;
                if (inGamut) {
                    data[idx] = Math.round(rgb.r * 255);
                    data[idx + 1] = Math.round(rgb.g * 255);
                    data[idx + 2] = Math.round(rgb.b * 255);
                    data[idx + 3] = 255;
                } else {
                    // Out of gamut - show as dark gray checkerboard or similar
                    const checker = (Math.floor(x / 5) + Math.floor(y / 5)) % 2 === 0;
                    const gray = checker ? 30 : 20;
                    data[idx] = gray;
                    data[idx + 1] = gray;
                    data[idx + 2] = gray;
                    data[idx + 3] = 255;
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);

        // Draw selection marker
        const selX = (oklch().c / 0.4) * width;
        const selY = (1 - oklch().l) * height;

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(selX, selY, 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(selX, selY, 6, 0, Math.PI * 2);
        ctx.stroke();
    });

    const handleCanvasMouseDown = (e: MouseEvent) => {
        e.stopPropagation();
        const update = (ev: MouseEvent) => {
            if (!canvasRef) return;
            const rect = canvasRef.getBoundingClientRect();
            const x = Math.min(Math.max(ev.clientX - rect.left, 0), rect.width);
            const y = Math.min(Math.max(ev.clientY - rect.top, 0), rect.height);

            const l = 1 - y / rect.height;
            const c = (x / rect.width) * 0.4;
            setOklch(prev => ({ ...prev, l, c }));
            props.onSelect(formatOKLCH(oklch()));
        };

        update(e);
        const onMouseMove = (ev: MouseEvent) => update(ev);
        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const handleHueMouseDown = (e: MouseEvent) => {
        e.stopPropagation();
        const update = (ev: MouseEvent) => {
            if (!hueSliderRef) return;
            const rect = hueSliderRef.getBoundingClientRect();
            const x = Math.min(Math.max(ev.clientX - rect.left, 0), rect.width);
            const h = (x / rect.width) * 360;
            setOklch(prev => ({ ...prev, h }));
            props.onSelect(formatOKLCH(oklch()));
        };

        update(e);
        const onMouseMove = (ev: MouseEvent) => update(ev);
        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div style={{ padding: '8px', display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
                <canvas
                    ref={canvasRef}
                    width={200}
                    height={150}
                    onMouseDown={handleCanvasMouseDown}
                    style={{
                        width: '100%',
                        height: '150px',
                        cursor: 'crosshair',
                        'border-radius': '8px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        display: 'block'
                    }}
                />
            </div>

            <div
                ref={hueSliderRef}
                onMouseDown={handleHueMouseDown}
                style={{
                    height: '12px',
                    width: '100%',
                    'border-radius': '6px',
                    cursor: 'pointer',
                    position: 'relative',
                    background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: `${(oklch().h / 360) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '16px',
                        height: '16px',
                        background: 'white',
                        border: '2px solid black',
                        'border-radius': '50%',
                        'pointer-events': 'none'
                    }}
                />
            </div>

            <div style={{
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
                'font-size': '11px',
                'font-family': 'monospace',
                color: 'var(--text-secondary)'
            }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    background: formatOKLCH(oklch()),
                    'border-radius': '4px',
                    border: '1px solid rgba(0,0,0,0.1)'
                }} />
                <div>
                    <div>{formatOKLCH(oklch())}</div>
                </div>
            </div>
        </div>
    );
};
