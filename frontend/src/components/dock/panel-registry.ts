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
import DockComicPanel from "./comic-panel";

// Migrated existing panels (Phase D) — registered body-only; chrome comes from PanelChrome.
const HistoryPanel = lazy(() => import("../history-panel"));
const SwatchesPanel = lazy(() => import("../swatches-panel"));
const GraphicStylesPanel = lazy(() => import("../graphic-styles-panel"));
const PatternsPanel = lazy(() => import("../patterns-panel"));
const SymbolsPanel = lazy(() => import("../symbols-panel"));
const RecolorPanel = lazy(() => import("../recolor-panel"));
const BrandKitPanel = lazy(() => import("../brand-kit-panel"));
const ElementsPanel = lazy(() => import("../elements-panel"));
const StatePanel = lazy(() => import("../state-panel").then(m => ({ default: m.StatePanel })));
const BehaviorsPanel = lazy(() => import("../behaviors-panel"));
const StickFigurePanel = lazy(() => import("../stick-figure-panel"));
const VectorToolsPanel = lazy(() => import("../vector-tools-panel"));
const LayerPanel = lazy(() => import("../layer-panel"));

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
    { id: 'graphicStyles', title: 'Graphic Styles', component: GraphicStylesPanel },
    { id: 'patterns', title: 'Patterns', component: PatternsPanel },
    { id: 'symbols', title: 'Symbols', component: SymbolsPanel },
    { id: 'recolor', title: 'Recolor Artwork', component: RecolorPanel },
    { id: 'brandKit', title: 'Brand Kit', component: BrandKitPanel },
    { id: 'elements', title: 'Elements', component: ElementsPanel },
    { id: 'state', title: 'Display States', component: StatePanel },
    { id: 'behaviors', title: 'Behaviors', component: BehaviorsPanel },
    { id: 'stickFigure', title: 'Stick Figures', component: StickFigurePanel },
    { id: 'comic', title: 'Comic Studio', component: DockComicPanel },
    { id: 'vectorTools', title: 'Vector Tools', component: VectorToolsPanel },
    { id: 'layers', title: 'Layers', component: LayerPanel },
];

export function panelDef(id: string): PanelDef | undefined {
    return PANEL_REGISTRY.find(p => p.id === id);
}
