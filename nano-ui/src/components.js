import { createEffect, createMemo, createSignal } from "./runtime.js";
import { attachCleanup, For, onEnter, tags } from "./dom.js";

const { a, button, div, nav, span, table, tbody, td, th, thead, tr } = tags;

/**
 * Small modal service. The content is a component factory, which means modal
 * state is created only while the modal is open and is disposed with the DOM.
 */
export function createModalController({ closeOnBackdrop = true } = {}) {
    const [content, setContent] = createSignal(null);

    const openModal = (component) => setContent(() => component);
    const closeModal = () => setContent(null);

    const onKeydown = (event) => {
        if (event.key === "Escape" && content()) closeModal();
    };
    if (typeof window !== "undefined") window.addEventListener("keydown", onKeydown);

    function ModalHost() {
        return () => {
            const component = content();
            if (!component) return null;

            return div({
                class: "modal-backdrop",
                onClick: (event) => {
                    if (closeOnBackdrop && event.target?.classList?.contains("modal-backdrop")) {
                        closeModal();
                    }
                }
            },
                div({ class: "modal-content" },
                    button({
                        class: "modal-close",
                        onClick: closeModal,
                        ariaLabel: "Close Modal",
                        type: "button"
                    }, "×"),
                    component()
                )
            );
        };
    }

    const destroy = () => {
        if (typeof window !== "undefined") window.removeEventListener("keydown", onKeydown);
        closeModal();
    };

    return { modalContent: content, openModal, closeModal, ModalHost, destroy };
}

/**
 * Responsive navigation shell. `current` may be a signal getter or a plain
 * page id. Each item accepts { id, label, icon, href }.
 */
export function Sidebar({
    title = "App",
    items = [],
    current,
    initiallyCollapsed = true,
    mobileBreakpoint = 768,
    onNavigate
}) {
    const [collapsed, setCollapsed] = createSignal(initiallyCollapsed);
    const currentValue = () => (typeof current === "function" ? current() : current);

    const navigate = (item, event) => {
        onNavigate?.(item, event);
        if (window.innerWidth <= mobileBreakpoint) setCollapsed(true);
    };

    return div({ class: () => `sidebar ${collapsed() ? "collapsed" : ""}` },
        div({ class: "sidebar-header" },
            span({ class: "sidebar-title" }, title),
            button({
                class: "sidebar-toggle",
                onClick: () => setCollapsed((value) => !value),
                title: "Toggle Sidebar",
                type: "button"
            }, () => (collapsed() ? "»" : "«"))
        ),
        nav({ style: { display: "flex", flexDirection: "column", width: "100%" } },
            items.map((item) => a({
                href: item.href ?? `#${item.id}`,
                class: () => `nav-item ${currentValue() === item.id ? "active" : ""}`,
                title: () => collapsed() ? item.label : "",
                tabindex: "0",
                onClick: (event) => navigate(item, event)
            },
                span({ class: "nav-icon" }, item.icon ?? ""),
                span({ class: "nav-text" }, item.label)
            ))
        )
    );
}

export function getThemeRowHeight(fallback = 52) {
    if (typeof document === "undefined") return fallback;
    const value = getComputedStyle(document.documentElement)
        .getPropertyValue("--row-height");
    return parseInt(value, 10) || fallback;
}

/**
 * Variable-height virtual table. `items` is a signal getter, `renderRow`
 * receives a signal for one item, and `header` is a table-row node or factory.
 */
export function VirtualTable({
    items,
    visibleHeight = 500,
    renderRow,
    header = () => tr(),
    estimatedRowHeight = getThemeRowHeight(),
    overscan = 5
}) {
    const [scrollTop, setScrollTop] = createSignal(0);
    const [heights, setHeights] = createSignal({});
    const rowObserver = typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver((entries) => {
            window.requestAnimationFrame(() => {
                const next = { ...heights() };
                let changed = false;

                entries.forEach((entry) => {
                    const index = Number(entry.target.dataset.index);
                    if (Number.isNaN(index)) return;
                    const box = Array.isArray(entry.borderBoxSize)
                        ? entry.borderBoxSize[0]
                        : entry.borderBoxSize;
                    const height = box?.blockSize ?? entry.contentRect.height;
                    if (next[index] !== height) {
                        next[index] = height;
                        changed = true;
                    }
                });

                if (changed) setHeights(next);
            });
        });

    const offsets = createMemo(() => {
        const list = items() || [];
        const knownHeights = heights();
        const result = new Float32Array(list.length + 1);
        for (let index = 0; index < list.length; index += 1) {
            result[index + 1] = result[index] +
                (knownHeights[index] || estimatedRowHeight);
        }
        return result;
    });

    const viewportState = createMemo(() => {
        const list = items() || [];
        const offset = offsets();
        const scroll = scrollTop();
        const count = list.length;

        let low = 0;
        let high = count;
        while (low < high) {
            const middle = (low + high) >>> 1;
            if (offset[middle] < scroll) low = middle + 1;
            else high = middle;
        }
        const start = Math.max(0, low - 1);

        low = start;
        high = count;
        const target = scroll + visibleHeight;
        while (low < high) {
            const middle = (low + high) >>> 1;
            if (offset[middle] < target) low = middle + 1;
            else high = middle;
        }

        const end = low;
        const sliceStart = Math.max(0, start - overscan);
        const sliceEnd = Math.min(count, end + overscan);

        return {
            slice: list.slice(sliceStart, sliceEnd)
                .map((data, index) => ({ data, index: sliceStart + index })),
            top: offset[sliceStart] || 0,
            bottom: (offset[count] || 0) - (offset[sliceEnd] || 0)
        };
    });

    const wrappedRender = (itemSignal) => {
        const node = renderRow(() => itemSignal().data);
        createEffect(() => {
            node.dataset.index = itemSignal().index;
        }, node);

        if (rowObserver) {
            rowObserver.observe(node);
            attachCleanup(node, () => rowObserver.unobserve(node));
        }
        return node;
    };

    const headerNode = typeof header === "function" ? header() : header;
    const scroller = div({
        class: "virtual-scroller",
        style: { height: `${visibleHeight}px`, overflowY: "auto", position: "relative" },
        onScroll: (event) => setScrollTop(event.target.scrollTop)
    },
        table({},
            thead({}, headerNode),
            tbody({},
                () => {
                    const height = viewportState().top;
                    return height > 0
                        ? tr({ style: { height: `${height}px` }, "aria-hidden": "true" },
                            td({ colspan: 3, style: { padding: 0, border: 0 } }))
                        : null;
                },
                For(() => viewportState().slice, wrappedRender,
                    (entry) => entry.data?.id ?? entry.index),
                () => {
                    const height = viewportState().bottom;
                    return height > 0
                        ? tr({ style: { height: `${height}px` }, "aria-hidden": "true" },
                            td({ colspan: 3, style: { padding: 0, border: 0 } }))
                        : null;
                }
            )
        )
    );

    if (rowObserver) attachCleanup(scroller, () => rowObserver.disconnect());
    return scroller;
}

export { onEnter };
