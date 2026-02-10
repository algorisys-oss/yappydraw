/**
 * DS Operations Panel
 * Floating panel for live CRUD operations on DS shapes during presentation mode.
 * Appears when presenter clicks a DS element, shows type-specific operation buttons.
 * Includes algorithm buttons (sort/search/traverse) with speed control and stop.
 */

import { type Component, Show, createSignal, createMemo, createEffect, onCleanup, For } from 'solid-js';
import { store } from '../store/app-store';
import { setActiveDsOpsElement } from '../store/app-store';
import {
    executeDsOperation, executeDsSortSearch, getOperationsForType,
    abortDsAlgorithm,
    getDsAnimationSpeed, setDsAnimationSpeed,
    type DsOperation,
} from '../utils/ds-operations';

const DsOpsPanel: Component = () => {
    const [inputValue, setInputValue] = createSignal('');
    const [keyValue, setKeyValue] = createSignal('');
    const [indexValue, setIndexValue] = createSignal('');
    const [isAnimating, setIsAnimating] = createSignal(false);
    const [algoRunning, setAlgoRunning] = createSignal(false);
    const [animSpeed, setAnimSpeed] = createSignal<'slow' | 'medium' | 'fast'>(getDsAnimationSpeed());
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const element = createMemo(() => {
        const id = store.activeDsOpsElementId;
        if (!id) return null;
        return store.elements.find(e => e.id === id) ?? null;
    });

    const allOperations = createMemo(() => {
        const el = element();
        if (!el) return [];
        return getOperationsForType(el.type);
    });

    const crudOps = createMemo(() => allOperations().filter(o => !o.isAlgorithm));
    const algoOps = createMemo(() => allOperations().filter(o => o.isAlgorithm));

    const needsKeyInput = createMemo(() => element()?.type === 'dsHashTable');
    const needsIndexInput = createMemo(() => element()?.type === 'dsArray');

    // Auto-hide after 30 seconds of inactivity (only when not running algo)
    const resetAutoHide = () => {
        if (hideTimer) clearTimeout(hideTimer);
        if (algoRunning()) return;
        hideTimer = setTimeout(() => {
            setActiveDsOpsElement(null);
        }, 30000);
    };

    createEffect(() => {
        if (element()) {
            resetAutoHide();
        }
        return () => { if (hideTimer) clearTimeout(hideTimer); };
    });

    onCleanup(() => {
        if (hideTimer) clearTimeout(hideTimer);
    });

    // Panel position: below the DS element
    const panelPosition = createMemo(() => {
        const el = element();
        if (!el) return { x: 0, y: 0 };
        const { scale, panX, panY } = store.viewState;
        const screenX = (el.x + el.width / 2) * scale + panX;
        const screenY = (el.y + el.height) * scale + panY + 12;
        const panelWidth = 320;
        const clampedX = Math.max(10, Math.min(screenX - panelWidth / 2, window.innerWidth - panelWidth - 10));
        const clampedY = Math.min(screenY, window.innerHeight - 200);
        return { x: clampedX, y: clampedY };
    });

    const handleOperation = async (op: DsOperation) => {
        const el = element();
        if (!el || isAnimating() || algoRunning()) return;

        if (op.isAlgorithm) {
            // Validate search value if needed
            if (op.needsValue && !inputValue().trim()) return;

            setAlgoRunning(true);
            try {
                await executeDsSortSearch(el.id, op.action, {
                    value: inputValue().trim(),
                });
            } finally {
                setAlgoRunning(false);
                resetAutoHide();
            }
            return;
        }

        // CRUD operation
        if (op.needsValue && !inputValue().trim() && !op.needsKey) return;
        if (op.needsKey && !keyValue().trim()) return;

        setIsAnimating(true);
        resetAutoHide();

        try {
            await executeDsOperation(el.id, op.action, {
                value: inputValue().trim(),
                key: keyValue().trim(),
                index: parseInt(indexValue()) || 0,
            });
        } finally {
            setInputValue('');
            setKeyValue('');
            setIndexValue('');
            setIsAnimating(false);
        }
    };

    const handleStop = () => {
        abortDsAlgorithm();
        setAlgoRunning(false);
    };

    const handleSpeedChange = (speed: 'slow' | 'medium' | 'fast') => {
        setAnimSpeed(speed);
        setDsAnimationSpeed(speed);
    };

    // Handle Enter key on inputs — trigger first applicable operation
    const handleInputKeyDown = (e: KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
            if (algoRunning()) {
                handleStop();
            } else {
                setActiveDsOpsElement(null);
            }
            return;
        }
        if (e.key === 'Enter') {
            const ops = crudOps();
            const op = ops.find(o => {
                if (o.needsValue && !inputValue().trim() && !o.needsKey) return false;
                if (o.needsKey && !keyValue().trim()) return false;
                return true;
            });
            if (op) handleOperation(op);
        }
    };

    // Prevent keyboard events from bubbling to presentation handler
    const stopPropagation = (e: KeyboardEvent) => {
        e.stopPropagation();
    };

    const speedLabels: Record<string, string> = { slow: '0.5x', medium: '1x', fast: '2x' };

    return (
        <Show when={store.appMode === 'presentation' && element()}>
            <div
                style={{
                    position: 'fixed',
                    left: `${panelPosition().x}px`,
                    top: `${panelPosition().y}px`,
                    'z-index': 10001,
                    'pointer-events': 'auto',
                }}
                onKeyDown={stopPropagation}
            >
                <div
                    style={{
                        display: 'flex',
                        'flex-direction': 'column',
                        gap: '8px',
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.92)',
                        'backdrop-filter': 'blur(12px)',
                        '-webkit-backdrop-filter': 'blur(12px)',
                        'border-radius': '10px',
                        'box-shadow': '0 8px 24px rgba(0, 0, 0, 0.18)',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        'min-width': '240px',
                        'max-width': '360px',
                        'font-family': "'Inter', system-ui, sans-serif",
                        'font-size': '13px',
                    }}
                >
                    {/* Type label */}
                    <div style={{
                        'font-size': '11px',
                        'font-weight': '600',
                        color: '#64748b',
                        'text-transform': 'uppercase',
                        'letter-spacing': '0.05em',
                    }}>
                        {element()?.type.replace('ds', '') || ''} Operations
                    </div>

                    {/* Input row */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <Show when={needsKeyInput()}>
                            <input
                                type="text"
                                placeholder="Key"
                                value={keyValue()}
                                onInput={(e) => { setKeyValue(e.currentTarget.value); resetAutoHide(); }}
                                onKeyDown={handleInputKeyDown}
                                style={{
                                    flex: '1',
                                    padding: '5px 8px',
                                    border: '1px solid #e2e8f0',
                                    'border-radius': '6px',
                                    'font-size': '13px',
                                    outline: 'none',
                                    background: 'white',
                                    'min-width': '0',
                                }}
                            />
                        </Show>
                        <input
                            type="text"
                            placeholder="Value"
                            value={inputValue()}
                            onInput={(e) => { setInputValue(e.currentTarget.value); resetAutoHide(); }}
                            onKeyDown={handleInputKeyDown}
                            style={{
                                flex: '1',
                                padding: '5px 8px',
                                border: '1px solid #e2e8f0',
                                'border-radius': '6px',
                                'font-size': '13px',
                                outline: 'none',
                                background: 'white',
                                'min-width': '0',
                            }}
                        />
                        <Show when={needsIndexInput()}>
                            <input
                                type="number"
                                placeholder="Idx"
                                value={indexValue()}
                                onInput={(e) => { setIndexValue(e.currentTarget.value); resetAutoHide(); }}
                                onKeyDown={handleInputKeyDown}
                                style={{
                                    width: '52px',
                                    padding: '5px 6px',
                                    border: '1px solid #e2e8f0',
                                    'border-radius': '6px',
                                    'font-size': '13px',
                                    outline: 'none',
                                    background: 'white',
                                    'text-align': 'center',
                                }}
                            />
                        </Show>
                    </div>

                    {/* CRUD operation buttons */}
                    <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '4px' }}>
                        <For each={crudOps()}>
                            {(op) => (
                                <button
                                    onClick={() => handleOperation(op)}
                                    disabled={isAnimating() || algoRunning()}
                                    title={op.label}
                                    style={{
                                        padding: '4px 10px',
                                        'border-radius': '6px',
                                        border: '1px solid',
                                        'border-color': op.destructive ? '#fecaca' : '#e2e8f0',
                                        background: op.destructive ? '#fef2f2' : '#f8fafc',
                                        color: op.destructive ? '#dc2626' : '#334155',
                                        'font-size': '12px',
                                        'font-weight': '500',
                                        cursor: (isAnimating() || algoRunning()) ? 'not-allowed' : 'pointer',
                                        opacity: (isAnimating() || algoRunning()) ? '0.5' : '1',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isAnimating() && !algoRunning()) {
                                            e.currentTarget.style.background = op.destructive ? '#fee2e2' : '#e2e8f0';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = op.destructive ? '#fef2f2' : '#f8fafc';
                                    }}
                                >
                                    {op.label}
                                </button>
                            )}
                        </For>
                    </div>

                    {/* Algorithm section */}
                    <Show when={algoOps().length > 0}>
                        {/* Separator */}
                        <div style={{
                            height: '1px',
                            background: '#e2e8f0',
                            margin: '2px 0',
                        }} />

                        {/* Speed control + Stop */}
                        <div style={{
                            display: 'flex',
                            'align-items': 'center',
                            'justify-content': 'space-between',
                            gap: '6px',
                        }}>
                            <div style={{
                                display: 'flex',
                                'border-radius': '6px',
                                border: '1px solid #e2e8f0',
                                overflow: 'hidden',
                            }}>
                                {(['slow', 'medium', 'fast'] as const).map((speed) => (
                                    <button
                                        onClick={() => handleSpeedChange(speed)}
                                        style={{
                                            padding: '3px 8px',
                                            border: 'none',
                                            background: animSpeed() === speed ? '#7c3aed' : '#f8fafc',
                                            color: animSpeed() === speed ? 'white' : '#64748b',
                                            'font-size': '11px',
                                            'font-weight': '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {speedLabels[speed]}
                                    </button>
                                ))}
                            </div>

                            <Show when={algoRunning()}>
                                <button
                                    onClick={handleStop}
                                    style={{
                                        padding: '3px 12px',
                                        'border-radius': '6px',
                                        border: '1px solid #fecaca',
                                        background: '#dc2626',
                                        color: 'white',
                                        'font-size': '11px',
                                        'font-weight': '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    Stop
                                </button>
                            </Show>
                        </div>

                        {/* Algorithm buttons */}
                        <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '4px' }}>
                            <For each={algoOps()}>
                                {(op) => (
                                    <button
                                        onClick={() => handleOperation(op)}
                                        disabled={isAnimating() || algoRunning()}
                                        title={op.label}
                                        style={{
                                            padding: '4px 10px',
                                            'border-radius': '6px',
                                            border: '1px solid #ddd6fe',
                                            background: algoRunning() ? '#f5f3ff' : '#ede9fe',
                                            color: '#7c3aed',
                                            'font-size': '12px',
                                            'font-weight': '500',
                                            cursor: (isAnimating() || algoRunning()) ? 'not-allowed' : 'pointer',
                                            opacity: (isAnimating() || algoRunning()) ? '0.5' : '1',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isAnimating() && !algoRunning()) {
                                                e.currentTarget.style.background = '#ddd6fe';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = algoRunning() ? '#f5f3ff' : '#ede9fe';
                                        }}
                                    >
                                        {op.label}
                                    </button>
                                )}
                            </For>
                        </div>
                    </Show>
                </div>
            </div>
        </Show>
    );
};

export default DsOpsPanel;
