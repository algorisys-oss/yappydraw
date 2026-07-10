import { type Component, For, Show, createSignal, createMemo } from 'solid-js';
import { store } from '../store/app-store';
import { isPanelOpen } from '../store/dock-layout';
import {
    listBrandKits, saveBrandKit, deleteBrandKit, createBrandKit,
    extractBrandColorsFromDocument, applyBrandKit,
} from '../brand/brand-kits';
import type { BrandKit, BrandColors } from '../types/brand-types';
import { customFontOptions } from '../utils/custom-fonts';
import { YappyAPI } from '../api';
import { showToast } from './toast';
import { Plus, Trash2, Wand2, Upload, ImagePlus } from 'lucide-solid';
import './brand-kit-panel.css';

const COLOR_ROLES: { key: keyof BrandColors; label: string }[] = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' },
    { key: 'background', label: 'Background' },
    { key: 'text', label: 'Text' },
];

const BUILTIN_FONTS = [
    { value: 'poppins', label: 'Poppins' },
    { value: 'sans-serif', label: 'Sans Serif' },
    { value: 'serif', label: 'Serif' },
    { value: 'monospace', label: 'Monospace' },
    { value: 'hand-drawn', label: 'Hand Drawn' },
    { value: 'marker', label: 'Marker' },
    { value: 'caveat', label: 'Caveat' },
    { value: 'code', label: 'Code' },
];

/** Brand Kit panel: manage saved kits (colors, fonts, logo) and apply
 *  a kit to the whole document (luminance-matched recolor + refont). */
const BrandKitPanel: Component = () => {
    const [version, setVersion] = createSignal(0);
    // Re-read on every open (localStorage isn't reactive — kits may have been
    // created via the API or another panel since this memo last ran)
    const kits = createMemo(() => { version(); isPanelOpen('brandKit'); return listBrandKits(); });
    const [activeId, setActiveId] = createSignal<string | null>(null);
    let logoInputRef: HTMLInputElement | undefined;

    const active = createMemo(() => kits().find(k => k.id === activeId()) || kits()[0] || null);

    const fontOptions = createMemo(() => {
        const custom = customFontOptions();
        const seen = new Set(BUILTIN_FONTS.map(f => f.value));
        return [...BUILTIN_FONTS, ...custom.filter(f => !seen.has(f.value))];
    });

    const mutate = (fn: (kit: BrandKit) => void) => {
        const kit = active();
        if (!kit) return;
        const next = JSON.parse(JSON.stringify(kit)) as BrandKit;
        fn(next);
        saveBrandKit(next);
        setVersion(v => v + 1);
        setActiveId(next.id);
    };

    const handleNew = (fromDocument: boolean) => {
        const kit = createBrandKit(fromDocument ? { name: 'From Document', colors: extractBrandColorsFromDocument() } : undefined);
        saveBrandKit(kit);
        setVersion(v => v + 1);
        setActiveId(kit.id);
    };

    const handleDelete = () => {
        const kit = active();
        if (!kit) return;
        if (!confirm(`Delete brand kit "${kit.name}"?`)) return;
        deleteBrandKit(kit.id);
        setVersion(v => v + 1);
        setActiveId(null);
    };

    const handleLogoUpload = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => mutate(k => { k.logo = String(reader.result); });
        reader.readAsDataURL(file);
        (e.target as HTMLInputElement).value = '';
    };

    const handleInsertLogo = () => {
        const kit = active();
        if (!kit?.logo) { showToast('Upload a logo first', 'info'); return; }
        const img = new Image();
        img.onload = () => {
            const page = store.slides[store.activeSlideIndex];
            const baseX = page ? page.spatialPosition.x + 60 : 60;
            const baseY = page ? page.spatialPosition.y + 60 : 60;
            const maxW = 300;
            const scale = Math.min(1, maxW / img.width);
            YappyAPI.createImage(baseX, baseY, kit.logo!, Math.round(img.width * scale), Math.round(img.height * scale));
            showToast('Logo inserted', 'success');
        };
        img.src = kit.logo;
    };

    return (
        <div class="brand-panel-body">
            <div class="bk-toolbar">
                <button class="bk-icon-btn" title="New kit from document colors" onClick={() => handleNew(true)}><Wand2 size={15} /> From doc</button>
                <button class="bk-icon-btn" title="New blank kit" onClick={() => handleNew(false)}><Plus size={15} /> Blank</button>
            </div>
            <Show when={active()} fallback={
                <div class="bk-empty">No brand kits yet.<br />Use the wand to extract one from this document, or + for a blank kit.</div>
            }>
                {(kit) => (
                    <>
                                <div class="bk-row">
                                    <select class="bk-select" onChange={(e) => setActiveId(e.currentTarget.value)}>
                                        <For each={kits()}>{(k) => <option value={k.id} selected={k.id === kit().id}>{k.name}</option>}</For>
                                    </select>
                                    <button class="bk-icon-btn" title="Delete kit" onClick={handleDelete}><Trash2 size={14} /></button>
                                </div>
                                <input class="bk-name" value={kit().name} title="Kit name"
                                    onChange={(e) => mutate(k => { k.name = e.currentTarget.value; })} />

                                <div class="bk-section">Colors</div>
                                <For each={COLOR_ROLES}>
                                    {(role) => (
                                        <div class="bk-row">
                                            <input type="color" class="bk-color" value={kit().colors[role.key]}
                                                onInput={(e) => mutate(k => { k.colors[role.key] = e.currentTarget.value; })} />
                                            <span class="bk-role">{role.label}</span>
                                            <span class="bk-hex">{kit().colors[role.key]}</span>
                                        </div>
                                    )}
                                </For>

                                <div class="bk-section">Fonts</div>
                                <div class="bk-row">
                                    <span class="bk-role">Heading</span>
                                    <select class="bk-select"
                                        onChange={(e) => mutate(k => { k.fonts.heading = e.currentTarget.value; })}>
                                        <For each={fontOptions()}>{(f) => <option value={f.value} selected={f.value === kit().fonts.heading}>{f.label}</option>}</For>
                                    </select>
                                </div>
                                <div class="bk-row">
                                    <span class="bk-role">Body</span>
                                    <select class="bk-select"
                                        onChange={(e) => mutate(k => { k.fonts.body = e.currentTarget.value; })}>
                                        <For each={fontOptions()}>{(f) => <option value={f.value} selected={f.value === kit().fonts.body}>{f.label}</option>}</For>
                                    </select>
                                </div>

                                <div class="bk-section">Logo</div>
                                <div class="bk-row">
                                    <Show when={kit().logo} fallback={<span class="bk-hex">No logo uploaded</span>}>
                                        <img class="bk-logo" src={kit().logo} alt="logo" />
                                    </Show>
                                    <div class="bk-logo-actions">
                                        <button class="bk-icon-btn" title="Upload logo" onClick={() => logoInputRef?.click()}><Upload size={14} /></button>
                                        <button class="bk-icon-btn" title="Insert logo on page" onClick={handleInsertLogo}><ImagePlus size={14} /></button>
                                    </div>
                                    <input ref={el => logoInputRef = el} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                                </div>

                                <button class="bk-apply" onClick={() => applyBrandKit(kit())}>Apply Brand to Document</button>
                            </>
                        )}
            </Show>
        </div>
    );
};

export default BrandKitPanel;
