import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import {
    X, Upload, Download, FolderOpen, Save, FileText,
    Image as ImageIcon, HelpCircle, AlertTriangle
} from "lucide-solid";
import "./load-export-dialog.css";
import { features } from "../config/features";

interface LoadExportDialogProps {
    isOpen: boolean;
    initialTab: 'load' | 'save';
    onClose: () => void;
    onLoadWorkspace: () => void;
    onLoadDisk: () => void;
    onSaveWorkspace: () => void;
    onSaveDisk: () => void;
    onSaveDiskJson: () => void;
    onExportImage: () => void;
    onExportHtml: () => void;
}

const LoadExportDialog: Component<LoadExportDialogProps> = (props) => {
    const [activeTab, setActiveTab] = createSignal<'load' | 'save'>(props.initialTab);

    createEffect(() => {
        if (props.isOpen) {
            setActiveTab(props.initialTab);
        }
    });

    // Handle Escape key to close dialog
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

    return (
        <Show when={props.isOpen}>
            <div class="load-export-backdrop" onClick={props.onClose}>
                <div class="load-export-dialog" onClick={(e) => e.stopPropagation()}>
                    <div class="dialog-header">
                        <div class="tabs">
                            <button
                                class={`tab-btn ${activeTab() === 'load' ? 'active' : ''}`}
                                onClick={() => setActiveTab('load')}
                            >
                                <Upload size={18} />
                                <span>Load</span>
                            </button>
                            <button
                                class={`tab-btn ${activeTab() === 'save' ? 'active' : ''}`}
                                onClick={() => setActiveTab('save')}
                            >
                                <Download size={18} />
                                <span>Export / Save</span>
                            </button>
                        </div>
                        <button class="close-btn" onClick={props.onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div class="dialog-content">
                        <Show when={activeTab() === 'load'}>
                            <div class="alert-box warning">
                                <AlertTriangle size={24} />
                                <div class="alert-text">
                                    <strong>Loading a file</strong> will <strong>replace your existing content</strong>.
                                    You can back up your drawing first using the save options.
                                </div>
                            </div>

                            <div class="options-grid">
                                <div class="option-card" onClick={props.onLoadDisk}>
                                    <div class="option-icon disk">
                                        <Upload size={32} />
                                    </div>
                                    <div class="option-info">
                                        <h4>Load from file</h4>
                                        <p>Open a .yappy or .json sketch file from your device</p>
                                    </div>
                                    <button class="action-trigger">Load from file</button>
                                </div>

                                <Show when={features.enableWorkspacePersistence}>
                                    <div class="option-card" onClick={props.onLoadWorkspace}>
                                        <div class="option-icon workspace">
                                            <FolderOpen size={32} />
                                        </div>
                                        <div class="option-info">
                                            <h4>Open from Workspace</h4>
                                            <p>Load a drawing saved in your local workspace</p>
                                        </div>
                                        <button class="action-trigger">Open Workspace</button>
                                    </div>
                                </Show>
                            </div>
                        </Show>

                        <Show when={activeTab() === 'save'}>
                            <div class="options-grid horizontal">
                                <div class="option-card compact" onClick={props.onSaveDisk}>
                                    <div class="option-icon disk">
                                        <Download size={24} />
                                    </div>
                                    <div class="option-info">
                                        <h4>Save to disk</h4>
                                        <p>Export your drawing to a file for backup</p>
                                    </div>
                                    <button class="action-trigger secondary">Save to disk</button>
                                </div>

                                <div class="option-card compact" onClick={props.onExportImage}>
                                    <div class="option-icon image">
                                        <ImageIcon size={24} />
                                    </div>
                                    <div class="option-info">
                                        <h4>Export as image</h4>
                                        <p>Download your drawing as a PNG or SVG</p>
                                    </div>
                                    <button class="action-trigger secondary">Export as image</button>
                                </div>

                                <div class="option-card compact" onClick={props.onSaveDiskJson}>
                                    <div class="option-icon disk">
                                        <FileText size={24} />
                                    </div>
                                    <div class="option-info">
                                        <h4>Save as JSON</h4>
                                        <p>Export uncompressed legacy format</p>
                                    </div>
                                    <button class="action-trigger secondary">Save JSON</button>
                                </div>

                                <div class="option-card compact" onClick={props.onExportHtml}>
                                    <div class="option-icon image">
                                        <FileText size={24} />
                                    </div>
                                    <div class="option-info">
                                        <h4>Export as HTML</h4>
                                        <p>Save as a standalone presentation file</p>
                                    </div>
                                    <button class="action-trigger secondary">Export HTML</button>
                                </div>

                                <Show when={features.enableWorkspacePersistence}>
                                    <div class="option-card compact" onClick={props.onSaveWorkspace}>
                                        <div class="option-icon workspace">
                                            <Save size={24} />
                                        </div>
                                        <div class="option-info">
                                            <h4>Save to Workspace</h4>
                                            <p>Save drawing to your internal browser storage</p>
                                        </div>
                                        <button class="action-trigger secondary">Save Workspace</button>
                                    </div>
                                </Show>
                            </div>
                        </Show>
                    </div>

                    <div class="dialog-footer">
                        <div class="help-tip">
                            <HelpCircle size={14} />
                            <span>.yappy / .json (yappy exported) or Workspace data is stored locally in your browser.</span>
                        </div>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default LoadExportDialog;
