import { createSignal, Show } from "solid-js";
import { Check, AlertCircle, Info, X, Loader2 } from "lucide-solid";
import "./toast.css";

export type ToastType = 'success' | 'error' | 'info' | 'loading';

const [toast, setToast] = createSignal<{ message: string; type: ToastType; visible: boolean }>({
    message: "",
    type: "info",
    visible: false
});

let timeoutId: number;

export const showToast = (message: string, type: ToastType = 'info', duration = 3000) => {
    // Determine default duration for loading
    const finalDuration = type === 'loading' ? 0 : duration;

    setToast({ message, type, visible: true });

    if (timeoutId) clearTimeout(timeoutId);

    // Only set auto-hide if duration > 0
    if (finalDuration > 0) {
        timeoutId = window.setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, finalDuration);
    }
};

export const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
    if (timeoutId) clearTimeout(timeoutId);
};

const Toast = () => {
    return (
        <Show when={toast().visible}>
            <div class={`toast toast-${toast().type}`}>
                <div class="toast-icon">
                    <Show when={toast().type === 'success'}><Check size={18} /></Show>
                    <Show when={toast().type === 'error'}><AlertCircle size={18} /></Show>
                    <Show when={toast().type === 'info'}><Info size={18} /></Show>
                    <Show when={toast().type === 'loading'}><Loader2 size={18} class="spin" /></Show>
                </div>
                <div class="toast-message">{toast().message}</div>
                <button class="toast-close" onClick={hideToast}>
                    <X size={14} />
                </button>
            </div>
        </Show>
    );
};

export default Toast;
