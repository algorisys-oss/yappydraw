import { onCleanup } from "solid-js";

export function clickOutside(el: HTMLElement, accessor: () => () => void) {
    const onClick = (e: MouseEvent) => {
        if (!el.contains(e.target as Node)) {
            accessor()?.();
        }
    };
    document.body.addEventListener("click", onClick);

    onCleanup(() => {
        document.body.removeEventListener("click", onClick);
    });
}

// Add types for the directive
declare module "solid-js" {
    namespace JSX {
        interface Directives {
            clickOutside: () => void;
        }
    }
}
