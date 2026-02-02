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
            <div class="template-browser-backdrop" onClick={props.onClose}>
                <div class="template-browser-dialog" onClick={(e) => e.stopPropagation()}>
                    <div class="template-browser-header">
                        <h2>Choose a Template</h2>
                        <button class="template-close-btn" onClick={props.onClose}>×</button>
                    </div>

                    {/* Category Tabs */}
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

                    {/* Template Grid */}
                    <div class="template-grid">
                        <For each={templates()}>
                            {(template) => (
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
