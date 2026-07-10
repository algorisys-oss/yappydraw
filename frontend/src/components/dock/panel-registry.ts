/**
 * Registry of dock-native panels — id → title + component (body only; PanelChrome supplies the
 * title bar). A Window/Panels menu and the dock container both iterate this. Phase A ships one
 * pilot (Effects); later phases migrate the existing panels here.
 */
import type { Component } from "solid-js";
import DockEffectsPanel from "./effects-panel";

export interface PanelDef {
    id: string;
    title: string;
    component: Component;
}

export const PANEL_REGISTRY: PanelDef[] = [
    { id: 'effects', title: 'Effects', component: DockEffectsPanel },
];

export function panelDef(id: string): PanelDef | undefined {
    return PANEL_REGISTRY.find(p => p.id === id);
}
