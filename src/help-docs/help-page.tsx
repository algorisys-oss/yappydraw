/**
 * Help Documentation Page
 * Displays documentation for all shapes with interactive navigation.
 */

import { type Component, createSignal, For, Show } from 'solid-js';
import './help-page.css';

// Shape documentation data
interface ShapeDoc {
    id: string;
    name: string;
    icon: string;
    category: string;
    description: string;
    content: Component;
}

// Import shape documentation components
import { TableDoc } from './shapes/table-doc';

// Registry of all shape documentation
const shapeDocuments: ShapeDoc[] = [
    {
        id: 'table',
        name: 'Table',
        icon: '📊',
        category: 'Data',
        description: 'Create and edit tables with rows, columns, and data',
        content: TableDoc
    },
    // Add more shapes here as documentation is created
];

// Group shapes by category
const categories = [...new Set(shapeDocuments.map(s => s.category))];

export const HelpPage: Component = () => {
    const [selectedShape, setSelectedShape] = createSignal<string>('table');
    const [searchQuery, setSearchQuery] = createSignal('');

    const filteredShapes = () => {
        const query = searchQuery().toLowerCase();
        if (!query) return shapeDocuments;
        return shapeDocuments.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.description.toLowerCase().includes(query) ||
            s.category.toLowerCase().includes(query)
        );
    };

    const currentDoc = () => shapeDocuments.find(s => s.id === selectedShape());

    const handleBackToApp = () => {
        window.location.hash = '';
        window.location.reload();
    };

    return (
        <div class="help-page">
            {/* Header */}
            <header class="help-header">
                <div class="help-header-left">
                    <button class="back-button" onClick={handleBackToApp}>
                        ← Back to Yappy
                    </button>
                    <h1 class="help-title">Yappy Documentation</h1>
                </div>
                <div class="help-header-right">
                    <input
                        type="text"
                        class="search-input"
                        placeholder="Search shapes..."
                        value={searchQuery()}
                        onInput={(e) => setSearchQuery(e.currentTarget.value)}
                    />
                </div>
            </header>

            <div class="help-content">
                {/* Sidebar */}
                <aside class="help-sidebar">
                    <nav class="shape-nav">
                        <For each={categories}>
                            {(category) => (
                                <div class="nav-category">
                                    <h3 class="category-title">{category}</h3>
                                    <ul class="shape-list">
                                        <For each={filteredShapes().filter(s => s.category === category)}>
                                            {(shape) => (
                                                <li
                                                    class={`shape-item ${selectedShape() === shape.id ? 'active' : ''}`}
                                                    onClick={() => setSelectedShape(shape.id)}
                                                >
                                                    <span class="shape-icon">{shape.icon}</span>
                                                    <span class="shape-name">{shape.name}</span>
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
                <main class="help-main">
                    <Show when={currentDoc()} fallback={<p>Select a shape to view documentation</p>}>
                        {(doc) => {
                            const DocComponent = doc().content;
                            return <DocComponent />;
                        }}
                    </Show>
                </main>
            </div>
        </div>
    );
};

export default HelpPage;
