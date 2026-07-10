/**
 * Registry of dock-native panels — id → title + component (body only; PanelChrome supplies the
 * title bar). A Window/Panels menu and the dock container both iterate this. Phase A ships one
 * pilot (Effects); later phases migrate the existing panels here.
 */
import type { Component } from "solid-js";
import { lazy } from "solid-js";
import DockEffectsPanel from "./effects-panel";
import DockAlignPanel from "./align-panel";
import DockArrangePanel from "./arrange-panel";

// Migrated existing panels (Phase D) — registered body-only; chrome comes from PanelChrome.
const HistoryPanel = lazy(() => import("../history-panel"));
const SwatchesPanel = lazy(() => import("../swatches-panel"));

export interface PanelDef {
    id: string;
    title: string;
    component: Component;
}

export const PANEL_REGISTRY: PanelDef[] = [
    { id: 'effects', title: 'Effects', component: DockEffectsPanel },
    { id: 'align', title: 'Align & Distribute', component: DockAlignPanel },
    { id: 'arrange', title: 'Arrange', component: DockArrangePanel },
    { id: 'history', title: 'History', component: HistoryPanel },
    { id: 'swatches', title: 'Swatches', component: SwatchesPanel },
];

export function panelDef(id: string): PanelDef | undefined {
    return PANEL_REGISTRY.find(p => p.id === id);
}
