import { type Component } from "solid-js";
import { store, duplicateLayer, deleteLayer, mergeLayerDown, flattenLayers, isolateLayer, showAllLayers, updateLayer } from "../store/app-store";
import ContextMenu, { type MenuItem } from "./context-menu";

interface Props {
    x: number;
    y: number;
    layerId: string;
    onClose: () => void;
    onRename: (id: string) => void;
}

const LayerContextMenu: Component<Props> = (props) => {
    const layer = () => store.layers.find(l => l.id === props.layerId);

    if (!layer()) return null;

    const items: MenuItem[] = [
        {
            label: "Rename",
            onClick: () => props.onRename(props.layerId),
            shortcut: "Enter"
        },
        {
            label: "Duplicate",
            onClick: () => duplicateLayer(props.layerId),
            disabled: store.layers.length >= store.maxLayers
        },
        { separator: true },
        {
            label: layer()!.visible ? "Hide Layer" : "Show Layer",
            onClick: () => updateLayer(props.layerId, { visible: !layer()!.visible }),
            checked: layer()!.visible
        },
        {
            label: layer()!.locked ? "Unlock Layer" : "Lock Layer",
            onClick: () => updateLayer(props.layerId, { locked: !layer()!.locked }),
            checked: layer()!.locked
        },
        {
            label: "Isolate Layer",
            onClick: () => isolateLayer(props.layerId)
        },
        {
            label: "Show All Layers",
            onClick: () => showAllLayers()
        },
        { separator: true },
        {
            label: layer()!.isMaster ? "Disable Slide Master" : "Use as Slide Master",
            onClick: () => updateLayer(props.layerId, { isMaster: !layer()!.isMaster }),
            checked: layer()!.isMaster
        },
        {
            label: "Merge Down",
            onClick: () => mergeLayerDown(props.layerId),
            disabled: store.layers.findIndex(l => l.id === props.layerId) === 0 // 0 is bottom
        },
        {
            label: "Flatten Layers",
            onClick: () => flattenLayers(),
            disabled: store.layers.length <= 1
        },
        {
            label: "Delete",
            onClick: () => deleteLayer(props.layerId),
            disabled: store.layers.length <= 1,
            separator: false // Just being explicit
        },
        { separator: store.layerGroupingModeEnabled },
        ...((layer()?.parentId && store.layerGroupingModeEnabled) ? [{
            label: "Move to Top Level",
            onClick: () => updateLayer(props.layerId, { parentId: undefined })
        }] : []),
        ...(store.layerGroupingModeEnabled ?
            store.layers
                .filter(l => l.isGroup && l.id !== props.layerId && l.id !== layer()?.parentId)
                .map(group => ({
                    label: `Move to ${group.name}`,
                    onClick: () => updateLayer(props.layerId, { parentId: group.id })
                }))
            : []),
        ...((layer()?.isGroup && store.layerGroupingModeEnabled) ? [{
            label: layer()?.expanded ? "Collapse Group" : "Expand Group",
            onClick: () => updateLayer(props.layerId, { expanded: !layer()?.expanded })
        }] : [])
    ];

    return (
        <ContextMenu
            x={props.x}
            y={props.y}
            items={items}
            onClose={props.onClose}
        />
    );
};

export default LayerContextMenu;
