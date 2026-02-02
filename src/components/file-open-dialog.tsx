import { type Component, createSignal, onMount, createEffect, For, Show } from "solid-js";
import { storage } from "../storage/file-system-storage";
import { showToast } from "./toast";
import { X, FileText, Trash2 } from "lucide-solid";
import "./file-open-dialog.css";

interface FileOpenDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (id: string) => void;
}

const FileOpenDialog: Component<FileOpenDialogProps> = (props) => {
    const [files, setFiles] = createSignal<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = createSignal(false);
    const [activeId, setActiveId] = createSignal<string | null>(null);
    const [isKeyboardNavigating, setIsKeyboardNavigating] = createSignal(false);
    let lastMouseX = 0;
    let lastMouseY = 0;

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const list = await storage.listDrawings();
            const fileObjects = list
                .map(f => {
                    return { id: f, name: f };
                })
                .sort((a, b) => a.name.localeCompare(b.name));

            setFiles(fileObjects);
            if (fileObjects.length > 0) setActiveId(fileObjects[0].id);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (fileId: string, e: Event) => {
        e.stopPropagation();
        const displayName = fileId;
        if (confirm(`Are you sure you want to delete "${displayName}"?`)) {
            try {
                await storage.deleteDrawing(fileId);
                fetchFiles();
                showToast(`Deleted "${displayName}"`, 'success');
            } catch (err) {
                showToast('Failed to delete file', 'error');
            }
        }
    };

    onMount(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!props.isOpen) return;

            const fileList = files();
            console.log("FileOpenDialog Key:", e.key, { files: fileList.length, activeId: activeId() });

            if (fileList.length === 0) return;

            const currentId = activeId();
            const currentIndex = fileList.findIndex(f => f.id === currentId);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopImmediatePropagation();
                setIsKeyboardNavigating(true);
                const nextIndex = (currentIndex + 1) % fileList.length;
                setActiveId(fileList[nextIndex].id);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopImmediatePropagation();
                setIsKeyboardNavigating(true);
                const prevIndex = (currentIndex - 1 + fileList.length) % fileList.length;
                setActiveId(fileList[prevIndex].id);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (currentId) {
                    props.onSelect(currentId);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                props.onClose();
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            // Only deactivate keyboard navigating if the mouse actually moved significantly
            // Scrolling can trigger mousemove events in some browsers even if the physical mouse is still
            if (Math.abs(e.clientX - lastMouseX) > 2 || Math.abs(e.clientY - lastMouseY) > 2) {
                setIsKeyboardNavigating(false);
            }
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        };

        window.addEventListener('keydown', handleKeyDown, true); // Use capture phase to prioritize
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    });

    createEffect(() => {
        if (props.isOpen) {
            // Force focus to window/body to ensure key events are captured immediately
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            window.focus();

            console.log("FileOpenDialog opened. Fetching files...");
            fetchFiles();
        }
    });

    createEffect(() => {
        const id = activeId();
        if (id && props.isOpen && isKeyboardNavigating()) {
            // Wait for Solid to update the DOM
            setTimeout(() => {
                const activeEl = document.querySelector('.file-item.active');
                if (activeEl) {
                    activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }, 0);
        }
    });

    return (
        <Show when={props.isOpen}>
            <div class="modal-overlay" onClick={props.onClose}>
                <div class="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div class="modal-header">
                        <h3>Open Drawing</h3>
                        <button class="close-btn" onClick={props.onClose}>
                            <X size={20} />
                        </button>
                    </div>
                    <div class="modal-body">
                        <Show when={loading()}>
                            <div class="loading">Loading...</div>
                        </Show>
                        <Show when={!loading() && files().length === 0}>
                            <div class="empty">No saved drawings found.</div>
                        </Show>
                        <div class="file-list">
                            <For each={files()}>
                                {(file) => (
                                    <div
                                        class={`file-item ${activeId() === file.id ? 'active' : ''}`}
                                        onClick={() => props.onSelect(file.id)}
                                        onMouseEnter={() => {
                                            if (!isKeyboardNavigating()) {
                                                setActiveId(file.id);
                                            }
                                        }}
                                    >
                                        <div style={{ display: 'flex', "align-items": 'center', gap: '8px', flex: 1 }}>
                                            <FileText size={16} />
                                            <span>{file.name}</span>
                                        </div>
                                        <button class="delete-file-btn" onClick={(e) => handleDelete(file.id, e)} title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default FileOpenDialog;
