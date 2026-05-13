/**
 * AI Prompt Dialog — Enter a natural language prompt or upload a sketch
 * to generate diagrams with AI.
 */

import { type Component, createSignal, createEffect, onCleanup, Show, untrack } from "solid-js";
import { X, Sparkles, Loader2, AlertTriangle, Check, Settings, Rocket, ImagePlus, BrainCircuit, Box } from "lucide-solid";
import { generateDiagram, generateDiagramFromSketch, type GenerateResult } from "../ai/drawing-engine";
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

const SKETCH_PLACEHOLDER = `Add optional description to guide the conversion...

Examples:
  This is a flowchart for user authentication
  Architecture diagram — label the services clearly
  UML class diagram with inheritance`;

const AIPromptDialog: Component<AIPromptDialogProps> = (props) => {
    let textareaRef: HTMLTextAreaElement | undefined;
    let fileInputRef: HTMLInputElement | undefined;
    const [prompt, setPrompt] = createSignal('');
    const [isGenerating, setIsGenerating] = createSignal(false);
    const [result, setResult] = createSignal<GenerateResult | null>(null);
    const [clearCanvas, setClearCanvas] = createSignal(true);
    const [rocketMode, setRocketMode] = createSignal(false);
    const [sketchImage, setSketchImage] = createSignal<File | null>(null);
    const [sketchPreview, setSketchPreview] = createSignal<string | null>(null);
    const [isDragOver, setIsDragOver] = createSignal(false);
    const [deepMode, setDeepMode] = createSignal(false);
    const [style3D, setStyle3D] = createSignal(false);
    const [progressStage, setProgressStage] = createSignal<string | null>(null);

    const hasSketch = () => sketchImage() !== null;
    const canGenerate = () => (prompt().trim() || hasSketch()) && !isGenerating();

    // Escape key + Ctrl+Enter handling
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

            // Focus textarea
            requestAnimationFrame(() => textareaRef?.focus());

            // Reset state on open (untrack prevents clearSketch from
            // subscribing to sketchPreview, which would re-trigger the effect)
            setResult(null);
            untrack(() => clearSketch());
        }
    });

    const handleSketchUpload = (file: File | null | undefined) => {
        if (!file || !file.type.startsWith('image/')) return;
        setSketchImage(file);
        setResult(null);

        // Generate preview URL
        const url = URL.createObjectURL(file);
        const prev = sketchPreview();
        if (prev) URL.revokeObjectURL(prev);
        setSketchPreview(url);
    };

    const clearSketch = () => {
        setSketchImage(null);
        const prev = sketchPreview();
        if (prev) URL.revokeObjectURL(prev);
        setSketchPreview(null);
        if (fileInputRef) fileInputRef.value = '';
    };

    const handlePaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    handleSketchUpload(file);
                    e.preventDefault();
                }
                return;
            }
        }
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer?.files?.[0];
        if (file?.type.startsWith('image/')) handleSketchUpload(file);
    };

    const handleGenerate = async () => {
        const text = prompt().trim();
        const sketch = sketchImage();
        if ((!text && !sketch) || isGenerating()) return;

        if (!hasAnyApiKey()) {
            setResult({
                success: false,
                error: 'No API key configured. Please open AI Settings to add one.',
            });
            return;
        }

        setIsGenerating(true);
        setResult(null);
        setProgressStage(null);

        try {
            let res: GenerateResult;
            if (sketch) {
                res = await generateDiagramFromSketch(sketch, {
                    clearCanvas: clearCanvas(),
                    additionalPrompt: text || undefined,
                    mode: deepMode() ? 'deep' : 'quick',
                    style3D: style3D(),
                }, (stage) => setProgressStage(stage));
            } else {
                res = await generateDiagram(text, {
                    clearCanvas: clearCanvas(),
                    rocketMode: rocketMode(),
                    mode: deepMode() ? 'deep' : 'quick',
                    style3D: style3D() && !rocketMode(),
                }, (stage) => setProgressStage(stage));
            }
            setResult(res);
            if (res.success) {
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
                <div
                    class={`ai-prompt-modal ${isDragOver() ? 'drag-over' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                    onPaste={handlePaste}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
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

                    {/* Sketch Upload Area */}
                    <div class="ai-prompt-sketch-area">
                        <Show when={hasSketch()} fallback={
                            <div class="ai-prompt-upload-row">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    style="display:none"
                                    onChange={(e) => handleSketchUpload(e.currentTarget.files?.[0])}
                                />
                                <button
                                    class="ai-prompt-upload-btn"
                                    onClick={() => fileInputRef?.click()}
                                    disabled={isGenerating()}
                                >
                                    <ImagePlus size={14} />
                                    <span>Upload Sketch</span>
                                </button>
                                <span class="ai-prompt-upload-hint">or paste / drop an image</span>
                            </div>
                        }>
                            <div class="ai-prompt-sketch-preview">
                                <img src={sketchPreview()!} alt="Sketch preview" />
                                <div class="ai-prompt-sketch-info">
                                    <span class="ai-prompt-sketch-name">{sketchImage()!.name}</span>
                                    <span class="ai-prompt-sketch-label">Sketch uploaded — add optional description below</span>
                                </div>
                                <button
                                    class="ai-prompt-sketch-remove"
                                    onClick={clearSketch}
                                    disabled={isGenerating()}
                                    title="Remove sketch"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </Show>
                    </div>

                    {/* Body */}
                    <div class="ai-prompt-body">
                        <textarea
                            ref={textareaRef}
                            class="ai-prompt-textarea"
                            value={prompt()}
                            onInput={(e) => setPrompt(e.currentTarget.value)}
                            placeholder={hasSketch() ? SKETCH_PLACEHOLDER : PLACEHOLDER}
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
                                <label class="ai-prompt-checkbox" title={hasSketch() ? '2-stage AI pipeline: analyzes the image deeply to extract all nodes and connections, then composes a detailed diagram' : '2-stage AI pipeline: researches the topic deeply, then composes a detailed diagram with more components and connections'}>
                                    <input
                                        type="checkbox"
                                        checked={deepMode()}
                                        onChange={(e) => setDeepMode(e.currentTarget.checked)}
                                        disabled={isGenerating()}
                                    />
                                    <BrainCircuit size={13} />
                                    <span>Deep Mode</span>
                                </label>
                                <label class="ai-prompt-checkbox" title="Render in 3D concept-diagram style: solidBlock / perspectiveBlock containers, isometric cubes, openBox queues, pastel palette. Disabled when Rocket mode is on.">
                                    <input
                                        type="checkbox"
                                        checked={style3D() && !rocketMode()}
                                        onChange={(e) => setStyle3D(e.currentTarget.checked)}
                                        disabled={isGenerating() || rocketMode()}
                                    />
                                    <Box size={13} />
                                    <span>3D Style</span>
                                </label>
                            <Show when={features.enableRocketExport && !hasSketch()}>
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
                            <Show when={features.enableRocketExport && rocketMode() && !hasSketch()}>
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
                                    <Show when={res().usage}>
                                        <div class="ai-prompt-usage">
                                            {(res().usage!.promptTokens + res().usage!.completionTokens).toLocaleString()} tokens
                                            <span class="ai-prompt-usage-detail">
                                                ({res().usage!.promptTokens.toLocaleString()} in / {res().usage!.completionTokens.toLocaleString()} out)
                                            </span>
                                        </div>
                                    </Show>
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
                                disabled={!canGenerate()}
                            >
                                <Show when={isGenerating()} fallback={
                                    <>
                                        <Sparkles size={14} />
                                        {hasSketch() ? 'Generate from Sketch' : 'Generate'}
                                    </>
                                }>
                                    <Loader2 size={14} class="ai-prompt-spinner" /> {progressStage() || 'Generating...'}
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
