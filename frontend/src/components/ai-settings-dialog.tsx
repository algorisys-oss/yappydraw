/**
 * AI Settings Dialog — Configure API keys and model selection for AI providers.
 */

import { type Component, createSignal, createEffect, onCleanup, Show, For } from "solid-js";
import { X, Eye, EyeOff, Key } from "lucide-solid";
import {
    loadAIConfig, saveAIConfig, PROVIDER_MODELS, PROVIDER_LABELS,
    type AIConfig, type AIProvider,
} from "../ai/ai-settings";
import "./ai-settings-dialog.css";

// Exported signal so menu.tsx and other components can open this dialog
export const [showAISettings, setShowAISettings] = createSignal(false);

const ALL_PROVIDERS: AIProvider[] = ['openai', 'gemini', 'anthropic'];

interface AISettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const AISettingsDialog: Component<AISettingsDialogProps> = (props) => {
    const [config, setConfig] = createSignal<AIConfig>(loadAIConfig());
    const [visibleKeys, setVisibleKeys] = createSignal<Record<string, boolean>>({});

    // Reload config when dialog opens
    createEffect(() => {
        if (props.isOpen) {
            setConfig(loadAIConfig());
            setVisibleKeys({});

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    props.onClose();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
        }
    });

    const updateAndSave = (updater: (c: AIConfig) => AIConfig) => {
        const updated = updater(config());
        setConfig(updated);
        saveAIConfig(updated);
    };

    const setProviderKey = (provider: AIProvider, rawKey: string) => {
        updateAndSave(c => ({
            ...c,
            providers: {
                ...c.providers,
                [provider]: {
                    ...c.providers[provider],
                    apiKey: rawKey ? btoa(rawKey) : '',
                },
            },
        }));
    };

    const getProviderKey = (provider: AIProvider): string => {
        const encoded = config().providers[provider]?.apiKey || '';
        try { return encoded ? atob(encoded) : ''; } catch { return ''; }
    };

    const setProviderModel = (provider: AIProvider, model: string) => {
        updateAndSave(c => ({
            ...c,
            providers: {
                ...c.providers,
                [provider]: { ...c.providers[provider], model },
            },
        }));
    };

    const setActiveProvider = (provider: AIProvider) => {
        updateAndSave(c => ({ ...c, activeProvider: provider }));
    };

    const toggleKeyVisibility = (provider: string) => {
        setVisibleKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
    };

    return (
        <Show when={props.isOpen}>
            <div class="ai-settings-overlay" onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}>
                <div class="ai-settings-modal" onClick={(e) => e.stopPropagation()}>
                    <div class="ai-settings-header">
                        <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                            <Key size={18} />
                            <h3>AI Settings</h3>
                        </div>
                        <button class="close-btn" onClick={props.onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div class="ai-settings-section">
                        <p class="ai-settings-section-title">Active Provider</p>
                        <div class="ai-settings-provider-select">
                            <For each={ALL_PROVIDERS}>
                                {(provider) => (
                                    <button
                                        class={`ai-settings-provider-btn ${config().activeProvider === provider ? 'active' : ''}`}
                                        onClick={() => setActiveProvider(provider)}
                                    >
                                        {PROVIDER_LABELS[provider]}
                                    </button>
                                )}
                            </For>
                        </div>
                    </div>

                    <For each={ALL_PROVIDERS}>
                        {(provider) => (
                            <div class="ai-settings-section">
                                <p class="ai-settings-section-title">{PROVIDER_LABELS[provider]}</p>

                                <div class="ai-settings-row">
                                    <label>API Key</label>
                                    <div class="ai-settings-key-input">
                                        <input
                                            type={visibleKeys()[provider] ? 'text' : 'password'}
                                            value={getProviderKey(provider)}
                                            onInput={(e) => setProviderKey(provider, e.currentTarget.value)}
                                            placeholder={`Enter ${PROVIDER_LABELS[provider]} API key`}
                                            spellcheck={false}
                                        />
                                        <button
                                            class="ai-settings-eye-btn"
                                            onClick={() => toggleKeyVisibility(provider)}
                                            title={visibleKeys()[provider] ? 'Hide key' : 'Show key'}
                                        >
                                            {visibleKeys()[provider] ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>

                                <div class="ai-settings-row">
                                    <label>Model</label>
                                    <select
                                        value={config().providers[provider].model}
                                        onChange={(e) => setProviderModel(provider, e.currentTarget.value)}
                                    >
                                        <For each={PROVIDER_MODELS[provider]}>
                                            {(m) => <option value={m.id}>{m.label}</option>}
                                        </For>
                                    </select>
                                </div>
                            </div>
                        )}
                    </For>

                    <p class="ai-settings-note">
                        API keys are stored locally in your browser. They are never sent to any server other than the AI provider.
                    </p>

                    <div class="ai-settings-footer">
                        <button class="ai-settings-done-btn" onClick={props.onClose}>
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default AISettingsDialog;
