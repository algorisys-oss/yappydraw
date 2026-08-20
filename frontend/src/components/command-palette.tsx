import { type Component, createSignal, createEffect, For, Show } from "solid-js";
import { store, toggleCommandPalette } from "../store/app-store";
import { searchCommands } from "../utils/command-registry";
import { t } from "../i18n";
import "./command-palette.css";

const CommandPalette: Component = () => {
    const [query, setQuery] = createSignal("");
    const [selectedIndex, setSelectedIndex] = createSignal(0);
    let inputRef: HTMLInputElement | undefined;

    const filter = () => store.commandPaletteFilter ?? undefined;
    const results = () => searchCommands(query(), filter());

    createEffect(() => {
        if (store.showCommandPalette) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef?.focus(), 10);
        }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
        const items = results();
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((i) => (i + 1) % items.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((i) => (i - 1 + items.length) % items.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            const item = items[selectedIndex()];
            if (item) {
                item.action();
                toggleCommandPalette(false);
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            toggleCommandPalette(false);
        }
    };

    const placeholder = () => {
        const f = filter();
        if (f === 'Shapes') return t("commandPalette.placeholderShapes");
        return t("commandPalette.placeholder");
    };

    return (
        <Show when={store.showCommandPalette}>
            <div class="command-palette-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !window.getSelection()?.toString()) toggleCommandPalette(false); }}>
                <div class="command-palette-container" onClick={(e) => e.stopPropagation()}>
                    <div class="command-palette-search">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={placeholder()}
                            value={query()}
                            onInput={(e) => {
                                setQuery(e.currentTarget.value);
                                setSelectedIndex(0);
                            }}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <div class="command-palette-results">
                        <For each={results()}>
                            {(item, index) => (
                                <div
                                    class={`command-palette-item ${index() === selectedIndex() ? "selected" : ""}`}
                                    onClick={() => {
                                        item.action();
                                        toggleCommandPalette(false);
                                    }}
                                    onMouseEnter={() => setSelectedIndex(index())}
                                >
                                    <div class="command-palette-item-info">
                                        <span class="command-palette-item-category">{t(`commandCategory.${item.category}`)}</span>
                                        <span class="command-palette-item-label">{item.label}</span>
                                    </div>
                                    <Show when={item.shortcut}>
                                        <span class="command-palette-item-shortcut">{item.shortcut}</span>
                                    </Show>
                                </div>
                            )}
                        </For>
                        <Show when={results().length === 0}>
                            <div class="command-palette-no-results">{t("commandPalette.noResults")}</div>
                        </Show>
                    </div>
                    <div class="command-palette-footer">
                        <span>{t("commandPalette.hintNavigate")}</span>
                        <span>{t("commandPalette.hintSelect")}</span>
                        <span>{t("commandPalette.hintClose")}</span>
                        <Show when={!filter()}>
                            <span>{t("commandPalette.hintShapes")}</span>
                        </Show>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default CommandPalette;
