/**
 * Rocket Settings Dialog — Configure connection to a Rocket Backend instance.
 */

import { type Component, createSignal, createEffect, onCleanup, Show } from "solid-js";
import { X, Eye, EyeOff, Rocket } from "lucide-solid";
import { loadRocketConfig, saveRocketConfig, rocketLogin, type RocketConfig } from "../ai/rocket-settings";
import "./rocket-settings-dialog.css";

// Exported signal so menu.tsx and other components can open this dialog
export const [showRocketSettings, setShowRocketSettings] = createSignal(false);

interface RocketSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const RocketSettingsDialog: Component<RocketSettingsDialogProps> = (props) => {
    const [url, setUrl] = createSignal('');
    const [email, setEmail] = createSignal('');
    const [password, setPassword] = createSignal('');
    const [appName, setAppName] = createSignal('');
    const [showPassword, setShowPassword] = createSignal(false);
    const [testing, setTesting] = createSignal(false);
    const [testResult, setTestResult] = createSignal<{ success: boolean; message: string } | null>(null);

    // Reload config when dialog opens
    createEffect(() => {
        if (props.isOpen) {
            const config = loadRocketConfig();
            setUrl(config.url);
            setEmail(config.email);
            setPassword(config.password);
            setAppName(config.appName);
            setShowPassword(false);
            setTestResult(null);

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    handleDone();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
        }
    });

    const handleDone = () => {
        saveRocketConfig({
            url: url().trim(),
            email: email().trim(),
            password: password(),
            appName: appName().trim(),
        });
        props.onClose();
    };

    const handleTest = async () => {
        const config: RocketConfig = {
            url: url().trim(),
            email: email().trim(),
            password: password(),
            appName: appName().trim(),
        };

        if (!config.url || !config.email || !config.password) {
            setTestResult({ success: false, message: 'URL, email, and password are required.' });
            return;
        }

        setTesting(true);
        setTestResult(null);

        const result = await rocketLogin(config);
        if (result.success) {
            setTestResult({ success: true, message: 'Connected successfully!' });
        } else {
            setTestResult({ success: false, message: result.error || 'Connection failed.' });
        }
        setTesting(false);
    };

    return (
        <Show when={props.isOpen}>
            <div class="rocket-settings-overlay" onClick={handleDone}>
                <div class="rocket-settings-modal" onClick={(e) => e.stopPropagation()}>
                    <div class="rocket-settings-header">
                        <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                            <Rocket size={18} />
                            <h3>Rocket Settings</h3>
                        </div>
                        <button class="close-btn" onClick={handleDone}>
                            <X size={20} />
                        </button>
                    </div>

                    <div class="rocket-settings-row">
                        <label>URL</label>
                        <input
                            type="text"
                            value={url()}
                            onInput={(e) => setUrl(e.currentTarget.value)}
                            placeholder="http://localhost:3088"
                            spellcheck={false}
                        />
                    </div>

                    <div class="rocket-settings-row">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email()}
                            onInput={(e) => setEmail(e.currentTarget.value)}
                            placeholder="admin@localhost"
                            spellcheck={false}
                        />
                    </div>

                    <div class="rocket-settings-row">
                        <label>Password</label>
                        <div class="rocket-settings-key-input">
                            <input
                                type={showPassword() ? 'text' : 'password'}
                                value={password()}
                                onInput={(e) => setPassword(e.currentTarget.value)}
                                placeholder="Enter password"
                            />
                            <button
                                class="rocket-settings-eye-btn"
                                onClick={() => setShowPassword(!showPassword())}
                                title={showPassword() ? 'Hide password' : 'Show password'}
                            >
                                {showPassword() ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>

                    <div class="rocket-settings-row">
                        <label>App Name</label>
                        <input
                            type="text"
                            value={appName()}
                            onInput={(e) => setAppName(e.currentTarget.value)}
                            placeholder="my-app"
                            spellcheck={false}
                        />
                    </div>

                    <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
                        <button
                            class="rocket-settings-test-btn"
                            onClick={handleTest}
                            disabled={testing()}
                        >
                            {testing() ? 'Testing...' : 'Test Connection'}
                        </button>
                        <Show when={testResult()}>
                            {(res) => (
                                <span class={`rocket-settings-test-result ${res().success ? 'success' : 'error'}`}>
                                    {res().message}
                                </span>
                            )}
                        </Show>
                    </div>

                    <p class="rocket-settings-note">
                        Credentials are stored locally in your browser. They are only sent to the Rocket Backend URL above.
                    </p>

                    <div class="rocket-settings-footer">
                        <button class="rocket-settings-done-btn" onClick={handleDone}>
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default RocketSettingsDialog;
