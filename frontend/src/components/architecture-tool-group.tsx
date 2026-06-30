import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setStore, setToolLocked } from "../store/app-store";
import type { ElementType } from "../types";
import {
    Server, Shield, User, Zap, Router, Globe, Shuffle, Rows, ChevronDown, Database,
    Binary, HardDrive, Package, Box, Cuboid, PackageOpen, Circle, CircleDot, Minus,
    GripVertical, Layers, Code, Network,
    Layout, Disc, List, FileText, Folder, Component as ComponentIcon,
    RectangleHorizontal, ArrowDown, Frame, ChevronRight, ChevronLeft, CircleDashed,
} from "lucide-solid";
import {
    KubernetesIcon, ContainerIcon, ApiGatewayIcon, CdnIcon, StorageBlobIcon,
    EventBusIcon, MicroserviceIcon, ShieldIcon,
} from "./cloud-infra-tool-group";
import "./pen-tool-group.css";
import "./architecture-tool-group.css";

type Tool = { type: ElementType; icon: Component<{ size?: number; color?: string }>; label: string };
type Section = { title: string; tools: Tool[] };

/**
 * Unified "Architecture" tool group — merges the former Infrastructure,
 * Cloud-Native and Technical groups into one fly-out with labelled sub-sections,
 * so every technical-architecture shape lives behind a single toolbar button.
 */
const sections: Section[] = [
    {
        title: 'Infrastructure',
        tools: [
            { type: 'database', icon: Database, label: 'Database' },
            { type: 'server', icon: Server, label: 'Server' },
            { type: 'loadBalancer', icon: Shuffle, label: 'Load Balancer' },
            { type: 'firewall', icon: Shield, label: 'Firewall' },
            { type: 'user', icon: User, label: 'User / Client' },
            { type: 'messageQueue', icon: Rows, label: 'Message Queue' },
            { type: 'lambda', icon: Zap, label: 'Lambda / Function' },
            { type: 'router', icon: Router, label: 'Router' },
            { type: 'browser', icon: Globe, label: 'Browser / Web' },
        ],
    },
    {
        title: 'Cloud-Native',
        tools: [
            { type: 'kubernetes', icon: KubernetesIcon, label: 'Kubernetes' },
            { type: 'container', icon: ContainerIcon, label: 'Container' },
            { type: 'apiGateway', icon: ApiGatewayIcon, label: 'API Gateway' },
            { type: 'cdn', icon: CdnIcon, label: 'CDN' },
            { type: 'storageBlob', icon: StorageBlobIcon, label: 'Storage Blob' },
            { type: 'eventBus', icon: EventBusIcon, label: 'Event Bus' },
            { type: 'microservice', icon: MicroserviceIcon, label: 'Microservice' },
            { type: 'shield', icon: ShieldIcon, label: 'Security Shield' },
        ],
    },
    {
        title: 'Blocks & 3D',
        tools: [
            { type: 'isometricCube', icon: Package, label: 'Isometric Cube' },
            { type: 'solidBlock', icon: Box, label: 'Solid Block' },
            { type: 'perspectiveBlock', icon: Cuboid, label: 'Perspective Block' },
            { type: 'openBox', icon: PackageOpen, label: 'Open Box' },
            { type: 'cylinder', icon: Database, label: 'Cylinder' },
        ],
    },
    {
        title: 'Data Flow',
        tools: [
            { type: 'dfdProcess', icon: Binary, label: 'DFD Process' },
            { type: 'dfdDataStore', icon: HardDrive, label: 'DFD Data Store' },
            { type: 'externalEntity', icon: Layers, label: 'External Entity' },
            { type: 'codeBlock', icon: Code, label: 'Code Block' },
        ],
    },
    {
        title: 'State',
        tools: [
            { type: 'stateStart', icon: Circle, label: 'Initial State' },
            { type: 'stateEnd', icon: CircleDot, label: 'Final State' },
            { type: 'stateSync', icon: Minus, label: 'Sync Bar' },
            { type: 'activationBar', icon: GripVertical, label: 'Activation Bar' },
        ],
    },
    {
        title: 'UML Structure',
        tools: [
            { type: 'umlClass', icon: Layout, label: 'Class' },
            { type: 'umlInterface', icon: Disc, label: 'Interface' },
            { type: 'umlEnum', icon: List, label: 'Enum' },
            { type: 'umlPackage', icon: Folder, label: 'Package' },
            { type: 'umlComponent', icon: ComponentIcon, label: 'Component' },
            { type: 'umlNote', icon: FileText, label: 'Note' },
        ],
    },
    {
        title: 'UML Behavior',
        tools: [
            { type: 'umlActor', icon: User, label: 'Actor' },
            { type: 'umlUseCase', icon: Circle, label: 'Use Case' },
            { type: 'umlState', icon: RectangleHorizontal, label: 'State' },
            { type: 'umlLifeline', icon: ArrowDown, label: 'Lifeline' },
            { type: 'umlFragment', icon: Frame, label: 'Fragment' },
            { type: 'umlSignalSend', icon: ChevronRight, label: 'Signal Send' },
            { type: 'umlSignalReceive', icon: ChevronLeft, label: 'Signal Receive' },
            { type: 'umlProvidedInterface', icon: CircleDot, label: 'Provided Interface' },
            { type: 'umlRequiredInterface', icon: CircleDashed, label: 'Required Interface' },
        ],
    },
];

const allTools: Tool[] = sections.flatMap(s => s.tools);
const archTypes = new Set<string>(allTools.map(t => t.type));

const ArchitectureToolGroup: Component = () => {
    const [isOpen, setIsOpen] = createSignal(false);
    // Remember the last architecture shape chosen so the toolbar button keeps its
    // icon and a single click re-activates it (parity with the other tool groups).
    const [lastType, setLastType] = createSignal<ElementType>('server');
    let buttonRef: HTMLButtonElement | undefined;
    let dropdownRef: HTMLDivElement | undefined;

    createEffect(() => {
        if (isOpen()) {
            const handler = (e: MouseEvent) => {
                const target = e.target as Node;
                if (buttonRef?.contains(target) || dropdownRef?.contains(target)) return;
                setIsOpen(false);
            };
            document.addEventListener('pointerdown', handler);
            onCleanup(() => document.removeEventListener('pointerdown', handler));
        }
    });

    const isActive = () => archTypes.has(store.selectedTool);
    const activeTool = (): Tool =>
        allTools.find(t => t.type === store.selectedTool)
        ?? allTools.find(t => t.type === lastType())
        ?? allTools[0];

    let clickTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastClickTime = 0;
    let lastClickType: string | null = null;

    const activate = (type: ElementType, lock: boolean) => {
        setLastType(type);
        setSelectedTool(type);
        if (lock) setToolLocked(true);
        setIsOpen(false);
    };

    const handleToolClick = (type: ElementType) => {
        const now = Date.now();
        const isDouble = type === lastClickType && now - lastClickTime < 400;
        lastClickTime = now;
        lastClickType = type;
        if (clickTimeout) clearTimeout(clickTimeout);
        if (isDouble) {
            clickTimeout = null;
            activate(type, true);
        } else {
            clickTimeout = setTimeout(() => { activate(type, false); clickTimeout = null; }, 300);
        }
    };

    const handleRightClick = (e: MouseEvent) => {
        e.preventDefault();
        setStore("showPropertyPanel", true);
        setStore("isPropertyPanelMinimized", false);
    };

    const toggleMenu = () => {
        if (!isActive()) setSelectedTool(lastType());
        setIsOpen(!isOpen());
    };

    const getDropdownPosition = () => {
        if (!buttonRef) return {};
        const rect = buttonRef.getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            return { bottom: `${window.innerHeight - rect.top + 8}px`, left: '50%', transform: 'translateX(-50%)' };
        }
        return { top: `${rect.bottom + 4}px`, left: `${rect.left}px` };
    };

    return (
        <div class="pen-tool-group">
            <button
                ref={buttonRef}
                class={`toolbar-btn ${isActive() ? 'active' : ''} ${isActive() && store.toolLocked ? 'tool-locked' : ''}`}
                on:click={toggleMenu}
                onContextMenu={handleRightClick}
                onDblClick={handleRightClick}
                title={`Architecture — ${activeTool().label}`}
            >
                <div class="tool-icon-wrapper">
                    {(() => { const Icon = activeTool().icon; return <Icon size={18} />; })()}
                    <ChevronDown size={9} class="submenu-indicator" />
                </div>
            </button>

            <Show when={isOpen()}>
                <Portal>
                    <div ref={dropdownRef} class="pen-tool-dropdown arch-dropdown" style={getDropdownPosition()}>
                        <div class="arch-dropdown-title"><Network size={13} /> Architecture</div>
                        {sections.map((section) => (
                            <div class="arch-section">
                                <div class="arch-section-title">{section.title}</div>
                                <div class="arch-section-grid">
                                    {section.tools.map((tool) => (
                                        <button
                                            class={`dropdown-item ${store.selectedTool === tool.type ? 'active' : ''}`}
                                            on:click={() => handleToolClick(tool.type)}
                                            title={`${tool.label} (double-click to lock)`}
                                        >
                                            <tool.icon size={16} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Portal>
            </Show>
        </div>
    );
};

export default ArchitectureToolGroup;
