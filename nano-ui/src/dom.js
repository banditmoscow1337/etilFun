import { createEffect, createSignal } from "./runtime.js";

const CLEANUP_KEY = Symbol("nano-cleanup");
let cleanupObserver = null;
const delegatedEvents = new Set();

function installCleanupObserver() {
    if (cleanupObserver || typeof MutationObserver === "undefined" || !document.body) return;

    cleanupObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => teardown(node));
        });
    });
    cleanupObserver.observe(document.body, { childList: true, subtree: true });
}

export function teardown(node) {
    if (!node) return;

    const cleanups = node[CLEANUP_KEY];
    if (cleanups) {
        node[CLEANUP_KEY] = null;
        cleanups.slice().forEach((dispose) => dispose());
    }

    if (node.nodeType === 1) {
        let child = node.firstChild;
        while (child) {
            const next = child.nextSibling;
            teardown(child);
            child = next;
        }
    }
}

export function attachCleanup(node, dispose) {
    if (!node || typeof dispose !== "function") return dispose;
    if (!node[CLEANUP_KEY]) node[CLEANUP_KEY] = [];
    node[CLEANUP_KEY].push(dispose);
    return dispose;
}

function isNode(value) {
    return typeof Node !== "undefined" && value instanceof Node;
}

function toNode(value) {
    if (isNode(value)) return value;
    if (value === null || value === undefined || value === false) return null;
    return document.createTextNode(String(value));
}

function normalizeChildren(value) {
    const values = Array.isArray(value) ? value.flat(Infinity) : [value];
    return values.map(toNode).filter(Boolean);
}

export function render(component, container) {
    if (!container) throw new Error("nano-ui render() requires a container");
    installCleanupObserver();
    teardown(container);
    container.replaceChildren();

    const result = typeof component === "function" ? component() : component;
    normalizeChildren(result).forEach((node) => container.appendChild(node));
    return result;
}

function getSequence(values) {
    const previous = values.slice();
    const result = [0];
    const length = values.length;

    for (let i = 0; i < length; i += 1) {
        const value = values[i];
        if (value === 0) continue;

        let last = result[result.length - 1];
        if (values[last] < value) {
            previous[i] = last;
            result.push(i);
            continue;
        }

        let low = 0;
        let high = result.length - 1;
        while (low < high) {
            const middle = (low + high) >> 1;
            if (values[result[middle]] < value) low = middle + 1;
            else high = middle;
        }
        if (value < values[result[low]]) {
            if (low > 0) previous[i] = result[low - 1];
            result[low] = i;
        }
    }

    let cursor = result.length;
    let value = result[cursor - 1];
    while (cursor > 0) {
        cursor -= 1;
        result[cursor] = value;
        value = previous[value];
    }
    return result;
}

/**
 * Keyed DOM reconciliation. The key is the node identity: For() reuses the
 * same node for a logical item, while this function only moves/inserts/removes
 * nodes in the DOM.
 */
export function reconcile(parent, anchor, oldNodes, newNodes) {
    let start = 0;
    let oldEnd = oldNodes.length - 1;
    let newEnd = newNodes.length - 1;

    while (start <= oldEnd && start <= newEnd && oldNodes[start] === newNodes[start]) start += 1;
    while (start <= oldEnd && start <= newEnd && oldNodes[oldEnd] === newNodes[newEnd]) {
        oldEnd -= 1;
        newEnd -= 1;
    }

    if (start > oldEnd) {
        if (start <= newEnd) {
            const reference = newEnd + 1 < newNodes.length ? newNodes[newEnd + 1] : anchor;
            while (start <= newEnd) {
                parent.insertBefore(newNodes[start], reference);
                start += 1;
            }
        }
        return newNodes;
    }

    if (start > newEnd) {
        while (start <= oldEnd) {
            teardown(oldNodes[start]);
            oldNodes[start].remove();
            start += 1;
        }
        return newNodes;
    }

    const oldStart = start;
    const newStart = start;
    const keyToNewIndex = new Map();
    for (let index = newStart; index <= newEnd; index += 1) {
        keyToNewIndex.set(newNodes[index], index);
    }

    const toPatch = newEnd - newStart + 1;
    const newIndexToOldIndex = new Array(toPatch).fill(0);
    let patched = 0;
    let moved = false;
    let maxNewIndex = 0;

    for (let index = oldStart; index <= oldEnd; index += 1) {
        const oldNode = oldNodes[index];
        if (patched >= toPatch) {
            teardown(oldNode);
            oldNode.remove();
            continue;
        }

        const newIndex = keyToNewIndex.get(oldNode);
        if (newIndex !== undefined) {
            newIndexToOldIndex[newIndex - newStart] = index + 1;
            if (newIndex >= maxNewIndex) maxNewIndex = newIndex;
            else moved = true;
            patched += 1;
        } else {
            teardown(oldNode);
            oldNode.remove();
        }
    }

    const stable = moved ? getSequence(newIndexToOldIndex) : [];
    let stableIndex = stable.length - 1;

    for (let offset = toPatch - 1; offset >= 0; offset -= 1) {
        const newIndex = newStart + offset;
        const reference = newIndex + 1 < newNodes.length ? newNodes[newIndex + 1] : anchor;

        if (newIndexToOldIndex[offset] === 0) {
            parent.insertBefore(newNodes[newIndex], reference);
        } else if (moved) {
            if (stableIndex < 0 || offset !== stable[stableIndex]) {
                parent.insertBefore(newNodes[newIndex], reference);
            } else {
                stableIndex -= 1;
            }
        }
    }

    return newNodes;
}

export function For(each, renderItem, keyOf = (item) => item?.id ?? item) {
    const cache = new Map();

    return () => {
        const list = each() || [];
        const keyUsage = new Map();

        const nodes = list.map((item) => {
            const key = keyOf(item);
            const occurrence = keyUsage.get(key) || 0;
            keyUsage.set(key, occurrence + 1);

            let bucket = cache.get(key);
            if (!bucket) {
                bucket = [];
                cache.set(key, bucket);
            }

            if (occurrence < bucket.length) {
                const entry = bucket[occurrence];
                entry.setItem(item);
                return entry.node;
            }

            const [getItem, setItem] = createSignal(item);
            const node = renderItem(getItem);
            bucket.push({ node, setItem });
            return node;
        });

        for (const [key, bucket] of cache) {
            const used = keyUsage.get(key) || 0;
            if (used < bucket.length) {
                bucket.splice(used).forEach(({ node }) => teardown(node));
            }
            if (bucket.length === 0) cache.delete(key);
        }

        return nodes;
    };
}

function ensureDelegated(eventName) {
    if (delegatedEvents.has(eventName)) return;
    delegatedEvents.add(eventName);

    const useCapture = eventName === "focus" || eventName === "blur";
    document.addEventListener(eventName, handleGlobalEvent, useCapture);
}

function handleGlobalEvent(event) {
    let target = event.target;
    if (target && target.nodeType !== 1) target = target.parentElement;

    while (target && target.nodeType === 1) {
        const handlers = target.__nanoEvents;
        const handler = handlers?.[event.type.toLowerCase()];
        if (handler) {
            handler(event);
            if (event.cancelBubble) break;
        }
        target = target.parentElement;
    }
}

function attributeName(key) {
    if (key === "className") return "class";
    if (key === "htmlFor") return "for";
    if (/^(aria|data)[A-Z]/.test(key)) {
        return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    }
    return key;
}

const booleanProperties = new Set([
    "checked", "disabled", "multiple", "selected", "autofocus", "required", "readonly"
]);

export function applyAttribute(element, key, value) {
    const name = attributeName(key);

    if (name === "style" && value && typeof value === "object") {
        Object.assign(element.style, value);
        return;
    }

    if (name === "value" && "value" in element) {
        element.value = value ?? "";
        return;
    }

    if (booleanProperties.has(name)) {
        element[name] = Boolean(value);
    }

    if (value === false || value === null || value === undefined) {
        element.removeAttribute(name);
        return;
    }

    if ((name === "href" || name === "src") && typeof value === "string") {
        const normalized = value.toLowerCase().trim();
        if (normalized.startsWith("javascript:") || normalized.startsWith("data:")) {
            console.warn(`Blocked unsafe attribute ${name}`);
            return;
        }
    }

    element.setAttribute(name, String(value));
}

export function h(tag, props, ...children) {
    const element = document.createElement(tag);

    if (props) {
        Object.entries(props).forEach(([key, value]) => {
            if (key.startsWith("on") && typeof value === "function") {
                const eventName = key.slice(2).toLowerCase();
                if (!element.__nanoEvents) element.__nanoEvents = {};
                element.__nanoEvents[eventName] = value;
                ensureDelegated(eventName);
                return;
            }

            if (typeof value === "function") {
                const dispose = createEffect(() => applyAttribute(element, key, value()), element);
                attachCleanup(element, dispose);
                return;
            }

            applyAttribute(element, key, value);
        });
    }

    children.flat(Infinity).forEach((child) => {
        if (typeof child === "function") {
            const anchor = document.createTextNode("");
            element.appendChild(anchor);
            let currentNodes = [];
            const dispose = createEffect(() => {
                const nextNodes = normalizeChildren(child());
                currentNodes = reconcile(element, anchor, currentNodes, nextNodes);
            }, element);
            attachCleanup(element, dispose);
            return;
        }

        const node = toNode(child);
        if (node) element.appendChild(node);
    });

    return element;
}

const defaultTags = [
    "div", "h1", "h2", "h3", "h4", "p", "span", "strong", "small", "ul", "li",
    "button", "input", "label", "select", "option", "textarea", "table", "thead",
    "tbody", "tr", "td", "th", "form", "img", "nav", "a", "section", "main"
];

export function createTags(tags = defaultTags) {
    return Object.fromEntries(tags.map((tag) => [
        tag,
        (props, ...children) => h(tag, props, ...children)
    ]));
}

export const tags = createTags();

export const onEnter = (fn) => (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fn(event);
    }
};

export function debounce(fn, wait) {
    let timeout;
    return function debounced(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
    };
}
