import { type Component, Show, createEffect, onCleanup, createSignal } from "solid-js";
import { X } from "lucide-solid";
import { store, updateDefaultStyles, resetDefaultStyles, updateGlobalSettings } from "../store/app-store";
import { features } from "../config/features";
import { cloudStorageManager } from "../storage/cloud";
import type { AuthState } from "../storage/cloud/types";
import { showToast } from "./toast";
import "./settings-dialog.css";

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const fontOptions = [
    { label: 'Virgil (Hand)', value: 'hand-drawn' },
    { label: 'Caveat (Hand)', value: 'caveat' },
    { label: 'Marker', value: 'marker' },
    { label: 'Inter (Sans)', value: 'sans-serif' },
    { label: 'Poppins (Sans)', value: 'poppins' },
    { label: 'Merriweather (Serif)', value: 'serif' },
    { label: 'Source Code Pro', value: 'monospace' },
    { label: 'JetBrains Mono', value: 'code' },
];

const SettingsDialog: Component<SettingsDialogProps> = (props) => {
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
        }
    });

    const defaults = () => store.defaultElementStyles;

    return (
        <Show when={props.isOpen}>
            <div class="settings-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !window.getSelection()?.toString()) props.onClose(); }}>
                <div class="settings-modal" onClick={(e) => e.stopPropagation()}>
                    <div class="settings-header">
                        <h3>Settings</h3>
                        <button class="close-btn" onClick={props.onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div class="settings-section">
                        <p class="settings-section-title">General</p>

                        <div class="settings-row">
                            <label>Quick Toolbar</label>
                            <label class="settings-toggle">
                                <input
                                    type="checkbox"
                                    checked={store.globalSettings.showQuickToolbar ?? true}
                                    onChange={(e) => updateGlobalSettings({ showQuickToolbar: e.currentTarget.checked })}
                                />
                                <span class="settings-toggle-slider" />
                            </label>
                        </div>

                        <div class="settings-row">
                            <label>Drawing Style</label>
                            <select
                                value={store.globalSettings.renderStyle ?? 'sketch'}
                                onChange={(e) => updateGlobalSettings({ renderStyle: e.currentTarget.value as any })}
                            >
                                <option value="sketch">Sketch</option>
                                <option value="architectural">Architectural</option>
                            </select>
                        </div>
                    </div>

                    <div class="settings-section">
                        <p class="settings-section-title">Text Defaults</p>

                        <div class="settings-row">
                            <label>Font Family</label>
                            <select
                                value={defaults().fontFamily ?? 'hand-drawn'}
                                onChange={(e) => updateDefaultStyles({ fontFamily: e.currentTarget.value as any })}
                            >
                                {fontOptions.map(opt => (
                                    <option value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div class="settings-row">
                            <label>Font Size</label>
                            <input
                                type="number"
                                min={8}
                                max={200}
                                value={defaults().fontSize ?? 28}
                                onChange={(e) => updateDefaultStyles({ fontSize: parseInt(e.currentTarget.value) || 28 })}
                            />
                        </div>
                    </div>

                    <div class="settings-section">
                        <p class="settings-section-title">Shape Defaults</p>

                        <div class="settings-row">
                            <label>Stroke Color</label>
                            <div class="settings-color-group">
                                <input
                                    type="color"
                                    value={defaults().strokeColor ?? '#000000'}
                                    onInput={(e) => updateDefaultStyles({ strokeColor: e.currentTarget.value })}
                                />
                                <span>{defaults().strokeColor ?? '#000000'}</span>
                            </div>
                        </div>

                        <div class="settings-row">
                            <label>Background</label>
                            <div class="settings-color-group">
                                <input
                                    type="color"
                                    value={defaults().backgroundColor === 'transparent' ? '#ffffff' : (defaults().backgroundColor ?? '#ffffff')}
                                    onInput={(e) => updateDefaultStyles({ backgroundColor: e.currentTarget.value })}
                                />
                                <span>{defaults().backgroundColor ?? 'transparent'}</span>
                            </div>
                        </div>

                        <div class="settings-row">
                            <label>Stroke Width</label>
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={defaults().strokeWidth ?? 4}
                                onChange={(e) => updateDefaultStyles({ strokeWidth: parseInt(e.currentTarget.value) || 4 })}
                            />
                        </div>

                        <div class="settings-row">
                            <label>Opacity</label>
                            <div class="settings-range-group">
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={defaults().opacity ?? 100}
                                    onInput={(e) => updateDefaultStyles({ opacity: parseInt(e.currentTarget.value) })}
                                />
                                <span>{defaults().opacity ?? 100}%</span>
                            </div>
                        </div>
                    </div>

                    <Show when={features.enableCloudStorage}>
                        <div class="settings-section">
                            <p class="settings-section-title">Cloud Storage</p>
                            <CloudSettingsContent />
                        </div>
                    </Show>

                    <div class="settings-footer">
                        <button class="settings-reset-btn" onClick={() => resetDefaultStyles()}>
                            Reset to Defaults
                        </button>
                        <button class="settings-close-btn" onClick={props.onClose}>
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </Show>
    );
};

/** Inline cloud storage settings section. */
function CloudSettingsContent() {
    const [authState, setAuthState] = createSignal<AuthState>(
        cloudStorageManager.getAuthState()
    );

    createEffect(() => {
        const provider = cloudStorageManager.getActiveProvider();
        if (provider) {
            const unsub = provider.onAuthStateChange(setAuthState);
            onCleanup(unsub);
        }
    });

    async function handleSignIn() {
        try {
            if (!cloudStorageManager.getActiveProvider()) {
                await cloudStorageManager.setActiveProvider('google-drive');
            }
            await cloudStorageManager.signIn();
            setAuthState(cloudStorageManager.getAuthState());
        } catch (e: any) {
            showToast(e.message || 'Sign-in failed', 'error');
        }
    }

    async function handleSignOut() {
        try {
            await cloudStorageManager.signOut();
            setAuthState({ isAuthenticated: false });
        } catch (e: any) {
            showToast(e.message || 'Sign-out failed', 'error');
        }
    }

    return (
        <>
            <div class="settings-row">
                <label>Provider</label>
                <span style={{ "font-size": "0.85rem", color: "var(--text-secondary)" }}>Google Drive</span>
            </div>
            <div class="settings-row">
                <label>Account</label>
                <Show
                    when={authState().isAuthenticated}
                    fallback={
                        <button
                            class="settings-close-btn"
                            style={{ "font-size": "0.8rem", padding: "4px 12px" }}
                            onClick={handleSignIn}
                        >
                            Sign in
                        </button>
                    }
                >
                    <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                        <span style={{ "font-size": "0.8rem", color: "var(--text-secondary)" }}>
                            {authState().userEmail || 'Connected'}
                        </span>
                        <button
                            class="settings-reset-btn"
                            style={{ "font-size": "0.75rem", padding: "2px 8px" }}
                            onClick={handleSignOut}
                        >
                            Sign out
                        </button>
                    </div>
                </Show>
            </div>
        </>
    );
}

export default SettingsDialog;
