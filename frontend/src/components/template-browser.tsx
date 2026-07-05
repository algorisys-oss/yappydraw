import { type Component, createSignal, createMemo, createEffect, on, For, Show } from 'solid-js';
import { getActiveCategories, getTemplatesByCategory, searchTemplates, refreshUserTemplates } from '../templates/registry';
import { saveCurrentAsTemplate, deleteUserTemplate } from '../templates/user-templates';
import { showToast } from './toast';
import { store } from '../store/app-store';
import type { Template, TemplateCategory, PresentationTemplate, DesignTemplate } from '../types/template-types';
import './template-browser.css';

/** Check if a template is a multi-slide presentation */
function isPresentationTemplate(t: Template): t is PresentationTemplate & Template {
    return (t as any).slides?.length > 0;
}

/** Check if a template is a fixed-size design document */
function isDesignTemplate(t: Template): t is DesignTemplate & Template {
    return (t as any).pages?.length > 0 && !!(t as any).pageSize;
}

/** Check if a template is a user-saved document snapshot */
function isUserTemplate(t: Template): boolean {
    return !!(t as any).doc?.version;
}

interface TemplateBrowserProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (template: Template) => void;
}

const TemplateBrowser: Component<TemplateBrowserProps> = (props) => {
    // Bumped after save/delete so categories and templates recompute
    const [version, setVersion] = createSignal(0);
    const categories = createMemo(() => { version(); return getActiveCategories(); });
    // Design documents open on the Designs category — its templates match the workflow
    const [selectedCategory, setSelectedCategory] = createSignal<TemplateCategory>(
        store.docType === 'design' && getActiveCategories().some(c => c.id === 'designs')
            ? 'designs'
            : (getActiveCategories()[0]?.id || 'diagrams')
    );
    const [search, setSearch] = createSignal('');

    // Each time the browser opens: fresh search, and design docs land on Designs
    createEffect(on(() => props.isOpen, (open) => {
        if (!open) return;
        setSearch('');
        if (store.docType === 'design' && getActiveCategories().some(c => c.id === 'designs')) {
            setSelectedCategory('designs');
        }
    }, { defer: true }));

    /** Current design-page size, used to suggest templates that fit. */
    const currentPageSize = (): { width: number; height: number } | null => {
        if (store.docType !== 'design') return null;
        const s = store.slides[store.activeSlideIndex] || store.slides[0];
        return s ? { width: s.dimensions.width, height: s.dimensions.height } : null;
    };

    /** 'exact' = same pixel size, 'ratio' = same aspect ratio, null = no match. */
    const sizeMatch = (t: Template): 'exact' | 'ratio' | null => {
        const ps = currentPageSize();
        if (!ps) return null;
        const pageSize = (t as any).pageSize as { width: number; height: number } | undefined;
        if (!pageSize) return null;
        if (pageSize.width === ps.width && pageSize.height === ps.height) return 'exact';
        return Math.abs(pageSize.width / pageSize.height - ps.width / ps.height) < 0.02 ? 'ratio' : null;
    };

    const templates = createMemo(() => {
        version();
        const q = search().trim();
        let list = q ? searchTemplates(q) : getTemplatesByCategory(selectedCategory());
        // In a design doc, float size-matching templates to the top
        if (currentPageSize()) {
            const rank = (t: Template) => { const m = sizeMatch(t); return m === 'exact' ? 0 : m === 'ratio' ? 1 : 2; };
            list = [...list].sort((a, b) => rank(a) - rank(b));
        }
        return list;
    });

    const handleSelect = (template: Template) => {
        props.onSelectTemplate(template);
        props.onClose();
    };

    const handleSaveCurrent = () => {
        const name = prompt('Template name:', 'My Template');
        if (!name) return;
        const saved = saveCurrentAsTemplate(name.trim());
        if (saved) {
            refreshUserTemplates();
            setVersion(v => v + 1);
            setSelectedCategory('my-templates');
            showToast(`Saved "${saved.metadata.name}" to My Templates`, 'success');
        } else {
            showToast('Could not save template (storage full?)', 'error');
        }
    };

    const handleDeleteUser = (e: MouseEvent, template: Template) => {
        e.stopPropagation();
        if (!confirm(`Delete template "${template.metadata.name}"?`)) return;
        deleteUserTemplate(template.metadata.id);
        refreshUserTemplates();
        setVersion(v => v + 1);
        showToast('Template deleted', 'info');
    };

    /** Mini page preview style for design templates (aspect-ratio clamped). */
    const designPreviewStyle = (dt: DesignTemplate) => {
        const ratio = dt.pageSize.width / dt.pageSize.height;
        const w = ratio >= 1 ? 72 : Math.max(30, 72 * ratio);
        const h = ratio >= 1 ? Math.max(30, 72 / ratio) : 72;
        const page = dt.pages[0];
        const from = page?.gradientStops?.[0]?.color || page?.backgroundColor || '#e2e8f0';
        const to = page?.gradientStops?.[page.gradientStops.length - 1]?.color || from;
        return {
            width: `${w}px`, height: `${h}px`,
            background: from === to ? from : `linear-gradient(135deg, ${from}, ${to})`,
        };
    };

    return (
        <Show when={props.isOpen}>
            <div class="template-browser-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !window.getSelection()?.toString()) props.onClose(); }}>
                <div class="template-browser-dialog" onClick={(e) => e.stopPropagation()}>
                    <div class="template-browser-header">
                        <h2>Choose a Template</h2>
                        <div class="template-header-actions">
                            <button class="template-save-btn" onClick={handleSaveCurrent} title="Save the current document as a reusable template">
                                Save Current as Template
                            </button>
                            <button class="template-close-btn" onClick={props.onClose}>×</button>
                        </div>
                    </div>

                    {/* Search across all categories by name, description, or tag */}
                    <div class="template-search">
                        <input
                            type="text"
                            placeholder="Search templates… (name, tag, or description)"
                            value={search()}
                            onInput={(e) => setSearch(e.currentTarget.value)}
                        />
                        <Show when={search()}>
                            <button class="template-search-clear" title="Clear search" onClick={() => setSearch('')}>×</button>
                        </Show>
                    </div>

                    {/* Category Tabs — hidden while searching or when only one category */}
                    <Show when={!search().trim() && categories().length > 1}>
                        <div class="template-categories">
                            <For each={categories()}>
                                {(category) => (
                                    <button
                                        class={`template-category-tab ${selectedCategory() === category.id ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(category.id)}
                                    >
                                        {category.name}
                                    </button>
                                )}
                            </For>
                        </div>
                    </Show>

                    {/* Template Grid */}
                    <div class="template-grid">
                        <For each={templates()}>
                            {(template) => {
                                if (isUserTemplate(template)) {
                                    return (
                                        <div class="template-card" onClick={() => handleSelect(template)}>
                                            <div class="template-thumbnail">
                                                <Show when={template.metadata.thumbnail} fallback={
                                                    <div class="template-placeholder">
                                                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                                            <path d="M3 9h18" />
                                                        </svg>
                                                    </div>
                                                }>
                                                    <img src={template.metadata.thumbnail} alt={template.metadata.name} />
                                                </Show>
                                            </div>
                                            <div class="template-info">
                                                <div class="template-name-row">
                                                    <h3 class="template-name">{template.metadata.name}</h3>
                                                    <button class="template-delete-btn" title="Delete template" onClick={(e) => handleDeleteUser(e, template)}>×</button>
                                                </div>
                                                <p class="template-description">{template.metadata.description}</p>
                                            </div>
                                        </div>
                                    );
                                }

                                if (isDesignTemplate(template)) {
                                    const dt = template as unknown as DesignTemplate;
                                    return (
                                        <div class="template-card template-card-design" onClick={() => handleSelect(template)}>
                                            <div class="template-design-preview">
                                                <div class="template-design-page" style={designPreviewStyle(dt)} />
                                            </div>
                                            <div class="template-info">
                                                <div class="template-name-row">
                                                    <h3 class="template-name">{template.metadata.name}</h3>
                                                    <Show when={sizeMatch(template)}>
                                                        <span class="template-fit-badge" title={sizeMatch(template) === 'exact' ? 'Same size as your page' : 'Same aspect ratio as your page'}>
                                                            ✓ fits
                                                        </span>
                                                    </Show>
                                                    <span class="template-slide-badge">{dt.pageSize.width}×{dt.pageSize.height}</span>
                                                </div>
                                                <p class="template-description">{template.metadata.description}</p>
                                            </div>
                                        </div>
                                    );
                                }

                                if (isPresentationTemplate(template)) {
                                    const pt = template as unknown as PresentationTemplate;
                                    const pal = pt.palette;
                                    return (
                                        <div class="template-card template-card-presentation" onClick={() => handleSelect(template)}>
                                            <div class="template-slide-strip">
                                                <For each={pt.slides}>
                                                    {(slide) => (
                                                        <div
                                                            class="template-mini-slide"
                                                            style={{
                                                                background: slide.backgroundColor || pal?.background || '#ffffff',
                                                                'border-color': pal?.primary || '#ccc',
                                                            }}
                                                        >
                                                            <div class="template-mini-line" style={{ background: pal?.primary || '#333' }} />
                                                            <div class="template-mini-line short" style={{ background: (pal?.text || '#666') + '66' }} />
                                                        </div>
                                                    )}
                                                </For>
                                            </div>
                                            <div class="template-info">
                                                <div class="template-name-row">
                                                    <h3 class="template-name">{template.metadata.name}</h3>
                                                    <span class="template-slide-badge">{pt.slides.length} slides</span>
                                                </div>
                                                <p class="template-description">{template.metadata.description}</p>
                                            </div>
                                        </div>
                                    );
                                }

                                if (template.dslContent) {
                                    return (
                                        <div class="template-card template-card-dsl" onClick={() => handleSelect(template)}>
                                            <div class="template-dsl-header">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                    <line x1="8" y1="13" x2="16" y2="13" />
                                                    <line x1="8" y1="17" x2="12" y2="17" />
                                                </svg>
                                                <span class="template-dsl-badge">
                                                    {template.metadata.tags?.includes('mermaid') ? 'Mermaid' : 'YSL'}
                                                </span>
                                            </div>
                                            <h3 class="template-name">{template.metadata.name}</h3>
                                            <p class="template-description">{template.metadata.description}</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div class="template-card" onClick={() => handleSelect(template)}>
                                        <div class="template-thumbnail">
                                            <Show when={template.metadata.thumbnail} fallback={
                                                <div class="template-placeholder">
                                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                                        <path d="M3 9h18" />
                                                        <path d="M9 21V9" />
                                                    </svg>
                                                </div>
                                            }>
                                                <img src={template.metadata.thumbnail} alt={template.metadata.name} />
                                            </Show>
                                        </div>
                                        <div class="template-info">
                                            <h3 class="template-name">{template.metadata.name}</h3>
                                            <p class="template-description">{template.metadata.description}</p>
                                        </div>
                                    </div>
                                );
                            }}
                        </For>
                    </div>

                    <Show when={templates().length === 0}>
                        <div class="template-empty">
                            <p>{search().trim() ? `No templates match “${search().trim()}”` : 'No templates available in this category'}</p>
                        </div>
                    </Show>
                </div>
            </div>
        </Show>
    );
};

export default TemplateBrowser;
