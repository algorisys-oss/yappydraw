/**
 * AI Prompt Dialog — Enter a natural language prompt to generate diagrams with AI.
 */

import { type Component, createSignal, createEffect, onCleanup, Show } from "solid-js";
import { X, Sparkles, Loader2, AlertTriangle, Check, Settings, Rocket } from "lucide-solid";
import { generateDiagram, type GenerateResult } from "../ai/drawing-engine";
import { hasAnyApiKey, loadAIConfig, PROVIDER_LABELS } from "../ai/ai-settings";
import { setShowAISettings } from "./ai-settings-dialog";
import { setShowRocketSettings } from "./rocket-settings-dialog";
import { features } from "../config/features";
import "./ai-prompt-dialog.css";

interface AIPromptDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const PLACEHOLDER = `Describe the diagram you want...

Examples:
  A flowchart for user login with start, credentials, validation, 2FA, success/failure
  Microservice architecture with API gateway, auth, users, orders, and databases
  Mind map of React concepts: components, hooks, state, context, effects
  CI/CD pipeline: code push, build, test, deploy to staging, deploy to production`;

const AIPromptDialog: Component<AIPromptDialogProps> = (props) => {
    let textareaRef: HTMLTextAreaElement | undefined;
    const [prompt, setPrompt] = createSignal('');
    const [isGenerating, setIsGenerating] = createSignal(false);
    const [result, setResult] = createSignal<GenerateResult | null>(null);
    const [clearCanvas, setClearCanvas] = createSignal(true);
    const [rocketMode, setRocketMode] = createSignal(false);

    // Escape key + Ctrl+Enter handling
    createEffect(() => {
        if (props.isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape' && !isGenerating()) {
                    e.preventDefault();
                    props.onClose();
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && prompt().trim() && !isGenerating()) {
                    e.preventDefault();
                    handleGenerate();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            onCleanup(() => window.removeEventListener('keydown', handleKeyDown));

            // Focus textarea
            requestAnimationFrame(() => textareaRef?.focus());

            // Reset state on open
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

        try {
            const res = await generateDiagram(text, { clearCanvas: clearCanvas(), rocketMode: rocketMode() });
            setResult(res);
            if (res.success) {
                // Close after brief success display
                setTimeout(() => {
                    props.onClose();
                }, 600);
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

    const openRocketSettings = () => {
        props.onClose();
        setShowRocketSettings(true);
    };

    const activeProviderLabel = () => {
        const config = loadAIConfig();
        return PROVIDER_LABELS[config.activeProvider];
    };

    return (
        <Show when={props.isOpen}>
            <div class="ai-prompt-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isGenerating() && !window.getSelection()?.toString()) props.onClose(); }}>
                <div class="ai-prompt-modal" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div class="ai-prompt-header">
                        <div class="ai-prompt-title">
                            <Sparkles size={18} />
                            <h3>AI Drawing</h3>
                            <span class="ai-prompt-provider-badge">{activeProviderLabel()}</span>
                        </div>
                        <button class="close-btn" onClick={props.onClose} disabled={isGenerating()}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div class="ai-prompt-body">
                        <textarea
                            ref={textareaRef}
                            class="ai-prompt-textarea"
                            value={prompt()}
                            onInput={(e) => setPrompt(e.currentTarget.value)}
                            placeholder={PLACEHOLDER}
                            disabled={isGenerating()}
                            spellcheck={false}
                        />
                    </div>

                    {/* Options */}
                    <div class="ai-prompt-options">
                        <div class="ai-prompt-checkboxes">
                            <label class="ai-prompt-checkbox">
                                <input
                                    type="checkbox"
                                    checked={clearCanvas()}
                                    onChange={(e) => setClearCanvas(e.currentTarget.checked)}
                                    disabled={isGenerating()}
                                />
                                <span>Clear canvas before generating</span>
                            </label>
                            <Show when={features.enableRocketExport}>
                                <label class="ai-prompt-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={rocketMode()}
                                        onChange={(e) => setRocketMode(e.currentTarget.checked)}
                                        disabled={isGenerating()}
                                    />
                                    <span>Generate for Rocket Backend</span>
                                </label>
                            </Show>
                        </div>
                        <div class="ai-prompt-settings-links">
                            <button class="ai-prompt-settings-link" onClick={openSettings}>
                                <Settings size={13} />
                                <span>AI Settings</span>
                            </button>
                            <Show when={features.enableRocketExport && rocketMode()}>
                                <button class="ai-prompt-settings-link" onClick={openRocketSettings}>
                                    <Rocket size={13} />
                                    <span>Rocket Settings</span>
                                </button>
                            </Show>
                        </div>
                    </div>

                    {/* Status */}
                    <Show when={result()}>
                        {(res) => (
                            <div class="ai-prompt-status">
                                <Show when={res().success}>
                                    <div class="ai-prompt-success">
                                        <Check size={14} />
                                        <span>
                                            Diagram generated
                                            {res().renderResult?.elementCount
                                                ? ` (${res().renderResult!.elementCount} elements)`
                                                : ''}
                                            {res().duration ? ` in ${(res().duration! / 1000).toFixed(1)}s` : ''}
                                        </span>
                                    </div>
                                </Show>
                                <Show when={!res().success}>
                                    <div class="ai-prompt-error">
                                        <AlertTriangle size={14} />
                                        <span>{res().error}</span>
                                    </div>
                                    <Show when={!hasAnyApiKey()}>
                                        <button class="ai-prompt-configure-btn" onClick={openSettings}>
                                            Configure API Keys
                                        </button>
                                    </Show>
                                </Show>
                            </div>
                        )}
                    </Show>

                    {/* Footer */}
                    <div class="ai-prompt-footer">
                        <span class="ai-prompt-hint">Ctrl+Enter to generate</span>
                        <div class="ai-prompt-footer-buttons">
                            <button
                                class="ai-prompt-cancel-btn"
                                onClick={props.onClose}
                                disabled={isGenerating()}
                            >
                                Cancel
                            </button>
                            <button
                                class="ai-prompt-generate-btn"
                                onClick={handleGenerate}
                                disabled={!prompt().trim() || isGenerating()}
                            >
                                <Show when={isGenerating()} fallback={<><Sparkles size={14} /> Generate</>}>
                                    <Loader2 size={14} class="ai-prompt-spinner" /> Generating...
                                </Show>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default AIPromptDialog;
