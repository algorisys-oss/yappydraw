/**
 * AI Slides Dialog — Enter a topic to generate a full slide deck with AI.
 */

import { type Component, createSignal, createEffect, onCleanup, Show } from "solid-js";
import { X, Sparkles, Loader2, AlertTriangle, Check, Settings, Presentation } from "lucide-solid";
import { generatePresentation, type GeneratePresResult } from "../ai/slide-generator";
import { hasAnyApiKey, loadAIConfig, PROVIDER_LABELS } from "../ai/ai-settings";
import { setShowAISettings } from "./ai-settings-dialog";
import "./ai-slides-dialog.css";

interface AISlidesDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const PLACEHOLDER = `Describe the presentation you want...

Examples:
  Startup pitch deck for a food delivery app targeting college students
  Quarterly business review for Q4 2025 with revenue, KPIs, and goals
  Technical architecture overview of a microservices-based e-commerce platform
  Educational lecture on machine learning fundamentals`;

const STYLES = [
    { value: 'auto', label: 'Auto' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'forest', label: 'Nature' },
    { value: 'royal', label: 'Creative' },
    { value: 'dark', label: 'Dark' },
    { value: 'minimalist', label: 'Minimal' },
    { value: 'sunset', label: 'Warm' },
];

const SLIDE_COUNTS = [
    { value: 0, label: 'Auto' },
    { value: 6, label: '6' },
    { value: 8, label: '8' },
    { value: 10, label: '10' },
    { value: 12, label: '12' },
    { value: 15, label: '15' },
    { value: 20, label: '20' },
    { value: 30, label: '30' },
    { value: 50, label: '50' },
];

const AISlidesDialog: Component<AISlidesDialogProps> = (props) => {
    let textareaRef: HTMLTextAreaElement | undefined;
    const [prompt, setPrompt] = createSignal('');
    const [style, setStyle] = createSignal('auto');
    const [slideCount, setSlideCount] = createSignal(0);
    const [mode, setMode] = createSignal<'quick' | 'deep'>('quick');
    const [isGenerating, setIsGenerating] = createSignal(false);
    const [progressStage, setProgressStage] = createSignal('');
    const [result, setResult] = createSignal<GeneratePresResult | null>(null);

    const canGenerate = () => prompt().trim() && !isGenerating();

    createEffect(() => {
        if (props.isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape' && !isGenerating()) {
                    e.preventDefault();
                    props.onClose();
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canGenerate()) {
                    e.preventDefault();
                    handleGenerate();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            onCleanup(() => window.removeEventListener('keydown', handleKeyDown));

            requestAnimationFrame(() => textareaRef?.focus());
            setResult(null);
        }
    });

    const handleGenerate = async () => {
        const text = prompt().trim();
        if (!text || isGenerating()) return;

        if (!hasAnyApiKey()) {
            setResult({
                success: false,
                error: 'No API key configured. Please open AI Settings to add one.',
            });
            return;
        }

        setIsGenerating(true);
        setResult(null);
        setProgressStage('');

        try {
            const res = await generatePresentation(text, {
                style: style(),
                slideCount: slideCount() || undefined,
                clearCanvas: true,
                mode: mode(),
            }, (stage) => setProgressStage(stage));
            setResult(res);
            if (res.success) {
                setTimeout(() => props.onClose(), 800);
            }
        } catch (err: any) {
            setResult({ success: false, error: err.message });
        } finally {
            setIsGenerating(false);
        }
    };

    const openSettings = () => {
        props.onClose();
        setShowAISettings(true);
    };

    const activeProviderLabel = () => {
        const config = loadAIConfig();
        return PROVIDER_LABELS[config.activeProvider];
    };

    return (
        <Show when={props.isOpen}>
            <div class="ai-slides-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isGenerating() && !window.getSelection()?.toString()) props.onClose(); }}>
                <div class="ai-slides-modal" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div class="ai-slides-header">
                        <div class="ai-slides-title">
                            <Presentation size={18} />
                            <h3>AI Presentation</h3>
                            <span class="ai-slides-provider-badge">{activeProviderLabel()}</span>
                        </div>
                        <button class="close-btn" onClick={props.onClose} disabled={isGenerating()}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div class="ai-slides-body">
                        <textarea
                            ref={textareaRef}
                            class="ai-slides-textarea"
                            value={prompt()}
                            onInput={(e) => setPrompt(e.currentTarget.value)}
                            placeholder={PLACEHOLDER}
                            disabled={isGenerating()}
                            spellcheck={false}
                        />
                    </div>

                    {/* Options */}
                    <div class="ai-slides-options">
                        <div class="ai-slides-option-group">
                            <label class="ai-slides-label">Style</label>
                            <select
                                class="ai-slides-select"
                                value={style()}
                                onChange={(e) => setStyle(e.currentTarget.value)}
                                disabled={isGenerating()}
                            >
                                {STYLES.map(s => <option value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div class="ai-slides-option-group">
                            <label class="ai-slides-label">Slides</label>
                            <select
                                class="ai-slides-select"
                                value={slideCount()}
                                onChange={(e) => setSlideCount(Number(e.currentTarget.value))}
                                disabled={isGenerating()}
                            >
                                {SLIDE_COUNTS.map(s => <option value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div class="ai-slides-option-group">
                            <label class="ai-slides-label">Mode</label>
                            <div class="ai-slides-mode-toggle">
                                <button
                                    class={`ai-slides-mode-btn ${mode() === 'quick' ? 'active' : ''}`}
                                    onClick={() => setMode('quick')}
                                    disabled={isGenerating()}
                                    title="Single LLM call — fast"
                                >Quick</button>
                                <button
                                    class={`ai-slides-mode-btn ${mode() === 'deep' ? 'active' : ''}`}
                                    onClick={() => setMode('deep')}
                                    disabled={isGenerating()}
                                    title="2-stage agentic — richer content"
                                >Deep</button>
                            </div>
                        </div>
                        <div style={{ flex: 1 }} />
                        <button class="ai-slides-settings-link" onClick={openSettings}>
                            <Settings size={13} />
                            <span>AI Settings</span>
                        </button>
                    </div>

                    {/* Status */}
                    <Show when={result()}>
                        {(res) => (
                            <div class="ai-slides-status">
                                <Show when={res().success}>
                                    <div class="ai-slides-success">
                                        <Check size={14} />
                                        <span>
                                            {res().title ? `"${res().title}"` : 'Presentation'} generated
                                            {res().slideCount ? ` — ${res().slideCount} slides` : ''}
                                            {res().duration ? ` in ${(res().duration! / 1000).toFixed(1)}s` : ''}
                                        </span>
                                    </div>
                                    <Show when={res().usage}>
                                        <div class="ai-slides-usage">
                                            {(res().usage!.promptTokens + res().usage!.completionTokens).toLocaleString()} tokens
                                            <span class="ai-slides-usage-detail">
                                                ({res().usage!.promptTokens.toLocaleString()} in / {res().usage!.completionTokens.toLocaleString()} out)
                                            </span>
                                        </div>
                                    </Show>
                                </Show>
                                <Show when={!res().success}>
                                    <div class="ai-slides-error">
                                        <AlertTriangle size={14} />
                                        <span>{res().error}</span>
                                    </div>
                                    <Show when={!hasAnyApiKey()}>
                                        <button class="ai-slides-configure-btn" onClick={openSettings}>
                                            Configure API Keys
                                        </button>
                                    </Show>
                                </Show>
                            </div>
                        )}
                    </Show>

                    {/* Generating indicator */}
                    <Show when={isGenerating()}>
                        <div class="ai-slides-generating">
                            <Loader2 size={16} class="ai-slides-spinner" />
                            <span>{progressStage() || 'Generating slides...'}</span>
                        </div>
                    </Show>

                    {/* Footer */}
                    <div class="ai-slides-footer">
                        <span class="ai-slides-hint">Ctrl+Enter to generate</span>
                        <div class="ai-slides-footer-buttons">
                            <button
                                class="ai-slides-cancel-btn"
                                onClick={props.onClose}
                                disabled={isGenerating()}
                            >
                                Cancel
                            </button>
                            <button
                                class="ai-slides-generate-btn"
                                onClick={handleGenerate}
                                disabled={!canGenerate()}
                            >
                                <Show when={isGenerating()} fallback={
                                    <>
                                        <Sparkles size={14} />
                                        Generate Deck
                                    </>
                                }>
                                    <Loader2 size={14} class="ai-slides-spinner" /> Generating...
                                </Show>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default AISlidesDialog;
