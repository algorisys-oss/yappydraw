import { type Component, children } from "solid-js";

const Sidebar: Component<{ children: any }> = (props) => {
    const c = children(() => props.children);
    return (
        <div style={{
            position: 'fixed',
            top: '60px', // Below toolbar
            left: '12px',
            bottom: '60px', // Above zoom controls
            display: 'flex',
            "flex-direction": 'column',
            gap: '12px',
            "pointer-events": 'none' // Allow clicking through to canvas, children need pointer-events: auto
        }}>
            {c()}
        </div>
    );
};

export default Sidebar;
