/**
 * Examples/Showcase Page
 * Displays categorized templates demonstrating YappyDraw capabilities.
 */

import { type Component, createSignal, createEffect, For, Show } from 'solid-js';
import { parsePath, pathFor } from '../routes';
import { currentPath, navigate } from '../navigation';
import { exampleTemplates, exampleCategories as categories, type ExampleTemplate } from './templates';
import './examples-page.css';


/** Which template the URL asks for — `/examples/flow-chart/` → `flow-chart`. */
const templateFromPath = (): string | null => {
    const route = parsePath(currentPath());
    return route?.key === 'example' ? route.param ?? null : null;
};

export const ExamplesPage: Component = () => {
    const [selectedTemplate, setSelectedTemplate] = createSignal<string | null>(templateFromPath());
    const [searchQuery, setSearchQuery] = createSignal('');
    const [loading, setLoading] = createSignal(false);
    const [previewData, setPreviewData] = createSignal<any>(null);

    // The path decides which template is open — including on first render and on
    // back/forward, which used to need their own listener.
    createEffect(() => {
        const next = templateFromPath();
        setSelectedTemplate(next);
        if (next) loadPreview(next);
    });

    const loadPreview = async (templateId: string) => {
        const template = exampleTemplates.find(t => t.id === templateId);
        if (!template) return;

        setLoading(true);
        try {
            // Try static file first (works without backend server)
            const jsonFileName = template.fileName.replace(/\.yappy$/, '.json');
            const basePath = import.meta.env.BASE_URL || '/';
            const exampleUrl = `${basePath}examples/${jsonFileName}`.replace('//', '/');
            let response = await fetch(exampleUrl);

            // Fall back to API if static file not found
            if (!response.ok) {
                response = await fetch(`/api/drawings/${template.fileName.replace(/\.(json|yappy)$/i, '')}`);
            }

            if (response.ok) {
                const data = await response.json();
                setPreviewData(data);
            }
        } catch (e) {
            console.error('Failed to load template preview:', e);
        } finally {
            setLoading(false);
        }
    };

    // Navigate to a template preview
    const navigateToTemplate = (templateId: string) => {
        navigate(pathFor('example', templateId));
        setSelectedTemplate(templateId);
        loadPreview(templateId);
    };

    // Open template in the editor
    const openInEditor = (template: ExampleTemplate) => {
        // Path first, THEN the hash: `pushState` writes a whole URL, so setting
        // the path afterwards would drop the `load=` parameter it carries.
        navigate(pathFor('home'));
        window.location.hash = `load=${encodeURIComponent(template.fileName)}`;
    };

    const filteredTemplates = () => {
        const query = searchQuery().toLowerCase();
        if (!query) return exampleTemplates;
        return exampleTemplates.filter(t =>
            t.name.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            t.category.toLowerCase().includes(query)
        );
    };

    const currentTemplate = () => exampleTemplates.find(t => t.id === selectedTemplate());

    const handleBackToApp = () => {
        navigate(pathFor('home'));
    };

    return (
        <div class="examples-page">
            {/* Header */}
            <header class="examples-header">
                <div class="examples-header-left">
                    <button class="back-button" onClick={handleBackToApp}>
                        ← Back to Yappy
                    </button>
                    <h1 class="examples-title">Examples & Templates</h1>
                </div>
                <div class="examples-header-right">
                    <input
                        type="text"
                        class="search-input"
                        placeholder="Search examples..."
                        value={searchQuery()}
                        onInput={(e) => setSearchQuery(e.currentTarget.value)}
                    />
                </div>
            </header>

            <div class="examples-content">
                {/* Sidebar */}
                <aside class="examples-sidebar">
                    <nav class="template-nav">
                        <For each={categories}>
                            {(category) => (
                                <div class="nav-category">
                                    <h3 class="category-title">{category}</h3>
                                    <ul class="template-list">
                                        <For each={filteredTemplates().filter(t => t.category === category)}>
                                            {(template) => (
                                                <li
                                                    class={`template-item ${selectedTemplate() === template.id ? 'active' : ''}`}
                                                    onClick={() => navigateToTemplate(template.id)}
                                                >
                                                    <span class="template-icon">{template.icon}</span>
                                                    <span class="template-name">{template.name}</span>
                                                </li>
                                            )}
                                        </For>
                                    </ul>
                                </div>
                            )}
                        </For>
                    </nav>
                </aside>

                {/* Main content */}
                <main class="examples-main">
                    <Show when={selectedTemplate() && currentTemplate()} fallback={
                        <div class="examples-welcome">
                            <h2>Welcome to YappyDraw Examples</h2>
                            <p>Explore our collection of templates and examples to see what you can create with YappyDraw.</p>

                            <div class="category-overview">
                                <For each={categories}>
                                    {(category) => (
                                        <div class="category-card">
                                            <h3>{category}</h3>
                                            <ul>
                                                <For each={exampleTemplates.filter(t => t.category === category).slice(0, 3)}>
                                                    {(template) => (
                                                        <li onClick={() => navigateToTemplate(template.id)}>
                                                            <span class="template-icon">{template.icon}</span>
                                                            {template.name}
                                                        </li>
                                                    )}
                                                </For>
                                            </ul>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </div>
                    }>
                        <div class="template-detail">
                            <div class="template-header">
                                <div class="template-info">
                                    <span class="template-icon-large">{currentTemplate()!.icon}</span>
                                    <div>
                                        <h2>{currentTemplate()!.name}</h2>
                                        <p class="template-category">{currentTemplate()!.category}</p>
                                    </div>
                                </div>
                                <button
                                    class="open-button"
                                    onClick={() => openInEditor(currentTemplate()!)}
                                >
                                    Open in Editor →
                                </button>
                            </div>

                            <p class="template-description">{currentTemplate()!.description}</p>

                            <div class="template-preview">
                                <Show when={loading()}>
                                    <div class="preview-loading">Loading preview...</div>
                                </Show>
                                <Show when={!loading() && previewData()}>
                                    <div class="preview-info">
                                        <div class="preview-stat">
                                            <span class="stat-label">Elements</span>
                                            <span class="stat-value">{previewData()?.elements?.length || 0}</span>
                                        </div>
                                        <Show when={previewData()?.slides?.length > 0}>
                                            <div class="preview-stat">
                                                <span class="stat-label">Slides</span>
                                                <span class="stat-value">{previewData()?.slides?.length || 0}</span>
                                            </div>
                                        </Show>
                                        <Show when={previewData()?.layers?.length > 0}>
                                            <div class="preview-stat">
                                                <span class="stat-label">Layers</span>
                                                <span class="stat-value">{previewData()?.layers?.length || 0}</span>
                                            </div>
                                        </Show>
                                    </div>

                                    <div class="element-types">
                                        <h4>Element Types Used:</h4>
                                        <div class="type-tags">
                                            <For each={[...new Set((previewData()?.elements || []).map((e: any) => e.type))]}>
                                                {(type) => <span class="type-tag">{type as string}</span>}
                                            </For>
                                        </div>
                                    </div>
                                </Show>
                            </div>

                            <div class="template-actions">
                                <button
                                    class="action-button primary"
                                    onClick={() => openInEditor(currentTemplate()!)}
                                >
                                    Open in Editor
                                </button>
                                <a
                                    class="action-button secondary"
                                    href={`/data/${currentTemplate()!.fileName}`}
                                    download={currentTemplate()!.fileName}
                                >
                                    Download File
                                </a>
                            </div>
                        </div>
                    </Show>
                </main>
            </div>
        </div>
    );
};

export default ExamplesPage;
