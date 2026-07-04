import { type Component, Show, For, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import { X } from "lucide-solid";
import { PAGE_SIZE_PRESETS, PAGE_PRESET_CATEGORIES, DEFAULT_DESIGN_PAGE_SIZE, type PageSizePreset } from "../config/page-size-presets";
import "./design-size-dialog.css";

export interface DesignSizeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called with the chosen page size; the caller creates the document. */
    onPick: (size: { width: number, height: number }) => void;
}

/**
 * "New Design" page-size picker: preset cards grouped by category plus a
 * custom width × height row. Preview boxes show the aspect ratio at a glance.
 */
const DesignSizeDialog: Component<DesignSizeDialogProps> = (props) => {
    const [customW, setCustomW] = createSignal(DEFAULT_DESIGN_PAGE_SIZE.width);
    const [customH, setCustomH] = createSignal(DEFAULT_DESIGN_PAGE_SIZE.height);

    const pick = (p: PageSizePreset) => {
        props.onPick({ width: p.width, height: p.height });
        props.onClose();
    };

    const pickCustom = () => {
        const w = Math.round(customW());
        const h = Math.round(customH());
        if (!Number.isFinite(w) || !Number.isFinite(h) || w < 16 || h < 16) return;
        props.onPick({ width: w, height: h });
        props.onClose();
    };

    // Aspect-ratio preview box, clamped so extreme ratios stay visible
    const previewStyle = (p: PageSizePreset) => {
        const ratio = p.width / p.height;
        const w = ratio >= 1 ? 44 : Math.max(16, 44 * ratio);
        const h = ratio >= 1 ? Math.max(16, 44 / ratio) : 44;
        return { width: `${w}px`, height: `${h}px` };
    };

    return (
        <Show when={props.isOpen}>
            <Portal>
                <div class="dsd-overlay" onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
                    onKeyDown={(e) => { if (e.key === 'Escape') props.onClose(); }}>
                    <div class="dsd-modal" onClick={(e) => e.stopPropagation()}>
                        <div class="dsd-header">
                            <h2>New Design</h2>
                            <button class="dsd-close" type="button" onClick={props.onClose}><X size={18} /></button>
                        </div>
                        <div class="dsd-body">
                            <For each={PAGE_PRESET_CATEGORIES}>
                                {(cat) => (
                                    <div class="dsd-category">
                                        <div class="dsd-category-label">{cat.label}</div>
                                        <div class="dsd-grid">
                                            <For each={PAGE_SIZE_PRESETS.filter(p => p.category === cat.id)}>
                                                {(p) => (
                                                    <button class="dsd-card" type="button" onClick={() => pick(p)}>
                                                        <div class="dsd-preview-wrap"><div class="dsd-preview" style={previewStyle(p)} /></div>
                                                        <div class="dsd-card-name">{p.name}</div>
                                                        <div class="dsd-card-size">{p.width} × {p.height}</div>
                                                    </button>
                                                )}
                                            </For>
                                        </div>
                                    </div>
                                )}
                            </For>
                            <div class="dsd-category">
                                <div class="dsd-category-label">Custom Size</div>
                                <div class="dsd-custom-row">
                                    <input type="number" min={16} max={20000} value={customW()}
                                        onInput={(e) => setCustomW(Number(e.currentTarget.value))} aria-label="Width (px)" />
                                    <span class="dsd-x">×</span>
                                    <input type="number" min={16} max={20000} value={customH()}
                                        onInput={(e) => setCustomH(Number(e.currentTarget.value))} aria-label="Height (px)" />
                                    <span class="dsd-unit">px</span>
                                    <button class="dsd-create" type="button" onClick={pickCustom}>Create</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Portal>
        </Show>
    );
};

export default DesignSizeDialog;
