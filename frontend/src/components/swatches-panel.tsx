import { type Component, For, Show, createSignal, createMemo } from 'solid-js';
import {
    store, createSwatch, applySwatch, updateSwatchColor,
    renameSwatch, deleteSwatch, setSwatchGroup, renameSwatchGroup, deleteSwatchGroup,
    createSwatchGroupFromSelection,
} from '../store/app-store';
import type { Swatch } from '../types';
import { Plus, Trash2, FolderPlus } from 'lucide-solid';
import { t } from '../i18n';
import { sectionSwatches, nextFreeGroupName } from '../utils/swatch-groups';
import './swatches-panel.css';

/** Sentinel values for the per-swatch "move to group" menu. */
const NO_GROUP = '__yappy-no-group__';
const NEW_GROUP = '__yappy-new-group__';

/**
 * Document-level colour swatches with live links — click a chip to fill the selection; the colour
 * input recolours the swatch (and every linked object). Migrated onto the dockable-panel system
 * (Phase D): renders body-only (chrome from PanelChrome). The panel-specific "add swatch" action,
 * which used to live in the title bar, now sits in a small toolbar at the top of the body.
 *
 * **Groups are colour combinations.** The store has had named swatch groups (and the help page
 * described grouping) for a long time, but the panel only ever showed one flat grid, so a
 * designer had nowhere to keep "this design's palette" together (Anshika's review, Sep 2026).
 * Each group is its own section: made from the selection's colours, renamed by double-click,
 * extended from the selection, and deleted as a unit.
 */
const SwatchesPanel: Component = () => {
    const [editingId, setEditingId] = createSignal<string | null>(null);
    const [editingName, setEditingName] = createSignal('');
    // '' = no group being renamed (a group name is never empty).
    const [editingGroup, setEditingGroup] = createSignal('');
    const [groupName, setGroupName] = createSignal('');
    const startRename = (s: Swatch) => { setEditingId(s.id); setEditingName(s.name); };
    const commitRename = (id: string) => { renameSwatch(id, editingName()); setEditingId(null); setEditingName(''); };
    const commitGroupRename = (from: string) => { renameSwatchGroup(from, groupName()); setEditingGroup(''); setGroupName(''); };

    const sections = createMemo(() => sectionSwatches(store.swatches));
    const nextGroupName = () => nextFreeGroupName(store.swatches, n => t('swatchesPanel.defaultGroupName', { n }));

    const newGroupFromSelection = () => {
        const name = window.prompt(t('swatchesPanel.groupNamePrompt'), nextGroupName());
        if (name && name.trim()) createSwatchGroupFromSelection(name.trim());
    };

    const moveToGroup = (sw: Swatch, value: string) => {
        if (value === NEW_GROUP) {
            const name = window.prompt(t('swatchesPanel.groupNamePrompt'), nextGroupName());
            if (name && name.trim()) setSwatchGroup([sw.id], name.trim());
            return;
        }
        setSwatchGroup([sw.id], value === NO_GROUP ? null : value);
    };

    const removeGroup = (name: string, count: number) => {
        if (window.confirm(t('swatchesPanel.deleteGroupConfirm', { name, count }))) deleteSwatchGroup(name);
    };

    const card = (sw: Swatch) => (
        <div class="sw-card">
            <div class="sw-chip" style={{ background: sw.color }} title="Click: fill selection" onClick={() => applySwatch(sw.id, 'fill')}>
                <input class="sw-color" type="color" value={/^#[0-9a-fA-F]{6}$/.test(sw.color) ? sw.color : '#000000'} title="Edit swatch colour (updates linked objects)"
                    onClick={(e) => e.stopPropagation()}
                    onInput={(e) => updateSwatchColor(sw.id, e.currentTarget.value)} />
            </div>
            <Show when={editingId() === sw.id} fallback={
                <div class="sw-name" title={sw.name} onDblClick={() => startRename(sw)}>{sw.name}</div>
            }>
                <input class="sw-name-input" value={editingName()} autofocus
                    onInput={(e) => setEditingName(e.currentTarget.value)}
                    onBlur={() => commitRename(sw.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitRename(sw.id); else if (e.key === 'Escape') { setEditingId(null); setEditingName(''); } }} />
            </Show>
            <div class="sw-actions">
                <button class="sw-act" title="Apply as stroke" onClick={() => applySwatch(sw.id, 'stroke')}>S</button>
                {/* Value is reset to the current group after every change, so picking
                    "New group…" and cancelling the prompt leaves the menu honest. */}
                <select class="sw-group-select" title={t('swatchesPanel.moveToGroup')}
                    value={sw.group ?? NO_GROUP}
                    onChange={(e) => { const v = e.currentTarget.value; e.currentTarget.value = sw.group ?? NO_GROUP; moveToGroup(sw, v); }}>
                    <option value={NO_GROUP}>{t('swatchesPanel.noGroup')}</option>
                    <For each={sections().groups}>{(g) => <option value={g.name}>{g.name}</option>}</For>
                    <option value={NEW_GROUP}>{t('swatchesPanel.newGroupOption')}</option>
                </select>
                <button class="sw-act sw-danger" title="Delete swatch" onClick={() => deleteSwatch(sw.id)}><Trash2 size={12} /></button>
            </div>
        </div>
    );

    return (
        <div class="swatches-panel-body">
            <div class="sw-toolbar">
                <button class="sw-icon-btn" title="Add swatch (from selection's fill)" onClick={() => createSwatch()}><Plus size={15} /> Add</button>
                <button class="sw-icon-btn" title={t('swatchesPanel.newGroupTip')} onClick={newGroupFromSelection}>
                    <FolderPlus size={15} /> {t('swatchesPanel.newGroup')}
                </button>
            </div>
            <Show when={store.swatches.length > 0} fallback={
                <div class="sw-empty">No swatches yet.<br />Click <Plus size={12} /> to add one. Editing a swatch recolours every object linked to it.<br />{t('swatchesPanel.emptyGroupsHint')}</div>
            }>
                <For each={sections().groups}>
                    {(g) => (
                        <div class="sw-group">
                            <div class="sw-group-header">
                                <Show when={editingGroup() === g.name} fallback={
                                    <span class="sw-group-name" title={t('swatchesPanel.renameGroupTip')}
                                        onDblClick={() => { setEditingGroup(g.name); setGroupName(g.name); }}>{g.name}</span>
                                }>
                                    <input class="sw-name-input sw-group-name-input" value={groupName()} autofocus
                                        onInput={(e) => setGroupName(e.currentTarget.value)}
                                        onBlur={() => commitGroupRename(g.name)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') commitGroupRename(g.name); else if (e.key === 'Escape') setEditingGroup(''); }} />
                                </Show>
                                <span class="sw-group-strip" aria-hidden="true">
                                    <For each={g.swatches}>{(s) => <span style={{ background: s.color }} />}</For>
                                </span>
                                <button class="sw-act" title={t('swatchesPanel.addToGroupTip')} onClick={() => createSwatchGroupFromSelection(g.name)}><Plus size={12} /></button>
                                <button class="sw-act sw-danger" title={t('swatchesPanel.deleteGroupTip')} onClick={() => removeGroup(g.name, g.swatches.length)}><Trash2 size={12} /></button>
                            </div>
                            <div class="sw-grid">
                                <For each={g.swatches}>{card}</For>
                            </div>
                        </div>
                    )}
                </For>
                <Show when={sections().loose.length > 0}>
                    <div class="sw-group">
                        <Show when={sections().groups.length > 0}>
                            <div class="sw-group-header"><span class="sw-group-name sw-group-loose">{t('swatchesPanel.ungrouped')}</span></div>
                        </Show>
                        <div class="sw-grid">
                            <For each={sections().loose}>{card}</For>
                        </div>
                    </div>
                </Show>
            </Show>
        </div>
    );
};

export default SwatchesPanel;
