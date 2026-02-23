import { type Component, createSignal, For, Show } from 'solid-js';
import { getActiveCategories, getTemplatesByCategory } from '../templates/registry';
import type { Template, TemplateCategory } from '../types/template-types';
import './template-browser.css';

interface TemplateBrowserProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (template: Template) => void;
}

const TemplateBrowser: Component<TemplateBrowserProps> = (props) => {
    const categories = getActiveCategories();
    const [selectedCategory, setSelectedCategory] = createSignal<TemplateCategory>(
        categories[0]?.id || 'diagrams'
    );

    const templates = () => getTemplatesByCategory(selectedCategory());

    const handleSelect = (template: Template) => {
        props.onSelectTemplate(template);
        props.onClose();
    };

    return (
        <Show when={props.isOpen}>
            <div class="template-browser-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !window.getSelection()?.toString()) props.onClose(); }}>
                <div class="template-browser-dialog" onClick={(e) => e.stopPropagation()}>
                    <div class="template-browser-header">
                        <h2>Choose a Template</h2>
                        <button class="template-close-btn" onClick={props.onClose}>×</button>
                    </div>

                    {/* Category Tabs — hide when only one category */}
                    <Show when={categories.length > 1}>
                        <div class="template-categories">
                            <For each={categories}>
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
                            {(template) => (
                                template.dslContent ? (
                                    <div
                                        class="template-card template-card-dsl"
                                        onClick={() => handleSelect(template)}
                                    >
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
                                ) : (
                                    <div
                                        class="template-card"
                                        onClick={() => handleSelect(template)}
                                    >
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
                                )
                            )}
                        </For>
                    </div>

                    <Show when={templates().length === 0}>
                        <div class="template-empty">
                            <p>No templates available in this category</p>
                        </div>
                    </Show>
                </div>
            </div>
        </Show>
    );
};

export default TemplateBrowser;
