/**
 * DSL Import Dialog
 * Modal for importing diagrams from text (YappyDSL or JSON format).
 * Auto-detects format, shows errors, allows layout override.
 */

import { type Component, createSignal, createEffect, onCleanup, Show, For } from "solid-js";
import { X, FileText, AlertTriangle, Check } from "lucide-solid";
import { parseDSL, renderDiagram } from "../dsl";
import type { ParseResult, DSLLayoutStrategy } from "../dsl";
import "./dsl-import-dialog.css";

interface DSLImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    initialText?: string;
}

const LAYOUT_OPTIONS: { value: DSLLayoutStrategy | ''; label: string }[] = [
    { value: '', label: 'Auto (from DSL)' },
    { value: 'tree-down', label: 'Tree - Top Down' },
    { value: 'tree-right', label: 'Tree - Left to Right' },
    { value: 'tree-left', label: 'Tree - Right to Left' },
    { value: 'tree-up', label: 'Tree - Bottom Up' },
    { value: 'grid', label: 'Grid' },
    { value: 'sequence', label: 'Sequence' },
    { value: 'radial', label: 'Radial' },
    { value: 'manual', label: 'Manual (x/y positions)' },
];

const DSLImportDialog: Component<DSLImportDialogProps> = (props) => {
    let textareaRef: HTMLTextAreaElement | undefined;
    const [inputText, setInputText] = createSignal('');
    const [layoutOverride, setLayoutOverride] = createSignal<string>('');
    const [parseResult, setParseResult] = createSignal<ParseResult | null>(null);
    const [detectedFormat, setDetectedFormat] = createSignal<'json' | 'text' | 'mermaid' | ''>('');

    // Escape key
    createEffect(() => {
        if (props.isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    props.onClose();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            onCleanup(() => window.removeEventListener('keydown', handleKeyDown));

            // Load initial text if provided
            if (props.initialText) {
                setInputText(props.initialText);
            }

            // Focus textarea on open
            requestAnimationFrame(() => textareaRef?.focus());
        }
    });

    // Live validation on input change
    createEffect(() => {
        const text = inputText();
        if (!text.trim()) {
            setParseResult(null);
            setDetectedFormat('');
            return;
        }

        const trimmed = text.trim();
        if (trimmed.startsWith('{')) {
            setDetectedFormat('json');
        } else if (/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram)\b/m.test(trimmed)) {
            setDetectedFormat('mermaid');
        } else {
            setDetectedFormat('text');
        }

        const result = parseDSL(text);
        setParseResult(result);
    });

    const handleImport = () => {
        const result = parseResult();
        if (!result?.success || !result.diagram) return;

        const diagram = { ...result.diagram };

        // Apply layout override if set
        const override = layoutOverride();
        if (override) {
            diagram.layout = { ...diagram.layout, strategy: override as DSLLayoutStrategy };
        }

        renderDiagram(diagram, { clearCanvas: true, zoomToFit: true });
        props.onClose();
        setInputText('');
        setParseResult(null);
    };

    const nodeCount = () => parseResult()?.diagram?.nodes?.length ?? 0;
    const edgeCount = () => parseResult()?.diagram?.edges?.length ?? 0;

    return (
        <Show when={props.isOpen}>
            <div class="dsl-import-overlay" onClick={props.onClose}>
                <div class="dsl-import-modal" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div class="dsl-import-header">
                        <div class="dsl-import-title">
                            <FileText size={18} />
                            <h3>Import Diagram from Text</h3>
                        </div>
                        <button class="close-btn" onClick={props.onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div class="dsl-import-toolbar">
                        <div class="dsl-import-format">
                            <Show when={detectedFormat()}>
                                <span class="format-badge">
                                    {detectedFormat() === 'json' ? 'JSON' : detectedFormat() === 'mermaid' ? 'Mermaid' : 'Text DSL'}
                                </span>
                            </Show>
                        </div>
                        <div class="dsl-import-layout-select">
                            <label>Layout:</label>
                            <select
                                value={layoutOverride()}
                                onChange={(e) => setLayoutOverride(e.currentTarget.value)}
                            >
                                <For each={LAYOUT_OPTIONS}>
                                    {(opt) => <option value={opt.value}>{opt.label}</option>}
                                </For>
                            </select>
                        </div>
                    </div>

                    {/* Editor */}
                    <div class="dsl-import-body">
                        <textarea
                            ref={textareaRef}
                            class="dsl-import-textarea"
                            placeholder={`Paste your diagram here...\n\nJSON format:\n{"layout":{"strategy":"tree-down"}, "nodes":[...], "edges":[...]}\n\nText format:\n---\nlayout: tree-down\n---\nstart [circle] "Start"\nprocess [rect] "Process"\nstart -> process`}
                            value={inputText()}
                            onInput={(e) => setInputText(e.currentTarget.value)}
                            spellcheck={false}
                        />
                    </div>

                    {/* Status / Errors */}
                    <div class="dsl-import-status">
                        <Show when={parseResult()?.success}>
                            <div class="dsl-status-success">
                                <Check size={14} />
                                <span>Valid — {nodeCount()} nodes, {edgeCount()} edges</span>
                            </div>
                        </Show>
                        <Show when={parseResult() && !parseResult()!.success}>
                            <div class="dsl-status-errors">
                                <AlertTriangle size={14} />
                                <div class="dsl-error-list">
                                    <For each={parseResult()!.errors}>
                                        {(err) => (
                                            <div class="dsl-error-item">
                                                {err.line > 0 ? `Line ${err.line}: ` : ''}{err.message}
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </div>
                        </Show>
                        <Show when={parseResult()?.warnings && parseResult()!.warnings.length > 0}>
                            <div class="dsl-status-warnings">
                                <For each={parseResult()!.warnings}>
                                    {(w) => (
                                        <div class="dsl-warning-item">
                                            {w.line > 0 ? `Line ${w.line}: ` : ''}{w.message}
                                        </div>
                                    )}
                                </For>
                            </div>
                        </Show>
                    </div>

                    {/* Footer */}
                    <div class="dsl-import-footer">
                        <button class="dsl-import-cancel-btn" onClick={props.onClose}>
                            Cancel
                        </button>
                        <button
                            class="dsl-import-btn"
                            disabled={!parseResult()?.success}
                            onClick={handleImport}
                        >
                            Import Diagram
                        </button>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default DSLImportDialog;
